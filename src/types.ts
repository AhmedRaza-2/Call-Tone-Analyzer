export type ToneCategory = 'angry' | 'flat' | 'frustrated' | 'calm' | 'anxious' | 'energetic' | 'sarcastic' | 'neutral';

export type FusionMatchType = 'congruent' | 'passive_aggressive' | 'suppressed_anger' | 'false_politeness' | 'sarcastic_clash' | 'neutral_match';

export interface Utterance {
  id: string;
  startTime: number; // in seconds, e.g. 0
  endTime: number; // in seconds, e.g. 12
  timestamp: string; // e.g. "00:00 - 00:12"
  speaker: string; // e.g. "Caller" or "Agent"
  text: string;
  textSentiment: ToneCategory;
  textSentimentScore: number; // -100 to +100
  acousticTone: ToneCategory;
  fusionMatch: FusionMatchType;
  fusionAnalysis: string; // e.g. "Words are polite ('thank you') but pitch spikes & volume indicate sharp anger."
  keywords: string[];
}

export interface TextVsAcousticFusion {
  textSentimentCategory: ToneCategory;
  textSentimentScore: number; // -100 to +100
  acousticToneCategory: ToneCategory;
  acousticToneScore: number; // -100 to +100
  fusionDiagnosis: string; // e.g., "High Hostile Congruence", "Passive-Aggressive Discrepancy", "Robotic Monotone Alignment"
  fusionExplanation: string;
  discrepancyLevel: 'none' | 'moderate' | 'high'; // Indicates how much text sentiment differs from acoustic tone
}

export interface TimelineSegment {
  timestamp: string; // e.g., "00:00 - 00:15"
  speaker: string; // e.g., "Caller" or "Agent"
  tone: string; // e.g., "Angry & Agitated", "Flat / Monotone"
  toneCategory: ToneCategory;
  intensityScore: number; // 1 to 10 scale
  pitchPaceNote: string; // e.g., "Elevated pitch, fast tempo, sharp volume spikes"
  transcriptQuote: string;
}

export interface VoiceCharacteristics {
  pitch: string; // e.g., "Elevated & Variable" or "Monotone Low Frequency"
  pitchLevel: 'low' | 'normal' | 'high' | 'variable';
  pace: string; // e.g., "Rapid / Rushed" or "Slow & Drawn Out"
  paceLevel: 'slow' | 'moderate' | 'fast' | 'erratic';
  volume: string; // e.g., "Loud / Elevated" or "Soft / Muffled"
  volumeLevel: 'soft' | 'normal' | 'loud' | 'shouting';
  speechEnergy: string; // e.g., "High Volatility & Aggressiveness" or "Low Energy / Flatline"
  speechEnergyLevel: 'flat' | 'steady' | 'dynamic' | 'volatile';
}

export interface ToneAnalysisResult {
  overallTone: string; // e.g., "Angry & Demanding"
  primaryToneCategory: ToneCategory;
  secondaryToneCategory?: ToneCategory;
  confidenceScore: number; // 0 - 100
  sentimentScore: number; // -100 (Extremely Hostile) to +100 (Extremely Delighted)
  summaryText: string;
  fullTranscript: string;
  utterances: Utterance[];
  textVsAcousticFusion: TextVsAcousticFusion;
  voiceCharacteristics: VoiceCharacteristics;
  timeline: TimelineSegment[];
  keyTriggers: string[];
  recommendedResponse: {
    agentStrategy: string;
    suggestedPhrases: string[];
    deescalationNeeded: boolean;
  };
  detectedLanguage: string;
  speakerCountEstimated: number;
}

export interface CallRecord {
  id: string;
  filename: string;
  fileSizeFormatted: string;
  durationSeconds?: number;
  uploadedAt: string;
  audioUrl: string;
  audioBase64?: string;
  mimeType: string;
  analysis: ToneAnalysisResult;
}

export interface SampleCallPreset {
  id: string;
  title: string;
  description: string;
  expectedTone: string;
  category: ToneCategory;
  sampleText: string;
  audioUrl?: string;
}
