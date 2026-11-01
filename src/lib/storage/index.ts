import { cloneBoard, newGame, highestTile, type GameState, type Snapshot } from '../../games/m32-merge/engine';

export const keys = {
  session: 'm32.playground.v1.merge.session',
  stats: 'm32.playground.v1.merge.stats',
  bestScore: 'm32.playground.v1.merge.bestScore',
  settings: 'm32.playground.v1.settings'
} as const;
export type Stats = { games: number; wins: number; bestScore: number; highestTile: number; total32: number; lastPlayedAt: number | null };
export type Settings = { locale: 'fa' | 'en'; sound: boolean; motion: 'auto' | 'full' | 'off' };
export const initialStats: Stats = { games: 0, wins: 0, bestScore: 0, highestTile: 0, total32: 0, lastPlayedAt: null };
export const initialSettings: Settings = { locale: 'fa', sound: false, motion: 'auto' };
function read(key: string): unknown {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as unknown : null; } catch { return null; }
}
function write(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota/privacy denied */ }
}
function safeInteger(value: unknown, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= maximum;
}
function safeBoard(value: unknown): value is number[][] {
  return Array.isArray(value) && value.length === 4 &&
    value.every(row => Array.isArray(row) && row.length === 4 &&
      row.every(v => safeInteger(v, 131072) && (v === 0 || (v >= 2 && (v & (v - 1)) === 0))));
}
function safeSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<Snapshot>;
  return safeBoard(s.board) && safeInteger(s.score) && safeInteger(s.moves)
    && typeof s.won === 'boolean' && typeof s.over === 'boolean'
    && typeof s.continued === 'boolean' && safeInteger(s.merge32Count);
}
export function parseSession(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object' || !safeSnapshot(raw)) return null;
  const s = raw as Partial<GameState>;
  if (!safeInteger(s.startedAt) || !safeInteger(s.lastPlayedAt)
    || typeof s.paused !== 'boolean' || (s.past !== null && !safeSnapshot(s.past))) return null;
  return { ...s, board: cloneBoard(s.board!), past: s.past ? { ...s.past, board: cloneBoard(s.past.board) } : null } as GameState;
}
export function loadSession(): GameState | null { return parseSession(read(keys.session)); }
export function saveSession(state: GameState): void { write(keys.session, state); }
export function loadStats(): Stats {
  const value = read(keys.stats);
  if (!value || typeof value !== 'object') return { ...initialStats };
  const s = value as Partial<Stats>;
  return {
    games: safeInteger(s.games) ? s.games : 0,
    wins: safeInteger(s.wins) ? s.wins : 0,
    bestScore: safeInteger(s.bestScore) ? s.bestScore : 0,
    highestTile: safeInteger(s.highestTile) ? s.highestTile : 0,
    total32: safeInteger(s.total32) ? s.total32 : 0,
    lastPlayedAt: s.lastPlayedAt === null || safeInteger(s.lastPlayedAt) ? s.lastPlayedAt ?? null : null
  };
}
export function saveStats(stats: Stats): void {
  write(keys.stats, stats);
  try { localStorage.setItem(keys.bestScore, String(stats.bestScore)); } catch { /* ignored */ }
}
export function loadSettings(): Settings {
  const value = read(keys.settings);
  if (!value || typeof value !== 'object') return { ...initialSettings };
  const s = value as Partial<Settings>;
  return { locale: s.locale === 'en' ? 'en' : 'fa', sound: s.sound === true,
    motion: s.motion === 'full' || s.motion === 'off' ? s.motion : 'auto' };
}
export function saveSettings(settings: Settings): void { write(keys.settings, settings); }
export function resetStats(): Stats { saveStats({ ...initialStats }); return { ...initialStats }; }
export function recordNewGame(state: GameState, previous: Stats): Stats {
  const next = { ...previous, games: previous.games + 1,
    highestTile: Math.max(previous.highestTile, highestTile(state.board)), lastPlayedAt: state.lastPlayedAt };
  saveStats(next); saveSession(state); return next;
}
export function recordMove(previous: GameState, next: GameState, created32: number, stats: Stats): Stats {
  const updated = { ...stats, bestScore: Math.max(stats.bestScore, next.score),
    highestTile: Math.max(stats.highestTile, highestTile(next.board)),
    total32: stats.total32 + created32, wins: stats.wins + (next.won && !previous.won ? 1 : 0),
    lastPlayedAt: next.lastPlayedAt };
  saveStats(updated); return updated;
}
export function getOrStartSession(): GameState {
  const existing = loadSession();
  if (existing) return existing;
  const game = newGame();
  recordNewGame(game, loadStats());
  return game;
}
