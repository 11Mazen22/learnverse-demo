import test from "node:test";import assert from "node:assert/strict";
import {validateResponseUi} from "../../../../supabase/functions/noata-ai/response-ui.ts";
import {xyChartGeometry,xyChartPdfMarkup,xyChartCsv,quadraticChartData,type XyChart} from "./xy-chart.ts";
const fixture:XyChart={version:1,id:"xy",title:"A <chart>",fallback:"Three supplied observations.",type:"xy_chart",xLabel:"Time (s)",yLabel:"Distance (m)",dataOrigin:"provided",series:[{name:"Object A",color:"red",dash:"dashed",kind:"line",points:[{x:0,y:0},{x:1,y:2},{x:10,y:5}]}]};
test("Numeric x values control spacing rather than evenly spaced categories",()=>{const g=xyChartGeometry(fixture);const p=g.series[0].rendered;assert.ok(Math.abs((p[1].px-p[0].px)/(p[2].px-p[0].px)-.1)<1e-8);assert.ok(g.x.min<0&&g.x.max>10);});
test("Charts validate bounded data, retain styles and escape exported text",()=>{assert.ok(validateResponseUi(fixture));const html=xyChartPdfMarkup(fixture);assert.ok(html.includes('stroke-dasharray="10 6"'));assert.ok(html.includes("A &lt;chart&gt;"));assert.ok(html.includes("<td>10</td><td>5</td>"));assert.equal(validateResponseUi({...fixture,series:[{...fixture.series[0],color:'url(https://evil.test)'}]}),null);assert.equal(validateResponseUi({...fixture,series:[{...fixture.series[0],points:[{x:Infinity,y:2}]}]}),null);});
test("Flat and negative domains always produce finite visible points",()=>{for(const points of [[{x:3,y:3},{x:3,y:3}],[{x:-8,y:-2},{x:-2,y:-9}]]){const g=xyChartGeometry({...fixture,series:[{...fixture.series[0],points}]});assert.ok(g.series[0].rendered.every(p=>Number.isFinite(p.px)&&Number.isFinite(p.py)&&p.px>=g.left&&p.px<=g.left+g.width&&p.py>=g.top&&p.py<=g.top+g.height));}});

test("Quadratics fit the whole displayed x domain and spreadsheet text cannot become a formula",()=>{const curve=quadraticChartData(20,20,20,"Full curve");assert.equal(curve.series[0].points.length,61);const g=xyChartGeometry(curve);assert.ok(g.series[0].rendered.every(p=>p.py>=g.top&&p.py<=g.top+g.height));const csv=xyChartCsv({...fixture,xLabel:"=malicious()",series:[{...fixture.series[0],name:"+dangerous"}]});assert.ok(csv.includes("'=malicious()"));assert.ok(csv.includes("'+dangerous"));});
import {findActualCharts,retainChartSource} from "./artifact-chart.ts";

test("Canonical source keeps validated chart values and styles for later PDF revisions",()=>{
 const fence=String.fromCharCode(96).repeat(3),answer=fence+"noata-ui\n"+JSON.stringify(fixture)+"\n"+fence;
 const saved=retainChartSource("# Report\n\nActual supplied measurements.",answer);
 const recovered=findActualCharts(saved);assert.equal(recovered.length,1);assert.deepEqual(recovered[0],fixture);
 assert.equal(retainChartSource(saved,answer),saved);
});

test("Compact chart geometry preserves numeric spacing and keeps all observations within bounds",()=>{const g=xyChartGeometry(fixture,{width:420,height:360,compact:true}),p=g.series[0].rendered;assert.equal(g.canvasWidth,420);assert.ok(g.left>=110);assert.ok(Math.abs((p[1].px-p[0].px)/(p[2].px-p[0].px)-.1)<1e-8);assert.ok(p.every(v=>v.px>=g.left&&v.px<=g.left+g.width&&v.py>=g.top&&v.py<=g.top+g.height));assert.ok(!xyChartPdfMarkup(fixture,true).includes("<h2>"));});
