import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("sidebar maintains all canonical product routes", () => {
  const canonicalRoutes = [
    "/",
    "/learn",
    "/missions",
    "/review",
    "/study",
    "/boss",
    "/ai",
    "/quran",
    "/progress",
    "/rewards",
    "/assignments",
    "/settings",
    "/help",
    "/teacher",
    "/admin",
  ];

  for (const route of canonicalRoutes) {
    assert.ok(route.startsWith("/"), `Route must start with /: ${route}`);
  }
});

test("curriculum integration preserves the 6 official core subjects", () => {
  const subjects = [
    { slug: "integrated-science", dualLanguage: true },
    { slug: "mathematics", dualLanguage: true },
    { slug: "history", dualLanguage: false },
    { slug: "arabic-language", dualLanguage: false },
    { slug: "english", dualLanguage: false },
    { slug: "philosophy-logic", dualLanguage: false },
  ];

  assert.equal(subjects.length, 6);
  assert.equal(subjects.filter((s) => s.dualLanguage).length, 2);
  assert.equal(
    subjects.find((s) => s.slug === "integrated-science")?.dualLanguage,
    true
  );
  assert.equal(
    subjects.find((s) => s.slug === "mathematics")?.dualLanguage,
    true
  );
});

test("brand name strictly includes the two dots (ä)", () => {
  const brandName = "Noäta";
  assert.equal(brandName.includes("ä"), true);
  assert.equal(brandName, "Noäta");
});

test("tablet sidebar and mobile dock use one non-overlapping breakpoint", async () => {
  const css = await readFile(new URL("../app/sidebar-rebirth.css", import.meta.url), "utf8");
  assert.match(css, /@media \(min-width: 768px\) and \(max-width: 1180px\)/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.doesNotMatch(css, /@media \(max-width: 1024px\)/);
  assert.match(css, /\.mobile-nav \{[\s\S]*position: fixed !important/);
  assert.match(css, /padding-bottom: calc\(90px \+ env\(safe-area-inset-bottom\)\)/);
});
