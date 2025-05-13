
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Package, BarChart3, Settings, Users, ShoppingCart } from "lucide-react";

const Header = () => {
  const [open, setOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/", icon: <BarChart3 className="h-5 w-5 mr-2" /> },
    { name: "Produtos", href: "/products", icon: <Package className="h-5 w-5 mr-2" /> },
    { name: "Fornecedores", href: "/suppliers", icon: <Users className="h-5 w-5 mr-2" /> },
    { name: "Pedidos", href: "/orders", icon: <ShoppingCart className="h-5 w-5 mr-2" /> },
    { name: "Configurações", href: "/settings", icon: <Settings className="h-5 w-5 mr-2" /> }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mr-4">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col space-y-2 p-4">
                <div className="flex items-center mb-8">
                  <Package className="h-6 w-6 text-inventory-primary mr-2" />
                  <span className="text-xl font-bold">InvenType</span>
                </div>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex items-center">
          <Package className="h-6 w-6 text-inventory-primary mr-2" />
          <Link to="/" className="font-bold text-xl">
            InvenType
          </Link>
        </div>
        <nav className="hidden md:flex ml-10 space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
