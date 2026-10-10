/**
 * Synthetic client-contract regressions ONLY. Not real login, provider or RLS evidence.
 * Fake cookies are stripped from every loopback request before reaching Next.
 * Every Supabase request is intercepted; no real account or backend is accessed.
 */
function installFixture(origin) {
  const key = "sb-" + new URL(origin).hostname.split(".")[0] + "-auth-token";
  const persisted = JSON.parse(
    sessionStorage.getItem("noata-ci-fixture-account") || "null",
  );
  const state = {
    account: persisted || {
      role: "student",
      id: "00000000-0000-4000-8000-000000000001",
    },
    calls: [],
    denyMark: false,
    delayHistory: false,
    historyRelease: null,
    stream: null,
  };
  const encode = (text) =>
    btoa(unescape(encodeURIComponent(text)))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");
  const user = () => ({
    id: state.account.id,
    aud: "authenticated",
    role: "authenticated",
    email: "synthetic-ci@example.invalid",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  });
  const seed = () => {
    const u = user(),
      expiry = Math.floor(Date.now() / 1000) + 3600;
    const token =
      encode(JSON.stringify({ alg: "HS256", typ: "JWT" })) +
      "." +
      encode(
        JSON.stringify({
          sub: u.id,
          aud: "authenticated",
          role: "authenticated",
          exp: expiry,
        }),
      ) +
      ".c3ludGhldGljLWZpeHR1cmU";
    const session = {
      access_token: token,
      refresh_token: "SYNTHETIC-NOT-A-REAL-REFRESH-TOKEN",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: expiry,
      user: u,
    };
    document.cookie =
      key +
      "=base64-" +
      encode(JSON.stringify(session)) +
      "; path=/; SameSite=Lax";
    return session;
  };
  // Keep synthetic SSR-cookie state in JavaScript only: it is never a browser
  // network cookie and cannot reach the Next proxy or a real auth server.
  const nativeCookie = Object.getOwnPropertyDescriptor(
    Document.prototype,
    "cookie",
  );
  let privateCookie = "";
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get() {
      return [nativeCookie.get.call(document), privateCookie]
        .filter(Boolean)
        .join("; ");
    },
    set(value) {
      if (value.startsWith(key + "=")) {
        privateCookie = value.includes("Max-Age=0") ? "" : value.split(";")[0];
      } else nativeCookie.set.call(document, value);
    },
  });
  seed();
  const channel = new BroadcastChannel(key);
  window.__noataUiFixture = {
    state,
    switchAccount(role, id) {
      state.account = { role, id };
      sessionStorage.setItem(
        "noata-ci-fixture-account",
        JSON.stringify(state.account),
      );
      channel.postMessage({ event: "SIGNED_IN", session: seed() });
    },
    signOut() {
      document.cookie = key + "=; Max-Age=0; path=/";
      channel.postMessage({ event: "SIGNED_OUT", session: null });
    },
    releaseHistory() {
      state.historyRelease?.();
    },
    completeStream() {
      try {
        state.stream?.enqueue(
          new TextEncoder().encode(
            "data: " +
              JSON.stringify({
                content: "CI STALE PRIVATE RESULT",
                done: true,
              }) +
              "\n\n",
          ),
        );
        state.stream?.close();
      } catch {}
    },
  };
  const notices = [1, 2].map((i) => ({
    id: "00000000-0000-4000-8000-00000000000" + (i + 3),
    type: "assignment",
    title: "CI NOTICE " + i,
    body: "Synthetic notification contract fixture",
    href: "/assignments",
    read_at: null,
    created_at: "2026-10-01T12:00:00Z",
  }));
  const original = window.fetch;
  window.fetch = async (input, init = {}) => {
    const url = new URL(
      typeof input === "string" ? input : input.url,
      location.origin,
    );
    if (url.origin !== origin && !url.hostname.endsWith(".supabase.co"))
      return original(input, init);
    const method = (
      init.method || (input instanceof Request ? input.method : "GET")
    ).toUpperCase();
    const headers = new Headers(
      init.headers || (input instanceof Request ? input.headers : undefined),
    );
    const single = headers.get("accept")?.includes("vnd.pgrst.object");
    const reply = (data, status = 200, count = null) =>
      new Response(method === "HEAD" ? null : JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json",
          ...(count === null ? {} : { "Content-Range": "0-0/" + count }),
        },
      });
    state.calls.push({ path: url.pathname, method });
    if (url.pathname === "/auth/v1/user") return reply(user());
    if (url.pathname === "/auth/v1/logout") return reply({});
    if (url.pathname.startsWith("/functions/v1/")) {
      // This fixture is deliberately synthetic and makes no real Fanar call.
      // Simulate the new authenticated, side-effect-free preflight separately
      // from the streaming request so the existing stream assertions stay real.
      let payload = null;
      try { payload = typeof init.body === "string" ? JSON.parse(init.body) : null; }
      catch {}
      if (payload?.action === "readiness") {
        state.calls.at(-1).action = "readiness";
        return reply({ provider: "Fanar", configured: true });
      }
      return new Response(
        new ReadableStream({
          start(controller) {
            state.stream = controller;
            controller.enqueue(
              new TextEncoder().encode(
                "data: " +
                  JSON.stringify({
                    content: "CI FIRST PARTIAL RESPONSE",
                    model: "CI SYNTHETIC PROVIDER",
                  }) +
                  "\n\n",
              ),
            );
          },
        }),
        { headers: { "Content-Type": "text/event-stream" } },
      );
    }
    if (!url.pathname.startsWith("/rest/v1/"))
      throw Error("Unexpected synthetic fixture endpoint: " + url.pathname);
    const table = url.pathname.split("/").at(-1);
    const owner = state.account.id;
    const suffix = owner.endsWith("1") ? "A" : "B";
    const conversations = [1, 2].map((i) => ({
      id: "10000000-0000-4000-8000-00000000000" + i,
      title: "CI CHAT " + i + " " + suffix,
      pinned: false,
      archived: false,
      selected_model: "auto",
      temporary: false,
      updated_at: "2026-10-01T12:00:00Z",
    }));
    const profile = {
      id: owner,
      display_name: "CI " + state.account.role,
      role: state.account.role,
      xp: 100,
      coins: 10,
      streak_days: 1,
    };
    const classId = "20000000-0000-4000-8000-000000000001",
      questionId = "30000000-0000-4000-8000-000000000001";
    const tables = {
      profiles: [profile],
      user_settings: [
        {
          user_id: owner,
          default_ai_model: "auto",
          ai_memory_enabled: true,
          theme: "system",
          locale: localStorage.getItem("noata-locale")==="en"?"en":"ar",
          reduced_motion: false,
        },
      ],
      ai_conversations: conversations,
      notifications: notices,
      classes: [
        {
          id: classId,
          name: "صفّ الاختبار الاصطناعي",
          grade_label: "CI",
          academic_year: "2026",
          active: true,
        },
      ],
      assignments: [],
      questions: [
        {
          id: questionId,
          prompt_ar: "سؤال اختبار واجهة فقط",
           prompt_en: "English fixture question: what is 240 divided by 30?",
           choices_ar: [], choices_en: [], lesson_id: "ci-lesson",
          question_type: "numeric",
          review_status: "approved",
          publication_status: "published",
          position: 1,
        },
      ],
      assignment_submissions: [],
      lesson_progress: [],
      assignment_items: [],
      lessons: localStorage.getItem("noata-locale")==="en"?[{id:"ci-lesson",unit_id:"ci-unit",title_ar:"درس اصطناعي",title_en:"English fixture lesson",position:1,content:{summary_ar:"شرح اصطناعي",summary_en:"English fixture lesson summary",worked_en:"240 divided by 30 is 8."}}]:[],
       units: [{id:"ci-unit",title_ar:"وحدة اصطناعية",title_en:"English fixture unit"}],
      skills: [],
      class_memberships: [],
      teacher_class_access: [],
      skill_evidence: [],
      audit_events: [],
    };
    if (table === "ai_messages") {
      if (method === "POST") {
        const value = JSON.parse(init.body);
        return reply(single ? value : [value]);
      }
      const rows = [
        {
          id: "40000000-0000-4000-8000-000000000001",
          conversation_id: url.searchParams.get("conversation_id")?.slice(3),
          role: "assistant",
          content:
            "## CI PRIVATE " +
            suffix +
            "\n\nSynthetic private workspace response."+(localStorage.getItem("noata-locale")==="en"?"\n\n"+[
              {version:1,id:"ci-quadratic",type:"quadratic",title:"CI quadratic explorer",fallback:"The roots change with the coefficients.",a:1,b:0,c:-1},
              {version:1,id:"ci-flashcards",type:"flashcards",title:"CI flashcards",fallback:"Distance is the length of a path.",cards:[{front:"Distance",back:"The length of a path."}]},
              {version:1,id:"ci-quiz",type:"quiz",title:"CI practice",fallback:"2 + 2 = 4.",questions:[{prompt:"What is 2 + 2?",choices:["4","5"],answer:0,explanation:"Adding two and two gives four."}]}
            ].map(data=>"```noata-ui\n"+JSON.stringify(data)+"\n```").join("\n\n"):""),
          status: "complete",
          model: "CI FIXTURE",
          created_at: "2026-10-01T12:00:00Z",
          metadata: {},
        },
      ];
      if (state.delayHistory)
        return new Promise((resolve) => {
          state.historyRelease = () => {
            state.delayHistory = false;
            resolve(reply(rows));
          };
        });
      return reply(rows);
    }
    if (table === "notifications" && method === "PATCH") {
      if (state.denyMark)
        return reply({ message: "CI intentional denial", code: "42501" }, 403);
      const body = JSON.parse(init.body),
        ids =
          url.searchParams
            .get("id")
            ?.replace(/^in\.\(|\)$/g, "")
            .split(",") || [];
      const updated = notices.filter((n) => ids.includes(n.id));
      for (const n of updated) n.read_at = body.read_at;
      return reply(updated.map((n) => ({ id: n.id, read_at: n.read_at })));
    }
    if (!Object.hasOwn(tables, table))
      throw Error("Unexpected synthetic fixture table: " + table);
    const rows = tables[table];
    return reply(
      single ? (rows[0] ?? null) : rows,
      200,
      table === "notifications"
        ? notices.filter((n) => !n.read_at).length
        : method === "HEAD" ? rows.length : null,
    );
  };
}

export async function verifyUiAccountContracts({
  browser,
  evaluate,
  navigate,
  waitFor,
  invariant,
  screenshot,
  base,
  auditView = async () => {},
}) {
  const origin = "https://vpfpjvhafkmygetjkfcp.supabase.co";
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== origin ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== "sb_publishable_network_isolation_fixture_only")
    throw Error("Synthetic UI suite requires the explicit approved-origin fixture build; real credentials are forbidden.");
  let interceptionError;
  const listener = (event) => {
    const message = JSON.parse(String(event.data));
    if (message.method !== "Fetch.requestPaused") return;
    const request = message.params;
    if (!request.request.url.startsWith(base + "/")) {
      // Prevent any real backend traffic if the synthetic fetch guard misses a request.
      void browser
        .command("Fetch.failRequest", {
          requestId: request.requestId,
          errorReason: "BlockedByClient",
        })
        .catch((error) => {
          interceptionError = error;
        });
      return;
    }
    const headers = Object.entries(request.request.headers)
      .filter(([name]) => name.toLowerCase() !== "cookie")
      .map(([name, value]) => ({ name, value: String(value) }));
    void browser
      .command("Fetch.continueRequest", {
        requestId: request.requestId,
        headers: [...headers, { name: "Cookie", value: "" }],
      })
      .catch((error) => {
        interceptionError = error;
      });
  };
  browser.socket.addEventListener("message", listener);
  await browser.command("Fetch.enable", {
    patterns: [{ urlPattern: "*", requestStage: "Request" }],
  });
  const injection = await browser.command(
    "Page.addScriptToEvaluateOnNewDocument",
    {
      source:
        "(" + installFixture.toString() + ")(" + JSON.stringify(origin) + ")",
    },
  );
  try {
    await navigate("/notifications");
    await waitFor(
      () =>
        evaluate('document.querySelectorAll(".aura-inbox-item").length===2'),
      "synthetic inbox",
    );
    await evaluate(
      'window.__noataUiFixture.state.denyMark=true;document.querySelector(".aura-inbox .topbar button").click()',
    );
    await waitFor(
      () => evaluate('!!document.querySelector(".aura-inbox [role=alert]")'),
      "unconfirmed mark error",
    );
    invariant(
      await evaluate(
        'document.querySelectorAll(".aura-inbox-item[data-read=false]").length===2',
      ),
      "Denied notification mutation cannot claim read state",
    );
    await evaluate(
      'window.__noataUiFixture.state.denyMark=false;document.querySelector(".aura-inbox .topbar button").click()',
    );
    await waitFor(
      () =>
        evaluate(
          'document.querySelectorAll(".aura-inbox-item[data-read=true]").length===2',
        ),
      "confirmed mark readback",
    );
    invariant(true, "Notification marks require returned records");
    await auditView("notifications");
    // Account avatar MUST open a menu; it must never sign the user out.
    await waitFor(
      () => evaluate('!!document.querySelector(".noata-account-trigger")'),
      "synthetic authenticated account trigger",
    );
    const logoutsBefore = await evaluate(
      'window.__noataUiFixture.state.calls.filter(c=>c.path.includes("/auth/v1/logout")).length',
    );
    await evaluate('document.querySelector(".noata-account-trigger").click()');
    await waitFor(
      () => evaluate('!!document.querySelector("#noata-account-menu")'),
      "avatar opens account menu",
    );
    invariant(
      await evaluate('Array.from(document.querySelectorAll("#noata-account-menu a[href]")).some(a=>a.getAttribute("href")==="/settings") && !!document.querySelector("#noata-account-menu .noata-account-logout")'),
      "Account menu separates settings and explicit sign-out",
    );
    invariant(
      (await evaluate('window.__noataUiFixture.state.calls.filter(c=>c.path.includes("/auth/v1/logout")).length')) === logoutsBefore,
      "Opening avatar does not terminate an authenticated session",
    );
    invariant(await evaluate('document.activeElement?.getAttribute("role")==="menuitem"'), "Account menu moves focus into its actions");
    await evaluate('document.querySelector("#noata-account-menu").dispatchEvent(new KeyboardEvent("keydown",{key:"End",bubbles:true}))');
    invariant(await evaluate('document.activeElement?.classList.contains("noata-account-logout")'), "Account menu End reaches explicit logout");
    await evaluate('document.querySelector(".noata-account-logout").click()');
    await waitFor(() => evaluate('!!document.querySelector("dialog.noata-confirm[open]")'), "account-menu logout confirmation");
    invariant((await evaluate('window.__noataUiFixture.state.calls.filter(c=>c.path.includes("/auth/v1/logout")).length')) === logoutsBefore, "Opening confirmation sends no logout request");
    await evaluate('document.querySelector(".noata-confirm-secondary").click()');
    await waitFor(() => evaluate('!document.querySelector("dialog.noata-confirm[open]")'), "cancel logout confirmation");
    invariant((await evaluate('window.__noataUiFixture.state.calls.filter(c=>c.path.includes("/auth/v1/logout")).length')) === logoutsBefore, "Cancel preserves authenticated session");
    await evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
    await waitFor(
      () => evaluate('!document.querySelector("#noata-account-menu")'),
      "account menu closes with Escape",
    );
    invariant(await evaluate('document.activeElement?.classList.contains("noata-account-trigger")'), "Escape returns focus to account avatar");
    await navigate("/settings");
    await waitFor(
      () => evaluate('!!document.querySelector("#aura-account .aura-settings-signout")'),
      "independent settings session actions",
    );
    invariant(
      await evaluate('document.querySelector("#aura-account")?.textContent.includes("تسجيل الخروج من حسابي")'),
      "Settings includes explicit Arabic logout control",
    );
    await navigate("/teacher");
    await waitFor(
      () => evaluate('document.body.innerText.includes("مش متاحة لحسابك")'),
      "synthetic student denied staff UI",
    );
    invariant(
      await evaluate('!document.querySelector("form")'),
      "Student fixture never mounts staff editor",
    );
    await evaluate(
      'window.__noataUiFixture.switchAccount("teacher","00000000-0000-4000-8000-000000000002")',
    );
    await waitFor(
      () => evaluate('!!document.querySelector("form textarea")'),
      "synthetic teacher editor",
    );
    invariant(
      await evaluate('document.body.innerText.includes("إنشاء واجب")'),
      "Teacher UI loads confirmed fixture records",
    );
    await auditView("teacher");
    await navigate("/admin");
    await waitFor(
      () => evaluate('document.body.innerText.includes("مش متاحة لحسابك")'),
      "synthetic teacher denied admin UI",
    );
    await evaluate(
      'window.__noataUiFixture.switchAccount("admin","00000000-0000-4000-8000-000000000003")',
    );
    await waitFor(
      () => evaluate('!!document.querySelector("form textarea")'),
      "synthetic admin editor",
    );
    invariant(
      await evaluate('document.body.innerText.includes("قائمة المحتوى")'),
      "Admin UI loads fixture queue",
    );
    await auditView("admin");
    await evaluate('localStorage.setItem("noata-locale","en")');
    await navigate("/admin");
    await waitFor(()=>evaluate('document.documentElement.lang==="en" && document.body.innerText.includes("English fixture question")'),"English staff question content");
    invariant(await evaluate('document.body.innerText.includes("Content list")'),"Admin interface follows English");
    await navigate("/teacher");
    await waitFor(()=>evaluate('document.body.innerText.includes("English fixture question")'),"English teacher question content");
    await navigate("/missions");
    await waitFor(()=>evaluate('document.body.innerText.includes("English fixture lesson") && document.body.innerText.includes("English fixture question")'),"English mission title and question");
    invariant(await evaluate('document.body.innerText.includes("Numeric answer") && !document.body.innerText.includes("سؤال اختبار واجهة فقط")'),"English missions use the English catalog and readable question type");
    await navigate("/lesson/ci-lesson");
    await waitFor(()=>evaluate('document.body.innerText.includes("English fixture lesson summary")'),"English lesson body");
    invariant(await evaluate('!document.body.innerText.includes("شرح اصطناعي")'),"English lesson body never falls back to the Arabic summary");
    await navigate("/ai");
    await waitFor(()=>evaluate('document.querySelectorAll(".owui-history button").length>=2'),"English synthetic AI history");
    await evaluate('Array.from(document.querySelectorAll(".owui-history button")).find(b=>b.textContent.includes("CI CHAT 1")).click()');
    await waitFor(()=>evaluate('document.querySelectorAll(".noata-response-component").length===3'),"validated native educational components");
    invariant(await evaluate('!document.querySelector(".owui-thread").innerText.includes("noata-ui")'),"Structured protocol payloads are hidden from the conversation");
    await evaluate('(()=>{const el=document.querySelector(".noata-coefficients input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"2");el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));})()');
    await waitFor(()=>evaluate('document.querySelector(".noata-calculation").textContent.includes("0.7071")'),"quadratic roots update deterministically");
    await evaluate('document.querySelector(".noata-flashcard").click()');
    await waitFor(()=>evaluate('document.querySelector(".noata-flashcard").textContent.includes("The length of a path.")'),"flashcard reveals its answer");
    await evaluate('document.querySelector(".noata-quiz-question input").click()');
    await evaluate('Array.from(document.querySelectorAll(".noata-widget-controls button")).find(b=>b.textContent.includes("Check answers")).click()');
    await waitFor(()=>evaluate('document.querySelector(".noata-practice-feedback")?.textContent.includes("Correct")'),"practice quiz checks the selected answer");
    invariant(await evaluate('document.querySelector(".owui-layout").getAttribute("dir")==="ltr"'),"English AI layout uses LTR during actual content interactions");
    await auditView("english-interactive-ai");
    await screenshot("artifacts/noata-browser/english-interactive-ai.png");
    await evaluate('localStorage.setItem("noata-locale","ar")');
    await evaluate(
      'window.__noataUiFixture.switchAccount("student","00000000-0000-4000-8000-000000000001")',
    );
    await navigate("/ai");
    await waitFor(
      () =>
        evaluate('document.querySelectorAll(".owui-history button").length>=2'),
      "synthetic conversation history",
    );
    await evaluate(
      'Array.from(document.querySelectorAll(".owui-history button")).find(b=>b.textContent.includes("CI CHAT 1")).click()',
    );
    await waitFor(
      () =>
        evaluate(
          'document.querySelector(".owui-thread")?.innerText.includes("CI PRIVATE A")',
        ),
      "synthetic private message",
    );
    await evaluate(
      '(()=>{const el=document.querySelector(".owui-composer textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(el,"CI UNSENT DRAFT");el.dispatchEvent(new Event("input",{bubbles:true}));})()',
    );
    await evaluate(
      'Array.from(document.querySelectorAll(".owui-history button")).find(b=>b.textContent.includes("CI CHAT 2")).click()',
    );
    await waitFor(
      () =>
        evaluate(
          'document.querySelector(".owui-composer textarea")?.value===""',
        ),
      "independent second conversation draft",
    );
    await evaluate(
      'Array.from(document.querySelectorAll(".owui-history button")).find(b=>b.textContent.includes("CI CHAT 1")).click()',
    );
    await waitFor(
      () =>
        evaluate(
          'document.querySelector(".owui-composer textarea")?.value==="CI UNSENT DRAFT"',
        ),
      "unsent composer draft restore",
    );
    invariant(
      true,
      "Switching conversations preserves independent unsent work",
    );
    await evaluate(
      'document.querySelector("[aria-label=\\\"فتح الرد في مساحة الكتابة\\\"]").click()',
    );
    await waitFor(
      () =>
        evaluate(
          '!!document.querySelector("dialog[open] .aura-studio textarea")',
        ),
      "private writing editor",
    );
    await evaluate(
      'window.__noataUiFixture.switchAccount("student","00000000-0000-4000-8000-000000000002")',
    );
    await waitFor(
      () =>
        evaluate(
          '!document.querySelector("dialog[open]") && !document.querySelector(".owui-thread")?.innerText.includes("CI PRIVATE A")',
        ),
      "account switch clears private editor and conversation",
    );
    invariant(
      await evaluate(
        'document.querySelector(".owui-composer textarea")?.value===""',
      ),
      "Account switching erases private composer draft",
    );
    await waitFor(
      () =>
        evaluate(
          '!document.querySelector(".owui-loading") && document.querySelector(".owui-composer textarea")?.disabled===false && document.querySelector(".owui-history")?.textContent.includes("CI CHAT 1 B") && !location.search',
        ),
      "new account initialization finishes",
    );
    await evaluate(
      '(()=>{const el=document.querySelector(".owui-composer textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(el,"CI STREAM REQUEST");el.dispatchEvent(new Event("input",{bubbles:true}));})()',
    );
    await waitFor(
      () =>
        evaluate(
          'document.querySelector(".owui-send")?.disabled===false && document.querySelector(".owui-composer textarea")?.value==="CI STREAM REQUEST"',
        ),
      "new account composer ready",
    );
    const requestsBeforeComposition = await evaluate(
      'window.__noataUiFixture.state.calls.filter(c=>c.path.startsWith("/functions/v1/")).length',
    );
    await evaluate(
      'document.querySelector(".owui-composer textarea").dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",bubbles:true,isComposing:true}))',
    );
    invariant(
      (await evaluate(
        'window.__noataUiFixture.state.calls.filter(c=>c.path.startsWith("/functions/v1/")).length',
      )) === requestsBeforeComposition,
      "IME composition Enter cannot submit an unfinished draft",
    );
    await evaluate('document.querySelector(".owui-send").click()');
    await waitFor(
      () =>
        evaluate(
          'document.querySelector(".streaming")?.innerText.includes("CI FIRST PARTIAL RESPONSE")',
        ),
      "synthetic streaming update",
    );
    await evaluate("window.__noataUiFixture.signOut()");
    await waitFor(
      () =>
        evaluate(
          '!document.querySelector(".streaming") && !document.querySelector(".owui-thread")?.innerText.includes("CI STREAM REQUEST")',
        ),
      "logout clears in-flight work",
    );
    await evaluate("window.__noataUiFixture.completeStream()");
    await new Promise((resolve) => setTimeout(resolve, 300));
    invariant(
      await evaluate(
        '!document.body.innerText.includes("CI STALE PRIVATE RESULT") && !document.querySelector(".owui-thread")?.innerText.includes("CI STREAM REQUEST")',
      ),
      "Late provider fixture cannot repopulate a signed-out workspace",
    );
    invariant(
      !interceptionError,
      "Synthetic request isolation remained active",
    );
    console.log(
      "[browser] Synthetic account/UI contracts pass; real auth/provider/RLS remain NOT RUN",
    );
  } finally {
    await evaluate(
      'sessionStorage.removeItem("noata-ci-fixture-account")',
    ).catch(() => {});
    await browser.command("Page.removeScriptToEvaluateOnNewDocument", {
      identifier: injection.identifier,
    });
    await browser.command("Network.clearBrowserCookies");
    await browser.command("Fetch.disable");
    browser.socket.removeEventListener("message", listener);
    await navigate("/ai");
  }
}
