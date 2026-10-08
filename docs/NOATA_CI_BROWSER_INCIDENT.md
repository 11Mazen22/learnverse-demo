# Browser CI failure and corrective milestone

Date: 2026-10-08. Branch remains `noata-aura-platform-overhaul-20261008`; PR #3 remains draft. No production, billing, domain or database changes.

## Exact failed baseline

The user independently checked connected APIs and reported [run 37717913313](https://github.com/11Mazen22/learnverse-demo/actions/runs/37717913313) failed at exact head `eacf38b32c2cd767687267d5859a7a171e075bc1`. TypeScript, Deno, real Arabic PDF/DOCX fixtures and build passed before the browser step. Zero browser assertions ran. [Diagnostic artifact 11524960721](https://github.com/11Mazen22/learnverse-demo/actions/runs/37717913313/artifacts/11524960721) reportedly contains Vulkan/EGL errors, `Cannot use V8 Proxy resolver in single process mode`, a DevTools endpoint announcement and then the generic `Chrome CDP connection error`.

These are user-supplied diagnostic excerpts, not a complete artifact inspection. Attempts through `gh run view --log-failed`, `gh run download`, Actions REST and the artifact web URL fail in this environment (API Forbidden / unauthenticated web 404). The connected GitHub/Vercel tools are not callable here. Local artifacts from the previous passing run are not CI artifacts and do not refute this failure.

The source unconditionally applied `--single-process` and `--no-zygote`, used a fixed port 9228 and truncated each stderr chunk. Those serverless launch settings were inappropriate defaults for GitHub's full Chrome. The excerpt supports investigating this configuration; it does not by itself establish which GPU error was fatal or prove a proxy/network outage.

## Corrective implementation

- A shared QA launcher uses full multiprocess Chrome without either problematic flag. The packaged serverless PDF renderer remains separate and unchanged.
- The OS assigns a debugging port (`--remote-debugging-port=0`); readiness reads the isolated profile's `DevToolsActivePort`, verifies the browser endpoint identity, and finds a page target on the same loopback port. There is no shared 9228/9231 port.
- Each browser gets unique profile/cache/config directories. Local full Chromium now launches with writable XDG directories. Process groups and profiles are cleaned even after the browser parent crashes.
- Loopback discovery uses `node:http`; the pinned `ws` client uses a direct agent and rejects redirects. Application/provider proxy configuration stays untouched. Diagnostics record only proxy-variable presence, never values.
- Full stdout/stderr persists to `chromium.log`. `browser-startup.json` captures the executable, flags, PID, port, version, spawn errors, exit code/signal, readiness errors, WebSocket endpoint/error/HTTP rejection status/close details and cleanup results. The suite outcome includes nested error causes/stacks. Command and trace waits fail promptly on disconnect or timeout.
- CI installs full Chrome for Testing matched to pinned Puppeteer (`146.0.7680.153`) and records installer diagnostics. Three simultaneous real Chrome/CDP sessions test isolation and crash propagation before the full suite. Six fault regressions cover flags, missing executable, exit code, signal, rejected handshake and missing debugger.
- Public and authenticated runners share the launcher. Authenticated execution still requires the isolated staging guard; no auth bypass was added.
- PDF/DOCX fixtures, dynamically counted browser assertions/captures, 180 public-view axe checks and clearly labeled synthetic client regressions, trace/performance evidence, all modern/legacy tests and HTTP smoke remain required. No failures are retried away or converted to success.

## Reproduce and inspect

```bash
pnpm install --frozen-lockfile
node --test scripts/qa-browser.test.mjs
node scripts/install-qa-chrome.mjs
# Outside Actions, set NOATA_CHROMIUM_PATH to the executable printed above.
node scripts/browser-launch-smoke.mjs
pnpm verify
node scripts/document-export-smoke.mjs
node scripts/browser-aura-smoke.mjs
```

For this restricted cloud workspace, use `NOATA_CHROMIUM_PATH=/usr/bin/chromium` for launch/browser smoke. This is full Chromium 151, not the packaged `/tmp/chromium` serverless executable. Local downloading of pinned Chrome for Testing returns HTTP 403 from the network proxy; installer failure is retained and is not represented as successful pinned-browser validation. CI must independently exercise the pinned browser on a GitHub-hosted runner.

New evidence is under `artifacts/noata-browser-runtime-tests/`, `artifacts/noata-browser-launch/` and `artifacts/noata-browser/`, uploaded alongside document fixtures even on failure. The exact tested revision is recorded in outcome files. A new push triggers the entire existing workflow; only a successful run for that new head satisfies the CI gate. Local success alone does not.

## Vercel restriction

The user independently read deployment `dpl_9FqbL9geFgdebrqKKMQ5UeZc6D2M` as `BLOCKED`. The connected response supplied a team-configuration troubleshooting link without a specific blocking code. Earlier HTTP 402 quota evidence cannot be assigned to this deployment without new evidence.

Read-only attempts to retrieve this deployment through `api.vercel.com` fail with a proxy tunnel 403; GitHub deployment/status API reads are also Forbidden. The repository records project `prj_UwZa56LUkn8ELou8gWfEd6B371RM` / team `team_JAfADczhFscVrYQAPyLi41SS`. The earlier claim that Git attribution matched the authorized Vercel owner was incorrect. GitHub identifies both author and committer as **Lingua1**, while the confirmed Vercel member is linked to **11Mazen22**. The user later retrieved the exact event: deployment creation was blocked because Lingua1 does not have a Vercel account. This is an authorization restriction, not evidence of a build, billing, quota or domain failure. Existing attribution has not been rewritten.

Do not change billing, account limits, deployment protection, production aliases or identity to get around the block. Storage migration remains unapplied. Release approval stays blocked until exact-head CI, an authorized isolated preview/staging and the remaining release matrix succeed.


## Independently verified recovery baseline

The user subsequently verified commit **2b6c9b9b352a8cf1c74e30bfc679a109f68af839** through connected APIs: [PR CI 37728570750](https://github.com/11Mazen22/learnverse-demo/actions/runs/37728570750) SUCCESS, [push CI 37728567137](https://github.com/11Mazen22/learnverse-demo/actions/runs/37728567137) SUCCESS, and Vercel **dpl_HWfRU9pkW6yQv7MY3T5CJFtirEg4** READY at https://noata-cgdyh3tnu-noata.vercel.app. This establishes recovery at that exact baseline, without attributing a definitive cause or configuration change to the earlier Vercel block. No billing, limit bypass or production action occurred here.

Subsequent product changes must independently pass their own exact-head workflow and preview. The expanded suite now audits all six required widths and both themes, records settled error/guest states, protects writing edits on Escape, and exercises synthetic account/logout races with all real backend traffic blocked. Synthetic client fixtures never establish real authentication, provider health or RLS. See [current release gates](NOATA_AURA_FINAL_RELEASE_GATES.md).

## Later exact-head regressions and preserved fixes

User-connected diagnostics identify e48ab11 push/PR runs 37765867629/37765875824 as failed at `/learn` contrast; da6517b runs 37768304434/37768310547 failed the immediate discard/reopen assertion. A local 20-cycle reproduction observed discarded text briefly in 5 cycles, then fresh text after the passive reset. The editor now resets in a layout effect before Dialog opens; 20 cycles pass and the original immediate assertion stays unchanged.

At a2572fb push/PR runs 37769509536/37769514581 again failed `/learn` contrast on 768/390/320: locked icons faded by article opacity and white text on dark cyan Start links. Its local full suite passed because the external catalog was unavailable here. The correction removes card-wide opacity, uses the theme surface foreground for Start links, and adds a read-only isolated catalog fixture audited at every width/theme. Local old-style reproduction reports the actual insufficient contrast; corrected styles have zero detected violations across twelve fixture audits. No fixture is real provider/auth/RLS evidence. Full exact-new-head CI remains required.

User-verified a2572fb preview dpl_D5PKLDsgppWfw3gfWwH9jWiDa2ss is BLOCKED at https://noata-nv8jbobet-noata.vercel.app; the team-configuration response still lacks a precise code. Subsequent read-only requests for official troubleshooting docs and the isolated staging endpoint are denied by the cloud proxy. No billing, identity, membership, limits or production configuration changed.

## Current investigation after 68eb47a

Direct GitHub API reads now confirm push **37771833457** and PR **37771839704** failed at 68eb47ab4b6677aaa2381bf6373c501ca98dbe43; HTTP and legacy steps were skipped. PR #3 is open/draft. The user reports push `/ai` tool-toggle contrast and PR Chrome SIGTRAP. Job/check metadata is accessible, but complete log/artifact redirects are denied by the environment network layer. Do not claim the full hosted chromium log was inspected.

Pinned Chrome **146.0.7680.153** now installs and runs locally. Frame sampling reproduces tool-toggle theme-transition contrast as low as 1.06:1 despite passing endpoint colors. Its foreground/background now switch together; a new regression samples actual frame colors without waiting for those transitions. Local minimum ratios are 4.96:1 idle light, 8.17:1 idle dark, 5.28:1 active light and 6.42:1 active dark. The full axe assertions remain unchanged.

The launcher now requests graceful close from healthy browsers and checks the entire isolated Linux process group after SIGTERM. Surviving descendants receive SIGKILL even if the browser parent already exited. A fault regression creates exactly that orphan-child condition. Diagnostics now retain platform/kernel/CPU, memory/PID limits, free temporary/shared-memory capacity and group members before/after cleanup. CI publishes bounded diagnostic excerpts as check annotations and preserves full artifacts after all steps. No retry or permissive fallback was added. **The historical hosted SIGTRAP root cause remains unconfirmed until complete diagnostics or a repeatable hosted failure establish it.**

GitHub also confirms the 68eb47a Vercel status is blocked, with inspection target https://vercel.com/noata/noata/CU5QDCsombTjbT9tEUsuUYa6VvnE. GitHub deployment API permissions and Vercel management access remain unavailable. A new SHA needs its own full push/PR workflows and authorized READY preview; 2b6c9b9 does not verify it.
