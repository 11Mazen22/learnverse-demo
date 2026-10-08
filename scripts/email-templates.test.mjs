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
    assert.match(html,/role="presentation"/);
    assert.equal((html.match(/{{\s*\.ConfirmationURL\s*}}/g)||[]).length,1);
    assert.doesNotMatch(html,/<script|<form|<iframe/i);
    assert.doesNotMatch(html,/sb_secret_|SUPABASE_SERVICE_ROLE_KEY|password=|apikey=/i);
    assert.ok(html.length>1500 && html.length<12000);
  });
}
