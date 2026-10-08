# Noata — Arabic-first Supabase Auth email templates and Google sign-in

These files are **reviewed repository artifacts, not live Supabase configuration**. Do not report that email delivery or Google sign-in works until an authenticated staging test proves it.

**Staging-only:** `vpfpjvhafkmygetjkfcp`. Production `jdkfqdzgphzqbbzmerzr` must remain untouched.

## Email templates

Each HTML file contains mobile-friendly, table-based RTL layout and inline CSS. It uses the Supabase-generated `{{ .ConfirmationURL }}` for the action link; do not replace the placeholder with a fixed URL.

| Supabase Dashboard → Authentication → Email Templates | File | Subject |
| --- | --- | --- |
| Confirm signup | `confirm-signup.html` | أكّد بريدك الإلكتروني · Noata |
| Reset password | `recovery.html` | استعادة كلمة مرور حسابك · Noata |
| Magic Link | `magic-link.html` | رابط الدخول الآمن إلى Noata |
| Invite user | `invite.html` | دعوتك إلى Noata |
| Change email address | `change-email.html` | تأكيد تغيير البريد · Noata |

To activate: in the **staging project only**, paste each complete HTML template into its matching template editor, set its subject, and save. Confirm that exact staging redirect URLs are allow-listed. Send genuine emails to disposable test inboxes, check expired links, dark/light email-client rendering and plain-text fallback, and record delivery evidence. Supabase's default SMTP service may impose delivery limits; any paid SMTP subscription needs separate approval.

## Google OAuth — staging implementation checklist

Noata's login UI already invokes `supabase.auth.signInWithOAuth({ provider: "google" })`, with the PKCE callback page at `/auth/callback`. This frontend is **not** sufficient to enable the provider.

1. In a Google Cloud project controlled by the owner, create/configure the OAuth consent screen. Restrict to approved **test users** while the app is under test.
2. Create a Google OAuth **Web application** client. Its Authorized redirect URI must be **exactly** `https://vpfpjvhafkmygetjkfcp.supabase.co/auth/v1/callback`. Follow Google's origin guidance if requested. Do not use the Vercel /auth/callback path as Google's redirect URI.
3. In staging Supabase Dashboard → Authentication → Providers → Google, enable the provider using the Google Client ID and Client Secret. Never put the Client Secret into `NEXT_PUBLIC_*`, Git history, CI logs, or chat.
4. In staging Supabase Dashboard → Authentication → URL Configuration, set a reviewed staging site origin and allow-list the **exact** latest staged Vercel host and its `/auth/callback` and password-reset URLs. Avoid unrestricted wildcards.
5. Run disposable Google test-user sign-in, denied-consent, logout, expired redirect, account/profile creation and session-persistence tests. Verify password users are not merged with Google identities unexpectedly. Authentication data must remain in staging.
6. If provider settings and credentials are not supplied, report **GOOGLE AUTH LIVE VERIFICATION: BLOCKED** and do not pretend the button is an enabled service.

## Important scope notes

- No production Google provider configuration was changed.
- No live Auth email templates were updated.
- A READY Preview or green CI does not prove email delivery, Google OAuth, or real Fanar conversations.
- `scripts/email-templates.test.mjs` performs static structural checks; live client and email verification remain mandatory.
