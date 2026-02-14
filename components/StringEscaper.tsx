import { useState } from 'react';
import { Code, Copy, Check, Trash2, Info, ArrowLeftRight, ShieldCheck } from 'lucide-react';

export function StringEscaper() {
  const [input, setInput] = useState('');
  const [format, setFormat] = useState<'json' | 'html' | 'xml' | 'js'>('json');
  const [copied, setCopied] = useState(false);

  const escape = (str: string, fmt: typeof format) => {
    if (!str) return '';
    switch (fmt) {
      case 'json':
        return JSON.stringify(str).slice(1, -1);
      case 'html':
      case 'xml':
        return str.replace(/[&<>"']/g, (m) => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
        }[m as '&' | '<' | '>' | '"' | "'"] || m));
      case 'js':
        return str.replace(/[\\'"\n\r\t]/g, (m) => ({
          '\\': '\\\\', "'": "\\'", '"': '\\"', '\n': '\\n', '\r': '\\r', '\t': '\\t'
        }[m as '\\' | "'" | '"' | '\n' | '\r' | '\t'] || m));
      default:
        return str;
    }
  };

  const unescape = (str: string, fmt: typeof format) => {
    if (!str) return '';
    switch (fmt) {
      case 'json':
        try {
          return JSON.parse(`"${str}"`);
        } catch { return str; }
      case 'html':
      case 'xml':
        try {
          const doc = new DOMParser().parseFromString(str, 'text/html');
          return doc.documentElement.textContent || str;
        } catch { return str; }
      case 'js':
        try {
          return str.replace(/\\(n|r|t|'|"|\\)/g, (m, p1) => ({
            'n': '\n', 'r': '\r', 't': '\t', "'": "'", '"': '"', '\\': '\\'
          }[p1 as 'n' | 'r' | 't' | "'" | '"' | '\\'] || m));
        } catch { return str; }
      default:
        return str;
    }
  };

  const handleAction = (type: 'escape' | 'unescape') => {
    const result = type === 'escape' ? escape(input, format) : unescape(input, format);
    setInput(result);
  };

  const copyToClipboard = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte</label>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
                </button>
                <button
                  onClick={() => setInput('')}
                  className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Effacer
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Collez votre texte ici..."
              className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg leading-relaxed dark:text-slate-300"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleAction('escape')}
              className="flex-1 min-w-[150px] px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Échapper (Escape)
            </button>
            <button
              onClick={() => handleAction('unescape')}
              className="flex-1 min-w-[150px] px-8 py-4 bg-white dark:bg-slate-800 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Déséchapper (Unescape)
            </button>
          </div>
        </div>

        <div className="w-full md:w-72 space-y-6">
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" /> Format
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {(['json', 'html', 'xml', 'js'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-4 py-3 rounded-xl border font-bold uppercase transition-all text-sm ${
                    format === f
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-4">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold dark:text-white">Sécurisé</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Le traitement est effectué uniquement dans votre navigateur. Aucune donnée n'est envoyée à nos serveurs.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-3">
          <h4 className="font-black dark:text-white flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-500" /> Pourquoi échapper ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'échappement permet d'inclure des caractères spéciaux dans des chaînes de caractères sans casser la syntaxe du langage cible (JSON, HTML, etc.).
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-black dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-500" /> HTML & XML
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Convertit les caractères comme <code>&lt;</code>, <code>&gt;</code> et <code>&amp;</code> en entités sécurisées pour l'affichage web.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-black dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> JSON
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Formate les chaînes pour qu'elles soient valides à l'intérieur de guillemets JSON, en gérant les sauts de ligne et les échappements de guillemets.
          </p>
        </div>
      </div>
    </div>
  );
}
