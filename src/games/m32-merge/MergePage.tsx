import { useCallback, useEffect, useRef, useState, type CSSProperties, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUp, CircleHelp, Copy, Medal, Pause, Play, Redo2, RotateCcw, Settings2, Share2, Sparkles, Trophy, Undo2, Volume2, VolumeX, X } from 'lucide-react';
import type { AppProps } from '../../App';
import { canMove, continueGame, highestTile, move, newGame, undo, type Direction, type GameState, type MergeEvent, type TileMotion } from './engine';
import { getOrStartSession, loadStats, recordMove, recordNewGame, resetStats, saveSession, type Stats } from '../../lib/storage';

const tileColors: Record<number, string> = {
  2: 'bg-[#1c302b] text-[#defff0]', 4: 'bg-[#275044] text-[#ecfff5]',
  8: 'bg-[#256c54] text-white', 16: 'bg-[#258669] text-white',
  64: 'bg-[#164c6c] text-sky-100', 128: 'bg-[#344d8b] text-sky-100',
  256: 'bg-[#573b8c] text-violet-100', 512: 'bg-[#823b83] text-fuchsia-100',
  1024: 'bg-[#955b2b] text-amber-100', 2048: 'bg-[#ad7d22] text-amber-50'
};
function formatNumber(value: number, fa: boolean) { return new Intl.NumberFormat(fa ? 'fa-IR' : 'en-US').format(value); }
function playTone() {
  try {
    const Audio = window.AudioContext;
    if (!Audio) return;
    const ctx = new Audio();
    const oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(550, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + .095);
    gain.gain.setValueAtTime(.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .12);
    oscillator.connect(gain); gain.connect(ctx.destination);
    oscillator.start(); oscillator.stop(ctx.currentTime + .13);
    oscillator.onended = () => { void ctx.close(); };
  } catch { /* sound must never interrupt gameplay */ }
}
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section role="dialog" aria-modal="true" aria-label={title} className="glass w-full max-w-md rounded-[28px] p-6 shadow-2xl sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-xl font-extrabold text-white">{title}</h2><button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-white/10 p-2 text-zinc-400 hover:text-white"><X size={18}/></button></div>
      {children}
    </section>
  </div>;
}
type Fx = { id: number; cells: MergeEvent[]; first: boolean };
export default function MergePage({ locale, settings, setSettings }: AppProps) {
  const fa = locale === 'fa';
  const [game, setGame] = useState<GameState>(getOrStartSession);
  const gameRef = useRef(game);
  const [stats, setStats] = useState<Stats>(loadStats);
  const statsRef = useRef(stats);
  const [help, setHelp] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fx, setFx] = useState<Fx | null>(null);
  const [merged, setMerged] = useState<MergeEvent[]>([]);
  const [motions, setMotions] = useState<TileMotion[]>([]);
  const [version, setVersion] = useState(0);
  const [shareMessage, setShareMessage] = useState('');
  const fxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchOrigin = useRef<{x:number;y:number}|null>(null);
  useEffect(() => { gameRef.current=game; saveSession(game); }, [game]);
  useEffect(() => { statsRef.current=stats; }, [stats]);
  useEffect(() => () => { if(fxTimer.current) clearTimeout(fxTimer.current); }, []);
  useEffect(() => { if (settings.motion === 'off') setFx(null); }, [settings.motion]);

  const updateGame = useCallback((next: GameState) => {
    gameRef.current = next; saveSession(next); setGame(next);
  }, []);
  const moveIn = useCallback((direction: Direction) => {
    const previous = gameRef.current;
    const result = move(previous, direction);
    if (!result.moved) return;
    updateGame(result.state);
    const nextStats = recordMove(previous, result.state, result.created32, statsRef.current);
    statsRef.current = nextStats;
    setStats(nextStats);
    setMerged(result.merges);
    setMotions(result.motions);
    setVersion(v => v + 1);
    if (settings.sound && result.merges.length) playTone();
    if (fxTimer.current) clearTimeout(fxTimer.current);
    if (result.created32 && settings.motion !== 'off') {
      const reduced = settings.motion === 'auto' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced) {
        setFx({ id: Date.now(), cells: result.merges.filter(item => item.value === 32), first: statsRef.current.total32 === result.created32 });
        fxTimer.current = setTimeout(() => setFx(null), 760);
      } else setFx(null);
    } else setFx(null);
  }, [settings.sound, settings.motion, updateGame]);
  const doUndo = useCallback(() => {
    const current=gameRef.current;
    if(!current.past)return;
    updateGame(undo(current));
    setFx(null);setMerged([]);setMotions([]);setVersion(v=>v+1);
  },[updateGame]);
  const startNew = useCallback(() => {
    if (!window.confirm(fa?'بازی فعلی تمام شود و بازی جدید شروع شود؟':'End current game and start a new one?')) return;
    const next = newGame();
    updateGame(next);
    const updated = recordNewGame(next, statsRef.current);
    statsRef.current = updated; setStats(updated);
    setFx(null); setMerged([]); setMotions([]); setVersion(v=>v+1);
  }, [fa,updateGame]);
  const pause = () => { updateGame({ ...gameRef.current, paused: !gameRef.current.paused }); };
  const resumeWinner = () => { updateGame(continueGame(gameRef.current)); };
  const clearStats = () => {
    if (!window.confirm(fa?'تمام آمار و رکوردهای ذخیره‌شده پاک شوند؟ بازی فعلی حفظ می‌شود.':'Clear all local statistics and records? The current game will be kept.')) return;
    const fresh=resetStats(); statsRef.current=fresh;setStats(fresh);
  };
  const share = async () => {
    const result = fa
      ? `🎮 M32 Merge | امتیاز: ${gameRef.current.score} | بیشترین کاشی: ${highestTile(gameRef.current.board)} | ساخت عدد ۳۲: ${gameRef.current.merge32Count}\nhttps://play.mehrdad32.ir/games/m32-merge`
      : `🎮 M32 Merge | Score: ${gameRef.current.score} | Top tile: ${highestTile(gameRef.current.board)} | M32 merges: ${gameRef.current.merge32Count}\nhttps://play.mehrdad32.ir/games/m32-merge`;
    try {
      if (navigator.share) { await navigator.share({ title:'M32 Merge', text:result }); return; }
      await navigator.clipboard.writeText(result);
      setShareMessage(fa?'نتیجه کپی شد!':'Result copied!');
    } catch(e) {
      if ((e as Error).name === 'AbortError') return;
      try { await navigator.clipboard.writeText(result); setShareMessage(fa?'نتیجه کپی شد!':'Result copied!'); }
      catch { setShareMessage(fa?'اشتراک‌گذاری در این مرورگر در دسترس نیست.':'Sharing is unavailable in this browser.'); }
    }
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if(help || settingsOpen || event.altKey || event.metaKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
      const directions: Record<string,Direction> = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down' };
      if (directions[event.key]) { event.preventDefault(); moveIn(directions[event.key]); }
      if ((event.ctrlKey && event.key.toLowerCase()==='z') || event.key.toLowerCase()==='u') { event.preventDefault(); doUndo(); }
    };
    window.addEventListener('keydown',onKey);
    return () => window.removeEventListener('keydown',onKey);
  },[help,settingsOpen,moveIn,doUndo]);
  const onTouchStart = (e:TouchEvent<HTMLDivElement>) => { touchOrigin.current={x:e.touches[0].clientX,y:e.touches[0].clientY}; };
  const onTouchEnd = (e:TouchEvent<HTMLDivElement>) => {
    const start=touchOrigin.current;touchOrigin.current=null;
    if(!start)return;
    const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
    moveIn(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
  };
  const showWin=game.won&&!game.continued&&!game.over;
  const finished=game.over||(!canMove(game.board)&&!game.won);
  return <section className="relative mx-auto min-h-[80vh] max-w-6xl px-4 pb-20 pt-10 sm:px-8 sm:pt-14">
    <div className="mb-9 flex flex-wrap items-center justify-between gap-3">
      <div><Link to="/" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-emerald-300">{fa?'← بازگشت به Playground':'← Back to Playground'}</Link>
        <div className="mt-3 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300"><Sparkles size={27}/></div><div><h1 dir="ltr" className="font-mono text-2xl font-black tracking-tight text-white sm:text-3xl">M32 Merge</h1><p className="mt-1 text-xs text-zinc-500">{fa?'اعداد را ترکیب کن؛ لحظه ۳۲ را بساز.':'Merge tiles. Make your M32 moment.'}</p></div></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={()=>setHelp(true)} className="rounded-xl border border-white/10 p-3 text-zinc-400 hover:text-emerald-300" aria-label={fa?'راهنما':'Help'} title={fa?'راهنما':'Help'}><CircleHelp size={20}/></button>
        <button type="button" onClick={()=>setSettingsOpen(true)} className="rounded-xl border border-white/10 p-3 text-zinc-400 hover:text-emerald-300" aria-label={fa?'تنظیمات':'Settings'} title={fa?'تنظیمات':'Settings'}><Settings2 size={20}/></button>
        <button type="button" onClick={()=>void share()} className="rounded-xl border border-white/10 p-3 text-zinc-400 hover:text-emerald-300" aria-label={fa?'اشتراک‌گذاری نتیجه':'Share result'} title={fa?'اشتراک‌گذاری نتیجه':'Share result'}><Share2 size={20}/></button>
      </div>
    </div>
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="mx-auto w-full max-w-[552px]">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl px-5 py-4"><div className="text-xs text-zinc-500">{fa?'امتیاز':'SCORE'}</div><div dir="ltr" className="mt-1 font-mono text-2xl font-black text-white sm:text-3xl">{formatNumber(game.score,fa)}</div></div>
          <div className="glass rounded-2xl px-5 py-4"><div className="flex items-center gap-1 text-xs text-zinc-500"><Trophy size={14} className="text-emerald-300"/>{fa?'بهترین رکورد':'BEST SCORE'}</div><div dir="ltr" className="mt-1 font-mono text-2xl font-black text-emerald-300 sm:text-3xl">{formatNumber(stats.bestScore,fa)}</div></div>
        </div>
        <div className="relative overflow-hidden rounded-[24px] border border-white/[.09] bg-[#101915] p-2.5 shadow-[0_30px_90px_rgba(0,0,0,.35)] sm:rounded-[32px] sm:p-4"
          dir="ltr" role="application" aria-label={fa?'صفحه بازی چهار در چهار':'4 by 4 game board'}
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{touchAction:'none',userSelect:'none',WebkitUserSelect:'none'}}>
          <div className="game-board-grid grid grid-cols-4 gap-2 sm:gap-3">
            {game.board.map((row,r)=>row.map((value,c)=>{
              const mergedHere=merged.some(m=>m.row===r&&m.col===c);
              const activeFx=fx?.cells.some(m=>m.row===r&&m.col===c);
              const is32=value===32;
              const motion = motions.find(m => m.toRow===r && m.toCol===c && (m.fromRow!==r || m.fromCol!==c));
              const motionStyle = motion ? {
                '--from-x': `calc(${motion.fromCol-c} * (100% + var(--cell-gap)))`,
                '--from-y': `calc(${motion.fromRow-r} * (100% + var(--cell-gap)))`
              } as CSSProperties : undefined;
              return <div key={r+'-'+c} className="relative aspect-square min-w-0 rounded-xl bg-white/[.045] sm:rounded-2xl">
                {value>0 && <div key={version+'-'+r+'-'+c} aria-label={String(value)} style={motionStyle}
                  className={`tile ${motion?'tile-moving':''} absolute inset-0 grid place-items-center rounded-xl font-mono font-extrabold tracking-tighter sm:rounded-2xl ${is32?'tile-m32':tileColors[value]??'bg-[#63502f] text-white'} ${mergedHere?'tile-merged':''} ${value>=1024?'text-xl sm:text-3xl':value>=128?'text-2xl sm:text-4xl':'text-3xl sm:text-5xl'}`}>
                  {value}{is32 && <span className="absolute bottom-1 text-[6px] tracking-[.17em] text-emerald-100/70 sm:bottom-2 sm:text-[8px]">M32</span>}
                </div>}
                {activeFx && <div key={fx!.id+'-'+r+'-'+c} className="m32-burst"><span>✦ M32</span>{Array.from({length:8},(_,i)=><i key={i} className="particle" style={{'--angle':`${i*45}deg`} as CSSProperties}/>)}</div>}
              </div>;
            }))}
          </div>
          {game.paused && <div className="absolute inset-0 z-30 grid place-items-center bg-[#07090d]/85 backdrop-blur-lg"><div className="text-center"><Pause className="mx-auto mb-4 text-emerald-300" size={48}/><p className="mb-6 text-lg font-bold text-white">{fa?'بازی متوقف شده':'Game paused'}</p><button type="button" onClick={pause} className="rounded-full bg-emerald-300 px-6 py-3 font-semibold text-[#06150e]">{fa?'ادامه بازی':'Resume'}</button></div></div>}
          {(showWin||finished) && !game.paused && <div className="absolute inset-0 z-30 grid place-items-center bg-[#06150f]/90 p-6 text-center backdrop-blur-md">
            <div><Medal className="mx-auto mb-4 text-emerald-300" size={58}/><h2 className="text-3xl font-black text-white">{showWin?(fa?'تو برنده شدی!':'You made it!'):(fa?'بازی تموم شد!':'Game over!')}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{showWin?(fa?'به کاشی ۲۰۴۸ رسیدی؛ می‌تونی ادامه بدی.':'You reached 2048. Keep the streak alive!'):(fa?'دیگه حرکتی نمونده. برای رکورد بعدی تلاش کن.':'No more moves. Ready to try again?')}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">{showWin && <button type="button" onClick={resumeWinner} className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold text-[#06150e]">{fa?'ادامه بازی':'Continue playing'}</button>}<button type="button" onClick={startNew} className="rounded-full border border-white/20 px-5 py-3 text-sm text-white">{fa?'بازی جدید':'New game'}</button></div>
            </div></div>}
        </div>
        <p className="mt-4 text-center text-xs leading-7 text-zinc-500">{fa?'با کشیدن انگشت یا کلیدهای جهت‌دار حرکت کن. هر دو کاشی مساوی یکی می‌شوند.':'Swipe or use arrow keys. Matching tiles combine into one.'}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <button onClick={startNew} className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold text-[#06150e] hover:bg-emerald-200"><RotateCcw size={16}/>{fa?'بازی جدید':'New game'}</button>
          <button onClick={doUndo} disabled={!game.past} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-200 hover:border-emerald-300/30 disabled:opacity-35"><Undo2 size={17}/>{fa?'برگشت یک حرکت':'Undo'}</button>
          <button onClick={pause} disabled={showWin||finished} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-zinc-200 disabled:opacity-35">{game.paused?<Play size={16}/>:<Pause size={16}/>} {game.paused?(fa?'ادامه':'Resume'):(fa?'توقف':'Pause')}</button>
        </div>
        <div dir="ltr" className="mt-5 hidden flex-col items-center gap-1 text-zinc-600 sm:flex"><button type="button" onClick={()=>moveIn('up')} aria-label="Move up" className="rounded-lg border border-white/10 p-2 hover:text-emerald-300"><ArrowUp size={17}/></button><div className="flex gap-1"><button type="button" onClick={()=>moveIn('left')} aria-label="Move left" className="rounded-lg border border-white/10 p-2 hover:text-emerald-300"><ArrowLeft size={17}/></button><button type="button" onClick={()=>moveIn('down')} aria-label="Move down" className="rounded-lg border border-white/10 p-2 hover:text-emerald-300"><Redo2 className="rotate-90" size={17}/></button><button type="button" onClick={()=>moveIn('right')} aria-label="Move right" className="rounded-lg border border-white/10 p-2 hover:text-emerald-300"><ArrowRight size={17}/></button></div></div>
      </div>
      <aside className="space-y-4">
        <div className="glass rounded-[24px] p-6"><div className="flex items-center gap-2 text-xs font-bold tracking-wide text-emerald-300"><Sparkles size={17}/> M32 / SIGNATURE</div>
          <div className="mt-5 flex items-end justify-between"><div className="font-mono text-5xl font-black text-emerald-300">{formatNumber(game.merge32Count,fa)}</div><div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[.065] px-3 py-2 font-mono text-xs text-emerald-200">16 + 16 → 32</div></div>
          <p className="mt-4 text-sm leading-7 text-zinc-400">{fa?'تعداد دفعات ساخت عدد ۳۲ در همین بازی':'Number of M32 tiles created this game'}</p>
          <div className="mt-5 border-t border-white/10 pt-4">{stats.total32>0?<span className="inline-flex items-center gap-2 text-xs text-emerald-200"><Medal size={18}/> {fa?'دستاورد «اولین ۳۲» آزاد شد!':'First M32 achievement unlocked!'}</span>:<span className="text-xs text-zinc-600">{fa?'اولین ۳۲ خودت رو بساز تا نشان بگیری.':'Create your first 32 to earn a badge.'}</span>}</div>
        </div>
        <div className="glass rounded-[24px] p-6"><h3 className="mb-5 font-bold text-zinc-200">{fa?'آمار محلی':'Local statistics'}</h3>
          <dl className="space-y-3 text-sm">{[
            [fa?'تعداد بازی‌ها':'Games played',stats.games],
            [fa?'تعداد بردها':'Wins',stats.wins],
            [fa?'بالاترین کاشی':'Highest tile',stats.highestTile],
            [fa?'مجموع ساخت ۳۲':'Total M32 merges',stats.total32],
            [fa?'تعداد حرکت‌ها':'Current moves',game.moves]
          ].map(([label,val])=><div key={String(label)} className="flex justify-between gap-4 border-b border-white/[.06] pb-3"><dt className="text-zinc-500">{label}</dt><dd dir="ltr" className="font-mono font-bold text-zinc-200">{formatNumber(Number(val),fa)}</dd></div>)}</dl>
          <button onClick={clearStats} className="mt-5 text-xs text-zinc-500 underline underline-offset-4 hover:text-rose-300">{fa?'پاک کردن آمار (با تأیید)':'Reset statistics (confirm)'}</button>
        </div>
        <div className="rounded-[22px] border border-white/[.07] p-5 text-xs leading-7 text-zinc-500"><span className="font-semibold text-zinc-300">{fa?'بدون حساب کاربری، بدون ردیابی':'No account. No tracking.'}</span><br/>{fa?'رکوردها و بازی فعلی فقط در همین مرورگر ذخیره می‌شوند.':'Your records and current game stay in this browser only.'}</div>
      </aside>
    </div>
    {shareMessage && <div role="status" className="fixed bottom-6 start-1/2 z-40 -translate-x-1/2 rounded-full border border-emerald-300/30 bg-[#0b2c21] px-6 py-3 text-sm text-emerald-100"><Copy size={14} className="me-2 inline"/>{shareMessage}<button className="ms-4" onClick={()=>setShareMessage('')} aria-label="Dismiss"><X size={14}/></button></div>}
    {help && <Dialog title={fa?'راهنمای M32 Merge':'How to play M32 Merge'} onClose={()=>setHelp(false)}>
      <p className="text-sm leading-8 text-zinc-300">{fa?'با سوایپ یا کلیدهای جهت‌دار، کاشی‌ها را حرکت بده. دو عدد مساوی با هم ترکیب می‌شوند. با ساخت کاشی ۲۰۴۸ برنده‌ای؛ اما می‌توانی به بازی ادامه بدهی. وقتی ۱۶ + ۱۶ به ۳۲ برسد، یک افکت ویژه M32 می‌بینی.':'Swipe or use arrow keys to move all tiles. Two equal tiles merge into one. Reach 2048 to win, or continue playing. Merging 16 + 16 creates a special M32 moment.'}</p><p className="mt-4 text-sm text-zinc-500">{fa?'برای برگشت یک حرکت، دکمه Undo یا کلید U را بزن.':'Undo one step with the Undo button or U key.'}</p>
      <button className="mt-6 w-full rounded-full bg-emerald-300 py-3 font-bold text-[#06150e]" onClick={()=>setHelp(false)}>{fa?'فهمیدم، بریم بازی!':'Got it!'}</button>
    </Dialog>}
    {settingsOpen && <Dialog title={fa?'تنظیمات بازی':'Game settings'} onClose={()=>setSettingsOpen(false)}>
      <div className="space-y-6 text-sm"><label className="flex items-center justify-between gap-4 text-zinc-300"><span className="flex items-center gap-2">{settings.sound?<Volume2 size={18}/>:<VolumeX size={18}/>} {fa?'صدای بازی':'Sound effects'}</span><input className="h-5 w-5 accent-emerald-400" type="checkbox" checked={settings.sound} onChange={e=>setSettings({...settings,sound:e.target.checked})}/></label>
        <label className="flex items-center justify-between gap-4 text-zinc-300"><span>{fa?'انیمیشن‌ها':'Animations'}</span><select className="rounded-xl border border-white/20 bg-[#13221d] px-3 py-2 text-white" value={settings.motion} onChange={e=>setSettings({...settings,motion:e.target.value as typeof settings.motion})}><option value="auto">{fa?'سیستم (پیشنهادی)':'System preference'}</option><option value="full">{fa?'روشن':'On'}</option><option value="off">{fa?'خاموش':'Off'}</option></select></label>
        <p className="text-xs leading-7 text-zinc-500">{fa?'در حالت سیستم، تنظیم Reduced Motion دستگاه رعایت می‌شود. صدا به‌صورت پیش‌فرض خاموش است.':'System mode respects the device reduced-motion preference. Sound is off by default.'}</p>
      </div>
    </Dialog>}
  </section>;
}
