import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PALETTES, isPalette, resolvePalette, paletteFromStorage } from "./palette.ts";

const globals = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const palettes = readFileSync(new URL("../../app/palette.css", import.meta.url), "utf8");
function tokens(css: string, selector: string) {
  const body = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(match => match[1].trim() === selector)?.[2] ?? "";
  return Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));
}
function luminance(hex: string) {
  assert.match(hex, /^#[\da-f]{3}(?:[\da-f]{3})?$/i);
  const value = hex.length === 4 ? "#" + [...hex.slice(1)].map(char => char + char).join("") : hex;
  return [1, 3, 5].map(start => parseInt(value.slice(start, start + 2), 16) / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}
function contrast(a: string, b: string) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

test("only the seven supported identities are accepted; storage failures preserve session appearance", () => {
  assert.equal(PALETTES.length, 7);
  assert.equal(new Set(PALETTES.map(palette => palette.id)).size, 7);
  for (const palette of PALETTES) assert.equal(resolvePalette(palette.id), palette.id);
  for (const value of [null, undefined, {}, "Ocean", "__proto__", "invalid"]) {
    assert.equal(isPalette(value), false);
    assert.equal(resolvePalette(value), "classic");
  }
  assert.equal(paletteFromStorage({ getItem: () => { throw Error("Storage denied"); } }, "forest"), "forest");
  assert.equal(paletteFromStorage({ getItem: () => "invalid" }, "forest"), "classic");
});

for (const palette of PALETTES) {
  for (const theme of ["light", "dark"]) {
    test(`${palette.en} / ${theme}: semantic text, statuses and selected controls meet 4.5:1`, () => {
      const values = { ...tokens(globals, ":root"), ...(theme === "dark" ? tokens(globals, 'html[data-theme="dark"]') : {}), ...tokens(palettes, `html[data-palette="${palette.id}"]`), ...(theme === "dark" ? tokens(palettes, `html[data-theme="dark"][data-palette="${palette.id}"]`) : {}) };
      for (const foreground of ["--ink", "--muted", "--accent", "--success", "--warning", "--danger"]) {
        for (const background of ["--surface", "--surface-soft"]) {
          const ratio = contrast(values[foreground], values[background]);
          assert.ok(ratio >= 4.5, `${foreground} ${values[foreground]} on ${background} ${values[background]}: ${ratio.toFixed(2)}:1`);
        }
      }
      assert.ok(contrast(values["--accent"], values["--accent-soft"]) >= 4.5, "selected navigation must remain readable");
    });
  }
}
