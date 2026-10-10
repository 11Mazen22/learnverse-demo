import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// The source of rendered copy includes TSX, public scripts, seeds and email
// templates. A replacement glyph is never intentional in those files.
const paths = execFileSync("git", ["ls-files", "-z"], { encoding: "buffer" })
  .toString("utf8").split("\0").filter(Boolean);
const textExtensions = /\.(?:css|html|js|jsx|json|md|mjs|sql|svg|ts|tsx|txt|webmanifest|yaml|yml)$/i;
const failures = [];
let checked = 0;
const decoder = new TextDecoder("utf-8", { fatal: true });
const mojibake = /(?:Ã[\u0080-\u00BF]|Â[\u0080-\u00BF]|Ø[\u0080-\u00BF]|Ù[\u0080-\u00BF]|â[\u0080-\u00BF]{2})/u;

for (const path of paths) {
  if (!textExtensions.test(path)) continue;
  checked++;
  let source;
  try { source = decoder.decode(readFileSync(path)); }
  catch { failures.push(`${path}: invalid UTF-8`); continue; }
  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/[\uFFFD\u202A-\u202E\u2066-\u2069]/u.test(lines[i])) {
      failures.push(`${path}:${i + 1}: replacement glyph or invisible direction control`);
    }
    if (mojibake.test(lines[i])) failures.push(`${path}:${i + 1}: probable double-encoded text`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Text integrity PASS: ${checked} tracked UTF-8 text files; no replacement glyphs or bidi controls.`);
}
