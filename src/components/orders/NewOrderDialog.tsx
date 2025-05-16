
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { MinusCircle, PlusCircle, X, Package, Archive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  description: string | null;
  quantity_available: number;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const NewOrderDialog = ({ open, onOpenChange, onOrderCreated }: NewOrderDialogProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchProducts();
      setCart([]);
      setSelectedCategory("all");
      setCustomerName("");
      setCustomerEmail("");
      setSearchQuery("");
    }
  }, [open]);
  
  useEffect(() => {
    // Apply both category filtering and search filtering
    let filtered = products.filter(p => p.quantity_available > 0);
    
    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Apply search filter if there's a search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  }, [selectedCategory, products, searchQuery]);
  
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('quantity_available', 0);
      
      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Check if adding one more would exceed available quantity
        if (existingItem.quantity + 1 > product.quantity_available) {
          toast({
            title: "Estoque insuficiente",
            description: `Disponível: ${product.quantity_available} unidades`,
            variant: "destructive"
          });
          return prevCart;
        }
        
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };
  
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };
  
  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Ensure quantity is within available range
    if (newQuantity > product.quantity_available) {
      toast({
        title: "Estoque insuficiente",
        description: `Disponível: ${product.quantity_available} unidades`,
        variant: "destructive"
      });
      return;
    }
    
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };
  
  const handleSubmitOrder = async () => {
    if (!customerName) {
      toast({
        title: "Atenção",
        description: "Nome do cliente é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    if (cart.length === 0) {
      toast({
        title: "Atenção",
        description: "Adicione pelo menos um item ao pedido",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Step 1: Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          { 
            customer_name: customerName,
            customer_email: customerEmail || null,
            status: 'pending_approval',
            total_amount: calculateTotal()
          }
        ])
        .select();
      
      if (orderError) throw orderError;
      
      const orderId = orderData[0].id;
      
      // Step 2: Insert order items
      const orderItems = cart.map(item => ({
        order_id: orderId,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      toast({
        title: "Sucesso",
        description: "Pedido criado com sucesso! Aguardando aprovação.",
      });
      onOpenChange(false);
      onOrderCreated();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  // Calculate remaining stock for a product considering what's in cart
  const getRemainingStock = (product: Product) => {
    const cartItem = cart.find(item => item.product.id === product.id);
    if (!cartItem) return product.quantity_available;
    return product.quantity_available - cartItem.quantity;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Nome do Cliente *</Label>
              <Input 
                id="customerName" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input 
                id="customerEmail" 
                value={customerEmail} 
                onChange={(e) => setCustomerEmail(e.target.value)} 
                placeholder="Email do cliente"
              />
            </div>
          </div>
          
          <div className="border rounded-md">
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="products">Produtos Disponíveis</TabsTrigger>
                <TabsTrigger value="cart">
                  Carrinho 
                  <Badge variant="secondary" className="ml-2">{cart.length}</Badge>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="products" className="p-4">
                <div className="space-y-4">
                  {/* Search input */}
                  <div>
                    <Label htmlFor="search">Buscar Produtos</Label>
                    <Input 
                      id="search"
                      placeholder="Digite para buscar por nome, SKU ou descrição"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Category filter */}
                  <div>
                    <Label htmlFor="category">Filtrar por Categoria</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {[1, 2, 3, 4].map(i => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-2" />
                          <Skeleton className="h-4 w-1/4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <>
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 
                          "Nenhum produto encontrado com os critérios de busca." :
                          selectedCategory !== "all" ? 
                            "Nenhum produto disponível nesta categoria." :
                            "Nenhum produto disponível em estoque."
                        }
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {filteredProducts.map(product => {
                          const remainingStock = getRemainingStock(product);
                          
                          return (
                            <Card key={product.id} className={`overflow-hidden ${remainingStock === 0 ? 'opacity-60' : ''}`}>
                              <CardContent className="p-0">
                                <div className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                    <div className="font-medium">{product.name}</div>
                                  </div>
                                  
                                  <div className="text-sm text-muted-foreground mt-1">{product.sku}</div>
                                  
                                  {product.description && (
                                    <div className="text-sm mt-1">{product.description}</div>
                                  )}
                                  
                                  <div className="mt-2 flex justify-between items-center">
                                    <div className="font-semibold">
                                      {formatCurrency(product.price)}
                                    </div>
                                    <div className="flex items-center">
                                      <Archive className="h-4 w-4 mr-1 text-muted-foreground" />
                                      <span className={`text-sm font-medium ${remainingStock < 5 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                        Disponível: {remainingStock}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="border-t p-2">
                                  <Button 
                                    variant={remainingStock > 0 ? "ghost" : "outline"} 
                                    className={`w-full ${remainingStock > 0 ? 'hover:bg-primary hover:text-primary-foreground' : ''}`}
                                    onClick={() => addToCart(product)}
                                    disabled={remainingStock === 0}
                                  >
                                    {remainingStock > 0 ? 'Adicionar ao Pedido' : 'Sem estoque disponível'}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              <TabsContent value="cart" className="p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    O carrinho está vazio. Adicione produtos para criar um pedido.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.product.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <div className="font-medium">{item.product.name}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">{item.product.sku}</div>
                            <div className="mt-1 font-semibold">
                              {formatCurrency(item.product.price)} por unidade
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 -mt-1"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <X size={18} />
                          </Button>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <MinusCircle size={16} />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <PlusCircle size={16} />
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(item.product.price * item.quantity)}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Archive className="h-3 w-3 mr-1" />
                              <span>Disponível: {item.product.quantity_available}</span>
                              <span className="mx-1">|</span>
                              <span>Selecionado: {item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total do Pedido:</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            disabled={isSubmitting || cart.length === 0 || !customerName}
            onClick={handleSubmitOrder}
          >
            {isSubmitting ? "Criando Pedido..." : "Criar Pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewOrderDialog;
