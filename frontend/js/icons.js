(function (global) {
  "use strict";

  // Os ícones da tela, todos de traço numa grade de 24×24. A cor vem do texto
  // em volta (currentColor). As peças com classe (ico-hands, ico-lid…) são as
  // que se mexem na animação de cada ícone (styles.css, "Ícones animados").
  // pathLength="1" deixa o traço "se desenhar" sem precisar medir o caminho.
  var PATHS = {
    // as caixas e o planejamento
    caixa: '<path d="M4 9.2v7.6l8 4.2 8-4.2V9.2"/><path d="M12 13.2V21"/><g class="ico-lid"><path d="M12 3 2.8 7.4 12 12l9.2-4.6z"/></g>',
    calendario: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 9.6h17M8 3v4M16 3v4"/><path class="ico-pips" d="M8 13.6h.01M12 13.6h.01M16 13.6h.01M8 17.2h.01M12 17.2h.01"/>',
    carteira: '<path d="M18 7.5V5.2A1.2 1.2 0 0 0 16.8 4H5.5a2 2 0 0 0 0 4"/><path d="M3.5 6v12a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-14"/><path d="M16 14h.01"/><circle class="ico-coin" cx="12" cy="3" r="1.5"/>',
    cifrao: '<path d="M12 2.5v19"/><path d="M16.5 6.5C15.7 5.2 14 4.5 12 4.5c-2.6 0-4.3 1.3-4.3 3.2 0 4.4 9 2.3 9 7 0 1.9-1.8 3.3-4.7 3.3-2.3 0-4.2-.9-5-2.5"/>',
    lista: '<path d="M9 6h11M9 12h11M9 18h11"/><path class="ico-pips" d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',

    // as metas (o "icon" das rodadas do jogo)
    fone: '<path d="M4 14.5V12a8 8 0 0 1 16 0v2.5"/><g class="ico-cups"><rect x="3" y="13.5" width="4.6" height="7" rx="1.8"/><rect x="16.4" y="13.5" width="4.6" height="7" rx="1.8"/></g>',
    video: '<rect x="2.5" y="6.5" width="13" height="11" rx="2.2"/><path class="ico-lens" d="M15.5 10.6 21.5 7v10l-6-3.6z"/>',
    cartao: '<g class="ico-card"><rect x="2.5" y="5.5" width="19" height="13" rx="2.2"/><path d="M2.5 9.8h19"/><path d="M6 15h4"/></g>',
    notebook: '<rect x="4.5" y="4.5" width="15" height="10.5" rx="1.5"/><path d="M2.5 19h19l-1.8-4H4.3z"/><path d="M10.5 17h3"/>',
    carro: '<path d="M3.5 16.5V13a2 2 0 0 1 1.2-1.8l1.8-.7 1.8-3.2A2 2 0 0 1 10 6.5h4.4a2 2 0 0 1 1.6.8l2.5 3.2 1.4.5a2 2 0 0 1 1.3 1.9v3.6"/><path d="M3.5 16.5h1.6M9.4 16.5h5.2M18.9 16.5h1.6"/><circle cx="7.2" cy="16.8" r="2.1"/><circle cx="16.8" cy="16.8" r="2.1"/><path d="M6.8 10.5h11.6"/>',
    aviao: '<g class="ico-plane"><path d="M21.5 2.5 10.6 13.4"/><path d="M21.5 2.5 14.6 21.5l-4-8.1-8.1-4z"/></g>',
    celular: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.4"/><path d="M10.5 5.5h3"/><path d="M11.2 18.5h1.6"/>',
    tenis: '<path d="M2.8 15.8V8.5l3.9 1.2 1.6 2.1 2.6-.4 3 2.7 5.3 1.1a2 2 0 0 1 1.6 2v.6a1 1 0 0 1-1 1H3.8a1 1 0 0 1-1-1z"/><path d="M2.8 15.8h18.8"/><path d="M8.6 12.9l1.1-.9M11.1 13.4l1.1-.9"/>',
    sacola: '<g class="ico-bag"><path d="M5.2 8h13.6l-1 12.5H6.2z"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5"/></g>',
    presente: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v8h14v-8"/><path d="M12 8.5v12"/><g class="ico-bow"><path d="M12 8.5C10.6 5 6.8 4.4 6.8 6.7c0 1.4 2.2 1.8 5.2 1.8z"/><path d="M12 8.5c1.4-3.5 5.2-4.1 5.2-1.8 0 1.4-2.2 1.8-5.2 1.8z"/></g>',
    predio: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10"/><path d="M2 21h20"/><path d="M8 7h4M8 11h4M8 15h4"/>',
    capelo: '<g class="ico-cap"><path d="M12 4.5 2.5 9.2 12 14l9.5-4.8z"/><path d="M6.5 11.3v4.4c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.4"/></g><path d="M21.5 9.2v5.3"/>',
    cofrinho: '<ellipse cx="11.5" cy="13" rx="7.5" ry="5.5"/><path d="M7.8 17.8v2.7M15.2 17.8v2.7"/><path d="M19 11.2h1.3a1 1 0 0 1 1 1v1.6a1 1 0 0 1-1 1H19"/><path d="M12.6 7.7l1.6-2.4 1.2 2.9"/><path d="M15.6 11h.01"/><path d="M4 12.5c-1.2 0-1.8-.8-1.6-1.8"/><path d="M9.8 8.6h3.2"/><circle class="ico-coin" cx="11.4" cy="3.4" r="1.5"/>',
    videogame: '<path d="M7.2 7.5h9.6a4.5 4.5 0 0 1 4.4 3.6l.9 4.6a2.6 2.6 0 0 1-4.6 2.1l-1.9-2.3H8.4l-1.9 2.3a2.6 2.6 0 0 1-4.6-2.1l.9-4.6a4.5 4.5 0 0 1 4.4-3.6z"/><path d="M7.5 10.5v3M6 12h3"/><path class="ico-pips" d="M15.5 11h.01M17.5 13h.01"/>',
    bicicleta: '<circle cx="5.8" cy="16" r="3.6"/><circle cx="18.2" cy="16" r="3.6"/><path class="ico-frame" d="M5.8 16 9.5 8.5h6l2.7 7.5M9.5 8.5 12 16h-6.2M12 16l3.5-7.5M8 6.5h3"/>',
    maleta: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="M3 12.5h18"/><path d="M10.8 12.5v1.8h2.4v-1.8"/>',
    escudo: '<path d="M12 2.8 4.5 5.6v5.7c0 4.6 3.2 8.4 7.5 9.9 4.3-1.5 7.5-5.3 7.5-9.9V5.6z"/><path class="ico-line" pathLength="1" d="M8.6 12.1l2.4 2.4 4.6-4.9"/>',

    // o ponto de partida, os medidores e as etiquetas
    balanca: '<path d="M12 5v15M8.5 20h7"/><circle cx="12" cy="4" r="1.2"/><g class="ico-beam"><path d="M5 6.5h14"/><path d="M5 6.5l-2.5 6M5 6.5l2.5 6M19 6.5l-2.5 6M19 6.5l2.5 6"/><path d="M2 12.5h6a3 3 0 0 1-6 0zM16 12.5h6a3 3 0 0 1-6 0z"/></g>',
    moedas: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path class="ico-hands" d="M12 7v5l3 2"/>',
    cronometro: '<circle cx="12" cy="13.5" r="7.8"/><path d="M9.8 2.5h4.4M12 2.5v3.2M18.6 6.4l1.4-1.4"/><path class="ico-hand" d="M12 13.5V9.2"/>',
    alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><g class="ico-arrow"><path d="M12 12l7.5-7.5"/><path d="M16.5 3.5v4h4"/></g>',
    camadas: '<path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5l9 4.5 9-4.5"/>',
    linha: '<path class="ico-line" pathLength="1" d="M3 12h15"/><path d="M15.5 8.5l4 3.5-4 3.5"/><path d="M6.5 8.5v7M11.5 8.5v7"/>',
    calculadora: '<rect x="5" y="2.5" width="14" height="19" rx="2.2"/><rect x="8" y="5.5" width="8" height="3.8" rx=".8"/><path class="ico-keys" d="M8.8 13h.01M12 13h.01M15.2 13h.01M8.8 16.6h.01M12 16.6h.01M15.2 16.6h.01"/>',
    raio: '<path class="ico-bolt" d="M13.2 2.5 4.6 13.6h6.6l-1.1 7.9 8.7-11.3h-6.7z"/>',

    // os botões
    foguete: '<g class="ico-rocket"><path d="M12 2.5c3 2.4 4.5 5.8 4.5 9.5l-1.8 3.5H9.3L7.5 12c0-3.7 1.5-7.1 4.5-9.5z"/><circle cx="12" cy="9.5" r="1.8"/><path d="M7.6 12.8L5 15.5v3l4-1.8M16.4 12.8l2.6 2.7v3l-4-1.8"/><path class="ico-flame" d="M10.3 18.5c0 1.6.7 2.4 1.7 3.3 1-.9 1.7-1.7 1.7-3.3"/></g>',
    recomecar: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>',
    conferir: '<circle cx="12" cy="12" r="9"/><path class="ico-line" pathLength="1" d="M7.8 12.4l2.9 2.9 5.5-6"/>',
    refazer: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    avancar: '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
    mais: '<path class="ico-plus" d="M12 5v14M5 12h14"/>',
    lixeira: '<path d="M4 6.5h16"/><path class="ico-lid" d="M9.5 6.5V4h5v2.5"/><path d="M6 6.5l1 14h10l1-14"/><path d="M10 10.5v6M14 10.5v6"/>',
    imprimir: '<path d="M7 8V3.5h10V8"/><rect x="3.5" y="8" width="17" height="8.5" rx="2"/><path class="ico-paper" d="M7 13.5h10v7H7z"/>',
    mover: '<path d="M4 8h13"/><path d="M14 4.5 17.5 8 14 11.5"/><path d="M20 16H7"/><path d="M10 12.5 6.5 16l3.5 3.5"/>',

    // o resultado e o jogo
    barras: '<path d="M3 21h18"/><rect class="ico-b1" x="5" y="12" width="3.5" height="8" rx="1"/><rect class="ico-b2" x="10.25" y="6" width="3.5" height="14" rx="1"/><rect class="ico-b3" x="15.5" y="9" width="3.5" height="11" rx="1"/>',
    lampada: '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 4a5.5 5.5 0 0 0-3.3 9.9c.5.4.8 1 .8 1.6V16h5v-.5c0-.6.3-1.2.8-1.6A5.5 5.5 0 0 0 12 4z"/><path class="ico-rays" d="M12 .8v.4M4.3 3.8l.4.4M19.7 3.8l-.4.4M1.3 10h.4M22.3 10h.4"/>',
    duvida: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.5z"/><path d="M9.7 9.4a2.4 2.4 0 0 1 4.6.9c0 1.6-2.3 2-2.3 3.4"/><path d="M12 16.6h.01"/>',
    trofeu: '<path d="M7.5 3.5h9V9a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 5.5H5.2a2.6 2.6 0 0 0 2.9 3.8M16.5 5.5h2.3a2.6 2.6 0 0 1-2.9 3.8"/><path d="M12 13.5V17M8.5 20.5h7M9.8 17h4.4l.6 3.5H9.2z"/>',
    alerta: '<path d="M12 3.5 21.5 20h-19z"/><path class="ico-mark" d="M12 9.8v4.6M12 17.1h.01"/>'
  };

  function svg(name) {
    return '<svg class="ico ico--' + name + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (PATHS[name] || "") + "</svg>";
  }

  // o ícone dentro de um quadrinho colorido; tone = a cor (green, violet,
  // curto, medio, longo…); extra = classes a mais (tamanho…)
  function tile(name, tone, extra) {
    return '<span class="itile itile--' + (tone || "neutral") + (extra ? " " + extra : "") + '" aria-hidden="true">' +
      svg(name) + "</span>";
  }

  // O desenho de uma caixa, como as da folha "Meu planejamento financeiro":
  // a caixa em 3D com a tampa, na cor dela (key = "curto", "medio" ou
  // "longo"). A tampa (boxart__lid) abre e a moeda (boxart__coin) cai dentro
  // quando a caixa é tocada (styles.css, "As caixas desenhadas").
  function box(key, extra) {
    return '<svg class="boxart boxart--' + key + (extra ? " " + extra : "") + '" viewBox="0 0 100 96" aria-hidden="true" focusable="false">' +
      '<ellipse class="boxart__shadow" cx="51" cy="90" rx="44" ry="5"/>' +
      '<g class="boxart__body">' +
        '<polygon class="boxart__inner" points="10,36 34,22 92,22 68,36"/>' +
        '<polygon class="boxart__side" points="68,36 92,22 92,74 68,88"/>' +
        '<polygon class="boxart__front" points="10,36 68,36 68,88 10,88"/>' +
        '<polygon class="boxart__shine" points="15,44 23,44 23,82 15,82"/>' +
      "</g>" +
      '<g class="boxart__lid">' +
        '<polygon class="boxart__lid-top" points="5,33 30,18 97,18 72,33"/>' +
        '<polygon class="boxart__lid-side" points="72,33 97,18 97,26 72,42"/>' +
        '<polygon class="boxart__lid-front" points="5,33 72,33 72,42 5,42"/>' +
      "</g>" +
      '<g class="boxart__coin"><circle cx="50" cy="8" r="7"/><path d="M50 4.5v7"/></g>' +
      "</svg>";
  }

  // Os ícones fixos das páginas são marcados com data-icon="nome" (ou
  // data-box="curto", pra uma caixa) e desenhados aqui, pra os desenhos
  // ficarem num lugar só.
  function mount(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("[data-icon]"), function (el) {
      el.innerHTML = svg(el.getAttribute("data-icon"));
      el.setAttribute("aria-hidden", "true");
    });
    Array.prototype.forEach.call((root || document).querySelectorAll("[data-box]"), function (el) {
      el.innerHTML = box(el.getAttribute("data-box"));
      el.setAttribute("aria-hidden", "true");
    });
  }

  global.Icons = {
    svg: svg,
    tile: tile,
    box: box,
    mount: mount
  };
})(window);
