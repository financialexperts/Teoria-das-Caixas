// O jogo só começa quando alguém entra (session.js): cada conta tem o seu
// jogo guardado no navegador, e o ranking usa o nome cadastrado no login.
window.Session.ready(function (user) {
  "use strict";

  var Catalog = window.Rounds;
  var Caixas = window.Caixas;
  var Game = window.Game;
  var Format = window.Format;
  var Icons = window.Icons;
  var Toast = window.Toast;
  var Session = window.Session;
  var PlayView = window.PlayView;
  var ScoreView = window.ScoreView;
  var Ranking = window.Ranking;

  Game.open(user.id);

  function el(id) { return document.getElementById(id); }

  // o tema, o vidro e os ícones animados ficam no ui.js (as três páginas usam)
  var semAnimacao = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ a abertura ============ */
  // Os números da abertura saem de backend/js/rounds.js: quantas rodadas,
  // quanto tempo, quantos pontos e se alguma vale em dobro.
  var n = Catalog.list.length;
  var tempos = Catalog.list.map(Catalog.timeOf);
  var minT = Math.min.apply(null, tempos);
  var maxT = Math.max.apply(null, tempos);
  var dobro = Catalog.list.some(function (r) { return r.multiplier > 1; });
  var nCaixa = Catalog.list.filter(function (r) { return r.type === "caixa"; }).length;

  el("g-lead").textContent = "São " + n + " rodadas, do fácil ao difícil, com tempo, como no Kahoot. Em " + nCaixa +
    " delas, você diz em qual caixa vai uma meta; nas outras, faz as contas das caixas. Quem acerta mais rápido " +
    "faz mais pontos. No fim, você vê o seu placar e o ranking da turma.";
  el("sc-rounds").textContent = n + " rodadas";
  el("sc-time").textContent = minT === maxT ? minT + " segundos" : minT + " a " + maxT + " s";
  el("sc-max").textContent = "Até " + Format.points(Catalog.max) + " pontos";
  el("gm-sub").textContent = "Leia a meta, espere as opções aparecerem e toque na resposta antes que o tempo acabe. " +
    "A próxima rodada só abre depois desta." + (dobro ? " A última vale pontos em dobro!" : "");

  // as categorias do placar e do ranking
  el("g-cats").innerHTML = Catalog.categories.map(function (c) {
    return '<li class="gcat fx">' + Icons.tile(c.icon, c.tone, "itile--sm") +
      '<span class="gcat__name">' + Format.esc(c.name) + "</span>" +
      '<span class="gcat__about">' + Format.esc(c.about) + "</span>" +
      "</li>";
  }).join("");

  // a cola: as 3 caixas e o prazo de cada uma
  el("g-keys").innerHTML = Caixas.list.map(function (c) {
    return '<li class="ckey ckey--' + c.key + '">' + Icons.box(c.key, "ckey__box") +
      '<span class="ckey__text"><span class="ckey__name">' + Format.esc(c.name) + "</span>" +
      '<span class="ckey__range">' + Format.esc(c.range) + "</span></span></li>";
  }).join("");
  el("g-max").textContent = Format.points(Catalog.max);
  el("g-min").textContent = Format.points(Catalog.max / 2);

  // O apelido: fica guardado junto com o jogo. O Enter no campo já começa.
  var apelido = el("g-nick");
  apelido.maxLength = Game.nickMax;
  apelido.value = Game.getNickname();
  apelido.addEventListener("input", function () { Game.setNickname(apelido.value); });
  apelido.addEventListener("blur", function () { apelido.value = Game.getNickname(); });
  apelido.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    comecar();
  });

  // o botão da abertura acompanha o jogo: começar, continuar ou ver o placar
  function syncStart() {
    el("btn-start-text").textContent = Game.isOver() ? "Ver o meu placar" : Game.started() ? "Continuar o jogo" : "Começar o jogo";
  }

  /* ============ o ranking ============ */
  // o que vai pro ranking: quem jogou (o nome do login e o apelido) e o placar
  function resultado() {
    return {
      userId: user.id,
      name: Session.fullName() || "Aluno",
      nickname: Game.getNickname(),
      result: Game.result()
    };
  }

  /* ============ navegação ============ */
  // leva a tela até a parte que acabou de aparecer (o scroll-margin-top do
  // CSS desconta a barra do topo) e põe o foco nela, pra o leitor de tela
  // anunciar e o próximo Tab já continuar lá dentro
  function irPara(secao) {
    secao.scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" });
    secao.focus({ preventScroll: true });
  }

  // o placar e o ranking (que guarda o resultado de quem jogou)
  function placar() {
    ScoreView.show();
    Ranking.show(el("fn-ranking"), resultado());
  }

  function mostrarPlacar() {
    placar();
    irPara(el("sec-final"));
  }

  // Na última resposta, o resultado já vai pro ranking, mesmo que o aluno
  // não abra o placar.
  function respondeu() {
    syncStart();
    if (Game.isOver()) Ranking.save(resultado());
  }

  // Começa o jogo (ou volta pra rodada em que o aluno parou): as rodadas
  // aparecem e a tela vai até a rodada aberta. Com as rodadas todas
  // respondidas, vai pro placar.
  function comecar() {
    Game.setNickname(apelido.value);
    apelido.value = Game.getNickname();
    if (Game.isOver()) {
      mostrarPlacar();
      return;
    }
    Game.start();
    el("sec-game").hidden = false;
    PlayView.begin(true);
    syncStart();
  }
  el("btn-start").addEventListener("click", comecar);

  Toast.mount();
  PlayView.mount(el("rounds"), {
    picked: respondeu,
    final: mostrarPlacar
  });

  // o que ficou guardado de antes: as rodadas voltam na rodada em que o
  // aluno parou (com o tempo dela correndo de onde estava) e, com todas
  // respondidas, o placar já aparece (sem levar a tela até lá)
  if (Game.started()) {
    el("sec-game").hidden = false;
    PlayView.begin(false);
  }
  if (Game.isOver()) placar();
  syncStart();

  /* ============ recomeçar ============ */
  // Apaga as respostas e volta tudo ao começo (o apelido fica). No meio do
  // jogo, pergunta antes; o "Jogar de novo" do placar já começa a Rodada 1.
  // O resultado que já está no ranking fica lá até o novo jogo terminar.
  function zerar() {
    PlayView.stop();
    Game.reset();
    PlayView.render();
    ScoreView.hide();
    Ranking.hide();
    Toast.hide();
  }

  el("btn-reset").addEventListener("click", function () {
    if (Game.started() && !window.confirm("Apagar as suas respostas e começar o jogo de novo?")) return;
    zerar();
    el("sec-game").hidden = true;
    syncStart();
    window.scrollTo({ top: 0, behavior: semAnimacao ? "auto" : "smooth" });
  });

  el("btn-again").addEventListener("click", function () {
    zerar();
    Game.start();
    el("sec-game").hidden = false;
    PlayView.begin(true);
    syncStart();
  });
});
