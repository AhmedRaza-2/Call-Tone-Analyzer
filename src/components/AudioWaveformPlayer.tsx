import React, { useRef, useState, useEffect } from 'react';
import { Utterance } from '../types';
import { formatTime } from '../utils/formatters';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FileAudio,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Layers,
  Flame,
  MinusCircle,
  AlertTriangle,
  CheckCircle2,
  Smile
} from 'lucide-react';

interface AudioWaveformPlayerProps {
  audioUrl: string;
  filename: string;
  fileSizeFormatted?: string;
  mimeType?: string;
  utterances?: Utterance[];
  onSeekToTime?: (timeInSeconds: number) => void;
  externalCurrentTime?: number;
}

export const AudioWaveformPlayer: React.FC<AudioWaveformPlayerProps> = ({
  audioUrl,
  filename,
  fileSizeFormatted,
  mimeType,
  utterances = [],
  onSeekToTime,
  externalCurrentTime,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x, 2x, 3x

  // Decoded audio waveform peaks state
  const [audioPeaks, setAudioPeaks] = useState<number[]>([]);
  const [isDecodingAudio, setIsDecodingAudio] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  // Sync external seek requests (e.g. user clicks on transcript timestamp)
  useEffect(() => {
    if (externalCurrentTime !== undefined && audioRef.current) {
      audioRef.current.currentTime = externalCurrentTime;
      setCurrentTime(externalCurrentTime);
    }
  }, [externalCurrentTime]);

  // Decode real AudioBuffer using Web Audio API to render true waveform amplitudes
  useEffect(() => {
    if (!audioUrl) return;

    let isMounted = true;
    setIsDecodingAudio(true);

    const decodePeaks = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        if (!isMounted) return;

        const rawData = audioBuffer.getChannelData(0); // Channel 0
        const samples = 200 * zoomLevel; // Resolution of bars
        const blockSize = Math.floor(rawData.length / samples);
        const peaks: number[] = [];

        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j]);
          }
          peaks.push(sum / blockSize);
        }

        // Normalize peaks from 0 to 1
        const maxPeak = Math.max(...peaks, 0.001);
        const normalizedPeaks = peaks.map((p) => p / maxPeak);

        if (isMounted) {
          setAudioPeaks(normalizedPeaks);
          setIsDecodingAudio(false);
        }
        audioCtx.close();
      } catch (err) {
        console.warn('Audio decoding fallback to synthetic waveform:', err);
        // Fallback: Generate clean synthetic peaks
        const fallbackPeaks: number[] = [];
        const count = 180 * zoomLevel;
        for (let i = 0; i < count; i++) {
          fallbackPeaks.push(Math.sin(i * 0.2) * 0.4 + Math.random() * 0.5 + 0.1);
        }
        if (isMounted) {
          setAudioPeaks(fallbackPeaks);
          setIsDecodingAudio(false);
        }
      }
    };

    decodePeaks();

    return () => {
      isMounted = false;
    };
  }, [audioUrl, zoomLevel]);

  // Handle HTML Audio Element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      if (onSeekToTime) onSeekToTime(audio.currentTime);
    };

    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Render Canvas Waveform with playhead scrubber & utterance overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const peaks = audioPeaks.length > 0 ? audioPeaks : Array(120).fill(0.3);
    const barCount = peaks.length;
    const barWidth = Math.max(2, width / barCount - 1);

    const progressRatio = duration > 0 ? currentTime / duration : 0;
    const activeBarIndex = Math.floor(progressRatio * barCount);

    // Draw Utterance Background Segments on Waveform Canvas
    if (utterances && utterances.length > 0 && duration > 0) {
      utterances.forEach((utt) => {
        const startRatio = utt.startTime / duration;
        const endRatio = utt.endTime / duration;
        const startX = startRatio * width;
        const segmentW = Math.max(4, (endRatio - startRatio) * width);

        // Fill color based on text/acoustic tone
        let fillStyle = 'rgba(99, 102, 241, 0.08)'; // default indigo
        if (utt.acousticTone === 'angry' || utt.textSentiment === 'angry') {
          fillStyle = 'rgba(244, 63, 94, 0.15)'; // rose
        } else if (utt.acousticTone === 'frustrated') {
          fillStyle = 'rgba(245, 158, 11, 0.15)'; // amber
        } else if (utt.acousticTone === 'flat') {
          fillStyle = 'rgba(100, 116, 139, 0.15)'; // slate
        } else if (utt.acousticTone === 'calm') {
          fillStyle = 'rgba(16, 185, 129, 0.12)'; // emerald
        }

        ctx.fillStyle = fillStyle;
        ctx.fillRect(startX, 0, segmentW, height);
      });
    }

    // Draw Amplitude Bars
    for (let i = 0; i < barCount; i++) {
      const peak = peaks[i];
      const barH = Math.max(4, peak * (height * 0.78));

      const x = i * (barWidth + 1);
      const y = (height - barH) / 2;
      const isPast = i <= activeBarIndex;

      if (isPast) {
        // Active played gradient
        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(1, '#a855f7');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#94a3b8'; // Slate 400
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 2);
      ctx.fill();
    }

    // Draw Playhead Line
    const playheadX = progressRatio * width;
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    // Draw Playhead Knob
    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.arc(playheadX, height / 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Hover Cursor Line if hovering over waveform canvas
    if (hoverTime !== null && duration > 0) {
      const hoverX = (hoverTime / duration) * width;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }

  }, [audioPeaks, currentTime, duration, utterances, hoverTime]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const skipSeconds = (secs: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + secs));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * duration;

    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
    if (onSeekToTime) {
      onSeekToTime(targetTime);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    setHoverTime(ratio * duration);
  };

  const handleCanvasMouseLeave = () => {
    setHoverTime(null);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const cycleZoom = () => {
    setZoomLevel((prev) => (prev >= 3 ? 1 : prev + 1));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Audio Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-sm">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[200px] sm:max-w-xs">
              {filename}
            </h4>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
              {fileSizeFormatted && <span>{fileSizeFormatted}</span>}
              {mimeType && <span>• {mimeType.replace('audio/', '').toUpperCase()}</span>}
              {duration > 0 && <span>• {formatTime(duration)}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={cycleZoom}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors flex items-center space-x-1"
            title="Zoom Waveform Amplitudes"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>{zoomLevel}x Zoom</span>
          </button>

          <button
            onClick={cyclePlaybackRate}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors"
          >
            {playbackRate}x Speed
          </button>
        </div>
      </div>

      {/* WAVEFORM CANVAS CONTAINER */}
      <div className="relative mb-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/80">
        
        {isDecodingAudio && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
            <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Decoding PCM Waveform...</span>
            </div>
          </div>
        )}

        {/* Hover Time Tooltip */}
        {hoverTime !== null && (
          <div className="absolute top-1 left-4 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow pointer-events-none z-20">
            Seek to {formatTime(hoverTime)}
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={600}
          height={64}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          className="w-full h-16 cursor-pointer rounded-lg"
        />

        {/* Time Progress Overlay Bar */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 dark:text-slate-500 font-semibold px-1 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span className="text-[9px] uppercase tracking-wider text-indigo-500">
            Click Waveform to Seek
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="flex items-center justify-between gap-4">
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => skipSeconds(-5)}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition-colors"
            title="Rewind 5s"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md shadow-indigo-600/20"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            <span>{isPlaying ? 'Pause' : 'Play Audio'}</span>
          </button>

          <button
            onClick={() => skipSeconds(5)}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition-colors"
            title="Forward 5s"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Scrub */}
        <div className="flex items-center space-x-2">
          <button onClick={toggleMute} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

      </div>
    </div>
  );
};
