/* =============================================================
   EIXO — página inicial
   - Especialidades neurológicas com "quem atende" (o vínculo
     médico → área deriva do RQE em medicos.json)
   - Posts recentes do blog (data/blog-indice.json)
   - Dados estruturados JSON-LD (MedicalClinic + Physician)
   As outras especialidades (#lista-outras) são montadas por
   js/outros.js, compartilhado com equipe.html.
   ============================================================= */
(function () {
  'use strict';

  var E = window.EIXO;

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

  /* Especialidades neurológicas: só a área e a descrição — a
     identificação dos médicos (CRM/RQE) fica na seção Equipe. */
  function montarEspecialidades(especialidades) {
    var alvo = document.getElementById('lista-especialidades');
    if (!alvo) { return; }
    alvo.innerHTML = especialidades.map(function (esp) {
      return '<li id="esp-' + E.esc(esp.id) + '">' +
        window.EIXO_ICONES.icone(esp.icone) +
        '<div><h3>' + E.esc(esp.nome) + '</h3><p>' + E.esc(esp.descricao) + '</p></div>' +
        '</li>';
    }).join('');
  }

  function montarPostsRecentes(posts, medicos) {
    var alvo = document.getElementById('posts-recentes');
    if (!alvo || !window.EIXO_BLOG) { return; }
    alvo.innerHTML = window.EIXO_BLOG.ordenar(posts).slice(0, 3)
      .map(function (post) { return window.EIXO_BLOG.cardHTML(post, medicos); }).join('');
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
        var medico = {
          '@type': 'Physician',
          name: m.nome,
          medicalSpecialty: 'Neurology',
          url: clinica.site_url + '/equipe.html#medico=' + m.id
        };
        var perfis = [m.lattes, m.orcid].filter(Boolean);
        if (perfis.length) { medico.sameAs = perfis; }
        return medico;
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
    montarHeroInfo(clinica);
    Promise.all([
      E.carregarJSON('data/medicos.json'),
      E.carregarJSON('data/especialidades.json'),
      E.carregarJSON('data/blog-indice.json')
    ]).then(function (dados) {
      montarEspecialidades(dados[1]);
      montarPostsRecentes(dados[2], dados[0]);
      montarJsonLd(clinica, dados[0]);
    }).catch(function (erro) { console.error(erro); });
  });
})();
