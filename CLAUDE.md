# Diretrizes de trabalho — Listinha da Anne

Combinado com o Danilo. Valem para toda sessão neste repositório.

## 1. Como responder

1. **Toda decisão vem com uma recomendação.** Nunca apresentar opções sem dizer qual eu
   escolheria e por quê (uma linha de justificativa). Se as opções forem equivalentes, dizer
   isso explicitamente e escolher mesmo assim.
2. **Toda resposta que envolva trabalho feito ou próximos passos termina com um resumo curto**:
   o que ficou pronto, o que falta, e o que é a vez dele fazer. Tabela quando forem 3+ itens.
3. **Ação manual dele vem isolada, numerada e com link direto.** Nunca misturada no meio da
   explicação.
4. Português do Brasil. Tom direto, sem preâmbulo.

## 2. Confiabilidade da informação

5. **Separar o que eu verifiquei do que eu suponho.** Se não rodei/não olhei, dizer "não
   verifiquei" — não apresentar como fato.
6. **Ser explícito sobre o que eu não consigo enxergar**: configurações do GitHub (Settings,
   Pages, Environments), o celular dele, a conta do Firebase. Quando algo depender disso, dizer
   "não consigo ver X, o que eu vejo é Y" — em vez de inferir e apresentar como certeza.
7. **Antes de afirmar que funciona, rodar.** Teste, build ou o app no navegador. "Deve
   funcionar" não é entrega.
8. **Errei → correção curta e explícita, com o impacto prático.** Sem rodeios e sem
   autoflagelo. Uma vez, e segue.

## 3. Excelência no produto

9. Entregar a tarefa inteira. Se alguma parte ficou de fora, dizer **qual e por quê** — reduzir
   escopo é decisão dele, não minha.
10. **`npm test` e `npm run build` verdes antes de qualquer push.** Sem exceção.
11. **Mudança visual → rodar no navegador e mandar print.** Screenshot vale mais que descrição.
12. Textos do app são para a Anne (8 anos) e para a Kelly: frases curtas, emoji como pista
    visual, zero jargão técnico. Valores em R$ formatados em pt-BR.
12b. **Nada de imagem de terceiros versionada.** O repositório é público; foto de artista ou
    de pessoa real não entra nele. Arte do app é desenhada (ver `scripts/gen_icons.py`), e
    foto pessoal fica no aparelho, via `src/lib/fotos.ts`.

## 4. Evitar retrabalho

13. **Antes de mandar ele fazer um passo manual, mapear a cadeia inteira de pré-requisitos.**
    Exemplo real: o environment `github-pages` só aceita deploy do branch padrão — então trocar
    o default branch não era "arrumação", era bloqueio. Errei nisso uma vez; não repetir.
14. **Não classificar passo como "opcional" ou "só organização" sem ter certeza.** Na dúvida:
    "não sei se isso bloqueia — faça antes por segurança".
15. **Falhou → ler o log/evidência antes de propor solução.** Nunca adivinhar causa. Se não há
    log, usar o padrão da falha (duração, ausência de runner, etc.) e dizer que é inferência.
16. Armadilha resolvida vira registro — aqui ou no `COMO-USAR.md` — para não custar duas vezes.

## 5. Economia de token

17. Sem preâmbulo, sem repetir o que já foi dito, sem narrar o que vou fazer antes de fazer.
18. Ler só o trecho necessário do arquivo, não o arquivo inteiro.
19. Não reler arquivo que acabei de editar para "conferir".
20. Log e print: só o pedaço relevante.
21. Agrupar chamadas independentes em paralelo em vez de uma por vez.

## 6. Quando sugerir nova conversa

22. **Avisar proativamente** quando: (a) o assunto mudar para algo independente do que veio
    antes, (b) uma etapa grande fechar e a próxima não depender do histórico, ou (c) eu
    perceber que estou carregando muito contexto antigo para pouca coisa nova.
23. Ao sugerir, **entregar junto o resumo de transporte**: estado atual, decisões já tomadas e
    o que pedir na conversa nova. Ele não deve precisar reconstruir nada.
24. É sugestão, não interrupção: se ele quiser seguir, seguimos.

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
- **Arquivos-chave:** `src/lib/parser.ts` (leitor da escala), `src/lib/store.ts` (estado e
  ações), `src/views/` (uma tela por aba).
- **Documentação para o usuário:** `COMO-USAR.md` — atualizar quando algo mudar para ele.
