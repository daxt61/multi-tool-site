import { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Check, Copy, Hash, Info, Trash2, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LookAndSayGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [seed, setSeed] = useState(initialData?.seed || '1');
  const [iterations, setIterations] = useState(initialData?.iterations || 5);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ seed, iterations });
  }, [seed, iterations, onStateChange]);

  const sequence = useMemo(() => {
    if (!seed || isNaN(Number(seed))) return [];

    const results = [seed];
    let current = seed;

    // Safety cap
    const safeIterations = Math.min(Math.max(1, iterations), 15);

    for (let i = 0; i < safeIterations; i++) {
      let next = '';
      let j = 0;

      while (j < current.length) {
        let count = 1;
        while (j + 1 < current.length && current[j] === current[j + 1]) {
          count++;
          j++;
        }
        next += count.toString() + current[j];
        j++;
      }

      results.push(next);
      current = next;

      // Prevent massive strings that crash the browser
      if (current.length > 10000) break;
    }

    return results;
  }, [seed, iterations]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sequence.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setSeed('1');
    setIterations(5);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end px-1">
        <button
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> {t('common.reset')}
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label htmlFor="seed-input" className="block text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              {t('lookandsay.seed', 'Nombre de départ (Seed)')}
            </label>
            <input
              id="seed-input"
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="Ex: 1"
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="iterations-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('lookandsay.iterations', 'Itérations')}
              </label>
              <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{iterations}</span>
            </div>
            <input
              id="iterations-input"
              type="range"
              min="1"
              max="15"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            />
          </div>
        </div>
      </div>

      {sequence.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" /> {t('lookandsay.generated', 'Suite Générée')}
            </h3>
            <button
              onClick={copyToClipboard}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sequence.map((step, idx) => (
                <div key={idx} className="p-6 flex items-start gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                    {idx}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm break-all leading-relaxed text-slate-700 dark:text-slate-300">
                      {step}
                    </p>
                    {idx < sequence.length - 1 && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <span>{t('lookandsay.read_as', 'On lit "{{step}}" comme').replace('{{step}}', step)}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-indigo-500 italic">
                          {(() => {
                            let desc = [];
                            let j = 0;
                            while (j < step.length) {
                              let count = 1;
                              while (j + 1 < step.length && step[j] === step[j+1]) { count++; j++; }
                              desc.push(`${count} ${t('lookandsay.times', 'fois le')} ${step[j]}`);
                              j++;
                            }
                            return desc.join(', ');
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl p-6 text-sm text-indigo-900 dark:text-indigo-400 flex gap-4 items-start">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold mb-1">{t('lookandsay.about_title', 'Qu\'est-ce que la suite "Regarde et dis" ?')}</p>
          <p className="opacity-80 leading-relaxed">
            {t('lookandsay.about_text', 'La suite de Conway (ou Look-and-Say) est une suite mathématique où chaque terme se construit en lisant à voix haute le terme précédent. Par exemple, si le terme est "1", on lit "un 1", donc le suivant est "11". "11" se lit "deux 1", donc "21". "21" se lit "un 2, un 1", donc "1211", et ainsi de suite.')}
          </p>
        </div>
      </div>
    </div>
  );
}
