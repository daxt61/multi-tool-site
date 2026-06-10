import { useState, useEffect, useMemo, useCallback } from 'react';
import { Type, Copy, Check, Trash2, Download, AlertCircle, Info, Settings2, AlignLeft, AlignCenter, AlignRight, Scissors } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

type PaddingType = 'left' | 'right' | 'center' | 'none';
type TruncationType = 'start' | 'end' | 'middle' | 'none';

export function StringManipulator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [targetLength, setTargetLength] = useState(initialData?.targetLength ?? 20);
  const [paddingChar, setPaddingChar] = useState(initialData?.paddingChar || ' ');
  const [paddingType, setPaddingType] = useState<PaddingType>(initialData?.paddingType || 'none');
  const [truncationType, setTruncationType] = useState<TruncationType>(initialData?.truncationType || 'none');
  const [truncationSuffix, setTruncationSuffix] = useState(initialData?.truncationSuffix || '...');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, targetLength, paddingChar, paddingType, truncationType, truncationSuffix });
  }, [input, targetLength, paddingChar, paddingType, truncationType, truncationSuffix, onStateChange]);

  const processLine = useCallback((line: string) => {
    let result = line;

    // 1. Truncation
    if (truncationType !== 'none' && result.length > targetLength) {
      if (truncationType === 'end') {
        result = result.substring(0, targetLength) + truncationSuffix;
      } else if (truncationType === 'start') {
        result = truncationSuffix + result.substring(result.length - targetLength);
      } else if (truncationType === 'middle') {
        const half = Math.floor(targetLength / 2);
        result = result.substring(0, half) + truncationSuffix + result.substring(result.length - (targetLength - half));
      }
    }

    // 2. Padding
    if (paddingType !== 'none' && result.length < targetLength) {
      const diff = targetLength - result.length;
      if (paddingType === 'left') {
        result = paddingChar.repeat(diff).substring(0, diff) + result;
      } else if (paddingType === 'right') {
        result = result + paddingChar.repeat(diff).substring(0, diff);
      } else if (paddingType === 'center') {
        const left = Math.floor(diff / 2);
        const right = diff - left;
        result = paddingChar.repeat(left).substring(0, left) + result + paddingChar.repeat(right).substring(0, right);
      }
    }

    return result;
  }, [targetLength, paddingChar, paddingType, truncationType, truncationSuffix]);

  const output = useMemo(() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) return t('error.max_length', { max: MAX_LENGTH.toLocaleString() });

    return input.split('\n').map(processLine).join('\n');
  }, [input, processLine, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manipulated-text-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="manip-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" /> {t('common.input')}
            </label>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
            >
              {t('common.clear')}
            </button>
          </div>
          <textarea
            id="manip-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Line 1\nLonger line 2\nShort 3..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="manip-output" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${copied ? 'bg-emerald-500 text-white' : 'text-slate-600 bg-slate-100 dark:bg-slate-800 border border-transparent'}`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              id="manip-output"
              value={output}
              readOnly
              className="w-full h-80 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Sidebar Tools */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-6">
              {/* Length */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Target Length</label>
                  <span className="text-xs font-bold text-indigo-500 font-mono">{targetLength}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={targetLength}
                  onChange={(e) => setTargetLength(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Padding */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase block px-1">Padding</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={paddingChar}
                    onChange={(e) => setPaddingChar(e.target.value)}
                    placeholder="Char..."
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    {(['none', 'left', 'right', 'center'] as PaddingType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setPaddingType(type)}
                        className={`flex-1 flex items-center justify-center p-1.5 rounded-lg transition-all ${paddingType === type ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title={type}
                      >
                        {type === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {type === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {type === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                        {type === 'none' && <span className="text-[10px] font-black">Ø</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Truncation */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase block px-1">Truncation</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={truncationSuffix}
                    onChange={(e) => setTruncationSuffix(e.target.value)}
                    placeholder="Suffix..."
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    {(['none', 'start', 'end', 'middle'] as TruncationType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setTruncationType(type)}
                        className={`flex-1 flex items-center justify-center p-1.5 rounded-lg transition-all ${truncationType === type ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title={type}
                      >
                        {type === 'start' && <span className="text-[10px] font-black">...A</span>}
                        {type === 'end' && <span className="text-[10px] font-black">A...</span>}
                        {type === 'middle' && <span className="text-[10px] font-black">A..A</span>}
                        {type === 'none' && <span className="text-[10px] font-black">Ø</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
            <Info className="w-6 h-6 text-indigo-600 shrink-0" />
            <div className="space-y-2">
              <h4 className="font-bold dark:text-white">Padding & Truncation</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Padding adds characters to reach the target length, while truncation cuts lines that exceed it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
