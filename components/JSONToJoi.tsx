import { useState, useEffect, useCallback } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function JSONToJoi({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output });
  }, [input, output, onStateChange]);

  const handleConvert = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }
      if (input.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }
      const parsed = JSON.parse(input);

      const getJoiSchema = (val: any, depth: number): string => {
        if (depth > MAX_DEPTH) return 'Joi.any()';
        if (val === null || val === undefined) return 'Joi.any()';

        if (Array.isArray(val)) {
          if (val.length === 0) return 'Joi.array()';
          const itemType = getJoiSchema(val[0], depth + 1);
          return `Joi.array().items(${itemType})`;
        }

        if (typeof val === 'object') {
          const keys = Object.entries(val).map(([key, value]) => {
            const schema = getJoiSchema(value, depth + 1);
            // Sentinel: Sanitize keys to prevent breakout from the schema object literal.
            const isValidIdent = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
            const safeKey = isValidIdent ? key : JSON.stringify(key);
            return `  ${safeKey}: ${schema}`;
          });

          if (keys.length === 0) return 'Joi.object()';
          return `Joi.object({\n${keys.join(',\n')}\n})`;
        }

        if (typeof val === 'string') {
          let str = 'Joi.string()';
          if (val.includes('@') && val.includes('.')) str += '.email()';
          if (/^https?:\/\//.test(val)) str += '.uri()';
          return str;
        }

        if (typeof val === 'number') {
          let num = 'Joi.number()';
          if (Number.isInteger(val)) num += '.integer()';
          return num;
        }

        if (typeof val === 'boolean') return 'Joi.boolean()';

        return 'Joi.any()';
      };

      const schema = getJoiSchema(parsed, 0);
      let result = "const Joi = require('joi');\n\n";
      result += `const schema = ${schema};`;

      setOutput(result);
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
      setOutput('');
    }
  }, [input, t]);

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
    setInput('');
    setOutput('');
    setError('');
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.joi.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.input')} JSON</label>
            </div>
            <button
              onClick={handleClear}
              disabled={!input && !output}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"id": 1, "username": "johndoe", "email": "john@example.com"}'
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="joi-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Joi Schema</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="joi-output"
            value={output}
            readOnly
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">À propos de la génération de schéma Joi</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Joi est une bibliothèque de validation de schémas puissante pour JavaScript. Cet outil analyse votre objet JSON et génère un schéma Joi correspondant. Il détecte automatiquement les types de base, les emails, les URIs et les entiers pour vous faire gagner du temps lors de la configuration de vos validations.
          </p>
        </div>
      </div>
    </div>
  );
}
