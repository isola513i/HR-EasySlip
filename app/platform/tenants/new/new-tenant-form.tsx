"use client";

import React, { useActionState } from "react";
import { createTenant } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewTenantForm() {
  const [state, action, pending] = useActionState(createTenant, null);
  const [status, setStatus] = React.useState("ACTIVE");

  return (
    <form action={action} className="space-y-4">
      <Field id="slug" label="Slug *">
        <Input name="slug" required className="font-mono" placeholder="acme" />
        <p className="text-xs text-muted-foreground mt-1">Will become: /{"{slug}"}/dashboard</p>
      </Field>

      <Field id="companyName" label="Company Name *">
        <Input name="companyName" required placeholder="Acme Co., Ltd." />
      </Field>

      <Field id="contactName" label="Admin Name *">
        <Input name="contactName" required placeholder="Somchai Jaidee" />
      </Field>

      <Field id="contactEmail" label="Admin Email *">
        <Input name="contactEmail" type="email" required placeholder="admin@acme.co.th" />
      </Field>

      <Field id="status" label="Initial Status">
        <input type="hidden" name="status" value={status} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
            <SelectItem value="TRIAL">TRIAL</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full mt-2">
        {pending ? "Provisioning…" : "Create & Provision Tenant"}
      </Button>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
