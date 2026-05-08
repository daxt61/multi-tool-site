import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Type, FileText, Trash2, AlertCircle, Download, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function CaseConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [copied, setCopied] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ text });
  }, [text, onStateChange]);

  const conversions = {
    'camelCase': (t: string) => {
      const words = t.toLowerCase().split(/[\s_-]+/);
      return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'PascalCase': (t: string) => {
      const words = t.toLowerCase().split(/[\s_-]+/);
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'snake_case': (t: string) => t.toLowerCase().replace(/[\s-]+/g, '_'),
    'SCREAMING_SNAKE_CASE': (t: string) => t.toUpperCase().replace(/[\s-]+/g, '_'),
    'kebab-case': (t: string) => t.toLowerCase().replace(/[\s_]+/g, '-'),
    'SCREAMING-KEBAB-CASE': (t: string) => t.toUpperCase().replace(/[\s_]+/g, '-'),
    'Train-Case': (t: string) => t.toLowerCase().split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-'),
    'Header-Case': (t: string) => t.toLowerCase().split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-'),
    'dot.case': (t: string) => t.toLowerCase().replace(/[\s_-]+/g, '.'),
    'path/case': (t: string) => t.toLowerCase().replace(/[\s_-]+/g, '/'),
    'Title Case': (t: string) => t.toLowerCase().replace(/(^\s*\p{L}|[^\p{L}]\p{L})/gu, s => s.toUpperCase()),
    'Sentence case': (t: string) => t.toLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L}|[\n\r]\s*\p{L})/gu, s => s.toUpperCase()),
    'mOcKiNg CaSe': (t: string) => t.split('').map(c => Math.random() > 0.5 ? c.toLowerCase() : c.toUpperCase()).join(''),
    'UPPERCASE': (t: string) => t.toUpperCase(),
    'lowercase': (t: string) => t.toLowerCase(),
    'aLtErNaTiNg CaSe': (t: string) => t.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''),
    'iNVERSE cASE': (t: string) => t.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('')
  };

  const copyToClipboard = (converted: string, type: string) => {
    navigator.clipboard.writeText(converted);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  const handleClear = () => {
    setText('');
    setError(null);
  };

  const handleDownload = (content: string, name: string) => {
    if (!content || error) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadOriginal = useCallback(() => {
    handleDownload(text, 'texte-original');
  }, [text, error]);

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
          <label htmlFor="case-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-500" /> {t('caseconverter.your_text')}
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadOriginal}
              disabled={!text || !!error}
              className="text-xs font-bold px-3 py-1 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Download className="w-3 h-3" /> {t('common.download')}
            </button>
            <button
              onClick={handleClear}
              disabled={!text}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              aria-label={t('common.clear')}
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
        </div>
        <textarea
          id="case-text"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={t('caseconverter.placeholder')}
          className={`w-full h-48 p-8 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-[2.5rem] outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all text-lg leading-relaxed dark:text-slate-300 resize-none`}
        />
      </div>

      <div className="flex items-center gap-2 px-1">
        <LayoutGrid className="w-4 h-4 text-indigo-500" />
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Options de conversion</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(conversions).map(([name, converter]) => {
          const converted = (text && !error) ? converter(text) : '';
          return (
            <div key={name} className="group bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 hover:border-indigo-500/50 transition-all relative">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{name}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDownload(converted, name.toLowerCase())}
                    disabled={!text}
                    className="p-2 text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    title={t('common.download')}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(converted, name)}
                    disabled={!text}
                    className={`p-2 rounded-xl transition-all ${copied === name ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 border border-transparent'} disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none`}
                    aria-label={t('caseconverter.copy_as', { name })}
                  >
                    {copied === name ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl font-mono text-sm min-h-[4rem] max-h-32 overflow-y-auto break-all dark:text-slate-300 border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-800 transition-all scrollbar-thin">
                {converted || <span className="text-slate-400 italic">{t('caseconverter.result_placeholder')}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
