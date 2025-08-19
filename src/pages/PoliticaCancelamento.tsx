import { Card } from "@/components/ui/card";

export default function PoliticaCancelamento() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Balanzzo</h1>
          <p className="text-xl text-muted-foreground">Política de Cancelamento e Reembolso</p>
        </div>

        <Card className="p-8 shadow-lg">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="policy">
              <h1 className="text-3xl font-bold text-foreground mb-4">Política de Cancelamento e Reembolso – Balanzzo</h1>
              <p className="text-sm text-muted-foreground mb-6"><strong>Última atualização: 15 de agosto de 2025</strong></p>
              
              <p className="mb-6 text-foreground">A Balanzzo valoriza a transparência e a liberdade de escolha de seus clientes. Esta Política regula as condições de cancelamento e reembolso dos planos contratados em nossa plataforma.</p>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Cancelamento pelo Cliente</h2>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-foreground">
                <li>O cancelamento pode ser solicitado <strong>exclusivamente pelos canais oficiais de atendimento da Balanzzo</strong>, através do e-mail <a href="mailto:contato@balanzzo.com.br" className="text-primary hover:text-primary/80 underline">contato@balanzzo.com.br</a> ou pelo suporte ao cliente.</li>
                <li>O cancelamento terá efeito <strong>a partir do próximo ciclo de cobrança</strong>.</li>
                <li>O cliente manterá acesso à plataforma até o término do período já pago.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Planos Mensais</h2>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-foreground">
                <li>O cliente pode cancelar a qualquer momento.</li>
                <li>Não há cobrança de multa ou taxa de cancelamento.</li>
                <li>O valor referente ao mês já pago <strong>não é reembolsável</strong>, mas o acesso à plataforma será garantido até o fim do período contratado.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Planos Semestrais</h2>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-foreground">
                <li>O cliente pode cancelar a qualquer momento.</li>
                <li>Em caso de cancelamento antes do término do ciclo semestral, será realizado o <strong>reembolso proporcional</strong> dos meses não utilizados.</li>
                <li>O reembolso será processado em até <strong>15 dias úteis</strong> após a solicitação.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Período de Garantia (Direito de Arrependimento)</h2>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-foreground">
                <li>Conforme o artigo 49 do <strong>Código de Defesa do Consumidor</strong>, o cliente pode desistir da contratação em até <strong>7 dias corridos</strong> após a assinatura.</li>
                <li>Nesse caso, será feito o <strong>reembolso integral</strong> do valor pago.</li>
                <li>O reembolso será realizado em até <strong>7 dias úteis</strong>, conforme previsto pelo CDC.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Cancelamento pela Balanzzo</h2>
              <p className="mb-4 text-foreground">A Balanzzo poderá encerrar a assinatura, mediante aviso prévio, nas seguintes situações:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-foreground">
                <li>Uso indevido ou ilegal da plataforma.</li>
                <li>Inadimplência superior a <strong>15 dias</strong>.</li>
                <li>Violação dos Termos de Uso ou desta Política.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Exclusão de Dados</h2>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-foreground">
                <li>Após o cancelamento, os dados do cliente serão armazenados pelo prazo de <strong>15 dias</strong>, conforme nossa Política de Privacidade.</li>
                <li>Após esse período, os dados serão excluídos de forma definitiva e segura.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Contato</h2>
              <p className="mb-6 text-foreground">Para dúvidas, solicitações de cancelamento ou pedidos de reembolso, entre em contato conosco:<br />
              📧 <a href="mailto:contato@balanzzo.com.br" className="text-primary hover:text-primary/80 underline">contato@balanzzo.com.br</a></p>

              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-6">Resumo Simplificado</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left font-semibold text-foreground">Situação</th>
                      <th className="border border-border p-3 text-left font-semibold text-foreground">Direito do Cliente</th>
                      <th className="border border-border p-3 text-left font-semibold text-foreground">Prazo para Reembolso</th>
                      <th className="border border-border p-3 text-left font-semibold text-foreground">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3 text-foreground">Cancelamento do plano <strong>mensal</strong></td>
                      <td className="border border-border p-3 text-foreground">Sem taxas, acesso até o fim do mês</td>
                      <td className="border border-border p-3 text-foreground">Não aplicável</td>
                      <td className="border border-border p-3 text-foreground">Valor já pago não é devolvido</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 text-foreground">Cancelamento do plano <strong>semestral</strong></td>
                      <td className="border border-border p-3 text-foreground">Reembolso proporcional dos meses não utilizados</td>
                      <td className="border border-border p-3 text-foreground">Até <strong>15 dias úteis</strong></td>
                      <td className="border border-border p-3 text-foreground">Sem taxas ou multas</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 text-foreground"><strong>Direito de arrependimento (7 dias)</strong></td>
                      <td className="border border-border p-3 text-foreground">Reembolso integral</td>
                      <td className="border border-border p-3 text-foreground">Até <strong>7 dias úteis</strong></td>
                      <td className="border border-border p-3 text-foreground">Prazo legal previsto no CDC</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}