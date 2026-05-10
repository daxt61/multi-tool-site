import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Trash2, Database, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function JSONToMongoose({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ jsonInput });
  }, [jsonInput, onStateChange]);

  const generateMongoose = useCallback((obj: any, schemaName: string = 'Root'): string => {
    const schemas: string[] = [];
    const processedObjects = new Set<any>();

    const getMongooseType = (val: any, key: string): string => {
      if (val === null) return 'String';
      if (Array.isArray(val)) {
        if (val.length === 0) return '[String]';
        return `[${getMongooseType(val[0], key)}]`;
      }
      if (typeof val === 'object') {
        const subSchemaName = key.charAt(0).toUpperCase() + key.slice(1);
        parseObject(val, subSchemaName);
        return `${subSchemaName}Schema`;
      }
      if (typeof val === 'number') return 'Number';
      if (typeof val === 'boolean') return 'Boolean';
      if (typeof val === 'string' && !isNaN(Date.parse(val))) return 'Date';
      return 'String';
    };

    const parseObject = (o: any, name: string) => {
      if (processedObjects.has(o)) return;
      processedObjects.add(o);

      let schemaStr = `const ${name}Schema = new mongoose.Schema({\n`;
      Object.entries(o).forEach(([key, val]) => {
        schemaStr += `  ${key}: ${getMongooseType(val, key)},\n`;
      });
      schemaStr += '});';
      schemas.push(schemaStr);
    };

    parseObject(obj, schemaName);
    return `import mongoose from 'mongoose';\n\n` + schemas.reverse().join('\n\n');
  }, []);

  const handleConvert = useCallback(() => {
    if (!jsonInput.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (jsonInput.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setOutput(generateMongoose(parsed));
      setError(null);
    } catch (e) {
      setError(t('error.invalid_json'));
      setOutput('');
    }
  }, [jsonInput, generateMongoose, t]);

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
    setJsonInput('');
    setOutput('');
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input-mongoose" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" /> JSON Input
            </label>
            <button
              onClick={handleClear}
              disabled={!jsonInput}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="json-input-mongoose"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"title": "Post", "tags": ["news", "tech"], "author": {"name": "John"}}'
            className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-3xl outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" /> Mongoose Schema
            </label>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
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
            <pre className="w-full h-[500px] p-6 bg-slate-900 rounded-3xl overflow-auto font-mono text-sm leading-relaxed text-indigo-300">
              {output || <span className="text-slate-500 italic">Mongoose schema will appear here...</span>}
            </pre>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">About JSON to Mongoose Conversion</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            This tool generates Mongoose schema definitions from JSON data. It maps JSON types to Mongoose types (String, Number, Boolean, Date) and handles nested objects by creating separate schema definitions.
          </p>
        </div>
      </div>
    </div>
  );
}
