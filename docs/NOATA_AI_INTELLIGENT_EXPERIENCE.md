# Noata AI: intelligent experience implementation

## Scope and release boundary

Development branch: `noata-aura-platform-overhaul-20261008`, Draft PR #3.
Production deployment, database, environment variables and credentials remain unchanged.
This document records an independently testable milestone, not a production-readiness claim.

## Implementation map

| Layer | Implementation | Evidence boundary |
|---|---|---|
| Account and conversation authorization | Existing Supabase Auth, verified account, RLS, session generation guards | Synthetic account contracts are distinct from genuine multi-account RLS tests |
| Conversation shell | Existing history, pin/archive/rename/search, temporary conversation, expanding composer | Existing architecture retained; duplicate visible sender removed, English direction corrected |
| Answer presentation | Memoized `RichMessage`, Markdown/GFM/KaTeX/code rendering, task-sensitive generation policy | Poems, quotations and code are not reformatted into artificial paragraphs |
| Native interactive registry | `response-ui.ts`, `response-components.tsx` | Six allowlisted types, explicit validation, version and stable ID, no generated JavaScript or actions |
| Mathematics | Quadratic explorer | Coefficients, discriminant, real roots and curve computed by trusted deterministic code; linear and identity cases handled |
| Practice | Flashcards, multiple-choice quizzes, revealable steps | Actual interaction; quiz answers are model-generated informal practice, never authoritative grades or rewards |
| Other presentation | Timeline, comparison table | Accessible semantic lists/tables, keyboard overflow and text fallback |
| Research planning | `research.ts` | Automatic explicit-research/freshness/source decisions; honors opt-out, protects uploaded/credential-like input; no mode toggle |
| Retrieval | Brave LLM Context adapter | Fixed HTTPS endpoint and provider-extracted page excerpts, bounded query/request/response, no arbitrary URL fetch or scraping |
| Source rendering | `ResearchSources`, numbered markers mapped to actual retrieved metadata | Actual excerpts and dates only; source listing does not establish every claim; no fabricated source UI |
| Streaming | Existing Fanar SSE extended with genuine research states and timing | Closed/valid UI blocks render; incomplete structured blocks stay buffered; Stop and partial text recovery preserved |
| Persistence | Existing message metadata and Markdown content | Versioned research metadata; valid widget blocks reopen through same registry without schema migration |
| Exports | Writing Studio, styled PDF, Text PDF, Word, Markdown | English reading direction corrected; Arabic shaping preserved; embedded font loading repaired |

## Contracts

Ordinary answers remain Markdown. An optional closed `noata-ui` fenced JSON block uses version 1,
an ID, title, fallback text and one of: quadratic, flashcards, quiz, steps, timeline, comparison.
Unknown types/properties, nonfinite/out-of-range coefficients, excessive arrays and invalid answer indexes are rejected.
The server replaces invalid completed blocks with bounded plain fallback text. The browser independently validates historical content.
No component can execute code, import modules, invoke server tools, follow arbitrary URLs or grant rewards.

Research is server-originated metadata: version, status, sources, elapsed time. Each source carries an ID,
actual URL/title/domain/excerpt/retrieval timestamp and only a provider-supplied publication date when available.
The renderer checks this contract again before rendering links. Incoming website content remains untrusted evidence.
Explicit current-source requests receive a visible unavailable state if search is unconfigured or fails.
Unavailable or failed retrieval returns a deterministic application message and does not invoke Fanar for the research answer. Both streaming and buffered requests share this gate. The retrieved-success path still requires live provider validation.
Semantic claim-to-source entailment is not independently proven by these structural checks.

## Search configuration and approval

No search subscription is created, no paid service is upgraded, and no key is copied from another project.
The adapter is off by default. An owner must approve Brave LLM Context usage and its current agreement,
quota and budget, then securely configure **Staging** Edge Function secrets:

- `BRAVE_SEARCH_API_KEY`: authorized key for the approved search account.
- `NOATA_SEARCH_ENABLED=true`: explicit opt-in after usage/cost/privacy approval.

Never configure a `NEXT_PUBLIC_` search secret. Never paste a key in chat or commit it.
Vercel Preview environment names were inspected without revealing values; no search-provider variable was found there.
The real Staging unavailable-path test on 2026-10-11 confirmed that live retrieval is not configured/available for the request. No genuine retrieved-success test has passed.

The request budget is one provider request, 12-second timeout, 256 KB response limit, five URLs,
2,048 context tokens, two concurrent requests per function instance, and five searches/minute/account through the existing quota RPC.
Redirects are rejected. Source URLs must be HTTPS without credentials, nonstandard ports, IP literals or local/internal names.
Source URLs are never fetched by the application; retrieval is delegated to the approved provider.
Search pages are not globally cached. Cross-user caching and durable search-result retention require a verified service agreement and privacy policy.
Conversation metadata persists excerpts only under the user's existing authorized conversation policy; temporary chats keep them in the current session.

Missing configuration, empty results, provider failures, quota and open-circuit states never report a successful search.
Activity states reflect actual start/normalization/generation operations, not simulated progress or hidden reasoning.

## Sadiq 2

Staging Fanar returned HTTP 422 and the sanitized diagnostic `PROVIDER_MODEL_ACCESS_DENIED`
at 2026-10-10T22:43:12.348Z. The official Fanar OpenAPI example states Sadiq 2 needs additional authorization.
The app now explains provider access errors instead of falsely treating them as an expired Noata session.
Specialist requests use their buffered JSON contract and heartbeat; they are not falsely called token streaming.
Auto uses the general model with a visible disclosure until the owner has verified specialist access and
configured `NOATA_SADIQ_2_ENABLED=true` in the matching Staging environment.
An explicit specialist selection reaches the requested service. On an authorization error, the UI explains the cause, selects Auto and requires the learner to choose Retry; it does not silently resend the request.
Minimum owner action: request Sadiq 2 authorization for the currently configured Fanar account/key; verify it, then enable the flag.
No credential reset is required for this model permission issue.

## Verification and remaining work

Unit coverage includes research intent/privacy/opt-out, safe URL normalization, deduplication,
missing configuration, the real adapter request contract with mocked provider response, structured payload rejection,
partial-block buffering, deterministic quadratic edge cases, continuation, sanitized provider denial and research/timing stream persistence.
Browser CI uses explicitly isolated synthetic accounts; checks English staff/lesson content and real native graph/card/quiz controls.
Those fixtures do not prove Fanar generations, paid-search integration, OAuth, cross-user RLS or real teacher/student workflows.

Remaining acceptance work includes live provider-generated flashcards/quizzes and other widget types, Arabic widgets and all palettes/breakpoints,
genuine search after authorized configuration, voice and vision provider testing, uploaded-document live summaries,
complete historical conversation/source/widget restoration, keyboard/accessibility scans and performance measurement.
Geometry, concept maps, science process diagrams, grammar analysis and truth tables are not yet supported registry types.
No fake controls for them are shown. More extensive shell/composer restructuring remains a later verified milestone.
The existing separate production backup/restore, migration, role, OAuth, rewards and release compatibility gates remain in force.

## Live verification, 2026-10-11\n\n| Check | Result | Actual evidence |\n|---|---|---|\n| Candidate CI and Preview | PASS | \x605f62602b09aa2e0af02c806087b525e854299aad\x60: both Noata CI runs succeeded; Preview https://noata-o4yxvuey5-noata.vercel.app |\n| Live graph generation, first attempt | FAIL, fixed | C-1 described external graph controls; Auto structured-learning requests now use Fanar with explicit native schema examples |\n| Live graph and keyboard input retest | PASS | Staging function v12, source \x6064d1732\x60; actual Fanar output rendered a=1,b=0,c=-1; ArrowRight changed a to 1.5, discriminant to 6, roots to -0.8165/0.8165 |\n| Failed retrieval, first attempt | FAIL, fixed | Fanar invented latest Mars claims despite a notice; unavailable retrieval now bypasses generation |\n| Failed retrieval retest | PASS | Staging v12 returned only deterministic unavailable text, no discoveries or citations |\n| Successful real web retrieval | BLOCKED | Approved matching Staging search provider configuration absent; requires secure approved key, quota/budget and privacy agreement |\n| Plain Sadiq | PASS | Real English request about zakat returned a coherent short answer using the specialized buffered service |\n| Sadiq 2 | BLOCKED | Provider permission denial already verified; owner must obtain model authorization |\n| Human-readable exports | PASS unit boundary | Native JSON becomes textual fallback for copy, writing studio and speech; normal code remains literal. Fresh live export still required |\n| Full platform, roles and disaster recovery | NOT TESTED in this milestone | Earlier evidence and blockers remain; no full release-ready claim |\n\nThe two newer branch commits \x605b30357\x60 and \x6053bc5bf\x60 were reviewed and integrated in development (\x60c27fb12\x60). PR #3 remains Draft and unmerged. Production was not modified.\n\n## Research references

- [OpenAI Intelligent UI](https://openai.com/index/gpt-6-for-everyone/): adaptive/native progressive responses; product inspiration, not a Fanar capability claim.
- [ChatGPT Search](https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt): automatic retrieval and actual sources.
- [Study Mode](https://help.openai.com/en/articles/11780217-using-study-mode-in-chatgpt): guided learning and comprehension checks.
- [Interactive math/science](https://openai.com/index/new-ways-to-learn-math-and-science-in-chatgpt/).
- [AI SDK chatbot architecture](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot): typed messages and streaming-state boundaries; existing compatible transport retained.
- [Brave LLM Context](https://api-dashboard.search.brave.com/documentation/services/llm-context): fixed endpoint, extracted grounding and source contract.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [OWASP LLM risks](https://genai.owasp.org/llm-top-10/): keyboard/text equivalents and untrusted retrieval boundaries.
