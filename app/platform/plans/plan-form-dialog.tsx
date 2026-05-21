"use client";

import { useActionState, useEffect, useState } from "react";
import { savePlan } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus } from "lucide-react";
import { FormRoot, FormField, FormFieldError } from "@/components/ui/form-field";
import type { PlanDef } from "@/lib/platform/plan-catalog";

interface Props {
  mode: "edit" | "create";
  plan?: PlanDef;
  nextSortOrder?: number;
}

export function PlanFormDialog({ mode, plan, nextSortOrder = 0 }: Props) {
  const [open, setOpen] = useState(false);
  const [state, dispatch, pending] = useActionState(savePlan, null);

  useEffect(() => {
    if (state && "success" in state) setOpen(false);
  }, [state]);

  const isNew = mode === "create";
  const featureLines = plan?.features.join("\n") ?? "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={
          isNew
            ? buttonVariants({ size: "sm" })
            : buttonVariants({ size: "sm", variant: "outline" })
        }
      >
        {isNew ? (
          <><Plus className="size-4 mr-1.5" /> New plan</>
        ) : (
          <><Pencil className="size-3.5 mr-1.5" /> Edit</>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Create a plan" : `Edit ${plan?.name}`}</DialogTitle>
          <DialogDescription>
            {isNew
              ? "Codes are immutable once tenants are assigned. Pick carefully."
              : "Code cannot be changed because tenants reference it."}
          </DialogDescription>
        </DialogHeader>

        <FormRoot action={dispatch} className="space-y-4 pt-2">
          <input type="hidden" name="isNew" value={isNew ? "1" : "0"} />

          <FormField name="code" className="space-y-1.5">
            <Label htmlFor="plan-code">Code</Label>
            <Input
              id="plan-code"
              name="code"
              required
              readOnly={!isNew}
              defaultValue={plan?.code ?? ""}
              placeholder="starter"
              className="font-mono text-sm"
            />
            <FormFieldError />
          </FormField>

          <FormField name="name" className="space-y-1.5">
            <Label htmlFor="plan-name">Display name</Label>
            <Input
              id="plan-name"
              name="name"
              required
              defaultValue={plan?.name ?? ""}
              placeholder="Starter"
            />
            <FormFieldError />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-price">Price (THB / mo)</Label>
              <Input
                id="plan-price"
                name="priceTHB"
                type="number"
                min="0"
                defaultValue={plan?.priceTHB ?? ""}
                placeholder="990"
              />
              <p className="text-xs text-muted-foreground">Empty = custom pricing</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-emp">Max employees</Label>
              <Input
                id="plan-emp"
                name="maxEmployees"
                type="number"
                min="1"
                defaultValue={plan?.maxEmployees ?? ""}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">Empty = unlimited</p>
            </div>
          </div>

          <FormField name="features" className="space-y-1.5">
            <Label htmlFor="plan-features">Features (one per line)</Label>
            <Textarea
              id="plan-features"
              name="features"
              required
              rows={6}
              defaultValue={featureLines}
              placeholder={`GPS Clock-in / Clock-out\nLeave management\n…`}
              className="font-mono text-sm"
            />
            <FormFieldError />
          </FormField>

          <div className="space-y-1.5">
            <Label htmlFor="plan-order">Sort order</Label>
            <Input
              id="plan-order"
              name="sortOrder"
              type="number"
              defaultValue={plan?.code ? undefined : nextSortOrder}
              placeholder="0"
            />
          </div>

          {state && "error" in state && (
            <p className="text-sm text-rose-400">{state.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isNew ? "Create plan" : "Save changes"}
            </Button>
          </div>
        </FormRoot>
      </DialogContent>
    </Dialog>
  );
}
