# Torre v2

Painel do Gabriel para o sistema de agentes (Maestri): pendências, frentes, tokens e memória.
Next.js 15 + Postgres (Neon) + passkeys. A tela lê `GET /api/resumo` a cada 15 s. Referência visual: `reference/torre.html`.

## Envs (Vercel > Settings > Environment Variables; em dev, `.env.local`)
- `DATABASE_URL` ou `POSTGRES_URL`: injetadas pela integração Neon (Vercel Storage).
- `TORRE_HOST`: host público sem `https://` (ex.: `torre.vercel.app`; em dev `localhost:3000`). É o rpID das passkeys.
- `TORRE_SETUP_CODE`: código do 1º cadastro (uso único).
- `TORRE_SESSION_SECRET`: 32+ caracteres aleatórios (`openssl rand -base64 48`).
- `TORRE_AGENT_TOKEN`: token dos agentes, 32+ caracteres aleatórios.
- `TORRE_TZ` (opcional): fuso de datas sem fuso vindas dos agentes; padrão `America/Sao_Paulo`.

## Deploy e migração
```sh
npm install
vercel link && vercel env pull .env.local   # traz DATABASE_URL da integração Neon
npm run db:migrate                          # idempotente (db/schema.sql)
vercel --prod
```

## Primeiro acesso e aparelhos (uma passkey por aparelho)
1. No 1º aparelho, abra `https://TORRE_HOST/entrar`, digite o `TORRE_SETUP_CODE` e um nome (ex.: PC) e crie a chave. Depois disso o setup code deixa de valer.
2. Aparelho novo: num aparelho já logado, "Adicionar aparelho" > "Gerar código" (6 dígitos, 10 min, uso único). No aparelho novo, `/entrar` > código + nome (ex.: celular) > criar a chave.
3. "Sair" apaga só o cookie deste aparelho; a passkey continua cadastrada.
Login com Google fica para a fase 3.

## Agentes (header `Authorization: Bearer $TORRE_AGENT_TOKEN`)
```sh
H="Authorization: Bearer $TORRE_AGENT_TOKEN"; J="Content-Type: application/json"
# Nova pendência
curl -sS -X POST "$TORRE_URL/api/pendentes" -H "$H" -H "$J" -d '{"id":"torre-dns","titulo":"Apontar DNS","tipo":"COMANDO","frente":"TORRE","quem_pediu":"maestro","destrava":"deploy","comandos":["vercel domains add torre.exemplo.com"]}'
# Upsert de frente (só os campos enviados mudam; null limpa)
curl -sS -X PUT "$TORRE_URL/api/frentes/TORRE" -H "$H" -H "$J" -d '{"operador":"nuvem","modelo":"opus","marco_atual":"API","proximo_marco":"tela","travado":null,"recrutas":[{"nome":"revisor","modelo":"sonnet","effort":"medium"}]}'
# Upsert de custo (id = frente:periodo)
curl -sS -X PUT "$TORRE_URL/api/custo" -H "$H" -H "$J" -d '{"frente":"TORRE","periodo":"2026-09","tokens_in":120000,"tokens_out":45000,"cache_read":3000000,"usd_estimado":4.2}'
# Mensagens não lidas do Gabriel
curl -sS "$TORRE_URL/api/mensagens?nao_lidas=1&de=gabriel" -H "$H"
```
Responder numa pendência: `POST /api/mensagens {"pendente_id":"torre-dns","de":"maestro","texto":"..."}`; marcar lida: `PATCH /api/mensagens/<id> {}`.
Demais rotas: `GET /api/saude` (pública), `GET /api/resumo`, `PATCH /api/pendentes/:id`, `GET /api/frentes`, `GET /api/custo`, `GET|PUT /api/sessoes` (lista), `GET|PUT /api/cotas` (lista), `GET|PUT /api/memoria`. Erros vêm como `{"erro": "..."}` (400/401/404).

## Coletor local
`bin/torre-push.sh` lê `~/kb/.maestri/torre/dados.json` e faz PUT em sessões, cotas e memória:
```sh
TORRE_URL=https://torre.vercel.app TORRE_AGENT_TOKEN=... bin/torre-push.sh
```
Precisa de `curl` e `jq`. O token nunca é impresso.
