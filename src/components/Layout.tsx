
import { Outlet } from "react-router-dom";
import Header from "./Header";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50">
        <Outlet />
      </main>
      <footer className="py-6 px-4 border-t">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            &copy; 2023 InvenType - Sistema de Gerenciamento de Inventário
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
