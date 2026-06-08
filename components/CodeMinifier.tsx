import React, { useState, useMemo, useEffect } from 'react';
import { Copy, Check, Trash2, Zap, FileCode, Scissors, Download, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function CodeMinifier({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [mode, setMode] = useState<'js' | 'css' | 'html'>(initialData?.mode || 'js');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, mode });
  }, [input, mode]);

  const minify = (code: string, type: 'js' | 'css' | 'html') => {
    if (!code) return '';
    if (code.length > MAX_LENGTH) return '';

    try {
      if (type === 'js') {
        const preserved: string[] = [];
        const masked = code
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '') // Remove comments
          .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[\s\S]*?`)/g, (match) => {
            preserved.push(match);
            return `__JS_STR_${preserved.length - 1}__`;
          });

        const minified = masked
          .replace(/\s+/g, ' ')
          .replace(/\s*([\{\}\(\)\[\]\=\+\-\*\/\%\&\|\!\?\:\;\,\.])\s*/g, '$1')
          .trim();

        return minified.replace(/__JS_STR_(\d+)__/g, (_, id) => preserved[parseInt(id)]);
      } else if (type === 'css') {
        const preserved: string[] = [];
        const masked = code
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, (match) => {
            preserved.push(match);
            return `__CSS_STR_${preserved.length - 1}__`;
          });

        const minified = masked
          .replace(/\s+/g, ' ')
          .replace(/\s*([\{\}\:\;\,\>])\s*/g, '$1')
          .replace(/\;\}/g, '}')
          .trim();

        return minified.replace(/__CSS_STR_(\d+)__/g, (_, id) => preserved[parseInt(id)]);
      } else if (type === 'html') {
        const preserved: string[] = [];
        const masked = code.replace(/<(pre|code)[\s\S]*?>[\s\S]*?<\/\1>/gi, (match) => {
          preserved.push(match);
          return `__HTML_PRE_${preserved.length - 1}__`;
        });

        const minified = masked
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/\s+/g, ' ')
          .replace(/>\s+</g, '><')
          .replace(/>\s+(__HTML_PRE_\d+__)/g, '>$1')
          .replace(/(__HTML_PRE_\d+__)\s+</g, '$1<')
          .trim();

        return minified.replace(/__HTML_PRE_(\d+)__/g, (_, id) => preserved[parseInt(id)]);
      }
    } catch (e) {
      return code;
    }
    return code;
  };

  const output = useMemo(() => minify(input, mode), [input, mode]);

  const stats = useMemo(() => {
    if (!input || input.length > MAX_LENGTH) return { original: 0, minified: 0, reduction: 0 };
    const original = input.length;
    const minified = output.length;
    const reduction = ((original - minified) / original) * 100;
    return { original, minified, reduction: Math.max(0, reduction) };
  }, [input, output]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const extensions = { js: 'min.js', css: 'min.css', html: 'min.html' };
    const mimes = { js: 'text/javascript', css: 'text/css', html: 'text/html' };
    const blob = new Blob([output], { type: mimes[mode] });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `code.${extensions[mode]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* Mode Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'js', name: 'JavaScript', icon: FileCode },
            { id: 'css', name: 'CSS', icon: Zap },
            { id: 'html', name: 'HTML', icon: Scissors },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === item.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="minifier-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('codeminifier.original_code')}</label>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={() => {
                  setInput('');
                  setError(null);
                }}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-full flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="minifier-input"
            value={input}
            onChange={(e) => {
              const val = e.target.value;
              setInput(val);
              if (val.length > MAX_LENGTH) {
                setError(t('codeminifier.error_max_length', { max: MAX_LENGTH.toLocaleString() }));
              } else {
                setError(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setInput('');
                setError(null);
              }
            }}
            placeholder={t('codeminifier.placeholder_input', { mode: mode.toUpperCase() })}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="minifier-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('codeminifier.minified_version')}</label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-4 py-1.5 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <div className="relative group">
            <textarea
              id="minifier-output"
              value={output}
              readOnly
              placeholder={t('codeminifier.placeholder_output')}
              className="w-full h-[450px] p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl font-mono text-sm leading-relaxed resize-none outline-none"
            />
            {stats.original > 0 && (
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 flex justify-around text-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t('codeminifier.reduction')}</div>
                  <div className="text-xl font-black text-emerald-400">{stats.reduction.toFixed(1)}%</div>
                </div>
                <div className="w-px bg-white/10"></div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t('codeminifier.before')}</div>
                  <div className="text-xl font-black text-slate-300">{stats.original} B</div>
                </div>
                <div className="w-px bg-white/10"></div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t('codeminifier.after')}</div>
                  <div className="text-xl font-black text-white">{stats.minified} B</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
