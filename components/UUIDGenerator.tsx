import { useState, useCallback } from 'react';
import { Copy, Check, RefreshCw, Trash2, Fingerprint, Download } from 'lucide-react';

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

  const handleClear = () => {
    setUuids([]);
    setCopiedIndex(null);
  };

  const handleDownload = useCallback(() => {
    if (uuids.length === 0) return;
    const blob = new Blob([uuids.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uuids-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [uuids]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-end items-center gap-2 px-1">
        <button
          onClick={handleDownload}
          disabled={uuids.length === 0}
          className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Download className="w-3 h-3" /> Télécharger
        </button>
        <button
          onClick={handleClear}
          disabled={uuids.length === 0}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> Effacer
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-end gap-4 mb-6">
          <div className="flex-1 w-full">
            <label htmlFor="uuid-count" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
              Nombre d'UUIDs à générer
            </label>
            <input
              id="uuid-count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={generateUUIDs}
              className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <RefreshCw className="w-5 h-5" />
              Générer
            </button>
          </div>
        </div>

        {uuids.length > 1 && (
          <button
            onClick={copyAll}
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border ${
              copiedIndex === -1
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {copiedIndex === -1 ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copiedIndex === -1 ? 'Tous copiés !' : 'Copier tous les UUIDs'}
          </button>
        )}
      </div>

      {uuids.length > 0 ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {uuids.map((uuid, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all group"
            >
              <code className="font-mono text-sm md:text-base text-slate-700 dark:text-slate-300 break-all">{uuid}</code>
              <button
                onClick={() => copyToClipboard(uuid, index)}
                className={`p-2.5 rounded-xl transition-all ${
                  copiedIndex === index
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                }`}
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
        <div className="bg-slate-50 dark:bg-slate-900/50 p-16 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
            <Fingerprint className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Aucun UUID généré</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Cliquez sur "Générer" pour créer des identifiants uniques.</p>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl p-6 text-sm text-indigo-900 dark:text-indigo-400 flex gap-4 items-start">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500">
          <Fingerprint className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold mb-1">Qu'est-ce qu'un UUID ?</p>
          <p className="opacity-80 leading-relaxed">
            Un UUID (Universally Unique Identifier) est un identifiant unique de 128 bits utilisé
            pour identifier des informations de manière unique dans les systèmes informatiques sans coordination centrale.
          </p>
        </div>
      </div>
    </div>
  );
}
