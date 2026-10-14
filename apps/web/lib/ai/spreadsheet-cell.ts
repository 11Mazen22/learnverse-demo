/** Small spreadsheet formula contract. No arbitrary functions, external links or code. */
export type SheetData={name:string;rows:string[][]};
export function spreadsheetCell(raw:string):string{
 let value=raw.trim();
 for(const marker of ["**","__","`"]){
  if(value.startsWith(marker)&&value.endsWith(marker)&&value.length>marker.length*2)value=value.slice(marker.length,-marker.length).trim();
 }
 return value;
}
const numeric=(v:string)=>/^[-+]?\d{1,12}(?:\.\d{1,8})?$/.test(spreadsheetCell(v))?Number(spreadsheetCell(v)):null;
export function workbookFormula(text:string,sheets:readonly SheetData[],current:number,row:number,column:number):{formula:string;cached:number|null}|null{
 const value=spreadsheetCell(text);
 const match=/^=(SUM|AVERAGE|MIN|MAX|COUNT)\((?:(?:'((?:[^']|'')+)'|([A-Za-z0-9_\u0600-\u06ff -]{1,31}))!)?([A-Z])([1-9]\d{0,2}):([A-Z])([1-9]\d{0,2})\)$/i.exec(value);
 if(!match)return null;
 const [,,quoted,bare,startColumn,startRow,endColumn,endRow]=match;
 const c1=startColumn.toUpperCase().charCodeAt(0)-65,c2=endColumn.toUpperCase().charCodeAt(0)-65,r1=Number(startRow)-1,r2=Number(endRow)-1;
 if(c2<c1||r2<r1||r2-r1>999)throw Error("Invalid spreadsheet formula range");
 const values=(sheet:SheetData)=>{
  const data:number[]=[];
  for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++){const v=numeric(sheet.rows[r]?.[c]??"");if(v!==null)data.push(v);}
  return data;
 };
 const name=(quoted??bare)?.replace(/''/g,"'");
 let target=name?sheets.findIndex(s=>s.name.toLowerCase()===name.toLowerCase()):current;
 if(target<0)throw Error("Formula references an unknown worksheet");
 // The observed generated Summary used unqualified ranges over its own formula
 // cells. Resolve only a unique other sheet containing actual numeric source data.
 if(!name&&/^(?:summary|ملخص)$/i.test(sheets[current].name)&&values(sheets[current]).length===0){
  const candidates=sheets.map((s,i)=>({i,values:values(s)})).filter(v=>v.i!==current&&v.values.length>0);
  if(candidates.length===1)target=candidates[0].i;
 }
 if(target===current&&row>=r1&&row<=r2&&column>=c1&&column<=c2)throw Error("Circular spreadsheet formula");
 const data=values(sheets[target]),operation=match[1].toUpperCase();
 const cached=operation==="COUNT"?data.length:operation==="SUM"?data.reduce((a,b)=>a+b,0):
  !data.length?null:operation==="AVERAGE"?data.reduce((a,b)=>a+b,0)/data.length:
  operation==="MIN"?Math.min(...data):Math.max(...data);
 const qualifier=target===current&&!name?"":"'"+sheets[target].name.replace(/'/g,"''")+"'!";
 return{formula:operation+"("+qualifier+startColumn.toUpperCase()+startRow+":"+endColumn.toUpperCase()+endRow+")",cached};
}
