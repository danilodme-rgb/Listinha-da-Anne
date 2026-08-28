# 📝 Listinha da Anne

App de família para a **Kelly** (mãe) e a **Anne** (8 anos), com três frentes:

1. **Escala do papai** — calendário compartilhado com os dias de voo e de folga do Alexandre
   (piloto da Azul), incluindo os dias em que a Anne fica com ele.
2. **Modo mamãe** — a Kelly monta a listinha de afazeres do dia, define quanto vale cada um,
   escreve um recado carinhoso, replica a lista para os próximos dias e confere o que foi feito.
3. **Modo Anne** — visual lúdico com o recado da mãe, as tarefas do dia, quanto ela ganha em
   cada uma, a prévia do total e o cofrinho.

> **Como colocar no ar, configurar e usar no dia a dia: [COMO-USAR.md](COMO-USAR.md).**

## Destaques

- **Colar a escala em texto.** A Kelly cola a mensagem que o Alexandre mandar
  (`folga dia 1, trabalho dia 2`, `01 - VOO CGH-SDU`, `FOLGA: 1,2,3`, `3 a 7 trabalho`, `05/09`…)
  e o mês é preenchido sozinho. O que o app não entender **fica em branco** e é listado
  na tela ("ficaram em branco: dia 9").
- **Cores fortes** para a Anne enxergar rápido: azul = papai voando, verde = papai de folga,
  cinza = sem escala, 👨 = dia com o papai.
- **Mesada com conferência.** A Anne marca como feito → confete e parabéns → o valor fica
  "aguardando conferência" → a Kelly recebe o aviso e toca em **Conferido** → o dinheiro
  entra no cofrinho. O botão *Registrar pagamento* baixa o saldo quando ela recebe de verdade.
- **PWA instalável** e offline-first; sincronização opcional entre celulares via Firebase.

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes do leitor de escala
npm run build      # build de produção em dist/
```

## Estrutura

```
src/
  lib/
    parser.ts     leitor da escala colada em texto (com testes)
    store.ts      estado do app, ações e carteira
    nuvem.ts      sincronização opcional (Firebase Realtime Database)
    dates.ts      datas, calendário e formatação em pt-BR
    types.ts      tipos do domínio
  components/     Calendario, Modal, Festa (confete)
  views/          EscalaView, KellyView, AnneView, AjustesView
scripts/
  testar-parser.ts   21 casos reais de formato de escala
  gen_icons.py       gera os ícones do PWA
```

Sem back-end próprio: os dados ficam no aparelho (`localStorage`) e, se a sincronização
estiver ligada, também no Realtime Database da família.
