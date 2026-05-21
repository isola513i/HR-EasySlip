const RETRYABLE_PRISMA_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

export function isRetryableConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: string; message?: string };
  if (e.name === "PrismaClientInitializationError") return true;
  if (typeof e.code === "string" && RETRYABLE_PRISMA_CODES.has(e.code)) return true;
  const msg = typeof e.message === "string" ? e.message : "";
  return /can'?t reach database|connection.*timed?\s*out|ECONNREFUSED|ETIMEDOUT|connection terminated|server closed the connection/i.test(msg);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface ExtendableClient {
  $extends: (ext: {
    query: {
      $allOperations: (args: {
        args: unknown;
        query: (args: unknown) => Promise<unknown>;
        operation: string;
        model?: string;
      }) => Promise<unknown>;
    };
  }) => ExtendableClient;
}

export function withConnectionRetry<T extends ExtendableClient>(client: T, label = "db"): T {
  return client.$extends({
    query: {
      async $allOperations({ args, query, operation, model }) {
        let attempt = 0;
        while (true) {
          try {
            return await query(args);
          } catch (err) {
            if (attempt < MAX_RETRIES && isRetryableConnectionError(err)) {
              attempt++;
              const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
              const target = model ? `${model}.${operation}` : operation;
              console.warn(`[${label} retry] ${target} attempt ${attempt}/${MAX_RETRIES} after ${delay}ms`);
              await sleep(delay);
              continue;
            }
            throw err;
          }
        }
      },
    },
  }) as T;
}
