(function (global) {
  "use strict";

  var H = global.Historia;
  var Ex = global.Exercise;
  var Format = global.Format;
  var Icons = global.Icons;

  // A régua do tempo: uma linha por caixa, cada uma com o pedaço do tempo
  // dela (o curto prazo de hoje a 1 ano, o médio de 1 a 5 anos, o longo
  // dali pra frente). As metas aparecem na régua, no mês delas, quando o
  // aluno acerta a caixa de cada uma (Etapa 2), e ficam cheias quando a
  // etapa da caixa fica certa. Tocar numa linha leva até a etapa da caixa.
  var root = null;

  // as linhas verticais de cada marca, atrás das barras
  function gridHTML() {
    return Ex.ticks().map(function (t) {
      return '<span class="rl__grid" style="left:' + t.pos + '%"></span>';
    }).join("");
  }

  function pinHTML(m) {
    var txt = m.name + " · " + Format.monthYear(m.date) + " · " + Format.duration(m.months);
    return '<span class="rl__pin" data-pin="' + m.id + '" style="left:' + Ex.pos(m.months) + '%" title="' + Format.esc(txt) + '" hidden>' +
      Icons.svg(m.icon) + "</span>";
  }

  function rowHTML(b) {
    var c = b.caixa;
    var z = Ex.zoneOf(c.key);
    return '<a class="rl__row rl__row--' + c.key + ' fx" href="#etapa-' + c.key + '" data-go="' + c.key + '">' +
      '<span class="rl__name"><span class="rl__box">' + Icons.box(c.key) + "</span>" +
        '<span class="rl__text"><span class="rl__title">' + Format.esc(c.name) +
          '<span class="sr-only" data-rl-state></span></span>' +
        '<span class="rl__when">' + Format.esc(c.range) + " · Etapa " + Ex.number(c.key) + "</span></span>" +
      "</span>" +
      '<span class="rl__track">' + gridHTML() +
        '<span class="rl__zone" style="left:' + z.from + "%;width:" + (z.to - z.from) + '%" aria-hidden="true"></span>' +
        b.metas.map(pinHTML).join("") +
      "</span>" +
      "</a>";
  }

  function axisHTML() {
    var list = Ex.ticks();
    return '<div class="rl__axis" aria-hidden="true"><span class="rl__axis-pad"></span><span class="rl__scale">' +
      list.map(function (t, i) {
        var edge = i === 0 ? " rl__tick--first" : i === list.length - 1 ? " rl__tick--last" : "";
        return '<span class="rl__tick' + edge + '" style="left:' + t.pos + '%">' + Format.esc(t.label) + "</span>";
      }).join("") +
      '</span></div><p class="rl__unit" aria-hidden="true">a partir de ' + Format.esc(Format.monthYear(H.today)) + "</p>";
  }

  // As metas acompanham a Etapa 2 (aparecem) e a etapa da caixa (enchem);
  // as linhas das caixas concluídas ganham o selo verde.
  function sync() {
    Ex.boxes.forEach(function (b) {
      var row = root.querySelector('[data-go="' + b.key + '"]');
      var ok = Ex.isDone(b.key);
      row.classList.toggle("is-done", ok);
      var shown = b.metas.filter(function (m) { return Ex.placed(m.id); });
      row.querySelector("[data-rl-state]").textContent =
        (ok ? " (concluída)" : "") +
        (shown.length ? ": " + shown.map(function (m) { return m.name + ", " + Format.monthYear(m.date); }).join("; ") : "");
      b.metas.forEach(function (m) {
        var pin = row.querySelector('[data-pin="' + m.id + '"]');
        pin.hidden = !Ex.placed(m.id);
        pin.classList.toggle("is-full", ok);
      });
    });
  }

  function mount(container, goTo) {
    root = container;
    root.innerHTML = '<div class="rl__rows">' + Ex.boxes.map(rowHTML).join("") + "</div>" + axisHTML();
    root.addEventListener("click", function (e) {
      var a = e.target.closest("[data-go]");
      if (!a || !goTo) return;
      e.preventDefault();
      goTo(a.getAttribute("data-go"));
    });
  }

  global.RulerView = {
    mount: mount,
    sync: sync
  };
})(window);
