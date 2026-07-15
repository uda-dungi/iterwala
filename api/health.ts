import { isPayuConfigured, getPayuMode } from "./_lib/payu.js";
import { isSupabaseAdminConfigured } from "./_lib/supabaseAdmin.js";

// GET /api/health — quick way to confirm env vars actually made it into the deployed
// Vercel project after adding/editing them in Project → Settings → Environment
// Variables. Visit https://your-domain/api/health after a deploy; if payuConfigured
// or supabaseConfigured is false, the corresponding env vars weren't picked up
// (check spelling, check they're set for the right environment, then redeploy).
export default function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    payuConfigured: isPayuConfigured(),
    payuMode: getPayuMode(),
    supabaseConfigured: isSupabaseAdminConfigured(),
  });
}
