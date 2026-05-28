import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Copy, Check, Trash2, Download, Settings2, Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 5000; // Zalgo text gets huge quickly

const ZALGO_UP = [
  '\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306', '\u0310',
  '\u0352', '\u033d', '\u0313', '\u0307', '\u0308', '\u030a', '\u033e', '\u0343',
  '\u0344', '\u034a', '\u034b', '\u034c', '\u0303', '\u0302', '\u030c', '\u0350',
  '\u0300', '\u0301', '\u030b', '\u030f', '\u0312', '\u0314', '\u033d', '\u0309',
  '\u0363', '\u0364', '\u0365', '\u0366', '\u0367', '\u0368', '\u0369', '\u036a',
  '\u036b', '\u036c', '\u036d', '\u036e', '\u036f', '\u033d', '\u035b', '\u0346',
  '\u031a'
];

const ZALGO_MID = [
  '\u0315', '\u031b', '\u0340', '\u0341', '\u0358', '\u0321', '\u0322', '\u0327',
  '\u0328', '\u0334', '\u0335', '\u0336', '\u034f', '\u035c', '\u035d', '\u035e',
  '\u035f', '\u0360', '\u0362', '\u0338', '\u0337', '\u0361', '\u0489'
];

const ZALGO_DOWN = [
  '\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e', '\u031f',
  '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032a', '\u032b', '\u032c',
  '\u032d', '\u032e', '\u032f', '\u0330', '\u0331', '\u0332', '\u0333', '\u0339',
  '\u033a', '\u033b', '\u033c', '\u0345', '\u0347', '\u0348', '\u0349', '\u034d',
  '\u034e', '\u0353', '\u0354', '\u0355', '\u0356', '\u0359', '\u035a', '\u0323'
];

export function ZalgoGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [intensity, setIntensity] = useState(initialData?.intensity ?? 10);
  const [up, setUp] = useState(initialData?.up ?? true);
  const [mid, setMid] = useState(initialData?.mid ?? true);
  const [down, setDown] = useState(initialData?.down ?? true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, intensity, up, mid, down });
  }, [input, intensity, up, mid, down, onStateChange]);

  // Sentinel: Use cryptographically secure random values with rejection sampling
  // to prevent bias and ensure high-quality entropy for transformations.
  const getSecureRandom = useCallback((range: number): number => {
    if (range <= 0) return 0;
    const array = new Uint32Array(1);
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % range);
    let randomVal;
    do {
      window.crypto.getRandomValues(array);
      randomVal = array[0];
    } while (randomVal >= limit);
    return randomVal % range;
  }, []);

  const generateZalgo = useCallback(() => {
    if (!input) {
      setOutput('');
      return;
    }

    let result = '';
    for (let i = 0; i < input.length; i++) {
      result += input[i];

      // Skip whitespace and combining marks themselves
      if (/\s/.test(input[i]) || (input[i].charCodeAt(0) >= 0x0300 && input[i].charCodeAt(0) <= 0x036F)) {
        continue;
      }

      const count = getSecureRandom(intensity);

      if (up) {
        for (let j = 0; j < count; j++) {
          result += ZALGO_UP[getSecureRandom(ZALGO_UP.length)];
        }
      }
      if (mid) {
        for (let j = 0; j < Math.floor(count / 2); j++) {
          result += ZALGO_MID[getSecureRandom(ZALGO_MID.length)];
        }
      }
      if (down) {
        for (let j = 0; j < count; j++) {
          result += ZALGO_DOWN[getSecureRandom(ZALGO_DOWN.length)];
        }
      }
    }
    setOutput(result);
  }, [input, intensity, up, mid, down]);

  useEffect(() => {
    generateZalgo();
  }, [generateZalgo]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zalgo-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="zalgo-input" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.input')}</label>
              <button
                onClick={() => setInput('')}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              </button>
            </div>
            <textarea
              id="zalgo-input"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="HÉ LÖWÖR LD..."
              className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none shadow-sm"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="zalgo-output" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
                  title={t('common.download')}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <div
              id="zalgo-output"
              className="w-full min-h-[200px] p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-auto text-2xl break-words whitespace-pre-wrap dark:text-white"
            >
              {output || <span className="text-slate-300 dark:text-slate-700 italic">{t('random.placeholder_str')}</span>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('zalgo.intensity')}</span>
                  <span className="text-xs font-black font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg">{intensity}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: t('zalgo.up'), state: up, set: setUp },
                  { label: t('zalgo.mid'), state: mid, set: setMid },
                  { label: t('zalgo.down'), state: down, set: setDown },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => opt.set(!opt.state)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all font-bold text-sm ${
                      opt.state
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.state && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateZalgo}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              <Sparkles className="w-5 h-5" /> {t('random.generate')}
            </button>
          </div>

          <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20 space-y-4">
             <div className="flex items-center gap-3">
              <Sliders className="w-6 h-6 opacity-50" />
              <h3 className="text-xl font-black">{t('cron.how_title')}</h3>
            </div>
            <p className="text-indigo-100 text-sm leading-relaxed">
              {t('zalgo.how_text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
