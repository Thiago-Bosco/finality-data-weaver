
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { categories, suppliers, products } from "@/data/mockData";
import { Product } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  sku: "",
  category: "",
  price: 0,
  cost: 0,
  stock: 0,
  description: "",
  supplier: "",
  lastUpdated: new Date().toISOString(),
  imageUrl: "https://source.unsplash.com/featured/?product"
};

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const isEditMode = !!id;
  const [formData, setFormData] = useState<Omit<Product, "id">>(emptyProduct);

  useEffect(() => {
    if (isEditMode) {
      const product = products.find(p => p.id === id);
      if (product) {
        setFormData(product);
      } else {
        navigate("/products");
      }
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "price" || name === "cost" || name === "stock"
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.sku || !formData.category || !formData.supplier) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.price < 0 || formData.cost < 0 || formData.stock < 0) {
      toast({
        title: "Valores inválidos",
        description: "Preço, custo e estoque não podem ser negativos.",
        variant: "destructive",
      });
      return;
    }

    // Update timestamp
    formData.lastUpdated = new Date().toISOString();
    
    toast({
      title: `Produto ${isEditMode ? 'atualizado' : 'adicionado'}`,
      description: `${formData.name} foi ${isEditMode ? 'atualizado' : 'adicionado'} com sucesso.`,
    });

    navigate("/products");
  };

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

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Editar Produto" : "Novo Produto"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input 
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nome do produto"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input 
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="Código de referência"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor *</Label>
                <Select 
                  value={formData.supplier}
                  onValueChange={(value) => handleSelectChange("supplier", value)}
                  required
                >
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço de Venda (R$) *</Label>
                <Input 
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Custo (R$) *</Label>
                <Input 
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Estoque Inicial *</Label>
                <Input 
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input 
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descrição detalhada do produto..."
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate("/products")}>
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Salvar alterações" : "Adicionar produto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;
