# Theme palette account sync — staging rollout

- **Database:** approved isolated staging project `vpfpjvhafkmygetjkfcp` only.
- **Migration:** `noata_palette_account_sync` applied via authorized Supabase connector on 9 October 2026. A new `user_settings.palette` nullable text field has a seven-world check constraint; color mode `theme` remains `light/dark/system`.
- Existing rows are not modified; NULL means the student has not chosen a cross-device palette.
- **RLS:** preexisting owner-only SELECT/INSERT/UPDATE policies on `public.user_settings` remain authoritative. No anonymous account writes.
- **UI:** choose a world -> update device immediately -> upsert account row -> read the saved `palette` back -> show an explicit sync confirmation or local-only status. On next verified session, prefer the account's non-null palette; otherwise retain the device palette.
- **Privacy:** no sensitive student records in URLs or notifications; no history of theme selections.
- **QA not yet certified:** sign in as student A, choose Forest, refresh and sign in on another device; verify Forest. Switch to student B with Ocean, confirm strict account isolation. Disconnect network and verify local-only notice. Switch light/dark/System separately. Inspect 320–1920px visual snapshots for contrast and no color islands.
- This staging migration is **not production authorization**. Prepare deployment, rollback, and monitoring before any production schema change.
