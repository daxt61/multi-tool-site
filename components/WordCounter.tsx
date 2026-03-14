import { useState, useMemo, useDeferredValue } from 'react';
import { Copy, Check, Trash2, Hash, Type, FileText, AlignLeft, Clock, MessageSquare, BarChart3, Info, Weight, Layout } from 'lucide-react';

export function WordCounter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedStats, setCopiedStats] = useState(false);

  // ⚡ Bolt Optimization: useDeferredValue for text analysis
  const deferredText = useDeferredValue(text);

  // ⚡ Bolt Optimization: useMemo to avoid redundant calculations
  const stats = useMemo(() => {
    const trimmed = deferredText.trim();
    const words = trimmed === '' ? [] : trimmed.split(/\s+/);
    const wordCount = words.length;

    const wordFreq: Record<string, number> = {};
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      if (clean && clean.length > 1) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    });

    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Calculate weight (estimated bytes in UTF-8)
    const weight = new Blob([deferredText]).size;
    const formattedWeight = weight < 1024
      ? `${weight} B`
      : weight < 1024 * 1024
        ? `${(weight / 1024).toFixed(1)} KB`
        : `${(weight / (1024 * 1024)).toFixed(1)} MB`;

    return {
      characters: deferredText.length,
      charactersNoSpaces: deferredText.replace(/\s/g, '').length,
      words: wordCount,
      lines: deferredText === '' ? 0 : deferredText.split('\n').length,
      paragraphs: deferredText === '' ? 0 : deferredText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
      sentences: trimmed === '' ? 0 : deferredText.split(/[.!?]+(?:\s|$)/).filter(s => s.trim().length > 0).length,
      readingTime: Math.ceil(wordCount / 200),
      speakingTime: Math.ceil(wordCount / 130),
      weight: formattedWeight,
      topWords
    };
  }, [deferredText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyStats = () => {
    const report = `Rapport de texte :
- Caractères : ${stats.characters}
- Caractères (sans espaces) : ${stats.charactersNoSpaces}
- Mots : ${stats.words}
- Lignes : ${stats.lines}
- Paragraphes : ${stats.paragraphs}
- Phrases : ${stats.sentences}
- Poids : ${stats.weight}
- Temps de lecture : ~${stats.readingTime} min
- Temps de parole : ~${stats.speakingTime} min`;

    navigator.clipboard.writeText(report);
    setCopiedStats(true);
    setTimeout(() => setCopiedStats(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="word-counter-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Texte</label>
          <div className="flex gap-2">
            <button
              onClick={handleCopyStats}
              disabled={!text}
              className={`text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 ${copiedStats ? 'bg-emerald-500 text-white' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100'} disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
              title="Copier les statistiques"
            >
              {copiedStats ? <Check className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />}
              {copiedStats ? 'Stats copiées' : 'Rapport complet'}
            </button>
            <button
              onClick={handleCopy}
              className={`text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'} shadow-sm`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier texte'}
            </button>
            <button
              onClick={() => setText('')}
              className="text-xs font-bold px-4 py-2 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-2 shadow-sm"
              aria-label="Effacer tout"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        </div>
        <textarea
          id="word-counter-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Commencez à taper ou collez votre contenu ici..."
          className="w-full h-96 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 shadow-inner"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[
          { icon: <Hash className="w-4 h-4" />, label: 'Caractères', value: stats.characters },
          { icon: <Type className="w-4 h-4" />, label: 'Mots', value: stats.words },
          { icon: <Layout className="w-4 h-4" />, label: 'Paragraphes', value: stats.paragraphs },
          { icon: <FileText className="w-4 h-4" />, label: 'Lignes', value: stats.lines },
          { icon: <AlignLeft className="w-4 h-4" />, label: 'Phrases', value: stats.sentences },
          { icon: <Weight className="w-4 h-4" />, label: 'Poids', value: stats.weight },
          { icon: <Clock className="w-4 h-4" />, label: 'Lecture', value: `${stats.readingTime}m` },
          { icon: <MessageSquare className="w-4 h-4" />, label: 'Parole', value: `${stats.speakingTime}m` },
        ].map((stat) => (
          <div key={stat.label} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-2 group hover:border-indigo-500/30 transition-all">
            <div className="text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform">{stat.icon}</div>
            <div className="text-2xl font-black font-mono tracking-tight dark:text-white">{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl w-fit">
        <button
          onClick={() => setText(text.toUpperCase())}
          className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:border-indigo-500 transition-all shadow-sm"
        >
          MAJUSCULES
        </button>
        <button
          onClick={() => setText(text.toLowerCase())}
          className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:border-indigo-500 transition-all shadow-sm"
        >
          minuscules
        </button>
        <button
          onClick={() => setText(text.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))}
          className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:border-indigo-500 transition-all shadow-sm"
        >
          Capitaliser
        </button>
      </div>

      {stats.topWords.length > 0 && (
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 px-1">
            <BarChart3 className="w-4 h-4" /> Analyse de densité des mots
          </h3>
          <div className="flex flex-wrap gap-3">
            {stats.topWords.map(([word, count]) => (
              <div
                key={word}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3 group transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <span className="font-bold text-slate-700 dark:text-slate-200">{word}</span>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educational Content */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Collez votre texte pour obtenir une analyse complète en temps réel. Utilisez le bouton "Rapport complet" pour copier toutes les statistiques formatées pour un document ou un email.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> Estimations de Temps
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le temps de lecture est calculé sur une moyenne de 200 mots par minute (standard pour la lecture silencieuse). Le temps de parole est estimé à 130 mots par minute (rythme naturel de présentation).
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Weight className="w-4 h-4 text-indigo-500" /> Poids Numérique
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le poids correspond à la taille du fichier texte brut encodé en UTF-8. C'est une mesure utile pour vérifier les limites de taille de fichiers ou de stockage en base de données.
          </p>
        </div>
      </div>
    </div>
  );
}
