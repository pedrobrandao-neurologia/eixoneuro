/* =============================================================
   EIXO — blog
   Estrutura de dados (leve, para Core Web Vitals):
   - data/blog-indice.json  → metadados de todos os posts
     (listagem, home e cards carregam SÓ o índice)
   - data/blog/<slug>.json  → corpo e referências de UM post
     (carregado apenas na página do artigo)

   SEO/YMYL:
   - título, meta description, canonical e Open Graph por artigo
   - JSON-LD MedicalWebPage (autor Physician, publisher, about
     MedicalCondition, citation com DOI/PubMed) + BreadcrumbList
   - autor identificado no formato CFM; posts sem autor individual
     aparecem como material da equipe
   ============================================================= */
(function () {
  'use strict';

  var E = window.EIXO;

  function dataLegivel(iso) {
    var partes = String(iso).split('-');
    var meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    if (partes.length !== 3) { return iso; }
    return parseInt(partes[2], 10) + ' de ' + meses[parseInt(partes[1], 10) - 1] + ' de ' + partes[0];
  }

  function ordenar(posts) {
    return posts.slice().sort(function (a, b) {
      var d = b.data.localeCompare(a.data);
      return d !== 0 ? d : a.titulo.localeCompare(b.titulo, 'pt-BR');
    });
  }

  function autorDe(post, medicos) {
    if (!post.autor) { return null; }
    return medicos.find(function (m) { return m.id === post.autor; }) || null;
  }

  function linhaAutor(post, medicos) {
    var autor = autorDe(post, medicos);
    if (autor) { return E.esc(autor.nome) + ' — ' + E.linhaRegistro(autor); }
    return 'Equipe Eixo — material informativo para pacientes';
  }

  function cardHTML(post, medicos) {
    var tags = (post.tags || []).map(function (t) {
      return '<span>' + E.esc(t) + '</span>';
    }).join('');
    return '<li><a class="card-post" href="post.html?post=' + encodeURIComponent(post.slug) + '">' +
      '<p class="meta">' + E.esc(dataLegivel(post.data)) + '</p>' +
      '<h3>' + E.esc(post.titulo) + '</h3>' +
      '<p>' + E.esc(post.resumo) + '</p>' +
      '<p class="meta">' + linhaAutor(post, medicos) + '</p>' +
      '<span class="tags" aria-hidden="true">' + tags + '</span>' +
      '</a></li>';
  }

  function blocoHTML(bloco) {
    if (bloco.tipo === 'subtitulo') {
      return '<h2>' + E.esc(bloco.texto) + '</h2>';
    }
    if (bloco.tipo === 'lista') {
      return '<ul>' + (bloco.itens || []).map(function (i) {
        return '<li>' + E.esc(i) + '</li>';
      }).join('') + '</ul>';
    }
    return '<p>' + E.esc(bloco.texto) + '</p>';
  }

  function referenciasHTML(referencias) {
    if (!referencias || !referencias.length) { return ''; }
    return '<h2>Referências científicas</h2>' +
      '<p style="font-size:.9rem;opacity:.85">Material elaborado com base na literatura científica indexada (PubMed).</p>' +
      '<ol style="padding-left:1.3em;display:grid;gap:.6em;font-size:.92rem">' +
      referencias.map(function (r) {
        var links = (r.links || []).map(function (l) {
          return '<a href="' + E.esc(l.url) + '" target="_blank" rel="noopener" style="border-bottom:1px solid currentColor">' + E.esc(l.rotulo) + '</a>';
        }).join(' · ');
        return '<li>' + E.esc(r.texto) + (links ? ' ' + links : '') + '</li>';
      }).join('') + '</ol>';
  }

  /* ---------- listagem (blog.html) e filtro por tema ---------- */
  function montarListagem(indice, medicos) {
    var alvo = document.getElementById('lista-posts');
    if (!alvo) { return; }
    var posts = ordenar(indice);

    var seletor = document.getElementById('filtro-tema');
    if (seletor) {
      var temas = {};
      posts.forEach(function (p) { (p.tags || []).forEach(function (t) { temas[t] = true; }); });
      Object.keys(temas).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); })
        .forEach(function (t) {
          seletor.insertAdjacentHTML('beforeend', '<option value="' + E.esc(t) + '">' + E.esc(t) + '</option>');
        });
      seletor.addEventListener('change', desenhar);
    }

    function desenhar() {
      var tema = seletor ? seletor.value : '';
      var visiveis = tema
        ? posts.filter(function (p) { return (p.tags || []).indexOf(tema) !== -1; })
        : posts;
      alvo.innerHTML = visiveis.map(function (p) { return cardHTML(p, medicos); }).join('');
      var contador = document.getElementById('contador-posts');
      if (contador) {
        contador.textContent = visiveis.length + (visiveis.length === 1 ? ' artigo' : ' artigos');
      }
    }
    desenhar();
  }

  /* ---------- metadados de SEO por artigo ---------- */
  function definirMeta(nome, conteudo, atributo) {
    atributo = atributo || 'name';
    var el = document.head.querySelector('meta[' + atributo + '="' + nome + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(atributo, nome);
      document.head.appendChild(el);
    }
    el.setAttribute('content', conteudo);
  }

  function definirCanonical(url) {
    var el = document.head.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', 'canonical');
      document.head.appendChild(el);
    }
    el.setAttribute('href', url);
  }

  /* ---------- página do artigo (post.html) ---------- */
  function montarPost(indice, medicos, clinica) {
    var alvo = document.getElementById('post-conteudo');
    if (!alvo) { return; }
    var slug = new URLSearchParams(location.search).get('post');
    var post = indice.find(function (p) { return p.slug === slug; });

    if (!post) {
      alvo.innerHTML = '<h1>Artigo não encontrado</h1>' +
        '<p style="margin-top:16px">O texto que você procura não está mais disponível ou o endereço está incorreto.</p>' +
        '<p style="margin-top:20px"><a class="botao botao--cheio" href="blog.html">Ver todos os artigos</a></p>';
      definirMeta('robots', 'noindex,follow');
      return;
    }

    var urlArtigo = clinica.site_url + '/post.html?post=' + encodeURIComponent(post.slug);
    document.title = post.titulo + ' · Blog · ' + clinica.nome_fantasia;
    definirMeta('description', post.resumo);
    definirCanonical(urlArtigo);
    definirMeta('og:title', post.titulo, 'property');
    definirMeta('og:description', post.resumo, 'property');
    definirMeta('og:url', urlArtigo, 'property');

    E.carregarJSON('data/blog/' + encodeURIComponent(post.slug) + '.json').then(function (conteudo) {
      var autor = autorDe(post, medicos);
      var especialidades = autor ? E.linhasEspecialidade(autor).map(function (l) {
        return '<p class="registro legenda">' + l + '</p>';
      }).join('') : '';

      var caixaAutor = autor
        ? '<div class="autor-caixa"><p class="legenda">Escrito por</p>' +
          '<p class="nome-autor">' + E.esc(autor.nome) + '</p>' +
          '<p class="registro legenda">' + E.linhaRegistro(autor) + '</p>' +
          especialidades +
          (autor.nao_especialista ? '<p class="nao-esp legenda">Não especialista</p>' : '') +
          '<p style="margin-top:8px"><a href="equipe.html#medico=' + E.esc(autor.id) + '" style="border-bottom:1px solid currentColor">Ver mini currículo e agendar</a></p>' +
          '</div>'
        : '<div class="autor-caixa"><p class="legenda">Material da equipe</p>' +
          '<p class="nome-autor">' + E.esc(clinica.nome_fantasia) + '</p>' +
          '<p style="font-size:.92rem">Material informativo para pacientes, elaborado pela equipe médica com base na literatura científica indexada. Responsável técnica da clínica: ' +
          E.esc(clinica.diretor_tecnico.nome) + ' — CRM-DF ' + E.esc(clinica.diretor_tecnico.crm) + '.</p>' +
          '<p style="margin-top:8px"><a href="equipe.html" style="border-bottom:1px solid currentColor">Conheça a equipe</a></p>' +
          '</div>';

      var revisao = post.revisado === false
        ? '<p class="banner-revisao" style="margin-top:24px">Conteúdo em revisão pela equipe médica.</p>'
        : '';

      alvo.innerHTML =
        '<p class="legenda">' + (post.tags || []).map(E.esc).join(' · ') + '</p>' +
        '<h1>' + E.esc(post.titulo) + '</h1>' +
        '<p class="meta">Publicado em ' + E.esc(dataLegivel(post.data)) +
        (autor ? ' · ' + E.esc(autor.nome) : ' · Equipe Eixo') + '</p>' +
        revisao +
        '<div class="post-corpo">' +
        (conteudo.corpo || []).map(blocoHTML).join('') +
        referenciasHTML(conteudo.referencias) +
        '</div>' +
        '<div class="aviso-conteudo"><strong>Aviso:</strong> este conteúdo é informativo e não substitui consulta, diagnóstico ou tratamento médico. Em caso de sintomas, procure um médico. Em emergências, ligue 192 (SAMU).</div>' +
        caixaAutor +
        '<p style="margin-top:36px"><a class="botao botao--vazado" href="blog.html">← Todos os artigos</a></p>';

      // JSON-LD: MedicalWebPage + BreadcrumbList
      var citacoes = [];
      (conteudo.referencias || []).forEach(function (r) {
        (r.links || []).forEach(function (l) { citacoes.push(l.url); });
      });
      var ld = {
        '@context': 'https://schema.org',
        '@type': 'MedicalWebPage',
        headline: post.titulo,
        description: post.resumo,
        datePublished: post.data,
        dateModified: post.data,
        inLanguage: 'pt-BR',
        url: urlArtigo,
        mainEntityOfPage: urlArtigo,
        author: autor
          ? { '@type': 'Physician', name: autor.nome, url: clinica.site_url + '/equipe.html#medico=' + autor.id, medicalSpecialty: 'Neurology' }
          : { '@type': 'Organization', name: clinica.nome_fantasia },
        publisher: {
          '@type': 'MedicalClinic',
          name: clinica.nome_fantasia,
          logo: { '@type': 'ImageObject', url: 'https://eixoneuro.com.br/wp-content/uploads/2025/03/Eixo_logotipo-tag-1.png' }
        }
      };
      if (post.condicao) {
        ld.about = { '@type': 'MedicalCondition', name: post.condicao };
      }
      if (citacoes.length) { ld.citation = citacoes; }
      var migalhas = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: clinica.site_url + '/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: clinica.site_url + '/blog.html' },
          { '@type': 'ListItem', position: 3, name: post.titulo, item: urlArtigo }
        ]
      };
      [ld, migalhas].forEach(function (dados) {
        var script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(dados);
        document.head.appendChild(script);
      });
    }).catch(function (erro) {
      console.error(erro);
      alvo.innerHTML = '<h1>Não foi possível carregar o artigo</h1>' +
        '<p style="margin-top:20px"><a class="botao botao--cheio" href="blog.html">Ver todos os artigos</a></p>';
    });
  }

  window.EIXO_BLOG = { ordenar: ordenar, cardHTML: cardHTML };

  document.addEventListener('eixo:pronto', function (evento) {
    var clinica = evento.detail.clinica;
    if (!document.getElementById('lista-posts') && !document.getElementById('post-conteudo')) { return; }
    Promise.all([
      E.carregarJSON('data/blog-indice.json'),
      E.carregarJSON('data/medicos.json')
    ]).then(function (dados) {
      montarListagem(dados[0], dados[1]);
      montarPost(dados[0], dados[1], clinica);
    }).catch(function (erro) { console.error(erro); });
  });
})();
