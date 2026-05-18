## Visão geral

Adicionar ao módulo Empresa (PJ) uma nova área **Contas a Pagar** com cadastro completo, integração no Fluxo de Caixa (apenas fixas) e um termômetro no Dashboard. Adicionar um **widget flutuante de chat IA "ZZ"** disponível em todas as páginas autenticadas (PJ e PF), que responde com base nos dados financeiros do usuário.

---

## 1. Banco de dados (Supabase)

Nova tabela `contas_a_pagar`:

- `id`, `user_id`, `company_id`, `created_at`, `updated_at`
- `nome` (texto)
- `fornecedor` (texto, opcional)
- `categoria` (texto, opcional)
- `valor` (numeric)
- `data_vencimento` (date)
- `tipo` (enum: `fixa` | `variavel`)
- `recorrencia` (enum: `unica` | `mensal` | `parcelada`)
- `parcelas_total`, `parcela_atual` (int, opcional para parceladas)
- `status` (enum: `pendente` | `pago`)
- `data_pagamento` (date, opcional)
- `comprovante_url` (texto, opcional)
- `observacoes` (texto, opcional)

RLS: usuário só acessa próprias contas (`auth.uid() = user_id` ou via `company_id`), padrão das outras tabelas PJ.

Bucket de storage `contas-comprovantes` (privado) para upload de comprovantes.

**Integração com Fluxo de Caixa:**
- Contas do tipo **fixa** geram automaticamente lançamentos previstos em `fluxo_caixa` (despesa) no mês do vencimento, replicando-se para os próximos meses se `recorrencia = mensal`.
- Contas **variáveis** NÃO entram no fluxo automaticamente (ficam só no controle de Contas a Pagar) — o usuário lança manualmente quando paga.
- Ao marcar como `pago`, vincula via `transacao_origem_id` no fluxo.

---

## 2. Nova página: `/contas-a-pagar` (PJ)

Adicionada ao `AppSidebar` (módulo empresa).

Componentes:
- Lista de contas com filtros (mês, tipo, status, categoria)
- Botão "Nova conta a pagar" → diálogo com formulário completo
- Cards de resumo: Total do mês, Pagas, Pendentes, Vencendo em 7 dias
- Ações por linha: Editar, Marcar como pago (com upload de comprovante), Excluir
- Suporte a recorrência (mensal/parcelada) com preview das próximas parcelas

Visual segue branding atual: Montserrat, primary `#1A3423`, padrão minimalista enterprise (já existe memória de design).

---

## 3. Dashboard: Termômetro de Contas a Pagar

Novo card no Dashboard PJ:
- Mostra **total acumulado de contas a pagar do mês selecionado** (soma de `valor` de todas as contas com `data_vencimento` no mês, independente do status)
- Visual: barra horizontal "termômetro" + valor central destacado
- Sub-métricas: total pago, total pendente, % concluído
- Respeita o filtro de mês ativo do Dashboard

---

## 4. Chat IA "ZZ" (widget flutuante)

**Frontend:**
- Componente `ZZChatWidget` montado no `AppLayout` (PJ) e `PersonalLayout` (PF) → aparece em todas as páginas autenticadas
- Botão flutuante canto inferior direito com identidade visual ZZ (não usar ícone `Sparkles` genérico — gerar logo próprio em verde escuro)
- Painel de chat (drawer/popover) com histórico de mensagens da sessão (sem persistência no banco — escopo enxuto)
- Renderiza markdown nas respostas
- Loader "Pensando..." enquanto streama

**Backend (Supabase Edge Function `zz-chat`):**
- Usa AI SDK + Lovable AI Gateway (`google/gemini-3-flash-preview`)
- Valida JWT do usuário
- Antes de chamar o modelo, agrega dados do usuário autenticado:
  - Últimas 50 transações conciliadas (PJ) ou pessoais (PF) conforme contexto ativo
  - Total de entradas/saídas do mês atual
  - Saldo de fluxo de caixa
  - Contas a pagar pendentes
  - Contexto da sessão (PJ/PF)
- Injeta esse resumo no `system` prompt
- Faz `streamText` e devolve `toUIMessageStreamResponse`
- Sem ferramentas (tools) na primeira versão — apenas pergunta/resposta sobre dados pré-carregados

---

## 5. Detalhes técnicos

- Hook `useContasAPagar` (React Query, `staleTime: 0` conforme regra do projeto)
- Datas sempre parseadas como YYYY-MM-DD manualmente (regra do projeto)
- Geração automática de despesas no `fluxo_caixa` para contas fixas: via trigger SQL ou função Edge `sync-contas-fluxo` chamada após insert/update
- Reaproveita componente `MonthSelector` existente
- Reaproveita padrão de upload do bucket `comprovantes` (criar novo bucket `contas-comprovantes`)

---

## 6. Entrega em ordem

1. Migração SQL: tabela `contas_a_pagar` + bucket + RLS + trigger de sincronização com `fluxo_caixa`
2. Página `/contas-a-pagar`, hook, formulários, lista
3. Card "Termômetro" no Dashboard
4. Edge function `zz-chat` + widget `ZZChatWidget` no layout
5. Logo/ícone ZZ gerado (verde escuro, identidade Balanzzo)

---

## Confirmações antes de começar

- O bucket de comprovantes pode ser **privado** (acesso via signed URL), ok?
- O chat ZZ **não** precisa persistir histórico entre sessões nesta primeira versão — ok? (se quiser persistir depois, adicionamos thread + tabela)
- Posso prosseguir?