(function (global) {
  "use strict";

  var fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmtInt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  var fmtNum = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  var fmtCents = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // "R$ 10.000,00" — e "−R$ 250,00" quando é negativo (o sinal vem antes do
  // R$, com o traço de menos de verdade)
  function money(v) {
    v = v || 0;
    return (v < 0 ? "−" : "") + fmtBRL.format(Math.abs(v));
  }

  // "R$ 30.000" quando não tem centavos, "R$ 5.000,50" quando tem. Serve nos
  // lugares apertados (medidores, etiquetas) sem esconder centavo nenhum.
  function compactMoney(v) {
    v = v || 0;
    if (Math.round(v * 100) % 100 !== 0) return money(v);
    return (v < 0 ? "−" : "") + "R$ " + fmtInt.format(Math.abs(v));
  }

  // "+R$ 50,00" quando sobra, "−R$ 80,00" quando falta e "R$ 0,00" quando
  // fica igual
  function signed(v, compact) {
    var s = compact ? compactMoney(v) : money(v);
    return v > 0 ? "+" + s : s;
  }

  // "0,7%", "72,3%" e "40%": casa decimal só quando ela existe de verdade
  function pct(n) {
    return (Math.round(n * 10) / 10).toFixed(1).replace(".", ",").replace(/,0$/, "") + "%";
  }

  function int(n) { return fmtInt.format(n || 0); }

  // os pontos do jogo "Qual é a caixa?": "870", "1.740"
  function points(n) { return fmtInt.format(n || 0); }

  /* ============ meses e datas ============ */
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
    "agosto", "setembro", "outubro", "novembro", "dezembro"];

  // um mês do ano, { y: 2027, m: 4 }: "abril de 2027" (cap = "Abril de 2027")
  function monthYear(d, cap) {
    var s = MESES[d.m - 1] + " de " + d.y;
    return cap ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // "abr/2027", pra onde não cabe o nome inteiro (a régua do tempo)
  function monthShort(d) {
    return MESES[d.m - 1].slice(0, 3) + "/" + d.y;
  }

  // quantos meses de um mês a outro: de janeiro a abril de 2027 são 3
  function monthsBetween(from, to) {
    return (to.y - from.y) * 12 + (to.m - from.m);
  }

  // o mês que fica a n meses de outro
  function addMonths(d, n) {
    var t = d.y * 12 + (d.m - 1) + n;
    return { y: Math.floor(t / 12), m: (t % 12) + 1 };
  }

  // o mês de hoje, do relógio do computador
  function thisMonth() {
    var now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1 };
  }

  // um prazo em meses do jeito que se fala: "3 meses", "1 ano", "2 anos e
  // 3 meses"
  function duration(n) {
    var y = Math.floor(n / 12);
    var m = n % 12;
    var parts = [];
    if (y) parts.push(y + (y === 1 ? " ano" : " anos"));
    if (m || !y) parts.push(m + (m === 1 ? " mês" : " meses"));
    return parts.join(" e ");
  }

  // Um valor com a unidade dele, como nas células da planilha: "R$ 360,00",
  // "3 meses" (e "2,5 meses" quando a conta do aluno não dá redondo).
  // compact tira os centavos que não existem.
  var WORDS = {
    anos: ["ano", "anos"],
    meses: ["mês", "meses"],
    metas: ["meta", "metas"]
  };
  function unit(v, u, compact) {
    if (u === "money") return compact ? compactMoney(v) : money(v);
    if (u === "pct") return pct(v * 100);
    var w = WORDS[u];
    return fmtNum.format(v || 0) + (w ? " " + (v === 1 ? w[0] : w[1]) : "");
  }

  // o número sozinho, do jeito que fica dentro da célula de cálculo (o "R$"
  // e o "meses" já estão desenhados em volta dela): "120,00", "3"
  function plain(v, u) {
    return u === "money" ? fmtCents.format(v || 0) : fmtNum.format(v || 0);
  }

  // a palavra da unidade no plural, pra ficar do lado da célula ("meses")
  function unitWord(u) {
    return WORDS[u] ? WORDS[u][1] : "";
  }

  // "Faltam a Etapa 3, a 4 e a 5" e listas assim: "a, b e c"
  function list(items) {
    if (items.length < 2) return items.join("");
    return items.slice(0, -1).join(", ") + " e " + items[items.length - 1];
  }

  // escapa o texto pro HTML e prende o "R$" ao número (espaço inquebrável),
  // pra "R$" nunca ficar no fim de uma linha e o valor na outra
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/R\$ /g, "R$ ");
  }

  global.Format = {
    money: money,
    compactMoney: compactMoney,
    signed: signed,
    pct: pct,
    int: int,
    points: points,
    months: MESES,
    monthYear: monthYear,
    monthShort: monthShort,
    monthsBetween: monthsBetween,
    addMonths: addMonths,
    thisMonth: thisMonth,
    duration: duration,
    unit: unit,
    plain: plain,
    unitWord: unitWord,
    list: list,
    esc: esc
  };
})(window);
