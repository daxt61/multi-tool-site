import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Copy, Check, Trash2, Download, Info, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SpeechToText() {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState(i18n.language === 'fr' ? 'fr-FR' : 'en-US');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(t('stt.error_not_supported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        setError(t('stt.error_permission'));
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [language, t]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setError(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setTranscript('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Interface */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="stt-transcript" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('stt.input_label')}</label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!transcript}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!transcript}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={handleClear}
                disabled={!transcript}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="stt-transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={t('stt.placeholder')}
            className="w-full h-96 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Controls */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="space-y-4">
            <label htmlFor="stt-lang" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Settings className="w-3 h-3" /> {t('stt.language_label')}
            </label>
            <select
              id="stt-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isListening}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="fr-FR">Français (France)</option>
              <option value="en-US">English (United States)</option>
              <option value="en-GB">English (United Kingdom)</option>
              <option value="es-ES">Español (España)</option>
              <option value="de-DE">Deutsch (Deutschland)</option>
              <option value="it-IT">Italiano (Italia)</option>
            </select>
          </div>

          <div className="flex flex-col gap-6 pt-4">
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${
                isListening
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {isListening ? (
                  <>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    {t('stt.status_listening')}
                  </>
                ) : (
                  t('stt.status_stopped')
                )}
              </div>
            </div>

            <button
              onClick={toggleListening}
              disabled={!!error && error === t('stt.error_not_supported')}
              className={`w-full py-6 rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${
                isListening
                  ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600'
                  : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
              } disabled:opacity-50`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-8 h-8" />
                  {t('stt.stop_btn')}
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8" />
                  {t('stt.start_btn')}
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                <Info className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('stt.guide_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('stt.guide_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
