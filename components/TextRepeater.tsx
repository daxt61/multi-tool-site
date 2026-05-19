import { useState, useEffect, useCallback, useMemo } from 'react';
import { Repeat, Copy, Check, Trash2, Download, AlertCircle, Info, Type, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_OUTPUT_LENGTH = 100000;

export function TextRepeater({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [count, setCount] = useState(initialData?.count || 10);
  const [separatorType, setSeparatorType] = useState<'none' | 'space' | 'newline' | 'custom'>(initialData?.separatorType || 'newline');
  const [customSeparator, setCustomSeparator] = useState(initialData?.customSeparator || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ text, count, separatorType, customSeparator });
  }, [text, count, separatorType, customSeparator, onStateChange]);

  const output = useMemo(() => {
    if (!text || count <= 0) return '';

    let sep = '';
    if (separatorType === 'space') sep = ' ';
    else if (separatorType === 'newline') sep = '\n';
    else if (separatorType === 'custom') sep = customSeparator;

    const singleRepeatLength = text.length + sep.length;
    const estimatedTotalLength = singleRepeatLength * count - sep.length;

    if (estimatedTotalLength > MAX_OUTPUT_LENGTH) {
      return null;
    }

    return Array(count).fill(text).join(sep);
  }, [text, count, separatorType, customSeparator]);

  useEffect(() => {
    if (output === null) {
      setError(t('error.max_length', { max: MAX_OUTPUT_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  }, [output, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `text-repeat-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [output]);

  const handleClear = () => {
    setText('');
    setCount(10);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-500" /> {t('common.input')}
              </label>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('textrepeater.placeholder')}
              className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label htmlFor="repeat-count" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-500" /> {t('common.count')}
              </label>
              <input
                id="repeat-count"
                type="number"
                min="1"
                max="10000"
                value={count}
                onChange={(e) => setCount(Math.min(10000, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Repeat className="w-4 h-4 text-indigo-500" /> {t('texthex.separator')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSeparatorType('none')}
                  className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${separatorType === 'none' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                  {t('jsontojava.none')}
                </button>
                <button
                  onClick={() => setSeparatorType('space')}
                  className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${separatorType === 'space' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                  {t('texthex.space')}
                </button>
                <button
                  onClick={() => setSeparatorType('newline')}
                  className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${separatorType === 'newline' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                  LF
                </button>
                <button
                  onClick={() => setSeparatorType('custom')}
                  className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${separatorType === 'custom' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                  {t('common.options')}
                </button>
              </div>
            </div>
          </div>

          {separatorType === 'custom' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label htmlFor="custom-sep" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('textrepeater.custom_separator')}</label>
              <input
                id="custom-sep"
                type="text"
                value={customSeparator}
                onChange={(e) => setCustomSeparator(e.target.value)}
                placeholder="Ex: - "
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="output-text" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              id="output-text"
              readOnly
              value={output || ''}
              placeholder={output === null ? t('error.max_length', { max: MAX_OUTPUT_LENGTH.toLocaleString() }) : t('textrepeater.output_placeholder')}
              className="w-full h-[320px] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none text-lg leading-relaxed dark:text-white font-mono resize-none shadow-inner"
            />
            <div className="flex justify-between items-center px-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t('wordcounter.stat.characters')}: {output?.length || 0} / {MAX_OUTPUT_LENGTH}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('textrepeater.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('textrepeater.about_text', { max: MAX_OUTPUT_LENGTH.toLocaleString() })}
          </p>
        </div>
      </div>
    </div>
  );
}
