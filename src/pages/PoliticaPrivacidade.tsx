import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Balanzzo</h1>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            Política de Privacidade
          </h2>
          <p className="text-muted-foreground">
            Última atualização: 22 de julho de 2025
          </p>
        </div>

        {/* Content */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
          <CardContent className="p-8 prose prose-slate max-w-none dark:prose-invert">
            <div className="space-y-6">
              <div className="text-center mb-8">
                <p className="text-sm text-muted-foreground">
                  <strong>Domínio oficial:</strong> www.balanzzo.com.br<br />
                  <strong>Encarregado de Dados (DPO):</strong> Rodrigo Borges – rodrigoborgesjcontato@gmail.com
                </p>
              </div>

              <section>
                <h3 className="text-xl font-semibold mb-3">1. Quem Somos</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A Balanzzo é uma plataforma digital de organização financeira empresarial, comprometida com a transparência, privacidade e segurança dos dados dos seus usuários.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">2. Dados Coletados</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Coletamos as seguintes informações:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Nome, e-mail, telefone, endereço;</li>
                  <li>CNPJ e nome da empresa;</li>
                  <li>Extratos bancários enviados manualmente;</li>
                  <li>Dados de navegação no site, por meio de cookies.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Esses dados são coletados via formulários em nossa leadpage e durante o uso da plataforma.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">3. Finalidade do Tratamento</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Utilizamos seus dados para:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Criar e gerenciar sua conta;</li>
                  <li>Organizar e apresentar informações financeiras da sua empresa;</li>
                  <li>Gerar relatórios, dashboards e DREs;</li>
                  <li>Realizar conciliações bancárias;</li>
                  <li>Enviar comunicações operacionais;</li>
                  <li>Integrar com sistemas de CRM e suporte técnico (quando aplicável);</li>
                  <li>Cumprir obrigações legais e contratuais.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">4. Base Legal para o Tratamento de Dados</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  O tratamento dos dados pela Balanzzo é realizado com base nas seguintes hipóteses legais da LGPD:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li><strong>Execução de contrato:</strong> para fornecer os serviços contratados na plataforma;</li>
                  <li><strong>Consentimento:</strong> para uso de cookies e comunicações opcionais;</li>
                  <li><strong>Cumprimento de obrigação legal ou regulatória,</strong> quando aplicável.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">5. Compartilhamento de Dados com Terceiros</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Seus dados não são comercializados. Compartilhamos apenas com parceiros e operadores necessários para o funcionamento do serviço, como:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Supabase (armazenamento e autenticação);</li>
                  <li>Ferramentas de CRM (a definir);</li>
                  <li>Plataformas de hospedagem e segurança da aplicação.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Todos seguem rigorosos padrões de segurança e confidencialidade.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">6. Transferência Internacional de Dados</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A Balanzzo utiliza provedores de infraestrutura tecnológica localizados fora do Brasil, como o Supabase, que pode armazenar dados em servidores internacionais.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Nos comprometemos a garantir que tais transferências ocorram com mecanismos de proteção compatíveis com a LGPD, por meio de cláusulas contratuais e medidas técnicas adequadas.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">7. Uso de Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Utilizamos cookies para:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Melhorar sua navegação;</li>
                  <li>Coletar dados na leadpage antes do cadastro;</li>
                  <li>Otimizar a performance e segurança da plataforma.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Você pode desativar os cookies no seu navegador, mas isso pode limitar funcionalidades.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">8. Segurança da Informação</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Adotamos medidas rigorosas para proteção de dados, incluindo:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Criptografia (HTTPS);</li>
                  <li>Banco de dados com Row-Level Security (RLS);</li>
                  <li>Autenticação segura;</li>
                  <li>Controle de acesso por perfil;</li>
                  <li>Backups periódicos;</li>
                  <li>Monitoramento de acesso.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">9. Retenção e Exclusão dos Dados</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Os dados permanecerão armazenados enquanto a conta estiver ativa. Após o encerramento, os dados serão excluídos em até 15 dias, salvo obrigação legal de retenção.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">10. Direitos dos Titulares</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Conforme a LGPD, você pode:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Solicitar acesso e confirmação do tratamento dos dados;</li>
                  <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
                  <li>Revogar consentimentos;</li>
                  <li>Solicitar anonimização, portabilidade ou exclusão;</li>
                  <li>Obter informações sobre compartilhamentos com terceiros.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Entre em contato pelo e-mail: <a href="mailto:rodrigoborgesjcontato@gmail.com" className="text-primary hover:underline">rodrigoborgesjcontato@gmail.com</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">11. Alterações na Política</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Esta política pode ser atualizada a qualquer momento. Em caso de mudanças relevantes, você será notificado por e-mail ou diretamente na plataforma.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">12. Foro e Legislação Aplicável</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Este documento é regido pela LGPD e demais leis brasileiras. Fica eleito o foro da comarca de sua escolha para resolução de conflitos, salvo disposição legal em contrário.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">13. Aceite</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ao utilizar nossos serviços, você declara ter lido, compreendido e concordado com esta Política de Privacidade.
                </p>
              </section>

              <div className="border-t pt-6 mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  © 2025 Balanzzo. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}