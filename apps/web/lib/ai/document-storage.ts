export const DOCUMENT_BUCKET = "noata-documents";
export const DOCUMENT_RETENTION_DAYS = 30;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const formats:Record<string,{mime:string;max:number}>={
  pdf:{mime:"application/pdf",max:8*1024*1024},
  docx:{mime:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",max:6*1024*1024},
  txt:{mime:"text/plain",max:512*1024},md:{mime:"text/markdown",max:512*1024},markdown:{mime:"text/markdown",max:512*1024},
  csv:{mime:"text/csv",max:512*1024},json:{mime:"application/json",max:512*1024},
};
export function documentFormat(name:string){return formats[name.split(".").at(-1)?.toLowerCase() ?? ""] ?? null;}
export function documentPath(userId:string,conversationId:string,id:string,name:string) {
  if(![userId,conversationId,id].every(x=>UUID.test(x)) || !documentFormat(name)) throw new Error("Invalid document path");
  return `${userId}/${conversationId}/${id}.${name.split(".").at(-1)!.toLowerCase()}`;
}
export function isOwnerDocumentPath(path:string,userId:string){
  const parts=path.split("/");return parts.length===3 && parts[0]===userId && UUID.test(parts[1]) && UUID.test(parts[2].split(".")[0]) && !!documentFormat(parts[2]);
}
export function validDocumentBytes(name:string,bytes:Uint8Array){
  const format=documentFormat(name);if(!format || bytes.length<1 || bytes.length>format.max)return false;
  if(format.mime==="application/pdf")return new TextDecoder().decode(bytes.slice(0,5))==="%PDF-";
  if(name.toLowerCase().endsWith(".docx"))return bytes[0]===0x50 && bytes[1]===0x4b && bytes[2]===3 && bytes[3]===4;
  try {const text=new TextDecoder("utf-8",{fatal:true}).decode(bytes);return !text.includes("\0");}catch{return false;}
}
