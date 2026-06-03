// ============================================================
// App.jsx — Gerador de Planejamento · Serafina
// Concatenação dos módulos na ordem de carga (compartilham window).
// Ordem: store → supabase-sync → auth → canvas → panel-plans → panel-upload → panel-design → panel-editor → panel-preview → export-posts → panel-auth → main
// Gerado automaticamente — edite os módulos-fonte, não este arquivo.
// ============================================================


// ╔══════════════════════════════════════════════════════════╗
// ║  store.jsx                                             ║
// ╚══════════════════════════════════════════════════════════╝

// ============================================================
// store.jsx — state, parsing, and utility helpers
// Exports to window: useAppStore, parsePlan, parseSinglePost,
// readFileText, hexToRgb, callClaude, demoPlan, FONT_OPTIONS
// ============================================================

const { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } = React;

// ----------------------------- Storage layer ----------------------------
// Unified persistence: prefers window.storage (async, cross-device) when
// available, falls back to localStorage. All consumers use the same API.

const appStorage = (() => {
  const hasRemote = typeof window !== "undefined"
    && window.storage
    && typeof window.storage.get === "function"
    && typeof window.storage.set === "function";

  return {
    hasRemote,
    async get(key) {
      if (hasRemote) {
        try {
          const r = await window.storage.get(key);
          if (r && typeof r.value === "string") return r.value;
          if (typeof r === "string") return r;
          return null;
        } catch (e) {
          console.warn("storage.get failed, falling back to localStorage:", e);
        }
      }
      try { return localStorage.getItem(key); } catch { return null; }
    },
    async set(key, value) {
      if (hasRemote) {
        try { await window.storage.set(key, value); return; }
        catch (e) { console.warn("storage.set failed, falling back to localStorage:", e); }
      }
      try { localStorage.setItem(key, value); } catch (e) {
        console.warn("localStorage.setItem failed:", e);
      }
    },
    async remove(key) {
      if (hasRemote && typeof window.storage.remove === "function") {
        try { await window.storage.remove(key); return; } catch {}
      }
      try { localStorage.removeItem(key); } catch {}
    },
  };
})();
window.appStorage = appStorage;

// Hook: persisted state that auto-syncs to appStorage on change.
// Returns [value, setValue, { loaded }] — `loaded` lets you avoid
// overwriting storage with the initial value before the first read.
function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);

  // Read once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = await appStorage.get(key);
      if (cancelled) return;
      if (raw != null) {
        try { setValue(JSON.parse(raw)); }
        catch (e) { console.warn(`Bad JSON in ${key}:`, e); }
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [key]);

  // Write on change (only after first load to avoid clobbering)
  useEffect(() => {
    if (!loaded) return;
    appStorage.set(key, JSON.stringify(value));
  }, [key, value, loaded]);

  return [value, setValue, { loaded }];
}

// ----------------------------- Constants ---------------------------------

const DEFAULT_DESIGN = /*EDITMODE-BEGIN*/{
  "brandName": "Serafina®",
  "username": "serafina.studio",
  "profileBio": "Marketing & Brands — São Paulo\nMKT Made Simple.\nBrands people remember.",
  "profileLocation": "",
  "profileAvatarUrl": null,
  "profileAvatarScale": 100,
  "profileAvatarPosX": 50,
  "profileAvatarPosY": 50,
  "profileAvatarFit": "cover",
  "primaryColor": "#1D40BA",
  "secondaryColor": "#FAF4E4",
  "textColor": "#FAF4E4",
  "overlayColor": "#151619",
  "overlayOpacity": 55,
  "overlayDirection": "to top",
  "titleFont": "Apercu",
  "subtitleFont": "Hanken Grotesk",
  "titleSize": 44,
  "subtitleSize": 16,
  "titleTransform": "uppercase",
  "titleWeight": 700,
  "contentPosition": "bottom-left",
  "contentPadding": 36,
  "contentMaxWidth": 100,
  "titleSubtitleGap": 14,
  "titleLineHeight": 1.0,
  "subtitleLineHeight": 1.35,
  "showDate": true,
  "datePosition": "top-left",
  "tagAttachment": "inline",
  "tagInlinePosition": "above",
  "tagPosition": "top-right",
  "logoUrl": "design-system/assets/logo-symbol-cosmic-latte.png",
  "logoLibrary": [
    { "id": "lib-1", "url": "design-system/assets/logo-symbol-cosmic-latte.png", "label": "Símbolo · Latte" },
    { "id": "lib-2", "url": "design-system/assets/logo-symbol-night.png", "label": "Símbolo · Night" },
    { "id": "lib-3", "url": "design-system/assets/logo-symbol-infinity-blue.png", "label": "Símbolo · Blue" },
    { "id": "lib-4", "url": "design-system/assets/logo-principal-night.png", "label": "Principal · Night" },
    { "id": "lib-5", "url": "design-system/assets/logo-principal-cosmic-latte.png", "label": "Principal · Latte" }
  ],
  "logoPosition": "top-right",
  "showLogo": true,
  "showTag": true,
  "tagStyle": "pill",
  "textBoxEnabled": false,
  "textBoxColor": "#151619",
  "textBoxOpacity": 70,
  "textBoxPadding": 20,
  "textBoxRadius": 0,
  "textBoxMode": "block",
  "textBoxSubtitle": true,
  "brandElements": [],
  "elementUrl": null,
  "elementPosition": "bottom-right",
  "elementSize": 80,
  "elementOpacity": 100,
  "showElement": false
}/*EDITMODE-END*/;

const FONT_OPTIONS = [
  // ---- Brand fonts (Serafina) ----
  { value: "Apercu", label: "Apercu", group: "Marca" },
  { value: "Hanken Grotesk", label: "Hanken Grotesk", group: "Marca" },
  { value: "Authentive", label: "Authentive · italic serif", group: "Marca" },
  { value: "Apercu Mono", label: "Apercu Mono", group: "Marca" },

  // ---- Sans-serif essentials ----
  { value: "Open Sans", label: "Open Sans", group: "Sans" },
  { value: "Inter", label: "Inter", group: "Sans" },
  { value: "Montserrat", label: "Montserrat", group: "Sans" },
  { value: "Poppins", label: "Poppins", group: "Sans" },
  { value: "DM Sans", label: "DM Sans", group: "Sans" },
  { value: "Manrope", label: "Manrope", group: "Sans" },
  { value: "IBM Plex Sans", label: "IBM Plex Sans", group: "Sans" },
  { value: "Archivo", label: "Archivo", group: "Sans" },
  { value: "Raleway", label: "Raleway", group: "Sans" },
  { value: "Lato", label: "Lato", group: "Sans" },
  { value: "Nunito", label: "Nunito", group: "Sans" },
  { value: "Nunito Sans", label: "Nunito Sans", group: "Sans" },
  { value: "Source Sans 3", label: "Source Sans 3", group: "Sans" },
  { value: "Work Sans", label: "Work Sans", group: "Sans" },
  { value: "Outfit", label: "Outfit", group: "Sans" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans", group: "Sans" },
  { value: "Karla", label: "Karla", group: "Sans" },
  { value: "Rubik", label: "Rubik", group: "Sans" },
  { value: "Public Sans", label: "Public Sans", group: "Sans" },
  { value: "Geist", label: "Geist", group: "Sans" },
  { value: "Instrument Sans", label: "Instrument Sans", group: "Sans" },
  { value: "Bricolage Grotesque", label: "Bricolage Grotesque", group: "Sans" },

  // ---- Display / personality ----
  { value: "Space Grotesk", label: "Space Grotesk", group: "Display" },
  { value: "Syne", label: "Syne", group: "Display" },
  { value: "Bebas Neue", label: "Bebas Neue", group: "Display" },
  { value: "Oswald", label: "Oswald", group: "Display" },
  { value: "Anton", label: "Anton", group: "Display" },
  { value: "Archivo Black", label: "Archivo Black", group: "Display" },
  { value: "Big Shoulders Display", label: "Big Shoulders", group: "Display" },
  { value: "Abril Fatface", label: "Abril Fatface", group: "Display" },
  { value: "Yeseva One", label: "Yeseva One", group: "Display" },
  { value: "Italiana", label: "Italiana", group: "Display" },
  { value: "Marcellus", label: "Marcellus", group: "Display" },

  // ---- Serifs ----
  { value: "Playfair Display", label: "Playfair Display", group: "Serif" },
  { value: "Fraunces", label: "Fraunces", group: "Serif" },
  { value: "DM Serif Display", label: "DM Serif Display", group: "Serif" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond", group: "Serif" },
  { value: "EB Garamond", label: "EB Garamond", group: "Serif" },
  { value: "Lora", label: "Lora", group: "Serif" },
  { value: "Libre Baskerville", label: "Libre Baskerville", group: "Serif" },
  { value: "Crimson Pro", label: "Crimson Pro", group: "Serif" },
  { value: "Merriweather", label: "Merriweather", group: "Serif" },
  { value: "Source Serif 4", label: "Source Serif 4", group: "Serif" },
  { value: "Instrument Serif", label: "Instrument Serif", group: "Serif" },

  // ---- Script / handwritten ----
  { value: "Caveat", label: "Caveat · handwritten", group: "Script" },
  { value: "Pacifico", label: "Pacifico", group: "Script" },
  { value: "Dancing Script", label: "Dancing Script", group: "Script" },

  // ---- Mono ----
  { value: "Space Mono", label: "Space Mono", group: "Mono" },
  { value: "IBM Plex Mono", label: "IBM Plex Mono", group: "Mono" },
  { value: "JetBrains Mono", label: "JetBrains Mono", group: "Mono" },

  // ---- System fallback ----
  { value: "system-ui, -apple-system, sans-serif", label: "System UI", group: "Sistema" },
];

const FONT_GROUPS = ["Marca", "Sans", "Display", "Serif", "Script", "Mono", "Sistema"];

// 9 positions: 3 rows × 3 cols (classic 3x3 grid).
const POSITION_KEYS = [
  "top-left",    "top-center",    "top-right",
  "mid-left",    "mid-center",    "mid-right",
  "bottom-left", "bottom-center", "bottom-right",
];

const POSITION_MAP = {
  "top-left":     { top: 0,      left: 0,                                    textAlign: "left",   align: "flex-start" },
  "top-center":   { top: 0,      left: "50%", transform: "translateX(-50%)",  textAlign: "center", align: "center"     },
  "top-right":    { top: 0,                  right: 0,                        textAlign: "right",  align: "flex-end"   },
  "mid-left":     { top: "50%", left: 0, transform: "translateY(-50%)",       textAlign: "left",   align: "flex-start" },
  "mid-center":   { top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", align: "center"  },
  "mid-right":    { top: "50%", right: 0, transform: "translateY(-50%)",      textAlign: "right",  align: "flex-end"   },
  "bottom-left":  { bottom: 0,  left: 0,                                     textAlign: "left",   align: "flex-start" },
  "bottom-center":{ bottom: 0,  left: "50%", transform: "translateX(-50%)",   textAlign: "center", align: "center"     },
  "bottom-right": { bottom: 0,               right: 0,                        textAlign: "right",  align: "flex-end"   },

  // Backwards-compat for legacy 12-position keys
  "q1-left":      { top: "25%", left: 0,                                     textAlign: "left",   align: "flex-start" },
  "q1-center":    { top: "25%", left: "50%", transform: "translateX(-50%)",   textAlign: "center", align: "center"     },
  "q1-right":     { top: "25%",              right: 0,                        textAlign: "right",  align: "flex-end"   },
  "q3-left":      { top: "60%", left: 0,                                     textAlign: "left",   align: "flex-start" },
  "q3-center":    { top: "60%", left: "50%", transform: "translateX(-50%)",   textAlign: "center", align: "center"     },
  "q3-right":     { top: "60%",              right: 0,                        textAlign: "right",  align: "flex-end"   },
};

const PALETTES = [
  { name: "Serafina Blue", primary: "#1D40BA", text: "#FAF4E4", overlay: "#151619" },
  { name: "Night", primary: "#151619", text: "#FAF4E4", overlay: "#151619" },
  { name: "Cosmic Latte", primary: "#FAF4E4", text: "#151619", overlay: "#FAF4E4" },
  { name: "Slate", primary: "#677487", text: "#FAF4E4", overlay: "#151619" },
];

// Demo / starter content (used when user clicks "Carregar exemplo")
const demoPlan = `Categoria: Marketing
Data: 02/06
Título: Como crescer no Instagram em 2026
Subtítulo: 5 estratégias que realmente funcionam

Legenda:
📱 Cansado de postar e não crescer?
Neste carrossel você vai aprender as 5 estratégias que mais geram alcance hoje.

Salva esse post para não esquecer 👇

#instagram #marketing #crescimento #social

---

Categoria: Branding
Data: 05/06
Título: Sua marca não vende sozinha
Subtítulo: O que separa marcas memoráveis das esquecíveis

Legenda:
Marcas memoráveis não nascem de logos bonitos. Nascem de decisões consistentes.
Aqui vão 3 princípios que sustentam toda boa marca.

#branding #marca #design

---

Categoria: Conteúdo
Data: 09/06
Título: Receitas, não decks
Subtítulo: Por que entregar resultado importa mais que apresentar ideias

Legenda:
Decks bonitos vendem reuniões. Resultados vendem clientes.
Esse é o nosso jeito de pensar.

#mktmadesimple #conteudo #resultado

---

Categoria: Lifestyle
Data: 12/06
Título: Trabalho que dá orgulho
Subtítulo: A diferença entre fazer bem e fazer com alma

Legenda:
Não é sobre prazo. É sobre cuidado.
Quando o time se importa, o trabalho fala por si.

#lifestyle #trabalho #craft

---

Categoria: Bastidores
Data: 16/06
Título: Por dentro do estúdio
Subtítulo: Como nasce uma identidade visual

Legenda:
Toda marca começa com uma conversa honesta.
Aqui mostramos o nosso processo, do briefing ao deliverable.

#bastidores #processo #branding

---

Categoria: Marketing
Data: 19/06
Título: Não existe mídia paga sem mídia orgânica
Subtítulo: Por que a base importa mais que o impulso

Legenda:
Anúncio sem conteúdo é dinheiro queimado.
Antes de pagar para alcançar, vale crescer no orgânico.

#midiapaga #organico #estrategia`;

// ----------------------------- Parsing -----------------------------------

function parseSinglePost(text, fallbackLabel) {
  // Parse a single post block (with or without ---).
  // Returns { category, date, title, subtitle, caption, hashtags, label }
  const lines = text.split(/\r?\n/);
  let i = 0;
  const meta = {};
  // Header block: key: value lines until blank line
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) break;
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (m) {
      const key = m[1].trim().toLowerCase();
      const val = m[2].trim();
      meta[key] = val;
      i++;
    } else if (Object.keys(meta).length === 0) {
      // Treat first non-keyed line as title
      meta["título"] = line.trim();
      i++;
    } else {
      break;
    }
  }
  // Skip blank
  while (i < lines.length && !lines[i].trim()) i++;

  // Look for "Legenda:" keyword to separate caption
  let captionStart = i;
  if (i < lines.length && /^legenda\s*:?$/i.test(lines[i].trim())) {
    i++;
    captionStart = i;
  }

  const rest = lines.slice(captionStart);
  let captionLines = [];
  let hashtags = "";

  // Identify trailing hashtags (last non-empty line starting with #)
  let lastNonEmpty = rest.length - 1;
  while (lastNonEmpty >= 0 && !rest[lastNonEmpty].trim()) lastNonEmpty--;
  if (lastNonEmpty >= 0 && rest[lastNonEmpty].trim().startsWith("#")) {
    hashtags = rest[lastNonEmpty].trim();
    captionLines = rest.slice(0, lastNonEmpty);
  } else {
    captionLines = rest;
  }

  // Trim trailing blanks
  while (captionLines.length && !captionLines[captionLines.length - 1].trim()) captionLines.pop();

  return {
    label: meta["título"] || fallbackLabel || "Post sem título",
    category: meta["categoria"] || meta["category"] || "",
    date: meta["data"] || meta["date"] || "",
    title: meta["título"] || meta["titulo"] || meta["title"] || fallbackLabel || "",
    subtitle: meta["subtítulo"] || meta["subtitulo"] || meta["subtitle"] || "",
    caption: captionLines.join("\n").trim(),
    hashtags: hashtags,
  };
}

function parsePlan(text) {
  const blocks = text.split(/\n\s*---\s*\n/);
  return blocks.map((block, i) => {
    const parsed = parseSinglePost(block.trim(), `Post ${i+1}`);
    return makePost(parsed, i);
  }).filter(p => p.title || p.caption);
}

function makePost(parsed, idx) {
  return {
    id: `post-${Date.now()}-${idx}-${Math.random().toString(36).slice(2,7)}`,
    label: parsed.label || `Post ${idx+1}`,
    category: parsed.category || "",
    date: parsed.date || "",
    title: parsed.title || "",
    subtitle: parsed.subtitle || "",
    caption: parsed.caption || "",
    hashtags: parsed.hashtags || "",
    imageSrc: null,
    imageScale: 100,
    imagePosX: 50,
    imagePosY: 50,
    fileName: null,
    overrides: {},
  };
}

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
}

function readFileDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Load a custom font into document.fonts via FontFace API
function loadCustomFont(font) {
  if (!font || !font.dataUrl || !font.name) return;
  try {
    if ([...document.fonts].some(f => f.family === font.name)) return; // already loaded
    const ff = new FontFace(font.name, `url(${font.dataUrl})`, {
      style: "normal", weight: "100 900", display: "swap",
    });
    ff.load().then(loaded => {
      document.fonts.add(loaded);
    }).catch(e => console.warn("Font load failed:", e));
  } catch (e) {
    console.warn("FontFace API error:", e);
  }
}
window.loadCustomFont = loadCustomFont;

// ----------------------------- Utils -------------------------------------

function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c+c).join("");
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ----------------------------- Claude API -----------------------------------

async function callClaude(prompt) {
  try {
    const text = await window.claude.complete(prompt);
    return text;
  } catch (e) {
    console.error("Claude call failed:", e);
    return null;
  }
}

// ----------------------------- Store hook -----------------------------------

const initialDesign = { ...DEFAULT_DESIGN };

function useAppStore() {
  const [posts, setPosts] = useState([]);
  const [design, setDesign] = useState(initialDesign);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [toast, setToast] = useState(null);
  const [customPalettes, setCustomPalettes] = usePersistedState("serafina-palettes", []);
  const [hiddenPalettes, setHiddenPalettes] = usePersistedState("serafina-palettes-hidden", []);
  const [customFonts, setCustomFonts] = usePersistedState("serafina-fonts", []);
  const [savedBrands, setSavedBrands] = usePersistedState("serafina-brands", []);
  const [activeBrandId, setActiveBrandId] = useState(null);
  // App theme — "light" (default) | "dark". Persisted across sessions.
  const [theme, setTheme] = usePersistedState("serafina-theme", "light");
  const toggleTheme = useCallback(() => {
    setTheme(t => (t === "dark" ? "light" : "dark"));
  }, [setTheme]);

  const addPalette = useCallback((palette) => {
    setCustomPalettes([...customPalettes, palette]);
  }, [customPalettes, setCustomPalettes]);

  const removePalette = useCallback((name) => {
    setCustomPalettes(customPalettes.filter(p => p.name !== name));
  }, [customPalettes, setCustomPalettes]);

  // Hide built-in palette (can't delete, but can hide)
  const hideBuiltinPalette = useCallback((name) => {
    if (hiddenPalettes.includes(name)) return;
    setHiddenPalettes([...hiddenPalettes, name]);
  }, [hiddenPalettes, setHiddenPalettes]);
  const restoreBuiltinPalette = useCallback((name) => {
    setHiddenPalettes(hiddenPalettes.filter(n => n !== name));
  }, [hiddenPalettes, setHiddenPalettes]);

  // Layout presets — save a post's overrides as a reusable preset
  const [layoutPresets, setLayoutPresets] = usePersistedState("serafina-layouts", []);
  const saveLayoutPreset = useCallback((name, overrides) => {
    const id = `layout-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const preset = { id, name: name.trim(), overrides: { ...(overrides || {}) }, savedAt: new Date().toISOString() };
    setLayoutPresets([...layoutPresets, preset]);
    return preset;
  }, [layoutPresets, setLayoutPresets]);
  const removeLayoutPreset = useCallback((id) => {
    setLayoutPresets(layoutPresets.filter(p => p.id !== id));
  }, [layoutPresets, setLayoutPresets]);
  const renameLayoutPreset = useCallback((id, name) => {
    setLayoutPresets(layoutPresets.map(p => p.id === id ? { ...p, name } : p));
  }, [layoutPresets, setLayoutPresets]);

  // Custom fonts — auto-persisted; load + register with FontFace on change
  const addCustomFont = useCallback((font) => {
    // font: { name, dataUrl, format }
    setCustomFonts([...customFonts, font]);
    loadCustomFont(font);
  }, [customFonts, setCustomFonts]);
  const removeCustomFont = useCallback((name) => {
    setCustomFonts(customFonts.filter(f => f.name !== name));
  }, [customFonts, setCustomFonts]);

  // (Re)register fonts whenever the list changes (after async load too)
  useEffect(() => {
    customFonts.forEach(f => loadCustomFont(f));
  }, [customFonts]);

  // ----- Brand profiles (full design system snapshots) -----
  const saveBrand = useCallback((name) => {
    const brandName = (name || design.brandName || "Marca").trim();
    const id = `brand-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const snapshot = {
      id,
      name: brandName,
      savedAt: new Date().toISOString(),
      design: { ...design },
    };
    setSavedBrands([...savedBrands, snapshot]);
    setActiveBrandId(id);
    return snapshot;
  }, [design, savedBrands, setSavedBrands]);

  const updateBrand = useCallback((id) => {
    setSavedBrands(savedBrands.map(b =>
      b.id === id ? { ...b, design: { ...design }, savedAt: new Date().toISOString() } : b
    ));
  }, [design, savedBrands, setSavedBrands]);

  const loadBrand = useCallback((id) => {
    const b = savedBrands.find(x => x.id === id);
    if (!b) return;
    setDesign({ ...b.design });
    setActiveBrandId(id);
  }, [savedBrands]);

  const removeBrand = useCallback((id) => {
    setSavedBrands(savedBrands.filter(b => b.id !== id));
    if (activeBrandId === id) setActiveBrandId(null);
  }, [savedBrands, activeBrandId, setSavedBrands]);

  const renameBrand = useCallback((id, name) => {
    setSavedBrands(savedBrands.map(b => b.id === id ? { ...b, name } : b));
  }, [savedBrands, setSavedBrands]);

  // ----- Saved plans (per client / per month) -----
  const [savedPlans, setSavedPlans] = usePersistedState("serafina-plans", []);
  const [activePlanId, setActivePlanId] = useState(null);
  const [activeClient, setActiveClient] = useState(null);

  const savePlan = useCallback(({ client, month, year, name }) => {
    const id = `plan-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const snapshot = {
      id,
      client: (client || "Sem cliente").trim(),
      month: month || (new Date().getMonth() + 1),
      year: year || new Date().getFullYear(),
      name: (name || "").trim(),
      savedAt: new Date().toISOString(),
      posts: posts.map(p => ({ ...p })),
      design: { ...design },
    };
    setSavedPlans([...savedPlans, snapshot]);
    setActivePlanId(id);
    setActiveClient(snapshot.client);
    return snapshot;
  }, [posts, design, savedPlans]);

  const updatePlan = useCallback((id) => {
    const next = savedPlans.map(p =>
      p.id === id ? {
        ...p,
        posts: posts.map(x => ({ ...x })),
        design: { ...design },
        savedAt: new Date().toISOString(),
      } : p
    );
    setSavedPlans(next);
  }, [posts, design, savedPlans]);

  const loadPlan = useCallback((id) => {
    const plan = savedPlans.find(p => p.id === id);
    if (!plan) return;
    setPosts(plan.posts.map(p => ({ ...p })));
    setDesign({ ...plan.design });
    setSelectedPostId(plan.posts[0]?.id || null);
    setActivePlanId(id);
    setActiveClient(plan.client);
  }, [savedPlans]);

  const removePlan = useCallback((id) => {
    setSavedPlans(savedPlans.filter(p => p.id !== id));
    if (activePlanId === id) setActivePlanId(null);
  }, [savedPlans, activePlanId]);

  const renamePlan = useCallback((id, fields) => {
    setSavedPlans(savedPlans.map(p => p.id === id ? { ...p, ...fields } : p));
  }, [savedPlans]);

  const renameClient = useCallback((oldName, newName) => {
    setSavedPlans(savedPlans.map(p => p.client === oldName ? { ...p, client: newName } : p));
    if (activeClient === oldName) setActiveClient(newName);
  }, [savedPlans, activeClient]);

  const removeClient = useCallback((clientName) => {
    setSavedPlans(savedPlans.filter(p => p.client !== clientName));
    if (activeClient === clientName) setActiveClient(null);
  }, [savedPlans, activeClient]);

  const newPlan = useCallback(() => {
    setPosts([]);
    setSelectedPostId(null);
    setActivePlanId(null);
  }, []);

  const showToast = useCallback((msg, duration = 2400) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  }, []);

  const updatePost = useCallback((id, patch) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }, []);

  const replacePost = useCallback((id, newPost) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...newPost, id: p.id } : p));
  }, []);

  const addPosts = useCallback((newPosts, mode = "replace") => {
    setPosts(prev => {
      const next = mode === "append" ? [...prev, ...newPosts] : newPosts;
      if (!selectedPostId && next.length) setSelectedPostId(next[0].id);
      return next;
    });
  }, [selectedPostId]);

  const removePost = useCallback((id) => {
    setPosts(prev => {
      const next = prev.filter(p => p.id !== id);
      if (id === selectedPostId) {
        setSelectedPostId(next[0]?.id || null);
      }
      return next;
    });
  }, [selectedPostId]);

  const addEmptyPost = useCallback(() => {
    const p = makePost({ title: "Novo post", category: "" }, posts.length);
    setPosts(prev => [...prev, p]);
    setSelectedPostId(p.id);
  }, [posts.length]);

  const selectedPost = posts.find(p => p.id === selectedPostId) || null;

  return {
    posts, setPosts, addPosts,
    design, setDesign,
    selectedPostId, setSelectedPostId, selectedPost,
    updatePost, replacePost, removePost, addEmptyPost,
    toast, showToast,
    customPalettes, addPalette, removePalette,
    hiddenPalettes, hideBuiltinPalette, restoreBuiltinPalette,
    customFonts, addCustomFont, removeCustomFont,
    layoutPresets, saveLayoutPreset, removeLayoutPreset, renameLayoutPreset,
    savedBrands, activeBrandId, setActiveBrandId,
    saveBrand, updateBrand, loadBrand, removeBrand, renameBrand,
    savedPlans, activePlanId, activeClient, setActiveClient,
    savePlan, updatePlan, loadPlan, removePlan, renamePlan,
    renameClient, removeClient, newPlan,
    theme, setTheme, toggleTheme,
  };
}

// ----------------------------- Exports -------------------------------------

Object.assign(window, {
  useAppStore,
  parsePlan, parseSinglePost, makePost,
  readFileText, readFileDataURL,
  hexToRgb, clamp,
  callClaude,
  demoPlan,
  FONT_OPTIONS, FONT_GROUPS, POSITION_KEYS, POSITION_MAP, PALETTES,
  DEFAULT_DESIGN,
});

// ╔══════════════════════════════════════════════════════════╗
// ║  supabase-sync.jsx                                     ║
// ╚══════════════════════════════════════════════════════════╝

// ============================================================
// supabase-sync.jsx — Camada de persistência Supabase
// Adicionada POR CIMA do estado React local (store.jsx). Não
// substitui o local-first: espelha posts + design + clientes
// para o Supabase e expõe um badge de status no topbar.
//
// Exports to window: useSupabaseSync, SyncBadge, sbClient
// ============================================================

const {
  useState: useStateSB,
  useEffect: useEffectSB,
  useRef: useRefSB,
  useCallback: useCallbackSB,
  useMemo: useMemoSB,
} = React;

// ----------------------------- Client ------------------------------------

const SUPABASE_URL = "https://sclnorzuyxkchapszcmy.supabase.co";
const SUPABASE_KEY = "sb_publishable_8rOSAOeo2GokcQKtpvNPjA_ft2GfNCz";
const BUCKET = "planflow-imagens";

const sbClient = (() => {
  try {
    if (window.supabase && typeof window.supabase.createClient === "function") {
      return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false },
      });
    }
  } catch (e) {
    console.warn("Supabase client init failed:", e);
  }
  return null;
})();
window.sbClient = sbClient;

// ----------------------------- Field mapping -----------------------------
// Local post  <->  posts table row.

function postToRow(p, planejamentoId, ordem, imagemUrl) {
  const o = p.overrides || {};
  return {
    planejamento_id: planejamentoId,
    label: p.label || null,
    data: p.date || null,
    categoria: p.category || null,
    titulo: p.title || null,
    subtitulo: p.subtitle || null,
    legenda: p.caption || null,
    hashtags: p.hashtags || null,
    imagem_url: imagemUrl || null,
    imagem_pos_x: p.imagePosX ?? 50,
    imagem_pos_y: p.imagePosY ?? 50,
    imagem_scale: p.imageScale ?? 100,
    title_size: o.titleSize ?? null,
    subtitle_size: o.subtitleSize ?? null,
    title_align: o.titleAlign ?? null,
    content_pos: o.contentPosition ?? null,
    overlay_opacity: o.overlayOpacity ?? null,
    ordem,
  };
}

function rowToPost(row, idx) {
  const overrides = {};
  if (row.title_size != null) overrides.titleSize = row.title_size;
  if (row.subtitle_size != null) overrides.subtitleSize = row.subtitle_size;
  if (row.title_align) overrides.titleAlign = row.title_align;
  if (row.content_pos) overrides.contentPosition = row.content_pos;
  if (row.overlay_opacity != null) overrides.overlayOpacity = row.overlay_opacity;
  return {
    id: `post-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
    label: row.label || row.titulo || `Post ${idx + 1}`,
    category: row.categoria || "",
    date: row.data || "",
    title: row.titulo || "",
    subtitle: row.subtitulo || "",
    caption: row.legenda || "",
    hashtags: row.hashtags || "",
    imageSrc: row.imagem_url || null,
    imageScale: row.imagem_scale ?? 100,
    imagePosX: row.imagem_pos_x ?? 50,
    imagePosY: row.imagem_pos_y ?? 50,
    fileName: null,
    overrides,
  };
}

// ----------------------------- Local <-> cloud id map --------------------
// Persisted in localStorage: { [localPlanId]: { clienteId, planejamentoId } }

const CLOUD_MAP_KEY = "serafina-cloud-map";
function loadCloudMap() {
  try { return JSON.parse(localStorage.getItem(CLOUD_MAP_KEY) || "{}"); }
  catch { return {}; }
}
function saveCloudMap(m) {
  try { localStorage.setItem(CLOUD_MAP_KEY, JSON.stringify(m)); } catch {}
}

// ----------------------------- Image upload ------------------------------
// dataURL images -> Storage bucket -> public URL. Cached by content hash
// to avoid re-uploading unchanged images on every autosave.

const IMG_CACHE_KEY = "serafina-img-cache";
function loadImgCache() {
  try { return JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || "{}"); }
  catch { return {}; }
}
function saveImgCache(c) {
  try { localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(c)); } catch {}
}
const imgCache = loadImgCache();

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

let bucketEnsured = false;
async function ensureBucket() {
  if (!sbClient || bucketEnsured) return;
  bucketEnsured = true;
  try {
    const { data } = await sbClient.storage.getBucket(BUCKET);
    if (!data) {
      await sbClient.storage.createBucket(BUCKET, { public: true });
    }
  } catch (e) {
    // anon/publishable key normally can't manage buckets — ignore; the
    // bucket is expected to already exist. Uploads will still work.
  }
}

async function uploadImageIfNeeded(imageSrc, planejamentoId, idx) {
  if (!sbClient || !imageSrc) return imageSrc || null;
  // Already a remote URL → keep as-is.
  if (!/^data:/.test(imageSrc)) return imageSrc;

  const key = hashString(imageSrc);
  if (imgCache[key]) return imgCache[key];

  const mime = (imageSrc.match(/^data:(.*?);/) || [])[1] || "image/png";
  const ext = (mime.split("/")[1] || "png").replace("+xml", "");
  const blob = await (await fetch(imageSrc)).blob();
  const path = `${planejamentoId}/${idx}-${key}.${ext}`;

  const { error } = await sbClient.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: mime });
  if (error) throw error;

  const { data } = sbClient.storage.from(BUCKET).getPublicUrl(path);
  const url = data.publicUrl;
  imgCache[key] = url;
  saveImgCache(imgCache);
  return url;
}

// ----------------------------- DB operations -----------------------------

async function ensureCliente(nome) {
  const clean = (nome || "Sem cliente").trim();
  const { data: existing, error: selErr } = await sbClient
    .from("clientes").select("id").eq("nome", clean).limit(1);
  if (selErr) throw selErr;
  if (existing && existing.length) return existing[0].id;
  const { data, error } = await sbClient
    .from("clientes").insert({ nome: clean }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function ensurePlanejamento({ planejamentoId, clienteId, nome, mes }) {
  // `planejamentos.nome` is NOT NULL — never write null. Fall back to a
  // month-based label when the user leaves the optional name blank.
  const safeNome = (nome && nome.trim())
    || (mes ? `Planejamento ${String(mes).padStart(2, "0")}` : "Planejamento");
  if (planejamentoId) {
    const { error } = await sbClient.from("planejamentos")
      .update({ nome: safeNome, mes: mes ?? null, atualizado_em: new Date().toISOString() })
      .eq("id", planejamentoId);
    if (error) throw error;
    return planejamentoId;
  }
  const { data, error } = await sbClient.from("planejamentos")
    .insert({ cliente_id: clienteId, nome: safeNome, mes: mes ?? null })
    .select("id").single();
  if (error) throw error;
  return data.id;
}

async function syncPosts(planejamentoId, posts) {
  // Upload images first, build rows, then replace all rows for this plan.
  // Image-upload failures are non-fatal: the post still syncs (text +
  // layout), just without imagem_url. We report how many images failed so
  // the badge can warn (usually means the Storage bucket is missing).
  let imageFails = 0;
  const rows = [];
  for (let i = 0; i < posts.length; i++) {
    let url = null;
    try {
      url = await uploadImageIfNeeded(posts[i].imageSrc, planejamentoId, i);
    } catch (e) {
      if (posts[i].imageSrc) imageFails++;
      console.warn(`Image upload failed for post ${i}:`, e.message || e);
      // Keep an already-remote URL if the source was one; else null.
      url = /^https?:/.test(posts[i].imageSrc || "") ? posts[i].imageSrc : null;
    }
    rows.push(postToRow(posts[i], planejamentoId, i, url));
  }
  const { error: delErr } = await sbClient.from("posts")
    .delete().eq("planejamento_id", planejamentoId);
  if (delErr) throw delErr;
  if (rows.length) {
    const { error: insErr } = await sbClient.from("posts").insert(rows);
    if (insErr) throw insErr;
  }
  return { imageFails };
}

async function syncDesign(clienteId, design) {
  const { data: existing, error: selErr } = await sbClient
    .from("design_systems").select("id").eq("cliente_id", clienteId).limit(1);
  if (selErr) throw selErr;
  const now = new Date().toISOString();
  if (existing && existing.length) {
    const { error } = await sbClient.from("design_systems")
      .update({ dados: design, atualizado_em: now }).eq("id", existing[0].id);
    if (error) throw error;
  } else {
    const { error } = await sbClient.from("design_systems")
      .insert({ cliente_id: clienteId, dados: design });
    if (error) throw error;
  }
}

// ----------------------------- Hook --------------------------------------

function useSupabaseSync(base) {
  const enabled = !!sbClient;

  const [status, setStatus] = useStateSB(enabled ? "idle" : "disabled"); // idle|pending|saving|saved|error|disabled
  const [lastSavedAt, setLastSavedAt] = useStateSB(null);
  const [clients, setClients] = useStateSB([]);
  const [errMsg, setErrMsg] = useStateSB(null);

  const activeRef = useRefSB({ clienteId: null, planejamentoId: null });
  const mapRef = useRefSB(loadCloudMap());
  const postsRef = useRefSB(base.posts);
  const designRef = useRefSB(base.design);
  const debRef = useRefSB(null);
  postsRef.current = base.posts;
  designRef.current = base.design;

  const reloadClients = useCallbackSB(async () => {
    if (!enabled) return;
    try {
      const { data, error } = await sbClient
        .from("clientes").select("id, nome, criado_em").order("nome");
      if (error) throw error;
      setClients(data || []);
      setErrMsg(null);
    } catch (e) {
      console.warn("reloadClients failed:", e);
      setErrMsg(e.message || "Falha ao carregar clientes");
    }
  }, [enabled]);

  // Initial: ensure bucket + load clients.
  useEffectSB(() => {
    if (!enabled) return;
    ensureBucket();
    reloadClients();
  }, [enabled, reloadClients]);

  // Push current posts + design to the active cloud plan.
  const pushPostsAndDesign = useCallbackSB(async () => {
    const { clienteId, planejamentoId } = activeRef.current;
    if (!clienteId || !planejamentoId) return;
    setStatus("saving");
    try {
      const { imageFails } = await syncPosts(planejamentoId, postsRef.current);
      await syncDesign(clienteId, designRef.current);
      setStatus("saved");
      setLastSavedAt(Date.now());
      setErrMsg(imageFails ? `${imageFails} imagem(ns) não enviada(s) — crie o bucket "${BUCKET}"` : null);
    } catch (e) {
      console.warn("pushPostsAndDesign failed:", e);
      setStatus("error");
      setErrMsg(e.message || "Erro ao salvar");
    }
  }, []);

  // Ensure cliente + planejamento exist, set active ids, persist map, push.
  const pushAll = useCallbackSB(async ({ clienteNome, mes, nome, localId }) => {
    if (!enabled) return;
    setStatus("saving");
    try {
      const mapped = (localId && mapRef.current[localId]) || {};
      const clienteId = await ensureCliente(clienteNome);
      const planejamentoId = await ensurePlanejamento({
        planejamentoId: mapped.planejamentoId, clienteId, nome, mes,
      });
      activeRef.current = { clienteId, planejamentoId };
      if (localId) {
        mapRef.current[localId] = { clienteId, planejamentoId };
        saveCloudMap(mapRef.current);
      }
      const { imageFails } = await syncPosts(planejamentoId, postsRef.current);
      await syncDesign(clienteId, designRef.current);
      setStatus("saved");
      setLastSavedAt(Date.now());
      setErrMsg(imageFails ? `${imageFails} imagem(ns) não enviada(s) — crie o bucket "${BUCKET}"` : null);
      reloadClients();
    } catch (e) {
      console.warn("pushAll failed:", e);
      setStatus("error");
      setErrMsg(e.message || "Erro ao salvar na nuvem");
    }
  }, [enabled, reloadClients]);

  // Debounced autosave whenever posts/design change AND a cloud plan is active.
  useEffectSB(() => {
    if (!enabled) return;
    if (!activeRef.current.planejamentoId) return;
    setStatus("pending");
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { pushPostsAndDesign(); }, 2000);
    return () => clearTimeout(debRef.current);
  }, [base.posts, base.design, enabled, pushPostsAndDesign]);

  // Load a cloud client's latest plan into the working state.
  const openCloudClient = useCallbackSB(async (cli) => {
    if (!enabled) return;
    setStatus("saving");
    try {
      const { data: plans, error: pErr } = await sbClient
        .from("planejamentos").select("*")
        .eq("cliente_id", cli.id)
        .order("atualizado_em", { ascending: false }).limit(1);
      if (pErr) throw pErr;
      const plan = plans && plans[0];

      let posts = [];
      if (plan) {
        const { data: rows, error: rErr } = await sbClient
          .from("posts").select("*").eq("planejamento_id", plan.id).order("ordem");
        if (rErr) throw rErr;
        posts = (rows || []).map(rowToPost);
      }

      const { data: dsRows, error: dErr } = await sbClient
        .from("design_systems").select("dados")
        .eq("cliente_id", cli.id).limit(1);
      if (dErr) throw dErr;

      base.setPosts(posts);
      if (dsRows && dsRows[0] && dsRows[0].dados) {
        base.setDesign({ ...window.DEFAULT_DESIGN, ...dsRows[0].dados });
      }
      base.setSelectedPostId(posts[0] ? posts[0].id : null);
      base.setActiveClient(cli.nome);
      activeRef.current = { clienteId: cli.id, planejamentoId: plan ? plan.id : null };
      setStatus("saved");
      setLastSavedAt(Date.now());
      setErrMsg(null);
    } catch (e) {
      console.warn("openCloudClient failed:", e);
      setStatus("error");
      setErrMsg(e.message || "Erro ao carregar da nuvem");
    }
  }, [enabled]);

  // ----- Wrapped store actions (cloud-aware) -----
  const savePlan = useCallbackSB((args) => {
    const snap = base.savePlan(args);
    pushAll({ clienteNome: snap.client, mes: snap.month, nome: snap.name, localId: snap.id });
    return snap;
  }, [base.savePlan, pushAll]);

  const updatePlan = useCallbackSB((id) => {
    base.updatePlan(id);
    const snap = base.savedPlans.find(p => p.id === id);
    if (snap) pushAll({ clienteNome: snap.client, mes: snap.month, nome: snap.name, localId: id });
  }, [base.updatePlan, base.savedPlans, pushAll]);

  const loadPlan = useCallbackSB((id) => {
    base.loadPlan(id);
    const m = mapRef.current[id];
    activeRef.current = m
      ? { clienteId: m.clienteId, planejamentoId: m.planejamentoId }
      : { clienteId: null, planejamentoId: null };
  }, [base.loadPlan]);

  const removePlan = useCallbackSB((id) => {
    base.removePlan(id);
    const m = mapRef.current[id];
    if (m && enabled) {
      (async () => {
        try {
          await sbClient.from("posts").delete().eq("planejamento_id", m.planejamentoId);
          await sbClient.from("planejamentos").delete().eq("id", m.planejamentoId);
        } catch (e) { console.warn("cloud removePlan failed:", e); }
      })();
      delete mapRef.current[id];
      saveCloudMap(mapRef.current);
    }
    if (activeRef.current.planejamentoId === (m && m.planejamentoId)) {
      activeRef.current = { clienteId: null, planejamentoId: null };
    }
  }, [base.removePlan, enabled]);

  const newPlan = useCallbackSB(() => {
    base.newPlan();
    activeRef.current = { clienteId: null, planejamentoId: null };
    setStatus(s => (s === "error" ? s : "idle"));
  }, [base.newPlan]);

  // Augmented store passed down to the whole app. We also expose the cloud
  // client list + loader so the main "Arquivo" panel can surface clients that
  // live only in Supabase (e.g. opening the app on a fresh device).
  const store = useMemoSB(() => ({
    ...base,
    savePlan, updatePlan, loadPlan, removePlan, newPlan,
    cloudEnabled: enabled,
    cloudStatus: status,
    cloudClients: clients,
    reloadCloudClients: reloadClients,
    openCloudClient,
  }), [base, savePlan, updatePlan, loadPlan, removePlan, newPlan,
       enabled, status, clients, reloadClients, openCloudClient]);

  return {
    store,
    enabled,
    status, lastSavedAt, errMsg,
    clients, reloadClients, openCloudClient,
  };
}

// ----------------------------- Badge UI ----------------------------------

function relTime(ts) {
  if (!ts) return "";
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return "agora";
  if (s < 60) return `há ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m}min`;
  const h = Math.round(m / 60);
  return `há ${h}h`;
}

const SYNC_LABELS = {
  idle:     { dot: "idle",    text: "Nuvem" },
  pending:  { dot: "saving",  text: "Editando…" },
  saving:   { dot: "saving",  text: "Salvando…" },
  saved:    { dot: "ok",      text: "Salvo" },
  error:    { dot: "error",   text: "Erro" },
  disabled: { dot: "off",     text: "Offline" },
};

function SyncBadge({ sync }) {
  const [open, setOpen] = useStateSB(false);
  const [, force] = useStateSB(0);
  const boxRef = useRefSB(null);

  // Tick once a minute so "há Xmin" stays fresh.
  useEffectSB(() => {
    const t = setInterval(() => force(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // Close popover on outside click.
  useEffectSB(() => {
    if (!open) return;
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const meta = SYNC_LABELS[sync.status] || SYNC_LABELS.idle;
  const showTime = (sync.status === "saved" || sync.status === "idle") && sync.lastSavedAt;

  return (
    <div className="sync-badge-wrap" ref={boxRef}>
      <button
        className={`sync-badge state-${meta.dot}`}
        onClick={() => { setOpen(o => !o); if (!open) sync.reloadClients(); }}
        title={sync.errMsg || (sync.enabled ? "Sincronização Supabase" : "Supabase indisponível")}>
        <span className="sync-dot" />
        <span className="sync-text">{meta.text}</span>
        {showTime && <span className="sync-time">{relTime(sync.lastSavedAt)}</span>}
      </button>

      {open && (
        <div className="sync-pop">
          <div className="sync-pop-head">
            <span className="eyebrow">Nuvem · Supabase</span>
            <span className={`sync-pip state-${meta.dot}`}>{meta.text}</span>
          </div>

          {sync.errMsg && <div className="sync-pop-err">{sync.errMsg}</div>}

          <div className="sync-pop-sub">
            {sync.lastSavedAt
              ? `Última gravação ${relTime(sync.lastSavedAt)}`
              : "Auto-save a cada edição (2s)"}
          </div>

          <div className="sync-pop-label">Clientes salvos ({sync.clients.length})</div>
          <div className="sync-pop-list">
            {sync.clients.length === 0 ? (
              <div className="sync-pop-empty">
                {sync.enabled ? "Nenhum cliente na nuvem ainda." : "Conexão indisponível."}
              </div>
            ) : (
              sync.clients.map(c => (
                <button key={c.id} className="sync-client-row"
                  onClick={() => { sync.openCloudClient(c); setOpen(false); }}
                  title="Carregar posts + design deste cliente">
                  <span className="sync-client-avatar">{(c.nome || "?").charAt(0).toUpperCase()}</span>
                  <span className="sync-client-name">{c.nome}</span>
                  <span className="sync-client-go">↗</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { useSupabaseSync, SyncBadge });

// ╔══════════════════════════════════════════════════════════╗
// ║  auth.jsx                                              ║
// ╚══════════════════════════════════════════════════════════╝

// ============================================================
// auth.jsx — Login unificado da equipe
//
// Um único usuário e senha fixos no código para toda a equipe.
// Não usa banco de dados. A sessão fica salva no localStorage e
// expira automaticamente após 8 horas.
//
// Credenciais: serafina / serafina2024
//
// Exports to window: useAuth
// ============================================================

const {
  useState: useStateAuth,
  useEffect: useEffectAuth,
  useCallback: useCallbackAuth,
} = React;

// ----------------------------- Constantes --------------------------------

const SESSION_KEY = "planflow-sessao";
const SESSION_TTL = 8 * 60 * 60 * 1000;          // 8 horas

const CREDENCIAIS = {
  usuario: "serafina",
  senha: "serafina2024",
  nome: "Serafina",
};

// ----------------------------- Sessão ------------------------------------

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.ts || Date.now() - s.ts > SESSION_TTL) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch { return null; }
}

function saveSession() {
  const s = { usuario: CREDENCIAIS.usuario, nome: CREDENCIAIS.nome, ts: Date.now() };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
  return s;
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

// ----------------------------- Hook principal ----------------------------

function useAuth() {
  const [ready, setReady] = useStateAuth(false);
  const [session, setSession] = useStateAuth(null);

  // Restaura a sessão salva (se ainda dentro das 8h).
  useEffectAuth(() => {
    const s = loadSession();
    if (s) setSession(s);
    setReady(true);
  }, []);

  // ----- Login -----
  const login = useCallbackAuth(async (usuario, senha) => {
    const u = (usuario || "").trim().toLowerCase();
    const p = senha || "";
    if (!u || !p) return { ok: false, error: "Preencha usuário e senha." };
    if (u !== CREDENCIAIS.usuario || p !== CREDENCIAIS.senha) {
      return { ok: false, error: "Usuário ou senha incorretos." };
    }
    setSession(saveSession());
    return { ok: true };
  }, []);

  // ----- Logout -----
  const logout = useCallbackAuth(() => {
    clearSession();
    setSession(null);
  }, []);

  // Auto-expira a sessão ao cruzar as 8h enquanto o app está aberto.
  useEffectAuth(() => {
    if (!session) return;
    const left = SESSION_TTL - (Date.now() - session.ts);
    if (left <= 0) { logout(); return; }
    const t = setTimeout(() => logout(), left);
    return () => clearTimeout(t);
  }, [session, logout]);

  return {
    ready,
    session,
    // Login único = acesso total. Mantém estas flags para os painéis
    // que já consultam store.isAdmin / store.canEdit.
    isAdmin: !!session,
    canEdit: !!session,
    login,
    logout,
  };
}

Object.assign(window, { useAuth });

// ╔══════════════════════════════════════════════════════════╗
// ║  canvas.jsx                                            ║
// ╚══════════════════════════════════════════════════════════╝

// ============================================================
// canvas.jsx — Post canvas renderer + helpers
// Renders a single post on a 4:5 canvas at any size.
// Exports: PostCanvas, PostCanvasMini
// ============================================================

const { useState: useStateC, useRef: useRefC } = React;

// Returns effective design for a single post (post overrides > design defaults)
function effectiveDesign(post, design) {
  if (!post || !post.overrides) return design;
  return { ...design, ...post.overrides };
}

// Compute layer styles for a post + design
function computeLayerStyles(post, design, scale = 1) {
  const eff = effectiveDesign(post, design);
  const r = hexToRgb(eff.overlayColor);
  const opacity = eff.overlayOpacity / 100;
  const dir = eff.overlayDirection || "to top";

  const bgImage = post.imageSrc
    ? {
        backgroundImage: `url(${post.imageSrc})`,
        backgroundSize: `${post.imageScale}%`,
        backgroundPosition: `${post.imagePosX}% ${post.imagePosY}%`,
        backgroundRepeat: "no-repeat",
        backgroundColor: eff.primaryColor,
      }
    : { backgroundColor: eff.primaryColor };

  const overlay = post.imageSrc ? {
    background: `linear-gradient(${dir}, rgba(${r.r},${r.g},${r.b},${opacity}) 0%, rgba(${r.r},${r.g},${r.b},0.05) 100%)`,
  } : { background: "transparent" };

  const posSpec = POSITION_MAP[eff.contentPosition] || POSITION_MAP["bottom-left"];
  // Absolute-position the block within the padded inner frame.
  const blockStyle = {
    position: "absolute",
    top: posSpec.top,
    left: posSpec.left,
    right: posSpec.right,
    bottom: posSpec.bottom,
    transform: posSpec.transform,
  };
  // Filter undefined keys to keep style object clean
  Object.keys(blockStyle).forEach(k => blockStyle[k] === undefined && delete blockStyle[k]);

  return {
    bgImage,
    overlay,
    textAlign: posSpec.textAlign,
    align: posSpec.align,
    blockStyle,
    eff,
  };
}

// Inline-editable text element
function EditableText({ value, onChange, style, className, placeholder, multiline = false }) {
  const ref = useRefC(null);
  const onBlur = (e) => {
    const text = e.currentTarget.innerText;
    if (text !== value) onChange(text);
  };
  const onKey = (e) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };
  React.useEffect(() => {
    if (ref.current && ref.current.innerText !== (value || "")) {
      ref.current.innerText = value || "";
    }
  }, [value]);
  return (
    <div
      ref={ref}
      className={`contenteditable ${className || ""}`}
      contentEditable
      suppressContentEditableWarning
      onBlur={onBlur}
      onKeyDown={onKey}
      style={style}
      data-placeholder={placeholder}
    />
  );
}

// PostCanvas — full editable canvas. scale=1 for fullsize 400x500
function PostCanvas({
  post,
  design,
  editable = false,
  onUpdate,
  size = 400,
  className = "",
}) {
  const layers = computeLayerStyles(post, design);
  const eff = layers.eff;
  const aspect = 4 / 5;
  const w = size;
  const h = size / aspect;

  const titleScale = w / 400;

  return (
    <div
      className={`post-canvas ${className}`}
      style={{ width: w, height: h }}
    >
      {/* Layer 0+1: bg color + image */}
      <div className="post-canvas-layer bg-img" style={layers.bgImage} />
      {/* Layer 2: overlay */}
      <div className="post-canvas-layer overlay" style={layers.overlay} />
      {/* Layer 3: content */}
      <div
        className="post-canvas-layer content"
        style={{
          position: "absolute", inset: 0,
          padding: `${(eff.contentPadding ?? 36) * titleScale}px`,
        }}
      >
        <div style={{
          position: "absolute",
          top: `${(eff.contentPadding ?? 36) * titleScale}px`,
          left: `${(eff.contentPadding ?? 36) * titleScale}px`,
          right: `${(eff.contentPadding ?? 36) * titleScale}px`,
          bottom: `${(eff.contentPadding ?? 36) * titleScale}px`,
        }}>
          <div style={{
            ...layers.blockStyle,
            display: "flex", flexDirection: "column",
            alignItems: layers.align,
            maxWidth: `${eff.contentMaxWidth ?? 100}%`,
          }}>
            {eff.showTag && post.category && (eff.tagAttachment !== "corner") && (eff.tagInlinePosition || "above") !== "below" && (
              <div
                className="post-tag-pill"
                style={{
                  fontSize: `${10 * titleScale}px`,
                  padding: `${5 * titleScale}px ${10 * titleScale}px`,
                  borderColor: `${eff.textColor}33`,
                  backgroundColor: `${eff.textColor}1a`,
                  marginBottom: `${8 * titleScale}px`,
                }}
              >
                {post.category}
              </div>
            )}

            {/* Title + subtitle: no box, single block box, or per-line boxes */}
            {(() => {
              const linesMode = eff.textBoxEnabled && eff.textBoxMode === "lines";
              const boxSub = eff.textBoxSubtitle !== false;
              const r = hexToRgb(eff.textBoxColor || "#151619");
              const op = (eff.textBoxOpacity ?? 70) / 100;
              const pad = (eff.textBoxPadding ?? 20) * titleScale;
              const radius = (eff.textBoxRadius ?? 0) * titleScale;
              const titleFontPx = eff.titleSize * titleScale;
              const subFontPx = eff.subtitleSize * titleScale;
              const gapPx = (eff.titleSubtitleGap ?? 14) * titleScale;

              // Per-line highlight: box-decoration-break clones the bg onto each
              // wrapped line; tall line-height creates the spacing between boxes.
              const lineHL = (fontPx) => ({
                display: "inline",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
                background: `rgba(${r.r},${r.g},${r.b},${op})`,
                padding: `${pad * 0.32}px ${pad * 0.55}px`,
                borderRadius: `${radius}px`,
                lineHeight: `${fontPx + pad * 0.64 + pad * 0.55}px`,
              });

              const titleStyle = {
                fontFamily: eff.titleFont,
                fontWeight: eff.titleWeight,
                fontSize: `${titleFontPx}px`,
                textTransform: eff.titleTransform,
                color: eff.textColor,
                textAlign: layers.textAlign,
                width: "100%",
                ...(linesMode ? lineHL(titleFontPx) : { lineHeight: eff.titleLineHeight ?? 1.0 }),
              };
              const subStyle = {
                fontFamily: eff.subtitleFont,
                fontSize: `${subFontPx}px`,
                color: eff.textColor,
                opacity: 0.92,
                textAlign: layers.textAlign,
                width: "100%",
                ...(linesMode
                  ? (boxSub ? lineHL(subFontPx) : { lineHeight: eff.subtitleLineHeight ?? 1.35 })
                  : { marginTop: `${gapPx}px`, lineHeight: eff.subtitleLineHeight ?? 1.35 }),
              };

              const titleEl = editable ? (
                <EditableText value={post.title} onChange={(v) => onUpdate?.({ title: v })}
                  className="post-title-text" style={titleStyle} placeholder="Título" multiline />
              ) : (
                <h2 className="post-title-text" style={titleStyle}>{post.title}</h2>
              );
              const subEl = editable ? (
                <EditableText value={post.subtitle} onChange={(v) => onUpdate?.({ subtitle: v })}
                  className="post-subtitle-text" style={subStyle} placeholder="Subtítulo" multiline />
              ) : (
                post.subtitle ? <p className="post-subtitle-text" style={subStyle}>{post.subtitle}</p> : null
              );

              if (linesMode) {
                // Inline text → wrap each in a block line so alignment + per-line boxes work
                return (
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: layers.align }}>
                    <div style={{ width: "100%", textAlign: layers.textAlign }}>{titleEl}</div>
                    {subEl && <div style={{ width: "100%", textAlign: layers.textAlign, marginTop: `${gapPx}px` }}>{subEl}</div>}
                  </div>
                );
              }

              const wrapStyle = eff.textBoxEnabled ? {
                width: "auto", maxWidth: "100%",
                display: "inline-flex", flexDirection: "column",
                background: `rgba(${r.r},${r.g},${r.b},${op})`,
                padding: `${pad}px ${pad * 1.2}px`,
                borderRadius: `${radius}px`,
                alignSelf: layers.align,
              } : { width: "100%", display: "flex", flexDirection: "column" };

              // Box around the title only: subtitle sits below, outside the box.
              if (eff.textBoxEnabled && !boxSub) {
                return (
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: layers.align }}>
                    <div style={wrapStyle}>{titleEl}</div>
                    {subEl && <div style={{ width: "100%", textAlign: layers.textAlign }}>{subEl}</div>}
                  </div>
                );
              }

              return (<div style={wrapStyle}>{titleEl}{subEl}</div>);
            })()}

            {eff.showTag && post.category && (eff.tagAttachment !== "corner") && (eff.tagInlinePosition || "above") === "below" && (
              <div
                className="post-tag-pill"
                style={{
                  fontSize: `${10 * titleScale}px`,
                  padding: `${5 * titleScale}px ${10 * titleScale}px`,
                  borderColor: `${eff.textColor}33`,
                  backgroundColor: `${eff.textColor}1a`,
                  marginTop: `${12 * titleScale}px`,
                }}
              >
                {post.category}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Layer 4: logo */}
      {eff.showLogo && eff.logoUrl && (() => {
        const inset = 20 * titleScale;
        const map = {
          "top-left":     { top: inset, left: inset, right: "auto", bottom: "auto" },
          "top-center":   { top: inset, left: "50%", right: "auto", bottom: "auto", transform: "translateX(-50%)" },
          "top-right":    { top: inset, right: inset, left: "auto", bottom: "auto" },
          "bottom-left":  { bottom: inset, left: inset, right: "auto", top: "auto" },
          "bottom-center":{ bottom: inset, left: "50%", right: "auto", top: "auto", transform: "translateX(-50%)" },
          "bottom-right": { bottom: inset, right: inset, left: "auto", top: "auto" },
        };
        const lp = map[eff.logoPosition] || map["top-right"];
        return (
          <div
            className="post-canvas-layer logo"
            style={{
              ...lp,
              width: `${36 * titleScale}px`,
              height: `${36 * titleScale}px`,
              backgroundImage: `url(${eff.logoUrl})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
        );
      })()}

      {/* Layer 5: edit hint when editable */}
      {editable && (
        <div className="post-canvas-layer image-hint">
          <div className="image-hint-pill">↑ Trocar imagem</div>
        </div>
      )}

      {/* Layer 4.5: Brand decorative element */}
      {eff.showElement && eff.elementUrl && (() => {
        const inset = 20 * titleScale;
        const sz = (eff.elementSize ?? 80) * titleScale;
        const ep = eff.elementPosition || "bottom-right";
        const map = {
          "top-left":     { top: inset, left: inset },
          "top-center":   { top: inset, left: "50%", transform: "translateX(-50%)" },
          "top-right":    { top: inset, right: inset },
          "mid-left":     { top: "50%", left: inset, transform: "translateY(-50%)" },
          "mid-center":   { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
          "mid-right":    { top: "50%", right: inset, transform: "translateY(-50%)" },
          "bottom-left":  { bottom: inset, left: inset },
          "bottom-center":{ bottom: inset, left: "50%", transform: "translateX(-50%)" },
          "bottom-right": { bottom: inset, right: inset },
        };
        const box = map[ep] || map["bottom-right"];
        return (
          <div style={{
            position: "absolute",
            ...box,
            width: sz, height: sz,
            backgroundImage: `url(${eff.elementUrl})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            opacity: (eff.elementOpacity ?? 100) / 100,
            zIndex: 3,
            pointerEvents: "none",
          }} />
        );
      })()}

      {/* Date — corner */}
      {post.date && eff.showDate !== false && (() => {
        const inset = 16 * titleScale;
        const dp = eff.datePosition || "top-left";
        // Avoid colliding with the logo corner if same
        const dateBox = {
          "top-left":     { top: inset, left: inset },
          "top-center":   { top: inset, left: "50%", transform: "translateX(-50%)" },
          "top-right":    { top: inset, right: inset },
          "bottom-left":  { bottom: inset, left: inset },
          "bottom-center":{ bottom: inset, left: "50%", transform: "translateX(-50%)" },
          "bottom-right": { bottom: inset, right: inset },
        }[dp] || { top: inset, left: inset };
        return (
          <div style={{
            position: "absolute",
            ...dateBox,
            fontFamily: "Apercu Mono, monospace",
            fontSize: `${10 * titleScale}px`,
            letterSpacing: "0.15em",
            color: eff.textColor,
            opacity: 0.7,
            zIndex: 4,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}>{post.date}</div>
        );
      })()}

      {/* Category tag — corner mode */}
      {eff.showTag && post.category && (eff.tagAttachment === "corner") && (() => {
        const inset = 16 * titleScale;
        const tp = eff.tagPosition || "top-right";
        const tagBox = {
          "top-left":     { top: inset, left: inset },
          "top-center":   { top: inset, left: "50%", transform: "translateX(-50%)" },
          "top-right":    { top: inset, right: inset },
          "bottom-left":  { bottom: inset, left: inset },
          "bottom-center":{ bottom: inset, left: "50%", transform: "translateX(-50%)" },
          "bottom-right": { bottom: inset, right: inset },
        }[tp] || { top: inset, right: inset };
        return (
          <div style={{
            position: "absolute",
            ...tagBox,
            fontFamily: "Apercu Mono, monospace",
            fontSize: `${10 * titleScale}px`,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: `${5 * titleScale}px ${10 * titleScale}px`,
            borderRadius: 999,
            background: `${eff.textColor}1a`,
            border: `1px solid ${eff.textColor}33`,
            color: eff.textColor,
            zIndex: 4,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}>{post.category}</div>
        );
      })()}
    </div>
  );
}

window.PostCanvas = PostCanvas;
window.computeLayerStyles = computeLayerStyles;
window.effectiveDesign = effectiveDesign;

// (cornerStyle is defined below for reuse)

// ╔══════════════════════════════════════════════════════════╗
// ║  panel-plans.jsx                                       ║
// ╚══════════════════════════════════════════════════════════╝

// ============================================================
// panel-plans.jsx — Panel 0: Clientes & Planejamentos arquivados
// Two-column layout: clients list (left) + plans grid (right).
// ============================================================

const { useState: useStateLP, useRef: useRefLP } = React;

const MONTH_NAMES_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];
const MONTH_NAMES_FULL_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function PlansPanel({ store, onGoNext }) {
  const {
    savedPlans, activePlanId, activeClient, setActiveClient,
    savePlan, updatePlan, loadPlan, removePlan, renamePlan,
    renameClient, removeClient, newPlan,
    posts, design, showToast,
    isAdmin,
  } = store;

  // Cloud-only clients: live in Supabase but not yet in the local archive
  // (e.g. opening the app on another device). Clicking pulls them down.
  const cloudClients = store.cloudClients || [];
  const [loadingCloud, setLoadingCloud] = useStateLP(null);

  const [renamingClient, setRenamingClient] = useStateLP(null);
  const [renamingClientValue, setRenamingClientValue] = useStateLP("");
  const [showSaveDialog, setShowSaveDialog] = useStateLP(false);

  // Build client list with counts
  const clients = {};
  savedPlans.forEach(p => {
    if (!clients[p.client]) clients[p.client] = [];
    clients[p.client].push(p);
  });
  const clientNames = Object.keys(clients).sort();
  const localNamesLower = new Set(clientNames.map(n => n.toLowerCase()));
  const cloudOnly = cloudClients.filter(c => c.nome && !localNamesLower.has(c.nome.toLowerCase()));
  const visibleClient = activeClient && clients[activeClient] ? activeClient : clientNames[0];
  const visiblePlans = visibleClient ? clients[visibleClient] : [];

  // Group visible plans by year > month
  const groupedByYear = {};
  visiblePlans.forEach(p => {
    if (!groupedByYear[p.year]) groupedByYear[p.year] = {};
    if (!groupedByYear[p.year][p.month]) groupedByYear[p.year][p.month] = [];
    groupedByYear[p.year][p.month].push(p);
  });
  const years = Object.keys(groupedByYear).sort((a,b) => b - a);

  return (
    <div className="plans-panel">
      {/* ============ Clients sidebar ============ */}
      <aside className="clients-sidebar">
        <div className="clients-sidebar-header">
          <div className="eyebrow" style={{ marginBottom: 8 }}>Clientes</div>
          <button className="btn btn-primary btn-small" onClick={() => setShowSaveDialog(true)}
            disabled={!posts.length} style={{ width: "100%", justifyContent: "center" }}>
            ＋ Salvar planejamento atual
          </button>
          <div style={{ marginTop: 8 }}>
            <DownloadCodeButton store={store} />
          </div>
        </div>

        {clientNames.length === 0 ? (
          <div className="clients-empty">
            <div style={{ fontSize: 32, color: "var(--fg-muted)", marginBottom: 6 }}>◇</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500 }}>
              Nenhum cliente
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", marginTop: 6, lineHeight: 1.5 }}>
              Importe um planejamento e salve para criar seu primeiro cliente.
            </div>
          </div>
        ) : (
          <div className="clients-list">
            {clientNames.map(name => {
              const isActive = name === visibleClient;
              const plans = clients[name];
              const isRenaming = renamingClient === name;
              return (
                <div key={name}
                  className={`client-row ${isActive ? "active" : ""}`}
                  onClick={() => !isRenaming && setActiveClient(name)}>
                  <div className="client-avatar" style={{
                    background: plans[plans.length-1]?.design.primaryColor || "var(--night)",
                    color: plans[plans.length-1]?.design.textColor || "var(--cosmic-latte)",
                  }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="client-info">
                    {isRenaming ? (
                      <input
                        autoFocus
                        className="text-input"
                        style={{ fontSize: 12, padding: "4px 6px" }}
                        value={renamingClientValue}
                        onChange={(e) => setRenamingClientValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => {
                          const v = renamingClientValue.trim();
                          if (v && v !== name) {
                            renameClient(name, v);
                            showToast(`Cliente renomeado para "${v}"`);
                          }
                          setRenamingClient(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") setRenamingClient(null);
                        }}
                      />
                    ) : (
                      <div className="client-name"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setRenamingClient(name);
                          setRenamingClientValue(name);
                        }}>{name}</div>
                    )}
                    <div className="client-meta">
                      {plans.length} planejamento{plans.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  {isActive && !isRenaming && isAdmin && (
                    <button className="client-remove" onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remover cliente "${name}" e todos os ${plans.length} planejamentos?`)) {
                        removeClient(name);
                        showToast(`Cliente "${name}" removido`);
                      }
                    }}>✕</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Cloud-only clients: stored in Supabase, not yet pulled locally */}
        {cloudOnly.length > 0 && (
          <div className="cloud-clients">
            <div className="cloud-clients-label">☁ Na nuvem</div>
            {cloudOnly.map(c => (
              <div key={c.id}
                className={`client-row cloud ${loadingCloud === c.id ? "loading" : ""}`}
                title="Carregar posts + design deste cliente do Supabase"
                onClick={async () => {
                  if (loadingCloud) return;
                  setLoadingCloud(c.id);
                  try {
                    await store.openCloudClient(c);
                    showToast(`"${c.nome}" carregado da nuvem ✓`);
                    setTimeout(() => onGoNext?.(), 250);
                  } catch (e) {
                    showToast("Falha ao carregar da nuvem");
                  }
                  setLoadingCloud(null);
                }}>
                <div className="client-avatar cloud-avatar">{(c.nome || "?").charAt(0).toUpperCase()}</div>
                <div className="client-info">
                  <div className="client-name">{c.nome}</div>
                  <div className="client-meta">{loadingCloud === c.id ? "carregando…" : "tocar para carregar"}</div>
                </div>
                <span className="cloud-pull">↓</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ============ Plans content ============ */}
      <section className="plans-content">
        {!visibleClient ? (
          <div className="empty-state">
            <div className="eyebrow">Planejamentos</div>
            <h2>Crie seu primeiro<br/><em>arquivo</em>.</h2>
            <p>Trabalhe normalmente em Upload → Design → Editor, depois salve aqui para reusar depois. Cada planejamento fica organizado por cliente e mês.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={() => onGoNext?.()}>
                Começar um planejamento →
              </button>
              {posts.length > 0 && (
                <button className="btn btn-secondary" onClick={() => setShowSaveDialog(true)}>
                  Salvar o que está aberto
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <header className="plans-header">
              <div>
                <div className="eyebrow">Cliente</div>
                <h1 className="plans-client-name">{visibleClient}</h1>
                <div className="plans-summary">
                  {visiblePlans.length} planejamento{visiblePlans.length === 1 ? "" : "s"} ·
                  {" "}
                  {visiblePlans.reduce((a,p) => a + p.posts.length, 0)} posts no total
                </div>
              </div>
              <div className="plans-header-actions">
                <button className="btn btn-ghost btn-small" onClick={() => {
                  newPlan();
                  showToast("Workspace limpo · pronto para novo planejamento");
                  onGoNext?.();
                }}>
                  + Novo planejamento
                </button>
                <button className="btn btn-primary btn-small" onClick={() => setShowSaveDialog(true)}
                  disabled={!posts.length}>
                  Salvar atual neste cliente
                </button>
              </div>
            </header>

            <div className="plans-grid-wrapper">
              {years.map(year => (
                <div key={year} className="year-section">
                  <div className="year-label">{year}</div>
                  <div className="months-grid">
                    {Array.from({ length: 12 }, (_, idx) => idx + 1).map(monthNum => {
                      const monthPlans = groupedByYear[year][monthNum] || [];
                      const empty = monthPlans.length === 0;
                      return (
                        <div key={`${year}-${monthNum}`} className={`month-cell ${empty ? "empty" : ""}`}>
                          <div className="month-header">
                            <span className="month-num">{String(monthNum).padStart(2,"0")}</span>
                            <span className="month-name">{MONTH_NAMES_FULL_PT[monthNum-1]}</span>
                          </div>
                          {empty ? (
                            <div className="month-empty">—</div>
                          ) : (
                            <div className="month-plans">
                              {monthPlans.map(plan => (
                                <PlanCard key={plan.id} plan={plan}
                                  active={plan.id === activePlanId}
                                  onLoad={() => {
                                    loadPlan(plan.id);
                                    showToast(`Carregado: ${plan.name || MONTH_NAMES_PT[plan.month-1]}/${plan.year}`);
                                    setTimeout(() => onGoNext?.(), 200);
                                  }}
                                  onUpdate={() => {
                                    updatePlan(plan.id);
                                    showToast("Planejamento atualizado");
                                  }}
                                  onRename={(name) => renamePlan(plan.id, { name })}
                                  onRemove={() => {
                                    if (confirm(`Remover "${plan.name || MONTH_NAMES_FULL_PT[plan.month-1]+'/'+plan.year}"?`)) {
                                      removePlan(plan.id);
                                      showToast("Planejamento removido");
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {showSaveDialog && (
        <SaveDialog store={store} onClose={() => setShowSaveDialog(false)} />
      )}
    </div>
  );
}

// -------------------------------------------------------------------
function PlanCard({ plan, active, onLoad, onUpdate, onRename, onRemove }) {
  const [renaming, setRenaming] = useStateLP(false);
  const [name, setName] = useStateLP(plan.name || "");
  const previewPosts = plan.posts.slice(0, 4);
  const savedDate = new Date(plan.savedAt);
  const dateStr = `${String(savedDate.getDate()).padStart(2,"0")}/${String(savedDate.getMonth()+1).padStart(2,"0")} ${String(savedDate.getHours()).padStart(2,"0")}:${String(savedDate.getMinutes()).padStart(2,"0")}`;

  return (
    <div className={`plan-card ${active ? "active" : ""}`}>
      <div className="plan-card-thumbs" onClick={onLoad} title="Carregar este planejamento">
        {previewPosts.length === 0 ? (
          <div className="plan-empty-grid">vazio</div>
        ) : (
          previewPosts.map((p, i) => {
            const d = plan.design;
            const eff = { ...d, ...(p.overrides || {}) };
            return (
              <div key={p.id || i} className="plan-thumb"
                style={{
                  background: p.imageSrc
                    ? `linear-gradient(rgba(${hexToRgb(eff.overlayColor).r},${hexToRgb(eff.overlayColor).g},${hexToRgb(eff.overlayColor).b},${eff.overlayOpacity/100}), rgba(${hexToRgb(eff.overlayColor).r},${hexToRgb(eff.overlayColor).g},${hexToRgb(eff.overlayColor).b},0.05)), url(${p.imageSrc}) center/cover`
                    : eff.primaryColor,
                  color: eff.textColor,
                }}>
                <span style={{
                  fontFamily: eff.titleFont, fontWeight: 700,
                  fontSize: 9, lineHeight: 1.05,
                  textTransform: eff.titleTransform,
                  letterSpacing: "-0.02em",
                  padding: "0 4px",
                  textAlign: "center",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>{p.title}</span>
              </div>
            );
          })
        )}
      </div>
      <div className="plan-card-body">
        {renaming ? (
          <input
            autoFocus
            className="text-input"
            style={{ fontSize: 12, padding: "4px 6px" }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { onRename(name); setRenaming(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setRenaming(false);
            }}
          />
        ) : (
          <div className="plan-card-title"
            onDoubleClick={() => { setName(plan.name || ""); setRenaming(true); }}>
            {plan.name || `${MONTH_NAMES_FULL_PT[plan.month-1]}/${plan.year}`}
            {active && <span className="plan-active-dot" />}
          </div>
        )}
        <div className="plan-card-meta">
          <span>{plan.posts.length} posts</span>
          <span className="dot" />
          <span>salvo {dateStr}</span>
        </div>
      </div>
      <div className="plan-card-actions">
        <button className="plan-act" onClick={onLoad} title="Carregar">↗</button>
        {active && (
          <button className="plan-act" onClick={onUpdate} title="Sobrescrever com workspace atual">↻</button>
        )}
        <button className="plan-act" onClick={() => { setName(plan.name || ""); setRenaming(true); }} title="Renomear">✎</button>
        <button className="plan-act danger" onClick={onRemove} title="Remover">✕</button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
function SaveDialog({ store, onClose }) {
  const { savedPlans, savePlan, posts, design, activeClient, activePlanId, updatePlan, showToast } = store;
  const knownClients = [...new Set(savedPlans.map(p => p.client))].sort();
  const now = new Date();
  const activePlan = savedPlans.find(p => p.id === activePlanId);

  const [client, setClient] = useStateLP(activePlan?.client || activeClient || knownClients[0] || design.brandName || "");
  const [month, setMonth] = useStateLP(activePlan?.month || (now.getMonth() + 1));
  const [year, setYear] = useStateLP(activePlan?.year || now.getFullYear());
  const [name, setName] = useStateLP(activePlan?.name || "");
  const [isNewClient, setIsNewClient] = useStateLP(knownClients.length === 0);

  const handleSave = () => {
    if (!client.trim()) {
      showToast("Informe o nome do cliente");
      return;
    }
    const saved = savePlan({ client: client.trim(), month, year, name });
    showToast(`"${saved.client}" · ${MONTH_NAMES_FULL_PT[saved.month-1]}/${saved.year} salvo ✓`);
    onClose();
  };

  const handleUpdate = () => {
    updatePlan(activePlanId);
    showToast(`Planejamento atual atualizado`);
    onClose();
  };

  return (
    <div className="save-dialog-backdrop" onClick={onClose}>
      <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Salvar planejamento</div>
        <h2 className="save-dialog-title">
          {posts.length} post{posts.length === 1 ? "" : "s"} no <em>arquivo</em>
        </h2>

        <div className="save-dialog-field">
          <label>Cliente</label>
          {knownClients.length > 0 && !isNewClient ? (
            <div style={{ display: "flex", gap: 6 }}>
              <select className="font-select" style={{ flex: 1 }}
                value={client} onChange={(e) => setClient(e.target.value)}>
                {knownClients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn btn-ghost btn-small" onClick={() => { setIsNewClient(true); setClient(""); }}
                style={{ padding: "6px 12px" }}>
                + Novo
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <input className="text-input" placeholder="Nome do cliente"
                value={client} onChange={(e) => setClient(e.target.value)} style={{ flex: 1 }} autoFocus />
              {knownClients.length > 0 && (
                <button className="btn btn-ghost btn-small" onClick={() => setIsNewClient(false)}
                  style={{ padding: "6px 12px" }}>
                  Escolher
                </button>
              )}
            </div>
          )}
        </div>

        <div className="save-dialog-row">
          <div className="save-dialog-field" style={{ flex: 1 }}>
            <label>Mês</label>
            <select className="font-select" value={month} onChange={(e) => setMonth(+e.target.value)}>
              {MONTH_NAMES_FULL_PT.map((m, i) => (
                <option key={i} value={i+1}>{String(i+1).padStart(2,"0")} · {m}</option>
              ))}
            </select>
          </div>
          <div className="save-dialog-field" style={{ flex: 1 }}>
            <label>Ano</label>
            <input className="text-input" type="number" value={year}
              onChange={(e) => setYear(+e.target.value)} min="2020" max="2099" />
          </div>
        </div>

        <div className="save-dialog-field">
          <label>Nome (opcional)</label>
          <input className="text-input" placeholder="Ex: Campanha de lançamento"
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="save-dialog-actions">
          <button className="btn btn-ghost btn-small" onClick={onClose}>
            Cancelar
          </button>
          {activePlanId && (
            <button className="btn btn-secondary btn-small" onClick={handleUpdate}>
              ↻ Sobrescrever
            </button>
          )}
          <button className="btn btn-primary btn-small" onClick={handleSave}>
            {activePlanId ? "Salvar como cópia" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

window.PlansPanel = PlansPanel;
window.MONTH_NAMES_FULL_PT = MONTH_NAMES_FULL_PT;

// ╔══════════════════════════════════════════════════════════╗
// ║  panel-upload.jsx                                      ║
// ╚══════════════════════════════════════════════════════════╝

// ============================================================
// panel-upload.jsx — Panel 1: Upload (unified single page)
// Drop / paste / upload — auto-detects single doc vs multi-file.
// ============================================================

const { useState: useStateU, useRef: useRefU, useCallback: useCBU } = React;

function UploadPanel({ store, onGoNext }) {
  const { posts, addPosts, showToast } = store;

  const [text, setText] = useStateU("");
  const [files, setFiles] = useStateU([]); // [{name, content}]
  const [dragOver, setDragOver] = useStateU(false);
  const [generating, setGenerating] = useStateU(false);
  const fileInputRef = useRefU(null);

  // Unified file handling: 1 file → fills textarea (single doc),
  // 2+ files → file list (one post per file)
  const handleFiles = async (fileList) => {
    const arr = Array.from(fileList || []);
    if (!arr.length) return;
    if (arr.length === 1 && files.length === 0) {
      const content = await readFileText(arr[0]);
      setText(content);
      showToast(`"${arr[0].name}" carregado · pronto para processar`);
      return;
    }
    // Multi-file mode
    const loaded = [];
    for (const f of arr) {
      const content = await readFileText(f);
      loaded.push({ name: f.name, content });
    }
    setFiles((prev) => [...prev, ...loaded]);
    showToast(`${arr.length} arquivo(s) adicionado(s)`);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Smart processing: if files are loaded, use them; else use textarea
  const handleProcess = () => {
    if (files.length > 0) {
      const newPosts = files.map((f, i) => {
        const labelFallback = f.name.replace(/\.(txt|md)$/i, "");
        const parsed = parseSinglePost(f.content, labelFallback);
        const p = makePost(parsed, i);
        p.fileName = f.name;
        return p;
      });
      addPosts(newPosts, "replace");
      showToast(`${newPosts.length} posts importados de arquivos`);
      onGoNext?.();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      showToast("Cole o planejamento ou carregue arquivos primeiro");
      return;
    }
    const parsed = parsePlan(trimmed);
    if (!parsed.length) {
      showToast("Nenhum post detectado");
      return;
    }
    addPosts(parsed, "replace");
    showToast(`${parsed.length} posts importados`);
    onGoNext?.();
  };

  const loadDemo = () => {
    setFiles([]);
    setText(demoPlan);
    showToast("Exemplo carregado · revise e processe");
  };

  const generatePlan = async () => {
    setGenerating(true);
    const prompt = `Você é um estrategista de marketing. Crie um planejamento de conteúdo para Instagram com 6 posts variados sobre marketing, branding e crescimento de marcas (estilo de um estúdio brasileiro chamado Serafina — tagline "MKT Made Simple"). Use exatamente este formato, separando cada post com uma linha contendo apenas "---":

Categoria: [categoria curta]
Data: [DD/MM]
Título: [título punchy, máximo 10 palavras]
Subtítulo: [frase complementar curta]

Legenda:
[Legenda completa em 2-3 parágrafos com tom direto, brasileiro, sem corporativês.]

#hashtag1 #hashtag2 #hashtag3 #hashtag4

---

Datas: comece em hoje e espace os posts a cada 3-4 dias. Retorne APENAS o conteúdo do planejamento, sem comentários.`;
    const result = await callClaude(prompt);
    setGenerating(false);
    if (result) {
      setFiles([]);
      setText(result);
      showToast("Planejamento gerado — revise e processe");
    } else {
      showToast("Falha ao gerar — tente novamente");
    }
  };

  const hasContent = text.trim() || files.length > 0;

  return (
    <div className="upload-panel-unified">
      <div className="upload-inner">
        <div className="upload-header">
          <div className="eyebrow">Upload</div>
          <h1 className="upload-title" style={{ fontFamily: "Apercu", fontSize: "40px" }}>
            Cole, arraste ou<em> gere</em><br /><span style={{ color: "rgb(0, 0, 0)", fontFamily: "Apercu", fontSize: "40px" }}>seu planejamento.</span>
          </h1>
          <p className="upload-desc">
            Cole um documento completo (posts separados por <code>---</code>) ou arraste vários arquivos <code>.txt</code> — um por post.
          </p>
        </div>

        <div className="upload-grid">
          {/* Drop / file list */}
          <div className="upload-card">
            <div className="upload-card-header">
              <span className="upload-card-label">Arquivos</span>
              <span className="upload-card-hint">
                {files.length > 0 ? `${files.length} arquivo${files.length === 1 ? "" : "s"}` : "vazio"}
              </span>
            </div>

            <div
              className={`dropzone-large ${dragOver ? "drag-over" : ""}`}
              onDragOver={(e) => {e.preventDefault();setDragOver(true);}}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}>
              <div className="dropzone-icon">↓</div>
              <div className="dropzone-title">
                Arraste arquivos aqui
              </div>
              <div className="dropzone-hint">
                .txt · .md · um arquivo por post
              </div>
              <input ref={fileInputRef} type="file" multiple accept=".txt,.md"
              onChange={(e) => {handleFiles(e.target.files);e.target.value = "";}}
              style={{ display: "none" }} />
            </div>

            {files.length > 0 &&
            <div className="file-list" style={{ marginTop: 12 }}>
                {files.map((f, i) =>
              <div className="file-list-item" key={i}>
                    <span style={{ color: "var(--infinity-blue)" }}>📄</span>
                    <span className="name">{f.name}</span>
                    <span style={{ color: "var(--fg-muted)", fontSize: 10 }}>
                      {f.content.length}c
                    </span>
                    <button className="remove" onClick={() => removeFile(i)}>✕</button>
                  </div>
              )}
                <button className="btn btn-ghost btn-small" style={{ marginTop: 6, alignSelf: "flex-start" }}
              onClick={() => setFiles([])}>
                  Limpar lista
                </button>
              </div>
            }
          </div>

          {/* Textarea */}
          <div className="upload-card">
            <div className="upload-card-header">
              <span className="upload-card-label">Documento</span>
              <span className="upload-card-hint">
                {text.trim() ? `${text.length} caracteres` : "vazio"}
              </span>
            </div>
            <textarea
              className="textarea-input upload-textarea"
              placeholder={`Cole o planejamento aqui — separe posts com ---

Categoria: Marketing
Data: 15/06
Título: Como crescer no Instagram
Subtítulo: 5 estratégias que funcionam

Legenda:
Texto da legenda em vários parágrafos...

#instagram #marketing #crescimento

---

Categoria: Branding
...`}
              value={text}
              onChange={(e) => {setText(e.target.value);if (files.length) setFiles([]);}}
              disabled={files.length > 0}
              style={files.length > 0 ? { opacity: 0.5 } : {}} />
            
            {files.length > 0 &&
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: "var(--fg-muted)", marginTop: 6, letterSpacing: "0.05em"
            }}>
                ↑ Texto desabilitado — arquivos têm prioridade. Limpe a lista para usar o texto.
              </div>
            }
          </div>
        </div>

        {/* Action bar */}
        <div className="upload-actions">
          <div className="upload-actions-secondary">
            <button className="btn btn-ghost btn-small" onClick={loadDemo}>
              Carregar exemplo
            </button>
            <button className="btn btn-ghost btn-small" onClick={generatePlan} disabled={generating}>
              {generating ? <span className="spinner" /> : "✨"} Gerar com IA
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleProcess} disabled={!hasContent}>
            {posts.length ? "Substituir posts" : "Processar"}
            {hasContent &&
            <span style={{
              marginLeft: 6, opacity: 0.7, fontFamily: "var(--font-mono)", fontSize: 11
            }}>
                {files.length > 0 ? `${files.length} arq` : `${text.split(/\n\s*---\s*\n/).length} blocos`}
              </span>
            }
            <span style={{ marginLeft: 6 }}>→</span>
          </button>
        </div>

        {/* Status + Format help */}
        <div className="upload-bottom-grid">
          <div className="format-help">
            <span className="label">Formato esperado por bloco</span>
{`Categoria: Marketing
Data: 15/06
Título: Título punchy
Subtítulo: Frase complementar

Legenda:
Texto da legenda preservando
as quebras de linha originais...

#instagram #marketing #brasil`}
          </div>

          <div className="upload-status-card">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Status atual</div>
            <div className="status-grid">
              <div className="status-cell">
                <div className="num">{posts.length}</div>
                <div className="label">Posts</div>
              </div>
              <div className="status-cell">
                <div className="num">{posts.filter((p) => p.imageSrc).length}</div>
                <div className="label">Imagens</div>
              </div>
              <div className="status-cell">
                <div className="num">{posts.filter((p) => p.caption).length}</div>
                <div className="label">Legendas</div>
              </div>
            </div>
            {posts.length > 0 &&
            <button className="btn btn-secondary btn-small" style={{ marginTop: 18, minWidth: 240, justifyContent: "center" }}
            onClick={() => onGoNext?.()}>
                Ir para Design System →
              </button>
            }
          </div>
        </div>
      </div>
    </div>);

}

window.UploadPanel = UploadPanel;

// ╔══════════════════════════════════════════════════════════╗
// ║  panel-design.jsx                                      ║
// ╚══════════════════════════════════════════════════════════╝

// ============================================================
// panel-design.jsx — Panel 2: Design System configuration
// Color, fonts, overlay, logo, content position.
// Shows a live preview canvas on the right.
// ============================================================

const { useState: useStateD, useRef: useRefD } = React;

// ----- Palette chip --------------------------------------------------
function PaletteChip({ palette, builtin, active, onApply, onRemove }) {
  return (
    <div className={`palette-chip ${active ? "active" : ""}`} onClick={onApply}>
      <div className="palette-swatches">
        <span className="sw" style={{ background: palette.primary, zIndex: 3 }} />
        <span className="sw" style={{ background: palette.overlay, zIndex: 2 }} />
        <span className="sw" style={{ background: palette.text, zIndex: 1 }} />
      </div>
      <div className="palette-meta">
        <div className="name">{palette.name}</div>
        <div className="kind">{builtin ? "built-in" : "custom"}</div>
      </div>
      <button className="palette-remove" onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
        title={builtin ? "Ocultar paleta" : "Remover paleta"}>✕</button>
    </div>
  );
}

function DesignPanel({ store, onGoNext }) {
  const { design, setDesign, posts, showToast, customPalettes, addPalette, removePalette,
          hiddenPalettes, hideBuiltinPalette, restoreBuiltinPalette,
          customFonts, addCustomFont, removeCustomFont,
          savedBrands, activeBrandId, saveBrand, updateBrand, loadBrand, removeBrand, renameBrand } = store;
  const isAdmin = store.isAdmin;
  const logoInputRef = useRefD(null);
  const fontInputRef = useRefD(null);
  const [paletteEditor, setPaletteEditor] = useStateD(null);
  const [renamingId, setRenamingId] = useStateD(null);
  const [renameValue, setRenameValue] = useStateD("");
  const [editingLogoId, setEditingLogoId] = useStateD(null);
  const [editingLogoLabel, setEditingLogoLabel] = useStateD("");

  const handleFontUpload = async (file) => {
    if (!file) return;
    const dataUrl = await readFileDataURL(file);
    const name = file.name.replace(/\.(otf|ttf|woff2?|eot)$/i, "");
    if ((customFonts || []).some(f => f.name === name)) {
      showToast(`"${name}" já existe na biblioteca`);
      return;
    }
    addCustomFont({ name, dataUrl, fileName: file.name });
    showToast(`Fonte "${name}" carregada`);
  };
  const samplePost = posts[0] || {
    title: "Marketing, feito simples.",
    subtitle: "Uma marca que as pessoas se lembram.",
    category: "Branding",
    date: "15/06",
    imageSrc: null,
  };

  const set = (key, val) => setDesign(prev => ({ ...prev, [key]: val }));

  const handleLogoUpload = async (file) => {
    if (!file) return;
    const url = await readFileDataURL(file);
    const label = file.name.replace(/\.[^.]+$/, "").slice(0, 20) || "Logo";
    const id = `lib-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    setDesign(prev => ({
      ...prev,
      logoUrl: url,
      logoLibrary: [...(prev.logoLibrary || []), { id, url, label, custom: true }],
    }));
    showToast(`Logo "${label}" adicionado à biblioteca`);
  };

  const removeLogo = (id) => {
    setDesign(prev => {
      const lib = (prev.logoLibrary || []).filter(l => l.id !== id);
      const removed = (prev.logoLibrary || []).find(l => l.id === id);
      return {
        ...prev,
        logoLibrary: lib,
        logoUrl: removed && removed.url === prev.logoUrl ? (lib[0]?.url || null) : prev.logoUrl,
      };
    });
  };

  const renameLogo = (id, label) => {
    setDesign(prev => ({
      ...prev,
      logoLibrary: (prev.logoLibrary || []).map(l => l.id === id ? { ...l, label } : l),
    }));
  };

  const applyPalette = (palette) => {
    setDesign(prev => ({
      ...prev,
      primaryColor: palette.primary,
      textColor: palette.text,
      overlayColor: palette.overlay,
    }));
    showToast(`Paleta "${palette.name}" aplicada`);
  };

  // ----- Brand card -----
  const BrandCard = ({ brand }) => {
    const isActive = brand.id === activeBrandId;
    const d = brand.design;
    return (
      <div className={`brand-card ${isActive ? "active" : ""}`} onClick={() => {
        if (renamingId === brand.id) return;
        loadBrand(brand.id);
        showToast(`Marca "${brand.name}" carregada`);
      }}>
        <div className="brand-card-preview" style={{
          background: d.primaryColor,
          color: d.textColor,
        }}>
          {d.logoUrl && (
            <img src={d.logoUrl} alt="" className="brand-card-logo" />
          )}
          <div className="brand-card-name-preview" style={{
            fontFamily: d.titleFont,
            fontWeight: 700,
            color: d.textColor,
          }}>
            {(d.brandName || brand.name).split(/\s+/)[0].toUpperCase()}
          </div>
        </div>
        <div className="brand-card-body">
          {renamingId === brand.id ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => {
                if (renameValue.trim()) renameBrand(brand.id, renameValue.trim());
                setRenamingId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setRenamingId(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-input"
              style={{ fontSize: 11, padding: "4px 6px" }}
            />
          ) : (
            <div className="brand-card-name" onDoubleClick={(e) => {
              e.stopPropagation();
              setRenamingId(brand.id);
              setRenameValue(brand.name);
            }}>{brand.name}</div>
          )}
          <div className="brand-card-meta">
            @{d.username || "—"}
          </div>
          {isActive && (
            <div className="brand-card-actions">
              <button className="brand-card-act" onClick={(e) => {
                e.stopPropagation();
                updateBrand(brand.id);
                showToast(`"${brand.name}" atualizada`);
              }} title="Sobrescrever com design atual">↻ Atualizar</button>
              <button className="brand-card-act" onClick={(e) => {
                e.stopPropagation();
                setRenamingId(brand.id);
                setRenameValue(brand.name);
              }} title="Renomear">✎</button>
              <button className="brand-card-act danger" onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Remover marca "${brand.name}"?`)) {
                  removeBrand(brand.id);
                  showToast(`"${brand.name}" removida`);
                }
              }} title="Remover" style={isAdmin ? undefined : { display: "none" }}>✕</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleSaveBrand = () => {
    const name = prompt("Nome da marca:", design.brandName || "Nova marca");
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (savedBrands.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
      if (!confirm(`Já existe "${trimmed}". Salvar como cópia?`)) return;
    }
    const saved = saveBrand(trimmed);
    setDesign(d => ({ ...d, brandName: saved.name }));
    showToast(`Marca "${saved.name}" salva ✓`);
  };

  return (
    <div className="design-panel">
      {/* ========== Controls column ========== */}
      <div className="design-controls">
        <div className="eyebrow" style={{ marginBottom: 8 }}>Design System</div>
        <h2 style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 700, fontSize: 28, letterSpacing: "-0.025em",
          textTransform: "uppercase", margin: "0 0 28px", lineHeight: 1.05,
        }}>
          Configure a <em style={{
            fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400,
            color: "var(--infinity-blue)", textTransform: "none", letterSpacing: 0,
          }}>identidade</em>.
        </h2>

        {/* --- Saved brands (full design profiles) --- */}
        <div className="control-group">
          <div className="brands-header">
            <div className="control-group-title" style={{ margin: 0 }}>Marcas salvas</div>
            <button className="btn btn-primary btn-small" onClick={handleSaveBrand}
              style={{ padding: "5px 12px", fontSize: 11 }}>
              ＋ Salvar marca atual
            </button>
          </div>

          {savedBrands.length === 0 ? (
            <div className="brands-empty">
              <div style={{ fontSize: 22, color: "var(--fg-muted)", marginBottom: 4 }}>◇</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500, color: "var(--fg)" }}>
                Nenhuma marca salva
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", marginTop: 4, lineHeight: 1.5 }}>
                Configure cores, fontes e logo abaixo,<br/>depois clique em "Salvar marca atual"<br/>para reutilizar em outros planejamentos.
              </div>
            </div>
          ) : (
            <div className="brand-cards">
              {savedBrands.map(b => <BrandCard key={b.id} brand={b} />)}
            </div>
          )}

          {savedBrands.length > 0 && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", marginTop: 8, letterSpacing: "0.05em" }}>
              ↑ Clique para carregar · duplo-clique no nome para renomear
            </div>
          )}
        </div>

        {/* --- Brand --- */}
        <div className="control-group">
          <div className="control-group-title">Marca</div>
          <div style={{ marginBottom: 10 }}>
            <input className="text-input" placeholder="Nome da marca"
              value={design.brandName} onChange={(e) => set("brandName", e.target.value)} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <input className="text-input" placeholder="@username"
              value={design.username} onChange={(e) => set("username", e.target.value)} />
          </div>
          <textarea className="caption-textarea" style={{ minHeight: 70, fontSize: 12, marginBottom: 12 }}
            placeholder="Bio (uma linha por parágrafo)"
            value={design.profileBio} onChange={(e) => set("profileBio", e.target.value)} />

          {/* Profile photo */}
          <div style={{
            padding: 12, background: "var(--latte-deep)",
            borderRadius: "var(--radius-md)",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "var(--fg-muted)", marginBottom: 10,
            }}>
              Foto de perfil
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              {/* Avatar preview */}
              <div style={{
                width: 56, height: 56,
                borderRadius: "50%",
                border: "1px solid var(--border)",
                overflow: "hidden",
                background: design.profileAvatarUrl
                  ? `url(${design.profileAvatarUrl}) ${design.profileAvatarPosX ?? 50}% ${design.profileAvatarPosY ?? 50}%/${design.profileAvatarScale ?? 100}% no-repeat var(--bg-elevated)`
                  : design.logoUrl
                    ? `url(${design.logoUrl}) center/70% no-repeat var(--bg-elevated)`
                    : "var(--bg-elevated)",
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <button className="btn btn-ghost btn-small"
                  style={{ padding: "5px 10px", fontSize: 11 }}
                  onClick={async () => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async (ev) => {
                      const file = ev.target.files[0];
                      if (!file) return;
                      const url = await readFileDataURL(file);
                      setDesign(d => ({
                        ...d,
                        profileAvatarUrl: url,
                        profileAvatarScale: 100,
                        profileAvatarPosX: 50,
                        profileAvatarPosY: 50,
                      }));
                      showToast("Foto de perfil atualizada");
                    };
                    input.click();
                  }}>
                  {design.profileAvatarUrl ? "Trocar foto" : "Carregar foto"}
                </button>
                {design.profileAvatarUrl && (
                  <button className="btn btn-ghost btn-small"
                    style={{ padding: "5px 10px", fontSize: 11, color: "var(--fg-muted)" }}
                    onClick={() => set("profileAvatarUrl", null)}>
                    Remover · usar logo
                  </button>
                )}
                {!design.profileAvatarUrl && (
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: 9,
                    color: "var(--fg-muted)", letterSpacing: "0.05em",
                  }}>
                    ↳ usando a logo como avatar
                  </div>
                )}
              </div>
            </div>

            {design.profileAvatarUrl && (
              <>
                <div className="slider-row" style={{ marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", minWidth: 36 }}>ZOOM</span>
                  <input type="range" min="50" max="300" value={design.profileAvatarScale ?? 100}
                    onChange={(e) => set("profileAvatarScale", +e.target.value)} />
                  <span className="value">{design.profileAvatarScale ?? 100}%</span>
                </div>
                <div className="slider-row" style={{ marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", minWidth: 36 }}>X</span>
                  <input type="range" min="0" max="100" value={design.profileAvatarPosX ?? 50}
                    onChange={(e) => set("profileAvatarPosX", +e.target.value)} />
                  <span className="value">{Math.round(design.profileAvatarPosX ?? 50)}</span>
                </div>
                <div className="slider-row">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", minWidth: 36 }}>Y</span>
                  <input type="range" min="0" max="100" value={design.profileAvatarPosY ?? 50}
                    onChange={(e) => set("profileAvatarPosY", +e.target.value)} />
                  <span className="value">{Math.round(design.profileAvatarPosY ?? 50)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* --- Palettes --- */}
        <div className="control-group">
          <div className="control-group-title">Paletas (marcas)</div>
          <div className="palette-list">
            {PALETTES.filter(p => !(hiddenPalettes || []).includes(p.name)).map(p => (
              <PaletteChip key={p.name} palette={p} builtin={true}
                active={p.primary === design.primaryColor && p.text === design.textColor}
                onApply={() => applyPalette(p)}
                onRemove={() => {
                  if (confirm(`Ocultar paleta "${p.name}"? Você pode restaurá-la depois.`)) {
                    hideBuiltinPalette(p.name);
                    showToast(`Paleta "${p.name}" ocultada`);
                  }
                }} />
            ))}
            {customPalettes.map(p => (
              <PaletteChip key={p.name} palette={p} builtin={false}
                active={p.primary === design.primaryColor && p.text === design.textColor}
                onApply={() => applyPalette(p)}
                onRemove={() => {
                  if (confirm(`Remover paleta "${p.name}"?`)) {
                    removePalette(p.name);
                    showToast(`Paleta "${p.name}" removida`);
                  }
                }} />
            ))}
            <button className="palette-add"
              onClick={() => setPaletteEditor({
                name: "Nova marca",
                primary: design.primaryColor,
                text: design.textColor,
                overlay: design.overlayColor,
              })}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
              <span>Nova paleta</span>
            </button>
          </div>

          {(hiddenPalettes || []).length > 0 && (
            <details className="hidden-palettes-section">
              <summary>
                {hiddenPalettes.length} paleta{hiddenPalettes.length === 1 ? "" : "s"} ocultada{hiddenPalettes.length === 1 ? "" : "s"}
              </summary>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                {hiddenPalettes.map(name => (
                  <div key={name} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "6px 10px",
                    fontFamily: "var(--font-mono)", fontSize: 11,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--fg-muted)",
                  }}>
                    <span>{name}</span>
                    <button onClick={() => {
                      restoreBuiltinPalette(name);
                      showToast(`"${name}" restaurada`);
                    }} style={{
                      background: "transparent", border: "1px solid var(--border)",
                      fontFamily: "var(--font-mono)", fontSize: 9,
                      letterSpacing: "0.05em", padding: "2px 8px",
                      borderRadius: 999, cursor: "pointer",
                      color: "var(--infinity-blue)",
                    }}>↺ restaurar</button>
                  </div>
                ))}
              </div>
            </details>
          )}

          {paletteEditor && (
            <div className="palette-editor">
              <div className="palette-editor-title">Nova paleta de marca</div>
              <input className="text-input" style={{ marginBottom: 8 }}
                placeholder="Nome da marca"
                value={paletteEditor.name}
                onChange={(e) => setPaletteEditor({ ...paletteEditor, name: e.target.value })} />
              <div className="palette-editor-row">
                <label>Primária</label>
                <input type="color" value={paletteEditor.primary}
                  onChange={(e) => setPaletteEditor({ ...paletteEditor, primary: e.target.value })} />
                <input type="text" value={paletteEditor.primary}
                  onChange={(e) => setPaletteEditor({ ...paletteEditor, primary: e.target.value })} />
              </div>
              <div className="palette-editor-row">
                <label>Texto</label>
                <input type="color" value={paletteEditor.text}
                  onChange={(e) => setPaletteEditor({ ...paletteEditor, text: e.target.value })} />
                <input type="text" value={paletteEditor.text}
                  onChange={(e) => setPaletteEditor({ ...paletteEditor, text: e.target.value })} />
              </div>
              <div className="palette-editor-row">
                <label>Overlay</label>
                <input type="color" value={paletteEditor.overlay}
                  onChange={(e) => setPaletteEditor({ ...paletteEditor, overlay: e.target.value })} />
                <input type="text" value={paletteEditor.overlay}
                  onChange={(e) => setPaletteEditor({ ...paletteEditor, overlay: e.target.value })} />
              </div>
              <div className="palette-editor-preview"
                style={{ background: paletteEditor.primary, color: paletteEditor.text }}>
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, letterSpacing: "-0.02em", textTransform: "uppercase", fontSize: 13 }}>
                  {paletteEditor.name || "Sample"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button className="btn btn-primary btn-small" onClick={() => {
                  const name = paletteEditor.name.trim() || `Marca ${customPalettes.length + 1}`;
                  if ([...PALETTES, ...customPalettes].some(p => p.name === name)) {
                    showToast("Já existe uma paleta com esse nome");
                    return;
                  }
                  addPalette({ name, primary: paletteEditor.primary, text: paletteEditor.text, overlay: paletteEditor.overlay });
                  applyPalette(paletteEditor);
                  setPaletteEditor(null);
                  showToast(`Paleta "${name}" salva`);
                }}>Salvar</button>
                <button className="btn btn-ghost btn-small" onClick={() => setPaletteEditor(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- Colors --- */}
        <div className="control-group">
          <div className="control-group-title">Cores</div>
          <div className="control-row">
            <label>Primária</label>
            <div className="color-input-row" style={{ flex: 1, maxWidth: 180 }}>
              <input type="color" value={design.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)} />
              <input type="text" value={design.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)} />
            </div>
          </div>
          <div className="control-row">
            <label>Texto</label>
            <div className="color-input-row" style={{ flex: 1, maxWidth: 180 }}>
              <input type="color" value={design.textColor}
                onChange={(e) => set("textColor", e.target.value)} />
              <input type="text" value={design.textColor}
                onChange={(e) => set("textColor", e.target.value)} />
            </div>
          </div>
          <div className="control-row">
            <label>Overlay</label>
            <div className="color-input-row" style={{ flex: 1, maxWidth: 180 }}>
              <input type="color" value={design.overlayColor}
                onChange={(e) => set("overlayColor", e.target.value)} />
              <input type="text" value={design.overlayColor}
                onChange={(e) => set("overlayColor", e.target.value)} />
            </div>
          </div>
          <div className="control-row">
            <label>Opacidade do overlay</label>
            <div className="slider-row" style={{ flex: 1, maxWidth: 180 }}>
              <input type="range" min="0" max="100" value={design.overlayOpacity}
                onChange={(e) => set("overlayOpacity", +e.target.value)} />
              <span className="value">{design.overlayOpacity}%</span>
            </div>
          </div>
          <div className="control-row">
            <label>Direção</label>
            <select className="pos-select" style={{ flex: 1, maxWidth: 180 }}
              value={design.overlayDirection}
              onChange={(e) => set("overlayDirection", e.target.value)}>
              <option value="to top">↑ De baixo p/ cima</option>
              <option value="to bottom">↓ De cima p/ baixo</option>
              <option value="to right">→ Esquerda p/ direita</option>
              <option value="to left">← Direita p/ esquerda</option>
              <option value="to top right">↗ Diagonal</option>
              <option value="135deg">↘ Diagonal inversa</option>
            </select>
          </div>
        </div>

        {/* --- Typography --- */}
        <div className="control-group">
          <div className="control-group-title">Tipografia</div>

          {/* Custom font library */}
          <div style={{
            padding: 12, marginBottom: 12,
            background: "var(--latte-deep)",
            borderRadius: "var(--radius-md)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 8, gap: 10,
            }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 10,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--fg-muted)",
              }}>
                Minhas fontes · {(customFonts || []).length}
              </span>
              <button className="btn btn-ghost btn-small"
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => fontInputRef.current?.click()}>
                ＋ Carregar do PC
              </button>
              <input ref={fontInputRef} type="file"
                accept=".otf,.ttf,.woff,.woff2"
                onChange={(e) => { handleFontUpload(e.target.files[0]); e.target.value = ""; }}
                style={{ display: "none" }} />
            </div>
            {(customFonts || []).length === 0 ? (
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 10,
                color: "var(--fg-muted)", lineHeight: 1.5,
              }}>
                Suba .otf, .ttf, .woff ou .woff2 — a fonte fica disponível em todos os dropdowns.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {customFonts.map(f => (
                  <div key={f.name} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 10px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                  }}>
                    <span style={{
                      fontFamily: f.name,
                      fontSize: 16,
                      flex: 1,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{f.name} Aa</span>
                    <button onClick={() => set("titleFont", f.name)}
                      title="Usar no título"
                      style={{
                        background: "transparent", border: "1px solid var(--border)",
                        fontFamily: "var(--font-mono)", fontSize: 9,
                        letterSpacing: "0.05em", padding: "2px 6px",
                        borderRadius: 4, cursor: "pointer", color: "var(--fg-muted)",
                      }}>T</button>
                    <button onClick={() => set("subtitleFont", f.name)}
                      title="Usar no subtítulo"
                      style={{
                        background: "transparent", border: "1px solid var(--border)",
                        fontFamily: "var(--font-mono)", fontSize: 9,
                        letterSpacing: "0.05em", padding: "2px 6px",
                        borderRadius: 4, cursor: "pointer", color: "var(--fg-muted)",
                      }}>S</button>
                    <button onClick={() => {
                      if (confirm(`Remover "${f.name}"?`)) {
                        removeCustomFont(f.name);
                        showToast(`"${f.name}" removida`);
                      }
                    }} style={{
                      background: "transparent", border: "none",
                      color: "var(--fg-muted)", cursor: "pointer", padding: "0 4px",
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="control-row">
            <label>Fonte do título</label>
            <select className="font-select" style={{ flex: 1, maxWidth: 200 }}
              value={design.titleFont} onChange={(e) => set("titleFont", e.target.value)}>
              {(customFonts || []).length > 0 && (
                <optgroup label="Minhas fontes">
                  {customFonts.map(f => (
                    <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>
                      {f.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {FONT_GROUPS.map(group => (
                <optgroup key={group} label={group}>
                  {FONT_OPTIONS.filter(f => f.group === group).map(f => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="control-row">
            <label>Tamanho do título</label>
            <div className="slider-row" style={{ flex: 1, maxWidth: 200 }}>
              <input type="range" min="20" max="80" value={design.titleSize}
                onChange={(e) => set("titleSize", +e.target.value)} />
              <span className="value">{design.titleSize}px</span>
            </div>
          </div>
          <div className="control-row">
            <label>Peso</label>
            <select className="font-select" style={{ flex: 1, maxWidth: 200 }}
              value={design.titleWeight} onChange={(e) => set("titleWeight", +e.target.value)}>
              <option value={300}>300 Light</option>
              <option value={400}>400 Regular</option>
              <option value={500}>500 Medium</option>
              <option value={700}>700 Bold</option>
            </select>
          </div>
          <div className="control-row">
            <label>Caixa</label>
            <select className="font-select" style={{ flex: 1, maxWidth: 200 }}
              value={design.titleTransform} onChange={(e) => set("titleTransform", e.target.value)}>
              <option value="none">Aa Normal</option>
              <option value="uppercase">AA Maiúscula</option>
              <option value="lowercase">aa Minúscula</option>
            </select>
          </div>
          <div className="control-row">
            <label>Fonte do subtítulo</label>
            <select className="font-select" style={{ flex: 1, maxWidth: 200 }}
              value={design.subtitleFont} onChange={(e) => set("subtitleFont", e.target.value)}>
              {(customFonts || []).length > 0 && (
                <optgroup label="Minhas fontes">
                  {customFonts.map(f => (
                    <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>
                      {f.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {FONT_GROUPS.map(group => (
                <optgroup key={group} label={group}>
                  {FONT_OPTIONS.filter(f => f.group === group).map(f => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="control-row">
            <label>Tamanho do subtítulo</label>
            <div className="slider-row" style={{ flex: 1, maxWidth: 200 }}>
              <input type="range" min="10" max="32" value={design.subtitleSize}
                onChange={(e) => set("subtitleSize", +e.target.value)} />
              <span className="value">{design.subtitleSize}px</span>
            </div>
          </div>
        </div>

        {/* --- Logo + tags --- */}
        <div className="control-group">
          <div className="control-group-title">Logo & elementos</div>
          <div className="control-row">
            <label>Mostrar logo</label>
            <input type="checkbox" checked={design.showLogo}
              onChange={(e) => set("showLogo", e.target.checked)} />
          </div>
          <div className="control-row">
            <label>Mostrar tag de categoria</label>
            <input type="checkbox" checked={design.showTag}
              onChange={(e) => set("showTag", e.target.checked)} />
          </div>

          <div className="logo-library-header">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
              Biblioteca · {(design.logoLibrary || []).length}
            </span>
            <button className="btn btn-ghost btn-small" onClick={() => logoInputRef.current?.click()}
              style={{ padding: "4px 10px", fontSize: 11 }}>
              ＋ Upload
            </button>
            <input ref={logoInputRef} type="file" accept="image/*"
              onChange={(e) => { handleLogoUpload(e.target.files[0]); e.target.value = ""; }}
              style={{ display: "none" }} />
          </div>

          <div className="logo-grid">
            {(design.logoLibrary || []).map(logo => {
              const active = design.logoUrl === logo.url;
              const isEditing = editingLogoId === logo.id;
              return (
                <div key={logo.id}
                  className={`logo-tile ${active ? "active" : ""}`}
                  onClick={() => !isEditing && set("logoUrl", logo.url)}
                  title={logo.label}>
                  <div className="logo-tile-img" style={{
                    backgroundImage: `url(${logo.url})`,
                  }} />
                  {isEditing ? (
                    <input
                      autoFocus
                      className="logo-tile-input"
                      value={editingLogoLabel}
                      onChange={(e) => setEditingLogoLabel(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => {
                        if (editingLogoLabel.trim()) renameLogo(logo.id, editingLogoLabel.trim());
                        setEditingLogoId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditingLogoId(null);
                      }}
                    />
                  ) : (
                    <div className="logo-tile-label" onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingLogoId(logo.id);
                      setEditingLogoLabel(logo.label);
                    }}>{logo.label}</div>
                  )}
                  {active && <div className="logo-tile-badge">✓</div>}
                  <button className="logo-tile-remove" onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Remover "${logo.label}" da biblioteca?`)) {
                      removeLogo(logo.id);
                      showToast(`"${logo.label}" removida`);
                    }
                  }} title="Remover da biblioteca">✕</button>
                </div>
              );
            })}
            <div className="logo-tile logo-tile-add" onClick={() => logoInputRef.current?.click()}>
              <div style={{ fontSize: 24, color: "var(--fg-muted)" }}>+</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--fg-muted)" }}>UPLOAD</div>
            </div>
          </div>

          {(design.logoLibrary || []).length > 0 && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--fg-muted)", marginBottom: 10, letterSpacing: "0.05em" }}>
              ↑ Clique para usar · duplo-clique no label para renomear · ✕ para remover
            </div>
          )}

          {design.logoUrl ? (
            <div className="logo-current">
              <div className="logo-current-thumb" style={{ backgroundImage: `url(${design.logoUrl})` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--fg-muted)", textTransform: "uppercase" }}>
                  Em uso
                </div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {(design.logoLibrary || []).find(l => l.url === design.logoUrl)?.label || "Logo"}
                </div>
              </div>
              <button className="btn btn-ghost btn-small" style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => set("logoUrl", null)}>
                Limpar
              </button>
            </div>
          ) : (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", textAlign: "center", padding: 10 }}>
              Nenhum logo selecionado
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 8, display: "flex", gap: 10 }}>
          <button className="btn btn-primary" onClick={onGoNext}>
            Continuar para Editor →
          </button>
        </div>
      </div>

      {/* ========== Preview column ========== */}
      <div className="design-preview-area">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <div className="eyebrow">Preview</div>
          <PostCanvas post={samplePost} design={design} size={400} />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-muted)", letterSpacing: "0.1em" }}>
            1080 × 1350 · ASPECT 4:5
          </div>
        </div>
      </div>
    </div>
  );
}

window.DesignPanel = DesignPanel;

// ╔══════════════════════════════════════════════════════════╗
// ║  panel-editor.jsx                                      ║
// ╚══════════════════════════════════════════════════════════╝

// ============================================================
// panel-editor.jsx — Panel 3: Post editor
// Posts sidebar (left) · Canvas (center) · Controls (right)
// ============================================================

const { useState: useStateE, useRef: useRefE, useCallback: useCBE } = React;

// Collapsible section
function CollapsibleSection({ title, defaultOpen = true, badge, children }) {
  const [open, setOpen] = useStateE(defaultOpen);
  return (
    <div className={`editor-section collapsible ${open ? "open" : "closed"}`}>
      <button className="section-toggle" onClick={() => setOpen(!open)} style={{ opacity: "100" }}>
        <span className="section-toggle-chev">{open ? "▾" : "▸"}</span>
        <span className="section-toggle-label">{title}</span>
        {badge && <span className="section-toggle-badge">{badge}</span>}
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>);

}

// 6-corner picker for date / logo / etc.
const CORNER_KEYS = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];

function CornerPicker({ value, onChange }) {
  return (
    <div className="corner-picker">
      {CORNER_KEYS.map((k) =>
      <div key={k}
      className={`corner-cell ${value === k ? "active" : ""}`}
      onClick={() => onChange(k)}
      title={k} />

      )}
    </div>);

}

// Small "Override" label with reset button when active
function OverrideLabel({ name, active, onReset }) {
  return (
    <div className="ov-label">
      <span>{name}</span>
      {active ?
      <button className="ov-pill ov-active" onClick={onReset} title="Voltar ao padrão da marca">
          <span className="ov-dot" />
          custom · ↺
        </button> :

      <span className="ov-pill">herda</span>
      }
    </div>);

}

function PostsSidebar({ store }) {
  const { posts, selectedPostId, setSelectedPostId, design, addEmptyPost, removePost } = store;
  return (
    <div className="posts-sidebar">
      <div className="posts-sidebar-header">
        <span className="title">Posts ({posts.length})</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {posts.length > 0 && <SendToCanvaButton store={store} compact={true} />}
          {posts.length > 0 && <ExportAllButton store={store} compact={true} />}
          <button className="icon-btn" onClick={addEmptyPost} title="Adicionar post">+</button>
        </div>
      </div>
      {posts.length === 0 &&
      <div style={{
        padding: 20, textAlign: "center", fontFamily: "var(--font-mono)",
        fontSize: 11, color: "var(--fg-muted)", border: "1px dashed var(--border)",
        borderRadius: 8, marginTop: 12
      }}>
          Nenhum post. Volte ao Upload, ou crie um novo com +.
        </div>
      }
      {posts.map((p, i) => {
        const active = p.id === selectedPostId;
        return (
          <div key={p.id} className={`post-tile ${active ? "active" : ""}`}
          onClick={() => setSelectedPostId(p.id)}>
            <div className="post-tile-thumb"
            style={p.imageSrc ? {
              backgroundImage: `url(${p.imageSrc})`,
              backgroundSize: "cover", backgroundPosition: "center"
            } : { backgroundColor: design.primaryColor }}>
              {!p.imageSrc &&
              <span style={{ color: design.textColor, opacity: 0.7 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              }
            </div>
            <div className="post-tile-info">
              <div className="idx">{String(i + 1).padStart(2, "0")} {p.date && `· ${p.date}`}</div>
              <div className="title">{p.title || "(sem título)"}</div>
              <div className="cat">{p.category || "—"}</div>
            </div>
            {posts.length > 1 &&
            <button className="remove" onClick={(e) => {
              e.stopPropagation();
              if (confirm("Remover este post?")) removePost(p.id);
            }} style={{
              background: "transparent", border: "none",
              color: active ? "var(--slate-40)" : "var(--fg-muted)",
              fontSize: 14, padding: "0 4px", cursor: "pointer"
            }}>×</button>
            }
          </div>);

      })}
    </div>);

}

function CanvasArea({ store }) {
  const { selectedPost, design, updatePost } = store;
  const fileRef = useRefE(null);
  const dragRef = useRefE({ down: false, startX: 0, startY: 0, origX: 50, origY: 50 });

  if (!selectedPost) {
    return (
      <div className="editor-canvas-area">
        <div className="empty-state">
          <div className="eyebrow">Editor</div>
          <h2>Nenhum post <em>selecionado</em>.</h2>
          <p>Escolha um post na barra lateral, ou volte ao painel de Upload para importar um planejamento.</p>
        </div>
      </div>);

  }

  const handleImageUpload = async (file) => {
    if (!file) return;
    const url = await readFileDataURL(file);
    updatePost(selectedPost.id, { imageSrc: url });
  };

  const onCanvasClick = (e) => {
    // Only trigger upload if clicking the bg layer, not the editable text
    const target = e.target;
    if (target.classList.contains("contenteditable")) return;
    if (target.closest(".contenteditable")) return;
    if (target.classList.contains("post-tag-pill")) return;
    if (!selectedPost.imageSrc) {
      fileRef.current?.click();
    }
  };

  // Drag to reposition image
  const onMouseDown = (e) => {
    if (!selectedPost.imageSrc) return;
    if (e.target.closest(".contenteditable")) return;
    dragRef.current = {
      down: true,
      startX: e.clientX, startY: e.clientY,
      origX: selectedPost.imagePosX, origY: selectedPost.imagePosY
    };
    e.preventDefault();
  };
  const onMouseMove = (e) => {
    if (!dragRef.current.down) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    // 400px canvas — translate movement into percent (inverted because bg-position moves view, not image)
    const newX = clamp(dragRef.current.origX - dx * 0.25, 0, 100);
    const newY = clamp(dragRef.current.origY - dy * 0.25, 0, 100);
    updatePost(selectedPost.id, { imagePosX: newX, imagePosY: newY });
  };
  const onMouseUp = () => {dragRef.current.down = false;};

  return (
    <div className="editor-canvas-area"
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
    onMouseLeave={onMouseUp}>
      <div className="editor-canvas-inner">
        <div className="canvas-meta-bar">
          <span>POST {(store.posts.findIndex((p) => p.id === selectedPost.id) + 1).toString().padStart(2, "0")}</span>
          <span className="sep" />
          <span>{selectedPost.category || "—"}</span>
          {selectedPost.date && <><span className="sep" /><span>{selectedPost.date}</span></>}
          <span className="sep" />
          <span>1080 × 1350</span>
        </div>

        <div onClick={onCanvasClick} onMouseDown={onMouseDown}
        className={selectedPost.imageSrc ? "post-canvas dragging-handle" : ""}>
          <PostCanvas
            post={selectedPost}
            design={design}
            editable={true}
            size={380}
            onUpdate={(patch) => updatePost(selectedPost.id, patch)} />
          
        </div>

        <input ref={fileRef} type="file" accept="image/*"
        onChange={(e) => handleImageUpload(e.target.files[0])}
        style={{ display: "none" }} />

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-small" onClick={() => fileRef.current?.click()}>
            {selectedPost.imageSrc ? "🖼 Trocar imagem" : "🖼 Adicionar imagem"}
          </button>
          {selectedPost.imageSrc &&
          <button className="btn btn-ghost btn-small"
          onClick={() => updatePost(selectedPost.id, { imageSrc: null })}>
              Remover imagem
            </button>
          }
        </div>
      </div>
    </div>);

}

function EditorSidebar({ store }) {
  const { selectedPost, design, updatePost, showToast,
    layoutPresets, saveLayoutPreset, removeLayoutPreset } = store;
  const txtFileRef = useRefE(null);
  const [genCap, setGenCap] = useStateE(false);
  const [genTags, setGenTags] = useStateE(false);

  if (!selectedPost) {
    return <div className="editor-sidebar"></div>;
  }

  // Per-post override helpers
  const overrides = selectedPost.overrides || {};
  const eff = { ...design, ...overrides };
  const setOverride = (key, val) => {
    updatePost(selectedPost.id, {
      overrides: { ...overrides, [key]: val }
    });
  };
  const clearOverride = (key) => {
    const next = { ...overrides };
    delete next[key];
    updatePost(selectedPost.id, { overrides: next });
  };
  const clearAllOverrides = () => {
    updatePost(selectedPost.id, { overrides: {} });
  };
  const has = (key) => Object.prototype.hasOwnProperty.call(overrides, key);
  const overrideCount = Object.keys(overrides).length;

  const handleTxtUpload = async (file) => {
    if (!file) return;
    const content = await readFileText(file);
    const parsed = parseSinglePost(content, file.name.replace(/\.(txt|md)$/i, ""));
    updatePost(selectedPost.id, {
      title: parsed.title || selectedPost.title,
      subtitle: parsed.subtitle || selectedPost.subtitle,
      category: parsed.category || selectedPost.category,
      date: parsed.date || selectedPost.date,
      caption: parsed.caption || selectedPost.caption,
      hashtags: parsed.hashtags || selectedPost.hashtags,
      fileName: file.name
    });
    showToast(`Arquivo "${file.name}" aplicado a este post`);
  };

  const generateCaption = async () => {
    setGenCap(true);
    const prompt = `Escreva uma legenda de Instagram em português brasileiro para um post com este título: "${selectedPost.title}" e subtítulo: "${selectedPost.subtitle}". Categoria: ${selectedPost.category || "geral"}. Tom: direto, brasileiro, sem corporativês. Curto: 2 parágrafos curtos + uma chamada para ação no final. NÃO inclua hashtags. NÃO use emojis em excesso (no máximo 1-2). Retorne APENAS o texto da legenda.`;
    const result = await callClaude(prompt);
    setGenCap(false);
    if (result) {
      updatePost(selectedPost.id, { caption: result.trim() });
      showToast("Legenda gerada ✨");
    } else {
      showToast("Falha ao gerar legenda");
    }
  };

  const generateHashtags = async () => {
    setGenTags(true);
    const prompt = `Sugira de 8 a 12 hashtags relevantes para um post de Instagram com este título: "${selectedPost.title}". Categoria: ${selectedPost.category || "geral"}. Foque em hashtags brasileiras de marketing/branding/conteúdo, mix de tamanho (alguns nichados, alguns mais amplos). Retorne APENAS as hashtags, separadas por espaço, todas começando com #. Sem outros caracteres.`;
    const result = await callClaude(prompt);
    setGenTags(false);
    if (result) {
      updatePost(selectedPost.id, { hashtags: result.trim() });
      showToast("Hashtags sugeridas ✨");
    } else {
      showToast("Falha ao gerar hashtags");
    }
  };

  return (
    <div className="editor-sidebar">
      <div className="eyebrow" style={{ marginBottom: 6 }}>Editor</div>
      <h3 style={{
        fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 700,
        margin: "0 0 18px", letterSpacing: "-0.02em"
      }}>{selectedPost.title || "(sem título)"}</h3>

      {/* Meta */}
      <CollapsibleSection title="Metadados" defaultOpen={true}>
        <div style={{ display: "grid", gap: 8 }}>
          <input className="text-input" placeholder="Categoria"
          value={selectedPost.category}
          onChange={(e) => updatePost(selectedPost.id, { category: e.target.value })} />
          <input className="text-input" placeholder="Data (ex: 15/06)"
          value={selectedPost.date}
          onChange={(e) => updatePost(selectedPost.id, { date: e.target.value })} />
        </div>

        {/* Date positioning */}
        <div style={{ marginTop: 14 }}>
          <OverrideLabel name="Mostrar data" active={has("showDate")}
          onReset={() => clearOverride("showDate")} />
          <div className="toggle-pill-group" style={{ background: "var(--latte-deep)", marginBottom: 10 }}>
            <button className={`toggle-pill ${eff.showDate !== false ? "active" : ""}`}
            onClick={() => setOverride("showDate", true)}>Sim</button>
            <button className={`toggle-pill ${eff.showDate === false ? "active" : ""}`}
            onClick={() => setOverride("showDate", false)}>Não</button>
          </div>

          {eff.showDate !== false &&
          <>
              <OverrideLabel name="Posição da data" active={has("datePosition")}
            onReset={() => clearOverride("datePosition")} />
              <CornerPicker value={eff.datePosition || "top-left"}
            onChange={(v) => setOverride("datePosition", v)} />
            </>
          }
        </div>

        {/* Category tag positioning */}
        {selectedPost.category &&
        <div style={{ marginTop: 14 }}>
            <OverrideLabel name="Mostrar tag de categoria" active={has("showTag")}
          onReset={() => clearOverride("showTag")} />
            <div className="toggle-pill-group" style={{ background: "var(--latte-deep)", marginBottom: 10 }}>
              <button className={`toggle-pill ${eff.showTag ? "active" : ""}`}
            onClick={() => setOverride("showTag", true)}>Sim</button>
              <button className={`toggle-pill ${!eff.showTag ? "active" : ""}`}
            onClick={() => setOverride("showTag", false)}>Não</button>
            </div>

            {eff.showTag &&
          <>
                <OverrideLabel name="Modo da tag" active={has("tagAttachment")}
            onReset={() => clearOverride("tagAttachment")} />
                <div className="toggle-pill-group" style={{ background: "var(--latte-deep)", marginBottom: 10 }}>
                  <button className={`toggle-pill ${(eff.tagAttachment || "inline") === "inline" ? "active" : ""}`}
              onClick={() => setOverride("tagAttachment", "inline")}>↕ Junto ao título</button>
                  <button className={`toggle-pill ${eff.tagAttachment === "corner" ? "active" : ""}`}
              onClick={() => setOverride("tagAttachment", "corner")}>↗ Canto livre</button>
                </div>

                {(eff.tagAttachment || "inline") === "inline" &&
            <>
                    <OverrideLabel name="Tag em relação ao título" active={has("tagInlinePosition")}
              onReset={() => clearOverride("tagInlinePosition")} />
                    <div className="toggle-pill-group" style={{ background: "var(--latte-deep)", marginBottom: 10 }}>
                      <button className={`toggle-pill ${(eff.tagInlinePosition || "above") === "above" ? "active" : ""}`}
                onClick={() => setOverride("tagInlinePosition", "above")}>↑ Acima</button>
                      <button className={`toggle-pill ${eff.tagInlinePosition === "below" ? "active" : ""}`}
                onClick={() => setOverride("tagInlinePosition", "below")}>↓ Abaixo</button>
                    </div>
                  </>
            }

                {eff.tagAttachment === "corner" &&
            <>
                    <OverrideLabel name="Posição da tag" active={has("tagPosition")}
              onReset={() => clearOverride("tagPosition")} />
                    <CornerPicker value={eff.tagPosition || "top-right"}
              onChange={(v) => setOverride("tagPosition", v)} />
                  </>
            }
              </>
          }
          </div>
        }
      </CollapsibleSection>

      {/* Per-post layout overrides */}
      <CollapsibleSection title="Layout do post"
      defaultOpen={false}>
        {/* Save / apply layout presets */}
        <div style={{
          padding: 10, marginBottom: 14,
          background: "var(--latte-deep)",
          borderRadius: "var(--radius-md)"
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 8, gap: 8
          }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "var(--fg-muted)"
            }}>
              Layouts salvos · {(layoutPresets || []).length}
            </span>
            <button className="btn btn-ghost btn-small"
            style={{ padding: "4px 10px", fontSize: 11 }}
            disabled={overrideCount === 0}
            onClick={() => {
              if (overrideCount === 0) return;
              const name = prompt("Nome para este layout:", `Layout ${(layoutPresets || []).length + 1}`);
              if (!name || !name.trim()) return;
              saveLayoutPreset(name, selectedPost.overrides);
              showToast(`Layout "${name}" salvo`);
            }}>
              ＋ Salvar atual
            </button>
          </div>
          {overrideCount === 0 && (layoutPresets || []).length === 0 &&
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--fg-muted)", lineHeight: 1.5
          }}>
              Ajuste o layout abaixo, depois salve para reaplicar em outros posts.
            </div>
          }
          {(layoutPresets || []).length > 0 &&
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {layoutPresets.map((preset) => {
              const overrideKeys = Object.keys(preset.overrides || {});
              return (
                <div key={preset.id} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 10px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)"
                }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                      fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}>{preset.name}</div>
                      <div style={{
                      fontFamily: "var(--font-mono)", fontSize: 9,
                      color: "var(--fg-muted)", letterSpacing: "0.05em"
                    }}>{overrideKeys.length} props</div>
                    </div>
                    <button onClick={() => {
                    updatePost(selectedPost.id, { overrides: { ...(preset.overrides || {}) } });
                    showToast(`Layout "${preset.name}" aplicado`);
                  }} title="Aplicar a este post"
                  style={{
                    background: "var(--infinity-blue)", border: "none",
                    color: "var(--cosmic-latte)",
                    fontFamily: "var(--font-mono)", fontSize: 9,
                    letterSpacing: "0.05em", padding: "3px 8px",
                    borderRadius: 999, cursor: "pointer"
                  }}>aplicar</button>
                    <button onClick={() => {
                    if (confirm(`Remover layout "${preset.name}"?`)) {
                      removeLayoutPreset(preset.id);
                      showToast(`"${preset.name}" removido`);
                    }
                  }} style={{
                    background: "transparent", border: "none",
                    color: "var(--fg-muted)", cursor: "pointer", padding: "0 4px",
                    fontSize: 12
                  }}>✕</button>
                  </div>);

            })}
            </div>
          }
        </div>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", marginBottom: 10, lineHeight: 1.5 }}>
          Sobrescreve o design system só para este post.
          {overrideCount > 0 &&
          <> · <button onClick={clearAllOverrides}
            style={{
              background: "transparent", border: "none", padding: 0, cursor: "pointer",
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--infinity-blue)",
              textDecoration: "underline"
            }}>resetar tudo</button></>
          }
        </div>

        {/* Position picker */}
        <OverrideLabel name="Posição" active={has("contentPosition")}
        onReset={() => clearOverride("contentPosition")} />
        <div className="pos-grid" style={{ maxWidth: "100%", marginBottom: 14 }}>
          {POSITION_KEYS.map((k) =>
          <div key={k}
          className={`pos-cell ${eff.contentPosition === k ? "active" : ""}`}
          onClick={() => setOverride("contentPosition", k)}
          title={k} />

          )}
        </div>

        {/* Padding (inset from edges) */}
        <OverrideLabel name="Espaçamento das bordas" active={has("contentPadding")}
        onReset={() => clearOverride("contentPadding")} />
        <div className="slider-row" style={{ marginBottom: 14 }}>
          <input type="range" min="0" max="120" value={eff.contentPadding ?? 36}
          onChange={(e) => setOverride("contentPadding", +e.target.value)} />
          <span className="value">{eff.contentPadding ?? 36}px</span>
        </div>

        {/* Content max-width */}
        <OverrideLabel name="Largura máxima do texto" active={has("contentMaxWidth")}
        onReset={() => clearOverride("contentMaxWidth")} />
        <div className="slider-row" style={{ marginBottom: 14 }}>
          <input type="range" min="30" max="100" value={eff.contentMaxWidth ?? 100}
          onChange={(e) => setOverride("contentMaxWidth", +e.target.value)} />
          <span className="value">{eff.contentMaxWidth ?? 100}%</span>
        </div>

        {/* Title size */}
        <OverrideLabel name="Tamanho do título" active={has("titleSize")}
        onReset={() => clearOverride("titleSize")} />
        <div className="slider-row" style={{ marginBottom: 12 }}>
          <input type="range" min="20" max="120" value={eff.titleSize}
          onChange={(e) => setOverride("titleSize", +e.target.value)} />
          <span className="value">{eff.titleSize}px</span>
        </div>

        {/* Title line-height */}
        <OverrideLabel name="Entrelinha do título" active={has("titleLineHeight")}
        onReset={() => clearOverride("titleLineHeight")} />
        <div className="slider-row" style={{ marginBottom: 12 }}>
          <input type="range" min="0.8" max="2" step="0.05" value={eff.titleLineHeight ?? 1.0}
          onChange={(e) => setOverride("titleLineHeight", +e.target.value)} />
          <span className="value">{(eff.titleLineHeight ?? 1.0).toFixed(2)}</span>
        </div>

        {/* Subtitle controls */}
        <OverrideLabel name="Tamanho do subtítulo" active={has("subtitleSize")}
        onReset={() => clearOverride("subtitleSize")} />
        <div className="slider-row" style={{ marginBottom: 12 }}>
          <input type="range" min="8" max="60" value={eff.subtitleSize}
          onChange={(e) => setOverride("subtitleSize", +e.target.value)} />
          <span className="value">{eff.subtitleSize}px</span>
        </div>

        {/* Subtitle line-height */}
        <OverrideLabel name="Entrelinha do subtítulo" active={has("subtitleLineHeight")}
        onReset={() => clearOverride("subtitleLineHeight")} />
        <div className="slider-row" style={{ marginBottom: 12 }}>
          <input type="range" min="0.8" max="2" step="0.05" value={eff.subtitleLineHeight ?? 1.35}
          onChange={(e) => setOverride("subtitleLineHeight", +e.target.value)} />
          <span className="value">{(eff.subtitleLineHeight ?? 1.35).toFixed(2)}</span>
        </div>

        {/* Spacing between title and subtitle */}
        <OverrideLabel name="Espaço entre título e subtítulo" active={has("titleSubtitleGap")}
        onReset={() => clearOverride("titleSubtitleGap")} />
        <div className="slider-row" style={{ marginBottom: 12 }}>
          <input type="range" min="0" max="80" value={eff.titleSubtitleGap ?? 14}
          onChange={(e) => setOverride("titleSubtitleGap", +e.target.value)} />
          <span className="value">{eff.titleSubtitleGap ?? 14}px</span>
        </div>

        <OverrideLabel name="Fonte do subtítulo" active={has("subtitleFont")}
        onReset={() => clearOverride("subtitleFont")} />
        <select className="font-select" style={{ width: "100%", marginBottom: 12 }}
        value={eff.subtitleFont} onChange={(e) => setOverride("subtitleFont", e.target.value)}>
          {FONT_GROUPS.map((group) =>
          <optgroup key={group} label={group}>
              {FONT_OPTIONS.filter((f) => f.group === group).map((f) =>
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </option>
            )}
            </optgroup>
          )}
        </select>

        <OverrideLabel name="Fonte do título" active={has("titleFont")}
        onReset={() => clearOverride("titleFont")} />
        <select className="font-select" style={{ width: "100%", marginBottom: 12 }}
        value={eff.titleFont} onChange={(e) => setOverride("titleFont", e.target.value)}>
          {FONT_GROUPS.map((group) =>
          <optgroup key={group} label={group}>
              {FONT_OPTIONS.filter((f) => f.group === group).map((f) =>
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </option>
            )}
            </optgroup>
          )}
        </select>

        {/* Text color */}
        <OverrideLabel name="Cor do texto" active={has("textColor")}
        onReset={() => clearOverride("textColor")} />
        <div className="color-input-row" style={{ marginBottom: 12 }}>
          <input type="color" value={eff.textColor}
          onChange={(e) => setOverride("textColor", e.target.value)} />
          <input type="text" value={eff.textColor}
          onChange={(e) => setOverride("textColor", e.target.value)} />
        </div>

        {/* Text background box */}
        <div style={{
          marginTop: 16, marginBottom: 12,
          padding: 12, background: "var(--latte-deep)",
          borderRadius: "var(--radius-md)"
        }}>
          <OverrideLabel name="Caixa atrás do texto" active={has("textBoxEnabled")}
          onReset={() => clearOverride("textBoxEnabled")} />
          <div className="toggle-pill-group" style={{ background: "var(--bg)", marginBottom: 10 }}>
            <button className={`toggle-pill ${eff.textBoxEnabled ? "active" : ""}`}
            onClick={() => setOverride("textBoxEnabled", true)}>Com caixa</button>
            <button className={`toggle-pill ${!eff.textBoxEnabled ? "active" : ""}`}
            onClick={() => setOverride("textBoxEnabled", false)}>Sem caixa</button>
          </div>

          {eff.textBoxEnabled &&
          <>
              <OverrideLabel name="Estilo da caixa" active={has("textBoxMode")}
            onReset={() => clearOverride("textBoxMode")} />
              <div className="toggle-pill-group" style={{ background: "var(--bg)", marginBottom: 10 }}>
                <button className={`toggle-pill ${(eff.textBoxMode || "block") === "block" ? "active" : ""}`}
              onClick={() => setOverride("textBoxMode", "block")}>▭ Bloco único</button>
                <button className={`toggle-pill ${eff.textBoxMode === "lines" ? "active" : ""}`}
              onClick={() => setOverride("textBoxMode", "lines")}>≣ Por linha</button>
              </div>
              {eff.textBoxMode === "lines" &&
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 9.5, lineHeight: 1.5,
                color: "var(--fg-muted)", margin: "-2px 0 10px", letterSpacing: "0.03em",
              }}>
                  Cada linha do texto ganha sua própria caixa, espaçada. Diminua a “Largura máxima do texto” para quebrar em mais linhas.
                </div>
              }

              <OverrideLabel name="Caixa no subtítulo" active={has("textBoxSubtitle")}
            onReset={() => clearOverride("textBoxSubtitle")} />
              <div className="toggle-pill-group" style={{ background: "var(--bg)", marginBottom: 10 }}>
                <button className={`toggle-pill ${eff.textBoxSubtitle !== false ? "active" : ""}`}
              onClick={() => setOverride("textBoxSubtitle", true)}>Com caixa</button>
                <button className={`toggle-pill ${eff.textBoxSubtitle === false ? "active" : ""}`}
              onClick={() => setOverride("textBoxSubtitle", false)}>Só o título</button>
              </div>

              <OverrideLabel name="Cor da caixa" active={has("textBoxColor")}
            onReset={() => clearOverride("textBoxColor")} />
              <div className="color-input-row" style={{ marginBottom: 10 }}>
                <input type="color" value={eff.textBoxColor || "#151619"}
              onChange={(e) => setOverride("textBoxColor", e.target.value)} />
                <input type="text" value={eff.textBoxColor || "#151619"}
              onChange={(e) => setOverride("textBoxColor", e.target.value)} />
              </div>
              {/* Quick color swatches */}
              <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                {["#151619", "#FAF4E4", "#1D40BA", "#FFFFFF", "#000000", design.primaryColor, design.overlayColor].map((c, i) =>
              <button key={i} onClick={() => setOverride("textBoxColor", c)}
              style={{
                width: 20, height: 20, padding: 0,
                background: c,
                border: `1px solid ${(eff.textBoxColor || "#151619").toLowerCase() === c.toLowerCase() ? "var(--infinity-blue)" : "var(--border)"}`,
                borderRadius: "50%",
                cursor: "pointer",
                boxShadow: (eff.textBoxColor || "#151619").toLowerCase() === c.toLowerCase() ? "0 0 0 2px var(--bg)" : "none"
              }} />
              )}
              </div>

              <OverrideLabel name="Opacidade da caixa" active={has("textBoxOpacity")}
            onReset={() => clearOverride("textBoxOpacity")} />
              <div className="slider-row" style={{ marginBottom: 10 }}>
                <input type="range" min="0" max="100" value={eff.textBoxOpacity ?? 70}
              onChange={(e) => setOverride("textBoxOpacity", +e.target.value)} />
                <span className="value">{eff.textBoxOpacity ?? 70}%</span>
              </div>

              <OverrideLabel name="Espaço interno" active={has("textBoxPadding")}
            onReset={() => clearOverride("textBoxPadding")} />
              <div className="slider-row" style={{ marginBottom: 10 }}>
                <input type="range" min="0" max="60" value={eff.textBoxPadding ?? 20}
              onChange={(e) => setOverride("textBoxPadding", +e.target.value)} />
                <span className="value">{eff.textBoxPadding ?? 20}px</span>
              </div>

              <OverrideLabel name="Arredondamento" active={has("textBoxRadius")}
            onReset={() => clearOverride("textBoxRadius")} />
              <div className="slider-row">
                <input type="range" min="0" max="40" value={eff.textBoxRadius ?? 0}
              onChange={(e) => setOverride("textBoxRadius", +e.target.value)} />
                <span className="value">{eff.textBoxRadius ?? 0}px</span>
              </div>
            </>
          }
        </div>

        {/* Overlay opacity */}
        <OverrideLabel name="Opacidade do overlay" active={has("overlayOpacity")}
        onReset={() => clearOverride("overlayOpacity")} />
        <div className="slider-row" style={{ marginBottom: 12 }}>
          <input type="range" min="0" max="100" value={eff.overlayOpacity}
          onChange={(e) => setOverride("overlayOpacity", +e.target.value)} />
          <span className="value">{eff.overlayOpacity}%</span>
        </div>

        {/* Toggles */}
        <div className="control-row" style={{ marginBottom: 4 }}>
          <label style={{ fontSize: 12 }}>
            Mostrar logo {has("showLogo") && <span className="ov-dot" />}
          </label>
          <input type="checkbox" checked={eff.showLogo}
          onChange={(e) => setOverride("showLogo", e.target.checked)} />
          {has("showLogo") &&
          <button className="ov-reset" onClick={() => clearOverride("showLogo")}>↺</button>
          }
        </div>

        {eff.showLogo && eff.logoUrl &&
        <div style={{ marginTop: 10 }}>
            <OverrideLabel name="Posição da logo" active={has("logoPosition")}
          onReset={() => clearOverride("logoPosition")} />
            <CornerPicker value={eff.logoPosition || "top-right"}
          onChange={(v) => setOverride("logoPosition", v)} />
          </div>
        }

        {/* Decorative brand element */}
        <div style={{
          marginTop: 16, marginBottom: 12,
          padding: 12, background: "var(--latte-deep)",
          borderRadius: "var(--radius-md)"
        }}>
          <OverrideLabel name="Elemento decorativo" active={has("showElement")}
          onReset={() => clearOverride("showElement")} />
          <div className="toggle-pill-group" style={{ background: "var(--bg)", marginBottom: 10 }}>
            <button className={`toggle-pill ${eff.showElement ? "active" : ""}`}
            onClick={() => setOverride("showElement", true)}>Mostrar</button>
            <button className={`toggle-pill ${!eff.showElement ? "active" : ""}`}
            onClick={() => setOverride("showElement", false)}>Ocultar</button>
          </div>

          {eff.showElement &&
          <>
              <OverrideLabel name="Imagem do elemento" active={has("elementUrl")}
            onReset={() => clearOverride("elementUrl")} />
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <div style={{
                width: 48, height: 48,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                background: eff.elementUrl ? `url(${eff.elementUrl}) center/contain no-repeat var(--bg)` : "var(--bg)"
              }} />
                <button className="btn btn-ghost btn-small"
              style={{ flex: 1, padding: "6px 10px", fontSize: 11 }}
              onClick={async () => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async (ev) => {
                  const file = ev.target.files[0];
                  if (!file) return;
                  const url = await readFileDataURL(file);
                  setOverride("elementUrl", url);
                  showToast("Elemento adicionado");
                };
                input.click();
              }}>
                  {eff.elementUrl ? "Trocar" : "Carregar"} PNG/SVG
                </button>
              </div>
              {/* Quick library: logos as decorative elements */}
              {(design.logoLibrary || []).length > 0 &&
            <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                  {design.logoLibrary.slice(0, 6).map((logo) =>
              <button key={logo.id} onClick={() => setOverride("elementUrl", logo.url)}
              title={logo.label}
              style={{
                width: 32, height: 32, padding: 3,
                background: `url(${logo.url}) center/contain no-repeat var(--bg)`,
                border: `1px solid ${eff.elementUrl === logo.url ? "var(--infinity-blue)" : "var(--border)"}`,
                borderRadius: "var(--radius-sm)",
                cursor: "pointer"
              }} />
              )}
                </div>
            }

              <OverrideLabel name="Posição" active={has("elementPosition")}
            onReset={() => clearOverride("elementPosition")} />
              <div className="pos-grid" style={{ maxWidth: "100%", marginBottom: 10, gridTemplateColumns: "repeat(3,1fr)", aspectRatio: "1" }}>
                {["top-left", "top-center", "top-right", "mid-left", "mid-center", "mid-right", "bottom-left", "bottom-center", "bottom-right"].map((k) =>
              <div key={k}
              className={`pos-cell ${(eff.elementPosition || "bottom-right") === k ? "active" : ""}`}
              onClick={() => setOverride("elementPosition", k)}
              title={k} />

              )}
              </div>

              <OverrideLabel name="Tamanho" active={has("elementSize")}
            onReset={() => clearOverride("elementSize")} />
              <div className="slider-row" style={{ marginBottom: 10 }}>
                <input type="range" min="20" max="400" value={eff.elementSize ?? 80}
              onChange={(e) => setOverride("elementSize", +e.target.value)} />
                <span className="value">{eff.elementSize ?? 80}px</span>
              </div>

              <OverrideLabel name="Opacidade" active={has("elementOpacity")}
            onReset={() => clearOverride("elementOpacity")} />
              <div className="slider-row">
                <input type="range" min="0" max="100" value={eff.elementOpacity ?? 100}
              onChange={(e) => setOverride("elementOpacity", +e.target.value)} />
                <span className="value">{eff.elementOpacity ?? 100}%</span>
              </div>
            </>
          }
        </div>

        <div className="control-row">
          <label style={{ fontSize: 12 }}>
            Mostrar tag {has("showTag") && <span className="ov-dot" />}
          </label>
          <input type="checkbox" checked={eff.showTag}
          onChange={(e) => setOverride("showTag", e.target.checked)} />
          {has("showTag") &&
          <button className="ov-reset" onClick={() => clearOverride("showTag")}>↺</button>
          }
        </div>

        {eff.showTag && selectedPost.category &&
        <div style={{ marginTop: 10 }}>
            <OverrideLabel name="Modo da tag" active={has("tagAttachment")}
          onReset={() => clearOverride("tagAttachment")} />
            <div className="toggle-pill-group" style={{ background: "var(--latte-deep)", marginBottom: 10 }}>
              <button className={`toggle-pill ${(eff.tagAttachment || "inline") === "inline" ? "active" : ""}`}
            onClick={() => setOverride("tagAttachment", "inline")}>↕ Junto ao título</button>
              <button className={`toggle-pill ${eff.tagAttachment === "corner" ? "active" : ""}`}
            onClick={() => setOverride("tagAttachment", "corner")}>↗ Canto livre</button>
            </div>

            {(eff.tagAttachment || "inline") === "inline" &&
          <>
                <OverrideLabel name="Tag em relação ao título" active={has("tagInlinePosition")}
            onReset={() => clearOverride("tagInlinePosition")} />
                <div className="toggle-pill-group" style={{ background: "var(--latte-deep)", marginBottom: 10 }}>
                  <button className={`toggle-pill ${(eff.tagInlinePosition || "above") === "above" ? "active" : ""}`}
              onClick={() => setOverride("tagInlinePosition", "above")}>↑ Acima</button>
                  <button className={`toggle-pill ${eff.tagInlinePosition === "below" ? "active" : ""}`}
              onClick={() => setOverride("tagInlinePosition", "below")}>↓ Abaixo</button>
                </div>
              </>
          }

            {eff.tagAttachment === "corner" &&
          <>
                <OverrideLabel name="Posição da tag" active={has("tagPosition")}
            onReset={() => clearOverride("tagPosition")} />
                <CornerPicker value={eff.tagPosition || "top-right"}
            onChange={(v) => setOverride("tagPosition", v)} />
              </>
          }
          </div>
        }
      </CollapsibleSection>

      {/* Image controls */}
      <CollapsibleSection title="Imagem" defaultOpen={false}>
        <div style={{ display: "grid", gap: 8 }}>
          <div className="slider-row">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", minWidth: 36 }}>ZOOM</span>
            <input type="range" min="50" max="300" value={selectedPost.imageScale || 100}
            disabled={!selectedPost.imageSrc}
            onChange={(e) => updatePost(selectedPost.id, { imageScale: +e.target.value })} />
            <span className="value">{selectedPost.imageScale || 100}%</span>
          </div>
          <div className="slider-row">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", minWidth: 36 }}>X</span>
            <input type="range" min="0" max="100" value={selectedPost.imagePosX || 50}
            disabled={!selectedPost.imageSrc}
            onChange={(e) => updatePost(selectedPost.id, { imagePosX: +e.target.value })} />
            <span className="value">{Math.round(selectedPost.imagePosX || 50)}</span>
          </div>
          <div className="slider-row">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", minWidth: 36 }}>Y</span>
            <input type="range" min="0" max="100" value={selectedPost.imagePosY || 50}
            disabled={!selectedPost.imageSrc}
            onChange={(e) => updatePost(selectedPost.id, { imagePosY: +e.target.value })} />
            <span className="value">{Math.round(selectedPost.imagePosY || 50)}</span>
          </div>
          {selectedPost.imageSrc &&
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-muted)", marginTop: 4 }}>
              ↳ ou arraste a imagem no canvas
            </div>
          }
        </div>
      </CollapsibleSection>

      {/* Caption */}
      <CollapsibleSection title="Legenda" defaultOpen={false}>
        <textarea className="caption-textarea"
        placeholder="Texto da legenda..."
        value={selectedPost.caption}
        onChange={(e) => updatePost(selectedPost.id, { caption: e.target.value })} />
        <button className="btn btn-ghost btn-small" style={{ marginTop: 8 }}
        onClick={generateCaption} disabled={genCap}>
          {genCap ? <span className="spinner" /> : "✨"} Gerar com IA
        </button>
      </CollapsibleSection>

      {/* Hashtags */}
      <CollapsibleSection title="Hashtags" defaultOpen={false}>
        <textarea className="hashtags-input" rows="3"
        placeholder="#marketing #branding #brasil"
        value={selectedPost.hashtags}
        onChange={(e) => updatePost(selectedPost.id, { hashtags: e.target.value })}
        style={{ minHeight: 60 }} />
        <button className="btn btn-ghost btn-small" style={{ marginTop: 8 }}
        onClick={generateHashtags} disabled={genTags}>
          {genTags ? <span className="spinner" /> : "✨"} Sugerir hashtags
        </button>
      </CollapsibleSection>

      {/* Per-post .txt file */}
      <CollapsibleSection title="Arquivo do post" defaultOpen={false}>
        {selectedPost.fileName ?
        <div className="file-status-row">
            <span className="dot" />
            <span className="name">{selectedPost.fileName}</span>
            <button className="remove" onClick={() => updatePost(selectedPost.id, { fileName: null })}
          style={{ background: "transparent", border: "none", color: "var(--fg-muted)", cursor: "pointer" }}>✕</button>
          </div> :

        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-muted)", marginBottom: 8 }}>
            Carregue um .txt para preencher título, subtítulo, legenda e hashtags só deste post.
          </div>
        }
        <button className="btn btn-ghost btn-small" style={{ marginTop: 4 }}
        onClick={() => txtFileRef.current?.click()}>
          📄 {selectedPost.fileName ? "Recarregar" : "Carregar"} .txt
        </button>
        <input ref={txtFileRef} type="file" accept=".txt,.md"
        onChange={(e) => {handleTxtUpload(e.target.files[0]);e.target.value = "";}}
        style={{ display: "none" }} />
      </CollapsibleSection>
    </div>);

}

function EditorPanel({ store }) {
  return (
    <div className="editor-panel">
      <PostsSidebar store={store} />
      <CanvasArea store={store} />
      <EditorSidebar store={store} />
    </div>);

}

window.EditorPanel = EditorPanel;

// ╔══════════════════════════════════════════════════════════╗
// ║  panel-preview.jsx                                     ║
// ╚══════════════════════════════════════════════════════════╝

// ============================================================
// panel-preview.jsx — Panel 4: Instagram Feed Preview
// Realistic iPhone frame · feed + profile tabs · light/dark
// ============================================================

const { useState: useStateP, useRef: useRefP, useEffect: useEffectP } = React;

// ----- Icons (simple SVG outline, IG style) ----------------------
const I = {
  heart: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  comment: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  ),
  share: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  bookmark: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  plus: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  dm: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  home: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M22 9.81L12 2 2 9.81V22h7v-7h6v7h7z"/></svg>
  ),
  search: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  reels: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M3 8h18M8 3v18"/>
      <polygon points="11 11 16 13.5 11 16 11 11" fill="currentColor" stroke="none"/>
    </svg>
  ),
  user: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 21v-1a8 8 0 0 1 16 0v1"/>
    </svg>
  ),
  menu: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  back: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  signal: (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
      <rect x="0" y="7" width="3" height="4" rx="1"/>
      <rect x="4" y="5" width="3" height="6" rx="1"/>
      <rect x="8" y="3" width="3" height="8" rx="1"/>
      <rect x="12" y="0" width="3" height="11" rx="1"/>
    </svg>
  ),
  wifi: (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
      <path d="M8 0a13.46 13.46 0 0 1 9.32 3.7l-1.34 1.34A11.66 11.66 0 0 0 8 1.9 11.66 11.66 0 0 0 0.02 5.04L-1.32 3.7A13.46 13.46 0 0 1 8 0zm0 3.8a9.55 9.55 0 0 1 6.6 2.64l-1.35 1.36A7.6 7.6 0 0 0 8 5.7a7.6 7.6 0 0 0-5.25 2.1L1.4 6.44A9.55 9.55 0 0 1 8 3.8zm0 3.8a5.4 5.4 0 0 1 3.6 1.38L8 11l-3.6-1.42A5.4 5.4 0 0 1 8 7.6z"/>
    </svg>
  ),
  battery: (
    <svg width="27" height="12" viewBox="0 0 27 12" fill="none">
      <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      <rect x="2" y="2" width="19" height="8" rx="1.5" fill="currentColor"/>
      <rect x="24" y="3.5" width="2" height="5" rx="1" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
};

// ----- Post in feed --------------------------------------------------
function FeedPost({ post, design, idx }) {
  const layers = computeLayerStyles(post, design);
  return (
    <div className="ig-post">
      <div className="ig-post-header">
        <div className="avatar">
          <div className="avatar-inner">
            <BrandAvatar design={design} fallbackPadding={4} />
          </div>
        </div>
        <div className="meta">
          <div className="uname">{design.username || "serafina.studio"}</div>
          {design.profileLocation && <div className="loc">{design.profileLocation}</div>}
        </div>
        <div style={{ color: "var(--ig-muted)", fontSize: 20, letterSpacing: 2 }}>···</div>
      </div>

      <div className="ig-post-image">
        <div className="canvas-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: "scale(1)", transformOrigin: "center", width: "100%", height: "100%" }}>
            <FullBleedCanvas post={post} design={design} />
          </div>
        </div>
      </div>

      <div className="ig-post-actions">
        <div className="left">
          {I.heart}
          {I.comment}
          {I.share}
        </div>
        <div>{I.bookmark}</div>
      </div>

      <div className="ig-post-likes">
        {Math.floor(120 + idx * 47) + 1} curtidas
      </div>
      <div className="ig-post-caption">
        <span className="u">{design.username || "serafina.studio"}</span>
        {post.title}{post.subtitle ? ` — ${post.subtitle}` : ""}
        {post.hashtags && (
          <span style={{ color: "#4a8cff", fontWeight: 400 }}>  {post.hashtags.split(/\s+/).slice(0,3).join(" ")}{post.hashtags.split(/\s+/).length > 3 ? " ..." : ""}</span>
        )}
      </div>
      {post.caption && (
        <div className="ig-post-comments">Ver todos os comentários</div>
      )}
      <div className="ig-post-time">há {idx + 1} dia{idx === 0 ? "" : "s"}</div>
    </div>
  );
}

// Renders the profile/brand avatar — uses profileAvatarUrl if set,
// otherwise falls back to the logo. Supports zoom/X/Y for the photo.
function BrandAvatar({ design, fallbackPadding = 4, fallbackText = "S" }) {
  const url = design.profileAvatarUrl || design.logoUrl;
  if (!url) {
    return <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--fg)", fontSize: 14 }}>{fallbackText}</span>;
  }
  if (design.profileAvatarUrl) {
    // Treat as a photo — zoom + position
    return (
      <div style={{
        width: "100%", height: "100%",
        backgroundImage: `url(${design.profileAvatarUrl})`,
        backgroundSize: `${design.profileAvatarScale ?? 100}%`,
        backgroundPosition: `${design.profileAvatarPosX ?? 50}% ${design.profileAvatarPosY ?? 50}%`,
        backgroundRepeat: "no-repeat",
        backgroundColor: design.primaryColor,
      }} />
    );
  }
  // Logo fallback — contained with padding
  return <img src={url} alt="" style={{ padding: fallbackPadding, objectFit: "contain", width: "100%", height: "100%" }} />;
}

// Renders a post at the size of its container (100%/100%)
// Uses container queries to scale text proportionally to container width.
function FullBleedCanvas({ post, design }) {
  const layers = computeLayerStyles(post, design);
  const eff = layers.eff;
  // Reference design is 1080px wide. We scale everything via container queries:
  // 100cqw = container width. So scale unit = (1 / 1080) * 100cqw.
  const u = (n) => `calc(${n} * 100cqw / 1080)`;
  // Date corner positions
  const dateInset = u(36);
  const dp = eff.datePosition || "top-left";
  const dateBox = {
    "top-left":     { top: dateInset, left: dateInset },
    "top-center":   { top: dateInset, left: "50%", transform: "translateX(-50%)" },
    "top-right":    { top: dateInset, right: dateInset },
    "bottom-left":  { bottom: dateInset, left: dateInset },
    "bottom-center":{ bottom: dateInset, left: "50%", transform: "translateX(-50%)" },
    "bottom-right": { bottom: dateInset, right: dateInset },
  }[dp] || { top: dateInset, left: dateInset };
  // Logo corner positions
  const logoInset = u(44);
  const logoSize = u(80);
  const lp = eff.logoPosition || "top-right";
  const logoBox = {
    "top-left":     { top: logoInset, left: logoInset },
    "top-center":   { top: logoInset, left: "50%", transform: "translateX(-50%)" },
    "top-right":    { top: logoInset, right: logoInset },
    "bottom-left":  { bottom: logoInset, left: logoInset },
    "bottom-center":{ bottom: logoInset, left: "50%", transform: "translateX(-50%)" },
    "bottom-right": { bottom: logoInset, right: logoInset },
  }[lp] || { top: logoInset, right: logoInset };
  return (
    <div style={{
      position: "absolute", inset: 0, overflow: "hidden",
      borderRadius: 0,
      containerType: "inline-size",
    }}>
      <div style={{ position: "absolute", inset: 0, ...layers.bgImage, backgroundColor: layers.bgImage.backgroundColor }} />
      <div style={{ position: "absolute", inset: 0, ...layers.overlay }} />
      <div style={{
        position: "absolute", inset: u((eff.contentPadding ?? 36) * 2.45),
        color: eff.textColor,
      }}>
        <div style={{
          ...layers.blockStyle,
          display: "flex", flexDirection: "column",
          alignItems: layers.align,
          maxWidth: `${eff.contentMaxWidth ?? 100}%`,
        }}>
          {eff.showTag && post.category && (eff.tagAttachment !== "corner") && (eff.tagInlinePosition || "above") !== "below" && (
            <div style={{
              display: "inline-block",
              fontFamily: "var(--font-mono)",
              fontSize: u(22), letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: `${u(10)} ${u(22)}`,
              borderRadius: u(999),
              background: `${eff.textColor}1a`,
              border: `1px solid ${eff.textColor}33`,
              marginBottom: u(28),
              whiteSpace: "nowrap",
            }}>{post.category}</div>
          )}
          {(() => {
            const linesMode = eff.textBoxEnabled && eff.textBoxMode === "lines";
            const r = hexToRgb(eff.textBoxColor || "#151619");
            const op = (eff.textBoxOpacity ?? 70) / 100;
            const padRef = (eff.textBoxPadding ?? 20) * 2.45;
            const radiusRef = (eff.textBoxRadius ?? 0) * 2.45;
            const titleRef = eff.titleSize * 2.45;
            const subRef = eff.subtitleSize * 2.45;
            const gapRef = (eff.titleSubtitleGap ?? 14) * 2.45;

            // Per-line highlight box — bg cloned onto each wrapped line via
            // box-decoration-break; tall line-height spaces the boxes apart.
            const lineHL = (fontRef) => ({
              display: "inline",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
              background: `rgba(${r.r},${r.g},${r.b},${op})`,
              padding: `${u(padRef * 0.32)} ${u(padRef * 0.55)}`,
              borderRadius: u(radiusRef),
              lineHeight: u(fontRef + padRef * 1.19),
            });

            const titleStyle = {
              fontFamily: eff.titleFont,
              fontWeight: eff.titleWeight,
              fontSize: u(titleRef),
              textTransform: eff.titleTransform,
              lineHeight: linesMode ? undefined : 1.0,
              letterSpacing: "-0.02em",
              color: eff.textColor,
              textAlign: layers.textAlign,
              width: "100%",
              ...(linesMode ? lineHL(titleRef) : null),
            };
            const subStyle = {
              fontFamily: eff.subtitleFont,
              fontSize: u(subRef),
              color: eff.textColor, opacity: 0.92,
              lineHeight: linesMode ? undefined : 1.35,
              textAlign: layers.textAlign,
              width: "100%",
              ...(linesMode ? lineHL(subRef) : { marginTop: u(gapRef) }),
            };

            if (linesMode) {
              return (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: layers.align }}>
                  <div style={{ width: "100%", textAlign: layers.textAlign }}>
                    <span style={titleStyle}>{post.title}</span>
                  </div>
                  {post.subtitle && (
                    <div style={{ width: "100%", textAlign: layers.textAlign, marginTop: u(gapRef) }}>
                      <span style={subStyle}>{post.subtitle}</span>
                    </div>
                  )}
                </div>
              );
            }

            const wrapStyle = eff.textBoxEnabled ? {
              width: "auto", maxWidth: "100%",
              display: "inline-flex", flexDirection: "column",
              background: `rgba(${r.r},${r.g},${r.b},${op})`,
              padding: `${u(padRef)} ${u(padRef * 1.2)}`,
              borderRadius: u(radiusRef),
              alignSelf: layers.align,
            } : { width: "100%", display: "flex", flexDirection: "column" };

            return (
              <div style={wrapStyle}>
                <div style={titleStyle}>{post.title}</div>
                {post.subtitle && <div style={subStyle}>{post.subtitle}</div>}
              </div>
            );
          })()}
          {eff.showTag && post.category && (eff.tagAttachment !== "corner") && (eff.tagInlinePosition || "above") === "below" && (
            <div style={{
              display: "inline-block",
              fontFamily: "var(--font-mono)",
              fontSize: u(22), letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: `${u(10)} ${u(22)}`,
              borderRadius: u(999),
              background: `${eff.textColor}1a`,
              border: `1px solid ${eff.textColor}33`,
              marginTop: u(30),
              whiteSpace: "nowrap",
            }}>{post.category}</div>
          )}
        </div>
      </div>
        <div style={{
          position: "absolute",
          ...logoBox,
          width: logoSize, height: logoSize,
          backgroundImage: `url(${eff.logoUrl})`,
          backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center",
        }} />
      )}
      {eff.showElement && eff.elementUrl && (() => {
        const elInset = u(44);
        const elSize = u((eff.elementSize ?? 80) * 2.45);
        const ep = eff.elementPosition || "bottom-right";
        const map = {
          "top-left":     { top: elInset, left: elInset },
          "top-center":   { top: elInset, left: "50%", transform: "translateX(-50%)" },
          "top-right":    { top: elInset, right: elInset },
          "mid-left":     { top: "50%", left: elInset, transform: "translateY(-50%)" },
          "mid-center":   { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
          "mid-right":    { top: "50%", right: elInset, transform: "translateY(-50%)" },
          "bottom-left":  { bottom: elInset, left: elInset },
          "bottom-center":{ bottom: elInset, left: "50%", transform: "translateX(-50%)" },
          "bottom-right": { bottom: elInset, right: elInset },
        };
        const box = map[ep] || map["bottom-right"];
        return (
          <div style={{
            position: "absolute",
            ...box,
            width: elSize, height: elSize,
            backgroundImage: `url(${eff.elementUrl})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            opacity: (eff.elementOpacity ?? 100) / 100,
          }} />
        );
      })()}
      {post.date && eff.showDate !== false && (
        <div style={{
          position: "absolute",
          ...dateBox,
          fontFamily: "var(--font-mono)",
          fontSize: u(22),
          letterSpacing: "0.15em",
          color: eff.textColor,
          opacity: 0.7,
          whiteSpace: "nowrap",
        }}>{post.date}</div>
      )}
      {eff.showTag && post.category && (eff.tagAttachment === "corner") && (() => {
        const tagInset = u(36);
        const tp = eff.tagPosition || "top-right";
        const tBox = {
          "top-left":     { top: tagInset, left: tagInset },
          "top-center":   { top: tagInset, left: "50%", transform: "translateX(-50%)" },
          "top-right":    { top: tagInset, right: tagInset },
          "bottom-left":  { bottom: tagInset, left: tagInset },
          "bottom-center":{ bottom: tagInset, left: "50%", transform: "translateX(-50%)" },
          "bottom-right": { bottom: tagInset, right: tagInset },
        }[tp] || { top: tagInset, right: tagInset };
        return (
          <div style={{
            position: "absolute",
            ...tBox,
            fontFamily: "var(--font-mono)",
            fontSize: u(22), letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: `${u(10)} ${u(22)}`,
            borderRadius: u(999),
            background: `${eff.textColor}1a`,
            border: `1px solid ${eff.textColor}33`,
            color: eff.textColor,
            whiteSpace: "nowrap",
          }}>{post.category}</div>
        );
      })()}
    </div>
  );
}

// ----- Profile grid cell --------------------------------------------
function ProfileGridCell({ post, design, onOpen }) {
  return (
    <div className="cell" onClick={onOpen}>
      <div className="thumb">
        <FullBleedCanvas post={post} design={design} />
      </div>
    </div>
  );
}

// ----- Main panel ----------------------------------------------------
function PreviewPanel({ store, onJumpToEditor }) {
  const { posts, design } = store;
  const [tab, setTab] = useStateP("feed"); // feed | profile
  const [theme, setTheme] = useStateP("dark");
  const [zoom, setZoom] = useStateP(80);
  const stageRef = useRefP(null);

  if (!posts.length) {
    return (
      <div className="preview-panel" style={{ gridTemplateColumns: "1fr" }}>
        <div className="empty-state" style={{ color: "var(--cosmic-latte)" }}>
          <div className="eyebrow" style={{ color: "#888" }}>Feed preview</div>
          <h2 style={{ color: "var(--cosmic-latte)" }}>Sem posts <em>ainda</em>.</h2>
          <p style={{ color: "#aaa" }}>Importe um planejamento e edite alguns posts antes de simular o feed do Instagram.</p>
        </div>
      </div>
    );
  }

  const profileStats = {
    posts: posts.length,
    followers: "2.4k",
    following: "342",
  };

  // The profile grid needs 9 cells (3x3). Fill empty if fewer posts.
  const gridCells = [];
  for (let i = 0; i < 9; i++) {
    gridCells.push(posts[i] || null);
  }
  // Newer posts first in grid like real IG
  const orderedFeed = [...posts]; // could reverse

  return (
    <div className="preview-panel">
      <div className="preview-stage" ref={stageRef}>
        {/* iPhone */}
        <div className={`iphone-frame ig-${theme}`}
          style={{ transform: `scale(${zoom / 100})` }}>
          <div className="iphone-dynamic-island" />

          <div className="iphone-screen" data-tab={tab}>
            {/* Status bar */}
            <div className="ig-status-bar">
              <span>9:41</span>
              <div className="icons">
                {I.signal}
                <span style={{ width: 6 }} />
                {I.wifi}
                <span style={{ width: 6 }} />
                {I.battery}
              </div>
            </div>

            {tab === "feed" ? (
              <>
                {/* Header */}
                <div className="ig-header">
                  <div className="name" style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: 26 }}>
                    {design.brandName || "Serafina"}
                  </div>
                  <div className="actions">
                    {I.plus}
                    {I.dm}
                  </div>
                </div>

                {/* Stories */}
                <div className="ig-stories">
                  <div className="ig-story">
                    <div className="avatar gradient">
                      <div className="avatar-inner">
                        <BrandAvatar design={design} fallbackPadding={6} fallbackText="+" />
                      </div>
                    </div>
                    <div className="label">Seu story</div>
                  </div>
                  {["bastidores", "campanhas", "processo", "time", "cases"].map((s, i) => (
                    <div className="ig-story" key={s}>
                      <div className="avatar gradient">
                        <div className="avatar-inner" style={{
                          background: i % 2 ? design.primaryColor : design.overlayColor,
                        }}>
                          <span style={{ color: design.textColor, fontSize: 18, fontFamily: "var(--font-display)", fontStyle: "italic" }}>S</span>
                        </div>
                      </div>
                      <div className="label">{s}</div>
                    </div>
                  ))}
                </div>

                {/* Feed posts */}
                <div className="ig-feed">
                  {orderedFeed.map((p, i) => (
                    <FeedPost key={p.id} post={p} design={design} idx={i} />
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Profile header */}
                <div className="ig-profile-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {I.back}
                    <span className="uname">{design.username || "serafina.studio"}</span>
                  </div>
                  <div style={{ color: "var(--ig-text)" }}>{I.menu}</div>
                </div>

                <div className="ig-profile-top">
                  <div className="ig-profile-avatar">
                    <BrandAvatar design={design} fallbackPadding={14} />
                  </div>
                  <div className="ig-profile-stats">
                    <div><div className="num">{profileStats.posts}</div><div className="lbl">posts</div></div>
                    <div><div className="num">{profileStats.followers}</div><div className="lbl">seguidores</div></div>
                    <div><div className="num">{profileStats.following}</div><div className="lbl">seguindo</div></div>
                  </div>
                </div>

                <div className="ig-profile-bio">
                  <div className="name">{design.brandName || "Serafina"}</div>
                  <div className="bio" style={{ whiteSpace: "pre-line" }}>{design.profileBio}</div>
                </div>

                <div className="ig-profile-actions">
                  <button className="btn">Editar perfil</button>
                  <button className="btn">Compartilhar</button>
                </div>

                <div className="ig-profile-tabs">
                  <div className="t active">⊞ Posts</div>
                  <div className="t">▷ Reels</div>
                  <div className="t">◯ Marcados</div>
                </div>

                <div className="ig-profile-grid">
                  {gridCells.map((p, i) => (
                    p ? (
                      <ProfileGridCell key={p.id} post={p} design={design}
                        onOpen={() => onJumpToEditor?.(p.id)} />
                    ) : (
                      <div className="cell empty" key={`empty-${i}`}>+</div>
                    )
                  ))}
                </div>
                <div style={{ height: 20 }} />
              </>
            )}

            {/* Tab bar */}
            <div className="ig-tabbar">
              <button className={`ig-tab ${tab === "feed" ? "active" : ""}`} onClick={() => setTab("feed")}>{I.home}</button>
              <button className="ig-tab">{I.search}</button>
              <button className="ig-tab">{I.plus}</button>
              <button className="ig-tab">{I.reels}</button>
              <button className={`ig-tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>{I.user}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="preview-controls">
        <div className="ctrl-group">
          <h4>Tela</h4>
          <div className="toggle-pill-group">
            <button className={`toggle-pill ${tab === "feed" ? "active" : ""}`} onClick={() => setTab("feed")}>
              Feed
            </button>
            <button className={`toggle-pill ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>
              Perfil
            </button>
          </div>
        </div>

        <div className="ctrl-group">
          <h4>Tema</h4>
          <div className="toggle-pill-group">
            <button className={`toggle-pill ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>
              ☀ Light
            </button>
            <button className={`toggle-pill ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>
              ☾ Dark
            </button>
          </div>
        </div>

        <div className="ctrl-group">
          <h4>Zoom</h4>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="range" min="40" max="100" value={zoom}
              onChange={(e) => setZoom(+e.target.value)} style={{ flex: 1 }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#aaa", minWidth: 32, textAlign: "right" }}>{zoom}%</span>
          </div>
        </div>

        <div className="ctrl-group">
          <h4>Resumo</h4>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "#aaa", lineHeight: 1.8 }}>
            <div>POSTS · <span style={{ color: "var(--cosmic-latte)" }}>{posts.length}</span></div>
            <div>COM IMAGEM · <span style={{ color: "var(--cosmic-latte)" }}>{posts.filter(p => p.imageSrc).length}</span></div>
            <div>COM LEGENDA · <span style={{ color: "var(--cosmic-latte)" }}>{posts.filter(p => p.caption).length}</span></div>
            <div>COM HASHTAGS · <span style={{ color: "var(--cosmic-latte)" }}>{posts.filter(p => p.hashtags).length}</span></div>
          </div>
        </div>

        <div className="ctrl-group">
          <h4>Marca</h4>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 32, color: "var(--cosmic-latte)", lineHeight: 1 }}>
            {design.brandName || "Serafina"}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#888", marginTop: 4 }}>
            @{design.username || "serafina.studio"}
          </div>
        </div>

        <div className="ctrl-group">
          <h4>Exportar</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SendToCanvaButton store={store} />
            <ExportAllButton store={store} variant="secondary" />
            <DownloadCodeButton store={store} />
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#777", marginTop: 10, lineHeight: 1.6, letterSpacing: "0.05em" }}>
            <div>↳ <b style={{ color: "#aaa" }}>CANVA</b> · .pptx editável (texto+camadas)</div>
            <div>↳ <b style={{ color: "#aaa" }}>PNG</b> · {posts.length === 1 ? "1080×1350" : `.zip · ${posts.length}× PNG`}</div>
            <div>↳ <b style={{ color: "#aaa" }}>CÓDIGO</b> · ferramenta + design system</div>
          </div>
        </div>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #222" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#666", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Tip
          </div>
          <div style={{ fontFamily: "var(--font-reading)", fontSize: 12, color: "#aaa", marginTop: 6, lineHeight: 1.5 }}>
            Clique em qualquer célula do grid de perfil para abrir aquele post no editor.
          </div>
        </div>
      </div>
    </div>
  );
}

window.PreviewPanel = PreviewPanel;
window.FullBleedCanvas = FullBleedCanvas;

// ╔══════════════════════════════════════════════════════════╗
// ║  export-posts.jsx                                      ║
// ╚══════════════════════════════════════════════════════════╝

// ============================================================
// export-posts.jsx — Renderiza TODOS os posts em canvas 1080×1350
// e baixa como PNGs num único arquivo .zip.
// ============================================================

const { useState: useStateEX, useEffect: useEffectEX } = React;

// --- carrega script externo uma única vez ---------------------------
function loadScriptOnce(src, globalKey) {
  if (window[globalKey]) return Promise.resolve();
  if (window.__loadingScripts && window.__loadingScripts[src]) {
    return window.__loadingScripts[src];
  }
  window.__loadingScripts = window.__loadingScripts || {};
  const p = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar " + src));
    document.head.appendChild(s);
  });
  window.__loadingScripts[src] = p;
  return p;
}

// slug seguro para nome de arquivo
function slugify(s) {
  return (s || "")
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

// Renderiza um único post num container offscreen e captura como blob PNG
async function capturePost(container, post, design) {
  // Render via React no container
  return new Promise((resolve) => {
    const root = container.__reactRoot || ReactDOM.createRoot(container);
    container.__reactRoot = root;
    root.render(
      <div style={{ width: 1080, height: 1350, position: "relative", overflow: "hidden", background: design.primaryColor }}>
        <window.FullBleedCanvas post={post} design={design} />
      </div>
    );

    // Aguarda fontes + imagens
    const waitFor = async () => {
      try { await document.fonts.ready; } catch {}
      // Aguarda imagens de fundo carregarem
      const bgEls = container.querySelectorAll("*");
      const imageUrls = [];
      bgEls.forEach(el => {
        const bg = getComputedStyle(el).backgroundImage;
        const m = bg && bg.match(/url\(["']?(.+?)["']?\)/);
        if (m && m[1] && !m[1].startsWith("data:")) imageUrls.push(m[1]);
      });
      await Promise.all(imageUrls.map(url => new Promise(res => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => res();
        img.onerror = () => res();
        img.src = url;
      })));
      // Pequeno delay para layout assentar
      await new Promise(r => setTimeout(r, 250));

      const canvas = await window.html2canvas(container, {
        width: 1080,
        height: 1350,
        windowWidth: 1080,
        windowHeight: 1350,
        scale: 1,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      canvas.toBlob((blob) => resolve(blob), "image/png");
    };
    waitFor();
  });
}

// API principal: exporta todos os posts como zip (ou PNG único se 1 post)
async function exportAllAsImages(posts, design, onProgress) {
  if (!posts || !posts.length) return;

  // Carrega libs externas
  await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", "html2canvas");
  await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", "JSZip");

  // Container offscreen
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    left: -99999px;
    top: 0;
    width: 1080px;
    height: 1350px;
    pointer-events: none;
    z-index: -1;
    background: transparent;
  `;
  document.body.appendChild(container);

  const zip = new window.JSZip();
  const folder = zip.folder("posts");
  const singleBlobs = [];

  try {
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      onProgress?.({ done: i, total: posts.length, current: post });
      const blob = await capturePost(container, post, design);
      const idx = String(i + 1).padStart(2, "0");
      const slug = slugify(post.title) || slugify(post.category) || "post";
      const filename = `${idx}-${slug}.png`;
      folder.file(filename, blob);
      singleBlobs.push({ blob, filename });
      onProgress?.({ done: i + 1, total: posts.length, current: post });
    }
  } finally {
    // Cleanup
    try { container.__reactRoot && container.__reactRoot.unmount(); } catch {}
    container.remove();
  }

  // Se só 1 post, baixa direto. Senão, zip.
  if (singleBlobs.length === 1) {
    triggerDownload(singleBlobs[0].blob, singleBlobs[0].filename);
  } else {
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(zipBlob, `planejamento-${stamp}.zip`);
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ====================================================================
// PPTX export — cada post vira um slide 1080×1350 com camadas editáveis
// (texto, imagem, overlay, tag, data, logo). Pronto para upload no Canva.
// ====================================================================

// Converte URL relativa em data URL (necessário p/ embed em pptx)
async function urlToDataUrl(url) {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const resp = await fetch(url, { mode: "cors" });
    const blob = await resp.blob();
    return await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Não consegui ler logo:", url, e);
    return null;
  }
}

// Constrói um PPTX a partir dos posts + design
async function buildPPTX(posts, design, onProgress) {
  await loadScriptOnce(
    "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
    "PptxGenJS"
  );

  const W = 1080, H = 1350;
  const px2in = (n) => n / 96;
  const px2pt = (n) => n * 0.75;
  const cl = (c) => (c || "#000000").replace("#", "");

  const pptx = new window.PptxGenJS();
  pptx.title = `${design.brandName || "Planejamento"} — ${posts.length} posts`;
  pptx.author = "Serafina · Gerador";
  pptx.defineLayout({ name: "IG_PORTRAIT_1080", width: px2in(W), height: px2in(H) });
  pptx.layout = "IG_PORTRAIT_1080";

  // Pré-carrega logo (compartilhado entre slides)
  const logoDataUrl = await urlToDataUrl(design.logoUrl);

  // Mapeia eff.contentPosition → bbox + align/valign
  function getContentBox(eff) {
    const pad = (eff.contentPadding ?? 36) * 2.45;
    const innerW = W - pad * 2;
    const innerH = H - pad * 2;
    const maxW = ((eff.contentMaxWidth ?? 100) / 100) * innerW;
    const pos = eff.contentPosition || "bottom-left";
    const [v, h] = pos.split("-");
    let x;
    if (h === "left") x = pad;
    else if (h === "center") x = pad + (innerW - maxW) / 2;
    else x = pad + innerW - maxW;
    const align = h === "center" ? "center" : h === "right" ? "right" : "left";
    const valign = v === "top" ? "top" : v === "mid" ? "middle" : "bottom";
    return { x, y: pad, w: maxW, h: innerH, align, valign };
  }

  function cornerBox(map, key, sz = 200, hh = 40) {
    const inset = 36;
    const m = {
      "top-left":     { x: inset, y: inset, align: "left" },
      "top-center":   { x: (W - sz) / 2, y: inset, align: "center" },
      "top-right":    { x: W - inset - sz, y: inset, align: "right" },
      "bottom-left":  { x: inset, y: H - inset - hh, align: "left" },
      "bottom-center":{ x: (W - sz) / 2, y: H - inset - hh, align: "center" },
      "bottom-right": { x: W - inset - sz, y: H - inset - hh, align: "right" },
    };
    return m[key] || m["top-left"];
  }

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    onProgress?.({ done: i, total: posts.length, current: post });

    const eff = { ...design, ...(post.overrides || {}) };
    const slide = pptx.addSlide();

    // 1) Fundo: cor primária
    slide.background = { color: cl(eff.primaryColor) };

    // 2) Imagem de fundo (cover)
    if (post.imageSrc && post.imageSrc.startsWith("data:")) {
      slide.addImage({
        data: post.imageSrc,
        x: 0, y: 0, w: px2in(W), h: px2in(H),
        sizing: { type: "cover", w: px2in(W), h: px2in(H) },
      });
    }

    // 3) Overlay (apenas se houver imagem e opacidade > 0)
    if (post.imageSrc && (eff.overlayOpacity ?? 0) > 3) {
      const transparency = Math.max(0, Math.min(100, 100 - (eff.overlayOpacity ?? 55)));
      slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: px2in(W), h: px2in(H),
        fill: { color: cl(eff.overlayColor), transparency },
        line: { type: "none" },
      });
    }

    // 4) Caixa atrás do texto (opcional)
    const block = getContentBox(eff);

    // 5) Tag inline (acima do título)
    const textRuns = [];
    if (eff.showTag && post.category && eff.tagAttachment !== "corner") {
      textRuns.push({
        text: (post.category || "").toUpperCase(),
        options: {
          fontSize: 14,
          fontFace: "Courier New",
          color: cl(eff.textColor),
          charSpacing: 3,
          breakLine: true,
        },
      });
    }

    // 6) Título
    const titleSize = (eff.titleSize ?? 44) * 2.45;
    textRuns.push({
      text: post.title || "",
      options: {
        fontSize: px2pt(titleSize),
        fontFace: mapFont(eff.titleFont),
        bold: (eff.titleWeight ?? 700) >= 600,
        color: cl(eff.textColor),
        charSpacing: -1,
        breakLine: !!post.subtitle,
      },
    });

    // 7) Subtítulo
    if (post.subtitle) {
      const subSize = (eff.subtitleSize ?? 16) * 2.45;
      textRuns.push({
        text: post.subtitle,
        options: {
          fontSize: px2pt(subSize),
          fontFace: mapFont(eff.subtitleFont),
          color: cl(eff.textColor),
          paraSpaceBefore: px2pt((eff.titleSubtitleGap ?? 14) * 2.45),
        },
      });
    }

    slide.addText(textRuns, {
      x: px2in(block.x), y: px2in(block.y),
      w: px2in(block.w), h: px2in(block.h),
      align: block.align,
      valign: block.valign,
      isTextBox: true,
      margin: 0,
    });

    // 8) Data no canto
    if (post.date && eff.showDate !== false) {
      const dc = cornerBox({}, eff.datePosition || "top-left", 240, 40);
      slide.addText(post.date, {
        x: px2in(dc.x), y: px2in(dc.y),
        w: px2in(240), h: px2in(40),
        fontSize: 11, fontFace: "Courier New",
        color: cl(eff.textColor),
        charSpacing: 4,
        align: dc.align,
        valign: "top",
      });
    }

    // 9) Tag em modo "corner"
    if (eff.showTag && post.category && eff.tagAttachment === "corner") {
      const tc = cornerBox({}, eff.tagPosition || "top-right", 280, 50);
      slide.addText((post.category || "").toUpperCase(), {
        x: px2in(tc.x), y: px2in(tc.y),
        w: px2in(280), h: px2in(50),
        fontSize: 12, fontFace: "Courier New",
        color: cl(eff.textColor),
        charSpacing: 4,
        align: tc.align,
        valign: "top",
      });
    }

    // 10) Logo
    if (eff.showLogo && logoDataUrl) {
      const sz = 100;
      const lp = eff.logoPosition || "top-right";
      const inset = 44;
      const lm = {
        "top-left":     { x: inset, y: inset },
        "top-center":   { x: (W - sz) / 2, y: inset },
        "top-right":    { x: W - inset - sz, y: inset },
        "bottom-left":  { x: inset, y: H - inset - sz },
        "bottom-center":{ x: (W - sz) / 2, y: H - inset - sz },
        "bottom-right": { x: W - inset - sz, y: H - inset - sz },
      }[lp] || { x: W - inset - sz, y: inset };
      slide.addImage({
        data: logoDataUrl,
        x: px2in(lm.x), y: px2in(lm.y),
        w: px2in(sz), h: px2in(sz),
      });
    }

    // 11) Speaker notes: legenda + hashtags
    const notesParts = [];
    if (post.caption) notesParts.push(post.caption);
    if (post.hashtags) notesParts.push("\n" + post.hashtags);
    if (notesParts.length) slide.addNotes(notesParts.join("\n"));

    onProgress?.({ done: i + 1, total: posts.length, current: post });
  }

  return pptx;
}

// Mapeia fontes de marca: PowerPoint/Canva não tem Apercu/Authentive nativas,
// mas mandamos o nome real pra preservar a intenção do design system.
// Se o Canva não tiver, ele substitui automaticamente.
function mapFont(name) {
  if (!name) return "Arial";
  // Sistema → Arial (fallback seguro)
  if (/system-ui|-apple-system/i.test(name)) return "Arial";
  // Caso contrário, preserva o nome real (Apercu, Hanken, Inter, Poppins…)
  // PowerPoint/Canva tenta carregar; se não tiver, usa fallback automático.
  return name;
}

async function exportAsPPTX(posts, design, onProgress) {
  if (!posts || !posts.length) return;
  const pptx = await buildPPTX(posts, design, onProgress);
  const stamp = new Date().toISOString().slice(0, 10);
  const slug = (design.brandName || "planejamento").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  await pptx.writeFile({ fileName: `${slug || "planejamento"}-canva-${stamp}.pptx` });
}

window.exportAsPPTX = exportAsPPTX;
window.buildPPTX = buildPPTX;

// --- Componente: Botão + modal de progresso -------------------------
function ExportAllButton({ store, variant = "primary", compact = false }) {
  const [running, setRunning] = useStateEX(false);
  const [progress, setProgress] = useStateEX({ done: 0, total: 0, current: null });

  const run = async () => {
    if (!store.posts.length || running) return;
    setRunning(true);
    setProgress({ done: 0, total: store.posts.length, current: null });
    try {
      await exportAllAsImages(store.posts, store.design, (p) => setProgress(p));
      store.showToast(
        store.posts.length === 1
          ? "Post exportado ✓"
          : `${store.posts.length} posts exportados ✓`
      );
    } catch (e) {
      console.error("Export failed:", e);
      store.showToast("Erro ao exportar — veja o console");
    } finally {
      setRunning(false);
      setTimeout(() => setProgress({ done: 0, total: 0, current: null }), 600);
    }
  };

  const disabled = !store.posts.length || running;
  const label = compact
    ? (running ? `${progress.done}/${progress.total}` : "⬇")
    : (running
        ? `Exportando ${progress.done}/${progress.total}…`
        : `⬇ Exportar tudo${store.posts.length ? ` (${store.posts.length})` : ""}`);

  const cls = compact
    ? "icon-btn export-icon-btn"
    : `btn btn-${variant} btn-small`;

  return (
    <>
      <button className={cls}
        onClick={run}
        disabled={disabled}
        title={`Renderizar ${store.posts.length || 0} posts em 1080×1350 e baixar como .zip`}>
        {label}
      </button>

      {running && (
        <div className="export-overlay">
          <div className="export-modal">
            <div className="eyebrow" style={{ marginBottom: 8 }}>Exportando posts</div>
            <h3 style={{
              fontFamily: "var(--font-sans)",
              fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em",
              margin: "0 0 4px",
            }}>
              {progress.done} <span style={{ color: "var(--fg-muted)", fontWeight: 400 }}>de</span> {progress.total}
            </h3>
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: "var(--fg-muted)", margin: "0 0 18px",
              letterSpacing: "0.05em",
            }}>
              {progress.current
                ? `Renderizando · ${(progress.current.title || "sem título").slice(0, 48)}`
                : "Preparando…"}
            </p>
            <div className="export-progress-bar">
              <div className="export-progress-fill"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: "var(--fg-muted)", marginTop: 14,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              1080 × 1350 · PNG · {progress.total > 1 ? ".ZIP" : "arquivo único"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

window.ExportAllButton = ExportAllButton;
window.exportAllAsImages = exportAllAsImages;

// --- Componente: Enviar para o Canva (.pptx editável) ----------------
function SendToCanvaButton({ store, compact = false }) {
  const [running, setRunning] = useStateEX(false);
  const [progress, setProgress] = useStateEX({ done: 0, total: 0, current: null });
  const [showHelp, setShowHelp] = useStateEX(false);

  const run = async () => {
    if (!store.posts.length || running) return;
    setRunning(true);
    setProgress({ done: 0, total: store.posts.length, current: null });
    try {
      await exportAsPPTX(store.posts, store.design, (p) => setProgress(p));
      store.showToast("Arquivo .pptx pronto · agora é só arrastar no Canva");
      setTimeout(() => setShowHelp(true), 400);
    } catch (e) {
      console.error("PPTX export failed:", e);
      store.showToast("Erro ao gerar .pptx — veja o console");
    } finally {
      setRunning(false);
      setTimeout(() => setProgress({ done: 0, total: 0, current: null }), 600);
    }
  };

  const disabled = !store.posts.length || running;
  const label = compact
    ? (running ? `${progress.done}/${progress.total}` : "Canva")
    : (running
        ? `Gerando ${progress.done}/${progress.total}…`
        : `📤 Enviar para o Canva`);

  const cls = compact
    ? "icon-btn canva-icon-btn"
    : `btn btn-canva btn-small`;

  return (
    <>
      <button className={cls}
        onClick={run}
        disabled={disabled}
        title={`Gerar arquivo .pptx editável (${store.posts.length || 0} slides) — depois arraste no Canva para editar`}>
        {label}
      </button>

      {running && (
        <div className="export-overlay">
          <div className="export-modal">
            <div className="eyebrow" style={{ marginBottom: 8 }}>Preparando para o Canva</div>
            <h3 style={{
              fontFamily: "var(--font-sans)",
              fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em",
              margin: "0 0 4px",
            }}>
              {progress.done} <span style={{ color: "var(--fg-muted)", fontWeight: 400 }}>de</span> {progress.total}
            </h3>
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: "var(--fg-muted)", margin: "0 0 18px",
              letterSpacing: "0.05em",
            }}>
              {progress.current
                ? `Montando slide · ${(progress.current.title || "sem título").slice(0, 48)}`
                : "Preparando…"}
            </p>
            <div className="export-progress-bar">
              <div className="export-progress-fill"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: "var(--fg-muted)", marginTop: 14,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              .pptx · 1080 × 1350 · texto + imagem + camadas editáveis
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="export-overlay" onClick={() => setShowHelp(false)}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}
            style={{ width: "min(520px, 92vw)" }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Pronto ✓</div>
            <h3 style={{
              fontFamily: "var(--font-sans)",
              fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em",
              margin: "0 0 16px",
            }}>
              Arquivo baixado. <span style={{
                fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400,
                color: "var(--infinity-blue)"
              }}>agora escolha como editar.</span>
            </h3>

            {/* Opção A — direto via Claude */}
            <div style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(0,196,204,0.08) 0%, rgba(125,42,232,0.08) 100%)",
              border: "1px solid rgba(125,42,232,0.3)",
              borderRadius: "var(--radius-md)",
              marginBottom: 14,
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#7D2AE8", marginBottom: 6 }}>
                ⚡ Caminho rápido · via Claude
              </div>
              <div style={{ fontFamily: "var(--font-reading)", fontSize: 13, color: "var(--fg)", lineHeight: 1.5 }}>
                <b>Arraste o arquivo <code style={{ fontFamily: "var(--font-mono)", fontSize: 11,
                  background: "var(--latte-deep)", padding: "1px 6px", borderRadius: 4 }}>.pptx</code> no chat</b> e me peça pra enviar à sua conta Canva. Eu importo direto.
              </div>
            </div>

            {/* Opção B — manual */}
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: 6 }}>
              ↪ Ou faça manualmente
            </div>
            <ol style={{
              fontFamily: "var(--font-reading)", fontSize: 13,
              color: "var(--fg-muted)", lineHeight: 1.6,
              paddingLeft: 18, margin: "0 0 18px",
            }}>
              <li>Abra <a href="https://www.canva.com/" target="_blank" rel="noopener"
                  style={{ color: "var(--infinity-blue)", fontWeight: 500 }}>canva.com</a> logado.</li>
              <li>Arraste o <code style={{ fontFamily: "var(--font-mono)", fontSize: 11,
                background: "var(--latte-deep)", padding: "1px 6px", borderRadius: 4 }}>.pptx</code> baixado na tela inicial.</li>
              <li>Canva converte cada slide em design editável.</li>
            </ol>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-small" onClick={() => setShowHelp(false)}>
                Fechar
              </button>
              <a className="btn btn-primary btn-small"
                href="https://www.canva.com/"
                target="_blank" rel="noopener"
                onClick={() => setShowHelp(false)}>
                Abrir o Canva ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

window.SendToCanvaButton = SendToCanvaButton;

// ====================================================================
// DownloadCodeButton — empacota todo o código fonte + design system
// num único .zip baixável (HTML + JSX + CSS + assets do design system).
// ====================================================================

const PROJECT_FILES = [
  // App
  "Gerador de Planejamento.html",
  "app.css",
  "main.jsx",
  "store.jsx",
  "canvas.jsx",
  "panel-plans.jsx",
  "panel-upload.jsx",
  "panel-design.jsx",
  "panel-editor.jsx",
  "panel-preview.jsx",
  "export-posts.jsx",
  // Design System core
  "design-system/colors_and_type.css",
  // Design System — logos
  "design-system/assets/logo-principal-cosmic-latte.png",
  "design-system/assets/logo-principal-night.png",
  "design-system/assets/logo-symbol-cosmic-latte.png",
  "design-system/assets/logo-symbol-infinity-blue.png",
  "design-system/assets/logo-symbol-night.png",
  // Design System — fonts (Apercu family + Authentive + Hanken Grotesk)
  "design-system/fonts/Apercu-Light.otf",
  "design-system/fonts/Apercu-Regular.otf",
  "design-system/fonts/Apercu-Italic.otf",
  "design-system/fonts/Apercu-Medium.otf",
  "design-system/fonts/Apercu-Bold.otf",
  "design-system/fonts/Apercu-Mono.otf",
  "design-system/fonts/Authentive.otf",
  "design-system/fonts/HankenGrotesk-VariableFont_wght.ttf",
];

async function downloadFullCode(onProgress) {
  await loadScriptOnce(
    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
    "JSZip"
  );

  const zip = new window.JSZip();
  const root = zip.folder("gerador-planejamento");

  let done = 0;
  const total = PROJECT_FILES.length;
  let missing = [];

  for (const path of PROJECT_FILES) {
    onProgress?.({ done, total, current: path });
    try {
      const resp = await fetch(path);
      if (!resp.ok) { missing.push(path); done++; continue; }
      const blob = await resp.blob();
      root.file(path, blob);
    } catch (e) {
      console.warn("Falha ao incluir:", path, e);
      missing.push(path);
    }
    done++;
    onProgress?.({ done, total, current: path });
  }

  // README com instruções de execução local
  const readme = `# Gerador de Planejamento — Serafina

Ferramenta de geração e edição de posts de Instagram a partir de planejamentos em .txt.

## Como rodar localmente

Por usar Babel in-browser, precisa de um servidor HTTP simples (não abre direto pelo file://):

\`\`\`bash
# Opção 1 — Python
python3 -m http.server 8000

# Opção 2 — Node
npx serve .

# Opção 3 — qualquer servidor estático
\`\`\`

Depois abra http://localhost:8000/Gerador%20de%20Planejamento.html

## Estrutura

- \`Gerador de Planejamento.html\` — entrypoint
- \`app.css\` — todos os estilos
- \`main.jsx\` — App root + tabs
- \`store.jsx\` — state management, parsing, helpers
- \`canvas.jsx\` — renderer do post canvas (4:5)
- \`panel-*.jsx\` — cada aba (Arquivo, Upload, Design, Editor, Preview)
- \`export-posts.jsx\` — exportação PNG/PPTX
- \`design-system/\` — UI kit Serafina (cores, fontes, logos)

## Stack

- React 18 (via CDN, sem build)
- Babel standalone (transpila JSX em runtime)
- html2canvas + JSZip + PptxGenJS (carregados sob demanda)
- Persistência: window.storage (cross-device) ou localStorage

Gerado em ${new Date().toISOString()}.
${missing.length ? `\n\n## Arquivos faltantes\n\n${missing.map(f => "- " + f).join("\n")}\n` : ""}`;
  root.file("README.md", readme);

  onProgress?.({ done: total, total, current: "Compactando…" });
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(zipBlob, `gerador-planejamento-${stamp}.zip`);

  return { downloaded: total - missing.length, missing };
}

function DownloadCodeButton({ store }) {
  const [running, setRunning] = useStateEX(false);
  const [progress, setProgress] = useStateEX({ done: 0, total: 0, current: null });

  const run = async () => {
    if (running) return;
    setRunning(true);
    try {
      const result = await downloadFullCode((p) => setProgress(p));
      store.showToast(
        result.missing.length === 0
          ? `Código completo baixado · ${result.downloaded} arquivos`
          : `${result.downloaded} arquivos · ${result.missing.length} indisponíveis`
      );
    } catch (e) {
      console.error("Code download failed:", e);
      store.showToast("Erro ao empacotar código");
    } finally {
      setRunning(false);
      setTimeout(() => setProgress({ done: 0, total: 0, current: null }), 600);
    }
  };

  return (
    <>
      <button className="btn btn-secondary btn-small"
        onClick={run} disabled={running}
        style={{ width: "100%", justifyContent: "center" }}
        title="Baixar todo o código fonte da ferramenta (HTML, JSX, CSS, design system) num .zip">
        {running
          ? `⚙ Empacotando ${progress.done}/${progress.total}…`
          : "📦 Baixar código + design system (.zip)"}
      </button>

      {running && (
        <div className="export-overlay">
          <div className="export-modal">
            <div className="eyebrow" style={{ marginBottom: 8 }}>Empacotando código</div>
            <h3 style={{
              fontFamily: "var(--font-sans)",
              fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em",
              margin: "0 0 4px",
            }}>
              {progress.done} <span style={{ color: "var(--fg-muted)", fontWeight: 400 }}>de</span> {progress.total}
            </h3>
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: "var(--fg-muted)", margin: "0 0 18px",
              letterSpacing: "0.05em",
            }}>
              {progress.current ? `Incluindo · ${progress.current.slice(0, 56)}` : "Iniciando…"}
            </p>
            <div className="export-progress-bar">
              <div className="export-progress-fill"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: "var(--fg-muted)", marginTop: 14,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              HTML · JSX · CSS · fontes · logos · README
            </div>
          </div>
        </div>
      )}
    </>
  );
}

window.DownloadCodeButton = DownloadCodeButton;

// ╔══════════════════════════════════════════════════════════╗
// ║  panel-auth.jsx                                        ║
// ╚══════════════════════════════════════════════════════════╝

// ============================================================
// panel-auth.jsx — Tela de login unificado
// Exports to window: LoginScreen
// ============================================================

const {
  useState: useStateAU,
  useEffect: useEffectAU,
  useRef: useRefAU,
} = React;

const LOGO_LOGIN = "design-system/assets/logo-principal-cosmic-latte.png";

// ----------------------------- Login -------------------------------------

function LoginScreen({ auth }) {
  const [usuario, setUsuario] = useStateAU("");
  const [senha, setSenha] = useStateAU("");
  const [err, setErr] = useStateAU(null);
  const [busy, setBusy] = useStateAU(false);
  const [show, setShow] = useStateAU(false);
  const userRef = useRefAU(null);

  useEffectAU(() => { userRef.current && userRef.current.focus(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    setBusy(true);
    const res = await auth.login(usuario, senha);
    setBusy(false);
    if (!res.ok) setErr(res.error || "Não foi possível entrar.");
  };

  return (
    <div className="login-stage">
      <div className="login-card">
        <div className="login-logo">
          <img src={LOGO_LOGIN} alt="PlanFlow" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
        <div className="login-head">
          <span className="login-eyebrow">Gerador de Planejamento</span>
          <h1>Acesso da equipe</h1>
          <p>Entre com o usuário e a senha da equipe para continuar.</p>
        </div>

        <form className="login-form" onSubmit={submit}>
          <label className="login-field">
            <span>Usuário</span>
            <input
              ref={userRef}
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="usuário da equipe"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </label>

          <label className="login-field">
            <span>Senha</span>
            <div className="login-pw">
              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button type="button" className="login-pw-toggle"
                onClick={() => setShow(s => !s)}
                title={show ? "Ocultar senha" : "Mostrar senha"}>
                {show ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>

          {err && <div className="login-err">{err}</div>}

          <button type="submit" className="login-submit" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen });

// ╔══════════════════════════════════════════════════════════╗
// ║  main.jsx                                              ║
// ╚══════════════════════════════════════════════════════════╝

// ============================================================
// main.jsx — Root App: auth gate + tabs + state wiring
// ============================================================

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA, useMemo: useMemoA } = React;

const BASE_TABS = [
  { id: "plans",   step: "—",  label: "Arquivo" },
  { id: "upload",  step: "01", label: "Upload" },
  { id: "design",  step: "02", label: "Design System" },
  { id: "editor",  step: "03", label: "Editor" },
  { id: "preview", step: "04", label: "Feed Preview" },
];

// ----------------------------- User menu (topbar) -----------------------

function UserMenu({ auth }) {
  const s = auth.session;
  if (!s) return null;

  return (
    <div className="user-menu-wrap">
      <div className="user-chip static">
        <span className="user-chip-avatar">{(s.nome || "?").charAt(0).toUpperCase()}</span>
        <span className="user-chip-info">
          <span className="user-chip-name">{s.nome}</span>
          <span className="user-chip-role">Equipe</span>
        </span>
      </div>
      <button className="logout-btn" onClick={auth.logout} title="Encerrar sessão">
        Sair
      </button>
    </div>
  );
}

// ----------------------------- App --------------------------------------

function App() {
  const auth = useAuth();
  const baseStore = useAppStore();
  const sync = useSupabaseSync(baseStore);

  // Augment the store with the current role + permission flags so every
  // panel can gate destructive / editing actions.
  const store = useMemoA(() => ({
    ...sync.store,
    role: auth.role,
    isAdmin: auth.isAdmin,
    canEdit: auth.canEdit,
    currentUser: auth.session,
  }), [sync.store, auth.role, auth.isAdmin, auth.canEdit, auth.session]);

  const [tab, setTab] = useStateA("plans");
  const [showSaveBar, setShowSaveBar] = useStateA(false);

  // Apply the chosen theme to the document root → re-skins the whole app.
  useEffectA(() => {
    document.documentElement.setAttribute("data-theme", store.theme || "light");
  }, [store.theme]);

  const tabs = BASE_TABS;

  // Keep the active tab fully visible when the nav has to scroll.
  const navRef = useRefA(null);
  useEffectA(() => {
    const nav = navRef.current;
    if (!nav) return;
    const el = nav.querySelector(".tab.active");
    if (!el) return;
    const navL = nav.scrollLeft, navR = navL + nav.clientWidth;
    const elL = el.offsetLeft, elR = elL + el.offsetWidth;
    if (elL < navL) nav.scrollTo({ left: elL - 8, behavior: "smooth" });
    else if (elR > navR) nav.scrollTo({ left: elR - nav.clientWidth + 8, behavior: "smooth" });
  }, [tab]);

  const jumpToEditor = (postId) => {
    store.setSelectedPostId(postId);
    setTab("editor");
  };

  // ---- Auth gates ----
  if (!auth.ready) {
    return (
      <div className="auth-splash">
        <div className="auth-splash-mark">S</div>
        <span>Carregando…</span>
      </div>
    );
  }
  if (!auth.session) {
    return <LoginScreen auth={auth} />;
  }

  const activePlan = store.savedPlans.find(p => p.id === store.activePlanId);
  const dirty = store.posts.length > 0 && (!activePlan ||
    activePlan.posts.length !== store.posts.length ||
    JSON.stringify(activePlan.posts) !== JSON.stringify(store.posts));

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="s-mark">S</span>
          <span>Gerador</span>
        </div>

        <nav ref={navRef}>
          {tabs.map(t => (
            <button key={t.id}
              className={`tab ${tab === t.id ? "active" : ""} ${t.id === "users" ? "tab-users" : ""}`}
              onClick={() => setTab(t.id)}>
              <span className="step">{t.step}</span>
              <span>{t.label}</span>
              {t.id === "upload" && store.posts.length > 0 && (
                <span className="tab-badge">{store.posts.length}</span>
              )}
              {t.id === "plans" && store.savedPlans.length > 0 && (
                <span className="tab-badge muted">{store.savedPlans.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="topbar-active">
          {activePlan ? (
            <button className={`active-plan-chip ${dirty ? "dirty" : ""}`}
              onClick={() => setShowSaveBar(true)}
              title={dirty ? "Salvar alterações" : "Atualizar planejamento"}>
              <div className="active-plan-info">
                <span className="client">{activePlan.client}</span>
                <span className="month">
                  {MONTH_NAMES_FULL_PT[activePlan.month-1]}/{activePlan.year}
                  {activePlan.name && ` · ${activePlan.name}`}
                </span>
              </div>
              <span className="active-plan-state">
                {dirty ? <><span className="dirty-dot" />Salvar</> : "Salvo"}
              </span>
            </button>
          ) : store.posts.length > 0 ? (
            <button className="active-plan-chip new" onClick={() => setShowSaveBar(true)}>
              <div className="active-plan-info">
                <span className="client">Sem cliente</span>
                <span className="month">{store.posts.length} post{store.posts.length === 1 ? "" : "s"} · não salvo</span>
              </div>
              <span className="active-plan-state primary">Salvar</span>
            </button>
          ) : null}
        </div>

        <div className="theme-toggle" role="group" aria-label="Tema da interface">
          <button
            className={(store.theme || "light") === "light" ? "active" : ""}
            onClick={() => store.setTheme("light")}
            title="Modo claro" aria-label="Modo claro">☀</button>
          <button
            className={store.theme === "dark" ? "active" : ""}
            onClick={() => store.setTheme("dark")}
            title="Modo escuro" aria-label="Modo escuro">☾</button>
        </div>

        <SyncBadge sync={sync} />
        <UserMenu auth={auth} />
      </header>

      <main>
        {tab === "plans"   && <PlansPanel store={store} onGoNext={() => setTab(store.posts.length ? "editor" : "upload")} />}
        {tab === "upload"  && <UploadPanel store={store} onGoNext={() => setTab("design")} />}
        {tab === "design"  && <DesignPanel store={store} onGoNext={() => setTab("editor")} />}
        {tab === "editor"  && <EditorPanel store={store} />}
        {tab === "preview" && <PreviewPanel store={store} onJumpToEditor={jumpToEditor} />}
      </main>

      {showSaveBar && <SaveDialog store={store} onClose={() => setShowSaveBar(false)} />}

      {store.toast && (
        <div className="toast">
          <span className="dot" />
          <span>{store.toast}</span>
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
