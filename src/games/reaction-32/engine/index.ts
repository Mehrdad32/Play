/** Reaction 32: pure game rules. Timing is supplied by the caller's monotonic clock. */
export type Mode = 'classic' | 'rush' | 'precision' | 'duel';
export type Phase = 'ready' | 'waiting' | 'go' | 'decoy' | 'result' | 'finished';
export type Signal = 'go' | 'decoy';
export type Outcome = 'hit' | 'false-start' | 'decoy-avoided';
export type Trial = { player: 0 | 1; kind: Outcome; ms: number | null; points: number };
export type State = {
  mode: Mode; phase: Phase; player: 0 | 1; attempts: [number, number];
  hits: [number[], number[]]; falseStarts: [number, number]; trials: Trial[];
  score: number; bestStreak: number; streak: number; decoysAvoided: number;
  decoyChain: number; last: Trial | null; started: boolean;
};
export const MODES: Mode[] = ['classic', 'rush', 'precision', 'duel'];
export const TARGET = { classic: 5, precision: 10, duel: 5 } as const;
export const RUSH_MS = 32000;
export const waitMs = (random: number, mode: Mode = 'classic') => mode === 'rush'\n  ? 180 + Math.floor(Math.max(0, Math.min(0.999999, random)) * 420)\n  : 1200 + Math.floor(Math.max(0, Math.min(0.999999, random)) * 2300);
export function create(mode: Mode): State {
  return { mode, phase: 'ready', player: 0, attempts: [0,0], hits: [[],[]],
    falseStarts: [0,0], trials: [], score: 0, streak: 0, bestStreak: 0,
    decoysAvoided: 0, decoyChain: 0, last: null, started: false };
}
export function totalAttempts(s: State): number { return s.attempts[0] + s.attempts[1]; }
export function totalHits(s: State): number { return s.hits[0].length + s.hits[1].length; }
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b)=>a-b);
  const center = Math.floor(sorted.length/2);
  return Math.round(sorted.length%2 ? sorted[center] : (sorted[center-1]+sorted[center])/2);
}
export function scoreFor(ms: number): number {
  return Math.max(20, Math.round(360 - Math.min(ms,1000)*0.45));
}
export function begin(s: State): State {
  if (s.phase !== 'ready') return s;
  return { ...s, phase: 'waiting', started: true, last: null };
}
export function chooseSignal(s: State, random: number): Signal {
  return s.mode === 'precision' && s.decoyChain < 2 && random < .35 ? 'decoy' : 'go';
}
export function reveal(s: State, signal: Signal): State {
  if (s.phase !== 'waiting') return s;
  if (signal === 'decoy' && (s.mode !== 'precision' || s.decoyChain >= 2)) return s;
  return { ...s, phase: signal, decoyChain: signal === 'decoy' ? s.decoyChain + 1 : 0 };
}
export function avoidDecoy(s: State): State {
  if (s.phase !== 'decoy') return s;
  const trial: Trial = { player: s.player, kind: 'decoy-avoided', ms:null, points: 0 };
  return { ...s, phase: 'waiting', decoysAvoided: s.decoysAvoided + 1,
    last: trial, trials: [...s.trials, trial] };
}
function conclude(s: State, trial: Trial): State {
  const player = s.player;
  const attempts = [...s.attempts] as [number,number];
  const starts = [...s.falseStarts] as [number,number];
  const hits: [number[],number[]] = [[...s.hits[0]], [...s.hits[1]]];
  attempts[player]++;
  if (trial.kind === 'false-start') starts[player]++;
  if (trial.ms !== null) hits[player].push(trial.ms);
  const streak = trial.kind === 'hit' ? s.streak+1 : 0;
  const total = attempts[0]+attempts[1];
  const finished = s.mode === 'classic' ? total >= TARGET.classic
    : s.mode === 'precision' ? total >= TARGET.precision
    : s.mode === 'duel' ? total >= TARGET.duel*2 : false;
  return { ...s, attempts, falseStarts: starts, hits, streak,
    bestStreak: Math.max(streak,s.bestStreak), trials: [...s.trials,trial], last:trial,
    score: Math.max(0,s.score+trial.points),
    phase: finished ? 'finished' : 'result',
    player: s.mode === 'duel' ? (player===0?1:0) : player };
}
export function press(s: State, reactionMs: number | null): State {
  if (s.phase !== 'waiting' && s.phase !== 'decoy' && s.phase !== 'go') return s;
  if (s.phase === 'go') {
    if (reactionMs === null || !Number.isFinite(reactionMs) || reactionMs < 0) return s;
    const ms = Math.round(reactionMs);
    const points = scoreFor(ms) + (s.mode === 'rush' ? Math.min(s.streak,8)*12 : 0);
    return conclude(s,{player:s.player,kind:'hit',ms,points});
  }
  return conclude(s,{player:s.player,kind:'false-start',ms:null,points:s.mode==='rush'?-180:0});
}
export function next(s: State): State {
  return s.phase==='result' ? {...s,phase:'ready',last:null} : s;
}
export function finishRush(s: State): State {
  return s.mode==='rush' && s.phase!=='finished' && s.started
    ? {...s,phase:'finished'} : s;
}
export function winner(s: State): 0 | 1 | null {
  if(s.mode!=='duel' || s.phase!=='finished')return null;
  const a=median(s.hits[0]),b=median(s.hits[1]);
  if(a===null&&b===null)return null;
  if(a===null)return 1;
  if(b===null)return 0;
  if(a!==b)return a<b?0:1;
  if(s.falseStarts[0]!==s.falseStarts[1])return s.falseStarts[0]<s.falseStarts[1]?0:1;
  return null;
}
