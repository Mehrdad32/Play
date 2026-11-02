import type { LucideIcon } from 'lucide-react';
import { Blocks, Zap, Hexagon, BrainCircuit, Terminal } from 'lucide-react';
export type GameInfo = {
  id: string; name: string; titleFa: string; titleEn: string;
  descFa: string; descEn: string; url?: string; icon: LucideIcon; status: 'live' | 'soon';
  accent: string; number: string;
};
export const games: GameInfo[] = [
  { id: 'm32-merge', name: 'M32 Merge', titleFa: 'ادغام کن، رکورد بزن', titleEn: 'Merge your way up',
    descFa: 'اعداد را به هم برسان، ترکیب بساز و جادوی عدد ۳۲ را کشف کن.',
    descEn: 'Slide, combine and chase the legendary M32 tile.', url: '/games/m32-merge',
    icon: Blocks, status: 'live', accent: 'emerald', number: '01' },
  { id: 'reaction-32', name: 'Reaction 32', titleFa: 'چقدر سریع واکنش می‌دهی؟', titleEn: 'How fast can you react?',
    descFa: '۳۲ لحظه برای آزمایش سرعت واکنش تو.', descEn: '32 moments to test your reflexes.',
    icon: Zap, status: 'soon', accent: 'amber', number: '02' },
  { id: 'hex-hunter', name: 'HEX Hunter', titleFa: 'شکارچی کدهای HEX', titleEn: 'Hunt the hex code',
    descFa: 'چالش رنگ، دقت و سرعت تصمیم‌گیری.', descEn: 'Color, accuracy and quick decisions.',
    icon: Hexagon, status: 'soon', accent: 'sky', number: '03' },
  { id: 'memory-bits', name: 'Memory Bits', titleFa: 'حافظه‌ات چند مرحله دوام می‌آورد؟', titleEn: 'How far can your memory go?',
    descFa: 'چهار حالت بازی: کلاسیک، معکوس، Glitch و چالش روزانه. به مرحله ۳۲ برس!',
    descEn: 'Four modes: Classic, Reverse, Glitch and Daily. Can you reach round 32?',
    icon: BrainCircuit, status: 'live', url: '/games/memory-bits', accent: 'emerald', number: '04' },
  { id: 'terminal-escape', name: 'Terminal Escape', titleFa: 'از آزمایشگاه M32 فرار کن!', titleEn: 'Escape the locked M32 lab',
    descFa: 'پنج مرحله معمایی، دستورهای ترمینال، سرنخ‌های مخفی و یک راه خروج. آماده‌ای؟',
    descEn: 'Five puzzle layers, secret clues and one simulated terminal. Can you escape?',
    icon: Terminal, status: 'live', url: '/games/terminal-escape', accent: 'emerald', number: '05' }
];
