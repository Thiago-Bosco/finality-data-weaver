
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas configurações foram atualizadas com sucesso."
    });
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Configurações</h1>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>
                Configure as informações principais da sua empresa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input id="company-name" placeholder="Nome da sua empresa" defaultValue="InvenType Ltda" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-cnpj">CNPJ</Label>
                  <Input id="company-cnpj" placeholder="00.000.000/0000-00" defaultValue="12.345.678/0001-90" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">E-mail</Label>
                  <Input id="company-email" type="email" placeholder="contato@empresa.com" defaultValue="contato@inventype.com.br" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Telefone</Label>
                  <Input id="company-phone" placeholder="(00) 0000-0000" defaultValue="(11) 3456-7890" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Preferências do Sistema</CardTitle>
              <CardDescription>Personalize o comportamento do sistema de inventário.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="low-stock-alert">Alerta de estoque baixo</Label>
                  <p className="text-sm text-muted-foreground">Notificar quando o estoque estiver abaixo de:</p>
                </div>
                <Input id="low-stock-alert" className="w-20" type="number" min="1" defaultValue="5" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-order">Pedido automático</Label>
                  <p className="text-sm text-muted-foreground">Criar pedidos automaticamente quando o estoque estiver baixo</p>
                </div>
                <Switch id="auto-order" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="tax-calculation">Calcular impostos automaticamente</Label>
                  <p className="text-sm text-muted-foreground">Aplica cálculo de impostos em vendas e compras</p>
                </div>
                <Switch id="tax-calculation" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>Controle como e quando recebe atualizações do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">Receba alertas importantes por email</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertas de Estoque Baixo</Label>
                    <p className="text-sm text-muted-foreground">Receba notificações quando produtos estiverem com estoque baixo</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Relatórios Semanais</Label>
                    <p className="text-sm text-muted-foreground">Receba um resumo semanal de atividades</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações de Pedidos</Label>
                    <p className="text-sm text-muted-foreground">Seja notificado sobre novos pedidos e atualizações</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Banco de Dados</CardTitle>
              <CardDescription>Gerencie sua conexão com a base de dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="db-connection">String de Conexão</Label>
                <Input id="db-connection" placeholder="postgres://username:password@localhost:5432/database" />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db-host">Host</Label>
                  <Input id="db-host" placeholder="localhost" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-port">Porta</Label>
                  <Input id="db-port" placeholder="5432" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db-user">Usuário</Label>
                  <Input id="db-user" placeholder="username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-password">Senha</Label>
                  <Input id="db-password" type="password" placeholder="********" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="db-name">Nome do Banco de Dados</Label>
                <Input id="db-name" placeholder="inventory_db" />
              </div>

              <div className="flex justify-end">
                <Button>Testar Conexão</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>Gerencie os usuários que têm acesso ao sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left text-sm font-medium">Usuário</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">E-mail</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Função</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">Admin</td>
                    <td className="py-3 px-4 text-sm">admin@inventype.com.br</td>
                    <td className="py-3 px-4 text-sm">Administrador</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Ativo
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Button variant="ghost" size="sm">Editar</Button>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">Maria Oliveira</td>
                    <td className="py-3 px-4 text-sm">maria@inventype.com.br</td>
                    <td className="py-3 px-4 text-sm">Gerente</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Ativo
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Button variant="ghost" size="sm">Editar</Button>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">Carlos Silva</td>
                    <td className="py-3 px-4 text-sm">carlos@inventype.com.br</td>
                    <td className="py-3 px-4 text-sm">Vendedor</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Inativo
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Button variant="ghost" size="sm">Editar</Button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-6">
                <Button>Adicionar Usuário</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleSave} 
          className="bg-inventory-primary hover:bg-blue-700"
        >
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};

export default Settings;
