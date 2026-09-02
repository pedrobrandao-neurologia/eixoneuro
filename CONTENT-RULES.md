# Regras de conteúdo — Eixo Neurologia Especializada

Estas regras valem para **todas as páginas do site, os arquivos de `/data/` e
qualquer rede social linkada**. Base: **Resolução CFM 2.336/2023** (publicidade
médica), manual da Codame, **LGPD** e **CDC**. O CRM-DF fiscaliza.

Verificação automática: `npm run check-content` (ou `node scripts/check-content.js`).
O script falha (exit 1) se encontrar termos proibidos ou dados de médico
incompletos, e lista pendências (`[PLACEHOLDER …]`, `"revisado": false`,
diretor técnico indefinido) que **bloqueiam a publicação** mesmo sem falhar.

## 1. Identificação obrigatória

### 1.1 Da clínica (art. 5º) — em todas as páginas
- Razão social e nome fantasia
- Nº de inscrição da pessoa jurídica no CRM-DF
- Nome e CRM-DF do diretor técnico (obrigatoriamente um médico; **um só**)
- Endereço completo e telefone
- CNPJ (exigência do CDC)

No site: rodapé de todas as páginas (montado por `js/comum.js` a partir de
`data/clinica.json`) + faixa de identificação logo abaixo do hero na home.

### 1.2 De cada médico (art. 4º) — em todo lugar onde for citado
- Nome completo
- “CRM-DF nº XXXXX” seguido da palavra **MÉDICO** (ou MÉDICA)
- Especialidade e/ou área de atuação registrada, seguida de “RQE nº XXXXX”
- Formação em área **sem** RQE pode ser citada, mas com a linha
  **NÃO ESPECIALISTA** logo abaixo (`"nao_especialista": true` no JSON)
- **Nenhum médico pode ser vinculado a doença/órgão específico** (“trata
  epilepsia”, “trata Parkinson”) sem o RQE correspondente. No site, o
  mapeamento “queixa leiga → médico” deriva de `queixas_leigas` em
  `medicos.json`, que **só pode conter itens compatíveis com a
  especialidade/área com RQE** do médico. Médico com
  `nao_especialista: true` deve ter `queixas_leigas: []` (o script falha
  se não tiver).

## 2. Permitido (sempre em tom sóbrio)
- Informar **valores** de consultas, exames e procedimentos e as formas de
  pagamento (sem tom promocional)
- Fotos **reais** do ambiente e da equipe
- Anunciar equipamentos, restrito às indicações aprovadas pela **Anvisa**
  (ex.: aparelho de ENMG)
- Titulações **concluídas** (mestrado, doutorado, pós-graduações). Formação
  em curso pode ser citada como “em curso”, sem implicar especialidade.

## 3. Proibido — o script bloqueia
- Promessa de resultado: “cura”, “tratamento definitivo”, “garantia”
- Autopromoção comparativa: “melhor clínica”, “referência em Brasília”,
  “top”, rankings, “médico do ano”, prêmios e selos promocionais
- **Depoimentos de pacientes**, estrelas ou notas de avaliação
- Imagens ou relatos de “antes e depois”
- Preços promocionais sensacionalistas (“desconto só hoje”, “promoção”)
- Divulgação de medicamentos, marcas ou dispositivos com fins comerciais
- Qualquer conteúdo que **identifique paciente** (foto, nome, caso clínico
  reconhecível) — mesmo com autorização, evitar

Termos varridos pelo script (erro): `melhor`, `cura(r)`, `garant…`,
`definitiv…`, `referência`, `prêmi…`, `top`, `ranking`, `médico do ano`,
`depoimento`, `antes e depois`, `desconto`, `promoção`, `sensacional`.
Termos de revisão manual (aviso): `excelência`, `eficaz`, `líder`,
`milagr…`, `incrível`.

> Nota: o script ignora código (`<script>`, `<style>`, atributos `style=`);
> “melhora” (evolução de sintoma) e “procure um pronto-socorro” não disparam
> os padrões, que usam limite de palavra.

## 4. Outras obrigações
- **LGPD**: política de privacidade com DPO identificado; dados de saúde são
  sensíveis (base legal: tutela da saúde); formulários **não** pedem “motivo
  da consulta” em campo livre — só assunto em lista fechada; nenhum dado de
  formulário é armazenado no site (apenas encaminhado via WhatsApp/e-mail);
  nenhum rastreador é carregado sem consentimento (ver
  `carregarScriptsDeMedicao()` em `js/comum.js`).
- **CDC**: CNPJ, endereço físico e canal de atendimento visíveis; política de
  cancelamento e reembolso explícita (`politica-atendimento.html`).
- **Acessibilidade** (Lei 13.146/2015, WCAG 2.1 AA): contraste ≥ 4,5:1 —
  atenção: o ocre `#938561` **não** pode ser usado como cor de texto sobre o
  creme (contraste ≈ 3:1); use `--ocre-escuro` ou reserve o ocre a elementos
  decorativos. Navegação completa por teclado (inclusive no modal), foco
  visível, `alt` em imagens, fonte base ≥ 16 px, botão A+ de fonte,
  `prefers-reduced-motion` respeitado, sem carrossel automático, skip link.
- **Telemedicina** (Res. CFM 2.314/2022): o site **não menciona**
  teleconsulta. Só adicionar se a clínica oferecer, informando que é
  modalidade complementar e que exige consentimento.

## 5. Regra de ouro dos dados
**Nunca inventar CRM, RQE, preço, endereço ou título.** Onde faltar dado
real, escrever `[PLACEHOLDER — descrição do que falta]`. O script lista
todos os placeholders; a publicação só ocorre com a lista zerada.
