(function (global) {
  "use strict";

  var Caixas = global.Caixas;
  var Format = global.Format;
  var Parse = global.Parse;

  // O estado do "Meu planejamento": a folha "Meu planejamento financeiro"
  // preenchida pelo próprio aluno. Não toca no DOM: as telas leem daqui e
  // pedem as mudanças por aqui, e é aqui que ficam as contas e as regras.
  //
  // receita e despesas: o que o aluno digitou (o saldo é a diferença).
  // metas: as metas de cada caixa, { curto: [...], medio: [...], longo: [...] }.
  //   Cada meta: { id, desc (a descrição), m e y (o mês e o ano da data de
  //   realização, ou 0), total (o valor total, como o aluno digitou) }.
  //   Cada caixa começa com uma meta em branco e pode ter até MAX.
  //
  // A quantidade de meses é contada a partir do mês de hoje (do relógio do
  // computador): quem volta à folha meses depois vê as contas atualizadas.
  var MAX = 3;
  var receita = "";
  var despesas = "";
  var metas = {};

  // Tudo fica guardado no navegador, separado por conta ("meu-planejamento:"
  // e o id de quem entrou). O open() escolhe a conta.
  var BASE = "meu-planejamento";
  var KEY = BASE;

  var seq = 0;
  function newId() { seq++; return "m" + Date.now().toString(36) + seq; }
  function blank() { return { id: newId(), desc: "", m: 0, y: 0, total: "" }; }
  function round2(n) { return Math.round(n * 100) / 100; }

  function empty() {
    var out = {};
    Caixas.list.forEach(function (c) { out[c.key] = [blank()]; });
    return out;
  }

  /* ============ as contas ============ */
  function today() { return Format.thisMonth(); }

  // um valor digitado: o número (positivo) ou null, se vazio ou sem sentido
  function num(text) {
    var r = Parse.read(text);
    return r.ok && r.n >= 0 ? round2(r.n) : null;
  }

  function saldo() {
    var r = num(receita);
    var d = num(despesas);
    if (r === null || d === null) return null;
    return round2(r - d);
  }

  // As contas de uma meta, como na folha: os meses de hoje até a data e o
  // valor a poupar por mês (valor total ÷ meses). status:
  //   "empty"    nada preenchido
  //   "partial"  falta a data ou o valor
  //   "past"     a data é este mês ou já passou
  //   "mismatch" o prazo é de outra caixa (fit = a caixa certa)
  //   "ok"       tudo certo
  // Numa meta "mismatch", as contas valem: ela só está na caixa errada.
  function calc(meta, key) {
    var hasDate = meta.m > 0 && meta.y > 0;
    var total = num(meta.total);
    var out = { months: null, total: total, monthly: null, fit: null, status: "ok" };
    if (!hasDate && total === null && !meta.desc.trim()) { out.status = "empty"; return out; }
    if (hasDate) out.months = Format.monthsBetween(today(), { y: meta.y, m: meta.m });
    if (hasDate && out.months < 1) { out.status = "past"; return out; }
    if (!hasDate || !total) { out.status = "partial"; return out; }
    out.monthly = round2(total / out.months);
    out.fit = Caixas.of(out.months);
    if (out.fit.key !== key) out.status = "mismatch";
    return out;
  }

  // o total por mês de uma caixa: a soma das metas dela que já têm conta
  function boxTotal(key) {
    return round2(metas[key].reduce(function (t, m) {
      var c = calc(m, key);
      return t + (c.monthly || 0);
    }, 0));
  }

  function planned() {
    return round2(Caixas.list.reduce(function (t, c) { return t + boxTotal(c.key); }, 0));
  }

  // as metas com conta pronta (pra contar e pra imprimir)
  function ready() {
    var n = 0;
    Caixas.list.forEach(function (c) {
      metas[c.key].forEach(function (m) { if (calc(m, c.key).monthly !== null) n++; });
    });
    return n;
  }

  // Quando o plano passa do saldo: o que dá pra fazer. Pra cada meta (da que
  // mais pesa no mês à que menos pesa), até quando adiar a data pra ela, sozinha,
  // cobrir o que falta. Devolve até 2 sugestões: { meta, key, date, monthly }.
  function suggestions() {
    var s = saldo();
    if (s === null) return [];
    var falta = round2(planned() - s);
    if (falta <= 0) return [];
    var list = [];
    Caixas.list.forEach(function (c) {
      metas[c.key].forEach(function (m) {
        var x = calc(m, c.key);
        if (x.monthly === null) return;
        var novo = x.monthly - falta;
        if (novo <= 0) return;
        var months = Math.ceil(x.total / novo - 1e-9);
        list.push({
          meta: m,
          key: c.key,
          monthly: round2(x.total / months),
          months: months,
          date: Format.addMonths(today(), months),
          weight: x.monthly
        });
      });
    });
    return list.sort(function (a, b) { return b.weight - a.weight; }).slice(0, 2);
  }

  /* ============ mudanças ============ */
  function find(id) {
    for (var i = 0; i < Caixas.list.length; i++) {
      var key = Caixas.list[i].key;
      for (var j = 0; j < metas[key].length; j++) {
        if (metas[key][j].id === id) return { key: key, index: j, meta: metas[key][j] };
      }
    }
    return null;
  }

  // muda um campo de uma meta: "desc", "m", "y" ou "total"
  function update(id, field, value) {
    var f = find(id);
    if (!f) return;
    if (field === "desc") f.meta.desc = String(value).slice(0, 60);
    else if (field === "total") f.meta.total = String(value).slice(0, 40);
    else if (field === "m" || field === "y") f.meta[field] = parseInt(value, 10) || 0;
    save();
  }

  function setReceita(v) { receita = String(v).slice(0, 40); save(); }
  function setDespesas(v) { despesas = String(v).slice(0, 40); save(); }

  // Uma meta a mais na caixa. Devolve o id dela, ou a frase de por que não.
  function add(key) {
    if (metas[key].length >= MAX) return { error: "Cada caixa tem até " + MAX + " metas." };
    var m = blank();
    metas[key].push(m);
    save();
    return { id: m.id };
  }

  // Apaga uma meta. A única meta de uma caixa não sai: ela fica em branco.
  function remove(id) {
    var f = find(id);
    if (!f) return;
    if (metas[f.key].length > 1) metas[f.key].splice(f.index, 1);
    else metas[f.key][0] = blank();
    save();
  }

  // Leva uma meta pra outra caixa (a do prazo dela). Se a caixa de destino
  // só tem a meta em branco, a meta toma o lugar dela.
  function move(id, toKey) {
    var f = find(id);
    if (!f || f.key === toKey) return "";
    var dest = metas[toKey];
    var vazia = dest.length === 1 && calc(dest[0], toKey).status === "empty";
    if (!vazia && dest.length >= MAX) {
      return "A caixa do " + Caixas.byKey(toKey).name.toLowerCase() + " já tem " + MAX + " metas.";
    }
    metas[f.key].splice(f.index, 1);
    if (!metas[f.key].length) metas[f.key].push(blank());
    if (vazia) dest[0] = f.meta;
    else dest.push(f.meta);
    save();
    return "";
  }

  // já tem alguma coisa preenchida? (pra perguntar antes de apagar tudo)
  function started() {
    if (receita.trim() || despesas.trim()) return true;
    return Caixas.list.some(function (c) {
      return metas[c.key].some(function (m) { return calc(m, c.key).status !== "empty"; });
    });
  }

  function reset() {
    receita = "";
    despesas = "";
    metas = empty();
    save();
  }

  /* ============ guardar no navegador ============ */
  // Pode não ter como guardar (janela anônima, navegador que bloqueia): aí a
  // folha funciona igual, só não lembra depois de recarregar.
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ receita: receita, despesas: despesas, metas: metas }));
    } catch (err) {}
  }

  function clean(m) {
    return {
      id: newId(),
      desc: String(m && m.desc || "").slice(0, 60),
      m: Math.min(Math.max(parseInt(m && m.m, 10) || 0, 0), 12),
      y: parseInt(m && m.y, 10) || 0,
      total: String(m && m.total || "").slice(0, 40)
    };
  }

  function load() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (err) { saved = null; }
    if (!saved || typeof saved !== "object") return;
    receita = String(saved.receita || "").slice(0, 40);
    despesas = String(saved.despesas || "").slice(0, 40);
    var s = saved.metas || {};
    Caixas.list.forEach(function (c) {
      var list = Array.isArray(s[c.key]) ? s[c.key].slice(0, MAX).map(clean) : [];
      metas[c.key] = list.length ? list : [blank()];
    });
  }

  function open(userId) {
    KEY = BASE + ":" + userId;
    receita = "";
    despesas = "";
    metas = empty();
    load();
  }

  global.Planner = {
    MAX: MAX,
    open: open,
    today: today,
    num: num,
    receita: function () { return receita; },
    despesas: function () { return despesas; },
    metasOf: function (key) { return metas[key]; },
    find: find,
    saldo: saldo,
    calc: calc,
    boxTotal: boxTotal,
    planned: planned,
    ready: ready,
    suggestions: suggestions,
    update: update,
    setReceita: setReceita,
    setDespesas: setDespesas,
    add: add,
    remove: remove,
    move: move,
    started: started,
    reset: reset
  };
})(window);
