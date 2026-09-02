# Imagens do site

Coloque aqui as imagens locais, otimizadas:

- `equipe/<slug-do-medico>.webp` — foto de cada médico (quadrada, ~600×600).
  Depois, preencha o campo `"foto"` em `data/medicos.json`
  (ex.: `"img/equipe/pedro-brandao.webp"`). Sem foto, o site mostra um
  avatar com as iniciais.
- `como-chegar/fachada-bloco-2.webp`, `como-chegar/placa-bloco-2.webp`,
  `como-chegar/porta-clinica.webp` — fotos reais da chegada, usadas em
  `contato.html`.
- `clinica/…` — fotos reais do ambiente (recepção, consultórios).

Regras (performance e acessibilidade):
- Formato **WebP** com fallback JPEG quando necessário
  (`<picture><source type="image/webp">…`).
- Sempre `width` e `height` explícitos e `loading="lazy"` (exceto a primeira
  imagem do hero, que usa `fetchpriority="high"`).
- `alt` descritivo em toda imagem informativa; `alt=""` nas decorativas.
- Fotos apenas do ambiente e da equipe — **nunca** de pacientes
  (Res. CFM 2.336/2023).
