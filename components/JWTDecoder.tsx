import { useState } from 'react';
import { Shield, Copy, Check, Trash2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function JWTDecoder() {
  const [jwt, setJwt] = useState('');
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'header' | 'payload' | null>(null);
  const [showSignature, setShowSignature] = useState(false);

  const decodeBase64Url = (str: string) => {
    try {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) {
        str += '=';
      }
      return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) {
      throw new Error('Base64url decoding failed');
    }
  };

  const handleJwtChange = (val: string) => {
    setJwt(val);
    setError('');
    if (!val.trim()) {
      setHeader('');
      setPayload('');
      return;
    }

    const parts = val.split('.');
    if (parts.length !== 3) {
      setError('Format JWT invalide (doit être header.payload.signature)');
      setHeader('');
      setPayload('');
      return;
    }

    try {
      const decodedHeader = decodeBase64Url(parts[0]);
      const decodedPayload = decodeBase64Url(parts[1]);

      setHeader(JSON.stringify(JSON.parse(decodedHeader), null, 2));
      setPayload(JSON.stringify(JSON.parse(decodedPayload), null, 2));
    } catch (e) {
      setError('Échec du décodage du JWT. Vérifiez le format.');
      setHeader('');
      setPayload('');
    }
  };

  const copyToClipboard = (text: string, type: 'header' | 'payload') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const parts = jwt.split('.');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Input Area */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Coller votre JWT</label>
          <button
            onClick={() => {setJwt(''); setHeader(''); setPayload(''); setError('');}}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          value={jwt}
          onChange={(e) => handleJwtChange(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none break-all"
        />
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Decoded Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Header (En-tête)</label>
            <button
              onClick={() => copyToClipboard(header, 'header')}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'header' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              disabled={!header}
            >
              {copied === 'header' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'header' ? 'Copié' : 'Copier'}
            </button>
          </div>
          <pre className="w-full min-h-[150px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-sm dark:text-indigo-300 overflow-auto">
            {header || <span className="text-slate-400 italic">En attente d'un JWT valide...</span>}
          </pre>
        </div>

        {/* Payload */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Payload (Données)</label>
            <button
              onClick={() => copyToClipboard(payload, 'payload')}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'payload' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              disabled={!payload}
            >
              {copied === 'payload' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'payload' ? 'Copié' : 'Copier'}
            </button>
          </div>
          <pre className="w-full min-h-[300px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-sm dark:text-emerald-300 overflow-auto">
            {payload || <span className="text-slate-400 italic">En attente d'un JWT valide...</span>}
          </pre>
        </div>
      </div>

      {/* Signature Section */}
      {jwt && !error && parts.length === 3 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 p-8 rounded-[2.5rem] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-500" />
              <h3 className="text-lg font-bold">Signature</h3>
            </div>
            <button
              onClick={() => setShowSignature(!showSignature)}
              className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-colors text-indigo-600 dark:text-indigo-400"
            >
              {showSignature ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            La signature est présente mais ne peut pas être vérifiée côté client sans la clé secrète.
          </p>
          <div className="font-mono text-xs break-all p-4 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
            {showSignature ? parts[2] : '•'.repeat(parts[2].length)}
          </div>
        </div>
      )}
    </div>
  );
}
