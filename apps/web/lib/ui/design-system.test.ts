import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveBrowserColorScheme } from "../appearance/mode.ts";
import { contrastRatio } from "../appearance/theme.ts";

const WEB_ROOT = path.resolve(import.meta.dirname, "../..");

function normalizeHex(hex: string): string {
  const clean = hex.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(clean)) {
    return `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  return clean;
}

function parseVars(declarationBlock: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const matches = declarationBlock.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)/gi);
  for (const m of matches) {
    vars[m[1]] = m[2].trim();
  }
  return vars;
}

function collectCssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectCssFiles(full));
    } else if (entry.name.endsWith(".css")) {
      out.push(full);
    }
  }
  return out;
}

test("CSS cascade layers are declared in canonical Stage 01 order", () => {
  const layersCss = fs.readFileSync(
    path.join(WEB_ROOT, "app/styles/layers.css"),
    "utf8",
  );
  assert.match(
    layersCss,
    /@layer\s+reset,\s*vendor,\s*tokens,\s*theme,\s*base,\s*components,\s*shell,\s*patterns,\s*sections,\s*study,\s*staff,\s*utilities\s*;/,
  );
});

test("Every app stylesheet is brace-balanced, uses @layer, avoids light dark color-scheme and invalid motion syntax", () => {
  const files = [
    ...collectCssFiles(path.join(WEB_ROOT, "app")),
    path.join(WEB_ROOT, "components/legal/legal-pages.css"),
  ];
  assert.ok(files.length >= 30);

  for (const file of files) {
    const rel = path.relative(WEB_ROOT, file);
    const css = fs.readFileSync(file, "utf8");

    // Brace balance check
    let depth = 0;
    for (const ch of css) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      assert.ok(depth >= 0, `${rel} had unmatched closing brace`);
    }
    assert.equal(depth, 0, `${rel} had unclosed brace (depth=${depth})`);

    // Every global stylesheet uses @layer
    assert.match(css, /@layer\b/, `${rel} must participate in @layer`);

    // Prohibit unconditional `color-scheme: light dark`
    assert.doesNotMatch(
      css,
      /color-scheme\s*:\s*light\s+dark/i,
      `${rel} must not set unconditional color-scheme: light dark`,
    );

    // Prohibit invalid combined reduced-motion syntax
    assert.doesNotMatch(
      css,
      /prefers-reduced-motion\s*:\s*(?:no-preference\s*\|\s*reduce|reduce\s*\|\s*no-preference)/i,
      `${rel} contains invalid prefers-reduced-motion media query syntax`,
    );

    // Prohibit global 0.01ms !important hacks
    assert.doesNotMatch(
      css,
      /0\.01ms\s*!important/i,
      `${rel} still contains 0.01ms !important workaround`,
    );
  }
});

test("Root layout wires layers, tokens, UI kit, patterns, ToastProvider, and layered KaTeX", () => {
  const layout = fs.readFileSync(path.join(WEB_ROOT, "app/layout.tsx"), "utf8");
  const globals = fs.readFileSync(path.join(WEB_ROOT, "app/globals.css"), "utf8");

  assert.doesNotMatch(
    layout,
    /import\s+["']katex\/dist\/katex\.min\.css["']/,
    "layout.tsx must not import unlayered katex CSS directly",
  );
  assert.match(
    globals,
    /@import\s+["']katex\/dist\/katex\.min\.css["']\s+layer\(vendor\)\s*;/,
  );

  const layerImportIdx = layout.indexOf('import "./styles/layers.css"');
  const tokensImportIdx = layout.indexOf('import "./styles/tokens.css"');
  const globalsImportIdx = layout.indexOf('import "./globals.css"');
  const uiImportIdx = layout.indexOf('import "./styles/ui.css"');
  const patternsImportIdx = layout.indexOf('import "./styles/patterns.css"');

  assert.ok(layerImportIdx !== -1 && layerImportIdx < tokensImportIdx);
  assert.ok(tokensImportIdx < globalsImportIdx);
  assert.ok(globalsImportIdx < uiImportIdx);
  assert.ok(uiImportIdx < patternsImportIdx);
  assert.match(layout, /<ToastProvider>/);
});

test("resolveBrowserColorScheme returns strict 'light' or 'dark' across all modes and palettes", () => {
  assert.equal(resolveBrowserColorScheme("light", "classic"), "light");
  assert.equal(resolveBrowserColorScheme("dark", "classic"), "dark");
  assert.equal(resolveBrowserColorScheme("light", "midnight"), "dark");
  assert.equal(resolveBrowserColorScheme("dark", "midnight"), "dark");
  assert.equal(resolveBrowserColorScheme(null, "ocean"), "light");
  assert.equal(resolveBrowserColorScheme("light", "rose"), "light");
  assert.equal(resolveBrowserColorScheme("dark", "forest"), "dark");
});

test("All 13 built-in palette x theme combinations meet WCAG 2.2 AA (>= 4.5:1) contrast", () => {
  const tokensCss = fs.readFileSync(
    path.join(WEB_ROOT, "app/styles/tokens.css"),
    "utf8",
  );
  const paletteCss = fs.readFileSync(
    path.join(WEB_ROOT, "app/palette.css"),
    "utf8",
  );

  const lightBaseMatch = tokensCss.match(
    /:root,\s*html\[data-theme="light"\]\s*\{([\s\S]*?)\n\s*\}/,
  );
  const darkBaseMatch = tokensCss.match(
    /html\[data-theme="dark"\],\s*html\[data-palette="midnight"\]\s*\{([\s\S]*?)\n\s*\}/,
  );
  assert.ok(lightBaseMatch && darkBaseMatch);

  const lightBase = parseVars(lightBaseMatch[1]);
  const darkBase = parseVars(darkBaseMatch[1]);

  const combos: Array<{
    name: string;
    tokens: Record<string, string>;
  }> = [
    { name: "classic:light", tokens: lightBase },
    { name: "classic:dark", tokens: darkBase },
  ];

  for (const palette of ["aura", "ocean", "forest", "sunset", "rose"] as const) {
    const lightRe = new RegExp(`html\\[data-palette="${palette}"\\]\\s*\\{([^}]*)\\}`);
    const darkRe = new RegExp(
      `html\\[data-theme="dark"\\]\\[data-palette="${palette}"\\]\\s*\\{([^}]*)\\}`,
    );
    const lMatch = paletteCss.match(lightRe);
    const dMatch = paletteCss.match(darkRe);
    assert.ok(lMatch, `Missing light definition for ${palette}`);
    assert.ok(dMatch, `Missing dark definition for ${palette}`);
    combos.push({
      name: `${palette}:light`,
      tokens: { ...lightBase, ...parseVars(lMatch[1]) },
    });
    combos.push({
      name: `${palette}:dark`,
      tokens: { ...darkBase, ...parseVars(dMatch[1]) },
    });
  }

  const midnightMatch = paletteCss.match(/html\[data-palette="midnight"\]\s*\{([^}]*)\}/);
  assert.ok(midnightMatch);
  combos.push({
    name: "midnight:dark",
    tokens: { ...darkBase, ...parseVars(midnightMatch[1]) },
  });

  assert.equal(combos.length, 13);

  for (const { name, tokens } of combos) {
    const surface = normalizeHex(tokens["--surface"]);
    const soft = normalizeHex(tokens["--surface-soft"]);
    const ink = normalizeHex(tokens["--ink"]);
    const muted = normalizeHex(tokens["--muted"]);
    const accent = normalizeHex(tokens["--accent"]);
    const onAccent = normalizeHex(tokens["--on-accent"]);

    assert.ok(contrastRatio(ink, surface) >= 4.5, `${name}: ink/surface contrast`);
    assert.ok(contrastRatio(ink, soft) >= 4.5, `${name}: ink/surface-soft contrast`);
    assert.ok(contrastRatio(muted, surface) >= 4.5, `${name}: muted/surface contrast`);
    assert.ok(contrastRatio(muted, soft) >= 4.5, `${name}: muted/surface-soft contrast`);
    assert.ok(contrastRatio(accent, surface) >= 4.5, `${name}: accent/surface contrast`);
    assert.ok(contrastRatio(onAccent, accent) >= 4.5, `${name}: on-accent/accent contrast`);
  }
});

test("UI design system barrel exports all Tier 3 & Tier 4 primitives", () => {
  const indexSrc = fs.readFileSync(
    path.join(WEB_ROOT, "components/ui/index.ts"),
    "utf8",
  );
  for (const symbol of [
    "Icon",
    "Button",
    "IconButton",
    "Badge",
    "Card",
    "Field",
    "Fieldset",
    "Input",
    "Select",
    "Textarea",
    "Tabs",
    "DataTable",
    "Skeleton",
    "SkeletonGroup",
    "EmptyState",
    "Dialog",
    "Drawer",
    "ConfirmHost",
    "ToastProvider",
    "useToast",
    "PageHeader",
    "BentoGrid",
    "StatTile",
    "SplitReaderShell",
    "StudyStageCanvas",
    "FilterToolbar",
    "StaffConsoleSection",
    "ErrorBoundary",
  ]) {
    assert.ok(indexSrc.includes(symbol), `Missing barrel export for ${symbol}`);
  }
});

test("ErrorBoundary implements accessible alert recovery and boundary lifecycle", () => {
  const src = fs.readFileSync(
    path.join(WEB_ROOT, "components/ui/error-boundary.tsx"),
    "utf8",
  );
  assert.match(src, /static getDerivedStateFromError/);
  assert.match(src, /role="alert"/);
  assert.match(src, /setState\(\{\s*hasError:\s*false\s*\}\)/);
});

test("Stage 01 Gate 1 sign-off: base .btn-primary and interactive CTAs bind --accent + --on-accent", () => {
  const globals = fs.readFileSync(path.join(WEB_ROOT, "app/globals.css"), "utf8");
  const btnPrimaryMatch = globals.match(/\.btn-primary\s*\{[\s\S]*?\}/);
  assert.ok(btnPrimaryMatch, "globals.css must declare .btn-primary");
  assert.match(btnPrimaryMatch[0], /background:\s*var\(--accent\)/);
  assert.match(btnPrimaryMatch[0], /color:\s*var\(--on-accent/);
  assert.doesNotMatch(btnPrimaryMatch[0], /var\(--lime\)/);
  assert.doesNotMatch(btnPrimaryMatch[0], /#102445/);

  for (const rel of [
    "components/learn/lesson-live.tsx",
    "components/admin/admin-live.tsx",
    "components/assignments/assignments-live.tsx",
  ]) {
    const src = fs.readFileSync(path.join(WEB_ROOT, rel), "utf8");
    assert.doesNotMatch(
      src,
      /background:\s*(?:tab\s*===\s*x\s*\?\s*)?"var\(--accent\)"[\s\S]{0,120}color:\s*(?:tab\s*===\s*x\s*\?\s*)?"var\(--surface\)"/,
      `${rel} must use --on-accent instead of --surface text on --accent background`,
    );
  }
});

test("Stage 01 Gate 1 sign-off: mobile dock yields to .mushaf-focused and dialogs cleanly without 768-800px overlap", () => {
  const sidebarCss = fs.readFileSync(path.join(WEB_ROOT, "app/sidebar-rebirth.css"), "utf8");
  const sidebarCssNoComments = sidebarCss.replace(/\/\*[\s\S]*?\*\//g, "");
  const globalsCss = fs.readFileSync(path.join(WEB_ROOT, "app/globals.css"), "utf8");

  assert.doesNotMatch(sidebarCssNoComments, /display:\s*flex\s*!important/);
  assert.match(sidebarCssNoComments, /\.noata-shell:has\(\.mushaf-focused\)\s*>\s*\.mobile-nav/);
  assert.match(sidebarCssNoComments, /\.noata-shell:has\(dialog\[open\]\)\s*>\s*\.mobile-nav/);
  assert.match(sidebarCssNoComments, /\.noata-main\s*\{[\s\S]*overflow-x:\s*clip/);
  assert.doesNotMatch(globalsCss, /@media\s*\(max-width:\s*800px\)\s*\{\s*\.noata-shell\s*\{/);
});

test("Gate 1 Lesson RTL clipping & subject accents: outline grid collapses cleanly and propagates data-accent", () => {
  const lessonCss = fs.readFileSync(path.join(WEB_ROOT, "app/lesson-experience.css"), "utf8");
  const lessonTsx = fs.readFileSync(path.join(WEB_ROOT, "components/learn/lesson-live.tsx"), "utf8");

  assert.match(lessonCss, /\.noata-lesson-layout\s*>\s*\*\s*\{[\s\S]*min-width:\s*0/);
  assert.match(lessonCss, /@media\s*\(max-width:\s*1120px\)/);
  for (const accent of ["cyan", "indigo", "amber", "rose", "teal", "violet"]) {
    assert.match(
      lessonCss,
      new RegExp(`\\.noata-lesson-container\\[data-accent="${accent}"\\]`),
      `lesson-experience.css must define [data-accent="${accent}"]`,
    );
  }
  assert.match(lessonTsx, /data-accent=\{lessonAccent\}/);
});

test("Gate 1 Module 02: StudyRichText enforces SAFE_KATEX_OPTIONS and RTL KaTeX isolation", () => {
  const studyRichText = fs.readFileSync(
    path.join(WEB_ROOT, "components/study/study-rich-text.tsx"),
    "utf8",
  );
  const studyCss = fs.readFileSync(path.join(WEB_ROOT, "app/study-experience.css"), "utf8");

  assert.match(studyRichText, /rehypePlugins=\{\[\[rehypeKatex,\s*SAFE_KATEX_OPTIONS\]\]\}/);
  assert.match(studyRichText, /text\?: string \| null/);
  assert.match(studyRichText, /blocks\?: StructuredStudyBlock\[\] \| null/);
  assert.match(studyCss, /\.noata-study-rich-text\s+\.katex[\s\S]*direction:\s*ltr[\s\S]*unicode-bidi:\s*isolate/);
});
