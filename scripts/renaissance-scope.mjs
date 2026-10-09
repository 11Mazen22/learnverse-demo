import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, posix, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const ts = require("typescript");
const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const manifestPath = "docs/NOATA_AURA_EXHAUSTIVE_SCOPE_MANIFEST.md";

export function routeForPath(path) {
  const match = /^apps\/web\/app\/(.*?)(?:\/)?(page|route)\.[jt]sx?$/.exec(path);
  if (!match) return null;
  const segments = match[1].split("/").filter(segment => segment && !/^\(.+\)$/.test(segment) && !segment.startsWith("@"));
  return { path: "/" + segments.join("/"), kind: match[2] === "page" ? "page" : "handler" };
}

export function classifyPath(path) {
  if (routeForPath(path)) return "modern-routes";
  if (path.startsWith("supabase/migrations/")) return "database-migrations";
  if (path.startsWith("supabase/functions/")) return "edge-functions";
  if (path.startsWith("supabase/email-templates/")) return "transactional-emails";
  if (path.startsWith("apps/web/components/")) return "modern-components";
  if (path.startsWith("apps/web/lib/")) return "modern-libraries";
  if (path.startsWith("apps/web/app/")) return "modern-shell-and-styles";
  if (path.startsWith("apps/web/public/")) return "modern-assets-and-pwa";
  if (path.startsWith("packages/")) return "shared-domain-packages";
  if (path.startsWith("scripts/") || path.startsWith("test/") || path.startsWith(".github/")) return "verification-and-ci";
  if (path === "server.mjs" || path.startsWith("lib/") || path.startsWith("public/")) return "legacy-runtime-and-assets";
  if (path.startsWith("docs/") || path === "README.md") return "specifications-and-runbooks";
  return "configuration-and-other";
}

export function checkManifest(paths, text) {
  const listed = [...text.matchAll(/^- \[[ x]\] `([^`]+)`/gm)].map(match => match[1]);
  const existing = new Set(paths), discovered = new Set(listed);
  return {
    missing: paths.filter(path => !discovered.has(path)),
    stale: listed.filter(path => !existing.has(path)),
    duplicates: listed.filter((path, index) => listed.indexOf(path) !== index),
  };
}

export function inspectSource(path, text) {
  const imports = [], operations = [], actions = [], declarations = [];
  if (/\.[cm]?[jt]sx?$/.test(path)) {
    const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const lineOf = node => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    const staticValue = node => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null;
    const attributesOf = node => node.attributes.properties.filter(ts.isJsxAttribute);
    const attributeText = attribute => {
      if (!attribute?.initializer) return null;
      if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text;
      if (ts.isJsxExpression(attribute.initializer)) return staticValue(attribute.initializer.expression);
      return null;
    };
    const visit = node => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const method = node.expression.name.text;
        const receiver = node.expression.expression.getText(source);
        const target = staticValue(node.arguments[0]);
        let kind;
        if (method === "rpc") kind = "rpc";
        if (method === "from" && receiver !== "Array" && target) kind = receiver.includes(".storage") ? "storage-bucket" : "table";
        if (/\.auth(?:\.admin)?$/.test(receiver)) kind = "auth";
        if (kind) operations.push({ kind, target: kind === "auth" ? method : target ?? "<dynamic; requires review>", line: lineOf(node), status: "DISCOVERED_NOT_VERIFIED" });
      }
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(source), attributes = attributesOf(node);
        const events = attributes.filter(attribute => /^on[A-Z]/.test(attribute.name.text)).map(attribute => attribute.name.text);
        const href = attributes.find(attribute => attribute.name.text === "href");
        if (["button", "form", "input", "select", "textarea", "a"].includes(tag) || events.length || href) {
          const parent = node.parent;
          const textChildren = ts.isJsxElement(parent) ? parent.children.filter(ts.isJsxText).map(child => child.text.trim()).filter(Boolean).join(" ") : "";
          actions.push({ tag, line: lineOf(node), label: attributeText(attributes.find(attribute => ["aria-label", "title"].includes(attribute.name.text))) || textChildren || "<dynamic/composed; requires review>", events, href: href ? attributeText(href) ?? "<dynamic; requires review>" : null, status: "NOT_STARTED", requiredStates: ["success", "error", "retry", "offline", "timeout", "duplicate", "account-switch", "keyboard", "rtl-ltr", "reduced-motion"] });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  } else if (path.endsWith(".sql")) {
    for (const match of text.matchAll(/create\s+(?:or\s+replace\s+)?(function|table|policy)\s+(?:if\s+not\s+exists\s+)?([\w.\"]+)/gi)) declarations.push({ kind: match[1].toLowerCase(), name: match[2], line: text.slice(0, match.index).split("\n").length, status: "SOURCE_ONLY_LIVE_SCHEMA_UNVERIFIED" });
  }
  return { imports, operations, actions, declarations };
}

export function localDependencies(path, imports, knownPaths) {
  return imports.flatMap(value => {
    const base = value.startsWith("@/") ? "apps/web/" + value.slice(2) : value.startsWith(".") ? posix.normalize(posix.join(posix.dirname(path), value)) : null;
    if (!base) return [];
    const candidate = [base, ...[".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.tsx"].map(extension => base + extension)].find(file => knownPaths.has(file));
    return candidate ? [candidate] : [];
  });
}

export function dependencyClosure(entry, records) {
  const seen = new Set();
  function visit(path) {
    if (seen.has(path) || !records.has(path)) return;
    seen.add(path);
    for (const dependency of records.get(path).dependencies) visit(dependency);
  }
  visit(entry);
  return [...seen].sort();
}

async function main() {
  const git = (...arguments_) => execFileSync("git", arguments_, { cwd: root, encoding: "utf8" }).trim();
  const paths = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean))].sort();
  const knownPaths = new Set(paths);
  const coverage = checkManifest(paths, await readFile(resolve(root, manifestPath), "utf8"));
  const records = new Map();
  for (const path of paths) {
    const bytes = await readFile(resolve(root, path));
    const source = inspectSource(path, bytes.toString("utf8"));
    records.set(path, { path, system: classifyPath(path), sha256: createHash("sha256").update(bytes).digest("hex"), acceptance: "DISCOVERED_NOT_VERIFIED", ...source, dependencies: localDependencies(path, source.imports, knownPaths) });
  }
  const routes = paths.flatMap(file => {
    const route = routeForPath(file);
    if (!route) return [];
    const dependencies = dependencyClosure(file, records);
    return [{ ...route, file, status: "NOT_CERTIFIED", dependencies, actions: dependencies.flatMap(path => records.get(path).actions.map(action => ({ file: path, ...action }))), operations: dependencies.flatMap(path => records.get(path).operations.map(operation => ({ file: path, ...operation }))) }];
  });
  const passed = !coverage.missing.length && !coverage.stale.length && !coverage.duplicates.length;
  const outcome = { revision: git("rev-parse", "HEAD"), dirty: Boolean(git("status", "--porcelain")), branch: git("branch", "--show-current"), passed, proof: "STATIC_DISCOVERY_ONLY_NOT_FUNCTIONAL_CERTIFICATION", limitations: ["Static graph does not resolve dynamic imports, generated controls, delegated events or every legacy endpoint. These remain manually reviewable in their inventoried source files.", "Database declarations are source-only, not live schema/RLS evidence.", "Shared layouts are separately inventoried; route dependencies do not certify shell behavior.", "Every discovered action starts NOT_STARTED; no test success is inferred from file existence."], counts: { files: paths.length, pages: routes.filter(route => route.kind === "page").length, handlers: routes.filter(route => route.kind === "handler").length, actions: [...records.values()].reduce((sum, record) => sum + record.actions.length, 0) }, coverage, routes, files: [...records.values()] };
  if (!process.argv.includes("--no-write")) {
    const directory = resolve(root, "artifacts/noata-scope");
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, "outcome.json"), JSON.stringify(outcome, null, 2) + "\n");
  }
  console.log(JSON.stringify({ ...outcome, routes: undefined, files: undefined }, null, 2));
  if (process.argv.includes("--check") && !passed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
