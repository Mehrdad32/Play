/** Isolated local records. Active, time-sensitive runs deliberately aren't restored after a reload. */
import {MODES,median,totalHits,type Mode,type State} from './engine';
export const key='m32.playground.v1.reaction32.stats';
export type ModeStats={
  plays:number;completions:number;bestScore:number;fastestMs:number|null;
  bestMedianMs:number|null;mostHits:number;leastFalseStarts:number|null;
};
export type Stats={modes:Record<Mode,ModeStats>;duelWins:[number,number];duelTies:number;earnedM32:boolean};
const emptyMode=():ModeStats=>({plays:0,completions:0,bestScore:0,fastestMs:null,bestMedianMs:null,mostHits:0,leastFalseStarts:null});
export const emptyStats=():Stats=>({modes:{classic:emptyMode(),rush:emptyMode(),precision:emptyMode(),duel:emptyMode()},
  duelWins:[0,0],duelTies:0,earnedM32:false});
function read():unknown{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as unknown:null;}catch{return null;}}
function write(v:unknown){try{localStorage.setItem(key,JSON.stringify(v));}catch{/* blocked or storage full */}}
const valid=(n:unknown,max=1e10):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0&&n<=max;
const nullable=(n:unknown,max=1e10):number|null=>n===null||!valid(n,max)?null:n;
export function loadStats():Stats {
  const data=read(),base=emptyStats();
  if(!data||typeof data!=='object')return base;
  const s=data as Partial<Stats>;
  for(const mode of MODES){
    const r=s.modes?.[mode];
    if(!r||typeof r!=='object')continue;
    base.modes[mode]={
      plays:valid(r.plays)?r.plays:0,
      completions:valid(r.completions)?r.completions:0,
      bestScore:valid(r.bestScore)?r.bestScore:0,
      fastestMs:nullable(r.fastestMs),
      bestMedianMs:nullable(r.bestMedianMs),
      mostHits:valid(r.mostHits)?r.mostHits:0,
      leastFalseStarts:nullable(r.leastFalseStarts)
    };
  }
  const wins=s.duelWins;
  if(Array.isArray(wins)&&wins.length===2&&wins.every(n=>valid(n)))base.duelWins=[wins[0],wins[1]];
  if(valid(s.duelTies))base.duelTies=s.duelTies;
  base.earnedM32=s.earnedM32===true;
  return base;
}
export function startRun(mode:Mode):Stats{
  const s=loadStats();s.modes[mode].plays++;write(s);return s;
}
export function recordRun(game:State,resultWinner:0|1|null):Stats{
  const s=loadStats();
  if(game.phase!=='finished')return s;
  const r=s.modes[game.mode];
  r.completions++;
  r.bestScore=Math.max(r.bestScore,game.score);
  r.mostHits=Math.max(r.mostHits,totalHits(game));
  const hits=game.mode==='duel'?[...game.hits[0],...game.hits[1]]:game.hits[0];
  const fastest=hits.length?Math.min(...hits):null;
  const med=median(hits);
  if(fastest!==null)r.fastestMs=r.fastestMs===null?fastest:Math.min(r.fastestMs,fastest);
  if(med!==null)r.bestMedianMs=r.bestMedianMs===null?med:Math.min(r.bestMedianMs,med);
  const falseStarts=game.falseStarts[0]+game.falseStarts[1];
  r.leastFalseStarts=r.leastFalseStarts===null?falseStarts:Math.min(r.leastFalseStarts,falseStarts);
  if(game.mode==='duel'){if(resultWinner===null)s.duelTies++;else s.duelWins[resultWinner]++;}
  if(game.mode==='rush'&&totalHits(game)>=32)s.earnedM32=true;
  write(s);return s;
}
