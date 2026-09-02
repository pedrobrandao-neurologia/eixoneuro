/* =============================================================
   EIXO — código comum a todas as páginas
   - Carrega /data/*.json (nenhum dado de médico fica no HTML)
   - Monta cabeçalho, barra mobile e rodapé com a identificação
     obrigatória da Resolução CFM 2.336/2023
   - Banner de privacidade (sem rastreadores por padrão)
   - Botão de aumentar fonte, menu mobile, ano do rodapé
   ============================================================= */
(function () {
  'use strict';

  var cache = {};

  function carregarJSON(caminho) {
    if (!cache[caminho]) {
      cache[caminho] = fetch(caminho).then(function (r) {
        if (!r.ok) { throw new Error('Falha ao carregar ' + caminho); }
        return r.json();
      });
    }
    return cache[caminho];
  }

  function esc(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function ehPlaceholder(v) {
    return typeof v === 'string' && v.indexOf('[PLACEHOLDER') !== -1;
  }

  /* ---------- links de contato ---------- */
  function linkWhatsApp(clinica, mensagem) {
    var texto = mensagem || clinica.whatsapp_mensagem_padrao || '';
    return 'https://wa.me/' + clinica.whatsapp_e164 +
      (texto ? '?text=' + encodeURIComponent(texto) : '');
  }

  function linkTelefone(clinica) {
    return 'tel:' + clinica.telefone_e164;
  }

  /* ---------- identificação de médico (art. 4º, Res. CFM 2.336/2023) ---------- */
  function generoMedico(medico) {
    return /^Dra\.?\s/i.test(medico.nome) ? 'MÉDICA' : 'MÉDICO';
  }

  function linhaRegistro(medico) {
    return 'CRM-' + esc(medico.uf) + ' nº ' + esc(medico.crm) + ' — ' + generoMedico(medico);
  }

  function linhasEspecialidade(medico) {
    var linhas = [];
    if (medico.especialidade && medico.rqe) {
      linhas.push(esc(medico.especialidade) + ' — RQE nº ' + esc(medico.rqe));
    }
    (medico.areas_atuacao || []).forEach(function (area) {
      if (area.nome && area.rqe) {
        linhas.push(esc(area.nome) + ' — RQE nº ' + esc(area.rqe));
      }
    });
    return linhas;
  }

  /* ---------- SVG reutilizáveis ---------- */
  var ICONE_WHATS = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.5 0 .2 5.3.2 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.7a11.9 11.9 0 0 0 5.7 1.5c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 0 1-1.5-5.3c0-5.4 4.4-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9a9.8 9.8 0 0 1 2.9 7c0 5.4-4.5 9.9-10 9.9zm5.4-7.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4-3.5-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/></svg>';
  var ICONE_TEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 5c0-1 .8-2 1.9-2h2.4c.9 0 1.6.6 1.9 1.4l.9 2.8c.2.8 0 1.6-.7 2.1l-1.2 1a14.5 14.5 0 0 0 5.5 5.5l1-1.2c.5-.7 1.3-.9 2.1-.7l2.8.9c.8.3 1.4 1 1.4 1.9v2.4c0 1.1-1 1.9-2 1.9C10.6 21 3 13.4 4 5z"/></svg>';

  /* Ícone da Plataforma Lattes: disco em currentColor com o glifo
     (cometa + elipse) vazado via máscara, para se adaptar a qualquer
     fundo do site. */
  var ICONE_LATTES = '<svg viewBox="0 0 24 24" class="icone-lattes" aria-hidden="true">' +
    '<defs><mask id="mascara-lattes">' +
    '<rect width="24" height="24" fill="#fff"/>' +
    '<circle cx="11" cy="13" r="5.7" fill="#000"/>' +
    '<circle cx="13.4" cy="10.8" r="4.9" fill="#000"/>' +
    '<circle cx="16.7" cy="8" r="2.1" fill="#000"/>' +
    '<ellipse cx="12.6" cy="11.4" rx="2.7" ry="2" transform="rotate(-32 12.6 11.4)" fill="#fff"/>' +
    '</mask></defs>' +
    '<circle cx="12" cy="12" r="11" fill="currentColor" mask="url(#mascara-lattes)"/></svg>';

  function linkLattes(url) {
    if (!url) { return ''; }
    return '<a class="link-lattes" href="' + esc(url) + '" target="_blank" rel="noopener">' +
      ICONE_LATTES + '<span>Currículo Lattes</span></a>';
  }

  var SIMBOLO_GRAFISMO =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
    '<symbol id="eixo-linhas" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">' +
    '<path d="M540 260 C 540 240, 560 220, 600 190 L 800 40"/>' +
    '<path d="M540 260 L 540 -20"/><path d="M540 260 L 260 -20"/>' +
    '<path d="M540 260 L 40 340"/><path d="M540 260 L 360 620"/>' +
    '<path d="M540 260 L 560 620"/><path d="M540 260 L 820 300"/>' +
    '<path d="M540 260 L 760 560"/></symbol></svg>';

  /* ---------- cabeçalho ---------- */
  var PAGINAS = [
    { arquivo: 'equipe.html', rotulo: 'Equipe' },
    { arquivo: 'exames-procedimentos.html', rotulo: 'Exames e procedimentos' },
    { arquivo: 'primeira-consulta.html', rotulo: 'Primeira consulta' },
    { arquivo: 'receitas-laudos.html', rotulo: 'Receitas e laudos' },
    { arquivo: 'blog.html', rotulo: 'Blog' },
    { arquivo: 'contato.html', rotulo: 'Contato' }
  ];

  function montarCabecalho(clinica) {
    var alvo = document.getElementById('cabecalho-site');
    if (!alvo) { return; }
    var paginaAtual = document.body.getAttribute('data-pagina') || '';

    var itens = PAGINAS.map(function (p) {
      var atual = p.arquivo.indexOf(paginaAtual) === 0 && paginaAtual !== '';
      return '<li><a href="' + p.arquivo + '"' + (atual ? ' aria-current="page"' : '') + '>' + p.rotulo + '</a></li>';
    }).join('');

    alvo.innerHTML =
      '<div class="aviso-topo">' + esc(clinica.endereco.edificio) + ', ' + esc(clinica.endereco.bloco) +
      ' · ' + esc(clinica.endereco.bairro) + ', ' + esc(clinica.endereco.cidade) + '-' + esc(clinica.endereco.uf) +
      ' · ' + esc(clinica.telefone_exibicao) + '</div>' +
      '<header class="topo"><div class="miolo">' +
      '<a class="logo" href="index.html" aria-label="' + esc(clinica.nome_fantasia) + ' — página inicial">' +
      '<img src="https://eixoneuro.com.br/wp-content/uploads/2025/03/Eixo_logotipo-tag-1-300x101.png" alt="' + esc(clinica.nome_fantasia) + '" width="300" height="101"></a>' +
      '<nav id="nav-principal" aria-label="Principal"><ul>' + itens + '</ul></nav>' +
      '<div class="topo__acoes">' +
      '<button type="button" class="botao botao--vazado botao-fonte" aria-label="Aumentar tamanho da letra" title="Aumentar tamanho da letra">A+</button>' +
      '<a class="botao botao--vazado" href="' + linkTelefone(clinica) + '">' + ICONE_TEL + 'Ligar</a>' +
      '<a class="botao botao--cheio" href="' + linkWhatsApp(clinica) + '" target="_blank" rel="noopener">' + ICONE_WHATS + 'Agendar pelo WhatsApp</a>' +
      '</div>' +
      '<button class="hamb" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-principal">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
      '</button></div></header>';

    var btn = alvo.querySelector('.hamb');
    var nav = alvo.querySelector('#nav-principal');
    btn.addEventListener('click', function () {
      var aberto = nav.classList.toggle('aberto');
      btn.setAttribute('aria-expanded', String(aberto));
      btn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });

    var botaoFonte = alvo.querySelector('.botao-fonte');
    if (botaoFonte) { botaoFonte.addEventListener('click', alternarFonte); }
  }

  /* ---------- barra fixa inferior (mobile) ---------- */
  function montarBarraMobile(clinica) {
    var barra = document.createElement('div');
    barra.className = 'barra-mobile';
    barra.innerHTML =
      '<a class="botao botao--vazado" href="' + linkTelefone(clinica) + '">' + ICONE_TEL + 'Ligar</a>' +
      '<a class="botao botao--cheio" href="' + linkWhatsApp(clinica) + '" target="_blank" rel="noopener">' + ICONE_WHATS + 'WhatsApp</a>';
    document.body.appendChild(barra);
  }

  /* ---------- rodapé com identificação obrigatória ---------- */
  function montarRodape(clinica) {
    var alvo = document.getElementById('rodape-site');
    if (!alvo) { return; }

    var horario = clinica.horario.map(function (h) {
      return esc(h.dias) + ', ' + esc(h.horas);
    }).join('<br>');

    var dpo = '';
    if (clinica.dpo) {
      dpo = 'Encarregado de dados (DPO): ' + esc(clinica.dpo.nome) +
        ' — ' + esc(clinica.dpo.email) + '. ';
    }

    alvo.innerHTML =
      '<footer class="rodape"><div class="miolo">' +
      '<div><img src="https://eixoneuro.com.br/wp-content/uploads/2025/04/favicon2-150x150.png" alt="" width="150" height="150" loading="lazy">' +
      '<p>' + esc(clinica.nome_fantasia) + '<br>' + esc(clinica.endereco.cidade) + ', ' + esc(clinica.endereco.uf) + '</p></div>' +
      '<div><p class="legenda">Horário</p><p>' + horario + '</p></div>' +
      '<div><p class="legenda">Contato</p>' +
      '<p><a href="' + linkTelefone(clinica) + '">' + esc(clinica.telefone_exibicao) + '</a><br>' +
      (ehPlaceholder(clinica.email) ? '' : '<a href="mailto:' + esc(clinica.email) + '">' + esc(clinica.email) + '</a>') + '</p>' +
      '<div class="redes">' +
      (clinica.redes_sociais && clinica.redes_sociais.instagram
        ? '<a href="' + esc(clinica.redes_sociais.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram da clínica">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm6.4-8.4a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0zM21.9 8c-.1-1.6-.4-3-1.6-4.2S17.6 2.3 16 2.2C14.4 2.1 9.6 2.1 8 2.2 6.4 2.3 5 2.6 3.8 3.8S2.3 6.4 2.2 8c-.1 1.6-.1 6.4 0 8 .1 1.6.4 3 1.6 4.2s2.6 1.5 4.2 1.6c1.6.1 6.4.1 8 0 1.6-.1 3-.4 4.2-1.6s1.5-2.6 1.6-4.2c.1-1.6.1-6.4 0-8zm-2.1 9.7c-.3.9-1 1.5-1.9 1.9-1.3.5-4.4.4-5.9.4s-4.6.1-5.9-.4c-.9-.3-1.5-1-1.9-1.9-.5-1.3-.4-4.4-.4-5.9s-.1-4.6.4-5.9c.3-.9 1-1.5 1.9-1.9 1.3-.5 4.4-.4 5.9-.4s4.6-.1 5.9.4c.9.3 1.5 1 1.9 1.9.5 1.3.4 4.4.4 5.9s.1 4.6-.4 5.9z"/></svg></a>'
        : '') +
      '<a href="' + linkWhatsApp(clinica) + '" target="_blank" rel="noopener" aria-label="WhatsApp da clínica">' + ICONE_WHATS + '</a>' +
      '</div></div>' +
      '<div><p class="legenda">Endereço</p><p>' + esc(clinica.endereco.edificio) + ' — ' + esc(clinica.endereco.bloco) + '<br>' +
      esc(clinica.endereco.salas) + ' · ' + esc(clinica.endereco.logradouro) + '<br>' +
      esc(clinica.endereco.bairro) + ', ' + esc(clinica.endereco.cidade) + '-' + esc(clinica.endereco.uf) +
      ' · CEP ' + esc(clinica.endereco.cep) + '</p></div>' +
      '</div>' +
      '<div class="rodape__identificacao">' +
      '<p><strong>' + esc(clinica.razao_social) + '</strong> · Nome fantasia: ' + esc(clinica.nome_fantasia) +
      ' · CNPJ ' + esc(clinica.cnpj) +
      ' · Inscrição de pessoa jurídica no CRM-DF: ' + esc(clinica.crm_pj) + '</p>' +
      '<p>Diretor(a) técnico(a): ' + esc(clinica.diretor_tecnico.nome) + ' — CRM-DF ' + esc(clinica.diretor_tecnico.crm) + '</p>' +
      '<p>' + esc(clinica.endereco.completo) + ' · Telefone: ' + esc(clinica.telefone_exibicao) + '</p>' +
      '<p>' + dpo + 'Canal de atendimento ao consumidor: WhatsApp ' + esc(clinica.telefone_exibicao) + '.</p>' +
      '<p>As informações deste site têm caráter informativo e não substituem uma consulta médica. Em caso de dúvidas ou sintomas, procure um médico.</p>' +
      '<p><a href="privacidade.html">Política de privacidade</a> · <a href="politica-atendimento.html">Política de atendimento, cancelamento e reembolso</a></p>' +
      '</div>' +
      '<div class="rodape__base"><span>© <span id="ano-rodape"></span> ' + esc(clinica.nome_fantasia) + '</span>' +
      '<a href="#top">Voltar ao topo</a></div></footer>';

    var ano = document.getElementById('ano-rodape');
    if (ano) { ano.textContent = String(new Date().getFullYear()); }
  }

  /* ---------- WhatsApp flutuante (desktop) ---------- */
  function montarZapFlutuante(clinica) {
    var a = document.createElement('a');
    a.className = 'zap-flutuante';
    a.href = linkWhatsApp(clinica);
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Falar com a clínica pelo WhatsApp');
    a.innerHTML = ICONE_WHATS;
    document.body.appendChild(a);
  }

  /* ---------- tamanho da fonte ---------- */
  var NIVEIS_FONTE = ['', 'maior', 'max'];
  function aplicarFonteSalva() {
    try {
      var salvo = localStorage.getItem('eixo-fonte');
      if (salvo && NIVEIS_FONTE.indexOf(salvo) > 0) {
        document.documentElement.setAttribute('data-fonte', salvo);
      }
    } catch (e) { /* armazenamento indisponível */ }
  }
  function alternarFonte() {
    var atual = document.documentElement.getAttribute('data-fonte') || '';
    var proximo = NIVEIS_FONTE[(NIVEIS_FONTE.indexOf(atual) + 1) % NIVEIS_FONTE.length];
    if (proximo) { document.documentElement.setAttribute('data-fonte', proximo); }
    else { document.documentElement.removeAttribute('data-fonte'); }
    try { localStorage.setItem('eixo-fonte', proximo); } catch (e) { /* ok */ }
  }

  /* ---------- privacidade: sem rastreadores por padrão ----------
     O site não usa cookies de rastreamento nem analytics.
     Se um dia for adicionado Google Analytics/Pixel, o script só
     pode ser carregado dentro de carregarScriptsDeMedicao(), que
     roda apenas depois do consentimento registrado no banner. */
  function montarBannerPrivacidade() {
    var decidido = null;
    try { decidido = localStorage.getItem('eixo-consentimento'); } catch (e) { /* ok */ }
    if (decidido) {
      if (decidido === 'aceito') { carregarScriptsDeMedicao(); }
      return;
    }
    var banner = document.createElement('div');
    banner.className = 'banner-cookies';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Aviso de privacidade');
    banner.innerHTML =
      '<p>Este site não usa cookies de rastreamento nem ferramentas de medição por padrão. ' +
      'Guardamos no seu navegador apenas preferências de exibição (como o tamanho da letra). ' +
      'Saiba mais na <a href="privacidade.html">política de privacidade</a>.</p>' +
      '<div class="acoes">' +
      '<button type="button" class="botao botao--cheio botao--mini" data-escolha="aceito">Entendi</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var alvo = e.target.closest('[data-escolha]');
      if (!alvo) { return; }
      try { localStorage.setItem('eixo-consentimento', alvo.getAttribute('data-escolha')); } catch (err) { /* ok */ }
      banner.remove();
      if (alvo.getAttribute('data-escolha') === 'aceito') { carregarScriptsDeMedicao(); }
    });
    document.body.appendChild(banner);
  }
  function carregarScriptsDeMedicao() {
    // Vazio de propósito: nenhum rastreador instalado.
    // Adicione aqui (e somente aqui) scripts de analytics, se necessário.
  }

  /* ---------- preenchimento genérico a partir de clinica.json ----------
     Qualquer elemento com data-clinica="caminho.pontuado" recebe o valor
     correspondente de clinica.json (arrays viram lista separada por vírgula).
     Assim, valores, políticas e contatos nunca ficam fixos no HTML. */
  function valorPorCaminho(objeto, caminho) {
    return caminho.split('.').reduce(function (atual, chave) {
      return atual == null ? atual : atual[chave];
    }, objeto);
  }
  function preencherDadosClinica(clinica) {
    document.querySelectorAll('[data-clinica]').forEach(function (el) {
      var valor = valorPorCaminho(clinica, el.getAttribute('data-clinica'));
      if (valor == null) { return; }
      if (Array.isArray(valor)) { valor = valor.join(', '); }
      el.textContent = String(valor);
    });
    document.querySelectorAll('[data-clinica-tel]').forEach(function (el) {
      el.setAttribute('href', linkTelefone(clinica));
    });
    document.querySelectorAll('[data-clinica-whats]').forEach(function (el) {
      var msg = el.getAttribute('data-clinica-whats');
      el.setAttribute('href', linkWhatsApp(clinica, msg || null));
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    });
  }

  /* ---------- inicialização ---------- */
  aplicarFonteSalva();

  document.addEventListener('DOMContentLoaded', function () {
    document.body.insertAdjacentHTML('afterbegin', SIMBOLO_GRAFISMO);
    carregarJSON('data/clinica.json').then(function (clinica) {
      montarCabecalho(clinica);
      montarBarraMobile(clinica);
      montarZapFlutuante(clinica);
      montarRodape(clinica);
      preencherDadosClinica(clinica);
      montarBannerPrivacidade();
      document.dispatchEvent(new CustomEvent('eixo:pronto', { detail: { clinica: clinica } }));
    }).catch(function (erro) {
      console.error(erro);
    });
  });

  /* API interna usada pelas outras páginas */
  window.EIXO = {
    carregarJSON: carregarJSON,
    esc: esc,
    ehPlaceholder: ehPlaceholder,
    linkWhatsApp: linkWhatsApp,
    linkTelefone: linkTelefone,
    linhaRegistro: linhaRegistro,
    linhasEspecialidade: linhasEspecialidade,
    generoMedico: generoMedico,
    linkLattes: linkLattes,
    ICONE_WHATS: ICONE_WHATS,
    ICONE_TEL: ICONE_TEL
  };
})();
