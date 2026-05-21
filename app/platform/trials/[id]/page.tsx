import { requirePlatformSession } from "@/lib/auth/platform";
import { getControlPlane } from "@/lib/db/control-plane";
import { PLATFORM_TRIAL_ROLES } from "@/lib/security/platform-rbac";
import { StatusBadge } from "@/components/platform/status-badge";
import { DetailRow } from "@/components/platform/detail-row";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { TrialReviewForm } from "./trial-review-form";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TrialDetailPage({ params }: Props) {
  const { id } = await params;
  await requirePlatformSession(PLATFORM_TRIAL_ROLES);
  const cp = getControlPlane();

  const signup = await cp.trialSignup.findUnique({ where: { id } });
  if (!signup) notFound();

  const agingDays = Math.floor((Date.now() - signup.createdAt.getTime()) / 86400000);
  const isAging = signup.status === "PENDING" && agingDays >= 7;

  return (
    <>
      <div className="mb-6">
        <Link
          href="/platform/trials"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3" /> Trials
        </Link>
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{signup.companyName}</h1>
          <StatusBadge status={signup.status} />
          {isAging && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/20">
              Awaiting review {agingDays}d
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-1">{signup.desiredSlug}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-sm font-medium text-foreground mb-4">Signup details</h2>
          <DetailRow label="Company" value={signup.companyName} />
          <DetailRow label="Desired slug" value={signup.desiredSlug} mono />
          <DetailRow label="Contact" value={signup.contactName} />
          <DetailRow label="Email" value={signup.contactEmail} />
          {signup.contactPhone && <DetailRow label="Phone" value={signup.contactPhone} />}
          {signup.teamSize && <DetailRow label="Team size" value={signup.teamSize} />}
          <DetailRow label="Submitted" value={new Date(signup.createdAt).toLocaleString("en-GB")} />
          <DetailRow label="Status" value={signup.status} />
          {signup.rejectReason && <DetailRow label="Reject reason" value={signup.rejectReason} />}
          {signup.reviewedAt && <DetailRow label="Reviewed at" value={new Date(signup.reviewedAt).toLocaleString("en-GB")} />}
        </div>

        {signup.status === "PENDING" ? (
          <div className="rounded-xl border border-border bg-card p-6">
            <TrialReviewForm
              signupId={signup.id}
              desiredSlug={signup.desiredSlug}
              companyName={signup.companyName}
              contactEmail={signup.contactEmail}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-3">
            <h2 className="text-sm font-medium text-foreground">Review outcome</h2>
            <div className="flex items-center gap-2.5 py-4 border-b border-border">
              <StatusBadge status={signup.status} />
              <span className="text-sm text-muted-foreground">
                {signup.status === "APPROVED" ? "Approved and provisioned" : "Signup rejected"}
              </span>
            </div>
            {signup.rejectReason && (
              <p className="text-sm text-muted-foreground">{signup.rejectReason}</p>
            )}
            {signup.reviewedAt && (
              <p className="text-xs text-muted-foreground">
                Reviewed {new Date(signup.reviewedAt).toLocaleString("en-GB")}
              </p>
            )}
            {signup.status === "APPROVED" && signup.tenantId && (
              <Link href={`/platform/tenants/${signup.tenantId}`} className="text-xs text-primary hover:underline mt-2">
                View tenant →
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
