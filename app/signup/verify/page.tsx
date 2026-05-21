import { redirect } from "next/navigation";
import { getControlPlane } from "@/lib/db/control-plane";
import { provisionTenantSelfService } from "@/lib/tenant/provision-self-service";
import { VerifyError } from "./verify-error";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <VerifyError code="MISSING_TOKEN" />;
  }

  const cp = getControlPlane();

  const verification = await cp.emailVerification.findUnique({
    where: { token },
    include: { signup: true },
  });

  if (!verification) {
    return <VerifyError code="INVALID_TOKEN" />;
  }
  if (verification.consumedAt) {
    return <VerifyError code="TOKEN_USED" />;
  }
  if (verification.expiresAt < new Date()) {
    return <VerifyError code="TOKEN_EXPIRED" />;
  }
  if (!verification.signup) {
    return <VerifyError code="SIGNUP_NOT_FOUND" />;
  }

  const signup = verification.signup;

  // Already provisioned — redirect straight to signin
  if (signup.status === "READY" && signup.tenantId) {
    redirect(`/${signup.desiredSlug}/signin`);
  }

  // Mark token consumed + signup email verified
  await cp.emailVerification.update({
    where: { token },
    data: { consumedAt: new Date() },
  });
  await cp.trialSignup.update({
    where: { id: signup.id },
    data: { emailVerifiedAt: new Date(), status: "EMAIL_VERIFIED" },
  });

  // Run provisioning inline (loading.tsx shows spinner while this runs)
  const result = await provisionTenantSelfService({
    signupId: signup.id,
    companyName: signup.companyName,
    slug: signup.desiredSlug,
    adminEmail: signup.contactEmail,
    adminName: signup.contactName,
  });

  if (!result.ok) {
    return <VerifyError code={result.code} message={result.error} />;
  }

  redirect(`/${result.slug}/signin?welcome=1`);
}
