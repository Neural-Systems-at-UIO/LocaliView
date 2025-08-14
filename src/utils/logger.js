const ORDER = { debug: 10, info: 20, warn: 30, error: 40 };
const envLevel = (import.meta.env.VITE_LOG_LEVEL || '').toLowerCase();
const defaultLevel = import.meta.env.MODE === 'production' ? 'info' : 'debug';
const ACTIVE = (['debug', 'info', 'warn', 'error'].includes(envLevel) ? envLevel : defaultLevel);
const enabled = (lvl) => ORDER[lvl] >= ORDER[ACTIVE];
const stamp = () => new Date().toISOString();
const out = (lvl, msg, meta) => { if (!enabled(lvl)) return; const line = `[${stamp()}][${lvl.toUpperCase()}] ${msg}`; if (lvl === 'error') console.error(line, meta ?? ''); else if (lvl === 'warn') console.warn(line, meta ?? ''); else if (lvl === 'debug') console.debug(line, meta ?? ''); else console.log(line, meta ?? ''); };
export default { level: ACTIVE, debug: (m, meta) => out('debug', m, meta), info: (m, meta) => out('info', m, meta), warn: (m, meta) => out('warn', m, meta), error: (m, meta) => out('error', m, meta) };
