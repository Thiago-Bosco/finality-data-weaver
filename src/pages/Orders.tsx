
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { CheckCircle2, Clock, PackageOpen, ShoppingCart, Tag, Truck } from "lucide-react";

// Mock data for orders
const orders = [
  {
    id: "ORD-001",
    customer: "João Silva",
    date: "10/04/2023",
    total: 4999.99,
    status: "completed",
    items: 3
  },
  {
    id: "ORD-002",
    customer: "Maria Oliveira",
    date: "12/04/2023",
    total: 799.90,
    status: "processing",
    items: 1
  },
  {
    id: "ORD-003",
    customer: "Pedro Santos",
    date: "13/04/2023",
    total: 1289.80,
    status: "shipping",
    items: 5
  },
  {
    id: "ORD-004",
    customer: "Ana Souza",
    date: "15/04/2023",
    total: 399.90,
    status: "processing",
    items: 2
  }
];

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    completed: {
      label: "Concluído",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-800"
    },
    processing: {
      label: "Processando",
      icon: Clock,
      className: "bg-blue-100 text-blue-800"
    },
    shipping: {
      label: "Enviando",
      icon: Truck,
      className: "bg-orange-100 text-orange-800"
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </div>
  );
};

const Orders = () => {
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <Button className="bg-inventory-primary hover:bg-blue-700">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Tag className="h-5 w-5 mr-2 text-inventory-primary" />
              <span className="text-2xl font-bold">{orders.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pedidos em Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              <span className="text-2xl font-bold">{orders.filter(order => order.status === "processing").length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <PackageOpen className="h-5 w-5 mr-2 text-green-500" />
              <span className="text-2xl font-bold">{orders.reduce((sum, order) => sum + order.items, 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left text-sm font-medium">Pedido</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Cliente</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Data</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Valor</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">{order.id}</td>
                    <td className="py-3 px-4 text-sm">{order.customer}</td>
                    <td className="py-3 px-4 text-sm">{order.date}</td>
                    <td className="py-3 px-4 text-sm font-medium">{formatCurrency(order.total)}</td>
                    <td className="py-3 px-4 text-sm">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Button variant="ghost" size="sm" className="text-inventory-primary">
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
