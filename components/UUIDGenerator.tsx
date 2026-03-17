import { useState } from 'react';
import { Copy, Check, RefreshCw, Fingerprint, Info, Trash2 } from 'lucide-react';

export function UUIDGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const safeCount = Math.min(Math.max(1, count), 100);

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
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 space-y-3">
            <label htmlFor="uuid-count" className="block text-xs font-black uppercase tracking-widest text-slate-400">
              Nombre d'UUIDs à générer (max 100)
            </label>
            <input
              id="uuid-count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
              className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateUUIDs}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              Générer
            </button>
            <button
              onClick={clearAll}
              disabled={uuids.length === 0}
              className="p-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl transition-all disabled:opacity-0 disabled:pointer-events-none active:scale-95"
              aria-label="Effacer tout"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {uuids.length > 1 && (
          <button
            onClick={copyAll}
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm border ${
              copiedIndex === -1
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {copiedIndex === -1 ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copiedIndex === -1 ? 'Tous copiés !' : 'Copier tous les UUIDs'}
          </button>
        )}
      </div>

      {uuids.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {uuids.map((uuid, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-indigo-500/50 transition-all shadow-sm"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <span className="hidden sm:flex w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 items-center justify-center text-[10px] font-black text-slate-400 group-hover:text-indigo-500 transition-colors">
                  {index + 1}
                </span>
                <code className="font-mono text-slate-700 dark:text-slate-300 truncate text-sm md:text-base">{uuid}</code>
              </div>
              <button
                onClick={() => copyToClipboard(uuid, index)}
                className={`p-3 rounded-xl transition-all flex items-center gap-2 ${
                  copiedIndex === index
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                }`}
                aria-label={`Copier l'UUID ${index + 1}`}
              >
                {copiedIndex === index ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 p-16 rounded-[2.5rem] text-center space-y-4">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Fingerprint className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold dark:text-white text-xl">Aucun UUID généré</h4>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Cliquez sur le bouton pour créer des identifiants uniques sécurisés.
            </p>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white">Qu'est-ce qu'un UUID ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
            Un UUID (Universally Unique Identifier) est un identifiant unique de 128 bits utilisé
            pour identifier des informations de manière unique dans les systèmes informatiques.
            Nous utilisons la version 4 (aléatoire) générée via l'API <code>crypto.randomUUID()</code> de votre navigateur pour une sécurité maximale.
          </p>
        </div>
      </div>
    </div>
  );
}
