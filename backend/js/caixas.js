(function (global) {
  "use strict";

  // As 3 caixas da folha "Meu planejamento financeiro": cada meta vai para a
  // caixa do prazo dela, contado em meses a partir de hoje. As duas
  // atividades leem daqui, então os nomes e os prazos mudam aqui.
  //
  // key: o nome da caixa no código (e na cor do styles.css: --curto, --medio,
  //   --longo). name: o nome na tela. short: o nome curto (botões apertados).
  // range: o prazo, do jeito da folha. max: o último mês que ainda é desta
  //   caixa (12 meses ainda é curto prazo; 60 meses, 5 anos, ainda é médio).
  //   A última caixa não tem fim (Infinity).
  // examples: metas que costumam ir nela (vão nas dicas).
  var LIST = [
    {
      key: "curto",
      name: "Curto prazo",
      short: "Curto",
      range: "0 a 12 meses",
      max: 12,
      examples: "um fone, um tênis, um curso nas férias"
    },
    {
      key: "medio",
      name: "Médio prazo",
      short: "Médio",
      range: "1 a 5 anos",
      max: 60,
      examples: "a carteira de motorista, um notebook, uma viagem com a turma"
    },
    {
      key: "longo",
      name: "Longo prazo",
      short: "Longo",
      range: "acima de 5 anos",
      max: Infinity,
      examples: "o primeiro carro, a faculdade, a casa própria"
    }
  ];

  // a conta da folha, no rodapé dela
  var FORMULA = "Valor total ÷ Quantidade de meses";

  function byKey(key) {
    return LIST.filter(function (c) { return c.key === key; })[0] || null;
  }

  // a caixa de uma meta que fica a tantos meses de hoje
  function of(months) {
    for (var i = 0; i < LIST.length; i++) if (months <= LIST[i].max) return LIST[i];
    return LIST[LIST.length - 1];
  }

  // o primeiro mês da caixa (o curto prazo começa no 1; o médio, no 13)
  function minOf(caixa) {
    var i = LIST.indexOf(caixa);
    return i > 0 ? LIST[i - 1].max + 1 : 1;
  }

  global.Caixas = {
    list: LIST,
    formula: FORMULA,
    byKey: byKey,
    of: of,
    minOf: minOf
  };
})(window);
