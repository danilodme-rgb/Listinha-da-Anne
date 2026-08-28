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
3. Faça o merge do branch `claude/listinha-anne-app-ey214o` para o `main`.
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
   - toque em **Ligar sincronização**.
7. **Repita o passo 6 no celular da Anne, com exatamente o mesmo código de família.**

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

## Passo 7 · Ligar os avisos

Em **Ajustes → Avisos do celular → Permitir avisos**, nos dois aparelhos. O celular passa a
notificar quando a Anne concluir uma tarefa e quando a mamãe mandar listinha nova.

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

**Se algo não for entendido**, aquele dia **fica em branco** e aparece a mensagem
*"Ficaram em branco: dia 9"*, junto com o trecho que confundiu o app. Basta tocar no dia no
calendário e escolher ✈️ ou 🏠 na mão.

Cores: **azul = papai trabalhando**, **verde = papai de folga**, cinza = sem escala.
O 👨 marca os dias em que a Anne fica com o pai — por padrão, todo dia de folga dele.
Se em algum dia de folga ela ficar em casa (ou vice-versa), toque no dia e ajuste no botão
*"Anne está / não está com o papai nesse dia"*.

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

### Conferir e pagar (aba Mamãe)

O bloco **🔔 Para conferir** aparece no topo com o que a Anne marcou. Toque em **✓ Conferido**
(ou *Conferir todas*) e o valor passa para **"a pagar"** no cofrinho — a Anne recebe o aviso
"Mamãe conferiu! 🎉". Quando você entregar o dinheiro de verdade, use
**💵 Registrar pagamento** para zerar o saldo e guardar no histórico.

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
  (mãe montando de manhã, filha marcando à tarde) não dá conflito.
- **Quem tiver o código da família e a chave do Firebase consegue ver os dados.** Use um código
  difícil de adivinhar. Não há nada sensível ali, mas vale o cuidado.

## Se você não quiser o Firebase

Alternativas que eu implemento se pedir:

- **Um celular só** (as duas usam o mesmo aparelho, alternando no botão Anne/Mamãe): funciona
  hoje, sem configurar nada.
- **Compartilhar por arquivo**: a Kelly exporta o backup em Ajustes e manda no WhatsApp; a Anne
  importa. Funciona, mas é manual.
- **Supabase ou outro serviço**: mesma ideia do Firebase, com outro cadastro.
