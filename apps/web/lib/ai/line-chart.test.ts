import test from "node:test";
import assert from "node:assert/strict";
import {chartPdfMarkup,lineChartGeometry} from "./line-chart.ts";
import type {LineChartData} from "./line-chart.ts";
const data:LineChartData={version:1,id:"real-values",type:"line_chart",title:"Temperature & <humidity>",fallback:"Series with two observations",
 xLabel:"Hour",yLabel:"°C",points:[{label:"09:00",value:22},{label:"10:00",value:25}]};
test("time-series geometry is bounded even for constant and negative numbers",()=>{
 const a=lineChartGeometry(data);assert.equal(a.points.length,2);
 assert.ok(a.points.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)&&x.y>=0&&x.y<=350));
 const flat=lineChartGeometry({...data,points:[{label:"a",value:-2},{label:"b",value:-2}]});
 assert.ok(flat.points.every(x=>Number.isFinite(x.y)));
});
test("PDF chart renders vector path and factual data table without executable HTML",()=>{
 const result=chartPdfMarkup(data);
 assert.ok(result.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
 assert.ok(result.includes("Temperature &amp; &lt;humidity&gt;"));
 assert.ok(result.includes("09:00"));
 assert.ok(result.includes("<td>25</td>"));
 assert.ok(!result.includes("<humidity>"));
});

test("Irregular numeric and clock labels use their actual horizontal positions",()=>{for(const labels of [["0","1","10"],["09:00","10:00","19:00"]]){const g=lineChartGeometry({...data,points:labels.map((label,i)=>({label,value:i}))});assert.ok(Math.abs((g.points[1].x-g.points[0].x)/(g.points[2].x-g.points[0].x)-.1)<1e-8);}});
