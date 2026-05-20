import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Copy, Check, Trash2, Download, AlertCircle, Info, Type, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function StringJoiner({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [separator, setSeparator] = useState(initialData?.separator || ', ');
  const [prefix, setPrefix] = useState(initialData?.prefix || '');
  const [suffix, setSuffix] = useState(initialData?.suffix || '');
  const [trimLines, setTrimLines] = useState(initialData?.trimLines ?? true);
  const [ignoreEmpty, setIgnoreEmpty] = useState(initialData?.ignoreEmpty ?? true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, separator, prefix, suffix, trimLines, ignoreEmpty });
  }, [input, separator, prefix, suffix, trimLines, ignoreEmpty, onStateChange]);

  const output = useMemo(() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) return '';

    try {
      let lines = input.split('\n');

      if (trimLines) {
        lines = lines.map((l: string) => l.trim());
      }

      if (ignoreEmpty) {
        lines = lines.filter((l: string) => l.length > 0);
      }

      const joined = lines.join(separator);
      return `${prefix}${joined}${suffix}`;
    } catch (e) {
      console.error('Join error:', e);
      return '';
    }
  }, [input, separator, prefix, suffix, trimLines, ignoreEmpty]);

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  }, [input, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `string-join-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInput('');
    setError(null);
  };

  const itemCount = input.split('\n').filter((l: string) => l.trim().length > 0).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="join-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" /> {t('stringjoiner.input_label')}
            </label>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center">
                {t(itemCount === 1 ? 'listcleaner.item_count_one' : 'listcleaner.item_count_other', { count: itemCount })}
              </span>
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="join-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('stringjoiner.placeholder_input')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none font-mono"
          />
        </div>

        {/* Configuration & Output Section */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="join-separator" className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('stringjoiner.separator')}</label>
                <input
                  id="join-separator"
                  type="text"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  placeholder="Ex: , or \n"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="join-prefix" className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('listcleaner.prefix')}</label>
                <input
                  id="join-prefix"
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="["
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="join-suffix" className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('listcleaner.suffix')}</label>
                <input
                  id="join-suffix"
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="]"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={trimLines}
                    onChange={(e) => setTrimLines(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    {t('listcleaner.trim_lines')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={ignoreEmpty}
                    onChange={(e) => setIgnoreEmpty(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    {t('listcleaner.remove_empty_lines')}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="join-output" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <Download className="w-3 h-3" /> {t('common.download')}
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-1 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              id="join-output"
              value={output}
              readOnly
              placeholder={t('stringjoiner.placeholder_output')}
              className="w-full h-48 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none transition-all text-lg leading-relaxed dark:text-slate-300 resize-none font-mono"
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('stringjoiner.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('stringjoiner.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
