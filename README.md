# Gerador de Planejamento · Serafina

App web client-side (React 18) para montar planejamentos de conteúdo: upload do briefing, design system, edição dos posts, preview e exportação.

> **Importante:** este projeto é 100% estático. Não há etapa de build — o React e o JSX são carregados e transpilados no navegador via Babel Standalone. Isso significa **deploy sem configuração** (zero build), mas a transpilação acontece no cliente (primeiro carregamento um pouco mais lento). Veja [Otimização para produção](#otimização-para-produção-opcional) se quiser remover o Babel do runtime.

## Estrutura dos arquivos

```
.
├── index.html      # Ponto de entrada — carrega React, Babel e App.jsx
├── App.jsx         # Todo o código React (store + painéis + canvas), em ordem de carga
├── styles.css      # Folha de estilos completa
├── vercel.json     # Config estática do Vercel
└── README.md
```

`App.jsx` é a concatenação, **na ordem correta de carregamento**, dos módulos originais:
`store → canvas → panel-plans → panel-upload → panel-design → panel-editor → panel-preview → export-posts → main`.
Todos compartilham escopo global (`window`), por isso a ordem importa.

## Rodar localmente

Como tudo é estático, basta servir a pasta com qualquer servidor HTTP (não abra via `file://` — o `fetch` do `App.jsx` precisa de HTTP):

```bash
# Opção 1: Python
python3 -m http.server 5173

# Opção 2: Node (npx)
npx serve .

# depois abra http://localhost:5173
```

## Deploy no GitHub

```bash
cd export                 # ou a pasta onde estão estes arquivos
git init
git add .
git commit -m "Gerador de Planejamento — versão estática"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

## Deploy no Vercel

**Pela interface (mais simples):**
1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório do GitHub.
2. Em **Framework Preset**, escolha **Other**.
3. Deixe **Build Command** e **Output Directory** em branco (é site estático).
4. Clique em **Deploy**.

**Pela CLI:**
```bash
npm i -g vercel
vercel          # preview
vercel --prod   # produção
```

## Otimização para produção (opcional)

O setup atual prioriza simplicidade. Para um app mais rápido em produção, considere migrar para um bundler (Vite):

1. `npm create vite@latest` (template React).
2. Mova o conteúdo de `App.jsx` para `src/` (separando de novo em componentes, se quiser).
3. Importe `styles.css` no entry e troque o React/Babel via CDN por dependências locais.
4. No Vercel, use Build Command `npm run build` e Output Directory `dist`.

Isso remove o Babel do navegador e gera um bundle minificado.
