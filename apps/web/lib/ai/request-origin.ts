/** Next may normalize request.url to localhost behind a proxy; Host retains the browser's target. */
export function isSameOriginMutation(request:Request){
 try{
  const origin=new URL(request.headers.get("origin")??"");
  const target=new URL(request.url);
  const host=request.headers.get("host")??target.host;
  const protocol=request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? target.protocol.slice(0,-1);
  return !origin.username && !origin.password && origin.host===host && origin.protocol===protocol+":" && (protocol==="http"||protocol==="https");
 }catch{return false;}
}
