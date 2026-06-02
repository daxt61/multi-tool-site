import { useState, useEffect, useCallback } from 'react';
import { Shield, Copy, Check, Trash2, AlertCircle, Key, Download, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function RSAGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [keySize, setKeySize] = useState<2048 | 4096>(initialData?.keySize || 2048);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<'public' | 'private' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sentinel: Only share the configuration (keySize), never the generated keys.
    onStateChange?.({ keySize });
  }, [keySize, onStateChange]);

  const arrayBufferToPem = (buffer: ArrayBuffer, label: string) => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
  };

  const generateKeyPair = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: keySize,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      const exportedPublic = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const exportedPrivate = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      setPublicKey(arrayBufferToPem(exportedPublic, 'PUBLIC KEY'));
      setPrivateKey(arrayBufferToPem(exportedPrivate, 'PRIVATE KEY'));
    } catch (e: any) {
      setError(t('rsa.error_fail') + ': ' + e.message);
    } finally {
      setGenerating(false);
    }
  }, [keySize, t]);

  const handleCopy = (text: string, type: 'public' | 'private') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setPublicKey('');
    setPrivateKey('');
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" /> {t('rsa.config_title')}
            </h3>
            <p className="text-sm text-slate-500">{t('rsa.config_desc')}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {([2048, 4096] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setKeySize(size)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    keySize === size
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {size} bits
                </button>
              ))}
            </div>
            <button
              onClick={generateKeyPair}
              disabled={generating}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {publicKey ? t('passwordgenerator.regenerate') : t('rsa.generate_btn')}
            </button>
            {publicKey && (
              <button
                onClick={handleClear}
                className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                title={t('common.clear')}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Public Key */}
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('rsa.public_key')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(publicKey, 'public_key.pem')}
                disabled={!publicKey}
                className="p-2 text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCopy(publicKey, 'public')}
                disabled={!publicKey}
                className={`p-2 rounded-xl transition-all ${
                  copied === 'public'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                    : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800'
                } disabled:opacity-50`}
                aria-label={t('common.copy')}
              >
                {copied === 'public' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={publicKey}
            placeholder={t('rsa.public_placeholder')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-[10px] leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Private Key */}
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('rsa.private_key')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(privateKey, 'private_key.pem')}
                disabled={!privateKey}
                className="p-2 text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCopy(privateKey, 'private')}
                disabled={!privateKey}
                className={`p-2 rounded-xl transition-all ${
                  copied === 'private'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                    : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800'
                } disabled:opacity-50`}
                aria-label={t('common.copy')}
              >
                {copied === 'private' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={privateKey}
            placeholder={t('rsa.private_placeholder')}
            className="w-full h-80 p-6 bg-slate-900 border border-slate-800 rounded-3xl outline-none font-mono text-[10px] leading-relaxed text-indigo-300 resize-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Shield className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('hashgenerator.security_note_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('rsa.security_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
