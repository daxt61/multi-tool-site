import { useState } from 'react';
import { Copy, Check, RefreshCw, Trash2, Fingerprint, Info } from 'lucide-react';

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

  const generateUUIDs = () => {
    // Safety limit for generation
    const safeCount = Math.min(100, Math.max(1, count));
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
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-grow space-y-3">
            <label htmlFor="uuid-count" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Nombre d'UUIDs</label>
            <input
              id="uuid-count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white font-bold"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={generateUUIDs}
              className="flex-grow md:flex-initial px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Générer
            </button>
            {uuids.length > 0 && (
              <button
                onClick={clearAll}
                className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all"
                aria-label="Tout effacer"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {uuids.length > 1 && (
          <button
            onClick={copyAll}
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 border ${
              copiedIndex === -1
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500/50'
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
              className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 pl-6 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all"
            >
              <code className="font-mono text-slate-700 dark:text-slate-300 break-all">{uuid}</code>
              <button
                onClick={() => copyToClipboard(uuid, index)}
                className={`p-3 rounded-xl transition-all ${
                  copiedIndex === index
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800'
                }`}
                aria-label="Copier l'UUID"
              >
                {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
            <Fingerprint className="w-8 h-8" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Cliquez sur "Générer" pour créer des identifiants uniques.</p>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">Qu'est-ce qu'un UUID ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Un UUID (Universally Unique Identifier) est un identifiant de 128 bits utilisé pour identifier des informations de manière unique.
            Nous générons des UUID de version 4, basés sur des nombres aléatoires cryptographiquement sécurisés.
          </p>
        </div>
      </div>
    </div>
  );
}
