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
- **Comandos:** `npm run dev` · `npm test` (21 casos do leitor de escala) · `npm run build`
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
- **Perfis:** `kelly` (monta e confere) e `anne` (executa). PIN opcional protege o modo mamãe.
- **Fluxo do dinheiro:** tarefa feita → aguardando conferência → Kelly confere → entra no
  cofrinho → "Registrar pagamento" baixa o saldo.
- **Arquivos-chave:** `src/lib/parser.ts` (leitor da escala), `src/lib/store.ts` (estado e
  ações), `src/views/` (uma tela por aba).
- **Documentação para o usuário:** `COMO-USAR.md` — atualizar quando algo mudar para ele.
