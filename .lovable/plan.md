## Objetivo

Permitir que cada movimentação do fluxo de caixa seja alocada em um **centro de receita** ou **centro de custo** (grupo) e em um **subgrupo**, mantendo a conciliação atual por categoria personalizada. A IA sugere o centro com base na categoria/descrição, e o usuário pode mover manualmente para corrigir.

Linguagem na UI: "Centro de Receita / Centro de Custo" (não "DRE", "conta contábil" ou termos contábeis). Subgrupo aparece como "Subcategoria do centro".

## Estrutura proposta

### Centros padrão (pré-criados por usuário no primeiro acesso)

Centros de Receita:

- Vendas de Produtos
- Prestação de Serviços
- Outras Receitas (juros, reembolsos, etc.)

Centros de Custo:

- Pessoas (salários, pró-labore, benefícios)
- Operação (fornecedores, insumos, frete)
- Estrutura (aluguel, energia, internet, software)
- Comercial & Marketing
- Impostos e Tarifas
- Outras Saídas

Subgrupos: livres, criados pelo usuário dentro de cada centro (ex.: "Estrutura → Aluguel", "Estrutura → Energia").

### Banco de dados

Novas tabelas:

- `cost_centers` — id, user_id, company_id, name, type ('receita'|'custo'), is_default, color, active
- `cost_subgroups` — id, cost_center_id, user_id, name, active
- Mapeamento categoria → centro padrão: `category_cost_center_map` (user_id, category_name, cost_center_id, subgroup_id) para a IA aprender com correções do usuário.

Alterações em `fluxo_caixa` e/ou `transacoes_conciliadas`:

- Adicionar `cost_center_id uuid NULL`
- Adicionar `cost_subgroup_id uuid NULL`
- Adicionar `cost_center_source text` ('ai' | 'manual' | 'rule') para indicar origem da classificação

RLS e GRANTs nas novas tabelas seguindo padrão `auth.uid()`.

### IA — classificação automática

Estender `supabase/functions/categorize-transactions` (ou criar `assign-cost-center`) para receber a categoria já definida + descrição + valor + tipo e retornar `{cost_center_id, subgroup_id?, confidence}`. Roda em batch após a conciliação/categorização.

Regras:

1. Se existe regra em `category_cost_center_map` para `(user_id, category)` → aplica direto, source = 'rule'.
2. Senão chama Gemini com lista de centros do usuário e descrição da movimentação → source = 'ai'.
3. Sempre que o usuário move manualmente, gravar/atualizar `category_cost_center_map` para reforçar.

### UI — Fluxo de Caixa

1. **Lista de movimentações**: adicionar coluna "Centro" mostrando badge colorido com nome do centro + subgrupo abaixo (texto menor).
2. **Ação "Mover centro"**: ícone/menu na linha da movimentação abre dialog com select de centro (filtrado por tipo: entrada → centros de receita; saída → centros de custo) e select de subgrupo.
3. **Filtros do fluxo**: adicionar filtro por centro e por subgrupo.
4. **Resumo por centro**: card no topo do fluxo com totais agrupados por centro (entradas: barras verdes / saídas: barras na cor do centro), simples, sem visual contábil — usa o padrão de branding (Montserrat, verde `#1A3423`).

### Configurações

Nova aba "Centros de Receita e Custo" em Configurações:

- Listar centros padrão + permitir criar/editar/desativar
- Gerenciar subgrupos por centro
- Botão "Restaurar centros padrão"

## Fora de escopo

- DRE contábil formal / plano de contas
- Rateio percentual entre centros
- Centros para o módulo Pessoal (este ajuste é apenas PJ)

## Pontos para confirmar antes de implementar

1. Os centros padrão sugeridos acima fazem sentido, ou você quer outra lista inicial? Fazem, vamos apenas adicionar outras entradas, empréstimos. 
2. A classificação por centro deve rodar **automaticamente** após cada conciliação, ou só sob demanda (botão "Classificar com IA")? Automaticamente.
3. Subgrupos: deixar 100% livres (usuário cria) ou já entregar com alguns prontos (ex.: Estrutura → Aluguel, Energia, Internet)? Podemos deixar alguns prontos e permitir que o usuário crie.