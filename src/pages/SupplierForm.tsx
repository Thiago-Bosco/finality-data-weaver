
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

// Schema de validação para o formulário
const supplierFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  contact: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional()
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(false);

  // Inicializar o formulário com valores vazios
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      contact: "",
      email: "",
      phone: ""
    }
  });

  // Carregar dados do fornecedor se estiver editando
  useEffect(() => {
    if (id) {
      const fetchSupplier = async () => {
        try {
          const { data, error } = await supabase
            .from("suppliers")
            .select("*")
            .eq("id", id)
            .single();

          if (error) {
            toast({
              title: "Erro",
              description: `Falha ao carregar fornecedor: ${error.message}`,
              variant: "destructive"
            });
            navigate("/suppliers");
            return;
          }

          if (data) {
            form.reset({
              name: data.name || "",
              contact: data.contact || "",
              email: data.email || "",
              phone: data.phone || ""
            });
          }
        } catch (error: any) {
          toast({
            title: "Erro",
            description: `Falha ao carregar fornecedor: ${error.message}`,
            variant: "destructive"
          });
        }
      };

      fetchSupplier();
    }
  }, [id, navigate, toast, form]);

  const onSubmit = async (values: SupplierFormValues) => {
    if (!isAdmin) {
      toast({
        title: "Permissão negada",
        description: "Apenas administradores podem realizar esta ação",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let error;

      if (id) {
        // Atualizar fornecedor existente
        const result = await supabase
          .from("suppliers")
          .update(values)
          .eq("id", id);
        error = result.error;

        if (!error) {
          toast({
            title: "Sucesso",
            description: "Fornecedor atualizado com sucesso"
          });
        }
      } else {
        // Criar novo fornecedor
        const result = await supabase
          .from("suppliers")
          .insert(values);
        error = result.error;

        if (!error) {
          toast({
            title: "Sucesso",
            description: "Fornecedor criado com sucesso"
          });
        }
      }

      if (error) {
        toast({
          title: "Erro",
          description: `Falha ao salvar fornecedor: ${error.message}`,
          variant: "destructive"
        });
      } else {
        navigate("/suppliers");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha ao salvar fornecedor: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar permissões de administrador
  if (adminLoading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-inventory-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center">Permissão Negada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center">Apenas administradores podem adicionar ou editar fornecedores.</p>
            <div className="flex justify-center">
              <Link to="/suppliers">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Fornecedores
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>{id ? "Editar Fornecedor" : "Novo Fornecedor"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do fornecedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do contato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between">
                <Link to="/suppliers">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                </Link>
                <Button type="submit" disabled={loading} className="bg-inventory-primary hover:bg-blue-700">
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierForm;
