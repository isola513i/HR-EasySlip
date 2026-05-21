import type { Metadata } from "next";
import { AuditLog } from "@/components/hr/audit-log";

export const metadata: Metadata = { title: "Audit Log" };

export default function AuditPage() {
  return <AuditLog />;
}
