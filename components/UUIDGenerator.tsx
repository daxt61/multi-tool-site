import { useState, useCallback, useEffect, useRef } from 'react';
import { Copy, Check, RefreshCw, Trash2, Fingerprint, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

export function UUIDGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  // Input elements refs for focus restoration
  const countInputRef = useRef<HTMLInputElement>(null);

  // States
  const [uuids, setUuids] = useState<string[]>(initialData?.uuids || []);
  const [count, setCount] = useState(() => {
    const val = parseInt(initialData?.count, 10);
    return isNaN(val) ? 1 : Math.min(100, Math.max(1, val));
  });
  const [version, setVersion] = useState<'v4' | 'v7'>(initialData?.version || 'v4');

  // Premium Formatting Options
  const [uppercase, setUppercase] = useState<boolean>(initialData?.uppercase ?? false);
  const [braces, setBraces] = useState<boolean>(initialData?.braces ?? false);
  const [hyphens, setHyphens] = useState<boolean>(initialData?.hyphens ?? true);
  const [prefix, setPrefix] = useState<string>(initialData?.prefix || '');
  const [suffix, setSuffix] = useState<string>(initialData?.suffix || '');
  const [delimiter, setDelimiter] = useState<string>(initialData?.delimiter || 'newline');
  const [customDelimiter, setCustomDelimiter] = useState<string>(initialData?.customDelimiter || '');

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Generate UUID functions
  const generateUUIDV4 = useCallback(() => {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;
    const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }, []);

  const generateUUIDV7 = useCallback(() => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);

    const timestamp = Date.now();
    const timestampBytes = new Uint8Array(6);
    const view = new DataView(timestampBytes.buffer);
    // JS dates are 53-bit integers, we need the 48 most significant bits for UUID v7
    // DataView doesn't have setUint48, so we do it manually
    view.setUint32(0, Math.floor(timestamp / 0x10000), false);
    view.setUint16(4, timestamp % 0x10000, false);

    array.set(timestampBytes, 0);

    // Set version 7 (binary 0111)
    array[6] = (array[6] & 0x0f) | 0x70;
    // Set variant (binary 10xx)
    array[8] = (array[8] & 0x3f) | 0x80;

    const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }, []);

  const generateUUID = useCallback(() => {
    return version === 'v4' ? generateUUIDV4() : generateUUIDV7();
  }, [version, generateUUIDV4, generateUUIDV7]);

  const generateUUIDs = useCallback(() => {
    const newUuids = [];
    const safeCount = Math.min(Math.max(1, count), 100);
    for (let i = 0; i < safeCount; i++) {
      newUuids.push(generateUUID());
    }
    setUuids(newUuids);
    setCopiedIndex(null);
    setCopiedAll(false);
    toast.success(t('uuid.generate_success', { count: safeCount }));
  }, [count, generateUUID, t]);

  // Sync state with url sharing
  useEffect(() => {
    onStateChange?.({
      uuids,
      count,
      version,
      uppercase,
      braces,
      hyphens,
      prefix,
      suffix,
      delimiter,
      customDelimiter
    });
  }, [uuids, count, version, uppercase, braces, hyphens, prefix, suffix, delimiter, customDelimiter, onStateChange]);

  // Format single UUID based on options
  const formatSingleUUID = useCallback((rawUuid: string) => {
    let formatted = rawUuid;
    if (!hyphens) {
      formatted = formatted.replace(/-/g, '');
    }
    if (uppercase) {
      formatted = formatted.toUpperCase();
    } else {
      formatted = formatted.toLowerCase();
    }
    if (braces) {
      formatted = `{${formatted}}`;
    }
    return `${prefix}${formatted}${suffix}`;
  }, [hyphens, uppercase, braces, prefix, suffix]);

  const formattedUuids = uuids.map(formatSingleUUID);

  const getDelimiterString = useCallback(() => {
    if (delimiter === 'newline') return '\n';
    if (delimiter === 'comma') return ', ';
    if (delimiter === 'semicolon') return '; ';
    if (delimiter === 'space') return ' ';
    if (delimiter === 'custom') return customDelimiter;
    return '\n';
  }, [delimiter, customDelimiter]);

  const copyToClipboard = useCallback((uuid: string, index: number) => {
    const textToCopy = formatSingleUUID(uuid);
    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    toast.success(t('uuid.copied_single'));
    setTimeout(() => setCopiedIndex(null), 2000);
  }, [formatSingleUUID, t]);

  const copyAll = useCallback(() => {
    const delimiterStr = getDelimiterString();
    const allText = formattedUuids.join(delimiterStr);
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    toast.success(t('uuid.copied_all'));
    setTimeout(() => setCopiedAll(false), 2000);
  }, [formattedUuids, getDelimiterString, t]);

  const handleClear = useCallback(() => {
    setUuids([]);
    setCopiedIndex(null);
    setCopiedAll(false);
    toast.success(t('uuid.cleared'));
    // Programmatic focus restoration
    if (countInputRef.current) {
      countInputRef.current.focus();
    }
  }, [t]);

  const handleDownload = useCallback(() => {
    if (uuids.length === 0) return;
    const delimiterStr = getDelimiterString();
    const fileContent = formattedUuids.join(delimiterStr);
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uuids-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('uuid.download_success'));
  }, [uuids.length, formattedUuids, getDelimiterString, t]);

  // Safe global/local keyboard listener using useRef to avoid stale closures
  const handlersRef = useRef({ handleClear, generateUUIDs, copyAll, uuids });
  useEffect(() => {
    handlersRef.current = { handleClear, generateUUIDs, copyAll, uuids };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing shortcuts when user is typing in editable inputs/textarea
      const active = document.activeElement;
      const isEditable = active && (
        active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.tagName === "SELECT" ||
        active.getAttribute("contenteditable") === "true"
      );

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key === 'Enter') {
        // Trigger generate only if not focused on another interactive button
        if (active?.tagName !== 'BUTTON' && active?.tagName !== 'A') {
          e.preventDefault();
          handlersRef.current.generateUUIDs();
        }
      } else if (e.key.toLowerCase() === 'c' && !isEditable) {
        if (handlersRef.current.uuids.length > 0) {
          e.preventDefault();
          handlersRef.current.copyAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left">
      <div className="flex justify-end items-center gap-2 px-1">
        <button
          onClick={handleDownload}
          disabled={uuids.length === 0}
          className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Download className="w-3 h-3" /> {t('common.download')}
        </button>
        <button
          onClick={handleClear}
          disabled={uuids.length === 0}
          aria-label={t('common.clear')}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> {t('common.clear')}
          <Kbd modifier={null} className="ml-1 bg-white/50 dark:bg-black/20 border-rose-200 dark:border-rose-800">Esc</Kbd>
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="uuid-version" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1 cursor-pointer">
              {t('uuid.version_label')}
            </label>
            <select
              id="uuid-version"
              value={version}
              onChange={(e) => setVersion(e.target.value as 'v4' | 'v7')}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white cursor-pointer"
            >
              <option value="v4">UUID v4 (Random)</option>
              <option value="v7">UUID v7 (Time-ordered)</option>
            </select>
          </div>
          <div>
            <label htmlFor="uuid-count" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1 cursor-pointer">
              {t('uuid.count_label')}
            </label>
            <input
              id="uuid-count"
              ref={countInputRef}
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1)))}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Formatting Expandable / Parameter sections */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6 space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">
            {t('uuid.formatting_options')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setUppercase(!uppercase)}
              aria-pressed={uppercase}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                uppercase
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <span className="font-bold text-sm">{t('uuid.uppercase_label')}</span>
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                uppercase ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {uppercase && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            <button
              onClick={() => setBraces(!braces)}
              aria-pressed={braces}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                braces
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <span className="font-bold text-sm">{t('uuid.braces_label')}</span>
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                braces ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {braces && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            <button
              onClick={() => setHyphens(!hyphens)}
              aria-pressed={hyphens}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                hyphens
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <span className="font-bold text-sm">{t('uuid.hyphens_label')}</span>
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                hyphens ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {hyphens && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="uuid-prefix" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1 cursor-pointer">
                {t('uuid.prefix_label')}
              </label>
              <input
                id="uuid-prefix"
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="ex: id_"
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white font-mono"
              />
            </div>
            <div>
              <label htmlFor="uuid-suffix" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1 cursor-pointer">
                {t('uuid.suffix_label')}
              </label>
              <input
                id="uuid-suffix"
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="ex: _test"
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="uuid-delimiter" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1 cursor-pointer">
                {t('uuid.delimiter_label')}
              </label>
              <select
                id="uuid-delimiter"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white cursor-pointer"
              >
                <option value="newline">{t('listseparatorchanger.separator_newline')}</option>
                <option value="comma">{t('listseparatorchanger.separator_comma')}</option>
                <option value="semicolon">{t('listseparatorchanger.separator_semicolon')}</option>
                <option value="space">{t('listseparatorchanger.separator_space')}</option>
                <option value="custom">{t('listseparatorchanger.separator_custom')}</option>
              </select>
            </div>
            {delimiter === 'custom' && (
              <div>
                <label htmlFor="uuid-custom-delimiter" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1 cursor-pointer">
                  {t('listseparatorchanger.custom_delimiter_label')}
                </label>
                <input
                  id="uuid-custom-delimiter"
                  type="text"
                  value={customDelimiter}
                  onChange={(e) => setCustomDelimiter(e.target.value)}
                  placeholder="ex: -|-"
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full mt-6">
          <button
            onClick={generateUUIDs}
            className="w-full px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none group"
          >
            <RefreshCw className="w-5 h-5 transition-transform group-hover:rotate-180" />
            <span>{t('random.generate')}</span>
            <Kbd modifier={null} className="ml-1 bg-indigo-500/50 border-indigo-400 text-indigo-100">Enter</Kbd>
          </button>
        </div>

        {uuids.length > 1 && (
          <button
            onClick={copyAll}
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border mt-4 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              copiedAll
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {copiedAll ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            <span>{copiedAll ? t('common.copied') : t('passwordgenerator.copy_all')}</span>
            <Kbd modifier={null} className="ml-1 bg-white/50 dark:bg-black/20 border-slate-300 dark:border-slate-600">C</Kbd>
          </button>
        )}
      </div>

      {uuids.length > 0 ? (
        <div
          className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
          aria-live="polite"
          aria-atomic="true"
        >
          {uuids.map((uuid, index) => {
            const formatted = formatSingleUUID(uuid);
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all group"
              >
                <code className="font-mono text-sm md:text-base text-slate-700 dark:text-slate-300 break-all">{formatted}</code>
                <button
                  onClick={() => copyToClipboard(uuid, index)}
                  className={`p-2.5 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    copiedIndex === index
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                  }`}
                  aria-label={t('common.copy')}
                >
                  {copiedIndex === index ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5 transition-transform group-hover:scale-110" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-16 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
            <Fingerprint className="w-8 h-8 transition-transform hover:scale-110" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{t('uuid.empty_title')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('uuid.empty_hint')}</p>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl p-6 text-sm text-indigo-900 dark:text-indigo-400 flex gap-4 items-start">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500">
          <Fingerprint className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold mb-1">{t('uuid.about_title')}</p>
          <p className="opacity-80 leading-relaxed">
            {t('uuid.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
