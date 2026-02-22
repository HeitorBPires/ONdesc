# ONDesc Energy

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
