# Eixo — Neurologia Especializada · Site institucional

Site estático (HTML5 + CSS + JavaScript vanilla, sem build) da clínica
neurológica particular **Eixo**, no Centro Clínico Lúcio Costa, Bloco 2,
Asa Sul, Brasília-DF. Não atende convênios: consultas, exames (ENMG) e
procedimentos (punção lombar, tap test) particulares.

## Estrutura

```
index.html                    Home: hero · a clínica · especialidades · equipe ·
                              outras especialidades · blog · exames (ao final) · contato
equipe.html                   Equipe com filtros por queixa/serviço e modal de mini currículo
exames-procedimentos.html     ENMG, punção lombar e tap test (renderizados de /data)
primeira-consulta.html        Guia da primeira consulta + checklist imprimível
receitas-laudos.html          Perguntas e respostas sobre documentos
blog.html · post.html         Blog: listagem e artigo (renderizados de data/blog.json)
contato.html                  Endereço, mapa, instruções do Bloco 2, formulário sem backend
privacidade.html              LGPD  ·  politica-atendimento.html  CDC
css/estilo.css                Design system (paleta creme/ocre/menta/petróleo)
js/comum.js                   Cabeçalho, rodapé (identificação CFM), banner de privacidade, A+
js/equipe.js  js/exames.js  js/inicio.js  js/contato.js  js/blog.js
data/*.json                   TODO o conteúdo variável (nada de médico no HTML)
scripts/check-content.js      Verificação de conformidade (ver CONTENT-RULES.md)
sitemap.xml  robots.txt       SEO
img/                          Imagens locais (equipe, como-chegar) — ver img/README.md
```

## Como rodar localmente

O site lê os JSON via `fetch`, então precisa de um servidor HTTP (abrir o
arquivo direto com `file://` não funciona):

```bash
python3 -m http.server 8080        # ou: npx serve .
# abra http://localhost:8080
```

## Como editar o conteúdo (arquivos em /data)

- **`clinica.json`** — razão social, CNPJ, CRM-PJ, diretor técnico, endereço,
  telefones/WhatsApp (E.164 + mensagem pré-preenchida), horários, valores,
  políticas de cancelamento, links de mapa, redes sociais, DPO.
- **`medicos.json`** — um objeto por médico. Campos obrigatórios: `id` (slug),
  `nome`, `crm`, `uf` e **`rqe`** (ou `"nao_especialista": true`, que exibe a
  linha NÃO ESPECIALISTA e zera `queixas_leigas`). `queixas_leigas` alimenta
  o bloco “Como podemos ajudar” e os filtros — só liste queixas cobertas pelo
  RQE do médico. Marque **exatamente um** médico com
  `"diretor_tecnico": true` e aponte `clinica.json → diretor_tecnico.medico_id`
  para ele. `"revisado": false` exibe aviso de revisão no mini currículo.
- **`exames.json` / `procedimentos.json`** — campos autoexplicativos
  (preparo, o que trazer, contraindicações a avisar, pós-exame, prazo do
  laudo, valor, `medicos[]` com ids de `medicos.json`). Enquanto
  `"revisado": false`, a seção mostra o banner “conteúdo em revisão”.
- **`outros-profissionais.json`** — especialidades parceiras exibidas na home
  (o campo `icone` escolhe o ícone do design system em `js/inicio.js`).
- **`especialidades.json`** — as áreas neurológicas da home, com descrição e
  `medicos[]` (ids de `medicos.json`) para a linha "quem atende".
- **Blog** — dois arquivos por publicação (estrutura leve, boa para
  Core Web Vitals):
  1. Uma entrada em **`blog-indice.json`**: `slug` (vira a URL
     `post.html?post=slug`), `titulo`, `resumo` (≤160 caracteres — vira a
     meta description), `data` (AAAA-MM-DD), `autor` (id de `medicos.json`,
     exibido com CRM/RQE, ou `null` para material assinado pela equipe),
     `tags[]`, `condicao` (nome da doença para o schema
     `MedicalCondition`) e `revisado`.
  2. Um arquivo **`blog/<slug>.json`** com `corpo[]` — blocos
     `{"tipo": "paragrafo"|"subtitulo"|"lista", "texto"|"itens"}` — e
     `referencias[]` (`{texto, links: [{rotulo, url}]}` com DOI/PubMed;
     citações fortalecem o E-E-A-T e viram `citation` no JSON-LD).

  Depois de publicar ou editar um post: `npm run check-content` e
  `npm run gerar-sitemap` (o sitemap lista cada artigo), e solicite a
  indexação da URL no Google Search Console. Escreva em tom informativo e
  sóbrio; todo artigo recebe automaticamente o aviso "conteúdo
  informativo, não substitui consulta", a caixa de autor e os dados
  estruturados (`MedicalWebPage` + `BreadcrumbList`).

Depois de qualquer edição, rode a verificação:

```bash
npm run check-content     # ou: node scripts/check-content.js
```

O script falha com termos proibidos (Res. CFM 2.336/2023) ou dados de médico
incompletos, e lista as pendências (`[PLACEHOLDER]`, `"revisado": false`).

## Antes de publicar — pendências obrigatórias

`npm run check-content` deve terminar **sem erros e sem pendências**:

1. Preencher todos os `[PLACEHOLDER — …]` (DPO, e-mail, valores, prazos,
   políticas, RQE dos profissionais parceiros, duração da consulta,
   instruções de estacionamento/acessibilidade física). CRM-PJ (8637) e
   diretora técnica (Dra. Márcia Neiva) já vêm do certificado do CRM-DF.
2. Validar currículos e textos de exames com os médicos e trocar
   `"revisado": false` para `true`.
3. Adicionar fotos reais (equipe, fachada e placa do **Bloco 2**, porta da
   clínica) em `/img/` — WebP com fallback, `loading="lazy"`, `width/height`
   explícitos e `alt` descritivo (ver `img/README.md`).
4. Hospedar as fontes licenciadas (Aspekta, Ultra System Sans) em `/fonts/` e
   descomentar os `@font-face` no topo de `css/estilo.css` (sem CDN).
5. Rodar Lighthouse mobile: meta ≥ 90 em Performance, Acessibilidade,
   Boas práticas e SEO.

## Checklist final de conformidade

- [ ] Identificação obrigatória (razão social, CRM-PJ, diretor técnico,
      endereço, telefone, CNPJ) em toda página — rodapé + faixa na home
- [ ] Um único diretor técnico
- [ ] Nenhum médico sem CRM/RQE ou sem “NÃO ESPECIALISTA”
- [ ] Modal da equipe navegável por teclado (Tab preso, Esc fecha, foco volta)
- [ ] Mapa e instrução “a entrada é pelo Bloco 2” na home e no contato
- [ ] Banner de emergência (192/SAMU) visível
- [ ] `npm run check-content` sem termos proibidos
- [ ] Lighthouse ≥ 90 no mobile nas quatro categorias

## Publicação

Qualquer hospedagem estática serve (GitHub Pages, Netlify, Cloudflare
Pages ou o próprio servidor atual). Publique a raiz do repositório; não há
etapa de build. Após publicar, confira `https://eixoneuro.com.br/sitemap.xml`
e envie no Google Search Console.

## Google Business Profile (SEO local)

1. Em [business.google.com](https://business.google.com), reivindique/edite o
   perfil “Eixo Neurologia Especializada”.
2. **Site**: aponte para `https://eixoneuro.com.br/`.
3. **Endereço/pin**: arraste o pin até o **Bloco 2** do Centro Clínico Lúcio
   Costa (não o centro do complexo). Em “Endereço”, inclua “Bloco 2, Salas
   136 a 138”.
4. Adicione fotos da fachada e da **placa do Bloco 2** — elas aparecem no
   Maps e reduzem pacientes perdidos.
5. Preencha horários (seg–sex 7h30–18h30; sáb 8h–12h) e categorias
   (“Neurologista”, “Clínica médica”).
6. Copie o `place_id` do perfil para `clinica.json →
   google_maps_place_url` caso mude.
7. Lembrete de conformidade: **não** solicite nem responda avaliações com
   conteúdo clínico; o site não exibe notas/avaliações (vedado pela
   Res. CFM 2.336/2023).

## SEO para saúde (YMYL) — rotina recomendada

Sites de saúde são avaliados pelo Google com critérios reforçados (YMYL /
E-E-A-T). O que este site já implementa: autoria médica identificada com
CRM/RQE e mini currículo em cada artigo, referências científicas com
DOI/PubMed, dados estruturados (`MedicalClinic`, `Physician`,
`MedicalWebPage` + `MedicalCondition`, `BreadcrumbList`, `FAQPage` na
página de documentos), canonical e meta description por artigo, sitemap
com todos os posts, mobile-first (barra fixa de WhatsApp/telefone) e
nenhum rastreador sem consentimento (LGPD).

Rotina após o lançamento:

1. **HTTPS obrigatório** — confirme o certificado SSL no domínio.
2. **Google Search Console** — cadastre a propriedade, envie o
   `sitemap.xml` e solicite indexação de cada artigo novo; monitore
   erros de rastreamento e as consultas que trazem pacientes.
3. **Google Business Profile** — seção própria abaixo.
4. **PageSpeed Insights / Lighthouse mobile** — meta ≥ 90; os pontos que
   dependem de vocês: hospedar as imagens em `/img/` como WebP
   comprimido (hoje o logo e as fotos vêm do WordPress antigo) e as
   fontes em `/fonts/`.
5. **Google Analytics 4** (opcional) — só carregue dentro de
   `carregarScriptsDeMedicao()` em `js/comum.js`, que roda apenas após o
   consentimento do banner (LGPD).
6. **Pautas novas** — parta das perguntas reais dos pacientes
   (AnswerThePublic, caixa "as pessoas também perguntam" do Google) e
   responda em linguagem simples, como nos artigos atuais.
7. **Screaming Frog** (opcional) — varredura periódica de links
   quebrados e títulos duplicados.

## Regras de conteúdo

Leia `CONTENT-RULES.md` antes de escrever qualquer texto novo. Em resumo:
tom sóbrio, sem superlativos, sem promessa de resultado, sem depoimentos,
médicos sempre identificados com CRM + RQE, e **nunca inventar CRM, RQE,
preço ou endereço** — na dúvida, `[PLACEHOLDER]`.
