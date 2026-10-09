import test from "node:test";
import assert from "node:assert/strict";
import {COACH_ROUTES,coachForRoute,validatedCoachPrompt} from "./contextual-coach.ts";
test("each core route has three unique, editable, appropriately long guidance prompts",()=>{
  assert.ok(COACH_ROUTES.length>=14);
  for(const route of COACH_ROUTES){
    const ctx=coachForRoute(route);
    assert.ok(ctx.heading&&ctx.intro,route);
    assert.equal(ctx.actions.length,3,route);
    assert.equal(new Set(ctx.actions.map(a=>a.id)).size,3,route);
    for(const a of ctx.actions){
      assert.ok(a.description && a.label,route);
      assert.equal(validatedCoachPrompt(a.prompt),a.prompt,route+":"+a.id);
      assert.equal(/https?:\/\/|sk_live_|service_role/i.test(a.prompt),false);
    }
  }
});
test("lesson routes and unknown routes have bounded safe fallback",()=>{
  assert.equal(coachForRoute("/lesson/123").heading,"معلّم الدرس");
  assert.equal(coachForRoute("/whatever").heading,coachForRoute("/help").heading);
  assert.equal(coachForRoute("/auth/forgot-password").heading,coachForRoute("/help").heading);
});
test("rejects malformed requests without changing user intent",()=>{
  assert.equal(validatedCoachPrompt("          "),null);
  assert.equal(validatedCoachPrompt("x".repeat(1801)),null);
  assert.equal(validatedCoachPrompt("مرحبا\u0000 تجربة طلب واضح"),"مرحبا  تجربة طلب واضح");
});
