import { useState, useEffect, useRef, useCallback } from 'react';
import { Link as LinkIcon, Copy, Check, Trash2, Download, AlertCircle, List, Filter, Sparkles, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

export function URLExtractor({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [urls, setUrls] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & options
  const [domainFilter, setDomainFilter] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<'all' | 'https' | 'http'>('all');
  const [deduplicate, setDeduplicate] = useState(true);
  const [urlDecode, setUrlDecode] = useState(false);
  const [cleanTrailing, setCleanTrailing] = useState(true);

  // Quick Presets
  const presets = [
    {
      id: 'webpage',
      label: t('urlextractor.preset_webpage', 'Sample HTML Page'),
      value: `<div class="content">
  <p>Check out our docs at https://docs.example.com/api/v1/start and visit <a href="https://example.com/pricing?ref=promo">our pricing page</a>!</p>
  <p>For support, visit http://support.example.org or CDN assets at https://cdn.example.com/images/hero.png?v=2.</p>
  <p>Legacy endpoint: http://api.oldservice.io/v0/data.json</p>
</div>`
    },
    {
      id: 'social',
      label: t('urlextractor.preset_social', 'Social Media Posts'),
      value: `Exciting announcement! Read our full blog post here: https://blog.techcompany.com/2025/02/launch-day.
Also follow us on Twitter https://twitter.com/techcompany or check out github https://github.com/techcompany/repo!
For video tutorials, watch https://youtube.com/watch?v=dQw4w9WgXcQ`
    },
    {
      id: 'markdown',
      label: t('urlextractor.preset_markdown', 'Markdown Links'),
      value: `# Resource List

- [Official Documentation](https://developer.mozilla.org/en-US/docs/Web)
- [React Framework](https://react.dev/learn)
- [Tailwind CSS Docs](https://tailwindcss.com/docs/installation)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Encoded URL Example](https://example.com/search?q=hello%20world&cat=dev%26test)`
    }
  ];

  const extractUrls = useCallback((val: string) => {
    if (!val.trim()) {
      setUrls([]);
      setError(null);
      return;
    }
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setUrls([]);
      return;
    }
    setError(null);

    // Regex for URLs
    const urlRegex = /(https?:\/\/[^\s<>\uff02\uff07\u201c\u201d\uff02"'`]+[^\s.,!?;:<>\uff02\uff07\u201c\u201d\uff02"'`])/gi;
    const matches = val.match(urlRegex);

    if (!matches) {
      setUrls([]);
      return;
    }

    let processed = matches.map(u => {
      let result = u;
      if (cleanTrailing) {
        // Strip trailing bracket, paren or punctuation if unbalanced
        result = result.replace(/[).,;:]+$/, '');
      }
      if (urlDecode) {
        try {
          result = decodeURIComponent(result);
        } catch {
          // Keep as is if invalid decode
        }
      }
      return result;
    });

    // Apply Protocol Filter
    if (protocolFilter === 'https') {
      processed = processed.filter(u => u.toLowerCase().startsWith('https://'));
    } else if (protocolFilter === 'http') {
      processed = processed.filter(u => u.toLowerCase().startsWith('http://'));
    }

    // Apply Domain Filter
    if (domainFilter.trim()) {
      const filterLower = domainFilter.trim().toLowerCase();
      processed = processed.filter(u => u.toLowerCase().includes(filterLower));
    }

    // Apply Deduplication
    if (deduplicate) {
      processed = Array.from(new Set(processed));
    }

    setUrls(processed);
  }, [cleanTrailing, urlDecode, protocolFilter, domainFilter, deduplicate, t]);

  useEffect(() => {
    onStateChange?.({ text });
    extractUrls(text);
  }, [text, extractUrls, onStateChange]);

  const handleCopy = useCallback(() => {
    if (urls.length === 0) return;
    navigator.clipboard.writeText(urls.join('\n'));
    setCopied(true);
    toast.success(t('urlextractor.copied_toast', { count: urls.length, defaultValue: `Copied ${urls.length} URL(s) to clipboard!` }));
    setTimeout(() => setCopied(false), 2000);
  }, [urls, t]);

  const handleDownload = useCallback(() => {
    if (urls.length === 0) return;
    const blob = new Blob([urls.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted-urls-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('urlextractor.downloaded_toast', 'Downloaded URLs file!'));
  }, [urls, t]);

  const handleClear = useCallback(() => {
    setText('');
    setError(null);
    setUrls([]);
    textareaRef.current?.focus();
    toast.info(t('urlextractor.cleared_toast', 'Cleared all input and results'));
  }, [t]);

  const handleLoadPreset = (presetValue: string, presetName: string) => {
    setText(presetValue);
    toast.success(t('urlextractor.preset_loaded_toast', { name: presetName, defaultValue: `Loaded preset: ${presetName}` }));
  };

  // Keyboard shortcut handlers ref
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
          {t('urlextractor.presets_label', 'Quick Presets:')}
        </span>
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleLoadPreset(preset.value, preset.label)}
            className="text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 rounded-xl transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="extractor-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              {t('common.input')}
            </label>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                Esc
              </kbd>
              <button
                onClick={handleClear}
                disabled={!text}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-hidden cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="extractor-input"
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClear();
              }
            }}
            placeholder={t('urlextractor.placeholder_input', 'Paste raw text, HTML, Markdown, or logs containing URLs here...')}
            className="w-full h-96 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-inner"
          />
        </div>

        {/* Output & Options Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('urlextractor.urls_found', 'URLs Found')}
              </label>
              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full border border-indigo-200 dark:border-indigo-800">
                {urls.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={urls.length === 0}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden cursor-pointer"
                aria-label={t('common.download')}
                title={t('common.download')}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={handleCopy}
                disabled={urls.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden cursor-pointer ${
                  copied
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 shadow-sm'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && (
                  <kbd className="hidden sm:inline-flex items-center justify-center px-1 py-0.2 border border-indigo-400 rounded text-[10px] font-bold bg-indigo-700/50 ml-1">
                    C
                  </kbd>
                )}
              </button>
            </div>
          </div>

          {/* Filter Bar Controls */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Filter className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
              <span>{t('urlextractor.filter_options', 'Filter & Refine Options')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Domain Filter */}
              <div>
                <label htmlFor="domain-filter-input" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('urlextractor.domain_filter_label', 'Filter Domain / Substring:')}
                </label>
                <input
                  id="domain-filter-input"
                  type="text"
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  placeholder={t('urlextractor.domain_filter_placeholder', 'e.g. github.com, api, .org')}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-300"
                />
              </div>

              {/* Protocol Filter */}
              <div>
                <label htmlFor="protocol-select" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('urlextractor.protocol_label', 'Protocol:')}
                </label>
                <select
                  id="protocol-select"
                  value={protocolFilter}
                  onChange={(e) => setProtocolFilter(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-300 cursor-pointer"
                >
                  <option value="all">{t('urlextractor.protocol_all', 'All Protocols (HTTP & HTTPS)')}</option>
                  <option value="https">{t('urlextractor.protocol_https', 'HTTPS Only')}</option>
                  <option value="http">{t('urlextractor.protocol_http', 'HTTP Only')}</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-4 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={deduplicate}
                  onChange={(e) => setDeduplicate(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                {t('urlextractor.deduplicate_toggle', 'Unique URLs (Deduplicate)')}
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={urlDecode}
                  onChange={(e) => setUrlDecode(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                {t('urlextractor.url_decode_toggle', 'URL Decode Parameters (%20 -> space)')}
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={cleanTrailing}
                  onChange={(e) => setCleanTrailing(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                {t('urlextractor.clean_trailing_toggle', 'Clean Trailing Punctuation')}
              </label>
            </div>
          </div>

          {/* Results Display */}
          <div className="w-full h-72 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-y-auto shadow-inner">
            {urls.length > 0 ? (
              <ul className="space-y-2.5">
                {urls.map((url, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 group hover:border-indigo-500/40 transition-all shadow-2xs">
                    <LinkIcon className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" aria-hidden="true" />
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <List className="w-8 h-8 opacity-20" aria-hidden="true" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">
                  {t('urlextractor.no_urls', 'No URLs Found')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
