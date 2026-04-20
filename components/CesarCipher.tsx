import { useState, useEffect, useCallback } from 'react';
import { Shield, Lock, Unlock, Copy, Check, Trash2, RefreshCw, Info, ArrowRight } from 'lucide-react';

export function CesarCipher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [text, setText] = useState(initialData?.text || '');
  const [shift, setShift] = useState(initialData?.shift ?? 3);
  const [isEncrypt, setIsEncrypt] = useState(initialData?.isEncrypt ?? true);
  const [copied, setCopied] = useState(false);

  const processText = useCallback((str: string, s: number, encrypt: boolean) => {
    const actualShift = encrypt ? s : (26 - (s % 26)) % 26;
    return str.replace(/[a-z]/gi, (char) => {
      const code = char.charCodeAt(0);
      const base = code <= 90 ? 65 : 97;
      return String.fromCharCode(((code - base + actualShift) % 26) + base);
    });
  }, []);

  const result = processText(text, shift, isEncrypt);

  useEffect(() => {
    onStateChange?.({ text, shift, isEncrypt });
  }, [text, shift, isEncrypt, onStateChange]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2 text-indigo-500">
                <Shield className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Configuration</h3>
              </div>
              <button
                onClick={handleClear}
                disabled={!text}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" /> Effacer
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => setIsEncrypt(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    isEncrypt
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  <Lock className="w-4 h-4" /> Chiffrer
                </button>
                <button
                  onClick={() => setIsEncrypt(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    !isEncrypt
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  <Unlock className="w-4 h-4" /> Déchiffrer
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="shift-range" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Décalage (Shift) : {shift}</label>
                <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{shift}</span>
              </div>
              <input
                id="shift-range"
                type="range"
                min="1"
                max="25"
                value={shift}
                onChange={(e) => setShift(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="input-text" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte d'entrée</label>
              <textarea
                id="input-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isEncrypt ? "Entrez le texte à chiffrer..." : "Entrez le texte à déchiffrer..."}
                className="w-full h-48 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Result Area */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden flex-grow flex flex-col group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Résultat</h3>
              <button
                onClick={handleCopy}
                disabled={!result}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all border ${
                  copied
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white/10 text-white/40 border-transparent hover:text-white hover:bg-white/20"
                } disabled:opacity-0`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copié" : "Copier"}
              </button>
            </div>

            <div className="flex-grow font-mono text-xl text-white break-words overflow-y-auto max-h-[400px] no-scrollbar leading-relaxed">
              {result || (
                <span className="text-white/20 italic">Le résultat s'affichera ici...</span>
              )}
            </div>

            {result && (
              <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center relative z-10">
                <div className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                  {isEncrypt ? "Chiffrement" : "Déchiffrement"} César • Shift {shift}
                </div>
              </div>
            )}
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-3xl flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold dark:text-white">Comment ça marche ?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Le chiffre de César est une méthode de chiffrement par substitution où chaque lettre du texte est remplacée par une lettre à une distance fixe (le décalage) dans l'alphabet.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Sécurité</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Historiquement célèbre, ce chiffrement est aujourd'hui très faible et facile à briser. Il est principalement utilisé à des fins éducatives ou pour masquer du texte simple (comme le ROT13).
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">ROT13</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le ROT13 est un cas particulier du chiffre de César avec un décalage de 13. Sa particularité est qu'il est son propre inverse : appliquer deux fois le ROT13 redonne le texte original.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <ArrowRight className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Usage moderne</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Bien qu'obsolète pour la sécurité, le concept de décalage est à la base de nombreux algorithmes plus complexes. Il reste un excellent exercice pour comprendre les bases de la cryptographie.
          </p>
        </div>
      </div>
    </div>
  );
}
