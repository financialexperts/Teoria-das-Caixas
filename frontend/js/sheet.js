(function (global) {
  "use strict";

  var H = global.Historia;
  var Caixas = global.Caixas;
  var Ex = global.Exercise;
  var Format = global.Format;
  var Parse = global.Parse;
  var Mask = global.Mask;
  var Toast = global.Toast;
  var Icons = global.Icons;

  // O planejamento da Bia, uma etapa de cada vez, do jeito da folha "Meu
  // planejamento financeiro":
  //   Etapa 1: o saldo (receitas e despesas lado a lado, como colunas)
  //   Etapa 2: as caixas (cada meta ganha a caixa do prazo dela)
  //   uma etapa por caixa, com as metas dela lado a lado: os dados em
  //     laranja, as contas em branco e, em verde, o total da caixa por mês
  //   a última: o plano (o total das caixas e quanto sobra do saldo)
  //
  // Em cima dos cartões ficam as etapas, e só o cartão da etapa aberta
  // aparece. Ao conferir, as respostas certas ficam resolvidas e as erradas
  // ganham uma dica; com algum erro, aparece o botão que refaz a etapa. O
  // botão de avançar só aparece com todas as respostas da etapa certas.

  var root = null;      // o container das etapas e dos cartões
  var onChange = null;  // avisa o app.js que um grupo foi conferido
  var active = null;    // a etapa que está na tela ("saldo", "curto"...)

  // O que a última conferência disse de cada campo em aberto: "wrong",
  // "invalid" ou "missing". É só da tela: some quando o aluno mexe no campo,
  // e ao recarregar a página.
  var mark = {};

  var semAnimacao = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(id) { return document.getElementById(id); }
  function nw(s) { return '<span class="nw">' + Format.esc(s) + "</span>"; }
  function domId(id) { return id.replace(/\./g, "-"); }

  function nextOf(group) {
    var list = Ex.groups();
    return list[list.indexOf(group) + 1] || null;
  }

  // um texto de historia.js com os {marcadores} já em negrito
  function fillHTML(str) {
    return String(str).split(/(\{[^}]+\})/).map(function (part) {
      var m = /^\{([^}]+)\}$/.exec(part);
      return m ? "<strong>" + nw(Ex.fill(part)) + "</strong>" : Format.esc(part);
    }).join("");
  }

  /* ============ peças que os cartões repetem ============ */
  // As etapas, em cima dos cartões: o número (ou o selo de certo) e o nome.
  // Tocar numa leva até ela, se ela já abriu.
  function stepsHTML() {
    return '<nav class="card steps" id="steps" aria-label="Etapas do exercício"><ol class="steps__list">' +
      Ex.groups().map(function (g, i) {
        return '<li class="steps__item" data-step-item="' + g + '">' +
          '<button class="steps__btn" type="button" data-step="' + g + '">' +
            '<span class="steps__num" aria-hidden="true">' + (i + 1) + "</span>" +
            '<span class="steps__kicker">Etapa ' + (i + 1) + "</span>" +
            '<span class="steps__name">' + Format.esc(Ex.topic(g)) +
              '<span class="sr-only" data-step-state></span></span>' +
          "</button>" +
          "</li>";
      }).join("") +
      "</ol></nav>";
  }

  // A célula onde o aluno escreve: o "R$" antes e o "meses" depois ficam
  // desenhados em volta, então ele digita só o número (ou a conta).
  function cellHTML(f) {
    var id = domId(f.id);
    var word = Format.unitWord(f.unit);
    return '<span class="cell">' +
      (f.unit === "money" ? '<span class="cell__pre" aria-hidden="true">R$</span>' : "") +
      '<input class="cell__input" id="f-' + id + '" data-field="' + f.id + '" type="text" inputmode="decimal" ' +
        'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="next" ' +
        'placeholder="Calcule" aria-describedby="m-' + id + '">' +
      (word ? '<span class="cell__suf" aria-hidden="true">' + word + "</span>" : "") +
      '<span class="cell__mark" aria-hidden="true"></span>' +
      "</span>";
  }

  // uma linha em branco da planilha: o rótulo, a célula e, embaixo, a
  // mensagem (a dica quando errou, o resultado da conta enquanto digita)
  function calcRowHTML(f, extra, srName) {
    var id = domId(f.id);
    return '<div class="srow srow--calc' + (extra ? " " + extra : "") + '" data-row="' + f.id + '">' +
      '<label class="srow__label" for="f-' + id + '">' + Format.esc(f.label) +
        (srName ? '<span class="sr-only"> (' + Format.esc(srName) + ")</span>" : "") + "</label>" +
      cellHTML(f) +
      '<p class="srow__msg" id="m-' + id + '"></p>' +
      "</div>";
  }

  // uma linha laranja: um dado da história, já preenchido
  function dataRowHTML(label, value) {
    return '<div class="srow srow--data">' +
      '<span class="srow__label">' + Format.esc(label) + "</span>" +
      '<span class="srow__value">' + nw(value) + "</span>" +
      "</div>";
  }

  // a célula verde da planilha: o resultado da etapa
  function diffHTML(f, icon) {
    return '<div class="sdiff fx">' + Icons.tile(icon, "green", "sdiff__ico") + calcRowHTML(f, "srow--diff") + "</div>";
  }

  // a conta da folha, como no rodapé dela
  function formulaHTML() {
    return '<p class="sformula"><span class="sformula__label">Cálculo mensal</span> = ' + Format.esc(Caixas.formula) + "</p>";
  }

  // o status da etapa (quantas certas) e os botões: o que refaz a etapa (só
  // depois de uma conferência com erro), o que confere e, com tudo certo, o
  // que avança pra próxima etapa
  function footHTML(group) {
    var next = nextOf(group);
    return '<div class="sfoot">' +
      '<p class="sfoot__status" data-status="' + group + '" aria-live="polite"></p>' +
      '<div class="sfoot__btns">' +
        '<button class="btn btn--ghost glass fx" type="button" data-redo="' + group + '" hidden>' +
          '<span data-icon="refazer"></span>Refazer a etapa</button>' +
        '<button class="btn btn--primary glass fx" type="button" data-check="' + group + '">' +
          '<span data-icon="conferir"></span>' + (group === "separar" ? "Conferir as caixas" : "Conferir os cálculos") + "</button>" +
        (next
          ? '<button class="btn btn--primary glass fx" type="button" data-next="' + next + '" hidden>' +
              "Avançar para a Etapa " + Ex.number(next) + '<span data-icon="avancar"></span></button>'
          : "") +
      "</div>" +
      "</div>";
  }

  // a pergunta para discutir, que aparece quando a etapa termina, e uma
  // resposta possível que só abre quando o professor quiser
  function whyHTML(group) {
    var d = H.discussao && H.discussao[group];
    if (!d) return "";
    return '<div class="insight swhy fx" data-why tabindex="-1" hidden>' +
      '<p class="insight__title">' + Icons.tile("duvida", "amber", "itile--xs") + "Para discutir</p>" +
      "<p>" + fillHTML(d.why) + "</p>" +
      (d.answer
        ? '<details class="answer"><summary>Ver uma resposta</summary><p>' + fillHTML(d.answer) + "</p></details>"
        : "") +
      "</div>";
  }

  // o alto de cada cartão: o desenho (um quadrinho ou a caixa), a etiqueta,
  // a pergunta e o subtítulo
  function headHTML(group, art, kicker, title, sub) {
    return '<div class="head fx">' + art +
      "<div>" +
        '<p class="card__kicker">' + kicker + "</p>" +
        '<h3 class="invcard__title" id="etapa-' + group + '-title">' + Format.esc(title) + "</h3>" +
        (sub ? '<p class="invcard__sub">' + Format.esc(sub) + "</p>" : "") +
      "</div>" +
      "</div>";
  }

  function cardOpen(group) {
    return '<article class="card deccard panel" id="etapa-' + group + '" data-group="' + group + '" tabindex="-1" aria-labelledby="etapa-' + group + '-title">';
  }

  function kickerOf(group, extra) {
    return nw("Etapa " + Ex.number(group)) + " · " + nw(Ex.topic(group)) + (extra ? " · " + nw(extra) : "");
  }

  /* ============ Etapa 1: o saldo ============ */
  function colHTML(icon, tone, name, pick, story, rows) {
    return '<section class="scol" aria-label="' + Format.esc(name) + '">' +
      '<header class="scol__head">' + Icons.tile(icon, tone, "scol__ico") +
        '<div class="scol__who">' +
          '<p class="scol__name">' + Format.esc(name) + "</p>" +
          '<p class="scol__pick">' + Format.esc(pick) + "</p>" +
        "</div>" +
      "</header>" +
      (story ? '<p class="scol__story">' + Format.esc(story) + "</p>" : "") +
      '<div class="srows">' + rows + "</div>" +
      "</section>";
  }

  function saldoHTML() {
    var receitas = H.receitas.map(function (r) { return dataRowHTML(r.label, Format.money(r.value)); }).join("");
    var despesas = H.despesas.map(function (d) { return dataRowHTML(d.label, Format.money(d.value)); }).join("") +
      calcRowHTML(Ex.field("saldo.despesas"));
    return cardOpen("saldo") +
      headHTML("saldo", Icons.tile("carteira", "green", "itile--lg"), kickerOf("saldo"),
        "Quanto sobra para " + H.a + " todo mês?",
        "O saldo é o que sobra da receita depois das despesas. É ele que vai ser dividido nas caixas.") +
      '<div class="scols">' +
        colHTML("cifrao", "green", "Receitas", "O que entra todo mês", H.receitasText, receitas) +
        colHTML("sacola", "pink", "Despesas", "O que sai todo mês", H.despesasText, despesas) +
      "</div>" +
      diffHTML(Ex.field("saldo.saldo"), "balanca") +
      whyHTML("saldo") +
      footHTML("saldo") +
      "</article>";
  }

  /* ============ Etapa 2: as caixas ============ */
  // As 3 caixas lado a lado, com o prazo de cada uma: é a legenda da etapa.
  function keysHTML() {
    return '<ul class="ckeys" aria-label="As caixas e os prazos">' + Caixas.list.map(function (c) {
      return '<li class="ckey ckey--' + c.key + '">' + Icons.box(c.key, "ckey__box") +
        '<span class="ckey__text"><span class="ckey__name">' + Format.esc(c.name) + "</span>" +
        '<span class="ckey__range">' + Format.esc(c.range) + "</span></span></li>";
    }).join("") + "</ul>";
  }

  // Uma meta e as 3 caixas pra escolher. As caixas são botões de rádio de
  // verdade (as setas do teclado andam entre elas), desenhados como caixas.
  function pickHTML(f) {
    var m = f.meta;
    var id = domId(f.id);
    return '<div class="mpick" data-row="' + f.id + '">' +
      '<div class="mpick__head">' + Icons.tile(m.icon, "violet", "itile--sm") +
        "<div>" +
          '<p class="mpick__name" id="n-' + id + '">' + Format.esc(m.name) + "</p>" +
          '<p class="mpick__data">' + nw(Format.money(m.total)) + " · " + nw(Format.monthYear(m.date)) + "</p>" +
        "</div>" +
      "</div>" +
      '<div class="choice" role="radiogroup" aria-labelledby="n-' + id + '" aria-describedby="m-' + id + '">' +
        Caixas.list.map(function (c) {
          return '<label class="choice__opt choice__opt--' + c.key + '">' +
            '<input class="choice__input" type="radio" name="c-' + id + '" value="' + c.key + '" data-choice="' + f.id + '">' +
            '<span class="choice__box" aria-hidden="true">' + Icons.box(c.key) + "</span>" +
            '<span class="choice__name">' + Format.esc(c.short) + '<span class="sr-only"> prazo (' + Format.esc(c.range) + ")</span></span>" +
            "</label>";
        }).join("") +
      "</div>" +
      '<p class="srow__msg" id="m-' + id + '"></p>' +
      "</div>";
  }

  function separarHTML() {
    return cardOpen("separar") +
      headHTML("separar", Icons.tile("caixa", "violet", "itile--lg"), kickerOf("separar"),
        "Em qual caixa vai cada sonho " + H.da + "?",
        "Hoje é " + Format.monthYear(H.today) + ". Veja quanto tempo falta para cada meta e escolha a caixa do prazo dela.") +
      keysHTML() +
      '<div class="mpicks">' + Ex.fieldsOf("separar").map(pickHTML).join("") + "</div>" +
      whyHTML("separar") +
      footHTML("separar") +
      "</article>";
  }

  /* ============ uma etapa por caixa ============ */
  // O prazo da caixa, logo embaixo da pergunta: a faixa de meses dela e, à
  // direita, a régua das 3 caixas com o pedaço desta em destaque.
  function rulerMiniHTML(key) {
    return '<div class="speriod__bar" aria-hidden="true">' +
      '<span class="speriod__track">' + Caixas.list.map(function (c) {
        var z = Ex.zoneOf(c.key);
        return '<span class="speriod__zone speriod__zone--' + c.key + (c.key === key ? " is-on" : "") + '" style="left:' + z.from + "%;width:" + (z.to - z.from) + '%"></span>';
      }).join("") + "</span>" +
      '<span class="speriod__ticks">' + Ex.ticks().map(function (t, i, all) {
        var edge = i === 0 ? " is-first" : i === all.length - 1 ? " is-last" : "";
        return '<span class="speriod__tick' + edge + '" style="left:' + t.pos + '%">' + Format.esc(t.label) + "</span>";
      }).join("") + "</span>" +
      "</div>";
  }

  function periodHTML(b) {
    var c = b.caixa;
    return '<div class="speriod speriod--' + c.key + ' fx">' +
      Icons.tile("calendario", c.key, "speriod__ico") +
      '<div class="speriod__body">' +
        '<p class="speriod__label">Prazo desta caixa</p>' +
        '<p class="speriod__value">' + nw(c.range) + ' <span class="speriod__range">' + nw("a partir de " + Format.monthYear(H.today)) + "</span></p>" +
        '<p class="speriod__text">Conte os meses de ' + nw(Format.monthYear(H.today)) + " até a data de cada meta e divida o valor total por eles.</p>" +
      "</div>" +
      rulerMiniHTML(c.key) +
      "</div>";
  }

  function metaColHTML(b, m) {
    var rows = dataRowHTML("Data de realização", Format.monthYear(m.date, true)) +
      dataRowHTML("Valor total", Format.money(m.total)) +
      calcRowHTML(Ex.field(b.key + "." + m.id + ".meses"), "", m.name) +
      calcRowHTML(Ex.field(b.key + "." + m.id + ".mensal"), "", m.name);
    return '<section class="scol" aria-label="' + Format.esc(m.name) + '">' +
      '<header class="scol__head">' + Icons.tile(m.icon, b.key, "scol__ico") +
        '<div class="scol__who">' +
          '<p class="scol__label">Descrição da meta</p>' +
          '<p class="scol__name">' + Format.esc(m.name) + "</p>" +
        "</div>" +
      "</header>" +
      '<p class="scol__story">' + Format.esc(m.story) + "</p>" +
      '<div class="srows">' + rows + "</div>" +
      "</section>";
  }

  function boxHTML(b) {
    var c = b.caixa;
    return cardOpen(b.key).replace('class="card deccard', 'class="card deccard deccard--' + c.key) +
      headHTML(b.key, '<span class="deccard__box">' + Icons.box(c.key) + "</span>", kickerOf(b.key, c.range),
        "Quanto guardar por mês na caixa do " + c.name.toLowerCase() + "?",
        b.metas.length === 1
          ? "Conte os meses que faltam para a meta e divida o valor total por eles."
          : "Para cada uma das " + b.metas.length + " metas: conte os meses que faltam e divida o valor total por eles.") +
      periodHTML(b) +
      formulaHTML() +
      '<div class="scols' + (b.metas.length > 2 ? " scols--3" : b.metas.length === 1 ? " scols--1" : "") + '">' +
        b.metas.map(function (m) { return metaColHTML(b, m); }).join("") +
      "</div>" +
      diffHTML(Ex.field(b.key + ".total"), "caixa") +
      whyHTML(b.key) +
      footHTML(b.key) +
      "</article>";
  }

  /* ============ a última etapa: o plano ============ */
  function recapHTML() {
    var t = Ex.totals();
    return Ex.boxes.map(function (b) {
      var f = Ex.field(b.key + ".total");
      var ok = !!Ex.statusOf(f.id);
      return '<li class="srecap__row' + (ok ? " is-done" : "") + '">' +
        '<a class="srecap__link" href="#etapa-' + b.key + '" data-go="' + b.key + '">' +
          '<span class="srecap__box">' + Icons.box(b.key) + "</span>" +
          '<span class="srecap__name">' + Format.esc(b.caixa.name) + "</span>" +
          '<span class="srecap__value">' + (ok ? nw(Format.money(b.monthly)) + '<span class="srecap__unit"> por mês</span>' : "a calcular") + "</span>" +
        "</a>" +
        "</li>";
    }).join("") +
      '<li class="srecap__row srecap__row--saldo is-done">' +
        '<a class="srecap__link" href="#etapa-saldo" data-go="saldo">' + Icons.tile("carteira", "green", "itile--xs") +
          '<span class="srecap__name">Saldo do mês</span>' +
          '<span class="srecap__value">' + nw(Format.money(t.saldo)) + "</span>" +
        "</a>" +
      "</li>";
  }

  function planoHTML() {
    return cardOpen("plano") +
      headHTML("plano", Icons.tile("balanca", "green", "itile--lg"), kickerOf("plano"),
        "O plano " + H.da + " cabe no saldo?",
        "Some o que vai por mês para as " + Ex.boxes.length + " caixas e veja quanto sobra do saldo.") +
      '<ul class="srecap" data-recap></ul>' +
      '<div class="srows srows--solo">' + calcRowHTML(Ex.field("plano.total")) + "</div>" +
      diffHTML(Ex.field("plano.sobra"), "carteira") +
      whyHTML("plano") +
      footHTML("plano") +
      "</article>";
  }

  /* ============ a tela acompanha o estado ============ */
  // Os cartões são montados uma vez só e depois só atualizados: redesenhar
  // tudo a cada tecla tiraria o foco de quem está digitando.
  function rowEl(id) { return root.querySelector('[data-row="' + id + '"]'); }
  function cardEl(group) { return root.querySelector('[data-group="' + group + '"]'); }

  var MSG = {
    ok: "Certo!",
    invalid: "Não deu para entender esse valor. Confira o que foi digitado: vale o número, como 120 ou 1.100,00.",
    missing: "Falta calcular."
  };
  var STATES = ["ok", "wrong", "invalid", "missing"];

  // enquanto o aluno digita uma conta, a célula mostra quanto ela dá
  function previewText(f) {
    var r = Parse.read(Ex.textOf(f.id));
    return r.ok && r.expr ? "= " + Format.unit(r.n, f.unit) : "";
  }

  // uma escolha de caixa: as caixas marcadas, travadas quando certas, e a
  // mensagem (com a caixa certa, o prazo da meta)
  function syncChoice(f, row, msg, st) {
    var solved = st === "ok";
    var v = Ex.textOf(f.id);
    Array.prototype.forEach.call(row.querySelectorAll("[data-choice]"), function (r) {
      r.checked = r.value === v;
      r.disabled = solved;
    });
    var group = row.querySelector('[role="radiogroup"]');
    if (st === "wrong") group.setAttribute("aria-invalid", "true");
    else group.removeAttribute("aria-invalid");
    if (solved) msg.innerHTML = "<strong>Certo!</strong> " + Format.esc("Faltam " + Format.duration(f.meta.months) + ": " + f.meta.caixa.name.toLowerCase() + ".");
    else if (st === "wrong") msg.innerHTML = "Não é essa caixa. <strong>Dica:</strong> " + Format.esc(f.hint);
    else if (st === "missing") msg.textContent = "Falta escolher a caixa.";
    else msg.textContent = "";
  }

  function syncField(f) {
    var row = rowEl(f.id);
    var msg = row.querySelector(".srow__msg");
    var st = Ex.statusOf(f.id) || mark[f.id] || "";
    STATES.forEach(function (s) { row.classList.toggle("is-" + s, st === s); });

    if (f.kind === "choice") {
      syncChoice(f, row, msg, st);
      return;
    }

    var input = row.querySelector("input");
    var solved = st === "ok";
    input.readOnly = solved;
    input.placeholder = solved ? "" : "Calcule";
    if (input.value !== Ex.textOf(f.id)) input.value = Ex.textOf(f.id);
    if (st === "wrong" || st === "invalid") input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");

    if (st === "wrong") msg.innerHTML = "Não é esse valor. <strong>Dica:</strong> " + Format.esc(f.hint);
    else if (MSG[st]) msg.textContent = MSG[st];
    else msg.textContent = previewText(f);
    // o "Certo!" é pro leitor de tela: quem vê já tem a marca verde na célula
    msg.classList.toggle("sr-only", st === "ok");
  }

  function statusText(group) {
    var c = Ex.counts(group);
    var t = Ex.totals();
    if (group === "separar") {
      if (!c.open) return "Etapa concluída: as " + c.total + " metas estão nas caixas certas!";
      if (!Ex.wasChecked(group)) return "Escolha a caixa de cada uma das " + c.total + " metas e confira. Para avançar, todas têm que estar certas.";
      return c.ok + " de " + c.total + " metas na caixa certa. Para avançar, acerte todas: troque as que faltam ou refaça a etapa.";
    }
    if (group === "plano" && !c.open) {
      return t.sobra >= 0 ? "Você fechou o plano: cabe no saldo e ainda sobram " + Format.money(t.sobra) + " por mês!"
        : "Você fechou o plano: ele passa do saldo em " + Format.money(-t.sobra) + " por mês.";
    }
    if (!c.open) return "Etapa concluída: você acertou os " + c.total + " cálculos!";
    if (!Ex.wasChecked(group)) {
      return c.total === 1 ? "Faça o cálculo em branco e confira." : "Preencha os " + c.total + " cálculos em branco e confira. Para avançar, todos têm que estar certos.";
    }
    return c.ok + " de " + c.total + " cálculos certos. Para avançar, acerte todos: corrija os que faltam ou refaça a etapa.";
  }

  function syncGroup(group) {
    Ex.fieldsOf(group).forEach(syncField);
    var card = cardEl(group);
    var finished = Ex.isDone(group);
    card.hidden = group !== active;
    card.classList.toggle("is-done", finished);
    card.querySelector("[data-check]").hidden = finished;
    card.querySelector("[data-redo]").hidden = finished || !Ex.wasChecked(group);
    var next = card.querySelector("[data-next]");
    if (next) next.hidden = !finished;
    // o status é anunciado pelo leitor de tela: só muda quando o texto muda,
    // pra não repetir o dos outros cartões a cada conferência
    var status = card.querySelector("[data-status]");
    var txt = statusText(group);
    if (status.textContent !== txt) status.textContent = txt;
    var why = card.querySelector("[data-why]");
    if (why) why.hidden = !finished;
    var recap = card.querySelector("[data-recap]");
    if (recap) {
      recap.innerHTML = recapHTML();
    }

    // no teclado do celular, a tecla de Enter diz o que vai acontecer: ir
    // pra próxima célula em aberto ou, na última, conferir
    var open = Array.prototype.filter.call(card.querySelectorAll("[data-field]"), function (x) { return !x.readOnly; });
    open.forEach(function (x, i) { x.setAttribute("enterkeyhint", i === open.length - 1 ? "done" : "next"); });
  }

  // As etapas acompanham: as certas ganham o selo, a que está na tela fica
  // marcada e as que ainda não abriram ficam apagadas.
  function syncSteps() {
    Ex.groups().forEach(function (g) {
      var item = root.querySelector('[data-step-item="' + g + '"]');
      var btn = item.querySelector("[data-step]");
      var ok = Ex.isDone(g);
      var locked = !!Ex.blocked(g);
      item.classList.toggle("is-done", ok);
      item.classList.toggle("is-active", g === active);
      item.classList.toggle("is-locked", locked);
      if (g === active) btn.setAttribute("aria-current", "step");
      else btn.removeAttribute("aria-current");
      item.querySelector("[data-step-state]").textContent = locked ? " (bloqueada)" : ok ? " (concluída)" : "";
    });
  }

  // Os medidores do alto: quantas respostas o aluno acertou, quantas etapas
  // terminou e quanto do saldo já foi para as caixas (cada caixa entra na
  // barrinha, na cor dela, quando a etapa dela fica certa).
  function syncMeters() {
    var c = Ex.counts();
    var n = Ex.groups().length;
    var d = Ex.stepsDone();
    el("meter-ok-used").textContent = String(c.ok);
    el("meter-ok-fill").style.width = (c.ok / c.total * 100) + "%";
    el("meter-steps-used").textContent = String(d);
    el("meter-steps-fill").style.width = (d / n * 100) + "%";

    var t = Ex.totals();
    var known = Ex.isDone("saldo");
    var base = Math.max(t.saldo, t.planned, 1);
    var used = 0;
    Ex.boxes.forEach(function (b) {
      var seg = el("meter-saldo").querySelector('[data-seg="' + b.key + '"]');
      var on = known && Ex.isDone(b.key);
      if (on) used += b.monthly;
      seg.style.width = on ? (b.monthly / base * 100) + "%" : "0%";
    });
    el("meter-saldo-used").textContent = known ? Format.compactMoney(used) : "—";
    el("meter-saldo-max").textContent = known ? Format.compactMoney(t.saldo) : "";
    el("meter-saldo-of").hidden = !known;
  }

  function sync() {
    Ex.groups().forEach(syncGroup);
    syncSteps();
    syncMeters();
    // a célula com o foco pode ter acabado de ficar resolvida (só leitura)
    syncSinais();
  }

  /* ============ os sinais das contas, no celular ============ */
  // O teclado de números do celular não tem os sinais das contas. Enquanto o
  // aluno escreve numa célula com o dedo, uma barrinha com eles fica logo
  // acima do teclado: tocar num sinal escreve ele onde está o cursor, e o
  // "=" põe o resultado da conta na célula, como o Enter. Os botões não
  // tiram o foco da célula, pro teclado não fechar.
  var SINAIS = [
    { s: "+", nome: "mais" },
    { s: "−", nome: "menos" },
    { s: "*", nome: "vezes" },
    { s: "/", nome: "dividido por" },
    { s: "(", nome: "abre parênteses" },
    { s: ")", nome: "fecha parênteses" },
    { s: "=", nome: "resultado da conta" }
  ];
  var toque = global.matchMedia ? global.matchMedia("(hover: none), (pointer: coarse)") : null;
  var barra = null;

  function montarSinais() {
    barra = document.createElement("div");
    barra.className = "sinais";
    barra.setAttribute("role", "toolbar");
    barra.setAttribute("aria-label", "Sinais das contas");
    barra.hidden = true;
    barra.innerHTML = SINAIS.map(function (x) {
      return '<button class="sinais__btn' + (x.s === "=" ? " sinais__btn--igual" : "") + '" type="button" tabindex="-1" ' +
        'data-sinal="' + x.s + '" aria-label="' + x.nome + '">' + x.s + "</button>";
    }).join("");
    document.body.appendChild(barra);

    // sem isso, o toque no botão tira o foco da célula e o teclado fecha
    function segurar(e) { if (e.target.closest("[data-sinal]")) e.preventDefault(); }
    barra.addEventListener("pointerdown", segurar);
    barra.addEventListener("mousedown", segurar);
    barra.addEventListener("click", handleSinal);

    if (global.visualViewport) {
      // o teclado abriu ou mudou de tamanho: a célula pode ter ficado atrás
      global.visualViewport.addEventListener("resize", function () { posicionarSinais(true); });
      global.visualViewport.addEventListener("scroll", function () { posicionarSinais(false); });
    }
  }

  // a célula em aberto que está com o foco, ou null
  function celulaAtiva() {
    var input = document.activeElement;
    return input && root.contains(input) && input.matches("[data-field]") && !input.readOnly ? input : null;
  }

  function syncSinais(ajustar) {
    if (!barra) return;
    var aberta = !!(toque && toque.matches && celulaAtiva());
    barra.hidden = !aberta;
    document.documentElement.classList.toggle("com-sinais", aberta);
    if (aberta) posicionarSinais(ajustar);
  }

  // A barrinha fica no pé da parte da tela que sobra acima do teclado. Com
  // ajustar, se a célula ficou atrás dela, a página sobe o que falta.
  function posicionarSinais(ajustar) {
    if (!barra || barra.hidden) return;
    var vv = global.visualViewport;
    if (!vv) return;
    var topo = vv.offsetTop + vv.height - barra.offsetHeight;
    barra.style.top = topo + "px";
    barra.style.bottom = "auto";
    var input = ajustar && celulaAtiva();
    if (!input) return;
    var falta = input.getBoundingClientRect().bottom + 8 - topo;
    if (falta > 0) global.scrollBy(0, falta);
  }

  function escrever(input, s) {
    var ini = input.selectionStart == null ? input.value.length : input.selectionStart;
    var fim = input.selectionEnd == null ? ini : input.selectionEnd;
    input.setRangeText(s, ini, fim, "end");
    // passa pelo mesmo caminho do que o aluno digita (handleInput)
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function handleSinal(e) {
    var b = e.target.closest("[data-sinal]");
    var input = celulaAtiva();
    if (!b || !input) return;
    var s = b.getAttribute("data-sinal");
    if (s === "=" && input.value.trim()) completar(input.getAttribute("data-field"), true);
    else escrever(input, s);
  }

  // o foco entrou ou saiu de uma célula; na saída, o foco ainda não chegou
  // no lugar novo, então espera um instante
  function handleFoco() {
    setTimeout(function () { syncSinais(true); }, 0);
  }

  /* ============ medidores grudados no alto ============ */
  var quadroPedido = false;

  function syncStuck() {
    var meters = el("meters");
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

  /* ============ as etapas ============ */
  // Abre uma etapa, se ela já abriu (senão, o aviso diz o que falta). A tela
  // vai até as etapas, pra elas ficarem à vista em cima do cartão, e o foco
  // vai pro cartão, que o leitor de tela anuncia.
  function abrir(group) {
    var err = Ex.blocked(group);
    if (err) {
      Toast.show(err);
      return;
    }
    Toast.hide();
    active = group;
    sync();
    el("steps").scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" });
    cardEl(group).focus({ preventScroll: true });
  }

  /* ============ conferir e refazer ============ */
  function mostrarPerto(x) {
    x.focus({ preventScroll: true });
    x.scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "nearest" });
  }

  // Depois de conferir, a tela acompanha. Se a etapa terminou, o botão que
  // estava com o foco sumiu: o foco vai pra pergunta de discussão (ou pro
  // resultado final, na última etapa: o app.js cuida, pelo onChange).
  function depois(group) {
    sync();
    if (onChange) onChange(group);
    if (!Ex.isDone(group) || group === "plano") return;
    var why = cardEl(group).querySelector("[data-why]");
    if (why) mostrarPerto(why);
  }

  function conferir(group) {
    var r = Ex.check(group);
    if (r.error) {
      Toast.show(r.error);
      return;
    }
    Toast.hide();
    Object.keys(r.results).forEach(function (id) {
      if (r.results[id] === "ok") delete mark[id];
      else mark[id] = r.results[id];
    });
    depois(group);
  }

  // Refaz a etapa: as respostas voltam em branco e o foco vai pra primeira
  // (o botão de refazer, que estava com o foco, some).
  function refazer(group) {
    var err = Ex.redo(group);
    if (err) {
      Toast.show(err);
      return;
    }
    Toast.hide();
    Ex.fieldsOf(group).forEach(function (f) { delete mark[f.id]; });
    sync();
    var first = cardEl(group).querySelector("[data-field],[data-choice]");
    if (first) first.focus();
  }

  /* ============ eventos ============ */
  function handleClick(e) {
    var b = e.target.closest("[data-check]");
    if (b) { conferir(b.getAttribute("data-check")); return; }
    b = e.target.closest("[data-redo]");
    if (b) { refazer(b.getAttribute("data-redo")); return; }
    b = e.target.closest("[data-next]");
    if (b) { abrir(b.getAttribute("data-next")); return; }
    b = e.target.closest("[data-step]");
    if (b) { abrir(b.getAttribute("data-step")); return; }
    var go = e.target.closest("[data-go]");
    if (go) {
      e.preventDefault();
      abrir(go.getAttribute("data-go"));
    }
  }

  // A máscara enquanto o aluno digita um número (mask.js): os pontos de
  // milhar entram sozinhos e o cursor fica no mesmo lugar dos algarismos.
  function mascarar(input, inputType) {
    var raw = input.value;
    var masked = Mask.live(raw, /^delete/.test(inputType));
    if (masked === null || masked === raw) return;
    var after = Mask.significant(raw.slice(input.selectionEnd == null ? raw.length : input.selectionEnd));
    input.value = masked;
    var p = Mask.caret(masked, after, /Backward$/.test(inputType));
    input.setSelectionRange(p, p);
  }

  // o aluno digitou: a máscara arruma o número, o texto fica guardado e a
  // marca da última conferência sai daquele campo (ele está corrigindo)
  function handleInput(e) {
    var input = e.target.closest("[data-field]");
    if (!input || input.readOnly) return;
    if (!e.isComposing) mascarar(input, e.inputType || "");
    var id = input.getAttribute("data-field");
    Ex.setText(id, input.value);
    delete mark[id];
    syncField(Ex.field(id));
  }

  // o aluno escolheu uma caixa: fica guardado, e a marca da última
  // conferência sai daquela meta
  function handleChange(e) {
    var r = e.target.closest("[data-choice]");
    if (!r || !r.checked) return;
    var id = r.getAttribute("data-choice");
    Ex.setText(id, r.value);
    delete mark[id];
    syncField(Ex.field(id));
  }

  // Deixa a célula do jeito que ela pede, com o valor que está nela: o
  // número se completa ("120" vira "120,00" na de dinheiro) e, com conta =
  // true, a conta vira o resultado, como a planilha faz no Enter ("360/3"
  // vira "120,00"). O que não deu pra entender fica como está.
  function completar(id, conta) {
    var f = Ex.field(id);
    var r = Parse.read(Ex.textOf(id));
    if (!r.ok || (r.expr && !conta)) return;
    var txt = Format.plain(r.n, f.unit);
    if (txt === Ex.textOf(id)) return;
    Ex.setText(id, txt);
    syncField(f);
  }

  // Ao sair da célula, o número se completa. A conta fica como o aluno
  // escreveu: ele pode ter saído só pra olhar um dado e voltar pra terminar.
  function handleBlur(e) {
    var input = e.target.closest && e.target.closest("[data-field]");
    if (!input || input.readOnly) return;
    completar(input.getAttribute("data-field"), false);
  }

  // Enter completa a célula (a conta vira o resultado) e vai pra próxima
  // célula em aberto do cartão, como numa planilha. Na última, confere.
  function handleKey(e) {
    if (e.key !== "Enter") return;
    var input = e.target.closest("[data-field]");
    if (!input) return;
    e.preventDefault();
    if (!input.readOnly) completar(input.getAttribute("data-field"), true);
    var card = input.closest("[data-group]");
    var all = Array.prototype.slice.call(card.querySelectorAll("[data-field]"));
    var next = all.slice(all.indexOf(input) + 1).filter(function (x) { return !x.readOnly; })[0];
    if (next) next.focus();
    else conferir(card.getAttribute("data-group"));
  }

  /* ============ API ============ */
  // monta as etapas e os cartões, com a etapa em que o aluno está aberta
  function render() {
    mark = {};
    active = Ex.current();
    root.innerHTML = stepsHTML() + saldoHTML() + separarHTML() + Ex.boxes.map(boxHTML).join("") + planoHTML();
    Icons.mount(root);
    sync();
  }

  // Os pedaços da barrinha do saldo, um por caixa, na ordem da folha.
  function saldoMeterHTML() {
    return Ex.boxes.map(function (b) {
      return '<span class="meter__seg meter__seg--' + b.key + '" data-seg="' + b.key + '"></span>';
    }).join("");
  }

  function mount(container, changeCallback) {
    root = container;
    onChange = changeCallback || null;
    montarSinais();
    el("meter-saldo-track").innerHTML = saldoMeterHTML();
    render();
    root.addEventListener("click", handleClick);
    root.addEventListener("input", handleInput);
    root.addEventListener("change", handleChange);
    root.addEventListener("focusout", handleBlur);
    root.addEventListener("keydown", handleKey);
    root.addEventListener("focusin", handleFoco);
    root.addEventListener("focusout", handleFoco);

    el("meter-ok-max").textContent = String(Ex.counts().total);
    el("meter-steps-max").textContent = String(Ex.groups().length);

    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    syncStuck();
  }

  // abre uma etapa (a régua do tempo usa)
  function show(group) {
    abrir(String(group));
  }

  global.SheetView = {
    mount: mount,
    render: render,
    sync: sync,
    show: show
  };
})(window);
