import type {ResponseUi} from "../../../../supabase/functions/noata-ai/response-ui.ts";
export type XyChart=Extract<ResponseUi,{type:"xy_chart"}>;
export const XY_WIDTH=660,XY_HEIGHT=400;
export const CHART_COLORS={blue:"#3478c6",red:"#c54b5e",green:"#27866c",purple:"#8263bd",amber:"#b87a24",teal:"#258d99"} as const;
export const CHART_DASH={solid:"",dashed:"10 6",dotted:"2 6"} as const;
export const chartNumber=(n:number)=>Number(n.toPrecision(4)).toString();
const xml=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
export function xyChartGeometry(data:XyChart){
 const all=data.series.flatMap(s=>s.points),xs=all.map(p=>p.x),ys=all.map(p=>p.y);
 const domain=(values:number[])=>{const min=Math.min(...values),max=Math.max(...values),pad=(max-min||Math.max(1,Math.abs(max)*.1))*.12;return {min:min-pad,max:max+pad};};
 const x=domain(xs),y=domain(ys),left=82,top=32,width=XY_WIDTH-114,height=XY_HEIGHT-106;
 const px=(n:number)=>left+(n-x.min)/(x.max-x.min)*width,py=(n:number)=>top+(y.max-n)/(y.max-y.min)*height;
 const series=data.series.map(s=>({...s,rendered:s.points.map(p=>({...p,px:px(p.x),py:py(p.y)})),path:s.points.map((p,i)=>(i?"L":"M")+px(p.x).toFixed(2)+" "+py(p.y).toFixed(2)).join(" ")}));
 return {x,y,left,top,width,height,px,py,series};
}
export function xyChartSvg(data:XyChart):string{
 const g=xyChartGeometry(data),base=g.top+g.height;
 const ticks=Array.from({length:5},(_,i)=>{const x=g.left+i*g.width/4,y=g.top+i*g.height/4;
 return '<line x1="'+x+'" y1="'+g.top+'" x2="'+x+'" y2="'+base+'" stroke="#dce3ec"/><line x1="'+g.left+'" y1="'+y+'" x2="'+(g.left+g.width)+'" y2="'+y+'" stroke="#dce3ec"/>'+
 '<text x="'+x+'" y="'+(base+25)+'" text-anchor="middle">'+chartNumber(g.x.min+i*(g.x.max-g.x.min)/4)+'</text><text x="'+(g.left-12)+'" y="'+(y+5)+'" text-anchor="end">'+chartNumber(g.y.max-i*(g.y.max-g.y.min)/4)+'</text>';}).join("");
 const marks=g.series.map(s=>{const color=CHART_COLORS[s.color],dash=CHART_DASH[s.dash];
 return (s.kind==="line"&&s.points.length>1?'<path d="'+s.path+'" fill="none" stroke="'+color+'" stroke-width="3" stroke-dasharray="'+dash+'" stroke-linejoin="round" stroke-linecap="round"/>':"")+
 s.rendered.map(p=>'<circle cx="'+p.px+'" cy="'+p.py+'" r="4" fill="'+color+'" stroke="#fff" stroke-width="1.5"/>').join("");}).join("");
 const legendHeight=data.series.length*23+14;
 const legend=data.series.map((s,i)=>'<line x1="82" y1="'+(XY_HEIGHT+i*23+9)+'" x2="111" y2="'+(XY_HEIGHT+i*23+9)+'" stroke="'+CHART_COLORS[s.color]+'" stroke-width="3" stroke-dasharray="'+CHART_DASH[s.dash]+'"/><text x="124" y="'+(XY_HEIGHT+i*23+14)+'" font-size="13">'+xml(s.name.length>64?s.name.slice(0,61)+"…":s.name)+'</text>').join("");
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+XY_WIDTH+' '+(XY_HEIGHT+legendHeight)+'" role="img" style="width:100%;height:auto;font-family:Noata,Cairo,Arial,sans-serif;font-size:14px;fill:#526576"><title>'+xml(data.title)+'</title><rect width="100%" height="100%" fill="#fff"/>'+ticks+marks+'<text x="'+(g.left+g.width/2)+'" y="'+(XY_HEIGHT-18)+'" text-anchor="middle">'+xml(data.xLabel)+'</text><text x="18" y="'+(g.top+g.height/2)+'" text-anchor="middle" transform="rotate(-90 18 '+(g.top+g.height/2)+')">'+xml(data.yLabel)+'</text>'+legend+'</svg>';
}
export function xyChartPdfMarkup(data:XyChart):string{
 return '<section class="noata-chart-report"><h2>'+xml(data.title)+'</h2>'+xyChartSvg(data)+
 '<p>'+data.series.map(s=>'<span style="color:'+CHART_COLORS[s.color]+'">'+xml(s.name)+' ('+s.dash+')</span>').join(" · ")+'</p>'+
 '<table><thead><tr><th>Series / السلسلة</th><th>'+xml(data.xLabel)+'</th><th>'+xml(data.yLabel)+'</th></tr></thead><tbody>'+
 data.series.flatMap(s=>s.points.map(p=>'<tr><td>'+xml(s.name)+'</td><td>'+p.x+'</td><td>'+p.y+'</td></tr>')).join("")+'</tbody></table></section>';
}

export function xyChartCsv(data:XyChart):string{
 const cell=(text:string)=>'"'+(/^[=+@-]/.test(text)?"'":"")+text.replace(/"/g,'""')+'"';
 return "\ufeff"+[["Series",data.xLabel,data.yLabel].map(cell).join(","),...data.series.flatMap(s=>s.points.map(p=>cell(s.name)+","+p.x+","+p.y))].join("\r\n");
}

export function quadraticChartData(a:number,b:number,c:number,title:string):XyChart{return {version:1,id:"quadratic_curve",type:"xy_chart",title,fallback:"y = "+a+"x² + ("+b+")x + ("+c+")",xLabel:"x",yLabel:"y",dataOrigin:"calculated",series:[{name:"y = "+a+"x² + ("+b+")x + ("+c+")",color:"blue",dash:"solid",kind:"line",points:Array.from({length:61},(_,i)=>{const x=-6+i*.2;return {x,y:a*x*x+b*x+c};})}]};}
