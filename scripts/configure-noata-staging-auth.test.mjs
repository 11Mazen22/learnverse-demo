import test from "node:test";
import assert from "node:assert/strict";
import { buildStagingPatch, APPROVED_STAGING_REF, STAGING_ORIGIN, templatesFromRepo } from "./configure-noata-staging-auth.mjs";

test("staging configuration can never point to Noata production",()=>{
  assert.equal(APPROVED_STAGING_REF,"vpfpjvhafkmygetjkfcp");
  assert.equal(STAGING_ORIGIN,"https://noata-git-noata-aura-platform-overhaul-20261008-noata.vercel.app");
});
test("all five Arabic email templates use the verified Supabase link exactly once",()=>{
  const templates=templatesFromRepo();
  const patch=buildStagingPatch({uri_allow_list:"http://localhost:3000/**"},templates);
  assert.equal(patch.site_url,STAGING_ORIGIN);
  assert.equal(patch.uri_allow_list.includes(STAGING_ORIGIN+"/**"),true);
  assert.equal(patch.uri_allow_list.includes("http://localhost:3000/**"),true);
  assert.equal(patch.external_google_enabled,undefined);
  for(const name of ["confirmation","recovery","invite","magic_link","email_change"]){
    const value=patch["mailer_templates_"+name+"_content"];
    assert.equal((value.match(/{{\s*\.ConfirmationURL\s*}}/g)||[]).length,1);
    assert.equal(value.includes('lang="ar" dir="rtl"'),true);
  }
});
test("Google sign-in cannot be enabled without both real approved OAuth credentials",()=>{
 const templates=templatesFromRepo();
 assert.throws(()=>buildStagingPatch({},templates,{google:{id:"invalid",secret:""}}),/Google OAuth/);
 const withGoogle=buildStagingPatch({},templates,{google:{id:"test.apps.googleusercontent.com",secret:"not-a-real-test-secret"}});
 assert.equal(withGoogle.external_google_enabled,true);
 assert.equal(withGoogle.external_google_client_id,"test.apps.googleusercontent.com");
 assert.equal(withGoogle.external_google_secret,"not-a-real-test-secret");
});
test("broken templates or partial SMTP never reach management API",()=>{
 const templates=templatesFromRepo();
 assert.throws(()=>buildStagingPatch({}, {...templates, recovery:"<html>invalid</html>"}),/Invalid or unsafe email template/);
 assert.throws(()=>buildStagingPatch({},templates,{smtp:{host:"smtp.example"}}),/Complete SMTP credentials/);
});
