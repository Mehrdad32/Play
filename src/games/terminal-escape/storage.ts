import { createGame, type Entry, type GameState } from './engine';
export const TERMINAL_SESSION_KEY = 'm32.playground.v1.terminalEscape.session';
export const TERMINAL_STATS_KEY = 'm32.playground.v1.terminalEscape.stats';
export type TerminalStats = {
  games: number; escapes: number; bestScore: number; fastestSeconds: number | null;
  leastCommands: number | null; lastPlayedAt: number | null;
};
export const emptyStats:TerminalStats={games:0,escapes:0,bestScore:0,fastestSeconds:null,leastCommands:null,lastPlayedAt:null};
const safeNumber=(n:unknown,max=Number.MAX_SAFE_INTEGER):n is number=>Number.isSafeInteger(n)&&typeof n==='number'&&n>=0&&n<=max;
function read(key:string):unknown {
  try { const raw=localStorage.getItem(key); return raw===null?null:JSON.parse(raw) as unknown; } catch{return null;}
}
function write(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* storage can be disabled */}}
const validEntry=(e:unknown):e is Entry=>{
  if(!e||typeof e!=='object')return false;
  const v=e as Partial<Entry>;
  return safeNumber(v.id)&&typeof v.command==='string'&&v.command.length<=120&&Array.isArray(v.lines)&&v.lines.length<=12
    &&v.lines.every(x=>x&&typeof x.fa==='string'&&typeof x.en==='string'
    &&x.fa.length<=1000&&x.en.length<=1000&&['normal','accent','error','success','muted'].includes(x.tone));
};
export function parseGame(value:unknown):GameState|null {
  if(!value||typeof value!=='object')return null;
  const x=value as Partial<GameState>;
  if(x.version!==1||!safeNumber(x.stage,5)||(x.cwd!=='/'&&x.cwd!=='/cache')
    ||!Array.isArray(x.found)||x.found.length>40||!x.found.every(f=>typeof f==='string'&&f.length<70)
    ||!safeNumber(x.commands)||!safeNumber(x.mistakes)||!safeNumber(x.hintsUsed)
    ||typeof x.easterEgg!=='boolean'||!safeNumber(x.startedAt)
    ||(x.finishedAt!==null&&!safeNumber(x.finishedAt))||!safeNumber(x.score,5000)
    ||!Array.isArray(x.history)||x.history.length>100||!x.history.every(validEntry))return null;
  if((x.stage===5)!==(x.finishedAt!==null))return null;
  return x as GameState;
}
export function loadTerminalGame():GameState|null {return parseGame(read(TERMINAL_SESSION_KEY));}
export function saveTerminalGame(game:GameState) {write(TERMINAL_SESSION_KEY,game);}
export function loadTerminalStats():TerminalStats {
  const raw=read(TERMINAL_STATS_KEY);
  if(!raw||typeof raw!=='object')return {...emptyStats};
  const s=raw as Partial<TerminalStats>;
  return {games:safeNumber(s.games)?s.games:0,escapes:safeNumber(s.escapes)?s.escapes:0,
    bestScore:safeNumber(s.bestScore,5000)?s.bestScore:0,
    fastestSeconds:s.fastestSeconds===null||safeNumber(s.fastestSeconds)?s.fastestSeconds??null:null,
    leastCommands:s.leastCommands===null||safeNumber(s.leastCommands)?s.leastCommands??null:null,
    lastPlayedAt:s.lastPlayedAt===null||safeNumber(s.lastPlayedAt)?s.lastPlayedAt??null:null};
}
export function saveTerminalStats(stats:TerminalStats){write(TERMINAL_STATS_KEY,stats);}
export function startTerminalGame(now=Date.now()){
  const game=createGame(now);saveTerminalGame(game);
  const prev=loadTerminalStats();
  saveTerminalStats({...prev,games:prev.games+1,lastPlayedAt:now});
  return game;
}
export function resumeOrStartTerminal(){
  const saved=loadTerminalGame();return saved??startTerminalGame();
}
export function recordTerminalEscape(game:GameState,now=Date.now()){
  if(game.stage!==5||game.finishedAt===null)return loadTerminalStats();
  const old=loadTerminalStats();
  const seconds=Math.max(0,Math.floor((game.finishedAt-game.startedAt)/1000));
  const updated={...old,escapes:old.escapes+1,bestScore:Math.max(old.bestScore,game.score),
    fastestSeconds:old.fastestSeconds===null?seconds:Math.min(old.fastestSeconds,seconds),
    leastCommands:old.leastCommands===null?game.commands:Math.min(old.leastCommands,game.commands),
    lastPlayedAt:now};
  saveTerminalStats(updated);return updated;
}
