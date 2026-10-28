(function (global) {
  "use strict";

  var Catalog = global.Rounds;

  // O estado do jogo "Qual é a caixa?" e os pontos. Não toca no DOM: as
  // telas leem daqui e pedem as mudanças por aqui, e é aqui que ficam as
  // regras.
  //
  // As rodadas vão em ordem, como no Kahoot: uma só abre depois que o aluno
  // respondeu a de antes (ou o tempo dela acabou). A resposta vale na hora e
  // não muda mais (só recomeçando o jogo).
  //
  // answers: a resposta de cada rodada, pelo id: { pick, ms }. pick é a
  //   letra ("A" a "D") ou a caixa ("curto"...), ou null quando o tempo
  //   acabou; ms é quanto tempo o aluno levou.
  // openedAt: quando as opções de cada rodada apareceram (o relógio do
  //   computador). Fica guardado: recarregar a página não zera o tempo.
  // nickname: o apelido (opcional), que aparece no ranking junto com o nome
  //   que o aluno cadastrou no login.
  // begun: se o aluno já tocou em "Começar o jogo".
  var answers = {};
  var openedAt = {};
  var nickname = "";
  var begun = false;

  // Tudo isso fica guardado no navegador e separado por conta
  // ("qual-e-a-caixa:" e o id de quem entrou). O open() escolhe a conta.
  var BASE = "qual-e-a-caixa";
  var KEY = BASE;

  function ids() { return Catalog.list.map(function (r) { return String(r.id); }); }
  function round(id) { return Catalog.byId(id); }
  function limitMs(id) { return Catalog.timeOf(round(id)) * 1000; }

  /* ============ os pontos ============ */
  // Os pontos de uma resposta, como no Kahoot: quem acerta na hora leva
  // MAX; no último segundo, a metade. Errar ou deixar o tempo acabar dá 0.
  // A rodada com multiplier vale em dobro.
  function scoreOf(id, pick, ms) {
    var r = round(id);
    if (pick !== Catalog.answerOf(r)) return 0;
    var frac = Math.min(Math.max(ms / limitMs(id), 0), 1);
    return Math.round(Catalog.max * (1 - frac / 2)) * (r.multiplier || 1);
  }

  function answerOf(id) { return answers[id] || null; }
  function isRight(id) {
    var a = answers[id];
    return !!a && a.pick === Catalog.answerOf(round(id));
  }
  function pointsOf(id) {
    var a = answers[id];
    return a ? scoreOf(id, a.pick, a.ms) : 0;
  }

  // A sequência de acertos que chega até uma rodada (0 se ela não foi certa).
  function streakAt(id) {
    var list = ids();
    var n = 0;
    for (var i = list.indexOf(String(id)); i >= 0 && isRight(list[i]); i--) n++;
    return n;
  }

  // O placar: { pontos, acertos, sequencia } (sequencia: a maior série de
  // acertos seguidos). São as categorias do ranking.
  function totals() {
    var out = { pontos: 0, acertos: 0, sequencia: 0 };
    var run = 0;
    ids().forEach(function (id) {
      if (!answers[id]) return;
      out.pontos += pointsOf(id);
      if (isRight(id)) { out.acertos++; run++; } else run = 0;
      out.sequencia = Math.max(out.sequencia, run);
    });
    return out;
  }

  // o maior placar possível (tudo certo, na hora)
  function maxPoints() {
    return Catalog.list.reduce(function (s, r) { return s + Catalog.max * (r.multiplier || 1); }, 0);
  }

  /* ============ as rodadas ============ */
  function answered() { return ids().filter(function (id) { return !!answers[id]; }).length; }
  function isOver() { return answered() === Catalog.list.length; }
  function started() { return begun || answered() > 0; }

  // a rodada em que o aluno está: a primeira sem resposta (ou a última, com
  // todas respondidas)
  function current() {
    var list = ids();
    for (var i = 0; i < list.length; i++) if (!answers[list[i]]) return list[i];
    return list[list.length - 1];
  }

  // Por que uma rodada ainda não abre (ou null, se já dá pra abrir): falta
  // responder a de antes.
  function blocked(id) {
    var list = ids();
    var i = list.indexOf(String(id));
    if (i < 0) return "Essa rodada não existe.";
    for (var j = 0; j < i; j++) {
      if (!answers[list[j]]) return "A Rodada " + list[i] + " só abre depois que você responder a Rodada " + list[j] + ".";
    }
    return null;
  }

  // As opções apareceram: o tempo começa a contar (só na primeira vez).
  function openRound(id) {
    id = String(id);
    if (answers[id] || openedAt[id] || blocked(id)) return;
    openedAt[id] = Date.now();
    begun = true;
    save();
  }
  function isOpen(id) { return !!openedAt[id]; }

  // quanto tempo ainda resta na rodada, em milissegundos
  function remaining(id) {
    if (!openedAt[id]) return limitMs(id);
    return Math.max(limitMs(id) - (Date.now() - openedAt[id]), 0);
  }

  // Responde uma rodada. Devolve o motivo quando não pode (ou null). Se o
  // tempo já acabou (a aba ficou parada, por exemplo), vale como tempo
  // esgotado.
  function answer(id, pick) {
    id = String(id);
    var err = blocked(id);
    if (err) return err;
    if (answers[id]) return "Você já respondeu nesta rodada. Para trocar, só recomeçando o jogo.";
    if (!openedAt[id]) return "Espere as opções aparecerem.";
    if (Catalog.choicesOf(round(id)).indexOf(pick) < 0) return "Essa opção não existe.";
    var ms = Date.now() - openedAt[id];
    answers[id] = ms > limitMs(id) ? { pick: null, ms: limitMs(id) } : { pick: pick, ms: ms };
    save();
    return null;
  }

  // O tempo da rodada acabou sem resposta: fica 0 nela.
  function timeout(id) {
    id = String(id);
    if (answers[id] || !openedAt[id] || remaining(id) > 0) return false;
    answers[id] = { pick: null, ms: limitMs(id) };
    save();
    return true;
  }

  function start() {
    begun = true;
    save();
  }

  // O apelido vai sem espaços sobrando e com até 24 letras (cabe no ranking
  // do celular).
  var NICK_MAX = 24;
  function normalizeNick(v) {
    return String(v || "").replace(/\s+/g, " ").trim().slice(0, NICK_MAX).trim();
  }
  function getNickname() { return nickname; }
  function setNickname(v) {
    nickname = normalizeNick(v);
    save();
  }

  // O resultado que vai pro ranking: o placar e a resposta de cada rodada
  // ("-" quando o tempo acabou).
  function result() {
    var picks = {};
    ids().forEach(function (id) { if (answers[id]) picks[id] = answers[id].pick || "-"; });
    return { scores: totals(), picks: picks };
  }

  // volta tudo ao começo: nenhuma resposta. O apelido fica.
  function reset() {
    answers = {};
    openedAt = {};
    begun = false;
    save();
  }

  /* ============ guardar no navegador ============ */
  // Pode não ter como guardar (janela anônima, navegador que bloqueia): aí o
  // jogo funciona igual, só não lembra depois de recarregar.
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ answers: answers, openedAt: openedAt, nickname: nickname, begun: begun }));
    } catch (err) {}
  }

  // Volta o que estava guardado. Uma resposta que não bate mais com as
  // rodadas (rounds.js mudou) é esquecida, e as respostas seguem em ordem:
  // uma rodada só vale com as de antes respondidas.
  function load() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (err) { saved = null; }
    if (!saved || typeof saved !== "object") return;
    var a = saved.answers || {};
    var o = saved.openedAt || {};
    Catalog.list.every(function (r) {
      var x = a[r.id];
      if (!x || typeof x !== "object") {
        // a rodada em andamento: o tempo continua de onde estava
        if (typeof o[r.id] === "number") openedAt[r.id] = o[r.id];
        return false;
      }
      var ok = x.pick === null || Catalog.choicesOf(r).indexOf(x.pick) >= 0;
      if (!ok) return false;
      answers[r.id] = { pick: x.pick, ms: Math.min(Math.max(Number(x.ms) || 0, 0), Catalog.timeOf(r) * 1000) };
      return true;
    });
    nickname = normalizeNick(saved.nickname);
    begun = !!saved.begun;
  }

  // abre o jogo de quem entrou, com o que ficou guardado na conta dele
  function open(userId) {
    KEY = BASE + ":" + userId;
    answers = {};
    openedAt = {};
    nickname = "";
    begun = false;
    load();
  }

  global.Game = {
    open: open,
    ids: ids,
    limitMs: limitMs,
    scoreOf: scoreOf,
    answerOf: answerOf,
    isRight: isRight,
    pointsOf: pointsOf,
    streakAt: streakAt,
    totals: totals,
    maxPoints: maxPoints,
    answered: answered,
    isOver: isOver,
    started: started,
    current: current,
    blocked: blocked,
    openRound: openRound,
    isOpen: isOpen,
    remaining: remaining,
    answer: answer,
    timeout: timeout,
    start: start,
    getNickname: getNickname,
    setNickname: setNickname,
    nickMax: NICK_MAX,
    result: result,
    reset: reset
  };
})(window);
