# Noata design system

Source of truth: apps/web/app/globals.css and components/ui.

Warm cream surfaces, forest green primary actions, lime accents, restrained outlines and Cairo Arabic typography form one shared system. Dark mode replaces semantic surface/text/border tokens. Do not add per-page hardcoded light colors.

Use page-heading/section-heading for hierarchy; panel/metric-card for content; btn/send-btn for primary actions; filter-chip for secondary state; error-banner and role=alert for failures. Shared SVG icons are original Noata assets. Layout flows RTL; code and mixed-language messages use automatic direction.

Desktop has persistent navigation. Smaller widths use a mobile dock and all-routes dialog; the AI workspace uses a history drawer. Dialog uses native showModal, Escape and focus containment. Respect system and persisted reduced-motion preferences.

Typography, tap-target size, contrast, overflow and focus order still require rendered browser QA across the matrix in TESTING.md. Do not claim accessibility conformance solely from source review.
