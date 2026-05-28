import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Replace, Copy, Check, Trash2, Download, AlertCircle, Settings2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function FindAndReplace({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [findText, setFindText] = useState(initialData?.findText || '');
  const [replaceText, setReplaceText] = useState(initialData?.replaceText || '');
  const [caseSensitive, setCaseSensitive] = useState(initialData?.caseSensitive ?? false);
  const [useRegex, setUseRegex] = useState(initialData?.useRegex ?? false);
  const [wholeWord, setWholeWord] = useState(initialData?.wholeWord ?? false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, findText, replaceText, caseSensitive, useRegex, wholeWord });
  }, [input, findText, replaceText, caseSensitive, useRegex, wholeWord, onStateChange]);

  const result = useMemo(() => {
    if (!input || !findText) return input;
    if (input.length > MAX_LENGTH) return '';

    try {
      setError(null);
      let pattern = findText;
      if (!useRegex) {
        // Escape special regex characters if not using regex mode
        pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }

      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);
      return input.replace(regex, replaceText);
    } catch (e: any) {
      setError(e.message);
      return input;
    }
  }, [input, findText, replaceText, caseSensitive, useRegex, wholeWord]);

  const matchCount = useMemo(() => {
    if (!input || !findText || input.length > MAX_LENGTH) return 0;
    try {
      let pattern = findText;
      if (!useRegex) {
        pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);
      const matches = input.match(regex);
      return matches ? matches.length : 0;
    } catch (e) {
      return 0;
    }
  }, [input, findText, caseSensitive, useRegex, wholeWord]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.body.appendChild(document.createElement('a'));
    a.href = url;
    a.download = `find-replace-${Date.now()}.txt`;
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input & Controls */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-500" /> {t('common.input')}
              </label>
              <button
                onClick={() => setInput('')}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              id="text-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('wordcounter.placeholder')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
            />
          </div>

          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
            <div className="flex items-center gap-2 text-indigo-500">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('find_replace.find_label', 'Find')}</label>
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder={t('find_replace.find_placeholder', 'Search for...')}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('find_replace.replace_label', 'Replace with')}</label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder={t('find_replace.replace_placeholder', 'New text...')}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { id: 'case', label: t('find_replace.case_sensitive', 'Case Sensitive'), state: caseSensitive, setter: setCaseSensitive },
                { id: 'regex', label: t('find_replace.regex', 'Use RegEx'), state: useRegex, setter: setUseRegex },
                { id: 'whole', label: t('find_replace.whole_word', 'Whole Word'), state: wholeWord, setter: setWholeWord },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => opt.setter(!opt.state)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    opt.state
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-4">
              <label htmlFor="text-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Replace className="w-4 h-4 text-indigo-500" /> {t('common.output')}
              </label>
              {matchCount > 0 && (
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider animate-in fade-in zoom-in-95">
                  {t('find_replace.matches_count', { count: matchCount })}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!result}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!result}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <div
            id="text-output"
            className="w-full h-[460px] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-auto font-mono text-sm leading-relaxed dark:text-white whitespace-pre-wrap break-all"
          >
            {result || <span className="text-slate-400 italic">{t('caseconverter.result_placeholder')}</span>}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('find_replace.about_title', 'About Find and Replace')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('find_replace.about_text', 'This tool allows you to quickly search for specific text and replace it with something else. You can use standard text matching or Regular Expressions for more complex patterns. The process is entirely local to your browser.')}
          </p>
        </div>
      </div>
    </div>
  );
}
