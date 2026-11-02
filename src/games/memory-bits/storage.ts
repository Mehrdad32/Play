import { modes, resume, start, type Mode, type Phase, type State } from './engine';
export const key = (mode: Mode) => 'm32.playground.v1.memoryBits.session.' + mode;
export const STATS_KEY = 'm32.playground.v1.memoryBits.stats';
export type RecordMode = { plays: number; bestRound: number; bestScore: number; wins: number; bestCombo: number };
export type Stats = { modes: Record<Mode, RecordMode>; unlocked32: boolean; daily: Record<string,number> };
const record = (): RecordMode => ({ plays:0,bestRound:0,bestScore:0,wins:0,bestCombo:0 });
export const emptyStats = (): Stats => ({modes:{classic:record(),reverse:record(),glitch:record(),daily:record()},unlocked32:false,daily:{}});
function read(k:string):unknown{try{const s=localStorage.getItem(k);return s===null?null:JSON.parse(s) as unknown;}catch{return null;}}
function write(k:string,v:unknown){try{localStorage.setItem(k,JSON.stringify(v));}catch{/* private mode/storage quota */}}
const int=(n:unknown,min:number,max:number):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=min&&n<=max;
export function parseState(value:unknown, mode:Mode):State|null {
  if(!value||typeof value!=='object')return null;
  const x=value as Partial<State>;
  if(x.version!==1||x.mode!==mode||!int(x.seed,0,4294967295)||!int(x.round,1,64)
    ||!Array.isArray(x.sequence)||x.sequence.length!==x.round+1||!x.sequence.every(n=>int(n,0,15))
    ||!int(x.inputIndex,0,x.sequence.length)||!['ready','showing','input','between','lost','won'].includes(x.phase as Phase)
    ||!int(x.score,0,10000000)||!int(x.combo,0,64)||!int(x.bestCombo,0,64)
    ||typeof x.unlocked32!=='boolean'||!int(x.startedAt,0,Number.MAX_SAFE_INTEGER)
    ||!int(x.updatedAt,0,Number.MAX_SAFE_INTEGER)
    ||(x.finishedAt!==null&&!int(x.finishedAt,0,Number.MAX_SAFE_INTEGER))
    ||(x.mode==='daily'?!/^\d{4}-\d{2}-\d{2}$/.test(x.day??''):x.day!==null))return null;
  return resume(x as State);
}
export function loadSession(mode:Mode):State|null{return parseState(read(key(mode)),mode);}
export function saveSession(state:State){write(key(state.mode),state);}
export function loadStats():Stats {
  const data=read(STATS_KEY);
  if(!data||typeof data!=='object')return emptyStats();
  const s=data as Partial<Stats>;
  const result=emptyStats();
  for(const mode of modes){
    const r=s.modes?.[mode];
    if(!r||typeof r!=='object')continue;
    result.modes[mode]={
      plays:int(r.plays,0,9999999)?r.plays:0,
      bestRound:int(r.bestRound,0,64)?r.bestRound:0,
      bestScore:int(r.bestScore,0,10000000)?r.bestScore:0,
      wins:int(r.wins,0,9999999)?r.wins:0,
      bestCombo:int(r.bestCombo,0,64)?r.bestCombo:0
    };
  }
  result.unlocked32=s.unlocked32===true;
  if(s.daily&&typeof s.daily==='object'&&!Array.isArray(s.daily)){
    for(const [day,score] of Object.entries(s.daily).slice(-60)){
      if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&int(score,0,10000000))result.daily[day]=score;
    }
  }
  return result;
}
export function saveStats(stats:Stats){write(STATS_KEY,stats);}
export function startSession(mode:Mode,now=Date.now(),random=Math.random):State{
  const state=start(mode,now,random);
  const stats=loadStats();
  stats.modes[mode].plays++;
  saveStats(stats);saveSession(state);
  return state;
}
export function recordResult(state:State,previous:State):Stats {
  const stats=loadStats(),r=stats.modes[state.mode];
  r.bestRound=Math.max(r.bestRound,state.phase==='lost'?state.round-1:state.round);
  r.bestScore=Math.max(r.bestScore,state.score);
  r.bestCombo=Math.max(r.bestCombo,state.bestCombo);
  if(!previous.unlocked32&&state.unlocked32)stats.unlocked32=true;
  if(previous.phase!=='won'&&state.phase==='won')r.wins++;
  if(state.mode==='daily'&&state.day&&state.phase==='won'){
    stats.daily[state.day]=Math.max(stats.daily[state.day]??0,state.score);
  }
  saveStats(stats);
  return stats;
}
