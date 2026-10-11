# Noata AI — Renaissance execution and acceptance contract (active)

This is an ongoing implementation, **not** a declaration that the full AI section is finished.

## Customer experience
- Quiet, contemporary, Arabic-first/English-responsive AI workspace.
- Launchpad routes only to existing user actions: study, writing, data, research, projects, memory.
- Every completed assistant response provides real export controls; PDFs must be produced by an authenticated endpoint with a checked PDF signature. Never claim a file exists when generation fails.
- Typed, schema-validated components; preserve original answer text when an interactive model output is malformed.
- Accessibility, palette-aware designs and reduced-motion support.

## Functional acceptance gates
1. Sign-in, new chat, response, history reload, account switch, sign-out, temporary mode.
2. Welcome suggestions (exactly four); contextual suggestions (genuine 3–4); error fallbacks.
3. Study cards, quizzes and charts via live provider and fallback, not just isolated unit tests.
4. Ask for PDF; preview/export an actual PDF and read the output file to verify fonts and content.
5. Word, Excel, PowerPoint export and Office-compatible readback in bilingual cases.
6. User-owned memory opt-in/read/edit/revoke/delete; ensure no account leakage and no use in temporary chats.
7. Projects + artifacts: create, save, reload, download, delete, cleanup failures, owner isolation.
8. Real search credentials, provider queries, citations and errors.
9. Image/voice actions under real credentialed staging sessions, including denied permissions and quotas.
10. Appearance and settings in all palettes and mobile sizes; WCAG/reduced-motion.
11. Real signed-in automated tests with two isolated staging accounts and safe cleanup.

## Status vocabulary
PASS (exact operation tested); FAIL (reproduced); BLOCKED (credentials/infrastructure); NOT TESTED (no evidence).
Do not equate successful compilation or local fixture playback with authenticated live success.

## Release restrictions
Work only on `noata-aura-platform-overhaul-20261008`. PR #3 remains Draft/unmerged. No production database writes, deploys or secret rotations.
