"use client";

import { useActionState } from "react";
import { provisionTenant } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormRoot, FormField, FormFieldError } from "@/components/ui/form-field";

interface Props {
  tenantId: string;
}

export function ProvisionForm({ tenantId }: Props) {
  const action = provisionTenant.bind(null, tenantId);
  const [state, dispatch, pending] = useActionState(action, null);

  return (
    <FormRoot action={dispatch} className="space-y-5">
      <FormField name="databaseUrl">
        <Label className="text-gray-300">
          DATABASE_URL <span className="text-red-400">*</span>
        </Label>
        <Input
          name="databaseUrl"
          type="password"
          required
          placeholder="postgresql://user:pass@host/dbname"
          className="bg-gray-800 border-gray-700 text-white font-mono text-xs"
        />
        <p className="text-xs text-gray-500">Pooled connection string from Neon Dashboard.</p>
        <FormFieldError />
      </FormField>

      <div className="space-y-2">
        <Label className="text-gray-300">DIRECT_URL</Label>
        <Input
          name="directUrl"
          type="password"
          placeholder="postgresql://user:pass@host/dbname?sslmode=require"
          className="bg-gray-800 border-gray-700 text-white font-mono text-xs"
        />
        <p className="text-xs text-gray-500">Direct (non-pooled) URL — required for migrations.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField name="contactEmail">
          <Label className="text-gray-300">
            Admin email <span className="text-red-400">*</span>
          </Label>
          <Input
            name="contactEmail"
            type="email"
            required
            placeholder="admin@company.com"
            className="bg-gray-800 border-gray-700 text-white"
          />
          <FormFieldError inputType="email" />
        </FormField>
        <FormField name="contactName">
          <Label className="text-gray-300">
            Admin name <span className="text-red-400">*</span>
          </Label>
          <Input
            name="contactName"
            required
            placeholder="Somchai Jaidee"
            className="bg-gray-800 border-gray-700 text-white"
          />
          <FormFieldError />
        </FormField>
      </div>

      {state?.error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {pending ? "Running migrations…" : "Provision Tenant"}
      </Button>
    </FormRoot>
  );
}
