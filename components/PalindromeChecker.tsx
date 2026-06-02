import { useState, useMemo, useEffect } from 'react';
import { Type, Check, X, ArrowLeftRight, Trash2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function PalindromeChecker({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [ignoreCase, setIgnoreCase] = useState(initialData?.ignoreCase ?? true);
  const [ignorePunctuation, setIgnorePunctuation] = useState(initialData?.ignorePunctuation ?? true);

  useEffect(() => {
    onStateChange?.({ text, ignoreCase, ignorePunctuation });
  }, [text, ignoreCase, ignorePunctuation, onStateChange]);

  const result = useMemo(() => {
    if (!text.trim()) return null;

    let processedText = text;
    if (ignoreCase) {
      processedText = processedText.toLowerCase();
    }
    if (ignorePunctuation) {
      processedText = processedText.replace(/[\s\p{P}\p{S}]/gu, '');
    }

    if (!processedText) return null;

    const reversed = [...processedText].reverse().join('');
    const isPalindrome = processedText === reversed;

    return {
      isPalindrome,
      processedText,
      reversed
    };
  }, [text, ignoreCase, ignorePunctuation]);

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end px-1">
        <button
          onClick={handleClear}
          disabled={!text}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> {t('common.clear')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="palindrome-input" className="block text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              {t('common.input')}
            </label>
            <textarea
              id="palindrome-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('palindrome.placeholder', 'Entrez un mot ou une phrase...')}
              className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIgnoreCase(!ignoreCase)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                ignoreCase
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <span className="font-bold text-sm">{t('palindrome.ignore_case', 'Ignorer la casse')}</span>
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                ignoreCase ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {ignoreCase && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
            <button
              onClick={() => setIgnorePunctuation(!ignorePunctuation)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                ignorePunctuation
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <span className="font-bold text-sm">{t('palindrome.ignore_punct', 'Ignorer la ponct.')}</span>
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                ignorePunctuation ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {ignorePunctuation && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          {result ? (
            <div className={`p-8 rounded-[2.5rem] border-2 text-center space-y-6 animate-in zoom-in-95 duration-300 ${
              result.isPalindrome
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
            }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                result.isPalindrome ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}>
                {result.isPalindrome ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
              </div>

              <div>
                <h3 className={`text-2xl font-black mb-2 ${result.isPalindrome ? 'text-emerald-900 dark:text-emerald-400' : 'text-rose-900 dark:text-rose-400'}`}>
                  {result.isPalindrome ? t('palindrome.is_palindrome', 'C\'est un palindrome !') : t('palindrome.not_palindrome', 'Ce n\'est pas un palindrome')}
                </h3>
                <p className={`text-sm font-medium ${result.isPalindrome ? 'text-emerald-600/80 dark:text-emerald-500/60' : 'text-rose-600/80 dark:text-rose-500/60'}`}>
                  {result.isPalindrome
                    ? t('palindrome.success_msg', 'Le texte se lit de la même façon dans les deux sens.')
                    : t('palindrome.fail_msg', 'Le texte inversé est différent de l\'original.')
                  }
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-black/5 dark:border-white/5">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Original</span>
                  <code className="font-mono text-sm bg-white/50 dark:bg-black/20 px-3 py-1 rounded-lg break-all">{result.processedText}</code>
                </div>
                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto">
                  <ArrowLeftRight className="w-4 h-4 opacity-40" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Inversé</span>
                  <code className="font-mono text-sm bg-white/50 dark:bg-black/20 px-3 py-1 rounded-lg break-all">{result.reversed}</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
                <ArrowLeftRight className="w-8 h-8" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {t('palindrome.empty_hint', 'Entrez du texte pour vérifier s\'il s\'agit d\'un palindrome.')}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl p-6 text-sm text-indigo-900 dark:text-indigo-400 flex gap-4 items-start">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold mb-1">{t('palindrome.about_title', 'Qu\'est-ce qu\'un palindrome ?')}</p>
          <p className="opacity-80 leading-relaxed">
            {t('palindrome.about_text', 'Un palindrome est un mot, une phrase ou une séquence de caractères qui se lit de la même manière dans les deux sens, en ignorant généralement la casse, les accents, la ponctuation et les espaces. Exemple : "Radar", "Laval", ou encore "Ésope reste ici et se repose".')}
          </p>
        </div>
      </div>
    </div>
  );
}
