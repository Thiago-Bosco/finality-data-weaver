
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, PlusCircle, UserRound, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Supplier } from "@/types/inventory";

const Suppliers = () => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      setSuppliers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha ao carregar fornecedores: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", deleteId);

      if (error) {
        throw error;
      }

      setSuppliers(suppliers.filter(supplier => supplier.id !== deleteId));
      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha ao excluir fornecedor: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-inventory-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fornecedores</h1>
        {isAdmin && (
          <Link to="/suppliers/new">
            <Button className="bg-inventory-primary hover:bg-blue-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </Link>
        )}
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-center">Nenhum fornecedor encontrado</p>
            {isAdmin && (
              <p className="text-muted-foreground text-center mt-2">
                Clique em "Novo Fornecedor" para adicionar o primeiro fornecedor
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <UserRound className="h-5 w-5 mr-2 text-inventory-primary" />
                  {supplier.name}
                </CardTitle>
                {isAdmin && (
                  <div className="flex space-x-2">
                    <Link to={`/suppliers/edit/${supplier.id}`}>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setDeleteId(supplier.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <p className="font-medium text-md">{supplier.contact}</p>
                <div className="mt-4 space-y-2">
                  {supplier.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{supplier.phone}</span>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <Link to={`/suppliers/${supplier.id}`} className="text-sm font-medium text-inventory-primary hover:underline">
                    Ver detalhes
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Fornecedor</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O fornecedor será permanentemente excluído do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Suppliers;
