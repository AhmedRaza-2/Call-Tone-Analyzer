import React, { useState, useRef, useEffect } from 'react';
import { Upload, Mic, Play, Square, FileAudio, Clipboard, Sparkles, Flame, MinusCircle, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { SAMPLE_SCENARIOS, SampleScenario, synthesizeScenarioAudio, blobToBase64 } from '../utils/audioSynthesizer';
import { formatTime } from '../utils/formatters';

interface AudioDropzoneProps {
  onAudioSelected: (fileData: { blob: Blob; base64: string; filename: string; mimeType: string }) => void;
  isLoading: boolean;
  activeTab: 'upload' | 'record' | 'samples' | 'history';
  setActiveTab: (tab: 'upload' | 'record' | 'samples' | 'history') => void;
}

export const AudioDropzone: React.FC<AudioDropzoneProps> = ({
  onAudioSelected,
  isLoading,
  activeTab,
  setActiveTab,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  // Microphone recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Preset loading state
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen to global clipboard paste events
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (isLoading) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('audio/')) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
            setPasteNotice(`Pasted audio file "${file.name}"`);
            setTimeout(() => setPasteNotice(null), 3000);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isLoading]);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|webm|flac|aac|wma)$/i)) {
      alert('Please upload a valid audio file (MP3, WAV, M4A, OGG, WEBM, FLAC).');
      return;
    }

    try {
      const base64 = await blobToBase64(file);
      onAudioSelected({
        blob: file,
        base64,
        filename: file.name,
        mimeType: file.type || 'audio/mp3',
      });
    } catch (err) {
      console.error('Failed to read file:', err);
      alert('Error reading audio file.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Start Mic Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(audioBlob);
        onAudioSelected({
          blob: audioBlob,
          base64,
          filename: `Mic_Recording_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`,
          mimeType: 'audio/webm',
        });
        setIsRecording(false);
        setRecordingSeconds(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Microphone access denied or unavailable. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stop();
    }
  };

  // Load a preset sample scenario
  const handleSelectPreset = async (scenario: SampleScenario) => {
    setLoadingPresetId(scenario.id);
    try {
      const { blob, base64, mimeType } = await synthesizeScenarioAudio(scenario);
      onAudioSelected({
        blob,
        base64,
        filename: `${scenario.id}_call.wav`,
        mimeType,
      });
    } catch (err) {
      console.error('Preset error:', err);
      alert('Failed to synthesize sample audio.');
    } finally {
      setLoadingPresetId(null);
    }
  };

  return (
    <div className="w-full">
      {pasteNotice && (
        <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-600 dark:text-indigo-400 text-xs font-medium flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <Clipboard className="w-4 h-4" />
            <span>{pasteNotice}</span>
          </div>
        </div>
      )}

      {/* TABS CONTENT */}
      {activeTab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.flac,.aac"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Drag & Drop Call Audio File Here
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Supports MP3, WAV, M4A, OGG, WEBM, FLAC. Or click to browse files.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20">
                Choose Audio File
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center">
                <Clipboard className="w-3.5 h-3.5 mr-1" />
                Or Paste (Ctrl+V)
              </span>
            </div>

            {/* Direct Quick Presets Bar inside dropzone */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Or try an instant sample call:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_SCENARIOS.map((scenario) => {
                  const isThisLoading = loadingPresetId === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => handleSelectPreset(scenario)}
                      disabled={isLoading || isThisLoading}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 text-left transition-all hover:shadow-sm group"
                    >
                      <div className="flex items-center space-x-2">
                        {scenario.toneCategory === 'angry' && <Flame className="w-4 h-4 text-rose-500" />}
                        {scenario.toneCategory === 'flat' && <MinusCircle className="w-4 h-4 text-slate-400" />}
                        {scenario.toneCategory === 'frustrated' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        {scenario.toneCategory === 'calm' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {scenario.expectedTone}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {scenario.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SAMPLE CALLS TAB */}
      {activeTab === 'samples' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Instant Sample Call Scenarios
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Click any call scenario below to synthesize speech audio and run real-time vocal tone analysis immediately.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_SCENARIOS.map((scenario) => {
              const isThisLoading = loadingPresetId === scenario.id;
              return (
                <div
                  key={scenario.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          scenario.toneCategory === 'angry'
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                            : scenario.toneCategory === 'flat'
                            ? 'bg-slate-500/10 text-slate-600 border border-slate-500/30 dark:text-slate-300'
                            : scenario.toneCategory === 'frustrated'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                        }`}
                      >
                        {scenario.expectedTone} Tone
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">Sample Call</span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {scenario.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
                      {scenario.description}
                    </p>

                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs italic text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                      "{scenario.transcriptText}"
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPreset(scenario)}
                    disabled={isLoading || isThisLoading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-600/20"
                  >
                    {isThisLoading ? (
                      <span>Synthesizing & Analyzing...</span>
                    ) : (
                      <>
                        <span>Analyze This {scenario.expectedTone} Call</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECORD MIC TAB */}
      {activeTab === 'record' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30 animate-pulse scale-110'
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
              }`}
            >
              <Mic className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isRecording ? 'Recording Voice...' : 'Record Your Voice / Call'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Speak into your microphone in any tone (angry, flat, enthusiastic, frustrated) to analyze yourself!
              </p>
            </div>

            {isRecording && (
              <div className="text-3xl font-mono font-bold text-rose-500 dark:text-rose-400">
                {formatTime(recordingSeconds)}
              </div>
            )}

            <div className="flex items-center justify-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={isLoading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/25"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-semibold text-sm flex items-center space-x-2 transition-all shadow-lg shadow-rose-600/25 animate-bounce"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop & Analyze Tone</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
