
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Server, 
  Map, 
  TruckIcon, 
  ArrowLeftRight, 
  Wrench, 
  Settings,
  ShoppingCart 
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Layout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();

  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      href: "/",
    },
    {
      label: "Equipamentos",
      icon: <Server className="mr-2 h-4 w-4" />,
      href: "/equipments",
    },
    {
      label: "Localizações",
      icon: <Map className="mr-2 h-4 w-4" />,
      href: "/locations",
    },
    {
      label: "Fornecedores",
      icon: <TruckIcon className="mr-2 h-4 w-4" />,
      href: "/suppliers",
    },
    {
      label: "Movimentações",
      icon: <ArrowLeftRight className="mr-2 h-4 w-4" />,
      href: "/movements",
    },
    {
      label: "Manutenções",
      icon: <Wrench className="mr-2 h-4 w-4" />,
      href: "/maintenance",
    },
    {
      label: "Pedidos",
      icon: <ShoppingCart className="mr-2 h-4 w-4" />,
      href: "/orders",
    },
    {
      label: "Configurações",
      icon: <Settings className="mr-2 h-4 w-4" />,
      href: "/settings",
    },
  ];

  // Function to determine if a nav item is active
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {!isMobile && (
          <aside className="w-64 border-r h-[calc(100vh-4rem)] sticky top-16">
            <ScrollArea className="h-full py-6">
              <div className="px-3 py-2">
                <h2 className="mb-2 pl-4 text-lg font-semibold tracking-tight">
                  Menu
                </h2>
                <div className="space-y-1">
                  {navItems.map((item, idx) => (
                    <NavLink 
                      key={idx} 
                      to={item.href} 
                      className={({ isActive }) => cn(
                        "flex items-center justify-start w-full rounded-md px-4 py-2 text-sm font-medium",
                        isActive ? "bg-inventory-primary text-white" : "hover:bg-muted"
                      )}
                      end={item.href === "/"}
                    >
                      {item.icon}
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </aside>
        )}
        <main className="flex-1 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
