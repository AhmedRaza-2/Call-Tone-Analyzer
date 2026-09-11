import { ToneCategory } from '../types';

export interface ToneBadgeStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  glow: string;
  iconName: string;
  gradient: string;
  description: string;
}

export function getToneBadgeStyle(category: ToneCategory | string): ToneBadgeStyle {
  const cat = (category || 'neutral').toLowerCase() as ToneCategory;

  switch (cat) {
    case 'angry':
      return {
        label: 'Angry / Hostile',
        bg: 'bg-rose-500/10',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500/30',
        glow: 'shadow-rose-500/20',
        iconName: 'Flame',
        gradient: 'from-rose-500 to-red-600',
        description: 'Elevated pitch, loud volume spikes, sharp vocal strain & aggressive cadence.',
      };
    case 'flat':
      return {
        label: 'Flat / Monotone',
        bg: 'bg-slate-500/10',
        text: 'text-slate-600 dark:text-slate-300',
        border: 'border-slate-500/30',
        glow: 'shadow-slate-500/20',
        iconName: 'MinusCircle',
        gradient: 'from-slate-500 to-gray-600',
        description: 'Low emotional expression, unvarying pitch, robotic cadence & muted inflection.',
      };
    case 'frustrated':
      return {
        label: 'Frustrated / Impatient',
        bg: 'bg-amber-500/10',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
        glow: 'shadow-amber-500/20',
        iconName: 'AlertTriangle',
        gradient: 'from-amber-500 to-orange-600',
        description: 'Audible sighs, forced pauses, tense voice quality & repeated interruptions.',
      };
    case 'calm':
      return {
        label: 'Calm & Professional',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/20',
        iconName: 'CheckCircle2',
        gradient: 'from-emerald-500 to-teal-600',
        description: 'Smooth pitch contour, balanced cadence, open volume & polite delivery.',
      };
    case 'anxious':
      return {
        label: 'Anxious / Hesitant',
        bg: 'bg-purple-500/10',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500/30',
        glow: 'shadow-purple-500/20',
        iconName: 'HelpCircle',
        gradient: 'from-purple-500 to-indigo-600',
        description: 'Trembling pitch, frequent filler pauses, fast breathiness & trailing volume.',
      };
    case 'energetic':
      return {
        label: 'Energetic / Enthusiastic',
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-500/30',
        glow: 'shadow-cyan-500/20',
        iconName: 'Zap',
        gradient: 'from-cyan-500 to-blue-600',
        description: 'High dynamic range, bright pitch, fast upbeat delivery & expressiveness.',
      };
    case 'sarcastic':
      return {
        label: 'Sarcastic / Defensive',
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-500/30',
        glow: 'shadow-indigo-500/20',
        iconName: 'Smile',
        gradient: 'from-indigo-500 to-violet-600',
        description: 'Exaggerated pitch drops, elongated vowel emphasis & mock-polite cadence.',
      };
    case 'neutral':
    default:
      return {
        label: 'Neutral / Informational',
        bg: 'bg-blue-500/10',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500/30',
        glow: 'shadow-blue-500/20',
        iconName: 'Volume2',
        gradient: 'from-blue-500 to-indigo-600',
        description: 'Standard conversational pitch, moderate pace & even vocal dynamics.',
      };
  }
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
