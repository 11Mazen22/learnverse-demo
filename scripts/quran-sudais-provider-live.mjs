import assert from "node:assert/strict";

const editions=["ar.abdurrahmaansudais","ar.sudais"];
async function upstream(url,{method="GET",range=false}={}){
  const response=await fetch(url,{
    method,headers:range?{Range:"bytes=0-1023",Accept:"audio/mpeg"}:{Accept:"application/json"},
    signal:AbortSignal.timeout(15000),
    redirect:"error"
  });
  if(!response.ok)throw Error("upstream "+response.status);
  return response;
}
async function probeAudio(url){
  const u=new URL(url);
  if(u.protocol!=="https:"||u.username||u.password||
      !["cdn.islamic.network","api.alquran.cloud","alquran.api.islamic.network"].includes(u.hostname))
    throw Error("rejected untrusted media hostname");
  const r=await upstream(url,{range:true});
  const contentType=r.headers.get("content-type")??"";
  const reader=r.body?.getReader();
  const first=reader?await reader.read():{value:new Uint8Array()};
  await reader?.cancel();
  const bytes=first.value??new Uint8Array();
  const mp3=(bytes[0]===73&&bytes[1]===68&&bytes[2]===51) ||
    (bytes[0]===255&&(bytes[1]&0xe0)===0xe0);
  if(!/audio|mpeg|octet-stream/i.test(contentType)&&!mp3)
    throw Error("provider returned non-audio content");
  return {contentType,bytesRead:bytes.length,status:r.status};
}
let pass=false,failures=[];
for(const edition of editions){
  try{
    const r=await upstream("https://api.alquran.cloud/v1/surah/1/"+edition);
    const json=await r.json();
    assert.equal(json.code,200);
    assert.equal(json.data?.number,1);
    assert.equal(json.data?.ayahs?.length,7);
    if(typeof json.data?.edition?.identifier==="string")
      assert.equal(json.data.edition.identifier,edition);
    const ayah=json.data.ayahs[0];
    assert.equal(ayah.numberInSurah,1);
    assert.equal(ayah.number,1);
    assert.ok(typeof ayah.audio==="string","missing first Ayah audio");
    const media=await probeAudio(ayah.audio);
    console.log(JSON.stringify({status:"PASS",edition,surah:1,ayah:1,media}));
    pass=true;break;
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    failures.push({edition,error:message});
    console.warn(JSON.stringify({status:"FAILED_EDITION",edition,error:message}));
  }
}
if(!pass){
  console.error(JSON.stringify({status:"FAIL",reason:"No verified playable Sudais audio from either same-Sheikh edition",failures}));
  process.exitCode=1;
}
