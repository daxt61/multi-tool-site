import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Columns, Copy, Check, Trash2, ArrowRightLeft, Info, ListFilter, Download, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

export function ListComparator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const listARef = useRef<HTMLTextAreaElement>(null);

  const [listA, setListA] = useState<string>(initialData?.listA || '');
  const [listB, setListB] = useState<string>(initialData?.listB || '');
  const [caseSensitive, setCaseSensitive] = useState<boolean>(initialData?.caseSensitive ?? false);
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ listA, listB, caseSensitive, trimItems });
  }, [listA, listB, caseSensitive, trimItems, onStateChange]);

  const processList = useCallback((text: string) => {
    let items = text.split('\n').filter((line) => line.length > 0);
    if (trimItems) {
      items = items.map((i) => i.trim()).filter((i) => i.length > 0);
    }
    return items;
  }, [trimItems]);

  const results = useMemo(() => {
    if (listA.length > MAX_LENGTH || listB.length > MAX_LENGTH) {
      return { common: [], onlyA: [], onlyB: [], union: [], symmetricDiff: [] };
    }

    const itemsA = processList(listA);
    const itemsB = processList(listB);

    const setA = new Set(caseSensitive ? itemsA : itemsA.map((i) => i.toLowerCase()));
    const setB = new Set(caseSensitive ? itemsB : itemsB.map((i) => i.toLowerCase()));

    const common = itemsA.filter((item) => {
      const val = caseSensitive ? item : item.toLowerCase();
      return setB.has(val);
    });
    const uniqueCommon = Array.from(new Set(caseSensitive ? common : common.map((c) => c.toLowerCase())))
      .map((val) => itemsA.find((orig) => (caseSensitive ? orig : orig.toLowerCase()) === val) || val);

    const onlyA = itemsA.filter((item) => {
      const val = caseSensitive ? item : item.toLowerCase();
      return !setB.has(val);
    });
    const uniqueOnlyA = Array.from(new Set(caseSensitive ? onlyA : onlyA.map((c) => c.toLowerCase())))
      .map((val) => itemsA.find((orig) => (caseSensitive ? orig : orig.toLowerCase()) === val) || val);

    const onlyB = itemsB.filter((item) => {
      const val = caseSensitive ? item : item.toLowerCase();
      return !setA.has(val);
    });
    const uniqueOnlyB = Array.from(new Set(caseSensitive ? onlyB : onlyB.map((c) => c.toLowerCase())))
      .map((val) => itemsB.find((orig) => (caseSensitive ? orig : orig.toLowerCase()) === val) || val);

    const union = Array.from(new Set([...itemsA, ...itemsB].map((i) => (caseSensitive ? i : i.toLowerCase()))))
      .map((val) => [...itemsA, ...itemsB].find((orig) => (caseSensitive ? orig : orig.toLowerCase()) === val) || val);

    const symmetricDiff = [...itemsA, ...itemsB].filter((item) => {
      const val = caseSensitive ? item : item.toLowerCase();
      return (setA.has(val) && !setB.has(val)) || (!setA.has(val) && setB.has(val));
    });
    const uniqueSymmetricDiff = Array.from(new Set(caseSensitive ? symmetricDiff : symmetricDiff.map((c) => c.toLowerCase())))
      .map((val) => [...itemsA, ...itemsB].find((orig) => (caseSensitive ? orig : orig.toLowerCase()) === val) || val);

    return {
      common: uniqueCommon,
      onlyA: uniqueOnlyA,
      onlyB: uniqueOnlyB,
      union,
      symmetricDiff: uniqueSymmetricDiff,
    };
  }, [listA, listB, caseSensitive, processList]);

  const handleCopy = useCallback((items: string[], id: string) => {
    if (items.length === 0) return;
    navigator.clipboard.writeText(items.join('\n'));
    setCopiedId(id);
    toast.success(t('common.copied'));
    setTimeout(() => setCopiedId(null), 2000);
  }, [t]);

  const handleDownload = useCallback((items: string[], filename: string) => {
    if (items.length === 0) return;
    const blob = new Blob([items.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success'));
  }, [t]);

  const handleClear = useCallback(() => {
    setListA('');
    setListB('');
    setError(null);
    if (listARef.current) {
      listARef.current.focus();
    }
    toast.success(t('listcomparator.cleared', 'Inputs cleared'));
  }, [t]);

  // Presets Loader
  const loadPreset = (preset: 'emails' | 'flags' | 'skus') => {
    if (preset === 'emails') {
      setListA('alice@company.com\nbob@company.com\ncharlie@company.com\ndavid@company.com');
      setListB('bob@company.com\ndavid@company.com\neve@company.com\nfrank@company.com');
      setCaseSensitive(false);
      setTrimItems(true);
    } else if (preset === 'flags') {
      setListA('FEATURE_NEW_NAV\nFEATURE_DARK_MODE\nFEATURE_BETA_DASHBOARD\nFEATURE_ANALYTICS');
      setListB('FEATURE_NEW_NAV\nFEATURE_DARK_MODE\nFEATURE_STRIPE_V2');
      setCaseSensitive(true);
      setTrimItems(true);
    } else if (preset === 'skus') {
      setListA('SKU-1001\nSKU-1002\nSKU-1003\nSKU-1004');
      setListB('SKU-1003\nSKU-1004\nSKU-1005\nSKU-1006');
      setCaseSensitive(true);
      setTrimItems(true);
    }
    toast.success(t('listcomparator.preset_loaded', 'Preset loaded successfully!'));
  };

  const handlersRef = useRef({
    clear: handleClear,
    copyCommon: () => handleCopy(results.common, 'common'),
  });

  useEffect(() => {
    handlersRef.current = {
      clear: handleClear,
      copyCommon: () => handleCopy(results.common, 'common'),
    };
  }, [handleClear, handleCopy, results.common]);

  // Global keydown handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isEditable =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable);

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.clear();
      } else if (
        e.key.toLowerCase() === 'c' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isEditable
      ) {
        e.preventDefault();
        handlersRef.current.copyCommon();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8" data-testid="list-comparator-container">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Presets Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          {t('listcomparator.presets', 'Presets')}:
        </span>
        <button
          type="button"
          onClick={() => loadPreset('emails')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          📧 {t('listcomparator.preset_emails', 'User Email Audit')}
        </button>
        <button
          type="button"
          onClick={() => loadPreset('flags')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🚩 {t('listcomparator.preset_flags', 'Feature Flags Check')}
        </button>
        <button
          type="button"
          onClick={() => loadPreset('skus')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          📦 {t('listcomparator.preset_skus', 'Inventory SKUs')}
        </button>
      </div>

      <div className="flex justify-between items-center px-1">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              caseSensitive
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            {t('listcomparator.case_sensitive')}
          </button>
          <button
            type="button"
            onClick={() => setTrimItems(!trimItems)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              trimItems
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            {t('listcomparator.trim')}
          </button>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" /> {t('listcomparator.clear_all')}
          <Kbd modifier={null} className="ml-1 border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label htmlFor="list-a" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            {t('listcomparator.list_a')}
          </label>
          <textarea
            id="list-a"
            ref={listARef}
            value={listA}
            onChange={(e) => {
              setListA(e.target.value);
              if (e.target.value.length > MAX_LENGTH) setError(t('error.max_length', { max: MAX_LENGTH }));
              else setError(null);
            }}
            placeholder={t('listcomparator.placeholder_a')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg font-medium dark:text-slate-300 resize-none font-mono"
          />
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
            {t('listcomparator.items_count', { count: processList(listA).length })}
          </div>
        </div>
        <div className="space-y-4">
          <label htmlFor="list-b" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            {t('listcomparator.list_b')}
          </label>
          <textarea
            id="list-b"
            value={listB}
            onChange={(e) => {
              setListB(e.target.value);
              if (e.target.value.length > MAX_LENGTH) setError(t('error.max_length', { max: MAX_LENGTH }));
              else setError(null);
            }}
            placeholder={t('listcomparator.placeholder_b')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg font-medium dark:text-slate-300 resize-none font-mono"
          />
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
            {t('listcomparator.items_count', { count: processList(listB).length })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
        {[
          { id: 'common', name: t('listcomparator.common'), items: results.common, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { id: 'onlyA', name: t('listcomparator.only_a'), items: results.onlyA, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { id: 'onlyB', name: t('listcomparator.only_b'), items: results.onlyB, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { id: 'symmetric', name: t('listcomparator.symmetric_diff'), items: results.symmetricDiff, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
          { id: 'union', name: t('listcomparator.union'), items: results.union, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
        ].map((res) => (
          <div key={res.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col group">
            <div className={`p-4 ${res.bg} flex justify-between items-center`}>
              <div className="space-y-1">
                <div className={`text-[10px] font-black uppercase tracking-widest ${res.color}`}>{res.name}</div>
                <div className="text-2xl font-black dark:text-white" aria-live="polite">{res.items.length}</div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleCopy(res.items, res.id)}
                  className={`p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${copiedId === res.id ? 'bg-white text-emerald-600 shadow-sm' : 'hover:bg-white/50 text-slate-500'}`}
                  title={t('listcomparator.copy')}
                  aria-label={`${t('listcomparator.copy')} ${res.name}`}
                >
                  {copiedId === res.id ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(res.items, `liste-${res.id}`)}
                  className="p-2 rounded-xl hover:bg-white/50 text-slate-500 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  title={t('listcomparator.download')}
                  aria-label={`${t('listcomparator.download')} ${res.name}`}
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex-grow h-48 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {res.items.length > 0 ? (
                <div className="space-y-2 font-mono">
                  {res.items.map((item, i) => (
                    <div key={i} className="text-sm font-medium text-slate-600 dark:text-slate-400 break-all border-b border-slate-50 dark:border-slate-800 pb-1">
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-bold text-slate-300 italic">
                  {t('listcomparator.no_results')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4 max-w-2xl mx-auto">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm shrink-0">
          <ArrowRightLeft className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('listcomparator.sets_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listcomparator.sets_desc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('listcomparator.use_cases_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listcomparator.use_cases_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('listcomparator.clean_options_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listcomparator.clean_options_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Columns className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('listcomparator.privacy_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listcomparator.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
