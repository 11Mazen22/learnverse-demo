#!/usr/bin/env node
/**
 * Noata Aura staging-only Auth configuration.
 * Nothing executes remotely unless the operator explicitly passes --apply.
 * Secrets are read from process environment, never printed or written to Git.
 * Usage:
 *   node scripts/configure-noata-staging-auth.mjs
 *   NOATA_STAGING_MANAGEMENT_TOKEN=... node scripts/configure-noata-staging-auth.mjs --apply
 *   ... plus NOATA_GOOGLE_CLIENT_ID, NOATA_GOOGLE_CLIENT_SECRET, --with-google
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const APPROVED_STAGING_REF = "vpfpjvhafkmygetjkfcp";
export const STAGING_ORIGIN = "https://noata-git-noata-aura-platform-overhaul-20261008-noata.vercel.app";
const BASE = "https://api.supabase.com/v1/projects/" + APPROVED_STAGING_REF + "/config/auth";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const templateMap = Object.freeze({
  "confirm-signup": ["mailer_templates_confirmation_content", "mailer_subjects_confirmation", "Noata | تأكيد بريدك الإلكتروني"],
  "recovery": ["mailer_templates_recovery_content", "mailer_subjects_recovery", "Noata | استعادة كلمة المرور"],
  "invite": ["mailer_templates_invite_content", "mailer_subjects_invite", "Noata | دعوتك للانضمام"],
  "magic-link": ["mailer_templates_magic_link_content", "mailer_subjects_magic_link", "Noata | رابط الدخول الآمن"],
  "change-email": ["mailer_templates_email_change_content", "mailer_subjects_email_change", "Noata | تأكيد تغيير البريد"],
});

export function buildStagingPatch(existing, templates, { google = null, smtp = null } = {}) {
  if (!existing || typeof existing !== "object") throw Error("Missing staging config");
  const oldRedirects = typeof existing.uri_allow_list === "string"
    ? existing.uri_allow_list.split(",").map(x=>x.trim()).filter(Boolean) : [];
  const redirect = STAGING_ORIGIN + "/**";
  const allowList = [...new Set([...oldRedirects, redirect])].join(",");
  const body = { site_url: STAGING_ORIGIN, uri_allow_list: allowList, external_email_enabled: true };
  for (const [name, [key, subjectKey, subject]] of Object.entries(templateMap)) {
    const html = templates[name];
    if (typeof html !== "string" || html.length < 1500 || html.length > 12000
      || (html.match(/{{\s*\.ConfirmationURL\s*}}/g) || []).length !== 1)
      throw Error("Invalid or unsafe email template: " + name);
    body[key] = html;
    body[subjectKey] = subject;
  }
  if (google) {
    if (!google.id?.endsWith(".apps.googleusercontent.com") || !google.secret)
      throw Error("Both an official Google OAuth client ID and secret are required");
    body.external_google_enabled = true;
    body.external_google_client_id = google.id;
    body.external_google_secret = google.secret;
  }
  if (smtp) {
    for (const prop of ["host","port","user","pass","adminEmail","senderName"]) {
      if (!smtp[prop]) throw Error("Complete SMTP credentials are required; missing " + prop);
    }
    Object.assign(body,{
      smtp_host: smtp.host,
      smtp_port: String(smtp.port),
      smtp_user: smtp.user,
      smtp_pass: smtp.pass,
      smtp_admin_email: smtp.adminEmail,
      smtp_sender_name: smtp.senderName,
    });
  }
  return body;
}

export function templatesFromRepo() {
  const out = {};
  for (const name of Object.keys(templateMap)) {
    out[name] = readFileSync(resolve(root,"supabase/email-templates",name+".html"),"utf8");
  }
  return out;
}

async function callManagement(method, token, body) {
  const resp = await fetch(BASE, {
    method,
    headers: { Authorization: "Bearer " + token, Accept:"application/json", ...(body ? {"Content-Type":"application/json"} : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(25000),
  });
  if (!resp.ok) throw Error("Supabase staging Auth management returned HTTP " + resp.status + " (" + method + "). No secrets will be printed.");
  return resp.json();
}

export async function main(argv=process.argv.slice(2), env=process.env) {
  if (argv.some(x=>!["--apply","--with-google","--with-smtp"].includes(x))) throw Error("Unknown argument");
  const apply = argv.includes("--apply"),googleEnabled=argv.includes("--with-google"),smtpEnabled=argv.includes("--with-smtp");
  const google=googleEnabled ? {id:env.NOATA_GOOGLE_CLIENT_ID,secret:env.NOATA_GOOGLE_CLIENT_SECRET} : null;
  const smtp=smtpEnabled ? {
    host:env.NOATA_SMTP_HOST,port:env.NOATA_SMTP_PORT,user:env.NOATA_SMTP_USER,
    pass:env.NOATA_SMTP_PASS,adminEmail:env.NOATA_SMTP_FROM_EMAIL,senderName:env.NOATA_SMTP_FROM_NAME,
  } : null;
  // Validate all operator-supplied credentials and email markup locally first.
  const templates=templatesFromRepo();
  const sample=buildStagingPatch({uri_allow_list:""},templates,{google,smtp});
  const publicKeys=Object.keys(sample).filter(k=>!k.endsWith("_secret")&&!k.includes("smtp_pass"));
  console.log("STAGING ONLY:", APPROVED_STAGING_REF);
  console.log("Auth site:", STAGING_ORIGIN);
  console.log("Email templates:",Object.keys(templateMap).join(", "));
  console.log("Configure Google:",Boolean(googleEnabled),"Configure SMTP:",Boolean(smtpEnabled));
  console.log("Fields staged:", publicKeys.join(", "));
  if (!apply) {
    console.log("DRY RUN ONLY; nothing changed. Add --apply with credentials in a secure environment.");
    return;
  }
  const token=env.NOATA_STAGING_MANAGEMENT_TOKEN;
  if (!token) throw Error("NOATA_STAGING_MANAGEMENT_TOKEN is required in a secure environment");
  const existing=await callManagement("GET",token);
  const patch=buildStagingPatch(existing,templates,{google,smtp});
  // Never print patch or management response: both can contain credentials.
  await callManagement("PATCH",token,patch);
  const confirmed=await callManagement("GET",token);
  if (confirmed.site_url !== STAGING_ORIGIN || !String(confirmed.uri_allow_list||"").split(",").includes(STAGING_ORIGIN+"/**"))
    throw Error("Staging Auth patch returned success but URL verification did not pass");
  if (googleEnabled && confirmed.external_google_enabled !== true)
    throw Error("Google provider is still disabled in staging; verify OAuth credentials privately");
  console.log("Staging Auth config saved and site/redirect verified. Real end-to-end email/OAuth tests are still required.");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(e=>{ console.error("Staging setup failed:",e.message);process.exitCode=1; });
}
