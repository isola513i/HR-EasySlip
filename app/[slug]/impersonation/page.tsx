import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyImpersonationToken, IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";
import { getControlPlane } from "@/lib/db/control-plane";

export default async function ImpersonationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const jar = await cookies();
  const token = jar.get(IMPERSONATION_COOKIE)?.value;

  if (!token) redirect(`/${slug}/signin`);

  const imp = await verifyImpersonationToken(token);
  if (!imp) redirect(`/${slug}/signin`);

  const cp = getControlPlane();
  const tenant = await cp.tenant.findUnique({
    where: { id: imp.tenantId },
    select: { companyName: true, slug: true, status: true, planCode: true, createdAt: true },
  });

  if (!tenant) redirect(`/${slug}/signin`);

  const expiryTime = new Date(imp.expiresAt).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-5">
          <p className="text-yellow-300 text-sm font-semibold mb-1">
            👁 SuperAdmin Impersonation Active
          </p>
          <p className="text-yellow-200/70 text-xs">
            Logged in as <span className="font-mono">{imp.platformEmail}</span> · expires {expiryTime}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h1 className="text-xl font-bold">{tenant.companyName}</h1>
          <div className="text-sm text-gray-400 space-y-1">
            <p>Slug: <span className="font-mono text-white">{tenant.slug}</span></p>
            <p>Status: <span className="font-mono text-white">{tenant.status}</span></p>
            <p>Plan: <span className="font-mono text-white">{tenant.planCode ?? "—"}</span></p>
            <p>Created: <span className="text-white">{new Date(tenant.createdAt).toLocaleDateString("th-TH")}</span></p>
          </div>
        </div>

        <p className="text-gray-500 text-sm text-center">
          To explore the tenant app as a specific user, sign in below using their credentials.
        </p>

        <a
          href={`/${slug}/signin`}
          className="block w-full text-center rounded-lg bg-white text-gray-950 font-semibold py-2.5 text-sm hover:bg-gray-100 transition-colors"
        >
          Sign in as tenant user
        </a>
      </div>
    </div>
  );
}
