import { useState, useCallback, useEffect } from 'react';
import { Copy, Check, Trash2, SortAsc, SortDesc, ListChecks, Type, FileDown, Scissors, RefreshCcw, AlertCircle, Plus, Minus, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function ListCleaner({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for interactive tools
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    onStateChange?.({ text });
  }, [text, onStateChange]);

  const getSecureRandom = useCallback((range: number): number => {
    if (range <= 0) return 0;
    const array = new Uint32Array(1);
    if (range >= 0x100000000) {
      window.crypto.getRandomValues(array);
      return array[0];
    }
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % range);
    let randomVal;
    do {
      window.crypto.getRandomValues(array);
      randomVal = array[0];
    } while (randomVal >= limit);
    return randomVal % range;
  }, []);

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
    a.download = 'liste_nettoyee.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [text]);

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  const processList = (fn: (lines: string[]) => string[]) => {
    if (text.length > MAX_LENGTH) return;
    const lines = text.split('\n');
    const processed = fn(lines);
    setText(processed.join('\n'));
  };

  const removeDuplicates = () => processList(lines => [...new Set(lines)]);
  const removeEmptyLines = () => processList(lines => lines.filter(line => line.trim() !== ''));
  const trimLines = () => processList(lines => lines.map(line => line.trim()));
  const sortAZ = () => processList(lines => [...lines].sort((a, b) => a.localeCompare(b)));
  const sortZA = () => processList(lines => [...lines].sort((a, b) => b.localeCompare(a)));
  const sortNumeric = () => processList(lines => [...lines].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
  const sortLength = () => processList(lines => [...lines].sort((a, b) => a.length - b.length));
  const reverseList = () => processList(lines => [...lines].reverse());

  const handleAddPrefixSuffix = () => {
    if (prefix || suffix) {
      processList(lines => lines.map(line => `${prefix}${line}${suffix}`));
    }
  };

  const handleRemovePrefixSuffix = () => {
    if (prefix || suffix) {
      processList(lines => {
        return lines.map(line => {
          let newLine = line;
          if (prefix && newLine.startsWith(prefix)) {
            newLine = newLine.slice(prefix.length);
          }
          if (suffix && newLine.endsWith(suffix)) {
            newLine = newLine.slice(0, newLine.length - suffix.length);
          }
          return newLine;
        });
      });
    }
  };

  const shuffleList = () => {
    processList(lines => {
      const shuffled = [...lines];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = getSecureRandom(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  };

  const handleLimitList = () => {
    if (limit > 0) {
      processList(lines => lines.slice(0, limit));
    }
  };

  const itemCount = text.split('\n').filter((l: string) => l.trim().length > 0).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="list-input" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('listcleaner.your_list')}</label>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!text || text.length > MAX_LENGTH}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={handleDownload}
                disabled={!text || text.length > MAX_LENGTH}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={() => {
                  setText('');
                  setError(null);
                }}
                disabled={!text}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="list-input"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={t('listcleaner.placeholder')}
            className={`w-full h-[500px] p-8 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-[2.5rem] outline-none focus:ring-2 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono resize-none`}
          />
          <div className="flex justify-end text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
            {t(itemCount === 1 ? 'listcleaner.item_count_one' : 'listcleaner.item_count_other', { count: itemCount })}
          </div>
        </div>

        {/* Sidebar Tools */}
        <div className="space-y-6">
          {/* Add/Remove Prefix/Suffix */}
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Type className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('listcleaner.prefix_suffix')}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('listcleaner.prefix')}</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Ex: - "
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('listcleaner.suffix')}</label>
                <input
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Ex: ;"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAddPrefixSuffix}
                disabled={!text || (!prefix && !suffix)}
                className="flex items-center justify-center gap-2 p-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> {t('listcleaner.add')}
              </button>
              <button
                onClick={handleRemovePrefixSuffix}
                disabled={!text || (!prefix && !suffix)}
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                <Minus className="w-3.5 h-3.5" /> {t('listcleaner.remove')}
              </button>
            </div>
          </div>

          {/* Limit List */}
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Hash className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('listcleaner.limit_title')}</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                min="1"
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button
                onClick={handleLimitList}
                disabled={!text || limit <= 0}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {t('listcleaner.keep_n')}
              </button>
            </div>
          </div>

          {/* Cleaning Actions */}
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Scissors className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('listcleaner.cleaning')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: t('listcleaner.remove_duplicates'), icon: ListChecks, action: removeDuplicates },
                { label: t('listcleaner.remove_empty_lines'), icon: Trash2, action: removeEmptyLines },
                { label: t('listcleaner.trim_lines'), icon: Scissors, action: trimLines },
                { label: t('listcleaner.shuffle_list'), icon: RefreshCcw, action: shuffleList },
                { label: t('listcleaner.reverse_list'), icon: RefreshCcw, action: reverseList },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  disabled={!text || text.length > MAX_LENGTH}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group disabled:opacity-50"
                >
                  <span className="font-bold text-xs">{btn.label}</span>
                  <btn.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tri */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <SortAsc className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">{t('listcleaner.sorting')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: t('listcleaner.sort_az'), icon: SortAsc, action: sortAZ },
              { label: t('listcleaner.sort_za'), icon: SortDesc, action: sortZA },
              { label: t('listcleaner.sort_numeric'), icon: SortAsc, action: sortNumeric },
              { label: t('listcleaner.sort_length'), icon: SortAsc, action: sortLength },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                disabled={!text || text.length > MAX_LENGTH}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group disabled:opacity-50"
              >
                <span className="font-bold text-sm">{btn.label}</span>
                <btn.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Casse */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <Type className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">{t('listcleaner.case')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { label: t('listcleaner.uppercase'), action: () => processList(lines => lines.map(l => l.toUpperCase())) },
              { label: t('listcleaner.lowercase'), action: () => processList(lines => lines.map(l => l.toLowerCase())) },
              { label: t('listcleaner.capitalize'), action: () => processList(lines => lines.map(l => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase())) },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                disabled={!text || text.length > MAX_LENGTH}
                className="flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group disabled:opacity-50"
              >
                <span className="font-bold text-xs">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
