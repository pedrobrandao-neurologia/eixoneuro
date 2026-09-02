/* =============================================================
   EIXO — outras especialidades (outros-profissionais.json)
   Renderiza a lista em qualquer página com #lista-outras
   (home e equipe.html) e abre o mini currículo no modal
   compartilhado (window.EIXO_MODAL, definido em equipe.js).
   Também expõe os ícones do design system (window.EIXO_ICONES).
   ============================================================= */
(function () {
  'use strict';

  var E = window.EIXO;

  /* Ícones do design system (traço 1.2, viewBox 36) */
  var ICONES = {
    movimento: '<path d="M18 5v26M18 5c-4 0-7 3-7 7v0M18 5c4 0 7 3 7 7v0M11 12c-2 0-4 2-4 4s2 4 4 4M25 12c2 0 4 2 4 4s-2 4-4 4M11 20c-2 1-3 3-2 5M25 20c2 1 3 3 2 5"/>',
    epilepsia: '<path d="M4 18h6l3-9 4 18 4-14 3 5h8"/>',
    vascular: '<path d="M18 31c-5 0-9-4-9-9 0-6 9-16 9-16s9 10 9 16c0 5-4 9-9 9zM14 21c0 3 2 5 4 5"/>',
    cognitiva: '<circle cx="18" cy="18" r="12"/><path d="M18 10v8l5 3M10 6l-3 3M26 6l3 3"/>',
    neuroimuno: '<path d="M18 4l12 5v8c0 8-5 13-12 15C11 30 6 25 6 17V9z"/><path d="M13 18l3 3 7-7"/>',
    neurofisio: '<path d="M4 20c4 0 4-8 8-8s4 12 8 12 4-8 8-8h4"/>',
    cefaleia: '<path d="M18 6c-6 0-10 4-10 10 0 4 2 6 4 8v6h12v-6c2-2 4-4 4-8 0-6-4-10-10-10z"/><path d="M14 30h8"/>',
    neuromuscular: '<path d="M8 28c0-4 3-6 6-8s3-6 2-10M28 28c0-4-3-6-6-8s-3-6-2-10M12 8h12"/>',
    neuropediatria: '<circle cx="18" cy="12" r="6"/><path d="M14.5 12h2l1.5-2.5 1.5 2.5h2"/><path d="M9 30c0-5 4-8 9-8s9 3 9 8"/>',
    neuropsico: '<path d="M10 26c-3-4-3-10 0-14 4-5 12-5 16 0 3 4 3 10 0 14"/><path d="M14 18h8M18 14v8"/>',
    neurocirurgia: '<path d="M12 6v10c0 6-4 8-4 14M24 6v10c0 6 4 8 4 14M12 16h12"/>',
    neurorradio: '<circle cx="18" cy="18" r="3"/><path d="M18 6v6M18 24v6M6 18h6M24 18h6M9 9l4 4M23 23l4 4M27 9l-4 4M13 23l-4 4"/>',
    cardio: '<path d="M18 30s-10-6-10-14a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 8-10 14-10 14z"/>',
    geriatria: '<path d="M10 30V16a8 8 0 0 1 16 0v14M14 30v-6M22 30v-6M6 30h24"/>',
    psiquiatria: '<circle cx="18" cy="14" r="6"/><path d="M8 30c0-5 4-8 10-8s10 3 10 8"/>',
    otoneuro: '<path d="M8 18a10 10 0 0 1 20 0"/><path d="M8 18v6a3 3 0 0 0 6 0v-6zM22 18v6a3 3 0 0 0 6 0v-6z"/>',
    reumato: '<path d="M12 6v12a6 6 0 0 0 12 0V6M12 6h4M20 6h4M18 24v6M14 30h8"/>'
  };

  function icone(id) {
    if (!id || !ICONES[id]) { return ''; }
    return '<span class="icone" aria-hidden="true"><svg viewBox="0 0 36 36">' + ICONES[id] + '</svg></span>';
  }

  function tituloProfissional(p) {
    return /médic/i.test(p.profissao)
      ? (p.profissao === 'Médica' ? 'MÉDICA' : 'MÉDICO')
      : p.profissao.toUpperCase();
  }

  function modalOutroHTML(p) {
    var foto = p.foto
      ? '<span class="avatar"><img src="' + E.esc(p.foto) + '" alt="Foto de ' + E.esc(p.nome) + '" loading="lazy" width="88" height="88"></span>'
      : '';
    var rqe = (p.profissao !== 'Psicóloga' && p.profissao !== 'Psicólogo')
      ? '<p class="registro legenda">' + E.esc(p.especialidade) + ' — RQE nº ' + E.esc(p.rqe || '[PLACEHOLDER — RQE]') + '</p>'
      : '<p class="registro legenda">' + E.esc(p.especialidade) + '</p>';
    var formacao = (p.formacao && p.formacao.length)
      ? '<h3>Formação e titulação</h3><ul>' + p.formacao.map(function (f) {
          return '<li>' + E.esc(f) + '</li>';
        }).join('') + '</ul>'
      : '';
    var revisao = p.revisado === false
      ? '<p class="banner-revisao" style="margin-top:20px;margin-bottom:0">Conteúdo em revisão pela equipe.</p>'
      : '';
    return foto + '<h2 id="modal-medico-titulo">' + E.esc(p.nome) + '</h2>' +
      '<p class="registro legenda">' + E.esc(p.conselho) + ' — ' + E.esc(tituloProfissional(p)) + '</p>' +
      rqe +
      '<h3>Mini currículo</h3><p>' + E.esc(p.mini_cv) + '</p>' +
      formacao + revisao;
  }

  function montarOutras(profissionais) {
    var alvo = document.getElementById('lista-outras');
    if (!alvo) { return; }
    alvo.innerHTML = profissionais.map(function (p) {
      var rqe = '';
      if (p.profissao !== 'Psicóloga' && p.profissao !== 'Psicólogo') {
        rqe = ' · RQE nº ' + E.esc(p.rqe || '[PLACEHOLDER — RQE]');
      }
      var botao = p.mini_cv
        ? '<button type="button" class="ver-cv" data-outro="' + E.esc(p.id) + '" aria-haspopup="dialog" aria-label="Ver mini currículo de ' + E.esc(p.nome) + '">Ver mini currículo</button>'
        : '';
      return '<li>' +
        icone(p.icone) +
        '<div><h3>' + E.esc(p.especialidade) + '</h3><p>' + E.esc(p.descricao) + '</p></div>' +
        '<span class="quem legenda">' + E.esc(p.nome) + ' · ' + E.esc(p.conselho) + ' — ' + E.esc(tituloProfissional(p)) + rqe + '</span>' +
        botao +
        '</li>';
    }).join('');

    alvo.addEventListener('click', function (e) {
      var botao = e.target.closest('[data-outro]');
      if (!botao || !window.EIXO_MODAL) { return; }
      var p = profissionais.find(function (x) { return x.id === botao.getAttribute('data-outro'); });
      if (p) { window.EIXO_MODAL.abrir(modalOutroHTML(p)); }
    });
  }

  window.EIXO_ICONES = { icone: icone };

  document.addEventListener('eixo:pronto', function () {
    if (!document.getElementById('lista-outras')) { return; }
    E.carregarJSON('data/outros-profissionais.json')
      .then(montarOutras)
      .catch(function (erro) { console.error(erro); });
  });
})();
