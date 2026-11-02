import {useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {Link} from 'react-router-dom';
import {
 ArrowLeft,ArrowUpRight,ChevronRight,CircleHelp,Clock3,Copy,
 Gauge,HeartPulse,Medal,Play,RotateCcw,Share2,ShieldCheck,
 Sparkles,Swords,Target,Trophy,Volume2,VolumeX,X,Zap
} from 'lucide-react';
import type {AppProps} from '../../App';
import {
 begin,chooseSignal,create,finishRush,median,next,press,
 reveal,avoidDecoy,RUSH_MS,totalAttempts,totalHits,waitMs,winner,
 type Mode,type State
} from './engine';
import {loadStats,recordRun,startRun,type Stats} from './storage';
const modes=[
 {id:'classic',name:'CLASSIC',fa:'کلاسیک',en:'Classic',faInfo:'۵ واکنش؛ رکورد میانه و سریع‌ترین زمان',enInfo:'Five attempts. Median and fastest time.',icon:Gauge},
 {id:'rush',name:'32 RUSH',fa:'هجوم ۳۲',en:'32 Rush',faInfo:'۳۲ ثانیه؛ هرچقدر می‌تونی ضربه بزن!',enInfo:'32 seconds. Hit as many signals as you can.',icon:Zap},
 {id:'precision',name:'PRECISION',fa:'دقت رنگ',en:'Precision',faInfo:'۱۰ فرصت؛ سبز رو بزن، بنفش رو نادیده بگیر',enInfo:'10 turns. Hit green, ignore purple.',icon:Target},
 {id:'duel',name:'DUEL',fa:'رقابت دونفره',en:'Duel',faInfo:'دو نفر روی یک دستگاه، هر نفر ۵ تلاش',enInfo:'Two players, five attempts each.',icon:Swords}
] as const;
const copy={
 fa:{
 back:'بازگشت به Playground',headline:'سرعت واکنشت چقدره؟',choose:'حالت بازی رو انتخاب کن',
 start:'شروع بازی',again:'یک دست دیگه',restart:'بازی جدید',restartConfirm:'نتیجه دست فعلی از بین می‌ره. بازی تازه شروع بشه؟',
 hold:'منتظر علامت باش…',go:'الان بزن!',decoy:'نه! لمس نکن!',ready:'آماده‌ای؟',
 goHelp:'وقتی علامت سبز شد، فوراً لمس کن یا Space بزن.',waitHelp:'منتظر علامت سبز باش؛ زود زدن خطا حساب می‌شه.',
 decoyHelp:'بنفش علامت تقلبیه؛ لمسش نکن تا ناپدید بشه.',rushHelp:'تا پایان ۳۲ ثانیه با بیشترین سرعت پاسخ بده.',
 early:'زود زدی!',correct:'عالی! سرعت واکنشت',avoided:'فریب علامت تقلبی رو نخوردی!',hitAgain:'آماده تلاش بعدی؟',
 next:'تلاش بعد',nextPlayer:'نفر بعدی',finished:'پایان چالش!',finishedText:'نتیجه این دست ثبت شد؛ رکوردت رو بهتر کن.',
 share:'اشتراک نتیجه',copied:'نتیجه کپی شد',shareError:'امکان اشتراک‌گذاری نیست',
 attempts:'تلاش‌ها',score:'امتیاز',best:'بهترین امتیاز',reaction:'زمان واکنش',
 median:'میانه زمان',fastest:'سریع‌ترین واکنش',hits:'واکنش‌های موفق',falseStarts:'خطای زودهنگام',
 streak:'زنجیره',remaining:'زمان باقی‌مانده',count:'تعداد واکنش‌ها',
 player1:'بازیکن ۱',player2:'بازیکن ۲',winner:'برنده',tie:'مساوی!',wins:'بردها',
 stats:'رکوردهای دستگاه',plays:'تعداد دست‌ها',complete:'دست‌های کامل',bestMedian:'بهترین میانه',bestHits:'بیشترین واکنش',
 how:'راهنمای بازی',helpIntro:'وقتی صفحه سبز شد فوراً روی صفحه بزرگ بزن. این بازی با ساعت دقیق مرورگر (performance.now) زمان رو اندازه می‌گیره؛ زمان نهایی به سخت‌افزار و نرخ تازه‌سازی صفحه هم بستگی داره.',
 helpModes:'Classic: پنج تلاش و میانه زمان. 32 Rush: سی‌ودو ثانیه پاسخ سریع. Precision: از علامت‌های بنفش دوری کن. Duel: هر دو نفر به نوبت روی یک گوشی رقابت کنن.',
 helpKeys:'روی موبایل فقط لمس کن؛ روی دسکتاپ با Space یا Enter هم می‌شه پاسخ داد. لمس قبل از سبزشدن خطا حساب می‌شه.',
 privacy:'بدون حساب کاربری و ردیابی؛ رکوردها فقط روی همین دستگاه ذخیره می‌شن.',
 startHere:'روی شروع بازی بزن تا اولین سیگنال آماده بشه.', result:'نتیجه آخرین تلاش',
 badge:'دستاورد ویژه M32',badgeLocked:'در چالش ۳۲ ثانیه‌ای به ۳۲ واکنش موفق برس تا این نشان آزاد بشه.',
 badgeWon:'۳۲ واکنش در ۳۲ ثانیه! نشان M32 مال توئه.',
 finishedRush:'۳۲ ثانیه تمام شد!',newRun:'شروع مجدد',noHits:'بدون واکنش صحیح',
 aborted:'با عوض‌کردن پنجره، سیگنال فعلی لغو می‌شه تا زمان‌سنجی عادلانه بمونه.',
 close:'بستن',ms:'میلی‌ثانیه',practice:'ریتم تندتر در حالت Rush!',scoreHelp:'زود زدن در Rush امتیاز منفی داره.',
 fair:'از زمان واقعی نمایش علامت تا لمس اندازه می‌گیریم.',accuracy:'دقت',outOf:'از',noData:'هنوز رکوردی نداری'
 },
 en:{
 back:'Back to Playground',headline:'How fast are your reflexes?',choose:'Pick your challenge',
 start:'Start playing',again:'Play again',restart:'New game',restartConfirm:'Your current run will be lost. Start over?',
 hold:'Wait for the signal…',go:'TAP NOW!',decoy:'STOP! DO NOT TAP!',ready:'Ready?',
 goHelp:'As soon as the signal turns green, tap or press Space.',
 waitHelp:'Wait for green. Tapping too early is a false start.',
 decoyHelp:'Purple is a decoy. Let it disappear without touching it.',rushHelp:'Go as fast as you can for 32 seconds.',
 early:'False start!',correct:'Nice! Your reaction time',avoided:'You resisted the decoy!',hitAgain:'Ready for the next attempt?',
 next:'Next attempt',nextPlayer:'Next player',finished:'Challenge complete!',finishedText:'Your run is recorded. Can you beat your personal best?',
 share:'Share result',copied:'Result copied',shareError:'Sharing unavailable',
 attempts:'Attempts',score:'Score',best:'Personal best',reaction:'Reaction',
 median:'Median time',fastest:'Fastest reaction',hits:'Successful hits',falseStarts:'False starts',
 streak:'Streak',remaining:'Time left',count:'Reactions',
 player1:'Player 1',player2:'Player 2',winner:'Winner',tie:'It’s a tie!',wins:'Wins',
 stats:'Local records',plays:'Games played',complete:'Finished runs',bestMedian:'Best median',bestHits:'Most hits',
 how:'How to play',helpIntro:'Tap the large panel as soon as it turns green. We measure with the browser’s monotonic high-resolution clock (performance.now); display refresh rate and device input latency can affect results.',
 helpModes:'Classic: five attempts and median time. 32 Rush: react for 32 seconds. Precision: ignore purple fake signals. Duel: take turns on the same device.',
 helpKeys:'Tap on mobile, or press Space / Enter on desktop. Any early tap counts as a false start.',
 privacy:'No accounts or tracking. Records live only in this browser.',
 startHere:'Hit Start to begin the first randomized wait.',result:'Last attempt',
 badge:'M32 Achievement',badgeLocked:'Land 32 valid reactions in the 32-second Rush mode to unlock the M32 badge.',
 badgeWon:'32 hits in 32 seconds! M32 badge unlocked.',
 finishedRush:'Your 32 seconds are up!',newRun:'Start a fresh run',noHits:'No successful hits',
 aborted:'Leaving the page cancels the current cue to keep timing fair.',
 close:'Close',ms:'ms',practice:'Rush uses shorter delays!',scoreHelp:'Early taps are penalized in Rush.',
 fair:'Measured from visual signal to actual input.',accuracy:'Accuracy',outOf:'of',noData:'No record yet'
 }
} as const;
const fmt=(n:number,lang:'fa'|'en')=>new Intl.NumberFormat(lang==='fa'?'fa-IR':'en-US').format(n);
function Help({locale,onClose}:{locale:'fa'|'en';onClose:()=>void}){
 const t=copy[locale];
 return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
  <section role="dialog" aria-modal="true" aria-label={t.how} className="glass max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-[28px] p-6 sm:p-8">
   <div className="flex items-center justify-between"><HeartPulse size={28} className="text-emerald-300"/><button type="button" onClick={onClose} aria-label={t.close} className="rounded-xl border border-white/10 p-2 text-zinc-300"><X size={19}/></button></div>
   <h2 className="mt-5 text-2xl font-black">{t.how}</h2>
   <p className="mt-4 text-sm leading-8 text-zinc-300">{t.helpIntro}</p>
   <p className="mt-4 text-sm leading-8 text-zinc-400">{t.helpModes}</p>
   <p className="mt-4 text-sm leading-8 text-zinc-400">{t.helpKeys}</p>
   <p className="mt-4 text-xs leading-7 text-zinc-500">{t.aborted}</p>
   <button onClick={onClose} className="mt-7 w-full rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold text-[#061910]">{t.close}</button>
  </section>
 </div>;
}
export default function Reaction32Page({locale,settings,setSettings}:AppProps){
 const lang=locale;const t=copy[lang];
 const [mode,setMode]=useState<Mode>('classic');
 const [run,setRun]=useState<State>(()=>create('classic'));
 const runRef=useRef(run);
 const [stats,setStats]=useState<Stats>(loadStats);
 const [timeLeft,setTimeLeft]=useState(RUSH_MS);
 const [help,setHelp]=useState(false);
 const [notice,setNotice]=useState('');
 const deadline=useRef<number|null>(null);
 const signalTime=useRef<number|null>(null);
 const activeRef=useRef(true);
 const chosen=modes.find(m=>m.id===mode)!;
 const modeStats=stats.modes[mode];
 const finish=(game:State)=>{
  if(game.phase!=='finished')return;
  const updated=recordRun(game,winner(game));setStats(updated);
 };
 const publish=(value:State)=>{
  const old=runRef.current;runRef.current=value;setRun(value);
  if(old.phase!=='finished'&&value.phase==='finished')finish(value);
 };
 const newGame=(ask=false)=>{
  const old=runRef.current;
  if(ask&&old.started&&old.phase!=='finished'&&!window.confirm(t.restartConfirm))return;
  deadline.current=null;signalTime.current=null;setTimeLeft(RUSH_MS);setNotice('');
  const fresh=create(mode);publish(fresh);
 };
 const switchMode=(value:Mode)=>{
  if(value===mode)return;
  const old=runRef.current;
  if(old.started&&old.phase!=='finished'&&!window.confirm(t.restartConfirm))return;
  deadline.current=null;signalTime.current=null;setTimeLeft(RUSH_MS);setNotice('');
  setMode(value);const fresh=create(value);runRef.current=fresh;setRun(fresh);
 };
 const beginAttempt=()=>{
  const s=runRef.current;
  if(s.phase!=='ready')return;
  if(!s.started){
   setStats(startRun(s.mode));
   if(s.mode==='rush')deadline.current=performance.now()+RUSH_MS;
  }
  signalTime.current=null;publish(begin(s));
 };
 const tap=()=>{
  const s=runRef.current;
  if(s.phase==='ready'){beginAttempt();return;}
  if(s.phase!=='go'&&s.phase!=='waiting'&&s.phase!=='decoy')return;
  if(s.mode==='rush'&&deadline.current!==null&&performance.now()>=deadline.current){
   publish(finishRush(s));return;
  }
  const ms=s.phase==='go'&&signalTime.current!==null?performance.now()-signalTime.current:null;
  const after=press(s,ms);
  if(after===s)return;
  if(settings.sound){
   try{
    const ctx=new AudioContext();const oscillator=ctx.createOscillator();const gain=ctx.createGain();
    oscillator.frequency.value=after.last?.kind==='hit'?770:180;
    oscillator.type='sine';gain.gain.setValueAtTime(.035,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.11);
    oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+.12);
    oscillator.onended=()=>{void ctx.close();};
   }catch{/* optional browser audio */}
  }
  publish(after);
 };
 // Waiting times are unpredictable; callback timestamps the cue using performance.now().
 // A cue never starts while the page is hidden; visibility loss cancels the current trial.
 useEffect(()=>{
  if(run.phase!=='waiting')return;
  let frame=0;
  const timer=window.setTimeout(()=>{
   if(!activeRef.current||document.hidden||runRef.current.phase!=='waiting')return;
   const s=runRef.current;
   if(s.mode==='rush'&&deadline.current!==null&&performance.now()>=deadline.current){publish(finishRush(s));return;}
   frame=requestAnimationFrame(()=>{
    const current=runRef.current;
    if(current.phase!=='waiting'||document.hidden)return;
    const signal=chooseSignal(current,Math.random());
    signalTime.current=performance.now();
    flushSync(()=>publish(reveal(current,signal)));
   });
  },waitMs(Math.random(),mode));
  return ()=>{window.clearTimeout(timer);cancelAnimationFrame(frame);};
 },[run.phase,run.attempts[0],run.attempts[1],run.decoysAvoided,mode]);
 useEffect(()=>{
  if(run.phase!=='decoy')return;
  const timer=window.setTimeout(()=>{
   const current=runRef.current;
   if(current.phase==='decoy'){signalTime.current=null;publish(avoidDecoy(current));}
  },950);
  return ()=>window.clearTimeout(timer);
 },[run.phase,run.decoysAvoided,run.attempts[0]]);
 useEffect(()=>{
  if(run.phase!=='result'||mode!=='rush')return;
  const timer=window.setTimeout(()=>{
   const current=runRef.current;
   if(current.phase!=='result')return;
   if(deadline.current!==null&&performance.now()>=deadline.current){publish(finishRush(current));return;}
   signalTime.current=null;publish(begin(next(current)));
  },170);
  return ()=>window.clearTimeout(timer);
 },[run.phase,run.trials.length,mode]);
 useEffect(()=>{
  if(mode!=='rush'||!run.started||run.phase==='finished')return;
  const tick=()=>{
   const remain=Math.max(0,(deadline.current??performance.now())-performance.now());
   setTimeLeft(remain);
   if(remain<=0&&runRef.current.phase!=='finished')publish(finishRush(runRef.current));
  };
  tick();const timer=window.setInterval(tick,40);
  return ()=>window.clearInterval(timer);
 },[mode,run.started,run.phase]);
 useEffect(()=>{
  const onVisibility=()=>{
   if(!document.hidden)return;
   const current=runRef.current;
   if(current.mode==='rush'&&current.started&&current.phase!=='finished')publish(finishRush(current));
   else if(['waiting','go','decoy'].includes(current.phase)){
    signalTime.current=null;publish({...current,phase:'ready'});
   }
  };
  document.addEventListener('visibilitychange',onVisibility);
  return ()=>document.removeEventListener('visibilitychange',onVisibility);
 },[]);
 useEffect(()=>{
  const handler=(event:KeyboardEvent)=>{
   if(event.altKey||event.metaKey||event.ctrlKey||event.repeat||help||document.hidden)return;
   if(event.code!=='Space'&&event.code!=='Enter')return;
   const target=event.target;
   if(target instanceof HTMLElement&&target.closest('button,a,input,select,textarea,[role="dialog"]'))return;
   event.preventDefault();tap();
  };
  window.addEventListener('keydown',handler);
  return ()=>window.removeEventListener('keydown',handler);
 });
 useEffect(()=>{activeRef.current=true;return()=>{activeRef.current=false;};},[]);
 const proceed=()=>{
  const s=runRef.current;
  if(s.phase==='result')publish(next(s));
 };
 const share=async()=>{
  const s=runRef.current;
  const average=median(s.hits[0]);
  const result=lang==='fa'
   ? `⚡ Reaction 32 — M32 Playground\nحالت: ${chosen.fa} | واکنش‌ها: ${totalHits(s)} | میانه: ${average===null?'—':average+'ms'} | امتیاز: ${s.score}\nhttps://play.mehrdad32.ir/games/reaction-32`
   : `⚡ Reaction 32 — M32 Playground\nMode: ${chosen.en} | Hits: ${totalHits(s)} | Median: ${average===null?'—':average+'ms'} | Score: ${s.score}\nhttps://play.mehrdad32.ir/games/reaction-32`;
  try{
   if(navigator.share){await navigator.share({title:'Reaction 32 — M32 Playground',text:result});return;}
   await navigator.clipboard.writeText(result);setNotice(t.copied);
  }catch(e){
   if((e as Error).name==='AbortError')return;
   try{await navigator.clipboard.writeText(result);setNotice(t.copied);}catch{setNotice(t.shareError);}
  }
 };
 const completed=run.phase==='finished';
 const active=['ready','waiting','go','decoy'].includes(run.phase);
 const signalColor=run.phase==='go'?'reaction-go':run.phase==='decoy'?'reaction-decoy':run.phase==='waiting'?'reaction-wait':'reaction-idle';
 const headline=run.phase==='go'?t.go:run.phase==='decoy'?t.decoy:run.phase==='waiting'?t.hold:t.ready;
 const hint=run.phase==='go'?t.goHelp:run.phase==='decoy'?t.decoyHelp:run.phase==='waiting'?t.waitHelp:t.startHere;
 const med=median(run.hits[0]),median2=median(run.hits[1]);
 const progress=mode==='rush'?Math.max(0,(1-timeLeft/RUSH_MS)*100):totalAttempts(run)/(mode==='precision'?10:mode==='classic'?5:10)*100;
 const currentPlayer=run.phase==='result'&&run.last?run.last.player:run.player;
 return <section className="relative min-h-[85vh] overflow-hidden bg-[#07090d]">
  <div className="grid-bg pointer-events-none absolute inset-0 opacity-35"/>
  <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[700px] -translate-x-1/2 rounded-full bg-emerald-400/[.05] blur-[125px]"/>
  <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-8 sm:pt-12">
   <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
    <div><Link to="/" className="inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-emerald-300"><ArrowLeft size={15} className={lang==='fa'?'rotate-180':''}/>{t.back}</Link>
     <div className="mt-5 flex items-center gap-4">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-amber-300/25 bg-amber-300/[.07] text-amber-300"><Zap size={30}/></div>
      <div><p dir="ltr" className="font-mono text-[10px] tracking-[.2em] text-amber-300">M32 ARCADE / GAME 02</p>
       <h1 dir="ltr" className="mt-1 font-mono text-2xl font-black tracking-tight text-white sm:text-4xl">REACTION <span className="text-emerald-300">32</span></h1>
       <p className="mt-2 text-xs text-zinc-500 sm:text-sm">{t.headline}</p>
      </div>
     </div>
    </div>
    <div className="flex flex-wrap gap-2">
     <button type="button" onClick={()=>setHelp(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2.5 text-xs text-zinc-300 hover:border-emerald-300/40"><CircleHelp size={17}/>{t.how}</button>
     <button type="button" onClick={()=>setSettings({...settings,sound:!settings.sound})} aria-label={settings.sound?t.close:t.how} title={settings.sound?'Sound on':'Sound off'} className="rounded-xl border border-white/10 p-2.5 text-zinc-300 hover:border-emerald-300/40">{settings.sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button>
     <button type="button" onClick={()=>newGame(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2.5 text-xs text-zinc-300 hover:border-rose-300/40"><RotateCcw size={17}/>{t.restart}</button>
    </div>
   </div>
   <p className="mb-3 text-xs font-semibold text-zinc-400">{t.choose}</p>
   <div className="mb-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4" role="group" aria-label={t.choose}>
    {modes.map(item=>{const Icon=item.icon;const selected=item.id===mode;
     return <button key={item.id} type="button" onClick={()=>switchMode(item.id)} aria-pressed={selected}
      className={`min-w-0 rounded-[20px] border p-3 text-start transition sm:p-4 ${selected?'border-emerald-300/45 bg-[#123428]':'border-white/[.09] bg-white/[.025] hover:border-emerald-300/25'}`}>
      <div className="flex items-center justify-between gap-2"><Icon size={20} className={selected?'text-emerald-300':'text-zinc-500'}/><span dir="ltr" className="font-mono text-[9px] text-zinc-600">{item.name}</span></div>
      <p className="mt-2 text-sm font-bold text-white">{lang==='fa'?item.fa:item.en}</p>
      <p className="mt-1 text-[11px] leading-5 text-zinc-500">{lang==='fa'?item.faInfo:item.enInfo}</p>
     </button>;
    })}
   </div>
   <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
    <div className="min-w-0 space-y-4">
     <div className="grid grid-cols-3 gap-2.5">
      <div className="glass rounded-2xl p-3 sm:p-4"><p className="text-[11px] text-zinc-500">{mode==='rush'?t.remaining:t.attempts}</p>
       <p dir="ltr" className="mt-2 font-mono text-xl font-black text-emerald-300 sm:text-2xl">{mode==='rush'?(timeLeft/1000).toFixed(1)+'s':fmt(totalAttempts(run),lang)+' / '+(mode==='duel'?10:mode==='precision'?10:5)}</p></div>
      <div className="glass rounded-2xl p-3 sm:p-4"><p className="text-[11px] text-zinc-500">{t.score}</p><p dir="ltr" className="mt-2 font-mono text-xl font-black text-white sm:text-2xl">{fmt(run.score,lang)}</p></div>
      <div className="glass rounded-2xl p-3 sm:p-4"><p className="text-[11px] text-zinc-500">{t.best}</p><p dir="ltr" className="mt-2 font-mono text-xl font-black text-emerald-300 sm:text-2xl">{fmt(modeStats.bestScore,lang)}</p></div>
     </div>
     <div className="rounded-[27px] border border-white/[.09] bg-[#0d1515] p-3 shadow-[0_30px_90px_rgba(0,0,0,.3)] sm:rounded-[32px] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2 px-1 font-mono text-[10px] tracking-[.14em] text-zinc-500" dir="ltr">
       <span>REACTION / 32</span><span className={run.phase==='go'?'text-emerald-300':run.phase==='decoy'?'text-violet-300':'text-zinc-500'}>{run.phase==='go'?'● GO':run.phase==='decoy'?'● DECOY':'○ READY'}</span>
      </div>
      {mode==='duel'&&<div className="mb-4 grid grid-cols-2 gap-2" dir="ltr">
       {[0,1].map(i=><div key={i} className={`rounded-xl border px-3 py-2 text-center text-xs font-bold ${currentPlayer===i&&!completed?'border-emerald-300/50 bg-emerald-300/10 text-emerald-200':'border-white/10 bg-white/[.025] text-zinc-500'}`}>
        {i===0?t.player1:t.player2} · {run.attempts[i]}/5
       </div>)}
      </div>}
      <button type="button" aria-label={headline} disabled={!active} onPointerDown={e=>{if(e.button===0)tap();}} onClick={e=>{if(e.detail===0)tap();}}
       style={{touchAction:'manipulation'}}
       className={`reaction-arena relative flex min-h-[305px] w-full select-none flex-col items-center justify-center overflow-hidden rounded-[23px] border-2 p-5 text-center transition-[background-color,border-color,box-shadow] duration-75 sm:min-h-[385px] ${signalColor} ${active?'cursor-pointer active:scale-[.998]':'cursor-default'}`}>
       <div className="pointer-events-none absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(circle at center,rgba(255,255,255,.12) 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
       <div className="relative z-10 flex flex-col items-center gap-4">
        <span className="reaction-icon grid h-20 w-20 place-items-center rounded-full border border-current/25 bg-black/10 sm:h-24 sm:w-24">
         {run.phase==='go'?<Zap size={43} fill="currentColor"/>:run.phase==='decoy'?<X size={43}/>:<Target size={43}/>}
        </span>
        <span className="max-w-full text-3xl font-black sm:text-5xl">{active?headline:run.phase==='finished'?t.finished:run.last?.kind==='false-start'?t.early:t.correct}</span>
        <span className="max-w-sm text-xs leading-7 opacity-75 sm:text-sm">{active?hint:run.last?.kind==='false-start'?t.waitHelp:t.hitAgain}</span>
        {run.phase==='go'&&<span dir="ltr" className="rounded-full border border-current/30 px-5 py-2 font-mono text-xs tracking-[.22em]">TAP / SPACE</span>}
       </div>
      </button>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={mode==='rush'?t.remaining:t.attempts} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
       <div className="h-full rounded-full bg-emerald-300 transition-[width] duration-100" style={{width:progress+'%'}}/>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1">
       <p role="status" aria-live="polite" className="text-xs text-zinc-400">{run.phase==='ready'?t.startHere:run.phase==='waiting'?t.waitHelp:run.phase==='decoy'?t.decoyHelp:run.phase==='go'?t.goHelp:run.last?.kind==='false-start'?t.early:run.last?.kind==='hit'?t.correct:run.phase==='finished'?t.finishedText:t.result}</p>
       <span className="font-mono text-[11px] text-zinc-500">{run.phase==='go'?'⚡ LIVE':run.phase==='decoy'?'✕ FAKE':run.phase==='waiting'?'● WAIT':'M32'}</span>
      </div>
      {(run.phase==='ready'||run.phase==='result'||run.phase==='finished')&&<div className="mt-5 flex flex-wrap gap-2.5">
       {run.phase==='ready'&&<button onClick={beginAttempt} className="glow-button inline-flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold text-[#06170e] hover:bg-emerald-200"><Play size={16} fill="currentColor"/>{run.started?t.next:t.start}</button>}
       {run.phase==='result'&&mode!=='rush'&&<button onClick={proceed} className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold text-[#06170e] hover:bg-emerald-200"><ChevronRight size={16} className={lang==='fa'?'rotate-180':''}/>{mode==='duel'?t.nextPlayer:t.next}</button>}
       {run.phase==='finished'&&<><button onClick={()=>newGame()} className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold text-[#06170e] hover:bg-emerald-200"><RotateCcw size={16}/>{t.again}</button>
        <button onClick={()=>void share()} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-200 hover:border-emerald-300/25"><Share2 size={16}/>{t.share}</button></>}
      </div>}
     </div>
     {run.last&&run.phase!=='ready'&&<div className={`rounded-2xl border p-4 sm:p-5 ${run.last.kind==='hit'?'border-emerald-300/25 bg-emerald-300/[.045]':run.last.kind==='false-start'?'border-rose-300/25 bg-rose-300/[.045]':'border-violet-300/20 bg-violet-300/[.035]'}`}>
      <p className="text-sm font-bold text-white">{run.last.kind==='hit'?t.correct:run.last.kind==='false-start'?t.early:t.avoided}</p>
      <p dir="ltr" className={`mt-2 font-mono text-3xl font-black ${run.last.kind==='hit'?'text-emerald-300':'text-rose-300'}`}>{run.last.ms!==null?fmt(run.last.ms,lang)+' ms':'—'}</p>
     </div>}
     {completed&&<div className="rounded-[24px] border border-emerald-300/25 bg-[#102e22] p-6 text-center sm:p-8">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-300/[.1]"><Trophy size={34} className="text-emerald-300"/></div>
      <h2 className="mt-5 text-2xl font-black">{mode==='rush'?t.finishedRush:t.finished}</h2>
      <p className="mt-3 text-sm text-zinc-400">{t.finishedText}</p>
      {mode==='duel'?<div className="mt-5 grid grid-cols-2 gap-3" dir="ltr">
       {[med,median2].map((value,i)=><div key={i} className="rounded-xl border border-emerald-300/15 bg-black/15 p-3"><span className="text-xs text-zinc-400">{i===0?t.player1:t.player2}</span><p className="mt-2 font-mono text-2xl font-black text-emerald-300">{value===null?'—':value+' ms'}</p></div>)}
       <p className="col-span-2 mt-2 text-base font-bold text-emerald-200">{winner(run)===null?t.tie:`${t.winner}: ${winner(run)===0?t.player1:t.player2}`}</p>
      </div>:<div className="mt-5 flex flex-wrap items-center justify-center gap-5">
       <div><p className="text-xs text-zinc-400">{mode==='rush'?t.hits:t.median}</p><p dir="ltr" className="mt-2 font-mono text-3xl font-black text-emerald-300">{mode==='rush'?totalHits(run):med===null?'—':med+' ms'}</p></div>
       <div><p className="text-xs text-zinc-400">{t.score}</p><p dir="ltr" className="mt-2 font-mono text-3xl font-black text-white">{fmt(run.score,lang)}</p></div>
      </div>}
     </div>}
    </div>
    <aside className="space-y-4">
     <div className="glass rounded-[24px] p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm font-bold text-white"><Medal size={19} className="text-emerald-300"/>{t.stats}</div>
      <dl className="mt-5 space-y-3 text-xs">
       {([[t.plays,modeStats.plays],[t.complete,modeStats.completions],[t.best,modeStats.bestScore],[t.bestHits,modeStats.mostHits],[t.bestMedian,modeStats.bestMedianMs===null?'—':modeStats.bestMedianMs+' ms'],[t.fastest,modeStats.fastestMs===null?'—':modeStats.fastestMs+' ms']] as [string,string|number][]).map(([label,val])=>
        <div key={label} className="flex justify-between gap-3 border-b border-white/[.065] pb-3"><dt className="text-zinc-500">{label}</dt><dd dir="ltr" className="font-mono font-bold text-emerald-200">{typeof val==='number'?fmt(val,lang):val}</dd></div>)}
      </dl>
      {mode==='duel'&&<p className="mt-4 text-xs text-zinc-400">{t.wins} · {t.player1}: {stats.duelWins[0]} / {t.player2}: {stats.duelWins[1]}</p>}
      <p className="mt-4 text-[11px] leading-6 text-zinc-600"><ShieldCheck size={14} className="me-1 inline"/>{t.privacy}</p>
     </div>
     <div className={`rounded-[24px] border p-5 sm:p-6 ${stats.earnedM32?'border-emerald-300/40 bg-[#123c2c]':'border-white/[.09] bg-[#111818]'}`}>
      <h3 className="flex items-center gap-2 text-sm font-bold"><Sparkles size={19} className="text-emerald-300"/>{t.badge}</h3>
      <div dir="ltr" className="mt-3 font-mono text-4xl font-black text-emerald-300">M<span className="text-white">32</span></div>
      <p className="mt-3 text-xs leading-6 text-zinc-400">{stats.earnedM32?t.badgeWon:t.badgeLocked}</p>
      <p className="mt-2 font-mono text-xs text-zinc-600" dir="ltr">32 HITS / 32 SEC</p>
     </div>
     <div className="rounded-[24px] border border-white/[.08] bg-white/[.025] p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Clock3 size={19} className="text-amber-300"/>{t.how}</h3>
      <p className="mt-3 text-xs leading-7 text-zinc-400">{t.fair}</p>
      <p className="mt-3 text-xs leading-7 text-zinc-500">{t.scoreHelp}</p>
      <button onClick={()=>setHelp(true)} className="mt-4 inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200">{t.how}<ArrowUpRight size={15}/></button>
     </div>
    </aside>
   </div>
  </div>
  {help&&<Help locale={lang} onClose={()=>setHelp(false)}/>}
  {notice&&<div role="status" className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-300/30 bg-[#103626] px-5 py-3 text-xs text-emerald-100"><Copy size={15}/>{notice}<button onClick={()=>setNotice('')} aria-label={t.close}><X size={14}/></button></div>}
 </section>;
}
