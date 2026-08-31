# Diretrizes de trabalho — Listinha da Anne

**Antes de começar, anexe `danilodme-rgb/instrucoes` e leia o `CLAUDE.md` dele.** São as
diretrizes gerais combinadas com o Danilo — como responder, o que verificar antes de afirmar,
o que registrar — e valem aqui. Elas moram lá porque valem para todos os projetos; este
arquivo guarda só o que é específico deste app.

Regra geral nova vai para o `instrucoes`, não para cá. Armadilha técnica deste app vai para o
Contexto técnico, aqui embaixo. As duas entram no mesmo commit da correção.

## Se não der para anexar (rede fora, acesso negado), o mínimo é este

1. Toda decisão vem com uma recomendação minha e o porquê.
2. Toda resposta termina com resumo: o que ficou pronto, o que falta, o que é a vez dele
   fazer. Ação manual dele vem numerada e com link direto.
3. Separar o que eu verifiquei do que eu suponho. Antes de afirmar que funciona, rodar.
4. `npm test` e `npm run build` verdes antes de qualquer push — e comportamento de navegador
   se prova no ciclo real, não no teste unitário.
5. Entregar a tarefa inteira; o que ficou de fora, dizer qual e por quê.
6. Descuido corrigido vira registro na mesma entrega.

---

# Contexto técnico do projeto

Para não redescobrir a cada sessão.

- **App:** PWA React 18 + TypeScript + Vite. Sem back-end próprio.
- **Comandos:** `npm run dev` · `npm test` (`scripts/testes.ts`: leitor de escala + regra de
  merge da sincronização) · `npm run build`
- **Publicação:** GitHub Pages via Actions (`.github/workflows/deploy.yml`), dispara em push
  para `main`. Branch padrão é `main`. URL:
  https://danilodme-rgb.github.io/Listinha-da-Anne/
- **Pegadinha do Pages (custou 4 tentativas):** ao ligar o Pages, o GitHub cria o environment
  `github-pages` travado no branch que era padrão *naquele momento*. Se o branch padrão mudar
  depois, a regra continua apontando para o antigo e todo deploy é recusado **antes de começar**.
  Conserto: Settings → Environments → github-pages → Deployment branches → **No restriction**.
  Como distinguir as duas falhas pelo sintoma:
  - job `deploy` com runner + `404 Ensure GitHub Pages has been enabled` → Pages não está ligado;
  - job `deploy` **sem runner, sem log, 1-2s**, com `build` verde → barrado pelo environment.
- **Não consigo abrir o site publicado daqui:** o proxy do ambiente bloqueia `github.io`
  (`CONNECT tunnel failed, 403`). Para confirmar deploy, checar o job `deploy` no Actions
  (precisa ter runner e o passo `deploy-pages` verde), não tentar `curl` na URL.
- **Estado:** `localStorage` (offline-first), com sincronização opcional entre celulares via
  Firebase Realtime Database, configurada em Ajustes (não versionada).
- **Fotos da Anne (`src/lib/fotos.ts`):** ficam em IndexedDB, **de propósito fora do estado
  que sincroniza** — são cópia pessoal do aparelho, não sobem para o Firebase nem para o
  repositório. Ao mexer nisso, manter essa separação: o repositório é público.
- **Ícone do app da Anne:** sai de `scripts/anne-retrato.png` — desenho feito por IA a partir
  de uma foto, que não a identifica. O Danilo decidiu versionar esse arquivo; é a exceção
  conhecida à regra 12b, que segue valendo para foto de pessoa real e imagem de terceiro.
  `python3 scripts/gen_icons.py anne` reduz o arquivo para 192/512/maskable (leitor de PNG e
  redução por média de área estão no próprio script, sem dependência externa). Os ícones do
  endereço principal e da Kelly continuam desenhados em código, no mesmo arquivo.
- **Atualização automática dos três apps (`src/lib/atualizacao.ts` + `scripts/sw.js`):** o
  celular guarda o app instalado, então publicar no Pages não bastava — sem isso ele seguia
  abrindo a versão antiga por dias. Três armadilhas já resolvidas, não desfazer:
  1. **`sw.js` precisa mudar de bytes a cada build.** Ele mora em `scripts/sw.js` (fora de
     `public/`) e o plugin `sw-carimbado` do `vite.config.ts` troca `__VERSAO__` pelo carimbo
     do build (`GITHUB_SHA` no CI, data-hora local fora dele). Arquivo idêntico = navegador
     nunca percebe versão nova.
  2. **`controllerchange` também dispara na primeira instalação.** Recarregar ali seria susto
     sem motivo; por isso só recarrega quando `updatefound` chegou com `registration.active`
     já existindo (`deveRecarregar`, com teste em `scripts/testes.ts`).
  3. **O Pages guarda o HTML por ~10 minutos.** Abertura de página é buscada com
     `cache: 'reload'`: HTML velho aponta para `.js` que a publicação nova já apagou (tela
     branca). O nome do cache é fixo de propósito — cache novo e vazio a cada versão deixaria
     o app sem nada para mostrar se a internet caísse logo depois de atualizar.
  Recarregar é seguro porque `alterar` (store.ts) grava no `localStorage` na hora. Ajustes
  mostra o carimbo da versão e tem o botão "Procurar novidade" (só no app da Kelly).
- **Perfis:** `kelly` (monta e confere) e `anne` (executa). PIN opcional protege o modo mamãe.
- **O app da Anne não tem Ajustes, de propósito.** Ela liga a sincronização abrindo um link
  `.../anne/#sync=<config em base64>`, gerado em Ajustes no app da Kelly (`linkDeSincronizacao`
  / `aplicarLinkDeSincronizacao` em `src/lib/nuvem.ts`). Ao mexer em Ajustes, lembrar que tudo
  que ficar só lá é inalcançável no celular dela — foi assim que os avisos e a sincronização
  ficaram impossíveis de ligar para a Anne.
- **Leitor da escala (`src/lib/parser.ts`) tem dois modos.** `lerEscalaDeVoo` tenta primeiro a
  tabela "Minha Escala" da companhia (linhas com `03 SET. 2026 11:30` e códigos `FR`, `AD####`,
  `RHC05`, `REX`, `Layover`); se não casar, cai no leitor de texto livre. Regras que custaram
  para acertar: `FR` é a única folga, atividade de trabalho no dia ganha da folga que atravessa
  a madrugada, atividade que termina 00:00 não pinta o dia seguinte, e dia ausente da tabela
  fica em branco em vez de virar folga por dedução.
- **O PDF que ele manda pode ser só imagem.** O `escala_alexandre.pdf` de set/2026 era um JPEG
  de 1275×8852 dentro do PDF, sem camada de texto — não dá para ler no app (exigiria OCR
  offline). O caminho é copiar o texto da tabela no sistema dele.
- **Merge da nuvem (`src/lib/sincronia.ts`):** aparelho sem mudança local pendente sempre
  aceita o que vem da nuvem, sem comparar relógios. Comparar só `atualizadoEm` fazia um celular
  com a hora adiantada ignorar para sempre o que a Kelly mudava.
- **Três entradas (build multi-página do Vite):** `/` (com troca de perfil), `/anne/` e
  `/kelly/`. Cada uma tem seu HTML, manifest, ícone e `main-*.tsx`, que passa `perfilFixo`
  para o `App`. Com `perfilFixo` some o botão de troca, as abas são só as do perfil, e o
  link da Kelly pede o PIN na abertura.
- **Relatório "papai em casa" (`src/lib/relatorio.ts`):** porcentagem de dias de folga, só no
  modo mamãe (cartão dentro de `EscalaView`, atrás de `podeEditar`). O denominador é "dias com
  escala lida", não o mês inteiro — mês lido pela metade não pode virar "ele sumiu".
- **Fluxo do dinheiro:** tarefa feita → aguardando conferência → Kelly confere → entra no
  cofrinho → o saldo baixa por "Registrar pagamento" (Kelly) ou pelo botão "Já recebi meu
  dinheiro!" (Anne, que avisa a Kelly do valor).
- **Avisos combinados (`src/lib/regras.ts`):** Anne conclui tarefa → Kelly recebe tarefa +
  valor a pagar; escala com folga do Alexandre → as duas são avisadas de que ele está na
  cidade (id do aviso é fixo por dia, `av_papai_<perfil>_<data>`, senão os dois celulares
  duplicam o recado ao sincronizar).
- **Tarefa com perguntinhas:** `Afazer.passos` vira `TarefaDoDia.passos` no dia. A Anne só
  conclui depois de responder todas (é o caso do 🛁 Banho: toalha, coisas, luzes). Kelly
  edita as perguntas em ⚙️ Editar afazeres.
- **Hook de Stop (`.claude/settings.json` + `.claude/verificar.sh`):** ao encerrar uma sessão
  que mexeu em código, o harness roda `npm test` e `npm run build` sozinho e **bloqueia o
  encerramento** se algo estiver vermelho. Existe porque a regra dos testes verdes dependia de
  eu lembrar dela. Detalhes que custaram teste: `git diff` não enxerga arquivo novo (usar
  `git status --porcelain`), e em clone raso de um branch só não existe `origin/main` para
  comparar — nesse caso ele verifica assim mesmo, porque não verificar é o erro pior.
- **Arquivos-chave:** `src/lib/parser.ts` (leitor da escala), `src/lib/store.ts` (estado e
  ações), `src/views/` (uma tela por aba).
- **Documentação para o usuário:** `COMO-USAR.md` — atualizar quando algo mudar para ele.
