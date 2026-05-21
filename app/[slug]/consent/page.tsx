import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { hasActiveConsent } from "@/lib/consent/consent-service";
import { getDict } from "@/lib/i18n/get-dict";
import { AuthLayout } from "@/components/shared/auth-layout";
import { ConsentForm } from "./consent-form";

export const metadata: Metadata = { title: "PDPA Consent — EasySlip HR" };

export default async function ConsentPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [{ slug }, session, params] = await Promise.all([routeParams, auth(), searchParams]);
  if (!session?.user?.id) redirect(`/${slug}/signin`);

  const raw = params.callbackUrl ?? "/employee/today";
  const callbackUrl =
    raw.startsWith("/") && !raw.startsWith("//") ? raw : "/employee/today";

  const consented = await hasActiveConsent(session.user.id);
  if (consented) redirect(callbackUrl);

  const { t } = await getDict();

  return (
    <AuthLayout
      heading={t.consent.title}
      subtitle={t.consent.subtitle}
      marketingHeading={t.consent.brandTitle}
      marketingTagline={t.consent.brandSubtitle}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
      wide
    >
      <ConsentForm callbackUrl={callbackUrl} />
    </AuthLayout>
  );
}
