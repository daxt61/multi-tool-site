import { useState, useMemo } from 'react';
import { Link as LinkIcon, Copy, Check, Trash2, Info, Settings2, ShieldCheck } from 'lucide-react';

export function SlugGenerator() {
  const [text, setText] = useState('');
  const [separator, setSeparator] = useState('-');
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const stopWords = [
    'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'à', 'au', 'aux',
    'pour', 'dans', 'sur', 'par', 'avec', 'se', 'qu', 'qui', 'que', 'ce', 'ces',
    'mon', 'ton', 'son', 'notre', 'votre', 'leur', 'mes', 'tes', 'ses', 'nos',
    'vos', 'leurs', 'vers', 'chez', 'sous', 'entre'
  ];

  const slug = useMemo(() => {
    if (!text) return '';

    // 1. Normalization (handle diacritics)
    let result = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 2. Remove stop words if enabled
    if (removeStopWords) {
      const words = result.split(/\s+/);
      result = words.filter(word => !stopWords.includes(word.toLowerCase())).join(' ');
    }

    // 3. Lowercase
    if (lowercase) {
      result = result.toLowerCase();
    }

    // 4. Replace non-alphanumeric with separator
    // Validate separator to avoid invalid regex if it contains special chars
    const safeSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(/[^a-z0-9]+/gi);

    result = result
      .replace(regex, separator)
      .replace(new RegExp(`^${safeSeparator}+|${safeSeparator}+$`, 'g'), '');

    return result;
  }, [text, separator, removeStopWords, lowercase]);

  const copyToClipboard = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte à convertir</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre titre ou texte ici..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Slug généré</div>
            <div className="text-xl md:text-2xl font-mono text-white break-all leading-relaxed">
              {slug || <span className="opacity-20 italic font-sans text-lg">Le slug apparaîtra ici...</span>}
            </div>
          </div>
          <button
            onClick={copyToClipboard}
            disabled={!slug}
            className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg whitespace-nowrap ${
              copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Configuration
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">Séparateur</label>
              <div className="flex gap-2">
                {['-', '_', '.', ''].map(s => (
                  <button
                    key={s}
                    onClick={() => setSeparator(s)}
                    className={`px-4 py-2 rounded-xl border font-mono font-bold transition-all ${
                      separator === s
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {s === '' ? 'aucun' : s}
                  </button>
                ))}
                <input
                  type="text"
                  maxLength={1}
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-12 px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="?"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { label: 'Retirer mots de liaison', state: removeStopWords, setState: setRemoveStopWords, desc: 'Supprime le, la, de, etc.' },
                { label: 'Forcer minuscules', state: lowercase, setState: setLowercase, desc: 'Convertit tout en minuscules' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => opt.setState(!opt.state)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    opt.state
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-bold text-sm">{opt.label}</div>
                    <div className="text-[10px] opacity-60 font-medium">{opt.desc}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    opt.state ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {opt.state && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[2rem] p-10 text-white shadow-xl shadow-indigo-600/10 flex flex-col justify-center space-y-6">
           <LinkIcon className="w-12 h-12 opacity-50" />
           <h3 className="text-2xl font-black">URL-Friendly</h3>
           <p className="text-indigo-100 font-medium leading-relaxed">
             Le slug est une version simplifiée de votre texte, idéale pour les URLs SEO-friendly. Il est nettoyé des accents, caractères spéciaux et mots inutiles.
           </p>
           <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold">
             <ShieldCheck className="w-4 h-4" /> Traitement 100% local
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-3">
          <h4 className="font-black dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> SEO
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les moteurs de recherche préfèrent les URLs courtes et descriptives utilisant des tirets plutôt que des caractères spéciaux ou des espaces encodés.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-black dark:text-white flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-indigo-500" /> Mots de liaison
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La suppression des mots courts (le, la, et, de...) permet de garder le slug focalisé sur les mots-clés essentiels de votre titre.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-black dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Normalisation NFD
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Nous utilisons la décomposition Unicode pour transformer "é", "à", "ç" en "e", "a", "c" proprement avant de générer le slug.
          </p>
        </div>
      </div>
    </div>
  );
}
