
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
import { MinusCircle, PlusCircle, X, Package, Archive, Layers, Search, Server } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  type?: string; // Added type field to distinguish between regular products and equipment
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
    let filtered = products;
    
    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Apply search filter if there's a search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.sku?.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  }, [selectedCategory, products, searchQuery]);
  
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // Fetch product categories
      const { data: productCategories, error: productCategoriesError } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');
      
      if (productCategoriesError) throw productCategoriesError;
      
      // Fetch unique equipment categories 
      const { data: equipmentCategories, error: equipmentCategoriesError } = await supabase
        .from('equipment')
        .select('category')
        .eq('status', 'active')
        .order('category');
      
      if (equipmentCategoriesError) throw equipmentCategoriesError;
      
      // Extract unique equipment categories
      const uniqueEquipmentCategories = Array.from(
        new Set(equipmentCategories.map(item => item.category))
      ).map(category => ({
        id: `equipment_${category}`,
        name: category === 'server' ? 'Servidores' : 
              category === 'network' ? 'Equipamento de Rede' : 
              category === 'storage' ? 'Armazenamento' : 
              'Outros Equipamentos'
      }));
      
      // Combine both category types
      setCategories([
        ...productCategories || [], 
        ...uniqueEquipmentCategories
      ]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
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
      // 1. Fetch regular products
      const { data: regularProducts, error: regularProductsError } = await supabase
        .from('products')
        .select('*')
        .gt('quantity_available', 0);
      
      if (regularProductsError) throw regularProductsError;
      
      // 2. Fetch equipment items that are active
      const { data: equipmentItems, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .eq('status', 'active');
      
      if (equipmentError) throw equipmentError;
      
      // Transform equipment items to match product structure
      const transformedEquipment = equipmentItems?.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.serial_number,
        category: `equipment_${item.category}`,
        price: item.current_value || 0,
        description: `Modelo: ${item.model}`,
        quantity_available: 1, // Equipment is unique, so only 1 available
        type: 'equipment'
      })) || [];
      
      // Combine both products and equipment
      setProducts([
        ...(regularProducts || []).map(p => ({ ...p, type: 'product' })),
        ...transformedEquipment
      ]);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
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
        // For equipment items, they are unique and can only be added once
        if (product.type === 'equipment') {
          toast({
            description: "Este equipamento já está no carrinho",
            variant: "destructive"
          });
          return prevCart;
        }
        
        // For regular products, check quantity
        if (existingItem.quantity + 1 > product.quantity_available) {
          toast({
            description: `Estoque insuficiente. Disponível: ${product.quantity_available} unidades`,
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
    
    // For equipment items, quantity can only be 1
    if (product.type === 'equipment' && newQuantity > 1) {
      toast({
        description: "Equipamentos únicos só podem ser solicitados em quantidade 1",
        variant: "destructive"
      });
      return;
    }
    
    // For regular products, ensure quantity is within available range
    if (product.type !== 'equipment' && newQuantity > product.quantity_available) {
      toast({
        description: `Estoque insuficiente. Disponível: ${product.quantity_available} unidades`,
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
        description: "Nome do analista é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    if (cart.length === 0) {
      toast({
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
        unit_price: item.product.price,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      toast({
        description: "Pedido criado com sucesso! Aguardando aprovação.",
      });
      onOpenChange(false);
      onOrderCreated();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
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
    if (product.type === 'equipment') return 1; // Equipment items are unique
    
    const cartItem = cart.find(item => item.product.id === product.id);
    if (!cartItem) return product.quantity_available;
    return product.quantity_available - cartItem.quantity;
  };

  // Group products by their category for organized display
  const groupedProducts = () => {
    const groups: { [key: string]: Product[] } = {};
    
    filteredProducts.forEach(product => {
      // Get appropriate category name
      let categoryName = "Outros";
      
      if (product.type === 'equipment') {
        // For equipment items
        const equipmentCategory = product.category.replace('equipment_', '');
        categoryName = 
          equipmentCategory === 'server' ? 'Servidores' : 
          equipmentCategory === 'network' ? 'Equipamento de Rede' : 
          equipmentCategory === 'storage' ? 'Armazenamento' : 
          'Outros Equipamentos';
      } else {
        // For regular products
        categoryName = categories.find(cat => cat.id === product.category)?.name || "Outros";
      }
      
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(product);
    });
    
    return groups;
  };

  // Get appropriate icon for product based on type and category
  const getProductIcon = (product: Product) => {
    if (product.type === 'equipment') {
      const category = product.category.replace('equipment_', '');
      if (category === 'server') return <Server className="h-4 w-4 mr-2 text-blue-600" />;
      return <Package className="h-4 w-4 mr-2 text-blue-600" />;
    }
    return <Package className="h-4 w-4 mr-2 text-muted-foreground" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Solicitar Hardware</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName" className="text-sm font-medium">Nome do Analista *</Label>
              <Input 
                id="customerName" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
                placeholder="Nome do analista"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="customerEmail" className="text-sm font-medium">Email</Label>
              <Input 
                id="customerEmail" 
                value={customerEmail} 
                onChange={(e) => setCustomerEmail(e.target.value)} 
                placeholder="Email do analista"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="border rounded-md shadow-sm">
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="w-full grid grid-cols-2 p-0 rounded-t-md">
                <TabsTrigger value="products" className="rounded-none rounded-tl-md py-3 font-medium">
                  <Package className="h-4 w-4 mr-2" />
                  Catálogo de Hardware
                </TabsTrigger>
                <TabsTrigger value="cart" className="rounded-none rounded-tr-md py-3 font-medium">
                  <div className="flex items-center">
                    <Archive className="h-4 w-4 mr-2" />
                    Itens Selecionados
                    {cart.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                        {cart.length}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="products" className="p-4">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Buscar por nome, SKU ou descrição..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="w-full md:w-1/3">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <div className="flex items-center">
                          <Layers className="h-4 w-4 mr-2 text-gray-500" />
                          <SelectValue placeholder="Todas as categorias" />
                        </div>
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
                
                {/* Product listing */}
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {[1, 2, 3, 4].map(i => (
                      <Card key={i} className="border shadow-sm">
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
                      <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-md">
                        {searchQuery ? 
                          "Nenhum hardware encontrado com os critérios de busca." :
                          selectedCategory !== "all" ? 
                            "Nenhum hardware disponível nesta categoria." :
                            "Nenhum hardware disponível em estoque."
                        }
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(groupedProducts()).map(([categoryName, categoryProducts]) => (
                          <div key={categoryName}>
                            <h3 className="font-medium text-sm text-gray-500 mb-2 flex items-center">
                              <Layers className="h-4 w-4 mr-1" />
                              {categoryName}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {categoryProducts.length} {categoryProducts.length === 1 ? 'item' : 'itens'}
                              </Badge>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {categoryProducts.map(product => {
                                const remainingStock = getRemainingStock(product);
                                const inCart = cart.some(item => item.product.id === product.id);
                                const isEquipment = product.type === 'equipment';
                                
                                return (
                                  <Card 
                                    key={product.id}
                                    className={`overflow-hidden border transition-all ${
                                      remainingStock === 0 
                                        ? 'opacity-60' 
                                        : inCart 
                                          ? 'border-blue-300 shadow-md' 
                                          : 'hover:border-gray-400'
                                    }`}
                                  >
                                    <CardContent className="p-0">
                                      <div className="p-4">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <div className="flex items-center">
                                              {getProductIcon(product)}
                                              <span className="font-medium">{product.name}</span>
                                              {isEquipment && (
                                                <Badge className="ml-2 bg-purple-100 text-purple-800 text-xs">
                                                  Equipamento
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                              <Badge variant="outline" className="mr-2 text-xs">
                                                {isEquipment ? 'SN: ' : ''}{product.sku}
                                              </Badge>
                                            </div>
                                          </div>
                                          
                                          {inCart && (
                                            <Badge className="bg-blue-100 text-blue-800 text-xs">No carrinho</Badge>
                                          )}
                                        </div>
                                        
                                        {product.description && (
                                          <div className="text-sm mt-2 text-gray-600 line-clamp-2">{product.description}</div>
                                        )}
                                        
                                        <div className="mt-3 flex justify-between items-center">
                                          <div className="font-semibold text-blue-700">
                                            {formatCurrency(product.price)}
                                          </div>
                                          <div className="flex items-center">
                                            <Archive className="h-4 w-4 mr-1 text-muted-foreground" />
                                            <span className={`text-sm font-medium ${
                                              isEquipment ? 'text-purple-600' :
                                              remainingStock < 5 ? 'text-orange-600' : 'text-gray-600'
                                            }`}>
                                              {isEquipment ? 'Único' : `Disponível: ${remainingStock}`}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="border-t p-2 bg-gray-50 flex items-center justify-between">
                                        <Button 
                                          variant={remainingStock > 0 ? "default" : "outline"} 
                                          size="sm"
                                          className={`${remainingStock > 0 ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                          onClick={() => addToCart(product)}
                                          disabled={remainingStock === 0}
                                        >
                                          {inCart ? 'Adicionar mais um' : 'Adicionar ao pedido'}
                                        </Button>
                                        
                                        {inCart && (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="sm">Opções</Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                              <DropdownMenuItem onClick={() => removeFromCart(product.id)}>
                                                <X className="h-4 w-4 mr-2 text-red-500" />
                                                Remover do pedido
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              
              {/* Cart content */}
              <TabsContent value="cart" className="p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-md">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium mb-2">Seu carrinho está vazio</h3>
                    <p className="text-muted-foreground">
                      Adicione hardware para criar uma solicitação
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-md mb-4">
                      <h3 className="font-medium mb-1 flex items-center">
                        <Archive className="h-4 w-4 mr-2 text-blue-600" />
                        Resumo da solicitação
                      </h3>
                      <p className="text-sm text-gray-600">
                        Você selecionou {cart.length} {cart.length === 1 ? 'item' : 'itens'} para solicitação.
                      </p>
                    </div>
                    
                    {cart.map(item => {
                      const isEquipment = item.product.type === 'equipment';
                      return (
                        <Card key={item.product.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center">
                                    {getProductIcon(item.product)}
                                    <div className="font-medium">{item.product.name}</div>
                                    {isEquipment && (
                                      <Badge className="ml-2 bg-purple-100 text-purple-800 text-xs">
                                        Equipamento
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                    <Badge variant="outline" className="text-xs">
                                      {isEquipment ? 'SN: ' : ''}{item.product.sku}
                                    </Badge>
                                  </div>
                                  <div className="mt-1 font-medium text-blue-700">
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
                              
                              <div className="mt-4 flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                <div className="flex items-center space-x-2">
                                  {!isEquipment && (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 w-8 p-0 rounded-full"
                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                      >
                                        <MinusCircle size={14} />
                                      </Button>
                                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 w-8 p-0 rounded-full"
                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                      >
                                        <PlusCircle size={14} />
                                      </Button>
                                    </>
                                  )}
                                  {isEquipment && (
                                    <span className="text-sm font-medium">Quantidade: 1 (item único)</span>
                                  )}
                                </div>
                                
                                <div className="text-right">
                                  <div className="font-semibold">
                                    {formatCurrency(item.product.price * item.quantity)}
                                  </div>
                                  {!isEquipment && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <span>Disponível: {item.product.quantity_available}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    <div className="border-t pt-4 mt-6">
                      <div className="flex justify-between items-center text-lg font-semibold bg-gray-50 p-3 rounded-md">
                        <span>Total da Solicitação:</span>
                        <span className="text-blue-700">{formatCurrency(calculateTotal())}</span>
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
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Enviando solicitação..." : "Enviar solicitação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewOrderDialog;
