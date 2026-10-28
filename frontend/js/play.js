(function (global) {
  "use strict";

  var Catalog = global.Rounds;
  var Caixas = global.Caixas;
  var Game = global.Game;
  var Format = global.Format;
  var Toast = global.Toast;
  var Icons = global.Icons;

  // As rodadas do jogo, uma de cada vez, como no Kahoot. Cada rodada é um
  // cartão com a situação e as opções em botões grandes: as 3 caixas, nas
  // rodadas "qual é a caixa", ou de 2 a 4 opções com as formas do Kahoot,
  // nas rodadas de conta. Quando a rodada abre, uma contagem (3, 2, 1)
  // segura as opções, pra todo mundo ler a situação antes; aí o tempo começa
  // a correr.
  //
  // O aluno toca numa opção e a resposta vale na hora: o cartão mostra se
  // acertou, os pontos, a explicação e (nas rodadas de caixa) onde a meta
  // fica na régua do tempo. Aí aparece o botão da próxima rodada.
  //
  // Em cima dos cartões ficam as etapas (uma por rodada) e o placar, que
  // gruda no alto: as rodadas, os pontos, os acertos e a sequência.

  var root = null;      // o container das etapas e dos cartões
  var on = {};          // avisa o game-app.js: picked(id) e final()
  var active = null;    // a rodada que está na tela: "1" a "10"
  var timer = null;     // a contagem (3, 2, 1) em andamento
  var relogio = null;   // o tempo da rodada correndo
  var shown = null;     // o placar que o alto está mostrando

  // a contagem antes das opções aparecerem: 3, 2, 1, um número a cada PASSO
  var CONTAGEM = 3;
  var PASSO = 750;
  // nos últimos segundos, o tempo fica vermelho
  var POUCO = 5000;

  var semAnimacao = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function nw(s) { return '<span class="nw">' + Format.esc(s) + "</span>"; }
  function el(id) { return document.getElementById(id); }

  function nextOf(id) {
    var list = Game.ids();
    return list[list.indexOf(String(id)) + 1] || null;
  }
  function prevOf(id) {
    var list = Game.ids();
    return list[list.indexOf(String(id)) - 1] || null;
  }

  // "4,2 segundos"
  function secs(ms) {
    var s = Math.round(ms / 100) / 10;
    return String(s).replace(".", ",") + (s === 1 ? " segundo" : " segundos");
  }
  // "+870"
  function plus(n) { return (n > 0 ? "+" : "") + Format.points(n); }

  /* ============ peças que as telas repetem ============ */
  // A forma de cada opção, como no Kahoot: triângulo, losango, círculo e
  // quadrado.
  var SHAPES = {
    A: '<path d="M12 3.2l9.8 17H2.2z"/>',
    B: '<path d="M12 2l10 10-10 10L2 12z"/>',
    C: '<circle cx="12" cy="12" r="9.5"/>',
    D: '<rect x="3" y="3" width="18" height="18" rx="2.5"/>'
  };
  function shape(letter, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (SHAPES[letter] || SHAPES.C) + "</svg>";
  }

  // A etiqueta pequena de uma resposta: a forma e a letra na cor dela, ou a
  // caixa desenhada com o nome curto (vai no que a resposta deu e na tabela
  // do placar). Sem resposta (o tempo acabou), um traço.
  function tagHTML(round, pick) {
    if (!pick) return '<span class="rletter rletter--none">—</span>';
    if (round.type === "caixa") {
      var c = Caixas.byKey(pick);
      return '<span class="rletter rletter--box tone-' + c.key + '">' + Icons.box(c.key, "rletter__box") + Format.esc(c.short) + "</span>";
    }
    return '<span class="rletter rletter--' + pick.toLowerCase() + '">' + shape(pick, "rletter__shape") + pick + "</span>";
  }

  // o texto de uma resposta: a da opção ou o nome da caixa
  function pickText(round, pick) {
    if (!pick) return "Sem resposta: o tempo acabou";
    return round.type === "caixa" ? Caixas.byKey(pick).name : round.options[pick].text;
  }

  /* ============ a régua do tempo ============ */
  // Nas rodadas de caixa, a resposta mostra onde a meta fica: uma régua do
  // tempo, com cada caixa num terço (o longo prazo vai até 10 anos).
  var EDGES = [0, 12, 60, 120];
  function pos(months) {
    var m = Math.min(months, EDGES[3]);
    for (var i = 0; i < 3; i++) {
      if (m <= EDGES[i + 1]) return (i + (m - EDGES[i]) / (EDGES[i + 1] - EDGES[i])) / 3 * 100;
    }
    return 100;
  }

  function rulerHTML(r) {
    var fit = Caixas.of(r.months);
    var ticks = [{ m: 0, t: "hoje" }, { m: 12, t: "1 ano" }, { m: 60, t: "5 anos" }, { m: 120, t: "10 anos" }];
    return '<div class="rruler" aria-hidden="true">' +
      '<span class="rruler__track">' +
        Caixas.list.map(function (c, i) {
          return '<span class="rruler__zone tone-' + c.key + (c.key === fit.key ? " is-on" : "") + '" style="left:' + (i / 3 * 100) + '%"></span>';
        }).join("") +
        '<span class="rruler__pin tone-' + fit.key + '" style="left:' + pos(r.months) + '%">' + Icons.svg(r.icon) + "</span>" +
      "</span>" +
      '<span class="rruler__ticks">' + ticks.map(function (k, i) {
        var edge = i === 0 ? " is-first" : i === ticks.length - 1 ? " is-last" : "";
        return '<span class="rruler__tick' + edge + '" style="left:' + pos(k.m) + '%">' + k.t + "</span>";
      }).join("") + "</span>" +
      "</div>";
  }

  /* ============ montagem da tela ============ */
  // As etapas, em cima dos cartões: uma por rodada. Tocar numa leva até ela,
  // se ela já abriu. Com muitas rodadas, o celular mostra só os números.
  function stepsHTML() {
    var many = Catalog.list.length > 6 ? " steps--many" : "";
    return '<nav class="card steps' + many + '" id="steps" aria-label="Rodadas do jogo"><ol class="steps__list">' +
      Catalog.list.map(function (r) {
        var id = String(r.id);
        return '<li class="steps__item" data-step-item="' + id + '">' +
          '<button class="steps__btn" type="button" data-step="' + id + '" title="Rodada ' + id + ": " + Format.esc(r.topic) + '">' +
            '<span class="steps__num" aria-hidden="true">' + id + "</span>" +
            '<span class="steps__kicker" aria-hidden="true">Rodada ' + id + "</span>" +
            '<span class="steps__name" aria-hidden="true">' + Format.esc(r.topic) + "</span>" +
            '<span class="sr-only">Rodada ' + id + ": " + Format.esc(r.topic) + '<span data-step-state></span></span>' +
          "</button>" +
          "</li>";
      }).join("") +
      "</ol></nav>";
  }

  // Um botão de opção. Nas rodadas de caixa, a caixa desenhada (que abre a
  // tampa quando é a escolhida), o nome e o prazo; nas outras, a forma na
  // cor dela, a letra e o texto.
  function optHTML(r, pick) {
    var base = '" type="button" data-pick="' + pick + '" data-round="' + r.id + '">';
    var marks = '<span class="ropt__mark ropt__mark--you">Sua resposta</span>' +
      '<span class="ropt__mark ropt__mark--right">Resposta certa</span>';
    if (r.type === "caixa") {
      var c = Caixas.byKey(pick);
      return '<button class="ropt ropt--box ropt--' + c.key + base +
        '<span class="ropt__art" aria-hidden="true">' + Icons.box(c.key) + "</span>" +
        '<span class="ropt__body">' +
          '<span class="ropt__text">' + Format.esc(c.name) + "</span>" +
          '<span class="ropt__letter">' + Format.esc(c.range) + "</span>" +
        "</span>" + marks + "</button>";
    }
    return '<button class="ropt ropt--' + pick.toLowerCase() + base +
      '<span class="ropt__badge" aria-hidden="true">' + shape(pick, "ropt__shape") + "</span>" +
      '<span class="ropt__body">' +
        '<span class="ropt__letter">Opção ' + pick + "</span>" +
        '<span class="ropt__text">' + Format.esc(r.options[pick].text) + "</span>" +
      "</span>" + marks + "</button>";
  }

  // as etiquetas do cartão: o nível, o tempo e, se for o caso, os pontos em dobro
  function chipsHTML(r) {
    var lvl = Catalog.levels[r.level];
    return '<span class="rchips">' +
      (lvl ? '<span class="rchip" data-tone="' + lvl.tone + '">' + Format.esc(lvl.name) + "</span>" : "") +
      '<span class="rchip" data-tone="zero">' + Catalog.timeOf(r) + " s</span>" +
      (r.multiplier > 1 ? '<span class="rchip rchip--x" data-tone="violet">Pontos em dobro</span>' : "") +
      "</span>";
  }

  // A frase da contagem: avisa quando a rodada é diferente das de antes
  // (os pontos em dobro, um nível novo, a primeira conta).
  function readyText(r) {
    if (r.multiplier > 1) return "Última rodada: os pontos valem " + (r.multiplier === 2 ? "o dobro" : r.multiplier + " vezes") + "!";
    var prev = prevOf(r.id) && Catalog.byId(prevOf(r.id));
    if (prev && prev.level !== r.level && Catalog.levels[r.level]) {
      return "Nível " + Catalog.levels[r.level].name.toLowerCase() + ": agora são " + Catalog.timeOf(r) + " segundos";
    }
    if (r.type !== "caixa" && (!prev || prev.type === "caixa")) return "Agora é com conta: prepare a calculadora da cabeça";
    return "Leia a meta: as caixas já vão aparecer";
  }

  // o pé do cartão: o que fazer agora e o botão da próxima rodada (ou, na
  // última, o do placar)
  function footHTML(r) {
    var next = nextOf(r.id);
    return '<div class="sfoot">' +
      '<p class="sfoot__status" data-status aria-live="polite"></p>' +
      '<div class="sfoot__btns">' +
        (next
          ? '<button class="btn btn--primary glass fx" type="button" data-next="' + next + '" hidden>' +
              "Ir para a Rodada " + next + '<span data-icon="avancar"></span></button>'
          : '<button class="btn btn--primary glass fx" type="button" data-final hidden>' +
              '<span data-icon="trofeu"></span>Ver o meu placar</button>') +
      "</div>" +
      "</div>";
  }

  function cardHTML(r) {
    var id = String(r.id);
    var picks = Catalog.choicesOf(r);
    var limit = Catalog.timeOf(r);
    return '<article class="card deccard rcard panel" id="r-' + id + '" data-card="' + id + '" tabindex="-1" aria-labelledby="r-' + id + '-title">' +
      '<div class="head fx">' + Icons.tile(r.icon, "violet", "itile--lg") +
        "<div>" +
          '<p class="card__kicker rcard__kicker">' + nw("Rodada " + id + " de " + Catalog.list.length) + " · " + nw(r.topic) + chipsHTML(r) + "</p>" +
          '<h3 class="invcard__title" id="r-' + id + '-title">' + Format.esc(r.situation) + "</h3>" +
          '<p class="invcard__sub">' + Format.esc(r.question) + "</p>" +
        "</div>" +
      "</div>" +
      // o tempo da rodada: o número dos segundos e a barra que esvazia
      '<div class="rtime" data-time hidden>' +
        '<span class="rtime__num" data-time-num aria-hidden="true">' + limit + "</span>" +
        '<span class="rtime__track" aria-hidden="true"><span class="rtime__fill" data-time-fill></span></span>' +
        '<span class="sr-only">Você tem ' + limit + " segundos para responder.</span>" +
      "</div>" +
      // a contagem fica por cima das opções (que ocupam o lugar delas, só
      // escondidas): quando elas aparecem, nada pula de lugar
      '<div class="rstage" data-stage>' +
        '<div class="ropts' + (r.type === "caixa" ? " ropts--box" : "") + '" data-count="' + picks.length + '" role="group" aria-label="Opções da Rodada ' + id + '">' +
          picks.map(function (p) { return optHTML(r, p); }).join("") +
        "</div>" +
        '<div class="rready" data-ready aria-hidden="true" hidden>' +
          '<span class="rready__ring"><span class="rready__num" data-ready-num></span></span>' +
          '<span class="rready__text">' + Format.esc(readyText(r)) + "</span>" +
        "</div>" +
      "</div>" +
      '<div class="rreveal" data-reveal tabindex="-1" hidden></div>' +
      footHTML(r) +
      "</article>";
  }

  /* ============ o que a resposta deu ============ */
  function revealHTML(r, a) {
    var id = String(r.id);
    var right = Game.isRight(id);
    var pts = Game.pointsOf(id);
    var certa = Catalog.answerOf(r);
    var state = right ? "right" : a.pick ? "wrong" : "timeout";
    var streak = Game.streakAt(id);
    var title = right ? (a.ms < 5000 ? "Certa, e rapidinho!" : "Certa!")
      : a.pick ? "Não foi dessa vez" : "O tempo acabou";
    var icon = right ? "conferir" : a.pick ? "alerta" : "cronometro";
    var tone = right ? "green" : a.pick ? "pink" : "amber";
    var meta = right
      ? "Em " + nw(secs(a.ms)) + (streak > 1 ? " · " + nw(streak + " acertos seguidos") : "")
      : "A resposta certa é " + "<strong>" + Format.esc(pickText(r, certa)) + "</strong>" + (r.type === "caixa" ? " (" + Format.esc(Caixas.byKey(certa).range) + ")" : "");

    return '<div class="rreveal__main" data-state="' + state + '">' +
        '<div class="rreveal__pts" aria-hidden="true">' +
          '<div class="rpts" data-tone="' + (pts > 0 ? "green" : "zero") + '">' +
            '<span class="rpts__num">' + plus(pts) + "</span>" +
            '<span class="rpts__cat">' + (pts === 1 ? "ponto" : "pontos") + "</span>" +
          "</div>" +
        "</div>" +
        '<div class="rreveal__body">' +
          '<p class="rreveal__kind">' + Icons.tile(icon, tone, "itile--sm") +
            "<span>" + title + '<span class="sr-only">: ' + plus(pts) + " pontos.</span></span></p>" +
          '<p class="rreveal__meta">' + meta + "</p>" +
          '<p class="rreveal__why">' + Format.esc(r.why) + "</p>" +
          (r.multiplier > 1
            ? '<p class="rreveal__x"><span class="rchip rchip--x" data-tone="violet">Pontos em dobro</span>Nesta rodada, os pontos valem ' +
                (r.multiplier === 2 ? "o dobro" : r.multiplier + " vezes") + ".</p>"
            : "") +
        "</div>" +
      "</div>" +
      (r.type === "caixa" ? rulerHTML(r) : othersHTML(r, a.pick));
  }

  // nas rodadas de conta: a conta de cada opção (a certa em destaque)
  function othersHTML(r, pick) {
    var certa = Catalog.answerOf(r);
    return '<div class="rothers">' +
      '<p class="rrow__title">A conta de cada opção</p>' +
      '<ul class="rothers__list">' + Catalog.choicesOf(r).map(function (l) {
        return '<li class="rother' + (l === certa ? " is-right" : l === pick ? " is-wrong" : "") + '">' + tagHTML(r, l) +
          "<span><strong>" + Format.esc(r.options[l].text) + "</strong>: " + Format.esc(r.options[l].why) + "</span>" +
          "</li>";
      }).join("") + "</ul>" +
      "</div>";
  }

  /* ============ a tela acompanha o estado ============ */
  // Os cartões são montados uma vez só e depois só atualizados.
  function cardEl(id) { return root.querySelector('[data-card="' + id + '"]'); }

  function statusText(id, a, waiting) {
    var n = Catalog.list.length;
    if (waiting) return "Prepare-se: as opções já vão aparecer.";
    if (!a) return "Toque na resposta antes que o tempo acabe. Vale a primeira: depois não dá para trocar.";
    if (Game.isOver() && !nextOf(id)) return "Você jogou as " + n + " rodadas! Veja o seu placar e o ranking da turma.";
    var pts = Game.pointsOf(id);
    return "Rodada " + id + ": " + (Game.isRight(id) ? "certa, " + plus(pts) + " pontos." : a.pick ? "errou, 0 pontos." : "o tempo acabou, 0 pontos.");
  }

  function syncCard(id) {
    var card = cardEl(id);
    var r = Catalog.byId(id);
    var a = Game.answerOf(id);
    var waiting = !a && !Game.isOpen(id);
    var certa = Catalog.answerOf(r);

    card.hidden = id !== active;
    // certa, o quadrinho ganha o selo verde; errada, o x vermelho
    card.classList.toggle("is-done", !!a && Game.isRight(id));
    card.classList.toggle("is-miss", !!a && !Game.isRight(id));
    card.querySelector("[data-stage]").classList.toggle("is-waiting", waiting);
    card.querySelector("[data-ready]").hidden = !waiting;
    card.querySelector("[data-time]").hidden = !!a || waiting;

    Array.prototype.forEach.call(card.querySelectorAll("[data-pick]"), function (b) {
      var p = b.getAttribute("data-pick");
      var picked = !!a && p === a.pick;
      b.classList.toggle("is-picked", picked);
      b.classList.toggle("is-right", !!a && p === certa);
      b.classList.toggle("is-wrong", picked && p !== certa);
      b.classList.toggle("is-other", !!a && p !== certa && !picked);
      // respondida, a rodada não muda mais: os botões ficam só pra ver
      b.disabled = !!a || waiting;
    });

    var reveal = card.querySelector("[data-reveal]");
    if (a && !reveal.getAttribute("data-done")) {
      reveal.innerHTML = revealHTML(r, a);
      reveal.setAttribute("data-done", "1");
    }
    reveal.hidden = !a;

    card.querySelector("[data-next],[data-final]").hidden = !a;

    // o status é anunciado pelo leitor de tela: só muda quando o texto muda
    var status = card.querySelector("[data-status]");
    var txt = statusText(id, a, waiting);
    if (status.textContent !== txt) status.textContent = txt;
  }

  // As etapas acompanham: as certas ganham o selo verde, as erradas o x
  // vermelho, a que está na tela fica marcada e as que ainda não abriram
  // ficam apagadas.
  function syncSteps() {
    Game.ids().forEach(function (id) {
      var item = root.querySelector('[data-step-item="' + id + '"]');
      var btn = item.querySelector("[data-step]");
      var a = Game.answerOf(id);
      var locked = !!Game.blocked(id);
      item.classList.toggle("is-done", !!a && Game.isRight(id));
      item.classList.toggle("is-miss", !!a && !Game.isRight(id));
      item.classList.toggle("is-active", id === active);
      item.classList.toggle("is-locked", locked);
      if (id === active) btn.setAttribute("aria-current", "step");
      else btn.removeAttribute("aria-current");
      item.querySelector("[data-step-state]").textContent = locked ? " (bloqueada)"
        : a ? (Game.isRight(id) ? " (certa)" : " (errada)") : "";
    });
  }

  // O placar do alto: as rodadas, os pontos, os acertos e a sequência que
  // está valendo agora. O número que mudou dá um pulinho.
  function syncMeters() {
    var n = Catalog.list.length;
    var t = Game.totals();
    var now = Game.streakAt(lastAnswered());
    var vals = {
      rounds: Game.answered(),
      pontos: t.pontos,
      acertos: t.acertos,
      sequencia: now
    };
    el("meter-rounds-used").textContent = String(vals.rounds);
    el("meter-rounds-fill").style.width = (vals.rounds / n * 100) + "%";
    el("meter-pontos-used").textContent = Format.points(vals.pontos);
    el("meter-pontos-fill").style.width = (vals.pontos / Game.maxPoints() * 100) + "%";
    el("meter-acertos-used").textContent = String(vals.acertos);
    el("meter-acertos-fill").style.width = (vals.acertos / n * 100) + "%";
    el("meter-seq-used").textContent = String(vals.sequencia);
    el("meter-seq-fill").style.width = (vals.sequencia / n * 100) + "%";
    el("meter-seq").classList.toggle("is-hot", vals.sequencia >= 3);
    ["pontos", "acertos", "sequencia"].forEach(function (k) {
      if (!shown || shown[k] === vals[k]) return;
      var num = el(k === "sequencia" ? "meter-seq-used" : "meter-" + k + "-used");
      num.classList.remove("is-bump");
      void num.offsetWidth;
      num.classList.add("is-bump");
    });
    shown = vals;
  }

  // a última rodada respondida (pra sequência que está valendo agora)
  function lastAnswered() {
    var list = Game.ids();
    for (var i = list.length - 1; i >= 0; i--) if (Game.answerOf(list[i])) return list[i];
    return list[0];
  }

  function sync() {
    Game.ids().forEach(syncCard);
    syncSteps();
    syncMeters();
  }

  /* ============ placar grudado no alto ============ */
  var quadroPedido = false;

  function syncStuck() {
    var meters = el("meters");
    if (!meters.offsetParent) return;
    meters.classList.toggle("is-stuck",
      meters.getBoundingClientRect().top <= parseFloat(getComputedStyle(meters).top) + 0.5);
  }

  function aoRolar() {
    if (quadroPedido) return;
    quadroPedido = true;
    requestAnimationFrame(function () {
      quadroPedido = false;
      syncStuck();
    });
  }

  /* ============ o tempo da rodada ============ */
  // O número dos segundos e a barra acompanham o relógio do computador (não
  // um contador): mesmo com a aba parada, o tempo é o certo.
  function pararRelogio() {
    clearInterval(relogio);
    relogio = null;
  }

  function mostrarTempo(id) {
    var card = cardEl(id);
    var rest = Game.remaining(id);
    var limit = Game.limitMs(id);
    card.querySelector("[data-time-num]").textContent = String(Math.ceil(rest / 1000));
    card.querySelector("[data-time-fill]").style.width = (rest / limit * 100) + "%";
    card.querySelector("[data-time]").classList.toggle("is-low", rest <= POUCO);
  }

  function correr(id) {
    pararRelogio();
    if (Game.answerOf(id) || !Game.isOpen(id)) return;
    mostrarTempo(id);
    relogio = setInterval(function () {
      if (Game.answerOf(id)) { pararRelogio(); return; }
      mostrarTempo(id);
      if (Game.remaining(id) > 0) return;
      pararRelogio();
      if (Game.timeout(id)) depois(id);
    }, 100);
  }

  /* ============ a contagem ============ */
  // 3, 2, 1 e as opções aparecem: aí o tempo começa a correr. Só na
  // primeira vez que a rodada abre (quem volta pra uma rodada em andamento
  // já encontra o tempo correndo; quem pede menos movimento não espera).
  function parar() {
    clearInterval(timer);
    timer = null;
  }

  function liberar(id) {
    Game.openRound(id);
    var stage = cardEl(id).querySelector("[data-stage]");
    stage.classList.remove("is-in");
    void stage.offsetWidth;
    stage.classList.add("is-in");
    syncCard(id);
    correr(id);
  }

  function contar(id) {
    parar();
    pararRelogio();
    if (Game.answerOf(id)) return;
    if (Game.isOpen(id)) {
      // a rodada já estava aberta (a página recarregou): se o tempo acabou
      // enquanto isso, vale como tempo esgotado
      if (Game.timeout(id)) { depois(id); return; }
      syncCard(id);
      correr(id);
      return;
    }
    if (semAnimacao) { liberar(id); return; }
    var card = cardEl(id);
    var num = card.querySelector("[data-ready-num]");
    var n = CONTAGEM;
    function tick() {
      num.textContent = String(n);
      num.classList.remove("is-tick");
      void num.offsetWidth;
      num.classList.add("is-tick");
    }
    syncCard(id);
    tick();
    timer = setInterval(function () {
      n--;
      if (n > 0) { tick(); return; }
      parar();
      // o aluno pode ter ido pra outra rodada no meio da contagem
      if (active === id) liberar(id);
    }, PASSO);
  }

  /* ============ as rodadas ============ */
  // Abre uma rodada, se ela já abriu (senão, o aviso diz o que falta). A
  // tela vai até as etapas e o foco vai pro cartão, que o leitor de tela
  // anuncia.
  function abrir(id) {
    id = String(id);
    var err = Game.blocked(id);
    if (err) {
      Toast.show(err);
      return;
    }
    Toast.hide();
    parar();
    pararRelogio();
    active = id;
    sync();
    contar(id);
    el("steps").scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" });
    cardEl(id).focus({ preventScroll: true });
  }

  // A rodada terminou (resposta ou tempo): o foco vai pro que ela deu e a
  // tela rola só o necessário pro botão da próxima rodada ficar à vista.
  function depois(id) {
    pararRelogio();
    sync();
    var card = cardEl(id);
    if (card.hidden) return;
    card.querySelector("[data-reveal]").focus({ preventScroll: true });
    card.querySelector(".sfoot").scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "nearest" });
    if (on.picked) on.picked(id);
  }

  function responder(id, pick) {
    var err = Game.answer(id, pick);
    if (err) {
      Toast.show(err);
      return;
    }
    Toast.hide();
    depois(id);
  }

  /* ============ eventos ============ */
  function handleClick(e) {
    var b = e.target.closest("[data-pick]");
    if (b) { if (!b.disabled) responder(b.getAttribute("data-round"), b.getAttribute("data-pick")); return; }
    b = e.target.closest("[data-next]");
    if (b) { abrir(b.getAttribute("data-next")); return; }
    b = e.target.closest("[data-step]");
    if (b) { abrir(b.getAttribute("data-step")); return; }
    if (e.target.closest("[data-final]") && on.final) on.final();
  }

  /* ============ API ============ */
  // monta as etapas e os cartões, com a rodada em que o aluno está aberta
  // (a contagem só começa no begin(), quando as rodadas aparecem)
  function render() {
    parar();
    pararRelogio();
    shown = null;
    active = Game.current();
    root.innerHTML = stepsHTML() + Catalog.list.map(cardHTML).join("");
    Icons.mount(root);
    sync();
  }

  function mount(container, handlers) {
    root = container;
    on = handlers || {};
    el("meter-rounds-max").textContent = String(Catalog.list.length);
    el("meter-acertos-max").textContent = String(Catalog.list.length);
    render();
    root.addEventListener("click", handleClick);
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
  }

  // As rodadas acabaram de aparecer: abre a rodada em que o aluno está e a
  // contagem dela começa. go = true leva a tela até lá (no "Começar o
  // jogo"); ao recarregar a página, a tela fica onde o navegador deixou.
  function begin(go) {
    if (go) {
      abrir(Game.current());
    } else {
      active = Game.current();
      sync();
      contar(active);
    }
    syncStuck();
  }

  // para o tempo e a contagem (o "Recomeçar" e o "Jogar de novo")
  function stop() {
    parar();
    pararRelogio();
  }

  global.PlayView = {
    mount: mount,
    render: render,
    begin: begin,
    stop: stop,
    show: abrir,
    tag: tagHTML,
    pickText: pickText,
    secs: secs,
    plus: plus
  };
})(window);
