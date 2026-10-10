import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const templates=["confirm-signup","recovery","magic-link","invite","change-email"];

for(const kind of templates) {
  test("Noata email uses trusted Supabase confirmation links and Arabic RTL: "+kind,()=>{
    const html=readFileSync(new URL("../supabase/email-templates/"+kind+".html",import.meta.url),"utf8");
    assert.match(html,/<!doctype html>/i);
    assert.match(html,/<html lang="ar" dir="rtl">/);
    assert.match(html,/meta name="viewport"/);
    assert.match(html,/Noata/);
    assert.ok(html.includes('src="{{ .SiteURL }}/noata-mark-light.svg"'), "Email must display the actual official Noata emblem");
    assert.match(html, /alt="شعار Noata"/);
    assert.doesNotMatch(html, />N<\/span>/, "Emails must not substitute an N-only square for the official logo");
    assert.match(html,/role="presentation"/);
    assert.equal((html.match(/{{\s*\.ConfirmationURL\s*}}/g)||[]).length,1);
    assert.doesNotMatch(html,/<script|<form|<iframe/i);
    assert.doesNotMatch(html,/sb_secret_|SUPABASE_SERVICE_ROLE_KEY|password=|apikey=/i);
    assert.ok(html.length>1500 && html.length<12000);
  });
}

test("Official cap/N/book SVG stays recognizable and is not obscured by old PWA caches",()=>{
  const read=(name)=>readFileSync(new URL("../apps/web/public/"+name,import.meta.url),"utf8");
  const light=read("noata-mark.svg");
  const dark=read("noata-mark-light.svg");
  const launcher=read("icon.svg");
  for(const logo of [light,dark,launcher]){
    assert.match(logo,/<svg [^>]*viewBox="0 0 512 512"/);
    assert.match(logo,/fill-rule="evenodd"/);
    assert.ok((logo.match(/<path /g)||[]).length>=3, "Cap, N and open book must all exist");
    assert.doesNotMatch(logo,/<rect /, "Do not replace detailed identity with generic app-square");
    assert.match(logo, /M(?:62,125|52,120)/, "Official graduation cap and tassel geometry must remain");
  }
  assert.notEqual(light,dark,"Light and dark logo treatments must stay distinct");
  const worker=read("sw.js");
  assert.match(worker,/noata-static-v5-network-only/);
  assert.match(worker,/noata-mark-light.svg/);
  assert.match(worker,/noata-mark.svg/);
});
