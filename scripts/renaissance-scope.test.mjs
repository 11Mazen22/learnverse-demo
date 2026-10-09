import { test } from "node:test";
import assert from "node:assert/strict";
import { routeForPath, classifyPath, checkManifest, inspectSource, localDependencies, dependencyClosure } from "./renaissance-scope.mjs";

test("discovers root, parameterized, grouped and API routes without treating layouts as pages", () => {
  assert.deepEqual(routeForPath("apps/web/app/page.tsx"), { path: "/", kind: "page" });
  assert.deepEqual(routeForPath("apps/web/app/(learning)/lesson/[id]/page.tsx"), { path: "/lesson/[id]", kind: "page" });
  assert.deepEqual(routeForPath("apps/web/app/api/documents/pdf/route.ts"), { path: "/api/documents/pdf", kind: "handler" });
  assert.equal(routeForPath("apps/web/app/layout.tsx"), null);
});

test("coverage fails for new, removed and duplicate files without silently waiving scope", () => {
  assert.deepEqual(checkManifest(["a.ts", "b.ts"], "- [ ] `a.ts`\n- [x] `deleted.ts`\n- [ ] `a.ts`"), { missing: ["b.ts"], stale: ["deleted.ts"], duplicates: ["a.ts"] });
  assert.deepEqual(checkManifest(["a.ts"], "- [ ] `a.ts`"), { missing: [], stale: [], duplicates: [] });
});

test("binary assets, legacy services, migrations and unclassified files all enter scope", () => {
  assert.equal(classifyPath("public/vendor/tesseract/ara.traineddata.gz"), "legacy-runtime-and-assets");
  assert.equal(classifyPath("supabase/migrations/future.sql"), "database-migrations");
  assert.equal(classifyPath("unknown/future.bin"), "configuration-and-other");
});

test("extracts multiline backend operations and nested actions without recording payload values", () => {
  const result = inspectSource("apps/web/components/example.tsx", `import { Child } from "./child";
    async function act() { await client.from("profiles").update({ display_name: "not-in-artifact" });
      await client.rpc("complete_lesson", { p_lesson_id: secret });
      await client.storage.from("private-files").upload(path, bytes);
      await client.auth.signOut(); Array.from("ignore"); }
    export function Page() { return <form onSubmit={act}><button aria-label="Continue" onClick={act}>Next</button><a href={destination}>Open</a><Child onConfirm={act}/></form>; }`);
  assert.deepEqual(result.operations.map(({ kind, target }) => [kind, target]), [["table", "profiles"], ["rpc", "complete_lesson"], ["storage-bucket", "private-files"], ["auth", "signOut"]]);
  assert.equal(result.actions.length, 4);
  assert.equal(result.actions.find(action => action.tag === "button").label, "Continue");
  assert.equal(result.actions.find(action => action.tag === "a").href, "<dynamic; requires review>");
  assert.ok(result.actions.every(action => action.status === "NOT_STARTED"));
  assert.ok(!JSON.stringify(result).includes("not-in-artifact"));
});

test("follows local imports transitively and tolerates circular shared components", () => {
  const files = new Set(["apps/web/app/page.tsx", "apps/web/components/child.tsx", "apps/web/components/shared.ts"]);
  assert.deepEqual(localDependencies("apps/web/app/page.tsx", ["@/components/child", "react"], files), ["apps/web/components/child.tsx"]);
  const records = new Map([
    ["page", { dependencies: ["child"] }], ["child", { dependencies: ["shared"] }], ["shared", { dependencies: ["child"] }],
  ]);
  assert.deepEqual(dependencyClosure("page", records), ["child", "page", "shared"]);
});

test("SQL declarations remain explicitly unverified against the live database", () => {
  const result = inspectSource("supabase/migrations/test.sql", "create table if not exists public.wallet (id uuid); create or replace function public.spend() returns void language sql as 'select 1';");
  assert.equal(result.declarations.length, 2);
  assert.ok(result.declarations.every(row => row.status === "SOURCE_ONLY_LIVE_SCHEMA_UNVERIFIED"));
});
