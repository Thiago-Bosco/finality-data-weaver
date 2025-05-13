
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { inventorySummary, products } from "@/data/mockData";
import { formatCurrency } from "@/lib/formatters";
import { Package, DollarSign, ShoppingCart, AlertTriangle, Ban, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

const salesData = [
  { name: "Jan", sales: 4000, expenses: 2400 },
  { name: "Fev", sales: 3000, expenses: 1398 },
  { name: "Mar", sales: 2000, expenses: 9800 },
  { name: "Abr", sales: 2780, expenses: 3908 },
  { name: "Mai", sales: 1890, expenses: 4800 },
  { name: "Jun", sales: 2390, expenses: 3800 },
  { name: "Jul", sales: 3490, expenses: 4300 },
];

const stockByCategory = [
  { name: "Eletrônicos", value: 27 },
  { name: "Móveis", value: 14 },
  { name: "Escritório", value: 320 },
  { name: "Ferramentas", value: 28 },
  { name: "Roupas", value: 50 },
];

const Dashboard = () => {
  // Get the top 5 low stock items
  const lowStockItems = [...products]
    .sort((a, b) => a.stock - b.stock)
    .filter(product => product.stock > 0)
    .slice(0, 5);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Visão Geral</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Total de Produtos" 
          value={inventorySummary.totalProducts} 
          icon={<Package className="h-4 w-4" />} 
        />
        <StatCard 
          title="Valor do Estoque" 
          value={formatCurrency(inventorySummary.totalValue)} 
          icon={<DollarSign className="h-4 w-4" />} 
        />
        <StatCard 
          title="Estoque Baixo" 
          value={inventorySummary.lowStockItems} 
          icon={<AlertTriangle className="h-4 w-4" />} 
          description="Produtos com menos de 5 unidades"
          className={inventorySummary.lowStockItems > 0 ? "border-yellow-400" : ""}
        />
        <StatCard 
          title="Sem Estoque" 
          value={inventorySummary.outOfStockItems}
          icon={<Ban className="h-4 w-4" />} 
          description="Produtos indisponíveis"
          className={inventorySummary.outOfStockItems > 0 ? "border-red-400" : ""}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Vendas vs. Custos</CardTitle>
            <CardDescription>Análise mensal do ano atual</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={salesData}
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
                <Line type="monotone" dataKey="sales" stroke="#2563eb" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estoque por Categoria</CardTitle>
            <CardDescription>Distribuição de produtos</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stockByCategory}
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
            <CardTitle>Produtos com Estoque Baixo</CardTitle>
            <CardDescription>Reposição necessária</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Nome</th>
                    <th className="py-2 px-4 text-left">SKU</th>
                    <th className="py-2 px-4 text-left">Estoque</th>
                    <th className="py-2 px-4 text-left">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4">{product.name}</td>
                      <td className="py-2 px-4">{product.sku}</td>
                      <td className="py-2 px-4">
                        <span className="inline-flex items-center text-orange-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-2 px-4">{formatCurrency(product.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
