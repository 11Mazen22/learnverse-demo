import test from "node:test";
import assert from "node:assert/strict";
import {planNoataRequest} from "./capability-planner.ts";
const opts={mode:"send" as const,temporary:false,hasUploads:false};
test("One assistant plans real image, file, research and chat paths",()=>{
 assert.deepEqual(planNoataRequest("Draw a red fox",opts),{kind:"image",provider:"fanar"});
 assert.deepEqual(planNoataRequest("Make a PDF for that",opts),{kind:"artifact",intent:{kind:"pdf",usePrevious:true}});
 assert.deepEqual(planNoataRequest("اصنع ملف بوربوينت عن العلوم",opts),{kind:"artifact",intent:{kind:"pptx",usePrevious:false}});
 assert.equal(planNoataRequest("look up current lunar research",opts).kind,"research");
 assert.equal(planNoataRequest("Please explain gravity",opts).kind,"chat");
 assert.equal(planNoataRequest("Can you make PDF?",opts).kind,"chat");
});
test("Safe boundaries prevent silent side effects in temporary/upload/retry",()=>{
 assert.equal(planNoataRequest("Draw a dog",{...opts,temporary:true}).kind,"chat");
 assert.equal(planNoataRequest("Make a PDF",{...opts,hasUploads:true}).kind,"chat");
 assert.equal(planNoataRequest("Generate image",{...opts,mode:"retry"}).kind,"chat");
 assert.equal(planNoataRequest("Draw a dog",{...opts,explicitTool:"translate"}).kind,"chat");
 assert.equal(planNoataRequest("Create a vector SVG icon",{...opts}).kind,"chat");
});

test("Creative Studio document improvement wins over mentions of images within document content",()=>{
 const request="Improve and recreate this document as a PDF file.\n\nVerified extracted original document content:\nCreate a picture and an Excel document for students";
 assert.equal(planNoataRequest(request,{mode:"send",temporary:false,hasUploads:false}).kind,"artifact");
});
