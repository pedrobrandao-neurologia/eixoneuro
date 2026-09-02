/* =============================================================
   EIXO — exames e procedimentos, renderizados de /data
   - exames-procedimentos.html: seções completas com âncora
   - index.html: cards resumidos (#cards-exames)
   ============================================================= */
(function () {
  'use strict';

  var E = window.EIXO;

  function nomesMedicos(ids, medicos) {
    return (ids || []).map(function (id) {
      var m = medicos.find(function (x) { return x.id === id; });
      if (!m) { return E.esc(id); }
      return '<a href="equipe.html#medico=' + E.esc(m.id) + '">' + E.esc(m.nome) +
        '</a> — ' + E.linhaRegistro(m);
    });
  }

  function bloco(titulo, itens) {
    if (!itens || !itens.length) { return ''; }
    return '<div><h3>' + titulo + '</h3><ul>' + itens.map(function (i) {
      return '<li>' + i + '</li>';
    }).join('') + '</ul></div>';
  }

  function blocoTexto(titulo, texto) {
    if (!texto) { return ''; }
    return '<div><h3>' + titulo + '</h3><p>' + E.esc(texto) + '</p></div>';
  }

  function secaoHTML(item, medicos, clinica) {
    var fatos = [];
    fatos.push(item.precisa_pedido_medico ? 'Exige pedido médico' : 'Não exige pedido médico');
    fatos.push(item.precisa_acompanhante ? 'Acompanhante obrigatório' : 'Acompanhante não obrigatório');
    if (item.duracao) { fatos.push('Duração: ' + item.duracao); }
    if (item.prazo_laudo) { fatos.push('Laudo: ' + item.prazo_laudo); }
    if (item.valor) { fatos.push('Valor: ' + item.valor); }
    fatos.push('Pagamento: ' + (clinica.valores.formas_pagamento || []).join(', '));

    var msg = 'Olá! Gostaria de informações sobre ' + item.nome + ' na ' + clinica.nome_fantasia + '.';

    return '<section class="bloco-exame" id="' + E.esc(item.id) + '" aria-labelledby="titulo-' + E.esc(item.id) + '">' +
      (item.revisado === false ? '<p class="banner-revisao">Conteúdo em revisão pela equipe médica.</p>' : '') +
      '<p class="legenda">' + (item.precisa_acompanhante ? 'Procedimento' : 'Exame') + '</p>' +
      '<h2 id="titulo-' + E.esc(item.id) + '" style="margin-top:10px">' + E.esc(item.nome) + '</h2>' +
      '<p class="nome-leigo">' + E.esc(item.nome_leigo) + '</p>' +
      '<p style="margin-top:18px;font-size:1.05rem">' + E.esc(item.descricao_curta) + '</p>' +
      '<div class="fatos" role="list" aria-label="Informações rápidas">' +
      fatos.map(function (f) { return '<span role="listitem">' + E.esc(f) + '</span>'; }).join('') +
      '</div>' +
      '<div class="grade-info">' +
      blocoTexto('Para que serve', item.para_que_serve) +
      blocoTexto('Como é feito', item.como_e_feito) +
      bloco('Preparo', (item.preparo || []).map(E.esc)) +
      bloco('O que trazer', (item.o_que_trazer || []).map(E.esc)) +
      bloco('Avise antes se houver', (item.contraindicacoes_avisar || []).map(E.esc)) +
      bloco('Depois do ' + (item.precisa_acompanhante ? 'procedimento' : 'exame'), (item.apos_o_exame || []).map(E.esc)) +
      bloco('Quem realiza', nomesMedicos(item.medicos, medicos)) +
      '</div>' +
      '<div class="acoes">' +
      '<a class="botao botao--cheio" href="' + E.linkWhatsApp(clinica, msg) + '" target="_blank" rel="noopener">' +
      E.ICONE_WHATS + 'Agendar pelo WhatsApp</a>' +
      '<a class="botao botao--vazado" href="primeira-consulta.html">O que trazer na consulta</a>' +
      '</div></section>';
  }

  function cardHTML(item) {
    return '<li class="card">' +
      '<p class="legenda">' + (item.precisa_acompanhante ? 'Procedimento' : 'Exame') + '</p>' +
      '<h3>' + E.esc(item.nome) + '</h3>' +
      '<p>' + E.esc(item.descricao_curta) + '</p>' +
      '<a class="card__acao botao botao--vazado botao--mini" href="exames-procedimentos.html#' + E.esc(item.id) + '">Preparo e orientações</a>' +
      '</li>';
  }

  document.addEventListener('eixo:pronto', function (evento) {
    var clinica = evento.detail.clinica;
    Promise.all([
      E.carregarJSON('data/exames.json'),
      E.carregarJSON('data/procedimentos.json'),
      E.carregarJSON('data/medicos.json')
    ]).then(function (dados) {
      var todos = dados[0].concat(dados[1]);
      var medicos = dados[2];

      var lista = document.getElementById('lista-exames');
      if (lista) {
        lista.innerHTML = todos.map(function (item) {
          return secaoHTML(item, medicos, clinica);
        }).join('');
        // rola até a âncora depois que o conteúdo existe
        if (location.hash) {
          var alvo = document.getElementById(location.hash.slice(1));
          if (alvo) { alvo.scrollIntoView(); }
        }
      }

      var cards = document.getElementById('cards-exames');
      if (cards) {
        cards.innerHTML = todos.map(cardHTML).join('');
      }
    }).catch(function (erro) { console.error(erro); });
  });
})();
