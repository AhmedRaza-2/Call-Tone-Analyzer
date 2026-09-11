import React, { useState } from 'react';
import { ToneAnalysisResult, Utterance, FusionMatchType } from '../types';
import { getToneBadgeStyle, formatTime } from '../utils/formatters';
import {
  FileText,
  Search,
  Copy,
  Check,
  Download,
  Flame,
  MinusCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Zap,
  Smile,
  Volume2,
  Clock,
  ArrowRight,
  Filter,
  Sparkles,
  GitCompare,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';

interface TranscriptViewProps {
  analysis: ToneAnalysisResult;
  filename: string;
  onSeekAudio?: (timeInSeconds: number) => void;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  analysis,
  filename,
  onSeekAudio,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('all');
  const [selectedFilterTone, setSelectedFilterTone] = useState<string>('all');
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const utterances = analysis.utterances || [];
  const fusion = analysis.textVsAcousticFusion;

  // Filter utterances based on search and selected filters
  const filteredUtterances = utterances.filter((utt) => {
    const matchesSearch =
      !searchTerm ||
      utt.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utt.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utt.keywords?.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpeaker =
      selectedSpeaker === 'all' || utt.speaker.toLowerCase() === selectedSpeaker.toLowerCase();

    const matchesTone =
      selectedFilterTone === 'all' ||
      utt.acousticTone.toLowerCase() === selectedFilterTone.toLowerCase() ||
      utt.textSentiment.toLowerCase() === selectedFilterTone.toLowerCase() ||
      (selectedFilterTone === 'discrepant' && utt.fusionMatch !== 'congruent' && utt.fusionMatch !== 'neutral_match');

    return matchesSearch && matchesSpeaker && matchesTone;
  });

  const handleCopyTranscript = () => {
    let text = `=== CALL TRANSCRIPT & TONE ANALYSIS ===\nFile: ${filename}\nOverall Tone: ${analysis.overallTone}\n\n`;

    if (utterances.length > 0) {
      utterances.forEach((u) => {
        text += `[${u.timestamp}] ${u.speaker}: ${u.text}\n  -> Words Sentiment: ${u.textSentiment.toUpperCase()} | Voice Tone: ${u.acousticTone.toUpperCase()}\n  -> Fusion: ${u.fusionMatch.toUpperCase()} (${u.fusionAnalysis})\n\n`;
      });
    } else {
      text += analysis.fullTranscript || 'No transcript available.';
    }

    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2500);
  };

  const handleDownloadTranscript = (format: 'txt' | 'json') => {
    let content = '';
    let mime = 'text/plain';
    let extension = 'txt';

    if (format === 'json') {
      content = JSON.stringify(
        {
          filename,
          overallTone: analysis.overallTone,
          fusionDiagnosis: fusion?.fusionDiagnosis,
          utterances: analysis.utterances,
          fullTranscript: analysis.fullTranscript,
        },
        null,
        2
      );
      mime = 'application/json';
      extension = 'json';
    } else {
      content = `CALL TRANSCRIPT: ${filename}\nOverall Tone: ${analysis.overallTone}\n\n${analysis.fullTranscript}\n\nUTTERANCES BREAKDOWN:\n`;
      utterances.forEach((u) => {
        content += `[${u.timestamp}] ${u.speaker}: ${u.text}\nWords: ${u.textSentiment} | Voice: ${u.acousticTone} | Fusion: ${u.fusionMatch}\n\n`;
      });
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\.[^/.]+$/, '')}_transcript.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFusionMatchBadge = (match: FusionMatchType) => {
    switch (match) {
      case 'passive_aggressive':
        return {
          label: 'Passive-Aggressive Discrepancy',
          bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
          desc: 'Words are polite/neutral, but voice pitch & volume convey anger/irritation.',
        };
      case 'suppressed_anger':
        return {
          label: 'Suppressed Rage / Monotone Hostility',
          bg: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
          desc: 'Hostile/threatening words spoken in a quiet flat tone.',
        };
      case 'false_politeness':
        return {
          label: 'Forced / False Politeness',
          bg: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
          desc: 'Forced polite words with high vocal tension.',
        };
      case 'sarcastic_clash':
        return {
          label: 'Sarcastic Vocal Clash',
          bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
          desc: 'Mismatched word meaning and vocal pitch modulation.',
        };
      case 'congruent':
        return {
          label: 'Congruent Match',
          bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
          desc: 'Words and vocal acoustic tone are fully aligned.',
        };
      default:
        return {
          label: 'Aligned Tone',
          bg: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
          desc: 'Standard acoustic and text alignment.',
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* MERGED TEXT SENTIMENT vs ACOUSTIC TONE MATRIX CARD */}
      {fusion && (
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/50">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center">
                  <GitCompare className="w-3.5 h-3.5 mr-1" />
                  Dual Fusion Matrix
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  fusion.discrepancyLevel === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {fusion.discrepancyLevel === 'high' ? 'High Discrepancy Detected' : 'Congruent Alignment'}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white">
                {fusion.fusionDiagnosis}
              </h3>
              <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
                {fusion.fusionExplanation}
              </p>
            </div>

            {/* COMPARISON METRIC BOXES */}
            <div className="grid grid-cols-2 gap-3 min-w-[240px] w-full md:w-auto">
              {/* Text Sentiment */}
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  Literal Text Sentiment
                </div>
                <div className="text-base font-extrabold capitalize text-white mt-1">
                  {fusion.textSentimentCategory}
                </div>
                <div className="text-xs font-mono font-bold text-indigo-300 mt-0.5">
                  Score: {fusion.textSentimentScore > 0 ? `+${fusion.textSentimentScore}` : fusion.textSentimentScore}
                </div>
              </div>

              {/* Acoustic Vocal Tone */}
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  Acoustic Vocal Tone
                </div>
                <div className="text-base font-extrabold capitalize text-white mt-1">
                  {fusion.acousticToneCategory}
                </div>
                <div className="text-xs font-mono font-bold text-indigo-300 mt-0.5">
                  Score: {fusion.acousticToneScore > 0 ? `+${fusion.acousticToneScore}` : fusion.acousticToneScore}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VERBATIM TRANSCRIPT & UTTERANCES SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
        
        {/* Controls Bar: Search, Filter & Export */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Call Transcript & Utterances ({filteredUtterances.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter by Tone */}
            <select
              value={selectedFilterTone}
              onChange={(e) => setSelectedFilterTone(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Tones</option>
              <option value="angry">Angry Only</option>
              <option value="flat">Flat Monotone Only</option>
              <option value="frustrated">Frustrated Only</option>
              <option value="calm">Calm Only</option>
              <option value="discrepant">Mismatched / Discrepant Only</option>
            </select>

            {/* Copy Button */}
            <button
              onClick={handleCopyTranscript}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTranscript ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Download Dropdown */}
            <button
              onClick={() => handleDownloadTranscript('txt')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export TXT</span>
            </button>
          </div>

        </div>

        {/* UTTERANCE CARDS LIST */}
        {filteredUtterances.length > 0 ? (
          <div className="space-y-4">
            {filteredUtterances.map((utt, index) => {
              const textStyle = getToneBadgeStyle(utt.textSentiment);
              const voiceStyle = getToneBadgeStyle(utt.acousticTone);
              const fusionBadge = getFusionMatchBadge(utt.fusionMatch);

              return (
                <div
                  key={utt.id || index}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all space-y-3"
                >
                  
                  {/* Top Header: Timestamp, Speaker, Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSeekAudio && onSeekAudio(utt.startTime)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg font-mono text-xs font-bold flex items-center space-x-1 transition-colors"
                        title="Click to jump audio to this moment"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{utt.timestamp}</span>
                      </button>

                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {utt.speaker}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Text Sentiment badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${textStyle.bg} ${textStyle.text}`}>
                        Words: {utt.textSentiment}
                      </span>

                      {/* Vocal Acoustic Tone badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${voiceStyle.bg} ${voiceStyle.text}`}>
                        Voice: {utt.acousticTone}
                      </span>

                      {/* Fusion match badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${fusionBadge.bg}`}>
                        {fusionBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Spoken Text Quote */}
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    "{utt.text}"
                  </div>

                  {/* Discrepancy / Fusion Explanation */}
                  <div className="flex items-start space-x-2 text-xs text-slate-500 dark:text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Dual Analysis:</strong> {utt.fusionAnalysis}</span>
                  </div>

                  {/* Keywords tags */}
                  {utt.keywords && utt.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Triggers:</span>
                      {utt.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm">No utterances match your search filter.</p>
          </div>
        )}

      </div>

    </div>
  );
};
