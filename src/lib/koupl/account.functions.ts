import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently deletes the signed-in user's account.
 * Cascades: profile, hosted rooms (+ their chat and invites), activity.
 * Rooms they joined as guest keep existing with the seat cleared; their chat
 * lines in other rooms lose the author link.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Clear the partner link on both sides as the user (RLS applies).
    await context.supabase.rpc("unlink_partner");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("Account deletion failed. Please try again.");
    return { ok: true };
  });
