(function (global) {
  "use strict";

  var Caixas = global.Caixas;

  // O jogo "Qual é a caixa?": 10 rodadas com tempo, como no Kahoot, do fácil
  // ao difícil. Em cada rodada aparece uma meta (ou uma conta das caixas) e o
  // aluno escolhe a resposta antes que o tempo acabe. Quem acerta ganha de
  // 500 a 1.000 pontos: quanto mais rápido, mais pontos. Errar ou deixar o
  // tempo acabar dá 0. No fim, o placar e o ranking da turma.
  //
  // O sistema não guarda o placar pronto: ele soma os pontos a partir daqui
  // e das respostas do aluno. Mudando uma rodada, o placar e os textos
  // acompanham.

  // Os pontos de quem acerta: MAX na hora em que as opções aparecem, caindo
  // até a metade (MAX / 2) no último segundo, como no Kahoot.
  var MAX = 1000;

  // As categorias do placar e do ranking (as abas do ranking), na ordem.
  // where: a categoria no meio da frase ("Você está em 2º lugar nos pontos").
  // about: o que ela quer dizer, na abertura do jogo.
  // icon: o desenho do quadrinho (os nomes estão em frontend/js/icons.js).
  // tone: a cor dela.
  var CATEGORIES = [
    { key: "pontos", name: "Pontos", where: "nos pontos", about: "A soma das rodadas: acertar rápido vale mais.", icon: "trofeu", tone: "violet" },
    { key: "acertos", name: "Acertos", where: "nos acertos", about: "Quantas rodadas você acertou, sem contar o tempo.", icon: "alvo", tone: "green" },
    { key: "sequencia", name: "Sequência", where: "na sequência", about: "A maior série de acertos seguidos, sem errar no meio.", icon: "raio", tone: "amber" }
  ];

  // Os níveis das rodadas: aparecem numa etiqueta no cartão de cada uma.
  // time: os segundos pra responder (as rodadas de conta têm mais tempo).
  var LEVELS = {
    1: { name: "Fácil", tone: "green", time: 20 },
    2: { name: "Médio", tone: "amber", time: 30 },
    3: { name: "Difícil", tone: "pink", time: 30 }
  };

  // As 10 rodadas, na ordem do jogo.
  // type: "caixa" (as opções são as 3 caixas) ou "escolha" (de 2 a 4
  //   opções, de A a D, com as formas do Kahoot).
  // topic: o nome curto (vai nas etapas e na tabela do placar).
  // level: o nível (1, 2 ou 3, acima). time: os segundos, se não for o do nível.
  // multiplier: quantas vezes os pontos da rodada valem (opcional; a última
  //   vale em dobro, como a pergunta final do Kahoot).
  // icon: o desenho do quadrinho da rodada.
  // situation: a situação (grande, no alto do cartão). question: a pergunta.
  // Numa rodada "caixa": months é o prazo da meta, em meses; a caixa certa
  //   sai dele (Caixas.of, em backend/js/caixas.js).
  // Numa rodada "escolha": options, de A a D (text é o que aparece no botão
  //   e why, o que aparece depois, ao lado dela), e answer, a letra certa.
  // why: a explicação, que aparece depois da resposta.
  // tip: a dica do placar final, pra quem errou esta rodada.
  var LIST = [
    {
      id: 1,
      type: "caixa",
      topic: "Fone novo",
      level: 1,
      icon: "fone",
      situation: "O Theo quer um fone de ouvido novo daqui a 4 meses.",
      question: "Em qual caixa vai essa meta?",
      months: 4,
      why: "4 meses estão entre 0 e 12 meses: é uma meta de curto prazo.",
      tip: "A caixa sai do prazo: até 12 meses é curto; de 1 a 5 anos, médio; acima de 5 anos, longo."
    },
    {
      id: 2,
      type: "caixa",
      topic: "Faculdade",
      level: 1,
      icon: "capelo",
      situation: "A Maria quer ter o dinheiro da faculdade daqui a 6 anos.",
      question: "Em qual caixa vai essa meta?",
      months: 72,
      why: "6 anos passam de 5 anos: é uma meta de longo prazo. Sonho grande precisa de tempo.",
      tip: "Acima de 5 anos (mais de 60 meses), a meta vai para o longo prazo."
    },
    {
      id: 3,
      type: "escolha",
      topic: "Tênis",
      level: 1,
      icon: "tenis",
      situation: "Um tênis de R$ 300, para comprar daqui a 6 meses.",
      question: "Quanto guardar por mês?",
      answer: "B",
      options: {
        A: { text: "R$ 30,00", why: "R$ 30 por 6 meses juntam só R$ 180." },
        B: { text: "R$ 50,00", why: "R$ 300 ÷ 6 meses = R$ 50 por mês." },
        C: { text: "R$ 60,00", why: "R$ 60 por 6 meses juntam R$ 360: sobra." },
        D: { text: "R$ 1.800,00", why: "Esse é R$ 300 × 6: a conta é de dividir." }
      },
      why: "Valor total ÷ quantidade de meses: R$ 300 ÷ 6 = R$ 50 por mês. Em 6 meses, o tênis está pago.",
      tip: "A conta das caixas: valor total ÷ quantidade de meses."
    },
    {
      id: 4,
      type: "caixa",
      topic: "Viagem",
      level: 2,
      icon: "aviao",
      situation: "A turma da Bruna vai viajar daqui a 1 ano e meio.",
      question: "Em qual caixa vai a viagem?",
      months: 18,
      why: "1 ano e meio são 18 meses: passa de 12 meses e fica abaixo de 5 anos. É médio prazo.",
      tip: "Passou de 12 meses, a meta sai do curto prazo: de 13 meses a 5 anos é médio prazo."
    },
    {
      id: 5,
      type: "caixa",
      topic: "12 meses",
      level: 2,
      icon: "celular",
      situation: "O Caio quer trocar de celular daqui a 12 meses, nem um a mais.",
      question: "Em qual caixa vai essa meta? Cuidado com a pegadinha!",
      months: 12,
      why: "A caixa do curto prazo vai de 0 a 12 meses, com o 12 junto. Com 13 meses, aí sim seria médio prazo.",
      tip: "Os limites contam: 12 meses ainda é curto prazo e 5 anos (60 meses) ainda é médio."
    },
    {
      id: 6,
      type: "escolha",
      topic: "Notebook",
      level: 2,
      icon: "notebook",
      situation: "Um notebook de R$ 3.600, para comprar daqui a 2 anos.",
      question: "Quanto guardar por mês?",
      answer: "C",
      options: {
        A: { text: "R$ 1.800,00", why: "Esse dividiu por 2 anos: a conta é em meses." },
        B: { text: "R$ 300,00", why: "Esse dividiu por 12: 2 anos são 24 meses." },
        C: { text: "R$ 150,00", why: "2 anos = 24 meses. R$ 3.600 ÷ 24 = R$ 150." },
        D: { text: "R$ 180,00", why: "R$ 180 por 24 meses juntam R$ 4.320: sobra." }
      },
      why: "Primeiro, o prazo em meses: 2 anos = 24 meses. Depois, R$ 3.600 ÷ 24 = R$ 150 por mês.",
      tip: "Antes de dividir, passe o prazo para meses: 1 ano = 12 meses, 2 anos = 24 meses."
    },
    {
      id: 7,
      type: "escolha",
      topic: "Carteira",
      level: 2,
      icon: "cartao",
      situation: "Hoje é março de 2027. A Lara quer tirar a carteira de motorista em março de 2029.",
      question: "Quantos meses faltam?",
      answer: "C",
      options: {
        A: { text: "2 meses", why: "São 2 anos, e não 2 meses." },
        B: { text: "12 meses", why: "12 meses levam só a março de 2028." },
        C: { text: "24 meses", why: "De março de 2027 a março de 2029: 2 anos = 24 meses." },
        D: { text: "36 meses", why: "36 meses levariam a março de 2030." }
      },
      why: "De março de 2027 a março de 2029 são 2 anos, ou seja, 24 meses. A carteira vai para a caixa do médio prazo.",
      tip: "Para contar os meses até uma data, conte os anos inteiros (12 meses cada) e some os meses que sobram."
    },
    {
      id: 8,
      type: "caixa",
      topic: "5 anos",
      level: 3,
      icon: "carro",
      situation: "O Davi quer dar a entrada numa moto daqui a 5 anos, nem um mês a mais.",
      question: "Em qual caixa vai essa meta? Outra pegadinha!",
      months: 60,
      why: "A caixa do médio prazo vai de 1 a 5 anos, com os 5 anos (60 meses) junto. Só acima de 5 anos é longo prazo.",
      tip: "Os limites contam: 12 meses ainda é curto prazo e 5 anos (60 meses) ainda é médio."
    },
    {
      id: 9,
      type: "escolha",
      topic: "Cabe?",
      level: 3,
      icon: "videogame",
      situation: "A Duda tem R$ 300 de saldo por mês. Ela quer um videogame de R$ 2.400 daqui a 6 meses.",
      question: "Essa meta cabe no saldo dela?",
      answer: "B",
      options: {
        A: { text: "Sim, cabe", why: "R$ 2.400 ÷ 6 = R$ 400 por mês: passa do saldo." },
        B: { text: "Não cabe", why: "Ela teria que guardar R$ 400 por mês, e o saldo é R$ 300." }
      },
      why: "R$ 2.400 ÷ 6 meses = R$ 400 por mês, e o saldo é de R$ 300: não cabe. Mas, se ela adiar para daqui a 8 meses, fica R$ 2.400 ÷ 8 = R$ 300, e aí cabe!",
      tip: "Quando a meta não cabe no saldo, dá para adiar a data: com mais meses, a parte de cada mês fica menor."
    },
    {
      id: 10,
      type: "escolha",
      topic: "Pesa mais",
      level: 3,
      multiplier: 2,
      icon: "balanca",
      situation: "Quatro metas, quatro prazos.",
      question: "Qual delas pede mais dinheiro por mês?",
      answer: "A",
      options: {
        A: { text: "Um fone de R$ 240, daqui a 3 meses", why: "R$ 240 ÷ 3 = R$ 80 por mês." },
        B: { text: "Um carro de R$ 9.000, daqui a 10 anos", why: "R$ 9.000 ÷ 120 meses = R$ 75 por mês." },
        C: { text: "Um curso de R$ 1.200, daqui a 2 anos", why: "R$ 1.200 ÷ 24 meses = R$ 50 por mês." },
        D: { text: "Uma viagem de R$ 2.000, daqui a 4 anos", why: "R$ 2.000 ÷ 48 meses = R$ 41,67 por mês." }
      },
      why: "O fone pede R$ 80 por mês; o carro, que custa quase 40 vezes mais, pede R$ 75. Com muitos meses pela frente, até uma meta cara pesa pouco no mês.",
      tip: "Uma meta barata de curto prazo pode pesar mais no mês que uma cara de longo prazo: o prazo divide o valor."
    }
  ];

  // as letras das opções, na ordem dos botões (cada rodada usa as primeiras)
  var LETTERS = ["A", "B", "C", "D"];

  // as opções de uma rodada: as letras ou, numa rodada "caixa", as caixas
  function choicesOf(round) {
    if (round.type === "caixa") return Caixas.list.map(function (c) { return c.key; });
    return LETTERS.filter(function (l) { return !!round.options[l]; });
  }

  // a resposta certa: a letra, ou a caixa do prazo da meta
  function answerOf(round) {
    return round.type === "caixa" ? Caixas.of(round.months).key : round.answer;
  }

  // os segundos pra responder
  function timeOf(round) {
    return round.time || (LEVELS[round.level] && LEVELS[round.level].time) || 20;
  }

  // Confere os dados quando a página abre: uma rodada sem resposta, com a
  // resposta numa opção que não existe ou com as opções puladas (A, C sem B)
  // quebraria o jogo sem aviso.
  LIST.forEach(function (r) {
    if (r.type === "caixa") {
      if (!(r.months > 0)) console.warn("Rodada " + r.id + ": falta o prazo da meta (months).");
      return;
    }
    var ls = choicesOf(r);
    if (ls.length < 2 || ls.join("") !== LETTERS.slice(0, ls.length).join("")) {
      console.warn("Rodada " + r.id + ": as opções têm que ser de 2 a 4, em ordem, a partir da A.");
    }
    if (ls.indexOf(r.answer) < 0) console.warn("Rodada " + r.id + ": a resposta certa (answer) não é uma das opções.");
    if (!LEVELS[r.level]) console.warn("Rodada " + r.id + ": o nível " + r.level + " não existe em LEVELS.");
  });

  global.Rounds = {
    list: LIST,
    max: MAX,
    categories: CATEGORIES,
    levels: LEVELS,
    letters: LETTERS,
    choicesOf: choicesOf,
    answerOf: answerOf,
    timeOf: timeOf,
    byId: function (id) {
      id = Number(id);
      for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i];
      return null;
    }
  };
})(window);
