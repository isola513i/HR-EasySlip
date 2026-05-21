import { OTRequestForm } from "@/components/employee/ot-request-form";
import { pageMetadata } from "@/lib/i18n/page-metadata";

export const generateMetadata = () => pageMetadata("ot");

export default function OTPage() {
  return <OTRequestForm />;
}
