"use client";

import { useActionState } from "react";
import { createTenant } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewTenantForm() {
  const [state, action, pending] = useActionState(createTenant, null);

  return (
    <form action={action} className="space-y-4">
      <Field id="slug" label="Slug *">
        <Input name="slug" required className="bg-gray-800 border-gray-700 text-white font-mono" placeholder="acme" />
        <p className="text-xs text-gray-500 mt-1">Will become: slug.easyslip.app</p>
      </Field>

      <Field id="companyName" label="Company Name *">
        <Input name="companyName" required className="bg-gray-800 border-gray-700 text-white" placeholder="Acme Co., Ltd." />
      </Field>

      <Field id="contactName" label="Admin Name *">
        <Input name="contactName" required className="bg-gray-800 border-gray-700 text-white" placeholder="Somchai Jaidee" />
      </Field>

      <Field id="contactEmail" label="Admin Email *">
        <Input name="contactEmail" type="email" required className="bg-gray-800 border-gray-700 text-white" placeholder="admin@acme.co.th" />
      </Field>

      <Field id="databaseUrl" label="DATABASE_URL *">
        <Input name="databaseUrl" type="password" required className="bg-gray-800 border-gray-700 text-white font-mono text-xs" placeholder="postgresql://..." />
      </Field>

      <Field id="directUrl" label="DIRECT_URL (optional)">
        <Input name="directUrl" type="password" className="bg-gray-800 border-gray-700 text-white font-mono text-xs" placeholder="postgresql://... (for migrations)" />
      </Field>

      <Field id="status" label="Initial Status">
        <select name="status" defaultValue="ACTIVE" className="flex h-9 w-full rounded-md border border-gray-700 bg-gray-800 text-white px-3 py-1 text-sm">
          <option value="ACTIVE">ACTIVE</option>
          <option value="TRIAL">TRIAL</option>
        </select>
      </Field>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full mt-2">
        {pending ? "Provisioning…" : "Create & Provision Tenant"}
      </Button>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-gray-300">{label}</Label>
      {children}
    </div>
  );
}
