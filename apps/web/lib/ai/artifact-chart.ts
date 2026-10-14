import {quadraticChartData} from "./xy-chart.ts";
/** Only existing validated chart observations may be exported as graph PDFs. */
import {interactiveResponseSegments,type ResponseUi} from "../../../../supabase/functions/noata-ai/response-ui.ts";
export function findActualLineChart(answer:string):Extract<ResponseUi,{type:"line_chart"|"xy_chart"}>|null{
 const parts=interactiveResponseSegments(answer,false);
 const found=parts.find(x=>x.type==="interactive"&&(x.data.type==="line_chart"||x.data.type==="xy_chart"));
 const quadratic=parts.find(x=>x.type==="interactive"&&x.data.type==="quadratic");
 if(!found&&quadratic?.type==="interactive"&&quadratic.data.type==="quadratic")return quadraticChartData(quadratic.data.a,quadratic.data.b,quadratic.data.c,quadratic.data.title);
 return found?.type==="interactive"&&(found.data.type==="line_chart"||found.data.type==="xy_chart")?found.data:null;
}

export function findActualCharts(answer:string):Extract<ResponseUi,{type:"line_chart"|"xy_chart"}>[]{
 return interactiveResponseSegments(answer,false).flatMap(part=>{
  if(part.type!=="interactive")return [];
  if(part.data.type==="line_chart"||part.data.type==="xy_chart")return [part.data];
  if(part.data.type==="quadratic")return [quadraticChartData(part.data.a,part.data.b,part.data.c,part.data.title)];
  return [];
 }).slice(0,6);
}
export function retainChartSource(source:string,answer:string):string{
 const present=new Set(findActualCharts(source).map(chart=>JSON.stringify(chart)));
 const fence=String.fromCharCode(96).repeat(3);
 const charts=findActualCharts(answer).filter(chart=>!present.has(JSON.stringify(chart)));
 return source+charts.map(chart=>"\n\n"+fence+"noata-ui\n"+JSON.stringify(chart)+"\n"+fence).join("");
}
