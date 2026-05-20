import { redirect } from "next/navigation";
import { requireRoles, TENANT_ADMIN_ROLES } from "@/lib/security/rbac";
import { getControlPlane } from "@/lib/db/control-plane";
import { getTenantId } from "@/lib/db/tenant-context";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ApproveClient } from "./approve-client";

interface Props {
  searchParams: Promise<{ request?: string; action?: string }>;
}

export default async function ImpersonationApprovePage({ searchParams }: Props) {
  const { request: requestId, action } = await searchParams;

  // Must be signed in as tenant admin
  const caller = await requireRoles(TENANT_ADMIN_ROLES).catch(() => null);
  if (!caller) {
    const callbackUrl = encodeURIComponent(`/impersonation/approve?request=${requestId}&action=${action}`);
    redirect(`/signin?callbackUrl=${callbackUrl}`);
  }

  const locale = await getLocale();
  const t = getDictionary(locale);

  const tenantId = await getTenantId();
  const cp = getControlPlane();

  if (!requestId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">{t.common.error}</p>
          <p className="text-sm text-muted-foreground">Invalid or missing request ID.</p>
        </div>
      </div>
    );
  }

  const request = await cp.impersonationRequest.findUnique({
    where: { id: requestId },
    include: {
      platformUser: { select: { email: true } },
      tenant: { select: { companyName: true } },
    },
  });

  const isExpired = request ? request.expiresAt < new Date() : false;
  const isMismatch = request ? request.tenantId !== tenantId : false;

  if (!request || isMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">{t.common.error}</p>
          <p className="text-sm text-muted-foreground">Request not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <ApproveClient
        requestId={requestId}
        status={request.status}
        isExpired={isExpired}
        platformEmail={request.platformUser.email}
        tenantName={request.tenant.companyName}
        reason={request.reason}
        expectedDurationMin={request.expectedDurationMin}
        expiresAt={request.expiresAt.toISOString()}
        initialAction={(action === "approve" || action === "reject") ? action : undefined}
      />
    </div>
  );
}
