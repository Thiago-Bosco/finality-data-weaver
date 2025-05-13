
import { useState, useEffect } from "react";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { Package, DollarSign, ShoppingCart, AlertTriangle, Ban, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define types for dashboard data
interface DashboardData {
  totalEquipment: number;
  lowStockEquipment: number;
  outOfServiceEquipment: number;
  equipmentValue: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface MonthlyMovementData {
  name: string;
  movements: number;
  maintenances: number;
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalEquipment: 0,
    lowStockEquipment: 0,
    outOfServiceEquipment: 0,
    equipmentValue: 0
  });
  const [equipmentByCategory, setEquipmentByCategory] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyMovementData[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get counts from equipment table
        const { data: equipmentData, error: equipmentError } = await supabase
          .from('equipment')
          .select('*');

        if (equipmentError) throw equipmentError;
        
        // Count equipment by status
        const totalEquipment = equipmentData.length;
        const lowStockEquipment = equipmentData.filter(item => 
          item.status === 'maintenance'
        ).length;
        const outOfServiceEquipment = equipmentData.filter(item => 
          item.status === 'inactive'
        ).length;

        // Calculate total approximate value (we don't have real values in this schema)
        // In a real application, you'd have a field for equipment value
        const equipmentValue = totalEquipment * 5000; // Example placeholder value

        // Set main dashboard metrics
        setDashboardData({
          totalEquipment,
          lowStockEquipment,
          outOfServiceEquipment,
          equipmentValue
        });

        // Get equipment by category for the chart
        if (equipmentData) {
          const categoryCount: Record<string, number> = {};
          
          equipmentData.forEach(item => {
            const category = item.category || "Outros";
            categoryCount[category] = (categoryCount[category] || 0) + 1;
          });
          
          const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
            name: mapCategoryName(name),
            value
          }));
          
          setEquipmentByCategory(categoryData);
        }

        // Get equipment with maintenance status for the table
        const lowStockItems = equipmentData
          .filter(item => item.status === 'maintenance')
          .slice(0, 5)
          .map(item => ({
            id: item.id,
            name: item.name,
            sku: item.serial_number,
            stock: 'Em Manutenção',
            price: 0 // Placeholder since we don't have price data
          }));

        setLowStockItems(lowStockItems);

        // Generate monthly movement data (for demonstration)
        // In a real app, you would query the database for this data
        generateMonthlyMovementData();
      } catch (error: any) {
        toast.error(`Erro ao carregar dados do dashboard: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to map category codes to readable names
  const mapCategoryName = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'server': 'Servidores',
      'network': 'Equipamento de Rede',
      'storage': 'Armazenamento',
      'other': 'Outros'
    };
    return categoryMap[category] || category;
  };

  // Generate monthly data for the chart
  const generateMonthlyMovementData = async () => {
    try {
      // Get movement data from the past 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: movementData, error: movementError } = await supabase
        .from('movement_history')
        .select('moved_at')
        .gte('moved_at', sixMonthsAgo.toISOString());
        
      if (movementError) throw movementError;
      
      // Get maintenance data 
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('equipment_maintenance')
        .select('maintenance_date')
        .gte('maintenance_date', sixMonthsAgo.toISOString());
        
      if (maintenanceError) throw maintenanceError;
      
      // Group by month
      const months: { [key: string]: { movements: number; maintenances: number } } = {};
      
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        months[monthKey] = { movements: 0, maintenances: 0 };
      }
      
      // Count movements by month
      movementData?.forEach(item => {
        const date = new Date(item.moved_at);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        if (months[monthKey]) {
          months[monthKey].movements++;
        }
      });
      
      // Count maintenances by month
      maintenanceData?.forEach(item => {
        const date = new Date(item.maintenance_date);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        if (months[monthKey]) {
          months[monthKey].maintenances++;
        }
      });
      
      // Convert to array for the chart
      const monthlyData = Object.entries(months).map(([name, data]) => ({
        name,
        movements: data.movements,
        maintenances: data.maintenances
      })).reverse();
      
      setMonthlyData(monthlyData);
    } catch (error: any) {
      console.error("Error generating monthly data:", error);
      // Fall back to sample data if there's an error
      const sampleData = [
        { name: "Jan", movements: 4, maintenances: 2 },
        { name: "Fev", movements: 3, maintenances: 1 },
        { name: "Mar", movements: 2, maintenances: 3 },
        { name: "Abr", movements: 2, maintenances: 2 },
        { name: "Mai", movements: 3, maintenances: 1 },
        { name: "Jun", movements: 5, maintenances: 2 },
      ];
      setMonthlyData(sampleData);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Visão Geral</h1>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-inventory-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard 
              title="Total de Equipamentos" 
              value={dashboardData.totalEquipment} 
              icon={<Package className="h-4 w-4" />} 
            />
            <StatCard 
              title="Valor Estimado" 
              value={formatCurrency(dashboardData.equipmentValue)} 
              icon={<DollarSign className="h-4 w-4" />} 
            />
            <StatCard 
              title="Em Manutenção" 
              value={dashboardData.lowStockEquipment} 
              icon={<AlertTriangle className="h-4 w-4" />} 
              description="Equipamentos em manutenção"
              className={dashboardData.lowStockEquipment > 0 ? "border-yellow-400" : ""}
            />
            <StatCard 
              title="Inativos" 
              value={dashboardData.outOfServiceEquipment}
              icon={<Ban className="h-4 w-4" />} 
              description="Equipamentos fora de serviço"
              className={dashboardData.outOfServiceEquipment > 0 ? "border-red-400" : ""}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Movimentações vs. Manutenções</CardTitle>
                <CardDescription>Análise mensal dos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={monthlyData}
                    margin={{
                      top: 5,
                      right: 10,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="movements" name="Movimentações" stroke="#2563eb" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="maintenances" name="Manutenções" stroke="#ef4444" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Equipamentos por Categoria</CardTitle>
                <CardDescription>Distribuição de equipamentos</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={equipmentByCategory}
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
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Quantidade" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Equipamentos em Manutenção</CardTitle>
                <CardDescription>Atenção necessária</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Nome</th>
                        <th className="py-2 px-4 text-left">Número de Série</th>
                        <th className="py-2 px-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-muted-foreground">
                            Nenhum equipamento em manutenção.
                          </td>
                        </tr>
                      ) : (
                        lowStockItems.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-4">{item.name}</td>
                            <td className="py-2 px-4">{item.sku}</td>
                            <td className="py-2 px-4">
                              <span className="inline-flex items-center text-orange-600">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Em Manutenção
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
