import { useState, useEffect } from 'react';
import { Shield, Copy, Check, Trash2, Download, AlertCircle, List, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

type HashType = 'md5' | 'sha1' | 'sha256' | 'sha512' | 'all';

interface HashResult {
  type: string;
  value: string;
}

export function HashExtractor({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [hashes, setHashes] = useState<HashResult[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<HashType>(initialData?.filterType || 'all');
  const [uniqueOnly, setUniqueOnly] = useState(initialData?.uniqueOnly ?? true);

  useEffect(() => {
    onStateChange?.({ text, filterType, uniqueOnly });
    extractHashes(text);
  }, [text, filterType, uniqueOnly]);

  const extractHashes = (val: string) => {
    if (!val.trim()) {
      setHashes([]);
      return;
    }
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);

    const patterns = {
      md5: /\b[a-f0-9]{32}\b/gi,
      sha1: /\b[a-f0-9]{40}\b/gi,
      sha256: /\b[a-f0-9]{64}\b/gi,
      sha512: /\b[a-f0-9]{128}\b/gi,
    };

    let results: HashResult[] = [];

    const processMatches = (type: string, regex: RegExp) => {
      const matches = val.match(regex);
      if (matches) {
        matches.forEach(m => results.push({ type, value: m.toLowerCase() }));
      }
    };

    if (filterType === 'all') {
      Object.entries(patterns).forEach(([type, regex]) => processMatches(type, regex));
    } else {
      processMatches(filterType, patterns[filterType]);
    }

    if (uniqueOnly) {
      const seen = new Set();
      results = results.filter(h => {
        const duplicate = seen.has(h.value);
        seen.add(h.value);
        return !duplicate;
      });
    }

    setHashes(results);
  };

  const handleCopy = () => {
    if (hashes.length === 0) return;
    navigator.clipboard.writeText(hashes.map(h => h.value).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (hashes.length === 0) return;
    const content = hashes.map(h => `${h.type.toUpperCase()}: ${h.value}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hashes-extracted-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="hash-extractor-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.input')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setUniqueOnly(!uniqueOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${uniqueOnly ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
              >
                {t('common.unique_only')}
              </button>
              <button
                onClick={() => setText('')}
                disabled={!text}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="hash-extractor-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('hashextractor.placeholder_input') || 'Paste text containing hashes (MD5, SHA1, SHA256, SHA512) here...'}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('hashextractor.hashes_found') || 'Hashes Found'}</label>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full">
                  {hashes.length}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <Filter className="w-3 h-3 text-slate-400 ml-2" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as HashType)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer pr-2"
                >
                  <option value="all">ALL</option>
                  <option value="md5">MD5</option>
                  <option value="sha1">SHA1</option>
                  <option value="sha256">SHA256</option>
                  <option value="sha512">SHA512</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={hashes.length === 0}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={hashes.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <div className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-y-auto shadow-inner">
            {hashes.length > 0 ? (
              <ul className="space-y-3">
                {hashes.map((hash, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 group hover:border-indigo-500/30 transition-all">
                    <Shield className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[10px] font-black uppercase text-slate-400">{hash.type}</span>
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-400 break-all">
                        {hash.value}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <List className="w-8 h-8 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">{t('hashextractor.no_hashes') || 'No Hashes Found'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
