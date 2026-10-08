type PdfTextItem = {str:string;transform:number[];dir?:string};
/** Chromium/Skia may encode shaped Arabic as individual presentation-form glyphs. */
export function reconstructPdfLine(items:readonly PdfTextItem[]):string {
  const shaped=items.filter(x=>/[\ufb50-\ufdff\ufe70-\ufeff]/.test(x.str));
  if(shaped.length>2 && shaped.every(x=>[...x.str].length<=2)) {
    const physical=items.map(x=>x.str).join("");
    return physical.replace(/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff\s]+/g,
      run=>/[\ufb50-\ufdff\ufe70-\ufeff]/.test(run)?[...run].reverse().join(""):run).normalize("NFKC").trim();
  }
  return items.map(x=>x.str).join(" ").normalize("NFKC").trim();
}
export function pdfTextLines(raw: readonly unknown[]):string[] {
  const lines:string[]=[];let items:PdfTextItem[]=[];let prevY:number|null=null;
  for(const value of raw) {
    if(!value || typeof value!=="object" || !("str" in value) || !("transform" in value))continue;
    const item=value as PdfTextItem;
    const y=item.transform[5]??0;
    const diacritic=/^[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]+$/.test(item.str);
    if(prevY!==null && Math.abs(prevY-y)>4 && !diacritic) {const text=reconstructPdfLine(items);if(text)lines.push(text);items=[];}
    items.push(item);if(!diacritic)prevY=y;
  }
  const last=reconstructPdfLine(items);if(last)lines.push(last);
  return lines;
}
