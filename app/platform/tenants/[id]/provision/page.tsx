import { requirePlatformSession } from "@/lib/auth/platform";
import { getControlPlane } from "@/lib/db/control-plane";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProvisionForm } from "./provision-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProvisionPage({ params }: Props) {
  const [{ id }] = await Promise.all([
    params,
    requirePlatformSession(PLATFORM_ADMIN_ROLES),
  ]);

  const cp = getControlPlane();
  const tenant = await cp.tenant.findUnique({
    where: { id },
    select: { id: true, slug: true, companyName: true, status: true, databaseUrlEnc: true },
  });
  if (!tenant) notFound();

  return (
    <>
      <div className="mb-6">
        <Link href={`/platform/tenants/${id}`} className="text-gray-400 hover:text-white text-sm">
          ← Back to {tenant.companyName}
        </Link>
        <h1 className="text-2xl font-bold mt-3">Provision Database</h1>
        <p className="text-gray-400 text-sm mt-1">
          Connect a Neon branch to workspace{" "}
          <span className="font-mono text-blue-400">/{tenant.slug}</span>
          . Migrations will run automatically.
        </p>
      </div>

      {tenant.databaseUrlEnc ? (
        <div className="max-w-lg bg-gray-900 rounded-lg border border-gray-800 p-6 text-sm text-gray-400">
          This tenant already has a database configured. Use the{" "}
          <Link href={`/platform/tenants/${id}`} className="text-blue-400 underline">
            tenant detail page
          </Link>{" "}
          to manage its status.
        </div>
      ) : (
        <div className="max-w-lg space-y-4">
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg p-4 space-y-1.5">
            <p className="text-sm font-medium text-amber-300">Before you start</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-400/90 text-xs">
              <li>Open Neon Dashboard → create a new project for this tenant.</li>
              <li>Copy the Connection String (pooled) as DATABASE_URL.</li>
              <li>Copy the Direct Connection String as DIRECT_URL (for migrations).</li>
            </ol>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <ProvisionForm tenantId={tenant.id} />
          </div>
        </div>
      )}
    </>
  );
}
