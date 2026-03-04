import { useState } from 'react';
import { Copy, Check, RefreshCw, Fingerprint } from 'lucide-react';

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
    // Sentinel: Enforce a logic-level limit of 100 to prevent Denial of Service (DoS).
    const safeCount = Math.min(Math.max(1, count), 100);
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-8 space-y-2">
            <label htmlFor="uuid-count" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              Nombre d'UUIDs à générer
            </label>
            <input
              id="uuid-count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="md:col-span-4">
            <button
              onClick={generateUUIDs}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Générer
            </button>
          </div>
        </div>

        {uuids.length > 1 && (
          <button
            onClick={copyAll}
            className={`mt-6 w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
              copiedIndex === -1
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-slate-200/50 dark:shadow-none'
            }`}
          >
            {copiedIndex === -1 ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copiedIndex === -1 ? 'Tous copiés !' : 'Copier tous les UUIDs'}
          </button>
        )}
      </div>

      {uuids.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {uuids.map((uuid, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all group shadow-sm"
            >
              <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-lg break-all">{uuid}</code>
              <button
                onClick={() => copyToClipboard(uuid, index)}
                className={`p-3 rounded-xl transition-all ${
                  copiedIndex === index
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                }`}
                title="Copier"
                aria-label="Copier l'UUID"
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
        <div className="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-24 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-200 dark:text-slate-800">
            <Fingerprint className="w-8 h-8" />
          </div>
          <p className="text-slate-400 font-medium">Cliquez sur "Générer" pour créer des UUIDs</p>
        </div>
      )}

      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-8 space-y-3">
        <h4 className="font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-xs">Qu'est-ce qu'un UUID ?</h4>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Un UUID (Universally Unique Identifier) est un identifiant unique de 128 bits utilisé
          pour identifier des informations de manière unique dans les systèmes informatiques sans
          coordination centrale.
        </p>
      </div>
    </div>
  );
}
