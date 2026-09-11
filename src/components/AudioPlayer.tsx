import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, FileAudio } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface AudioPlayerProps {
  audioUrl: string;
  filename: string;
  fileSizeFormatted?: string;
  mimeType?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  filename,
  fileSizeFormatted,
  mimeType,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Sync state with HTMLAudioElement
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
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

  // Draw simulated or Web Audio waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const barCount = 48;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        // Pseudo-waveform height calculation
        const progress = duration > 0 ? currentTime / duration : 0;
        const currentBarIndex = Math.floor(progress * barCount);
        const isPast = i <= currentBarIndex;

        // Base height with pseudo frequency variance
        const baseH = (Math.sin(i * 0.4) * 0.4 + 0.5) * (height * 0.7);
        const activeMultiplier = isPlaying && isPast ? (Math.sin(Date.now() * 0.01 + i) * 0.2 + 0.9) : 0.8;
        const barH = Math.max(6, baseH * activeMultiplier);

        const x = i * (barWidth + 2);
        const y = (height - barH) / 2;

        ctx.fillStyle = isPast ? '#6366f1' : '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 2);
        ctx.fill();
      }

      if (isPlaying) {
        animId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, currentTime, duration]);

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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
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

  const changeRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* File Header Info */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[200px] sm:max-w-xs">
              {filename}
            </h4>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
              {fileSizeFormatted && <span>{fileSizeFormatted}</span>}
              {mimeType && <span>• {mimeType.replace('audio/', '').toUpperCase()}</span>}
            </div>
          </div>
        </div>

        <button
          onClick={changeRate}
          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors"
        >
          {playbackRate}x Speed
        </button>
      </div>

      {/* Waveform Canvas */}
      <div className="mb-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700/60">
        <canvas ref={canvasRef} width={400} height={40} className="w-full h-10 cursor-pointer" />
      </div>

      {/* Seekbar */}
      <div className="space-y-1 mb-4">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={togglePlay}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md shadow-indigo-600/20"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          <span>{isPlaying ? 'Pause Audio' : 'Play Audio'}</span>
        </button>

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
            className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>
    </div>
  );
};
