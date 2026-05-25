import { useState, useMemo, useEffect } from 'react';
import {
  Binary, Copy, Check, Trash2, Download,
  Hash, Calculator, BarChart3, Info, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

type InputMode = 'text' | 'binary';

export function BinaryBitCounter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [mode, setMode] = useState<InputMode>(initialData?.mode || 'text');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, mode });
  }, [input, mode, onStateChange]);

  const binaryString = useMemo(() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) return '';

    if (mode === 'binary') {
      // Remove all characters that are not 0 or 1
      return input.replace(/[^01]/g, '');
    } else {
      // Convert text to binary string
      return input.split('')
        .map((char: string) => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join('');
    }
  }, [input, mode]);

  const stats = useMemo(() => {
    if (!binaryString) return null;

    const total = binaryString.length;
    let ones = 0;
    for (const bit of binaryString) {
      if (bit === '1') ones++;
    }
    const zeros = total - ones;
    const density = (ones / total) * 100;

    return { total, ones, zeros, density };
  }, [binaryString]);

  const handleCopy = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    if (!binaryString) return;
    const blob = new Blob([binaryString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `binary-bits-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else if (mode === 'binary' && /[^01\s\n]/.test(val)) {
      setError(t('bitcounter.error_invalid_binary'));
    } else {
      setError(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex gap-4">
              {(['text', 'binary'] as InputMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`text-xs font-black uppercase tracking-widest transition-all ${
                    mode === m ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t(`bitcounter.mode_${m}`)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setInput('')}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={mode === 'text' ? t('bitcounter.placeholder_text') : t('bitcounter.placeholder_binary')}
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg font-mono dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-slate-900 rounded-[2rem] text-white shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="flex items-center gap-3 relative z-10">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              <h3 className="text-xl font-black">{t('bitcounter.stats')}</h3>
            </div>
            {stats ? (
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">{t('bitcounter.total_bits')}</span>
                  <span className="text-2xl font-black font-mono">{stats.total}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">{t('bitcounter.ones')} (1)</div>
                    <div className="text-2xl font-black font-mono text-emerald-400">{stats.ones}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">{t('bitcounter.zeros')} (0)</div>
                    <div className="text-2xl font-black font-mono text-rose-400">{stats.zeros}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">{t('bitcounter.density')}</span>
                    <span className="text-xl font-black font-mono text-indigo-400">{stats.density.toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${stats.density}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <Download className="w-4 h-4" /> {t('bitcounter.download_binary')}
                </button>
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic font-medium leading-relaxed relative z-10">
                {t('bitcounter.waiting')}
              </p>
            )}
          </div>
        </div>
      </div>

      {stats && (
        <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Binary className="w-4 h-4 text-indigo-500" /> {t('bitcounter.binary_view')}
            </div>
            <button
              onClick={() => handleCopy(binaryString, 'bin')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                copied === 'bin'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                  : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              {copied === 'bin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === 'bin' ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="font-mono text-xs break-all leading-relaxed text-slate-600 dark:text-slate-400">
              {binaryString}
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('bitcounter.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bitcounter.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
