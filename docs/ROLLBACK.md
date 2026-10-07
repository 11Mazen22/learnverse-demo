# Rollback

Production baseline: master commit 5c7f6a42cdb3f05b4564d906a75f7178c8b966a5; Vercel deployment dpl_62FCt1LyMDCSYCN2i56h9Fp3c96c (noata-np61x9gc2-noata.vercel.app). Verify current production before acting; do not assume it has not advanced.

The rebuild is isolated to noata-v2-total-redesign and a Preview. No production alias or DNS cutover is authorized by preview validation alone.

If a future accepted release regresses, promote the known-good deployment through Vercel after checking its environment. For candidate AI-only rollback, rebuild with NEXT_PUBLIC_NOATA_AI_FUNCTION=noata-ai. The existing legacy edge function is not overwritten by the candidate deployment.

The new ai_request_receipts table and admin_ai_usage_summary function are additive and can remain unused during rollback. Do not drop user data as part of rollback. Export/inspect receipts before any later retention change. Existing learning/economy migrations were not rewritten.

The four historical Open WebUI/Railway archive names in the brief were unavailable. No hash can honestly be supplied. Keep originals untouched, hash originals, inspect copied archives only, and never blindly restore their database over Supabase.
