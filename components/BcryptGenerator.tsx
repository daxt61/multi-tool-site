import { useState, useEffect, useRef } from 'react';
import { Shield, ShieldCheck, Copy, Check, Trash2, AlertCircle, Info, RefreshCw, Search } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_PASSWORD_LENGTH = 72; // Bcrypt limit is technically 72 bytes

export function BcryptGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Hashing state
  const [password, setPassword] = useState('');
  const [rounds, setRounds] = useState(() => {
    const r = parseInt(initialData?.rounds, 10);
    return isNaN(r) ? 10 : Math.min(15, Math.max(4, r));
  });
  const [hash, setHash] = useState('');
  const [hashing, setHashing] = useState(false);
  const [hashCopied, setHashCopied] = useState(false);

  // Verification state
  const [checkPassword, setCheckPassword] = useState('');
  const [checkHash, setCheckHash] = useState('');
  const [isMatch, setIsMatch] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Sentinel: Never share passwords or hashes in the URL state.
    onStateChange?.({ rounds });
  }, [rounds, onStateChange]);

  const handleHash = async () => {
    if (!password) return;
    setHashing(true);
    // Use setTimeout to allow UI to show loading state as bcrypt can be CPU intensive
    setTimeout(() => {
      try {
        const generatedHash = bcrypt.hashSync(password, rounds);
        setHash(generatedHash);
      } catch (err) {
        console.error(err);
      } finally {
        setHashing(false);
      }
    }, 50);
  };

  const handleVerify = () => {
    if (!checkPassword || !checkHash) return;
    setVerifying(true);
    setTimeout(() => {
      try {
        const match = bcrypt.compareSync(checkPassword, checkHash);
        setIsMatch(match);
      } catch (err) {
        console.error(err);
        setIsMatch(false);
      } finally {
        setVerifying(false);
      }
    }, 50);
  };

  const handleCopyHash = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setHashCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setHashCopied(false), 2000);
  };

  const handleClearHash = () => {
    setPassword('');
    setHash('');
    setIsMatch(null);
    passwordInputRef.current?.focus();
  };

  const handleClearVerify = () => {
    setCheckPassword('');
    setCheckHash('');
    setIsMatch(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Hashing Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('bcrypt.hashing_title')}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-[2.5rem] shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="bcrypt-password" className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {t('bcrypt.password_label')}
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <label htmlFor="bcrypt-rounds" className="text-xs font-bold text-slate-400">Rounds:</label>
                   <input
                     id="bcrypt-rounds"
                     type="number"
                     min="4"
                     max="15"
                     value={rounds}
                     onChange={(e) => setRounds(Math.min(15, Math.max(4, parseInt(e.target.value) || 10)))}
                     className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none"
                   />
                </div>
                <div className="flex items-center gap-2">
                  <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
                  <button
                    onClick={handleClearHash}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none rounded-lg"
                    aria-label={t('common.clear')}
                  >
                    {t('common.clear')}
                  </button>
                </div>
              </div>
            </div>
            <input
              id="bcrypt-password"
              ref={passwordInputRef}
              autoComplete="off"
              spellCheck={false}
              type="text"
              value={password}
              maxLength={MAX_PASSWORD_LENGTH}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleClearHash();
                }
              }}
              placeholder="P4ssw0rd!"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
            />
            <p className="text-[10px] text-slate-400 font-bold px-1 italic">
              Max length: {MAX_PASSWORD_LENGTH} characters (Bcrypt standard)
            </p>
          </div>

          <button
            onClick={handleHash}
            disabled={!password || hashing}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {hashing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            {t('bcrypt.generate_hash')}
          </button>

          {hash && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                Hash Bcrypt
              </label>
              <div className="relative group">
                <textarea
                  readOnly
                  value={hash}
                  className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl font-mono text-indigo-300 text-sm break-all resize-none h-24"
                />
                <button
                  onClick={handleCopyHash}
                  aria-label={t('common.copy')}
                  className={`absolute top-3 right-3 p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    hashCopied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {hashCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Verification Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('bcrypt.verification_title')}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-[2.5rem] shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="verify-password" className="text-sm font-bold text-slate-600 dark:text-slate-400 px-1">
                {t('bcrypt.password_to_check')}
              </label>
              <input
                id="verify-password"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={checkPassword}
                onChange={(e) => setCheckPassword(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="verify-hash" className="text-sm font-bold text-slate-600 dark:text-slate-400 px-1">
                {t('bcrypt.hash_to_check')}
              </label>
              <input
                id="verify-hash"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={checkHash}
                onChange={(e) => setCheckHash(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex gap-4">
             <button
              onClick={handleVerify}
              disabled={!checkPassword || !checkHash || verifying}
              className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              {verifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {t('bcrypt.verify_btn')}
            </button>
            <button
              onClick={handleClearVerify}
              className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 transition-all focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:outline-none"
              aria-label={t('common.clear')}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {isMatch !== null && (
            <div className={`p-6 rounded-2xl border flex items-center gap-4 animate-in zoom-in-95 duration-300 ${
              isMatch
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'
            }`}>
              {isMatch ? <ShieldCheck className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              <div>
                <p className="font-black text-xl leading-none mb-1">
                  {isMatch ? t('bcrypt.match_success') : t('bcrypt.match_fail')}
                </p>
                <p className="text-sm opacity-80 font-medium">
                  {isMatch ? t('bcrypt.match_success_desc') : t('bcrypt.match_fail_desc')}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('bcrypt.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bcrypt.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
