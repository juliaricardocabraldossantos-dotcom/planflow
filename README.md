# Gerador de Planejamento — Serafina

Ferramenta de geração e edição de posts de Instagram a partir de planejamentos em .txt.

## Como rodar localmente

Por usar Babel in-browser, precisa de um servidor HTTP simples (não abre direto pelo file://):

```bash
# Opção 1 — Python
python3 -m http.server 8000

# Opção 2 — Node
npx serve .

# Opção 3 — qualquer servidor estático
```

Depois abra http://localhost:8000/Gerador%20de%20Planejamento.html

## Estrutura

- `Gerador de Planejamento.html` — entrypoint
- `app.css` — todos os estilos
- `main.jsx` — App root + tabs
- `store.jsx` — state management, parsing, helpers
- `canvas.jsx` — renderer do post canvas (4:5)
- `panel-*.jsx` — cada aba (Arquivo, Upload, Design, Editor, Preview)
- `export-posts.jsx` — exportação PNG/PPTX
- `design-system/` — UI kit Serafina (cores, fontes, logos)

## Stack

- React 18 (via CDN, sem build)
- Babel standalone (transpila JSX em runtime)
- html2canvas + JSZip + PptxGenJS (carregados sob demanda)
- Persistência: window.storage (cross-device) ou localStorage

Gerado em 2026-06-09T00:22:45.059Z.


## Arquivos faltantes

- Gerador de Planejamento.html
- app.css
- main.jsx
- store.jsx
- canvas.jsx
- panel-plans.jsx
- panel-upload.jsx
- panel-design.jsx
- panel-editor.jsx
- panel-preview.jsx
- export-posts.jsx
- design-system/colors_and_type.css
- design-system/assets/logo-principal-cosmic-latte.png
- design-system/assets/logo-principal-night.png
- design-system/assets/logo-symbol-cosmic-latte.png
- design-system/assets/logo-symbol-infinity-blue.png
- design-system/assets/logo-symbol-night.png
- design-system/fonts/Apercu-Light.otf
- design-system/fonts/Apercu-Regular.otf
- design-system/fonts/Apercu-Italic.otf
- design-system/fonts/Apercu-Medium.otf
- design-system/fonts/Apercu-Bold.otf
- design-system/fonts/Apercu-Mono.otf
- design-system/fonts/Authentive.otf
- design-system/fonts/HankenGrotesk-VariableFont_wght.ttf
