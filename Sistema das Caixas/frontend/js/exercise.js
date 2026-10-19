(function (global) {
  "use strict";

  var H = global.Historia;
  var Caixas = global.Caixas;
  var Format = global.Format;
  var Parse = global.Parse;

  // O estado do exercício "As caixas da Bia" e as contas. Não toca no DOM:
  // as telas leem daqui e pedem as mudanças por aqui, e é aqui que ficam as
  // regras.
  //
  // Cada resposta que o aluno dá é um campo, com um id: "saldo.despesas" (um
  // cálculo), "separar.fone" (a caixa de uma meta), "curto.fone.meses" e
  // "curto.fone.mensal" (as contas de uma meta), "curto.total" (o total da
  // caixa por mês), "plano.total" e "plano.sobra". Os campos se juntam em
  // grupos, que são conferidos juntos: cada grupo é uma etapa, e as etapas
  // vão em ordem (uma só abre quando todos os campos das de antes estão
  // certos):
  //   saldo     Etapa 1: quanto sobra no mês
  //   separar   Etapa 2: a caixa de cada meta
  //   curto...  uma etapa por caixa: os meses e o valor por mês de cada meta
  //   plano     a última: o total das caixas e quanto sobra do saldo
  //
  // text: o que o aluno digitou (ou, numa escolha, a caixa que ele marcou).
  // done: os campos que o aluno acertou ("ok"). Certo, o campo não muda
  //   mais (só refazendo a etapa).
  // checked: os grupos que o aluno já conferiu desde que começou (ou
  //   refez) a etapa. Só depois disso aparece o botão de refazer.
  var text = {};
  var done = {};
  var checked = {};

  // Tudo isso fica guardado no navegador, pra recarregar a página não apagar
  // o que o aluno já fez, e separado por conta ("caixas-da-bia:" e o id de
  // quem entrou). O open() escolhe a conta.
  var BASE = "caixas-da-bia";
  var KEY = BASE;

  function round2(n) { return Math.round(n * 100) / 100; }
  function sum(list, f) { return list.reduce(function (t, x) { return t + f(x); }, 0); }
  function warn(msg) { if (global.console) console.warn(msg); }

  /* ============ as contas ============ */
  var receita = round2(sum(H.receitas, function (x) { return x.value; }));
  var despesas = round2(sum(H.despesas, function (x) { return x.value; }));
  var saldo = round2(receita - despesas);

  // As metas com as contas da folha: quantos meses faltam, de hoje até a
  // data dela, quanto guardar por mês (valor total ÷ meses) e a caixa do
  // prazo.
  var METAS = H.metas.map(function (m) {
    var months = Format.monthsBetween(H.today, m.date);
    if (months < 1) warn("Meta " + m.id + ": a data tem que ser depois de " + Format.monthYear(H.today) + ".");
    var monthly = round2(m.total / months);
    if (Math.abs(m.total / months - monthly) > 1e-9) {
      warn("Meta " + m.id + ": " + m.total + " ÷ " + months + " meses não dá um valor exato em centavos (fica " + monthly + ").");
    }
    return {
      id: m.id,
      name: m.name,
      icon: m.icon,
      date: m.date,
      total: m.total,
      story: m.story,
      months: months,
      monthly: monthly,
      caixa: Caixas.of(months)
    };
  });

  // As caixas que têm meta, na ordem da folha, com as metas de cada uma
  // (da mais perto à mais longe) e o total dela por mês.
  var BOXES = Caixas.list.map(function (c) {
    var metas = METAS.filter(function (m) { return m.caixa === c; })
      .sort(function (a, b) { return a.months - b.months; });
    return { key: c.key, caixa: c, metas: metas, monthly: round2(sum(metas, function (m) { return m.monthly; })) };
  }).filter(function (b) { return b.metas.length; });

  var planned = round2(sum(BOXES, function (b) { return b.monthly; }));
  var sobra = round2(saldo - planned);

  function meta(id) { return METAS.filter(function (m) { return m.id === id; })[0] || null; }
  function boxOf(key) { return BOXES.filter(function (b) { return b.key === key; })[0] || null; }

  // a última meta de uma caixa: quando ela é realizada, a caixa fica livre
  function lastOf(b) { return b.metas[b.metas.length - 1]; }

  /* ============ a régua do tempo ============ */
  // A régua das caixas: cada caixa ocupa uma parte igual da largura (o
  // curto prazo vai de hoje a 1 ano; o médio, de 1 a 5 anos; o longo, de 5
  // anos até a meta mais longe, ou 10 anos, o que for maior). Dentro de cada
  // parte, o mês fica no lugar dele. Assim os 3 e os 6 meses do curto prazo
  // não ficam espremidos no começo.
  var END = Math.max(120, Math.ceil(Math.max.apply(null, METAS.map(function (m) { return m.months; })) / 12) * 12);
  var EDGES = [0].concat(Caixas.list.slice(0, -1).map(function (c) { return c.max; })).concat(END);

  // a posição de um mês na régua, de 0 a 100 (%)
  function pos(months) {
    var n = EDGES.length - 1;
    for (var i = 0; i < n; i++) {
      if (months <= EDGES[i + 1] || i === n - 1) {
        var p = (months - EDGES[i]) / (EDGES[i + 1] - EDGES[i]);
        return Math.min(Math.max((i + p) / n, 0), 1) * 100;
      }
    }
    return 100;
  }

  // as marcas da régua: "hoje", "1 ano", "5 anos" e o fim
  function ticks() {
    return EDGES.map(function (m) {
      return { months: m, pos: pos(m), label: m === 0 ? "hoje" : Format.duration(m) };
    });
  }

  // onde cada caixa começa e termina na régua (%)
  function zoneOf(key) {
    var i = Caixas.list.indexOf(Caixas.byKey(key));
    return { from: pos(EDGES[i]), to: pos(EDGES[i + 1]) };
  }

  /* ============ os textos com valores ============ */
  // Um {marcador} dos textos de historia.js virando valor (veja a lista lá).
  function token(name) {
    if (name === "receita") return Format.money(receita);
    if (name === "despesas") return Format.money(despesas);
    if (name === "saldo") return Format.money(saldo);
    if (name === "planejado") return Format.money(planned);
    if (name === "sobra") return Format.money(Math.abs(sobra));
    if (name === "hoje") return Format.monthYear(H.today);
    var p = name.split(".");
    var b = boxOf(p[1]);
    if (p[0] === "caixa" && b) return Format.money(b.monthly);
    if (p[0] === "fim" && b) return Format.monthYear(lastOf(b).date);
    var m = p[0] === "meta" && meta(p[1]);
    if (m) {
      if (p[2] === "total") return Format.money(m.total);
      if (p[2] === "mensal") return Format.money(m.monthly);
      if (p[2] === "meses") return Format.unit(m.months, "meses");
      if (p[2] === "data") return Format.monthYear(m.date);
      if (p[2] === "prazo") return Format.duration(m.months);
      if (p[2] === "nome") return m.name;
    }
    warn("Texto da história: não existe o valor {" + name + "}.");
    return "{" + name + "}";
  }

  function fill(str) {
    return String(str).replace(/\{([^}]+)\}/g, function (all, name) { return token(name); });
  }

  /* ============ as etapas ============ */
  // o nome de cada etapa: o curto, embaixo do número dela ("Curto prazo"),
  // e o que vai nas frases ("a Etapa 3 (Curto prazo)")
  var TOPICS = { saldo: "O saldo", separar: "As caixas", plano: "O plano" };
  BOXES.forEach(function (b) { TOPICS[b.key] = b.caixa.name; });

  function groups() {
    return ["saldo", "separar"].concat(BOXES.map(function (b) { return b.key; })).concat("plano");
  }
  function topic(group) { return TOPICS[group] || group; }
  function number(group) { return groups().indexOf(group) + 1; }
  function stepName(group) { return "Etapa " + number(group) + " (" + topic(group) + ")"; }

  /* ============ os campos que o aluno preenche ============ */
  var FIELDS = [];
  var BY_ID = {};

  // as faixas das caixas numa frase: "0 a 12 meses, 1 a 5 anos ou acima de
  // 5 anos"
  var FAIXAS = Caixas.list.map(function (c) { return c.range; });
  var faixasText = FAIXAS.slice(0, -1).join(", ") + " ou " + FAIXAS[FAIXAS.length - 1];

  var nomesDespesas = H.despesas.map(function (d) { return d.label; });
  FIELDS.push({
    id: "saldo.despesas", group: "saldo", kind: "num", unit: "money",
    label: "Total das despesas",
    expected: despesas,
    hint: "Some as despesas: " + nomesDespesas.join(" + ") + "."
  });
  FIELDS.push({
    id: "saldo.saldo", group: "saldo", kind: "num", unit: "money",
    label: "Calcule o saldo do mês",
    expected: saldo,
    hint: (H.receitas.length > 1 ? "Total das receitas" : H.receitas[0].label) + " − Total das despesas."
  });

  METAS.forEach(function (m) {
    FIELDS.push({
      id: "separar." + m.id, group: "separar", kind: "choice",
      label: m.name,
      meta: m,
      expected: m.caixa.key,
      hint: "De " + Format.monthYear(H.today) + " a " + Format.monthYear(m.date) + " são " + Format.duration(m.months) +
        ". Em qual caixa cabe esse prazo: " + faixasText + "?"
    });
  });

  BOXES.forEach(function (b) {
    b.metas.forEach(function (m) {
      FIELDS.push({
        id: b.key + "." + m.id + ".meses", group: b.key, kind: "num", unit: "meses",
        label: "Quantidade de meses",
        meta: m,
        expected: m.months,
        hint: "Conte os meses de " + Format.monthYear(H.today) + " até " + Format.monthYear(m.date) +
          (m.months > 12 ? ": cada ano a mais são 12 meses." : ".")
      });
      FIELDS.push({
        id: b.key + "." + m.id + ".mensal", group: b.key, kind: "num", unit: "money",
        label: "Valor a poupar por mês",
        meta: m,
        expected: m.monthly,
        hint: "Valor total ÷ Quantidade de meses (a conta da folha das caixas)."
      });
    });
    FIELDS.push({
      id: b.key + ".total", group: b.key, kind: "num", unit: "money",
      label: "Calcule o total da caixa por mês",
      expected: b.monthly,
      hint: "Some o valor a poupar por mês das metas da caixa: " +
        b.metas.map(function (m) { return m.name; }).join(" + ") + "."
    });
  });

  FIELDS.push({
    id: "plano.total", group: "plano", kind: "num", unit: "money",
    label: "Total a guardar por mês nas " + BOXES.length + " caixas",
    expected: planned,
    hint: "Some o total por mês de cada caixa: " + BOXES.map(function (b) { return b.caixa.name; }).join(" + ") + "."
  });
  FIELDS.push({
    id: "plano.sobra", group: "plano", kind: "num", unit: "money",
    label: "Calcule quanto sobra do saldo",
    expected: sobra,
    hint: "Saldo do mês − Total a guardar por mês nas " + BOXES.length + " caixas."
  });

  FIELDS.forEach(function (f) { BY_ID[f.id] = f; });

  function field(id) { return BY_ID[id] || null; }
  function fieldsOf(group) { return FIELDS.filter(function (f) { return f.group === group; }); }

  /* ============ conferir ============ */
  // O que a resposta é: "ok", "wrong" (outro valor, outra caixa), "invalid"
  // (não deu pra entender) ou "missing" (vazio). Nos cálculos, o sinal não
  // conta (quem escreve −50 numa sobra de 50 acertou), e a diferença de até
  // 1 centavo também não, por causa dos arredondamentos.
  function judge(id) {
    var f = BY_ID[id];
    if (f.kind === "choice") {
      var v = text[id];
      if (!v) return "missing";
      if (!Caixas.byKey(v)) return "invalid";
      return v === f.expected ? "ok" : "wrong";
    }
    var r = Parse.read(text[id]);
    if (r.empty) return "missing";
    if (!r.ok) return "invalid";
    return Math.abs(Math.abs(r.n) - Math.abs(f.expected)) < 0.0101 ? "ok" : "wrong";
  }

  function textOf(id) { return text[id] || ""; }
  function statusOf(id) { return done[id] || ""; }

  // o aluno digitou (ou escolheu); campo resolvido não muda mais
  function setText(id, value) {
    if (!BY_ID[id] || done[id]) return;
    text[id] = String(value).slice(0, 80);
    save();
  }

  function isDone(group) {
    return fieldsOf(group).every(function (f) { return !!done[f.id]; });
  }
  function wasChecked(group) { return !!checked[group]; }

  // a etapa em que o aluno está: a primeira que ainda não está toda certa
  // (com tudo certo, a última)
  function current() {
    var list = groups();
    return list.filter(function (g) { return !isDone(g); })[0] || list[list.length - 1];
  }

  // Uma etapa só abre quando as de antes estão 100% certas. Devolve a frase
  // que explica por que ainda não, ou "".
  function blocked(group) {
    var list = groups();
    var falta = list.slice(0, list.indexOf(group)).filter(function (g) { return !isDone(g); });
    if (!falta.length) return "";
    if (falta.length === 1 || group !== "plano") {
      return "A " + stepName(group) + " só abre quando todas as respostas da " + stepName(falta[0]) + " estiverem certas.";
    }
    return "A " + stepName(group) + " só abre quando todas as etapas de antes estiverem certas. Faltam as Etapas " +
      Format.list(falta.map(function (g) { return String(number(g)); })) + ".";
  }

  // Confere os campos de um grupo. Os certos ficam resolvidos (e passam a
  // mostrar o valor do jeito da planilha); devolve { results } com o que
  // cada campo em aberto deu, ou { error } quando ainda não pode conferir.
  function check(group) {
    var err = blocked(group);
    if (err) return { error: err };
    var results = {};
    fieldsOf(group).forEach(function (f) {
      if (done[f.id]) return;
      var r = judge(f.id);
      results[f.id] = r;
      if (r === "ok") {
        done[f.id] = "ok";
        if (f.kind === "num") text[f.id] = Format.plain(Math.abs(f.expected), f.unit);
      }
    });
    checked[group] = true;
    save();
    return { results: results };
  }

  // Refaz uma etapa que ainda não está toda certa: apaga tudo o que o aluno
  // respondeu nela, até o que já estava certo. Devolve a frase que explica
  // por que não pode, ou "".
  function redo(group) {
    var err = blocked(group);
    if (err) return err;
    if (isDone(group)) return "Esta etapa já está toda certa.";
    fieldsOf(group).forEach(function (f) {
      delete text[f.id];
      delete done[f.id];
    });
    delete checked[group];
    save();
    return "";
  }

  // quantos campos o aluno acertou e quantos ainda faltam, num grupo ou em
  // tudo (group vazio)
  function counts(group) {
    var list = group ? fieldsOf(group) : FIELDS;
    var c = { ok: 0, open: 0, total: list.length };
    list.forEach(function (f) {
      if (done[f.id]) c.ok++;
      else c.open++;
    });
    return c;
  }

  function stepsDone() {
    return groups().filter(isDone).length;
  }

  // a meta já foi para a caixa certa? (a régua do tempo mostra ela)
  function placed(metaId) { return done["separar." + metaId] === "ok"; }

  // os números do plano, pro resultado e pros medidores
  function totals() {
    return {
      receita: receita,
      despesas: despesas,
      saldo: saldo,
      planned: planned,
      sobra: sobra
    };
  }

  // já tem alguma coisa feita? (pra perguntar antes de apagar tudo)
  function started() {
    return FIELDS.some(function (f) { return done[f.id] || textOf(f.id).trim(); });
  }

  // volta tudo ao começo: nenhuma resposta preenchida nem conferida
  function reset() {
    text = {};
    done = {};
    checked = {};
    save();
  }

  /* ============ guardar no navegador ============ */
  // Pode não ter como guardar (janela anônima, navegador que bloqueia): aí o
  // exercício funciona igual, só não lembra depois de recarregar.
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ text: text, done: done, checked: checked }));
    } catch (err) {}
  }

  // Volta o que estava guardado. Se os dados de historia.js mudaram depois,
  // um "ok" que não bate mais com a conta volta a ficar em aberto.
  function load() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (err) { saved = null; }
    if (!saved || typeof saved !== "object") return;
    var t = saved.text || {};
    var d = saved.done || {};
    var c = saved.checked || {};
    FIELDS.forEach(function (f) {
      if (typeof t[f.id] === "string") text[f.id] = t[f.id].slice(0, 80);
      if (d[f.id] === "ok" && judge(f.id) === "ok") done[f.id] = "ok";
    });
    groups().forEach(function (g) { if (c[g] === true) checked[g] = true; });
  }

  // abre o exercício de quem entrou, com o que ficou guardado na conta dele
  function open(userId) {
    KEY = BASE + ":" + userId;
    text = {};
    done = {};
    checked = {};
    load();
  }

  global.Exercise = {
    open: open,
    metas: METAS,
    boxes: BOXES,
    meta: meta,
    boxOf: boxOf,
    lastOf: lastOf,
    pos: pos,
    ticks: ticks,
    zoneOf: zoneOf,
    fill: fill,
    groups: groups,
    topic: topic,
    number: number,
    stepName: stepName,
    field: field,
    fieldsOf: fieldsOf,
    judge: judge,
    textOf: textOf,
    statusOf: statusOf,
    setText: setText,
    isDone: isDone,
    wasChecked: wasChecked,
    current: current,
    blocked: blocked,
    check: check,
    redo: redo,
    counts: counts,
    stepsDone: stepsDone,
    placed: placed,
    totals: totals,
    started: started,
    reset: reset
  };
})(window);
