/* =============================================================
   EIXO — equipe: cards, filtros e modal de mini currículo
   Usado em equipe.html (grade completa + filtros) e em
   index.html (grade resumida). Identificação de cada médico no
   formato exigido pela Resolução CFM 2.336/2023 (art. 4º).
   ============================================================= */
(function () {
  'use strict';

  var E = window.EIXO;
  var DIAS = { seg: 'segunda', ter: 'terça', qua: 'quarta', qui: 'quinta', sex: 'sexta', sab: 'sábado' };

  var estado = {
    medicos: [],
    servicos: {},   // id -> nome (exames + procedimentos)
    clinica: null,
    origemFoco: null
  };

  function slug(texto) {
    return String(texto).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function iniciais(medico) {
    var nome = medico.nome.replace(/^Dra?\.?\s+/i, '');
    var partes = nome.split(/\s+/).filter(Boolean);
    return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
  }

  function avatarHTML(medico, grande) {
    if (medico.foto) {
      return '<span class="avatar"><img src="' + E.esc(medico.foto) + '" alt="Foto de ' + E.esc(medico.nome) + '" loading="lazy" width="' + (grande ? 88 : 72) + '" height="' + (grande ? 88 : 72) + '"></span>';
    }
    return '<span class="avatar" aria-hidden="true">' + E.esc(iniciais(medico)) + '</span>';
  }

  function cardHTML(medico) {
    var linhas = E.linhasEspecialidade(medico).map(function (l) {
      return '<p class="registro legenda">' + l + '</p>';
    }).join('');
    var naoEsp = medico.nao_especialista
      ? '<p class="nao-esp">Não especialista</p>' : '';
    return '<li><button type="button" class="card-medico" data-medico="' + E.esc(medico.id) + '" ' +
      'aria-haspopup="dialog" aria-label="Ver mini currículo de ' + E.esc(medico.nome) + '">' +
      avatarHTML(medico, false) +
      '<h3>' + E.esc(medico.nome) + '</h3>' +
      '<p class="registro legenda">' + E.linhaRegistro(medico) + '</p>' +
      linhas + naoEsp +
      '<span class="ver-cv">Ver mini currículo</span>' +
      '</button></li>';
  }

  /* ---------- modal acessível ---------- */
  function montarModal() {
    var existente = document.getElementById('modal-medico');
    if (existente) { return existente; }
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal-medico';
    modal.innerHTML =
      '<div class="modal__fundo" data-fechar></div>' +
      '<div class="modal__caixa" role="dialog" aria-modal="true" aria-labelledby="modal-medico-titulo">' +
      '<button type="button" class="modal__fechar" data-fechar aria-label="Fechar mini currículo">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>' +
      '<div class="modal__conteudo"></div></div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-fechar]')) { fecharModal(); }
    });
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('aberto')) { return; }
      if (e.key === 'Escape') { fecharModal(); return; }
      if (e.key === 'Tab') { prenderFoco(e, modal); }
    });
    return modal;
  }

  function prenderFoco(evento, modal) {
    var focaveis = modal.querySelectorAll('button, [href], select, input, [tabindex]:not([tabindex="-1"])');
    if (!focaveis.length) { return; }
    var primeiro = focaveis[0];
    var ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault(); ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault(); primeiro.focus();
    }
  }

  function listaOuNada(titulo, itens) {
    if (!itens || !itens.length) { return ''; }
    return '<h3>' + titulo + '</h3><ul>' + itens.map(function (i) {
      return '<li>' + i + '</li>';
    }).join('') + '</ul>';
  }

  function abrirModal(id) {
    var medico = estado.medicos.find(function (m) { return m.id === id; });
    if (!medico) { return; }
    var modal = document.getElementById('modal-medico') || montarModal();
    var conteudo = modal.querySelector('.modal__conteudo');

    var especialidades = E.linhasEspecialidade(medico).map(function (l) {
      return '<p class="registro legenda">' + l + '</p>';
    }).join('');
    var naoEsp = medico.nao_especialista ? '<p class="nao-esp">Não especialista</p>' : '';

    var servicos = (medico.exames_que_realiza || []).concat(medico.procedimentos_que_realiza || [])
      .map(function (sid) { return E.esc(estado.servicos[sid] || sid); });

    var dias = (medico.dias_atendimento || []).map(function (d) { return E.esc(DIAS[d] || d); });

    var lattes = medico.lattes
      ? '<p style="margin-top:16px"><a href="' + E.esc(medico.lattes) + '" target="_blank" rel="noopener" style="border-bottom:1px solid currentColor">Currículo Lattes</a></p>'
      : '';

    var revisao = medico.revisado === false
      ? '<p class="banner-revisao" style="margin-top:20px;margin-bottom:0">Conteúdo em revisão pela equipe médica.</p>'
      : '';

    var msg = 'Olá! Gostaria de agendar uma consulta com ' +
      (E.generoMedico(medico) === 'MÉDICA' ? 'a ' : 'o ') + medico.tratamento +
      ' na ' + estado.clinica.nome_fantasia + '.';

    conteudo.innerHTML =
      avatarHTML(medico, true) +
      '<h2 id="modal-medico-titulo">' + E.esc(medico.nome) + '</h2>' +
      '<p class="registro legenda">' + E.linhaRegistro(medico) + '</p>' +
      especialidades + naoEsp +
      '<h3>Mini currículo</h3><p>' + E.esc(medico.mini_cv) + '</p>' +
      listaOuNada('Formação e titulação', (medico.formacao || []).map(E.esc)) +
      listaOuNada('O que atende', (medico.queixas_leigas || []).map(E.esc)) +
      listaOuNada('Exames e procedimentos que realiza na clínica', servicos) +
      listaOuNada('Dias de atendimento', dias) +
      lattes +
      '<div class="acoes">' +
      '<a class="botao botao--cheio" href="' + E.linkWhatsApp(estado.clinica, msg) + '" target="_blank" rel="noopener">' +
      E.ICONE_WHATS + 'Agendar com ' + E.esc(medico.tratamento) + '</a></div>' +
      revisao;

    estado.origemFoco = document.activeElement;
    modal.classList.add('aberto');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal__fechar').focus();
    if (history.replaceState) {
      history.replaceState(null, '', '#medico=' + encodeURIComponent(medico.id));
    }
  }

  function fecharModal() {
    var modal = document.getElementById('modal-medico');
    if (!modal || !modal.classList.contains('aberto')) { return; }
    modal.classList.remove('aberto');
    document.body.style.overflow = '';
    if (history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    if (estado.origemFoco && document.contains(estado.origemFoco)) {
      estado.origemFoco.focus();
    }
    estado.origemFoco = null;
  }

  /* ---------- filtros ---------- */
  function preencherFiltros() {
    var selQueixa = document.getElementById('filtro-queixa');
    var selServico = document.getElementById('filtro-servico');
    if (!selQueixa || !selServico) { return; }

    var queixas = {};
    estado.medicos.forEach(function (m) {
      (m.queixas_leigas || []).forEach(function (q) { queixas[slug(q)] = q; });
    });
    Object.keys(queixas).sort(function (a, b) {
      return queixas[a].localeCompare(queixas[b], 'pt-BR');
    }).forEach(function (s) {
      selQueixa.insertAdjacentHTML('beforeend',
        '<option value="' + E.esc(s) + '">' + E.esc(queixas[s]) + '</option>');
    });

    Object.keys(estado.servicos).forEach(function (id) {
      selServico.insertAdjacentHTML('beforeend',
        '<option value="' + E.esc(id) + '">' + E.esc(estado.servicos[id]) + '</option>');
    });

    var params = new URLSearchParams(location.search);
    if (params.get('queixa')) { selQueixa.value = params.get('queixa'); }
    if (params.get('servico')) { selServico.value = params.get('servico'); }

    selQueixa.addEventListener('change', aplicarFiltros);
    selServico.addEventListener('change', aplicarFiltros);
    var limpar = document.getElementById('limpar-filtros');
    if (limpar) {
      limpar.addEventListener('click', function () {
        selQueixa.value = ''; selServico.value = ''; aplicarFiltros();
      });
    }
  }

  function aplicarFiltros() {
    var selQueixa = document.getElementById('filtro-queixa');
    var selServico = document.getElementById('filtro-servico');
    var queixa = selQueixa ? selQueixa.value : '';
    var servico = selServico ? selServico.value : '';

    var visiveis = 0;
    document.querySelectorAll('#grade-equipe > li').forEach(function (li) {
      var id = li.querySelector('.card-medico').getAttribute('data-medico');
      var medico = estado.medicos.find(function (m) { return m.id === id; });
      var mostra = true;
      if (queixa) {
        mostra = (medico.queixas_leigas || []).some(function (q) { return slug(q) === queixa; });
      }
      if (mostra && servico) {
        mostra = (medico.exames_que_realiza || []).indexOf(servico) !== -1 ||
                 (medico.procedimentos_que_realiza || []).indexOf(servico) !== -1;
      }
      li.hidden = !mostra;
      if (mostra) { visiveis++; }
    });

    var vazio = document.getElementById('sem-resultados');
    if (vazio) { vazio.hidden = visiveis > 0; }
  }

  /* ---------- inicialização ---------- */
  document.addEventListener('eixo:pronto', function (evento) {
    estado.clinica = evento.detail.clinica;
    Promise.all([
      E.carregarJSON('data/medicos.json'),
      E.carregarJSON('data/exames.json'),
      E.carregarJSON('data/procedimentos.json')
    ]).then(function (dados) {
      estado.medicos = dados[0];
      dados[1].concat(dados[2]).forEach(function (s) { estado.servicos[s.id] = s.nome; });

      var grade = document.getElementById('grade-equipe');
      if (grade) {
        grade.innerHTML = estado.medicos.map(cardHTML).join('');
        grade.addEventListener('click', function (e) {
          var botao = e.target.closest('.card-medico');
          if (botao) { abrirModal(botao.getAttribute('data-medico')); }
        });
      }

      var aviso = document.getElementById('aviso-revisao-equipe');
      if (aviso && estado.medicos.some(function (m) { return m.revisado === false; })) {
        aviso.hidden = false;
      }

      montarModal();
      preencherFiltros();
      aplicarFiltros();

      // link direto: equipe.html#medico=slug (na carga e em navegação por hash)
      function abrirPeloHash() {
        var m = location.hash.match(/^#medico=(.+)$/);
        if (m) { abrirModal(decodeURIComponent(m[1])); }
      }
      window.addEventListener('hashchange', abrirPeloHash);
      abrirPeloHash();
    }).catch(function (erro) { console.error(erro); });
  });
})();
