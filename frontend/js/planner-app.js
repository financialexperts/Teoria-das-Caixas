// A folha só abre quando alguém entra (session.js): cada conta tem o seu
// planejamento guardado no navegador.
window.Session.ready(function (user) {
  "use strict";

  var Caixas = window.Caixas;
  var P = window.Planner;
  var View = window.PlannerView;
  var Format = window.Format;
  var Icons = window.Icons;
  var Toast = window.Toast;

  P.open(user.id);

  function el(id) { return document.getElementById(id); }

  // o tema, o vidro e os ícones animados ficam no ui.js (as duas páginas usam)
  var semAnimacao = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ a abertura ============ */
  // o mês de hoje (do relógio do computador) e a legenda das 3 caixas
  el("p-today").textContent = Format.monthYear(P.today());
  el("p-keys").innerHTML = Caixas.list.map(function (c) {
    return '<li class="ckey ckey--' + c.key + '">' + Icons.box(c.key, "ckey__box") +
      '<span class="ckey__text"><span class="ckey__name">' + Format.esc(c.name) + "</span>" +
      '<span class="ckey__range">' + Format.esc(c.range) + "</span></span></li>";
  }).join("");

  /* ============ a folha ============ */
  Toast.mount();
  View.mount(el("p-caixas"), window.Session.fullName);

  /* ============ medidores grudados no alto ============ */
  // Grudados, os medidores viram uma cápsula de vidro (o mesmo do jogo).
  var meters = el("meters");
  var quadroPedido = false;
  function syncStuck() {
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
  window.addEventListener("scroll", aoRolar, { passive: true });
  window.addEventListener("resize", aoRolar);
  syncStuck();

  /* ============ imprimir e apagar ============ */
  // A folha impressa é montada na hora (o beforeprint também monta, pra quem
  // imprime pelo menu do navegador).
  el("btn-print").addEventListener("click", function () {
    if (!P.ready()) {
      Toast.show("Escreva pelo menos uma meta, com a data e o valor, antes de imprimir a folha.");
      return;
    }
    Toast.hide();
    View.buildSheet();
    window.print();
  });

  // Apagar a folha tira tudo o que o aluno escreveu: se já tem alguma coisa,
  // pergunta antes.
  el("btn-clear").addEventListener("click", function () {
    if (P.started() && !window.confirm("Apagar tudo o que você escreveu na folha e começar de novo?")) return;
    P.reset();
    View.render();
    Toast.hide();
    window.scrollTo({ top: 0, behavior: semAnimacao ? "auto" : "smooth" });
  });
});
