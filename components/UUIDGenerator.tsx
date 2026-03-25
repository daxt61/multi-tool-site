import { useState, useCallback } from 'react';
import { Copy, Check, RefreshCw, Trash2, Fingerprint, Info, ListChecks, Hash } from 'lucide-react';

export function UUIDGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateUUID = () => {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);

    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;

    const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  };

  const handleGenerate = useCallback(() => {
    const newUuids = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(generateUUID());
    }
    setUuids(newUuids);
    setCopiedIndex(null);
  }, [count]);

  const copyToClipboard = (uuid: string, index: number) => {
    navigator.clipboard.writeText(uuid);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearAll = () => {
    setUuids([]);
    setCopiedIndex(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm space-y-8">
            <h3 className="font-bold flex items-center gap-2 dark:text-white uppercase tracking-wider text-xs">
              <Hash className="w-5 h-5 text-indigo-500" /> Configuration
            </h3>

            <div className="space-y-4">
              <label htmlFor="uuid-count" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Quantité (1-100)</label>
              <input
                id="uuid-count"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleGenerate}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
              >
                <RefreshCw className="w-5 h-5" /> Générer
              </button>

              {uuids.length > 0 && (
                <button
                  onClick={clearAll}
                  className="w-full py-4 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl font-black text-rose-500 transition-all flex items-center justify-center gap-3"
                >
                  <Trash2 className="w-5 h-5" /> Effacer
                </button>
              )}
            </div>
          </div>

          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl space-y-3 border border-indigo-100 dark:border-indigo-900/30">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" /> UUID v4
            </h4>
            <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed">
              La version 4 des UUID est basée sur des nombres aléatoires. La probabilité de collision est si faible qu'elle est considérée comme nulle en pratique.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold flex items-center gap-2 dark:text-white uppercase tracking-wider text-xs">
              <ListChecks className="w-5 h-5 text-indigo-500" /> Identifiants générés
            </h3>
            {uuids.length > 1 && (
              <button
                onClick={copyAll}
                className={`text-xs font-bold px-4 py-1 rounded-full transition-all flex items-center gap-2 ${
                  copiedIndex === -1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500'
                }`}
              >
                {copiedIndex === -1 ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedIndex === -1 ? 'Tous copiés' : 'Tout copier'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {uuids.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-slate-400 text-center p-8">
                <Fingerprint className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">Aucun identifiant généré pour le moment</p>
              </div>
            ) : (
              uuids.map((uuid, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between hover:border-indigo-500/30 transition-all shadow-sm group"
                >
                  <code className="font-mono text-slate-700 dark:text-slate-300 text-sm md:text-base">{uuid}</code>
                  <button
                    onClick={() => copyToClipboard(uuid, index)}
                    className={`p-3 rounded-xl transition-all ${
                      copiedIndex === index
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500'
                    }`}
                    title="Copier"
                  >
                    {copiedIndex === index ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
