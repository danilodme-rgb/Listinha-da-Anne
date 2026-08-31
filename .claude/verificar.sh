#!/usr/bin/env bash
# Verificacao automatica antes de encerrar uma sessao (hook de Stop em
# .claude/settings.json). Roda `npm test` e `npm run build` quando a sessao
# mexeu em codigo e bloqueia o encerramento se algo estiver vermelho.
#
# Existe porque a regra "testes verdes antes de qualquer push" dependia de eu
# lembrar dela. Aqui quem executa e' o harness, nao a minha memoria.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || echo .)}" || exit 0

CODIGO=(src scripts vite.config.ts tsconfig.json package.json package-lock.json index.html anne kelly)

# Emite a resposta do hook: block faz a sessao continuar com o motivo em maos.
responder() {
  node -e 'process.stdout.write(JSON.stringify({decision:"block",reason:process.argv[1],systemMessage:process.argv[2]}))' "$1" "$2"
  exit 0
}
# So' o que interessa do log: fora as linhas de teste que passaram.
resumo() { printf '%s' "$1" | grep -vE '^✓' | tail -25; }
avisar() {
  node -e 'process.stdout.write(JSON.stringify({systemMessage:process.argv[1]}))' "$1"
  exit 0
}

# Mexeu em codigo? (mudanca solta, na area de staging, ou commit ainda nao
# publicado). Sem mexer, nao gasta tempo rodando nada.
mexeu_em_codigo() {
  # status --porcelain cobre arquivo novo, alterado e na area de staging
  [ -n "$(git status --porcelain -- "${CODIGO[@]}" 2>/dev/null)" ] && return 0
  # Sem ponto de comparacao (clone raso de um branch so'), verifica assim mesmo:
  # gastar um build a toa custa menos que publicar com teste vermelho.
  local base
  base=$(git rev-parse --verify -q origin/HEAD || git rev-parse --verify -q origin/main) || return 0
  [ -n "$(git diff --name-only "$base"...HEAD -- "${CODIGO[@]}" 2>/dev/null)" ] && return 0
  return 1
}

mexeu_em_codigo || exit 0

[ -d node_modules ] || avisar '⚠️ Não deu para verificar: node_modules não está instalado (rode npm ci).'

if ! saida=$(npm test 2>&1); then
  responder "O hook de Stop rodou \`npm test\` e ele FALHOU. Não encerre assim: conserte e rode de novo, ou explique ao Danilo o que quebrou e por que não dá para consertar agora.

$(resumo "$saida")" '❌ npm test falhou — a sessão não pode encerrar com teste vermelho.'
fi

if ! saida=$(npm run build 2>&1); then
  responder "O hook de Stop rodou \`npm run build\` e ele FALHOU. Não encerre assim: conserte e rode de novo, ou explique ao Danilo o que quebrou.

$(resumo "$saida")" '❌ npm run build falhou — a sessão não pode encerrar com build quebrado.'
fi

avisar '✅ npm test e npm run build verdes.'
