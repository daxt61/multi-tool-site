import { useState, useId } from 'react';
import { Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react';

export function UUIDGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const inputId = useId();

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
    for (let i = 0; i < count; i++) {
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
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label htmlFor={inputId} className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              Nombre d'UUIDs à générer
            </label>
            <input
              id={inputId}
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateUUIDs}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 font-black active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              <RefreshCw className="w-5 h-5" />
              Générer
            </button>
          </div>
        </div>

        {uuids.length > 1 && (
          <button
            onClick={copyAll}
            className={`w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-2 font-black active:scale-95 shadow-lg ${
              copiedIndex === -1
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
            }`}
          >
            {copiedIndex === -1 ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copiedIndex === -1 ? 'Tous copiés !' : 'Copier tous les UUIDs'}
          </button>
        )}
      </div>

      {uuids.length > 0 ? (
        <div className="space-y-4">
          {uuids.map((uuid, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all shadow-sm"
            >
              <code className="font-mono text-slate-800 dark:text-slate-200 text-lg break-all">{uuid}</code>
              <button
                onClick={() => copyToClipboard(uuid, index)}
                className={`p-3 rounded-xl transition-all active:scale-95 ${
                  copiedIndex === index ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'
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
        <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
            <RefreshCw className="w-8 h-8" />
          </div>
          <p className="text-slate-500 font-bold">
            Cliquez sur "Générer" pour créer des UUIDs
          </p>
        </div>
      )}

      <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden flex flex-col justify-center">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <ShieldCheck className="w-12 h-12 mb-6 opacity-50" />
        <h3 className="text-2xl font-black mb-4">Identification unique</h3>
        <p className="text-indigo-100 font-medium leading-relaxed max-w-2xl">
          Un UUID (Universally Unique Identifier) est un identifiant de 128 bits utilisé
          pour garantir l'unicité des informations à travers les systèmes distribués, sans coordination centrale.
        </p>
      </div>
    </div>
  );
}
