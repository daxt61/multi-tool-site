import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Trash2, Code, FileCode, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function HTMLToJSX({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [htmlInput, setHtmlInput] = useState(initialData?.htmlInput || '');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ htmlInput });
  }, [htmlInput, onStateChange]);

  const convertStyle = (styleStr: string) => {
    const styles: Record<string, string> = {};
    styleStr.split(';').forEach(style => {
      const [prop, val] = style.split(':');
      if (prop && val) {
        const camelProp = prop.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
        styles[camelProp] = val.trim();
      }
    });
    return `{{${Object.entries(styles).map(([k, v]) => `${k}: '${v}'`).join(', ')}}}`;
  };

  const handleConvert = useCallback(() => {
    if (!htmlInput.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (htmlInput.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      let jsx = htmlInput;

      // Attributes
      jsx = jsx.replace(/\sclass=/g, ' className=');
      jsx = jsx.replace(/\sfor=/g, ' htmlFor=');
      jsx = jsx.replace(/\stabindex=/g, ' tabIndex=');
      jsx = jsx.replace(/\sreadonly=/g, ' readOnly=');
      jsx = jsx.replace(/\smaxlength=/g, ' maxLength=');
      jsx = jsx.replace(/\scolspan=/g, ' colSpan=');
      jsx = jsx.replace(/\srowspan=/g, ' rowSpan=');
      jsx = jsx.replace(/\sonclick=/g, ' onClick=');
      jsx = jsx.replace(/\sonchange=/g, ' onChange=');
      jsx = jsx.replace(/\soninput=/g, ' onInput=');
      jsx = jsx.replace(/\sonkeydown=/g, ' onKeyDown=');

      // Style attribute
      jsx = jsx.replace(/style="([^"]*)"/g, (_: string, styleStr: string) => `style=${convertStyle(styleStr)}`);

      // Self-closing tags
      const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
      selfClosingTags.forEach(tag => {
        const regex = new RegExp(`<${tag}([^>]*[^/])>`, 'gi');
        jsx = jsx.replace(regex, `<${tag}$1 />`);
      });

      setOutput(jsx);
      setError(null);
    } catch (e) {
      setError('Erreur lors de la conversion');
      setOutput('');
    }
  }, [htmlInput, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setHtmlInput('');
    setOutput('');
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="html-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" /> {t('common.input')} (HTML)
            </label>
            <button
              onClick={handleClear}
              disabled={!htmlInput}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="html-input"
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
            placeholder='<div class="container" style="color: red; margin-top: 10px;">\n  <label for="name">Name</label>\n  <input type="text" id="name" readonly>\n</div>'
            className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-3xl outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-500" /> JSX
            </label>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <div className="relative group">
            <pre className="w-full h-[500px] p-6 bg-slate-900 rounded-3xl overflow-auto font-mono text-sm leading-relaxed text-indigo-300 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {output || <span className="text-slate-500 italic">JSX output will appear here...</span>}
            </pre>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">À propos de la conversion HTML en JSX</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cet outil convertit du code HTML standard en JSX compatible avec React. Il renomme les attributs comme <code>class</code> en <code>className</code>, <code>for</code> en <code>htmlFor</code>, et transforme les styles en ligne en objets JavaScript. Il s'assure également que les balises orphelines sont correctement fermées.
          </p>
        </div>
      </div>
    </div>
  );
}
