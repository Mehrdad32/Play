import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, BrainCircuit, CalendarDays, Check, ChevronRight,
  CircleHelp, Copy, Eye, EyeOff, Gamepad2, Github, Medal, Play, RotateCcw,
  Share2, ShieldCheck, Sparkles, Trophy, Volume2, VolumeX, X, Zap
} from 'lucide-react';
import type { AppProps } from '../../App';
import {
  advance, begin, cues, DAILY_ROUNDS, expected, guess, playbackDone,
  type Cue, type Mode, type State
} from './engine';
import { loadSession, loadStats, recordResult, saveSession, startSession, type Stats } from './storage';

type Lang = 'fa' | 'en';
const modes: {id: Mode; icon: typeof BrainCircuit; fa: string; en: string; detailFa:string; detailEn:string; label:string}[] = [
  { id:'classic',icon:BrainCircuit,fa:'حافظه کلاسیک',en:'Classic Memory',detailFa:'نورها را به ترتیب تکرار کن.',detailEn:'Replay the lit tiles in order.',label:'CLASSIC' },
  { id:'reverse',icon:RotateCcw,fa:'حافظه معکوس',en:'Reverse Mode',detailFa:'ترتیب را از آخر به اول بزن.',detailEn:'Tap the sequence backwards.',label:'REVERSE' },
  { id:'glitch',icon:Zap,fa:'حالت گلیچ',en:'Glitch Mode',detailFa:'فریب نورهای بنفش را نخور!',detailEn:'Ignore the purple decoy flashes!',label:'GLITCH' },
  { id:'daily',icon:CalendarDays,fa:'چالش روزانه',en:'Daily Challenge',detailFa:'۸ مرحله با الگوی یکسان برای همه.',detailEn:'Eight rounds. Same pattern worldwide.',label:'DAILY / UTC' }
];
const copy={
  fa:{
    back:'بازگشت به Playground', subtitle:'نگاه کن. حفظ کن. تکرار کن. رکورد بزن!',
    choose:'حالت بازی را انتخاب کن',ready:'آماده‌ای حافظه‌ات را امتحان کنی؟',start:'شروع نمایش الگو',
    watch:'فقط نگاه کن…',yourTurn:'حالا نوبت توئه!',next:'دور بعدی',retry:'دوباره تلاش کن',
    quit:'بازی جدید',confirm:'پیشرفت این دست از بین می‌رود. بازی جدید شروع شود؟',
    round:'مرحله',score:'امتیاز',best:'بهترین رکورد',combo:'زنجیره موفق',progress:'پیشرفت پاسخ',
    status:'وضعیت بازی',completed:'آفرین! مرحله تموم شد',lost:'اوه! این یکی اشتباه بود',
    won:'چالش رو تموم کردی!',lostText:'حافظه خوب تمرین می‌خواد؛ یه بار دیگه امتحان کن.',
    wonText:'تمام ۸ مرحله روزانه را رد کردی. فوق‌العاده بود!',
    roundText:'یک مرحله سخت‌تر در انتظارت است.',how:'راهنمای بازی',hint:'خانه‌های سبز، الگوی اصلی‌اند. در حالت Glitch نورهای بنفش فریبنده‌اند و نباید لمسشان کنی.',
    hintReverse:'در حالت Reverse، دنباله را از آخر به اول تکرار کن.',
    hintKeys:'با لمس خانه‌ها یا کلیدهای 1–4 / QWER / ASDF / ZXCV بازی کن.',
    hintDaily:'چالش روزانه تا ساعت ۰۰:۰۰ UTC یکسان می‌ماند؛ امتیاز آن فقط روی همین دستگاه ذخیره می‌شود.',
    stats:'رکوردهای این دستگاه',plays:'تعداد بازی‌ها',bestRound:'بالاترین مرحله',wins:'بردها', bestCombo:'بهترین زنجیره',
    privacy:'بازی و رکوردها فقط در مرورگر همین دستگاه ذخیره می‌شوند.',share:'اشتراک نتیجه',copied:'نتیجه کپی شد!', unavailable:'امکان اشتراک‌گذاری در مرورگر وجود ندارد.',
    achievement:'دستاورد ویژه M32', achievementLocked:'مرحله ۳۲ را رد کن تا نشان M32 آزاد شود.',
    achievementOpen:'نشان M32 / سطح ۳۲ آزاد شد!', dailyDate:'تاریخ UTC', keyboard:'صفحه‌کلید',
    turnIndicator:'مورد درست از', soundOn:'صدا روشن',soundOff:'صدا خاموش',close:'بستن',
    welcome:'چهار روش بازی، یک هدف: رکورد تازه.',showGuide:'روش بازی',dailyDone:'چالش امروز کامل شد',
    stopped:'بازی پایان یافت',new:'شروع بازی جدید',playAgain:'همین حالت، دوباره',
    bestDaily:'رکورد امروز',again:'شروع چالش امروز'
  },
  en:{
    back:'Back to Playground',subtitle:'Watch. Memorize. Repeat. Beat your high score!',
    choose:'Choose your mode',ready:'Ready to challenge your memory?',start:'Show the sequence',
    watch:'Watch carefully…',yourTurn:'Your turn!',next:'Next round',retry:'Try again',
    quit:'New game',confirm:'Your current progress will be lost. Start a new game?',
    round:'Round',score:'Score',best:'Personal best',combo:'Streak',progress:'Input progress',
    status:'Game status',completed:'Round complete!',lost:'Oops, wrong tile!',
    won:'Challenge completed!',lostText:'Memory takes practice. Give it another shot.',
    wonText:'You cleared all 8 daily rounds. Excellent work!',
    roundText:'Another, harder pattern awaits.',how:'How to play',
    hint:'Green tiles are the real sequence. In Glitch mode, ignore the purple decoy flashes.',
    hintReverse:'Reverse mode: repeat the sequence in reverse order.',
    hintKeys:'Tap tiles or use 1–4 / QWER / ASDF / ZXCV on the keyboard.',
    hintDaily:'Daily patterns reset at 00:00 UTC and scores remain on this device only.',
    stats:'Local records',plays:'Games played',bestRound:'Highest round',wins:'Wins',bestCombo:'Best streak',
    privacy:'Progress and high scores are stored only in this browser.',share:'Share score',copied:'Result copied!',unavailable:'Sharing is unavailable in this browser.',
    achievement:'M32 Achievement',achievementLocked:'Complete round 32 to unlock the M32 badge.',
    achievementOpen:'M32 / ROUND 32 badge unlocked!',dailyDate:'UTC date',keyboard:'Keyboard',
    turnIndicator:'Correct tiles',soundOn:'Sound on',soundOff:'Sound off',close:'Close',
    welcome:'Four game modes. One mission: a new high score.',showGuide:'Instructions',dailyDone:'Today’s challenge is complete',
    stopped:'Run ended',new:'Start a new game',playAgain:'Play this mode again',
    bestDaily:'Today’s best',again:'Retry today’s challenge'
  }
} as const;
const keyboardRows=['1234','qwer','asdf','zxcv'];
const format=(value:number,lang:Lang)=>new Intl.NumberFormat(lang==='fa'?'fa-IR':'en-US').format(value);
function sound(freq:number,kind:'normal'|'glitch'|'error'='normal'){
  try{
    const ctx=new AudioContext();const osc=ctx.createOscillator();const gain=ctx.createGain();
    osc.type=kind==='glitch'?'triangle':'sine';
    osc.frequency.value=freq;
    gain.gain.setValueAtTime(.045,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.14);
    osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.15);
    osc.onended=()=>{void ctx.close();};
  }catch{/* audio optional */}
}
function isFreshDay(game:State|null){
  return game?.mode!=='daily'||game.day===new Date().toISOString().slice(0,10);
}
export default function MemoryBitsPage({locale,settings,setSettings}:AppProps){
  const lang=locale as Lang;const t=copy[lang];const fa=lang==='fa';
  const [mode,setMode]=useState<Mode>('classic');
  const [game,setGame]=useState<State|null>(()=>loadSession('classic'));
  const gameRef=useRef<State|null>(game);
  const [stats,setStats]=useState<Stats>(loadStats);
  const [lit,setLit]=useState<Cue|null>(null);
  const [pressed,setPressed]=useState<number|null>(null);
  const [help,setHelp]=useState(false);
  const [toast,setToast]=useState('');
  const [reduceMotion,setReduceMotion]=useState(false);
  const pressedTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const resultRef=useRef<HTMLDivElement|null>(null);
  const showMode=modes.find(m=>m.id===mode)!;
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduceMotion(media.matches);
    update();media.addEventListener('change',update);
    return ()=>media.removeEventListener('change',update);
  },[]);
  const motionOff=settings.motion==='off'||(settings.motion==='auto'&&reduceMotion);
  useEffect(()=>()=>{
    if(pressedTimer.current)clearTimeout(pressedTimer.current);
  },[]);
  const sync=(next:State)=>{
    gameRef.current=next;setGame(next);saveSession(next);
  };
  useEffect(()=>{
    if(!game||game.phase!=='showing')return;
    const sequence=cues(game);
    const timers:ReturnType<typeof setTimeout>[]=[];
    const flash=Math.max(260,650-game.round*12);
    const gap=motionOff?110:190;
    let offset=350;
    for(const cue of sequence){
      const startAt=offset;
      timers.push(setTimeout(()=>{
        setLit(cue);
        if(settings.sound&&cue.kind==='target')sound(280+cue.cell*38);
      },startAt));
      offset+=cue.kind==='decoy'?Math.max(160,flash*.60):flash;
      timers.push(setTimeout(()=>setLit(null),offset));
      offset+=gap;
    }
    timers.push(setTimeout(()=>{
      const current=gameRef.current;
      if(current&&current.phase==='showing')sync(playbackDone(current));
      setLit(null);
    },offset+180));
    return()=>{timers.forEach(clearTimeout);};
  },[game?.phase,game?.round,game?.seed,mode,motionOff,settings.sound]);
  const selectMode=(selected:Mode)=>{
    setLit(null);setPressed(null);setMode(selected);
    const cached=loadSession(selected);
    const next=isFreshDay(cached)?cached:null;
    gameRef.current=next;setGame(next);
    setToast('');
  };
  const create=(confirm=false)=>{
    const current=gameRef.current;
    if(confirm&&current&&!['lost','won'].includes(current.phase)&&!window.confirm(t.confirm))return;
    const next=startSession(mode);
    setStats(loadStats());setLit(null);setPressed(null);sync(next);
  };
  const watch=()=>{
    const current=gameRef.current;
    if(!current){const first=startSession(mode);setStats(loadStats());sync(begin(first));return;}
    if(current.phase==='ready')sync(begin(current));
  };
  const proceed=()=>{
    const current=gameRef.current;
    if(current&&current.phase==='between')sync(begin(advance(current)));
  };
  const inputCell=(cell:number)=>{
    const current=gameRef.current;
    if(!current||current.phase!=='input')return;
    const result=guess(current,cell);
    if(result.outcome==='ignored')return;
    if(pressedTimer.current)clearTimeout(pressedTimer.current);
    setPressed(cell);
    pressedTimer.current=setTimeout(()=>setPressed(null),250);
    if(settings.sound)sound(result.outcome==='wrong'?140:430+cell*32,result.outcome==='wrong'?'error':'normal');
    sync(result.state);
    if(['wrong','round','won'].includes(result.outcome)){
      setStats(recordResult(result.state,current));
      if(['lost','won'].includes(result.state.phase))setTimeout(()=>resultRef.current?.scrollIntoView({behavior:motionOff?'instant':'smooth',block:'nearest'}),100);
    }
  };
  const onBoardKey=(event:ReactKeyboardEvent<HTMLDivElement>)=>{
    const key=event.key.toLowerCase();
    const idx=keyboardRows.join('').indexOf(key);
    if(idx>=0&&key.length===1&&gameRef.current?.phase==='input'){
      event.preventDefault();inputCell(idx);
    }
  };
  const share=async()=>{
    const current=gameRef.current;
    if(!current)return;
    const message=fa
      ? `🧠 Memory Bits — M32 Playground\nحالت: ${showMode.fa} | مرحله: ${current.round} | امتیاز: ${current.score}\nhttps://play.mehrdad32.ir/games/memory-bits`
      : `🧠 Memory Bits — M32 Playground\nMode: ${showMode.en} | Round: ${current.round} | Score: ${current.score}\nhttps://play.mehrdad32.ir/games/memory-bits`;
    try{
      if(navigator.share){await navigator.share({title:'Memory Bits — M32 Playground',text:message});return;}
      await navigator.clipboard.writeText(message);setToast(t.copied);
    }catch(err){if((err as Error).name==='AbortError')return;
      try{await navigator.clipboard.writeText(message);setToast(t.copied);}
      catch{setToast(t.unavailable);}
    }
  };
  const phase=game?.phase??'ready';
  const playing=phase==='input';
  const record=stats.modes[mode];
  return <section className="relative isolate min-h-[88vh] overflow-hidden bg-[#07090d]">
    <div className="grid-bg pointer-events-none absolute inset-0 opacity-30"/>
    <div className="pointer-events-none absolute -top-44 start-1/2 h-[650px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-400/[.055] blur-[130px]"/>
    <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-8 sm:pt-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-emerald-300"><ArrowLeft className={fa?'rotate-180':''} size={15}/>{t.back}</Link>
          <div className="mt-5 flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-emerald-400/25 bg-emerald-400/[.08] text-emerald-300"><BrainCircuit size={30}/></span>
            <div><div dir="ltr" className="font-mono text-[10px] tracking-[.2em] text-emerald-400">M32 ARCADE / GAME 04</div><h1 dir="ltr" className="mt-1 font-mono text-2xl font-black tracking-tight text-white sm:text-4xl">MEMORY <span className="text-emerald-300">BITS</span></h1><p className="mt-2 text-xs text-zinc-500 sm:text-sm">{t.subtitle}</p></div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={()=>setHelp(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2.5 text-xs text-zinc-300 hover:border-emerald-400/40"><CircleHelp size={17}/>{t.how}</button>
          <button aria-label={settings.sound?t.soundOn:t.soundOff} title={settings.sound?t.soundOn:t.soundOff} onClick={()=>setSettings({...settings,sound:!settings.sound})} className="rounded-xl border border-white/10 p-2.5 text-zinc-400 hover:text-emerald-300">{settings.sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button>
          <button onClick={()=>create(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-zinc-300 hover:border-rose-400/40"><RotateCcw size={16}/>{t.quit}</button>
        </div>
      </div>
      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold text-zinc-400">{t.choose}</p>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4" role="group" aria-label={t.choose}>
          {modes.map(item=>{
            const Icon=item.icon;const active=item.id===mode;
            return <button type="button" key={item.id} aria-pressed={active} onClick={()=>selectMode(item.id)}
              className={`min-w-0 rounded-[19px] border p-3 text-start transition sm:p-4 ${active?'border-emerald-300/50 bg-[#123327] shadow-[0_10px_35px_rgba(52,211,153,.07)]':'border-white/[.09] bg-white/[.025] hover:border-emerald-300/25'}`}>
              <div className="flex items-center justify-between gap-2"><Icon size={19} className={active?'text-emerald-300':'text-zinc-500'}/><span dir="ltr" className="font-mono text-[9px] text-zinc-600">{item.label}</span></div>
              <p className={`mt-2 text-sm font-bold ${active?'text-emerald-100':'text-zinc-200'}`}>{fa?item.fa:item.en}</p>
              <p className="mt-1 text-[11px] leading-5 text-zinc-500">{fa?item.detailFa:item.detailEn}</p>
            </button>;
          })}
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="mx-auto w-full max-w-[600px]">
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            <div className="glass rounded-2xl p-3 sm:p-4"><p className="text-[11px] text-zinc-500">{t.round}</p><p dir="ltr" className="mt-1 font-mono text-xl font-black text-emerald-300 sm:text-2xl">{format(game?.round??1,lang)}<span className="ms-1 text-xs text-zinc-600">/{mode==='daily'?DAILY_ROUNDS:'∞'}</span></p></div>
            <div className="glass rounded-2xl p-3 sm:p-4"><p className="text-[11px] text-zinc-500">{t.score}</p><p dir="ltr" className="mt-1 font-mono text-xl font-black text-white sm:text-2xl">{format(game?.score??0,lang)}</p></div>
            <div className="glass rounded-2xl p-3 sm:p-4"><p className="text-[11px] text-zinc-500">{t.best}</p><p dir="ltr" className="mt-1 font-mono text-xl font-black text-emerald-300 sm:text-2xl">{format(record.bestScore,lang)}</p></div>
          </div>
          <div className="relative rounded-[27px] border border-emerald-300/15 bg-[#0b1411] p-3 shadow-[0_30px_90px_rgba(0,0,0,.35)] sm:rounded-[32px] sm:p-5" dir="ltr">
            <div className="mb-4 flex items-center justify-between px-1 font-mono text-[10px] tracking-[.11em] text-zinc-500"><span>M32 / NEURAL GRID</span><span className={phase==='showing'?'text-amber-300':playing?'text-emerald-300':'text-zinc-500'}>{phase==='showing'?'● SEQUENCE':playing?'● YOUR TURN':'○ STANDBY'}</span></div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3" onKeyDown={onBoardKey} role="group" aria-label={fa?'جدول حافظه ۴ در ۴':'4 by 4 memory grid'}>
              {Array.from({length:16},(_,index)=>{
                const illuminated=lit?.cell===index;
                const isDecoy=illuminated&&lit?.kind==='decoy';
                const isTarget=illuminated&&!isDecoy;
                const touched=pressed===index&&playing;
                const color=isDecoy?'bits-decoy':isTarget?'bits-lit':touched?'bits-tap':'';
                return <button type="button" key={index}
                  disabled={!playing} onClick={()=>inputCell(index)} aria-label={`${fa?'خانه':'Tile'} ${Math.floor(index/4)+1}, ${index%4+1}`}
                  aria-disabled={!playing} className={`bits-cell relative grid aspect-square min-w-0 place-items-center overflow-hidden rounded-[14px] border border-white/[.08] bg-[#15231d] text-zinc-500 transition-[background-color,box-shadow,transform] duration-150 sm:rounded-[20px] ${color} ${playing?'cursor-pointer hover:border-emerald-300/40 active:scale-[.97]':'cursor-default'}`}>
                  <span aria-hidden="true" className={`relative font-mono text-[11px] sm:text-xs ${isDecoy?'text-violet-100':isTarget?'text-[#082015]':playing?'text-emerald-300/30':'text-zinc-600'}`}>{isDecoy?'×':isTarget?'✦':keyboardRows[Math.floor(index/4)][index%4].toUpperCase()}</span>
                </button>;
              })}
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-white/[.085] bg-white/[.025] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm font-bold text-zinc-200">
                {phase==='showing'?<Eye size={18} className="text-amber-300"/>:playing?<Gamepad2 size={18} className="text-emerald-300"/>:phase==='between'?<Check size={18} className="text-emerald-300"/>:phase==='lost'?<X size={18} className="text-rose-300"/>:<Sparkles size={18} className="text-emerald-300"/>}
                {phase==='showing'?t.watch:playing?t.yourTurn:phase==='between'?t.completed:phase==='lost'?t.lost:phase==='won'?t.won:t.ready}
              </p>
              <span dir="ltr" className="font-mono text-xs text-zinc-500">{game&&playing?`${game.inputIndex} / ${expected(game).length}`:'M32 / MEMORY'}</span>
            </div>
            <div role="progressbar" aria-label={t.progress} aria-valuemin={0} aria-valuemax={game?.sequence.length??2} aria-valuenow={game?.inputIndex??0} className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-300 transition-[width] duration-200" style={{width:`${game?game.inputIndex/game.sequence.length*100:0}%`}}/>
            </div>
            {phase!=='showing'&&phase!=='input'&&<div className="mt-5 flex flex-wrap gap-2.5">
              {phase==='ready'&&<button onClick={watch} className="glow-button inline-flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold text-[#06170f] hover:bg-emerald-200"><Play size={16} fill="currentColor"/>{t.start}</button>}
              {phase==='between'&&<button onClick={proceed} className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold text-[#06170f] hover:bg-emerald-200">{t.next}<ChevronRight size={17} className={fa?'rotate-180':''}/></button>}
              {(phase==='lost'||phase==='won')&&<button onClick={()=>create()} className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold text-[#06170f] hover:bg-emerald-200"><RotateCcw size={16}/>{mode==='daily'?t.again:t.playAgain}</button>}
              {(phase==='lost'||phase==='won')&&<button onClick={()=>void share()} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-200 hover:border-emerald-300/35"><Share2 size={16}/>{t.share}</button>}
            </div>}
            {phase==='between'&&<p className="mt-3 text-xs text-zinc-500">{t.roundText}</p>}
            {phase==='lost'&&<p className="mt-3 text-xs text-zinc-400">{t.lostText}</p>}
            {phase==='won'&&<p className="mt-3 text-xs text-emerald-200">{t.wonText}</p>}
          </div>
          {game&&(phase==='lost'||phase==='won')&&<div ref={resultRef} className="mt-4 rounded-2xl border border-emerald-300/25 bg-[#102a20] p-6 text-center"><Medal className="mx-auto text-emerald-300" size={40}/><p className="mt-3 text-xs tracking-widest text-emerald-200" dir="ltr">{phase==='won'?'CHALLENGE CLEARED':'GAME OVER'}</p><p className="mt-2 font-mono text-4xl font-black text-white">{format(game.score,lang)}</p><p className="mt-2 text-xs text-zinc-400">{t.score} · {t.round} {format(game.round,lang)}</p></div>}
        </div>
        <aside className="space-y-4">
          <div className="glass rounded-[23px] p-5 sm:p-6">
            <p dir="ltr" className="flex items-center gap-2 font-mono text-xs font-bold tracking-[.14em] text-emerald-300"><ShieldCheck size={17}/> {showMode.label}</p>
            <h2 className="mt-4 text-lg font-bold text-white">{fa?showMode.fa:showMode.en}</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">{fa?showMode.detailFa:showMode.detailEn}</p>
            {mode==='daily'&&<p dir="ltr" className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[.06] p-3 font-mono text-xs text-emerald-200"><CalendarDays size={15} className="me-2 inline"/>{game?.day??new Date().toISOString().slice(0,10)} UTC</p>}
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div><p className="text-xs text-zinc-500">{t.combo}</p><p dir="ltr" className="mt-2 font-mono text-2xl font-black text-white">{format(game?.combo??0,lang)}<span className="ms-1 text-xs text-zinc-600">×</span></p></div>
              <div><p className="text-xs text-zinc-500">{t.bestCombo}</p><p dir="ltr" className="mt-2 font-mono text-2xl font-black text-emerald-300">{format(record.bestCombo,lang)}</p></div>
            </div>
          </div>
          <div className="glass rounded-[23px] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-100"><Trophy size={18} className="text-emerald-300"/>{t.stats}</div>
            <dl className="mt-5 space-y-3 text-xs">
              {([[t.plays,record.plays],[t.bestRound,record.bestRound],[t.best,record.bestScore],[t.wins,record.wins],[t.bestCombo,record.bestCombo]] as [string,number][]).map(([label,value])=><div key={label} className="flex justify-between gap-4 border-b border-white/[.065] pb-3"><dt className="text-zinc-500">{label}</dt><dd dir="ltr" className="font-mono font-bold text-emerald-200">{format(value,lang)}</dd></div>)}
            </dl>
            {mode==='daily'&&<div className="mt-3 flex items-center justify-between gap-2 text-xs text-zinc-400"><span>{t.bestDaily}</span><span className="font-mono text-emerald-300">{format(stats.daily[game?.day??new Date().toISOString().slice(0,10)]??0,lang)}</span></div>}
            <p className="mt-4 text-[11px] leading-6 text-zinc-600">{t.privacy}</p>
          </div>
          <div className={`rounded-[23px] border p-5 sm:p-6 ${stats.unlocked32?'border-emerald-300/40 bg-[#12402f]':'border-white/[.09] bg-[#111718]'}`}>
            <p className="flex items-center gap-2 text-sm font-bold text-zinc-200"><Sparkles size={19} className={stats.unlocked32?'text-emerald-300':'text-zinc-500'}/>{t.achievement}</p>
            <p dir="ltr" className="mt-3 font-mono text-3xl font-black text-emerald-300">M<span className="text-white">32</span></p>
            <p className="mt-3 text-xs leading-6 text-zinc-400">{stats.unlocked32?t.achievementOpen:t.achievementLocked}</p>
          </div>
          <p dir="ltr" className="flex items-center justify-between px-2 text-xs text-zinc-600"><span><Github size={14} className="me-1 inline"/> Mehrdad32 / Play</span><span><EyeOff size={14} className="me-1 inline"/> NO TRACKING</span></p>
        </aside>
      </div>
    </div>
    {help&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.currentTarget===e.target)setHelp(false);}}>
      <section role="dialog" aria-modal="true" aria-label={t.how} className="glass w-full max-w-lg rounded-[27px] p-6 sm:p-8">
        <div className="flex items-center justify-between"><BrainCircuit className="text-emerald-300" size={28}/><button onClick={()=>setHelp(false)} aria-label={t.close} className="rounded-xl border border-white/10 p-2 text-zinc-300"><X size={19}/></button></div>
        <h2 className="mt-6 text-2xl font-black text-white">{t.how}</h2>
        <p className="mt-4 text-sm leading-8 text-zinc-300">{t.hint}</p><p className="mt-3 text-sm leading-8 text-zinc-400">{t.hintReverse}</p><p className="mt-3 text-sm leading-8 text-zinc-400">{t.hintKeys}</p><p className="mt-3 text-xs leading-7 text-zinc-500">{t.hintDaily}</p>
        <button onClick={()=>setHelp(false)} className="mt-7 w-full rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold text-[#06180f]">{t.close}</button>
      </section>
    </div>}
    {toast&&<div role="status" className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-300/30 bg-[#0b3323] px-5 py-3 text-xs text-emerald-100"><Copy size={15}/>{toast}<button onClick={()=>setToast('')} aria-label={t.close}><X size={14}/></button></div>}
  </section>;
}
