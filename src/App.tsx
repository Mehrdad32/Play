import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { ArrowUpRight, Github, Gamepad2, Globe2, House, Info, LockKeyhole, Play, Sparkles } from 'lucide-react';
import { games, type GameInfo } from './games/catalog';
import MergePage from './games/m32-merge/MergePage';
import TerminalEscapePage from './games/terminal-escape/TerminalEscapePage';
import MemoryBitsPage from './games/memory-bits/MemoryBitsPage';
import { loadSettings, saveSettings, type Settings } from './lib/storage';
export type AppLocale = 'fa' | 'en';
export type AppProps = { locale: AppLocale; settings: Settings; setSettings: (settings: Settings) => void };
const site = 'https://mehrdad32.ir/';
const repo = 'https://github.com/Mehrdad32/Play';
function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="inline-flex items-center gap-3" dir="ltr">
    <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-400/10 font-mono text-sm font-black tracking-tighter text-emerald-300 shadow-[0_0_22px_rgba(52,211,153,.13)]">
      M32<span className="absolute -bottom-2 rounded border border-emerald-400/30 bg-[#07090d] px-1 font-sans text-[5px] tracking-wide text-emerald-200/70">TEMP</span>
    </span>
    {!compact && <span className="font-mono text-sm font-bold tracking-tight text-zinc-100 sm:text-base">M32 <span className="text-emerald-300">Playground</span></span>}
  </span>;
}
function Header({ locale, settings, setSettings }: AppProps) {
  const fa = locale === 'fa';
  return <header className="sticky top-0 z-40 border-b border-white/[.07] bg-[#07090d]/90 backdrop-blur-2xl">
    <div className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
      <Link to="/" aria-label="M32 Playground home" className="shrink-0"><Brand /></Link>
      <nav aria-label={fa ? 'منوی اصلی' : 'Main navigation'} className="flex items-center gap-1 sm:gap-4">
        <Link to="/" className="rounded-lg px-2 py-2 text-xs text-zinc-400 hover:text-emerald-300 sm:px-3 sm:text-sm"><House className="inline h-4 w-4 sm:me-1" /><span className="hidden sm:inline">{fa?'خانه':'Home'}</span></Link>
        <Link to="/about" className="rounded-lg px-2 py-2 text-xs text-zinc-400 hover:text-emerald-300 sm:px-3 sm:text-sm"><Info className="inline h-4 w-4 sm:me-1"/><span className="hidden sm:inline">{fa?'درباره':'About'}</span></Link>
        <a href={site} className="rounded-lg px-2 py-2 text-xs text-zinc-300 hover:text-emerald-300 sm:px-3 sm:text-sm" target="_blank" rel="noopener noreferrer">{fa?'Mehrdad32.ir':'Main site'} <ArrowUpRight className="inline h-3.5 w-3.5" /></a>
        <button type="button" className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs text-zinc-200 transition hover:border-emerald-300/40"
          aria-label={fa?'Switch to English':'تغییر زبان به فارسی'} onClick={() => setSettings({ ...settings, locale: fa ? 'en' : 'fa' })}>
          <Globe2 className="me-1 inline h-4 w-4"/>{fa?'EN':'فا'}
        </button>
      </nav>
    </div>
  </header>;
}
function Footer({ locale }: { locale: AppLocale }) {
  return <footer className="border-t border-white/[.08] bg-[#080c10]">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 py-9 text-center text-xs text-zinc-500 sm:flex-row sm:text-start">
      <div><span className="font-mono font-bold text-emerald-300">M32 Playground</span><p className="mt-2">{locale==='fa'?'ساخته‌شده برای چند دقیقه سرگرمی. رکوردهای تو فقط روی همین دستگاه است.':'Made for a few minutes of fun. Scores live only on this device.'}</p></div>
      <div className="flex flex-wrap items-center justify-center gap-5" dir="ltr">
        <a className="hover:text-emerald-300" href={site} target="_blank" rel="noopener noreferrer">Mehrdad32.ir</a>
        <a className="inline-flex items-center gap-1 hover:text-emerald-300" href={repo} target="_blank" rel="noopener noreferrer"><Github size={14}/> Source</a>
        <span>© 2026 Mehrdad32 · MIT</span>
      </div>
    </div>
  </footer>;
}
function GameCard({ game, locale }: { game: GameInfo; locale: AppLocale }) {
  const fa = locale === 'fa'; const live = game.status === 'live';
  const Icon = game.icon;
  return <article className={`group relative flex min-h-[285px] flex-col overflow-hidden rounded-[26px] border p-6 transition duration-300 sm:p-7 ${live?'border-emerald-300/25 bg-gradient-to-br from-[#14342a] via-[#0b1718] to-[#0a0d11] hover:-translate-y-1 hover:border-emerald-300/60':'border-white/[.08] bg-gradient-to-br from-white/[.045] to-white/[.012] hover:border-white/[.15]'}`}>
    <div className="pointer-events-none absolute -end-12 -top-16 h-44 w-44 rounded-full bg-emerald-500/[.045] blur-3xl"/>
    <div className="relative mb-8 flex items-center justify-between"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[.055] text-emerald-300"><Icon size={27} strokeWidth={1.7}/></div><span dir="ltr" className="font-mono text-xs text-zinc-600">{game.number} / 05</span></div>
    <div className="relative flex flex-1 flex-col"><div className="flex items-center gap-2">
      <h3 dir="ltr" className="font-mono text-xl font-bold text-zinc-100">{game.name}</h3>
      {live && <span className="rounded-full bg-emerald-300/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">LIVE</span>}
    </div>
    <p className="mt-3 text-sm text-zinc-300">{fa?game.titleFa:game.titleEn}</p>
    <p className="mt-2 text-sm leading-7 text-zinc-500">{fa?game.descFa:game.descEn}</p>
    <div className="mt-auto pt-6">{live && game.url
      ? <Link to={game.url} className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-bold text-[#06150e] transition hover:bg-emerald-200"><Play size={15} fill="currentColor"/>{fa?'شروع بازی':'Play now'}</Link>
      : <span className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-500">{fa?'به‌زودی':'Coming soon'}</span>}
    </div></div>
  </article>;
}
function Home({ locale }: { locale: AppLocale }) {
  const fa = locale === 'fa';
  return <><section className="relative overflow-hidden border-b border-white/[.06]">
    <div className="grid-bg absolute inset-0 opacity-60"/><div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[600px] -translate-x-1/2 rounded-full bg-emerald-400/[.07] blur-[130px]"/>
    <div className="relative mx-auto grid max-w-6xl items-center gap-9 px-5 pb-20 pt-20 sm:px-8 sm:pt-28 lg:grid-cols-[1.13fr_.87fr] lg:gap-16 lg:py-32">
      <div><div dir="ltr" className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-4 py-2 font-mono text-[10px] tracking-[.2em] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300"/> MINI ARCADE / NO SIGNUP / JUST PLAY</div>
        <h1 className="max-w-xl text-5xl font-black leading-[1.35] tracking-tight text-white sm:text-6xl lg:text-7xl">{fa?<>یه بازی کوتاه،<br/><span className="text-emerald-300">یه رکورد تازه!</span></>:<>One more game.<br/><span className="text-emerald-300">One more high score.</span></>}</h1>
        <p className="mt-7 max-w-xl text-base leading-9 text-zinc-400">{fa?'بازی‌های سبک و سرگرم‌کننده، بدون نصب، بدون ثبت‌نام؛ فقط بازی کن و رکورد بزن!':'Lightweight browser games. No installation, no account. Just play and beat your best score.'}</p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link to="/games/m32-merge" className="glow-button inline-flex items-center gap-2 rounded-full bg-emerald-300 px-7 py-3.5 text-sm font-black text-[#06170e] hover:bg-emerald-200"><Gamepad2 size={20}/>{fa?'بریم بازی!':'Start playing'}</Link>
          <a href={repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3.5 text-sm text-zinc-300 hover:border-emerald-300/30"><Github size={18}/>{fa?'مشاهده سورس':'View source'}</a>
        </div>
        <div className="mt-10 flex flex-wrap gap-6 border-t border-white/10 pt-6 text-xs text-zinc-500"><span><LockKeyhole size={15} className="me-2 inline text-emerald-300"/>{fa?'خصوصی و بدون ردیابی':'Private & tracker-free'}</span><span><Sparkles size={15} className="me-2 inline text-emerald-300"/>{fa?'قابل بازی آفلاین':'Offline-friendly'}</span></div>
      </div>
      <div className="relative mx-auto w-full max-w-[450px]" dir="ltr"><div className="absolute -inset-8 rounded-full bg-emerald-400/[.075] blur-[70px]"/>
        <div className="glass relative rotate-[2deg] rounded-[32px] p-5 shadow-2xl sm:p-7"><div className="mb-6 flex justify-between font-mono text-xs text-emerald-300"><span>M32 / MERGE</span><span>● LIVE</span></div>
          <div className="grid grid-cols-4 gap-2.5 rounded-2xl bg-[#07110f] p-3">
            {[2,4,8,16,0,32,64,0,0,128,256,0,0,0,512,1024].map((value,i)=><div key={i} className={`grid aspect-square place-items-center rounded-xl font-mono text-lg font-black sm:text-2xl ${value===32?'tile-m32':value?'bg-emerald-200/[.12] text-emerald-100':'bg-white/[.035] text-transparent'}`}>{value||'0'}</div>)}
          </div><div className="mt-5 flex items-center justify-between font-mono text-xs text-zinc-500"><span>HIGH SCORE</span><span className="text-emerald-300">000032</span></div>
        </div><div className="absolute -bottom-5 -start-5 rotate-[-10deg] rounded-2xl border border-emerald-300/30 bg-[#123f31] px-5 py-3 font-mono text-xl font-black text-emerald-200 shadow-lg">✦ M32</div>
      </div>
    </div>
  </section>
  <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28"><div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="font-mono text-[11px] tracking-[.22em] text-emerald-300" dir="ltr">./PICK_YOUR_GAME</div><h2 className="mt-4 text-3xl font-black text-zinc-100 sm:text-4xl">{fa?'آماده‌ای رکورد بزنی؟':'Choose your challenge.'}</h2></div><span className="text-sm text-zinc-500">{fa?'بازی‌های بیشتر در راه‌اند...':'More games are on their way...'}</span></div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{games.map(game=><GameCard key={game.id} game={game} locale={locale}/>)}</div>
  </section></>;
}
function About({ locale }: { locale: AppLocale }) {
  const fa = locale === 'fa';
  return <div className="grid-bg min-h-[70vh] px-5 py-24 sm:py-32"><div className="glass mx-auto max-w-3xl rounded-[32px] p-8 sm:p-14">
    <span className="font-mono text-xs tracking-[.2em] text-emerald-300" dir="ltr">ABOUT / M32 PLAYGROUND</span>
    <h1 className="mt-6 text-4xl font-black text-white">{fa?'درباره Playground':'About Playground'}</h1>
    <p className="mt-8 text-base leading-9 text-zinc-300">{fa?'M32 Playground یک مجموعه متن‌باز از بازی‌های سبک مرورگری است؛ برای چند دقیقه تفریح، بدون حساب کاربری، تبلیغ یا ردیابی. بازی‌ها پس از بارگذاری اولیه آفلاین اجرا می‌شوند و رکوردهای شما فقط در مرورگر همین دستگاه ذخیره می‌شوند.':'M32 Playground is an open-source collection of lightweight browser games. No account, ads or tracking. After the first load, games work offline and your progress is stored locally on this device.'}</p>
    <p dir="ltr" className="mt-8 font-mono text-lg font-bold text-emerald-300">Created by Mehrdad32</p>
    <div className="mt-8 flex flex-wrap gap-3"><a href={site} target="_blank" rel="noopener noreferrer" className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold text-[#06150e]">Mehrdad32.ir ↗</a><a href={repo} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-300">GitHub / Source ↗</a></div>
    <p className="mt-8 text-xs text-zinc-500">MIT License · © 2026 Mehrdad32</p>
  </div></div>;
}
export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  useEffect(() => { saveSettings(settings); document.documentElement.lang = settings.locale; document.documentElement.dir = settings.locale === 'fa' ? 'rtl' : 'ltr'; }, [settings]);
  return <div className={`min-h-screen ${settings.motion === 'off' ? 'motion-off' : ''}`}>
    <Header locale={settings.locale} settings={settings} setSettings={setSettings}/>
    <main id="main"><Routes>
      <Route path="/" element={<Home locale={settings.locale}/>}/>
      <Route path="/games/m32-merge" element={<MergePage locale={settings.locale} settings={settings} setSettings={setSettings}/>}/>
      <Route path="/games/terminal-escape" element={<TerminalEscapePage locale={settings.locale} settings={settings} setSettings={setSettings}/>}/>
      <Route path="/games/memory-bits" element={<MemoryBitsPage locale={settings.locale} settings={settings} setSettings={setSettings}/>}/>
      <Route path="/about" element={<About locale={settings.locale}/>}/>
      <Route path="*" element={<div className="mx-auto max-w-3xl px-5 py-32 text-center"><h1 className="text-5xl font-black">404</h1><p className="my-8 text-zinc-400">{settings.locale==='fa'?'این صفحه پیدا نشد.':'Page not found.'}</p><Link to="/" className="text-emerald-300">{settings.locale==='fa'?'بازگشت به خانه':'Back home'}</Link></div>}/>
    </Routes></main>
    <Footer locale={settings.locale}/>
  </div>;
}
