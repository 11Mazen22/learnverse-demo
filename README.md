# Learning Platform / منصة التعلّم

An Arabic-first, bilingual demonstration MVP for curriculum quests, explainable mastery, rewards, cosmetics, and scoped teacher insights.

The included science material is **original demonstration content**. It is not an approved syllabus and must not be presented as one.

## Run locally

Requirements: Node.js 22 or newer. There are no third-party runtime dependencies.

```powershell
npm start
```

Open [http://localhost:3000](http://localhost:3000).

Demo accounts (password: `demo123`):

- Student: `student@demo.local`
- Teacher: `teacher@demo.local`
- Administrator: `admin@demo.local`

The server creates `data/app.json` on first start. Delete that file only when you intentionally want a fresh demo seed.

## Verify

```powershell
npm run check
```

The test suite covers scoring, evidence transitions, assisted work, idempotent ledger entries, atomic purchases, complete lesson reward flow, one-time Boss rewards, and role boundaries.

## Architecture

- `server.mjs`: dependency-free HTTP API and static serving
- `lib/store.mjs`: serialized, atomic JSON persistence for a single-node pilot/demo
- `lib/domain.mjs`: scoring, mastery, review, ledger, and purchase rules
- `lib/seed.mjs`: explicitly labeled demonstration users and content
- `public/`: responsive Arabic/English PWA interface
- `test/`: domain and live API workflow tests
- `docs/`: decisions, implementation evidence, authoring, and operations guidance

This is a modular-monolith foundation suitable for a controlled local demo. Before a school pilot, replace the JSON store and demo password scheme with a relational database and production identity provider; see `docs/OPERATIONS.md`.
