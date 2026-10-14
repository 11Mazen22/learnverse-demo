import test from "node:test";
import assert from "node:assert/strict";
import {isArtifactRefusal} from "./artifact-response-guard.ts";
test("The observed indirect file-capability refusal cannot be an Office deliverable",()=>{
 assert.equal(isArtifactRefusal("Unfortunately, I am unable to directly create PDF, PowerPoint, or Excel files at this time."),true);
 assert.equal(isArtifactRefusal("# Photosynthesis\nPlants convert light energy into chemical energy."),false);
});
