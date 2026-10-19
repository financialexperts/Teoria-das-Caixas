(function (global) {
  "use strict";

  var H = global.Historia;
  var Ex = global.Exercise;
  var Format = global.Format;
  var Icons = global.Icons;

  // O plano da Bia, quando a última etapa fica certa: quanto ela guarda por
  // mês, para onde vai o saldo, o que cada caixa leva e quando cada sonho se
  // realiza.

  // A ideia da aula, em uma frase: fecha a análise do resultado.
  var LICAO = "É a teoria das caixas: separar as metas pelo <strong>prazo</strong> e dividir o valor total pelos " +
    "<strong>meses que faltam</strong>. Quanto mais longe a data, menor a parte de cada mês. Por isso vale começar cedo, até os sonhos grandes.";

  var semAnimacao = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var quadro = null;

  function el(id) { return document.getElementById(id); }
  function nw(s) { return '<span class="nw">' + Format.esc(s) + "</span>"; }

  // Para onde vai o saldo: uma barra com um pedaço por caixa, na cor dela,
  // e o que sobra (a folga), listrado. Se o plano passar do saldo, a barra
  // é a do plano e a linha vermelha marca onde o saldo acaba.
  function splitHTML(t) {
    var base = Math.max(t.saldo, t.planned, 1);
    var parts = Ex.boxes.map(function (b) {
      return { key: b.key, name: b.caixa.name, v: b.monthly };
    });
    if (t.sobra > 0) parts.push({ key: "folga", name: "Folga (o que sobra)", v: t.sobra });
    var label = parts.map(function (p) { return p.name + ": " + Format.money(p.v); }).join("; ");
    return '<div class="sbar">' +
      '<p class="sbar__title">Para onde vai o saldo de ' + nw(Format.money(t.saldo)) + "</p>" +
      '<div class="sbar__track" role="img" aria-label="' + Format.esc(label) + '">' +
        parts.map(function (p, i) {
          var w = p.v / base * 100;
          return '<span class="sbar__seg sbar__seg--' + p.key + '" style="width:' + w + "%;--i:" + i + '">' +
            (w >= 9 ? '<span class="sbar__pct">' + Format.pct(p.v / t.saldo * 100) + "</span>" : "") + "</span>";
        }).join("") +
        (t.sobra < 0 ? '<span class="sbar__limit" style="left:' + (t.saldo / base * 100) + '%"></span>' : "") +
      "</div>" +
      '<ul class="sbar__legend">' + parts.map(function (p) {
        return '<li class="sbar__item sbar__item--' + p.key + '"><span class="sbar__dot" aria-hidden="true"></span>' +
          '<span class="sbar__name">' + Format.esc(p.name) + "</span>" +
          '<span class="sbar__val">' + nw(Format.money(p.v)) + "</span></li>";
      }).join("") +
      (t.sobra < 0 ? '<li class="sbar__item sbar__item--over"><span class="sbar__dot" aria-hidden="true"></span>' +
        '<span class="sbar__name">Passa do saldo</span><span class="sbar__val">' + nw(Format.money(-t.sobra)) + "</span></li>" : "") +
      "</ul>" +
      "</div>";
  }

  // um cartãozinho por caixa: quanto ela leva por mês e até quando
  function statHTML(b) {
    var last = Ex.lastOf(b);
    var n = b.metas.length;
    return '<div class="stat stat--' + b.key + ' fx">' +
      '<p class="stat__label"><span class="stat__box">' + Icons.box(b.key) + "</span>" + Format.esc(b.caixa.name) + "</p>" +
      '<p class="stat__value">' + Format.esc(Format.money(b.monthly)) + '<span class="stat__per"> por mês</span></p>' +
      '<p class="stat__sub">' + n + (n === 1 ? " meta, até " : " metas, até ") + Format.esc(Format.monthYear(last.date)) + "</p>" +
      "</div>";
  }

  function cmpHTML(label, value, cls) {
    return '<div class="cmp__col"><p class="ledger__label">' + label + "</p>" +
      '<p class="ledger__num' + (cls ? " " + cls : "") + '">' + value + "</p></div>";
  }

  // As conquistas, da mais perto à mais longe: a caixa e o mês de cada meta,
  // o pedaço do saldo que ela leva e as contas da folha.
  function rowHTML(m, saldo) {
    var p = saldo > 0 ? m.monthly / saldo * 100 : 0;
    return '<li class="ledger__row ledger__row--' + m.caixa.key + ' fx">' +
      Icons.tile(m.icon, m.caixa.key, "itile--sm") +
      '<div class="ledger__main">' +
        '<p class="ledger__badge">' + Format.esc(m.caixa.name) + " · " + Format.esc(Format.monthYear(m.date, true)) + "</p>" +
        '<p class="ledger__title">' + Format.esc(m.name) + "</p>" +
        '<div class="share"><span class="share__track" aria-hidden="true"><span class="share__fill" style="width:' + Math.min(p, 100) + '%"></span></span>' +
          '<span class="share__label">' + Format.pct(p) + " do saldo</span></div>" +
      "</div>" +
      '<div class="cmp">' +
        cmpHTML("Valor total", Format.esc(Format.compactMoney(m.total))) +
        cmpHTML("Meses", Format.esc(Format.unit(m.months, "meses"))) +
        cmpHTML("Por mês", Format.esc(Format.money(m.monthly)), "is-up") +
      "</div>" +
      "</li>";
  }

  // "20 vezes mais", quando dá um número redondo de vezes; senão, "muito mais"
  function vezes(a, b) {
    var r = a / b;
    return Math.abs(r - Math.round(r)) < 0.05 && r >= 2 ? Math.round(r) + " vezes mais" : "muito mais";
  }

  // O que os números mostram: a meta mais cara pesa menos no mês do que uma
  // bem mais barata, quando tem muito mais tempo, e a caixa de curto prazo
  // fica livre logo. Os nomes vão como etiqueta ("<strong>Primeiro
  // carro</strong>"), sem artigo: assim a frase serve pra qualquer meta de
  // historia.js.
  function insightHTML() {
    var metas = Ex.metas;
    var cara = metas.slice().sort(function (a, b) { return b.total - a.total; })[0];
    // a meta mais barata que pede mais por mês do que a mais cara
    var surpresa = metas.filter(function (m) { return m.monthly > cara.monthly; })
      .sort(function (a, b) { return a.total - b.total; })[0];
    var txt;
    if (surpresa) {
      txt = "Repare: <strong>" + Format.esc(surpresa.name) + "</strong> custa " + nw(Format.money(surpresa.total)) +
        " e pede " + nw(Format.money(surpresa.monthly)) + " por mês. <strong>" + Format.esc(cara.name) + "</strong> custa " +
        vezes(cara.total, surpresa.total) + " (" + nw(Format.money(cara.total)) + "), mas pede só " + nw(Format.money(cara.monthly)) +
        " por mês: são " + nw(Format.unit(cara.months, "meses")) + " para juntar, contra " + nw(Format.unit(surpresa.months, "meses")) + ".";
    } else {
      txt = "A meta mais cara, <strong>" + Format.esc(cara.name) + "</strong>, também é a que mais pesa no mês: " +
        nw(Format.money(cara.monthly)) + " por mês, por " + nw(Format.unit(cara.months, "meses")) + ".";
    }
    var curto = Ex.boxes[0];
    var livre = curto && Ex.boxes.length > 1
      ? "<p>Em " + nw(Format.monthYear(Ex.lastOf(curto).date)) + ", as metas de " + Format.esc(curto.caixa.name.toLowerCase()) +
        " já estarão realizadas: os " + nw(Format.money(curto.monthly)) + " por mês dessa caixa ficam livres para novas metas.</p>"
      : "";
    return '<p class="insight__title">' + Icons.tile("lampada", "amber", "itile--xs") + "O que os números mostram</p>" +
      "<p>" + txt + "</p>" + livre +
      "<p>" + LICAO + "</p>";
  }

  // o número grande conta de zero até o total por mês (quem pede menos
  // movimento já vê o número pronto). O leitor de tela ouve só o valor final.
  function contar(alvo) {
    var box = el("fn-total-anim");
    cancelAnimationFrame(quadro);
    el("fn-total").textContent = Format.money(alvo);
    if (semAnimacao) {
      box.textContent = Format.money(alvo);
      return;
    }
    var inicio = null;
    var DURACAO = 1200;
    function passo(agora) {
      if (inicio === null) inicio = agora;
      var p = Math.min((agora - inicio) / DURACAO, 1);
      var suave = 1 - Math.pow(1 - p, 3);
      box.textContent = Format.money(p < 1 ? Math.round(alvo * suave) : alvo);
      if (p < 1) quadro = requestAnimationFrame(passo);
    }
    box.textContent = Format.money(0);
    quadro = requestAnimationFrame(passo);
  }

  function show() {
    var t = Ex.totals();
    var n = Ex.metas.length;
    var ordem = Ex.metas.slice().sort(function (a, b) { return a.months - b.months; });
    var fim = ordem[ordem.length - 1];

    el("fn-kicker").textContent = "De " + Format.monthYear(H.today) + " a " + Format.monthYear(fim.date);
    el("fn-total-label").textContent = "Para realizar os " + n + " sonhos, " + H.a + " vai guardar por mês";
    el("fn-total-sub").textContent = t.sobra >= 0
      ? "dos " + Format.money(t.saldo) + " de saldo: " + (t.sobra > 0 ? "sobram " + Format.money(t.sobra) + " de folga" : "o saldo todo")
      : "e o saldo é de " + Format.money(t.saldo) + ": faltam " + Format.money(-t.sobra) + " por mês";
    el("fn-split").innerHTML = splitHTML(t);
    el("fn-stats").innerHTML = Ex.boxes.map(statHTML).join("");
    el("fn-list").innerHTML = ordem.map(function (m) { return rowHTML(m, t.saldo); }).join("");
    el("fn-insight").innerHTML = insightHTML();
    el("sec-final").hidden = false;
    contar(t.planned);
  }

  function hide() {
    cancelAnimationFrame(quadro);
    el("sec-final").hidden = true;
  }

  global.ResultView = {
    show: show,
    hide: hide
  };
})(window);
