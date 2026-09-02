#!/usr/bin/env node
/* =============================================================
   gerar-sitemap.js — regenera o sitemap.xml
   Uso: node scripts/gerar-sitemap.js  (ou: npm run gerar-sitemap)
   Inclui as páginas fixas e TODOS os artigos do blog
   (data/blog-indice.json). Rode após publicar ou editar posts e
   reenvie o sitemap no Google Search Console.
   ============================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const BASE = 'https://eixoneuro.com.br';
const HOJE = new Date().toISOString().slice(0, 10);

const PAGINAS = [
  { loc: '/', changefreq: 'monthly', priority: '1.0' },
  { loc: '/equipe.html', changefreq: 'monthly', priority: '0.9' },
  { loc: '/exames-procedimentos.html', changefreq: 'monthly', priority: '0.9' },
  { loc: '/primeira-consulta.html', changefreq: 'monthly', priority: '0.8' },
  { loc: '/receitas-laudos.html', changefreq: 'monthly', priority: '0.7' },
  { loc: '/contato.html', changefreq: 'monthly', priority: '0.8' },
  { loc: '/blog.html', changefreq: 'weekly', priority: '0.7' },
];

const indice = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'blog-indice.json'), 'utf8'));

const urls = PAGINAS.map((p) => ({ ...p, lastmod: HOJE }))
  .concat(indice.map((post) => ({
    loc: '/post.html?post=' + encodeURIComponent(post.slug),
    lastmod: post.data,
    changefreq: 'yearly',
    priority: '0.6',
  })));

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) =>
    '  <url>\n' +
    '    <loc>' + BASE + u.loc.replace(/&/g, '&amp;') + '</loc>\n' +
    '    <lastmod>' + u.lastmod + '</lastmod>\n' +
    '    <changefreq>' + u.changefreq + '</changefreq>\n' +
    '    <priority>' + u.priority + '</priority>\n' +
    '  </url>'
  ).join('\n') + '\n</urlset>\n';

fs.writeFileSync(path.join(RAIZ, 'sitemap.xml'), xml);
console.log('sitemap.xml gerado com ' + urls.length + ' URLs (' + indice.length + ' artigos do blog).');
