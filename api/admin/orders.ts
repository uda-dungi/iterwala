import { getSupabaseAdmin, isSupabaseAdminConfigured, isAdminEmail } from "../_lib/supabaseAdmin.js";

function unauthorized(res: any) {
  res.status(401).json({ error: "Unauthorized" });
}

function forbidden(res: any) {
  res.status(403).json({ error: "Forbidden" });
}

function methodNotAllowed(res: any) {
  res.status(405).json({ error: "Method not allowed" });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    methodNotAllowed(res);
    return;
  }

  const authHeader = String(req.headers?.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    unauthorized(res);
    return;
  }

  if (!isSupabaseAdminConfigured()) {
    res.status(503).json({ error: "Server is not configured for Supabase admin access." });
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    res.status(503).json({ error: "Could not create Supabase admin client." });
    return;
  }

  const { data: sessionUser, error: userError } = await admin.auth.getUser(token);
  if (userError || !sessionUser?.user?.email) {
    unauthorized(res);
    return;
  }

  const email = String(sessionUser.user.email).toLowerCase();
  if (!isAdminEmail(email)) {
    forbidden(res);
    return;
  }

  const { data, error } = await admin
    .from("orders")
    .select(`id, txnid, created_at, updated_at, user_id, email, phone, name, address, items, subtotal, shipping, gift_wrap, total, status, payu_txn_id, payu_mode`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("api/admin/orders: failed to fetch orders", error.message);
    res.status(500).json({ error: "Failed to load orders." });
    return;
  }

  res.status(200).json({ orders: data || [] });
}
