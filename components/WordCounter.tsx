import { useState, useMemo, useDeferredValue, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, Hash, Type, FileText, AlignLeft, Clock, MessageSquare, BarChart3, Info, Star, AlertCircle, Download, Pilcrow, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function WordCounter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [copied, setCopied] = useState(false);
  const [copiedStats, setCopiedStats] = useState(false);
  const [copiedCharFreq, setCopiedCharFreq] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ text });
  }, [text]);

  const deferredText = useDeferredValue(text);

  const stats = useMemo(() => {
    if (deferredText.length > MAX_LENGTH) {
      return {
        characters: deferredText.length,
        charactersNoSpaces: 0,
        words: 0,
        lines: 0,
        paragraphs: 0,
        sentences: 0,
        readingTime: 0,
        speakingTime: 0,
        writingTime: 0,
        ari: 0,
        ariGrade: 'N/A',
        cli: 0,
        fog: 0,
        avgWordLength: 0,
        longestWord: 'N/A',
        topWords: [],
        topBigrams: [],
        charFreq: [] as [string, number][]
      };
    }
    const trimmed = deferredText.trim();
    const words = trimmed === '' ? [] : trimmed.split(/\s+/);
    const wordCount = words.length;

    const wordFreq: Record<string, number> = Object.create(null);
    words.forEach((w: string) => {
      const clean = w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      if (clean && clean.length > 1) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    });

    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const bigramFreq: Record<string, number> = Object.create(null);
    for (let i = 0; i < words.length - 1; i++) {
      const w1 = words[i].toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      const w2 = words[i+1].toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      if (w1 && w2 && w1.length > 1 && w2.length > 1) {
        const bigram = `${w1} ${w2}`;
        bigramFreq[bigram] = (bigramFreq[bigram] || 0) + 1;
      }
    }
    const topBigrams = Object.entries(bigramFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const sentenceCount = trimmed === '' ? 0 : deferredText.split(/[.!?]+(?:\s|$)/).filter((s: string) => s.trim().length > 0).length;
    const charCount = deferredText.replace(/\s/g, '').length;
    const paragraphCount = trimmed === '' ? 0 : deferredText.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0).length;

    let ari = 0;
    if (wordCount > 0 && sentenceCount > 0) {
      ari = 4.71 * (charCount / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43;
    }

    const countSyllables = (word: string) => {
      word = word.toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüÿç]/g, '');
      if (word.length === 0) return 0;
      if (word.length <= 2) return 1;

      if (word.endsWith('e')) {
        if (word.length > 3 && /[aeiouyàâäéèêëîïôöùûüÿ][bcdfghjklmnpqrstvwxz]e$/.test(word)) {
           word = word.slice(0, -1);
        }
      }

      if (word.endsWith('ent')) {
        if (word.length > 5 && /[aeiouyàâäéèêëîïôöùûüÿ][bcdfghjklmnpqrstvwxz]ent$/.test(word)) {
          word = word.slice(0, -3);
        }
      }

      const matched = word.match(/[aeiouyàâäéèêëîïôöùûüÿ]{1,3}/g);
      let count = matched ? matched.length : 1;

      if (word.endsWith('le') && word.length > 2 && !/[aeiouy]/.test(word[word.length-3])) count++;

      return Math.max(1, count);
    };

    let complexWords = 0;
    let totalSyllables = 0;
    words.forEach((w: string) => {
      const syl = countSyllables(w);
      totalSyllables += syl;
      if (syl >= 3) complexWords++;
    });

    let fog = 0;
    if (wordCount > 0 && sentenceCount > 0) {
      fog = 0.4 * ((wordCount / sentenceCount) + 100 * (complexWords / wordCount));
    }

    let cli = 0;
    if (wordCount > 0) {
      const L = (charCount / wordCount) * 100;
      const S = (sentenceCount / wordCount) * 100;
      cli = 0.0588 * L - 0.296 * S - 15.8;
    }

    const getAriGrade = (score: number) => {
      const rounded = Math.ceil(score);
      if (rounded <= 1) return t('wordcounter.ari.grade_1');
      if (rounded === 2) return t('wordcounter.ari.grade_2');
      if (rounded === 3) return t('wordcounter.ari.grade_3');
      if (rounded === 4) return t('wordcounter.ari.grade_4');
      if (rounded === 5) return t('wordcounter.ari.grade_5');
      if (rounded === 6) return t('wordcounter.ari.grade_6');
      if (rounded === 7) return t('wordcounter.ari.grade_7');
      if (rounded === 8) return t('wordcounter.ari.grade_8');
      if (rounded === 9) return t('wordcounter.ari.grade_9');
      if (rounded === 10) return t('wordcounter.ari.grade_10');
      if (rounded === 11) return t('wordcounter.ari.grade_11');
      if (rounded === 12) return t('wordcounter.ari.grade_12');
      if (rounded === 13) return t('wordcounter.ari.university');
      return t('wordcounter.ari.expert');
    };

    let flesch = 0;
    if (wordCount > 0 && sentenceCount > 0) {
      const asl = wordCount / sentenceCount;
      const asw = totalSyllables / wordCount;
      flesch = 206.835 - (1.015 * asl) - (84.6 * asw);
    }

    const getFleschLevel = (score: number) => {
      if (score >= 90) return t('wordcounter.flesch.very_easy');
      if (score >= 80) return t('wordcounter.flesch.easy');
      if (score >= 70) return t('wordcounter.flesch.fairly_easy');
      if (score >= 60) return t('wordcounter.flesch.standard');
      if (score >= 50) return t('wordcounter.flesch.fairly_difficult');
      if (score >= 30) return t('wordcounter.flesch.difficult');
      return t('wordcounter.flesch.very_difficult');
    };

    const charFreq = Object.entries(deferredText.replace(/\s/g, '').split('').reduce((acc: Record<string, number>, char: string) => {
      acc[char] = (acc[char] || 0) + 1;
      return acc;
    }, Object.create(null))).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10) as [string, number][];

    const avgWordLength = wordCount > 0 ? (words.reduce((sum: number, w: string) => sum + w.length, 0) / wordCount).toFixed(1) : 0;
    const longestWord = words.length > 0 ? words.reduce((a: string, b: string) => a.length > b.length ? a : b, '') : 'N/A';

    return {
      characters: deferredText.length,
      charactersNoSpaces: charCount,
      words: wordCount,
      lines: deferredText === '' ? 0 : deferredText.split('\n').length,
      paragraphs: paragraphCount,
      sentences: sentenceCount,
      readingTime: wordCount / 200,
      readingTimeSlow: wordCount / 150,
      readingTimeFast: wordCount / 250,
      speakingTime: wordCount / 130,
      writingTime: wordCount / 40,
      ari: ari > 0 ? ari.toFixed(1) : 0,
      ariGrade: getAriGrade(ari),
      cli: cli.toFixed(1),
      fog: fog.toFixed(1),
      flesch: flesch.toFixed(1),
      fleschLevel: getFleschLevel(flesch),
      avgWordLength,
      longestWord,
      topWords,
      topBigrams,
      charFreq
    };
  }, [deferredText, t]);

  const formatTime = (minutes: number) => {
    if (minutes === 0) return "0s";
    if (minutes < 1 / 60) return t('wordcounter.time.less_than_second');
    if (minutes < 1) return t('wordcounter.time.seconds', { count: Math.round(minutes * 60) });

    const totalSeconds = Math.round(minutes * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return secs > 0 ? t('wordcounter.time.minutes_seconds', { m: mins, s: secs }) : t('wordcounter.time.minutes', { count: mins });
  };

  const handleCopy = useCallback(() => {
    if (text.length > MAX_LENGTH) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const handleCopyCharFreq = () => {
    if (stats.charFreq.length === 0) return;
    const report = `${t('wordcounter.char_freq_report')}:\n` + stats.charFreq.map(([char, count]) => `- ${char} : ${count} (${((count / stats.charactersNoSpaces) * 100).toFixed(1)}%)`).join('\n');
    navigator.clipboard.writeText(report);
    setCopiedCharFreq(true);
    setTimeout(() => setCopiedCharFreq(false), 2000);
  };

  const handleDownload = useCallback(() => {
    if (!text || text.length > MAX_LENGTH) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `texte-analyse-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [text]);

  const handleCopyStats = useCallback(() => {
    const report = `${t('wordcounter.report_title')}:
- ${t('wordcounter.stat.characters')}: ${stats.characters}
- ${t('wordcounter.stat.words')}: ${stats.words}
- ${t('wordcounter.stat.lines')}: ${stats.lines}
- ${t('wordcounter.stat.paragraphs')}: ${stats.paragraphs}
- ${t('wordcounter.stat.sentences')}: ${stats.sentences}
- ${t('wordcounter.stat.readability')} (ARI): ${stats.ari} (${stats.ariGrade})
- Coleman-Liau Index: ${stats.cli}
- Gunning Fog Index: ${stats.fog}
- ${t('wordcounter.stat.flesch')}: ${stats.flesch} (${stats.fleschLevel})
- ${t('wordcounter.stat.reading_time')} (${t('wordcounter.reading_speed.average')}): ~${stats.readingTime.toFixed(1)} min
- ${t('wordcounter.stat.speaking_time')}: ~${stats.speakingTime.toFixed(1)} min`;

    navigator.clipboard.writeText(report);
    setCopiedStats(true);
    setTimeout(() => setCopiedStats(false), 2000);
  }, [stats, t]);

  const handleClear = useCallback(() => {
    setText('');
    setError(null);
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key === "Escape") {
        e.preventDefault();
        handleClear();
        return;
      }

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleCopyStats();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClear, handleCopy, handleCopyStats]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div role="alert" className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="word-counter-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('wordcounter.your_text')}</label>
          <div className="flex gap-2">
            <button
              onClick={handleCopyStats}
              disabled={!text || text.length > MAX_LENGTH}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border ${
                copiedStats
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 border-transparent hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={`${t('wordcounter.copy_stats')} (S)`}
            >
              {copiedStats ? <Check className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />}
              {copiedStats ? t('common.copied') : t('wordcounter.copy_stats_btn')}
              {!copiedStats && <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold bg-white/50 dark:bg-black/20 ml-1">S</kbd>}
            </button>
            <button
              onClick={handleDownload}
              disabled={!text || text.length > MAX_LENGTH}
              className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Download className="w-3 h-3" /> {t('common.download')}
            </button>
            <button
              onClick={handleCopy}
              disabled={!text}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={`${t('common.copy')} (C)`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
              {!copied && <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold bg-white/50 dark:bg-black/20 ml-1">C</kbd>}
            </button>
            <button
              onClick={handleClear}
              disabled={!text}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              title={`${t('common.clear')} (Esc)`}
            >
              <RotateCcw className="w-3 h-3" /> {t('common.clear')}
              <kbd className="ml-1 hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold bg-white/50 dark:bg-black/20">Esc</kbd>
            </button>
          </div>
        </div>
        <textarea
          id="word-counter-input"
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            const val = e.target.value;
            setText(val);
            if (val.length > MAX_LENGTH) {
              setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
            } else {
              setError(null);
            }
          }}
          onKeyDown={(e) => {
             if (e.key === 'Escape') {
                e.preventDefault();
                handleClear();
             }
          }}
          placeholder={t('wordcounter.placeholder')}
          className={`w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-[2rem] outline-none focus:ring-2 transition-all text-lg leading-relaxed dark:text-slate-300`}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { icon: <Hash className="w-4 h-4" />, label: t('wordcounter.stat.characters'), value: stats.characters },
          { icon: <Hash className="w-4 h-4" />, label: t('wordcounter.stat.characters_no_spaces'), value: stats.charactersNoSpaces },
          { icon: <Type className="w-4 h-4" />, label: t('wordcounter.stat.words'), value: stats.words },
          { icon: <FileText className="w-4 h-4" />, label: t('wordcounter.stat.lines'), value: stats.lines },
          { icon: <Pilcrow className="w-4 h-4" />, label: t('wordcounter.stat.paragraphs'), value: stats.paragraphs },
          { icon: <AlignLeft className="w-4 h-4" />, label: t('wordcounter.stat.sentences'), value: stats.sentences },
          { icon: <Star className="w-4 h-4" />, label: t('wordcounter.stat.cli'), value: stats.cli },
          { icon: <Star className="w-4 h-4" />, label: t('wordcounter.stat.fog'), value: stats.fog },
          { icon: <Type className="w-4 h-4" />, label: t('wordcounter.stat.avg_word_length'), value: stats.avgWordLength },
          { icon: <Type className="w-4 h-4" />, label: t('wordcounter.stat.longest_word'), value: stats.longestWord },
          { icon: <Clock className="w-4 h-4" />, label: t('wordcounter.stat.reading'), value: formatTime(stats.readingTime) },
          { icon: <MessageSquare className="w-4 h-4" />, label: t('wordcounter.stat.speaking'), value: formatTime(stats.speakingTime) },
          { icon: <FileText className="w-4 h-4" />, label: t('wordcounter.stat.writing'), value: formatTime(stats.writingTime) },
        ].map((stat) => (
          <div key={stat.label} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
            <div className="text-indigo-500 dark:text-indigo-400">{stat.icon}</div>
            <div
              className="text-2xl font-black font-mono tracking-tight dark:text-white"
              aria-live="polite"
              aria-atomic="true"
            >
              {stat.value}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setText(text.toUpperCase())}
          className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
        >
          {t('wordcounter.btn.uppercase')}
        </button>
        <button
          onClick={() => setText(text.toLowerCase())}
          className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
        >
          {t('wordcounter.btn.lowercase')}
        </button>
        <button
          onClick={() => setText(text.replace(/\b\w+/g, (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))}
          className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          {t('wordcounter.btn.capitalize')}
        </button>
        <button
          onClick={() => setText(text.toLowerCase().replace(/(^\w|[.!?]\s+\w)/gm, (s: string) => s.toUpperCase()))}
          className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          {t('wordcounter.btn.sentence_mode')}
        </button>
      </div>

      {stats.topWords.length > 0 && (
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> {t('wordcounter.top_words')}
            </h3>
            <div className="flex flex-wrap gap-3">
              {stats.topWords.map(([word, count]) => (
                <div
                  key={word}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3 group transition-all hover:border-indigo-500/30"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300">{word}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {count}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      ({((count as number / stats.words) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-12">
            {stats.topBigrams.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> {t('wordcounter.top_bigrams')}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {stats.topBigrams.map(([bigram, count]) => (
                    <div
                      key={bigram}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3 group transition-all hover:border-indigo-500/30"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-300">{bigram}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Hash className="w-4 h-4" /> {t('wordcounter.char_freq')}
              </h3>
              <button
                onClick={handleCopyCharFreq}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 border ${
                  copiedCharFreq
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-indigo-600 dark:text-indigo-400 border-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                }`}
              >
                {copiedCharFreq ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedCharFreq ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {stats.charFreq.map(([char, count]) => (
                <div key={char} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col items-center gap-1 group hover:border-indigo-500/30 transition-all">
                  <span className="text-lg font-black dark:text-white">{char}</span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{count} ({((count as number / stats.charactersNoSpaces) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Time & Readability Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="space-y-6">
            <h4 className="font-bold dark:text-white flex items-center gap-2">
               <Clock className="w-4 h-4 text-indigo-500" /> {t('wordcounter.reading_time_title', 'Estimated Reading Time')}
            </h4>
            <div className="space-y-3">
              {[
                { label: t('wordcounter.reading_speed.slow'), speed: '150 wpm', value: formatTime(stats.readingTimeSlow || 0) },
                { label: t('wordcounter.reading_speed.average'), speed: '200 wpm', value: formatTime(stats.readingTime || 0), primary: true },
                { label: t('wordcounter.reading_speed.fast'), speed: '250 wpm', value: formatTime(stats.readingTimeFast || 0) },
              ].map((r) => (
                <div key={r.label} className={`flex justify-between items-center p-3 rounded-xl border ${r.primary ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500/30' : 'bg-transparent border-transparent'}`}>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">{r.label}</div>
                    <div className="text-[10px] font-bold text-indigo-500/50">{r.speed}</div>
                  </div>
                  <div className={`text-lg font-black font-mono ${r.primary ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>{r.value}</div>
                </div>
              ))}
            </div>
         </div>

         <div className="space-y-4 lg:border-x lg:border-indigo-100 lg:dark:border-indigo-500/20 lg:px-8">
            <h4 className="font-bold dark:text-white flex items-center gap-2">
               <Star className="w-4 h-4 text-indigo-500" /> {t('wordcounter.flesch_title')}
            </h4>
            <div className="flex items-center gap-4">
               <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {stats.flesch}
               </div>
               <div>
                  <div className="text-sm font-bold dark:text-white">{stats.fleschLevel}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{t('wordcounter.flesch_subtitle')}</div>
               </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
               {t('wordcounter.flesch_description')}
            </p>
         </div>
         <div className="space-y-4">
            <h4 className="font-bold dark:text-white flex items-center gap-2">
               <BarChart3 className="w-4 h-4 text-indigo-500" /> {t('wordcounter.density_title')}
            </h4>
            <div className="space-y-3">
              {stats.topWords.slice(0, 5).map(([word, count]) => (
                <div key={word} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="dark:text-slate-300">{word}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{((count as number / stats.words) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${(count as number / stats.words) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
               {t('wordcounter.density_description')}
            </p>
         </div>
      </div>

      {/* Educational Content */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('wordcounter.guide_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('wordcounter.guide_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" /> {t('wordcounter.tech_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('wordcounter.tech_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" /> FAQ
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('wordcounter.faq_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
