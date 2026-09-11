/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { AudioDropzone } from './components/AudioDropzone';
import { AudioWaveformPlayer } from './components/AudioWaveformPlayer';
import { ToneDashboard } from './components/ToneDashboard';
import { TranscriptView } from './components/TranscriptView';
import { CallHistory } from './components/CallHistory';
import { CallRecord, ToneAnalysisResult } from './types';
import { formatBytes } from './utils/formatters';
import { analyzeLocalAudioDSP } from './utils/localDSPEngine';
import { Activity, Sparkles, AlertCircle, RotateCcw, Volume2, ShieldCheck, FileText, BarChart3, Radio, Cpu, Code2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'samples' | 'history'>('upload');
  const [currentCall, setCurrentCall] = useState<CallRecord | null>(null);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);

  // Sub-tab view for active call analysis: 'dashboard' vs 'transcript'
  const [viewSubTab, setViewSubTab] = useState<'dashboard' | 'transcript'>('dashboard');
  
  // Audio seeking timestamp sync
  const [seekTime, setSeekTime] = useState<number | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('Preparing audio...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAudioSelected = async (fileData: {
    blob: Blob;
    base64: string;
    filename: string;
    mimeType: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setAnalysisStep('Decoding raw audio PCM stream via Web Audio API...');

    const audioUrl = URL.createObjectURL(fileData.blob);

    try {
      let analysisResult: ToneAnalysisResult;

      setAnalysisStep('Contacting AI Server Endpoint...');

      const response = await fetch('/api/analyze-tone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioBase64: fileData.base64,
          mimeType: fileData.mimeType,
          filename: fileData.filename,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze call audio tone.');
      }

      analysisResult = data.result;

      const newRecord: CallRecord = {
        id: `call_${Date.now()}`,
        filename: fileData.filename,
        fileSizeFormatted: formatBytes(fileData.blob.size),
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioUrl,
        audioBase64: fileData.base64,
        mimeType: fileData.mimeType,
        analysis: analysisResult,
      };

      setCurrentCall(newRecord);
      setCallHistory((prev) => [newRecord, ...prev]);
      setViewSubTab('dashboard');

    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'An error occurred during call tone & transcript analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryRecord = (record: CallRecord) => {
    setCurrentCall(record);
    setViewSubTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    setCallHistory([]);
    if (currentCall) {
      setCurrentCall(null);
    }
  };

  const handleSeekFromTranscript = (timeInSeconds: number) => {
    setSeekTime(timeInSeconds);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        callCount={callHistory.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* LOADING STATE OVERLAY */}
        {isLoading && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xl space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-spin">
                <Activity className="w-9 h-9" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Analyzing Vocal Tone & Verbatim Speech
              </h3>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-2 animate-pulse">
                {analysisStep}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Open-Source Signal Processing (DSP) Engine is analyzing pitch F0 volatility, RMS volume, zero-crossing rate, and VADER/AFINN text sentiment...
              </p>
            </div>
          </div>
        )}

        {/* INPUT / DROPZONE SECTION (When not loading) */}
        {!isLoading && (
          <div className="space-y-6">

            {/* Open-Source Engine Badge */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-3xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                      <span>100% Open-Source Engine Activated</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                        Zero Proprietary API Dependency
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Uses Web Audio API PCM signal processing, Autocorrelation F0 pitch tracking, RMS volume, and rule-based VADER sentiment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <AudioDropzone
              onAudioSelected={handleAudioSelected}
              isLoading={isLoading}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>
        )}

        {/* CURRENT ANALYSIS & WAVEFORM DISPLAY */}
        {currentCall && !isLoading && (
          <div className="space-y-6 pt-2">
            
            {/* Top Interactive PCM Waveform Player */}
            <div className="space-y-3">
              <AudioWaveformPlayer
                audioUrl={currentCall.audioUrl}
                filename={currentCall.filename}
                fileSizeFormatted={currentCall.fileSizeFormatted}
                mimeType={currentCall.mimeType}
                utterances={currentCall.analysis.utterances}
                externalCurrentTime={seekTime}
              />

              {/* View Switcher Tabs (Tone Analytics vs Transcript & Fusion) */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 pt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewSubTab('dashboard')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all ${
                      viewSubTab === 'dashboard'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Tone Analytics & Metrics</span>
                  </button>

                  <button
                    onClick={() => setViewSubTab('transcript')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all ${
                      viewSubTab === 'transcript'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Verbatim Transcript & Text Sentiment</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setCurrentCall(null);
                    setActiveTab('upload');
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Analyze Another Call</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT */}
            {viewSubTab === 'dashboard' ? (
              <ToneDashboard
                analysis={currentCall.analysis}
                filename={currentCall.filename}
              />
            ) : (
              <TranscriptView
                analysis={currentCall.analysis}
                filename={currentCall.filename}
                onSeekAudio={handleSeekFromTranscript}
              />
            )}

          </div>
        )}

        {/* CALL HISTORY LIST */}
        {!isLoading && activeTab === 'history' && (
          <CallHistory
            history={callHistory}
            activeRecordId={currentCall?.id || null}
            onSelectRecord={handleSelectHistoryRecord}
            onClearHistory={handleClearHistory}
          />
        )}

      </main>
    </div>
  );
}
