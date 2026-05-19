"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { approveTrialSignup, rejectTrialSignup } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  signupId: string;
  desiredSlug: string;
  companyName: string;
  contactEmail: string;
}

export function TrialReviewForm({ signupId, desiredSlug, companyName, contactEmail }: Props) {
  const router = useRouter();
  const approveAction = approveTrialSignup.bind(null, signupId);
  const rejectAction = rejectTrialSignup.bind(null, signupId);

  const [approveState, approveDispatch, approvePending] = useActionState(approveAction, null);
  const [rejectState, rejectDispatch, rejectPending] = useActionState(rejectAction, null);

  useEffect(() => {
    if ((approveState && "success" in approveState) || (rejectState && "success" in rejectState))
      router.refresh();
  }, [approveState, rejectState]);

  const mailtoHref = `mailto:${contactEmail}?subject=Your EasySlip trial signup (${companyName})&body=Hi,%0A%0AWe received your trial signup request for ${companyName}.%0A%0ACould you please provide more information about:%0A%0A[Your questions here]%0A%0AThank you`;

  return (
    <>
      <h2 className="text-sm font-medium text-foreground mb-4">Review</h2>
      <Tabs defaultValue="approve">
        <TabsList className="bg-muted/60 w-full">
          <TabsTrigger value="approve" className="flex-1">Approve & provision</TabsTrigger>
          <TabsTrigger value="reject" className="flex-1">Reject</TabsTrigger>
          <TabsTrigger value="info" className="flex-1">Request info</TabsTrigger>
        </TabsList>

        <TabsContent value="approve">
          <form action={approveDispatch} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm">Slug (subdomain)</Label>
              <Input name="slug" defaultValue={desiredSlug} required className="font-mono text-sm" placeholder="acme" />
              <p className="text-xs text-muted-foreground">{desiredSlug}.easyslip.app</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Company name</Label>
              <Input name="companyName" defaultValue={companyName} required className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">DATABASE_URL <span className="text-rose-400">*</span></Label>
              <Input
                name="databaseUrl"
                type="password"
                required
                className="font-mono text-xs"
                placeholder="postgresql://user:pass@host/dbname"
              />
              <p className="text-xs text-muted-foreground">Neon Dashboard → Connection String (pooled)</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">DIRECT_URL <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                name="directUrl"
                type="password"
                className="font-mono text-xs"
                placeholder="postgresql://user:pass@host/dbname?sslmode=require"
              />
            </div>
            {approveState && "error" in approveState && <p className="text-sm text-rose-400">{approveState.error}</p>}
            <Button type="submit" disabled={approvePending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {approvePending ? "Provisioning…" : "Approve & create tenant"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="reject">
          <form action={rejectDispatch} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm">Rejection reason <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                name="rejectReason"
                placeholder="Duplicate signup, incomplete info, outside service area..."
                rows={3}
                className="text-sm"
              />
            </div>
            {rejectState?.error && <p className="text-sm text-rose-400">{rejectState.error}</p>}
            <Button type="submit" disabled={rejectPending} variant="destructive" className="w-full">
              {rejectPending ? "Rejecting…" : "Reject signup"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="info">
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Send an email to <span className="font-medium text-foreground">{contactEmail}</span> requesting more information before approving or rejecting.
            </p>
            <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 p-3">
              This opens your email client with a prefilled template. The signup status will remain PENDING until you take an action above.
            </p>
            <a href={mailtoHref} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Open email client
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
