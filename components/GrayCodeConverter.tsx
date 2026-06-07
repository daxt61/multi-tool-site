import { useState, useEffect, useCallback } from 'react';
import { Binary, Copy, Check, Trash2, ArrowLeftRight, Info, AlertCircle, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 50000;

export function GrayCodeConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [binary, setBinary] = useState(initialData?.binary || '1010');
  const [gray, setGray] = useState(initialData?.gray || '1111');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'bin' | 'gray' | null>(null);

  useEffect(() => {
    onStateChange?.({ binary, gray });
  }, [binary, gray, onStateChange]);

  const binaryToGray = useCallback((bin: string) => {
    if (!bin.trim()) return '';
    try {
      const b = BigInt('0b' + bin.replace(/[^01]/g, ''));
      const g = b ^ (b >> 1n);
      return g.toString(2).padStart(bin.length, '0');
    } catch {
      return '';
    }
  }, []);

  const grayToBinary = useCallback((g: string) => {
    if (!g.trim()) return '';
    try {
      const cleanGray = g.replace(/[^01]/g, '');
      let b = '';
      let lastBit = '0';

      for (let i = 0; i < cleanGray.length; i++) {
        const bit = cleanGray[i] === lastBit ? '0' : '1';
        b += bit;
        lastBit = bit;
      }
      return b;
    } catch {
      return '';
    }
  }, []);

  const handleBinaryChange = (val: string) => {
    const clean = val.replace(/[^01]/g, '').slice(0, MAX_LENGTH);
    setBinary(clean);
    if (clean.length >= MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
    setGray(binaryToGray(clean));
  };

  const handleGrayChange = (val: string) => {
    const clean = val.replace(/[^01]/g, '').slice(0, MAX_LENGTH);
    setGray(clean);
    if (clean.length >= MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
    setBinary(grayToBinary(clean));
  };

  const handleCopy = (text: string, id: 'bin' | 'gray') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setBinary('');
    setGray('');
    setError(null);
  };

  const handleDownload = (content: string, filename: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>

        {/* Binary Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-indigo-500" />
              <label htmlFor="binary-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Binary</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(binary, 'binary.txt')}
                disabled={!binary}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
                title={t('common.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCopy(binary, 'bin')}
                disabled={!binary}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  copied === 'bin'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
              >
                {copied === 'bin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'bin' ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={handleClear}
                disabled={!binary && !gray}
                className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-xl transition-all disabled:opacity-50"
                title={t('common.clear')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            id="binary-input"
            value={binary}
            onChange={(e) => handleBinaryChange(e.target.value)}
            placeholder="101010..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xl leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        {/* Gray Code Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-emerald-500" />
              <label htmlFor="gray-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Gray Code</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(gray, 'gray_code.txt')}
                disabled={!gray}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
                title={t('common.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCopy(gray, 'gray')}
                disabled={!gray}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  copied === 'gray'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
              >
                {copied === 'gray' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'gray' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="gray-input"
            value={gray}
            onChange={(e) => handleGrayChange(e.target.value)}
            placeholder="111111..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xl leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">About Gray Code</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Gray code, also known as reflected binary code, is a binary numeral system where two successive values differ in only one bit position. This property is particularly useful in error correction and physical sensors like rotary encoders to avoid spurious intermediate states during transitions.
          </p>
        </div>
      </div>
    </div>
  );
}
