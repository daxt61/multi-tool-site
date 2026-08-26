import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ArrowLeftRight, Copy, Check, Trash2, Download, Settings2, Sliders, ListFilter, Info, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function ListZipperUnzipper({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const listARef = useRef<HTMLTextAreaElement>(null);
  const combinedRef = useRef<HTMLTextAreaElement>(null);

  // General States
  const [activeTab, setActiveTab] = useState<'zip' | 'unzip'>(initialData?.activeTab || 'zip');

  // --- Zip Mode States ---
  const [listA, setListA] = useState(initialData?.listA || '');
  const [listB, setListB] = useState(initialData?.listB || '');
  const [zipSeparator, setZipSeparator] = useState(initialData?.zipSeparator || 'comma'); // comma, space, tab, colon, custom
  const [customZipSep, setCustomZipSep] = useState(initialData?.customZipSep || ' - ');
  const [mismatchStrategy, setMismatchStrategy] = useState<'truncate' | 'pad'>(initialData?.mismatchStrategy || 'pad');
  const [padValue, setPadValue] = useState(initialData?.padValue || '');
  const [zipPrefix, setZipPrefix] = useState(initialData?.zipPrefix || '');
  const [zipSuffix, setZipSuffix] = useState(initialData?.zipSuffix || '');

  // --- Unzip Mode States ---
  const [combinedInput, setCombinedInput] = useState(initialData?.combinedInput || '');
  const [unzipStrategy, setUnzipStrategy] = useState<'delimiter' | 'alternating'>(initialData?.unzipStrategy || 'delimiter');
  const [unzipDelimiter, setUnzipDelimiter] = useState(initialData?.unzipDelimiter || 'comma'); // comma, space, tab, colon, custom
  const [customUnzipDelim, setCustomUnzipDelim] = useState(initialData?.customUnzipDelim || ' - ');

  // Toast / Copy States
  const [copiedZip, setCopiedZip] = useState(false);
  const [copiedUnzipA, setCopiedUnzipA] = useState(false);
  const [copiedUnzipB, setCopiedUnzipB] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with parent dashboard
  useEffect(() => {
    onStateChange?.({
      activeTab,
      listA,
      listB,
      zipSeparator,
      customZipSep,
      mismatchStrategy,
      padValue,
      zipPrefix,
      zipSuffix,
      combinedInput,
      unzipStrategy,
      unzipDelimiter,
      customUnzipDelim,
    });
  }, [
    activeTab,
    listA,
    listB,
    zipSeparator,
    customZipSep,
    mismatchStrategy,
    padValue,
    zipPrefix,
    zipSuffix,
    combinedInput,
    unzipStrategy,
    unzipDelimiter,
    customUnzipDelim,
    onStateChange,
  ]);

  // Max length verification
  const handleListAChange = (val: string) => {
    setListA(val);
    if (val.length > MAX_LENGTH || listB.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  const handleListBChange = (val: string) => {
    setListB(val);
    if (listA.length > MAX_LENGTH || val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  const handleCombinedChange = (val: string) => {
    setCombinedInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  // Clear inputs
  const handleClear = useCallback(() => {
    if (activeTab === 'zip') {
      setListA('');
      setListB('');
      setZipPrefix('');
      setZipSuffix('');
      setError(null);
      toast.success(t('listzipper.toast_cleared', 'List inputs cleared'));
      setTimeout(() => listARef.current?.focus(), 0);
    } else {
      setCombinedInput('');
      setError(null);
      toast.success(t('listzipper.toast_cleared', 'List inputs cleared'));
      setTimeout(() => combinedRef.current?.focus(), 0);
    }
  }, [activeTab, t]);

  // ZIP separators mapping
  const getZipSeparatorString = useCallback(() => {
    switch (zipSeparator) {
      case 'space': return ' ';
      case 'comma': return ', ';
      case 'semicolon': return '; ';
      case 'tab': return '\t';
      case 'colon': return ': ';
      case 'custom': return customZipSep;
      default: return ', ';
    }
  }, [zipSeparator, customZipSep]);

  // UNZIP separators mapping
  const getUnzipDelimiterString = useCallback(() => {
    switch (unzipDelimiter) {
      case 'space': return ' ';
      case 'comma': return ',';
      case 'semicolon': return ';';
      case 'tab': return '\t';
      case 'colon': return ':';
      case 'custom': return customUnzipDelim;
      default: return ',';
    }
  }, [unzipDelimiter, customUnzipDelim]);

  // Core Processing logic for Zipping
  const zipResult = useMemo(() => {
    if (listA.length > MAX_LENGTH || listB.length > MAX_LENGTH) return '';
    if (!listA.trim() && !listB.trim()) return '';

    const linesA = listA.split('\n');
    const linesB = listB.split('\n');

    const len = mismatchStrategy === 'truncate'
      ? Math.min(linesA.length, linesB.length)
      : Math.max(linesA.length, linesB.length);

    const separator = getZipSeparatorString();
    const resultLines: string[] = [];

    for (let i = 0; i < len; i++) {
      const valA = linesA[i] !== undefined ? linesA[i] : (mismatchStrategy === 'pad' ? padValue : '');
      const valB = linesB[i] !== undefined ? linesB[i] : (mismatchStrategy === 'pad' ? padValue : '');

      let joined = `${valA}${separator}${valB}`;
      if (zipPrefix) joined = zipPrefix + joined;
      if (zipSuffix) joined = joined + zipSuffix;

      resultLines.push(joined);
    }

    return resultLines.join('\n');
  }, [listA, listB, zipSeparator, customZipSep, mismatchStrategy, padValue, zipPrefix, zipSuffix, getZipSeparatorString]);

  // Core Processing logic for Unzipping
  const unzipResult = useMemo(() => {
    if (combinedInput.length > MAX_LENGTH) return { listA: '', listB: '' };
    if (!combinedInput.trim()) return { listA: '', listB: '' };

    const lines = combinedInput.split('\n');
    const resA: string[] = [];
    const resB: string[] = [];

    if (unzipStrategy === 'alternating') {
      lines.forEach((line: string, index: number) => {
        if (index % 2 === 0) {
          resA.push(line);
        } else {
          resB.push(line);
        }
      });
    } else {
      const delim = getUnzipDelimiterString();
      lines.forEach((line: string) => {
        if (delim === '') {
          // Empty delimiter splits first character
          resA.push(line.slice(0, 1));
          resB.push(line.slice(1));
        } else {
          const idx = line.indexOf(delim);
          if (idx !== -1) {
            resA.push(line.slice(0, idx));
            resB.push(line.slice(idx + delim.length));
          } else {
            // Delimiter not found: entire line in A, B gets blank
            resA.push(line);
            resB.push('');
          }
        }
      });
    }

    return {
      listA: resA.join('\n'),
      listB: resB.join('\n'),
    };
  }, [combinedInput, unzipStrategy, unzipDelimiter, customUnzipDelim, getUnzipDelimiterString]);

  // Copy Actions
  const handleCopyZip = useCallback(() => {
    if (!zipResult) return;
    navigator.clipboard.writeText(zipResult);
    setCopiedZip(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
    setTimeout(() => setCopiedZip(false), 2000);
  }, [zipResult, t]);

  const handleCopyUnzipA = useCallback(() => {
    if (!unzipResult.listA) return;
    navigator.clipboard.writeText(unzipResult.listA);
    setCopiedUnzipA(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
    setTimeout(() => setCopiedUnzipA(false), 2000);
  }, [unzipResult.listA, t]);

  const handleCopyUnzipB = useCallback(() => {
    if (!unzipResult.listB) return;
    navigator.clipboard.writeText(unzipResult.listB);
    setCopiedUnzipB(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
    setTimeout(() => setCopiedUnzipB(false), 2000);
  }, [unzipResult.listB, t]);

  // Master copy trigger for global 'C' key
  const handleMasterCopy = useCallback(() => {
    if (activeTab === 'zip') {
      if (zipResult) handleCopyZip();
    } else {
      if (unzipResult.listA) handleCopyUnzipA();
    }
  }, [activeTab, zipResult, unzipResult.listA, handleCopyZip, handleCopyUnzipA]);

  // keyboard handlers via ref to avoid stale closures
  const handlersRef = useRef({ handleClear, handleMasterCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleMasterCopy };
  }, [handleClear, handleMasterCopy]);

  // Global keydown listeners for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditable =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active?.getAttribute('contenteditable') === 'true';

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleMasterCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Preset Loaders
  const applyZipPreset = (type: 'names' | 'keyvalue' | 'csv' | 'query') => {
    setError(null);
    if (type === 'names') {
      setListA('Alice\nBob\nCharlie\nDiana');
      setListB('Smith\nJohnson\nBrown\nPrince');
      setZipSeparator('space');
      setMismatchStrategy('pad');
      setPadValue('');
      setZipPrefix('');
      setZipSuffix('');
      toast.success(t('listzipper.preset_loaded', 'Preset loaded!'));
    } else if (type === 'keyvalue') {
      setListA('host\nport\ndatabase\nusername');
      setListB('localhost\n5432\nproduction_db\nadmin');
      setZipSeparator('custom');
      setCustomZipSep(' = ');
      setMismatchStrategy('pad');
      setPadValue('N/A');
      setZipPrefix('');
      setZipSuffix('');
      toast.success(t('listzipper.preset_loaded', 'Preset loaded!'));
    } else if (type === 'csv') {
      setListA('ID-001\nID-002\nID-003\nID-004');
      setListB('Active\nPending\nInactive\nSuspended');
      setZipSeparator('comma');
      setMismatchStrategy('pad');
      setPadValue('Unknown');
      setZipPrefix('');
      setZipSuffix('');
      toast.success(t('listzipper.preset_loaded', 'Preset loaded!'));
    } else if (type === 'query') {
      setListA('user\nrole\nstatus\npage');
      setListB('john_doe\nadmin\nactive\n1');
      setZipSeparator('custom');
      setCustomZipSep('=');
      setMismatchStrategy('truncate');
      setZipPrefix('?');
      setZipSuffix('&');
      toast.success(t('listzipper.preset_loaded', 'Preset loaded!'));
    }
  };

  const applyUnzipPreset = (type: 'keyvalue' | 'email' | 'alternating') => {
    setError(null);
    if (type === 'keyvalue') {
      setCombinedInput('host = localhost\nport = 5432\ndatabase = production_db\nusername = admin');
      setUnzipStrategy('delimiter');
      setUnzipDelimiter('custom');
      setCustomUnzipDelim(' = ');
      toast.success(t('listzipper.preset_loaded', 'Preset loaded!'));
    } else if (type === 'email') {
      setCombinedInput('alice@example.com\nbob@domain.org\ncharlie@company.com\ndiana@tech.io');
      setUnzipStrategy('delimiter');
      setUnzipDelimiter('custom');
      setCustomUnzipDelim('@');
      toast.success(t('listzipper.preset_loaded', 'Preset loaded!'));
    } else if (type === 'alternating') {
      setCombinedInput('First Name\nAlice\nLast Name\nSmith\nEmail\nalice@example.com');
      setUnzipStrategy('alternating');
      toast.success(t('listzipper.preset_loaded', 'Preset loaded!'));
    }
  };

  // Download Actions
  const handleDownloadText = (text: string, filename: string) => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded file successfully!'));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" role="region" aria-label={t('tool.list-zipper-unzipper.name', 'Zip & Unzip Lists')}>
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Tabs / Operation Choice */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => { setActiveTab('zip'); setError(null); }}
            aria-pressed={activeTab === 'zip'}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activeTab === 'zip'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            {t('listzipper.tab_zip', 'Zip / Combine Lists')}
          </button>
          <button
            onClick={() => { setActiveTab('unzip'); setError(null); }}
            aria-pressed={activeTab === 'unzip'}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activeTab === 'unzip'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            {t('listzipper.tab_unzip', 'Unzip / Split Lists')}
          </button>
        </div>
      </div>

      {activeTab === 'zip' ? (
        // ================== ZIP OPERATION PANEL ==================
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Quick Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {t('listzipper.presets_label', 'Quick Presets')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyZipPreset('names')}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
              >
                {t('listzipper.preset_names', 'First & Last Names')}
              </button>
              <button
                type="button"
                onClick={() => applyZipPreset('keyvalue')}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
              >
                {t('listzipper.preset_keyvalue', 'Key-Value Pairs (=)')}
              </button>
              <button
                type="button"
                onClick={() => applyZipPreset('csv')}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
              >
                {t('listzipper.preset_csv', 'CSV Columns (,)')}
              </button>
              <button
                type="button"
                onClick={() => applyZipPreset('query')}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
              >
                {t('listzipper.preset_query', 'URL Query Params')}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-indigo-500">
              <Sliders className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('listzipper.zip_params', 'Combine Parameters')}
              </span>
            </div>
            <button
              onClick={handleClear}
              disabled={!listA && !listB}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
              <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* List A */}
            <div className="space-y-4">
              <label htmlFor="zip-list-a" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer flex justify-between">
                <span>{t('listzipper.list_a', 'List A')}</span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {listA.split('\n').filter(Boolean).length} {t('common.words', 'items')}
                </span>
              </label>
              <textarea
                id="zip-list-a"
                ref={listARef}
                value={listA}
                onChange={(e) => handleListAChange(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder={t('listzipper.placeholder_a', 'Item A1\nItem A2\nItem A3...')}
                className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base leading-relaxed dark:text-slate-300 resize-none font-mono"
              />
            </div>

            {/* List B */}
            <div className="space-y-4">
              <label htmlFor="zip-list-b" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer flex justify-between">
                <span>{t('listzipper.list_b', 'List B')}</span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {listB.split('\n').filter(Boolean).length} {t('common.words', 'items')}
                </span>
              </label>
              <textarea
                id="zip-list-b"
                value={listB}
                onChange={(e) => handleListBChange(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder={t('listzipper.placeholder_b', 'Item B1\nItem B2\nItem B3...')}
                className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base leading-relaxed dark:text-slate-300 resize-none font-mono"
              />
            </div>
          </div>

          {/* Configuration Settings */}
          <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] grid grid-cols-1 md:grid-cols-3 gap-8 shadow-sm">
            {/* Column 1: Separators */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-500 px-1">
                <Settings2 className="w-4 h-4" aria-hidden="true" />
                <label htmlFor="zip-sep-select" className="font-black uppercase tracking-widest text-[10px] text-slate-400 cursor-pointer">
                  {t('listzipper.sep_label', 'Items Separator')}
                </label>
              </div>
              <select
                id="zip-sep-select"
                value={zipSeparator}
                onChange={(e) => setZipSeparator(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="comma">{t('listseparatorchanger.separator_comma', 'Comma (, )')}</option>
                <option value="semicolon">{t('listseparatorchanger.separator_semicolon', 'Semicolon (; )')}</option>
                <option value="space">{t('listseparatorchanger.separator_space', 'Space')}</option>
                <option value="tab">{t('listseparatorchanger.separator_tab', 'Tab (\\t)')}</option>
                <option value="colon">{t('listzipper.sep_colon', 'Colon (: )')}</option>
                <option value="custom">{t('listseparatorchanger.separator_custom', 'Custom')}</option>
              </select>

              {zipSeparator === 'custom' && (
                <input
                  type="text"
                  value={customZipSep}
                  onChange={(e) => setCustomZipSep(e.target.value)}
                  placeholder="e.g. - "
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
            </div>

            {/* Column 2: Mismatch Strategy */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-500 px-1">
                <Sliders className="w-4 h-4" aria-hidden="true" />
                <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                  {t('listzipper.mismatch_title', 'Mismatched List Sizes')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMismatchStrategy('truncate')}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                    mismatchStrategy === 'truncate'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t('listzipper.opt_truncate', 'Ignore extra')}
                </button>
                <button
                  type="button"
                  onClick={() => setMismatchStrategy('pad')}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                    mismatchStrategy === 'pad'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t('listzipper.opt_pad', 'Pad with value')}
                </button>
              </div>

              {mismatchStrategy === 'pad' && (
                <input
                  id="pad-val"
                  type="text"
                  value={padValue}
                  onChange={(e) => setPadValue(e.target.value)}
                  placeholder={t('listzipper.pad_placeholder', 'N/A')}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
            </div>

            {/* Column 3: Custom wrappers prefix/suffix */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-500 px-1">
                <Settings2 className="w-4 h-4" aria-hidden="true" />
                <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                  {t('listzipper.wrappers_title', 'Prefix & Suffix (Lines)')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="zip-prefix"
                  type="text"
                  value={zipPrefix}
                  onChange={(e) => setZipPrefix(e.target.value)}
                  placeholder={t('lineprefixsuffix.prefix_label', 'Prefix')}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                <input
                  id="zip-suffix"
                  type="text"
                  value={zipSuffix}
                  onChange={(e) => setZipSuffix(e.target.value)}
                  placeholder={t('lineprefixsuffix.suffix_label', 'Suffix')}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          {/* Results Block */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="zip-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
                <ListFilter className="w-4 h-4 text-emerald-500" aria-hidden="true" /> {t('common.output', 'Output')}
              </label>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handleDownloadText(zipResult, `zipped-list-${Date.now()}`)}
                  disabled={!zipResult}
                  className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  title={t('common.download')}
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={handleCopyZip}
                  disabled={!zipResult}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    copiedZip
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copiedZip ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                  {copiedZip ? t('common.copied') : t('common.copy')}
                  <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
                </button>
              </div>
            </div>

            <textarea
              id="zip-output"
              value={zipResult}
              readOnly
              placeholder={t('listzipper.zip_result_placeholder', 'Combined output elements will appear here...')}
              className="w-full h-80 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-base leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
            />
          </div>
        </div>
      ) : (
        // ================== UNZIP OPERATION PANEL ==================
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Quick Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {t('listzipper.presets_label', 'Quick Presets')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyUnzipPreset('keyvalue')}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
              >
                {t('listzipper.preset_unzip_keyvalue', 'Key-Value Split (=)')}
              </button>
              <button
                type="button"
                onClick={() => applyUnzipPreset('email')}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
              >
                {t('listzipper.preset_unzip_email', 'Email Split (@)')}
              </button>
              <button
                type="button"
                onClick={() => applyUnzipPreset('alternating')}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
              >
                {t('listzipper.preset_unzip_alternating', 'Interleaved Lines')}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-indigo-500">
              <Sliders className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('listzipper.unzip_params', 'Split Parameters')}
              </span>
            </div>
            <button
              onClick={handleClear}
              disabled={!combinedInput}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
              <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Box: Joined List Input */}
            <div className="lg:col-span-8 space-y-4">
              <label htmlFor="combined-list-input" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer flex justify-between">
                <span>{t('listzipper.combined_input', 'Combined Joined List')}</span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {combinedInput.split('\n').filter(Boolean).length} {t('common.words', 'items')}
                </span>
              </label>
              <textarea
                id="combined-list-input"
                ref={combinedRef}
                value={combinedInput}
                onChange={(e) => handleCombinedChange(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder={t('listzipper.placeholder_combined', 'Item A1, Item B1\nItem A2, Item B2\nItem A3, Item B3...')}
                className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base leading-relaxed dark:text-slate-300 resize-none font-mono"
              />
            </div>

            {/* Right Box: Split settings */}
            <div className="lg:col-span-4 space-y-6 bg-white dark:bg-slate-900/50 p-6 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-500 px-1">
                  <Sliders className="w-4 h-4" aria-hidden="true" />
                  <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                    {t('listzipper.unzip_strategy', 'Split Method')}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setUnzipStrategy('delimiter')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-black transition-all border ${
                      unzipStrategy === 'delimiter'
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    {t('listzipper.opt_delimiter', 'Split lines by separator')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnzipStrategy('alternating')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-black transition-all border ${
                      unzipStrategy === 'alternating'
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    {t('listzipper.opt_alternating', 'Interleaved alternating lines')}
                  </button>
                </div>
              </div>

              {unzipStrategy === 'delimiter' && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <label htmlFor="unzip-delim-select" className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer">
                      {t('listzipper.split_delimiter', 'Separator Delimiter')}
                    </label>
                    <select
                      id="unzip-delim-select"
                      value={unzipDelimiter}
                      onChange={(e) => setUnzipDelimiter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      <option value="comma">{t('listseparatorchanger.separator_comma', 'Comma (, )')}</option>
                      <option value="semicolon">{t('listseparatorchanger.separator_semicolon', 'Semicolon (; )')}</option>
                      <option value="space">{t('listseparatorchanger.separator_space', 'Space')}</option>
                      <option value="tab">{t('listseparatorchanger.separator_tab', 'Tab (\\t)')}</option>
                      <option value="colon">{t('listzipper.sep_colon', 'Colon (: )')}</option>
                      <option value="custom">{t('listseparatorchanger.separator_custom', 'Custom')}</option>
                    </select>
                  </div>

                  {unzipDelimiter === 'custom' && (
                    <input
                      type="text"
                      value={customUnzipDelim}
                      onChange={(e) => setCustomUnzipDelim(e.target.value)}
                      placeholder="e.g. - "
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dual Split Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Extracted List A */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="unzip-output-a" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                  {t('listzipper.extracted_a', 'Extracted List A')}
                </label>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handleDownloadText(unzipResult.listA, `unzipped-list-A-${Date.now()}`)}
                    disabled={!unzipResult.listA}
                    className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    title={t('common.download')}
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={handleCopyUnzipA}
                    disabled={!unzipResult.listA}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      copiedUnzipA
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {copiedUnzipA ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                    {copiedUnzipA ? t('common.copied') : t('common.copy')}
                    <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
                  </button>
                </div>
              </div>
              <textarea
                id="unzip-output-a"
                value={unzipResult.listA}
                readOnly
                placeholder={t('listzipper.unzip_result_a', 'Extracted list A elements...')}
                className="w-full h-64 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-base leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
              />
            </div>

            {/* Extracted List B */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="unzip-output-b" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                  {t('listzipper.extracted_b', 'Extracted List B')}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadText(unzipResult.listB, `unzipped-list-B-${Date.now()}`)}
                    disabled={!unzipResult.listB}
                    className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    title={t('common.download')}
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={handleCopyUnzipB}
                    disabled={!unzipResult.listB}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      copiedUnzipB
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {copiedUnzipB ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                    {copiedUnzipB ? t('common.copied') : t('common.copy')}
                  </button>
                </div>
              </div>
              <textarea
                id="unzip-output-b"
                value={unzipResult.listB}
                readOnly
                placeholder={t('listzipper.unzip_result_b', 'Extracted list B elements...')}
                className="w-full h-64 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-base leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* About Box / Instructions */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
          <Info className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">
            {t('listzipper.about_title', 'About List Zipper & Unzipper')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'listzipper.about_desc',
              'Zip and unzip multiple text lists together or split them back apart. This tool works entirely client-side in your browser. All your lists remain perfectly secure and never leave your computer.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
