import React, { useState, useEffect, useCallback } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Info, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function JSONToPydantic({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const toPascalCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[a-z]/, (chr) => chr.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '');
  };

  const toSnakeCase = (str: string) => {
    return str
      .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      .replace(/^_/, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_');
  };

  const generatePydantic = useCallback((json: string) => {
    if (!json.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const data = JSON.parse(json);
      const models: string[] = [];
      const generatedModels = new Set<string>();

      const getType = (val: any, name: string): string => {
        if (val === null) return 'Optional[Any]';
        if (typeof val === 'string') return 'str';
        if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float';
        if (typeof val === 'boolean') return 'bool';
        if (Array.isArray(val)) {
          const innerType = val.length > 0 ? getType(val[0], name) : 'Any';
          return `List[${innerType}]`;
        }
        if (typeof val === 'object') {
          const modelName = toPascalCase(name);
          generateModel(val, modelName);
          return modelName;
        }
        return 'Any';
      };

      const generateModel = (obj: any, modelName: string) => {
        if (generatedModels.has(modelName)) return;
        generatedModels.add(modelName);

        let modelCode = `class ${modelName}(BaseModel):\n`;
        const entries = Object.entries(obj);

        if (entries.length === 0) {
          modelCode += `    pass\n`;
        } else {
          entries.forEach(([key, value]) => {
            const snakeKey = toSnakeCase(key);
            const type = getType(value, key);
            if (snakeKey !== key) {
              modelCode += `    ${snakeKey}: ${type} = Field(alias=${JSON.stringify(key)})\n`;
            } else {
              modelCode += `    ${snakeKey}: ${type}\n`;
            }
          });
        }

        models.unshift(modelCode);
      };

      if (Array.isArray(data)) {
        if (data.length > 0) {
          getType(data[0], 'Item');
        }
      } else {
        generateModel(data, 'Model');
      }

      const header = `from pydantic import BaseModel, Field\nfrom typing import List, Optional, Any\n\n`;
      setOutput(header + models.join('\n\n'));
      setError(null);
    } catch (e: any) {
      setError(t('error.invalid_json'));
      setOutput('');
    }
  }, [t]);

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
    } else {
      generatePydantic(input);
    }
  }, [input, generatePydantic, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `models.py`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" /> JSON Input
            </label>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all px-2 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50"
              disabled={!input}
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"name": "John", "age": 30, "is_active": true}'
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="pydantic-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" /> Pydantic Models (v2)
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent"
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="pydantic-output"
            value={output}
            readOnly
            placeholder="Pydantic models will appear here..."
            className="w-full h-96 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2.5rem] outline-none font-mono text-sm leading-relaxed resize-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsontopydantic.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsontopydantic.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
