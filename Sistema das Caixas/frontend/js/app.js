// O exercício só começa quando alguém entra (session.js): cada conta tem o
// seu exercício guardado no navegador.
window.Session.ready(function (user) {
  "use strict";

  var H = window.Historia;
  var Caixas = window.Caixas;
  var Ex = window.Exercise;
  var Format = window.Format;
  var Icons = window.Icons;
  var Toast = window.Toast;

  Ex.open(user.id);

  function el(id) { return document.getElementById(id); }

  // o tema, o vidro e os ícones animados ficam no ui.js (as três páginas usam)
  var semAnimacao = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ as caixas que falam ============ */
  // As 3 caixas ficam em pé ao lado do texto da abertura. Tocar numa delas
  // faz ela pular, abrir a tampa (cai uma moeda dentro) e dizer a próxima
  // frase dela no balão (as falas ficam em backend/js/caixas.js). O balão
  // mostra o nome de quem está falando e aponta pra ela.
  var fala = {};
  var balao = el("cx-bubble");
  var balaoQuem = el("cx-who");
  var balaoTexto = el("cx-fala");

  el("cx-boxes").innerHTML = Caixas.list.map(function (c) {
    return '<button class="cbox cbox--' + c.key + '" type="button" data-cbox="' + c.key + '" aria-label="Falar com a caixa do ' + Format.esc(c.name.toLowerCase()) + '">' +
      '<span class="cbox__art">' + Icons.box(c.key) + "</span>" +
      '<span class="cbox__name">' + Format.esc(c.short) + "</span>" +
      '<span class="cbox__range">' + Format.esc(c.range) + "</span>" +
      "</button>";
  }).join("");

  balaoTexto.textContent = "Oi! Somos as caixas " + H.da + ". Cada sonho vai numa de nós.";
  el("cx-boxes").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cbox]");
    if (!b) return;
    var c = Caixas.byKey(b.getAttribute("data-cbox"));
    fala[c.key] = ((fala[c.key] == null ? -1 : fala[c.key]) + 1) % c.falas.length;
    balaoQuem.textContent = c.name;
    balaoTexto.textContent = c.falas[fala[c.key]];
    balao.setAttribute("data-who", c.key);
    // o "toque nas caixas" já cumpriu o papel depois do primeiro toque
    balao.classList.add("is-known");
    // tira e põe a classe pra a animação repetir a cada toque
    [b, balao].forEach(function (x) {
      x.classList.remove("is-talking");
      void x.offsetWidth;
      x.classList.add("is-talking");
    });
  });

  /* ============ o ponto de partida ============ */
  el("sc-today").textContent = Format.monthYear(H.today, true);
  el("sc-metas").textContent = Ex.metas.length + " em " + Ex.boxes.length + " caixas";
  el("sc-count").textContent = Ex.counts().total + " em " + Ex.groups().length + " etapas";

  /* ============ navegação ============ */
  // leva a tela até a parte que acabou de aparecer (o scroll-margin-top do
  // CSS desconta a barra do topo e os medidores) e põe o foco nela, pra o
  // leitor de tela anunciar e o próximo Tab já continuar lá dentro
  function irPara(secao) {
    secao.scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" });
    secao.focus({ preventScroll: true });
  }

  // Uma etapa foi conferida: a régua do tempo acompanha e, quando a última
  // fica certa, o plano da Bia aparece.
  function aoMudar(group) {
    window.RulerView.sync();
    if (group === "plano" && Ex.isDone("plano")) {
      window.ResultView.show();
      irPara(el("sec-final"));
    }
  }

  Toast.mount();
  window.SheetView.mount(el("etapas"), aoMudar);
  window.RulerView.mount(el("ruler"), window.SheetView.show);
  window.RulerView.sync();

  // o que ficou guardado de antes já pode ter terminado o exercício: o
  // resultado aparece, sem levar a tela até lá
  if (Ex.isDone("plano")) window.ResultView.show();

  // Recomeçar apaga tudo o que o aluno fez: se já tem alguma coisa, pergunta
  // antes.
  el("btn-reset").addEventListener("click", function () {
    if (Ex.started() && !window.confirm("Apagar todas as respostas e começar o exercício de novo?")) return;
    Ex.reset();
    window.SheetView.render();
    window.RulerView.sync();
    window.ResultView.hide();
    Toast.hide();
    window.scrollTo({ top: 0, behavior: semAnimacao ? "auto" : "smooth" });
  });
});
