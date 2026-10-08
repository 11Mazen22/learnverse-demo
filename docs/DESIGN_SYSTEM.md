# Noata design system

Source of truth: `apps/web/app/globals.css` and `components/ui`. Current evidence is in [the Phase 5 matrix](NOATA_AURA_PHASE5_MATRIX.md).

The supplied Noata identity informs the navy, cyan and white palette and the N with graduation cap and book. `noata-mark.svg` and `noata-mark-light.svg` are vector renditions of the references, rather than pixel copies. `NoataLogo` chooses the surface-appropriate mark. Keep functional SVG icons recognizable; use the logo for identity, welcome areas and assistant avatars.

Local Noto Sans Arabic provides UI typography; Cairo remains the mixed-language/PDF fallback. Use semantic surface, text, border and status tokens in both themes. The pale blue legacy `--lime` token keeps its name for compatibility. Green is reserved for success states. Avoid per-page hardcoded light colors.

Use page-heading/section-heading for hierarchy; panel/metric-card for content; btn/send-btn for primary actions; filter-chip for secondary state; error-banner and role=alert for failures. Shared SVG icons are original Noata assets. Layout flows RTL; code and mixed-language messages use automatic direction.

Desktop has persistent navigation. Smaller widths use a mobile dock and all-routes dialog; the AI workspace uses a history drawer. Dialog uses native showModal, Escape and focus containment. Respect system and persisted reduced-motion preferences.

The homepage combines its brand scene with three learning paths; learning uses a timeline; missions use stages; progress remains an evidence explorer; Quran keeps its reading controls. Guest modules explain actual next steps without fabricating balances or progress. Original file previews stay separate from selected AI context, with explicit partial extraction warnings.

The theme picker focuses the current choice, supports arrows and restores focus on Escape/selection. Public browser evidence covers 12 routes at 1440/390 in both themes, AI at six widths, actual attachments, 200% equivalent AI viewport reflow and reduced motion. Axe is a partial audit; screen-reader and authenticated-state checks remain release gates.

## Asset provenance

- Noata SVG assets are authored from the user's supplied brand references.
- Noto Sans Arabic: Google Fonts `ofl/notosansarabic/NotoSansArabic[wdth,wght].ttf`, retrieved 2026-10-08; repository HEAD observed as `5e8a3ba899557829a76cfdac30fa512bda91d7ca`. Converted to a local Arabic/Latin WOFF2 subset with FontTools/Brotli. Preserve `public/fonts/OFL-NotoSansArabic.txt` (SIL OFL 1.1).
- WOFF2 SHA-256: `7579ad5af7977d0147313ad71996886f5368024da213abfbd330d76f926fffc7`.
- Existing Cairo binaries and upstream attribution in `OPEN_WEBUI_LICENSE_NOTES.md` are retained. Dependencies retain their package licenses.
