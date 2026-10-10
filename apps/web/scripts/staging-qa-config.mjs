// Noata's staging QA is a physically separate Supabase Auth project.
// Keep *all* validation here so the provisioning utility is testable offline.
export const STAGING_REF="vpfpjvhafkmygetjkfcp";
export const STAGING_URL="https://"+STAGING_REF+".supabase.co";
export const QA_SCOPE="staging-v1";
export const ROLES=Object.freeze(["student","teacher","admin"]);
const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function qaPlan(env){
  if(env.AURA_STAGING_DB_REF!==STAGING_REF)
    throw Error("Refusing to provision outside the explicitly authorized staging project");
  const domain=String(env.NOATA_QA_EMAIL_DOMAIN??"").trim().toLowerCase();
  if(!domain||domain.endsWith(".invalid")||domain.includes("@")||!validEmail.test("qa@"+domain))
    throw Error("A verified, owner-controlled QA mail domain must be provided privately");
  const entries=ROLES.map(role=>{
    const upper=role.toUpperCase();
    const email=String(env["NOATA_QA_"+upper+"_EMAIL"]??"").trim().toLowerCase();
    const password=String(env["NOATA_QA_"+upper+"_PASSWORD"]??"");
    if(!validEmail.test(email)||email.split("@").at(-1)!==domain)
      throw Error("Missing QA email in the verified QA domain for "+role);
    if(password.length<18||password.length>128||
      !/[A-Z]/.test(password)||!/[a-z]/.test(password)||
      !/[0-9]/.test(password)||!/[^A-Za-z0-9]/.test(password))
      throw Error("Each QA account requires an independent 18+ character strong password in the secure environment");
    return {role,email,password};
  });
  if(new Set(entries.map(x=>x.email)).size!==entries.length)
    throw Error("QA role emails must be distinct");
  if(new Set(entries.map(x=>x.password)).size!==entries.length)
    throw Error("QA role passwords must be distinct");
  return entries;
}
export function requireProvisionAuthorization(env,args){
  if(!args.includes("--apply"))return false;
  if(args.some(x=>x!=="--apply"))throw Error("Unknown command argument");
  if(env.NOATA_QA_ENABLE_PROVISION!=="YES"||
     env.NOATA_QA_CONTROLLED_EMAILS!=="YES"||
     env.AURA_STAGING_DB_REF!==STAGING_REF)
    throw Error("The staged account creation guard has not been explicitly authorized");
  if(!env.NOATA_STAGING_SERVICE_ROLE_KEY||!env.NOATA_STAGING_PUBLISHABLE_KEY)
    throw Error("Missing staging-only Supabase credentials in the protected environment");
  const adminKey=env.NOATA_STAGING_SERVICE_ROLE_KEY;
  if(adminKey.startsWith('sb_secret_')) {
    // Opaque keys have no decodable project claim. Require owner-provided
    // attribution before the existing real Auth Admin preflight is allowed.
    if(env.NOATA_STAGING_ADMIN_KEY_REF!==STAGING_REF)
      throw Error("Opaque Auth Admin key requires explicit staging project attribution");
  } else {
    let claims;
    try {
      const parts=adminKey.split('.');
      if(parts.length!==3||!parts.every(p=>/^[A-Za-z0-9_-]+$/.test(p)))throw Error();
      claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));
    } catch { throw Error("Invalid staging Auth Admin credential format"); }
    if(claims.role!=='service_role'||claims.ref!==STAGING_REF)
      throw Error("Auth Admin credential belongs to an unauthorized project or role");
    // Claims are attribution only; the actual server verifies the signature
    // and administrative permission before any account writes.
  }
  if(env.NOATA_STAGING_ORIGIN &&
     env.NOATA_STAGING_ORIGIN!=="https://noata-git-noata-aura-platform-overhaul-20261008-noata.vercel.app")
    throw Error("Refusing a noncanonical preview origin");
  return true;
}
