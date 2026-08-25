import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Scissors,
  Copy,
  Trash2,
  Download,
  Check,
  Sparkles,
  Info,
  Type,
  AlignLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface ListTruncatorProps {
  initialData?: any;
  onStateChange?: (state: any) => void;
}

const MAX_LENGTH = 100000;

const PRESETS = {
  urls: {
    nameKey: 'listtruncator.preset_urls',
    mode: 'char' as const,
    maxChars: 45,
    data: `https://example.com/api/v1/users/analytics/reports/summary?session=xyz123456789&source=dashboard
https://example.com/blog/posts/2024/03/15/how-to-optimize-react-performance-in-large-scale-applications
https://example.com/docs/getting-started/installation-and-configuration-guide#step-3`,
  },
  first_logs: {
    nameKey: 'listtruncator.preset_first_logs',
    mode: 'line' as const,
    maxLines: 5,
    linePosition: 'head' as const,
    data: `[2024-03-20 10:00:01] [INFO] Application server starting...
[2024-03-20 10:00:02] [INFO] Database connection pool initialized.
[2024-03-20 10:00:03] [DEBUG] Cache warmed up with 1,250 entries.
[2024-03-20 10:00:05] [INFO] HTTP server listening on port 8080.
[2024-03-20 10:01:12] [WARN] High memory usage detected: 82% threshold reached.
[2024-03-20 10:02:00] [ERROR] Payment gateway timeout on transaction #9081.
[2024-03-20 10:02:05] [INFO] Retrying transaction #9081 (Attempt 2/3)...
[2024-03-20 10:02:10] [INFO] Transaction #9081 completed successfully.`,
  },
  titles: {
    nameKey: 'listtruncator.preset_titles',
    mode: 'char' as const,
    maxChars: 30,
    ellipsis: '...',
    data: `Understanding the Modern Web Ecosystem and JavaScript Tooling
Comprehensive Guide to Software Architecture and Design Patterns
Top 10 Security Best Practices for Cloud Native Applications`,
  },
  hashes: {
    nameKey: 'listtruncator.preset_hashes',
    mode: 'char' as const,
    maxChars: 12,
    ellipsis: '',
    data: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
59264287382223747f20257321e06d9d1ebf40f06a0149021e1498b3f23a9b1c`,
  },
};

export const ListTruncator: React.FC<ListTruncatorProps> = ({
  initialData,
  onStateChange,
}) => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState<string>(
    initialData?.inputText || PRESETS.urls.data
  );
  const [truncationMode, setTruncationMode] = useState<'char' | 'line'>(
    initialData?.truncationMode || 'char'
  );
  const [maxChars, setMaxChars] = useState<number>(
    initialData?.maxChars || 45
  );
  const [ellipsis, setEllipsis] = useState<string>(
    initialData?.ellipsis !== undefined ? initialData.ellipsis : '...'
  );
  const [ellipsisPosition, setEllipsisPosition] = useState<
    'end' | 'middle' | 'start'
  >(initialData?.ellipsisPosition || 'end');

  const [maxLines, setMaxLines] = useState<number>(
    initialData?.maxLines || 5
  );
  const [linePosition, setLinePosition] = useState<'head' | 'tail'>(
    initialData?.linePosition || 'head'
  );
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(
    initialData?.trimWhitespace !== undefined ? initialData.trimWhitespace : true
  );

  const [copied, setCopied] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Process input text into truncated output
  const outputText = useMemo(() => {
    if (!inputText.trim()) return '';

    let lines = inputText.split(/\r?\n/);

    if (trimWhitespace) {
      lines = lines.map((l) => l.trim());
    }

    if (truncationMode === 'line') {
      if (lines.length > maxLines) {
        if (linePosition === 'head') {
          lines = lines.slice(0, maxLines);
        } else {
          lines = lines.slice(-maxLines);
        }
      }
      return lines.join('\n');
    }

    // Character truncation mode
    return lines
      .map((line) => {
        if (line.length <= maxChars) return line;

        const elLen = ellipsis.length;
        const targetLen = Math.max(1, maxChars - elLen);

        if (ellipsisPosition === 'end') {
          return line.slice(0, targetLen) + ellipsis;
        } else if (ellipsisPosition === 'start') {
          return ellipsis + line.slice(line.length - targetLen);
        } else {
          // Middle truncation
          const half = Math.floor(targetLen / 2);
          const firstHalf = line.slice(0, half);
          const secondHalf = line.slice(line.length - (targetLen - half));
          return `${firstHalf}${ellipsis}${secondHalf}`;
        }
      })
      .join('\n');
  }, [
    inputText,
    truncationMode,
    maxChars,
    ellipsis,
    ellipsisPosition,
    maxLines,
    linePosition,
    trimWhitespace,
  ]);

  // Statistics calculation
  const stats = useMemo(() => {
    const inputLines = inputText ? inputText.split(/\r?\n/).length : 0;
    const outputLines = outputText ? outputText.split(/\r?\n/).length : 0;
    const inputChars = inputText.length;
    const outputChars = outputText.length;
    const reduction =
      inputChars > 0
        ? Math.max(0, Math.round(((inputChars - outputChars) / inputChars) * 100))
        : 0;

    return {
      inputLines,
      outputLines,
      inputChars,
      outputChars,
      reduction,
    };
  }, [inputText, outputText]);

  // Sync state upward
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        inputText,
        truncationMode,
        maxChars,
        ellipsis,
        ellipsisPosition,
        maxLines,
        linePosition,
        trimWhitespace,
      });
    }
  }, [
    inputText,
    truncationMode,
    maxChars,
    ellipsis,
    ellipsisPosition,
    maxLines,
    linePosition,
    trimWhitespace,
    onStateChange,
  ]);

  const handleCopy = useCallback(() => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    toast.success(t('listtruncator.toast_copied', 'Truncated list copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [outputText, t]);

  const handleClear = useCallback(() => {
    setInputText('');
    toast.success(t('listtruncator.toast_cleared', 'Input cleared!'));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [t]);

  const handleDownload = useCallback(() => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `truncated_list_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('listtruncator.toast_downloaded', 'List downloaded!'));
  }, [outputText, t]);

  const handleLoadPreset = useCallback(
    (key: keyof typeof PRESETS) => {
      const preset: any = PRESETS[key];
      setInputText(preset.data);
      setTruncationMode(preset.mode);
      if (preset.maxChars !== undefined) setMaxChars(preset.maxChars);
      if (preset.maxLines !== undefined) setMaxLines(preset.maxLines);
      if (preset.linePosition !== undefined) setLinePosition(preset.linePosition);
      if (preset.ellipsis !== undefined) setEllipsis(preset.ellipsis);
      toast.success(t('listtruncator.toast_preset_loaded', 'Preset loaded!'));
    },
    [t]
  );

  // Keyboard shortcut handlers pattern
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable);

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !isEditable) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-6" data-testid="list-truncator-container">
      {/* Presets Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('listtruncator.presets', 'Quick Presets')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => (
            <button
              key={key}
              onClick={() => handleLoadPreset(key)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {t(PRESETS[key].nameKey, key)}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {t('listtruncator.truncation_mode', 'Truncation Mode')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTruncationMode('char')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                truncationMode === 'char'
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {t('listtruncator.mode_char', 'By Line Character Length')}
            </button>
            <button
              onClick={() => setTruncationMode('line')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                truncationMode === 'line'
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {t('listtruncator.mode_line', 'By Total Line Count')}
            </button>
          </div>
        </div>

        {/* Character Truncation Controls */}
        {truncationMode === 'char' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="max-chars-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                {t('listtruncator.max_chars', 'Max Length per Line')}
              </label>
              <input
                id="max-chars-input"
                type="number"
                min={1}
                max={1000}
                value={maxChars}
                onChange={(e) => setMaxChars(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="ellipsis-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                {t('listtruncator.ellipsis', 'Ellipsis String')}
              </label>
              <input
                id="ellipsis-input"
                type="text"
                value={ellipsis}
                onChange={(e) => setEllipsis(e.target.value)}
                placeholder="e.g. ..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="ellipsis-position-select"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                {t('listtruncator.ellipsis_position', 'Ellipsis Position')}
              </label>
              <select
                id="ellipsis-position-select"
                value={ellipsisPosition}
                onChange={(e) => setEllipsisPosition(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="end">End of Line (text...)</option>
                <option value="middle">Middle of Line (te...xt)</option>
                <option value="start">Start of Line (...text)</option>
              </select>
            </div>
          </div>
        )}

        {/* Line Count Truncation Controls */}
        {truncationMode === 'line' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="max-lines-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                {t('listtruncator.max_lines', 'Total Lines to Keep')}
              </label>
              <input
                id="max-lines-input"
                type="number"
                min={1}
                max={10000}
                value={maxLines}
                onChange={(e) => setMaxLines(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="line-position-select"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                {t('listtruncator.line_position', 'Line Selection')}
              </label>
              <select
                id="line-position-select"
                value={linePosition}
                onChange={(e) => setLinePosition(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="head">Keep First N Lines (Head)</option>
                <option value="tail">Keep Last N Lines (Tail)</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={trimWhitespace}
              onChange={(e) => setTrimWhitespace(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('listtruncator.trim_whitespace', 'Trim whitespace from line edges')}
            </span>
          </label>
        </div>
      </div>

      {/* Live Stats Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
        <div>
          <span className="block text-[10px] font-bold uppercase text-slate-400">
            Input Lines / Chars
          </span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
            {stats.inputLines} / {stats.inputChars}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-slate-400">
            Output Lines / Chars
          </span>
          <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
            {stats.outputLines} / {stats.outputChars}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-slate-400">
            Char Reduction
          </span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
            -{stats.reduction}%
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-slate-400">
            Active Mode
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
            {truncationMode === 'char' ? `${maxChars} Chars/Line` : `${maxLines} Lines (${linePosition})`}
          </span>
        </div>
      </div>

      {/* Main Input / Output Textareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input List */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="list-truncator-input"
              className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
              <Type className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listtruncator.input_label', 'Original Text List')}
            </label>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{inputText.length} / {MAX_LENGTH}</span>
              <button
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                title={t('common.clear', 'Clear')}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <textarea
            id="list-truncator-input"
            ref={inputRef}
            rows={12}
            value={inputText}
            maxLength={MAX_LENGTH}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('listtruncator.placeholder_input', 'Enter or paste list items here...')}
            className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        {/* Right: Output Truncated List */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="list-truncator-output"
              className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
              <Scissors className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              {t('listtruncator.output_label', 'Truncated Result')}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!outputText}
                className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {t('common.copy', 'Copy')} <Kbd className="ml-1 text-[10px]">C</Kbd>
              </button>
              <button
                onClick={handleDownload}
                disabled={!outputText}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                {t('common.download', 'Download')}
              </button>
            </div>
          </div>
          <textarea
            id="list-truncator-output"
            readOnly
            rows={12}
            value={outputText}
            placeholder={t('listtruncator.placeholder_output', 'Truncated list will appear here...')}
            className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none"
          />
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> {t('common.clear', 'Clear & Focus')}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>C</Kbd> {t('common.copy', 'Copy Output')}
          </span>
        </div>
        <span className="text-[11px] opacity-75">
          100% Client-side List Truncation
        </span>
      </div>
    </div>
  );
};

export default ListTruncator;
