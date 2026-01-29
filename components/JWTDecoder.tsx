import { useState, useMemo } from 'react';
import { Shield, Copy, Check, Trash2, Eye, EyeOff, Info } from 'lucide-react';

export function JWTDecoder() {
  const [jwt, setJwt] = useState('');
  const [maskSignature, setMaskSignature] = useState(true);
  const [copied, setCopied] = useState(false);

  const decoded = useMemo(() => {
    if (!jwt) return null;
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) throw new Error('Format JWT invalide (doit avoir 3 parties)');

      const decode = (str: string) => {
        try {
          // Base64Url to Base64
          const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
          const json = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          return JSON.parse(json);
        } catch (e) {
          return 'Erreur de décodage';
        }
      };

      return {
        header: decode(parts[0]),
        payload: decode(parts[1]),
        signature: parts[2],
        validFormat: true
      };
    } catch (e: any) {
      return { error: e.message, validFormat: false };
    }
  }, [jwt]);

  const handleCopy = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Area */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Jeton JWT</label>
            <button
              onClick={() => setJwt('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full h-80 p-6 bg-slate-900 text-white border border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm break-all"
          />

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 p-6 rounded-[2rem] flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-indigo-600 shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Sécurité Client-Side</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Le décodage est effectué entièrement dans votre navigateur. Vos jetons ne sont jamais envoyés à aucun serveur.
              </p>
            </div>
          </div>
        </div>

        {/* Output Area */}
        <div className="space-y-6">
          {decoded && 'header' in decoded ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Header */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Header</span>
                  <button onClick={() => handleCopy(decoded.header)} aria-label="Copier le header" className="text-indigo-500 hover:text-indigo-600">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="p-6 font-mono text-sm dark:text-indigo-400 text-indigo-600 overflow-x-auto">
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>

              {/* Payload */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Payload</span>
                  <button onClick={() => handleCopy(decoded.payload)} aria-label="Copier le payload" className="text-indigo-500 hover:text-indigo-600">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="p-6 font-mono text-sm dark:text-emerald-500 text-emerald-600 overflow-x-auto">
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>
              </div>

              {/* Signature */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Signature</span>
                  <button onClick={() => setMaskSignature(!maskSignature)} aria-label={maskSignature ? "Afficher la signature" : "Masquer la signature"} className="text-slate-400 hover:text-slate-600">
                    {maskSignature ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <div className="p-6 font-mono text-xs break-all text-rose-500">
                  {maskSignature ? '•'.repeat(64) : decoded.signature}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-slate-400 space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center">
                <Info className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">En attente de données</h4>
                <p className="text-sm">Collez un jeton JWT à gauche pour commencer le décodage.</p>
              </div>
              {decoded && 'error' in decoded && (
                <div className="mt-4 px-4 py-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold">
                  {decoded.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
