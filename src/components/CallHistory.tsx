import React from 'react';
import { CallRecord } from '../types';
import { getToneBadgeStyle } from '../utils/formatters';
import { History, Trash2, ArrowRight, Play, FileAudio } from 'lucide-react';

interface CallHistoryProps {
  history: CallRecord[];
  activeRecordId: string | null;
  onSelectRecord: (record: CallRecord) => void;
  onClearHistory: () => void;
}

export const CallHistory: React.FC<CallHistoryProps> = ({
  history,
  activeRecordId,
  onSelectRecord,
  onClearHistory,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Analyzed Calls History ({history.length})
          </h3>
        </div>

        <button
          onClick={onClearHistory}
          className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center space-x-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((rec) => {
          const isSelected = rec.id === activeRecordId;
          const style = getToneBadgeStyle(rec.analysis.primaryToneCategory);

          return (
            <div
              key={rec.id}
              onClick={() => onSelectRecord(rec)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {rec.uploadedAt}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <FileAudio className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                    {rec.filename}
                  </h4>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">
                  {rec.analysis.summaryText}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[10px]">
                  Score: {rec.analysis.sentimentScore > 0 ? `+${rec.analysis.sentimentScore}` : rec.analysis.sentimentScore}
                </span>

                <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center space-x-1 group">
                  <span>View Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
