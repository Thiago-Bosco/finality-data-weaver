
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/formatters";
import { Wrench, AlertTriangle, CheckCircle } from "lucide-react";
import { Maintenance } from "@/types/inventory";

interface MaintenanceItemProps {
  maintenance: Maintenance;
}

const MaintenanceItem = ({ maintenance }: MaintenanceItemProps) => {
  // Determina o tipo de manutenção
  const getMaintenanceType = () => {
    switch (maintenance.maintenance_type) {
      case "preventive":
        return {
          label: "Preventiva",
          badge: <Badge variant="outline" className="bg-blue-50"><CheckCircle className="w-3 h-3 mr-1" /> Preventiva</Badge>
        };
      case "corrective":
        return {
          label: "Corretiva",
          badge: <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Corretiva</Badge>
        };
      case "predictive":
        return {
          label: "Preditiva",
          badge: <Badge variant="secondary"><Wrench className="w-3 h-3 mr-1" /> Preditiva</Badge>
        };
      default:
        return {
          label: "Outro",
          badge: <Badge variant="outline">Outro</Badge>
        };
    }
  };

  const maintenanceType = getMaintenanceType();
  
  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{maintenance.equipment?.name || "Desconhecido"}</div>
          <div className="text-sm text-muted-foreground">{maintenance.equipment?.serial_number}</div>
        </div>
      </TableCell>
      <TableCell>{maintenanceType.badge}</TableCell>
      <TableCell>{maintenance.performed_by}</TableCell>
      <TableCell>{format(new Date(maintenance.maintenance_date), "dd/MM/yyyy")}</TableCell>
      <TableCell>
        {maintenance.next_maintenance_date 
          ? format(new Date(maintenance.next_maintenance_date), "dd/MM/yyyy")
          : "-"}
      </TableCell>
      <TableCell>{formatCurrency(maintenance.maintenance_cost || 0)}</TableCell>
      <TableCell className="max-w-xs truncate">{maintenance.description || "-"}</TableCell>
    </TableRow>
  );
};

export default MaintenanceItem;
