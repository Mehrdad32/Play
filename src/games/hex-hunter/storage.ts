import {createQuestion,dayUTC,MODES,start,type Mode,type State,type Phase} from './engine';
export const sessionKey=(mode:Mode)=>'m32.playground.v1.hexHunter.session.'+mode;
export const statsKey='m32.playground.v1.hexHunter.stats';
export type RecordRow={plays:number;wins:number;bestRound:number;bestScore:number;bestStreak:number;perfect:number};
export type Stats={byMode:Record<Mode,RecordRow>;daily:Record<string,number>;earnedM32:boolean};
const blankRow=():RecordRow=>({plays:0,wins:0,bestRound:0,bestScore:0,bestStreak:0,perfect:0});
export const emptyStats=():Stats=>({byMode:{decode:blankRow(),odd:blankRow(),mix:blankRow(),daily:blankRow()},daily:{},earnedM32:false});
function loadJson(key:string):unknown{try{const value=localStorage.getItem(key);return value?JSON.parse(value) as unknown:null;}catch{return null;}}
function saveJson(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* browser storage unavailable */}}
const valid=(n:unknown,min:number,max:number):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=min&&n<=max;
const validHex=(x:unknown)=>typeof x==='string'&&/^#[A-Fa-f0-9]{6}$/.test(x);
export function parseState(raw:unknown,mode:Mode):State|null {
  if(!raw||typeof raw!=='object')return null;
  const s=raw as Partial<State>;
  if(s.version!==1||s.mode!==mode||!valid(s.seed,0,4294967295)||!valid(s.round,1,32)
    ||(mode==='daily'&&s.round>8)||!valid(s.lives,0,3)||!valid(s.score,0,1e8)
    ||!valid(s.streak,0,32)||!valid(s.bestStreak,0,32)||!valid(s.correctCount,0,32)
    ||!['question','feedback','lost','won'].includes(s.phase as Phase)
    ||!valid(s.startedAt,0,Number.MAX_SAFE_INTEGER)||!valid(s.updatedAt,0,Number.MAX_SAFE_INTEGER)
    ||(s.finishedAt!==null&&!valid(s.finishedAt,0,Number.MAX_SAFE_INTEGER))
    ||typeof s.unlocked32!=='boolean'
    ||(mode==='daily'?!/^\d{4}-\d{2}-\d{2}$/.test(s.day??''):s.day!==null))return null;
  const canonical=createQuestion(mode,s.seed,s.round);
  if(s.phase==='question'&&s.feedback!==null)return null;
  if(s.phase!=='question'){
    const f=s.feedback;
    if(!f||typeof f.correct!=='boolean'||!validHex(f.answer)||!validHex(f.chosen)
      ||!valid(f.points,0,100000)||(f.distance!==undefined&&!valid(f.distance,0,443)))return null;
    if(f.answer!==(canonical.kind==='odd'?canonical.different:canonical.target))return null;
  }
  if(s.phase==='won'&&s.round!==(mode==='daily'?8:32))return null;
  if(s.phase==='lost'&&s.lives!==0)return null;
  if((s.phase==='lost'||s.phase==='won')!== (s.finishedAt!==null))return null;
  return {...s,question:canonical} as State;
}
export const loadSession=(mode:Mode)=>parseState(loadJson(sessionKey(mode)),mode);
export const saveSession=(state:State)=>saveJson(sessionKey(state.mode),state);
export function loadStats():Stats {
  const s=loadJson(statsKey);
  const blank=emptyStats();
  if(!s||typeof s!=='object')return blank;
  const input=s as Partial<Stats>;
  for(const mode of MODES){
    const row=input.byMode?.[mode];
    if(row&&typeof row==='object'){
      blank.byMode[mode]={
        plays:valid(row.plays,0,1e7)?row.plays:0,
        wins:valid(row.wins,0,1e7)?row.wins:0,
        bestRound:valid(row.bestRound,0,32)?row.bestRound:0,
        bestScore:valid(row.bestScore,0,1e8)?row.bestScore:0,
        bestStreak:valid(row.bestStreak,0,32)?row.bestStreak:0,
        perfect:valid(row.perfect,0,1e7)?row.perfect:0
      };
    }
  }
  blank.earnedM32=input.earnedM32===true;
  if(input.daily&&typeof input.daily==='object'&&!Array.isArray(input.daily))
    for(const [key,value] of Object.entries(input.daily).slice(-60))
      if(/^\d{4}-\d{2}-\d{2}$/.test(key)&&valid(value,0,1e8))blank.daily[key]=value;
  return blank;
}
const saveStats=(s:Stats)=>saveJson(statsKey,s);
export function beginNew(mode:Mode,now=Date.now(),rng=Math.random):State {
  const s=start(mode,now,rng);
  const stats=loadStats();stats.byMode[mode].plays++;
  saveStats(stats);saveSession(s);return s;
}
export function restore(mode:Mode,now=Date.now()):State|null {
  const s=loadSession(mode);
  if(s&&mode==='daily'&&s.day!==dayUTC(now))return null;
  return s;
}
export function record(previous:State,next:State):Stats {
  const stats=loadStats();
  if(previous.phase!=='question'||next.phase==='question')return stats;
  const row=stats.byMode[next.mode];
  row.bestRound=Math.max(row.bestRound,next.correctCount?next.round:Math.max(0,next.round-1));
  row.bestScore=Math.max(row.bestScore,next.score);
  row.bestStreak=Math.max(row.bestStreak,next.bestStreak);
  if(next.feedback?.correct&&next.lives===3)row.perfect++;
  if(next.phase==='won')row.wins++;
  if(next.unlocked32)stats.earnedM32=true;
  if(next.mode==='daily'&&next.day&&(next.phase==='won'||next.phase==='lost'))
    stats.daily[next.day]=Math.max(stats.daily[next.day]??0,next.score);
  saveStats(stats);return stats;
}
