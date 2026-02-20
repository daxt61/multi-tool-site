import { useState, useId } from 'react';
import { Copy, Check, RefreshCw, Fingerprint, ShieldCheck, Trash2, List } from 'lucide-react';

export function UUIDGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const inputId = useId();

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
    const newUuids = [];
    for (let i = 0; i < Math.min(Math.max(1, count), 100); i++) {
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
    if (uuids.length === 0) return;
    navigator.clipboard.writeText(uuids.join('\n'));
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Control Panel */}
      <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex-grow space-y-2">
            <div className="flex items-center gap-2 px-1">
              <List className="w-4 h-4 text-indigo-500" />
              <label htmlFor={inputId} className="text-xs font-black uppercase tracking-widest text-slate-400">
                Nombre d'UUIDs à générer
              </label>
            </div>
            <input
              id={inputId}
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateUUIDs}
              className="flex-grow md:flex-grow-0 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <RefreshCw className="w-5 h-5" />
              Générer
            </button>
            {uuids.length > 0 && (
              <button
                onClick={() => setUuids([])}
                aria-label="Effacer tout"
                className="p-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl transition-all active:scale-95"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {uuids.length > 1 && (
          <button
            onClick={copyAll}
            className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
              copiedIndex === -1
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            {copiedIndex === -1 ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copiedIndex === -1 ? 'Tous copiés !' : 'Copier toute la liste'}
          </button>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {uuids.length > 0 ? (
          uuids.map((uuid, index) => (
            <div
              key={index}
              className="group p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400">
                  {index + 1}
                </span>
                <code className="font-mono text-sm sm:text-base text-slate-700 dark:text-slate-300 truncate">
                  {uuid}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(uuid, index)}
                aria-label="Copier l'UUID"
                className={`p-3 rounded-xl transition-all active:scale-95 ${
                  copiedIndex === index
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                }`}
              >
                {copiedIndex === index ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          ))
        ) : (
          <div className="py-20 bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm mb-6 text-slate-300">
              <Fingerprint className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aucun UUID généré</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Choisissez le nombre d'identifiants souhaités et cliquez sur le bouton "Générer".
            </p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="w-32 h-32 -mr-8 -mt-8" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-indigo-200" />
            <h3 className="text-xl font-black">Sécurité & Standards</h3>
          </div>
          <p className="text-sm text-indigo-100 leading-relaxed max-w-2xl">
            Cet outil génère des UUID v4 (Universally Unique Identifiers) en utilisant l'API
            <code className="mx-1 bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs">crypto.randomUUID()</code>
            native de votre navigateur. Cela garantit une entropie maximale et une unicité quasi-parfaite
            pour vos besoins de développement, bases de données ou identifiants uniques.
          </p>
        </div>
      </div>
    </div>
  );
}
