/**
 * Terminal Escape: a deterministic, fully simulated adventure.
 * No user command is executed by a shell, browser API, or network service.
 * Engine has no UI, storage or DOM dependencies.
 */
export type Stage = 0 | 1 | 2 | 3 | 4 | 5;
export type Tone = 'normal' | 'success' | 'error' | 'accent' | 'muted';
export type LocalizedLine = { fa: string; en: string; tone: Tone };
export type Entry = { id: number; command: string; lines: LocalizedLine[] };
export type GameState = {
  version: 1; stage: Stage; cwd: '/' | '/cache'; found: string[];
  commands: number; mistakes: number; hintsUsed: number; easterEgg: boolean;
  startedAt: number; finishedAt: number | null; score: number; history: Entry[];
};
export const STAGES = [
  { id: '01', label: 'ACCESS GATE', fa: 'دروازه دسترسی', en: 'Access gate', hint: { fa: 'اول ls و بعد cat access.log را بزن.', en: 'Start with ls and read access.log.' } },
  { id: '02', label: 'FILE SYSTEM', fa: 'فایل‌های گمشده', en: 'Lost files', hint: { fa: 'با cd cache وارد پوشه شو و trace.log را بخوان؛ بعد به / برگرد.', en: 'Use cd cache, read trace.log, then return to /.' } },
  { id: '03', label: 'NETWORK', fa: 'مسیر شبکه', en: 'Network route', hint: { fa: 'scan، بعد ping 10.0.0.32 و سپس اتصال به پورت نمایش‌داده‌شده.', en: 'Run scan, ping 10.0.0.32, then connect to its port.' } },
  { id: '04', label: 'CONTROL CORE', fa: 'هسته کنترل', en: 'Control core', hint: { fa: 'با cat core.cfg سرنخ کد Override را پیدا کن.', en: 'Read core.cfg to discover the override code.' } },
  { id: '05', label: 'FINAL EXIT', fa: 'خروج نهایی', en: 'Final exit', hint: { fa: 'وضعیت سیستم را با status بررسی کن و دستور نهایی را اجرا کن.', en: 'Check status, then execute the final launch instruction.' } }
] as const;
const output = (fa: string, en: string, tone: Tone = 'normal'): LocalizedLine => ({ fa, en, tone });
export const initialLines = [
  output('M32 LAB / SESSION RESTORED', 'M32 LAB / SESSION RESTORED', 'accent'),
  output('در یک آزمایشگاه دیجیتال قفل شده‌ای. پنج لایه امنیتی بین تو و در خروج قرار دارد.', 'You are locked inside a digital lab. Five security layers stand between you and the exit.'),
  output('فقط یک ترمینال شبیه‌سازی‌شده در دسترس است. با help شروع کن.', 'Only a simulated terminal is available. Start with help.', 'muted')
];
export function createGame(now = Date.now()): GameState {
  return { version:1, stage:0, cwd:'/', found:[], commands:0, mistakes:0, hintsUsed:0,
    easterEgg:false, startedAt:now, finishedAt:null, score:0, history:[] };
}
export function durationSeconds(game: GameState, now = Date.now()) {
  return Math.max(0, Math.floor(((game.finishedAt ?? now) - game.startedAt) / 1000));
}
export function computeScore(game: GameState): number {
  return Math.max(320, 3200 - game.commands * 24 - game.mistakes * 90
    - game.hintsUsed * 240 + (game.easterEgg ? 32 : 0));
}
export const suggestedCommands: Record<Stage, string[]> = {
  0: ['help', 'ls', 'cat mission.txt', 'cat access.log'],
  1: ['ls', 'cat readme.md', 'cd cache', 'cat trace.log', 'cd ..'],
  2: ['scan', 'ping 10.0.0.32', 'connect 10.0.0.32 4321'],
  3: ['status', 'cat core.cfg', 'override 032'],
  4: ['status', 'launch m32'],
  5: ['map', 'help']
};
export function execute(game: GameState, raw: string, now = Date.now()): GameState {
  const command = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!command || game.finishedAt !== null) return game;
  const next: GameState = { ...game, found: [...game.found], history: [...game.history],
    commands: game.commands + 1 };
  const lines: LocalizedLine[] = [];
  const say = (fa: string, en: string, tone: Tone = 'normal') => { lines.push(output(fa,en,tone)); };
  const invalid = (fa: string, en: string) => {
    next.mistakes += 1;
    say(fa,en,'error');
  };
  const seen = (flag: string) => next.found.includes(flag);
  const discover = (flag: string) => { if (!seen(flag)) next.found.push(flag); };
  const advance = (fa: string, en: string) => {
    next.stage = (next.stage + 1) as Stage;
    next.cwd = '/';
    say('✓ '+fa,'✓ '+en,'success');
    if (next.stage < 5) {
      say('لایه بعدی: '+STAGES[next.stage as 0|1|2|3|4].fa, 'Next layer: '+STAGES[next.stage as 0|1|2|3|4].en,'accent');
    }
  };
  if (command === 'clear') {
    return { ...next, history:[] };
  }
  if (command === 'help') {
    say('دستورهای عمومی: help, ls, cat, cd, pwd, status, map, inventory, hint, clear', 'Global commands: help, ls, cat, cd, pwd, status, map, inventory, hint, clear','accent');
    say('دستورهای این لایه: '+suggestedCommands[next.stage].join(' · '), 'Commands for this layer: '+suggestedCommands[next.stage].join(' · '));
    say('همه چیز یک بازی شبیه‌سازی‌شده است؛ هیچ دستور سیستم‌عاملی اجرا نمی‌شود.', 'This is a simulated game. No real operating-system commands are executed.','muted');
  } else if (command === 'hint') {
    next.hintsUsed += 1;
    const hint = STAGES[next.stage as 0|1|2|3|4].hint;
    say('راهنما (جریمه امتیاز): '+hint.fa, 'Hint (score penalty): '+hint.en,'accent');
  } else if (command === 'map') {
    say('نقشه: '+STAGES.map((stage,index)=>index < next.stage?'[✓ '+stage.id+']':index===next.stage?'[> '+stage.id+']':'[· '+stage.id+']').join(' '),
      'Map: '+STAGES.map((stage,index)=>index < next.stage?'[✓ '+stage.id+']':index===next.stage?'[> '+stage.id+']':'[· '+stage.id+']').join(' '),'accent');
  } else if (command === 'inventory') {
    say('سرنخ‌ها: '+(next.found.length?next.found.join(', '):'هنوز چیزی پیدا نکرده‌ای.'),
      'Clues: '+(next.found.length?next.found.join(', '):'Nothing discovered yet.'));
  } else if (command === 'pwd') {
    say('مکان: '+next.cwd,'Working directory: '+next.cwd);
  } else if (command === 'm32') {
    next.easterEgg = true;
    say('✦ M32 / سیگنال مخفی کشف شد! امتیاز ویژه +۳۲ در پایان.', '✦ M32 / Secret signal discovered! +32 bonus points at the end.','success');
  } else if (next.stage === 0) {
    switch(command) {
      case 'ls':
        say('mission.txt  access.log','mission.txt  access.log');
        break;
      case 'cat mission.txt':
        say('ماموریت: شناسه دسترسی را از access.log بخوان و با unlock <code> قفل را باز کن.',
          'Mission: find the credential in access.log and run unlock <code>.','accent');
        break;
      case 'cat access.log':
        discover('access-log');
        say('AUTH RECORD 032 | credential: m32', 'AUTH RECORD 032 | credential: m32','accent');
        break;
      case 'unlock m32':
        if (seen('access-log')) advance('دروازه دسترسی باز شد.', 'Access gate unlocked.');
        else invalid('ابتدا مدرک اعتبار را از access.log پیدا کن.', 'You must inspect access.log before unlocking.');
        break;
      default:
        invalid('دستور شناخته نشد. با help یا ls شروع کن.', 'Unknown command. Try help or ls.');
    }
  } else if (next.stage === 1) {
    switch(command) {
      case 'ls':
        say(next.cwd==='/'?'readme.md  cache/':'trace.log',
          next.cwd==='/'?'readme.md  cache/':'trace.log');
        break;
      case 'cat readme.md':
        if(next.cwd==='/') say('فایل کلید گم شده است. آخرین ردپا در پوشه cache/ ثبت شده؛ بعد از پیدا کردنش به ریشه برگرد و decrypt <key> بزن.',
          'Key file missing. Last trace is in cache/. Return to root and run decrypt <key> when you find it.');
        else invalid('readme.md اینجا وجود ندارد.', 'readme.md is not in this directory.');
        break;
      case 'cd cache':
      case 'cd /cache':
        next.cwd='/cache';say('مسیر: /cache', 'Directory: /cache');
        break;
      case 'cd ..':
      case 'cd /':
        next.cwd='/';say('مسیر: /', 'Directory: /');
        break;
      case 'cat trace.log':
      case 'cat cache/trace.log':
        if(next.cwd==='/cache' || command==='cat cache/trace.log'){
          discover('cipher-key');
          say('RECOVERY KEY >> echo-7', 'RECOVERY KEY >> echo-7','accent');
        } else invalid('در این مسیر فایل وجود ندارد. اول cd cache بزن.', 'Not found here. Try cd cache.');
        break;
      case 'decrypt echo-7':
        if(!seen('cipher-key')) invalid('ابتدا کلید را در فایل trace.log کشف کن.', 'Find the cipher key in trace.log first.');
        else if(next.cwd!=='/') invalid('دستور decrypt باید از مسیر / اجرا شود. از cd .. استفاده کن.', 'Decrypt must run in /. Use cd .. first.');
        else advance('پرونده رمزگشایی شد.', 'Vault decrypted.');
        break;
      default: invalid('فایل یا دستور نامعتبر است. ls و help را امتحان کن.', 'Unknown file or command. Try ls or help.');
    }
  } else if (next.stage === 2) {
    switch(command) {
      case 'scan':
        discover('network-scan');
        say('NETWORK DISCOVERY: M32 RELAY / 10.0.0.32', 'NETWORK DISCOVERY: M32 RELAY / 10.0.0.32','accent');
        say('پورت باز هنوز معلوم نیست. ping بزن.', 'Open port unknown. Try ping.');
        break;
      case 'ping 10.0.0.32':
        if(!seen('network-scan')) invalid('ابتدا شبکه را scan کن.', 'Scan the network first.');
        else { discover('network-ping'); say('REPLY 10.0.0.32 / SERVICE PORT: 4321', 'REPLY 10.0.0.32 / SERVICE PORT: 4321','accent'); }
        break;
      case 'connect 10.0.0.32 4321':
        if(seen('network-ping')) advance('تونل شبکه امن فعال شد.', 'Secure network tunnel established.');
        else invalid('ابتدا سرویس را با scan و ping کشف کن.', 'Discover the service with scan and ping first.');
        break;
      default: invalid('آدرس یا دستور اشتباه است. help یا scan.', 'Incorrect address or command. Try help or scan.');
    }
  } else if (next.stage === 3) {
    switch(command) {
      case 'ls':
        say('core.cfg  system.log','core.cfg  system.log');
        break;
      case 'status':
        say('CORE: LOCKED / SAFE MODE / CONFIG AVAILABLE', 'CORE: LOCKED / SAFE MODE / CONFIG AVAILABLE','accent');
        break;
      case 'cat system.log':
        say('NOTE: Maintenance override is stored in core.cfg', 'NOTE: Maintenance override is stored in core.cfg');
        break;
      case 'cat core.cfg':
        discover('core-config');
        say('M32 CONTROL FILE / override code: 032', 'M32 CONTROL FILE / override code: 032','accent');
        break;
      case 'override 032':
        if(seen('core-config'))advance('هسته کنترل آزاد شد.', 'Control core overridden.');
        else invalid('کد را باید ابتدا از core.cfg پیدا کنی.', 'You must first inspect core.cfg.');
        break;
      default: invalid('دستور اشتباه. status و ls را امتحان کن.', 'Unknown command. Try status or ls.');
    }
  } else if(next.stage===4) {
    switch(command){
      case 'status':
        discover('launch-ready');
        say('SYSTEM READY / EXIT SEQUENCE: launch m32', 'SYSTEM READY / EXIT SEQUENCE: launch m32','accent');
        break;
      case 'launch m32':
        if(!seen('launch-ready')) invalid('اول با status آمادگی هسته را بررسی کن.', 'Check core readiness with status first.');
        else {
          next.stage=5;next.finishedAt=now;next.score=computeScore(next);
          say('ACCESS GRANTED / EXIT UNLOCKED / M32 LAB COMPLETE ✦','ACCESS GRANTED / EXIT UNLOCKED / M32 LAB COMPLETE ✦','success');
          say('آفرین! هر پنج لایه را پشت سر گذاشتی.', 'You escaped! All five security layers cleared.','success');
        }
        break;
      default: invalid('سیستم آماده خروج است. status را اجرا کن.', 'System is ready for exit. Try status.');
    }
  }
  const entry: Entry={id:next.commands,command,lines};
  next.history=[...next.history,entry].slice(-100);
  return next;
}
