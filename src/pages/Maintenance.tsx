
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Wrench, Download, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format, addMonths } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/formatters";
import { Maintenance, Equipment } from "@/types/inventory";
import MaintenanceItem from "@/components/MaintenanceItem";

const MaintenancePage = () => {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    equipment_id: "",
    maintenance_type: "preventive",
    description: "",
    performed_by: "",
    maintenance_date: new Date().toISOString().split('T')[0],
    next_maintenance_date: addMonths(new Date(), 3).toISOString().split('T')[0],
    maintenance_cost: 0
  });

  async function fetchMaintenance() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("equipment_maintenance")
        .select(`
          *,
          equipment:equipment(id, name, serial_number)
        `)
        .order("maintenance_date", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setMaintenance(data);
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar manutenções: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEquipment() {
    try {
      const { data, error } = await supabase
        .from("equipment")
        .select("id, name, serial_number")
        .order("name");

      if (error) {
        throw error;
      }

      if (data) {
        setEquipment(data);
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar equipamentos: ${error.message}`);
    }
  }

  useEffect(() => {
    fetchMaintenance();
    fetchEquipment();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "maintenance_cost") {
      // Trata entrada de valor monetário
      const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
      setFormData({ ...formData, [name]: isNaN(numericValue) ? 0 : numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    // Se for preventiva, calcula próxima manutenção daqui a 3 meses
    if (name === "maintenance_type" && value === "preventive") {
      setFormData({ 
        ...formData,
        [name]: value,
        next_maintenance_date: addMonths(new Date(), 3).toISOString().split('T')[0]
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validação
      if (!formData.equipment_id || !formData.maintenance_type || !formData.performed_by) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      const { error } = await supabase
        .from("equipment_maintenance")
        .insert([formData]);

      if (error) {
        throw error;
      }

      toast.success("Manutenção registrada com sucesso!");
      setFormData({
        equipment_id: "",
        maintenance_type: "preventive",
        description: "",
        performed_by: "",
        maintenance_date: new Date().toISOString().split('T')[0],
        next_maintenance_date: addMonths(new Date(), 3).toISOString().split('T')[0],
        maintenance_cost: 0
      });
      setOpen(false);
      await fetchMaintenance();
    } catch (error: any) {
      toast.error(`Erro ao registrar manutenção: ${error.message}`);
    }
  };

  const exportToCSV = () => {
    if (maintenance.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    const headers = [
      "Equipamento", 
      "Tipo de Manutenção",
      "Realizado por",
      "Data", 
      "Próxima Manutenção",
      "Custo",
      "Descrição"
    ];
    
    const rows = maintenance.map(item => [
      item.equipment?.name || "Desconhecido",
      item.maintenance_type === "preventive" ? "Preventiva" : 
      item.maintenance_type === "corrective" ? "Corretiva" : 
      item.maintenance_type === "predictive" ? "Preditiva" : "Outro",
      item.performed_by,
      format(new Date(item.maintenance_date), "dd/MM/yyyy"),
      item.next_maintenance_date ? format(new Date(item.next_maintenance_date), "dd/MM/yyyy") : "N/A",
      formatCurrency(item.maintenance_cost || 0),
      item.description || ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `manutencoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exportação concluída");
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manutenções</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Registrar Manutenção
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Registrar Manutenção</DialogTitle>
                <DialogDescription>
                  Registre uma manutenção realizada em um equipamento.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="equipment_id" className="text-right">
                      Equipamento*
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={formData.equipment_id}
                        onValueChange={(value) => handleSelectChange("equipment_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um equipamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipment.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {item.serial_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="maintenance_type" className="text-right">
                      Tipo*
                    </Label>
                    <Select
                      value={formData.maintenance_type}
                      onValueChange={(value) => handleSelectChange("maintenance_type", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o tipo de manutenção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventive">Preventiva</SelectItem>
                        <SelectItem value="corrective">Corretiva</SelectItem>
                        <SelectItem value="predictive">Preditiva</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="performed_by" className="text-right">
                      Realizado por*
                    </Label>
                    <Input
                      id="performed_by"
                      name="performed_by"
                      value={formData.performed_by}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="maintenance_date" className="text-right">
                      Data*
                    </Label>
                    <Input
                      id="maintenance_date"
                      name="maintenance_date"
                      type="date"
                      value={formData.maintenance_date}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="next_maintenance_date" className="text-right">
                      Próxima Manutenção
                    </Label>
                    <Input
                      id="next_maintenance_date"
                      name="next_maintenance_date"
                      type="date"
                      value={formData.next_maintenance_date}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="maintenance_cost" className="text-right">
                      Custo (R$)
                    </Label>
                    <Input
                      id="maintenance_cost"
                      name="maintenance_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maintenance_cost}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">
                      Descrição
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="col-span-3"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Registrar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Manutenções</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-inventory-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Realizado por</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Próxima Manutenção</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        Nenhuma manutenção registrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    maintenance.map((item) => (
                      <MaintenanceItem key={item.id} maintenance={item} />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenancePage;
