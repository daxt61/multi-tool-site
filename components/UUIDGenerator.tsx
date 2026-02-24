import { useState, useId } from 'react';
import { Copy, Check, RefreshCw, Fingerprint, ShieldCheck } from 'lucide-react';

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
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
          <div className="flex-1 space-y-3">
            <label htmlFor={inputId} className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              Nombre d'UUIDs à générer
            </label>
            <input
              id={inputId}
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold dark:text-white"
            />
          </div>
          <button
            onClick={generateUUIDs}
            className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className="w-5 h-5" />
            Générer
          </button>
        </div>

        {uuids.length > 1 && (
          <button
            onClick={copyAll}
            className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${copiedIndex === -1 ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}
          >
            {copiedIndex === -1 ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copiedIndex === -1 ? 'Tous copiés !' : 'Copier tous les UUIDs'}
          </button>
        )}
      </div>

      {uuids.length > 0 ? (
        <div className="grid gap-4">
          {uuids.map((uuid, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-indigo-500/50 transition-all"
            >
              <code className="font-mono text-slate-700 dark:text-slate-300 font-bold break-all">{uuid}</code>
              <button
                onClick={() => copyToClipboard(uuid, index)}
                className={`p-3 rounded-xl transition-all active:scale-95 ${copiedIndex === index ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500'}`}
                aria-label="Copier"
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
        <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Fingerprint className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-bold mb-2">Prêt à générer</h4>
          <p className="text-slate-500 dark:text-slate-400">Cliquez sur "Générer" pour créer des identifiants uniques sécurisés.</p>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl p-8 flex gap-6 items-start">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-indigo-500 shadow-sm shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <p className="font-bold dark:text-white">Génération sécurisée</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les UUID (Universally Unique Identifier) sont générés localement dans votre navigateur en utilisant l'API Web Crypto. Cela garantit une unicité maximale et une sécurité cryptographique sans qu'aucune donnée ne soit envoyée à un serveur.
          </p>
        </div>
      </div>
    </div>
  );
}
