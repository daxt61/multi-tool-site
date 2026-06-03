import { useState, useRef, useCallback } from 'react';
import { Play, Square, Download, Monitor, Video, Info, AlertCircle, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ScreenRecorder() {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      setVideoUrl(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true
      });

      streamRef.current = stream;

      // Handle stream end (user clicks "Stop sharing" in browser UI)
      stream.getTracks().forEach(track => {
        track.onended = () => {
          if (mediaRecorderRef.current?.state === 'recording') {
            stopRecording();
          }
        };
      });

      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);

        // Stop all tracks
        streamRef.current?.getTracks().forEach(track => track.stop());
        setRecording(false);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err: any) {
      console.error("Error starting recording:", err);
      if (err.name !== 'NotAllowedError') {
        setError(t('recorder.error_start', 'Erreur lors du démarrage de l\'enregistrement. Vérifiez les permissions de votre navigateur.'));
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadVideo = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `recording-${Date.now()}.webm`;
      link.click();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 text-center space-y-6">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all ${recording ? 'bg-rose-500 animate-pulse shadow-lg shadow-rose-500/20' : 'bg-indigo-600 shadow-lg shadow-indigo-600/20'}`}>
              <Video className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black dark:text-white">
                {recording ? t('recorder.recording', 'Enregistrement en cours...') : t('recorder.ready', 'Prêt à enregistrer')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {recording
                  ? t('recorder.recording_hint', 'Cliquez sur le bouton ci-dessous ou sur "Arrêter le partage" pour finir.')
                  : t('recorder.ready_hint', 'Capturez votre écran, une fenêtre ou un onglet.')}
              </p>
            </div>

            {!recording ? (
              <button
                onClick={startRecording}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6 fill-current" /> {t('recorder.start_btn', 'Démarrer la capture')}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-lg hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Square className="w-6 h-6 fill-current" /> {t('recorder.stop_btn', 'Arrêter l\'enregistrement')}
              </button>
            )}
          </div>

          {videoUrl && (
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-900/20 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                <RefreshCcw className="w-5 h-5" />
                <span className="font-bold">{t('recorder.success', 'Enregistrement terminé !')}</span>
              </div>
              <button
                onClick={downloadVideo}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all"
              >
                <Download className="w-5 h-5" /> {t('common.download', 'Télécharger la vidéo')}
              </button>
            </div>
          )}
        </div>

        <div className="relative aspect-video bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
          {videoUrl ? (
            <video src={videoUrl} controls className="w-full h-full object-contain" />
          ) : recording ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-1">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce"></div>
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t('recorder.live', 'Capture en direct')}</p>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-20">
              <Monitor className="w-24 h-24 mx-auto text-white" />
              <p className="text-white font-black uppercase tracking-widest">{t('recorder.preview', 'Aperçu vidéo')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-500" /> {t('recorder.about_title', 'Comment ça marche ?')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('recorder.about_text', 'L\'outil utilise l\'API Screen Capture de votre navigateur pour enregistrer votre écran sans aucun logiciel externe. Vous pouvez choisir de capturer tout l\'écran, une fenêtre spécifique ou un onglet de navigateur.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-500" /> {t('recorder.format_title', 'Format & Qualité')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('recorder.format_text', 'Les vidéos sont encodées au format WebM (VP9/VP8) pour un équilibre optimal entre qualité et poids du fichier. Ce format est lisible par la plupart des navigateurs modernes et lecteurs vidéo.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('common.privacy', 'Confidentialité')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('recorder.privacy_text', 'Tout se passe localement. Le flux vidéo est traité directement dans votre navigateur et n\'est jamais envoyé vers nos serveurs. Votre vie privée est totalement préservée.')}
          </p>
        </div>
      </div>
    </div>
  );
}
