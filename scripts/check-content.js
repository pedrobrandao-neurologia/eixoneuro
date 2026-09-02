#!/usr/bin/env node
/* =============================================================
   check-content.js — verificação de conformidade do conteúdo
   Uso: node scripts/check-content.js   (ou: npm run check-content)

   O que faz:
   1. Procura termos vedados pela Resolução CFM 2.336/2023 nas
      páginas HTML e nos JSON de /data (ver CONTENT-RULES.md).
   2. Valida medicos.json: todo médico precisa de `crm` e de
      `rqe` (ou `nao_especialista: true`); médico sem RQE não
      pode ter `queixas_leigas`.
   3. Confere o diretor técnico (deve haver exatamente um).
   4. Lista pendências: [PLACEHOLDER …] e conteúdos com
      "revisado": false, que precisam ser resolvidos antes da
      publicação.

   Sai com código 1 se houver ERROS. Pendências (avisos) não
   derrubam a verificação, mas bloqueiam a publicação — veja o
   checklist do README.md.
   ============================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const erros = [];
const avisos = [];

/* ---------- 1. termos proibidos ---------- */
// Cada item: [regex, explicação]. Usamos \b para não pegar palavras
// legítimas: "melhora" (evolução do sintoma) não casa com \bmelhor\b,
// "procure um pronto-socorro" não casa com \bcura\b, "topo" não casa
// com \btop\b.
// Erros: padrões inequivocamente promocionais/vedados. Afirmações
// científicas legítimas ("melhor sobrevida", "ainda não há cura",
// "garantir alimentação segura", "Referências" bibliográficas) NÃO
// disparam erro — caem, quando ambíguas, na lista de revisão manual.
const PROIBIDOS = [
  // superlativo sobre o serviço/prestador ("a melhor clínica", "melhor neurologista de Brasília")
  [/\bmelhor(es)?\s+(cl[íi]nica|consult[óo]rio|m[ée]dic[oa]s?|equipe|atendimento|hospital|neurologistas?|profissiona(l|is))\b/gi, 'superlativo sobre o serviço — autopromoção vedada'],
  [/\bmelhor(es)?\s+d[aoe]s?\s+(cidade|df|bras[íi]lia|regi[ãa]o|pa[íi]s)\b/gi, 'superlativo comparativo — autopromoção vedada'],
  // promessa de cura (nega­ções como "não há cura" são permitidas)
  [/(?<!n[ãa]o\s+h[áa]\s+|n[ãa]o\s+tem\s+|n[ãa]o\s+t[êe]m\s+|sem\s+|ainda\s+n[ãa]o\s+existe\s+)\bcura(mos)?\b/gi, 'promessa de cura — vedada'],
  [/\bcura(r|do|da|dos|das)\b/gi, 'promessa de cura — vedada'],
  // garantia de resultado
  [/\bgarant\w*\s+(de\s+)?(resultado|sucesso|cura|melhora|recupera[çc])/gi, 'garantia de resultado — vedada'],
  [/resultado(s)?\s+garantido(s)?/gi, 'garantia de resultado — vedada'],
  [/definitiv/gi, '"definitivo" sugere promessa de resultado — vedado'],
  // autopromoção "referência" (uso bibliográfico e "Centro de Referência" são permitidos)
  [/\b([ée]|somos|seja|sendo|considerad[oa]s?|torn(a|ou)-se)\s+(uma\s+|um\s+|a\s+|o\s+)?refer[êe]ncia\b/gi, '"é/somos referência" — autopromoção vedada'],
  [/(?<!centro\s+de\s+)\brefer[êe]ncia\s+(em|no|na)\s+(bras[íi]lia|neurologia|sa[úu]de|df)\b/gi, '"referência em..." — autopromoção vedada'],
  [/pr[êe]mi/gi, 'prêmios/selos promocionais — vedados'],
  [/\btop\b/gi, 'ranking/"top" — vedado'],
  [/\branking(s)?\b/gi, 'rankings — vedados'],
  [/m[ée]dico(a)? do ano/gi, 'selo "médico do ano" — vedado'],
  [/depoimento/gi, 'depoimentos de pacientes — vedados'],
  [/antes e depois/gi, '"antes e depois" — vedado'],
  [/desconto/gi, 'preço promocional/desconto — tom sensacionalista vedado'],
  [/promo[çc][ãa]o|promocional/gi, 'promoções — vedadas'],
  [/sensacional/gi, 'tom sensacionalista — vedado'],
];

// Termos ambíguos que merecem revisão manual (não bloqueiam): em texto
// educativo podem ser legítimos ("melhores resultados quanto mais cedo",
// "tratamento eficaz" com referência), mas nunca em página promocional.
const SUSPEITOS = [
  [/\bmelhor(es)?\b/gi, 'comparativo "melhor" — confirmar que é afirmação científica, não autopromoção'],
  [/\bcura(r|s|do|da|dos|das)?\b/gi, 'menção a cura — confirmar contexto (negação/estado da ciência)'],
  [/\bgarant\w*/gi, 'menção a garantia — confirmar que não promete resultado'],
  [/excel[êe]ncia/gi, 'tom promocional ("excelência") — prefira descrição objetiva'],
  [/\befica(z|zes|cia)\b/gi, 'implica resultado ("eficaz") — prefira descrição objetiva'],
  [/\bl[íi]der(es)?\b/gi, 'tom promocional ("líder")'],
  [/milagr/gi, 'tom promocional'],
  [/incr[íi]vel/gi, 'tom promocional'],
];

function listarArquivos() {
  const html = fs.readdirSync(RAIZ).filter((a) => a.endsWith('.html'));
  const json = fs.readdirSync(path.join(RAIZ, 'data')).filter((a) => a.endsWith('.json'))
    .map((a) => path.join('data', a));
  const blog = fs.existsSync(path.join(RAIZ, 'data', 'blog'))
    ? fs.readdirSync(path.join(RAIZ, 'data', 'blog')).filter((a) => a.endsWith('.json'))
        .map((a) => path.join('data', 'blog', a))
    : [];
  return html.concat(json, blog);
}

function linhaDe(texto, indice) {
  return texto.slice(0, indice).split('\n').length;
}

// Em HTML, remove blocos <script>/<style> e atributos style="…" para
// não confundir código (ex.: margin-top) com conteúdo visível ao leitor.
// Em JSON, apaga os NOMES das chaves (ex.: "referencias":) para varrer
// somente os valores de texto, preservando as posições das linhas.
function textoVerificavel(arquivo, texto) {
  if (arquivo.endsWith('.json')) {
    return texto.replace(/"[A-Za-z0-9_]+"\s*:/g, (m) => ' '.repeat(m.length));
  }
  if (!arquivo.endsWith('.html')) { return texto; }
  return texto
    .replace(/<script[\s\S]*?<\/script>/gi, (b) => b.replace(/\S/g, ' '))
    .replace(/<style[\s\S]*?<\/style>/gi, (b) => b.replace(/\S/g, ' '))
    .replace(/\sstyle="[^"]*"/gi, (b) => b.replace(/\S/g, ' '));
}

const arquivos = listarArquivos();
for (const arquivo of arquivos) {
  const texto = textoVerificavel(arquivo, fs.readFileSync(path.join(RAIZ, arquivo), 'utf8'));

  for (const [regex, motivo] of PROIBIDOS) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(texto)) !== null) {
      erros.push(`${arquivo}:${linhaDe(texto, m.index)} — termo proibido "${m[0]}" (${motivo})`);
    }
  }
  for (const [regex, motivo] of SUSPEITOS) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(texto)) !== null) {
      avisos.push(`${arquivo}:${linhaDe(texto, m.index)} — revisar termo "${m[0]}" (${motivo})`);
    }
  }

  // pendências de conteúdo
  const placeholders = texto.match(/\[PLACEHOLDER[^\]]*\]/g) || [];
  if (placeholders.length) {
    avisos.push(`${arquivo} — ${placeholders.length} campo(s) [PLACEHOLDER] a preencher antes de publicar`);
  }
}

/* ---------- 2. validação de medicos.json ---------- */
function lerJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
}

const medicos = lerJSON('data/medicos.json');
const clinica = lerJSON('data/clinica.json');
const exames = lerJSON('data/exames.json');
const procedimentos = lerJSON('data/procedimentos.json');

const ids = new Set();
for (const m of medicos) {
  const rotulo = `data/medicos.json (${m.id || m.nome || 'sem id'})`;
  if (!m.id) { erros.push(`${rotulo} — campo "id" obrigatório`); }
  if (ids.has(m.id)) { erros.push(`${rotulo} — id duplicado`); }
  ids.add(m.id);
  if (!m.nome) { erros.push(`${rotulo} — campo "nome" obrigatório`); }
  if (!m.crm || String(m.crm).trim() === '') {
    erros.push(`${rotulo} — "crm" vazio: todo médico citado precisa de CRM (art. 4º, Res. CFM 2.336/2023)`);
  }
  const temRqe = m.rqe && String(m.rqe).trim() !== '';
  if (!temRqe && m.nao_especialista !== true) {
    erros.push(`${rotulo} — "rqe" vazio e "nao_especialista" não é true: defina o RQE ou marque nao_especialista`);
  }
  if (temRqe && m.nao_especialista === true) {
    avisos.push(`${rotulo} — tem RQE e nao_especialista=true ao mesmo tempo; confira`);
  }
  for (const area of m.areas_atuacao || []) {
    if (!area.rqe || String(area.rqe).trim() === '') {
      erros.push(`${rotulo} — área de atuação "${area.nome}" sem RQE: só anuncie áreas registradas`);
    }
  }
  if (m.nao_especialista === true && (m.queixas_leigas || []).length > 0) {
    erros.push(`${rotulo} — médico sem RQE não pode ser vinculado a queixas/doenças (queixas_leigas deve ficar vazio)`);
  }
  if (m.revisado === false) {
    avisos.push(`${rotulo} — currículo marcado como "revisado": false (validar com o médico antes de publicar)`);
  }
}

/* ---------- 3. diretor técnico ---------- */
const diretores = medicos.filter((m) => m.diretor_tecnico === true);
const diretorPlaceholder = /\[PLACEHOLDER/.test(String(clinica.diretor_tecnico && clinica.diretor_tecnico.nome));
if (diretores.length > 1) {
  erros.push(`data/medicos.json — ${diretores.length} médicos com diretor_tecnico=true; deve haver exatamente um`);
} else if (diretores.length === 1) {
  if (clinica.diretor_tecnico && clinica.diretor_tecnico.medico_id !== diretores[0].id) {
    avisos.push('data/clinica.json — diretor_tecnico.medico_id não aponta para o médico marcado em medicos.json');
  }
} else if (diretorPlaceholder) {
  avisos.push('PENDÊNCIA — diretor técnico ainda não definido (placeholder em clinica.json). Obrigatório antes de publicar: exatamente um médico com diretor_tecnico=true e os dados em clinica.json.');
} else {
  erros.push('Nenhum médico com diretor_tecnico=true e clinica.json sem placeholder — defina o diretor técnico');
}

/* ---------- 4. exames/procedimentos ---------- */
for (const item of exames.concat(procedimentos)) {
  const rotulo = `exames/procedimentos (${item.id})`;
  for (const idMedico of item.medicos || []) {
    if (!ids.has(idMedico)) {
      erros.push(`${rotulo} — médico "${idMedico}" não existe em medicos.json`);
    }
  }
  if (item.revisado === false) {
    avisos.push(`${rotulo} — conteúdo marcado como "revisado": false (o site exibe o aviso "conteúdo em revisão")`);
  }
}

/* ---------- blog: autores válidos e pendências de revisão ---------- */
const caminhoIndice = path.join(RAIZ, 'data', 'blog-indice.json');
if (fs.existsSync(caminhoIndice)) {
  const indiceBlog = JSON.parse(fs.readFileSync(caminhoIndice, 'utf8'));
  const slugs = new Set();
  let naoRevisados = 0;
  for (const post of indiceBlog) {
    if (slugs.has(post.slug)) { erros.push(`data/blog-indice.json — slug duplicado "${post.slug}"`); }
    slugs.add(post.slug);
    if (post.autor && !ids.has(post.autor)) {
      erros.push(`data/blog-indice.json (${post.slug}) — autor "${post.autor}" não existe em medicos.json`);
    }
    if (post.revisado_por && !ids.has(post.revisado_por)) {
      erros.push(`data/blog-indice.json (${post.slug}) — revisor "${post.revisado_por}" não existe em medicos.json`);
    }
    if (!fs.existsSync(path.join(RAIZ, 'data', 'blog', post.slug + '.json'))) {
      erros.push(`data/blog-indice.json (${post.slug}) — arquivo data/blog/${post.slug}.json não encontrado`);
    }
    if (post.revisado === false) { naoRevisados++; }
  }
  if (naoRevisados) {
    avisos.push(`data/blog-indice.json — ${naoRevisados} artigo(s) com "revisado": false (validar autoria/conteúdo com os médicos)`);
  }
}

/* ---------- clinica.json: campos de identificação ---------- */
for (const campo of ['razao_social', 'nome_fantasia', 'cnpj', 'crm_pj']) {
  const valor = clinica[campo];
  if (!valor) {
    erros.push(`data/clinica.json — campo obrigatório "${campo}" vazio (Res. CFM 2.336/2023, art. 5º / CDC)`);
  } else if (/\[PLACEHOLDER/.test(String(valor))) {
    avisos.push(`PENDÊNCIA — data/clinica.json: "${campo}" ainda é placeholder`);
  }
}

/* ---------- relatório ---------- */
console.log(`\ncheck-content — ${arquivos.length} arquivo(s) verificados, ${medicos.length} médico(s) no JSON\n`);

if (erros.length) {
  console.log(`✖ ${erros.length} ERRO(S):`);
  for (const e of erros) { console.log('  · ' + e); }
}
if (avisos.length) {
  console.log(`\n⚠ ${avisos.length} pendência(s)/aviso(s) — resolver antes de publicar:`);
  for (const a of avisos) { console.log('  · ' + a); }
}
if (!erros.length && !avisos.length) {
  console.log('✓ Nenhum problema encontrado.');
} else if (!erros.length) {
  console.log('\n✓ Nenhum termo proibido ou erro de dados. Restam as pendências acima.');
}

process.exit(erros.length ? 1 : 0);
