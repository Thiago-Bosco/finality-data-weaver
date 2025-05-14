
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from "recharts";
import { Cpu, Boxes, AlertTriangle, DollarSign, Map, Wrench, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { addMonths, isBefore } from 'date-fns';

interface DashboardStats {
  totalEquipment: number;
  activeEquipment: number;
  inMaintenanceEquipment: number;
  inactiveEquipment: number;
  totalLocations: number;
  totalMaintenances: number;
  upcomingMaintenances: number;
  totalValue: number;
  maintenanceCost: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface MaintenanceData {
  name: string;
  value: number;
}

interface LocationData {
  name: string;
  equipmentCount: number;
}

interface MonthlyMaintenanceData {
  month: string;
  count: number;
  cost: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEquipment: 0,
    activeEquipment: 0,
    inMaintenanceEquipment: 0,
    inactiveEquipment: 0,
    totalLocations: 0,
    totalMaintenances: 0,
    upcomingMaintenances: 0,
    totalValue: 0,
    maintenanceCost: 0
  });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [statusData, setStatusData] = useState<CategoryData[]>([]);
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [maintenanceTypeData, setMaintenanceTypeData] = useState<MaintenanceData[]>([]);
  const [monthlyMaintenanceData, setMonthlyMaintenanceData] = useState<MonthlyMaintenanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch general statistics
        const { data: equipmentData, error: equipmentError } = await supabase
          .from("equipment")
          .select("*");
          
        if (equipmentError) {
          throw equipmentError;
        }
        
        // Contar status
        const activeCount = equipmentData?.filter(eq => eq.status === 'active').length || 0;
        const maintenanceCount = equipmentData?.filter(eq => eq.status === 'maintenance').length || 0;
        const inactiveCount = equipmentData?.filter(eq => eq.status === 'inactive').length || 0;
        
        // Calcular valor total dos equipamentos
        const totalValue = equipmentData?.reduce((sum, eq) => sum + (eq.current_value || 0), 0) || 0;
        
        // Agrupar por categoria
        const categories: { [key: string]: number } = {};
        equipmentData?.forEach(item => {
          const category = item.category;
          categories[category] = (categories[category] || 0) + 1;
        });
        
        const categoryDataArray = Object.entries(categories).map(([name, value]) => {
          let displayName = name;
          if (name === "server") displayName = "Servidor";
          if (name === "network") displayName = "Rede";
          if (name === "storage") displayName = "Armazenamento";
          if (name === "other") displayName = "Outro";
          return { name: displayName, value };
        });
        
        // Dados de status para o gráfico de pizza
        const statusDataArray = [
          { name: 'Ativos', value: activeCount },
          { name: 'Em Manutenção', value: maintenanceCount },
          { name: 'Inativos', value: inactiveCount }
        ];
        
        // Buscar localizações
        const { data: locationsData, error: locationsError } = await supabase
          .from("locations")
          .select("id, name");
          
        if (locationsError) {
          throw locationsError;
        }
        
        // Dados de equipamentos por localização
        const locationStats: LocationData[] = [];
        
        if (locationsData) {
          for (const location of locationsData) {
            const { count, error } = await supabase
              .from("equipment")
              .select("*", { count: 'exact', head: true })
              .eq("location_id", location.id);
              
            if (error) {
              console.error("Error counting equipment for location:", error);
              continue;
            }
            
            locationStats.push({
              name: location.name,
              equipmentCount: count || 0
            });
          }
        }
        
        // Buscar dados de manutenção
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from("equipment_maintenance")
          .select("*");
          
        if (maintenanceError) {
          throw maintenanceError;
        }
        
        // Agrupar manutenções por tipo
        const maintenanceTypes: { [key: string]: number } = {};
        maintenanceData?.forEach(item => {
          const type = item.maintenance_type;
          maintenanceTypes[type] = (maintenanceTypes[type] || 0) + 1;
        });
        
        const maintenanceTypeDataArray = Object.entries(maintenanceTypes).map(([name, value]) => {
          let displayName = name;
          if (name === "preventive") displayName = "Preventiva";
          if (name === "corrective") displayName = "Corretiva";
          if (name === "predictive") displayName = "Preditiva";
          if (name === "other") displayName = "Outro";
          return { name: displayName, value };
        });
        
        // Calcular custo total de manutenções
        const maintenanceCost = maintenanceData?.reduce((sum, maintenance) => 
          sum + (maintenance.maintenance_cost || 0), 0) || 0;
        
        // Verificar manutenções próximas (nos próximos 30 dias)
        const now = new Date();
        const nextMonth = addMonths(now, 1);
        const upcomingCount = maintenanceData?.filter(maintenance => {
          if (!maintenance.next_maintenance_date) return false;
          const nextDate = new Date(maintenance.next_maintenance_date);
          return isBefore(nextDate, nextMonth) && isBefore(now, nextDate);
        }).length || 0;
        
        // Dados de manutenções por mês (últimos 6 meses)
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const monthlyData: { [key: string]: { count: number, cost: number } } = {};
        
        // Inicializar os últimos 6 meses
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthKey = `${monthNames[d.getMonth()]}/${d.getFullYear().toString().substring(2)}`;
          monthlyData[monthKey] = { count: 0, cost: 0 };
        }
        
        // Preencher dados
        maintenanceData?.forEach(maintenance => {
          const date = new Date(maintenance.maintenance_date);
          const monthKey = `${monthNames[date.getMonth()]}/${date.getFullYear().toString().substring(2)}`;
          
          // Verificar se o mês está nos últimos 6 meses
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].count += 1;
            monthlyData[monthKey].cost += (maintenance.maintenance_cost || 0);
          }
        });
        
        const monthlyMaintenanceDataArray = Object.entries(monthlyData).map(([month, data]) => ({
          month,
          count: data.count,
          cost: data.cost
        }));
        
        setStats({
          totalEquipment: equipmentData?.length || 0,
          activeEquipment: activeCount,
          inMaintenanceEquipment: maintenanceCount,
          inactiveEquipment: inactiveCount,
          totalLocations: locationsData?.length || 0,
          totalMaintenances: maintenanceData?.length || 0,
          upcomingMaintenances: upcomingCount,
          totalValue: totalValue,
          maintenanceCost: maintenanceCost
        });
        
        setCategoryData(categoryDataArray);
        setStatusData(statusDataArray);
        setLocationData(locationStats);
        setMaintenanceTypeData(maintenanceTypeDataArray);
        setMonthlyMaintenanceData(monthlyMaintenanceDataArray);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="label">{`${label} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const MaintenanceCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="label">{`${label}`}</p>
          <p className="text-sm">{`Manutenções: ${payload[0].value}`}</p>
          <p className="text-sm">{`Custo: ${formatCurrency(payload[1].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-inventory-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total de Equipamentos"
              value={stats.totalEquipment}
              icon={<Cpu className="h-5 w-5" />}
              description={`${stats.activeEquipment} ativos, ${stats.inMaintenanceEquipment} em manutenção`}
            />
            <StatCard
              title="Localizações"
              value={stats.totalLocations}
              icon={<Map className="h-5 w-5" />}
              description="Distribuição de equipamentos"
            />
            <StatCard
              title="Valor do Inventário"
              value={formatCurrency(stats.totalValue)}
              icon={<DollarSign className="h-5 w-5" />}
              description="Valor atual dos equipamentos"
            />
            <StatCard
              title="Manutenções Próximas"
              value={stats.upcomingMaintenances}
              icon={<Calendar className="h-5 w-5" />}
              description="Nos próximos 30 dias"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Equipamentos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status dos Equipamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell key="cell-0" fill="#10b981" />
                        <Cell key="cell-1" fill="#f59e0b" />
                        <Cell key="cell-2" fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Equipamentos por Localização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      width={500}
                      height={300}
                      data={locationData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="equipmentCount" name="Equipamentos" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipos de Manutenção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={maintenanceTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {maintenanceTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Manutenções e Custos Mensais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      width={500}
                      height={300}
                      data={monthlyMaintenanceData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip content={<MaintenanceCustomTooltip />} />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="count"
                        name="Manutenções"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line yAxisId="right" type="monotone" dataKey="cost" name="Custo (R$)" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
