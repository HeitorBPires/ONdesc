# ONDesc Billing Platform

Aplicação web para operação de faturamento da ONDesc Energy, usada para:

- autenticar operadores internos;
- anexar faturas COPEL em PDF por cliente;
- extrair e validar dados automaticamente;
- calcular valores com regras de negócio da operação;
- gerar boleto/fatura ONDesc com PIX + código de barras via Asaas;
- persistir todo o ciclo mensal no Supabase.

## Visão de Produto

Este sistema resolve um fluxo operacional crítico de energia compensada, reduzindo trabalho manual na análise de faturas e na emissão de cobrança para clientes finais.

No contexto real da empresa, o app organiza o ciclo mensal por cliente, evita inconsistências de cálculo e padroniza a emissão dos documentos financeiros.

## Destaques Para Portfólio

Projeto real, com uso profissional e integração com serviços externos em produção/sandbox.

Pontos de engenharia que demonstram senioridade prática:

- pipeline completo de documento: `upload PDF -> parser -> cálculo -> geração de fatura -> persistência`;
- regras de domínio com múltiplos modos de cálculo (`automatico`, `taxa`, `porcentagem`);
- autenticação e proteção de rotas com Supabase SSR;
- integração com gateway financeiro (Asaas) para cobrança por boleto + PIX;
- composição de PDFs (fatura ONDesc + anexo COPEL) em único arquivo final;
- controle de status de cliente e ciclo mensal com idempotência via `upsert`.

## Stack Técnica

- `Next.js 16` (App Router)
- `React 19` + `TypeScript`
- `Tailwind CSS 4`
- `Supabase` (Auth + Postgres + Storage)
- `pdf-parse` para leitura de PDF
- `@react-pdf/renderer` para geração de fatura
- `pdf-lib` para merge de PDFs
- `Asaas API` para emissão de cobrança

## Arquitetura Resumida

### Frontend

- `src/app/page.tsx`: lista de clientes, status, upload e acesso ao cálculo.
- `src/app/calculation/page.tsx`: tela de processamento, ajustes de cálculo e geração do boleto.
- `src/components/ResultsDisplay.tsx`: exibe métricas e aciona emissão da invoice final.

### Backend (API Routes)

- `src/app/api/clients/route.ts`: lista clientes com status de anexo.
- `src/app/api/clients/[clientId]/attachment/route.ts`: upload do PDF COPEL para Storage.
- `src/app/api/calculation/route.ts`: download do PDF anexado, parsing, cálculo e persistência do resultado mensal.
- `src/app/api/ondesc-invoice/route.ts`: cria cobrança Asaas, gera PDF ONDesc, mescla com PDF COPEL e salva invoice mensal.
- `src/app/api/copel/route.ts`: endpoint alternativo de cálculo via upload direto.

### Camadas de suporte

- `lib/calculator.ts`: parser e motor de cálculo.
- `lib/extractDados.ts` + `lib/validateDadosUsuario.ts`: extração e validação de dados cadastrais da fatura.
- `src/lib/supabase/data-access.ts`: acesso a dados (clients, monthly_calculations, documents, monthly_invoices).
- `src/services/asaas/*`: cliente HTTP, tipos e regras de integração com Asaas.

## Fluxo de Negócio

1. Operador faz login.
2. Sistema lista clientes com status do ciclo atual.
3. Operador envia PDF da COPEL para um cliente.
4. API processa o PDF e calcula a fatura ONDesc.
5. Operador pode recalcular com regra automática, taxa manual ou percentual desejado.
6. Sistema cria cobrança no Asaas, gera PDF da fatura ONDesc e faz merge com PDF COPEL.
7. Resultado final é baixado e o status do cliente avança para `Aguard. Pag.`.

## Regras Importantes de Domínio

- desconto por percentual aceito entre `12%` e `15%`.
- upload pode ser bloqueado conforme status do cliente (`PAGO` não permite novo ciclo imediato).
- status pode voltar para `PENDENTE` após janela baseada em `próxima leitura`.
- vencimento pode ser configurado no cliente como dia fixo (`1-31`) ou data completa (`dd/MM/yyyy`).

## Modelo de Dados Esperado (Supabase)

Tabelas utilizadas pelo código:

- `clients`
- `monthly_calculations`
- `documents`
- `monthly_invoices`

Bucket de storage utilizado:

- `documents`

Observação: a modelagem SQL não está versionada neste repositório; a estrutura acima foi inferida diretamente da camada `data-access`.

## Segurança e Acesso

- autenticação com e-mail/senha via Supabase Auth;
- proteção de páginas por middleware SSR (`src/lib/supabase/middleware.ts`);
- validação de sessão nas APIs via `requireUser`;
- rotas públicas restritas (`/login`).

## Configuração de Ambiente

Crie um `.env.local` com base no `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

# production | sandbox
ASAAS_ENV=sandbox
ASAAS_ACCESS_TOKEN="YOUR_ASAAS_ACCESS_TOKEN"
```

## Como Rodar Localmente

```bash
npm install
npm run dev
```

Aplicação disponível em `http://localhost:3000`.

## Scripts

- `npm run dev`: ambiente de desenvolvimento
- `npm run build`: build de produção
- `npm run start`: servidor de produção
- `npm run lint`: lint do projeto

## Endpoints Principais

| Método | Rota | Objetivo |
|---|---|---|
| `GET` | `/api/clients` | Listar clientes e status de anexos |
| `POST` | `/api/clients/:clientId/attachment` | Enviar PDF COPEL |
| `POST` | `/api/calculation` | Calcular fatura ONDesc por cliente |
| `POST` | `/api/ondesc-invoice` | Gerar cobrança Asaas + PDF final |
| `POST` | `/api/copel` | Cálculo via upload direto |

## Screenshot

Interface real do projeto (versão interna):

![Tela da aplicação](public/img/frame.png)

## Aprendizados Técnicos do Projeto

- lidar com PDFs reais exige parser tolerante a variações de layout;
- idempotência por mês/cliente simplifica operação e evita duplicidade;
- separar regra de negócio (cálculo) da camada HTTP facilita manutenção;
- integração financeira exige validação agressiva e mensagens de erro claras para operação.

## Possíveis Evoluções

- testes automatizados para parser e regras de cálculo;
- webhook de pagamento Asaas para atualização automática de status;
- trilha de auditoria por usuário/operação;
- dashboard gerencial com indicadores por mês.

## Aviso de Confidencialidade

Este repositório representa um sistema de uso profissional real. Para fins de portfólio, recomenda-se compartilhar apenas:

- arquitetura;
- decisões técnicas;
- stack;
- desafios e soluções.

Evite publicar dados de clientes, chaves de API e detalhes sensíveis de operação.
