/* =============================================================
   EIXO — blog (data/blog.json)
   - blog.html: listagem de posts (#lista-posts)
   - post.html?post=slug: artigo completo (#post-conteudo), com o
     autor identificado no formato da Res. CFM 2.336/2023 e aviso
     de conteúdo informativo
   - index.html: cards recentes via window.EIXO_BLOG (inicio.js)
   Conteúdo em tom informativo e sóbrio — ver CONTENT-RULES.md.
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
    return posts.slice().sort(function (a, b) { return b.data.localeCompare(a.data); });
  }

  function autorDe(post, medicos) {
    return medicos.find(function (m) { return m.id === post.autor; }) || null;
  }

  function cardHTML(post, medicos) {
    var autor = autorDe(post, medicos);
    var linhaAutor = autor
      ? E.esc(autor.nome) + ' — ' + E.linhaRegistro(autor)
      : E.esc(post.autor || '');
    var tags = (post.tags || []).map(function (t) {
      return '<span>' + E.esc(t) + '</span>';
    }).join('');
    return '<li><a class="card-post" href="post.html?post=' + encodeURIComponent(post.slug) + '">' +
      '<p class="meta">' + E.esc(dataLegivel(post.data)) + '</p>' +
      '<h3>' + E.esc(post.titulo) + '</h3>' +
      '<p>' + E.esc(post.resumo) + '</p>' +
      '<p class="meta">' + linhaAutor + '</p>' +
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

  function montarListagem(posts, medicos) {
    var alvo = document.getElementById('lista-posts');
    if (!alvo) { return; }
    alvo.innerHTML = ordenar(posts).map(function (p) { return cardHTML(p, medicos); }).join('');
  }

  function montarPost(posts, medicos, clinica) {
    var alvo = document.getElementById('post-conteudo');
    if (!alvo) { return; }
    var slug = new URLSearchParams(location.search).get('post');
    var post = posts.find(function (p) { return p.slug === slug; });

    if (!post) {
      alvo.innerHTML = '<h1>Artigo não encontrado</h1>' +
        '<p style="margin-top:16px">O texto que você procura não está mais disponível ou o endereço está incorreto.</p>' +
        '<p style="margin-top:20px"><a class="botao botao--cheio" href="blog.html">Ver todos os artigos</a></p>';
      return;
    }

    document.title = post.titulo + ' · Blog · ' + clinica.nome_fantasia;

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
      : '';

    var revisao = post.revisado === false
      ? '<p class="banner-revisao" style="margin-top:24px">Conteúdo em revisão pela equipe médica.</p>'
      : '';

    alvo.innerHTML =
      '<p class="legenda">' + (post.tags || []).map(E.esc).join(' · ') + '</p>' +
      '<h1>' + E.esc(post.titulo) + '</h1>' +
      '<p class="meta">' + E.esc(dataLegivel(post.data)) +
      (autor ? ' · ' + E.esc(autor.nome) : '') + '</p>' +
      revisao +
      '<div class="post-corpo">' + (post.corpo || []).map(blocoHTML).join('') + '</div>' +
      '<div class="aviso-conteudo"><strong>Aviso:</strong> este conteúdo é informativo e não substitui consulta, diagnóstico ou tratamento médico. Em caso de sintomas, procure um médico. Em emergências, ligue 192 (SAMU).</div>' +
      caixaAutor +
      '<p style="margin-top:36px"><a class="botao botao--vazado" href="blog.html">← Todos os artigos</a></p>';

    // dados estruturados do artigo
    var ld = {
      '@context': 'https://schema.org',
      '@type': 'MedicalWebPage',
      headline: post.titulo,
      description: post.resumo,
      datePublished: post.data,
      inLanguage: 'pt-BR',
      author: autor ? { '@type': 'Physician', name: autor.nome } : undefined,
      publisher: { '@type': 'MedicalClinic', name: clinica.nome_fantasia }
    };
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
  }

  window.EIXO_BLOG = { ordenar: ordenar, cardHTML: cardHTML };

  document.addEventListener('eixo:pronto', function (evento) {
    var clinica = evento.detail.clinica;
    if (!document.getElementById('lista-posts') && !document.getElementById('post-conteudo')) { return; }
    Promise.all([
      E.carregarJSON('data/blog.json'),
      E.carregarJSON('data/medicos.json')
    ]).then(function (dados) {
      montarListagem(dados[0], dados[1]);
      montarPost(dados[0], dados[1], clinica);
    }).catch(function (erro) { console.error(erro); });
  });
})();
