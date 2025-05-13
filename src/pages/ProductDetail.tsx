
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { products, categories, suppliers } from "@/data/mockData";
import { Product, Category, Supplier } from "@/types/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { AlertTriangle, ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [stockUpdateAmount, setStockUpdateAmount] = useState<number>(0);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
        
        const foundCategory = categories.find(c => c.id === foundProduct.category);
        setCategory(foundCategory || null);
        
        const foundSupplier = suppliers.find(s => s.id === foundProduct.supplier);
        setSupplier(foundSupplier || null);
      } else {
        navigate("/products");
      }
    }
  }, [id, navigate]);

  if (!product || !category || !supplier) {
    return (
      <div className="container py-8 text-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const getStockStatus = () => {
    if (product.stock === 0) return { label: "Sem Estoque", variant: "destructive" as const };
    if (product.stock <= 5) return { label: "Estoque Baixo", variant: "secondary" as const };
    return { label: "Em Estoque", variant: "outline" as const };
  };

  const handleDelete = () => {
    toast({
      title: "Produto removido",
      description: `${product.name} foi removido com sucesso.`,
    });
    navigate("/products");
  };

  const handleStockUpdate = () => {
    if (product) {
      const newStock = product.stock + stockUpdateAmount;
      if (newStock < 0) {
        toast({
          title: "Operação inválida",
          description: "O estoque não pode ficar negativo.",
          variant: "destructive",
        });
        return;
      }
      
      setProduct({ ...product, stock: newStock });
      
      toast({
        title: "Estoque atualizado",
        description: `Novo estoque: ${newStock} unidades.`,
      });
      
      setIsStockDialogOpen(false);
    }
  };

  const { label, variant } = getStockStatus();

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/products")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para produtos
      </Button>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-square w-full relative">
                <img 
                  src={product.imageUrl}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate(`/products/edit/${product.id}`)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar exclusão</DialogTitle>
                  </DialogHeader>
                  <p>Tem certeza que deseja excluir {product.name}? Esta ação não pode ser desfeita.</p>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Preço de Venda</h3>
              <p className="text-2xl font-bold">{formatCurrency(product.price)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Custo</h3>
              <p className="text-2xl font-bold">{formatCurrency(product.cost)}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status do Estoque</h3>
                <div className="flex items-center mt-1">
                  <Badge variant={variant}>{label}</Badge>
                  <span className="ml-2 text-lg font-medium">{product.stock} unidades</span>
                  {product.stock <= 5 && product.stock > 0 && (
                    <AlertTriangle className="h-4 w-4 ml-2 text-yellow-500" />
                  )}
                </div>
              </div>
              
              <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Atualizar Estoque</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Atualizar Estoque</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p>Estoque atual: {product.stock} unidades</p>
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="stockChange">Quantidade a adicionar/remover:</label>
                      <Input 
                        id="stockChange"
                        type="number"
                        value={stockUpdateAmount}
                        onChange={(e) => setStockUpdateAmount(parseInt(e.target.value, 10) || 0)}
                        placeholder="Número positivo para adicionar, negativo para remover"
                      />
                      <p className="text-sm text-muted-foreground">
                        Novo estoque: {product.stock + stockUpdateAmount} unidades
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleStockUpdate}>Atualizar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>
            <p className="mt-1">{product.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Categoria</h3>
              <p className="mt-1">{category.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Fornecedor</h3>
              <p className="mt-1">{supplier.name}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Informações do Fornecedor</h3>
            <div className="mt-1 space-y-1">
              <p>Contato: {supplier.contact}</p>
              <p>Email: {supplier.email}</p>
              <p>Telefone: {supplier.phone}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Última Atualização</h3>
            <p className="mt-1">{formatDate(product.lastUpdated)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
