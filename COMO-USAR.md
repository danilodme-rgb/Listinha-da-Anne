# Guia da empreitada 💜

Este arquivo tem duas partes:

- **Parte 1 — Colocar no ar e usar** (o que fazer agora, na ordem).
- **Parte 2 — Como me guiar daqui pra frente** (como pedir mudanças para eu acertar de primeira).

---

# Parte 1 — Colocar no ar e usar

## Passo 1 · Ver funcionando no computador (5 minutos)

```bash
npm install
npm run dev
```

Abra o endereço que aparecer. No topo tem o botão **Anne / Mamãe** para você alternar entre
os dois pontos de vista e testar o ciclo completo.

## Passo 2 · Publicar na internet (para abrir no celular)

O projeto já vem com a publicação automática configurada.

1. No GitHub, vá em **Settings → Pages**.
2. Em *Source*, escolha **GitHub Actions**.
3. Abra o Pull Request do branch da vez e faça o merge para o `main`. **É o merge que publica**
   — enquanto o trabalho estiver só no branch, o site no ar continua com a versão antiga.
4. Em **Actions** acompanhe o job "Publicar no GitHub Pages" (leva ~1 minuto).
5. Os endereços ficam disponíveis (veja a tabela do Passo 3).

> **Armadilha que já custou caro:** o environment `github-pages` guarda o branch que era
> padrão quando o Pages foi ligado. Se o padrão mudar depois, o deploy é recusado sem log.
> Conserto: Settings → Environments → github-pages → Deployment branches → **No restriction**.

## Passo 3 · Instalar no celular como aplicativo

Há **um link para cada uma**. Cada um instala como um app separado, com ícone e nome próprios.

| Quem | Link | O que aparece |
|---|---|---|
| **Anne** | https://danilodme-rgb.github.io/Listinha-da-Anne/anne/ | 🌟 Minha listinha · 📅 Papai |
| **Kelly** | https://danilodme-rgb.github.io/Listinha-da-Anne/kelly/ | 📅 Escala · 💜 Mamãe · ⚙️ Ajustes |
| Você (testes) | https://danilodme-rgb.github.io/Listinha-da-Anne/ | Tudo, com o botão de trocar de perfil |

No link da Anne **não existe** o botão da mamãe: ela não consegue conferir as próprias
tarefas nem mexer nos valores. No link da Kelly, se houver PIN cadastrado, ele é pedido
na abertura.

**Como instalar (mande o link certo para cada celular):**

- **iPhone / iPad (tem que ser no Safari):** abra o link → botão **Compartilhar** (quadrado
  com seta para cima) → **Adicionar à Tela de Início** → Adicionar.
- **Android (Chrome):** abra o link → menu ⋮ → **Instalar aplicativo**.

Depois disso ele abre em tela cheia, com ícone próprio, sem a barra do navegador, e funciona
sem internet. **Não é um app da App Store** — publicar lá exigiria um Mac, o Xcode e a conta
de desenvolvedor da Apple (US$ 99/ano). Na prática, para vocês, a diferença é só que ele não
aparece na busca da App Store; na tela de início ele se comporta como qualquer outro app.

> **Detalhe do iPhone:** os avisos só funcionam se o app tiver sido **adicionado à tela de
> início** e o iOS for 16.4 ou mais novo. Abrindo pelo Safari, sem instalar, o iPhone não
> mostra aviso nenhum.

## Passo 4 · Ligar a sincronização entre os celulares ⚠️ importante

**Sem este passo, cada celular tem a própria listinha** — o que a Kelly montar não chega na
Anne. A sincronização é gratuita e usa o Firebase do Google.

1. Acesse <https://console.firebase.google.com> → **Adicionar projeto**
   → nome `listinha-da-anne` → pode **desativar** o Google Analytics → Criar.
2. No menu lateral: **Criar → Realtime Database → Criar banco de dados**
   → região `us-central1` → **Iniciar no modo bloqueado** → Ativar.
3. Ainda no Realtime Database, abra a aba **Regras**, apague o que estiver lá, cole isto e
   clique em **Publicar**:

   ```json
   {
     "rules": {
       "familias": {
         "$familia": {
           ".read": "auth != null",
           ".write": "auth != null"
         }
       }
     }
   }
   ```

4. Menu lateral: **Criar → Authentication → Começar** → aba *Sign-in method*
   → **Anônimo** → Ativar → Salvar.
5. Ícone de engrenagem (canto superior esquerdo) → **Configurações do projeto**
   → role até *Seus apps* → clique no ícone **`</>`** (Web) → dê um apelido → Registrar app.
   Vai aparecer um bloco parecido com:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "listinha-da-anne.firebaseapp.com",
     databaseURL: "https://listinha-da-anne-default-rtdb.firebaseio.com",
     projectId: "listinha-da-anne",
     appId: "1:123...:web:abc..."
   };
   ```

   **Copie esse bloco inteiro.**
6. No app (link da Kelly), entre em **Ajustes → Sincronizar entre celulares**:
   - em *Código da família*, invente um código difícil de adivinhar,
     ex.: `anne-kelly-8f3k9`;
   - cole o bloco copiado no campo de configuração;
   - toque em **Ligar sincronização**. O app recarrega.

   > **O campo volta vazio, e isso é o certo.** Depois de recarregar, o app não mostra de novo
   > o que colou. A confirmação é a linha verde **Sincronizado ✅** e o aviso
   > *"Já tem configuração guardada neste aparelho"* logo acima do campo. Se aparecerem, deu certo.

7. **No celular da Anne, use o link de sincronização.** O app dela não tem Ajustes de
   propósito (é uma criança de 8 anos, não pode desligar a sincronização sem querer). Então:
   - no app da Kelly: **Ajustes → 📲 Ligar no celular da Anne → Gerar link de sincronização**;
   - toque em **Copiar link** e mande para o celular da Anne (WhatsApp serve);
   - **no celular dela**, abra o link uma vez. Aparece *"☁️ Sincronização ligada!"* — pronto,
     não precisa fazer mais nada. Depois disso ela usa o app pelo ícone, normalmente.

   > Esse link carrega a chave do seu Firebase. Mande só para os celulares da família.

Pronto: o que a Kelly monta aparece na Anne, e o que a Anne conclui volta para a Kelly.

> Se o `databaseURL` não aparecer no bloco copiado, o app monta o endereço a partir do
> `projectId` — mas confira no Realtime Database se bate.

## Passo 5 · Colocar as fotos preferidas da Anne

No app da Anne aparece uma faixa de fotos no topo. Ela toca na imagem para ver a próxima.

- **Pelo app da Anne:** aba *Minha listinha* → **📸 Minhas fotos** → *Escolher fotos do celular*.
- **Pelo app da Kelly:** Ajustes → **📸 Fotos do app da Anne** (precisa ser feito no celular
  em que o app da Anne está instalado).

Cabem 12 fotos, escolhidas do rolo do próprio celular. Elas ficam **só naquele aparelho**:
não sobem para o Firebase, não vão para o outro celular e não entram no repositório do
projeto. São reduzidas automaticamente antes de guardar, para não ocupar espaço à toa.

> Por que não já vieram fotos prontas no app: imagens de artistas têm dono, e o repositório
> deste projeto é público — colocá-las lá seria redistribuir. Com esse recurso, a Anne usa as
> fotos que quiser no celular dela, que é uma cópia pessoal.

## Passo 6 · Proteger a aba da mamãe

Em **Ajustes → Senha da aba da mamãe**, cadastre um PIN de 4 números. Sem isso a Anne
consegue entrar no modo mamãe e conferir as próprias tarefas. 😄

O PIN faz parte dos dados sincronizados: cadastrando num aparelho, ele passa a valer em
todos. Se o outro celular ainda estiver pedindo o PIN antigo, **puxe a tela para baixo**
(veja abaixo) para forçar a atualização.

## Passo 7 · Ligar os avisos

- **No celular da Kelly:** Ajustes → **🔔 Avisos do celular → Permitir avisos**.
- **No celular da Anne:** aba *Minha listinha*, lá no fim → **🔔 Avisos no celular →
  Quero receber avisos**.

Depois de permitir, aparece o botão **Testar aviso agora**. Toque nele: se o aviso não
aparecer na barra do celular, os avisos não estão funcionando naquele aparelho — e aí é
problema de permissão do sistema, não do app.

> **O app precisa estar aberto** (na tela ou em segundo plano). Com o app fechado, nenhum
> aviso chega: isso exigiria um servidor de notificações, que este app não tem de propósito
> (ele é offline e sem back-end). Mesmo sem aviso, a listinha está lá quando ela abrir o app.

O celular passa a notificar:

| Quando | Quem é avisada | O que aparece |
| --- | --- | --- |
| A Anne conclui uma tarefa | Kelly | "Anne fez: 🛁 Banho" + **a pagar R$ 1,50** |
| A mamãe manda listinha nova / confere as tarefas | Anne | envelope 💌 e "Mamãe conferiu! 🎉" |
| A escala marca **folga** do Alexandre naquele dia | **as duas** | "O papai está na cidade hoje" |
| A Anne confirma que recebeu o dinheiro | Kelly | "A Anne confirmou que recebeu! 💰" |

O aviso de papai na cidade sai uma vez por dia, nos dois aparelhos, e depende da escala estar
lida naquele mês — dia sem escala não avisa nada.

## A Anne não está recebendo a listinha? Comece por aqui

Na aba **Minha listinha** do celular dela, o primeiro cartão diz o estado da conexão. Ele
tem quatro respostas possíveis, e cada uma tem um conserto diferente:

| O que o cartão diz | O que fazer |
| --- | --- |
| 🔌 *Ainda não estou ligada no celular da mamãe* | O celular dela **nunca recebeu o link**. No app da Kelly: Ajustes → 📲 Ligar no celular da Anne → Gerar link → mandar para ela e **abrir o link no mesmo navegador em que o app está instalado** (Chrome/Safari, não o navegador de dentro do WhatsApp). |
| ⏳ *Procurando o celular da mamãe…* | Só esperar alguns segundos. Se ficar preso aí, confira a internet do aparelho. |
| ⚠️ *Não estou conseguindo falar…* | Erro de conexão. Toque em **Procurar novidades**; se insistir, veja o motivo em Ajustes no app da Kelly. |
| 💜 *Ligada no celular da mamãe* | A conexão está boa. Se mesmo assim não há tarefas, veja o quadro abaixo. |

**Conexão boa e nenhuma tarefa?** Quase sempre a listinha foi montada **para outro dia**. A
tela da Anne mostra **só o dia de hoje**. No app da Kelly, se o calendário estiver em outro
dia, aparece um aviso amarelo em cima da listinha com o botão *Ir para a listinha de hoje*.

## Puxar para atualizar

Os dados chegam sozinhos quando os dois celulares estão com internet. Quando o celular ficou
sem sinal, dormiu no bolso, ou você só quer ter certeza:

**Puxe a tela para baixo**, como no Instagram. Aparece *"Atualizando…"* e o app relê tudo da
nuvem. Chegar ao fim da rolagem faz a mesma coisa, sozinho.

### Quando a sincronização falha, o app avisa

Se aparecer **⚠️ Sincronização com erro** no topo (no app da Anne, *"Sem conexão com o celular
da mamãe"*), abra **Ajustes** no app da mamãe: a caixa de status mostra o motivo. Antes isso
ficava invisível — o app dizia "Sincronizado ✅" mesmo quando nada estava subindo.

Se o motivo falar em **permissão** (`permission_denied`), o problema está nas regras do banco
no Firebase, não no app.

## Versão nova do app chega sozinha

Isso é sobre o **app**, não sobre os dados. Quando eu publico uma mudança, os três endereços
(`/`, `/anne/` e `/kelly/`) se atualizam sozinhos — inclusive o app já instalado na tela
inicial dos celulares. O aparelho procura versão nova ao abrir o app, toda vez que ele volta
para a frente, quando a internet volta e de meia em meia hora com ele aberto. Achou novidade:
aparece *"✨ Novidade chegando…"* e a tela recarrega sozinha. Ninguém precisa desinstalar e
instalar de novo.

Duas coisas valem saber:

1. O GitHub leva cerca de um minuto para publicar (aba **Actions** do repositório). Antes
   disso o celular ainda não tem o que baixar.
2. Sem internet, o celular segue abrindo a versão que já tinha — e troca assim que a
   conexão voltar.

Para saber qual versão está num aparelho: app da mamãe → **Ajustes** → **📦 Versão do app**.
O botão **Procurar novidade** força a busca na hora, sem esperar.

---

## Como usar no dia a dia

### A escala do papai (aba comum às duas)

Quando o Alexandre mandar a escala, a Kelly abre **Escala → 📋 Colar escala**, cola o texto e
confere a prévia. O app entende, entre outros:

| Formato | Exemplo |
|---|---|
| Frase corrida | `folga dia 1, trabalho dia 2, folga dia 3` |
| Um por linha | `01 - FOLGA` / `02 - VOO CGH-SDU` |
| Agrupado | `FOLGA: 1, 2, 3` / `TRABALHO: 4, 5` |
| Intervalos | `dias 3 a 7 trabalho` |
| Datas | `05/09 folga` |

Também entende sinônimos: *voo, viagem, reserva, sobreaviso, pernoite, plantão* contam como
trabalho; *folga, off, livre, descanso, em casa, férias* contam como folga.

#### A tabela "Minha Escala" do sistema dele

Dá para colar a tabela inteira, do jeito que ela sai do sistema da companhia — aquela com as
colunas *Activty · Checkin · Start · End · Checkout · Dep · Arr*. As regras:

- **FR vira folga.** Todo o resto (voo `AD####`, `RHC05`, `REX`, `Layover`) vira trabalho.
- Um dia com **qualquer** atividade de trabalho é dia de trabalho, mesmo que a folga da
  véspera atravesse a madrugada (`FR` das 05:00 às 05:00 do dia seguinte).
- **Dia que não aparece na tabela fica em branco**, e o app avisa. Costuma ser dia de descanso,
  mas como a tabela não diz nada sobre ele, o app não inventa: toque no dia e marque na mão.
- Se aparecer um código que o app não conhece, ele conta como trabalho e mostra o código na
  lista de "trechos que não entendi".
- O mês é o que tiver mais dias na tabela — as pontas do mês anterior e do seguinte são
  descartadas sozinhas.

⚠️ **Precisa ser o texto da tabela** (selecionar e copiar). **Print e PDF que é imagem não
funcionam** — não tem texto dentro deles para o app ler.

**Se algo não for entendido**, aquele dia **fica em branco** e aparece a mensagem
*"Ficaram em branco: dia 9"*, junto com o trecho que confundiu o app. Basta tocar no dia no
calendário e escolher ✈️ ou 🏠 na mão.

Cores: **azul = papai trabalhando**, **verde = papai de folga**, cinza = sem escala.
O 👨 marca os dias em que a Anne fica com o pai — por padrão, todo dia de folga dele.
Se em algum dia de folga ela ficar em casa (ou vice-versa), toque no dia e ajuste no botão
*"Anne está / não está com o papai nesse dia"*.

### 🏠 Papai em casa — só a Kelly vê

Ainda na aba **Escala**, mas **só no modo mamãe** (no app da Anne esse quadro não aparece), tem
o relatório de quanto tempo o Alexandre passou em casa, em porcentagem:

- O número grande é o **mês aberto no calendário**.
- A barra é verde (em casa) sobre azul (voando) — as mesmas cores do calendário.
- Abaixo, **mês a mês** de tudo que já foi lido, e o total acumulado.

**O denominador é sempre "dias com escala lida", nunca o mês inteiro.** Dia sem escala não conta
nem a favor nem contra — senão um mês preenchido pela metade pareceria um mês em que ele sumiu.
Por isso vale a pena colar a escala de todo mês: o histórico vai ficando mais fiel.

### Dia do papai e dia da mamãe 🐱

No calendário, cada dia mostra duas coisas: o que o **papai** faz (✈️ voando, 🏠 de folga) e
com quem a **Anne** fica naquele dia — 👨 dia do papai ou 🐱 dia da mamãe.

Folga do Alexandre já entra como **dia do papai** sozinha. Quando não for assim, é só clicar no
dia e escolher **🐱 Dia da mamãe** — e o botão *Voltar ao automático* desfaz a escolha à mão.

### Observações do dia 📝

Clique em qualquer dia do calendário e escreva no campo **Observações deste dia** — por exemplo,
*"o papai chega às 13h e vai embora às 20h"*. O dia passa a ter uma **bolinha roxa** no
calendário, e o texto aparece assim que alguém clica nele. A Anne também vê a observação no app
dela, sem poder mudar.

A observação fica guardada separada da escala: colar a escala de novo **não apaga** o que a
Kelly escreveu.

### Relatório em PDF para mandar no WhatsApp 📄

No fim do quadro **🏠 Papai em casa** tem o botão **Relatório em PDF para o WhatsApp**. Ele gera
um arquivo com:

- o resumo do mês aberto (dias de folga, dias de trabalho e a porcentagem);
- o **dia a dia** do mês, dizendo se foi dia do papai ou da mamãe e a observação de cada dia;
- o **mês a mês** e o total de tudo que já foi lido.

No celular, o app abre a janela de compartilhar e o **WhatsApp aparece na lista** — é escolher a
conversa e pronto. No computador, o arquivo é baixado para você anexar à mão.

### Montar a listinha (aba Mamãe)

1. Escolha o dia no calendário (a bolinha rosa marca os dias que já têm lista).
2. Toque nos afazeres do catálogo para incluir. Em **⚙️ Editar afazeres** dá para mudar
   nome, figurinha e valor, ou criar novos. **✏️ Tarefa avulsa** cria algo só para aquele dia.
3. Escreva o **recado da mamãe** (há sugestões prontas logo abaixo).
4. **💌 Enviar para a Anne** — ela recebe o aviso "A mamãe montou uma listinha pra você!".
5. **🔂 Replicar** copia a lista e o recado para os próximos dias até a data que você escolher,
   podendo pular os dias com o papai ou os fins de semana.

### O dia da Anne (aba Anne)

Ela abre, vê o envelope 💌, lê o recado, e vê cada tarefa com o valor ao lado e a prévia
*"Se você fizer tudo hoje: R$ 3,50"*. Ao tocar numa tarefa: confete, parabéns, e o valor entra
no cofrinho como **"esperando a mamãe"**.

**Tarefa com perguntinhas (o 🛁 Banho).** Tocar no Banho abre uma listinha de conferência —
*Recolheu a toalha? · Organizou suas coisas? · Apagou as luzes?* O botão **Terminei!** só
libera depois que ela marca as três; até lá a tarefa mostra *"1 de 3 perguntinhas"*.
Qualquer afazer pode ter perguntinhas: em **⚙️ Editar afazeres**, toque no **❓** do item e
escreva uma pergunta por linha.

**Quando ela receber o dinheiro.** No cofrinho tem o botão **💰 Já recebi meu dinheiro!**.
Ela confirma, o cofrinho volta a zero e a Kelly recebe o aviso com o valor. É o mesmo efeito
do *Registrar pagamento* da aba Mamãe — use um ou outro, não os dois para o mesmo dinheiro.

### Conferir e pagar (aba Mamãe)

O bloco **🔔 Para conferir** aparece no topo com o que a Anne marcou. Toque em **✓ Conferido**
(ou *Conferir todas*) e o valor passa para **"a pagar"** no cofrinho — a Anne recebe o aviso
"Mamãe conferiu! 🎉". Quando você entregar o dinheiro de verdade, use
**💵 Registrar pagamento** para zerar o saldo e guardar no histórico. Se preferir que a
própria Anne confirme, ela tem o botão **💰 Já recebi meu dinheiro!** no cofrinho dela —
o saldo zera do mesmo jeito e o aviso chega para você.

---

# Parte 2 — Como me guiar daqui pra frente

## O jeito que funciona melhor

**Um pedido por vez, começando pelo efeito desejado.** Em vez de "melhora a tela da Anne",
prefira: *"na aba da Anne, quero que as tarefas já feitas fiquem no fim da lista"*. Eu implemento,
rodo o app de verdade no navegador e te mostro o resultado.

**Mande print quando algo estiver estranho.** Uma foto da tela do celular resolve em um passo
o que levaria várias perguntas.

**Fale como a Kelly e a Anne falam.** Se a Anne chamar de "missão" em vez de "tarefa", me diga —
o texto do app é todo em português e fácil de trocar.

**Pode pedir teste antes de decidir.** Ex.: *"cola essa escala aqui e me diz o que o app entendeu"*.
Eu rodo e te mostro, sem mexer no código.

## O que eu preciso de você

1. **A escala real do Alexandre.** Me mande uma mensagem de verdade, como ele escreve.
   O leitor já cobre 21 formatos testados, mas o formato dele é o que importa — com um exemplo
   real eu ajusto os sinônimos e o formato em minutos.
2. **A lista real de afazeres e os valores.** Hoje há 10 sugestões (R$ 0,50 a R$ 2,00).
   Me diga os que a Anne realmente faz e quanto vale cada um, que eu já deixo cadastrado.
3. **Decidir sobre a sincronização** (Passo 4). É o único ponto que depende de você criar uma
   conta. Se preferir não usar o Firebase, me avise: dá para fazer diferente
   (ver *Se você não quiser o Firebase* abaixo).

## Ideias para as próximas rodadas

Se gostar, é só pedir — coloquei em ordem de "mais útil primeiro":

- **Metas e prêmios.** "Junte R$ 30 e ganhe um passeio", com barrinha de progresso.
- **Sequência de dias** (tipo ofensiva): "5 dias seguidos fazendo tudo! 🔥".
- **Histórico e gráfico** do quanto ela ganhou por semana/mês.
- **Foto como prova** da tarefa feita, para a Kelly conferir de longe.
- **Tarefas fixas por dia da semana**, montadas uma vez e válidas para sempre.
- **Adesivos/medalhas** colecionáveis em vez de (ou além de) dinheiro.
- **Contagem regressiva** "faltam 3 dias para o papai voltar", na tela da Anne.
- **Aviso no celular mesmo com o app fechado** (push de verdade — precisa de um passo a mais
  no Firebase, eu configuro).

## Limitações que você deve saber

- **Aviso com o app fechado** ainda não funciona: hoje a notificação aparece com o app aberto
  ou em segundo plano. Push completo é o item da lista acima.
- **Se as duas editarem o mesmo dia ao mesmo tempo**, vale a última alteração. Na prática
  (mãe montando de manhã, filha marcando à tarde) não dá conflito. Um aparelho que não mexeu
  em nada sempre aceita o que vem da nuvem, mesmo que o relógio dele esteja adiantado.
- **Quem tiver o código da família e a chave do Firebase consegue ver os dados.** Use um código
  difícil de adivinhar. Não há nada sensível ali, mas vale o cuidado.

## Se você não quiser o Firebase

Alternativas que eu implemento se pedir:

- **Um celular só** (as duas usam o mesmo aparelho, alternando no botão Anne/Mamãe): funciona
  hoje, sem configurar nada.
- **Compartilhar por arquivo**: a Kelly exporta o backup em Ajustes e manda no WhatsApp; a Anne
  importa. Funciona, mas é manual.
- **Supabase ou outro serviço**: mesma ideia do Firebase, com outro cadastro.
