import { useState, useEffect } from 'react';
import { Copy, Check, Trash2, ShieldCheck, Clock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function JWTDecoder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [jwt, setJwt] = useState(initialData?.jwt || '');
  const [secretKey, setSecretKey] = useState('');
  const [selectedAlg, setSelectedAlg] = useState('HS256');
  const [verificationResult, setVerificationResult] = useState<'valid' | 'invalid' | 'missing_secret' | 'error' | null>('missing_secret');
  const [verificationError, setVerificationError] = useState('');
  const [showSecret, setShowSecret] = useState(false);

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
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    onStateChange?.({ jwt, selectedAlg });
  }, [jwt, selectedAlg, onStateChange]);

  const base64UrlDecode = (str: string) => {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const verifySignature = async (token: string, secret: string, alg: string) => {
    if (!token.trim() || !secret.trim()) {
      setVerificationResult('missing_secret');
      setVerificationError('');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        setVerificationResult('error');
        setVerificationError('Invalid token format');
        return;
      }

      const [headerB64, payloadB64, signatureB64] = parts;
      const dataToVerify = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
      const signatureBytes = base64UrlDecode(signatureB64);

      const cryptoAlg = alg === 'HS256' ? 'SHA-256' : alg === 'HS384' ? 'SHA-384' : 'SHA-512';
      const secretBytes = new TextEncoder().encode(secret);

      const key = await window.crypto.subtle.importKey(
        'raw',
        secretBytes,
        { name: 'HMAC', hash: cryptoAlg },
        false,
        ['verify']
      );

      const isValid = await window.crypto.subtle.verify(
        'HMAC',
        key,
        signatureBytes,
        dataToVerify
      );

      if (isValid) {
        setVerificationResult('valid');
        setVerificationError('');
      } else {
        setVerificationResult('invalid');
        setVerificationError('');
      }
    } catch (e: any) {
      setVerificationResult('error');
      setVerificationError(e.message || 'Verification failed');
    }
  };

  const decodeJWT = (token: string) => {
    if (!token.trim()) {
      setDecoded({ header: null, payload: null, signature: '', error: null });
      return;
    }

    if (token.length > MAX_LENGTH) {
      setDecoded({
        header: null,
        payload: null,
        signature: '',
        error: t('error.max_length', { max: MAX_LENGTH.toLocaleString() }),
      });
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error(t('jwt.error_parts'));
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
        error: e.message || t('error.invalid_token'),
      });
    }
  };

  useEffect(() => {
    decodeJWT(jwt);
  }, [jwt]);

  useEffect(() => {
    verifySignature(jwt, secretKey, selectedAlg);
  }, [jwt, secretKey, selectedAlg]);

  const handleCopy = (text: string, target: 'header' | 'payload') => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
    if (target === 'header') {
      setCopiedHeader(true);
      setTimeout(() => setCopiedHeader(false), 2000);
    } else {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return t('common.na');
    return new Date(timestamp * 1000).toLocaleString(undefined, {
      dateStyle: 'full',
      timeStyle: 'medium',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Input Area */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="jwt-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('jwt.token_label')}</label>
          <button
            onClick={() => {
              setJwt('');
              setSecretKey('');
              setVerificationResult('missing_secret');
            }}
            disabled={!jwt}
            aria-label={t('common.clear')}
            className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-transparent transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-3 h-3" /> {t('common.clear')}
          </button>
        </div>
        <textarea
          id="jwt-input"
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
          placeholder={t('jwt.placeholder')}
          className={`w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border ${decoded.error?.includes('longue') || decoded.error?.includes('long') ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-[2rem] outline-none focus:ring-2 transition-all text-sm font-mono break-all dark:text-slate-300`}
        />
        {decoded.error && (
          <div className="flex items-center gap-2 text-rose-500 text-sm font-bold px-4 animate-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {decoded.error}
          </div>
        )}
      </div>

      {/* Signature Verification Block */}
      {decoded.header && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" /> Signature Verification (HMAC)
            </label>
            {verificationResult === 'valid' && (
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full animate-pulse">
                ✓ Valid Signature
              </span>
            )}
            {verificationResult === 'invalid' && (
              <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full animate-shake">
                ✗ Invalid Signature
              </span>
            )}
            {verificationResult === 'missing_secret' && (
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full">
                Enter Secret Key to Verify
              </span>
            )}
            {verificationResult === 'error' && (
              <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full">
                Verification Error: {verificationError}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2 relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="HMAC secret key to verify signature..."
                className="w-full p-3.5 pr-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                aria-label={showSecret ? "Hide secret" : "Show secret"}
              >
                {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div>
              <select
                value={selectedAlg}
                onChange={(e) => setSelectedAlg(e.target.value)}
                className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white cursor-pointer"
              >
                <option value="HS256">HMAC-SHA256 (HS256)</option>
                <option value="HS384">HMAC-SHA384 (HS384)</option>
                <option value="HS512">HMAC-SHA512 (HS512)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {decoded.header && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 group">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-rose-500">
                <ShieldCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
                <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">{t('jwt.header')}</h3>
              </div>
              <button
                onClick={() => handleCopy(decoded.header, 'header')}
                className={`p-2 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedHeader
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-400 hover:text-indigo-500 border-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                }`}
                aria-label={t('common.copy')}
              >
                {copiedHeader ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-mono overflow-auto max-h-60 text-rose-600 dark:text-rose-400">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>

          {/* Payload */}
          <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 group">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-indigo-500">
                <Eye className="w-5 h-5 transition-transform group-hover:scale-110" />
                <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">{t('jwt.payload')}</h3>
              </div>
              <button
                onClick={() => handleCopy(decoded.payload, 'payload')}
                className={`p-2 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedPayload
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-400 hover:text-indigo-500 border-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                }`}
                aria-label={t('common.copy')}
              >
                {copiedPayload ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-mono overflow-auto max-h-60 text-indigo-600 dark:text-indigo-400">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </div>

          {/* Key Claims Info */}
          <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 lg:col-span-2 group">
            <div className="flex items-center gap-3 text-amber-500">
              <Clock className="w-5 h-5 transition-transform group-hover:scale-110" />
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">{t('jwt.info_title')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: t('jwt.iat'), value: decoded.payload.iat ? formatDate(decoded.payload.iat) : t('common.na') },
                { label: t('jwt.exp'), value: decoded.payload.exp ? formatDate(decoded.payload.exp) : t('common.na') },
                { label: t('jwt.sub'), value: decoded.payload.sub || t('common.na') },
                { label: t('jwt.iss'), value: decoded.payload.iss || t('common.na') },
              ].map((claim) => (
                <div key={claim.label} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{claim.label}</div>
                  <div className="font-bold text-sm truncate dark:text-white">{claim.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature */}
          <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 lg:col-span-2 group">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-emerald-500">
                  <ShieldCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">{t('jwt.signature')}</h3>
                </div>
                <button
                  onClick={() => setShowSignature(!showSignature)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-lg p-1"
                >
                  {showSignature ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showSignature ? t('common.hide') : t('common.show')}
                </button>
             </div>
             <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-mono break-all text-emerald-600 dark:text-emerald-400">
               {showSignature ? decoded.signature : '•'.repeat(Math.min(decoded.signature.length, 64)) + (decoded.signature.length > 64 ? '...' : '')}
             </div>
             <p className="text-[10px] text-slate-400 font-medium italic">
               {t('jwt.signature_note')}
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
