# Landing page — teste de rastreamento (Meta Pixel + Supabase)

Primeiro tijolo da "Trilha B" descrita em `../arquitetura_funil/ARQ_02_SITE_TRACKING.md`:
dispara `PageView` (ao carregar) e `Lead` (ao clicar no botão de WhatsApp), e grava o
clique em `core.cliques_landing` no Supabase — schema atual em `../novo_formato/schema.sql`.

**Vocabulário de eventos do funil completo** (client-side na landing + server-side no n8n,
nunca o mesmo nome nos dois pontos sem compartilhar `event_id` — ver decisão abaixo):

| Evento | Onde dispara | O que significa |
|---|---|---|
| `PageView` | Landing, ao carregar | Abriu a página |
| `Lead` | Landing, ao clicar no botão WhatsApp | Demonstrou interesse, entrou em contato |
| `InitiateCheckout` | n8n (`core.aplicar_etapa_e_liberar`), etapa `orcamento_realizado` | Começou o processo de fechar negócio |
| `Purchase` | n8n, etapa `contrato_fechado` | Fechou |

## Rodar localmente

```bash
npm install
cp .env.example .env.local
# preencher NEXT_PUBLIC_META_PIXEL_ID, NEXT_PUBLIC_WHATSAPP_NUMBER,
# NEXT_PUBLIC_TENANT_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Abra `http://localhost:3000`.

## Onboarding de cliente novo

O `tenant_id` não é gerado automaticamente — é uma string curta que **você escolhe** ao
provisionar o cliente no banco, e precisa bater nos dois lados (banco ↔ landing) por
convenção manual:

```sql
-- 1. No Supabase SQL Editor (rodar ../novo_formato/schema.sql uma vez no projeto,
--    depois isto por cliente):
INSERT INTO core.tenants (id, schema_name, zapi_instancia, nome, meta_trilha)
VALUES ('clinica_lumme', 'clinica_lumme', '<instance_id_zapi>', 'Clínica Lumme',
        'landing_bridge');  -- 'organico' se este cliente não tiver landing
SELECT core.provisionar_tenant_schema('clinica_lumme');
```

```bash
# 2. No deploy da landing deste cliente (Vercel → Project Settings →
#    Environment Variables):
NEXT_PUBLIC_TENANT_ID=clinica_lumme
```

`core.tenants.id` é a fonte da verdade. Cada cliente tem seu próprio deploy da landing
(1:1), apontando para o mesmo projeto Supabase compartilhado.

## Como o rastreamento funciona (ordem importa)

1. **Página carrega** → `MetaPixel.tsx` dispara `fbq('track','PageView')` e chama
   `POST /api/pageview`, que executa a RPC `core.registrar_pageview_landing(...)` — é aqui
   que a linha em `core.cliques_landing` **nasce** (com `fbc`/`fbp`/UTMs capturados, mas
   `clicou_wpp_at` ainda `NULL`). Reload da página não duplica (idempotente por `ref_id`).
2. **Lead clica em "Falar no WhatsApp"** → `WhatsAppButton.tsx` dispara
   `fbq('track','Lead')` **antes** do redirect, chama `POST /api/clique`
   (RPC `core.registrar_clique_wpp_landing`, que marca `clicou_wpp_at = NOW()`), e só
   redireciona para `wa.me` depois que o POST resolve (sucesso ou erro — nunca trava o lead).
3. **Mensagem chega no n8n** → o workflow (`../novo_formato/agente.json`) chama
   `core.match_atribuicao(...)`, que tenta casar por `clicou_wpp_at` dentro de uma janela de
   minutos (`core.tenants.janela_match_min`). O texto da mensagem **não carrega ref_id** —
   um código tipo `#LP4OT9LQB` assustaria lead leigo — então o matching depende inteiramente
   do fallback temporal. 2+ cliques na mesma janela = não casa (ambiguidade é pior que
   atribuição errada).

Tenant com `meta_trilha = 'organico'` nunca passa por nada disso — `match_atribuicao()` sai
direto para "orgânico" sem tentar casar, então não precisa nem ter landing.

## Segurança

- RLS habilitada em toda tabela do schema `core` e de cada tenant (ver
  `../novo_formato/schema.sql` seção 2 e `core.aplicar_seguranca_tenant()`)
- A role `app_landing` só tem `EXECUTE` nas duas funções RPC acima — nunca lê/escreve tabela
  diretamente, nunca vê `configuracoes` (onde ficam as referências de credencial do tenant)
- `SUPABASE_SERVICE_ROLE_KEY` só existe no server (`src/lib/supabase/server.ts`, protegido
  por `server-only`) — nunca com prefixo `NEXT_PUBLIC_`, nunca chega ao bundle do client
- Headers de segurança completos (CSP restrita ao Pixel, HSTS, X-Frame-Options etc.) em
  `next.config.ts`

## Validar no Gerenciador de Eventos da Meta

1. Preencha `NEXT_PUBLIC_META_PIXEL_ID` com o Pixel real
2. Instale a extensão **Meta Pixel Helper** no Chrome
3. Abra a página — o Helper deve mostrar 1x `PageView`
4. Clique no botão — deve mostrar 1x `Lead`
5. No Gerenciador de Eventos → aba **Eventos de teste**, confirme que os dois eventos chegam
6. No Supabase Studio, confirme que `core.cliques_landing` ganhou uma linha no pageview e que
   `clicou_wpp_at` foi preenchido após o clique

## Deploy (Vercel + GitHub)

1. Suba este diretório como repositório no GitHub
2. Importe o repo na Vercel
3. Em **Project Settings → Environment Variables**, configure as mesmas chaves de
   `.env.example` (nunca commitar `.env.local`)
4. Repetir o passo "Onboarding de cliente novo" para cada cliente novo

## Próximos passos (fora do escopo desta etapa)

- Rate limiting, CORS explícito quando a landing virar multi-tenant de fato (`/r?t=<tenant>`)
  em vez de 1 deploy por cliente — ARQ_04 §4
- Qualificação opcional (1-2 perguntas em botão) antes do redirect — ARQ_02 §6
- Ver memória de projeto sobre roadmap (migração futura do motor n8n para Python, estratégia
  de particularidade por cliente) e observabilidade multi-tenant
