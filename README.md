# Teoria das caixas – Planejamento do saldo

Duas atividades sobre a folha **"Meu planejamento financeiro"** (as 3 caixas: curto, médio e longo prazo), cada uma numa aba no alto da tela, e um login na frente das duas:

- **Meu plano** (`meu-planejamento.html`): a folha "Meu planejamento financeiro" para o próprio aluno preencher com os sonhos dele. Em cada caixa, ele escreve a meta, a data e o valor total; a folha conta os meses, calcula quanto guardar por mês, avisa quando uma meta está na caixa errada e soma quanto o plano pede por mês. Dá para imprimir a folha preenchida. Veja [Meu plano](#meu-plano).
- **Qual é a caixa?** (`qual-e-a-caixa.html`): um jogo com tempo, no estilo do Kahoot. São 10 rodadas: em umas, o aluno diz em qual caixa vai uma meta; nas outras, faz as contas das caixas. Quem acerta mais rápido faz mais pontos, e o ranking da turma tem 3 abas: pontos, acertos e maior sequência. Veja [Qual é a caixa?](#qual-é-a-caixa).
- **O login** é o mesmo do Fluxo de Caixa e das Escolhas da Vanessa e da Karine, com o mesmo banco (Supabase): quem já tem conta lá entra aqui com o mesmo e-mail e a mesma senha, e o ranking fica na mesma tabela do outro jogo. Veja [O login e o banco](#o-login-e-o-banco).

Não tem build nem instalação: são páginas `.html` + alguns arquivos `.js` e `.css` estáticos, na identidade visual da Financial Experts (a mesma das Escolhas da Vanessa e da Karine). Para rodar, basta publicar a pasta no GitHub Pages (ou abrir o `meu-planejamento.html` no navegador, com internet, por causa do login). O `index.html` só leva para o Meu plano: o endereço da pasta abre direto nele.

---

## Meu plano

A folha "Meu planejamento financeiro", do jeito da original, para o aluno preencher com os sonhos dele. Não tem resposta certa nem conferência: a folha faz as contas e mostra quanto guardar por mês.

1. **Os sonhos nas caixas.** Uma faixa por caixa, na cor dela, com as linhas da folha: **Descrição da meta**, **Data de realização** (o mês e o ano), **Valor total**, **Quantidade de meses** e **Valor a poupar por mês**. O aluno escreve as três primeiras; as duas últimas saem sozinhas, com a conta por extenso embaixo (`R$ 300,00 ÷ 6 meses = R$ 50,00`). Cada caixa começa com uma meta e pode ter até 3 (**Adicionar outra meta**); a lixeira apaga uma meta (pergunta antes, se ela tem alguma coisa escrita). A caixa com alguma meta pronta fica de tampa aberta.

   Os meses são contados a partir do mês de hoje (do relógio do computador): quem volta à folha meses depois vê as contas atualizadas. A folha avisa quando:

   - **a meta está na caixa errada** pelo prazo ("Faltam 8 meses: esta meta é de curto prazo"), com o botão **Levar para o curto prazo**, que leva a meta para a caixa certa (se ela não estiver cheia);
   - **a data já passou** (ou é este mês);
   - **falta a data ou o valor** para calcular.

2. **Quanto guardar por mês.** O resumo mostra a barra do total por mês dividida entre as caixas (com a parte de cada uma) e o total do plano: quanto o aluno precisa guardar por mês para realizar as metas nas datas que escolheu.

   Enquanto o aluno preenche, dois medidores ficam grudados no alto: quantas caixas já têm meta e quanto vai para as caixas por mês (um pedaço por caixa, na cor dela).

3. **Imprimir a folha.** **Imprimir a folha** imprime só a folha "Meu planejamento financeiro" preenchida, do jeito da original: o título, uma faixa colorida por caixa com as linhas preenchidas e "Cálculo mensal = Valor total ÷ Quantidade de meses" no rodapé, com o nome do aluno, o mês e o total por mês nas caixas no alto. As cores são as do tema claro mesmo com o tema escuro ligado. Imprimir pelo menu do navegador também sai a folha.

**Apagar a folha** apaga tudo e começa de novo (pergunta antes).

---

## Qual é a caixa?

Um jogo com tempo, no estilo do Kahoot, para treinar as duas perguntas da teoria das caixas: **quando** (qual é a caixa) e **quanto por mês** (valor total ÷ quantidade de meses).

1. **A abertura.** Como é o jogo (10 rodadas, de 20 a 30 segundos cada, até 1.000 pontos por rodada), as 3 categorias do ranking e, ao lado, o quadro roxo com quanto vale cada resposta e a **cola das caixas** (as 3 caixas e os prazos). O aluno pode pôr um **apelido**, que aparece no ranking, e toca em **Começar o jogo**.

2. **As rodadas.** Uma de cada vez. A meta aparece grande, com as etiquetas do nível (**Fácil**, **Médio** ou **Difícil**) e do tempo, e uma contagem (3, 2, 1) dá tempo de todo mundo ler. Aí as opções aparecem e o tempo começa a correr: o número dos segundos e a barra que esvazia (vermelhos nos últimos 5 segundos).

   - Nas rodadas **"qual é a caixa"**, as opções são as 3 caixas desenhadas, lado a lado. A escolhida abre a tampa e cai uma moeda dentro.
   - Nas rodadas **de conta**, as opções têm as formas e as cores do Kahoot: A é o triângulo rosa, B o losango azul, C o círculo âmbar e D o quadrado verde.

3. **A resposta.** Vale a primeira: depois de tocar, não dá pra trocar. O cartão mostra os pontos, se acertou ("Certa, e rapidinho!", "Não foi dessa vez" ou "O tempo acabou"), quanto tempo levou, a sequência de acertos, a explicação e, quando o aluno erra, a resposta certa. Nas rodadas de caixa aparece a régua do tempo com a meta no prazo dela; nas de conta, a conta de cada opção (a certa em destaque).

   Enquanto o aluno joga, o placar fica grudado no alto: as rodadas, os pontos, os acertos e a sequência que está valendo (que "pega fogo" com 3 acertos seguidos). Nas etapas, as rodadas certas ganham o selo verde e as erradas o x vermelho; dá pra voltar nelas pra rever (sem mudar a resposta).

   O tempo segue o relógio do computador: recarregar a página no meio de uma rodada não zera o tempo dela, e se ele acabou enquanto isso, a rodada fica com 0.

4. **O placar.** Os pontos (de 11.000 possíveis), os acertos (e o tempo médio nas certas) e a maior sequência, cada um contando de zero até o número. Depois vêm o **ranking da turma**, **as suas caixas** (quantas o aluno acertou de cada caixa), a tabela rodada por rodada (a resposta, certa ou errada, o tempo e os pontos) e o que o placar mostra: a dica de cada rodada errada. **Jogar de novo** apaga as respostas e já abre a Rodada 1; **Fazer o meu planejamento** leva ao Meu plano.

### Os pontos

Como no Kahoot: quem acerta assim que as opções aparecem leva **1.000 pontos**; a cada segundo, o valor cai, até **500 pontos** no último segundo. Errar ou deixar o tempo acabar dá **0**. A última rodada vale **pontos em dobro** (até 2.000). O máximo do jogo é 11.000.

### As rodadas

Ficam em `LIST`, em [`backend/js/rounds.js`](backend/js/rounds.js):

| Rodada | Tipo | A meta | Resposta |
| --- | --- | --- | --- |
| 1. Fone novo (fácil) | caixa | Um fone daqui a 4 meses | Curto prazo |
| 2. Faculdade (fácil) | caixa | A faculdade daqui a 6 anos | Longo prazo |
| 3. Tênis (fácil) | conta | R$ 300 em 6 meses: quanto por mês? | R$ 50,00 |
| 4. Viagem (médio) | caixa | Uma viagem daqui a 1 ano e meio | Médio prazo |
| 5. 12 meses (médio) | caixa | Um celular daqui a 12 meses (pegadinha) | Curto prazo |
| 6. Notebook (médio) | conta | R$ 3.600 em 2 anos: quanto por mês? | R$ 150,00 |
| 7. Carteira (médio) | conta | De março de 2027 a março de 2029: quantos meses? | 24 meses |
| 8. 5 anos (difícil) | caixa | Uma moto daqui a 5 anos (pegadinha) | Médio prazo |
| 9. Cabe? (difícil) | conta | Saldo de R$ 300, videogame de R$ 2.400 em 6 meses: cabe? | Não cabe |
| 10. Pesa mais (difícil, pontos em dobro) | conta | Qual meta pede mais por mês? | O fone de R$ 240 em 3 meses |

Nas rodadas de caixa, a resposta certa não fica escrita: ela sai do prazo da meta (`months`), em [`backend/js/caixas.js`](backend/js/caixas.js) (até 12 meses é curto; de 13 a 60, médio; acima de 60, longo). Nas de conta, as opções erradas são os erros mais comuns (dividir pelos anos em vez dos meses, multiplicar em vez de dividir), e cada opção tem a conta dela, que aparece depois da resposta.

### O ranking

No placar final, o ranking junta todo mundo que jogou, com uma aba pra cada categoria: **pontos**, **acertos** e **sequência** (a maior série de acertos seguidos). Cada aba já mostra a posição do aluno naquela categoria. Na categoria escolhida aparecem a frase com a posição dele, o **pódio** dos 3 primeiros (os degraus sobem como no fim do Kahoot) e a lista do 4º ao 10º. Empate divide a posição. Se o aluno ficou mais pra baixo, a linha dele aparece no fim, em destaque.

No ranking, o apelido aparece em destaque e, embaixo dele, o nome que o aluno cadastrou no login: os alunos se divertem com o apelido e o professor sabe quem é quem.

O resultado vai pro ranking assim que o aluno responde a última rodada. Cada aluno tem um resultado só: jogando de novo, ele é trocado pelo novo. O ranking se atualiza sozinho a cada 15 segundos enquanto está na tela, e o botão **Atualizar** atualiza na hora.

---

## O login e o banco

As duas páginas abrem numa tela de **Entrar / Criar conta**, a mesma do Fluxo de Caixa e das Escolhas da Vanessa e da Karine, e com o **mesmo banco**: o projeto Supabase `xorqsuqjmvkyzgagdxfz`, em [`frontend/js/config.js`](frontend/js/config.js) (uma cópia do `config.js` do outro sistema). Quem já tem conta lá entra com o mesmo e-mail e a mesma senha, e quem cria a conta aqui também pode usar ela lá. A atividade só aparece depois que o aluno entra. No alto, ficam o nome dele e o botão **Sair**.

- **Criar conta** pede o nome completo, o e-mail e uma senha de pelo menos 6 caracteres. O nome vai pros dados do login e pra tabela `profiles` (a mesma do Fluxo de Caixa).
- **Esqueceu a senha?** manda um link pro e-mail, que volta pra página em que o aluno estava.
- **Sair** volta pra tela de entrar.

O ranking do Qual é a caixa? usa a **mesma tabela `game_scores`** do jogo Seu dinheiro no tempo: uma linha por aluno e por jogo, separadas pela coluna `game` (aqui, `qual-e-a-caixa`; lá, `dinheiro-no-tempo`). Cada linha tem o apelido (`nickname`), o nome do login (`player_name`), o placar (`scores`: `{ pontos, acertos, sequencia }`) e a resposta de cada rodada (`picks`). Como a tabela já existe no banco, **não precisa criar nada novo no Supabase**: o ranking já funciona. Quem está logado lê todas as linhas, mas só grava e muda as próprias. Sem a tabela, o jogo funciona igual e, no lugar do ranking, aparece o aviso de que falta criá-la.

Pra os links do e-mail (trocar a senha, confirmar a conta) voltarem pra este sistema, o endereço dele tem que estar em **Authentication → URL Configuration → Redirect URLs**, no painel do Supabase (no GitHub Pages, algo como `https://financialexperts.github.io/Teoria-das-caixas/**`). Um link que cai no endereço da pasta (o `index.html`) segue pro Meu plano com o acesso junto.

---

## Estrutura de arquivos

```
index.html                      só leva pro Meu plano (o endereço da pasta abre nele)
meu-planejamento.html           Meu plano: as 3 caixas da folha, o resumo e a folha
                                impressa
qual-e-a-caixa.html             Qual é a caixa?: abertura, rodadas e placar
frontend/
  css/styles.css                o visual das duas páginas (identidade Financial Experts),
                                as cores e os desenhos das caixas, as abas e o login
  css/plano.css                 o visual que é só do Meu plano, e a folha impressa
  css/game.css                  o visual que é só do jogo Qual é a caixa?
  img/                          logos e favicon
  js/config.js                  o projeto Supabase do login (o mesmo do Fluxo de Caixa e
                                das Escolhas da Vanessa e da Karine)
  js/supabaseClient.js          liga o cliente do Supabase
  js/auth.js                    a tela de entrar / criar conta / esqueci a senha
  js/session.js                 o login das duas páginas: qual tela aparece, quem entrou,
                                o botão de sair; a atividade só começa depois dele
  js/ui.js                      o que as duas páginas têm em comum: tema claro/escuro,
                                o brilho do vidro e as animações dos ícones
  js/format.js                  formatação de dinheiro, porcentagem, meses, datas e pontos
  js/icons.js                   os desenhos dos ícones, os quadrinhos e as caixas em 3D
  js/toast.js                   o aviso de quando uma ação ainda não pode
  js/parse.js                   lê o que o aluno digitou numa célula: o número ou a conta
  js/mask.js                    a máscara das células: os pontos de milhar enquanto o aluno
                                digita um número

  (Meu plano)
  js/planner.js                 o estado da folha do aluno, as contas e os avisos
  js/planner-view.js            as caixas, as metas, o resumo, os medidores e a folha
                                impressa
  js/planner-app.js             a abertura, imprimir e apagar, liga tudo

  (Qual é a caixa?)
  js/game.js                    o estado do jogo, o tempo, os pontos e as regras
  js/play.js                    as etapas, os cartões das rodadas (a contagem, o tempo, as
                                opções, o que a resposta deu) e o placar do alto
  js/score.js                   o placar final
  js/ranking.js                 o ranking da turma: grava o resultado no Supabase e mostra
                                quem foi melhor em cada categoria
  js/game-app.js                a abertura, o apelido, começar e recomeçar, liga tudo
backend/
  js/caixas.js                  as 3 caixas: nomes e prazos (as duas atividades leem daqui)
  js/rounds.js                  as 10 rodadas do jogo, os níveis, o tempo e as categorias
                                do ranking
```

Os arquivos em `backend/js/` não tocam no DOM: são só dados. O `planner.js`, o `game.js`, o `parse.js` e o `mask.js` também não: são eles que guardam o que o aluno fez, fazem as contas e aplicam as regras; as telas só leem deles.

Os ícones se mexem quando o mouse passa, quando o aluno toca neles ou quando recebem o foco do teclado. Quem pede menos movimento no sistema operacional não vê animação nenhuma (os números grandes já aparecem prontos e as rodadas não têm a contagem; o tempo do jogo continua valendo).

---

## Onde mexer para mudar cada coisa

| Para mudar… | Edite |
| --- | --- |
| Os nomes ou os prazos das caixas | `backend/js/caixas.js` (o `max` é o último mês da caixa) |
| As cores das caixas | `--curto`, `--medio` e `--longo` (e os `-soft` e `-box`), no `frontend/css/styles.css` |
| **Meu plano:** quantas metas cabem em cada caixa | `MAX`, no `frontend/js/planner.js` |
| Os avisos de cada meta e o resumo | `msgHTML()` e `verdictHTML()`, no `frontend/js/planner-view.js` |
| A folha impressa | `sheetHTML()`, no `frontend/js/planner-view.js`, e o fim do `frontend/css/plano.css` |
| **Qual é a caixa?:** as rodadas, as metas, as opções e as explicações | `LIST`, em `backend/js/rounds.js` |
| O tempo de cada nível (ou de uma rodada) | `time` em `LEVELS`, ou `time` na rodada, em `backend/js/rounds.js` |
| Os pontos de quem acerta | `MAX`, em `backend/js/rounds.js` (no último segundo vale a metade); a conta fica em `scoreOf()`, no `frontend/js/game.js` |
| Os pontos em dobro | `multiplier` da rodada |
| As categorias do ranking | `CATEGORIES`, em `backend/js/rounds.js` (as chaves são as do `totals()`, no `frontend/js/game.js`) |
| A contagem antes das opções e o vermelho do fim do tempo | `CONTAGEM`, `PASSO` e `POUCO`, no `frontend/js/play.js` |
| O que o placar mostra | `insightHTML()` e `LICAO`, no `frontend/js/score.js` (a dica de cada rodada é o `tip` dela) |
| Quantos aparecem no ranking e de quanto em quanto tempo ele se atualiza | `TOP` e `POLL`, no `frontend/js/ranking.js` |
| **Login:** o projeto Supabase | `frontend/js/config.js` |
| Os textos da tela de entrar e as mensagens de erro | `markup()` e `friendlyError()`, no `frontend/js/auth.js` |
| As abas do topo (uma por atividade) | o `<nav class="tabs">` no alto das duas páginas (a mesma lista nas duas) |
| Os textos fixos (títulos, legendas, rodapé) | o `.html` de cada atividade |

---

## O que fica guardado no navegador

- **O tema** claro ou escuro, na chave `tema` (a mesma do Fluxo de Caixa e das Escolhas da Vanessa e da Karine: publicados no mesmo endereço, os sistemas lembram do mesmo tema).
- **A folha** do Meu plano, na chave `meu-planejamento:` + o id da conta: as metas de cada caixa. A folha do aluno fica só no navegador: ela não vai pro banco.
- **O jogo** Qual é a caixa?, na chave `qual-e-a-caixa:` + o id da conta: a resposta e o tempo de cada rodada, quando a rodada em andamento abriu e o apelido. (O resultado de cada jogo terminado também vai pro Supabase, pro ranking.)
- **A sessão do login**, guardada pelo próprio Supabase.

O que o aluno faz fica guardado só naquele navegador, mas separado por conta: num computador compartilhado, cada aluno vê só o que ele fez. Numa janela anônima (ou com o armazenamento bloqueado), tudo funciona igual, só não lembra depois de recarregar. Se os dados mudarem (`rounds.js`), uma resposta guardada que não bate mais é esquecida.
