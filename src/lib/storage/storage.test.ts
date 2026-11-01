import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { newGame } from '../../games/m32-merge/engine';
import { getOrStartSession, keys, loadSession, loadSettings, loadStats, parseSession, recordMove, resetStats, saveSession, saveSettings } from './index';
const memory = new Map<string, string>();
beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => { memory.set(k, v); },
    removeItem: (k: string) => { memory.delete(k); }
  });
  memory.clear();
});
afterEach(() => vi.unstubAllGlobals());
describe('versioned local storage', () => {
  it('round-trips a game with undo history', () => {
    const state = newGame(() => 0, 123);
    saveSession(state);
    expect(loadSession()).toEqual(state);
  });
  it('rejects broken/obsolete sessions without crashing', () => {
    memory.set(keys.session, '{broken json');
    expect(loadSession()).toBeNull();
    memory.set(keys.session, JSON.stringify({ board: [] }));
    expect(loadSession()).toBeNull();
    expect(parseSession({})).toBeNull();
    expect(getOrStartSession().board.flat().filter(Boolean)).toHaveLength(2);
  });
  it('tracks best, wins and M32 achievements and supports reset', () => {
    const game = newGame(() => 0, 100);
    const updated = recordMove(game, { ...game, score: 100, won: true }, 2, loadStats());
    expect(updated.bestScore).toBe(100);
    expect(updated.wins).toBe(1);
    expect(updated.total32).toBe(2);
    expect(resetStats()).toEqual(loadStats());
    expect(loadStats().total32).toBe(0);
  });
  it('restores settings and protects against invalid ones', () => {
    saveSettings({ locale: 'en', sound: true, motion: 'off' });
    expect(loadSettings().locale).toBe('en');
    memory.set(keys.settings, JSON.stringify({ locale: 'xx', sound: 'true', motion: -1 }));
    expect(loadSettings()).toEqual({ locale: 'fa', sound: false, motion: 'auto' });
  });
});
