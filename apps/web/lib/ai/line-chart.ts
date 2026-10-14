import {xyChartPdfMarkup,type XyChart} from "./xy-chart.ts";
import type {ResponseUi} from "../../../../supabase/functions/noata-ai/response-ui.ts";
export type LineChartData=Extract<ResponseUi,{type:"line_chart"}>;
export type ActualChartData=LineChartData|XyChart;
export const CHART_WIDTH=720,CHART_HEIGHT=350;
const xml=(v:string)=>v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
export function lineChartGeometry(data:LineChartData){
 const values=data.points.map(p=>p.value);
 const rawMin=Math.min(...values),rawMax=Math.max(...values);
 const buffer=(rawMax-rawMin||Math.max(1,Math.abs(rawMax)*0.1))*0.18;
 const min=rawMin-buffer,max=rawMax+buffer;
 const left=74,top=40,width=CHART_WIDTH-107,height=CHART_HEIGHT-110;
 const numeric=data.points.every(p=>/^[-+]?\d+(?:\.\d+)?$/.test(p.label.trim()))?data.points.map(p=>Number(p.label)):data.points.every(p=>/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(p.label))?data.points.map(p=>{const [h,m]=p.label.split(":").map(Number);return h*60+m;}):null;
 const xmin=numeric?Math.min(...numeric):0,xmax=numeric?Math.max(...numeric):data.points.length-1;
 const points=data.points.map((point,i)=>({
  ...point,x:left+(numeric?(xmax===xmin ? 0.5 :(numeric[i]-xmin)/(xmax-xmin)):i/(data.points.length-1))*width,
  y:top+(max-point.value)/(max-min)*height
 }));
 return {left,top,width,height,min,max,points,path:points.map((point,i)=>(i?"L":"M")+point.x.toFixed(2)+" "+point.y.toFixed(2)).join(" ")};
}
/** Static SVG is built solely from validated points and XML-escaped strings. */
export function chartPdfMarkup(data:ActualChartData,documentTitle?:string):string{
 if(data.type==="xy_chart")return xyChartPdfMarkup(data,data.title===documentTitle);
 const g=lineChartGeometry(data),baseline=g.top+g.height;
 const grid=Array.from({length:5},(_,i)=>{
  const y=g.top+i*g.height/4,value=g.max-i*(g.max-g.min)/4;
  return '<line x1="'+g.left+'" y1="'+y+'" x2="'+(g.left+g.width)+'" y2="'+y+'" stroke="#dce5f1"/>'+
  '<text x="'+(g.left-9)+'" y="'+(y+4)+'" text-anchor="end" font-size="12" fill="#536a84">'+Number(value.toFixed(2))+'</text>';
 }).join("");
 const tick=Math.max(1,Math.ceil(data.points.length/7));
 const labels=g.points.map((point,i)=>i%tick===0||i===g.points.length-1?
  '<text x="'+point.x+'" y="'+(baseline+24)+'" text-anchor="middle" font-size="12" fill="#536a84">'+xml(point.label)+'</text>':"").join("");
 const dots=g.points.map(point=>'<circle cx="'+point.x+'" cy="'+point.y+'" r="4" fill="#146ec1" stroke="#fff" stroke-width="2"/>').join("");
 const table='<table class="noata-chart-table"><thead><tr><th>'+xml(data.xLabel)+'</th><th>'+xml(data.yLabel)+'</th></tr></thead><tbody>'+
  data.points.map(point=>'<tr><td>'+xml(point.label)+'</td><td>'+point.value+'</td></tr>').join("")+'</tbody></table>';
 return '<section class="noata-chart-report" style="break-inside:avoid">'+(data.title===documentTitle?"":'<h2>'+xml(data.title)+'</h2>')+
 '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+CHART_WIDTH+' '+CHART_HEIGHT+'" style="width:100%;height:auto;max-width:720px" role="img">'+
 grid+labels+'<path d="'+g.path+'" stroke="#146ec1" fill="none" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>'+dots+'</svg>'+
 '<p style="font-size:9pt;color:#526d87">'+xml(data.xLabel)+' · '+xml(data.yLabel)+'</p></section>'+
 '<h2>Data / البيانات</h2>'+table;
}
