
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  Package, 
  BarChart3, 
  Settings, 
  Users, 
  ArrowLeftRight,
  ShoppingCart, 
  Server,
  Map,
  Wrench 
} from "lucide-react";
import { UserMenu } from "./UserMenu";

const Header = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", href: "/", icon: <BarChart3 className="h-5 w-5 mr-2" /> },
    { name: "Equipamentos", href: "/equipments", icon: <Server className="h-5 w-5 mr-2" /> },
    { name: "Localizações", href: "/locations", icon: <Map className="h-5 w-5 mr-2" /> },
    { name: "Fornecedores", href: "/suppliers", icon: <Users className="h-5 w-5 mr-2" /> },
    { name: "Movimentações", href: "/movements", icon: <ArrowLeftRight className="h-5 w-5 mr-2" /> },
    { name: "Manutenções", href: "/maintenance", icon: <Wrench className="h-5 w-5 mr-2" /> },
    { name: "Pedidos", href: "/orders", icon: <ShoppingCart className="h-5 w-5 mr-2" /> },
    { name: "Configurações", href: "/settings", icon: <Settings className="h-5 w-5 mr-2" /> }
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

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
                    className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                      isActive(item.href) 
                        ? "bg-inventory-primary text-white" 
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
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
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive(item.href)
                  ? "bg-inventory-primary text-white"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
