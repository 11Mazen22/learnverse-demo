import {createServerClient} from "@supabase/ssr";
import {NextResponse,type NextRequest} from "next/server";
import {supabaseSdkConfiguration,supabaseFetch,supabaseConfiguration} from "./config";

export async function updateSession(request:NextRequest){
  let response=NextResponse.next({request});

  if (supabaseConfiguration.error) return response;
  const supabase=createServerClient(
    supabaseSdkConfiguration.url,
    supabaseSdkConfiguration.key,
    {
      global: { fetch: supabaseFetch },
      cookies:{
        getAll(){return request.cookies.getAll();},
        setAll(cookiesToSet){
          cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value));
          response=NextResponse.next({request});
          cookiesToSet.forEach(({name,value,options})=>response.cookies.set(name,value,options));
        }
      }
    }
  );

  await supabase.auth.getClaims();
  return response;
}
