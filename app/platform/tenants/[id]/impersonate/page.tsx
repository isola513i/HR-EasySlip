import { requirePlatformSession } from "@/lib/auth/platform";
import { getControlPlane } from "@/lib/db/control-plane";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ImpersonateForm } from "./impersonate-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ImpersonatePage({ params }: Props) {
  const { id } = await params;
  await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const cp = getControlPlane();

  const tenant = await cp.tenant.findUnique({
    where: { id },
    select: { id: true, companyName: true, slug: true, status: true },
  });
  if (!tenant) notFound();

  return (
    <>
      <div className="mb-6">
        <Link href={`/tenants/${id}`} className="text-gray-400 hover:text-white text-sm">
          ← Back to {tenant.companyName}
        </Link>
        <h1 className="text-2xl font-bold mt-3">Impersonate Tenant</h1>
        <p className="text-gray-400 text-sm mt-1">
          You will be redirected to{" "}
          <span className="font-mono text-blue-400">{tenant.slug}.easyslip.app</span> as an observer.
          Session expires after 1 hour.
        </p>
      </div>

      <div className="max-w-md bg-gray-900 rounded-lg border border-yellow-700/40 p-6 space-y-4">
        <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
          <span>⚠</span>
          <span>This action is audited. Provide a clear business reason.</span>
        </div>
        <ImpersonateForm tenantId={tenant.id} companyName={tenant.companyName} />
      </div>
    </>
  );
}
