import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {Link} from 'react-router-dom';
import {
 ArrowLeft,CalendarDays,Check,ChevronRight,CircleHelp,Copy,
 Crosshair,FlaskConical,Heart,Hexagon,Medal,Play,RotateCcw,Share2,
 ShieldCheck,Sparkles,Trophy,X,Zap
} from 'lucide-react';
import type {AppProps} from '../../App';
import {dayUTC,next,submit,toHex,type Mode,type RGB,type State} from './engine';
import {beginNew,loadStats,record,restore,saveSession,type Stats} from './storage';

type Locale='fa'|'en';
const modeItems=[
 {id:'decode',fa:'کد رو بخون',en:'HEX Decode',subFa:'از روی کد، رنگ درست رو انتخاب کن.',subEn:'Find the right swatch from its HEX code.',icon:Hexagon},
 {id:'odd',fa:'رنگ متفاوت',en:'Odd One Out',subFa:'رنگ متفاوت بین مربع‌ها رو شکار کن.',subEn:'Find the one tile with a different shade.',icon:Crosshair},
 {id:'mix',fa:'آزمایشگاه RGB',en:'RGB Mix Lab',subFa:'با سه کانال قرمز، سبز و آبی رنگ بساز.',subEn:'Mix red, green and blue to match a target.',icon:FlaskConical},
 {id:'daily',fa:'چالش روزانه',en:'Daily Hunt',subFa:'هشت مأموریت با رنگ‌های یکسان برای همه.',subEn:'Eight shared color puzzles, refreshed every UTC day.',icon:CalendarDays}
] as const;
const t={
 fa:{
 back:'بازگشت به Playground',tag:'COLOR LAB / GAME 03',subtitle:'چشم تیزبین داری یا رنگ‌ها گولت می‌زنن؟',
 choose:'نوع چالش رو انتخاب کن',round:'مرحله',score:'امتیاز',best:'رکورد',lives:'جان باقی‌مانده',
 start:'شروع شکار رنگ',resume:'ادامه بازی',next:'مرحله بعد',again:'دوباره بازی کن',restart:'بازی جدید',
 confirm:'پیشرفت این دست پاک می‌شود. بازی جدید شروع شود؟',
 decode:'کدام رنگ متعلق به این کد HEX است؟',odd:'فقط یکی از این خانه‌ها متفاوت است. پیداش کن!',
 mix:'با تنظیم کانال‌های RGB به رنگ هدف نزدیک شو.',target:'رنگ هدف',yours:'رنگ ساخته‌شده',
 accuracy:'اختلاف RGB',tolerance:'حد مجاز اختلاف',submit:'بررسی رنگ',options:'گزینه‌های رنگ',
 chooseHint:'رنگ را انتخاب کن',correct:'آفرین! جواب درسته',wrong:'ای وای! این یکی درست نبود',
 answer:'پاسخ درست',chosen:'انتخاب تو',points:'امتیاز این مرحله',streak:'پاسخ‌های درست پیاپی',
 gameover:'فرصت‌هات تموم شد!',gameoverDesc:'شکار رنگ تمرین می‌خواد؛ دوباره تلاش کن.',
 victory:'مأموریت رنگ کامل شد!',victoryDesc:'تمام مرحله‌ها رو پشت سر گذاشتی. متخصص رنگ M32 شدی!',
 help:'راهنمای شکارچی',helpIntro:'کد HEX از سه جفت رقم تشکیل شده: قرمز، سبز و آبی. هر جفت عددی از 00 تا FF (یعنی ۰ تا ۲۵۵) است.',
 helpDecode:'HEX Decode: یک کد نمایش داده می‌شود. رنگ مطابق کد را از میان گزینه‌ها پیدا کن.',
 helpOdd:'Odd One Out: روی خانه‌ای که فقط کمی با بقیه فرق دارد بزن.',
 helpMix:'RGB Mix Lab: رنگ هدف را ببین، اسلایدرهای R/G/B را تنظیم کن و «بررسی رنگ» بزن.',
 helpDaily:'Daily Hunt: هشت مرحله ترکیبی با سؤال‌های یکسان در یک روز UTC؛ بدون سرور یا جدول رتبه‌بندی آنلاین.',
 keyboard:'در HEX Decode از کلیدهای ۱ تا ۴ هم می‌تونی استفاده کنی.',close:'متوجه شدم',
 local:'رکوردها و پیشرفت فقط روی همین مرورگر ذخیره می‌شن.',records:'رکوردهای این حالت',
 plays:'دست‌های بازی',wins:'بردها',bestRound:'بالاترین مرحله',bestStreak:'بهترین زنجیره',
 perfect:'پاسخ درست با سه جان',dailyBest:'بهترین امتیاز امروز',
 achievement:'نشان اختصاصی M32',achievementLocked:'مرحله ۳۲ رو با موفقیت رد کن تا نشان آزاد بشه.',
 achievementOpen:'دستاورد M32 باز شد! ✦',share:'اشتراک نتیجه',copied:'نتیجه کپی شد',
 shareFail:'امکان اشتراک‌گذاری وجود ندارد',finished:'پایان بازی',reply:'پاسخ ثبت شد',
 select:'انتخاب کن',mixCode:'کد ترکیب تو',learning:'نکته آموزشی',
 tip:'برای تشخیص رنگ، به دو رقم اول (قرمز)، دو رقم وسط (سبز) و دو رقم آخر (آبی) دقت کن.',
 dailyStamp:'چالش امروز / UTC',viewAnswer:'کد درست پس از پاسخ نمایش داده می‌شود',
 accessible:'تمام دکمه‌های رنگ با کیبورد هم قابل انتخاب‌اند.'
 },
 en:{
 back:'Back to Playground',tag:'COLOR LAB / GAME 03',subtitle:'Sharp eyes or fooled by colors? Find out.',
 choose:'Choose your challenge',round:'Round',score:'Score',best:'Best score',lives:'Lives left',
 start:'Start the hunt',resume:'Resume game',next:'Next round',again:'Play again',restart:'New game',
 confirm:'This run will be lost. Start a new game?',
 decode:'Which swatch matches this HEX code?',odd:'Only one tile has a different shade. Find it!',
 mix:'Adjust the RGB channels to recreate the target color.',target:'Target',yours:'Your mix',
 accuracy:'RGB distance',tolerance:'Allowed distance',submit:'Check my color',options:'Color choices',
 chooseHint:'Choose a swatch',correct:'Excellent! You got it',wrong:'Not quite this time!',
 answer:'Correct answer',chosen:'Your choice',points:'Points earned',streak:'Correct streak',
 gameover:'Out of lives!',gameoverDesc:'A color hunter gets better with practice. Try again.',
 victory:'Color mission complete!',victoryDesc:'You cleared every round. You are an M32 color master!',
 help:'How to play',helpIntro:'A HEX code uses three pairs of digits: red, green, and blue. Each pair ranges from 00 to FF (0–255).',
 helpDecode:'HEX Decode: study the code and select the matching swatch.',
 helpOdd:'Odd One Out: tap the one tile with a slightly different shade.',
 helpMix:'RGB Mix Lab: see the target, adjust R/G/B sliders, then submit your approximation.',
 helpDaily:'Daily Hunt: eight mixed challenges shared by everyone on the same UTC day; no server or online leaderboard.',
 keyboard:'For HEX Decode you can also press number keys 1–4.',close:'Got it',
 local:'Progress and records live only in this browser.',records:'Records for this mode',
 plays:'Runs played',wins:'Wins',bestRound:'Highest round',bestStreak:'Best streak',
 perfect:'Correct with full health',dailyBest:'Best today',
 achievement:'M32 Achievement',achievementLocked:'Clear round 32 to unlock this badge.',
 achievementOpen:'M32 badge unlocked! ✦',share:'Share result',copied:'Result copied',
 shareFail:'Sharing unavailable',finished:'Run complete',reply:'Answer recorded',
 select:'Select',mixCode:'Your HEX mix',learning:'Color insight',
 tip:'The first HEX pair controls red, the middle pair green, and the last pair blue.',
 dailyStamp:'Today / UTC',viewAnswer:'Correct code is revealed after you answer.',
 accessible:'All swatches can be selected using a keyboard.'
 }
} as const;
const fmt=(n:number,lang:Locale)=>new Intl.NumberFormat(lang==='fa'?'fa-IR':'en-US').format(n);
const modeLabel=(mode:Mode,lang:Locale)=>modeItems.find(x=>x.id===mode)![lang];
function Help({locale,close}:{locale:Locale;close:()=>void}){
 const tx=t[locale];
 return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.currentTarget===e.target)close();}}>
  <section role="dialog" aria-modal="true" aria-label={tx.help} className="glass max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-[28px] p-6 sm:p-8">
   <div className="flex justify-between"><CircleHelp size={28} className="text-emerald-300"/><button onClick={close} aria-label={tx.close} className="rounded-xl border border-white/10 p-2 text-zinc-300"><X size={20}/></button></div>
   <h2 className="mt-4 text-2xl font-black">{tx.help}</h2>
   <p className="mt-4 text-sm leading-8 text-zinc-300">{tx.helpIntro}</p>
   <div dir="ltr" className="my-5 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/30 p-4 font-mono"><span className="text-red-300">#FF</span><span className="text-emerald-300">80</span><span className="text-sky-300">32</span><span className="ms-3 h-9 w-14 rounded-lg border border-white/15" style={{background:'#FF8032'}}/></div>
   {[tx.helpDecode,tx.helpOdd,tx.helpMix,tx.helpDaily,tx.keyboard].map(line=><p key={line} className="mt-3 text-sm leading-7 text-zinc-400">{line}</p>)}
   <button onClick={close} className="mt-7 w-full rounded-full bg-emerald-300 px-5 py-3 font-semibold text-[#06180d]">{tx.close}</button>
  </section>
 </div>;
}
export default function HexHunterPage({locale}:AppProps){
 const lang=locale;const tx=t[lang];
 const [mode,setMode]=useState<Mode>('decode');
 const [game,setGame]=useState<State|null>(()=>restore('decode'));
 const gameRef=useRef<State|null>(game);
 const [stats,setStats]=useState<Stats>(loadStats);
 const [mix,setMix]=useState<RGB>(()=>game?.question.kind==='mix'?[...game.question.initial]:[128,128,128]);
 const [help,setHelp]=useState(false);
 const [notice,setNotice]=useState('');
 const [narrow,setNarrow]=useState(false);
 useEffect(()=>{
  const m=window.matchMedia('(max-width: 430px)');
  const sync=()=>setNarrow(m.matches);
  sync();m.addEventListener('change',sync);return()=>m.removeEventListener('change',sync);
 },[]);
 const save=(s:State)=>{gameRef.current=s;setGame(s);saveSession(s);};
 const create=(ask=false)=>{
  const prior=gameRef.current;
  if(ask&&prior&&prior.phase!=='lost'&&prior.phase!=='won'&&!window.confirm(tx.confirm))return;
  const n=beginNew(mode);setMix(n.question.kind==='mix'?[...n.question.initial]:[128,128,128]);
  setStats(loadStats());setNotice('');save(n);
 };
 const changeMode=(selected:Mode)=>{
  const cached=restore(selected);
  setMode(selected);setGame(cached);gameRef.current=cached;
  setMix(cached?.question.kind==='mix'?[...cached.question.initial]:[128,128,128]);
  setNotice('');
 };
 const answer=(input:number|RGB)=>{
  const previous=gameRef.current;
  if(!previous||previous.phase!=='question')return;
  const result=submit(previous,input);
  if(result===previous)return;
  save(result);setStats(record(previous,result));
 };
 const proceed=()=>{
  const current=gameRef.current;
  if(!current||current.phase!=='feedback')return;
  const upcoming=next(current);
  setMix(upcoming.question.kind==='mix'?[...upcoming.question.initial]:[128,128,128]);
  save(upcoming);
 };
 const keyDown=(event:KeyboardEvent<HTMLDivElement>)=>{
  if(event.altKey||event.metaKey||event.ctrlKey||event.repeat)return;
  if(gameRef.current?.phase!=='question'||gameRef.current.question.kind!=='decode')return;
  if(/^[1-4]$/.test(event.key)){event.preventDefault();answer(Number(event.key)-1);}
 };
 const share=async()=>{
  if(!gameRef.current)return;
  const s=gameRef.current;
  const msg=lang==='fa'
   ? `🎨 HEX Hunter — M32 Playground\nحالت: ${modeLabel(mode,lang)} | مرحله: ${s.round} | امتیاز: ${s.score}\nhttps://play.mehrdad32.ir/games/hex-hunter`
   : `🎨 HEX Hunter — M32 Playground\nMode: ${modeLabel(mode,lang)} | Round: ${s.round} | Score: ${s.score}\nhttps://play.mehrdad32.ir/games/hex-hunter`;
  try{
   if(navigator.share){await navigator.share({title:'HEX Hunter — M32 Playground',text:msg});return;}
   await navigator.clipboard.writeText(msg);setNotice(tx.copied);
  }catch(err){
   if((err as Error).name==='AbortError')return;
   try{await navigator.clipboard.writeText(msg);setNotice(tx.copied);}catch{setNotice(tx.shareFail);}
  }
 };
 const q=game?.question;
 const feedback=game?.feedback;
 const row=stats.byMode[mode];
 const finished=game?.phase==='won'||game?.phase==='lost';
 const questionOpen=game?.phase==='question';
 const isDaily=mode==='daily';
 const total=isDaily?8:32;
 const shownRound=game?.round??1;
 const Icon=modeItems.find(x=>x.id===mode)!.icon;
 return <section className="relative min-h-[88vh] overflow-hidden bg-[#07090d]" onKeyDown={keyDown}>
  <div className="grid-bg pointer-events-none absolute inset-0 opacity-30"/>
  <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-sky-400/[.055] blur-[120px]"/>
  <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-8 sm:pt-12">
   <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
    <div><Link to="/" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-emerald-300">
      <ArrowLeft className={lang==='fa'?'rotate-180':''} size={16}/>{tx.back}</Link>
     <div className="mt-5 flex items-center gap-4">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-sky-300/25 bg-sky-300/[.07] text-sky-300"><Hexagon size={30}/></span>
      <div><p dir="ltr" className="font-mono text-[10px] tracking-[.2em] text-sky-300">{tx.tag}</p>
       <h1 dir="ltr" className="mt-1 font-mono text-3xl font-black tracking-tight text-white sm:text-4xl">HEX <span className="text-emerald-300">HUNTER</span></h1>
       <p className="mt-2 text-xs text-zinc-400 sm:text-sm">{tx.subtitle}</p>
      </div>
     </div>
    </div>
    <div className="flex gap-2">
     <button onClick={()=>setHelp(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-xs text-zinc-300 hover:border-emerald-300/30"><CircleHelp size={17}/>{tx.help}</button>
     <button onClick={()=>create(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-xs text-zinc-300 hover:border-rose-300/30"><RotateCcw size={17}/>{tx.restart}</button>
    </div>
   </div>
   <p className="mb-3 text-xs font-semibold text-zinc-400">{tx.choose}</p>
   <div className="mb-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4" role="group" aria-label={tx.choose}>
    {modeItems.map(item=>{
     const ActiveIcon=item.icon;const active=mode===item.id;
     return <button key={item.id} type="button" aria-pressed={active} onClick={()=>changeMode(item.id)}
      className={`min-w-0 rounded-[20px] border p-3 text-start transition sm:p-4 ${active?'border-emerald-300/45 bg-[#143429]':'border-white/[.09] bg-white/[.025] hover:border-emerald-300/30'}`}>
      <div className="flex items-center justify-between"><ActiveIcon size={20} className={active?'text-emerald-300':'text-zinc-500'}/><span dir="ltr" className="font-mono text-[9px] text-zinc-600">{item.id.toUpperCase()}</span></div>
      <p className="mt-2 text-sm font-bold text-white">{item[lang]}</p>
      <p className="mt-1 text-[11px] leading-5 text-zinc-500">{lang==='fa'?item.subFa:item.subEn}</p>
     </button>;
    })}
   </div>
   <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
    <div className="min-w-0 space-y-4">
     <div className="grid grid-cols-3 gap-2">
      <div className="glass rounded-2xl p-3 sm:p-4"><p className="text-[11px] text-zinc-500">{tx.round}</p><p dir="ltr" className="mt-2 font-mono text-xl font-black text-emerald-300">{fmt(shownRound,lang)}<span className="text-xs text-zinc-600"> / {fmt(total,lang)}</span></p></div>
      <div className="glass rounded-2xl p-3 sm:p-4"><p className="text-[11px] text-zinc-500">{tx.score}</p><p dir="ltr" className="mt-2 font-mono text-xl font-black text-white">{fmt(game?.score??0,lang)}</p></div>
      <div className="glass rounded-2xl p-3 sm:p-4"><p className="text-[11px] text-zinc-500">{tx.lives}</p><div dir="ltr" className="mt-2 flex gap-1">{[0,1,2].map(i=><Heart key={i} className={i<(game?.lives??3)?'fill-rose-400 text-rose-400':'text-zinc-700'} size={narrow?19:22}/>)}</div></div>
     </div>
     <div className="relative min-w-0 overflow-hidden rounded-[27px] border border-white/[.1] bg-[#0e1618] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3"><p dir="ltr" className="flex items-center gap-2 font-mono text-[10px] tracking-[.16em] text-sky-300"><Icon size={17}/> {mode.toUpperCase()} / ROUND {String(shownRound).padStart(2,'0')}</p>
       <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-500"><Zap size={15} className="text-amber-300"/>{fmt(game?.streak??0,lang)}×</span></div>
      {!game?<div className="flex min-h-[380px] flex-col items-center justify-center px-3 py-12 text-center">
        <div className="relative grid h-28 w-28 place-items-center rounded-[32px] border border-emerald-300/25 bg-emerald-300/[.07]"><Hexagon size={60} className="text-emerald-300"/><span className="absolute font-mono text-xl font-black text-emerald-200">#32</span></div>
        <h2 className="mt-7 text-2xl font-black text-white">{modeLabel(mode,lang)}</h2>
        <p className="mt-3 max-w-sm text-sm leading-7 text-zinc-400">{modeItems.find(x=>x.id===mode)![lang==='fa'?'subFa':'subEn']}</p>
        <button onClick={()=>create()} className="glow-button mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-300 px-7 py-3.5 text-sm font-bold text-[#06170d]"><Play fill="currentColor" size={16}/>{tx.start}</button>
       </div>:<>
        <h2 className="mt-5 text-lg font-bold leading-8 text-white sm:text-xl">{q?.kind==='decode'?tx.decode:q?.kind==='odd'?tx.odd:tx.mix}</h2>
        {q?.kind==='decode'&&<div className="mt-5">
          <div dir="ltr" className="relative flex min-h-[125px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#090f10]">
           <div className="pointer-events-none absolute inset-0 opacity-25" style={{backgroundImage:'radial-gradient(circle at center, #34d39922 1px, transparent 1px)',backgroundSize:'18px 18px'}}/>
           <p className="relative font-mono text-4xl font-black tracking-[.05em] text-white sm:text-5xl">{q.target}</p>
          </div>
          <p className="mt-4 text-xs text-zinc-500">{questionOpen?tx.viewAnswer:tx.reply}</p>
          <div dir="ltr" className="mt-3 grid grid-cols-2 gap-3" role="group" aria-label={tx.options}>
           {q.options.map((color,i)=><button key={i} type="button" disabled={!questionOpen} aria-label={`${tx.select} ${i+1}`}
            onClick={()=>answer(i)}
            className={`group min-h-[118px] overflow-hidden rounded-2xl border-2 p-2 transition hover:-translate-y-0.5 focus-visible:outline-emerald-300 disabled:cursor-default sm:min-h-[148px]
             ${!questionOpen&&q.answer===i?'border-emerald-300':'border-white/15'}`}>
            <div className="relative h-full min-h-[98px] rounded-xl sm:min-h-[125px]" style={{backgroundColor:color}}>
             <span className="absolute bottom-2 left-2 rounded-lg bg-black/50 px-2 py-1 font-mono text-xs text-white">{String(i+1).padStart(2,'0')}</span>
             {!questionOpen&&q.answer===i&&<span className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-emerald-200"><Check size={19}/></span>}
            </div>
           </button>)}
          </div>
         </div>}
        {q?.kind==='odd'&&<div className="mt-6">
          <div dir="ltr" className={`mx-auto grid w-full max-w-[490px] gap-[5px] sm:gap-2 ${q.count===9?'grid-cols-3':q.count===16?'grid-cols-4':'grid-cols-5'}`} role="group" aria-label={tx.options}>
           {Array.from({length:q.count},(_,i)=>{
            const color=i===q.answer?q.different:q.base;
            return <button type="button" key={i} disabled={!questionOpen} onClick={()=>answer(i)}
              aria-label={`${tx.select} ${i+1}`}
              className={`relative aspect-square min-w-0 rounded-[12px] border-2 border-white/10 transition hover:scale-[.97] focus-visible:outline-emerald-300 disabled:cursor-default ${!questionOpen&&i===q.answer?'ring-4 ring-emerald-300 ring-offset-2 ring-offset-[#0e1618]':''}`}
              style={{backgroundColor:color}}>
              {!questionOpen&&i===q.answer&&<Check size={22} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50 p-0.5 text-white"/>}
             </button>;
           })}
          </div>
          <p className="mt-4 text-center text-xs text-zinc-500">{tx.chooseHint}</p>
         </div>}
        {q?.kind==='mix'&&<div className="mt-5">
          <div className="grid grid-cols-2 gap-3">
           <div className="min-w-0"><div className="aspect-[1.3] rounded-2xl border border-white/15 shadow-inner" style={{background:q.target}}/><p className="mt-2 text-center text-xs text-zinc-400">{tx.target}</p></div>
           <div className="min-w-0"><div className="aspect-[1.3] rounded-2xl border border-white/15 shadow-inner" style={{background:toHex(mix)}}/><p className="mt-2 text-center text-xs text-zinc-400">{tx.yours}</p></div>
          </div>
          <div className="mt-6 space-y-5" dir="ltr">{(['R','G','B'] as const).map((name,i)=>{
           const colors=['accent-red-400','accent-emerald-400','accent-sky-400'];
           const label=['Red','Green','Blue'][i];
           return <label key={name} className="block">
            <span className="mb-2 flex items-center justify-between font-mono text-xs text-zinc-400"><span>{name} / {label}</span><span className="text-white">{mix[i]}</span></span>
            <input type="range" min={0} max={255} step={1} value={mix[i]} disabled={!questionOpen}
             onChange={e=>setMix(prev=>prev.map((v,j)=>j===i?Number(e.target.value):v) as RGB)}
             className={`h-3 w-full cursor-pointer rounded-full ${colors[i]}`}/>
           </label>;
          })}</div>
          <div dir="ltr" className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm"><span className="text-zinc-500">{tx.mixCode}</span><span className="font-bold text-emerald-200">{toHex(mix)}</span></div>
          <button disabled={!questionOpen} onClick={()=>answer(mix)} className="mt-5 w-full rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold text-[#06160f] transition hover:bg-emerald-200 disabled:opacity-40">{tx.submit}</button>
          {!questionOpen&&<p className="mt-3 text-center text-xs text-zinc-500">{tx.tolerance}: {q.tolerance}</p>}
         </div>}
        {feedback&&<div role="status" aria-live="polite" className={`mt-6 rounded-[20px] border p-4 sm:p-5 ${feedback.correct?'border-emerald-300/30 bg-emerald-300/[.07]':'border-rose-300/25 bg-rose-300/[.05]'}`}>
         <p className={`flex items-center gap-2 text-base font-bold ${feedback.correct?'text-emerald-200':'text-rose-200'}`}>{feedback.correct?<Check size={20}/>:<X size={20}/>} {feedback.correct?tx.correct:tx.wrong}</p>
         <div className="mt-4 grid grid-cols-2 gap-3">
          <div><span className="text-xs text-zinc-400">{tx.answer}</span><div dir="ltr" className="mt-1 flex items-center gap-2 font-mono text-xs text-zinc-200"><span className="h-6 w-6 shrink-0 rounded-md border border-white/15" style={{background:feedback.answer}}/>{feedback.answer}</div></div>
          <div><span className="text-xs text-zinc-400">{tx.chosen}</span><div dir="ltr" className="mt-1 flex items-center gap-2 font-mono text-xs text-zinc-200"><span className="h-6 w-6 shrink-0 rounded-md border border-white/15" style={{background:feedback.chosen}}/>{feedback.chosen}</div></div>
         </div>
         <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-zinc-400">
          <span>{tx.points}: <strong className="text-emerald-200">+{fmt(feedback.points,lang)}</strong></span>
          {feedback.distance!==undefined&&<span>{tx.accuracy}: <strong className="text-white">{feedback.distance}</strong></span>}
         </div>
        </div>}
        {game.phase==='feedback'&&<button onClick={proceed} className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-bold text-[#06180f] hover:bg-emerald-200">{tx.next}<ChevronRight size={16} className={lang==='fa'?'rotate-180':''}/></button>}
        {finished&&<div className="mt-6 rounded-[22px] border border-emerald-300/20 bg-[#0c2920] p-5 text-center">
          <Medal size={42} className="mx-auto text-emerald-300"/>
          <h3 className="mt-3 text-xl font-black">{game.phase==='won'?tx.victory:tx.gameover}</h3>
          <p className="mt-2 text-sm leading-7 text-zinc-400">{game.phase==='won'?tx.victoryDesc:tx.gameoverDesc}</p>
          <p dir="ltr" className="mt-4 font-mono text-4xl font-black text-emerald-300">{fmt(game.score,lang)}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
           <button onClick={()=>create()} className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold text-[#07180f]"><RotateCcw size={16}/>{tx.again}</button>
           <button onClick={()=>void share()} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-200"><Share2 size={16}/>{tx.share}</button>
          </div>
         </div>}
       </>}
     </div>
    </div>
    <aside className="space-y-4">
     <div className="glass rounded-[24px] p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-zinc-200"><Trophy size={19} className="text-emerald-300"/>{tx.records}</p>
      <dl className="mt-5 space-y-3 text-xs">
       {([[tx.plays,row.plays],[tx.wins,row.wins],[tx.bestRound,row.bestRound],[tx.best,row.bestScore],[tx.bestStreak,row.bestStreak]] as [string,number][]).map(([label,value])=>
        <div key={label} className="flex justify-between gap-3 border-b border-white/[.07] pb-3"><dt className="text-zinc-500">{label}</dt><dd dir="ltr" className="font-mono font-bold text-emerald-300">{fmt(value,lang)}</dd></div>
       )}
      </dl>
      {isDaily&&<div className="mt-4 rounded-xl border border-emerald-300/10 bg-emerald-300/[.04] p-3 text-xs text-zinc-300">
       <p className="flex items-center gap-1"><CalendarDays size={15} className="text-emerald-300"/>{tx.dailyStamp}: <span dir="ltr" className="font-mono">{dayUTC(Date.now())}</span></p>
       <p className="mt-2">{tx.dailyBest}: <strong className="font-mono text-emerald-300">{fmt(stats.daily[dayUTC(Date.now())]??0,lang)}</strong></p>
      </div>}
      <p className="mt-4 text-[11px] leading-6 text-zinc-600"><ShieldCheck size={14} className="me-1 inline"/>{tx.local}</p>
     </div>
     <div className={`rounded-[24px] border p-5 ${stats.earnedM32?'border-emerald-300/40 bg-[#123e2b]':'border-white/[.09] bg-[#111819]'}`}>
      <p className="flex items-center gap-2 text-sm font-bold"><Sparkles size={19} className="text-emerald-300"/>{tx.achievement}</p>
      <div dir="ltr" className="mt-4 font-mono text-4xl font-black text-emerald-300">M<span className="text-white">32</span></div>
      <p className="mt-3 text-xs leading-6 text-zinc-400">{stats.earnedM32?tx.achievementOpen:tx.achievementLocked}</p>
     </div>
     <div className="rounded-[24px] border border-white/[.085] bg-[#0f181a] p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-sky-300"><CircleHelp size={18}/>{tx.learning}</p>
      <p className="mt-3 text-xs leading-7 text-zinc-400">{tx.tip}</p>
      <p dir="ltr" className="mt-4 font-mono text-lg font-black"><span className="text-red-300">#FF</span><span className="text-green-300">80</span><span className="text-blue-300">32</span></p>
      <p className="mt-3 text-[11px] leading-6 text-zinc-600">{tx.accessible}</p>
     </div>
    </aside>
   </div>
  </div>
  {help&&<Help locale={lang} close={()=>setHelp(false)}/>}
  {notice&&<div role="status" className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-300/30 bg-[#103726] px-5 py-3 text-xs text-emerald-100"><Copy size={15}/>{notice}<button onClick={()=>setNotice('')} aria-label={tx.close}><X size={16}/></button></div>}
 </section>;
}
