import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, CircleHelp, Command,
  Copy, CornerDownLeft, Flag, Github, KeyRound, Lightbulb, Medal, RotateCcw,
  Share2, ShieldCheck, Sparkles, Terminal, Trophy, X
} from 'lucide-react';
import type { AppProps } from '../../App';
import { durationSeconds, execute, initialLines, STAGES, type GameState, type Tone } from './engine';
import { loadTerminalStats, recordTerminalEscape, resumeOrStartTerminal, saveTerminalGame, startTerminalGame, type TerminalStats } from './storage';

type Lang = 'fa' | 'en';
const copy = {
  fa: {
    back: 'بازگشت به Playground',subtitle:'پنج قفل. یک ترمینال. تنها یک راه خروج.',
    simulated:'SIMULATED SHELL / NO REAL COMMANDS',active:'اتصال برقرار',escaped:'خروج آزاد شد',
    mission:'مأموریت فعلی',instructions:[
      'شناسه دسترسی را در فایل‌ها پیدا کن و دروازه را باز کن.',
      'سرنخ کلید رمز را در فایل‌ها کشف کن و قفل دوم را بشکن.',
      'گره شبکه و پورت ارتباطی را پیدا کن.',
      'کد مدیریت اضطراری را از تنظیمات هسته بازیابی کن.',
      'وضعیت سیستم را بررسی و درِ خروج را فعال کن.'
    ],
    stages:'پیشرفت مأموریت',terminal:'ترمینال کنترل',input:'دستور موردنظر را وارد کن…',
    execute:'اجرا',quick:'فرمان‌های سریع',commands:'دستورات',restarts:'شروع از اول',help:'راهنما',
    hint:'سرنخ بعدی',hintPenalty:'هر راهنمایی ۲۴۰ امتیاز کم می‌کند.',
    stats:'رکوردهای دستگاه',games:'تلاش‌ها',escapes:'خروج موفق',best:'بیشترین امتیاز',
    fastest:'سریع‌ترین خروج',least:'کمترین دستورات',round:'دستور اجراشده',
    mistakes:'خطا',hintsUsed:'راهنما',time:'زمان',seconds:'ثانیه',
    hintLocal:'بازی به‌طور خودکار ذخیره می‌شود؛ فقط روی همین مرورگر.',
    restartConfirm:'پیشرفت فعلی پاک می‌شود و بازی از مرحله اول شروع می‌شود. مطمئنی؟',
    victory:'در خروج باز شد!',victoryText:'پنج لایه سیستم را پشت سر گذاشتی. آزمایشگاه M32 به کنترل تو برگشت.',
    finishScore:'امتیاز این تلاش',share:'اشتراک‌گذاری نتیجه',again:'یک بار دیگر',
    copyDone:'نتیجه کپی شد.',shareFail:'اشتراک‌گذاری در این مرورگر ممکن نیست.',
    readHelp:'راهنمای ترمینال',helpTitle:'برای فرار، باید ردپاها را پیدا کنی.',
    helpText:'دستورهای انگلیسی را در کادر پایین بنویس و Enter را بزن. با ls فایل‌های هر مرحله را ببین، با cat آن‌ها را بخوان، با cd مسیر را عوض کن و با help راهنمای دستورها را بگیر. تمام فرمان‌ها فقط در فضای بازی اجرا می‌شوند.',
    helpTip:'در موبایل می‌توانی روی فرمان‌های آماده بزنی. اگر گیر کردی، سرنخ بگیر؛ اما امتیازت کمتر می‌شود.',
    close:'متوجه شدم',restart:'بازی جدید',finish:'ماموریت تکمیل شد',
    score:'امتیاز',yourCommands:'تعداد فرمان‌ها',next:'برو سراغ M32 Merge',youUnlocked:'✦ سیگنال مخفی M32 پیدا شد',
    enter:'Enter / Run',history:'تاریخچه فرمان‌ها',source:'سورس پروژه', clear:'پاک‌کردن خروجی',
  },
  en: {
    back:'Back to Playground',subtitle:'Five locks. One terminal. Only one way out.',
    simulated:'SIMULATED SHELL / NO REAL COMMANDS',active:'Connected',escaped:'Exit unlocked',
    mission:'Current objective',instructions:[
      'Find the access credential in the files and unlock the gate.',
      'Discover the recovery key hidden in the filesystem.',
      'Find the network relay and its open port.',
      'Recover the emergency override from core configuration.',
      'Verify system readiness and trigger the exit sequence.'
    ],
    stages:'Mission progress',terminal:'Control terminal',input:'Type a command…',
    execute:'Run',quick:'Quick commands',commands:'Commands',restarts:'Start over',help:'Help',
    hint:'Get a hint',hintPenalty:'Each hint costs 240 points.',
    stats:'Local records',games:'Attempts',escapes:'Escapes',best:'Best score',
    fastest:'Fastest escape',least:'Fewest commands',round:'Commands',
    mistakes:'Errors',hintsUsed:'Hints',time:'Time',seconds:'sec',
    hintLocal:'Progress auto-saves on this browser only.',
    restartConfirm:'This will reset your current mission. Start again?',
    victory:'EXIT UNLOCKED!',victoryText:'You cleared all five security layers and regained control of the M32 lab.',
    finishScore:'Your score',share:'Share result',again:'Play again',
    copyDone:'Result copied.',shareFail:'Sharing is unavailable in this browser.',
    readHelp:'Terminal guide',helpTitle:'To escape, you must follow the clues.',
    helpText:'Type English commands in the box and press Enter. Use ls to list files, cat to read them, cd to change folders, and help to explore valid commands. All commands are simulated inside the game.',
    helpTip:'On mobile, tap a quick command. Ask for hints if stuck, but each hint reduces your final score.',
    close:'Got it',restart:'New game',finish:'Mission completed',
    score:'Score',yourCommands:'Commands entered',next:'Try M32 Merge',youUnlocked:'✦ Found the hidden M32 signal',
    enter:'Enter / Run',history:'Command history',source:'Source code',clear:'Clear output',
  }
} as const;
const colors:Record<Tone,string>={
  normal:'text-[#cbdbd3]',success:'text-emerald-300',error:'text-rose-300',
  accent:'text-amber-200',muted:'text-zinc-500'
};
function suggestions(game:GameState):string[]{
  if(game.stage===0) return game.found.includes('access-log')?['unlock m32','ls','help']:['ls','cat mission.txt','cat access.log'];
  if(game.stage===1){
    if(game.cwd==='/cache')return ['ls','cat trace.log','cd ..'];
    return game.found.includes('cipher-key')?['decrypt echo-7','pwd','ls']:['ls','cat readme.md','cd cache'];
  }
  if(game.stage===2) return !game.found.includes('network-scan')?['scan','help']:
    !game.found.includes('network-ping')?['ping 10.0.0.32','map']:['connect 10.0.0.32 4321','map'];
  if(game.stage===3) return game.found.includes('core-config')?['override 032','status']:['status','ls','cat core.cfg'];
  if(game.stage===4) return game.found.includes('launch-ready')?['launch m32','map']:['status','help'];
  return ['map'];
}
const num=(n:number,lang:Lang)=>new Intl.NumberFormat(lang==='fa'?'fa-IR':'en-US').format(n);
const clock=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
function Guide({lang,onClose}:{lang:Lang;onClose:()=>void}){
  const t=copy[lang];
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section role="dialog" aria-modal="true" aria-labelledby="terminal-help-title" className="glass w-full max-w-lg rounded-[26px] p-6 shadow-2xl sm:p-8">
      <div className="flex items-center justify-between"><CircleHelp className="text-emerald-300" size={28}/><button type="button" onClick={onClose} aria-label="Close" className="rounded-xl border border-white/10 p-2 text-zinc-400 hover:text-white"><X size={18}/></button></div>
      <h2 id="terminal-help-title" className="mt-5 text-2xl font-bold">{t.helpTitle}</h2>
      <p className="mt-5 text-sm leading-8 text-zinc-300">{t.helpText}</p>
      <p className="mt-4 rounded-xl border border-emerald-400/10 bg-emerald-400/[.04] p-4 text-xs leading-7 text-emerald-200">{t.helpTip}</p>
      <div dir="ltr" className="mt-5 flex flex-wrap gap-2">{['help','ls','cat','cd','pwd','map','inventory','hint','clear'].map(c=><code className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300" key={c}>{c}</code>)}</div>
      <button type="button" onClick={onClose} className="mt-7 w-full rounded-full bg-emerald-300 px-5 py-3 font-bold text-[#06180f] hover:bg-emerald-200">{t.close}</button>
    </section>
  </div>;
}
export default function TerminalEscapePage({locale}:AppProps){
  const lang=locale;const t=copy[lang];const fa=lang==='fa';
  const [game,setGame]=useState<GameState>(resumeOrStartTerminal);
  const gameRef=useRef(game);
  const [stats,setStats]=useState<TerminalStats>(loadTerminalStats);
  const [input,setInput]=useState('');
  const [showGuide,setShowGuide]=useState(false);
  const [now,setNow]=useState(Date.now());
  const [notice,setNotice]=useState('');
  const terminalEnd=useRef<HTMLDivElement|null>(null);
  const terminalScroll=useRef<HTMLDivElement|null>(null);
  const inputRef=useRef<HTMLInputElement|null>(null);
  const commandCursor=useRef(-1);
  const historyForNav=game.history.map(e=>e.command).filter(c=>c!=='clear');

  useEffect(()=>{const id=window.setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[]);
  useEffect(()=>{
    if(terminalScroll.current)terminalScroll.current.scrollTop=terminalScroll.current.scrollHeight;
  },[game.history.length,game.stage,locale]);
  const submit=(raw:string)=>{
    if(!raw.trim()||gameRef.current.stage===5){setInput('');return;}
    const before=gameRef.current;
    const next=execute(before,raw);
    gameRef.current=next;
    setGame(next);saveTerminalGame(next);setInput('');setNotice('');commandCursor.current=-1;
    if(before.stage!==5&&next.stage===5)setStats(recordTerminalEscape(next));
  };
  const onSubmit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();submit(input);inputRef.current?.focus({preventScroll:true});};
  const keyDown=(event:KeyboardEvent<HTMLInputElement>)=>{
    if(event.key==='ArrowUp'){event.preventDefault();commandCursor.current=Math.min(historyForNav.length-1,commandCursor.current+1);
      if(commandCursor.current>=0)setInput(historyForNav[historyForNav.length-1-commandCursor.current]);}
    if(event.key==='ArrowDown'){event.preventDefault();commandCursor.current=Math.max(-1,commandCursor.current-1);
      setInput(commandCursor.current<0?'':historyForNav[historyForNav.length-1-commandCursor.current]);}
  };
  const newGame=()=>{
    if(gameRef.current.stage!==5&&!window.confirm(t.restartConfirm))return;
    const next=startTerminalGame();gameRef.current=next;setGame(next);setStats(loadTerminalStats());
    setInput('');setNotice('');setNow(Date.now());inputRef.current?.focus({preventScroll:true});
  };
  const share=async()=>{
    const result=fa?`🎮 Terminal Escape — M32 Playground\nاز آزمایشگاه فرار کردم! امتیاز: ${game.score} | دستورات: ${game.commands}\nhttps://play.mehrdad32.ir/games/terminal-escape`:
      `🎮 Terminal Escape — M32 Playground\nI escaped the lab! Score: ${game.score} | Commands: ${game.commands}\nhttps://play.mehrdad32.ir/games/terminal-escape`;
    try{
      if(navigator.share){await navigator.share({title:'Terminal Escape — M32 Playground',text:result});return;}
      await navigator.clipboard.writeText(result);setNotice(t.copyDone);
    }catch(err){if((err as Error).name==='AbortError')return;
      try{await navigator.clipboard.writeText(result);setNotice(t.copyDone);}catch{setNotice(t.shareFail);}}
  };
  const seconds=durationSeconds(game,now);
  const complete=game.stage===5;
  const stage=STAGES[Math.min(game.stage,4)];
  return <section className="relative min-h-[85vh] overflow-hidden bg-[#07090d]">
    <div className="grid-bg pointer-events-none absolute inset-0 opacity-30"/>
    <div className="pointer-events-none absolute -top-52 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-400/[.045] blur-[130px]"/>
    <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-8 sm:pt-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-emerald-300">
            <ArrowLeft className={fa?'rotate-180':''} size={15}/>{t.back}
          </Link>
          <div className="mt-5 flex items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300"><Terminal size={29}/></div>
            <div><p dir="ltr" className="font-mono text-[10px] tracking-[.2em] text-emerald-400">M32 ARCADE / GAME 05</p><h1 dir="ltr" className="mt-1 font-mono text-2xl font-black tracking-tight text-white sm:text-4xl">TERMINAL <span className="text-emerald-300">ESCAPE</span></h1>
              <p className="mt-2 text-xs text-zinc-500 sm:text-sm">{t.subtitle}</p></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={()=>setShowGuide(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-4 py-3 text-xs text-zinc-300 hover:border-emerald-300/30"><CircleHelp size={17}/>{t.help}</button>
          <button type="button" onClick={newGame} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-4 py-3 text-xs text-zinc-300 hover:border-rose-300/30"><RotateCcw size={17}/>{t.restart}</button>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-5 gap-1.5 sm:gap-2" dir="ltr" aria-label={t.stages}>
        {STAGES.map((s,i)=><div key={s.id} className="min-w-0">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${i<game.stage?'bg-emerald-400':i===game.stage?'bg-emerald-300/80':'bg-white/10'}`}/>
          <p className={`mt-2 truncate font-mono text-[9px] sm:text-[10px] ${i===game.stage?'text-emerald-300':'text-zinc-600'}`}>{s.id} <span className="hidden sm:inline">{s.label}</span></p>
        </div>)}
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_315px]">
        <div className="min-w-0">
          <div className="terminal-chrome overflow-hidden rounded-[24px] border border-emerald-400/[.18] bg-[#080e0b] shadow-[0_35px_100px_rgba(0,0,0,.42)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/[.12] bg-[#111d17] px-4 py-3 sm:px-5" dir="ltr">
              <div className="flex items-center gap-2.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ec736c]"/><span className="h-2.5 w-2.5 rounded-full bg-[#edc567]"/><span className="h-2.5 w-2.5 rounded-full bg-[#34d399]"/><span className="ms-2 font-mono text-[10px] tracking-[.1em] text-zinc-400 sm:text-xs">m32@lab:~</span></div>
              <span className="inline-flex items-center gap-2 font-mono text-[10px] text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"/>{complete?'EXIT / OPEN':'SESSION / ACTIVE'}</span>
            </div>
            <div ref={terminalScroll} role="log" aria-label={t.history} aria-live="off" dir="ltr" className="terminal-scroll h-[360px] overflow-y-auto overscroll-contain px-4 py-5 font-mono text-[12px] leading-6 sm:h-[450px] sm:px-6 sm:py-6 sm:text-[13px]">
              <div className="mb-6 space-y-1 border-b border-emerald-400/10 pb-5">
                <p className="text-emerald-300">╔═══════════════════════════╗</p>
                <p className="text-emerald-300">║&nbsp; M32 LAB // TERMINAL &nbsp;║</p>
                <p className="text-emerald-300">╚═══════════════════════════╝</p>
                <div className="pt-2">{initialLines.slice(1).map((line,i)=><p key={i} dir={fa?'rtl':'ltr'} className={`break-words text-start ${colors[line.tone]}`}>{line[lang]}</p>)}</div>
              </div>
              {game.history.map(entry=><div key={entry.id} className="mb-5">
                <p className="break-all text-emerald-300"><span className="text-emerald-400/60">m32@lab</span><span className="text-zinc-500">:{game.cwd==='/'?'~':'cache'}$</span> <span className="text-zinc-50">{entry.command}</span></p>
                <div className="mt-1.5 space-y-1">{entry.lines.map((line,i)=><p key={i} dir={/[^\x00-\x7F]/.test(line[lang])&&fa?'rtl':'ltr'} className={`break-words text-start ${colors[line.tone]}`}>{line[lang]}</p>)}</div>
              </div>)}
              {complete && <p className="my-4 font-mono text-lg font-black tracking-widest text-emerald-300">[ SYSTEM UNLOCKED ✓ ]</p>}
              <div ref={terminalEnd}/>
            </div>
            <form onSubmit={onSubmit} className="flex min-w-0 items-center gap-2 border-t border-emerald-400/15 bg-[#101a15] p-3 sm:p-4" dir="ltr">
              <span className="shrink-0 font-mono text-xs font-black text-emerald-400 sm:text-sm">$</span>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value.slice(0,120))}
                onKeyDown={keyDown} enterKeyHint="go" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                autoComplete="off" disabled={complete} type="text" name="command" aria-label={t.input}
                className="min-w-0 flex-1 border-0 bg-transparent py-3 font-mono text-[16px] text-emerald-100 outline-none placeholder:text-zinc-600 focus-visible:outline-none"
                placeholder={complete?'EXIT / UNLOCKED':t.input}/>
              <button disabled={complete||!input.trim()} type="submit" aria-label={t.execute}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-xs font-black text-[#06180e] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-30">
                <CornerDownLeft size={16}/><span className="hidden sm:inline">{t.execute}</span>
              </button>
            </form>
          </div>
          <div className="mt-4 rounded-2xl border border-white/[.075] bg-white/[.02] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-xs font-bold text-zinc-300"><Command size={16} className="text-emerald-300"/>{t.quick}</p>
              <span dir="ltr" className="font-mono text-[10px] text-zinc-600">TAP TO RUN / ENTER</span>
            </div>
            <div dir="ltr" className="mt-4 flex flex-wrap gap-2">
              {suggestions(game).map(cmd=><button key={cmd} type="button" disabled={complete} onClick={()=>submit(cmd)}
                className="rounded-xl border border-emerald-400/[.16] bg-[#101f18] px-3 py-2.5 font-mono text-xs text-emerald-200 transition hover:border-emerald-300/50 hover:bg-emerald-300/10 disabled:opacity-30">{cmd}</button>)}
              <button type="button" disabled={complete} onClick={()=>submit('help')} className="rounded-xl border border-white/10 px-3 py-2.5 font-mono text-xs text-zinc-400 hover:text-white disabled:opacity-30">help</button>
              <button type="button" onClick={()=>submit('clear')} disabled={complete} className="rounded-xl border border-white/10 px-3 py-2.5 font-mono text-xs text-zinc-400 hover:text-white disabled:opacity-30">clear</button>
            </div>
            <p className="mt-3 text-xs leading-6 text-zinc-600">{t.hintLocal}</p>
          </div>
          {complete && <div className="terminal-win mt-5 rounded-[26px] border border-emerald-300/40 bg-gradient-to-br from-[#154531] to-[#0b2019] p-6 text-center shadow-[0_0_55px_rgba(52,211,153,.08)] sm:p-9" role="status">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-emerald-300/40 bg-emerald-400/15"><Trophy size={34} className="text-emerald-300"/></div>
            <h2 className="mt-5 text-3xl font-black text-white">{t.victory}</h2><p className="mt-3 text-sm leading-7 text-emerald-100/75">{t.victoryText}</p>
            <p className="mt-6 font-mono text-5xl font-black text-emerald-300">{num(game.score,lang)}</p><p className="mt-1 text-xs text-zinc-400">{t.finishScore}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button onClick={()=>void share()} className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold text-[#06160d]"><Share2 size={17}/>{t.share}</button>
              <button onClick={newGame} className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 px-5 py-3 text-sm text-white"><RotateCcw size={17}/>{t.again}</button>
              <Link to="/games/m32-merge" className="inline-flex items-center gap-1 rounded-full border border-white/10 px-4 py-3 text-xs text-zinc-300">{t.next}<ChevronRight size={15}/></Link>
            </div>
          </div>}
        </div>
        <aside className="space-y-4">
          <section className="glass rounded-[24px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[.12em] text-emerald-300" dir="ltr"><ShieldCheck size={18}/> MISSION {complete?'CLEAR':stage.id}</div>
              {complete?<CheckCircle2 size={21} className="text-emerald-300"/>:<span className="font-mono text-xs text-zinc-500">{num(game.stage+1,lang)}/۵</span>}
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">{complete?t.finish:stage[lang]}</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">{complete?t.victoryText:t.instructions[game.stage]}</p>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-5">
              <div><p className="text-xs text-zinc-500">{t.time}</p><p className="mt-1 font-mono text-xl font-black text-white" dir="ltr">{clock(seconds)}</p></div>
              <div><p className="text-xs text-zinc-500">{t.round}</p><p className="mt-1 font-mono text-xl font-black text-white" dir="ltr">{num(game.commands,lang)}</p></div>
              <div><p className="text-xs text-zinc-500">{t.mistakes}</p><p className="mt-1 font-mono text-lg text-rose-300" dir="ltr">{num(game.mistakes,lang)}</p></div>
              <div><p className="text-xs text-zinc-500">{t.hintsUsed}</p><p className="mt-1 font-mono text-lg text-amber-300" dir="ltr">{num(game.hintsUsed,lang)}</p></div>
            </div>
            {game.easterEgg && <p className="mt-5 rounded-xl border border-emerald-300/15 bg-emerald-300/[.06] p-3 text-xs text-emerald-200"><Sparkles size={15} className="me-1 inline"/>{t.youUnlocked}</p>}
          </section>
          {!complete && <section className="rounded-[24px] border border-amber-300/15 bg-[#1d1a11] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-200"><Lightbulb size={18}/>{t.hint}</div>
            <p className="mt-3 text-xs leading-6 text-zinc-400">{t.hintPenalty}</p>
            <button type="button" onClick={()=>submit('hint')} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15"><KeyRound size={16}/>{t.hint} (-240)</button>
          </section>}
          <section className="glass rounded-[24px] p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-200"><Medal size={17} className="text-emerald-300"/>{t.stats}</h2>
            <dl className="mt-5 space-y-3 text-xs">
              {[
                [t.games,stats.games],[t.escapes,stats.escapes],
                [t.best,stats.bestScore],[t.fastest,stats.fastestSeconds===null?'—':clock(stats.fastestSeconds)],
                [t.least,stats.leastCommands??'—']
              ].map(([label,value])=><div className="flex justify-between gap-4 border-b border-white/[.06] pb-3" key={String(label)}>
                <dt className="text-zinc-500">{label}</dt><dd className="font-mono font-bold text-emerald-200" dir="ltr">{typeof value==='number'?num(value,lang):value}</dd>
              </div>)}
            </dl>
            <p className="mt-4 text-[11px] leading-6 text-zinc-600">{t.hintLocal}</p>
          </section>
          <a href="https://github.com/Mehrdad32/Play" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-2 text-xs text-zinc-500 hover:text-emerald-300"><Github size={15}/>{t.source}<ArrowRight size={14}/></a>
        </aside>
      </div>
      <div className="mt-12 flex flex-wrap justify-between gap-4 border-t border-white/[.07] pt-5 font-mono text-[10px] text-zinc-600" dir="ltr">
        <span><Flag size={14} className="me-2 inline"/>M32 / TERMINAL ESCAPE / V1.0</span><span>{t.simulated}</span>
      </div>
    </div>
    {showGuide&&<Guide lang={lang} onClose={()=>setShowGuide(false)}/>}
    {notice&&<div role="status" className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-300/30 bg-[#103524] px-5 py-3 text-xs text-emerald-100 shadow-xl"><Copy size={15}/>{notice}<button className="ms-2" onClick={()=>setNotice('')} aria-label="Close"><X size={14}/></button></div>}
  </section>;
}
