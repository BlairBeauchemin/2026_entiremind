import { createServiceRoleClient } from "./supabase";

export type AuditAction =
  | "view_messages"
  | "view_users"
  | "view_intentions"
  | "update_user"
  | "send_message";

export type ResourceType = "message" | "user" | "intention";

/**
 * Log an audit entry for admin/founder actions
 *
 * Uses service role client to bypass RLS since only service role can insert
 */
export async function logAudit(
  userId: string,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: metadata ?? {},
    });
  } catch (error) {
    // Log but don't throw - audit logging should not break the main flow
    console.error("Failed to log audit entry:", error);
  }
}

/**
 * Log when an admin views user messages
 */
export async function logAdminViewedMessages(
  adminUserId: string,
  messageCount: number
): Promise<void> {
  await logAudit(adminUserId, "view_messages", "message", undefined, {
    message_count: messageCount,
  });
}

/**
 * Log when an admin views user details
 */
export async function logAdminViewedUsers(
  adminUserId: string,
  userCount: number
): Promise<void> {
  await logAudit(adminUserId, "view_users", "user", undefined, {
    user_count: userCount,
  });
}
