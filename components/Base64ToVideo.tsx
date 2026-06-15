import React, { useState, useEffect, useRef } from 'react';
import { MonitorPlay, Play, Pause, Trash2, Info, AlertCircle, Volume2, VolumeX, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 50000000; // 50MB limit for base64 video

export function Base64ToVideo({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('video/mp4');
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const decodeBase64 = (base64: string) => {
    if (!base64.trim()) {
      setVideoUrl(null);
      setError(null);
      return;
    }

    try {
      let cleanBase64 = base64.trim();
      let detectedMime = 'video/mp4'; // Default

      const match = cleanBase64.match(/^data:(video\/[a-z0-9]+);base64,/i);
      if (match) {
        detectedMime = match[1];
        cleanBase64 = cleanBase64.replace(/^data:video\/[a-z0-9]+;base64,/i, '');
      }

      // Validate base64 structure
      if (!/^[a-zA-Z0-9+/]*={0,2}$/.test(cleanBase64)) {
        throw new Error(t('error.invalid_encoding'));
      }

      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: detectedMime });
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(URL.createObjectURL(blob));
      setMimeType(detectedMime);
      setError(null);
    } catch (e) {
      setVideoUrl(null);
      setError(t('error.invalid_decoding'));
    }
  };

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: (MAX_LENGTH / 1024 / 1024).toFixed(0) + 'MB' }));
      setVideoUrl(null);
    } else {
      decodeBase64(input);
    }
  }, [input]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const extension = mimeType.split('/')[1] || 'mp4';
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `decoded-video.${extension}`;
    link.click();
  };

  const handleClear = () => {
    setInput('');
    setVideoUrl(null);
    setError(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="base64-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <MonitorPlay className="w-4 h-4 text-indigo-500" /> Base64 Video String
          </label>
          <div className="flex gap-2 items-center">
            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all px-3 py-1 rounded-full flex items-center gap-1 disabled:opacity-50"
              disabled={!input}
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
        </div>
        <textarea
          id="base64-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="data:video/mp4;base64,..."
          className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xs break-all dark:text-slate-300 resize-none"
        />
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {videoUrl && (
        <div className="p-4 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">Video Decoded</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Ready to preview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <button
                onClick={handleDownload}
                className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                title={t('common.download')}
              >
                <Download className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="relative group rounded-2xl overflow-hidden bg-black aspect-video max-w-2xl mx-auto border border-slate-200 dark:border-slate-800 shadow-2xl">
            <video
              ref={videoRef}
              src={videoUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              className="w-full h-full"
              controls
            />
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('base64video.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('base64video.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
