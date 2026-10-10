import test from "node:test";
import assert from "node:assert/strict";
import {STAGING_REF,STAGING_URL,QA_SCOPE,ROLES,qaPlan,requireProvisionAuthorization} from "./staging-qa-config.mjs";
const strong=["QAstrongTEST!7298432q","QAstrongTEST!7298433q","QAstrongTEST!7298434q"];
const key=(ref=STAGING_REF,role='service_role')=>['test',Buffer.from(JSON.stringify({ref,role})).toString('base64url'),'signature'].join('.');
const template=()=>({
 AURA_STAGING_DB_REF:STAGING_REF,NOATA_QA_EMAIL_DOMAIN:"example.com",
 NOATA_QA_STUDENT_EMAIL:"student.qa@example.com",NOATA_QA_STUDENT_PASSWORD:strong[0],
 NOATA_QA_TEACHER_EMAIL:"teacher.qa@example.com",NOATA_QA_TEACHER_PASSWORD:strong[1],
 NOATA_QA_ADMIN_EMAIL:"admin.qa@example.com",NOATA_QA_ADMIN_PASSWORD:strong[2]
});
test("provisioner is tied to authorized staging and exactly three roles",()=>{
 assert.equal(STAGING_URL,"https://"+STAGING_REF+".supabase.co");
 assert.equal(QA_SCOPE,"staging-v1");
 assert.deepEqual(ROLES,["student","teacher","admin"]);
 assert.deepEqual(qaPlan(template()).map(x=>x.role),["student","teacher","admin"]);
 assert.throws(()=>qaPlan({...template(),AURA_STAGING_DB_REF:"production-ref"}),/Refusing/);
});
test("duplicate emails, weak shared passwords, and unowned QA domains are refused",()=>{
 const e=template();
 assert.throws(()=>qaPlan({...e,NOATA_QA_ADMIN_EMAIL:e.NOATA_QA_STUDENT_EMAIL}),/distinct/);
 assert.throws(()=>qaPlan({...e,NOATA_QA_ADMIN_PASSWORD:e.NOATA_QA_STUDENT_PASSWORD}),/distinct/);
 assert.throws(()=>qaPlan({...e,NOATA_QA_EMAIL_DOMAIN:"example.invalid"}),/domain/);
 assert.throws(()=>qaPlan({...e,NOATA_QA_ADMIN_PASSWORD:"123456"}),/strong password/);
 assert.throws(()=>qaPlan({...e,NOATA_QA_TEACHER_EMAIL:"teacher.qa@elsewhere.com"}),/verified QA domain/);
});
test("protected explicit approval is required before any side-effect",()=>{
 const env=template();
 assert.equal(requireProvisionAuthorization(env,[]),false);
 assert.throws(()=>requireProvisionAuthorization(env,["--apply"]),/explicitly authorized/);
 assert.throws(()=>requireProvisionAuthorization({...env,NOATA_QA_ENABLE_PROVISION:"YES",NOATA_QA_CONTROLLED_EMAILS:"YES"},["--apply"]),/credentials/);
 const secure={...env,NOATA_QA_ENABLE_PROVISION:"YES",NOATA_QA_CONTROLLED_EMAILS:"YES",NOATA_STAGING_SERVICE_ROLE_KEY:key(),NOATA_STAGING_PUBLISHABLE_KEY:"test-only-fixture"};
 assert.equal(requireProvisionAuthorization(secure,["--apply"]),true);
 assert.throws(()=>requireProvisionAuthorization({...secure,NOATA_STAGING_ORIGIN:"https://noata.vercel.app"},["--apply"]),/noncanonical/);
});
test('foreign, production and non-admin keys are rejected before Auth Admin requests',()=>{
 const secure={...template(),NOATA_QA_ENABLE_PROVISION:'YES',NOATA_QA_CONTROLLED_EMAILS:'YES',NOATA_STAGING_PUBLISHABLE_KEY:'test-only-fixture'};
 for(const credential of [key('qvfywwpoktmbjsunqizr'),key('jdkfqdzgphzqbbzmerzr'),key(STAGING_REF,'anon'),'malformed'])
  assert.throws(()=>requireProvisionAuthorization({...secure,NOATA_STAGING_SERVICE_ROLE_KEY:credential},['--apply']),/credential/);
 assert.throws(()=>requireProvisionAuthorization({...secure,NOATA_STAGING_SERVICE_ROLE_KEY:'sb_secret_test_fixture'},['--apply']),/attribution/);
 assert.equal(requireProvisionAuthorization({...secure,NOATA_STAGING_SERVICE_ROLE_KEY:'sb_secret_test_fixture',NOATA_STAGING_ADMIN_KEY_REF:STAGING_REF},['--apply']),true);
});
