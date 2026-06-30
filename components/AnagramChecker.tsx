import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Shuffle, Check, X, Info, Settings2, Trash2, AlertCircle, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function AnagramChecker({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const text1Ref = useRef<HTMLTextAreaElement>(null);

  const [text1, setText1] = useState(initialData?.text1 || '');
  const [text2, setText2] = useState(initialData?.text2 || '');
  const [options, setOptions] = useState({
    ignoreCase: initialData?.ignoreCase ?? true,
    ignoreSpaces: initialData?.ignoreSpaces ?? true,
    ignoreAccents: initialData?.ignoreAccents ?? true,
    ignorePunctuation: initialData?.ignorePunctuation ?? true,
  });

  useEffect(() => {
    onStateChange?.({ text1, text2, ...options });
  }, [text1, text2, options, onStateChange]);

  const normalize = useCallback((str: string) => {
    let normalized = str;
    if (options.ignoreCase) normalized = normalized.toLowerCase();
    if (options.ignoreAccents) {
      normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    if (options.ignoreSpaces) normalized = normalized.replace(/\s+/g, '');
    if (options.ignorePunctuation) {
      normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    }
    return normalized;
  }, [options]);

  const getCharFrequency = (str: string) => {
    const freq: Record<string, number> = {};
    const normalized = normalize(str);
    for (const char of normalized) {
      freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
  };

  const analysis = useMemo(() => {
    if (!text1.trim() || !text2.trim()) return null;

    const freq1 = getCharFrequency(text1);
    const freq2 = getCharFrequency(text2);

    const allChars = Array.from(new Set([...Object.keys(freq1), ...Object.keys(freq2)])).sort();
    let isAnagram = true;

    if (Object.keys(freq1).length !== Object.keys(freq2).length) {
      isAnagram = false;
    } else {
      for (const char of allChars) {
        if (freq1[char] !== freq2[char]) {
          isAnagram = false;
          break;
        }
      }
    }

    return { freq1, freq2, allChars, isAnagram };
  }, [text1, text2, normalize]);

  const handleClear = useCallback(() => {
    setText1('');
    setText2('');
    text1Ref.current?.focus();
  }, []);

  const isTooLong = text1.length > MAX_LENGTH || text2.length > MAX_LENGTH;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {isTooLong && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {t('error.max_length', { max: MAX_LENGTH.toLocaleString() })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inputs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="anagram-text1" className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('anagram.text1_label') || 'First Text'}
                </label>
                <span className="text-[10px] font-bold text-slate-400 tabular-nums">{text1.length.toLocaleString()}</span>
              </div>
              <textarea
                id="anagram-text1"
                ref={text1Ref}
                value={text1}
                onChange={(e) => setText1(e.target.value)}
                placeholder={t('anagram.placeholder1') || 'Enter first word or phrase...'}
                className="w-full h-40 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-medium"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="anagram-text2" className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('anagram.text2_label') || 'Second Text'}
                </label>
                <span className="text-[10px] font-bold text-slate-400 tabular-nums">{text2.length.toLocaleString()}</span>
              </div>
              <textarea
                id="anagram-text2"
                value={text2}
                onChange={(e) => setText2(e.target.value)}
                placeholder={t('anagram.placeholder2') || 'Enter second word or phrase...'}
                className="w-full h-40 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-medium"
              />
            </div>
          </div>

          {/* Results Status */}
          {analysis && (
            <div className={`p-6 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-4 transition-all animate-in zoom-in-95 duration-300 ${
              analysis.isAnagram
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
            }`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${analysis.isAnagram ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                {analysis.isAnagram ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black">
                  {analysis.isAnagram ? (t('anagram.is_anagram') || 'It\'s an Anagram!') : (t('anagram.not_anagram') || 'Not an Anagram')}
                </h3>
                <p className="text-sm font-medium opacity-80 mt-1">
                  {analysis.isAnagram
                    ? (t('anagram.success_msg') || 'Both texts contain exactly the same characters.')
                    : (t('anagram.fail_msg') || 'The character counts do not match.')}
                </p>
              </div>
            </div>
          )}

          {/* Detailed Stats */}
          {analysis && (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-2 px-1">
                <BarChart2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('anagram.char_distribution') || 'Character Distribution'}
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {analysis.allChars.map(char => {
                  const c1 = analysis.freq1[char] || 0;
                  const c2 = analysis.freq2[char] || 0;
                  const matches = c1 === c2;

                  return (
                    <div key={char} className={`p-3 rounded-2xl border transition-all ${
                      matches
                        ? 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                        : 'bg-rose-50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-900/30'
                    }`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-black text-lg">
                          {char === ' ' ? '␣' : char}
                        </span>
                        {!matches && <AlertCircle className="w-3 h-3 text-rose-500" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold">
                        <div className="flex-1">
                          <div className="text-slate-400 uppercase tracking-tighter mb-0.5">{t('anagram.t1_short') || 'T1'}</div>
                          <div className={matches ? 'text-slate-600 dark:text-slate-400' : 'text-rose-600'}>{c1}</div>
                        </div>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                        <div className="flex-1 text-right">
                          <div className="text-slate-400 uppercase tracking-tighter mb-0.5">{t('anagram.t2_short') || 'T2'}</div>
                          <div className={matches ? 'text-slate-600 dark:text-slate-400' : 'text-rose-600'}>{c2}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar / Options */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
              </h3>
              <button
                onClick={handleClear}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>

            <div className="space-y-3">
              {[
                { id: 'ignoreCase', label: t('anagram.ignore_case') || 'Ignore Case' },
                { id: 'ignoreAccents', label: t('anagram.ignore_accents') || 'Ignore Accents' },
                { id: 'ignoreSpaces', label: t('anagram.ignore_spaces') || 'Ignore Spaces' },
                { id: 'ignorePunctuation', label: t('anagram.ignore_punct') || 'Ignore Punctuation' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setOptions(prev => ({ ...prev, [opt.id]: !prev[opt.id as keyof typeof prev] }))}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                    options[opt.id as keyof typeof options]
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold">{opt.label}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    options[opt.id as keyof typeof options] ? 'bg-white border-white text-indigo-600' : 'border-slate-200 dark:border-slate-600'
                  }`}>
                    {options[opt.id as keyof typeof options] && <Check className="w-3 h-3 stroke-[4]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-3xl space-y-4">
            <h4 className="font-bold flex items-center gap-2 dark:text-white">
              <Info className="w-4 h-4 text-indigo-500" /> {t('anagram.what_is_title') || 'What is an Anagram?'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('anagram.what_is_text') || 'An anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.'}
            </p>
            <div className="pt-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">{t('common.privacy')}</div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {t('common.privacy_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
