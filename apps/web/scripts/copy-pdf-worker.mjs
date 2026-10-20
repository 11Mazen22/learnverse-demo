// PDF.js runs its parser in a worker. Next's client bundler cannot reliably
// resolve a bare package specifier inside `new URL(...)`, so the studio serves
// the exact worker shipped with pdfjs-dist as a same-origin static asset.
import {copyFileSync,mkdirSync,statSync} from "node:fs";
import {createRequire} from "node:module";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(join(root, "package.json"));
const source = require.resolve("pdfjs-dist/legacy/build/pdf.worker.min.mjs");
const targetDir = join(root, "public", "pdf");
const target = join(targetDir, "pdf.worker.min.mjs");

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, target);
const { size } = statSync(target);
if (size < 500_000) throw new Error("Copied PDF worker looks truncated");
console.log(`pdf worker ready (${size} bytes)`);
