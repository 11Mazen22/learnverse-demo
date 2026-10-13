/** Bounded server queries. Search is never evaluated only against the first page. */
export const LIBRARY_PAGE_SIZE=24;
export const LIBRARY_COLUMNS={
 projects:"id,user_id,name,instructions,created_at,updated_at",
 artifacts:"id,user_id,project_id,filename,mime_type,storage_path,byte_size,created_at,version,parent_artifact_id,source_document_id",
 documents:"id,name,storage_path,mime_type,size_bytes,created_at,expires_at,library_saved",
 media:"id,filename,storage_path,mime_type,size_bytes,created_at,library_saved"
} as const;
export function librarySearchPattern(query:string):string{
 return "%"+query.normalize("NFKC").trim().slice(0,120).replace(/[\\%_]/g,"\\$&")+"%";
}
export function libraryPage(page:number):{from:number;to:number}{
 if(!Number.isSafeInteger(page)||page<0||page>100000)throw Error("invalid_library_page");
 return {from:page*LIBRARY_PAGE_SIZE,to:(page+1)*LIBRARY_PAGE_SIZE-1};
}
export function mergeLibraryPage<T extends {id:string}>(old:T[],next:T[],replace=false):T[]{
 return [...new Map((replace?next:[...old,...next]).map(row=>[row.id,row])).values()];
}
