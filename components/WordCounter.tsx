import { useState, useMemo, useDeferredValue } from 'react';
import { Copy, Check, Trash2, Hash, Type, FileText, AlignLeft, Clock, MessageSquare, BarChart3, Info, Star, AlertCircle } from 'lucide-react';

const MAX_LENGTH = 100000;

export function WordCounter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedStats, setCopiedStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⚡ Bolt Optimization: useDeferredValue for text analysis
  // This allows the input to remain responsive even with large texts by offloading the
  // expensive regex-based calculations to a lower-priority transition.
  const deferredText = useDeferredValue(text);

  // ⚡ Bolt Optimization: useMemo to avoid redundant calculations
  // We consolidate string operations (trimming, splitting) to minimize CPU usage.
  const stats = useMemo(() => {
    if (deferredText.length > MAX_LENGTH) {
      return {
        characters: deferredText.length,
        charactersNoSpaces: 0,
        words: 0,
        lines: 0,
        sentences: 0,
        readingTime: 0,
        speakingTime: 0,
        ari: 0,
        ariGrade: 'N/A',
        topWords: []
      };
    }
    const trimmed = deferredText.trim();
    const words = trimmed === '' ? [] : trimmed.split(/\s+/);
    const wordCount = words.length;

    // Sentinel: Use Object.create(null) to prevent Prototype Pollution
    // from user-provided words (e.g., "constructor", "toString").
    const wordFreq: Record<string, number> = Object.create(null);
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      if (clean && clean.length > 1) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    });

    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const sentenceCount = trimmed === '' ? 0 : deferredText.split(/[.!?]+(?:\s|$)/).filter(s => s.trim().length > 0).length;
    const charCount = deferredText.replace(/\s/g, '').length;

    // Automated Readability Index (ARI)
    // ARI = 4.71 * (characters/words) + 0.5 * (words/sentences) - 21.43
    let ari = 0;
    if (wordCount > 0 && sentenceCount > 0) {
      ari = 4.71 * (charCount / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43;
    }

    const getAriGrade = (score: number) => {
      const rounded = Math.ceil(score);
      if (rounded <= 1) return "CP";
      if (rounded === 2) return "CE1";
      if (rounded === 3) return "CE2";
      if (rounded === 4) return "CM1";
      if (rounded === 5) return "CM2";
      if (rounded === 6) return "6ème";
      if (rounded === 7) return "5ème";
      if (rounded === 8) return "4ème";
      if (rounded === 9) return "3ème";
      if (rounded === 10) return "Seconde";
      if (rounded === 11) return "Première";
      if (rounded === 12) return "Terminale";
      if (rounded === 13) return "Université";
      return "Expert / Académique";
    };

    return {
      characters: deferredText.length,
      charactersNoSpaces: charCount,
      words: wordCount,
      lines: deferredText === '' ? 0 : deferredText.split('\n').length,
      sentences: sentenceCount,
      readingTime: wordCount / 200,
      speakingTime: wordCount / 130,
      ari: ari > 0 ? ari.toFixed(1) : 0,
      ariGrade: getAriGrade(ari),
      topWords
    };
  }, [deferredText]);

  const formatTime = (minutes: number) => {
    if (minutes === 0) return "0s";
    if (minutes < 1 / 60) return "moins d'une seconde";
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;

    const totalSeconds = Math.round(minutes * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const handleCopy = () => {
    if (text.length > MAX_LENGTH) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyStats = () => {
    const report = `Rapport de texte :
- Caractères : ${stats.characters}
- Mots : ${stats.words}
- Lignes : ${stats.lines}
- Phrases : ${stats.sentences}
- Lisibilité (ARI) : ${stats.ari} (${stats.ariGrade})
- Temps de lecture : ~${stats.readingTime} min
- Temps de parole : ~${stats.speakingTime} min`;

    navigator.clipboard.writeText(report);
    setCopiedStats(true);
    setTimeout(() => setCopiedStats(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="word-counter-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Votre Texte</label>
          <div className="flex gap-2">
            <button
              onClick={handleCopyStats}
              disabled={!text || text.length > MAX_LENGTH}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copiedStats ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Copier les statistiques"
            >
              {copiedStats ? <Check className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />}
              {copiedStats ? 'Stats copiées' : 'Copier stats'}
            </button>
            <button
              onClick={handleCopy}
              disabled={!text}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
            </button>
            <button
              onClick={() => {
                setText('');
                setError(null);
              }}
              disabled={!text}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        </div>
        <textarea
          id="word-counter-input"
          value={text}
          onChange={(e) => {
            const val = e.target.value;
            setText(val);
            if (val.length > MAX_LENGTH) {
              setError(`L'entrée est trop longue. Limite de ${MAX_LENGTH.toLocaleString()} caractères.`);
            } else {
              setError(null);
            }
          }}
          placeholder="Commencez à taper..."
          className={`w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-[2rem] outline-none focus:ring-2 transition-all text-lg leading-relaxed dark:text-slate-300`}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { icon: <Hash className="w-4 h-4" />, label: 'Caractères', value: stats.characters },
          { icon: <Hash className="w-4 h-4" />, label: 'Sans espaces', value: stats.charactersNoSpaces },
          { icon: <Type className="w-4 h-4" />, label: 'Mots', value: stats.words },
          { icon: <FileText className="w-4 h-4" />, label: 'Lignes', value: stats.lines },
          { icon: <AlignLeft className="w-4 h-4" />, label: 'Phrases', value: stats.sentences },
          { icon: <Star className="w-4 h-4" />, label: 'Lisibilité', value: stats.ariGrade },
          { icon: <Clock className="w-4 h-4" />, label: 'Lecture', value: formatTime(stats.readingTime) },
          { icon: <MessageSquare className="w-4 h-4" />, label: 'Parole', value: formatTime(stats.speakingTime) },
        ].map((stat) => (
          <div key={stat.label} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
            <div className="text-indigo-500 dark:text-indigo-400">{stat.icon}</div>
            <div className="text-2xl font-black font-mono tracking-tight dark:text-white">{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setText(text.toUpperCase())}
          className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
        >
          MAJUSCULES
        </button>
        <button
          onClick={() => setText(text.toLowerCase())}
          className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
        >
          minuscules
        </button>
        <button
          onClick={() => setText(text.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))}
          className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          Capitaliser
        </button>
        <button
          onClick={() => setText(text.toLowerCase().replace(/(^\w|[.!?]\s+\w)/gm, s => s.toUpperCase()))}
          className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          Mode phrase
        </button>
      </div>

      {stats.topWords.length > 0 && (
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Mots les plus fréquents
          </h3>
          <div className="flex flex-wrap gap-3">
            {stats.topWords.map(([word, count]) => (
              <div
                key={word}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3 group transition-all hover:border-indigo-500/30"
              >
                <span className="font-bold text-slate-700 dark:text-slate-300">{word}</span>
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educational Content */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Collez simplement votre texte dans la zone de saisie. Les statistiques se mettent à jour instantanément. Vous pouvez utiliser les boutons pour changer la casse du texte ou copier les rapports de statistiques détaillés.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" /> Détails Techniques
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le comptage des mots utilise une expression régulière robuste pour identifier les séparateurs. Le temps de lecture est estimé sur une base de 200 mots/minute, tandis que le temps de parole est calculé sur 130 mots/minute.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" /> FAQ
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong>Mes données sont-elles privées ?</strong> Absolument. Aucun texte n'est envoyé à un serveur. Tout le traitement est effectué localement sur votre appareil.
          </p>
        </div>
      </div>
    </div>
  );
}
