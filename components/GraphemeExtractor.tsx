import { useState, useEffect, useMemo } from 'react';
import {
  Type, Copy, Check, Trash2, Download,
  LayoutGrid, List, RefreshCw, Info, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 10000;

export function GraphemeExtractor({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialData?.viewMode || 'grid');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, viewMode });
  }, [input, viewMode, onStateChange]);

  const graphemes = useMemo(() => {
    if (!input) return [];
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return [];
    }
    setError(null);

    try {
      // Use Intl.Segmenter for accurate grapheme splitting
      // Supported in modern browsers (Chrome 87+, Edge 87+, Firefox 93+, Safari 14.1+)
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
      const segments = Array.from(segmenter.segment(input));
      return segments.map((s: any) => ({
        text: s.segment,
        codePoints: Array.from(s.segment).map((c: any) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'))
      }));
    } catch (e) {
      // Fallback for older browsers (less accurate for complex emojis)
      return (Array.from(input) as string[]).map((c: string) => ({
        text: c,
        codePoints: ['U+' + c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')]
      }));
    }
  }, [input, t]);

  const handleCopy = () => {
    if (graphemes.length === 0) return;
    navigator.clipboard.writeText(graphemes.map(g => g.text).join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (graphemes.length === 0) return;
    const report = graphemes.map(g => `${g.text} : ${g.codePoints.join(', ')}`).join('\n');
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphemes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="grapheme-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-500" /> {t('common.input')}
          </label>
          <div className="flex gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setInput('')}
              className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-xl transition-all"
              title={t('common.clear')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <textarea
          id="grapheme-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Family: 👨‍👩‍👧‍👦"
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl leading-relaxed dark:text-slate-300 resize-none shadow-sm"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            {t('grapheme_extractor.extracted_title')}
            <span className="ml-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">
              {graphemes.length}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={graphemes.length === 0}
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> {t('common.download')}
            </button>
            <button
              onClick={handleCopy}
              disabled={graphemes.length === 0}
              className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
              } disabled:opacity-50`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 min-h-[300px] max-h-[600px] overflow-y-auto">
          {graphemes.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {graphemes.map((g, i) => (
                  <div key={i} className="group bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2 hover:border-indigo-500/30 transition-all animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-3xl h-10 flex items-center justify-center">{g.text}</div>
                    <div className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter truncate w-full text-center">
                      {g.codePoints[0]}
                      {g.codePoints.length > 1 && '...'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {graphemes.map((g, i) => (
                  <div key={i} className="flex items-center gap-6 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-500/30 transition-all">
                    <div className="text-slate-400 font-mono text-xs w-8">#{i + 1}</div>
                    <div className="text-2xl w-10 flex justify-center">{g.text}</div>
                    <div className="flex-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {g.codePoints.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="h-full flex items-center justify-center text-slate-300 italic font-medium">
              {t('common.waiting')}
            </div>
          )}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('grapheme_extractor.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('grapheme_extractor.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
