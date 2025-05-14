
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
import { Plus, Server, Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { Textarea } from "@/components/ui/textarea";

interface Equipment {
  id: string;
  name: string;
  serial_number: string;
  model: string;
  category: string;
  status: string;
  location_id: string | null;
  purchase_value: number | null;
  current_value: number | null;
  supplier: string | null;
  invoice_number: string | null;
  location?: {
    name: string;
  } | null;
}

interface Location {
  id: string;
  name: string;
}

const Equipment = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    serial_number: "",
    model: "",
    category: "server",
    status: "active",
    specifications: {},
    location_id: "",
    purchase_value: 0,
    current_value: 0,
    supplier: "",
    invoice_number: "",
  });

  async function fetchEquipment() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("equipment")
        .select(`
          *,
          location:locations(name)
        `)
        .order("name");

      if (error) {
        throw error;
      }

      if (data) {
        setEquipment(data);
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar equipamentos: ${error.message}`);
    } finally {
      setLoading(false);
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
    fetchEquipment();
    fetchLocations();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "purchase_value" || name === "current_value") {
      // Trata entrada de valor monetário
      const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
      setFormData({ ...formData, [name]: isNaN(numericValue) ? 0 : numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value === "none" ? "" : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Fix the location_id handling for empty selection
      const submissionData = {
        ...formData,
        location_id: formData.location_id === "" ? null : formData.location_id,
        purchase_value: formData.purchase_value || 0,
        current_value: formData.current_value || 0,
        supplier: formData.supplier || null,
        invoice_number: formData.invoice_number || null
      };

      const { data, error } = await supabase
        .from("equipment")
        .insert([submissionData])
        .select();

      if (error) {
        throw error;
      }

      toast.success("Equipamento adicionado com sucesso!");
      setFormData({
        name: "",
        serial_number: "",
        model: "",
        category: "server",
        status: "active",
        specifications: {},
        location_id: "",
        purchase_value: 0,
        current_value: 0,
        supplier: "",
        invoice_number: "",
      });
      setOpen(false);
      await fetchEquipment();
    } catch (error: any) {
      toast.error(`Erro ao adicionar equipamento: ${error.message}`);
    }
  };

  const exportToCSV = () => {
    if (equipment.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    // Create CSV header
    const headers = [
      "Nome", 
      "Número de Série", 
      "Modelo", 
      "Categoria", 
      "Status", 
      "Localização", 
      "Valor de Compra", 
      "Valor Atual",
      "Fornecedor",
      "Nota Fiscal"
    ];
    
    // Create CSV rows
    const rows = equipment.map(item => [
      item.name,
      item.serial_number,
      item.model,
      item.category,
      item.status,
      item.location?.name || "N/A",
      formatCurrency(item.purchase_value || 0),
      formatCurrency(item.current_value || 0),
      item.supplier || "N/A",
      item.invoice_number || "N/A"
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
    link.setAttribute("download", `equipamentos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    // Start download
    link.click();
    document.body.removeChild(link);
    toast.success("Exportação concluída");
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Equipamentos</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Equipamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Equipamento</DialogTitle>
                <DialogDescription>
                  Cadastre um novo servidor ou equipamento de infraestrutura.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nome*
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="serial_number" className="text-right">
                      Número de Série*
                    </Label>
                    <Input
                      id="serial_number"
                      name="serial_number"
                      value={formData.serial_number}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="model" className="text-right">
                      Modelo*
                    </Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Categoria
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleSelectChange("category", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="server">Servidor</SelectItem>
                        <SelectItem value="network">Equipamento de Rede</SelectItem>
                        <SelectItem value="storage">Armazenamento</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione um status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="maintenance">Em Manutenção</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location_id" className="text-right">
                      Localização
                    </Label>
                    <Select
                      value={formData.location_id}
                      onValueChange={(value) => handleSelectChange("location_id", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione uma localização" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem localização</SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Novos campos adicionados */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="purchase_value" className="text-right">
                      Valor de Compra
                    </Label>
                    <Input
                      id="purchase_value"
                      name="purchase_value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.purchase_value}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="current_value" className="text-right">
                      Valor Atual
                    </Label>
                    <Input
                      id="current_value"
                      name="current_value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.current_value}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="supplier" className="text-right">
                      Fornecedor
                    </Label>
                    <Input
                      id="supplier"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="invoice_number" className="text-right">
                      Nota Fiscal
                    </Label>
                    <Input
                      id="invoice_number"
                      name="invoice_number"
                      value={formData.invoice_number}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Equipamentos</CardTitle>
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Número de Série</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Valor de Compra</TableHead>
                    <TableHead>Valor Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        Nenhum equipamento encontrado. Adicione um novo equipamento.
                      </TableCell>
                    </TableRow>
                  ) : (
                    equipment.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Server className="h-4 w-4 mr-2 text-muted-foreground" />
                            {item.name}
                          </div>
                        </TableCell>
                        <TableCell>{item.serial_number}</TableCell>
                        <TableCell>{item.model}</TableCell>
                        <TableCell>
                          {item.category === "server" && "Servidor"}
                          {item.category === "network" && "Equipamento de Rede"}
                          {item.category === "storage" && "Armazenamento"}
                          {item.category === "other" && "Outro"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              item.status === "active" ? "default" : 
                              item.status === "maintenance" ? "secondary" : 
                              "outline"
                            }
                          >
                            {item.status === "active" && "Ativo"}
                            {item.status === "maintenance" && "Em Manutenção"}
                            {item.status === "inactive" && "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.location?.name || "-"}</TableCell>
                        <TableCell>{formatCurrency(item.purchase_value || 0)}</TableCell>
                        <TableCell>{formatCurrency(item.current_value || 0)}</TableCell>
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

export default Equipment;
