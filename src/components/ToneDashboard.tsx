import React, { useState } from 'react';
import { ToneAnalysisResult } from '../types';
import { getToneBadgeStyle } from '../utils/formatters';
import {
  Flame,
  MinusCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Zap,
  Smile,
  Volume2,
  Copy,
  Check,
  ShieldAlert,
  Clock,
  Sparkles,
  Gauge,
  Activity,
  MessageSquare,
  Lightbulb,
  Share2
} from 'lucide-react';

interface ToneDashboardProps {
  analysis: ToneAnalysisResult;
  filename: string;
}

export const ToneDashboard: React.FC<ToneDashboardProps> = ({ analysis, filename }) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);

  const style = getToneBadgeStyle(analysis.primaryToneCategory);

  // Icon switcher for primary tone
  const renderToneIcon = (category: string, className: string = 'w-6 h-6') => {
    switch (category.toLowerCase()) {
      case 'angry':
        return <Flame className={`${className} text-rose-500`} />;
      case 'flat':
        return <MinusCircle className={`${className} text-slate-400`} />;
      case 'frustrated':
        return <AlertTriangle className={`${className} text-amber-500`} />;
      case 'calm':
        return <CheckCircle2 className={`${className} text-emerald-500`} />;
      case 'anxious':
        return <HelpCircle className={`${className} text-purple-500`} />;
      case 'energetic':
        return <Zap className={`${className} text-cyan-500`} />;
      case 'sarcastic':
        return <Smile className={`${className} text-indigo-500`} />;
      default:
        return <Volume2 className={`${className} text-blue-500`} />;
    }
  };

  const handleCopyReport = () => {
    const textReport = `
=== CALL TONE ANALYSIS REPORT ===
File: ${filename}
Overall Detected Tone: ${analysis.overallTone}
Category: ${analysis.primaryToneCategory.toUpperCase()}
Confidence: ${analysis.confidenceScore}%
Sentiment Score: ${analysis.sentimentScore} / 100

SUMMARY:
${analysis.summaryText}

VOICE METRICS:
- Pitch: ${analysis.voiceCharacteristics.pitch} (${analysis.voiceCharacteristics.pitchLevel})
- Pace: ${analysis.voiceCharacteristics.pace} (${analysis.voiceCharacteristics.paceLevel})
- Volume: ${analysis.voiceCharacteristics.volume} (${analysis.voiceCharacteristics.volumeLevel})
- Energy: ${analysis.voiceCharacteristics.speechEnergy} (${analysis.voiceCharacteristics.speechEnergyLevel})

RECOMMENDED AGENT STRATEGY:
${analysis.recommendedResponse.agentStrategy}

SUGGESTED PHRASES:
${analysis.recommendedResponse.suggestedPhrases.map((p) => `- "${p}"`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(textReport);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const copyPhrase = (phrase: string) => {
    navigator.clipboard.writeText(phrase);
    setCopiedPhrase(phrase);
    setTimeout(() => setCopiedPhrase(null), 2000);
  };

  // Calculate sentiment dial rotation angle (-100 to +100 -> -90deg to +90deg)
  const sentimentAngle = Math.max(-90, Math.min(90, (analysis.sentimentScore / 100) * 90));

  return (
    <div className="space-y-6 animate-fade-in">

      {/* TOP OVERALL TONE HEADER CARD */}
      <div className={`relative overflow-hidden bg-white dark:bg-slate-900 border-2 ${style.border} rounded-3xl p-6 sm:p-8 shadow-xl ${style.glow}`}>
        
        {/* Subtle Background Radial Glow */}
        <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full bg-gradient-to-br ${style.gradient} opacity-10 blur-3xl pointer-events-none`} />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${style.bg} ${style.text} border ${style.border}`}>
                {renderToneIcon(analysis.primaryToneCategory, 'w-4 h-4 mr-1.5')}
                {style.label}
              </span>

              {analysis.secondaryToneCategory && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Secondary: {analysis.secondaryToneCategory}
                </span>
              )}

              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3 h-3 mr-1" />
                {analysis.confidenceScore}% AI Confidence
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {analysis.overallTone}
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {analysis.summaryText}
            </p>
          </div>

          {/* SENTIMENT DIAL METER */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center min-w-[200px] w-full md:w-auto">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center space-x-1">
              <Gauge className="w-4 h-4 text-indigo-500" />
              <span>Caller Sentiment Score</span>
            </div>

            {/* Gauge Graphic */}
            <div className="relative w-32 h-16 overflow-hidden flex justify-center items-end my-1">
              {/* Semi circle track */}
              <div className="w-32 h-32 rounded-full border-[10px] border-slate-200 dark:border-slate-700 border-b-0 absolute top-0" />
              {/* Color segments overlay */}
              <div className="w-32 h-32 rounded-full border-[10px] border-transparent border-t-rose-500 border-l-amber-500 border-r-emerald-500 border-b-0 absolute top-0 opacity-40" />
              {/* Needle */}
              <div
                className="w-1 h-14 bg-slate-900 dark:bg-white rounded-full origin-bottom transition-transform duration-1000 shadow-md"
                style={{ transform: `rotate(${sentimentAngle}deg)` }}
              />
              <div className="w-4 h-4 bg-slate-900 dark:bg-white rounded-full absolute -bottom-2 z-10" />
            </div>

            <div className="text-center mt-2">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {analysis.sentimentScore > 0 ? `+${analysis.sentimentScore}` : analysis.sentimentScore}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
                {analysis.sentimentScore <= -40
                  ? 'Highly Negative / Angry'
                  : analysis.sentimentScore <= -10
                  ? 'Slightly Hostile / Frustrated'
                  : analysis.sentimentScore <= 20
                  ? 'Flat / Neutral'
                  : 'Positive / Satisfied'}
              </div>
            </div>
          </div>

        </div>

        {/* Action Header bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-3">
            <span>Language: <strong className="text-slate-700 dark:text-slate-200">{analysis.detectedLanguage}</strong></span>
            <span>•</span>
            <span>Speakers: <strong className="text-slate-700 dark:text-slate-200">{analysis.speakerCountEstimated}</strong></span>
          </div>

          <button
            onClick={handleCopyReport}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Report Copied!' : 'Copy Full Analysis'}</span>
          </button>
        </div>

      </div>

      {/* ACOUSTIC VOICE CHARACTERISTICS GRID */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center space-x-2 mb-6">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Acoustic Voice Characteristics
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Pitch */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Vocal Pitch
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {analysis.voiceCharacteristics.pitch}
            </div>
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              Level: {analysis.voiceCharacteristics.pitchLevel}
            </span>
          </div>

          {/* Pace */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Speaking Tempo / Pace
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {analysis.voiceCharacteristics.pace}
            </div>
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              Pace: {analysis.voiceCharacteristics.paceLevel}
            </span>
          </div>

          {/* Volume */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Volume & Intensity
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {analysis.voiceCharacteristics.volume}
            </div>
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              Vol: {analysis.voiceCharacteristics.volumeLevel}
            </span>
          </div>

          {/* Energy */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Speech Energy & Volatility
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {analysis.voiceCharacteristics.speechEnergy}
            </div>
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              Energy: {analysis.voiceCharacteristics.speechEnergyLevel}
            </span>
          </div>

        </div>
      </div>

      {/* TIMELINE OF EMOTIONAL SHIFTS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Call Timeline & Tone Shifts
            </h3>
          </div>
          <span className="text-xs text-slate-400">Chronological analysis</span>
        </div>

        <div className="space-y-4">
          {analysis.timeline.map((seg, idx) => {
            const segStyle = getToneBadgeStyle(seg.toneCategory);
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-mono text-[11px] font-bold">
                      {seg.timestamp}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {seg.speaker}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${segStyle.bg} ${segStyle.text}`}>
                      {seg.tone}
                    </span>
                  </div>

                  <p className="text-xs italic text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 mt-1">
                    "{seg.transcriptQuote}"
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Acoustic Cue: {seg.pitchPaceNote}
                  </p>
                </div>

                {/* Intensity meter bar */}
                <div className="w-full sm:w-28 text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Intensity {seg.intensityScore}/10
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        seg.intensityScore >= 7
                          ? 'bg-rose-500'
                          : seg.intensityScore >= 4
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${seg.intensityScore * 10}%` }}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* AGENT STRATEGY & DE-ESCALATION PHRASES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recommended Strategy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recommended Call Strategy
            </h3>
          </div>

          {analysis.recommendedResponse.deescalationNeeded && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Urgent: De-escalation Protocol Recommended</span>
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            {analysis.recommendedResponse.agentStrategy}
          </p>

          {analysis.keyTriggers && analysis.keyTriggers.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                Key Trigger Factors:
              </div>
              <ul className="space-y-1">
                {analysis.keyTriggers.map((trig, idx) => (
                  <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <span>{trig}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Suggested Response Phrases */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Suggested Agent Responses
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Click any phrase to copy it for representative scripting:
          </p>

          <div className="space-y-2.5">
            {analysis.recommendedResponse.suggestedPhrases.map((phrase, idx) => {
              const isCopied = copiedPhrase === phrase;
              return (
                <button
                  key={idx}
                  onClick={() => copyPhrase(phrase)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50/50 hover:border-indigo-400 dark:hover:bg-indigo-950/40 transition-all flex items-center justify-between text-xs font-medium text-slate-800 dark:text-slate-200 group"
                >
                  <span className="italic">"{phrase}"</span>
                  {isCopied ? (
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
