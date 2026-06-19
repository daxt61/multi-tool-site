import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  AlignLeft, Copy, Check, Trash2, SortAsc, SortDesc,
  RefreshCcw, Download, Info, AlertCircle, Sparkles, Shuffle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

const MAX_LENGTH = 100000;

export function SentenceManipulator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState<string>(initialData?.text || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ text });
  }, [text, onStateChange]);

  const sentences = useMemo(() => {
    if (!text || text.length > MAX_LENGTH) return [];
    // Split by punctuation followed by space or end of string
    return text.split(/(?<=[.!?])(?:\s+|$)/).filter(s => s.trim().length > 0);
  }, [text]);

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  const processSentences = (fn: (s: string[]) => string[]) => {
    if (text.length > MAX_LENGTH) return;
    const processed = fn(sentences);
    setText(processed.join(' '));
  };

  const reverseSentences = () => processSentences((s: string[]) => [...s].reverse());
  const removeDuplicates = () => processSentences((s: string[]) => {
    const seen = new Set();
    return s.filter(item => {
      const normalized = item.trim().toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  });

  const sortAZ = () => processSentences((s: string[]) => [...s].sort((a, b) => a.trim().localeCompare(b.trim())));
  const sortZA = () => processSentences((s: string[]) => [...s].sort((a, b) => b.trim().localeCompare(a.trim())));
  const sortLength = () => processSentences((s: string[]) => [...s].sort((a, b) => a.trim().length - b.trim().length));

  const shuffleSentences = () => {
    processSentences((s: string[]) => {
      const shuffled = [...s];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = getSecureRandomInt(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  };

  const handleCopy = useCallback(() => {
    if (!text || text.length > MAX_LENGTH) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const handleDownload = useCallback(() => {
    if (!text || text.length > MAX_LENGTH) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentences-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [text]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div role="alert" className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="sentence-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-indigo-500" /> {t('common.input')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!text || text.length > MAX_LENGTH}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!text}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={() => setText('')}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sentence-input"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={t('sentencemanip.placeholder', 'Paste your text here to manipulate sentences...')}
            className={`w-full h-96 p-8 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none`}
          />
          <div className="flex justify-end text-xs font-black text-slate-400 uppercase tracking-widest px-4">
            {t('wordcounter.stat.sentences')}: {sentences.length}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 space-y-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 opacity-50" />
              <h3 className="text-xl font-black">{t('common.options')}</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { label: t('sentencemanip.reverse', 'Reverse Order'), icon: RefreshCcw, action: reverseSentences },
                { label: t('sentencemanip.shuffle', 'Shuffle Sentences'), icon: Shuffle, action: shuffleSentences },
                { label: t('sentencemanip.remove_duplicates', 'Remove Duplicates'), icon: Trash2, action: removeDuplicates },
                { label: t('sentencemanip.sort_az', 'Sort A-Z'), icon: SortAsc, action: sortAZ },
                { label: t('sentencemanip.sort_za', 'Sort Z-A'), icon: SortDesc, action: sortZA },
                { label: t('sentencemanip.sort_length', 'Sort by Length'), icon: SortAsc, action: sortLength },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  disabled={sentences.length === 0}
                  className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-bold text-sm">{btn.label}</span>
                  <btn.icon className="w-4 h-4 text-white/50 group-hover:text-white" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
            <Info className="w-6 h-6 text-indigo-600 shrink-0" />
            <div className="space-y-2">
              <h4 className="font-bold dark:text-white">{t('sentencemanip.about_title', 'About Sentences')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('sentencemanip.about_text', 'This tool identifies sentences by looking for punctuation followed by spaces. You can reorder, randomize, or clean your text at the sentence level.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
