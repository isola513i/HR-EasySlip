import { apiFetch } from "@/lib/api/client";

function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

export type PushSupport = "supported" | "denied" | "unsupported";

export function detectPushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  return "supported";
}

export async function getActiveSubscription(): Promise<PushSubscription | null> {
  if (detectPushSupport() === "unsupported") return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribePush(): Promise<void> {
  if (detectPushSupport() !== "supported") throw new Error("PUSH_UNSUPPORTED");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("PUSH_DENIED");

  const { publicKey } = await apiFetch<{ publicKey: string }>("/api/v1/push/vapid-public-key");
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToBuffer(publicKey),
  });
  const json = sub.toJSON();
  await apiFetch("/api/v1/employee/me/push/subscribe", {
    method: "POST",
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
}

export async function unsubscribePush(): Promise<void> {
  const sub = await getActiveSubscription();
  if (!sub) return;
  await apiFetch("/api/v1/employee/me/push/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  await sub.unsubscribe();
}
