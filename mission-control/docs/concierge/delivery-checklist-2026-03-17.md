# Concierge Delivery Checklist

1. Zip Tier 2 + Tier 3 bundles (`dist/concierge-tier-*.zip`).
2. Upload to Supabase storage bucket `concierge-packages`.
3. Generate signed URLs + write to `concierge_licenses.download_url`.
4. Send fallback email template when webhook fires.
