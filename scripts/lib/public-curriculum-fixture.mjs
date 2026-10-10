/** Read-only synthetic catalog coverage; never real auth, progress or RLS evidence. */
function installCatalogFixture() {
  const original = window.fetch;
  const units = [
    {
      id: "ci-open",
      position: 1,
      title_ar: "وحدة تجريبية متاحة",
      title_en: "Fixture open unit",
      description_ar: "بيانات اصطناعية لاختبار واجهة المسار.",
      metadata: { locked: false },
    },
    {
      id: "ci-locked-empty",
      position: 2,
      title_ar: "وحدة تجريبية قيد المراجعة",
      title_en: "Fixture locked unit",
      description_ar: "قريبًا — لم تُنشر الدروس بعد.",
      metadata: { locked: true },
    },
    {
      id: "ci-locked",
      position: 3,
      title_ar: "وحدة تجريبية مغلقة",
      title_en: "Fixture locked lessons",
      description_ar: "الدروس غير متاحة بعد.",
      metadata: { locked: true },
    },
  ];
  const lessons = [
    {
      id: "ci-lesson-1",
      unit_id: "ci-open",
      position: 1,
      title_ar: "درس تجريبي أول",
      title_en: "Fixture lesson one",
      content: {},
    },
    {
      id: "ci-lesson-2",
      unit_id: "ci-open",
      position: 2,
      title_ar: "درس تجريبي ثانٍ",
      title_en: "Fixture lesson two",
      content: {},
    },
    {
      id: "ci-lesson-3",
      unit_id: "ci-locked",
      position: 1,
      title_ar: "درس تجريبي غير متاح",
      title_en: "Fixture locked lesson",
      content: {},
    },
  ];
  window.fetch = async (input, init = {}) => {
    const url = new URL(
      typeof input === "string" ? input : input.url,
      location.origin,
    );
    if (!url.hostname.endsWith(".supabase.co")) return original(input, init);
    const method = (
      init.method || (input instanceof Request ? input.method : "GET")
    ).toUpperCase();
    const data =
      method === "GET"
        ? {
            "/rest/v1/courses": [
              { id: "ci-course", title_ar: "مسار اصطناعي لاختبار الواجهة" },
            ],
            "/rest/v1/units": units,
            "/rest/v1/lessons": lessons,
          }[url.pathname]
        : undefined;
    return new Response(
      JSON.stringify(
        data ?? {
          message: "Synthetic catalog permits only known anonymous reads",
        },
      ),
      {
        status: data ? 200 : 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  };
}

export async function verifyPublicCurriculum({
  browser,
  evaluate,
  navigate,
  waitFor,
  invariant,
  auditView,
}) {
  let interceptionError;
  const listener = ({ data }) => {
    const event = JSON.parse(String(data));
    if (event.method !== "Fetch.requestPaused") return;
    void browser
      .command("Fetch.failRequest", {
        requestId: event.params.requestId,
        errorReason: "BlockedByClient",
      })
      .catch((error) => {
        interceptionError = error;
      });
  };
  browser.socket.addEventListener("message", listener);
  await browser.command("Fetch.enable", {
    patterns: [{ urlPattern: "*://*.supabase.co/*", requestStage: "Request" }],
  });
  const injection = await browser.command(
    "Page.addScriptToEvaluateOnNewDocument",
    { source: "(" + installCatalogFixture.toString() + ")()" },
  );
  try {
    await navigate("/learn");
    await waitFor(
      () =>
        evaluate(
          'document.querySelectorAll(".aura-curriculum-unit").length===3',
        ),
      "synthetic published and locked catalog",
    );
    invariant(
      await evaluate(
        'document.querySelectorAll(".quest a[aria-disabled=false]").length===2',
      ),
      "Published lessons expose their start links",
    );
    invariant(
      await evaluate(
        'Array.from(document.querySelectorAll(".aura-curriculum-unit")).every(el=>getComputedStyle(el).opacity==="1")',
      ),
      "Locked curriculum keeps readable text and icons",
    );
    invariant(
      await evaluate(
        'document.querySelector(".aura-curriculum-unit[data-locked=true] .quest-list").textContent.includes("المحتوى تحت المراجعة")',
      ),
      "Locked empty unit has an honest publication state",
    );
    const blocked = await evaluate(
      '(()=>{const link=document.querySelector(".quest a[aria-disabled=true]");return {tabIndex:link.tabIndex,prevented:!link.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}))};})()',
    );
    invariant(
      blocked.tabIndex === -1 && blocked.prevented,
      "Locked lesson stays unavailable without fading its contents",
    );
    await auditView("learn-catalog");
    await evaluate(
      '(()=>{const el=document.querySelector(".filter-bar input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"أول");el.dispatchEvent(new Event("input",{bubbles:true}));})()',
    );
    await waitFor(
      () => evaluate('document.querySelectorAll(".quest").length===1'),
      "catalog search filters lessons",
    );
    invariant(
      await evaluate(
        'document.querySelector(".quest h3").textContent.includes("أول")',
      ),
      "Catalog filtering keeps the matching lesson",
    );
    invariant(
      !interceptionError,
      "Synthetic catalog backend interception stayed active",
    );
    console.log(
      "[browser] Synthetic published/locked curriculum and search verified; no real backend used",
    );
  } finally {
    await browser.command("Page.removeScriptToEvaluateOnNewDocument", {
      identifier: injection.identifier,
    });
    await browser.command("Fetch.disable");
    browser.socket.removeEventListener("message", listener);
    await navigate("/ai");
  }
}
