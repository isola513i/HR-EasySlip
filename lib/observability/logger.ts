type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const configLevel = (process.env.LOG_LEVEL ?? "info") as LogLevel;

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= (LEVEL_ORDER[configLevel] ?? 1);
}

function emit(level: LogLevel, message: string, ctx?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...ctx,
  };

  const json = JSON.stringify(entry);
  if (level === "error") {
    console.error(json);
  } else {
    console.log(json);
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit("error", msg, ctx),
};
