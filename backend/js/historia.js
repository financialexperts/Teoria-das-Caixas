(function (global) {
  "use strict";

  // A história do exercício "As caixas da Bia": quem ela é, o mês em que ela
  // faz o planejamento, o que entra e o que sai todo mês e os 6 sonhos dela.
  // O sistema não guarda as respostas prontas: o saldo, os meses, o valor
  // por mês de cada meta, o total de cada caixa e o que sobra saem destes
  // dados (frontend/js/exercise.js). Mudando um valor aqui, as respostas, as
  // dicas, a régua do tempo e o resultado acompanham.
  //
  // today: o mês do planejamento ({ y: ano, m: mês de 1 a 12}). Os meses de
  //   cada meta são contados a partir dele.
  // receitas e despesas: o que entra e o que sai todo mês (os dados laranja
  //   da Etapa 1). O saldo é a receita menos as despesas.
  // metas: os sonhos. A caixa de cada um não fica escrita aqui: ela sai da
  //   quantidade de meses até a data (backend/js/caixas.js).
  //   name: o nome curto. icon: o desenho (frontend/js/icons.js).
  //   date: o mês em que ela quer realizar. total: o valor total.
  //   story: por que ela quer (vai no cartão da caixa).
  //   Para as contas darem redondo, o total dividido pelos meses deve dar um
  //   valor com no máximo 2 casas (o centavo).
  global.Historia = {
    name: "Bia",
    age: 17,
    about: "jovem aprendiz",
    // o artigo do nome nas frases ("da Bia", "a Bia")
    da: "da Bia",
    a: "a Bia",
    today: { y: 2027, m: 1 },

    // o texto embaixo do título de cada coluna da Etapa 1
    receitasText: "A Bia trabalha meio período numa loja e recebe o salário todo mês.",
    despesasText: "O que ela gasta todo mês para estudar, trabalhar e ajudar em casa.",
    receitas: [
      { key: "salario", label: "Salário de jovem aprendiz", value: 1100 }
    ],
    despesas: [
      { key: "transporte", label: "Transporte", value: 150 },
      { key: "celular", label: "Plano do celular", value: 50 },
      { key: "lanches", label: "Lanches e saídas", value: 200 },
      { key: "casa", label: "Ajuda nas contas de casa", value: 100 }
    ],

    metas: [
      {
        id: "fone",
        name: "Fone de ouvido novo",
        icon: "fone",
        date: { y: 2027, m: 4 },
        total: 360,
        story: "O fone dela quebrou, e ela usa todo dia no ônibus para o trabalho."
      },
      {
        id: "curso",
        name: "Curso de edição de vídeo",
        icon: "video",
        date: { y: 2027, m: 7 },
        total: 480,
        story: "Ela quer fazer o curso nas férias de julho e começar um canal."
      },
      {
        id: "cnh",
        name: "Carteira de motorista",
        icon: "cartao",
        date: { y: 2029, m: 1 },
        total: 3000,
        story: "Ela faz 18 anos no fim de 2028 e quer tirar a carteira logo depois."
      },
      {
        id: "notebook",
        name: "Notebook para a faculdade",
        icon: "notebook",
        date: { y: 2030, m: 1 },
        total: 2700,
        story: "A faculdade começa em 2030, e o notebook velho não vai aguentar."
      },
      {
        id: "carro",
        name: "Primeiro carro",
        icon: "carro",
        date: { y: 2033, m: 1 },
        total: 7200,
        story: "Um carro usado, à vista, para ir ao trabalho sem depender do ônibus."
      },
      {
        id: "intercambio",
        name: "Intercâmbio",
        icon: "aviao",
        date: { y: 2037, m: 1 },
        total: 6000,
        story: "O sonho mais distante: passar um mês estudando inglês fora do país."
      }
    ],

    // A pergunta para discutir de cada etapa, que aparece quando ela fica
    // toda certa, e uma resposta possível, que fica fechada até o professor
    // abrir. Nos textos, viram valores: {receita}, {despesas}, {saldo},
    // {planejado} (o total das caixas por mês), {sobra}, {caixa.curto} (o
    // total por mês de uma caixa), {fim.curto} (o mês da última meta de uma
    // caixa) e {meta.fone.total}, {meta.fone.mensal}, {meta.fone.meses},
    // {meta.fone.data} e {meta.fone.prazo} (o prazo em anos e meses).
    discussao: {
      saldo: {
        why: "Por que a Bia planeja só o saldo de {saldo}, e não o salário inteiro de {receita}?",
        answer: "Porque as despesas do mês ({despesas}) já têm destino: transporte, celular, lanches e a ajuda em casa. Só o que sobra pode ir para as caixas sem faltar dinheiro para o dia a dia."
      },
      separar: {
        why: "O carro custa {meta.carro.total} e o fone, {meta.fone.total}. O que decide a caixa de cada meta: o valor ou o prazo?",
        answer: "O prazo. A caixa diz quando a Bia quer realizar a meta, não quanto ela custa. Uma meta cara pode ser de curto prazo, se a data for perto, e uma barata pode ser de longo prazo."
      },
      curto: {
        why: "O fone custa menos que o curso, mas pede mais por mês: {meta.fone.mensal} contra {meta.curso.mensal}. Por quê?",
        answer: "Porque faltam só {meta.fone.meses} para o fone, contra {meta.curso.meses} para o curso. Quanto menos meses para juntar, maior a parte de cada mês."
      },
      medio: {
        why: "A carteira de motorista e o notebook custam quase o mesmo. Por que a carteira pede {meta.cnh.mensal} por mês e o notebook só {meta.notebook.mensal}?",
        answer: "Porque o notebook tem mais tempo para ser pago: {meta.notebook.meses} contra {meta.cnh.meses}. Mais meses dividem o valor total em partes menores."
      },
      longo: {
        why: "O carro é a meta mais cara da Bia ({meta.carro.total}), mas pede só {meta.carro.mensal} por mês. Como isso é possível?",
        answer: "Porque ela começou a guardar {meta.carro.prazo} antes. O longo prazo transforma um valor grande em partes pequenas. E, se esse dinheiro ainda render juros, ela junta o valor mais rápido."
      },
      plano: {
        why: "Sobram {sobra} por mês. O que a Bia pode fazer com essa folga?",
        answer: "Ela pode guardar como reserva para imprevistos (um conserto, um remédio) ou começar uma meta nova. E, em {fim.curto}, quando as metas de curto prazo estiverem realizadas, os {caixa.curto} por mês dessa caixa também ficam livres."
      }
    }
  };
})(window);
