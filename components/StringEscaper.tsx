import { useState, useMemo } from 'react';
import { Code, Copy, Check, Trash2, Info, ArrowLeftRight } from 'lucide-react';

type EscapeType = 'json' | 'html' | 'xml' | 'javascript';

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_UNESCAPE: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

const JS_ESCAPE: Record<string, string> = {
  '\\': '\\\\',
  "'": "\\'",
  '"': '\\"',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\b': '\\b',
  '\f': '\\f',
};

const JS_UNESCAPE: Record<string, string> = {
  '\\\\': '\\',
  "\\'": "'",
  '\\"': '"',
  '\\n': '\n',
  '\\r': '\r',
  '\\t': '\t',
  '\\b': '\b',
  '\\f': '\f',
};

export function StringEscaper() {
  const [input, setInput] = useState('{"hello": "world"}');
  const [type, setType] = useState<EscapeType>('json');
  const [copied, setCopied] = useState(false);

  const process = (text: string, mode: 'escape' | 'unescape') => {
    if (!text) return '';

    try {
      if (type === 'json') {
        if (mode === 'escape') {
          return JSON.stringify(text).slice(1, -1);
        } else {
          // Wrap in quotes to make it a valid JSON string for parsing
          return JSON.parse(`"${text}"`);
        }
      }

      if (type === 'html' || type === 'xml') {
        const map = mode === 'escape' ? HTML_ESCAPE : HTML_UNESCAPE;
        const regex = mode === 'escape'
          ? /[&<>"']/g
          : /&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g;
        return text.replace(regex, (m) => map[m] || m);
      }

      if (type === 'javascript') {
        if (mode === 'escape') {
          return text.replace(/[\\'"\n\r\t\b\f]/g, (m) => JS_ESCAPE[m] || m);
        } else {
          return text.replace(/\\\\|\\'|\\"|\\n|\\r|\\t|\\b|\\f/g, (m) => JS_UNESCAPE[m] || m);
        }
      }

      return text;
    } catch (e) {
      return 'Erreur de traitement';
    }
  };

  const handleEscape = () => setInput(process(input, 'escape'));
  const handleUnescape = () => setInput(process(input, 'unescape'));

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Configuration */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        {(['json', 'html', 'xml', 'javascript'] as EscapeType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all uppercase tracking-widest ${
              type === t ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à traiter</label>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`text-xs font-bold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-full ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-500'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
            <button onClick={() => setInput('')} className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-full hover:bg-rose-100 transition-colors flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Entrez votre texte ici..."
          className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleEscape}
          className="flex-1 flex items-center justify-center gap-2 px-8 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg transition-all active:scale-95 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl shadow-slate-900/10 dark:shadow-none"
        >
          <Code className="w-6 h-6" /> Échapper (Escape)
        </button>
        <button
          onClick={handleUnescape}
          className="flex-1 flex items-center justify-center gap-2 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg transition-all active:scale-95 hover:bg-indigo-700 shadow-xl shadow-indigo-600/10"
        >
          <ArrowLeftRight className="w-6 h-6" /> Déséchapper (Unescape)
        </button>
      </div>

      {/* Educational Content */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Pourquoi échapper ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'échappement permet d'utiliser des caractères réservés (comme les guillemets ou les balises) dans des contextes où ils seraient sinon interprétés comme du code (XSS, erreurs JSON).
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-500" /> Formats supportés
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Support complet pour JSON, les entités HTML, XML et les chaînes de caractères JavaScript (échappement des caractères spéciaux comme \n, \t, etc).
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-500" /> Sécurité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Contrairement à certains outils en ligne, nous n'utilisons jamais <code>eval()</code> ou <code>new Function()</code>. Tout le traitement est fait via des expressions régulières sûres.
          </p>
        </div>
      </div>
    </div>
  );
}
