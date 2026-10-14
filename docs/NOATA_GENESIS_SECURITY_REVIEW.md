# Genesis security review

## Changes reviewed

- Search requests remain authenticated through the existing gateway/handler and per-user quota. Only Brave's fixed HTTPS endpoint receives queries. Redirects fail; responses and durations are bounded. Source URLs never become arbitrary network fetches.
- Domain filtering uses exact host or `.` subdomain suffix, not substring matching. A `nasa.gov.evil.org` result cannot satisfy official NASA scope. Model query rewriting cannot remove the human-derived authority scope.
- Retrieved text remains untrusted evidence. No retrieved page can choose credentials, endpoints, roles or tools. A prompt-injection corpus and live semantic claim fidelity are still acceptance work.
- Persisted source data cannot supply arbitrary fields, duplicate IDs, spoofed publisher domains or invalid retrieval timestamps. Citations to unretrieved destinations trigger review and are not actionable links in researched replies.
- OOXML edits allow only narrowly selected existing text/cell parts. ZIP bounds, path traversal, duplicate entries, encrypted/signed/macro packages, expansion/part limits, CRCs and stale target content are checked. No XML entity processing or arbitrary XML writes.
- PDF edits require every source page exactly once. This intentionally cannot serve as redaction. Active-action, signed, encrypted and form-bearing inputs fail closed. Existing page resources are retained; arbitrary third-party fidelity is not guaranteed.
- Owner identity is revalidated before saving; original files are never overwritten. Existing database/Storage RLS enforces owner paths and lineage. Client cancellation guards suppress late account/source continuations. Cleanup after ambiguous storage failure remains best effort.
- Preview-only overrides disable inherited unrelated privileged configuration. No production configuration or policies are changed.

## Verification and residual risk

Deterministic malicious/archive/citation/scope checks pass in the source suite. Real cross-account Storage/Auth tests remain unverified. After the initial approval-review usage failure cleared, native read-only SQL verified both projects at 33 migrations/38 public tables/all RLS, with anonymous document-probe execution denied. Fresh staging advisors retain the intentional server-only receipt-table no-policy notice and authenticated SECURITY DEFINER notices. Definition review confirms the admin-only guard and owner-scoped document probe. Leaked-password protection remains disabled; no paid feature was activated. Remediation references: [receipt RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [privileged function review](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

The public Fanar OpenAPI inspected in this session declares `/v1/images/generations` but no image-editing path. No fictional editing API or generative-background-removal claim was added. Enabling a new billed provider requires actual supported integration and authorization.

`pdf-lib` is pinned with lockfile integrity records. Full production browser/runtime, dependency advisory and provider-security acceptance are not replaced by these code-level checks.
