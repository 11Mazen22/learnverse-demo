#!/usr/bin/env node
/**
 * Provisions and then signs into three *dedicated* Staging QA identities.
 * It will not modify preexisting real users or write any password to disk.
 *
 * Safety: --apply plus explicit flags and a staging-scoped admin credential.
 * Set all env values in a private, approved secret store; NEVER commit .env.
 *
 * AURA_STAGING_DB_REF, NOATA_STAGING_SERVICE_ROLE_KEY,
 * NOATA_STAGING_PUBLISHABLE_KEY, NOATA_QA_EMAIL_DOMAIN,
 * NOATA_QA_STUDENT_EMAIL/PASSWORD, NOATA_QA_TEACHER_EMAIL/PASSWORD,
 * NOATA_QA_ADMIN_EMAIL/PASSWORD, NOATA_QA_CONTROLLED_EMAILS=YES,
 * NOATA_QA_ENABLE_PROVISION=YES.
 *
 * No privileges are inferred from user_metadata or Google profile fields.
 */
import {createClient} from "@supabase/supabase-js";
import {STAGING_URL,QA_SCOPE,qaPlan,requireProvisionAuthorization} from "./staging-qa-config.mjs";
function fail(reason){throw Error("Staging QA provisioning stopped: "+reason);}
async function existingByEmail(admin,email){
  // Only ever match operator-provided addresses; do not log any users.
  for(let page=1;page<=20;page++){
    const {data,error}=await admin.auth.admin.listUsers({page,perPage:100});
    if(error)fail("Auth Admin user lookup rejected");
    const users=data?.users??[];
    const match=users.find(x=>x.email?.toLowerCase()===email);
    if(match)return match;
    if(users.length<100)return null;
  }
  fail("Account search exceeded safe page limit");
}
async function provision(admin,item){
  let user=await existingByEmail(admin,item.email);
  if(user){
    if(user.app_metadata?.noata_qa_scope!==QA_SCOPE ||
       user.app_metadata?.noata_qa_role!==item.role)
      fail("An email already belongs to a non-QA or differently scoped user; no role changed");
  }else{
    const {data,error}=await admin.auth.admin.createUser({
      email:item.email,password:item.password,email_confirm:true,
      app_metadata:{noata_qa_scope:QA_SCOPE,noata_qa_role:item.role},
      user_metadata:{display_name:"Noata QA "+item.role}
    });
    if(error||!data?.user)fail("Auth Admin could not create dedicated "+item.role+" QA account");
    user=data.user;
  }
  const {data:profile,error:readError}=await admin.from("profiles")
    .select("id,role").eq("id",user.id).single();
  if(readError||!profile)fail("Profile trigger has not produced "+item.role+" QA profile");
  if(profile.role!==item.role){
    // The user was freshly created or is already tagged as a dedicated
    // Staging QA identity. Never elevate another account.
    const {data:updated,error}=await admin.from("profiles")
      .update({role:item.role}).eq("id",user.id).select("role").single();
    if(error||updated?.role!==item.role)fail("Could not confirm "+item.role+" QA role");
  }
  const {data:verify,error:verifyError}=await admin.auth.admin.getUserById(user.id);
  if(verifyError||verify?.user?.app_metadata?.noata_qa_scope!==QA_SCOPE)
    fail("Auth Admin could not confirm dedicated staging QA marker");
  return user.id;
}
async function checkLogin(publishable,item,expectedId){
  const client=createClient(STAGING_URL,publishable,{
    auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}
  });
  try{
    const {data,error}=await client.auth.signInWithPassword({
      email:item.email,password:item.password
    });
    if(error||data?.user?.id!==expectedId||!data.session)
      fail("Actual "+item.role+" sign-in failed on Staging Auth");
    const {data:profile,error:roleError}=await client.from("profiles")
      .select("role").eq("id",expectedId).single();
    if(roleError||profile?.role!==item.role)
      fail("Actual "+item.role+" profile role check failed");
  }finally{
    await client.auth.signOut({scope:"local"}).catch(()=>{});
  }
}
async function main(argv=process.argv.slice(2),env=process.env){
  if(!requireProvisionAuthorization(env,argv)){
    console.log("Staging QA dry run: no writes. Exactly three distinct owned QA emails and 18+ character passwords are required via protected environment.");
    return;
  }
  const plan=qaPlan(env);
  const admin=createClient(STAGING_URL,env.NOATA_STAGING_SERVICE_ROLE_KEY,{
    auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}
  });
  // Validate privileges against the actual target *before* any account writes.
  const {error:preflight}=await admin.auth.admin.listUsers({page:1,perPage:1});
  if(preflight)fail("Service credential is not authorized for the explicit Staging project");
  for(const item of plan){
    const id=await provision(admin,item);
    await checkLogin(env.NOATA_STAGING_PUBLISHABLE_KEY,item,id);
    console.log("PASS staging "+item.role+": real Auth password sign-in and server-owned profile role");
  }
  console.log("QA account bootstrap complete: 3 tested identities, Staging only. Teacher/Admin feature journeys require separate browser E2E tests.");
}
main().catch(()=>{console.error("Staging QA bootstrap failed. Review private credential configuration and the protected execution log. No credentials were printed.");process.exitCode=1;});
