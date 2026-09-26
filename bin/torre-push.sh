#!/usr/bin/env bash
# Envia o que o coletor local mediu (sessões, cotas, memória) para a Torre.
# Lê ~/kb/.maestri/torre/dados.json (ou o caminho em TORRE_DADOS) e faz PUT em
# /api/sessoes, /api/cotas e /api/memoria.
#
# Ambiente: TORRE_URL (ex.: https://torre.vercel.app) e TORRE_AGENT_TOKEN.
# O token vai para o curl pela entrada padrão; nunca aparece na linha de comando nem na saída.
#
# Formato aceito do dados.json (cada chave é opcional):
#   { "sessoes": [ {...} ] ou { "<sessao_id>": {...} },
#     "cotas":   [ {...} ] ou { "<conta-balde>": {...} },
#     "memoria": {...} ou { "atual": {...} } }
# Campos que a API não conhece são descartados aqui (a API recusaria o lote inteiro).
# Requer: bash, curl, jq.
set -euo pipefail
set +x

DADOS="${TORRE_DADOS:-$HOME/kb/.maestri/torre/dados.json}"

falha() { echo "torre-push: $*" >&2; exit 1; }

command -v curl >/dev/null || falha "curl não encontrado"
command -v jq >/dev/null || falha "jq não encontrado"
[ -n "${TORRE_URL:-}" ] || falha "defina TORRE_URL"
[ -n "${TORRE_AGENT_TOKEN:-}" ] || falha "defina TORRE_AGENT_TOKEN"
[ -r "$DADOS" ] || falha "não achei $DADOS"
jq empty "$DADOS" 2>/dev/null || falha "$DADOS não é JSON válido"

URL="${TORRE_URL%/}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Objeto {id: doc} vira lista com o id no campo de chave; lista passa direto. Só colunas conhecidas.
jq '
  def lista($chave): if type == "object" then to_entries | map(.value + {($chave): (.value[$chave] // .key)}) else . end;
  (.sessoes // null) | if . == null then empty else lista("sessao_id")
    | map(with_entries(select(.key | IN("sessao_id","conta","projeto","modelo","papel","tokens_out",
        "cache_read","cache_create","tokens_in","turnos","ultimo_turno","alerta","atualizado_em")))) end
' "$DADOS" > "$TMP/sessoes.json"

jq '
  def lista($chave): if type == "object" then to_entries | map(.value + {($chave): (.value[$chave] // .key)}) else . end;
  (.cotas // null) | if . == null then empty else lista("id")
    | map(with_entries(select(.key | IN("id","conta","balde","usado_pct","renova_em","medido_em")))) end
' "$DADOS" > "$TMP/cotas.json"

jq '
  (.memoria // null) | if . == null then empty else (if has("atual") and (.atual | type) == "object" then .atual else . end)
    | with_entries(select(.key | IN("fatos_total","fatos_quebrados","por_projeto","ultimos",
        "gotchas_7d_por_projeto","medido_em"))) end
' "$DADOS" > "$TMP/memoria.json"

erros=0
enviar() { # enviar <rota> <arquivo>
  local rota="$1" arq="$2" codigo
  if [ ! -s "$arq" ] || [ "$(jq 'if type == "array" then length else 1 end' "$arq")" = "0" ]; then
    echo "torre-push: $rota: nada a enviar"
    return 0
  fi
  codigo="$(printf 'Authorization: Bearer %s\n' "$TORRE_AGENT_TOKEN" | curl -sS -o "$TMP/resp" -w '%{http_code}' \
    --max-time 30 -X PUT -H @- -H 'Content-Type: application/json' \
    --data-binary @"$arq" "$URL$rota")" || codigo="000"
  if [ "$codigo" -ge 200 ] 2>/dev/null && [ "$codigo" -lt 300 ]; then
    echo "torre-push: $rota: ok ($codigo)"
  else
    echo "torre-push: $rota: falhou ($codigo) $(head -c 300 "$TMP/resp" 2>/dev/null || true)" >&2
    erros=$((erros + 1))
  fi
}

enviar /api/sessoes "$TMP/sessoes.json"
enviar /api/cotas "$TMP/cotas.json"
enviar /api/memoria "$TMP/memoria.json"

[ "$erros" -eq 0 ] || exit 1
