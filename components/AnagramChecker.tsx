import { useState, useEffect, useMemo } from 'react';
import { Type, Info, Check, X, Trash2, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AnagramChecker({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text1, setText1] = useState(initialData?.text1 || '');
  const [text2, setText2] = useState(initialData?.text2 || '');
  const [ignoreCase, setIgnoreCase] = useState(initialData?.ignoreCase ?? true);
  const [ignoreSpaces, setIgnoreSpaces] = useState(initialData?.ignoreSpaces ?? true);
  const [ignorePunctuation, setIgnorePunctuation] = useState(initialData?.ignorePunctuation ?? true);

  useEffect(() => {
    onStateChange?.({ text1, text2, ignoreCase, ignoreSpaces, ignorePunctuation });
  }, [text1, text2, ignoreCase, ignoreSpaces, ignorePunctuation, onStateChange]);

  const cleanString = (str: string) => {
    let result = str;
    if (ignoreCase) result = result.toLowerCase();
    if (ignoreSpaces) result = result.replace(/\s+/g, '');
    if (ignorePunctuation) result = result.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    return result.split('').sort().join('');
  };

  const isAnagram = useMemo(() => {
    if (!text1.trim() || !text2.trim()) return null;
    return cleanString(text1) === cleanString(text2);
  }, [text1, text2, ignoreCase, ignoreSpaces, ignorePunctuation]);

  const handleClear = () => {
    setText1('');
    setText2('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center px-1">
         <div className="flex items-center gap-2 text-indigo-500">
            <ArrowLeftRight className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('anagram.title', 'Anagram Checker')}</h3>
         </div>
         <button
           onClick={handleClear}
           disabled={!text1 && !text2}
           className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
         >
           <Trash2 className="w-3 h-3" /> {t('common.clear')}
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <label htmlFor="text1" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">{t('anagram.text1', 'First Text')}</label>
          <textarea
            id="text1"
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            placeholder={t('anagram.placeholder1', 'Enter first word or phrase...')}
            className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
        <div className="space-y-4">
          <label htmlFor="text2" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">{t('anagram.text2', 'Second Text')}</label>
          <textarea
            id="text2"
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            placeholder={t('anagram.placeholder2', 'Enter second word or phrase...')}
            className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {[
          { label: t('anagram.ignore_case', 'Ignore Case'), state: ignoreCase, set: setIgnoreCase },
          { label: t('anagram.ignore_spaces', 'Ignore Spaces'), state: ignoreSpaces, set: setIgnoreSpaces },
          { label: t('anagram.ignore_punct', 'Ignore Punctuation'), state: ignorePunctuation, set: setIgnorePunctuation },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => opt.set(!opt.state)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              opt.state
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-8">
        {isAnagram === null ? (
          <div className="text-slate-400 font-bold italic animate-pulse">
            {t('anagram.waiting', 'Enter two texts to compare')}
          </div>
        ) : isAnagram ? (
          <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <Check className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">{t('anagram.success', "It's an Anagram!")}</h4>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('anagram.success_desc', 'Both texts contain exactly the same characters.')}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-rose-500/20">
              <X className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h4 className="text-2xl font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">{t('anagram.fail', 'Not an Anagram')}</h4>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('anagram.fail_desc', "The character sets don't match.")}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('anagram.about_title', 'What is an Anagram?')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('anagram.about_text', 'An anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once. For example, the word "binary" can be rearranged into "brainy".')}
          </p>
        </div>
      </div>
    </div>
  );
}
