
import { suppliers } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, PlusCircle, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

const Suppliers = () => {
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fornecedores</h1>
        <Link to="/suppliers/new">
          <Button className="bg-inventory-primary hover:bg-blue-700">
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center">
                <UserRound className="h-5 w-5 mr-2 text-inventory-primary" />
                {supplier.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="font-medium text-md">{supplier.contact}</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{supplier.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{supplier.phone}</span>
                </div>
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
    </div>
  );
};

export default Suppliers;
