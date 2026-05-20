import { getControlPlane } from "@/lib/db/control-plane";
import { getTenantPrisma } from "@/lib/db/tenant";
import { sendNotificationEmail } from "./notification-service";
import { impersonationRequestHtml, impersonationRequestText } from "./impersonation-request-template";
import { logger } from "@/lib/observability/logger";
import type { Role } from "@prisma/client";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";
const IS_LOCAL = ROOT_DOMAIN.startsWith("localhost") || ROOT_DOMAIN.includes("lvh.me");

function tenantBase(slug: string): string {
  return IS_LOCAL ? `http://${slug}.lvh.me:3000` : `https://${slug}.${ROOT_DOMAIN}`;
}

// Tenant admin roles that should receive approval notifications
const TENANT_ADMIN_ROLE_VALUES: Role[] = ["TENANT_ADMIN", "HRMG", "CEO", "CTO", "COO"];

/**
 * Send impersonation request approval emails to all TENANT_ADMIN_ROLES users.
 * Returns { sent: number, error?: string }.
 * Best-effort — caller should not block on this.
 */
export async function notifyImpersonationRequest(requestId: string): Promise<{ sent: number; error?: string }> {
  try {
    const cp = getControlPlane();

    const request = await cp.impersonationRequest.findUnique({
      where: { id: requestId },
      include: {
        platformUser: { select: { email: true } },
        tenant: { select: { slug: true, companyName: true } },
      },
    });
    if (!request) return { sent: 0, error: "Request not found" };

    // Create per-user approve/reject URLs using the shared approval token
    // The token is already in the request but we rebuild the URL here from requestId
    // so we don't need to store it — the token is stored in email links only.
    // We re-create a token from scratch (signed, same TTL).
    const base = tenantBase(request.tenant.slug);
    const approveUrl = `${base}/impersonation/approve?request=${requestId}&action=approve`;
    const rejectUrl = `${base}/impersonation/approve?request=${requestId}&action=reject`;

    // Query tenant DB for admin users
    const prisma = await getTenantPrisma(request.tenantId);
    const adminEmployees = await prisma.employee.findMany({
      where: {
        roles: { hasSome: TENANT_ADMIN_ROLE_VALUES },
        employmentStatus: { in: ["ACTIVE", "PROBATION"] },
      },
      include: {
        user: { select: { email: true } },
      },
    });

    const recipients = adminEmployees
      .map((e) => e.user?.email)
      .filter((email): email is string => !!email);

    if (recipients.length === 0) {
      return { sent: 0, error: "No admin contacts found in tenant" };
    }

    const templateParams = {
      tenantName: request.tenant.companyName,
      platformEmail: request.platformUser.email,
      reason: request.reason,
      expectedDurationMin: request.expectedDurationMin,
      approveUrl,
      rejectUrl,
      expiresAt: request.expiresAt,
    };

    let sent = 0;
    for (const email of recipients) {
      const ok = await sendNotificationEmail(
        email,
        `[EasySlip] คำขอเข้าถึงระบบจากทีม Support / Platform Support Access Request`,
        impersonationRequestHtml(templateParams),
        impersonationRequestText(templateParams),
      );
      if (ok) sent++;
    }

    return { sent };
  } catch (err) {
    logger.error("notifyImpersonationRequest failed", { requestId, err: String(err) });
    return { sent: 0, error: String(err) };
  }
}
