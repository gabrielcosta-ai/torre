# Revisão torre.html (Opus 5.5, 26/09) — contrato runtime 0.2.60; teste real em Chromium com db falso + seed.json
## Bloqueia publicar
1. L649-651 `gravar`: o update aparece na hora (hasPendingWrites), o cartão sai de "abertos" (L828) e, se a escrita falha, volta como cartão NOVO; o aviso cai no nó removido. Reproduzido: GO com update rejeitado dá 5 cartões e nenhum aviso visível. Patch: na L605 `const errosGrav = new Map();`; na L650 `errosGrav.set(it.id, 'não salvou, tente de novo'); avisar(itens.get(it.id) || it, 'não salvou, tente de novo', 'erro');`; na L832, depois de `preencherItem(it, p);`, `const er = errosGrav.get(id); if (er) { errosGrav.delete(id); avisar(it, er, 'erro'); }`
2. L805 `Reabrir`: mesmo defeito. O item vai para os abertos e volta a um `<li>` recriado em L844, então o aviso se perde. Patch: na L805 `catch (_) { errosGrav.set(id, 'não salvou, tente de novo'); }`; em `itemFechado`, antes do `return`: `const er = errosGrav.get(id); if (er) { errosGrav.delete(id); aviso.textContent = er; aviso.hidden = false; }`
## Melhorar depois
- L649: se `can("data.write")` vier null e um update rejeitar `invalid_argument`, o db.d.ts manda deixar a página só leitura pelo resto da visita (`S.podeEscrever=false` + re-render). Hoje a página repete "tente de novo".
- L1138: o setInterval de 60 s recria a lista de fechados (L846), o que tira o foco de um "Reabrir" e apaga o aviso dele. Atualizar só as idades dos abertos.
- L1065: um erro no doc `memoria/atual` só troca o texto de `estado-memoria`; o gráfico e a lista de fatos continuam em "carregando…".
- L381/L423: com a coleção vazia, o cabeçalho da tabela continua aparecendo sob "Nenhuma sessão medida". Usar `rola.hidden = !lista.length`.
- L485: `fmtTok` mostra 5.000.000 como "5.000k". Passar a "M" a partir de 1e6 (tem cache_read na casa dos milhões).
- L1105: erro no botão "Falar com o maestro" que não cai em código de ocultar (ex.: `rate_limited`) passa sem nenhum aviso.
- Publicar com `capabilities: {db:{}, comments:{composer_only:true}}`. `user` não precisa ser declarado para can()/canEdit(). Com db, o artifact fica só para a organização.
## Conferido OK
- Cabeçalho do arquivo: começa com `<title>Torre</title>` (L1), depois o link do Google Fonts e o `<style>` (L5). Não tem doctype, html, head nem body.
- Tokens em `:root` (L7). Bloco `@media (prefers-color-scheme: dark){:root:not([data-theme="light"])}` (L29) e `:root[data-theme="dark"]` (L52), os dois com `color-scheme: dark`. body usa `background: var(--fundo)`: medi rgb(242,246,245) no claro e rgb(13,20,19) no escuro.
- Fontes e scripts: uma única fonte, IBM Plex, do Google Fonts com pilha de fallback. Scripts só inline. Não há fetch, iframe nem download.
- Celular: `.wrap` tem `padding-inline:16px`. Medido a 400 e a 1200 px, scrollWidth igual a clientWidth. Os `<pre>` e as tabelas rolam dentro de si.
- Proibidos: nenhum confirm, alert, prompt, innerHTML, style.display ou emoji. Toda visibilidade passa por `.hidden`.
- XSS: dado do db só entra por textContent, nó de texto ou setAttribute com chave fixa (`el()` L527, `sv()` L545). Não vi vetor.
- `claude.use`: chamado em `boot()` via setTimeout (L1141), com null tratado para db, comments e user, e try/catch. Só usa `use`.
- Coleções: `collection().orderBy().limit().onSnapshot(cb, errCb)` (L1072 a L1127) com assinaturas válidas. Cada coleção é assinada uma vez, só em boot. Não há assinatura dentro de render.
- Snapshots: usa `snap.docs[].id` e `.data()`, e `d.exists` antes de `d.data()` (L1083). Os mesmos códigos de erro do db.d.ts derrubam para "sem acesso" (L1064).
- `doc(id).update()`: um por clique, com flag `ocupado`, só quando o valor muda (L642). Nada grava no load, em loop ou em render. Com sucesso testado, os abertos caíram de 5 para 4.
- `openComposer({element})`: o resultado `opened` é ignorado sem retry. Com `unavailable`/`not_granted`/lifecycle, o botão some (L677), como diz o comments.d.ts.
- Permissão de escrita: usa `user.can("data.write")` com null = manter os botões, e a dica "só leitura" quando vem false. Fica melhor que o `canEdit()` do brief, porque pelo user.d.ts canEdit = admin.
- Dados: pendentes, frentes, custo, sessoes, cotas e memoria/atual, com os campos do brief. Status tratados: aberto, go, nao, feito e opcao:<id> (L607, L722).
- Estados: vazio, "carregando" e "sem acesso aos dados" em todas as seções, e a página renderiza antes de o dado chegar. Não houve pageerror nos 6 cenários.
