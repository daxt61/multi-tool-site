import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Copy, Check, Trash2, AlertCircle, RefreshCw, Key, Info, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ALGORITHMS = ['HS256', 'HS384', 'HS512'];

export function JWTGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [header, setHeader] = useState(initialData?.header || JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2));
  const [payload, setPayload] = useState(initialData?.payload || JSON.stringify({ sub: '1234567890', name: 'John Doe', iat: Math.floor(Date.now() / 1000) }, null, 2));
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState(initialData?.algorithm || 'HS256');
  const [jwt, setJwt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    onStateChange?.({ header, payload, algorithm });
  }, [header, payload, algorithm, onStateChange]);

  const base64UrlEncode = (str: string | Uint8Array) => {
    let base64 = '';
    if (typeof str === 'string') {
      base64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
    } else {
      base64 = btoa(String.fromCharCode(...str));
    }
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const generateJWT = useCallback(async () => {
    try {
      setError(null);
      const parsedHeader = JSON.parse(header);
      const parsedPayload = JSON.parse(payload);

      if (parsedHeader.alg !== algorithm) {
        parsedHeader.alg = algorithm;
        setHeader(JSON.stringify(parsedHeader, null, 2));
      }

      const encodedHeader = base64UrlEncode(JSON.stringify(parsedHeader));
      const encodedPayload = base64UrlEncode(JSON.stringify(parsedPayload));
      const dataToSign = `${encodedHeader}.${encodedPayload}`;

      if (!secret) {
        setJwt(`${dataToSign}.[Signature missing]`);
        return;
      }

      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const data = encoder.encode(dataToSign);

      const hashAlg = algorithm === 'HS256' ? 'SHA-256' : algorithm === 'HS384' ? 'SHA-384' : 'SHA-512';

      const key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: hashAlg },
        false,
        ['sign']
      );

      const signature = await window.crypto.subtle.sign('HMAC', key, data);
      const encodedSignature = base64UrlEncode(new Uint8Array(signature));

      setJwt(`${dataToSign}.${encodedSignature}`);
    } catch (e: any) {
      setError(e.message);
      setJwt('');
    }
  }, [header, payload, secret, algorithm]);

  useEffect(() => {
    generateJWT();
  }, [generateJWT]);

  const handleCopy = () => {
    if (!jwt) return;
    navigator.clipboard.writeText(jwt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Configuration */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
              <ShieldCheck className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </label>
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('jwt.algorithm')}</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {ALGORITHMS.map((alg) => (
                    <button
                      key={alg}
                      onClick={() => setAlgorithm(alg)}
                      className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${algorithm === alg ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      {alg}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="jwt-secret" className="text-[10px] font-bold text-slate-400 uppercase">{t('hmac.secret_key')}</label>
                <div className="relative">
                  <input
                    id="jwt-secret"
                    type={showSecret ? 'text' : 'password'}
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder={t('hmac.key_placeholder')}
                    className="w-full p-4 pr-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="jwt-header" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('jwt.header')}</label>
            </div>
            <textarea
              id="jwt-header"
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="jwt-payload" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('jwt.payload')}</label>
            </div>
            <textarea
              id="jwt-payload"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full h-64 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">JSON Web Token</label>
              <button
                onClick={handleCopy}
                disabled={!jwt}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent"
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-all"></div>
              <div className="relative p-6 bg-slate-900 text-white border border-slate-800 rounded-[2.5rem] font-mono text-sm leading-relaxed break-all min-h-[300px]">
                {jwt.split('.').map((part, i) => (
                  <span key={i} className={i === 0 ? 'text-rose-400' : i === 1 ? 'text-indigo-400' : 'text-emerald-400'}>
                    {part}{i < 2 ? '.' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl shadow-sm">
                   <Info className="w-5 h-5" />
                </div>
                <h4 className="font-bold dark:text-white">{t('cron.how_title')}</h4>
             </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('jwt.how_it_works')}
                <span className="text-rose-500 font-bold ml-1">{t('jwt.header_part')}</span>,
                <span className="text-indigo-500 font-bold ml-1">{t('jwt.payload_part')}</span> et
                <span className="text-emerald-500 font-bold ml-1">{t('jwt.signature_part')}</span>.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
