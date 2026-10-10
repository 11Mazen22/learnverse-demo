# Isolated staging migration review

Target: **vpfpjvhafkmygetjkfcp** only. Existing **jdkfqdzgphzqbbzmerzr is excluded**. No remote SQL, Auth, Storage or Edge Function operation was performed. The user's latest connected inspection reported zero application tables, migrations, users and functions. Reinspect this state before execution; never reset an existing schema.

## Review findings and repairs

All 18 original base migrations were read in dependency order. Local PostgreSQL 17 reproduces a syntax error at the first `as $ select` in `0007`. Six SQL wrappers now use valid `$$` delimiters. This historical-file correction is necessary to initialize a fresh database; it does not reapply or modify any existing deployment.

The additive `20261008170000_learning_authorization_hardening.sql` addresses concrete authorization and transaction defects:

- A lesson RPC previously accepted a caller-supplied score and rewarded completion without any attempts. Completion now requires correct primary/parallel-variant answers, an active unlocked course/unit, and the prerequisite. Score is calculated from stored first attempts; the API parameter is retained for compatibility.
- Unit Boss's unqualified `a.question_id=question_id` could match the inner row itself, treating an unrelated correct answer as all three boss answers. The requested ID is now explicitly qualified; tests exercise zero and three earned answers.
- Attempt and purchase RPCs serialize per user, reject reused keys with changed payloads, and preserve their persisted receipts. Internal implementation helpers have no client execution grant. Two concurrent real PostgreSQL sessions verify one attempt and one reward.
- Teachers could bypass the admin publish RPC through broad table grants. Content writes now use the existing guarded creation/transition RPCs; direct question/answer-key writes are revoked from API client roles.
- Attachment metadata now validates conversation/message ownership and storage path prefix. Submission identity cannot be reassigned after insertion. Teacher access to student profiles/learning records is limited to assigned classes.

These corrections are unapplied to Supabase. Private document retention remains excluded and disabled.

## Original migration inventory

| Migration | Dependencies and review conclusion |
| --- | --- |
| 0001 core | Requires `auth.users`, `auth.uid()`, API roles and pgcrypto. Profiles default to student regardless of user metadata; profile role/XP/coins update grants are restricted. RLS covers every created table. Initial broad staff/attempt policies are superseded below. |
| 0002 AI usage | Requires profiles. Service-role-only quota RPC, advisory lock and usage window pruning; direct clients receive no useful usage policy. Provider invocation remains unverified. |
| 0003 learning transactions | Requires questions, hidden keys, ledger and profiles. Ledger trigger updates balances transactionally. Initial score trust and concurrent duplicate handling are corrected by the additive migration. |
| 0004 classrooms | Requires profiles/questions; creates scoped classes, assignments, missions, rewards, attachment metadata and notifications. Later policies supersede draft visibility, grading and attachment ownership weaknesses. Reward claims lock the owned box and deduplicate ledger entries. |
| 0005 storage | Requires Supabase `storage.buckets`, `storage.objects`, `storage.foldername`. Creates private uploads/generated buckets, bounded MIME/size configuration and owner-prefix policies. Generated objects cannot be inserted by clients. This is existing media storage, not retained documents. |
| 0006 core hardening | Introduces private security helpers with empty search paths, replaces auth trigger and core policies; restricts profile updates and public helper execution. |
| 0007 transaction/classroom hardening | Moves security-definer implementations into private, adds invoker RPCs, restricts attempt mutations and notification updates. Six invalid SQL delimiters repaired. Policies are subsequently tightened for assignments, teacher visibility and attachment ownership. |
| 0008 content model | Adds question parents, choices, types and checks/indexes. No dropped user tables/columns. Constraint replacement requires valid existing data; fresh initialization is the reviewed path. |
| 0009 demo seed | Deterministic, explicitly illustrative science content, hidden answer keys and shop items. Upserts can overwrite those fixed IDs: never replay against a populated project without separate review. No users, credentials or production records copied. |
| 0010 completion workflows | Settings RLS; boss, role and content transition RPCs; teacher grading policy. Role changes require an existing admin and refuse self-change. Boss scoring corrected additively. |
| 0011 policy/index cleanup | Replaces submission policies and removes two redundant indexes, without dropping data tables. Graded student updates remain denied. |
| 0012 assignment visibility | Students see/submit only published assignments in their own class; managers can see drafts. Tests cover foreign/draft denial. |
| 0013 content/notifications | Draft creation inserts question/key atomically; staff only. Publish/grade triggers notify intended students. Direct client writes are tightened additively. |
| 0014 account lifecycle | Signup creates profile/settings/welcome with hardcoded student role. Admin role changes clean stale memberships/access and record audit/notification. |
| 0015 curriculum authoring | Admin-only write policies for course/unit/lesson/skill; ordinary public reads retain existing course visibility. |
| 20261007144203 request receipts | Service-role-only inference receipt table and index. A rollback comment is not executable destructive SQL. TTL pruning requires the actual Edge Function; not verified locally. |
| 20261007201149 usage summary | Admin-checked, bounded recent usage summary; student denial tested. |
| 20261007215014 quota execution | Service-role-only definer wrapper reaches private quota implementation without exposing private schema to clients. |

## Validation and execution limits

`node scripts/database-migrations-smoke.mjs` initializes all **19** included migrations transactionally in a pinned disposable PostgreSQL container, with no external network or published port. Its auth/storage fixture models schemas, grants and claims explicitly. Positive and negative SQL tests cover role escalation, owner/class isolation, answer keys, attachment/storage paths, earned scores/rewards, grading, notifications and concurrent attempt idempotency. Artifacts include migration hashes, full SQL log, exact source revision and outcome. This is real PostgreSQL policy execution with simulated claims; it is **not** live Supabase login, JWT validation, REST grants, Storage API bytes/signed URLs, provider execution or hosted migration evidence.

Base initialization is **not replay-idempotent**: enum/table/policy creation and function renaming intentionally fail on a populated schema. Seed and some policy/index operations individually support replacement; that does not make the entire chain replayable. The review bundle refuses an existing Noata schema and wraps initialization in a transaction. Apply through an authorized migration mechanism that records migration history, after confirming exact project, empty schema/history, all file hashes and retention exclusion. Do not blindly submit an old raw SQL request or mark migration history applied without execution.

The excluded `20261008150000_private_ai_documents.sql` contains its own transaction, private document bucket, metadata, limits and cleanup policies. It was read to confirm the boundary but has **not** been approved for application or validated as a live Storage lifecycle. Keep `NOATA_DOCUMENT_STORAGE_ENABLED=false`.

Secure staging management credentials, public build URL/key, provider settings, preview origin and dedicated QA accounts are still absent from this execution environment. The next authorized operator must configure these securely, apply the reviewed base chain only to staging, assign QA roles through trusted admin/server control, and run the full real integration matrix. No paid upgrade, production mutation or retained-document enablement is authorized by this review.
