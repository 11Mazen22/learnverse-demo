import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";

export const isSupabaseConfigured=Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export async function createClient(){
  const cookieStore=await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL??"https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"noata-not-configured",
    {
      cookies:{
        getAll(){return cookieStore.getAll();},
        setAll(cookiesToSet){
          try{cookiesToSet.forEach(({name,value,options})=>cookieStore.set(name,value,options));}
          catch{}
        }
      }
    }
  );
}
