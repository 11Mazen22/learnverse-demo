/** Exact, bounded spreadsheet statistics. No AI arithmetic and no formula execution. */
export type NumericColumnStats={label:string;count:number;minimum:number;maximum:number;mean:number;sum:number};
export function workbookNumericStatistics(rows:readonly (readonly string[])[],limit=8):NumericColumnStats[]{
 if(rows.length<3)return [];
 const width=Math.min(14,rows[0].length);
 const stats:NumericColumnStats[]=[];
 for(let column=0;column<width&&stats.length<limit;column++){
  const values:number[]=[];
  for(const row of rows.slice(1,181)){
   const cell=(row[column]??"").trim();
   if(!/^[+-]?\d{1,12}(?:\.\d{1,6})?$/.test(cell))continue;
   const n=Number(cell);
   if(Number.isFinite(n)&&Math.abs(n)<=1e12)values.push(n);
  }
  if(values.length<2)continue;
  const sum=values.reduce((a,b)=>a+b,0);
  if(!Number.isFinite(sum))continue;
  const label=(rows[0][column]||"Column "+(column+1)).replace(/[<>|\r\n]/g," ").slice(0,90);
  const rounded=(n:number)=>Number(n.toFixed(4));
  stats.push({label,count:values.length,minimum:Math.min(...values),maximum:Math.max(...values),
   sum:rounded(sum),mean:rounded(sum/values.length)});
 }
 return stats;
}
