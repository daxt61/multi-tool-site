import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Info, AlertCircle, Copy, Check, Trash2, Download, Sliders, Settings2, Scissors, HelpCircle, ListFilter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface MatchItem {
  index: number;
  full: string;
  groups: string[];
  namedGroups: Record<string, string> | null;
}

const WORKER_CODE = `
  self.onmessage = (e) => {
    const { regex, flags, testText } = e.data;
    try {
      const safeFlags = flags.includes('g') ? flags : flags + 'g';
      const re = new RegExp(regex, safeFlags);
      const matches = [];
      const matchAll = testText.matchAll(re);
      let count = 0;

      for (const match of matchAll) {
        // Build numeric groups cleanly
        const groups = Array.from(match);
        // Build named groups cleanly (Object.create(null) to avoid prototype pollution)
        const namedGroups = match.groups ? Object.assign(Object.create(null), match.groups) : null;

        matches.push({
          index: match.index,
          full: match[0],
          groups,
          namedGroups
        });
        count++;
        if (count >= 5000) break; // Limit matches for client-side DoS mitigation
      }
      self.postMessage({ matches, error: null });
    } catch (e) {
      self.postMessage({ matches: [], error: e.message });
    }
  };
`;

const PATTERNS_LIBRARY = [
  { name: 'Emails', regex: '([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\\.([a-zA-Z]{2,})', flags: 'g', mode: 'match', desc: 'Extract all email addresses' },
  { name: 'URLs', regex: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)', flags: 'g', mode: 'match', desc: 'Extract web addresses' },
  { name: 'IPv4 Addresses', regex: '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)', flags: 'g', mode: 'match', desc: 'Extract IP addresses' },
  { name: 'HTML Tags & Attributes', regex: '<(?<tag>[a-zA-Z0-9]+)(?:\\s+(?<attr>[a-zA-Z0-9-]+)="(?<val>[^"]*)")*\\s*\\/?>', flags: 'g', mode: 'named', desc: 'Extract HTML tags and attributes' },
  { name: 'Key-Value Parameters', regex: '(?<key>[a-zA-Z0-9_]+)=(?<value>[^&\\s]+)', flags: 'g', mode: 'template', desc: 'Extract query string parameters' },
];

const MAX_LENGTH = 100000;

// Strings with `<` or `>` declared outside of JSX to prevent TSX / JSX parsing confusion
const DEFAULT_INPUT_TEXT = 'user_id=102&email=alice@example.com&role=admin\nuser_id=204&email=bob@example.com&role=editor';
const DEFAULT_PATTERN = '(?<key>[a-zA-Z0-9_]+)=(?<value>[^&\\s]+)';
const DEFAULT_REPLACE_TEMPLATE = '$<key> -> $<value>';
const TEMPLATE_INPUT_PLACEHOLDER = 'e.g. $1: $2 or $<name>';
const TEMPLATE_TIP_FALLBACK = 'Use $0 for full match, $1 for Group 1, and $<name> for named groups.';

export function RegexExtractor({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  // References
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const regexInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerUrlRef = useRef<string | null>(null);
  const executionTimerId = useRef<any>(null);

  // States
  const [inputText, setInputText] = useState(initialData?.inputText || DEFAULT_INPUT_TEXT);
  const [pattern, setPattern] = useState(initialData?.pattern || DEFAULT_PATTERN);
  const [flags, setFlags] = useState(initialData?.flags || 'g');

  const [extractMode, setExtractMode] = useState<'match' | 'group' | 'named' | 'template'>(initialData?.extractMode || 'template');
  const [groupIndex, setGroupIndex] = useState<number>(initialData?.groupIndex ?? 1);
  const [namedGroupName, setNamedGroupName] = useState<string>(initialData?.namedGroupName || 'key');
  const [replaceTemplate, setReplaceTemplate] = useState<string>(initialData?.replaceTemplate || DEFAULT_REPLACE_TEMPLATE);

  const [outputSeparator, setOutputSeparator] = useState<'newline' | 'comma' | 'semicolon' | 'space' | 'custom'>(initialData?.outputSeparator || 'newline');
  const [customSeparator, setCustomSeparator] = useState(initialData?.customSeparator || ' | ');

  const [dedupMode, setDedupMode] = useState<'all' | 'unique' | 'unique-ci'>(initialData?.dedupMode || 'all');
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(initialData?.trimWhitespace ?? true);
  const [ignoreEmpty, setIgnoreEmpty] = useState<boolean>(initialData?.ignoreEmpty ?? true);

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  // Sync state up
  useEffect(() => {
    onStateChange?.({
      inputText,
      pattern,
      flags,
      extractMode,
      groupIndex,
      namedGroupName,
      replaceTemplate,
      outputSeparator,
      customSeparator,
      dedupMode,
      trimWhitespace,
      ignoreEmpty,
    });
  }, [
    inputText,
    pattern,
    flags,
    extractMode,
    groupIndex,
    namedGroupName,
    replaceTemplate,
    outputSeparator,
    customSeparator,
    dedupMode,
    trimWhitespace,
    ignoreEmpty,
    onStateChange,
  ]);

  // Init web worker
  useEffect(() => {
    const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
    workerUrlRef.current = URL.createObjectURL(blob);

    return () => {
      if (workerUrlRef.current) URL.revokeObjectURL(workerUrlRef.current);
      if (workerRef.current) workerRef.current.terminate();
      if (executionTimerId.current) clearTimeout(executionTimerId.current);
    };
  }, []);

  // Run Web Worker when inputs change
  useEffect(() => {
    if (!pattern) {
      setMatches([]);
      setError(null);
      setIsLoading(false);
      setDuration(null);
      return;
    }

    if (inputText.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setMatches([]);
      setIsLoading(false);
      return;
    }

    if (workerRef.current) workerRef.current.terminate();
    if (executionTimerId.current) clearTimeout(executionTimerId.current);

    setIsLoading(true);
    setError(null);
    const startTime = performance.now();

    const worker = new Worker(workerUrlRef.current!);
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (executionTimerId.current) clearTimeout(executionTimerId.current);
      setIsLoading(false);
      const { matches: rawMatches, error: workerErr } = e.data;
      setMatches(rawMatches || []);
      setError(workerErr);
      setDuration(Math.round(performance.now() - startTime));
      worker.terminate();
    };

    worker.onerror = () => {
      if (executionTimerId.current) clearTimeout(executionTimerId.current);
      setIsLoading(false);
      setError(t('regextester.worker_error', 'Regex evaluation worker error.'));
      worker.terminate();
    };

    worker.postMessage({ regex: pattern, flags, testText: inputText });

    // Safeguard timeout to prevent CPU locks / ReDoS
    executionTimerId.current = setTimeout(() => {
      worker.terminate();
      setIsLoading(false);
      setError(t('regextester.error_redos', 'Regular expression evaluation took too long. Possible ReDoS vulnerability detected.'));
    }, 2000);

  }, [pattern, flags, inputText, t]);

  // Dynamically extract named groups from the pattern
  const detectedNamedGroups = useMemo(() => {
    const names: string[] = [];
    const namedGroupRegex = /\(\?<([a-zA-Z_$][a-zA-Z0-9_$]*)>/g;
    let match;
    try {
      while ((match = namedGroupRegex.exec(pattern)) !== null) {
        if (!names.includes(match[1])) {
          names.push(match[1]);
        }
      }
    } catch (_) {}
    return names;
  }, [pattern]);

  // Number of capture groups based on matches
  const detectedGroupCount = useMemo(() => {
    if (matches.length > 0 && matches[0].groups) {
      return matches[0].groups.length - 1;
    }
    // Parse opening parenthesis if no matches
    let count = 0;
    try {
      const simplified = pattern.replace(/\\./g, ''); // strip escaped chars
      // Count capturing groups (unescaped '(' not followed by '?')
      const groups = simplified.match(/\((?!\?)/g);
      if (groups) count = groups.length;
    } catch (_) {}
    return count;
  }, [pattern, matches]);

  // Handle Extraction & Formatting on matches list
  const processedOutput = useMemo(() => {
    if (matches.length === 0) return '';

    let results: string[] = [];

    // Helper to format/replace template variables ($1, $2, $<name>)
    const formatWithTemplate = (m: MatchItem, tmpl: string): string => {
      let output = tmpl;

      // 1. Replace named groups $<name>
      if (m.namedGroups) {
        Object.entries(m.namedGroups).forEach(([name, val]) => {
          output = output.replace(new RegExp(`\\$<${name}>`, 'g'), val || '');
        });
      }

      // 2. Replace numeric groups $1, $2, ...
      for (let i = 1; i < m.groups.length; i++) {
        output = output.replace(new RegExp(`\\$${i}`, 'g'), m.groups[i] || '');
      }

      // 3. Replace $0 with full match
      output = output.replace(/\$0/g, m.full);

      return output;
    };

    // Extract item based on chosen mode
    matches.forEach((m) => {
      let val = '';
      if (extractMode === 'match') {
        val = m.full;
      } else if (extractMode === 'group') {
        val = m.groups[groupIndex] !== undefined ? m.groups[groupIndex] : '';
      } else if (extractMode === 'named') {
        val = (m.namedGroups && m.namedGroups[namedGroupName] !== undefined) ? m.namedGroups[namedGroupName] : '';
      } else if (extractMode === 'template') {
        val = formatWithTemplate(m, replaceTemplate);
      }

      if (trimWhitespace) {
        val = val.trim();
      }

      if (ignoreEmpty && val === '') {
        return;
      }

      results.push(val);
    });

    // Handle deduplication using safe Object.create(null) Map
    if (dedupMode !== 'all') {
      const seen = Object.create(null);
      const filtered: string[] = [];
      results.forEach((item) => {
        const key = dedupMode === 'unique-ci' ? item.toLowerCase() : item;
        if (!seen[key]) {
          seen[key] = true;
          filtered.push(item);
        }
      });
      results = filtered;
    }

    // Join output using output separator
    let sep = '\n';
    if (outputSeparator === 'comma') sep = ', ';
    else if (outputSeparator === 'semicolon') sep = '; ';
    else if (outputSeparator === 'space') sep = ' ';
    else if (outputSeparator === 'custom') sep = customSeparator;

    return results.join(sep);
  }, [matches, extractMode, groupIndex, namedGroupName, replaceTemplate, trimWhitespace, ignoreEmpty, dedupMode, outputSeparator, customSeparator]);

  // Cleaners
  const handleClear = useCallback(() => {
    setInputText('');
    setMatches([]);
    setError(null);
    setDuration(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  // Set keyboard handlers via ref to avoid stale closures
  const handlersRef = useRef({ handleClear, processedOutput });
  useEffect(() => {
    handlersRef.current = { handleClear, processedOutput };
  }, [handleClear, processedOutput]);

  // Global keydown with safeguard
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopy = () => {
    if (!processedOutput) return;
    navigator.clipboard.writeText(processedOutput);
    setCopied(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!processedOutput) return;
    const blob = new Blob([processedOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `regex-extracted-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyPattern = (p: typeof PATTERNS_LIBRARY[0]) => {
    setPattern(p.regex);
    setFlags(p.flags);
    setExtractMode(p.mode as any);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Patterns Library */}
      <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-500">
          <HelpCircle className="w-4 h-4" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('regexextractor.preset_patterns', 'Preset Extraction Library')}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {PATTERNS_LIBRARY.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPattern(p)}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-850 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all flex flex-col items-start gap-1"
              title={p.desc}
            >
              <span className="dark:text-slate-200 font-black">{p.name}</span>
              <code className="text-[10px] text-slate-400 font-mono max-w-[200px] truncate">{p.regex}</code>
            </button>
          ))}
        </div>
      </div>

      {/* Regex and Flags Card */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="extractor-pattern-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-500" />
            {t('regexextractor.pattern_label', 'Regular Expression Pattern')}
          </label>
          <div className="flex items-center gap-2">
            <Kbd modifier={null} className="text-[10px] text-rose-400 border-rose-200 dark:border-rose-800 dark:bg-slate-900">Esc</Kbd>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('common.clear', 'Clear')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-10 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 font-mono text-lg">/</div>
            <input
              id="extractor-pattern-input"
              ref={regexInputRef}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. (?<key>\w+)=(?<value>[^&\s]+)"
              className="w-full pl-8 pr-16 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 font-mono text-lg">/{flags}</div>
          </div>

          <div className="md:col-span-2">
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              placeholder="flags (e.g. g, i)"
              className="w-full py-4 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              title="Regex flags: g (global), i (case-insensitive), m (multiline), s (dotAll), u (unicode)"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Text Area */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="extractor-text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-indigo-500" />
              {t('regexextractor.input_text_label', 'Input Text to Extract From')}
            </label>
            <button
              onClick={handleClear}
              disabled={!inputText}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('common.clear', 'Clear')}
            </button>
          </div>

          <textarea
            id="extractor-text-input"
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={t('regexextractor.input_placeholder', 'Paste log files, URL parameters, CSV data, or any plain text here...')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-base leading-relaxed dark:text-slate-300 resize-none font-mono"
          />

          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mt-auto">
            <span>{t('regexextractor.stats_matches', 'Total Matches')}: <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm font-black">{matches.length}</span></span>
            {duration !== null && (
              <span>{t('regexextractor.stats_duration', 'Evaluation time')}: <span className="font-mono text-amber-600 dark:text-amber-400 text-sm font-black">{duration}ms</span></span>
            )}
          </div>
        </div>

        {/* Dynamic Controls Pane */}
        <div className="lg:col-span-4 space-y-6">
          {/* Target Extraction Mode */}
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Sliders className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('regexextractor.target_title', 'Extraction Target')}</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'match', label: t('regexextractor.target_match', 'Full Match ($0)') },
                { id: 'group', label: t('regexextractor.target_group', 'Capture Group ($1...)') },
                { id: 'named', label: t('regexextractor.target_named', 'Named Group') },
                { id: 'template', label: t('regexextractor.target_template', 'Format Template') },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setExtractMode(opt.id as any)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-black transition-all border ${
                    extractMode === opt.id
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Sub-mode inputs */}
            {extractMode === 'group' && (
              <div className="space-y-2 animate-in fade-in duration-200 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label htmlFor="group-idx-input" className="text-[10px] font-bold text-slate-400 uppercase">
                  {t('regexextractor.group_index_label', 'Capture Group Index')} ({t('regexextractor.detected', 'Detected')}: <span className="font-mono font-bold text-indigo-500">{detectedGroupCount}</span>)
                </label>
                <div className="flex gap-2">
                  <input
                    id="group-idx-input"
                    type="number"
                    min="1"
                    max="99"
                    value={groupIndex}
                    onChange={(e) => setGroupIndex(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                    className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {Array.from({ length: Math.min(5, detectedGroupCount) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setGroupIndex(i + 1)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          groupIndex === i + 1
                            ? 'bg-indigo-500 text-white border-indigo-500'
                            : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-850 dark:border-slate-700'
                        }`}
                      >
                        Group {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {extractMode === 'named' && (
              <div className="space-y-2 animate-in fade-in duration-200 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label htmlFor="named-group-input" className="text-[10px] font-bold text-slate-400 uppercase">
                  {t('regexextractor.named_group_label', 'Capture Group Name')}
                </label>
                <input
                  id="named-group-input"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={namedGroupName}
                  onChange={(e) => setNamedGroupName(e.target.value)}
                  placeholder="e.g. key"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                />
                {detectedNamedGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center pt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{t('regexextractor.detected_groups', 'Detected Groups')}:</span>
                    {detectedNamedGroups.map((g) => (
                      <button
                        key={g}
                        onClick={() => setNamedGroupName(g)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all border ${
                          namedGroupName === g
                            ? 'bg-indigo-500 text-white border-indigo-500'
                            : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-850 dark:border-slate-700'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {extractMode === 'template' && (
              <div className="space-y-2 animate-in fade-in duration-200 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <label htmlFor="template-format-input" className="text-[10px] font-bold text-slate-400 uppercase">
                    {t('regexextractor.template_format_label', 'Format Replacement Template')}
                  </label>
                  <span className="text-[9px] text-slate-400 italic">e.g. $1 -{'>'} $2</span>
                </div>
                <input
                  id="template-format-input"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={replaceTemplate}
                  onChange={(e) => setReplaceTemplate(e.target.value)}
                  placeholder={TEMPLATE_INPUT_PLACEHOLDER}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                />
                <p className="text-[9px] text-slate-400 leading-relaxed italic">
                  {t('regexextractor.template_tip', TEMPLATE_TIP_FALLBACK)}
                </p>
              </div>
            )}
          </div>

          {/* Filtering and Unique Rules */}
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('regexextractor.rules_title', 'Extraction Filtering & Deduplication')}</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('regexextractor.uniqueness_label', 'Deduplication Mode')}</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'all', label: t('regexextractor.uniqueness_all', 'All Matches') },
                    { id: 'unique', label: t('regexextractor.uniqueness_unique', 'Unique (CS)') },
                    { id: 'unique-ci', label: t('regexextractor.uniqueness_unique_ci', 'Unique (CI)') },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setDedupMode(opt.id as any)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                        dedupMode === opt.id
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-850 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={trimWhitespace}
                    onChange={(e) => setTrimWhitespace(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    {t('regexextractor.trim_label', 'Trim whitespace from extracted')}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={ignoreEmpty}
                    onChange={(e) => setIgnoreEmpty(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    {t('regexextractor.ignore_empty_label', 'Ignore empty extraction results')}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Output Text Area */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="extractor-text-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-emerald-500" />
              {t('common.output', 'Output')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!processedOutput}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                title={t('common.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!processedOutput}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
              </button>
            </div>
          </div>

          <textarea
            id="extractor-text-output"
            value={processedOutput}
            readOnly
            placeholder={t('regexextractor.output_placeholder', 'Extracted regex matches will show here...')}
            className="w-full h-80 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-base leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
          />

          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mt-auto">
            <span>{t('regexextractor.output_count', 'Matching Results')}: <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm font-black">{processedOutput ? processedOutput.split(/\r?\n|, |; | /).length : 0}</span></span>
          </div>
        </div>
      </div>

      {/* Advanced Formatting: Output separator */}
      <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm max-w-2xl mx-auto">
        <div className="flex items-center gap-3 text-indigo-500">
          <Settings2 className="w-5 h-5" />
          <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">{t('regexextractor.formatting_title', 'Extraction Separator & Joining')}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
          <div className="space-y-1.5">
            <label htmlFor="extractor-separator-select" className="text-[10px] font-bold text-slate-400 uppercase">
              {t('regexextractor.output_delim', 'Output Join Separator')}
            </label>
            <select
              id="extractor-separator-select"
              value={outputSeparator}
              onChange={(e) => setOutputSeparator(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
            >
              <option value="newline">{t('regexextractor.sep_newline', 'New Line (\\n)')}</option>
              <option value="comma">{t('regexextractor.sep_comma', 'Comma (, )')}</option>
              <option value="semicolon">{t('regexextractor.sep_semicolon', 'Semicolon (; )')}</option>
              <option value="space">{t('regexextractor.sep_space', 'Space ( )')}</option>
              <option value="custom">{t('regexextractor.sep_custom', 'Custom String')}</option>
            </select>
          </div>

          {outputSeparator === 'custom' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label htmlFor="extractor-custom-sep-input" className="text-[10px] font-bold text-slate-400 uppercase">
                {t('regexextractor.custom_sep_label', 'Custom Separator String')}
              </label>
              <input
                id="extractor-custom-sep-input"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={customSeparator}
                onChange={(e) => setCustomSeparator(e.target.value)}
                placeholder="e.g. ---"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Guide Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('regexextractor.about_title', 'About Regex Match Extractor')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('regexextractor.about_text', 'An extremely customizable, fast, and secure tool to search, extract, format, and deduplicate information from raw text files using regular expressions. Extract full matches, numeric capture groups (like $1, $2), named capture groups, or assemble custom strings with complete replacement templates. Evaluation is done asynchronously inside a Web Worker, ensuring robust protection against catastrophic backtracking (ReDoS) or thread freezes.')}
          </p>
        </div>
      </div>
    </div>
  );
}
