import { useState, useRef, useCallback, useEffect } from 'react';
import { Monitor, Play, Square, Download, Trash2, AlertCircle, Info, Check, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ScreenRecorder() {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedBlob(blob);
        setIsRecording(false);
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRecordedBlob(null);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Handle stream stopping via browser UI (e.g., "Stop sharing" button)
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

    } catch (err: any) {
      console.error('Error starting screen capture:', err);
      if (err.name !== 'NotAllowedError') {
        setError(t('screenrecorder.error_start', 'Failed to start screen recording. Please ensure your browser supports screen capture.'));
      }
    }
  }, [t]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const link = document.body.appendChild(document.createElement('a'));
    link.href = url;
    link.download = `recording-${Date.now()}.webm`;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [recordedBlob]);

  const handleClear = useCallback(() => {
    setRecordedBlob(null);
    setRecordingTime(0);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#4f46e5_0%,transparent_70%)]" />
        </div>

        {isRecording ? (
          <div className="relative z-10 flex flex-col items-center space-y-8 animate-in fade-in duration-500">
            <div className="relative">
               <div className="w-24 h-24 rounded-full bg-rose-500/20 flex items-center justify-center animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-rose-500" />
               </div>
               <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-bounce">
                 REC
               </div>
            </div>
            <div className="text-6xl font-mono font-black text-white tracking-tighter">
              {formatTime(recordingTime)}
            </div>
            <button
              onClick={stopRecording}
              className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-xl hover:bg-rose-50 transition-all active:scale-95 flex items-center gap-3 shadow-xl"
            >
              <Square className="w-6 h-6 fill-current" /> {t('common.stop')}
            </button>
          </div>
        ) : recordedBlob ? (
          <div className="relative z-10 flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Check className="w-12 h-12 stroke-[3]" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-white mb-2">{t('screenrecorder.ready', 'Recording Ready!')}</h3>
              <p className="text-slate-400 font-medium">{t('screenrecorder.ready_desc', 'Your recording has been captured and is ready for download.')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button
                onClick={handleDownload}
                className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-5 h-5" /> {t('common.download')}
              </button>
              <button
                onClick={handleClear}
                className="flex-1 px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-lg hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/10"
              >
                <Trash2 className="w-5 h-5" /> {t('common.remove')}
              </button>
            </div>
            <div className="w-full max-w-2xl bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl mt-4">
               <video
                 src={URL.createObjectURL(recordedBlob)}
                 controls
                 className="w-full aspect-video"
               />
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center text-center space-y-8">
            <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center text-white/20 border border-white/10">
              <Video className="w-12 h-12" />
            </div>
            <div className="max-w-md">
              <h3 className="text-2xl font-black text-white mb-3">{t('screenrecorder.start_title', 'Screen Recorder')}</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                {t('screenrecorder.start_desc', 'Record your entire screen, a specific window, or a browser tab. Everything happens locally in your browser.')}
              </p>
            </div>
            <button
              onClick={startRecording}
              className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-3 shadow-2xl shadow-indigo-600/20 group"
            >
              <div className="w-4 h-4 rounded-full bg-white group-hover:scale-125 transition-transform" />
              {t('screenrecorder.start_btn', 'Start Recording')}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('unit.guide_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('screenrecorder.guide_text', 'Click the "Start Recording" button and choose what you want to capture. You can include system audio if supported by your browser.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-500" /> {t('common.quality')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('screenrecorder.quality_text', 'Recordings are saved in WebM format using the VP9 codec for high quality with minimal file size.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc', 'Your recording never leaves your computer. The video processing is done entirely locally in your browser.')}
          </p>
        </div>
      </div>
    </div>
  );
}
