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
- PDF/DOCX fixtures, 253 browser assertions, 68 captures, 48 public-view axe checks, trace/performance evidence, all modern/legacy tests and HTTP smoke remain required. No failures are retried away or converted to success.

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

Read-only attempts to retrieve this deployment through `api.vercel.com` fail with a proxy tunnel 403; GitHub deployment/status API reads are also Forbidden. The repository records project `prj_UwZa56LUkn8ELou8gWfEd6B371RM` / team `team_JAfADczhFscVrYQAPyLi41SS`. Commit author/committer identity is already the repository owner's configured identity; it has not been changed to impersonate another team member. Team membership/Git integration authorization, plan policy and exact `errorCode`/`errorMessage` must be inspected through an authorized connected read. No precise cause is confirmed from the available response.

Do not change billing, account limits, deployment protection, production aliases or identity to get around the block. Storage migration remains unapplied. Release approval stays blocked until exact-head CI, an authorized isolated preview/staging and the remaining release matrix succeed.
