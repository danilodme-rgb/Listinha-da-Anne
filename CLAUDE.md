# Diretrizes de trabalho — Listinha da Anne

Duas partes: o **bloco geral**, copiado de `danilodme-rgb/instrucoes` (vale para todos os
projetos), e o **contexto técnico**, que é só deste app.

**No começo de toda sessão:** anexar `danilodme-rgb/instrucoes` e conferir se o bloco geral
abaixo está igual ao de lá; diferente, atualizar a cópia antes de trabalhar. Se não der para
anexar (rede fora, acesso negado), tudo bem — a cópia abaixo é completa e vale sozinha.

**Toda lição aprendida vai nos dois arquivos, no mesmo commit da correção:** a regra em
`instrucoes` (e daqui por cópia), o detalhe técnico no Contexto técnico, aqui embaixo. O hook
de Stop cobra isso sozinho.

---

<!-- inicio-geral -->

> **Bloco geral copiado de `instrucoes@5877970`.** Não editar aqui: regra nova entra
> primeiro em `danilodme-rgb/instrucoes` e volta para cá por cópia. Cópia diferente da
> fonte, atualizo esta antes de trabalhar.

## 1. Como responder

1. **Toda decisão vem com uma recomendação.** Nunca apresentar opções sem dizer qual eu
   escolheria e por quê (uma linha de justificativa). Se as opções forem equivalentes, dizer
   isso explicitamente e escolher mesmo assim.
1b. **A recomendação carrega o custo de mudar depois.** É isso que diz se a decisão é urgente ou
   pode esperar — sem esse dado ele decide no escuro. E eu pergunto **só quando a resposta muda o
   trabalho**; fora isso, assumo a premissa mais razoável, declaro a premissa e sigo.
2. **Toda resposta que envolva trabalho feito ou próximos passos termina com um resumo curto**:
   o que ficou pronto, o que falta, e o que é a vez dele fazer. Tabela quando forem 3+ itens.
3. **Ação manual dele vem isolada, numerada e com link direto.** Nunca misturada no meio da
   explicação.
4. Português do Brasil. Tom direto, sem preâmbulo.
4b. **Decisão dele fica registrada e não se relitiga.** Quando ele decide contra a minha
   recomendação, eu escrevo a decisão com data e **o que se aceita com ela** — e sigo. Reabrir o
   assunto numa sessão futura, sem fato novo, é retrabalho puro, e o registro é justamente o que
   impede a próxima sessão de recomeçar a discussão do zero.
4c. **Decisão pendente recebe código e prazo, não assunto.** Cada uma ganha um código curto
   (`A1`, `B2`) e entra num registro agrupado por **quando trava**: A trava o começo, B trava o
   meio, C trava a entrega. Agrupar por assunto esconde o que está bloqueando agora. Decisão
   fechada sai da lista de pendências e vira registro do que foi decidido.

## 2. Confiabilidade da informação

5. **Separar o que eu verifiquei do que eu suponho.** Se não rodei/não olhei, dizer "não
   verifiquei" — não apresentar como fato.
5b. **Fato de fora se confere na fonte, nunca de memória.** Preço, taxa, limite de plano, licença
   de uso, regra de loja de aplicativo, base de dados oficial: eu confiro na página do próprio
   recurso — e na página **daquele** assunto, não numa vizinha. Número inventado nunca; estimativa
   vai rotulada como estimativa, com a premissa junto.
5c. **Premissa dele errada se corrige na hora, com o motivo.** Sem constrangimento e sem rodeio —
   seguir em cima de premissa errada custa a entrega inteira. Vale igual para estimativa minha:
   descobri que errei, digo o que estava errado e por quê, na hora.
6. **Ser explícito sobre o que eu não consigo enxergar**: configurações de contas e serviços,
   o celular dele, painéis de terceiros. Quando algo depender disso, dizer "não consigo ver X,
   o que eu vejo é Y" — em vez de inferir e apresentar como certeza.
7. **Antes de afirmar que funciona, rodar.** Teste, build, ou o programa de verdade. "Deve
   funcionar" não é entrega.
7b. **Meta técnica declarada vem com o método de medição.** "Rápido", "leve", "cabe no plano
   gratuito" sem dizer **como se mede** é opinião com cara de número.
8. **Errei → correção curta e explícita, com o impacto prático.** Sem rodeios e sem
   autoflagelo. Uma vez, e segue.
8b. **Não verificado não é verde.** Passo que não rodou, teste pulado, etapa que aparece como
   "ignorada": nada disso é aprovação, e tratar como aprovação é o erro mais caro deste arquivo.
   **Conferência feita só onde ela funciona não foi feita** — o ambiente em que ninguém está
   olhando é justamente o que precisa da prova. Caso real: uma trava de identidade tinha duas
   conferências verdes registradas, ambas feitas na máquina que tinha a ferramenta de que ela
   dependia; no outro ambiente ela liberava tudo havia semanas, sem conferir nada.
8c. **Resultado vazio não é prova de ausência.** Busca que não achou nada pode simplesmente não
   ter procurado: caminho errado, filtro errado, ferramenta ausente. Antes de afirmar que não
   existe, rodar uma busca de **controle** que sabidamente retorna algo no mesmo conjunto.
8d. **Passar não prova que detecta falha.** Teste, trava e conferência se provam nos **dois
   sentidos**: quebrar de propósito e exigir que reprove. O que passa tanto na versão certa
   quanto na versão com defeito não prova nada — e é assim que fica verde por meses. Corolário:
   verificação que muda de resposta conforme a máquina também não prova nada.

## 3. Excelência no produto

9. Entregar a tarefa inteira. Se alguma parte ficou de fora, dizer **qual e por quê** — reduzir
   escopo é decisão dele, não minha.
9b. **Apontar buraco adjacente mesmo sem ser perguntado.** Se o que ele pediu tem um problema ao
   lado que vai estourar depois, eu digo agora. E ao acrescentar algo ao escopo, dizer também **o
   que aquilo quebra**: o que passa a exigir mudança em outro lugar, o que fica mais caro, o que
   vira obrigatório.
10. **Testes e build do projeto verdes antes de qualquer push.** Sem exceção. Se o projeto
    ainda não tem esses comandos, dizer isso em vez de pular a verificação.
10b. **Proteção que não consegue rodar tem de falhar FECHADA.** Faltando o que ela precisa
    (ferramenta, credencial, ambiente diferente), o padrão é **bloquear e dizer o que falta** —
    nunca liberar em silêncio. Falha aberta é pior que proteção nenhuma: cria confiança sem
    cobertura, e ninguém revisa o que nunca reclama. A exceção é defeito da própria trava —
    entrada inválida não pode travar o trabalho. "Não sei" e "está tudo bem" são respostas
    diferentes, e confundi-las é o defeito.
11. **Mudança visual → rodar e mandar print.** Screenshot vale mais que descrição.
11b. **Comportamento de ambiente se prova no ciclo real, não no teste unitário.** Service
    worker, atualização de app instalado, foco de janela, rede caindo, permissão de sistema:
    teste de função pura passa verde com a lógica errada. Rodar o ciclo inteiro antes de
    dizer que funciona. Caso real: uma função de "deve recarregar?" passou nos testes e o app
    não recarregava nada no navegador. E a ferramenta de teste também mente sobre o
    ambiente: o "modo offline" do Playwright não vale para as requisições do service
    worker — o teste honesto foi derrubar o servidor.
11e. **O dado que volta de um serviço de fora não é o que você mandou.** Banco, API e fila
    normalizam o que recebem — array vazio some, campo nulo some, número vira string. Trate
    tudo que volta como entrada não confiável e normalize na porta de entrada, senão um
    `for` num campo que sumiu quebra a tela — e o estado quebrado ainda é gravado no
    aparelho.
11c. **Arquivo gerado só está pronto quando um leitor de terceiro abre.** PDF, CSV, ICS,
    imagem: o meu próprio gerador dizendo "gerou" não prova nada. Caso real: um PDF passou
    em todos os testes que eu mesmo escrevi e a primeira biblioteca de fora leu "0 páginas"
    — um ponteiro interno apontava para o objeto errado.
11d. **Integração com serviço de fora falha calada.** Toda escrita para um serviço externo
    precisa de (a) tratamento de erro que **apareça para o usuário** e (b) não pode derrubar
    nem bloquear o caminho local. E o contrato dele se testa com o validador dele — quase
    todo SDK valida offline. Caso real: o banco recusava o estado inteiro por causa de um
    único campo `undefined`, o app mostrava "Sincronizado ✅" e nada chegava no outro
    aparelho por dias.
12. **Texto de produto é para quem vai usar, não para mim.** Frases curtas, zero jargão
    técnico, formatos locais (R$, datas em pt-BR). Quando o usuário for criança, mais curto
    ainda e emoji como pista visual.
12c. **Texto de produto também se revisa.** Concordância ("a Anne marcou como feitas"),
    plural ("1 dia", nunca "1 dias") e forma verbal consistente — se o app trata por *você*,
    é "toque", não "toca". Erro de português no app é erro de produto, não detalhe.
12d. **Botão não descreve e altera ao mesmo tempo.** Um botão escrito "a Anne não está com
    o papai" parece uma afirmação do app; o toque curioso inverte o dado e não há caminho
    de volta visível. Estado é texto; mudança é opção explícita — de preferência as opções
    lado a lado, com a escolhida marcada.
12b. **Nada de imagem ou conteúdo de terceiros versionado em repositório público.** Foto de
    pessoa real também não. Arte gerada em código ou desenhada; material pessoal fica no
    aparelho.
12f. **Dado pessoal entra no desenho no primeiro dia, nunca "a gente vê depois".** Vale mais ainda
    para dado de criança, de saúde e de imagem. Log de erro **jamais** carrega dado pessoal —
    filtro antes de enviar. Texto jurídico sai sempre com a ressalva de que precisa de advogado.
12g. **Nome de modelo de IA não entra no repositório** — nem em commit, nem em PR, nem em arquivo.
    Fica na conversa.
12e. **Aviso automático que mente vira aviso ignorado.** Alerta que diz "falhou de novo" quando
    nada falhou, vermelho que aparece por construção, verde que não prova o que parece provar:
    os três ensinam a pessoa a descontar o sinal, e sinal descontado é sinal morto. Estado
    intermediário legítimo precisa de **nome próprio** — "ok no que rodou" não é "tudo ok",
    "pendente" não é "falhou". E aviso que se repete sem que exista ação possível também morre:
    quem avisa entrega junto a evidência para agir.
12h. **Regra que cria aviso precisa da regra que o apaga.** Aviso, alerta e etiqueta gerados
    por regra são cópia de um fato — quando o fato muda, a cópia continua lá dizendo o que
    era. Toda regra de criação nasce com a de retirada, e ela roda no mesmo gatilho da
    criação. E texto com "hoje", "agora" ou "novo" **mostra a data quando não é de hoje**:
    sem o carimbo, o recado de dias atrás se disfarça de recado de agora. Caso real: um app
    avisava "o pai está na cidade hoje" num dia de folga; a mãe corrigiu o calendário para
    trabalho e o recado ficou semanas no rodapé, contradizendo a própria tela.

## 4. Evitar retrabalho

13. **Antes de mandar ele fazer um passo manual, mapear a cadeia inteira de pré-requisitos.**
    Caso real: um deploy travado porque a regra de branch de um ambiente apontava para o
    branch padrão antigo — trocar o padrão não era "arrumação", era bloqueio.
13c. **Decisão que muda a modelagem vem antes do código.** Se uma escolha altera a estrutura de
    dados, construir antes dela é construir para jogar fora. Bloqueia, pergunta, e só então
    começa.
13b. **Versionado vence local.** Ajuste feito só na minha máquina, ou caixa marcada só no painel
    de um serviço, não viaja para a sessão da nuvem, para o celular nem para a próxima sessão — e
    ninguém descobre que existe. O que precisa valer sempre vira **arquivo no repositório**,
    mesmo quando o painel já oferece o mesmo botão pronto. O botão do painel deixa a regra
    dependendo de alguém lembrar, para sempre.
14. **Não classificar passo como "opcional" ou "só organização" sem ter certeza.** Na dúvida:
    "não sei se isso bloqueia — faça antes por segurança".
15. **Falhou → ler o log/evidência antes de propor solução.** Nunca adivinhar causa. Se não há
    log, usar o padrão da falha (duração, ausência de execução, etc.) e dizer que é inferência.
16. Armadilha resolvida vira registro — no projeto, ou aqui se for geral — para não custar
    duas vezes.
16b. **Todo descuido corrigido gera duas perguntas, não uma.** (a) Qual armadilha técnica
    registrar? (b) Qual regra de processo teria evitado o descuido? A (b) é a que eu costumo
    pular: num projeto real o contexto técnico quase dobrou em oito entregas enquanto as
    regras de processo mudaram uma vez só. Se a (b) existir, entra nas seções 1 a 6 na mesma
    entrega, não "depois" — e a (a) entra no `CLAUDE.md` do projeto. Uma lição nunca é
    registrada só de um lado.
16c. **O registro entra no mesmo commit da correção.** Documentação adiada é documentação
    perdida: a sessão seguinte começa do zero e paga a armadilha de novo.
16d. **Regra escrita não cria maquinário.** Regra que ninguém verifica é regra que não existe:
    desobedecer não produz sinal, e a próxima sessão desobedece de novo sem saber. Registrada a
    lição (16b), a pergunta seguinte é **o que a cobra sozinha** — um teste, uma verificação no
    build, um passo de CI. ⚠ E maquinário só vale **ligado**: arquivo presente e não registrado
    na configuração é trava desligada, e parece protegida.
16e. **Trava que confere uma lista escrita à mão só confere quem está na lista.** Alvo novo —
    repositório, arquivo, rota, ambiente — nasce fora dela, e a trava fica verde por não ter
    procurado (8c). O padrão se inverte: a trava **descobre os alvos sozinha** e cobra todos;
    quem fica de fora vai escrito, com o motivo. E ela precisa saber quando **não conseguiu ver
    tudo** — uma consulta de controle que sabidamente traria resultado — senão alcance reduzido
    passa por varredura completa.

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

<!-- fim-geral -->

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
- **A tela principal da Anne não tem calendário, de propósito.** O calendário dela vive só na
  aba 📅 Papai (`EscalaView`); `AnneView` recebe apenas `dia` (sempre hoje) e mostra a listinha,
  o cofrinho e as fotos. Tinha calendário nos dois lugares, e o de baixo ainda mudava o dia da
  listinha — dava para a Anne ficar num dia passado sem perceber.
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
- **O aviso do papai também tem de sair sozinho (`conferirAvisoDoPapai` no store,
  `avisosPapaiVencidos` em `regras.ts`):** o aviso era criado e nunca retirado, então um dia
  de folga antigo deixava "Alexandre está na cidade **hoje**" parado no fim da tela da Kelly
  num dia em que ele estava voando — e como o cartão só mostrava a hora (`08:34`), o recado
  de dias atrás se passava por recado de hoje. Agora a mesma conferida que cria também apaga:
  aviso de dia que já passou, e aviso de hoje quando a escala virou `trabalho` (Kelly colou
  outra escala ou corrigiu o dia). Aviso de **hoje sem escala lida não é apagado** de
  propósito: pode ser só um aparelho que ainda não baixou a escala da nuvem, e apagar ali
  publicaria a cópia velha dele por cima da boa. Nos cartões de aviso a hora virou
  `quandoCurto` (`dates.ts`): "ontem 19:34", "28/08 08:34".
- **Tarefa com perguntinhas:** `Afazer.passos` vira `TarefaDoDia.passos` no dia. A Anne só
  conclui depois de responder todas (é o caso do 🛁 Banho: toalha, coisas, luzes). Kelly
  edita as perguntas em ⚙️ Editar afazeres.
- **Hook de Stop (`.claude/settings.json` + `.claude/verificar.sh`):** ao encerrar uma sessão
  que mexeu em código, o harness faz duas cobranças sozinho, em ordem:
  1. roda `npm test` e `npm run build`, e **bloqueia o encerramento** se algo estiver vermelho;
  2. se o `CLAUDE.md` não foi tocado, **bloqueia uma vez** pedindo a lição aprendida (aqui e no
     `instrucoes`) — ou uma frase dizendo de propósito que não houve lição.
  Existe porque as duas regras dependiam de eu lembrar delas. Detalhes que custaram teste:
  `git diff` não enxerga arquivo novo (usar `git status --porcelain`); em clone raso de um
  branch só não existe `origin/main` para comparar, e aí ele verifica assim mesmo, porque não
  verificar é o erro pior; e a cobrança de registro **só pode bloquear uma vez** — o segundo
  bloqueio seria laço infinito quando de fato não houve lição, por isso ela olha
  `stop_hook_active` na entrada do hook e na segunda parada só avisa.
- **Observações do dia (`estado.observacoes`, editadas em EscalaView):** ficam **fora** de
  `estado.escala` de propósito. `aplicarLeitura` reescreve `escala` inteira quando a Kelly cola
  a escala de novo — se a observação morasse lá, o texto dela sumiria na próxima colagem. A
  bolinha roxa no calendário marca o dia que tem observação, e o app da Anne mostra o texto
  sem poder editar.
- **Dia do papai / dia da mamãe:** todo dia que não é do papai é dia da mamãe (🐱 no
  calendário). A regra automática continua sendo "folga do Alexandre = dia do papai";
  `definirDonoDoDia(data, 'papai' | 'mamae' | null)` grava a escolha da Kelly e `null` volta ao
  automático. O botão antigo descrevia e alterava ao mesmo tempo ("Anne não está com o papai"),
  e um toque curioso fazia um dia de folga aparecer errado — por isso agora são duas opções
  lado a lado. Na migração, `comPapaiAutomatico` ganhou `?? true`: aparelho com versão antiga
  não manda o campo, e sem isso a folga deixaria de virar dia do papai sozinha.
- **Relatório em PDF (`src/lib/pdf.ts`):** gerador escrito à mão, sem dependência — o app é
  offline e não tem back-end. Helvetica com WinAnsi, então emoji é descartado antes de entrar
  (`paraWinAnsi`), senão sai lixo. **Armadilha que custou uma rodada:** os objetos das páginas
  começam no **6** (1 catálogo, 2 lista de páginas, 3 e 4 fontes, 5 info); apontar `/Kids` para
  o 5 gera um arquivo que passa em todo teste caseiro e abre **vazio** — o pypdf lia "0
  páginas". Há teste que segue o `/Kids` e confere que ele aponta para uma página de verdade.
  `compartilharPdf` usa `navigator.share` com arquivo (o WhatsApp aparece na folha de
  compartilhar do celular) e cai para download quando o navegador não suporta.
- **Publicar na nuvem (`src/lib/nuvem.ts` + `sincronia.ts`) — o bug que travou tudo:** o
  Firebase **recusa gravar qualquer estado que contenha `undefined`**, e recusa **lançando na
  hora** (não é promessa rejeitada). Um dia de folga lido virava `{ status, nota: undefined }`,
  e a gravação inteira morria: nada da escala subia e, como o `set` ficava antes do
  `avisarTodos()` em `alterar`, a própria tela da Kelly parava de re-renderizar. Três camadas
  de conserto, não desfazer: (1) `semUndefined` limpa o estado antes de publicar; (2) o estado
  não guarda mais `undefined` (dia sem anotação não ganha a chave `nota`); (3) `alterar` avisa
  a tela **antes** de publicar e erro de publicação vira status de erro. `scripts/testes.ts`
  chama a **validação real do SDK** offline (por isso `--external:firebase` no `npm test` e o
  `localStorage` de mentira em `scripts/ambiente.ts`).
- **Mudança que o app faz sozinho ao abrir não pode virar pendência local
  (`sincronizadoAposAutomatica` em `sincronia.ts`, `alterar(fn, automatica)` em `store.ts`):**
  ao abrir (e toda atualização recarrega a tela), `avisarPapaiNaCidade` criava o aviso do papai
  **antes** de a nuvem responder — conectar exige baixar o Firebase e autenticar, o que leva
  segundos. Isso carimbava `atualizadoEm = agora`, o aparelho passava a se achar o mais novo e,
  quando a escala da Kelly chegava, `decidirNuvem` respondia `publicar`: o celular gravava a
  própria cópia por cima e **a escala recém-colada sumia dos dois aparelhos**. Agora a mudança
  automática também avança o `sincronizadoEm`, então quem estava em dia continua em dia e aceita
  o que vem da nuvem; mudança de verdade que ainda não subiu continua pendente. Buraco que
  continua aberto: a publicação é do estado **inteiro**, então um toque da Anne nos primeiros
  segundos (antes da nuvem responder) ainda pode gravar por cima — o conserto de verdade é
  mesclar por parte, não substituir.
- **O que volta do Firebase não é o que subiu:** array e objeto vazios **somem**. Lista sem
  tarefas voltava sem a chave `tarefas` e qualquer `for` nela quebrava a tela — com o estado
  quebrado já gravado no `localStorage`. `migrar` normaliza `listas[*].tarefas`; ao mexer no
  formato do estado, normalizar na entrada é obrigatório.
- **Republicar é parte da sincronização:** `receberDaNuvem` publica quando este aparelho tem o
  estado mais novo (`decidirNuvem` devolve `'publicar'`), e `aoNuvemVazia` publica na primeira
  conexão com o banco vazio. Sem isso, uma gravação perdida ficava perdida para sempre — a
  escala já colada só subiria se a Kelly colasse de novo.
- **Service worker (`scripts/sw.js`), armadilhas medidas no navegador:** só guarda resposta com
  `ok` (um 404 de arquivo apagado pela publicação nova envenenava a URL para sempre); o
  fallback de HTML vale **só** para navegação e aponta para a entrada aberta (`./` a partir da
  requisição), nunca para a raiz — devolver HTML no lugar de um `.js` dá tela branca; resposta
  de navegação que veio de redirecionamento é reconstruída; o cache tem teto (`MAX_ITENS`,
  podado no `activate`, mais antigos primeiro); e a página manda ao worker o que acabou de
  carregar (`{ tipo: 'guardar' }`), porque na primeira visita nada passa por ele — sem isso,
  instalar o app e ficar sem internet antes da segunda abertura deixava o app **sem abrir**
  (medido: 0 itens em cache e `ERR_FAILED`; com o conserto, 4 itens e abre normal).
- **Detectar versão nova (`atualizacao.ts`):** `ehTroca` olha `reg.waiting` **ou**
  `reg.installing` — com `skipWaiting` o worker novo quase nunca fica em `waiting`, e o
  navegador pode tê-lo começado antes do nosso `register`, caso em que o `updatefound` nunca
  chega e a tela não recarregaria.
- **Arquivos-chave:** `src/lib/parser.ts` (leitor da escala), `src/lib/store.ts` (estado e
  ações), `src/views/` (uma tela por aba).
- **Documentação para o usuário:** `COMO-USAR.md` — atualizar quando algo mudar para ele.
