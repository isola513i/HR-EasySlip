"use client";

import { useActionState, useEffect, useState } from "react";
import { requestImpersonation, launchImpersonation, cancelImpersonationRequest } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { FormRoot, FormField, FormFieldError } from "@/components/ui/form-field";

interface Props {
  tenantId: string;
  companyName: string;
}

type PendingState = { requestId: string; status: "PENDING" };

export function ImpersonateForm({ tenantId, companyName }: Props) {
  const action = requestImpersonation.bind(null, tenantId);
  const [state, dispatch, pending] = useActionState(action, null);
  const [pendingRequest, setPendingRequest] = useState<PendingState | null>(null);
  const [requestStatus, setRequestStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED" | null>(null);
  const [launching, setLaunching] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);

  // Handle direct launch (REQUIRE_APPROVAL=false)
  useEffect(() => {
    if (state && "redirectUrl" in state) {
      setTimeout(() => { window.location.href = state.redirectUrl; }, 0);
    }
    if (state && "requestId" in state) {
      setPendingRequest({ requestId: state.requestId, status: "PENDING" });
      setRequestStatus("PENDING");
    }
  }, [state]);

  // Poll for approval status
  useEffect(() => {
    if (!pendingRequest || requestStatus !== "PENDING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/platform/impersonation-requests/${pendingRequest.requestId}/status`);
        if (res.ok) {
          const data = await res.json() as { status: string };
          if (data.status !== "PENDING") {
            setRequestStatus(data.status as typeof requestStatus);
            clearInterval(interval);
          }
        }
      } catch { /* ignore */ }
    }, 5_000);

    return () => clearInterval(interval);
  }, [pendingRequest, requestStatus]);

  async function handleLaunch() {
    if (!pendingRequest) return;
    setLaunching(true);
    const result = await launchImpersonation(pendingRequest.requestId);
    if ("error" in result) {
      alert(result.error);
      setLaunching(false);
    } else {
      window.location.href = result.redirectUrl;
    }
  }

  async function handleCancel() {
    if (!pendingRequest) return;
    setCancelPending(true);
    await cancelImpersonationRequest(pendingRequest.requestId);
    setRequestStatus("CANCELLED");
    setPendingRequest(null);
    setCancelPending(false);
  }

  // Pending approval UI
  if (pendingRequest && requestStatus) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          {requestStatus === "PENDING" && (
            <>
              <Loader2 className="size-4 animate-spin text-amber-400" />
              <span className="text-amber-300">Waiting for tenant admin approval…</span>
            </>
          )}
          {requestStatus === "APPROVED" && (
            <>
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span className="text-emerald-300">Request approved — ready to launch</span>
            </>
          )}
          {(requestStatus === "REJECTED" || requestStatus === "CANCELLED" || requestStatus === "EXPIRED") && (
            <>
              <XCircle className="size-4 text-red-400" />
              <span className="text-red-300">Request {requestStatus.toLowerCase()}</span>
            </>
          )}
        </div>

        {requestStatus === "PENDING" && (
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Clock className="size-3" />
            An approval email was sent to tenant admins. Refreshing every 5s…
          </p>
        )}

        <div className="flex gap-3">
          {requestStatus === "APPROVED" && (
            <Button
              onClick={handleLaunch}
              disabled={launching}
              className="bg-amber-600 hover:bg-amber-500 text-black font-semibold"
            >
              {launching ? "Launching…" : "Launch Session"}
            </Button>
          )}
          {requestStatus === "PENDING" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={cancelPending}
              className="text-gray-400 border-gray-700 hover:bg-gray-800"
            >
              {cancelPending ? "Cancelling…" : "Cancel Request"}
            </Button>
          )}
          {["REJECTED", "CANCELLED", "EXPIRED"].includes(requestStatus) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setPendingRequest(null); setRequestStatus(null); }}
              className="text-gray-400 border-gray-700 hover:bg-gray-800"
            >
              Send New Request
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Initial form
  return (
    <FormRoot action={dispatch} className="space-y-4">
      <div>
        <p className="text-sm text-gray-300 mb-3">
          Target: <span className="font-semibold text-white">{companyName}</span>
        </p>
        <FormField name="reason">
          <Label htmlFor="reason" className="text-gray-300">
            Reason for access request
          </Label>
          <Textarea
            id="reason"
            name="reason"
            placeholder="e.g. Customer reported login issue — investigating session data"
            className="mt-1.5 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            rows={3}
            required
          />
          <FormFieldError />
        </FormField>
      </div>
      {state && "error" in state && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      <p className="text-xs text-gray-500">
        An approval email will be sent to tenant admins before you can access the workspace.
      </p>
      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold"
      >
        {pending ? "Sending Request…" : "Request Access"}
      </Button>
    </FormRoot>
  );
}
