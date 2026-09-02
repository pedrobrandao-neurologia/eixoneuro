/* =============================================================
   EIXO — contato e como chegar
   Mapa, botões (Google Maps / Waze / copiar endereço), passo a
   passo da chegada e formulário mínimo sem backend: os dados
   viram um link de WhatsApp ou mailto e NÃO são armazenados.
   ============================================================= */
(function () {
  'use strict';

  var E = window.EIXO;

  function montarInfo(clinica) {
    var alvo = document.getElementById('info-contato');
    if (!alvo) { return; }
    var horario = clinica.horario.map(function (h) {
      return E.esc(h.dias) + ', ' + E.esc(h.horas);
    }).join('<br>');
    var email = E.ehPlaceholder(clinica.email)
      ? E.esc(clinica.email)
      : '<a href="mailto:' + E.esc(clinica.email) + '">' + E.esc(clinica.email) + '</a>';
    alvo.innerHTML =
      '<div><dt class="legenda">Horário de funcionamento</dt><dd>' + horario + '</dd></div>' +
      '<div><dt class="legenda">Telefone e WhatsApp</dt><dd><a href="' + E.linkTelefone(clinica) + '">' +
      E.esc(clinica.telefone_exibicao) + '</a></dd></div>' +
      '<div><dt class="legenda">E-mail</dt><dd>' + email + '</dd></div>';
  }

  function montarEndereco(clinica) {
    var alvo = document.getElementById('endereco-copiavel');
    if (alvo) { alvo.textContent = clinica.endereco.completo; }
  }

  function montarListas(clinica) {
    var chegada = document.getElementById('instrucoes-chegada');
    if (chegada) {
      chegada.innerHTML = (clinica.como_chegar.instrucoes || []).map(function (i) {
        return '<li>' + E.esc(i) + '</li>';
      }).join('');
    }
    var acesso = document.getElementById('acessibilidade-fisica');
    if (acesso) {
      acesso.innerHTML = (clinica.como_chegar.acessibilidade_fisica || []).map(function (i) {
        return '<li>' + E.esc(i) + '</li>';
      }).join('');
    }
  }

  function montarMapa(clinica) {
    var alvo = document.getElementById('mapa');
    if (alvo) {
      alvo.innerHTML = '<iframe src="' + E.esc(clinica.google_maps_embed_url) +
        '" title="Mapa com a localização da clínica no Centro Clínico Lúcio Costa, Bloco 2" ' +
        'loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
    }
    var botoes = document.getElementById('botoes-mapa');
    if (botoes) {
      botoes.innerHTML =
        '<a class="botao botao--vazado botao--mini" href="' + E.esc(clinica.google_maps_place_url) + '" target="_blank" rel="noopener">Abrir no Google Maps</a>' +
        '<a class="botao botao--vazado botao--mini" href="' + E.esc(clinica.waze_url) + '" target="_blank" rel="noopener">Abrir no Waze</a>' +
        '<button type="button" class="botao botao--vazado botao--mini" id="copiar-endereco">Copiar endereço</button>';
      var botaoCopiar = document.getElementById('copiar-endereco');
      botaoCopiar.addEventListener('click', function () {
        var texto = clinica.endereco.completo;
        function feito() {
          botaoCopiar.textContent = 'Endereço copiado ✓';
          setTimeout(function () { botaoCopiar.textContent = 'Copiar endereço'; }, 2500);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(texto).then(feito).catch(function () { feito(); });
        } else {
          var area = document.createElement('textarea');
          area.value = texto; document.body.appendChild(area);
          area.select(); document.execCommand('copy'); area.remove(); feito();
        }
      });
    }
  }

  function montarFormulario(clinica) {
    var form = document.getElementById('form-contato');
    if (!form) { return; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = form.querySelector('#campo-nome').value.trim();
      var telefone = form.querySelector('#campo-telefone').value.trim();
      var assunto = form.querySelector('#campo-assunto').value;
      var texto = 'Olá! Meu nome é ' + nome +
        (telefone ? ' (telefone: ' + telefone + ')' : '') +
        '. Assunto: ' + assunto + '.';
      var destino = e.submitter && e.submitter.id === 'enviar-email' && !E.ehPlaceholder(clinica.email)
        ? 'mailto:' + clinica.email + '?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(texto)
        : E.linkWhatsApp(clinica, texto);
      window.open(destino, '_blank', 'noopener');
    });
  }

  document.addEventListener('eixo:pronto', function (evento) {
    var clinica = evento.detail.clinica;
    montarInfo(clinica);
    montarEndereco(clinica);
    montarListas(clinica);
    montarMapa(clinica);
    montarFormulario(clinica);
  });
})();
