#!/usr/bin/env bash
# Verificacao automatica antes de encerrar uma sessao (hook de Stop em
# .claude/settings.json). Duas coisas, nessa ordem:
#   1. mexeu em codigo -> `npm test` e `npm run build`; vermelho, bloqueia.
#   2. mexeu em codigo e nao encostou no CLAUDE.md -> cobra a licao aprendida.
#
# Existe porque as duas regras dependiam de eu lembrar delas. Aqui quem executa
# e' o harness, nao a minha memoria.
set -uo pipefail

ENTRADA=$(cat 2>/dev/null || true)

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || echo .)}" || exit 0

CODIGO=(src scripts vite.config.ts tsconfig.json package.json package-lock.json index.html anne kelly)
DOC=("${VERIFICAR_DOC:-CLAUDE.md}")

# O harness marca stop_hook_active quando ja' bloqueou uma vez nesta parada.
# Sem isso, um bloqueio que eu nao consigo satisfazer viraria laco infinito.
ja_bloqueou() {
  printf '%s' "$ENTRADA" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{let a=false;try{a=!!JSON.parse(s).stop_hook_active}catch{}process.exit(a?0:1)})'
}

# block faz a sessao continuar, com o motivo em maos.
responder() {
  node -e 'process.stdout.write(JSON.stringify({decision:"block",reason:process.argv[1],systemMessage:process.argv[2]}))' "$1" "$2"
  exit 0
}
avisar() {
  node -e 'process.stdout.write(JSON.stringify({systemMessage:process.argv[1]}))' "$1"
  exit 0
}

# So' o que interessa do log: fora as linhas de teste que passaram.
resumo() { printf '%s' "$1" | grep -vE '^✓' | tail -25; }

# Mudou algum destes caminhos? (arquivo novo, alterado, em staging, ou commit
# ainda nao publicado). status --porcelain e' quem enxerga arquivo novo.
mudou_em() {
  [ -n "$(git status --porcelain -- "$@" 2>/dev/null)" ] && return 0
  # Sem ponto de comparacao (clone raso de um branch so'), assume que mudou:
  # gastar um build a toa custa menos que publicar com teste vermelho.
  local base
  base=$(git rev-parse --verify -q origin/HEAD || git rev-parse --verify -q origin/main) || return 0
  [ -n "$(git diff --name-only "$base"...HEAD -- "$@" 2>/dev/null)" ] && return 0
  return 1
}

mudou_em "${CODIGO[@]}" || exit 0

[ -d node_modules ] || avisar '⚠️ Não deu para verificar: node_modules não está instalado (rode npm ci).'

if ! saida=$(npm test 2>&1); then
  responder "O hook de Stop rodou \`npm test\` e ele FALHOU. Não encerre assim: conserte e rode de novo, ou explique ao Danilo o que quebrou e por que não dá para consertar agora.

$(resumo "$saida")" '❌ npm test falhou — a sessão não pode encerrar com teste vermelho.'
fi

if ! saida=$(npm run build 2>&1); then
  responder "O hook de Stop rodou \`npm run build\` e ele FALHOU. Não encerre assim: conserte e rode de novo, ou explique ao Danilo o que quebrou.

$(resumo "$saida")" '❌ npm run build falhou — a sessão não pode encerrar com build quebrado.'
fi

if ! mudou_em "${DOC[@]}"; then
  if ja_bloqueou; then
    avisar '📝 Sessão encerrada sem registrar lição — combinado é decidir isso de propósito, não por esquecimento.'
  fi
  responder "Esta sessão mexeu em código e não encostou no \`CLAUDE.md\`. O combinado com o Danilo (regras 16b e 16c) é que todo descuido corrigido e toda armadilha nova viram registro **no mesmo commit**, em dois lugares:
  · o \`CLAUDE.md\` deste projeto — a regra e o detalhe técnico daqui;
  · o \`CLAUDE.md\` de \`danilodme-rgb/instrucoes\` — só a regra, sem detalhe do projeto.

Decida agora, de propósito: registre a lição nos dois, ou diga em uma frase por que esta mudança não gerou lição nenhuma. Se decidir que não houve, é só encerrar de novo — este bloqueio não se repete." '📝 Código mudou e o CLAUDE.md não — houve lição para registrar?'
fi

avisar '✅ npm test e npm run build verdes, e o CLAUDE.md foi atualizado.'
