import { useState, useEffect } from 'react';
import { Copy, Check, Trash2, ShieldCheck, Clock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function JWTDecoder() {
  const [jwt, setJwt] = useState('');
  const [decoded, setDecoded] = useState<{
    header: any;
    payload: any;
    signature: string;
    error: string | null;
  }>({
    header: null,
    payload: null,
    signature: '',
    error: null,
  });
  const [showSignature, setShowSignature] = useState(false);
  const [copied, setCopied] = useState(false);

  const decodeJWT = (token: string) => {
    if (!token.trim()) {
      setDecoded({ header: null, payload: null, signature: '', error: null });
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Le JWT doit comporter 3 parties séparées par des points.');
      }

      const decodePart = (base64Url: string) => {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      };

      setDecoded({
        header: decodePart(parts[0]),
        payload: decodePart(parts[1]),
        signature: parts[2],
        error: null,
      });
    } catch (e: any) {
      setDecoded({
        header: null,
        payload: null,
        signature: '',
        error: e.message || 'JWT invalide',
      });
    }
  };

  useEffect(() => {
    decodeJWT(jwt);
  }, [jwt]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'medium',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Input Area */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Jeton JWT</label>
          <button
            onClick={() => setJwt('')}
            className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
          placeholder="Collez votre JWT ici (header.payload.signature)..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-mono break-all dark:text-slate-300"
        />
        {decoded.error && (
          <div className="flex items-center gap-2 text-rose-500 text-sm font-bold px-4">
            <AlertCircle className="w-4 h-4" />
            {decoded.error}
          </div>
        )}
      </div>

      {decoded.header && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Header */}
          <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-rose-500">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">En-tête (Header)</h3>
              </div>
              <button onClick={() => handleCopy(decoded.header)} className="text-slate-400 hover:text-indigo-500 transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-mono overflow-auto max-h-60 text-rose-600 dark:text-rose-400">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>

          {/* Payload */}
          <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-indigo-500">
                <Eye className="w-5 h-5" />
                <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Données (Payload)</h3>
              </div>
              <button onClick={() => handleCopy(decoded.payload)} className="text-slate-400 hover:text-indigo-500 transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-mono overflow-auto max-h-60 text-indigo-600 dark:text-indigo-400">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </div>

          {/* Key Claims Info */}
          <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 lg:col-span-2">
            <div className="flex items-center gap-3 text-amber-500">
              <Clock className="w-5 h-5" />
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Informations Clés</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Émis le (iat)', value: decoded.payload.iat ? formatDate(decoded.payload.iat) : 'N/A' },
                { label: 'Expire le (exp)', value: decoded.payload.exp ? formatDate(decoded.payload.exp) : 'N/A' },
                { label: 'Sujet (sub)', value: decoded.payload.sub || 'N/A' },
                { label: 'Émetteur (iss)', value: decoded.payload.iss || 'N/A' },
              ].map((claim) => (
                <div key={claim.label} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{claim.label}</div>
                  <div className="font-bold text-sm truncate">
                    {typeof claim.value === 'object' ? JSON.stringify(claim.value) : String(claim.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature */}
          <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 lg:col-span-2">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-emerald-500">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Signature</h3>
                </div>
                <button
                  onClick={() => setShowSignature(!showSignature)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {showSignature ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showSignature ? 'Masquer' : 'Afficher'}
                </button>
             </div>
             <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-mono break-all text-emerald-600 dark:text-emerald-400">
               {showSignature ? decoded.signature : '•'.repeat(Math.min(decoded.signature.length, 64)) + (decoded.signature.length > 64 ? '...' : '')}
             </div>
             <p className="text-[10px] text-slate-400 font-medium italic">
               Note: La vérification de la signature nécessite la clé secrète et doit être effectuée côté serveur pour une sécurité réelle. Cet outil est destiné au débogage client-side uniquement.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
