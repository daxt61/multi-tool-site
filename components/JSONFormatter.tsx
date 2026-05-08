import { useState, useEffect, useCallback } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Maximize2, Minimize2, Download, SortAsc, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function JSONFormatter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [indentSize, setIndentSize] = useState(initialData?.indentSize || '2');
  const [sortKeys, setSortKeys] = useState(initialData?.sortKeys || false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [fixed, setFixed] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, indentSize, sortKeys });
  }, [input, output, indentSize, sortKeys]);

  const sortObjectKeys = useCallback((obj: any): any => {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
      }
      return obj;
    }

    return Object.keys(obj)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = sortObjectKeys(obj[key]);
        return acc;
      }, {});
  }, []);

  const handlePrettify = () => {
    try {
      if (!input.trim() || input.length > MAX_LENGTH) return;
      let parsed = JSON.parse(input);
      if (sortKeys) {
        parsed = sortObjectKeys(parsed);
      }
      const indent = indentSize === 'tab' ? '\t' : Number(indentSize);
      const formatted = JSON.stringify(parsed, null, indent);
      setOutput(formatted);
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  };

  const handleFix = () => {
    try {
      const fixedInput = input
        .replace(/(\{|,)\s*'([^']*)'\s*:/g, '$1"$2":') // Single quotes for keys
        .replace(/:\s*'([^']*)'\s*([,\}])/g, ':"$1"$2') // Single quotes for values
        .replace(/,\s*([}\]])/g, '$1'); // Trailing commas

      const parsed = JSON.parse(fixedInput);
      setInput(JSON.stringify(parsed, null, indentSize === 'tab' ? '\t' : Number(indentSize)));
      setError('');
      setFixed(true);
      setTimeout(() => setFixed(false), 2000);
    } catch (e: any) {
      setError(t('jsonformatter.error_repair') + e.message);
    }
  };

  const handleMinify = () => {
    try {
      if (!input.trim() || input.length > MAX_LENGTH) return;
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed);
      setOutput(formatted);
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError('');
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('jsonformatter.input_label')}
                <span className="ml-2 lowercase font-medium opacity-70">
                  ({input.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()})
                </span>
              </label>
            </div>
            <button
              onClick={handleClear}
              disabled={!input && !output}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="json-input"
            autoFocus
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handlePrettify();
              }
            }}
            placeholder='{"key": "value"}'
            className={`w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border ${error.includes('trop longue') ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-3xl outline-none focus:ring-2 ${error.includes('trop longue') ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <label htmlFor="json-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.output')}</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('common.download')}
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="json-output"
            value={output}
            readOnly
            placeholder={t('jsonformatter.placeholder_output')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center items-center">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          {[
            { label: t('jsonformatter.indent_2'), value: '2' },
            { label: t('jsonformatter.indent_4'), value: '4' },
            { label: t('jsonformatter.indent_tab'), value: 'tab' }
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setIndentSize(opt.value)}
              aria-pressed={indentSize === opt.value}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                indentSize === opt.value
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortKeys(!sortKeys)}
          aria-pressed={sortKeys}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border ${
            sortKeys
              ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
              : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          <SortAsc className="w-4 h-4" /> {t('jsonformatter.sort_keys')}
        </button>

        <button
          onClick={handleFix}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border ${
            fixed
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
              : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          {fixed ? <Check className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
          {fixed ? t('jsonformatter.fixed_success') : t('jsonformatter.fix')}
        </button>

        <button
          onClick={handlePrettify}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <Maximize2 className="w-5 h-5" /> {t('jsonformatter.beautify')}
          <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 border border-white/20 rounded text-[10px] font-bold bg-white/10">
            Ctrl + Enter
          </kbd>
        </button>
        <button
          onClick={handleMinify}
          className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <Minimize2 className="w-5 h-5" /> {t('jsonformatter.minify')}
        </button>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">{t('jsonformatter.tips_title')}</h4>
        <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1 list-disc list-inside">
          <li>{t('jsonformatter.tip_1')}</li>
          <li>{t('jsonformatter.tip_2')}</li>
          <li>{t('jsonformatter.tip_3')}</li>
        </ul>
      </div>
    </div>
  );
}
