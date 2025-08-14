type LogLevel = "debug" | "info" | "warn" | "error";
const ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};
const envLevel = (import.meta.env.VITE_LOG_LEVEL || "").toLowerCase();
const defaultLevel: LogLevel =
  import.meta.env.MODE === "production" ? "info" : "debug";
const ACTIVE: LogLevel = (
  ["debug", "info", "warn", "error"].includes(envLevel)
    ? envLevel
    : defaultLevel
) as LogLevel;
const enabled = (lvl: LogLevel) => ORDER[lvl] >= ORDER[ACTIVE];
const stamp = () => new Date().toISOString();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const out = (lvl: LogLevel, msg: string, meta?: any) => {
  if (!enabled(lvl)) return;
  const line = `[${stamp()}][${lvl.toUpperCase()}] ${msg}`;
  if (lvl === "error") console.error(line, meta ?? "");
  else if (lvl === "warn") console.warn(line, meta ?? "");
  else if (lvl === "debug") console.debug(line, meta ?? "");
  else console.log(line, meta ?? "");
};
const logger = {
  level: ACTIVE,
  debug: (m: string, meta?: unknown) => out("debug", m, meta),
  info: (m: string, meta?: unknown) => out("info", m, meta),
  warn: (m: string, meta?: unknown) => out("warn", m, meta),
  error: (m: string, meta?: unknown) => out("error", m, meta),
};
export default logger;
