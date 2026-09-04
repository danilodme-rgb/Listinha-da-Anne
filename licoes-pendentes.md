# Lições pendentes

Lição que apareceu no meio do produto e **ainda não virou regra geral** (regra 16f).

Mexer no bloco geral obriga a propagar em todos os projetos — caro, e no meio de outra
tarefa. Então anota-se aqui, no mesmo commit da correção (16c), e a atualização das regras
acontece na sua própria conversa.

A varredura diária lista o que está aberto, em todos os projetos. Isso **não reprova**: é
estado normal, não falha. O que ela impede é a lição sumir sem ninguém ver.

## Como usar

- Item aberto: `- [ ] texto da lição`
- Virou regra no `danilodme-rgb/instrucoes`: marque `- [x]` e ele sai da lista

## Abertas

- [ ] **API que só existe no aparelho se prova no aparelho, com botão dentro do produto.**
  Notificação, service worker, permissão de sistema: teste unitário e navegador de
  computador passam verdes com o caminho errado (`new Notification` funciona no desktop e é
  proibido no Chrome do Android). Todo recurso assim precisa de um gesto no próprio app que
  execute o caminho inteiro e **diga o resultado** — senão a falha mora num `catch` vazio.
- [ ] **`catch` que engole erro precisa devolver o que aconteceu a quem chamou.** Capturar
  para não derrubar o app é certo; capturar e devolver `void` transforma falha em silêncio, e
  silêncio o usuário lê como "funcionou". A função devolve o desfecho; quem chama mostra.
