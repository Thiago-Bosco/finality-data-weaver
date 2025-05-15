
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/formatters";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
    sku: string;
  };
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  total_amount: number | null;
  approver?: {
    full_name: string | null;
    email: string;
  } | null;
  items?: OrderItem[];
}

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          approver:approved_by(
            email:email,
            full_name
          )
        `)
        .eq('id', id)
        .single();
      
      if (orderError) throw orderError;
      
      // Fetch the order items - this is where the fix is applied
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);
      
      if (itemsError) throw itemsError;
      
      // Separately fetch product information for each order item
      const orderItems: OrderItem[] = await Promise.all(
        itemsData.map(async (item) => {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('name, sku')
            .eq('id', item.product_id)
            .single();
          
          return {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            product: productError ? { name: "Produto não encontrado", sku: "-" } : productData
          };
        })
      );
      
      // Handle potential error with approver data
      const approverData = orderData.approver && !('error' in orderData.approver) 
        ? orderData.approver 
        : null;
      
      setOrder({
        ...orderData,
        approver: approverData,
        items: orderItems
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Erro ao carregar detalhes do pedido');
      navigate('/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveOrder = async () => {
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'approved', 
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Pedido aprovado com sucesso');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('Erro ao aprovar pedido');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Pedido rejeitado');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Erro ao rejeitar pedido');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return { label: 'Aguardando Aprovação', color: 'text-blue-600' };
      case 'approved':
        return { label: 'Aprovado', color: 'text-green-600' };
      case 'completed':
        return { label: 'Concluído', color: 'text-green-600' };
      case 'shipping':
        return { label: 'Enviando', color: 'text-orange-600' };
      case 'rejected':
        return { label: 'Rejeitado', color: 'text-red-600' };
      case 'cancelled':
        return { label: 'Cancelado', color: 'text-gray-600' };
      default:
        return { label: status, color: 'text-gray-600' };
    }
  };

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/orders')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Pedidos
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-[200px] w-full mt-4" />
          <Skeleton className="h-[300px] w-full mt-4" />
        </div>
      ) : !order ? (
        <div className="text-center py-10">
          <p className="text-xl">Pedido não encontrado</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
              <p className="text-muted-foreground">
                Criado em {new Date(order.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {isAdmin && order.status === 'pending_approval' && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive"
                        disabled={isActionLoading}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeitar Pedido
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Rejeitar Pedido</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja rejeitar este pedido? Os itens reservados serão liberados de volta para o estoque.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRejectOrder}>Rejeitar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isActionLoading}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aprovar Pedido
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Aprovar Pedido</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja aprovar este pedido? Os itens reservados serão confirmados e removidos do estoque.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApproveOrder}>Aprovar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.customer_name}</p>
                {order.customer_email && (
                  <p className="text-muted-foreground">{order.customer_email}</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Status do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`font-medium ${getStatusDetails(order.status).color}`}>
                  {getStatusDetails(order.status).label}
                </p>
                {order.approved_at && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Aprovado em {new Date(order.approved_at).toLocaleString('pt-BR')}
                  </p>
                )}
                {order.approver?.full_name && (
                  <p className="text-sm text-muted-foreground">
                    por {order.approver.full_name || order.approver.email}
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total de itens:</span>
                    <span>{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Valor Total:</span>
                    <span>{formatCurrency(order.total_amount || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Preço Unit.</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name || "Produto não encontrado"}</TableCell>
                        <TableCell>{item.product?.sku || "-"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price * item.quantity)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">Nenhum item encontrado</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              <Separator className="my-6" />
              
              <div className="flex justify-end">
                <div className="w-1/3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(order.total_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(order.total_amount || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default OrderDetail;
