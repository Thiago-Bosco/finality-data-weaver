import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MapPin, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SearchAndFilter from "@/components/SearchAndFilter";

interface Location {
  id: string;
  name: string;
  address: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
  });

  async function fetchLocations() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      if (data) {
        setLocations(data);
        setFilteredLocations(data);
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar localizações: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("locations")
        .insert([formData])
        .select();

      if (error) {
        throw error;
      }

      toast.success("Localização adicionada com sucesso!");
      setFormData({
        name: "",
        address: "",
        contact_person: "",
        contact_email: "",
        contact_phone: "",
      });
      setOpen(false);
      await fetchLocations();
    } catch (error: any) {
      toast.error(`Erro ao adicionar localização: ${error.message}`);
    }
  };

  // Nova funcionalidade de pesquisa
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredLocations(locations);
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results = locations.filter(location => 
      location.name.toLowerCase().includes(normalizedQuery) || 
      (location.address && location.address.toLowerCase().includes(normalizedQuery)) || 
      (location.contact_person && location.contact_person.toLowerCase().includes(normalizedQuery)) ||
      (location.contact_email && location.contact_email.toLowerCase().includes(normalizedQuery)) ||
      (location.contact_phone && location.contact_phone.toLowerCase().includes(normalizedQuery))
    );

    setFilteredLocations(results);
  };

  // Como não temos muitas categorias para filtrar em localizações,
  // implementaremos apenas a pesquisa de texto
  const handleFilter = () => {
    // Implementação futura se necessário
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Localizações</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Localização
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Localização</DialogTitle>
              <DialogDescription>
                Cadastre um novo data center ou local para armazenamento de equipamentos.
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
                  <Label htmlFor="address" className="text-right">
                    Endereço
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact_person" className="text-right">
                    Contato
                  </Label>
                  <Input
                    id="contact_person"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact_email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact_phone" className="text-right">
                    Telefone
                  </Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
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

      <Card>
        <CardHeader>
          <CardTitle>Lista de Localizações</CardTitle>
          <SearchAndFilter 
            onSearch={handleSearch} 
            onFilter={handleFilter}
            searchPlaceholder="Pesquisar localizações..."
            className="mt-2"
          />
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
                    <TableHead>Endereço</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Nenhuma localização encontrada. Ajuste os critérios de pesquisa ou adicione uma nova localização.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            {location.name}
                          </div>
                        </TableCell>
                        <TableCell>{location.address || "-"}</TableCell>
                        <TableCell>{location.contact_person || "-"}</TableCell>
                        <TableCell>{location.contact_email || "-"}</TableCell>
                        <TableCell>{location.contact_phone || "-"}</TableCell>
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

export default Locations;
