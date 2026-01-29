import { useState } from 'react';
import { Shield, Eye, EyeOff, Copy, Check, Trash2, AlertCircle } from 'lucide-react';

export function JWTDecoder() {
  const [token, setToken] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const base64UrlDecode = (str: string) => {
    try {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) str += '=';
      return decodeURIComponent(
        atob(str)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (e) {
      return null;
    }
  };

  const decodeJWT = (jwt: string) => {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;

    const header = base64UrlDecode(parts[0]);
    const payload = base64UrlDecode(parts[1]);

    if (!header || !payload) return null;

    try {
      return {
        header: JSON.parse(header),
        payload: JSON.parse(payload),
        signature: parts[2]
      };
    } catch (e) {
      return null;
    }
  };

  const decoded = decodeJWT(token);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">JWT Token</label>
          <button onClick={() => setToken('')} className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors">
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value.trim())}
          placeholder="Collez votre JWT ici (header.payload.signature)..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-mono break-all dark:text-slate-300"
        />
      </div>

      {token && !decoded && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">JWT invalide. Assurez-vous d'avoir les 3 parties séparées par des points.</p>
        </div>
      )}

      {decoded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Header</label>
              <button onClick={() => handleCopy(JSON.stringify(decoded.header, null, 2), 'header')} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                {copied === 'header' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 'header' ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-mono overflow-auto max-h-60 dark:text-indigo-400">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>

          {/* Payload */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Payload</label>
              <button onClick={() => handleCopy(JSON.stringify(decoded.payload, null, 2), 'payload')} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                {copied === 'payload' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 'payload' ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-mono overflow-auto max-h-96 dark:text-emerald-500">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </div>

          {/* Signature */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Signature</label>
              <button onClick={() => setShowSignature(!showSignature)} className="text-xs font-bold text-slate-500 hover:text-slate-600 flex items-center gap-1 transition-colors">
                {showSignature ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showSignature ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <div className="p-6 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-mono break-all text-slate-500">
              {showSignature ? decoded.signature : '•'.repeat(64)}
            </div>
          </div>
        </div>
      )}

      <div className="p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800/30">
        <div className="flex items-start gap-4">
          <Shield className="w-6 h-6 text-indigo-500 mt-1" />
          <div>
            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">Sécurisé & Privé</h4>
            <p className="text-sm text-indigo-700/70 dark:text-indigo-400/60 leading-relaxed">
              Le décodage est effectué entièrement dans votre navigateur. Votre jeton n'est jamais envoyé sur nos serveurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
