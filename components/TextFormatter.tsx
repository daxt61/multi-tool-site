import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';
import {
  Copy, Check, Trash2, Search, Replace, CaseSensitive,
  Type, AlignLeft, Hash, Clock, Sliders, Download, Sparkles, AlertTriangle
} from 'lucide-react';

const MAX_LENGTH = 100000;

export function TextFormatter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState<string>(initialData?.text || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [findText, setFindText] = useState<string>(initialData?.findText || '');
  const [replaceText, setReplaceText] = useState<string>(initialData?.replaceText || '');
  const [isCaseSensitive, setIsCaseSensitive] = useState<boolean>(initialData?.isCaseSensitive ?? false);

  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ text, findText, replaceText, isCaseSensitive });
  }, [text, findText, replaceText, isCaseSensitive]);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t('textformatter.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
    setFindText('');
    setReplaceText('');
    toast.success(t('textformatter.toast_cleared'));
    textInputRef.current?.focus();
  };

  const handleReplace = () => {
    if (!findText) return;
    const flags = isCaseSensitive ? 'g' : 'gi';
    const escapedFind = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedFind, flags);
    const updated = text.replace(regex, () => replaceText);
    setText(updated);
    toast.success(t('textformatter.toast_replaced'));
  };

  const handleDownload = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'texte_formate.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('textformatter.toast_downloaded'));
  };

  const handlePreset = (presetText: string) => {
    setText(presetText);
    toast.success(t('textformatter.toast_preset_loaded'));
    textInputRef.current?.focus();
  };

  // Keyboard shortcut handlers ref
  const handlersRef = useRef({ handleClear, handleCopy, text });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, text };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;
      const isButton = activeEl instanceof HTMLButtonElement || activeEl?.getAttribute('role') === 'button';

      if (e.key === 'Escape') {
        if (isEditable) {
          (activeEl as HTMLElement).blur();
        } else {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditable && !isButton) {
        if (handlersRef.current.text) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const stats = {
    characters: text.length,
    words: text.trim() === '' ? 0 : text.trim().split(/\s+/).length,
    lines: text === '' ? 0 : text.split('\n').length,
    readingTime: Math.ceil((text.trim() === '' ? 0 : text.trim().split(/\s+/).length) / 200),
  };

  const isOverflow = text.length > MAX_LENGTH;

  const formatters = [
    { name: t('textformatter.action_uppercase'), action: (tStr: string) => tStr.toUpperCase() },
    { name: t('textformatter.action_lowercase'), action: (tStr: string) => tStr.toLowerCase() },
    {
      name: t('textformatter.action_capitalize'),
      action: (tStr: string) => tStr.toLowerCase().replace(/(^\s*\p{L}|[^\p{L}]\p{L})/gu, s => s.toUpperCase())
    },
    {
      name: t('textformatter.action_sentence'),
      action: (tStr: string) => tStr.toLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, s => s.toUpperCase())
    },
    {
      name: t('textformatter.action_invert_case'),
      action: (tStr: string) => tStr.split('').map(char =>
        char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
      ).join('')
    },
    { name: t('textformatter.action_remove_spaces'), action: (tStr: string) => tStr.replace(/\s+/g, '') },
    { name: t('textformatter.action_clean_spaces'), action: (tStr: string) => tStr.replace(/\s+/g, ' ').trim() },
    { name: t('textformatter.action_reverse'), action: (tStr: string) => tStr.split('').reverse().join('') },
    {
      name: t('textformatter.action_remove_accents'),
      action: (tStr: string) => tStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    },
    {
      name: t('textformatter.action_remove_empty_lines'),
      action: (tStr: string) => tStr.split('\n').filter(line => line.trim() !== '').join('\n')
    },
    {
      name: t('textformatter.action_trim_lines'),
      action: (tStr: string) => tStr.split('\n').map(line => line.trim()).join('\n')
    },
    { name: t('textformatter.action_sort_lines'), action: (tStr: string) => tStr.split('\n').sort((a, b) => a.localeCompare(b)).join('\n') },
    { name: t('textformatter.action_remove_duplicate_lines'), action: (tStr: string) => Array.from(new Set(tStr.split('\n'))).join('\n') },
    {
      name: t('textformatter.action_camel_case'),
      action: (tStr: string) => {
        const words = tStr.toLowerCase().split(/[\s_-]+/);
        if (words.length === 0) return '';
        return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      }
    },
    { name: t('textformatter.action_snake_case'), action: (tStr: string) => tStr.toLowerCase().replace(/[\s-]+/g, '_') },
    { name: t('textformatter.action_kebab_case'), action: (tStr: string) => tStr.toLowerCase().replace(/[\s_]+/g, '-') },
    { name: t('textformatter.action_screaming_snake'), action: (tStr: string) => tStr.toUpperCase().replace(/[\s-]+/g, '_') }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          {t('textformatter.presets_label')}
        </span>
        <button
          type="button"
          onClick={() => handlePreset('The Quick Brown Fox Jumps Over The Lazy Dog.\nSoftware Engineering requires attention to details and clean formatting.')}
          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all cursor-pointer"
        >
          {t('textformatter.preset_article')}
        </button>
        <button
          type="button"
          onClick={() => handlePreset('  Hello   world!  \n\n  This is   a test   line.  \n   Multiple    spaces   here.  ')}
          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all cursor-pointer"
        >
          {t('textformatter.preset_whitespace')}
        </button>
        <button
          type="button"
          onClick={() => handlePreset('user_first_name\nUSER_EMAIL_ADDRESS\nproduct-item-category')}
          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all cursor-pointer"
        >
          {t('textformatter.preset_casing')}
        </button>
      </div>

      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Hash className="w-4 h-4" aria-hidden="true" />, label: t('textformatter.stat_characters'), value: stats.characters },
          { icon: <Type className="w-4 h-4" aria-hidden="true" />, label: t('textformatter.stat_words'), value: stats.words },
          { icon: <AlignLeft className="w-4 h-4" aria-hidden="true" />, label: t('textformatter.stat_lines'), value: stats.lines },
          { icon: <Clock className="w-4 h-4" aria-hidden="true" />, label: t('textformatter.stat_reading_time'), value: `~${stats.readingTime}m` },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="text-indigo-500">{stat.icon}</div>
            <div>
              <div className="text-sm font-black font-mono dark:text-white">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* DoS Warning Alert */}
      {isOverflow && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t('textformatter.max_length_exceeded', { max: MAX_LENGTH })}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 px-1">
            <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              {t('textformatter.input_label')}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!text || isOverflow}
                className="text-xs font-bold px-3.5 py-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t('textformatter.download')}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!text}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer ${copied ? 'bg-emerald-500 text-white' : 'text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? t('textformatter.copied') : t('textformatter.copy')}
                <Kbd modifier={null} className="text-[10px]">C</Kbd>
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={!text && !findText && !replaceText}
                className="text-xs font-bold px-3.5 py-2 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('textformatter.clear')}
                <Kbd modifier={null} className="text-[10px]">Esc</Kbd>
              </button>
            </div>
          </div>
          <textarea
            ref={textInputRef}
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('textformatter.placeholder')}
            className="w-full h-[400px] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-base leading-relaxed dark:text-slate-300 shadow-sm resize-none"
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Find and Replace */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Search className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t('textformatter.search_replace_title')}
              </h4>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="find-input" className="sr-only">
                  {t('textformatter.find_label')}
                </label>
                <input
                  id="find-input"
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder={t('textformatter.find_placeholder')}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label htmlFor="replace-input" className="sr-only">
                  {t('textformatter.replace_label')}
                </label>
                <input
                  id="replace-input"
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder={t('textformatter.replace_placeholder')}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                  aria-pressed={isCaseSensitive}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black transition-all border cursor-pointer ${isCaseSensitive ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                  <CaseSensitive className="w-3.5 h-3.5" aria-hidden="true" /> {t('textformatter.case_sensitive')}
                </button>
                <button
                  type="button"
                  onClick={handleReplace}
                  disabled={!findText || !text}
                  className="flex-1 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Replace className="w-3.5 h-3.5" aria-hidden="true" /> {t('textformatter.replace_btn')}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t('textformatter.quick_actions_title')}
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {formatters.map((formatter, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setText(formatter.action(text))}
                  disabled={!text}
                  className="w-full p-2.5 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-600 dark:text-slate-300 rounded-xl transition-all font-bold text-xs border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/30 disabled:opacity-50 cursor-pointer"
                >
                  {formatter.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
