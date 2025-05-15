
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CheckCircle2, 
  Clock, 
  PackageOpen, 
  ShoppingCart, 
  Tag, 
  Truck,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import NewOrderDialog from "@/components/orders/NewOrderDialog";

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    completed: {
      label: "Concluído",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-800"
    },
    pending_approval: {
      label: "Aguardando Aprovação",
      icon: Clock,
      className: "bg-blue-100 text-blue-800"
    },
    approved: {
      label: "Aprovado",
      icon: CheckCircle2,
      className: "bg-blue-100 text-blue-800"
    },
    shipping: {
      label: "Enviando",
      icon: Truck,
      className: "bg-orange-100 text-orange-800"
    },
    rejected: {
      label: "Rejeitado",
      icon: XCircle,
      className: "bg-red-100 text-red-800" 
    },
    cancelled: {
      label: "Cancelado",
      icon: XCircle,
      className: "bg-gray-100 text-gray-800"
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  if (!config) return <span className="text-sm">{status}</span>;

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </div>
  );
};

interface Order {
  id: string;
  customer_name: string;
  customer_email: string | null;
  status: string;
  created_at: string;
  total_amount: number | null;
}

interface OrderSummary {
  total: number;
  pending: number;
  itemsSold: number;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<OrderSummary>({ total: 0, pending: 0, itemsSold: 0 });
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setOrders(data || []);
      
      // Calculate summary
      const pending = data?.filter(order => order.status === 'pending_approval').length || 0;
      
      // Get count of items sold
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('quantity')
        .in('order_id', (data || []).map(order => order.id));
        
      if (itemsError) throw itemsError;
      
      const itemsSold = itemsData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      
      setSummary({
        total: data?.length || 0,
        pending,
        itemsSold
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'approved', 
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast.success('Pedido aprovado com sucesso');
      fetchOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('Erro ao aprovar pedido');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast.success('Pedido rejeitado');
      fetchOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Erro ao rejeitar pedido');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <Button 
          className="bg-inventory-primary hover:bg-blue-700"
          onClick={() => setIsNewOrderOpen(true)}
        >
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
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center">
                <Tag className="h-5 w-5 mr-2 text-inventory-primary" />
                <span className="text-2xl font-bold">{summary.total}</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pedidos em Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                <span className="text-2xl font-bold">{summary.pending}</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center">
                <PackageOpen className="h-5 w-5 mr-2 text-green-500" />
                <span className="text-2xl font-bold">{summary.itemsSold}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        Nenhum pedido encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{order.total_amount ? formatCurrency(order.total_amount) : "-"}</TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/orders/${order.id}`}>Detalhes</a>
                            </Button>
                            
                            {isAdmin && order.status === 'pending_approval' && (
                              <>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApproveOrder(order.id)}
                                >
                                  Aprovar
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleRejectOrder(order.id)}
                                >
                                  Rejeitar
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <NewOrderDialog 
        open={isNewOrderOpen} 
        onOpenChange={setIsNewOrderOpen}
        onOrderCreated={fetchOrders}
      />
    </div>
  );
};

export default Orders;
