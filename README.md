# Teoria das caixas – Planejamento do saldo

Três atividades sobre a folha **"Meu planejamento financeiro"** (as 3 caixas: curto, médio e longo prazo), cada uma numa aba no alto da tela, e um login na frente das três:

- **As caixas** (`index.html`): o exercício em que o aluno faz o planejamento da Bia, uma jovem aprendiz de 17 anos com 6 sonhos. Ele calcula o saldo do mês, separa os sonhos nas 3 caixas pelo prazo de cada um e faz as contas da folha: quantos meses faltam e quanto guardar por mês (valor total ÷ quantidade de meses). São 6 etapas, feitas uma de cada vez: a próxima só abre quando todas as respostas da etapa estão certas. No fim, o plano da Bia: R$ 550,00 por mês nas caixas, de um saldo de R$ 600,00.
- **Meu plano** (`meu-planejamento.html`): a folha "Meu planejamento financeiro" para o próprio aluno preencher com os sonhos dele. Ele escreve a receita, as despesas, e em cada caixa a meta, a data e o valor total; a folha conta os meses, calcula quanto guardar por mês, avisa quando uma meta está na caixa errada e diz se o plano cabe no saldo. Dá para imprimir a folha preenchida. Veja [Meu plano](#meu-plano).
- **Qual é a caixa?** (`qual-e-a-caixa.html`): um jogo com tempo, no estilo do Kahoot. São 10 rodadas: em umas, o aluno diz em qual caixa vai uma meta; nas outras, faz as contas das caixas. Quem acerta mais rápido faz mais pontos, e o ranking da turma tem 3 abas: pontos, acertos e maior sequência. Veja [Qual é a caixa?](#qual-é-a-caixa).
- **O login** é o mesmo do Fluxo de Caixa e das Escolhas da Vanessa e da Karine, com o mesmo banco (Supabase): quem já tem conta lá entra aqui com o mesmo e-mail e a mesma senha, e o ranking fica na mesma tabela do outro jogo. Veja [O login e o banco](#o-login-e-o-banco).

Não tem build nem instalação: são páginas `.html` + alguns arquivos `.js` e `.css` estáticos, na identidade visual da Financial Experts (a mesma das Escolhas da Vanessa e da Karine). Para rodar, basta publicar a pasta no GitHub Pages (ou abrir o `index.html` no navegador, com internet, por causa do login).


## O caminho do aluno (As caixas)

1. **A abertura.** A pergunta da aula ("Como a Bia vai realizar 6 sonhos com o saldo do mês?") e, ao lado, as 3 caixas em pé, do tamanho do prazo delas (a do longo prazo é a maior). Tocando numa caixa, ela pula, abre a tampa, cai uma moeda dentro e ela diz a próxima frase dela no balão. O ponto de partida mostra o mês da história (janeiro de 2027), quantos sonhos são e quantas respostas o aluno vai dar (25, em 6 etapas).

2. **Como fazer.** A legenda das cores da folha (laranja são os dados da Bia, em branco os cálculos do aluno, verde o resultado da etapa), a conta das caixas (**Valor a poupar por mês = Valor total ÷ Quantidade de meses**) e o que dá pra digitar numa célula.

3. **A régua do tempo.** Uma linha por caixa, na mesma régua: cada caixa ocupa um terço (de hoje a 1 ano, de 1 a 5 anos e de 5 a 10 anos). Os sonhos da Bia aparecem na linha da caixa deles, no mês deles, quando o aluno acerta a caixa de cada um, e ficam cheios quando a etapa daquela caixa termina. Tocar numa linha abre a etapa daquela caixa (se ela já abriu).

4. **As etapas.** Logo abaixo dos medidores ficam as 6 etapas. Só o cartão da etapa aberta aparece. A etapa toda certa ganha o selo verde, a que está na tela fica roxa e as que ainda não abriram ficam com o círculo tracejado.

   1. **O saldo:** as receitas e as despesas da Bia lado a lado. O aluno soma as despesas e calcula o saldo (receita − despesas).
   2. **As caixas:** os 6 sonhos, cada um com a data e o valor. Para cada um, o aluno escolhe a caixa (os botões são as 3 caixas desenhadas; a escolhida abre a tampa). A dica de quem erra diz quantos meses faltam.
   3. **Curto prazo**, 4. **Médio prazo** e 5. **Longo prazo:** uma etapa por caixa, como a folha. Em cima, o prazo da caixa e a régua das 3 caixas com o pedaço dela aceso; depois, a conta da folha e uma coluna por meta, com a data e o valor (laranja) e as duas contas do aluno: a quantidade de meses e o valor a poupar por mês. Embaixo, em verde, o total da caixa por mês.
   6. **O plano:** o total por mês de cada caixa e o saldo. O aluno soma o que vai para as caixas e calcula a folga (o que sobra do saldo).

   Numa célula vale o número do jeito brasileiro (`120`, `1.100,00`) ou a conta, como numa célula de planilha (`=360/3`). A máscara põe os pontos de milhar enquanto o aluno digita, e o número se completa ao sair da célula (`120` vira `120,00`). No celular, uma barrinha em cima do teclado traz os sinais das contas (+ − * / ( ) =).

5. **Conferir.** O botão **Conferir os cálculos** (ou **Conferir as caixas**, na Etapa 2) confere a etapa toda: a célula certa fica verde e trava; a errada fica vermelha e ganha a dica da conta ("Valor total ÷ Quantidade de meses"); a que não deu pra entender ganha um exemplo; a vazia ganha a borda tracejada e "Falta calcular". O sinal não conta, e uma diferença de até 1 centavo também não. Com algum erro, aparece **Refazer a etapa**, que apaga as respostas daquela etapa.

   Com a etapa toda certa, aparece a pergunta para a turma discutir (com uma resposta possível escondida em **Ver uma resposta**) e o botão **Avançar para a Etapa N**.

   Enquanto o aluno trabalha, três medidores ficam grudados no alto: quantas das 25 respostas estão certas, quantas etapas terminou e quanto do saldo já foi para as caixas (um pedaço por caixa, na cor dela).

6. **O plano da Bia.** Com a última etapa certa, aparece o resultado: R$ 550,00 por mês nas caixas (o número conta de zero até ele), a barra do saldo dividida entre as caixas e a folga, o total de cada caixa, as conquistas da Bia da mais perto à mais longe (com o pedaço do saldo que cada uma leva), o que os números mostram (a surpresa: o fone, de R$ 360,00, pede mais por mês que o carro, de R$ 7.200,00) e as perguntas para refletir com a turma. O botão **Agora, faça o seu planejamento** leva ao Meu plano.

**Recomeçar o exercício** apaga tudo e volta ao começo. Se já tem alguma coisa feita, pergunta antes.

---

## As regras e os avisos

| Situação | O que acontece |
| --- | --- |
| Avançar com alguma resposta errada ou em branco | Não dá: o botão **Avançar** só aparece com todas as respostas da etapa certas. |
| Abrir uma etapa antes da hora (pelas etapas ou pela régua do tempo) | Não abre, e o aviso no pé da tela diz o que falta: "A Etapa 4 (Médio prazo) só abre quando todas as respostas da Etapa 3 (Curto prazo) estiverem certas." |
| Refazer uma etapa | O botão só aparece depois de uma conferência com erro. Apaga as respostas daquela etapa, sem perguntar. |
| Mudar uma resposta certa | Ela fica travada. Com a etapa em aberto, **Refazer a etapa** apaga tudo dela; com a etapa toda certa, só recomeçando o exercício. |
| Recomeçar com respostas feitas | Pergunta "Apagar todas as respostas e começar o exercício de novo?" |

---

## A história e as contas

Ficam em [`backend/js/historia.js`](backend/js/historia.js). A história começa em janeiro de 2027, e os meses de cada meta são contados a partir daí. A caixa de cada meta não fica escrita: ela sai do prazo (até 12 meses é curto; de 13 a 60, médio; acima de 60, longo), em [`backend/js/caixas.js`](backend/js/caixas.js).

| Etapa | O que o aluno calcula | Resposta |
| --- | --- | ---: |
| 1. O saldo | Despesas: transporte 150 + celular 50 + lanches e saídas 200 + ajuda em casa 100 · Saldo: salário 1.100 − despesas | R$ 500,00 · **R$ 600,00** |
| 2. As caixas | A caixa de cada sonho | Fone e curso: curto · Carteira e notebook: médio · Carro e intercâmbio: longo |
| 3. Curto prazo | Fone de ouvido (abril de 2027, R$ 360): 3 meses, 360 ÷ 3 · Curso de edição de vídeo (julho de 2027, R$ 480): 6 meses, 480 ÷ 6 · Total da caixa | R$ 120 + R$ 80 = **R$ 200,00** |
| 4. Médio prazo | Carteira de motorista (janeiro de 2029, R$ 3.000): 24 meses, 3.000 ÷ 24 · Notebook (janeiro de 2030, R$ 2.700): 36 meses, 2.700 ÷ 36 · Total da caixa | R$ 125 + R$ 75 = **R$ 200,00** |
| 5. Longo prazo | Primeiro carro (janeiro de 2033, R$ 7.200): 72 meses, 7.200 ÷ 72 · Intercâmbio (janeiro de 2037, R$ 6.000): 120 meses, 6.000 ÷ 120 · Total da caixa | R$ 100 + R$ 50 = **R$ 150,00** |
| 6. O plano | Total nas caixas: 200 + 200 + 150 · Folga: 600 − 550 | **R$ 550,00** · **R$ 50,00** |

O sistema não guarda as respostas prontas: ele faz as contas a partir dos dados de `historia.js`. Mudando uma receita, uma despesa, a data ou o valor de uma meta, as respostas, as dicas, a régua do tempo, as perguntas de discussão e o resultado acompanham. Uma meta nova vai sozinha para a etapa da caixa dela.

---

## Meu plano

A folha "Meu planejamento financeiro", do jeito da original, para o aluno preencher com os sonhos dele. Não tem resposta certa nem conferência: a folha faz as contas e ajuda a montar um plano que cabe no saldo.

1. **O saldo do mês.** O aluno escreve a receita e as despesas do mês; o saldo aparece sozinho (receita − despesas), em vermelho se as despesas passam da receita.

2. **Os sonhos nas caixas.** Uma faixa por caixa, na cor dela, com as linhas da folha: **Descrição da meta**, **Data de realização** (o mês e o ano), **Valor total**, **Quantidade de meses** e **Valor a poupar por mês**. O aluno escreve as três primeiras; as duas últimas saem sozinhas, com a conta por extenso embaixo (`R$ 300,00 ÷ 6 meses = R$ 50,00`). Cada caixa começa com uma meta e pode ter até 3 (**Adicionar outra meta**); a lixeira apaga uma meta (pergunta antes, se ela tem alguma coisa escrita). A caixa com alguma meta pronta fica de tampa aberta.

   Os meses são contados a partir do mês de hoje (do relógio do computador): quem volta à folha meses depois vê as contas atualizadas. A folha avisa quando:

   - **a meta está na caixa errada** pelo prazo ("Faltam 8 meses: esta meta é de curto prazo"), com o botão **Levar para o curto prazo**, que leva a meta para a caixa certa (se ela não estiver cheia);
   - **a data já passou** (ou é este mês);
   - **falta a data ou o valor** para calcular.

3. **Cabe no saldo?** O resumo mostra a barra do saldo dividida entre as caixas e a folga, e o veredito:

   - **cabe**, com a folga que sobra (e a sugestão de guardar uma parte como reserva para imprevistos);
   - **passou do saldo**, com quanto falta por mês e o que dá para fazer: **adiar** as metas que mais pesam (a folha calcula até quando adiar cada uma para o plano caber, e quanto ela passa a pedir por mês), **aumentar o saldo** ou **escolher uma meta mais barata**.

   Enquanto o aluno preenche, dois medidores ficam grudados no alto: quantas caixas já têm meta e quanto do saldo vai para as caixas (vermelho quando passa).

4. **Imprimir a folha.** **Imprimir a folha** imprime só a folha "Meu planejamento financeiro" preenchida, do jeito da original: o título, uma faixa colorida por caixa com as linhas preenchidas e "Cálculo mensal = Valor total ÷ Quantidade de meses" no rodapé, com o nome do aluno, o mês e o saldo no alto. As cores são as do tema claro mesmo com o tema escuro ligado. Imprimir pelo menu do navegador também sai a folha.

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

4. **O placar.** Os pontos (de 11.000 possíveis), os acertos (e o tempo médio nas certas) e a maior sequência, cada um contando de zero até o número. Depois vêm o **ranking da turma**, **as suas caixas** (quantas o aluno acertou de cada caixa), a tabela rodada por rodada (a resposta, certa ou errada, o tempo e os pontos) e o que o placar mostra: a dica de cada rodada errada. **Jogar de novo** apaga as respostas e já abre a Rodada 1.

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

Nas rodadas de caixa, a resposta certa não fica escrita: ela sai do prazo da meta (`months`). Nas de conta, as opções erradas são os erros mais comuns (dividir pelos anos em vez dos meses, multiplicar em vez de dividir), e cada opção tem a conta dela, que aparece depois da resposta.

### O ranking

No placar final, o ranking junta todo mundo que jogou, com uma aba pra cada categoria: **pontos**, **acertos** e **sequência** (a maior série de acertos seguidos). Cada aba já mostra a posição do aluno naquela categoria. Na categoria escolhida aparecem a frase com a posição dele, o **pódio** dos 3 primeiros (os degraus sobem como no fim do Kahoot) e a lista do 4º ao 10º. Empate divide a posição. Se o aluno ficou mais pra baixo, a linha dele aparece no fim, em destaque.

No ranking, o apelido aparece em destaque e, embaixo dele, o nome que o aluno cadastrou no login: os alunos se divertem com o apelido e o professor sabe quem é quem.

O resultado vai pro ranking assim que o aluno responde a última rodada. Cada aluno tem um resultado só: jogando de novo, ele é trocado pelo novo. O ranking se atualiza sozinho a cada 15 segundos enquanto está na tela, e o botão **Atualizar** atualiza na hora.

---

## O login e o banco

As três páginas abrem numa tela de **Entrar / Criar conta**, a mesma do Fluxo de Caixa e das Escolhas da Vanessa e da Karine, e com o **mesmo banco**: o projeto Supabase `xorqsuqjmvkyzgagdxfz`, em [`frontend/js/config.js`](frontend/js/config.js) (uma cópia do `config.js` do outro sistema). Quem já tem conta lá entra com o mesmo e-mail e a mesma senha, e quem cria a conta aqui também pode usar ela lá. A atividade só aparece depois que o aluno entra. No alto, ficam o nome dele e o botão **Sair**.

- **Criar conta** pede o nome completo, o e-mail e uma senha de pelo menos 6 caracteres. O nome vai pros dados do login e pra tabela `profiles` (a mesma do Fluxo de Caixa).
- **Esqueceu a senha?** manda um link pro e-mail, que volta pra página em que o aluno estava.
- **Sair** volta pra tela de entrar.

O ranking do Qual é a caixa? usa a **mesma tabela `game_scores`** do jogo Seu dinheiro no tempo: uma linha por aluno e por jogo, separadas pela coluna `game` (aqui, `qual-e-a-caixa`; lá, `dinheiro-no-tempo`). Cada linha tem o apelido (`nickname`), o nome do login (`player_name`), o placar (`scores`: `{ pontos, acertos, sequencia }`) e a resposta de cada rodada (`picks`). Como a tabela já existe no banco, **não precisa criar nada novo no Supabase**: o ranking já funciona. Quem está logado lê todas as linhas, mas só grava e muda as próprias. Sem a tabela, o jogo funciona igual e, no lugar do ranking, aparece o aviso de que falta criá-la.

Pra os links do e-mail (trocar a senha, confirmar a conta) voltarem pra este sistema, o endereço dele tem que estar em **Authentication → URL Configuration → Redirect URLs**, no painel do Supabase (no GitHub Pages, algo como `https://financialexperts.github.io/Teoria-das-caixas/**`).

---

## Estrutura de arquivos

```
index.html                      As caixas: a Bia e as caixas que falam, como fazer, a régua
                                do tempo, as 6 etapas e o plano da Bia
meu-planejamento.html           Meu plano: o saldo, as 3 caixas da folha, o resumo e a
                                folha impressa
qual-e-a-caixa.html             Qual é a caixa?: abertura, rodadas e placar
frontend/
  css/styles.css                o visual das três páginas (identidade Financial Experts),
                                as cores e os desenhos das caixas, as abas e o login
  css/plano.css                 o visual que é só do Meu plano, e a folha impressa
  css/game.css                  o visual que é só do jogo Qual é a caixa?
  img/                          logos e favicon
  js/config.js                  o projeto Supabase do login (o mesmo do Fluxo de Caixa e
                                das Escolhas da Vanessa e da Karine)
  js/supabaseClient.js          liga o cliente do Supabase
  js/auth.js                    a tela de entrar / criar conta / esqueci a senha
  js/session.js                 o login das três páginas: qual tela aparece, quem entrou,
                                o botão de sair; a atividade só começa depois dele
  js/ui.js                      o que as três páginas têm em comum: tema claro/escuro,
                                o brilho do vidro e as animações dos ícones
  js/format.js                  formatação de dinheiro, porcentagem, meses, datas e pontos
  js/icons.js                   os desenhos dos ícones, os quadrinhos e as caixas em 3D
  js/toast.js                   o aviso de quando uma ação ainda não pode
  js/parse.js                   lê o que o aluno digitou numa célula: o número ou a conta
  js/mask.js                    a máscara das células: os pontos de milhar enquanto o aluno
                                digita um número

  (As caixas)
  js/exercise.js                o estado do exercício, as contas, a conferência, as regras
                                e o que fica guardado no navegador
  js/sheet.js                   as etapas e os cartões, do jeito da folha, e os medidores
  js/ruler.js                   a régua do tempo das 3 caixas
  js/result.js                  o plano da Bia
  js/app.js                     as caixas que falam, o botão de recomeçar, liga tudo

  (Meu plano)
  js/planner.js                 o estado da folha do aluno, as contas, os avisos e as
                                sugestões quando o plano não cabe
  js/planner-view.js            o saldo, as caixas, as metas, o resumo, os medidores e a
                                folha impressa
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
  js/caixas.js                  as 3 caixas: nomes, prazos e falas (as três atividades
                                leem daqui)
  js/historia.js                a Bia: receitas, despesas, os 6 sonhos e as perguntas de
                                discussão
  js/rounds.js                  as 10 rodadas do jogo, os níveis, o tempo e as categorias
                                do ranking
```

Os arquivos em `backend/js/` não tocam no DOM: são só dados. O `exercise.js`, o `planner.js`, o `game.js`, o `parse.js` e o `mask.js` também não: são eles que guardam o que o aluno fez, fazem as contas e aplicam as regras; as telas só leem deles.

Os ícones se mexem quando o mouse passa, quando o aluno toca neles ou quando recebem o foco do teclado. Quem pede menos movimento no sistema operacional não vê animação nenhuma (os números grandes já aparecem prontos e as rodadas não têm a contagem; o tempo do jogo continua valendo).

---

## Onde mexer para mudar cada coisa

| Para mudar… | Edite |
| --- | --- |
| Os nomes, os prazos ou as falas das caixas | `backend/js/caixas.js` (o `max` é o último mês da caixa) |
| A Bia, as receitas, as despesas, os sonhos e o mês da história | `backend/js/historia.js` |
| As perguntas de discussão de cada etapa e as respostas | `discussao`, em `backend/js/historia.js` |
| A última frase da análise do plano da Bia | `LICAO`, no `frontend/js/result.js` |
| As mensagens das células e do pé de cada cartão | `MSG` e `statusText()`, no `frontend/js/sheet.js` |
| O que conta como certo (o sinal, o centavo) | `judge()`, no `frontend/js/exercise.js` |
| As regras (quando uma etapa abre e o que refazer apaga) | `blocked()`, `current()` e `redo()`, no `frontend/js/exercise.js` |
| As cores das caixas | `--curto`, `--medio` e `--longo` (e os `-soft` e `-box`), no `frontend/css/styles.css` |
| **Meu plano:** quantas metas cabem em cada caixa | `MAX`, no `frontend/js/planner.js` |
| Os avisos de cada meta e o veredito do resumo | `msgHTML()` e `verdictHTML()`, no `frontend/js/planner-view.js` |
| As sugestões quando o plano não cabe | `suggestions()`, no `frontend/js/planner.js` |
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
| As abas do topo (uma por atividade) | o `<nav class="tabs">` no alto das três páginas (a mesma lista nas três) |
| Os textos fixos (títulos, legendas, perguntas de reflexão, rodapé) | o `.html` de cada atividade |

Nos textos de `historia.js`, `{saldo}`, `{receita}`, `{despesas}`, `{planejado}` e `{sobra}` viram os valores do plano; `{caixa.curto}` o total por mês de uma caixa; `{fim.curto}` o mês da última meta dela; e `{meta.fone.total}`, `{meta.fone.mensal}`, `{meta.fone.meses}`, `{meta.fone.data}` e `{meta.fone.prazo}` os números de uma meta.

---

## O que fica guardado no navegador

- **O tema** claro ou escuro, na chave `tema` (a mesma do Fluxo de Caixa e das Escolhas da Vanessa e da Karine: publicados no mesmo endereço, os sistemas lembram do mesmo tema).
- **O exercício** As caixas, na chave `caixas-da-bia:` + o id da conta: o que o aluno digitou e as etapas já conferidas. Recarregar volta na etapa em que ele parou.
- **A folha** do Meu plano, na chave `meu-planejamento:` + o id da conta: a receita, as despesas e as metas. A folha do aluno fica só no navegador: ela não vai pro banco.
- **O jogo** Qual é a caixa?, na chave `qual-e-a-caixa:` + o id da conta: a resposta e o tempo de cada rodada, quando a rodada em andamento abriu e o apelido. (O resultado de cada jogo terminado também vai pro Supabase, pro ranking.)
- **A sessão do login**, guardada pelo próprio Supabase.

O que o aluno faz fica guardado só naquele navegador, mas separado por conta: num computador compartilhado, cada aluno vê só o que ele fez. Numa janela anônima (ou com o armazenamento bloqueado), tudo funciona igual, só não lembra depois de recarregar. Se os dados mudarem (`historia.js`, `rounds.js`), uma resposta guardada que não bate mais é esquecida.
