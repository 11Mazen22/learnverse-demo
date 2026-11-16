/**
 * Canonical, public support identity.
 *
 * Every public surface (marketing pages, Help Center, FAQ, legal pages) must use
 * this constant instead of a personal mailbox so no individual address is ever
 * rendered into HTML or JSON responses. Server-side delivery may override the
 * inbox with `NOATA_SUPPORT_EMAIL` (see `email-dispatcher.ts`).
 */
export const SUPPORT_EMAIL = "support@noata.app";
export const SUPPORT_EMAIL_HREF = `mailto:${SUPPORT_EMAIL}`;
