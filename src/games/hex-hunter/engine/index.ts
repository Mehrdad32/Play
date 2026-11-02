/** HEX Hunter gameplay engine. Pure, deterministic and independent of the browser. */
export type Mode = 'decode' | 'odd' | 'mix' | 'daily';
export type RGB = [number, number, number];
export type Hex = `#${string}`;
export type Decode = { kind:'decode'; target:Hex; options:Hex[]; answer:number };
export type Odd = { kind:'odd'; base:Hex; different:Hex; answer:number; count:number };
export type Mix = { kind:'mix'; target:Hex; initial:RGB; tolerance:number };
export type Question = Decode | Odd | Mix;
export type Feedback = { correct:boolean; answer:Hex; chosen:Hex; points:number; distance?:number };
export type Phase = 'question' | 'feedback' | 'lost' | 'won';
export type State = {
  version:1; mode:Mode; day:string|null; seed:number; round:number;
  phase:Phase; lives:number; score:number; streak:number; bestStreak:number;
  correctCount:number; question:Question; feedback:Feedback|null;
  startedAt:number; updatedAt:number; finishedAt:number|null; unlocked32:boolean;
};
export const MODES: Mode[]=['decode','odd','mix','daily'];
export const DAILY_LENGTH=8;
export const MAX_ROUNDS=32;
export const dayUTC=(now:number)=>new Date(now).toISOString().slice(0,10);
export function hashSeed(text:string):number {
  let n=2166136261;
  for(let i=0;i<text.length;i++)n=Math.imul(n^text.charCodeAt(i),16777619);
  return n>>>0;
}
export function randomFromSeed(seed:number):()=>number {
  let s=seed>>>0;
  return ()=>{
    s=(s+0x6D2B79F5)>>>0;
    let t=Math.imul(s^(s>>>15),1|s);
    t^=t+Math.imul(t^(t>>>7),61|t);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
export const clamp=(n:number)=>Math.max(0,Math.min(255,Math.round(n)));
export function toHex([r,g,b]:RGB):Hex {
  return `#${[r,g,b].map(n=>clamp(n).toString(16).padStart(2,'0')).join('').toUpperCase()}`;
}
export function toRgb(hex:string):RGB {
  if(!/^#[0-9A-Fa-f]{6}$/.test(hex))throw Error('Invalid HEX');
  return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)) as RGB;
}
export function distance(a:RGB,b:RGB):number {
  return Math.round(Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]));
}
const choice=(rng:()=>number,n:number)=>Math.floor(rng()*n);
const baseColor=(rng:()=>number):RGB=>[0,1,2].map(()=>35+choice(rng,186)) as RGB;
function variant(source:RGB,rng:()=>number,delta:number,used:Set<string>):Hex {
  for(let attempt=0;attempt<40;attempt++){
    const chan=choice(rng,3),sign=rng()<.5?-1:1;
    const result:[number,number,number]=[...source] as RGB;
    const shift=delta+choice(rng,Math.max(6,Math.ceil(delta*.65)));
    result[chan]=clamp(result[chan]+sign*shift);
    if(result[chan]===source[chan])result[chan]=clamp(result[chan]-sign*shift);
    const hex=toHex(result);
    if(!used.has(hex)){used.add(hex);return hex;}
  }
  throw Error('No unique swatch generated');
}
export function createQuestion(mode:Mode,seed:number,round:number):Question {
  if(round<1||round>MAX_ROUNDS)throw Error('Invalid round');
  const rng=randomFromSeed((seed^hashSeed(mode)^Math.imul(round,0x9E3779B9))>>>0);
  const kind:Exclude<Mode,'daily'>=mode==='daily'?(['decode','odd','mix'] as const)[(round-1)%3]:mode;
  const color=baseColor(rng);
  if(kind==='decode'){
    const target=toHex(color),used=new Set([target]);
    const delta=Math.max(14,78-round*2);
    const options:Hex[]=[target];
    for(let i=0;i<3;i++)options.push(variant(color,rng,delta,used));
    for(let i=options.length-1;i>0;i--){const j=choice(rng,i+1);[options[i],options[j]]=[options[j],options[i]];}
    return {kind,target,options,answer:options.indexOf(target)};
  }
  if(kind==='odd'){
    const base=toHex(color),used=new Set([base]);
    const different=variant(color,rng,Math.max(11,68-round*2),used);
    const count=round<=4?9:round<=13?16:25;
    return {kind,base,different,count,answer:choice(rng,count)};
  }
  const initial:RGB=[128,128,128];
  return {kind:'mix',target:toHex(color),initial,tolerance:Math.max(18,60-round)};
}
export function start(mode:Mode,now=Date.now(),rng=Math.random):State {
  const day=mode==='daily'?dayUTC(now):null;
  const seed=mode==='daily'?hashSeed('M32-HEX-HUNTER-V1-'+day):Math.floor(rng()*4294967296)>>>0;
  return {version:1,mode,day,seed,round:1,phase:'question',lives:3,score:0,streak:0,bestStreak:0,
    correctCount:0,question:createQuestion(mode,seed,1),feedback:null,
    startedAt:now,updatedAt:now,finishedAt:null,unlocked32:false};
}
export function submit(state:State,input:number|RGB,now=Date.now()):State {
  if(state.phase!=='question')return state;
  const q=state.question;
  let chosen:Hex,correct=false,delta: number|undefined;
  if(q.kind==='mix'){
    if(!Array.isArray(input)||input.length!==3||!input.every(v=>Number.isInteger(v)&&v>=0&&v<=255))return state;
    chosen=toHex(input as RGB);
    delta=distance(input as RGB,toRgb(q.target));
    correct=delta<=q.tolerance;
  }else{
    if(typeof input!=='number'||!Number.isInteger(input))return state;
    const count=q.kind==='decode'?q.options.length:q.count;
    if(input<0||input>=count)return state;
    chosen=q.kind==='decode'?q.options[input]:input===q.answer?q.different:q.base;
    correct=input===q.answer;
  }
  const answer=q.kind==='odd'?q.different:q.target;
  const streak=correct?state.streak+1:0;
  const lives=correct?state.lives:state.lives-1;
  const points=correct?100+state.round*12+Math.min(32,streak)*16+(q.kind==='mix'&&delta!==undefined?Math.max(0,60-delta):0):0;
  const finished=correct&&(state.round===(state.mode==='daily'?DAILY_LENGTH:MAX_ROUNDS));
  const lost=lives<=0;
  return {...state,score:state.score+points,lives,streak,bestStreak:Math.max(state.bestStreak,streak),
    correctCount:state.correctCount+(correct?1:0),updatedAt:now,unlocked32:state.unlocked32||(correct&&state.round===32),
    phase:finished?'won':lost?'lost':'feedback',finishedAt:finished||lost?now:null,
    feedback:{correct,answer,chosen,points,...(delta===undefined?{}:{distance:delta})}};
}
export function next(state:State,now=Date.now()):State {
  if(state.phase!=='feedback')return state;
  const round=state.round+1;
  if(round>MAX_ROUNDS||(state.mode==='daily'&&round>DAILY_LENGTH))return state;
  return {...state,round,phase:'question',question:createQuestion(state.mode,state.seed,round),
    feedback:null,updatedAt:now};
}
