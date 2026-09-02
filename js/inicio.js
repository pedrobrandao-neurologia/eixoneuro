/* =============================================================
   EIXO — página inicial
   - Faixa de identificação (Res. CFM 2.336/2023) sob o hero
   - "Como podemos ajudar": queixas em linguagem leiga derivadas
     de medicos.json (o vínculo queixa → médico vem do RQE)
   - Outras especialidades (outros-profissionais.json)
   - Dados estruturados JSON-LD (MedicalClinic + Physician)
   ============================================================= */
(function () {
  'use strict';

  var E = window.EIXO;

  function slug(texto) {
    return String(texto).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function montarIdentificacao(clinica) {
    var alvo = document.getElementById('identificacao-curta');
    if (!alvo) { return; }
    alvo.innerHTML = '<div class="miolo">' +
      '<span><strong>' + E.esc(clinica.razao_social) + '</strong> · CNPJ ' + E.esc(clinica.cnpj) + '</span>' +
      '<span>CRM-DF (PJ): ' + E.esc(clinica.crm_pj) + '</span>' +
      '<span>Diretor(a) técnico(a): ' + E.esc(clinica.diretor_tecnico.nome) + ' — CRM-DF ' + E.esc(clinica.diretor_tecnico.crm) + '</span>' +
      '<span>' + E.esc(clinica.endereco.completo) + ' · ' + E.esc(clinica.telefone_exibicao) + '</span>' +
      '</div>';
  }

  function montarHeroInfo(clinica) {
    var alvo = document.getElementById('hero-info');
    if (!alvo) { return; }
    var horario = clinica.horario.map(function (h) {
      return h.dias + ' ' + h.horas;
    }).join(' · ');
    alvo.innerHTML =
      '<span class="legenda">' + E.esc(clinica.endereco.edificio) + ', ' + E.esc(clinica.endereco.bloco) + ' · ' + E.esc(clinica.endereco.bairro) + '</span>' +
      '<span class="legenda">' + E.esc(horario) + '</span>';
  }

  function montarQueixas(medicos) {
    var alvo = document.getElementById('lista-queixas');
    if (!alvo) { return; }
    var queixas = {};
    medicos.forEach(function (m) {
      (m.queixas_leigas || []).forEach(function (q) { queixas[slug(q)] = q; });
    });
    alvo.innerHTML = Object.keys(queixas).sort(function (a, b) {
      return queixas[a].localeCompare(queixas[b], 'pt-BR');
    }).map(function (s) {
      return '<li><a href="equipe.html?queixa=' + encodeURIComponent(s) + '">' + E.esc(queixas[s]) + '</a></li>';
    }).join('');
  }

  function montarOutras(profissionais) {
    var alvo = document.getElementById('lista-outras');
    if (!alvo) { return; }
    alvo.innerHTML = profissionais.map(function (p) {
      var rqe = '';
      if (p.profissao !== 'Psicóloga' && p.profissao !== 'Psicólogo') {
        rqe = p.rqe && !E.ehPlaceholder(p.rqe)
          ? ' · ' + E.esc(p.especialidade) + ' — RQE nº ' + E.esc(p.rqe)
          : ' · ' + E.esc(p.especialidade) + ' — RQE nº ' + E.esc(p.rqe || '[PLACEHOLDER — RQE]');
      }
      var titulo = /médic/i.test(p.profissao)
        ? (p.profissao === 'Médica' ? 'MÉDICA' : 'MÉDICO')
        : E.esc(p.profissao).toUpperCase();
      return '<li><div>' +
        '<h3>' + E.esc(p.especialidade) + '</h3>' +
        '<p>' + E.esc(p.descricao) + '</p>' +
        '</div>' +
        '<span class="quem legenda">' + E.esc(p.nome) + ' · ' + E.esc(p.conselho) + ' — ' + titulo + rqe + '</span>' +
        '</li>';
    }).join('');
  }

  function montarJsonLd(clinica, medicos) {
    var dados = {
      '@context': 'https://schema.org',
      '@type': 'MedicalClinic',
      name: clinica.nome_fantasia,
      legalName: clinica.razao_social,
      url: clinica.site_url + '/',
      image: 'https://eixoneuro.com.br/wp-content/uploads/2025/03/Eixo_logotipo-tag-1.png',
      telephone: clinica.telefone_e164,
      medicalSpecialty: 'Neurology',
      address: {
        '@type': 'PostalAddress',
        streetAddress: clinica.endereco.logradouro + ', ' + clinica.endereco.salas + ' — ' + clinica.endereco.edificio,
        addressLocality: clinica.endereco.cidade,
        addressRegion: clinica.endereco.uf,
        postalCode: clinica.endereco.cep,
        addressCountry: 'BR'
      },
      openingHoursSpecification: (clinica.horario_schema || []).map(function (h) {
        return {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: h.dayOfWeek, opens: h.opens, closes: h.closes
        };
      }),
      physician: medicos.filter(function (m) { return !m.nao_especialista; }).map(function (m) {
        return {
          '@type': 'Physician',
          name: m.nome,
          medicalSpecialty: 'Neurology',
          url: clinica.site_url + '/equipe.html#medico=' + m.id
        };
      }),
      sameAs: clinica.redes_sociais && clinica.redes_sociais.instagram
        ? [clinica.redes_sociais.instagram] : []
    };
    if (clinica.coordenadas && clinica.coordenadas.lat != null) {
      dados.geo = { '@type': 'GeoCoordinates', latitude: clinica.coordenadas.lat, longitude: clinica.coordenadas.lng };
    }
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(dados);
    document.head.appendChild(script);
  }

  document.addEventListener('eixo:pronto', function (evento) {
    var clinica = evento.detail.clinica;
    montarIdentificacao(clinica);
    montarHeroInfo(clinica);
    Promise.all([
      E.carregarJSON('data/medicos.json'),
      E.carregarJSON('data/outros-profissionais.json')
    ]).then(function (dados) {
      montarQueixas(dados[0]);
      montarOutras(dados[1]);
      montarJsonLd(clinica, dados[0]);
    }).catch(function (erro) { console.error(erro); });
  });
})();
