# Noata AI Renaissance 2.0 — Atomic Requirements Traceability

**Binding source:** the user-supplied `NOATA AI RENAISSANCE 2.0.txt`, sections 1–48. Source lines below refer to the extracted 2,924-line text, not implementation files. This matrix enumerates the master document's bullet/numbered requirements and captures key prose where a section contains no list item.

## Status rules

- `NOT_STARTED`: no implementation evidence is recorded for the section.
- `IN_PROGRESS`: code or design work exists, but acceptance is incomplete.
- `IMPLEMENTED_UNVERIFIED`: implementation exists, but this exact requirement has not passed its own check.
- `VERIFIED`: only use when the precise acceptance condition has a passing test/live check linked as evidence.
- `FAILED`: an acceptance check ran and failed.
- `BLOCKED`: a precise external prerequisite prevents verification or implementation.

The initial status on each atomic row is deliberately conservative: it inherits the current section-level inventory. It does **not** mean each row was individually verified. Some bullets combine more than one behavior; split those rows further before moving them to VERIFIED. Status never advances just because code exists, a build succeeds, or a provider credential is configured.

## Section index

| Section | Requirement group | Status | Current evidence / next action |
|---|---|---|---|
| R01 | Inspect the actual project before coding | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R02 | Create a capability audit | IN_PROGRESS | Typed capability registry exists; live provider success is not verified by key presence alone. |
| R03 | Create a new flagship AI experience | NOT_STARTED | Full master-spec acceptance remains pending |
| R04 | Design a unified Noata AI experience | NOT_STARTED | Full master-spec acceptance remains pending |
| R05 | Main conversation layout | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R06 | Redesign every secondary interface | NOT_STARTED | Full master-spec acceptance remains pending |
| R07 | Build an original Noata Motion Language | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R08 | Completely reinvent the welcome screen | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R09 | Create a conversational prediction system | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R10 | Build Noata Memory | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R11 | Replace the fragmented tools architecture | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R12 | General intelligence and writing | NOT_STARTED | Full master-spec acceptance remains pending |
| R13 | Deep reasoning and complex tasks | NOT_STARTED | Full master-spec acceptance remains pending |
| R14 | Coding and development assistance | NOT_STARTED | Full master-spec acceptance remains pending |
| R15 | Creative content generation | NOT_STARTED | Full master-spec acceptance remains pending |
| R16 | Integrate search into ordinary conversation | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R17 | Create the animated Research Activity experience | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R18 | Advanced multi-source research | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R19 | Build Noata Adaptive UI | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R20 | Safe native component architecture | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R21 | Original interactive learning experiences | NOT_STARTED | Full master-spec acceptance remains pending |
| R22 | Build Noata Artifact Engine | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R23 | Natural-language artifact creation | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R24 | Artifact workspace | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R25 | Reinvent Writing Studio | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R26 | Knowledge and file intelligence | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R27 | Image generation | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R28 | Build Noata Data Studio | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R29 | Rebuild voice experiences | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R30 | Image and screen understanding | IN_PROGRESS | Uploaded image/document input paths exist in part; complete screen understanding and multimodal acceptance remain open. |
| R31 | Introduce a secure task engine | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R32 | Connected apps and external actions | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R33 | Build AI Projects | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R34 | Build a secure generated-files library | IN_PROGRESS | Owner-scoped artifact storage and revision persistence exist; full library lifecycle/retention tests remain open. |
| R35 | Replace the old settings interface with a coherent modern system | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R36 | Eliminate generic chatbot behavior | IN_PROGRESS | Full master-spec acceptance remains pending |
| R37 | Make Noata a serious AI learning companion | NOT_STARTED | Full master-spec acceptance remains pending |
| R38 | Integrate with Noata's reward system | NOT_STARTED | Full master-spec acceptance remains pending |
| R39 | Arabic and English must be fully operational | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R40 | Introduce a typed AI event protocol | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R41 | Enforce strict boundaries | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R42 | Make the interface lightweight and responsive | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R43 | Execute in verified milestones | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44 | Required functional test scenarios | IN_PROGRESS | Full master-spec acceptance remains pending |
| R45 | Required verification | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R46 | Preserve the existing release restrictions | IN_PROGRESS | Renaissance PR #3 remains separate/unmerged; PRs #18/#19 were independent streaming/document and dependency-hardening releases. |
| R47 | Final acceptance conditions | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R48 | Produce actual implementation results | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |

## Atomic requirements

Stable IDs use `Rxx.yyy`. The source line is from the supplied master specification. Use the status/evidence columns to plan implementation and acceptance; leave any item unverified until its exact acceptance check has run.

| Requirement ID | Source line | Requirement / acceptance statement | Status | Evidence / next action |
|---|---:|---|---|---|
| R01.001 | 63 | Active development branch: Existing pull request: Fetch the latest remote branch and record its exact commit SHA. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.002 | 113 | Existing functionality to audit — Automatic web-search planning. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.003 | 114 | Existing functionality to audit — Brave Search integration. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.004 | 115 | Existing functionality to audit — Research source metadata. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.005 | 116 | Existing functionality to audit — Interactive quadratic graphs. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.006 | 117 | Existing functionality to audit — Flashcards. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.007 | 118 | Existing functionality to audit — Quizzes. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.008 | 119 | Existing functionality to audit — Timelines. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.009 | 120 | Existing functionality to audit — Step-by-step components. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.010 | 121 | Existing functionality to audit — Comparisons. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.011 | 122 | Existing functionality to audit — Markdown and mathematical rendering. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.012 | 123 | Existing functionality to audit — Conversation history. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.013 | 124 | Existing functionality to audit — File handling. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.014 | 125 | Existing functionality to audit — Writing Studio. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R01.015 | 126 | Existing functionality to audit — Fanar model routing and voice capabilities. | IN_PROGRESS | Current master and latest production SHA rechecked; full repository audit and complete acceptance remain open. |
| R02.001 | 142 | Existing implementation. | IN_PROGRESS | Typed capability registry exists; live provider success is not verified by key presence alone. |
| R02.002 | 143 | Verified working behavior. | IN_PROGRESS | Typed capability registry exists; live provider success is not verified by key presence alone. |
| R02.003 | 144 | Missing functionality. | IN_PROGRESS | Typed capability registry exists; live provider success is not verified by key presence alone. |
| R02.004 | 145 | Required backend services. | IN_PROGRESS | Typed capability registry exists; live provider success is not verified by key presence alone. |
| R02.005 | 146 | Required credentials. | IN_PROGRESS | Typed capability registry exists; live provider success is not verified by key presence alone. |
| R02.006 | 147 | Security implications. | IN_PROGRESS | Typed capability registry exists; live provider success is not verified by key presence alone. |
| R02.007 | 148 | Cost implications. | IN_PROGRESS | Typed capability registry exists; live provider success is not verified by key presence alone. |
| R02.008 | 149 | Dependencies. | IN_PROGRESS | Typed capability registry exists; live provider success is not verified by key presence alone. |
| R02.009 | 150 | Testing evidence. | IN_PROGRESS | Typed capability registry exists; live provider success is not verified by key presence alone. |
| R02.010 | 151 | Implementation status. | IN_PROGRESS | Typed capability registry exists; live provider success is not verified by key presence alone. |
| R03.001 | 175 | Excellent typography. | NOT_STARTED | Full master-spec acceptance remains pending |
| R03.002 | 176 | Beautiful Arabic and Latin fonts. | NOT_STARTED | Full master-spec acceptance remains pending |
| R03.003 | 177 | Thoughtful whitespace. | NOT_STARTED | Full master-spec acceptance remains pending |
| R03.004 | 178 | Refined component geometry. | NOT_STARTED | Full master-spec acceptance remains pending |
| R03.005 | 179 | Subtle depth and surface variation. | NOT_STARTED | Full master-spec acceptance remains pending |
| R03.006 | 180 | Elegant monochromatic foundations. | NOT_STARTED | Full master-spec acceptance remains pending |
| R03.007 | 181 | Purposeful brand accents. | NOT_STARTED | Full master-spec acceptance remains pending |
| R03.008 | 182 | Quiet, tactile interactions. | NOT_STARTED | Full master-spec acceptance remains pending |
| R03.009 | 183 | Sophisticated soft motion. | NOT_STARTED | Full master-spec acceptance remains pending |
| R03.010 | 184 | Adaptive layouts. | NOT_STARTED | Full master-spec acceptance remains pending |
| R03.011 | 185 | Highly legible content. | NOT_STARTED | Full master-spec acceptance remains pending |
| R03.012 | 186 | Consistent iconography. | NOT_STARTED | Full master-spec acceptance remains pending |
| R03.013 | 187 | Carefully balanced density. | NOT_STARTED | Full master-spec acceptance remains pending |
| R04.001 | 195 | Create a coherent set of product surfaces that can be navigated without leaving the overall AI experience: The primary adaptive conversation workspace. A contextual home for documents, images, presentations, spreadsheets, code artifacts, and supported media. | NOT_STARTED | Full master-spec acceptance remains pending |
| R05.001 | 233 | Redesign the whole `/ai` page. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.002 | 239 | Sidebar — New chat. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.003 | 240 | Sidebar — Chat search. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.004 | 241 | Sidebar — Recent conversations. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.005 | 242 | Sidebar — Pinned conversations. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.006 | 243 | Sidebar — Archive. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.007 | 244 | Sidebar — Projects and folders where implemented. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.008 | 245 | Sidebar — Contextual organization. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.009 | 246 | Sidebar — Renaming. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.010 | 247 | Sidebar — Deletion. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.011 | 248 | Sidebar — Conversation management. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.012 | 249 | Sidebar — Temporary chats. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.013 | 250 | Sidebar — Personalization and settings entry. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.014 | 251 | Sidebar — Collapsed desktop state. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.015 | 252 | Sidebar — Proper mobile drawer behavior. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.016 | 262 | Top navigation — Noata AI identity. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.017 | 263 | Top navigation — Current conversation title. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.018 | 264 | Top navigation — Project context where relevant. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.019 | 265 | Top navigation — Optional discreet capability information. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.020 | 266 | Top navigation — Contextual actions. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.021 | 276 | Main conversation — Comfortable responsive reading width. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.022 | 277 | Main conversation — Natural user and assistant message separation. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.023 | 278 | Main conversation — Consistent avatar presentation. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.024 | 279 | Main conversation — Clear text hierarchy. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.025 | 280 | Main conversation — Elegant tables and code blocks. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.026 | 281 | Main conversation — Beautiful mathematics. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.027 | 282 | Main conversation — Proper source references. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.028 | 283 | Main conversation — Responsive embedded artifacts. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.029 | 284 | Main conversation — Contextual message actions. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.030 | 285 | Main conversation — Scroll-to-latest affordance. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.031 | 286 | Main conversation — Streaming-aware scroll positioning. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.032 | 287 | Main conversation — Stable layout under changing content. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.033 | 295 | Composer — Natural multiline expansion. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.034 | 296 | Composer — A polished send button. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.035 | 297 | Composer — Reliable stop-generation action. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.036 | 298 | Composer — Attachment previews. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.037 | 299 | Composer — Paste and drag-and-drop. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.038 | 300 | Composer — Voice recording. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.039 | 301 | Composer — Optional image and screen capture. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.040 | 302 | Composer — Contextual capability menu. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.041 | 303 | Composer — Keyboard shortcuts. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.042 | 304 | Composer — Draft persistence. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.043 | 305 | Composer — Upload progress. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.044 | 306 | Composer — Clear attachment limits. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R05.045 | 307 | Composer — Appropriate accessibility feedback. | IN_PROGRESS | PR #18 stream decoder/typing feedback and CI #1266 responsive browser smoke passed; complete workspace UX acceptance remains open. |
| R06.001 | 319 | AI settings. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.002 | 320 | Model selection. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.003 | 321 | Voice configuration. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.004 | 322 | Privacy controls. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.005 | 323 | Tool panels. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.006 | 324 | Image interfaces. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.007 | 325 | Research activity. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.008 | 326 | Sources drawer. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.009 | 327 | Writing Studio. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.010 | 328 | Education panel. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.011 | 329 | Document previews. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.012 | 330 | Export dialogs. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.013 | 331 | Upload dialogs. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.014 | 332 | Conversation actions. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.015 | 333 | History search. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.016 | 334 | Shortcut panels. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.017 | 335 | Notifications. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.018 | 336 | Error states. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.019 | 337 | Confirmation dialogs. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.020 | 338 | Empty states. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.021 | 339 | Mobile drawers. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.022 | 340 | Menus and popovers. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.023 | 341 | Long-running task views. | NOT_STARTED | Full master-spec acceptance remains pending |
| R06.024 | 342 | User feedback interactions. | NOT_STARTED | Full master-spec acceptance remains pending |
| R07.001 | 354 | Motion must become part of the design system. It should be exceptionally polished, soft, smooth, and consistent. Study publicly visible ChatGPT interaction patterns alongside modern interaction-design practices. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.002 | 366 | Suggested motion foundations — Use configurable design tokens with approximate starting durations: These values are initial design guidelines, not exact animation specifications from ChatGPT. Tune based on actual visual testing and device performance. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.003 | 389 | Motion principles — Gentle opacity transitions. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.004 | 390 | Motion principles — Small, meaningful positional changes. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.005 | 391 | Motion principles — Controlled stagger. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.006 | 392 | Motion principles — Interruptible springs. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.007 | 393 | Motion principles — Smooth height transitions. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.008 | 394 | Motion principles — Shared-layout transitions where useful. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.009 | 395 | Motion principles — Contextual emphasis. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.010 | 396 | Motion principles — Minimal natural easing. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.011 | 397 | Motion principles — Non-distracting loading feedback. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.012 | 407 | Required animated interactions — Entering the AI workspace. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.013 | 408 | Required animated interactions — Creating a new chat. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.014 | 409 | Required animated interactions — Returning to the welcome state. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.015 | 410 | Required animated interactions — Showing four generated start suggestions. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.016 | 411 | Required animated interactions — Replacing suggestions with fresher ones. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.017 | 412 | Required animated interactions — Sending a message. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.018 | 413 | Required animated interactions — Revealing the assistant response. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.019 | 414 | Required animated interactions — Displaying search activity. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.020 | 415 | Required animated interactions — Expanding and collapsing search details. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.021 | 416 | Required animated interactions — Rendering sources. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.022 | 417 | Required animated interactions — Revealing interactive answer components. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.023 | 418 | Required animated interactions — Showing follow-up suggestions. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.024 | 419 | Required animated interactions — Opening and closing file previews. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.025 | 420 | Required animated interactions — Completing a file generation job. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.026 | 421 | Required animated interactions — Switching settings tabs. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.027 | 422 | Required animated interactions — Expanding and collapsing the sidebar. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.028 | 423 | Required animated interactions — Opening tool menus. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.029 | 424 | Required animated interactions — Switching palettes. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.030 | 425 | Required animated interactions — Navigating between projects. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.031 | 426 | Required animated interactions — Displaying errors and recovery actions. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.032 | 427 | Required animated interactions — Revealing generated images. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.033 | 428 | Required animated interactions — Updating interactive charts. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.034 | 429 | Required animated interactions — Progressing through guided learning steps. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.035 | 430 | Required animated interactions — Opening and closing the Writing Studio. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.036 | 434 | Motion technology — Evaluate CSS transitions, the Web Animations API, and Motion for React. Prefer native CSS for straightforward microinteractions. Use a motion library only where it materially improves composition, layout transitions, or interruption handling. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.037 | 448 | Accessibility — Full. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.038 | 449 | Accessibility — Reduced. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R07.039 | 450 | Accessibility — Off. | IN_PROGRESS | Reduced-motion-aware typing caret shipped; all motion interactions in the source brief are not yet verified. |
| R08.001 | 466 | When the user creates a new conversation, the experience should feel fresh, personalized, and intentional. Replace the current static welcome suggestions. Display exactly **four intelligent, dynamically selected starting suggestions**. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.002 | 478 | Required behavior — Recent conversations. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.003 | 479 | Required behavior — Continuing learning topics. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.004 | 480 | Required behavior — Active projects. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.005 | 481 | Required behavior — Previously expressed goals. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.006 | 482 | Required behavior — Preferred subjects. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.007 | 483 | Required behavior — Recent educational activity. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.008 | 484 | Required behavior — Frequently requested capabilities. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.009 | 485 | Required behavior — Relevant memory. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.010 | 486 | Required behavior — Current context. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.011 | 487 | Required behavior — Explicit user preferences. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.012 | 497 | Example — "Continue exploring quadratic equations" | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.013 | 498 | Example — "Quiz me on what I studied" | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.014 | 499 | Example — "Pick up my latest project" | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.015 | 500 | Example — "Help me plan today's learning" | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.016 | 514 | Four-suggestion diversity — One continuation suggestion. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.017 | 515 | Four-suggestion diversity — One relevant educational recommendation. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.018 | 516 | Four-suggestion diversity — One creative or exploratory idea. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.019 | 517 | Four-suggestion diversity — One different but potentially useful action. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.020 | 523 | Instant presentation — New-chat navigation should never wait on an AI request before showing a usable screen. Implement an intelligent hybrid system: Stage 1 — Immediate content | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.021 | 555 | When to regenerate — Relevant recent activity changed. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.022 | 556 | When to regenerate — A significant new memory was recorded. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.023 | 557 | When to regenerate — A project became active. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.024 | 558 | When to regenerate — Previous suggestions were used. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.025 | 559 | When to regenerate — Cache reached its freshness threshold. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.026 | 560 | When to regenerate — New conversation context differs materially. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.027 | 561 | When to regenerate — The user explicitly refreshes suggestions. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.028 | 573 | Generation contract — Stable identifier. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.029 | 574 | Generation contract — Short visible title. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.030 | 575 | Generation contract — Full action prompt. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.031 | 576 | Generation contract — Relevance category. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.032 | 577 | Generation contract — Optional project or memory reference. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.033 | 578 | Generation contract — Locale. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.034 | 579 | Generation contract — Generation timestamp. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.035 | 580 | Generation contract — Expiration or invalidation metadata. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.036 | 586 | Suggestion interactions — Each suggestion must be clickable and keyboard-accessible. Selecting a suggestion should either submit its full prompt or prepare it in the composer, following a clear, consistent product interaction pattern. Avoid accidental submission. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.037 | 596 | Critical constraints — Exactly four visible suggestions. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.038 | 597 | Critical constraints — No duplicate suggestions. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.039 | 598 | Critical constraints — No secrets or sensitive memories exposed in suggestion text. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.040 | 599 | Critical constraints — No old-user suggestions after account switching. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.041 | 600 | Critical constraints — No suggestions derived from deleted or unauthorized content. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.042 | 601 | Critical constraints — No blocked UI while generating. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.043 | 602 | Critical constraints — No fabricated claims of personalization. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R08.044 | 603 | Critical constraints — No excessive AI cost for simple navigation. | IN_PROGRESS | Suggestion frontend/backend code exists; live personalized, account-switch, language-switch and cache-invalidation browser acceptance remains open. |
| R09.001 | 621 | "Show me an interactive graph" | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.002 | 622 | "Give me a harder example" | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.003 | 623 | "Test my understanding" | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.004 | 627 | "Compare these findings" | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.005 | 628 | "Explain the methodology" | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.006 | 629 | "Show the most reliable sources" | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.007 | 633 | "Make the design more formal" | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.008 | 634 | "Create a matching presentation" | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.009 | 635 | "Export another format" | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.010 | 641 | How suggestions are produced — User request. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.011 | 642 | How suggestions are produced — Final assistant response. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.012 | 643 | How suggestions are produced — Active artifact. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.013 | 644 | How suggestions are produced — Tool results. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.014 | 645 | How suggestions are produced — Relevant conversation history. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.015 | 646 | How suggestions are produced — Allowed educational context. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.016 | 647 | How suggestions are produced — Explicit preferences. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.017 | 655 | Smart suggestion rules — Be relevant. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.018 | 656 | Smart suggestion rules — Represent a meaningful next action. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.019 | 657 | Smart suggestion rules — Avoid repeating something already done. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.020 | 658 | Smart suggestion rules — Be feasible using available capabilities. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.021 | 659 | Smart suggestion rules — Avoid assuming external actions are authorized. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.022 | 660 | Smart suggestion rules — Use the correct language. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.023 | 661 | Smart suggestion rules — Have a real underlying prompt. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.024 | 662 | Smart suggestion rules — Respect privacy and current task restrictions. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.025 | 666 | Generation efficiency — Prefer generating structured follow-ups as part of the main completion process when supported. Otherwise use a lightweight asynchronous generation request with a strict budget. Do not slow down the main answer merely to generate suggested follow-ups. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.026 | 674 | Visual behavior — Display suggestions below the completed response. Use a small staggered reveal. The suggestions should feel like part of the conversation rather than intrusive advertisements or oversized feature cards. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R09.027 | 686 | Interaction behavior — Clicking a suggestion should initiate the intended conversational action through normal request handling. Do not use fake interactions that merely paste decorative text. If the suggestion depends on a file or artifact, reference its stable authorized identifier. | IN_PROGRESS | Follow-up suggestions code exists; complete relevance and post-response lifecycle acceptance remains open. |
| R10.001 | 700 | Create a genuine, user-controlled memory system. Noata should be capable of remembering relevant facts across eligible conversations without the user repeatedly explaining the same context. But memory must not be an uncontrolled copy of every message. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.002 | 712 | Memory categories — Language, explanation style, formatting choices, and preferred learning methods. Educational context Subjects, learning goals, topics studied, and areas needing practice. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.003 | 738 | Memory architecture — Current-turn context. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.004 | 739 | Memory architecture — Current-conversation context. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.005 | 740 | Memory architecture — Recent eligible conversation summaries. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.006 | 741 | Memory architecture — Durable user-approved preferences. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.007 | 742 | Memory architecture — Relevant long-term memory records. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.008 | 743 | Memory architecture — Project-scoped knowledge. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.009 | 744 | Memory architecture — Authorized file retrieval. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.010 | 754 | Retrieval — User ownership. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.011 | 755 | Retrieval — Project scope. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.012 | 756 | Retrieval — Consent. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.013 | 757 | Retrieval — Recency. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.014 | 758 | Retrieval — Confidence. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.015 | 759 | Retrieval — Semantic similarity. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.016 | 760 | Retrieval — Explicit preferences. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.017 | 761 | Retrieval — Source provenance. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.018 | 762 | Retrieval — Conflict resolution. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.019 | 763 | Retrieval — Token budgeting. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.020 | 775 | Memory formation — Explicit user instructions. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.021 | 776 | Memory formation — Stable preferences. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.022 | 777 | Memory formation — Temporary context. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.023 | 778 | Memory formation — Uncertain inferences. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.024 | 779 | Memory formation — Sensitive information. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.025 | 791 | User controls — Enable or disable personalization. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.026 | 792 | User controls — Control cross-chat context. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.027 | 793 | User controls — View a meaningful memory summary. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.028 | 794 | User controls — Correct inaccurate context. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.029 | 795 | User controls — Request that information not be used or mentioned. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.030 | 796 | User controls — Remove remembered context. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.031 | 797 | User controls — Manage project-specific memory. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.032 | 798 | User controls — Inspect available source references. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.033 | 799 | User controls — Control suggestion personalization. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.034 | 800 | User controls — Use temporary or unpersonalized conversations. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.035 | 808 | Temporary conversations — Temporary chats must not create long-term memories. If existing memory use is supported, clearly disclose whether the temporary chat is personalized or unpersonalized. Allow an unpersonalized temporary mode that avoids cross-chat retrieval. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R10.036 | 818 | Student privacy — Noata is an educational platform and may serve minors. Implement age-appropriate privacy defaults, data minimization, and clear consent. Avoid building psychological or sensitive profiles of students. | IN_PROGRESS | Explicit opt-in, owner-scoped manual memory CRUD and temporary-chat guards exist; richer personalization/retention acceptance remains open. |
| R11.001 | 832 | The current separate AI tools panel should be replaced with a unified **Noata Capability Engine**. This is a major backend and frontend transformation. Instead of a list of disconnected tools, establish a typed registry with orchestration, permission handling, task status, and consistent result rendering. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.002 | 842 | Capability contract — Identifier. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.003 | 843 | Capability contract — Description. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.004 | 844 | Capability contract — Supported input types. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.005 | 845 | Capability contract — Output types. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.006 | 846 | Capability contract — Input validation schema. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.007 | 847 | Capability contract — Required provider. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.008 | 848 | Capability contract — Required permissions. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.009 | 849 | Capability contract — Estimated cost characteristics. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.010 | 850 | Capability contract — Timeout. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.011 | 851 | Capability contract — Concurrency policy. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.012 | 852 | Capability contract — Safety constraints. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.013 | 853 | Capability contract — Whether confirmation is required. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.014 | 854 | Capability contract — Streaming support. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.015 | 855 | Capability contract — Cancellation support. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.016 | 856 | Capability contract — Fallback behavior. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.017 | 857 | Capability contract — Health and availability state. | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.018 | 863 | Unified execution flow — → `Intent analysis` → `Context and memory retrieval` → `Capability selection` | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R11.019 | 885 | Critical behavior — Most capabilities should be usable simply by asking. "Create a PDF lesson." "Generate a presentation." | IN_PROGRESS | Typed capability registry and execution validation exist; full universal orchestration remains incomplete. |
| R12.001 | 921 | Questions and answers. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.002 | 922 | Explanations. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.003 | 923 | Reasoning. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.004 | 924 | Mathematics. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.005 | 925 | Problem solving. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.006 | 926 | Brainstorming. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.007 | 927 | Creative writing. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.008 | 928 | Summaries. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.009 | 929 | Comparisons. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.010 | 930 | Translation. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.011 | 931 | Language practice. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.012 | 932 | Educational essays. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.013 | 933 | Reports. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.014 | 934 | Formal correspondence. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.015 | 935 | Structured planning. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.016 | 936 | Research synthesis. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.017 | 937 | Code explanations. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.018 | 938 | Document review. | NOT_STARTED | Full master-spec acceptance remains pending |
| R12.019 | 939 | Editing and rewriting. | NOT_STARTED | Full master-spec acceptance remains pending |
| R13.001 | 953 | Problem decomposition. | NOT_STARTED | Full master-spec acceptance remains pending |
| R13.002 | 954 | Multi-step problem solving. | NOT_STARTED | Full master-spec acceptance remains pending |
| R13.003 | 955 | Evidence evaluation. | NOT_STARTED | Full master-spec acceptance remains pending |
| R13.004 | 956 | Planning. | NOT_STARTED | Full master-spec acceptance remains pending |
| R13.005 | 957 | Structured comparisons. | NOT_STARTED | Full master-spec acceptance remains pending |
| R13.006 | 958 | Data interpretation. | NOT_STARTED | Full master-spec acceptance remains pending |
| R13.007 | 959 | Complex mathematical explanations. | NOT_STARTED | Full master-spec acceptance remains pending |
| R13.008 | 960 | Technical troubleshooting. | NOT_STARTED | Full master-spec acceptance remains pending |
| R13.009 | 961 | Verifiable calculations. | NOT_STARTED | Full master-spec acceptance remains pending |
| R13.010 | 962 | Task-specific tool selection. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.001 | 976 | Generating code. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.002 | 977 | Explaining code. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.003 | 978 | Debugging. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.004 | 979 | Refactoring. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.005 | 980 | Comparing implementations. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.006 | 981 | Creating file structures. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.007 | 982 | Writing tests. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.008 | 983 | Reviewing errors. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.009 | 984 | Generating configuration files. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.010 | 985 | Producing downloadable source bundles. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.011 | 986 | Rendering safe supported previews. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.012 | 987 | Producing technical documentation. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.013 | 991 | Sandboxed execution. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.014 | 992 | Test results. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.015 | 993 | Execution logs. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.016 | 994 | Generated outputs. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.017 | 995 | Timeout controls. | NOT_STARTED | Full master-spec acceptance remains pending |
| R14.018 | 996 | Resource limits. | NOT_STARTED | Full master-spec acceptance remains pending |
| R15.001 | 1006 | Educational infographics. | NOT_STARTED | Full master-spec acceptance remains pending |
| R15.002 | 1007 | Diagrams. | NOT_STARTED | Full master-spec acceptance remains pending |
| R15.003 | 1008 | Visual study guides. | NOT_STARTED | Full master-spec acceptance remains pending |
| R15.004 | 1009 | Posters. | NOT_STARTED | Full master-spec acceptance remains pending |
| R15.005 | 1010 | Illustrations. | NOT_STARTED | Full master-spec acceptance remains pending |
| R15.006 | 1011 | Presentation graphics. | NOT_STARTED | Full master-spec acceptance remains pending |
| R15.007 | 1012 | Concept maps. | NOT_STARTED | Full master-spec acceptance remains pending |
| R15.008 | 1013 | Storyboards. | NOT_STARTED | Full master-spec acceptance remains pending |
| R15.009 | 1014 | Learning cards. | NOT_STARTED | Full master-spec acceptance remains pending |
| R15.010 | 1015 | Interactive demonstrations. | NOT_STARTED | Full master-spec acceptance remains pending |
| R15.011 | 1016 | Simple educational games. | NOT_STARTED | Full master-spec acceptance remains pending |
| R15.012 | 1017 | Customized revision material. | NOT_STARTED | Full master-spec acceptance remains pending |
| R16.001 | 1039 | Whether the provider key is configured. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.002 | 1040 | Whether requests succeed. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.003 | 1041 | Whether sources are valid. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.004 | 1042 | Whether metadata reaches the frontend. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.005 | 1043 | Whether search status reflects actual operations. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.006 | 1044 | Whether citations support the claims made. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.007 | 1052 | Search decision-making — Recent events. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.008 | 1053 | Search decision-making — Current facts. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.009 | 1054 | Search decision-making — Time-sensitive information. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.010 | 1055 | Search decision-making — New research. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.011 | 1056 | Search decision-making — Public documentation. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.012 | 1057 | Search decision-making — External source verification. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.013 | 1058 | Search decision-making — Specific references. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R16.014 | 1059 | Search decision-making — Requests explicitly asking for research. | IN_PROGRESS | Brave fixed-endpoint research adapter and query policy exist; live authenticated provider results have not been verified. |
| R17.001 | 1069 | This is a required flagship interface. When Noata searches, display a small, elegantly designed activity section integrated into the response. It might initially show: | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.002 | 1097 | Expandable activity history — What the assistant searched for. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.003 | 1098 | Expandable activity history — The sanitized search queries. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.004 | 1099 | Expandable activity history — When the search occurred. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.005 | 1100 | Expandable activity history — Which provider or retrieval method was used, when disclosure is appropriate. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.006 | 1101 | Expandable activity history — Which sources were retrieved. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.007 | 1102 | Expandable activity history — Which sources were selected. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.008 | 1103 | Expandable activity history — How the sources supported the answer. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.009 | 1104 | Expandable activity history — Whether any search operation failed. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.010 | 1105 | Expandable activity history — Which steps completed successfully. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.011 | 1127 | Collapsed state — Once the answer is complete, activity should collapse naturally to a discreet summary. Use an elegant height and opacity transition. Preserve keyboard accessibility and expanded state where appropriate. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.012 | 1137 | When no search happened — Normally avoid distracting users with constant "No search" banners. Provide a subtle explanation through response details when useful, such as: Answered using existing knowledge — no web search performed. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.013 | 1149 | Research event schema — Operation ID. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.014 | 1150 | Research event schema — Conversation ID. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.015 | 1151 | Research event schema — Tool ID. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.016 | 1152 | Research event schema — Stage. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.017 | 1153 | Research event schema — Sanitized query. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.018 | 1154 | Research event schema — Start timestamp. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.019 | 1155 | Research event schema — Completion timestamp. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.020 | 1156 | Research event schema — Execution outcome. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.021 | 1157 | Research event schema — Error category. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.022 | 1158 | Research event schema — Result count. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R17.023 | 1159 | Research event schema — Source references. | IN_PROGRESS | Collapsible research activity and source rendering exist; live event-to-provider E2E verification remains open. |
| R18.001 | 1171 | Research planning. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.002 | 1172 | User-editable scope. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.003 | 1173 | Specific websites or source constraints. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.004 | 1174 | Multiple search iterations. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.005 | 1175 | Source deduplication. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.006 | 1176 | Cross-source comparison. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.007 | 1177 | Evidence mapping. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.008 | 1178 | Conflicting findings. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.009 | 1179 | Research notes. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.010 | 1180 | Progress updates. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.011 | 1181 | Interruption and refinement. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.012 | 1182 | Structured final reports. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.013 | 1183 | Citations. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.014 | 1184 | PDF, DOCX, or Markdown report export. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R18.015 | 1192 | Citation integrity — Never invent citations. Every citation must correspond to retrieved evidence. Do not attach a citation to a claim the source does not support. | IN_PROGRESS | Bounded multi-query research implementation exists; live Brave behavior and advanced synthesis are not verified. |
| R19.001 | 1208 | Noata must be capable of choosing its response format based on the problem. This is not simply a Markdown renderer. Create a secure, typed interface-composition system. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.002 | 1218 | Response types — Rich text. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.003 | 1219 | Response types — Headings. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.004 | 1220 | Response types — Mathematical notation. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.005 | 1221 | Response types — Code blocks. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.006 | 1222 | Response types — Tables. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.007 | 1223 | Response types — Comparisons. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.008 | 1224 | Response types — Source collections. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.009 | 1225 | Response types — Expandable explanations. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.010 | 1226 | Response types — Interactive graphs. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.011 | 1227 | Response types — Charts. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.012 | 1228 | Response types — Timelines. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.013 | 1229 | Response types — Flashcards. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.014 | 1230 | Response types — Quizzes. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.015 | 1231 | Response types — Forms. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.016 | 1232 | Response types — Calculators. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.017 | 1233 | Response types — Parameter sliders. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.018 | 1234 | Response types — Geometry explorers. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.019 | 1235 | Response types — Concept diagrams. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.020 | 1236 | Response types — Study schedules. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.021 | 1237 | Response types — Document previews. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.022 | 1238 | Response types — File artifacts. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.023 | 1239 | Response types — Image galleries. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.024 | 1240 | Response types — Data previews. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.025 | 1241 | Response types — Progress displays. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.026 | 1242 | Response types — Task plans. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.027 | 1243 | Response types — Research reports. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.028 | 1244 | Response types — Editable writing blocks. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.029 | 1245 | Response types — Safe app-like educational widgets. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R19.030 | 1249 | Response selection — The assistant must decide when a visual component genuinely improves understanding. A greeting requires a short conversational reply. A quadratic equation may benefit from a responsive graph. | IN_PROGRESS | Safe adaptive response components exist; the full native component catalog is not complete. |
| R20.001 | 1275 | Schema validation. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.002 | 1276 | Allowlisted component types. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.003 | 1277 | Versioned payloads. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.004 | 1278 | Stable component IDs. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.005 | 1279 | Serialized state where appropriate. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.006 | 1280 | Safe fallback representations. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.007 | 1281 | Incremental rendering. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.008 | 1282 | Accessibility metadata. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.009 | 1283 | Controlled client actions. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.010 | 1284 | Error boundaries. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.011 | 1285 | Reliable persistence and reopening. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.012 | 1289 | Absolutely prohibited — Evaluating raw model-generated JavaScript. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.013 | 1290 | Absolutely prohibited — Unsandboxed arbitrary HTML. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.014 | 1291 | Absolutely prohibited — Arbitrary imports controlled by the model. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.015 | 1292 | Absolutely prohibited — Direct database mutation from model-authored UI. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.016 | 1293 | Absolutely prohibited — Unvalidated actions. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R20.017 | 1294 | Absolutely prohibited — Unrestricted network calls from generated components. | IN_PROGRESS | Sanitized structured response rendering exists; full typed native event/component persistence and action boundaries remain open. |
| R21.001 | 1300 | Create beautiful, genuinely functional interactive components. Graphs, quadratic equations, coordinate geometry, functions, probability, statistics, algebra, and suitable equation explorers. Interactive models, process diagrams, scientific variables, experimental comparisons, and validated simulations. | NOT_STARTED | Full master-spec acceptance remains pending |
| R22.001 | 1336 | Noata must create real downloadable files, not merely describe how users can create them. This is a major required capability. Build a server-side artifact generation pipeline. | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.002 | 1346 | Priority output formats — PDF | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.003 | 1347 | Priority output formats — DOCX | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.004 | 1348 | Priority output formats — Markdown | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.005 | 1349 | Priority output formats — TXT | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.006 | 1350 | Priority output formats — HTML where safe and appropriate | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.007 | 1351 | Priority output formats — RTF where justified | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.008 | 1355 | Priority output formats — XLSX | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.009 | 1356 | Priority output formats — CSV | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.010 | 1357 | Priority output formats — TSV | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.011 | 1358 | Priority output formats — JSON | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.012 | 1362 | Priority output formats — PPTX | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.013 | 1366 | Priority output formats — PNG | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.014 | 1367 | Priority output formats — JPEG | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.015 | 1368 | Priority output formats — SVG | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.016 | 1369 | Priority output formats — Supported chart formats | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.017 | 1373 | Priority output formats — Source files | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.018 | 1374 | Priority output formats — Configuration files | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.019 | 1375 | Priority output formats — ZIP bundles | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R22.020 | 1376 | Priority output formats — Structured project exports | IN_PROGRESS | PDF/DOCX/XLSX/PPTX generators and format validation exist; PDF/DOCX real export smoke passed; complete fidelity acceptance remains open. |
| R23.001 | 1402 | Understand the request. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.002 | 1403 | Determine the output format. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.003 | 1404 | Gather necessary context. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.004 | 1405 | Create a document plan or structure when useful. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.005 | 1406 | Generate the actual file. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.006 | 1407 | Validate the output. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.007 | 1408 | Render a preview. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.008 | 1409 | Persist it securely. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.009 | 1410 | Provide a working download action. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.010 | 1411 | Allow subsequent edits. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.011 | 1415 | Artifact generation progress — Show real stages, such as: Preparing your document… Building the content… | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.012 | 1433 | Real quality assurance — Correct font embedding. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.013 | 1434 | Real quality assurance — Arabic shaping. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.014 | 1435 | Real quality assurance — Logical page breaks. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.015 | 1436 | Real quality assurance — Proper pagination. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.016 | 1437 | Real quality assurance — Working links. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.017 | 1438 | Real quality assurance — Readable tables. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.018 | 1439 | Real quality assurance — Appropriate margins. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.019 | 1440 | Real quality assurance — Correct mathematical notation. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.020 | 1444 | Real quality assurance — Editable content. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.021 | 1445 | Real quality assurance — Proper Word structure. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.022 | 1446 | Real quality assurance — Styles. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.023 | 1447 | Real quality assurance — Headings. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.024 | 1448 | Real quality assurance — Tables. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.025 | 1449 | Real quality assurance — RTL compatibility. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.026 | 1453 | Real quality assurance — Correct cell types. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.027 | 1454 | Real quality assurance — Valid formulas. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.028 | 1455 | Real quality assurance — Useful formatting. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.029 | 1456 | Real quality assurance — Correct references. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.030 | 1457 | Real quality assurance — Valid chart data. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.031 | 1461 | Real quality assurance — Editable slides. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.032 | 1462 | Real quality assurance — Consistent typography. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.033 | 1463 | Real quality assurance — Appropriate slide dimensions. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.034 | 1464 | Real quality assurance — Proper layouts. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.035 | 1465 | Real quality assurance — Accurate visual content. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.036 | 1466 | Real quality assurance — No clipped text. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.037 | 1470 | Real quality assurance — Safe entries. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.038 | 1471 | Real quality assurance — Correct filenames. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.039 | 1472 | Real quality assurance — Valid contents. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.040 | 1473 | Real quality assurance — No path traversal vulnerabilities. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R23.041 | 1477 | Artifact validation — Never offer a download until the file has actually been created and passed format-level validation. Open or parse generated files in automated tests. Check that they are nonempty, readable, and structurally valid. | IN_PROGRESS | Natural-language artifact pipeline and file receipt guards exist; broad account-authenticated artifact acceptance remains open. |
| R24.001 | 1491 | Inline preview. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R24.002 | 1492 | Fullscreen preview. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R24.003 | 1493 | Download. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R24.004 | 1494 | Rename. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R24.005 | 1495 | Version history. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R24.006 | 1496 | Regenerate. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R24.007 | 1497 | Revise. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R24.008 | 1498 | Duplicate. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R24.009 | 1499 | Replace selected content. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R24.010 | 1500 | Export to another supported format. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R24.011 | 1501 | Organize within projects. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R24.012 | 1502 | Reopen from previous conversations. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R24.013 | 1503 | Delete. | IN_PROGRESS | Saved file previews and Office multi-edit revisions exist; arbitrary PDF text/layout replacement remains unsupported. |
| R25.001 | 1527 | Clean document editing. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.002 | 1528 | Inline rich text. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.003 | 1529 | Section navigation. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.004 | 1530 | Selection-based AI edits. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.005 | 1531 | Find and replace. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.006 | 1532 | Undo and redo. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.007 | 1533 | Version recovery. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.008 | 1534 | Document comparison. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.009 | 1535 | Accessible formatting. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.010 | 1536 | Markdown and document preview. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.011 | 1537 | AI-assisted restructuring. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.012 | 1538 | Export. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.013 | 1539 | Source references. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R25.014 | 1540 | Integration with generated files. | IN_PROGRESS | Writing/revision flows exist; complete native Writing Studio acceptance remains open. |
| R26.001 | 1550 | PDFs. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.002 | 1551 | DOCX. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.003 | 1552 | Images. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.004 | 1553 | Text. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.005 | 1554 | CSV. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.006 | 1555 | JSON. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.007 | 1556 | Spreadsheets. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.008 | 1557 | Presentations. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.009 | 1558 | Supported audio. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.010 | 1564 | Safe upload. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.011 | 1565 | File classification. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.012 | 1566 | Text extraction. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.013 | 1567 | Table extraction. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.014 | 1568 | Image understanding. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.015 | 1569 | Document chunking. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.016 | 1570 | Source indexing. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.017 | 1571 | Semantic retrieval. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.018 | 1572 | Page references. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.019 | 1573 | Cross-document comparison. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.020 | 1574 | Summarization. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.021 | 1575 | Question answering. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R26.022 | 1576 | Citation verification. | IN_PROGRESS | PDF ingestion and Office inspection exist; complete authorized file-intelligence matrix remains open. |
| R27.001 | 1592 | Illustrations. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.002 | 1593 | Educational diagrams. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.003 | 1594 | Posters. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.004 | 1595 | Study graphics. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.005 | 1596 | Concept art. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.006 | 1597 | Logos. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.007 | 1598 | Presentation illustrations. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.008 | 1599 | Creative scenes. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.009 | 1600 | Backgrounds. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.010 | 1601 | Transparent assets where supported. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.011 | 1609 | Image editing — Editing uploaded images. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.012 | 1610 | Image editing — Editing generated images. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.013 | 1611 | Image editing — Changing style. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.014 | 1612 | Image editing — Adding or removing elements. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.015 | 1613 | Image editing — Changing backgrounds. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.016 | 1614 | Image editing — Aspect-ratio variations. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.017 | 1615 | Image editing — Controlled region editing when supported. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.018 | 1616 | Image editing — Revision history. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.019 | 1624 | Image interface — Prompt context. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.020 | 1625 | Image interface — Original image. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.021 | 1626 | Image interface — Result preview. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.022 | 1627 | Image interface — Processing feedback. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.023 | 1628 | Image interface — Variations. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.024 | 1629 | Image interface — Download. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.025 | 1630 | Image interface — Further edits. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R27.026 | 1631 | Image interface — Project saving. | IN_PROGRESS | Image generation and manual image operations exist; prompt-based inpainting/object removal/background editing are not live-verified. |
| R28.001 | 1645 | Reading CSV and XLSX files. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.002 | 1646 | Cleaning data. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.003 | 1647 | Detecting missing values. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.004 | 1648 | Aggregations. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.005 | 1649 | Filtering. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.006 | 1650 | Sorting. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.007 | 1651 | Statistical summaries. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.008 | 1652 | Charts. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.009 | 1653 | Trend analysis. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.010 | 1654 | Comparisons. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.011 | 1655 | Formula assistance. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.012 | 1656 | Exporting results. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.013 | 1657 | Generating reports. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.014 | 1663 | Interactive visualizations — Line graphs. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.015 | 1664 | Interactive visualizations — Bar charts. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.016 | 1665 | Interactive visualizations — Scatter plots. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.017 | 1666 | Interactive visualizations — Histograms. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.018 | 1667 | Interactive visualizations — Pie charts when appropriate. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.019 | 1668 | Interactive visualizations — Tables. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.020 | 1669 | Interactive visualizations — Statistical distributions. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R28.021 | 1670 | Interactive visualizations — Educational dashboards. | IN_PROGRESS | Charts and structured data export exist; full independent Data Studio interaction/analysis acceptance remains open. |
| R29.001 | 1690 | Speech-to-text. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.002 | 1691 | Text-to-speech. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.003 | 1692 | Audio recording. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.004 | 1693 | Audio playback. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.005 | 1694 | Natural voice responses. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.006 | 1695 | Arabic and English processing. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.007 | 1696 | Audio transcription. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.008 | 1697 | Recording cancellation. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.009 | 1698 | Error recovery. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.010 | 1712 | Voice UI — Permission states. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.011 | 1713 | Voice UI — Recording state. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.012 | 1714 | Voice UI — Processing state. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.013 | 1715 | Voice UI — Speaking state. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.014 | 1716 | Voice UI — Pause. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.015 | 1717 | Voice UI — Stop. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.016 | 1718 | Voice UI — Mute where applicable. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.017 | 1719 | Voice UI — Cancellation. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R29.018 | 1720 | Voice UI — Accessible transcripts. | IN_PROGRESS | Fanar STT/TTS handlers exist; live authenticated speech-provider calls are unverified. |
| R30.001 | 1728 | Asking questions about uploaded images. | IN_PROGRESS | Uploaded image/document input paths exist in part; complete screen understanding and multimodal acceptance remain open. |
| R30.002 | 1729 | Reading diagrams. | IN_PROGRESS | Uploaded image/document input paths exist in part; complete screen understanding and multimodal acceptance remain open. |
| R30.003 | 1730 | Explaining screenshots. | IN_PROGRESS | Uploaded image/document input paths exist in part; complete screen understanding and multimodal acceptance remain open. |
| R30.004 | 1731 | Understanding visual educational material. | IN_PROGRESS | Uploaded image/document input paths exist in part; complete screen understanding and multimodal acceptance remain open. |
| R30.005 | 1732 | Analyzing photographs of handwritten notes where supported. | IN_PROGRESS | Uploaded image/document input paths exist in part; complete screen understanding and multimodal acceptance remain open. |
| R30.006 | 1733 | Capturing a screen image with permission. | IN_PROGRESS | Uploaded image/document input paths exist in part; complete screen understanding and multimodal acceptance remain open. |
| R31.001 | 1749 | Structured multi-step work. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.002 | 1750 | Long-running document generation. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.003 | 1751 | Research reports. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.004 | 1752 | Processing large uploaded datasets. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.005 | 1753 | Scheduled learning reminders. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.006 | 1754 | Revision schedules. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.007 | 1755 | Periodic study summaries. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.008 | 1756 | Progress notifications. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.009 | 1757 | Authorized task continuation. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.010 | 1767 | Task interface — Task title. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.011 | 1768 | Task interface — Actual progress. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.012 | 1769 | Task interface — Current stage. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.013 | 1770 | Task interface — Completion state. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.014 | 1771 | Task interface — Cancellation. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.015 | 1772 | Task interface — Safe retry. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.016 | 1773 | Task interface — Generated results. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.017 | 1774 | Task interface — Failure details. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R31.018 | 1775 | Task interface — Notification preferences. | NOT_STARTED | No durable universal background-task runner has been verified; keep long-running task execution unverified. |
| R32.001 | 1785 | Calendar. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.002 | 1786 | Email. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.003 | 1787 | Cloud storage. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.004 | 1788 | Document services. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.005 | 1789 | Learning management systems. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.006 | 1790 | GitHub. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.007 | 1791 | Other approved providers. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.008 | 1801 | Sending messages. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.009 | 1802 | Deleting files. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.010 | 1803 | Changing external account data. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.011 | 1804 | Publishing content. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.012 | 1805 | Making purchases. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.013 | 1806 | Executing privileged actions. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R32.014 | 1812 | Browser and computer-use capabilities — Treat autonomous browser interaction as an optional advanced capability requiring its own isolated environment, user consent, security controls, and tested provider support. Do not claim that ordinary web-search integration is equivalent to full browser control. Do not simulate browser actions through fabricated logs. | NOT_STARTED | No full connected-app action integration is verified; treat external write actions as unimplemented/unverified. |
| R33.001 | 1828 | Related conversations. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.002 | 1829 | Uploaded files. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.003 | 1830 | Generated artifacts. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.004 | 1831 | Study resources. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.005 | 1832 | Project instructions. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.006 | 1833 | Relevant memories. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.007 | 1834 | Research reports. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.008 | 1835 | Task history. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.009 | 1847 | Project features — Create. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.010 | 1848 | Project features — Rename. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.011 | 1849 | Project features — Archive. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.012 | 1850 | Project features — Delete. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.013 | 1851 | Project features — Upload resources. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.014 | 1852 | Project features — Attach conversations. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.015 | 1853 | Project features — Search project content. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.016 | 1854 | Project features — Share only where an actual access-control model exists. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.017 | 1855 | Project features — Manage project instructions. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R33.018 | 1856 | Project features — Control project memory. | IN_PROGRESS | Project/file library surface exists; end-to-end reusable AI Projects acceptance remains open. |
| R34.001 | 1868 | Owner. | IN_PROGRESS | Owner-scoped artifact storage and revision persistence exist; full library lifecycle/retention tests remain open. |
| R34.002 | 1869 | File type. | IN_PROGRESS | Owner-scoped artifact storage and revision persistence exist; full library lifecycle/retention tests remain open. |
| R34.003 | 1870 | Source conversation. | IN_PROGRESS | Owner-scoped artifact storage and revision persistence exist; full library lifecycle/retention tests remain open. |
| R34.004 | 1871 | Project. | IN_PROGRESS | Owner-scoped artifact storage and revision persistence exist; full library lifecycle/retention tests remain open. |
| R34.005 | 1872 | Creation timestamp. | IN_PROGRESS | Owner-scoped artifact storage and revision persistence exist; full library lifecycle/retention tests remain open. |
| R34.006 | 1873 | Version. | IN_PROGRESS | Owner-scoped artifact storage and revision persistence exist; full library lifecycle/retention tests remain open. |
| R34.007 | 1874 | Storage location. | IN_PROGRESS | Owner-scoped artifact storage and revision persistence exist; full library lifecycle/retention tests remain open. |
| R34.008 | 1875 | File status. | IN_PROGRESS | Owner-scoped artifact storage and revision persistence exist; full library lifecycle/retention tests remain open. |
| R34.009 | 1876 | Processing metadata. | IN_PROGRESS | Owner-scoped artifact storage and revision persistence exist; full library lifecycle/retention tests remain open. |
| R34.010 | 1877 | Retention policy. | IN_PROGRESS | Owner-scoped artifact storage and revision persistence exist; full library lifecycle/retention tests remain open. |
| R35.001 | 1889 | The current General, Models, Voice, and Privacy tabs must be comprehensively reviewed. Design an intuitive settings experience that encompasses all relevant capabilities. Suggested sections: | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.002 | 1897 | General — Default language. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.003 | 1898 | General — Conversation preferences. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.004 | 1899 | General — Keyboard behavior. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.005 | 1900 | General — Default response presentation. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.006 | 1901 | General — Confirmation preferences. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.007 | 1902 | General — Chat history behavior. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.008 | 1906 | Appearance — Color palette. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.009 | 1907 | Appearance — Light and dark presentation where supported. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.010 | 1908 | Appearance — Text sizing. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.011 | 1909 | Appearance — Density. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.012 | 1910 | Appearance — Animation preferences. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.013 | 1911 | Appearance — Reduced motion. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.014 | 1912 | Appearance — Display accessibility. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.015 | 1916 | AI & Models — Automatic model routing. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.016 | 1917 | AI & Models — Available verified models. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.017 | 1918 | AI & Models — Model capabilities. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.018 | 1919 | AI & Models — Appropriate advanced controls. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.019 | 1920 | AI & Models — Provider availability. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.020 | 1921 | AI & Models — Explanations of current limitations. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.021 | 1927 | Personalization & Memory — Personalization enablement. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.022 | 1928 | Personalization & Memory — Cross-chat context. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.023 | 1929 | Personalization & Memory — Memory summary. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.024 | 1930 | Personalization & Memory — Corrections. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.025 | 1931 | Personalization & Memory — Privacy controls. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.026 | 1932 | Personalization & Memory — Suggestion personalization. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.027 | 1933 | Personalization & Memory — Project-specific memory. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.028 | 1937 | Voice & Audio — Speech preferences. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.029 | 1938 | Voice & Audio — Voice selection where supported. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.030 | 1939 | Voice & Audio — Playback behavior. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.031 | 1940 | Voice & Audio — Transcription language. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.032 | 1941 | Voice & Audio — Voice availability. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.033 | 1945 | Tools & Integrations — Available capabilities. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.034 | 1946 | Tools & Integrations — Connected accounts. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.035 | 1947 | Tools & Integrations — Permissions. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.036 | 1948 | Tools & Integrations — Provider health. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.037 | 1949 | Tools & Integrations — Advanced integration configuration where authorized. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.038 | 1955 | Files & Artifacts — Library access. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.039 | 1956 | Files & Artifacts — Default export preferences. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.040 | 1957 | Files & Artifacts — Storage use. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.041 | 1958 | Files & Artifacts — File retention. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.042 | 1959 | Files & Artifacts — Download handling. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.043 | 1963 | Notifications & Tasks — Scheduled-task preferences. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.044 | 1964 | Notifications & Tasks — Allowed notification channels. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.045 | 1965 | Notifications & Tasks — Task activity. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.046 | 1966 | Notifications & Tasks — Reminder settings. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.047 | 1970 | Privacy & Data — Chat retention. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.048 | 1971 | Privacy & Data — Temporary-chat policy. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.049 | 1972 | Privacy & Data — Memory controls. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.050 | 1973 | Privacy & Data — Export personal data. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.051 | 1974 | Privacy & Data — Delete permitted data. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.052 | 1975 | Privacy & Data — Connected services. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.053 | 1976 | Privacy & Data — Transparency about external AI processing. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.054 | 1980 | Accessibility — Reduced motion. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.055 | 1981 | Accessibility — Text sizing. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.056 | 1982 | Accessibility — Keyboard shortcuts. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.057 | 1983 | Accessibility — Contrast options. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.058 | 1984 | Accessibility — Screen-reader behavior. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.059 | 1985 | Accessibility — Interaction assistance. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.060 | 1991 | Usage & Limits — Available capabilities. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.061 | 1992 | Usage & Limits — Provider restrictions. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.062 | 1993 | Usage & Limits — Storage limits. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.063 | 1994 | Usage & Limits — Supported quotas. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.064 | 1995 | Usage & Limits — Clear failure explanations. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.065 | 2001 | About Noata AI — Product information. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.066 | 2002 | About Noata AI — Provider disclosures. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.067 | 2003 | About Noata AI — Supported capabilities. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.068 | 2004 | About Noata AI — Privacy documentation. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.069 | 2005 | About Noata AI — Relevant licenses. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R35.070 | 2006 | About Noata AI — Version information. | IN_PROGRESS | Settings tabs exist; the complete settings redesign and every preference/consent path are not accepted. |
| R36.001 | 2024 | Tone. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.002 | 2025 | Clarity. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.003 | 2026 | Accuracy. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.004 | 2027 | Paragraph structure. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.005 | 2028 | Context awareness. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.006 | 2029 | Teaching quality. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.007 | 2030 | Creativity. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.008 | 2031 | Adaptability. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.009 | 2032 | Language matching. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.010 | 2033 | Conciseness. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.011 | 2034 | Explanation depth. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.012 | 2035 | Follow-up relevance. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.013 | 2039 | Adaptive length — For a greeting, respond briefly. For a definition, explain directly. For a difficult lesson, provide useful structure. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.014 | 2059 | Capability honesty — "What can you do?" Noata should dynamically describe verified capabilities. Use the current capability registry rather than a stale hardcoded marketing paragraph. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R36.015 | 2069 | Language and cultural relevance — Speak naturally in the user's requested language. Avoid repetitive greetings and excessive disclaimers. Religious references should be included when relevant, not inserted indiscriminately into unrelated responses. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R37.001 | 2087 | Adaptive explanation. | NOT_STARTED | Full master-spec acceptance remains pending |
| R37.002 | 2088 | Guided problem solving. | NOT_STARTED | Full master-spec acceptance remains pending |
| R37.003 | 2089 | Stepwise lessons. | NOT_STARTED | Full master-spec acceptance remains pending |
| R37.004 | 2090 | Hints. | NOT_STARTED | Full master-spec acceptance remains pending |
| R37.005 | 2091 | Worked examples. | NOT_STARTED | Full master-spec acceptance remains pending |
| R37.006 | 2092 | Understanding checks. | NOT_STARTED | Full master-spec acceptance remains pending |
| R37.007 | 2093 | Quizzes. | NOT_STARTED | Full master-spec acceptance remains pending |
| R37.008 | 2094 | Flashcards. | NOT_STARTED | Full master-spec acceptance remains pending |
| R37.009 | 2095 | Revision plans. | NOT_STARTED | Full master-spec acceptance remains pending |
| R37.010 | 2096 | Topic summaries. | NOT_STARTED | Full master-spec acceptance remains pending |
| R37.011 | 2097 | Interactive diagrams. | NOT_STARTED | Full master-spec acceptance remains pending |
| R37.012 | 2098 | Curriculum-linked assistance. | NOT_STARTED | Full master-spec acceptance remains pending |
| R38.001 | 2116 | Transactional operations. | NOT_STARTED | Full master-spec acceptance remains pending |
| R38.002 | 2117 | Idempotency. | NOT_STARTED | Full master-spec acceptance remains pending |
| R38.003 | 2118 | Anti-abuse rules. | NOT_STARTED | Full master-spec acceptance remains pending |
| R38.004 | 2119 | Ownership verification. | NOT_STARTED | Full master-spec acceptance remains pending |
| R38.005 | 2120 | Clear achievement rules. | NOT_STARTED | Full master-spec acceptance remains pending |
| R38.006 | 2121 | Accurate ledger records. | NOT_STARTED | Full master-spec acceptance remains pending |
| R39.001 | 2143 | Arabic RTL. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.002 | 2144 | English LTR. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.003 | 2145 | Mixed-language text. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.004 | 2146 | Mathematical notation. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.005 | 2147 | Code blocks. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.006 | 2148 | Source links. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.007 | 2149 | Diagrams. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.008 | 2150 | Tables. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.009 | 2151 | Graph labels. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.010 | 2152 | File exports. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.011 | 2153 | Generated suggestions. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.012 | 2154 | Search activity. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.013 | 2155 | Memory settings. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.014 | 2156 | Artifact interfaces. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R39.015 | 2157 | Voice controls. | IN_PROGRESS | Arabic RTL page smoke passed; complete localization audit across all settings/modules remains open. |
| R40.001 | 2169 | Create a unified client/server event contract. Potential event types: Use stable request IDs and sequence handling. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.002 | 2211 | Required behavior — Genuine progressive streaming. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.003 | 2212 | Required behavior — Correct partial Markdown handling. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.004 | 2213 | Required behavior — No broken unclosed structured components. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.005 | 2214 | Required behavior — Safe source updates. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.006 | 2215 | Required behavior — Real tool progress. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.007 | 2216 | Required behavior — Cancellation. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.008 | 2217 | Required behavior — Timeout handling. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.009 | 2218 | Required behavior — Retry safety. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.010 | 2219 | Required behavior — Idempotent persistence. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.011 | 2220 | Required behavior — Reconnection recovery where supported. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.012 | 2221 | Required behavior — No duplicate assistant messages. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.013 | 2222 | Required behavior — No history corruption. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R40.014 | 2223 | Required behavior — No stale results inserted after switching chats. | IN_PROGRESS | PR #18 SSE byte decoder/final-frame handling and typing caret passed CI #1266; full provider-stream E2E remains open. |
| R41.001 | 2237 | Authentication. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.002 | 2238 | Role-based authorization. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.003 | 2239 | Supabase RLS. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.004 | 2240 | Conversation ownership. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.005 | 2241 | Memory ownership. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.006 | 2242 | Artifact ownership. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.007 | 2243 | Project isolation. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.008 | 2244 | Server-side API secrets. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.009 | 2245 | Attachment validation. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.010 | 2246 | Output sanitization. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.011 | 2247 | Search prompt-injection protection. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.012 | 2248 | SSRF protection. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.013 | 2249 | Resource limits. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.014 | 2250 | Provider quota enforcement. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.015 | 2251 | Cost controls. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.016 | 2252 | Secure temporary storage. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.017 | 2253 | Audit logs. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.018 | 2254 | Sensitive-action confirmation. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.019 | 2255 | Appropriate rate limiting. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.020 | 2265 | Student and minor safety — Noata may serve school-age users. Account for age-appropriate consent, data minimization, educational integrity, and applicable child privacy requirements. Do not build unnecessary sensitive personal profiling. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.021 | 2281 | Operational limits — Rate limits. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.022 | 2282 | Operational limits — Token limits. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.023 | 2283 | Operational limits — Storage limits. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.024 | 2284 | Operational limits — Search quotas. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.025 | 2285 | Operational limits — Generation costs. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.026 | 2286 | Operational limits — Request budgets. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.027 | 2287 | Operational limits — Provider outages. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.028 | 2288 | Operational limits — Timeouts. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R41.029 | 2289 | Operational limits — Unsupported file types. | IN_PROGRESS | CI #1268 authorization checks passed and production dependency audit reports no known vulnerabilities; full threat-model/all-role E2E remains open. |
| R42.001 | 2305 | Initial page load. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.002 | 2306 | Composer responsiveness. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.003 | 2307 | Streaming render performance. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.004 | 2308 | Conversation history. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.005 | 2309 | Long responses. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.006 | 2310 | Interactive graph updates. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.007 | 2311 | Image loading. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.008 | 2312 | File previews. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.009 | 2313 | Animations. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.010 | 2314 | Sidebar transitions. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.011 | 2315 | Mobile keyboards. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.012 | 2316 | Bundle splitting. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.013 | 2317 | Memory consumption. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.014 | 2318 | Network recovery. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.015 | 2330 | Responsive breakpoints — 320px. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.016 | 2331 | Responsive breakpoints — 375px. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.017 | 2332 | Responsive breakpoints — 390px. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.018 | 2333 | Responsive breakpoints — 768px. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.019 | 2334 | Responsive breakpoints — 1024px. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R42.020 | 2335 | Responsive breakpoints — 1440px. | IN_PROGRESS | CI #1268 responsive browser smoke passed at 320/390/1440px; source-required 375/768/1024px and low-end profiling remain open. |
| R43.001 | 2351 | Phase 1 — Complete audit — Inspect all code, AI components, tools, routes, settings, models, and permissions. Record the exact initial repository state. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.002 | 2357 | Phase 2 — New design foundation — Build the Noata AI design tokens, typography, spacing system, component primitives, and original motion language. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.003 | 2361 | Phase 3 — Full interface transformation — Rebuild the main AI workspace, sidebar, composer, welcome screen, menus, panels, modals, and settings. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.004 | 2365 | Phase 4 — Intelligent suggestion engines — Implement four new-chat suggestions and contextual post-response follow-ups. Add caching, freshness evaluation, structured generation, and soft animations. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.005 | 2371 | Phase 5 — Cross-chat memory — Implement consent, storage, retrieval, source linkage, correction, deletion, project scope, and privacy safeguards. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.006 | 2375 | Phase 6 — Universal capability engine — Refactor fragmented tool execution into a typed, authorized orchestration system. Preserve useful existing Fanar capabilities. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.007 | 2381 | Phase 7 — Intelligent research — Improve automatic search and add the collapsible, truthful research activity experience. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.008 | 2385 | Phase 8 — Adaptive UI — Expand interactive responses, validated schemas, safe component rendering, and educational interactions. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.009 | 2389 | Phase 9 — Artifact creation — Implement reliable PDF, DOCX, XLSX, PPTX, and other prioritized generation pipelines. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.010 | 2393 | Phase 10 — Creative and multimodal workspaces — Implement verified image creation, file intelligence, data analysis, writing tools, and supported voice capabilities. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.011 | 2397 | Phase 11 — Projects and background tasks — Add organized reusable workspaces and safe task execution. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.012 | 2401 | Phase 12 — Complete localization — Finish Arabic and English across every redesigned feature. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.013 | 2405 | Phase 13 — Visual and motion polish — Audit all color palettes, responsiveness, animations, and accessibility. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R43.014 | 2409 | Phase 14 — Production engineering and QA — Perform security, performance, provider, database, and full browser testing. Do not declare the project complete merely because the frontend builds. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.001 | 2421 | A. New chat suggestions — Start a new conversation. Verify four suggestions appear immediately. Verify each represents a valid action. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.002 | 2437 | B. Cross-chat memory — Tell Noata an appropriate learning preference with memory enabled. Start another eligible conversation. Verify relevant context can be retrieved. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.003 | 2455 | C. Follow-up suggestions — Ask a mathematics question. Verify three relevant follow-up suggestions appear after completion. Verify it initiates the intended action. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.004 | 2467 | D. Automatic search — Ask for recent scientific discoveries. Verify a genuine search takes place when configured. Verify the UI displays actual search activity. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.005 | 2483 | E. Search not required — Ask a basic arithmetic question. Verify the assistant responds without unnecessary external search. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.006 | 2489 | F. Real PDF creation — Request a multipage Arabic study document. Verify an actual PDF is generated. Open and render it. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.007 | 2499 | G. DOCX creation — Request an editable Word document. Open and inspect the generated file. Verify headings, text, layout, and RTL formatting. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.008 | 2507 | H. XLSX creation — Request a spreadsheet with formulas and charts. Verify formulas, calculated values, data structure, and charts. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.009 | 2513 | I. PPTX creation — Request a presentation. Verify every slide is valid, readable, editable, and correctly laid out. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.010 | 2519 | J. Image generation — Request a supported image. Verify the actual provider generates an image. Verify preview, download, and revision behavior. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.011 | 2527 | K. Adaptive UI — Ask for an interactive mathematical explanation. Verify the component is real, responsive, and mathematically correct. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.012 | 2533 | L. Settings — Open and interact with every AI settings section. Verify each control works, persists where appropriate, and has an understandable effect. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.013 | 2539 | M. Language — Repeat major workflows in Arabic and English. Check all visible controls, messages, artifacts, and directionality. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.014 | 2545 | N. Themes — Repeat visual testing in all six palettes. Verify contrast, borders, code blocks, diagrams, dialogs, and menus. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.015 | 2551 | O. Motion — Test entry, exit, interruption, rapid clicking, resizing, reduced motion, and low-performance devices. No broken transitions or layout jumps. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.016 | 2557 | P. Security — Test user isolation, unauthorized project access, search injection, file abuse, unsafe links, and resource limits. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R44.017 | 2561 | Q. Recovery — Simulate unavailable AI providers, failed search, failed artifact rendering, cancelled generation, account switching, and network loss. Verify accurate errors and safe recovery. | IN_PROGRESS | Full master-spec acceptance remains pending |
| R45.001 | 2573 | TypeScript typechecks. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.002 | 2574 | Production builds. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.003 | 2575 | Unit tests. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.004 | 2576 | Integration tests. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.005 | 2577 | API contract tests. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.006 | 2578 | Database authorization tests. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.007 | 2579 | Search-provider integration tests. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.008 | 2580 | File-format validation tests. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.009 | 2581 | Browser end-to-end tests. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.010 | 2582 | Accessibility checks. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.011 | 2583 | Responsive screenshot comparisons. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.012 | 2584 | Animation and reduced-motion checks. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.013 | 2585 | Performance profiling. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.014 | 2586 | Security regression tests. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.015 | 2596 | Visual regression targets — Empty AI workspace. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.016 | 2597 | Visual regression targets — Generated welcome suggestions. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.017 | 2598 | Visual regression targets — Mid-conversation. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.018 | 2599 | Visual regression targets — Streaming. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.019 | 2600 | Visual regression targets — Completed response. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.020 | 2601 | Visual regression targets — Research activity expanded. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.021 | 2602 | Visual regression targets — Research activity collapsed. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.022 | 2603 | Visual regression targets — Generated follow-up suggestions. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.023 | 2604 | Visual regression targets — Interactive mathematics. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.024 | 2605 | Visual regression targets — Quizzes. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.025 | 2606 | Visual regression targets — File generation progress. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.026 | 2607 | Visual regression targets — Document preview. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.027 | 2608 | Visual regression targets — Artifact library. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.028 | 2609 | Visual regression targets — AI settings sections. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.029 | 2610 | Visual regression targets — Memory management. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.030 | 2611 | Visual regression targets — Project workspace. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.031 | 2612 | Visual regression targets — Errors. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.032 | 2613 | Visual regression targets — Arabic mode. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.033 | 2614 | Visual regression targets — English mode. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.034 | 2615 | Visual regression targets — Every color palette. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R45.035 | 2616 | Visual regression targets — Mobile, tablet, and desktop. | IN_PROGRESS | CI #1268 passed typecheck, modern/legacy tests, build, database authorization, artifact fixtures, browser RTL/responsive, HTTP smoke and exact-revision gates; authenticated provider acceptance remains open. |
| R46.001 | 2626 | Do not merge PR #3 without authorization. Do not change the official production domain. Do not perform destructive production database operations. | IN_PROGRESS | Renaissance PR #3 remains separate/unmerged; PRs #18/#19 were independent streaming/document and dependency-hardening releases. |
| R47.001 | 2656 | The transformation is complete only when the following have been verified: | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.002 | 2660 | Complete interface — Every AI page, tab, tool, submenu, panel, setting, dialog, and relevant nested interface uses the unified modern design. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.003 | 2664 | Premium motion — The full interface has consistent, beautiful, accessible, soft animations with appropriate reduced-motion support. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.004 | 2668 | Intelligent welcome — Exactly four personalized new-chat suggestions appear reliably, with intelligent freshness evaluation and appropriate generation. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.005 | 2672 | Contextual next steps — Completed answers generate useful, actionable follow-up suggestions without slowing down response delivery. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.006 | 2676 | Genuine memory — Authorized cross-chat context retrieval works, with transparent privacy controls, corrections, deletion, and project scope. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.007 | 2680 | Genuine automatic search — Search occurs when appropriate without a required toggle. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.008 | 2684 | Transparent research activity — Users can see whether and what Noata searched, inspect genuine search activity, and expand or collapse the results. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.009 | 2688 | Rich adaptive responses — The AI selects appropriate visual and interactive formats while preserving readable normal conversation. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.010 | 2692 | Real file creation — Prioritized supported formats generate real, validated, downloadable files. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.011 | 2696 | Creative capabilities — Implemented image, writing, visualization, and other creative workflows work end to end. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.012 | 2700 | Reliable tool orchestration — The new capability architecture routes, executes, validates, and reports operations correctly. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.013 | 2704 | Full bilingual support — Arabic and English work across the entire AI experience. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.014 | 2708 | Security and reliability — Authentication, authorization, privacy, persistence, quotas, and error recovery meet the verified requirements. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R47.015 | 2712 | Complete testing — Relevant automated and manual checks pass, with evidence. Never claim that a blocked feature is complete. Never claim all providers are operational without live verification. Never claim production readiness before the applicable release gates are satisfied. | NOT_STARTED | The source definition-of-done is not met; provider checks, feature groups and authenticated E2E requirements remain unverified. |
| R48.001 | 2728 | A complete repository audit. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.002 | 2729 | A feature and provider capability matrix. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.003 | 2730 | The redesigned Noata AI workspace. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.004 | 2731 | The redesigned entire AI settings experience. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.005 | 2732 | The unified animation design system. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.006 | 2733 | Dynamic four-suggestion welcome experience. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.007 | 2734 | Contextual follow-up generation. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.008 | 2735 | User-controlled cross-chat memory. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.009 | 2736 | A unified AI capability registry and orchestrator. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.010 | 2737 | Upgraded automatic web research. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.011 | 2738 | Collapsible and truthful search activity. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.012 | 2739 | An expanded safe interactive response renderer. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.013 | 2740 | Real artifact generation and validation. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.014 | 2741 | Upgraded Writing Studio. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.015 | 2742 | Supported image and multimodal capabilities. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.016 | 2743 | Data analysis and chart functionality. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.017 | 2744 | Complete Arabic and English integration. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.018 | 2745 | Project and artifact persistence. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.019 | 2746 | Secure migrations and backend changes. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.020 | 2747 | Appropriate unit, integration, and browser tests. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.021 | 2748 | Representative screenshots. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.022 | 2749 | Performance and accessibility evidence. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.023 | 2750 | Documentation for provider configuration and operational limits. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.024 | 2751 | Commits and pull-request updates. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |
| R48.025 | 2752 | A verified completion report separating finished work from genuine blockers. | IN_PROGRESS | Production fixes are merged and released; this traceability expansion does not imply complete product acceptance. |

## Release evidence and remaining acceptance

- Latest production revision: `75283f8447c0e3b5735ea643998ae23d0ad2e470`.
- CI #1268 passed the frozen-lockfile install, TypeScript, modern and legacy tests, production build, database authorization checks, PDF/DOCX fixtures, real-browser RTL/responsive smoke, production HTTP smoke, and exact-revision release-evidence gate.
- PR #18 changed SSE decoding/final-frame handling, streaming render cost, reduced-motion typing feedback, and staged multi-edit Office revisions. CI #1266 passed.
- PR #19 removed vulnerable transitive browser dependencies; `pnpm audit --prod` reported no known vulnerabilities. CI #1268 passed, and the release was promoted to the main domain.
- Local real export smoke passed for Arabic PDF/DOCX, native multi-page PDF, chart/prose rendering, and alternate-font PDF output.
- Still not live-verified: authenticated Fanar chat/image/speech; authenticated Brave results/metadata; account-switch privacy tests; every-role authenticated E2E; comprehensive Arabic/English localization; inpainting/background removal; arbitrary PDF text/layout replacement; durable background tasks and connected-app write actions.
- Do not upgrade Supabase plans, change production secrets, or trigger paid provider calls automatically. Provider verification needs an authorized staging account and explicit cost-aware test execution.

