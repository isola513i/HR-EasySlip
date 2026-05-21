// Neon API client — branch-per-tenant provisioning
// Uses Bun fetch; no SDK dependency.

const BASE_URL = process.env.NEON_API_BASE_URL ?? "https://console.neon.tech/api/v2";
const NEON_API_KEY = process.env.NEON_API_KEY;
const PROJECT_ID = process.env.NEON_PROJECT_ID;

export class NeonError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "NeonError";
  }
}

async function neonFetchWithRetry<T>(
  path: string,
  opts: RequestInit,
  attempt: number,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${NEON_API_KEY!}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...opts.headers,
    },
  });

  if (res.status === 429 && attempt < 3) {
    const retryAfter = parseInt(res.headers.get("Retry-After") ?? "2", 10);
    await new Promise((r) => setTimeout(r, retryAfter * 1_000 * (attempt + 1)));
    return neonFetchWithRetry(path, opts, attempt + 1);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string; code?: string };
    throw new NeonError(
      body.message ?? `Neon API error ${res.status}`,
      res.status,
      body.code,
    );
  }

  return res.json() as Promise<T>;
}

async function neonFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  if (!NEON_API_KEY) throw new NeonError("NEON_API_KEY is not set");
  if (!PROJECT_ID) throw new NeonError("NEON_PROJECT_ID is not set");
  return neonFetchWithRetry<T>(path, opts, 0);
}

export interface NeonBranch {
  id: string;
  name: string;
  current_state: string; // "init" | "ready"
  endpoints?: NeonEndpoint[];
}

export interface NeonEndpoint {
  id: string;
  host: string;
  type: string; // "read_write"
  current_state: string; // "idle" | "active"
}

export interface NeonConnectionUri {
  uri: string;
}

// ── Branch operations ─────────────────────────────────────────────

export async function createBranch(opts: {
  name: string;
  parentId: string;
}): Promise<{ branch: NeonBranch; endpoint: NeonEndpoint }> {
  const data = await neonFetch<{ branch: NeonBranch; endpoints: NeonEndpoint[] }>(
    `/projects/${PROJECT_ID}/branches`,
    {
      method: "POST",
      body: JSON.stringify({
        branch: { name: opts.name, parent_id: opts.parentId },
        endpoints: [{ type: "read_write" }],
      }),
    },
  );
  const endpoint = data.endpoints[0];
  if (!endpoint) throw new NeonError("No endpoint returned from createBranch");
  return { branch: data.branch, endpoint };
}

export async function waitForBranchReady(
  branchId: string,
  timeoutMs = 30_000,
): Promise<NeonBranch> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const data = await neonFetch<{ branch: NeonBranch }>(
      `/projects/${PROJECT_ID}/branches/${branchId}`,
    );
    if (data.branch.current_state === "ready") return data.branch;
    await new Promise((r) => setTimeout(r, 1_500));
  }
  throw new NeonError(`Branch ${branchId} not ready after ${timeoutMs}ms`);
}

export async function getConnectionUri(opts: {
  branchId: string;
  role: string;
  pooled?: boolean;
}): Promise<string> {
  const params = new URLSearchParams({
    branch_id: opts.branchId,
    role_name: opts.role,
    pooled: opts.pooled ? "true" : "false",
  });
  const data = await neonFetch<{ uri: NeonConnectionUri }>(
    `/projects/${PROJECT_ID}/connection_uri?${params.toString()}`,
  );
  return data.uri.uri;
}

export async function deleteBranch(branchId: string): Promise<void> {
  await neonFetch<unknown>(
    `/projects/${PROJECT_ID}/branches/${branchId}`,
    { method: "DELETE" },
  );
}

export async function listBranches(): Promise<NeonBranch[]> {
  const data = await neonFetch<{ branches: NeonBranch[] }>(
    `/projects/${PROJECT_ID}/branches`,
  );
  return data.branches;
}
