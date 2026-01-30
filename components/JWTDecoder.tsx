import { useState, useEffect } from 'react';
import { Copy, Check, Trash2, ShieldCheck, Clock, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';

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
        try {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          return JSON.parse(jsonPayload);
        } catch (e) {
          return { error: 'Erreur de décodage' };
        }
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

  const handleCopy = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp * 1000).toLocaleString('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'medium',
      });
    } catch (e) {
      return 'Date invalide';
    }
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

          {decoded.error && (
            <div className="flex items-center gap-2 text-rose-500 text-sm font-bold px-4">
              <AlertCircle className="w-4 h-4" />
              {decoded.error}
            </div>
          )}
        </div>

        {/* Output Area */}
        <div className="space-y-6">
          {decoded.header ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Header */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Header</span>
                  <button onClick={() => handleCopy(decoded.header)} aria-label="Copier le header" className="text-indigo-500 hover:text-indigo-600">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="p-6 font-mono text-sm dark:text-indigo-400 text-indigo-600 overflow-x-auto max-h-60">
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
                <pre className="p-6 font-mono text-sm dark:text-emerald-500 text-emerald-600 overflow-x-auto max-h-60">
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>
              </div>

              {/* Key Claims Info */}
              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
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
                    <div key={claim.label} className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{claim.label}</div>
                      <div className="font-bold text-xs truncate dark:text-white">{claim.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Signature</span>
                  <button onClick={() => setShowSignature(!showSignature)} aria-label={showSignature ? "Masquer la signature" : "Afficher la signature"} className="text-slate-400 hover:text-slate-600">
                    {showSignature ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="p-6 font-mono text-xs break-all text-rose-500">
                  {showSignature ? decoded.signature : '•'.repeat(Math.min(decoded.signature.length, 64)) + (decoded.signature.length > 64 ? '...' : '')}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-slate-400 space-y-4 min-h-[400px]">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">En attente de données</h4>
                <p className="text-sm">Collez un jeton JWT à gauche pour commencer le décodage.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
