import type { Metadata } from "next";
import { OTRequestForm } from "@/components/employee/ot-request-form";

export const metadata: Metadata = { title: "OT Request — EasySlip HR" };

export default function OTPage() {
  return <OTRequestForm />;
}
