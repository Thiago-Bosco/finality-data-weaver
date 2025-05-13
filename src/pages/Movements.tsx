
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
import { Plus, MoveRight, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

interface Movement {
  id: string;
  equipment_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  moved_at: string;
  reason: string | null;
  notes: string | null;
  equipment: {
    name: string;
    serial_number: string;
  };
  from_location: {
    name: string;
  } | null;
  to_location: {
    name: string;
  } | null;
}

interface Equipment {
  id: string;
  name: string;
  serial_number: string;
  location_id: string | null;
}

interface Location {
  id: string;
  name: string;
}

const Movements = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    equipment_id: "",
    to_location_id: "",
    reason: "",
    notes: "",
  });
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  async function fetchMovements() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("movement_history")
        .select(`
          *,
          equipment:equipment(name, serial_number),
          from_location:locations(name),
          to_location:locations!to_location_id(name)
        `)
        .order("moved_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Type-safe handling of the response data
        const safeMovements: Movement[] = data.map(item => ({
          id: item.id,
          equipment_id: item.equipment_id,
          from_location_id: item.from_location_id,
          to_location_id: item.to_location_id,
          moved_at: item.moved_at,
          reason: item.reason,
          notes: item.notes,
          equipment: {
            name: item.equipment?.name || 'Unknown',
            serial_number: item.equipment?.serial_number || 'Unknown'
          },
          // Handle potential errors or missing data in the relationships
          from_location: item.from_location && typeof item.from_location === 'object' ? 
            { name: item.from_location.name || 'Unknown' } : null,
          to_location: item.to_location && typeof item.to_location === 'object' ? 
            { name: item.to_location.name || 'Unknown' } : null,
        }));
        
        setMovements(safeMovements);
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar movimentações: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEquipment() {
    try {
      const { data, error } = await supabase
        .from("equipment")
        .select("id, name, serial_number, location_id")
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

  async function fetchLocations() {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .order("name");

      if (error) {
        throw error;
      }

      if (data) {
        setLocations(data);
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar localizações: ${error.message}`);
    }
  }

  useEffect(() => {
    fetchMovements();
    fetchEquipment();
    fetchLocations();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "equipment_id") {
      const selected = equipment.find(item => item.id === value);
      setSelectedEquipment(selected || null);
      setFormData({ 
        ...formData, 
        equipment_id: value,
        to_location_id: ""
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEquipment) {
      toast.error("Selecione um equipamento");
      return;
    }

    try {
      // Start a transaction
      const movementData = {
        equipment_id: formData.equipment_id,
        from_location_id: selectedEquipment.location_id,
        to_location_id: formData.to_location_id || null,
        reason: formData.reason || null,
        notes: formData.notes || null,
      };

      // Insert movement record
      const { error: movementError } = await supabase
        .from("movement_history")
        .insert([movementData]);

      if (movementError) throw movementError;

      // Update equipment location
      const { error: equipmentError } = await supabase
        .from("equipment")
        .update({ location_id: formData.to_location_id || null })
        .eq("id", formData.equipment_id);

      if (equipmentError) throw equipmentError;

      toast.success("Movimentação registrada com sucesso!");
      setFormData({
        equipment_id: "",
        to_location_id: "",
        reason: "",
        notes: "",
      });
      setSelectedEquipment(null);
      setOpen(false);
      
      // Refresh data
      await fetchMovements();
      await fetchEquipment();
    } catch (error: any) {
      toast.error(`Erro ao registrar movimentação: ${error.message}`);
    }
  };

  const exportToCSV = () => {
    if (movements.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    // Create CSV header
    const headers = [
      "Equipamento", 
      "Número de Série", 
      "Origem", 
      "Destino",
      "Data da Movimentação", 
      "Motivo"
    ];
    
    // Create CSV rows
    const rows = movements.map(item => [
      item.equipment.name,
      item.equipment.serial_number,
      item.from_location?.name || "Não especificado",
      item.to_location?.name || "Não especificado",
      format(new Date(item.moved_at), "dd/MM/yyyy HH:mm"),
      item.reason || ""
    ]);
    
    // Combine header and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    // Create download link
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `movimentacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    // Start download
    link.click();
    document.body.removeChild(link);
    toast.success("Exportação concluída");
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Movimentações</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Registrar Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Registrar Movimentação</DialogTitle>
                <DialogDescription>
                  Registre a movimentação de um equipamento entre localizações.
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

                  {selectedEquipment && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">
                        Localização Atual
                      </Label>
                      <div className="col-span-3 text-sm">
                        {selectedEquipment.location_id ? 
                          locations.find(loc => loc.id === selectedEquipment.location_id)?.name || "Desconhecido" : 
                          "Não especificado"}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="to_location_id" className="text-right">
                      Nova Localização
                    </Label>
                    <Select
                      value={formData.to_location_id}
                      onValueChange={(value) => handleSelectChange("to_location_id", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione uma localização" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sem localização</SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason" className="text-right">
                      Motivo
                    </Label>
                    <Input
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">
                      Observações
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
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
          <CardTitle>Histórico de Movimentações</CardTitle>
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
                    <TableHead>Origem</TableHead>
                    <TableHead></TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Nenhuma movimentação registrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{movement.equipment.name}</div>
                            <div className="text-sm text-muted-foreground">{movement.equipment.serial_number}</div>
                          </div>
                        </TableCell>
                        <TableCell>{movement.from_location?.name || "Não especificado"}</TableCell>
                        <TableCell>
                          <MoveRight className="h-4 w-4 mx-auto text-muted-foreground" />
                        </TableCell>
                        <TableCell>{movement.to_location?.name || "Não especificado"}</TableCell>
                        <TableCell>{format(new Date(movement.moved_at), "dd/MM/yyyy HH:mm")}</TableCell>
                        <TableCell>{movement.reason || "-"}</TableCell>
                      </TableRow>
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

export default Movements;
