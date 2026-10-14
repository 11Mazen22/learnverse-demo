/** Explicit selection keeps long originals out of a bounded model request. */
export type DocumentSection={label:string;start:number;end:number;level:number};
export type ScopedRevision={document:string;before:string;start:number;end:number;label:string;level:number};
export function documentSections(source:string):DocumentSection[]{
 const headings:{label:string;start:number;level:number}[]=[];let position=0,fence:{character:string;length:number}|null=null;
 for(const line of source.split(/(?<=\n)/)){
  const text=line.replace(/\r?\n$/,""),marker=text.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  if(marker){if(!fence)fence={character:marker[1][0],length:marker[1].length};else if(marker[1][0]===fence.character&&marker[1].length>=fence.length&&!marker[2].trim())fence=null;}
  else if(!fence){const heading=text.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);if(heading)headings.push({label:heading[2].slice(0,120),start:position,level:heading[1].length});}
  position+=line.length;
 }
 return headings.map((h,i)=>({...h,end:headings.slice(i+1).find(next=>next.level<=h.level)?.start??source.length}));
}
export function scopedRevision(document:string,section:DocumentSection):ScopedRevision{
 if(!Number.isInteger(section.level)||section.level<1||section.level>3||document.length>150000||!Number.isInteger(section.start)||!Number.isInteger(section.end)||section.start<0||section.end<=section.start||section.end>document.length)throw Error("invalid_revision_scope");
 const before=document.slice(section.start,section.end);
 if(before.length>14000||before.trim().length<20)throw Error("revision_section_limit");
 return {...section,document,before};
}
export function mergeScopedRevision(scope:ScopedRevision,replacement:string):string{
 if(!Number.isInteger(scope.level)||scope.level<1||scope.level>3||scope.document.length>150000||!Number.isInteger(scope.start)||!Number.isInteger(scope.end)||scope.start<0||scope.end<=scope.start||scope.end>scope.document.length||
    scope.document.slice(scope.start,scope.end)!==scope.before)throw Error("stale_revision_scope");
 const edited=replacement.trim();
 if(edited.length<20||edited.length>30000)throw Error("invalid_revision_section");
 // Preserve document hierarchy. Do not insert a new document title above a
 // selected subsection, or unexpectedly lift its descendants out of the section.
 const first=edited.match(/^(#{1,3})\s+/);
 if(!first||first[1].length!==scope.level||documentSections(edited).some(s=>s.level<scope.level))throw Error("revision_section_heading");
 const suffix=scope.before.match(/\r?\n\s*$/)?.[0]??"\n\n";
 const combined=scope.document.slice(0,scope.start)+edited+suffix+scope.document.slice(scope.end);
 if(combined.length>150000)throw Error("revision_document_limit");
 return combined;
}
