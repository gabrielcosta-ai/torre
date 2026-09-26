# Pesquisa — modelos de IA gratuitos por API para a Frota (setembro de 2026)

> Executa `docs/BRIEF-pesquisa.md`. Só faixas gratuitas; foco em API compatível com OpenAI para o proxy Frota (Cloudflare Worker).
> Usuário: pessoa física no Brasil, preferência por não cadastrar cartão.
> Convenção: "não verificado" = não confirmado em fonte oficial ou comunidade confiável. Datas de fonte no formato AAAA-MM.

Seções: (A) tabela completa · (B) ranking de volume grátis · (C) plano para a Frota · (D) armadilhas.


> **Limitação de método (importante):** nesta sessão de nuvem o proxy de saída bloqueou o WebFetch em quase todos os sites oficiais (openrouter.ai, console.groq.com, ai.google.dev, docs.mistral.ai, docs.z.ai, build.nvidia.com etc.; só github.com abriu). Os dados vêm de trechos indexados pelo WebSearch das páginas oficiais, changelogs/issues no GitHub (lidos direto) e agregadores técnicos de 2026. Por isso muitos números estão marcados "não verificado" — **confira na página oficial/console antes de ligar no proxy**. Pesquisa feita em 2026-09-26.

## (A) Tabela completa

Legenda: **OAI** = compatível com OpenAI (base URL) · **TC** = tool calling · **Cartão** = exige cartão · **BR** = disponível para o Brasil · "n.v." = não verificado.

### A.1 Roteadores e provedores de inferência

| Provedor | O que é grátis | Modelos (id exato da API) | OAI — base URL | TC / contexto | Cartão / .edu / BR | Como ativar (chave) | Validade | Fonte (data) |
|---|---|---|---|---|---|---|---|---|
| **OpenRouter** | Modelos `:free`: **50 req/dia** somados (conta que comprou < US$10 na vida); **1.000 req/dia** após compra única ≥ US$10 (vale mesmo com saldo zerado). **20 req/min** por modelo free. | ~21 modelos free em 2026-09-26 (lista muda toda semana). Estável: `openrouter/free` (roteador que escolhe um free com suporte a tools). Citados: `nvidia/nemotron-3.5-lightning:free`, Nemotron 3 Ultra free (id n.v.), Poolside Laguna (id n.v.), `cohere/north-mini-code:free` (n.v.). `qwen/qwen3-coder:free` provavelmente saiu (n.v.). `z-ai/glm-5.2:free` saiu em 2026-09-26. Promo: `Space Bunny Alpha` (stealth, 1M ctx, grátis ~7 dias desde 23/09). | `https://openrouter.ai/api/v1` | TC sim (filtrar `supported_parameters` contém `tools` em `GET /api/v1/models`); ctx varia 128k–1M | Não / não / sim (compra de US$10 em dólar, IOF) | https://openrouter.ai/settings/keys | Contínuo | openrouter.ai/docs/api_reference/limits; github.com/cyclez2000/openrouter-free-models/issues/77 (2026-09) |
| **Groq** | Plano Free por modelo: `openai/gpt-oss-120b` e `openai/gpt-oss-20b` ≈ **30 RPM, 1.000 RPD, 8.000 TPM, 200.000 TPD** cada. Llama 3.1 8B / 3.3 70B **saíram do free em 16/08/2026**; Kimi K2 descontinuado. | `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b` (limites n.v.) | `https://api.groq.com/openai/v1` | TC sim; ctx gpt-oss ≈ 131k (n.v. 2026) | Não / não / sim | https://console.groq.com/keys (limites da conta: /settings/limits) | Contínuo | console.groq.com/docs/rate-limits; klymentiev.com/blog/groq-pricing (2026-09) |
| **Cerebras** | **Acabou o free permanente (21/07/2026).** Trial de **US$5 / 30 dias**, exige meio de pagamento. | `gpt-oss-120b` (demais ids n.v.; qwen-3-235b, zai-glm-4.7, llama3.1-8b descontinuados desde 27/05/2026) | `https://api.cerebras.ai/v1` | TC sim | **Sim** / não / sim | https://cloud.cerebras.ai | 30 dias | inference-docs.cerebras.ai/support/rate-limits; github.com/robhunter/agentdeals/issues/1910 (2026-07) |
| **SambaNova** | Free Tier (sem cartão): ≈ **20 RPM, 20 RPD, 200k tokens/dia** (n.v.). Developer Tier (com cartão): US$5 / 3 meses, até 20M tokens/dia (dado de 2025). | `Meta-Llama-3.3-70B-Instruct`, `DeepSeek-V3.1`, `gpt-oss-120b` | `https://api.sambanova.ai/v1` (n.v. 2026) | TC sim | Free: não; Dev: sim / não / sim | https://cloud.sambanova.ai/apis | Contínuo (free) | docs.sambanova.ai/docs/en/models/rate-limits (2026, parcial) |
| **Together AI** | **Sem free tier.** Compra mínima US$5 para gerar chave (desde jul/2025). Programas de startup/pesquisa sob aprovação. | — | `https://api.together.xyz/v1` | — | Sim (pré-pago) | — | — | docs.together.ai/docs/billing-credits (2025-07) |
| **Fireworks AI** | **US$1** único para conta nova (n.v.). | Qwen/DeepSeek/Kimi/GLM (ids n.v.) | `https://api.fireworks.ai/inference/v1` | TC sim | Não (n.v.) / não / sim | https://fireworks.ai/account/api-keys | Até acabar | docs.fireworks.ai/serverless/rate-limits (2026) |
| **Hugging Face Inference Providers** | Conta Free: **US$0,10/mês** em créditos (para ao acabar). PRO (US$9/mês): US$2/mês. | ex.: `openai/gpt-oss-120b:fastest` (sufixos `:fastest`/`:cheapest`) | `https://router.huggingface.co/v1` | TC sim | Não / não / sim | https://huggingface.co/settings/tokens (permissão "Make calls to Inference Providers") | Mensal | huggingface.co/docs/inference-providers/pricing (2026) |
| **NVIDIA NIM (build.nvidia.com)** | Grátis com NVIDIA Developer Program para prototipação: **40 RPM** por padrão (pode pedir 200 RPM no fórum); o antigo sistema de 1.000/5.000 créditos virou limites de trial por modelo **não publicados**. | (ids n.v. no catálogo) `qwen/qwen3-coder-480b-a35b-instruct` (256k), `moonshotai/kimi-k3`, `z-ai/glm-5.3`, `openai/gpt-oss-120b`, `nvidia/nemotron-3-nano-30b-a3b`, MiniMax M2.7, Mistral Large 3 | `https://integrate.api.nvidia.com/v1` | TC sim (inconsistente em alguns modelos) | Não / não / sim | https://build.nvidia.com → abrir modelo → "Get API Key" | Trial (sem prazo publicado) | forums.developer.nvidia.com (2026-07/08) |
| **Cloudflare Workers AI** | **10.000 Neurons/dia** (reset 00:00 UTC). Desde 28/07/2026 Kimi K2.6/K2.7-code e GLM-5.2 exigem Workers Paid (403, erro 5035). | `@cf/openai/gpt-oss-120b` (free); `@cf/zai-org/glm-5.3` (free? n.v.) | `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1` — ou binding `env.AI` direto no Worker | TC sim no gpt-oss | Não / não / sim | Dashboard → API Tokens → permissão "Workers AI" | Diário | developers.cloudflare.com/workers-ai/platform/pricing; changelog 2026-07-28 |
| **GitHub Models** | **Desativado em 30/07/2026** (fechado a novos clientes desde 16/06/2026). `models.github.ai/inference` não responde mais. | — | — | — | — | — | Encerrado | github.blog/changelog/2026-07-30-github-models-is-now-retired |
| **Mistral (La Plateforme)** | "Free mode" ativo por padrão sem cartão; **limites só no painel** (Admin → API → Limits). Histórico (n.v. 2026): 1 RPS, 500k TPM, 1B tokens/mês. Conflito: agregador diz que em 03/09/2026 virou US$10/mês de créditos (n.v.). | `mistral-medium-latest` (Medium 3.5, id n.v.), `devstral-2512` (256k, marcado deprecated), `mistral-large-2512`, `codestral-latest` | `https://api.mistral.ai/v1` (Codestral: `https://codestral.mistral.ai/v1`, status grátis n.v.) | TC sim; 128k–256k | Não / não / sim (telefone n.v.) | https://admin.mistral.ai/organization/api-keys | Contínuo | docs.mistral.ai/admin/billing-usage/usage-limits (2026) |
| **DeepSeek** | **Sem free tier** (há "granted balance" sem valor publicado, n.v.). `deepseek-flash` (V4.1-Flash) ≈ US$0,15/0,60 por 1M fora do pico (n.v.). | `deepseek-flash`, `deepseek-v4-pro` (→ Flash até sair o V4.1-Pro) | `https://api.deepseek.com` | TC sim; 1M | Pré-pago (PayPal/meios chineses, n.v.) | https://platform.deepseek.com/api_keys | — | api-docs.deepseek.com/news/news260910 (2026-09) |
| **Google AI Studio / Gemini API** | Free tier sem cartão, **só Flash/Flash-Lite** (Pro saiu do free em 01/04/2026). Limites por projeto, RPD zera à meia-noite (Pacífico). Citados (n.v.): `gemini-3.8-flash` ≈ 20 RPD; Flash-Lite ≈ 15 RPM / 1.000 RPD. Série 2.5 restrita a quem já usava. 5.000 grounding/mês. | `gemini-3.8-flash` (1M ctx, 64k saída, lançado 02/09/2026), `gemini-3.5-flash-lite`, `gemini-3.5-flash` (free n.v.) | `https://generativelanguage.googleapis.com/v1beta/openai/` | TC sim; 1M | Não / não / sim (bloqueio só EEA/UK/CH no free) | https://aistudio.google.com/apikey | Contínuo | ai.google.dev/gemini-api/docs/rate-limits, /pricing, /models (2026-09) |
| **Alibaba Model Studio (Qwen)** | **1M tokens por modelo**, 90 dias, só região Singapura. Opção "Free Quota Only" (devolve 403 ao esgotar; tem atraso). | `qwen3-coder-plus`, `qwen3-coder-next` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` (novo: `https://{WorkspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`) | TC sim; ctx n.v. | **Provável sim** (Visa/Master internacional, pré-autorização US$1) / não / sim | https://modelstudio.console.alibabacloud.com (ap-southeast-1) | 90 dias | alibabacloud.com/help/en/model-studio/new-free-quota (2026) |
| **Moonshot / Kimi** | **Nada grátis.** Recarga mínima US$1; voucher de US$5 ao acumular US$5. | Kimi K2.6/K2.7 Code, K3 (ids n.v.) | `https://api.moonshot.ai/v1` | TC sim; 256k | Pré-pago | https://platform.moonshot.ai | — | platform.kimi.ai/docs/pricing/limits (2026) |
| **Z.ai (Zhipu / GLM)** | Modelos **US$0**: `glm-4.7-flash`, `glm-4.5-flash`, `glm-4.6v-flash` (visão). Sem RPM/RPD publicado; ≈ **1 requisição simultânea** (n.v.). Trial Coding Plan: 8M tokens/dia por 5 dias. | `glm-4.7-flash`, `glm-4.5-flash` | `https://api.z.ai/api/paas/v4/` | TC sim; ctx n.v. (GLM-4.6 = 200k) | Não (n.v.) / não / sim | https://z.ai/manage-apikey/apikey-list | Contínuo | docs.z.ai/guides/overview/pricing (2026-09) |
| **MiniMax** | Sem free contínuo confirmado (promo M2 acabou em 07/11/2025; ¥15 no cadastro n.v.). | `MiniMax-M3`, `MiniMax-M2.7` | `https://api.minimax.io/v1` | TC sim | n.v. | https://platform.minimax.io | — | platform.minimax.io/docs (2026) |
| **xAI** | Programa data sharing US$150/mês **encerrado em mai/2025**. US$25 de cadastro citado por terceiros (n.v.). Tratar como sem free. | grok (ids n.v.) | `https://api.x.ai/v1` | TC sim | Pré-pago | https://console.x.ai | — | docs.x.ai/console/billing (2026) |
| **Cohere** | Trial key: **1.000 chamadas/mês**, Chat 20/min, **só uso não comercial**. | `command-a-03-2025` (256k), `command-a-plus-05-2026` (128k) | `https://api.cohere.ai/compatibility/v1` | TC sim | Não (n.v.) / não / sim | https://dashboard.cohere.com/api-keys | Mensal | docs.cohere.com/docs/rate-limits (2026) |
| **AI21** | **US$10 / 3 meses** para conta nova. | Jamba Large / Mini (256k) | n.v. | n.v. | Não (n.v.) | https://studio.ai21.com | 3 meses | docs.ai21.com/docs/usage-cost (2026) |
| **Novita AI** | "New User Voucher" (valor n.v., ~US$0,50), expira em 90 dias; alguns modelos pequenos a US$0/token (n.v.). | Llama 3.2 1B, Qwen2.5-7B, GLM-4-9B (fracos) | `https://api.novita.ai/openai` | TC parcial | Não (n.v.) | https://novita.ai/settings/key-management | 90 dias | novita.ai/docs/guides/LLM-FAQ (2026) |
| **DeepInfra** | Nada grátis confirmado em fonte oficial. | — | `https://api.deepinfra.com/v1/openai` | — | Pré-pago (n.v.) | https://deepinfra.com/dash/api_keys | — | github.com/deepinfra/docs (2026) |
| **Chutes.ai** | **Free acabou** (200 req/dia do Early Access retirado em 15/03/2026). Planos: US$3 / US$10 / US$20 por mês. | — | `https://llm.chutes.ai/v1` | — | Pago | — | Encerrado | chutes.ai/news/community-announcement-february (2026-02) |
| **Kluster.ai** | **Inferência encerrada em 24/07/2025.** | — | — | — | — | — | Encerrado | kluster.ai/blog/end-of-life-announcement |
| **Hyperbolic** | **US$1** após verificar telefone (dado de 2025, n.v. 2026). | Llama 3.1 405B/70B/8B etc. | `https://api.hyperbolic.xyz/v1` | TC n.v. | Não / não / sim | https://app.hyperbolic.xyz | Até acabar | docs.hyperbolic.xyz (2025) |
| **Nebius Token Factory** | **US$1 / 30 dias**; Builder Program (aberto) dá US$25. | `Qwen/Qwen3-Coder-480B-A35B-Instruct` | `https://api.tokenfactory.nebius.com/v1/` | TC sim | **Sim** | https://tokenfactory.nebius.com | 30 dias | docs.tokenfactory.nebius.com/other-capabilities/billing-new (2026) |
| **Scaleway Generative APIs** | **1M tokens** grátis (único ou mensal: n.v.). | `qwen3.5-397b-a17b` (250k), `glm-5.2` (256k), `deepseek-v4-flash-0731` (256k), `devstral-2-123b-instruct-2512` (200k), `gpt-oss-120b` (128k), `qwen3-235b-a22b-instruct-2507` | `https://api.scaleway.ai/v1` | TC sim | **Sim** (limites só com pagamento cadastrado) | https://console.scaleway.com/generative-api/models | n.v. | github.com/scaleway/docs-content (2026) |
| **OVHcloud AI Endpoints** | **Anônimo, sem conta**: 2 req/min por IP e por modelo. Com chave (pago): 400 RPM. | `gpt-oss-120b`, `Qwen3-Coder-30B-A3B-Instruct` (ids n.v.) | `https://oai.endpoints.kepler.ai.cloud.ovh.net/v1` | TC sim | Não (anônimo) | Sem chave (anônimo) | Contínuo | docs.ovhcloud.com …/ai-endpoints-capabilities (2026-03) |
| **OpenCode Zen** | Modelos free (lista rotativa, set/2026): Big Pickle, DeepSeek V4 Flash Free, MiMo-V2.5 Free, Nemotron 3 Ultra Free, Qwen 3.6 Plus Free, MiniMax M3 Free, North Mini Code Free (ids n.v.). Volume não publicado. | ids n.v. — conferir `GET /models` | `https://opencode.ai/zen/v1` | TC sim | Não / não / sim | https://opencode.ai/auth | Promo rotativa | opencode.ai/docs/zen (2026-09, via agregador) |
| **Kilo Gateway** | `kilo-auto/free` (roteia para Grok Code Fast, Nemotron, Seed etc.), ≈ 200 req/h (n.v.). | `kilo-auto/free` | compatibilidade OpenAI n.v. | TC sim | Não | https://app.kilo.ai | Contínuo | kilo.ai/docs/getting-started/using-kilo-for-free (2026, via agregador) |

### A.2 APIs de fábrica

| Provedor | O que é grátis | OAI | Cartão / BR | Como ativar | Validade | Fonte |
|---|---|---|---|---|---|---|
| **Anthropic** | **US$5** únicos para conta nova após verificação por SMS (parcialmente verificado); vale para Haiku/Sonnet/Opus. Programas: Startups (US$5k–100k, empresa constituída), Claude for Open Source (Max 20x por 6 meses — plano, não API), External Researcher Access (segurança/alinhamento). | API nativa (`https://api.anthropic.com/v1/messages`); camada compatível com SDK OpenAI n.v. | Não / sim | https://platform.claude.com | ~14 dias após resgate (n.v.) | claude.com/programs/startups (2026) |
| **OpenAI** | Sem free tier. **Programa de tokens grátis por compartilhar dados** ainda ativo (parcialmente verificado): tier 3–5 até **1M tokens/dia** nos modelos grandes e **10M/dia** nos mini/nano; tier 1–2 ≈ 250k/dia nos pequenos. | `https://api.openai.com/v1` | **Sim na prática** (precisa de gasto prévio para ter tier) / sim | Settings → Organization → Data controls → Sharing | Até 30 dias após aviso de fim | help.openai.com/en/articles/10306912 (2026) |
| **Google (Gemini API)** | Ver linha Gemini em A.1 (free só Flash/Flash-Lite; dados usados para treino). | ver A.1 | Não / sim | https://aistudio.google.com/apikey | Contínuo | ai.google.dev (2026-09) |

### A.3 Créditos de nuvem que cobrem inferência

| Nuvem | Valor / prazo | Cobre inferência? | Cartão / .edu / BR | Como ativar | Fonte |
|---|---|---|---|---|---|
| **Google Cloud** | **US$300 / 90 dias**, só para quem nunca pagou. | Gemini **no Vertex AI** ("Gemini Enterprise Agent Platform"). Contas criadas após 02/03/2026: crédito **não cobre** a Gemini API do AI Studio. Vertex tem endpoint compatível com OpenAI. | **Sim** (+ CPF e data de nascimento no BR) / não / sim | https://console.cloud.google.com/freetrial | docs.cloud.google.com/free/docs/free-cloud-features (2026) |
| **AWS** | Até **US$200 / 6 meses** (US$100 no cadastro + US$100 por atividades guiadas, uma delas com Bedrock), desde 15/07/2025. | Bedrock sim, mas modelos de terceiros (**incl. Claude**) passam pelo Marketplace, que os créditos em geral **não cobrem**; na prática, Amazon Nova. | **Sim** / não / sim | https://aws.amazon.com/free | aws.amazon.com/about-aws/whats-new/2025/07/… ; repost.aws (2026) |
| **Azure** | **US$200 / 30 dias**; **Azure for Students: US$100 / 12 meses sem cartão** (e-mail institucional, 18+). | Free Trial tem **quota 0** para Azure OpenAI/Foundry (precisa migrar para Pay-As-You-Go; crédito continua). Students em Azure OpenAI: n.v. | Sim (Students: não, exige .edu/institucional) / sim | https://azure.microsoft.com/free · /free/students | learn.microsoft.com/answers/questions/5907451 (2026) |
| **Oracle Cloud** | **US$300 / 30 dias**. | Sim, OCI Generative AI (endpoints compatíveis com OpenAI / Responses API, tool use); `sa-saopaulo-1` listada (modelos n.v.). Always Free não inclui GenAI. | **Sim** / não / sim | https://signup.cloud.oracle.com | docs.oracle.com/en-us/iaas/Content/FreeTier (2026) |

### A.4 Secundário — ferramentas de código (uma linha cada)

- **Cursor Hobby:** grátis sem cartão, Agent "limitado" e só o modelo Auto. Não tem API reutilizável. O Pro grátis para estudantes parou de aceitar inscrições em 25/06/2026. Fonte: cursor.com/pricing (2026-07).
- **GitHub Copilot Free:** 2.000 completions + 50 chats/mês, com CLI e agent mode. Desde 01/06/2026 cobra "AI Credits". Copilot Student é grátis, mas só no modo Auto desde 24/06/2026. Proxies OpenAI (copilot-api) não são oficiais e o risco com os termos de uso não foi verificado. Fonte: github.com/features/copilot/plans (2026-09).
- **Windsurf (virou "Devin Desktop"):** Tab ilimitado e cota leve de Cascade. Sem API. Fonte: 2026-06.
- **OpenAI Codex CLI:** o login oficial vale para Plus/Pro/Business/Edu/Enterprise; no Free/Go só há uma cota pequena no app/web. O CLI aceita chave de API. Fonte: github.com/openai/codex (2026-09).
- **Gemini CLI:** o tier grátis com conta pessoal (60 RPM / 1.000 req/dia) **acabou em 18/06/2026** e o Antigravity CLI (fechado) substituiu. Continua funcionando com chave do AI Studio (só Flash). Fonte: github.com/google-gemini/gemini-cli/discussions/28017.
- **JetBrains AI Free:** 3 AI Credits a cada 30 dias e completion local ilimitada. Sem API. Fonte: 2026.
- **Amazon Q Developer / Kiro:** o Q Free fechou novos cadastros em 15/05/2026. Kiro Free dá 50 créditos/mês, sem cartão e sem API OpenAI (n.v.). Fonte: 2026-09.
- **Cline, Roo e Kilo:** Roo Code encerrado em 15/05/2026. Cline é BYOK e só tem modelos free em promoções. Kilo tem `kilo-auto/free` (ver A.1). Fonte: 2026.
- **Replit / Bolt / Lovable / v0:** todos com cota diária ou mensal pequena e sem API de LLM reutilizável. Bolt dá 1M tokens/mês; Lovable, 5 créditos/dia; v0, US$5/mês com 7 mensagens/dia. Fonte: 2026.
- **Qwen Code CLI:** o OAuth grátis **acabou em 15/04/2026**. **iFlow CLI** foi encerrado em 17/04/2026. Fontes: github.com/QwenLM/qwen-code/issues/3316 e github.com/iflow-ai/iflow-cli.

## (B) Ranking — 10 maiores volumes gratuitos para agentes de código

Critério: volume diário **utilizável por um agente** (tool calling, contexto ≥ 32k, cadência de muitas chamadas). Estimativas em ordem de grandeza. Onde o provedor não publica teto, a posição reflete o limite por minuto e relatos da comunidade, e está marcada "n.v.".

### B.1 SEM cartão

| # | Provedor | Volume grátis estimado | Por que está nessa posição |
|---|---|---|---|
| 1 | **NVIDIA NIM** | 40 RPM, sem teto diário publicado (n.v.) | Maior RPM grátis, com modelos fortes (Qwen3-Coder 480B, Kimi, GLM-5.x). Os termos falam em prototipação, e há filas em modelos populares. |
| 2 | **Z.ai GLM Flash** | Sem teto publicado; ≈ 1 requisição simultânea (n.v.) | Modelo US$0 contínuo e razoável para código. A concorrência de 1 obriga a serializar as chamadas. |
| 3 | **Mistral free mode** | Histórico: ~1B tokens/mês a 1 RPS (n.v. 2026; pode ter virado US$10/mês) | Se o limite antigo ainda vale, é o maior volume em tokens. O painel da conta confirma o valor. |
| 4 | **Groq** | ~200k tokens/dia **por modelo** (gpt-oss-120b + gpt-oss-20b + qwen3.8 ≈ 400–600k/dia) | Muito rápido, mas 8k TPM limita cada requisição a um contexto pequeno. |
| 5 | **Google Gemini (Flash-Lite + Flash)** | ~1.000 RPD no Flash-Lite e ~20 RPD no 3.8 Flash (n.v.) | Contexto de 1M. O RPD baixo do Flash "forte" limita o uso. Os dados vão para treino. |
| 6 | **OpenCode Zen (modelos free)** | Não publicado | Endpoint OpenAI sem cartão, com lista rotativa de modelos de código. |
| 7 | **Kilo `kilo-auto/free`** | ~200 req/h (n.v.) | Bom volume, mas a compatibilidade OpenAI para uso externo não foi verificada. |
| 8 | **OpenRouter `:free`** | 50 req/dia (20 RPM) | Maior variedade de modelos. Sem compra, o volume é pequeno (ver B.2 para 1.000/dia). |
| 9 | **Cloudflare Workers AI** | 10k Neurons/dia (≈ poucas centenas de mil tokens de gpt-oss-120b) | Integração nativa com o Worker Frota (binding `env.AI`), sem latência extra. |
| 10 | **Cohere trial** | 1.000 chamadas/mês (20/min) | Só uso não comercial. |

**Créditos únicos sem cartão, para queimar em testes:** AI21 US$10/3 meses; Anthropic US$5 (SMS); Hyperbolic US$1 (telefone); Fireworks US$1 (n.v.); HF US$0,10/mês; OVH anônimo 2 RPM; SambaNova free com 20 RPD; Azure for Students US$100 (exige e-mail institucional).

### B.2 COM cartão (ou compra única)

| # | Provedor | Volume grátis | Observação |
|---|---|---|---|
| 1 | **OpenAI — data sharing** | Até 1M tokens/dia (modelos grandes) + 10M/dia (mini/nano) no tier 3+; ~250k/dia no tier 1–2 | Maior volume diário recorrente. Exige tier pago e **treina com os dados**. |
| 2 | **Google Cloud (Vertex)** | US$300 / 90 dias | Gemini Pro no Vertex. Não cobre o AI Studio para contas novas. |
| 3 | **Oracle Cloud** | US$300 / 30 dias | OCI GenAI com endpoint OpenAI. Os modelos variam por região. |
| 4 | **OpenRouter após compra de US$10** | 1.000 req/dia `:free`, para sempre | Não é grátis (US$10 uma vez), mas é o melhor custo por requisição. |
| 5 | **AWS** | Até US$200 / 6 meses | Na prática só Amazon Nova; Claude via Marketplace fica fora. |
| 6 | **Azure** | US$200 / 30 dias | A quota de Foundry começa em 0 no Free Trial. |
| 7 | **SambaNova Developer** | US$5 / 3 meses, até 20M tokens/dia (dado de 2025, n.v.) | — |
| 8 | **Alibaba Model Studio** | 1M tokens **por modelo** / 90 dias | Soma vários modelos Qwen-Coder. |
| 9 | **Cerebras trial** | US$5 / 30 dias (~14M tokens de entrada no gpt-oss-120b) | Muito rápido. |
| 10 | **Scaleway** | 1M tokens | Bons modelos (GLM-5.2, Qwen3.5 397B, Devstral 2). |

Nebius dá US$1 + US$25 pelo Builder Program; também pede cartão.
