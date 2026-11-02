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
  { id: 'reaction-32', name: 'Reaction 32', titleFa: 'رکورد واکنشت چند میلی‌ثانیه‌ست؟', titleEn: 'How fast can you react?',
    descFa: 'چهار حالت: سرعت واکنش، هجوم ۳۲ ثانیه‌ای، علامت تقلبی و دوئل دونفره.',
    descEn: 'Reflex tests, 32-second rush, decoy signals and two-player duels.',
    icon: Zap, status: 'live', url: '/games/reaction-32', accent: 'amber', number: '02' },
  { id: 'hex-hunter', name: 'HEX Hunter', titleFa: 'چشم تیزبینت رو امتحان کن!', titleEn: 'Hunt the right color!',
    descFa: 'کد HEX را بخوان، رنگ متفاوت را پیدا کن یا با RGB رنگ بساز. چالش روزانه هم داریم!',
    descEn: 'Decode HEX codes, find the odd shade, mix RGB and play the daily challenge.',
    icon: Hexagon, status: 'live', url: '/games/hex-hunter', accent: 'sky', number: '03' },
  { id: 'memory-bits', name: 'Memory Bits', titleFa: 'حافظه‌ات چند مرحله دوام می‌آورد؟', titleEn: 'How far can your memory go?',
    descFa: 'چهار حالت بازی: کلاسیک، معکوس، Glitch و چالش روزانه. به مرحله ۳۲ برس!',
    descEn: 'Four modes: Classic, Reverse, Glitch and Daily. Can you reach round 32?',
    icon: BrainCircuit, status: 'live', url: '/games/memory-bits', accent: 'emerald', number: '04' },
  { id: 'terminal-escape', name: 'Terminal Escape', titleFa: 'از آزمایشگاه M32 فرار کن!', titleEn: 'Escape the locked M32 lab',
    descFa: 'پنج مرحله معمایی، دستورهای ترمینال، سرنخ‌های مخفی و یک راه خروج. آماده‌ای؟',
    descEn: 'Five puzzle layers, secret clues and one simulated terminal. Can you escape?',
    icon: Terminal, status: 'live', url: '/games/terminal-escape', accent: 'emerald', number: '05' }
];
