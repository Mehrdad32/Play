/** Pure Memory Bits rules: no React, timers, browser APIs, storage, or networking. */
export type Mode = 'classic' | 'reverse' | 'glitch' | 'daily';
export type Phase = 'ready' | 'showing' | 'input' | 'between' | 'lost' | 'won';
export type Cue = { cell: number; kind: 'target' | 'decoy' };
export type State = {
  version: 1; mode: Mode; day: string | null; seed: number;
  round: number; sequence: number[]; inputIndex: number; phase: Phase;
  score: number; combo: number; bestCombo: number; unlocked32: boolean;
  startedAt: number; updatedAt: number; finishedAt: number | null;
};
export const modes: Mode[] = ['classic', 'reverse', 'glitch', 'daily'];
export const DAILY_ROUNDS = 8;
export const MAX_ROUND = 64;
export const dayUTC = (now: number) => new Date(now).toISOString().slice(0, 10);
export function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}
export function rngFromSeed(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function pattern(mode: Mode, seed: number, round: number): number[] {
  const random = rngFromSeed((seed ^ hashSeed(mode) ^ Math.imul(round, 0x9E3779B9)) >>> 0);
  return Array.from({ length: round + 1 }, () => Math.floor(random() * 16));
}
export function start(mode: Mode, now = Date.now(), random: () => number = Math.random): State {
  const day = mode === 'daily' ? dayUTC(now) : null;
  const seed = mode === 'daily' ? hashSeed('M32-MEMORY-V1-' + day) : Math.floor(random() * 4294967296) >>> 0;
  return {
    version: 1, mode, day, seed, round: 1, sequence: pattern(mode, seed, 1),
    inputIndex: 0, phase: 'ready', score: 0, combo: 0, bestCombo: 0,
    unlocked32: false, startedAt: now, updatedAt: now, finishedAt: null
  };
}
export function expected(state: State): number[] {
  return state.mode === 'reverse' ? [...state.sequence].reverse() : state.sequence;
}
export function cues(state: State): Cue[] {
  if (state.mode !== 'glitch') return state.sequence.map(cell => ({ cell, kind: 'target' }));
  const random = rngFromSeed((state.seed ^ Math.imul(state.round, 0x85EBCA6B) ^ 0xACEDBEEF) >>> 0);
  const result: Cue[] = [];
  for (const cell of state.sequence) {
    if (random() < 0.45) {
      let decoy = Math.floor(random() * 15);
      if (decoy >= cell) decoy++;
      result.push({ cell: decoy, kind: 'decoy' });
    }
    result.push({ cell, kind: 'target' });
  }
  return result;
}
export function begin(state: State, now = Date.now()): State {
  if (state.phase !== 'ready') return state;
  return { ...state, phase: 'showing', updatedAt: now };
}
export function playbackDone(state: State, now = Date.now()): State {
  return state.phase === 'showing' ? { ...state, phase: 'input', updatedAt: now } : state;
}
export type Guess = { state: State; outcome: 'ignored' | 'correct' | 'round' | 'wrong' | 'won'; expectedCell?: number };
export function guess(state: State, cell: number, now = Date.now()): Guess {
  if (state.phase !== 'input' || !Number.isInteger(cell) || cell < 0 || cell > 15) {
    return { state, outcome: 'ignored' };
  }
  const order = expected(state);
  const expectedCell = order[state.inputIndex];
  if (cell !== expectedCell) {
    return { outcome: 'wrong', expectedCell, state: {
      ...state, phase: 'lost', combo: 0, finishedAt: now, updatedAt: now
    } };
  }
  const inputIndex = state.inputIndex + 1;
  if (inputIndex < order.length) {
    return { outcome: 'correct', state: { ...state, inputIndex, updatedAt: now } };
  }
  const combo = state.combo + 1;
  const score = state.score + 100 + state.round * 25 + Math.min(combo, 32) * 15
    + (state.mode === 'reverse' ? 40 : state.mode === 'glitch' ? 55 : state.mode === 'daily' ? 25 : 0);
  const won = (state.mode === 'daily' && state.round === DAILY_ROUNDS) || state.round === MAX_ROUND;
  return {
    outcome: won ? 'won' : 'round',
    state: {
      ...state, inputIndex, score, combo, bestCombo: Math.max(state.bestCombo, combo),
      unlocked32: state.unlocked32 || state.round >= 32,
      phase: won ? 'won' : 'between', finishedAt: won ? now : null, updatedAt: now
    }
  };
}
export function advance(state: State, now = Date.now()): State {
  if (state.phase !== 'between' || state.round >= MAX_ROUND) return state;
  const round = state.round + 1;
  return {
    ...state, round, sequence: pattern(state.mode, state.seed, round),
    inputIndex: 0, phase: 'ready', updatedAt: now
  };
}
/** Interrupted playback must be restarted explicitly, never blindly auto-completed. */
export function resume(state: State): State {
  return state.phase === 'showing' ? { ...state, phase: 'ready', inputIndex: 0 } : state;
}
