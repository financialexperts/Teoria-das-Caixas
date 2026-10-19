(function (global) {
  "use strict";

  var Caixas = global.Caixas;
  var P = global.Planner;
  var Format = global.Format;
  var Parse = global.Parse;
  var Mask = global.Mask;
  var Toast = global.Toast;
  var Icons = global.Icons;

  // A folha "Meu planejamento financeiro" na tela: o saldo do mês em cima e
  // as 3 caixas, cada uma com as linhas da folha (descrição, data, valor
  // total, quantidade de meses e valor a poupar por mês). O aluno escreve a
  // descrição, a data e o valor; os meses e o valor por mês saem sozinhos.
  // Embaixo, o resumo: quanto do saldo vai para as caixas e se cabe.
  //
  // As metas são montadas uma vez (e de novo só quando uma meta entra, sai
  // ou muda de caixa); o resto só é atualizado, pra não tirar o foco de quem
  // está digitando.

  var root = null;      // o container das 3 caixas
  var getName = null;   // o nome de quem entrou (vai na folha impressa)

  function el(id) { return document.getElementById(id); }
  function nw(s) { return '<span class="nw">' + Format.esc(s) + "</span>"; }

  /* ============ montagem ============ */
  // os anos da data: deste ano até 40 anos pra frente
  var ANOS = 40;

  function monthOptions(sel) {
    return '<option value="">Mês</option>' + Format.months.map(function (nome, i) {
      return '<option value="' + (i + 1) + '"' + (sel === i + 1 ? " selected" : "") + ">" + nome + "</option>";
    }).join("");
  }

  function yearOptions(sel) {
    var y0 = P.today().y;
    var out = '<option value="">Ano</option>';
    for (var y = y0; y <= y0 + ANOS; y++) {
      out += '<option value="' + y + '"' + (sel === y ? " selected" : "") + ">" + y + "</option>";
    }
    // um ano guardado que ficou de fora da lista (muito antigo) ainda aparece
    if (sel && (sel < y0 || sel > y0 + ANOS)) out += '<option value="' + sel + '" selected>' + sel + "</option>";
    return out;
  }

  // Uma meta, com as linhas da folha. Os ids dos campos levam o id da meta.
  function metaHTML(c, m, i, n) {
    var id = m.id;
    var ex = c.examples ? "Ex.: " + c.examples : "";
    return '<div class="pmeta" data-meta="' + id + '">' +
      '<div class="pmeta__head">' +
        '<p class="pmeta__num">Meta ' + (i + 1) + (n > 1 ? " de " + n : "") + "</p>" +
        '<button class="pmeta__del fx" type="button" data-del="' + id + '" title="Apagar a meta" aria-label="Apagar a meta ' + (i + 1) + " do " + Format.esc(c.name.toLowerCase()) + '">' +
          Icons.svg("lixeira") + "</button>" +
      "</div>" +
      '<div class="pline">' +
        '<span class="pline__ico">' + Icons.svg("lista") + "</span>" +
        '<label class="pline__label" for="d-' + id + '">Descrição da meta</label>' +
        '<input class="pline__input" id="d-' + id + '" data-f="desc" data-id="' + id + '" type="text" maxlength="60" autocomplete="off" ' +
          'placeholder="' + Format.esc(ex) + '" value="' + Format.esc(m.desc) + '">' +
      "</div>" +
      '<div class="pline">' +
        '<span class="pline__ico">' + Icons.svg("calendario") + "</span>" +
        '<span class="pline__label" id="dl-' + id + '">Data de realização</span>' +
        '<span class="pdate" role="group" aria-labelledby="dl-' + id + '">' +
          '<select class="pselect" data-f="m" data-id="' + id + '" aria-label="Mês">' + monthOptions(m.m) + "</select>" +
          '<select class="pselect" data-f="y" data-id="' + id + '" aria-label="Ano">' + yearOptions(m.y) + "</select>" +
        "</span>" +
      "</div>" +
      '<div class="pline">' +
        '<span class="pline__ico">' + Icons.svg("cifrao") + "</span>" +
        '<label class="pline__label" for="t-' + id + '">Valor total</label>' +
        '<span class="cell pcell"><span class="cell__pre" aria-hidden="true">R$</span>' +
          '<input class="cell__input" id="t-' + id + '" data-f="total" data-id="' + id + '" type="text" inputmode="decimal" ' +
            'autocomplete="off" autocorrect="off" spellcheck="false" placeholder="0,00" value="' + Format.esc(m.total) + '"></span>' +
      "</div>" +
      '<div class="pline pline--calc">' +
        '<span class="pline__ico">' + Icons.svg("relogio") + "</span>" +
        '<span class="pline__label">Quantidade de meses</span>' +
        '<span class="pline__value" data-out="months">—</span>' +
      "</div>" +
      '<div class="pline pline--calc pline--main">' +
        '<span class="pline__ico">' + Icons.svg("calculadora") + "</span>" +
        '<span class="pline__label">Valor a poupar por mês</span>' +
        '<span class="pline__value" data-out="monthly">—</span>' +
      "</div>" +
      '<p class="pmeta__conta" data-out="conta"></p>' +
      '<div class="pmeta__msg" data-out="msg" role="status"></div>' +
      "</div>";
  }

  function boxHTML(c) {
    return '<section class="card pbox pbox--' + c.key + '" data-box="' + c.key + '" aria-labelledby="pb-' + c.key + '-title">' +
      '<div class="pbox__side">' +
        '<span class="pbox__art">' + Icons.box(c.key) + "</span>" +
        '<h3 class="pbox__name" id="pb-' + c.key + '-title">' + Format.esc(c.name) + "</h3>" +
        '<p class="pbox__range">(' + Format.esc(c.range) + ")</p>" +
      "</div>" +
      '<div class="pbox__main">' +
        '<div class="pbox__metas" data-metas="' + c.key + '"></div>' +
        '<div class="pbox__foot">' +
          '<button class="btn btn--ghost glass btn--sm fx" type="button" data-add="' + c.key + '">' +
            '<span data-icon="mais"></span>Adicionar outra meta</button>' +
          '<p class="pbox__total">Total da caixa por mês <strong data-box-total>' + Format.money(0) + "</strong></p>" +
        "</div>" +
      "</div>" +
      "</section>";
  }

  // as metas de uma caixa (de novo quando uma meta entra, sai ou muda de caixa)
  function renderBox(key) {
    var c = Caixas.byKey(key);
    var list = P.metasOf(key);
    var box = root.querySelector('[data-metas="' + key + '"]');
    box.innerHTML = list.map(function (m, i) { return metaHTML(c, m, i, list.length); }).join("");
    Icons.mount(box);
  }

  /* ============ a tela acompanha o estado ============ */
  // O que aparece embaixo de uma meta: o aviso de data que já passou, de
  // meta na caixa errada (com o botão de levar pra caixa certa) ou de que
  // falta alguma coisa.
  function msgHTML(c, m, x) {
    if (x.status === "past") {
      return '<p class="pmsg pmsg--warn">' + Icons.svg("alerta") +
        "<span>Escolha uma data depois de " + nw(Format.monthYear(P.today())) + ".</span></p>";
    }
    if (x.status === "mismatch") {
      var dest = P.metasOf(x.fit.key);
      var cheia = dest.length >= P.MAX && !(dest.length === 1 && P.calc(dest[0], x.fit.key).status === "empty");
      return '<p class="pmsg pmsg--warn">' + Icons.svg("alerta") +
        "<span>Faltam " + nw(Format.duration(x.months)) + ": esta meta é de <strong>" + Format.esc(x.fit.name.toLowerCase()) +
        "</strong> (" + Format.esc(x.fit.range) + ").</span></p>" +
        '<button class="btn btn--ghost glass btn--sm fx pmsg__btn" type="button" data-move="' + m.id + '" data-to="' + x.fit.key + '"' + (cheia ? " disabled" : "") + ">" +
          '<span data-icon="mover"></span>' + (cheia ? "A caixa do " + Format.esc(x.fit.name.toLowerCase()) + " já tem " + P.MAX + " metas" : "Levar para o " + Format.esc(x.fit.name.toLowerCase())) + "</button>";
    }
    if (x.status === "partial") {
      var falta = [];
      if (!(m.m > 0 && m.y > 0)) falta.push("a data");
      if (!x.total) falta.push("o valor total");
      return '<p class="pmsg">Falta ' + Format.list(falta) + " para calcular.</p>";
    }
    return "";
  }

  function syncMeta(c, m) {
    var box = root.querySelector('[data-meta="' + m.id + '"]');
    if (!box) return;
    var x = P.calc(m, c.key);
    box.classList.toggle("is-ok", x.status === "ok");
    box.classList.toggle("is-warn", x.status === "mismatch" || x.status === "past");
    box.querySelector('[data-out="months"]').textContent = x.months > 0 ? Format.unit(x.months, "meses") : "—";
    box.querySelector('[data-out="monthly"]').textContent = x.monthly !== null ? Format.money(x.monthly) : "—";
    box.querySelector('[data-out="conta"]').innerHTML = x.monthly !== null
      ? nw(Format.money(x.total)) + " ÷ " + nw(Format.unit(x.months, "meses")) + " = <strong>" + nw(Format.money(x.monthly)) + "</strong>"
      : "";
    var msg = box.querySelector('[data-out="msg"]');
    var html = msgHTML(c, m, x);
    // só redesenha quando muda, pra não tirar o foco do botão de mover
    if (msg.getAttribute("data-html") !== html) {
      msg.innerHTML = html;
      msg.setAttribute("data-html", html);
      Icons.mount(msg);
    }
    msg.hidden = !html;
  }

  function syncBox(c) {
    var list = P.metasOf(c.key);
    list.forEach(function (m) { syncMeta(c, m); });
    var card = root.querySelector('[data-box="' + c.key + '"]');
    card.querySelector("[data-box-total]").textContent = Format.money(P.boxTotal(c.key));
    card.querySelector("[data-add]").hidden = list.length >= P.MAX;
    card.classList.toggle("is-ready", list.some(function (m) { return P.calc(m, c.key).monthly !== null; }));
  }

  // o saldo, embaixo da receita e das despesas
  function syncSaldo() {
    var s = P.saldo();
    el("p-saldo").textContent = s === null ? "—" : Format.money(s);
    el("p-saldo-box").classList.toggle("is-neg", s !== null && s < 0);
    el("p-saldo-hint").textContent = s === null
      ? "Preencha a receita e as despesas."
      : s < 0 ? "As despesas passam da receita: não sobra nada para as caixas." : "É ele que vai ser dividido nas caixas.";
  }

  // Os medidores do alto: quantas caixas já têm meta e quanto do saldo vai
  // para elas (um pedaço por caixa, na cor dela; vermelho quando passa).
  function syncMeters() {
    var n = Caixas.list.filter(function (c) { return P.boxTotal(c.key) > 0; }).length;
    el("meter-box-used").textContent = String(n);
    el("meter-box-fill").style.width = (n / Caixas.list.length * 100) + "%";
    var s = P.saldo();
    var plan = P.planned();
    var base = Math.max(s || 0, plan, 1);
    Caixas.list.forEach(function (c) {
      el("meter-saldo-track").querySelector('[data-seg="' + c.key + '"]').style.width = (P.boxTotal(c.key) / base * 100) + "%";
    });
    el("meter-saldo-used").textContent = Format.compactMoney(plan);
    el("meter-saldo-of").hidden = s === null;
    el("meter-saldo-max").textContent = s === null ? "" : Format.compactMoney(s);
    el("meter-saldo").classList.toggle("is-over", s !== null && plan > s);
  }

  // O resumo: a barra do saldo (um pedaço por caixa e a folga) e o que ela
  // quer dizer. Quando passa do saldo, as sugestões do que dá pra fazer.
  function splitHTML(s, plan) {
    var base = Math.max(s || 0, plan, 1);
    var parts = Caixas.list.map(function (c) { return { key: c.key, name: c.name, v: P.boxTotal(c.key) }; })
      .filter(function (p) { return p.v > 0; });
    var sobra = s === null ? 0 : s - plan;
    if (sobra > 0) parts.push({ key: "folga", name: "Folga (o que sobra)", v: sobra });
    var label = parts.map(function (p) { return p.name + ": " + Format.money(p.v); }).join("; ") || "Nada ainda";
    return '<div class="sbar">' +
      '<p class="sbar__title">' + (s === null ? "O que vai para as caixas por mês" : "Para onde vai o saldo de " + nw(Format.money(s))) + "</p>" +
      '<div class="sbar__track" role="img" aria-label="' + Format.esc(label) + '">' +
        parts.map(function (p, i) {
          var w = p.v / base * 100;
          var pct = s > 0 ? Format.pct(p.v / s * 100) : "";
          return '<span class="sbar__seg sbar__seg--' + p.key + '" style="width:' + w + "%;--i:" + i + '">' +
            (w >= 9 && pct ? '<span class="sbar__pct">' + pct + "</span>" : "") + "</span>";
        }).join("") +
        (s !== null && plan > s && s > 0 ? '<span class="sbar__limit" style="left:' + (s / base * 100) + '%"></span>' : "") +
      "</div>" +
      '<ul class="sbar__legend">' + parts.map(function (p) {
        return '<li class="sbar__item sbar__item--' + p.key + '"><span class="sbar__dot" aria-hidden="true"></span>' +
          '<span class="sbar__name">' + Format.esc(p.name) + "</span>" +
          '<span class="sbar__val">' + nw(Format.money(p.v)) + "</span></li>";
      }).join("") +
      (s !== null && plan > s ? '<li class="sbar__item sbar__item--over"><span class="sbar__dot" aria-hidden="true"></span>' +
        '<span class="sbar__name">Passa do saldo</span><span class="sbar__val">' + nw(Format.money(plan - s)) + "</span></li>" : "") +
      "</ul>" +
      "</div>";
  }

  function verdictHTML(s, plan) {
    if (!plan) {
      return '<div class="pverdict"><p class="pverdict__title">' + Icons.tile("caixa", "violet", "itile--sm") +
        "Comece pelas caixas</p><p>Escreva uma meta em cada caixa, com a data e o valor: o valor por mês aparece sozinho.</p></div>";
    }
    if (s === null) {
      return '<div class="pverdict"><p class="pverdict__title">' + Icons.tile("carteira", "violet", "itile--sm") +
        "Falta o saldo</p><p>Por mês, as suas caixas pedem " + nw(Format.money(plan)) +
        ". Preencha a receita e as despesas lá em cima para ver se cabe no seu saldo.</p></div>";
    }
    var sobra = Math.round((s - plan) * 100) / 100;
    if (sobra >= 0) {
      return '<div class="pverdict pverdict--ok"><p class="pverdict__title">' + Icons.tile("conferir", "green", "itile--sm") +
        "Cabe no saldo!</p><p>As caixas pedem " + nw(Format.money(plan)) + " por mês, e o seu saldo é de " + nw(Format.money(s)) + ". " +
        (sobra > 0 ? "Sobram " + nw(Format.money(sobra)) + " de folga: que tal guardar uma parte como reserva para imprevistos?"
          : "Não sobra folga: qualquer imprevisto aperta o plano. Que tal deixar uma parte do saldo livre?") +
        "</p></div>";
    }
    var falta = -sobra;
    var sug = P.suggestions();
    return '<div class="pverdict pverdict--over"><p class="pverdict__title">' + Icons.tile("alerta", "pink", "itile--sm") +
      "Passou do saldo</p><p>As caixas pedem " + nw(Format.money(plan)) + " por mês, mas o seu saldo é de " + nw(Format.money(s)) +
      ": faltam " + nw(Format.money(falta)) + " por mês. Dá para ajustar:</p>" +
      '<ul class="pverdict__list">' +
        sug.map(function (x) {
          var nome = x.meta.desc.trim() || "a meta de " + Caixas.byKey(x.key).name.toLowerCase();
          return "<li><strong>Adiar " + Format.esc(nome) + "</strong> para " + nw(Format.monthYear(x.date)) +
            ": ela passa a pedir " + nw(Format.money(x.monthly)) + " por mês" +
            (Caixas.of(x.months).key !== x.key ? " (e vai para o " + Format.esc(Caixas.of(x.months).name.toLowerCase()) + ")" : "") + ".</li>";
        }).join("") +
        "<li><strong>Aumentar o saldo</strong>: gastar " + nw(Format.money(falta)) + " a menos (ou ganhar " + nw(Format.money(falta)) + " a mais) por mês.</li>" +
        "<li><strong>Escolher uma meta mais barata</strong>, ou tirar uma meta do plano por enquanto.</li>" +
      "</ul></div>";
  }

  function syncSummary() {
    var s = P.saldo();
    var plan = P.planned();
    el("p-resumo").innerHTML = (plan ? splitHTML(s, plan) : "") + verdictHTML(s, plan);
  }

  function sync() {
    Caixas.list.forEach(syncBox);
    syncSaldo();
    syncMeters();
    syncSummary();
  }

  /* ============ a folha impressa ============ */
  // A folha "Meu planejamento financeiro", do jeito da original, preenchida
  // com o que o aluno escreveu. Só aparece na impressão (plano.css).
  function line(icon, label, value) {
    return '<div class="psheet__line">' + Icons.svg(icon) + '<span class="psheet__label">' + label + "</span>" +
      '<span class="psheet__fill">' + (value ? Format.esc(value) : "") + "</span></div>";
  }

  function sheetHTML() {
    var s = P.saldo();
    var name = getName ? getName() : "";
    return '<h1 class="psheet__title">Meu planejamento financeiro</h1>' +
      '<p class="psheet__who">' + (name ? "<strong>" + Format.esc(name) + "</strong> · " : "") + "Feito em " + Format.esc(Format.monthYear(P.today())) +
        (s !== null ? " · Saldo do mês: " + Format.esc(Format.money(s)) + " · Nas caixas: " + Format.esc(Format.money(P.planned())) : "") + "</p>" +
      Caixas.list.map(function (c) {
        var list = P.metasOf(c.key);
        return '<section class="psheet__box psheet__box--' + c.key + '">' +
          '<div class="psheet__side">' + Icons.box(c.key) +
            '<p class="psheet__name">' + Format.esc(c.name) + "</p>" +
            '<p class="psheet__range">(' + Format.esc(c.range) + ")</p></div>" +
          '<div class="psheet__metas">' + list.map(function (m) {
            var x = P.calc(m, c.key);
            return '<div class="psheet__meta">' +
              line("lista", "Descrição da meta:", m.desc.trim()) +
              line("calendario", "Data de realização:", m.m && m.y ? Format.monthYear({ y: m.y, m: m.m }, true) : "") +
              line("cifrao", "Valor total: R$", x.total ? Format.plain(x.total, "money") : "") +
              line("relogio", "Quantidade de meses:", x.months > 0 ? String(x.months) : "") +
              line("calculadora", "Valor a poupar por mês: R$", x.monthly !== null ? Format.plain(x.monthly, "money") : "") +
              "</div>";
          }).join("") + "</div>" +
          "</section>";
      }).join("") +
      '<p class="psheet__formula">Cálculo mensal = Valor total ÷ Quantidade de meses</p>';
  }

  function buildSheet() {
    el("psheet").innerHTML = sheetHTML();
  }

  /* ============ eventos ============ */
  // A máscara dos valores em reais (mask.js): os pontos de milhar entram
  // sozinhos e o cursor fica no mesmo lugar dos algarismos.
  function mascarar(input, inputType) {
    var raw = input.value;
    var masked = Mask.live(raw, /^delete/.test(inputType));
    if (masked === null || masked === raw) return;
    var after = Mask.significant(raw.slice(input.selectionEnd == null ? raw.length : input.selectionEnd));
    input.value = masked;
    var p = Mask.caret(masked, after, /Backward$/.test(inputType));
    input.setSelectionRange(p, p);
  }

  // ao sair do campo, o número se completa: "1.200" vira "1.200,00"
  function completar(input) {
    var r = Parse.read(input.value);
    if (!r.ok || r.n < 0) return null;
    input.value = Format.plain(r.n, "money");
    return input.value;
  }

  function handleInput(e) {
    var t = e.target;
    var id = t.getAttribute("data-id");
    var f = t.getAttribute("data-f");
    if (!id || !f) return;
    if (f === "total" && !e.isComposing) mascarar(t, e.inputType || "");
    P.update(id, f, t.value);
    var hit = P.find(id);
    if (!hit) return;
    syncBox(Caixas.byKey(hit.key));
    syncMeters();
    syncSummary();
  }

  function handleBlur(e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute("data-f") === "total") {
      var v = completar(t);
      if (v !== null) P.update(t.getAttribute("data-id"), "total", v);
    }
  }

  function focusMeta(id) {
    var x = root.querySelector('[data-meta="' + id + '"] [data-f="desc"]');
    if (x) x.focus();
  }

  function handleClick(e) {
    var b = e.target.closest("[data-add]");
    if (b) {
      var key = b.getAttribute("data-add");
      var r = P.add(key);
      if (r.error) { Toast.show(r.error); return; }
      renderBox(key);
      sync();
      focusMeta(r.id);
      return;
    }
    b = e.target.closest("[data-del]");
    if (b) {
      var id = b.getAttribute("data-del");
      var hit = P.find(id);
      if (!hit) return;
      var x = P.calc(hit.meta, hit.key);
      if (x.status !== "empty" && !global.confirm("Apagar esta meta?")) return;
      P.remove(id);
      renderBox(hit.key);
      sync();
      var first = root.querySelector('[data-metas="' + hit.key + '"] [data-f="desc"]');
      if (first) first.focus();
      return;
    }
    b = e.target.closest("[data-move]");
    if (b && !b.disabled) {
      var mid = b.getAttribute("data-move");
      var from = P.find(mid).key;
      var err = P.move(mid, b.getAttribute("data-to"));
      if (err) { Toast.show(err); return; }
      renderBox(from);
      renderBox(b.getAttribute("data-to"));
      sync();
      var moved = root.querySelector('[data-meta="' + mid + '"]');
      moved.scrollIntoView({ behavior: "smooth", block: "center" });
      moved.classList.add("is-moved");
      focusMeta(mid);
    }
  }

  // a receita e as despesas: a mesma máscara, o mesmo completar
  function bindMoney(input, setter) {
    input.addEventListener("input", function (e) {
      if (!e.isComposing) mascarar(input, e.inputType || "");
      setter(input.value);
      syncSaldo();
      syncMeters();
      syncSummary();
    });
    input.addEventListener("blur", function () {
      var v = completar(input);
      if (v !== null) setter(v);
    });
  }

  /* ============ API ============ */
  function render() {
    root.innerHTML = Caixas.list.map(boxHTML).join("");
    Icons.mount(root);
    Caixas.list.forEach(function (c) { renderBox(c.key); });
    el("p-receita").value = P.receita();
    el("p-despesas").value = P.despesas();
    sync();
  }

  function mount(container, nameFn) {
    root = container;
    getName = nameFn || null;
    el("meter-saldo-track").innerHTML = Caixas.list.map(function (c) {
      return '<span class="meter__seg meter__seg--' + c.key + '" data-seg="' + c.key + '"></span>';
    }).join("");
    el("meter-box-max").textContent = String(Caixas.list.length);
    render();
    root.addEventListener("input", handleInput);
    root.addEventListener("change", handleInput);
    root.addEventListener("focusout", handleBlur);
    root.addEventListener("click", handleClick);
    bindMoney(el("p-receita"), P.setReceita);
    bindMoney(el("p-despesas"), P.setDespesas);
    global.addEventListener("beforeprint", buildSheet);
  }

  global.PlannerView = {
    mount: mount,
    render: render,
    buildSheet: buildSheet
  };
})(window);
