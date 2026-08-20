const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const adminConfigured = adminEmails.length > 0;

/**
 * Admin access reuses the same Supabase Auth sign-in every user gets — the
 * only difference is whether the signed-in email is on this allow-list. Set
 * `ADMIN_EMAILS` (comma-separated) in Vercel once Supabase is connected.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails.includes(email.toLowerCase());
}
