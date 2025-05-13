
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Product } from "@/types/inventory";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const getStockStatus = () => {
    if (product.stock === 0) return { label: "Sem Estoque", variant: "destructive" as const };
    if (product.stock <= 5) return { label: "Estoque Baixo", variant: "secondary" as const };
    return { label: `${product.stock} em estoque`, variant: "outline" as const };
  };

  const { label, variant } = getStockStatus();

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="aspect-square w-full relative">
        <img 
          src={product.imageUrl}
          alt={product.name}
          className="object-cover w-full h-full"
        />
      </div>
      <CardContent className="pt-4 flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg">{product.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2">SKU: {product.sku}</p>
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">{formatCurrency(product.price)}</span>
            <Badge variant={variant}>{label}</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link 
          to={`/products/${product.id}`} 
          className="w-full bg-inventory-primary hover:bg-blue-700 text-white py-2 px-4 rounded text-center block transition-colors"
        >
          Ver Detalhes
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
