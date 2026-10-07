import {NextResponse} from "next/server";

export const dynamic="force-dynamic";

export function GET(){
  return NextResponse.json({
    ok:true,
    service:"noata-web",
    version:"1",
    timestamp:new Date().toISOString()
  },{
    headers:{"Cache-Control":"no-store"}
  });
}
