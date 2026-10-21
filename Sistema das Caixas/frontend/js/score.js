(function (global) {
  "use strict";

  var Catalog = global.Rounds;
  var Caixas = global.Caixas;
  var Game = global.Game;
  var Format = global.Format;
  var Icons = global.Icons;
  var PlayView = global.PlayView;

  // O placar do fim do jogo: os pontos, os acertos e a maior sequência, como
  // o aluno foi em cada caixa, a tabela rodada por rodada e o que errar
  // ensina. O ranking fica no ranking.js (o game-app.js mostra os dois
  // juntos).

  // A última frase do que o placar mostra: a lição do jogo.
  var LICAO = "Para cada sonho, duas perguntas: <strong>quando</strong> (é isso que diz a caixa) e " +
    "<strong>quanto por mês</strong> (valor total ÷ quantidade de meses). Com as duas respostas, " +
    "dá para saber se o sonho cabe no saldo e, se não couber, o que mudar.";

  var semAnimacao = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var quadro = null;

  function el(id) { return document.getElementById(id); }
  function nw(s) { return '<span class="nw">' + Format.esc(s) + "</span>"; }
  function catOf(key) { return Catalog.categories.filter(function (c) { return c.key === key; })[0]; }

  /* ============ os números grandes ============ */
  // Um cartão por categoria do ranking: o número grande (que conta de 0 até
  // ele) e o que ele quer dizer.
  function scoreHTML(c, v, sub, unit) {
    return '<div class="gscore fx" data-tone="' + (v > 0 ? c.tone : "zero") + '">' +
      '<div class="gscore__head">' + Icons.tile(c.icon, c.tone, "itile--sm") +
        '<p class="gscore__label">' + Format.esc(c.name) + "</p>" +
      "</div>" +
      '<p class="gscore__value">' +
        '<span class="gscore__num" data-count="' + v + '" aria-hidden="true">' + Format.points(v) + "</span>" +
        '<span class="gscore__unit" aria-hidden="true">' + Format.esc(unit) + "</span>" +
        '<span class="sr-only">' + Format.points(v) + " " + Format.esc(unit) + "</span>" +
      "</p>" +
      '<p class="gscore__sub">' + sub + "</p>" +
      "</div>";
  }

  function scoresHTML(t) {
    var n = Catalog.list.length;
    var certas = Game.ids().filter(Game.isRight);
    var media = certas.length
      ? certas.reduce(function (s, id) { return s + Game.answerOf(id).ms; }, 0) / certas.length : 0;
    return scoreHTML(catOf("pontos"), t.pontos,
        "De " + nw(Format.points(Game.maxPoints())) + " possíveis (tudo certo, na hora).", "pontos") +
      scoreHTML(catOf("acertos"), t.acertos,
        "De " + nw(n + " rodadas") + "." + (certas.length ? " Nas certas, você levou " + nw(PlayView.secs(media)) + ", em média." : ""),
        t.acertos === 1 ? "acerto" : "acertos") +
      scoreHTML(catOf("sequencia"), t.sequencia,
        t.sequencia === n ? "Todas as rodadas certas, sem errar nenhuma!"
          : t.sequencia > 1 ? "A sua maior série de acertos, um atrás do outro."
          : "Acerte várias seguidas para a sequência crescer.",
        t.sequencia === 1 ? "seguido" : "seguidos");
  }

  // Cada número grande conta de 0 até o placar (quem pede menos movimento
  // já vê o número pronto). O placar já vem escrito no HTML e só vira 0 no
  // primeiro quadro da animação: se ela não rodar, o número certo fica.
  function contar() {
    cancelAnimationFrame(quadro);
    var nums = Array.prototype.slice.call(el("fn-scores").querySelectorAll("[data-count]"));
    if (semAnimacao) return;
    var inicio = null;
    var DURACAO = 1100;
    function passo(agora) {
      if (inicio === null) inicio = agora;
      var p = Math.min((agora - inicio) / DURACAO, 1);
      var suave = 1 - Math.pow(1 - p, 3);
      nums.forEach(function (n) {
        var alvo = Number(n.getAttribute("data-count"));
        n.textContent = Format.points(p < 1 ? Math.round(alvo * suave) : alvo);
      });
      if (p < 1) quadro = requestAnimationFrame(passo);
    }
    quadro = requestAnimationFrame(passo);
  }

  /* ============ as caixas ============ */
  // Nas rodadas "qual é a caixa", quantas o aluno acertou de cada caixa
  // (pela caixa certa da meta). A caixa com tudo certo fica de tampa aberta.
  function boxesHTML() {
    var rounds = Catalog.list.filter(function (r) { return r.type === "caixa"; });
    return Caixas.list.map(function (c) {
      var mine = rounds.filter(function (r) { return Catalog.answerOf(r) === c.key; });
      var ok = mine.filter(function (r) { return Game.isRight(String(r.id)); }).length;
      var full = mine.length && ok === mine.length;
      return '<li class="gbox tone-' + c.key + (full ? " is-full" : "") + '">' +
        '<span class="gbox__art">' + Icons.box(c.key) + "</span>" +
        '<span class="gbox__text"><span class="gbox__name">' + Format.esc(c.name) + "</span>" +
        '<span class="gbox__range">' + Format.esc(c.range) + "</span></span>" +
        '<span class="gbox__score">' + (mine.length ? ok + " de " + mine.length : "—") + "</span>" +
        "</li>";
    }).join("");
  }

  /* ============ a tabela ============ */
  // Uma linha por rodada: a resposta (com o certo ou errado), o tempo e os
  // pontos. No celular, o tempo vai pra baixo da resposta.
  function tableHTML(t) {
    var head = "<thead><tr>" +
      '<th scope="col">Rodada</th><th scope="col">Sua resposta</th>' +
      '<th scope="col" class="gtable__num gtable__time">Tempo</th><th scope="col" class="gtable__num">Pontos</th>' +
      "</tr></thead>";

    var body = "<tbody>" + Catalog.list.map(function (r) {
      var id = String(r.id);
      var a = Game.answerOf(id);
      var right = Game.isRight(id);
      var pts = Game.pointsOf(id);
      var certa = Catalog.answerOf(r);
      return '<tr class="' + (right ? "is-right" : "is-wrong") + '">' +
        '<th scope="row"><span class="gtable__round">' + id + '</span><span class="gtable__topic">' + Format.esc(r.topic) + "</span></th>" +
        '<td><div class="gtable__pick"><span class="gtable__mark" aria-hidden="true"></span>' + PlayView.tag(r, a.pick) +
          '<span class="gtable__text">' + Format.esc(PlayView.pickText(r, a.pick)) +
          '<span class="sr-only">' + (right ? " (certa)" : " (errada)") + "</span>" +
          (right ? "" : '<span class="gtable__kind">A certa: ' + Format.esc(PlayView.pickText(r, certa)) + "</span>") +
          '<span class="gtable__effect">' + (a.pick ? "Em " + Format.esc(PlayView.secs(a.ms)) : "O tempo acabou") +
            (r.multiplier > 1 ? " · pontos em dobro" : "") + "</span>" +
          "</span></div></td>" +
        '<td class="gtable__num gtable__time">' + (a.pick ? Format.esc(PlayView.secs(a.ms).replace(" segundos", " s").replace(" segundo", " s")) : "—") + "</td>" +
        '<td class="gtable__num" data-tone="' + (pts > 0 ? "violet" : "zero") + '">' + Format.points(pts) +
          (r.multiplier > 1 ? '<span class="gtable__x">×' + r.multiplier + "</span>" : "") + "</td>" +
        "</tr>";
    }).join("") + "</tbody>";

    var foot = '<tfoot><tr><th scope="row" colspan="2">Total</th><td class="gtable__time"></td>' +
      '<td class="gtable__num" data-tone="violet">' + Format.points(t.pontos) + "</td></tr></tfoot>";

    return '<caption class="sr-only">As suas respostas, rodada por rodada</caption>' + head + body + foot;
  }

  /* ============ o que o placar mostra ============ */
  // Um resumo do jogo e, pra cada rodada errada, a dica dela (sem repetir a
  // mesma dica duas vezes).
  function insightHTML(t) {
    var n = Catalog.list.length;
    var erradas = Catalog.list.filter(function (r) { return !Game.isRight(String(r.id)); });
    var tempo = erradas.filter(function (r) { return !Game.answerOf(String(r.id)).pick; }).length;
    var resumo = t.acertos === n
      ? "Você acertou <strong>as " + n + " rodadas</strong>: já sabe qual é a caixa de cada sonho e quanto guardar por mês. Mandou bem!"
      : "Você acertou <strong>" + t.acertos + " de " + n + " rodadas</strong>" +
        (tempo ? ", e em " + nw(tempo === 1 ? "1 delas" : tempo + " delas") + " o tempo acabou" : "") +
        ". Veja o que as que você errou ensinam:";

    var vistas = [];
    var dicas = erradas.filter(function (r) {
      if (!r.tip || vistas.indexOf(r.tip) >= 0) return false;
      vistas.push(r.tip);
      return true;
    }).map(function (r) {
      return '<li><span class="insight__tip">' + Icons.tile(r.icon, "amber", "itile--xs") +
        "<strong>Rodada " + r.id + "</strong></span> " + Format.esc(r.tip) + "</li>";
    });

    return '<p class="insight__title">' + Icons.tile("lampada", "amber", "itile--xs") + "O que o seu placar mostra</p>" +
      "<p>" + resumo + "</p>" +
      (dicas.length ? '<ul class="insight__tips">' + dicas.join("") + "</ul>" : "") +
      "<p>" + LICAO + "</p>";
  }

  /* ============ API ============ */
  // só se chega aqui com todas as rodadas respondidas
  function show() {
    var t = Game.totals();
    // o primeiro nome que a pessoa cadastrou no login
    var nome = global.Session ? global.Session.firstName() : "";

    el("fn-kicker").textContent = "Fim do jogo · " + Catalog.list.length + " rodadas";
    el("fn-title").textContent = nome ? "O seu placar, " + nome : "O seu placar";

    el("fn-scores").innerHTML = scoresHTML(t);
    el("fn-boxes").innerHTML = boxesHTML();
    el("fn-table").innerHTML = tableHTML(t);
    el("fn-insight").innerHTML = insightHTML(t);
    Icons.mount(el("sec-final"));
    el("sec-final").hidden = false;
    contar();
  }

  function hide() {
    cancelAnimationFrame(quadro);
    el("sec-final").hidden = true;
  }

  global.ScoreView = {
    show: show,
    hide: hide
  };
})(window);
