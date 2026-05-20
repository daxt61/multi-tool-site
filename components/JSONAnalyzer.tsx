import { useState, useEffect, useMemo } from 'react';
import { FileSearch, Copy, Check, Trash2, Info, Braces, Layers, Hash, Type, ToggleLeft, List, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

interface JsonStats {
  keyCount: number;
  objectCount: number;
  arrayCount: number;
  maxDepth: number;
  primitiveCounts: {
    string: number;
    number: number;
    boolean: number;
    null: number;
  };
}

export function JSONAnalyzer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const stats = useMemo<JsonStats | null>(() => {
    if (!input || input.length > MAX_LENGTH) return null;

    try {
      const parsed = JSON.parse(input);
      const result: JsonStats = {
        keyCount: 0,
        objectCount: 0,
        arrayCount: 0,
        maxDepth: 0,
        primitiveCounts: {
          string: 0,
          number: 0,
          boolean: 0,
          null: 0,
        }
      };

      const analyze = (obj: any, depth: number) => {
        if (depth > MAX_DEPTH) return;
        result.maxDepth = Math.max(result.maxDepth, depth);

        if (obj === null) {
          result.primitiveCounts.null++;
        } else if (Array.isArray(obj)) {
          result.arrayCount++;
          obj.forEach(item => analyze(item, depth + 1));
        } else if (typeof obj === 'object') {
          result.objectCount++;
          const keys = Object.keys(obj);
          result.keyCount += keys.length;
          keys.forEach(key => analyze(obj[key], depth + 1));
        } else {
          const type = typeof obj;
          if (type === 'string') result.primitiveCounts.string++;
          else if (type === 'number') result.primitiveCounts.number++;
          else if (type === 'boolean') result.primitiveCounts.boolean++;
        }
      };

      analyze(parsed, 1);
      setError(null);
      return result;
    } catch (e) {
      setError(t('error.invalid_json'));
      return null;
    }
  }, [input, t]);

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    }
  }, [input, t]);

  const handleCopy = () => {
    if (!stats) return;
    const report = `${t('jsonanalyzer.report_title')}
--------------------
${t('jsonanalyzer.key_count')}: ${stats.keyCount}
${t('jsonanalyzer.object_count')}: ${stats.objectCount}
${t('jsonanalyzer.array_count')}: ${stats.arrayCount}
${t('jsonanalyzer.max_depth')}: ${stats.maxDepth}
${t('jsonanalyzer.type_dist')}:
- ${t('jsonanalyzer.report_strings')}: ${stats.primitiveCounts.string}
- ${t('jsonanalyzer.report_numbers')}: ${stats.primitiveCounts.number}
- ${t('jsonanalyzer.report_booleans')}: ${stats.primitiveCounts.boolean}
- ${t('jsonanalyzer.report_nulls')}: ${stats.primitiveCounts.null}`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" /> {t('jsontosql.json_input')}
            </label>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{ "id": 1, "name": "Test" }'
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed dark:text-slate-300 resize-none font-mono"
          />
        </div>

        {/* Stats Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('jsonanalyzer.results_title')}</h3>
            <button
              onClick={handleCopy}
              disabled={!stats}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-1 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t('common.copied') : t('jsonanalyzer.copy_report')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: t('jsonanalyzer.key_count'), value: stats?.keyCount ?? 0, icon: Hash },
              { label: t('jsonanalyzer.object_count'), value: stats?.objectCount ?? 0, icon: Braces },
              { label: t('jsonanalyzer.array_count'), value: stats?.arrayCount ?? 0, icon: List },
              { label: t('jsonanalyzer.max_depth'), value: stats?.maxDepth ?? 0, icon: Layers },
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('jsonanalyzer.type_dist')}</h4>
            <div className="space-y-4">
              {[
                { label: 'Strings', value: stats?.primitiveCounts.string ?? 0, color: 'bg-indigo-500', icon: Type },
                { label: 'Numbers', value: stats?.primitiveCounts.number ?? 0, color: 'bg-emerald-500', icon: Hash },
                { label: 'Booleans', value: stats?.primitiveCounts.boolean ?? 0, color: 'bg-amber-500', icon: ToggleLeft },
                { label: 'Nulls', value: stats?.primitiveCounts.null ?? 0, color: 'bg-rose-500', icon: Hash },
              ].map((type) => {
                const total = stats ? (stats.primitiveCounts.string + stats.primitiveCounts.number + stats.primitiveCounts.boolean + stats.primitiveCounts.null) : 0;
                const percent = total > 0 ? (type.value / total) * 100 : 0;
                return (
                  <div key={type.label} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <type.icon className="w-3 h-3" />
                        {type.label}
                      </div>
                      <span className="text-slate-900 dark:text-white">{type.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${type.color} transition-all duration-500 ease-out`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsonanalyzer.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsonanalyzer.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
