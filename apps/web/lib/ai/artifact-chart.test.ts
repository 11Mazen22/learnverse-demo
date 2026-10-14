import test from "node:test";
import assert from "node:assert/strict";
import {findActualLineChart} from "./artifact-chart.ts";
test("Chart PDF references only real validated observations, not a fabricated plot",()=>{
 const factual="| Time | Temperature |\n|---|---|\n| 9:00 | 22 |\n| 10:00 | 25 |";
 const chart=findActualLineChart(factual);
 assert.equal(chart?.type,"line_chart");
 assert.deepEqual(chart?.points.map(x=>x.value),[22,25]);
 assert.equal(findActualLineChart("The weather was nice."),null);
 assert.equal(findActualLineChart("| Time | Temperature |\n|---|---|\n| 9:00 | unknown |\n| 10:00 | 25 |"),null);
});
