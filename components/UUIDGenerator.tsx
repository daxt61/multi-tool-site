import { useState } from 'react';
import { Copy, Check, RefreshCw, Trash2, Fingerprint } from 'lucide-react';

export function UUIDGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateUUID = () => {
    // Use the native and secure crypto.randomUUID if available
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    // Secure fallback for browsers not supporting randomUUID
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);

    // Set version 4 (13th bit is 4)
    array[6] = (array[6] & 0x0f) | 0x40;
    // Set variant (17th bit is 10)
    array[8] = (array[8] & 0x3f) | 0x80;

    const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  };

  const generateUUIDs = () => {
    const newUuids = [];
    const safeCount = Math.min(Math.max(1, count), 100);
    for (let i = 0; i < safeCount; i++) {
      newUuids.push(generateUUID());
    }
    setUuids(newUuids);
    setCopiedIndex(null);
  };

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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Controls Card */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-3">
            <label htmlFor="uuid-count" className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">
              Nombre d'UUIDs à générer
            </label>
            <input
              id="uuid-count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateUUIDs}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Générer
            </button>
            <button
              onClick={clearAll}
              disabled={uuids.length === 0}
              className="px-6 py-4 bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400 rounded-2xl font-bold transition-all hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-0 disabled:pointer-events-none"
              aria-label="Effacer tout"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {uuids.length > 1 && (
          <button
            onClick={copyAll}
            className={`w-full mt-6 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 border ${
              copiedIndex === -1
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {copiedIndex === -1 ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copiedIndex === -1 ? 'Tous copiés !' : 'Copier tous les UUIDs'}
          </button>
        )}
      </div>

      {/* Results */}
      {uuids.length > 0 ? (
        <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {uuids.map((uuid, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all"
            >
              <code className="font-mono text-lg md:text-xl text-slate-700 dark:text-slate-300 break-all">{uuid}</code>
              <button
                onClick={() => copyToClipboard(uuid, index)}
                className={`p-3 rounded-xl transition-all ${
                  copiedIndex === index
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                }`}
                aria-label="Copier l'UUID"
              >
                {copiedIndex === index ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Copy className="w-6 h-6" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Fingerprint className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucun UUID généré</h4>
          <p className="text-slate-500 dark:text-slate-400">Cliquez sur "Générer" pour créer des identifiants uniques.</p>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-3xl p-6 md:p-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
          <Fingerprint className="w-4 h-4" /> Qu'est-ce qu'un UUID ?
        </h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Un UUID (Universally Unique Identifier) est un identifiant unique de 128 bits utilisé
          pour identifier des informations de manière unique dans les systèmes informatiques.
          La version 4 (utilisée ici) est générée de manière aléatoire et offre une probabilité de collision extrêmement faible.
        </p>
      </div>
    </div>
  );
}
