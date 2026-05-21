"use client";

import { useActionState, useState } from "react";
import { createTenant } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormRoot, FormField, FormFieldError } from "@/components/ui/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewTenantForm() {
  const [state, action, pending] = useActionState(createTenant, null);
  const [status, setStatus] = useState("ACTIVE");

  return (
    <FormRoot action={action} className="space-y-4">
      <FormField name="slug" className="space-y-1.5">
        <Label htmlFor="slug">Slug *</Label>
        <Input id="slug" name="slug" required className="font-mono" placeholder="acme" />
        <p className="text-xs text-muted-foreground">Will become: /{"{slug}"}</p>
        <FormFieldError />
      </FormField>

      <FormField name="companyName" className="space-y-1.5">
        <Label htmlFor="companyName">Company Name *</Label>
        <Input id="companyName" name="companyName" required placeholder="Acme Co., Ltd." />
        <FormFieldError />
      </FormField>

      <FormField name="contactName" className="space-y-1.5">
        <Label htmlFor="contactName">Admin Name *</Label>
        <Input id="contactName" name="contactName" required placeholder="Somchai Jaidee" />
        <FormFieldError />
      </FormField>

      <FormField name="contactEmail" className="space-y-1.5">
        <Label htmlFor="contactEmail">Admin Email *</Label>
        <Input id="contactEmail" name="contactEmail" type="email" required placeholder="admin@acme.co.th" />
        <FormFieldError inputType="email" />
      </FormField>

      <div className="space-y-1.5">
        <Label htmlFor="status">Initial Status</Label>
        <input type="hidden" name="status" value={status} />
        <Select value={status} onValueChange={(v) => { if (v) setStatus(v); }}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
            <SelectItem value="TRIAL">TRIAL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full mt-2">
        {pending ? "Provisioning…" : "Create & Provision Tenant"}
      </Button>
    </FormRoot>
  );
}
