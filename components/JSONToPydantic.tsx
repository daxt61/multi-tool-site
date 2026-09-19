import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

type PydanticVersion = 'v2' | 'v1' | 'dataclass';

const PRESETS = {
  user: JSON.stringify({
    id: 101,
    username: "alex99",
    email: "alex@example.com",
    is_active: true,
    profile: {
      bio: "Software Engineer",
      age: 28,
      class: "Senior"
    },
    roles: ["admin", "developer"]
  }, null, 2),
  order: JSON.stringify({
    order_id: "ORD-9876",
    customer: {
      id: 42,
      full_name: "Jane Doe",
      email: "jane@example.com"
    },
    items: [
      {
        product_id: 501,
        title: "Wireless Keyboard",
        price: 49.99,
        quantity: 1
      }
    ],
    total_price: 49.99,
    status: "completed"
  }, null, 2),
  api: JSON.stringify({
    app_name: "FastAPI Service",
    port: 8000,
    debug: false,
    model_config: "production",
    def: "api_definition",
    database: {
      host: "localhost",
      port: 5432,
      name: "prod_db"
    }
  }, null, 2)
};

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield', 'type', 'id', 'input', 'list', 'dict', 'set'
]);

const PYDANTIC_RESERVED = new Set([
  'model_config', 'model_fields', 'model_dump', 'model_dump_json',
  'model_construct', 'model_validate', 'model_copy', 'model_post_init'
]);

export function JSONToPydantic({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [version, setVersion] = useState<PydanticVersion>(initialData?.version || 'v2');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, version });
  }, [input, version, onStateChange]);

  const toPascalCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[a-z]/, (chr) => chr.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '') || 'Model';
  };

  const toSnakeCase = (str: string) => {
    let result = str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();

    if (/^[0-9]/.test(result)) {
      result = 'f_' + result;
    }

    if (PYTHON_KEYWORDS.has(result) || (version !== 'dataclass' && PYDANTIC_RESERVED.has(result))) {
      result += '_';
    }

    return result || 'field';
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
      const usedTypes = new Set<string>();

      const getType = (val: any, name: string, depth: number): string => {
        if (depth > MAX_DEPTH) return 'Any';
        if (val === null || val === undefined) return 'Optional[Any]';
        if (typeof val === 'string') return 'str';
        if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float';
        if (typeof val === 'boolean') return 'bool';
        if (Array.isArray(val)) {
          const innerType = val.length > 0 ? getType(val[0], name, depth + 1) : 'Any';
          usedTypes.add('List');
          return `List[${innerType}]`;
        }
        if (typeof val === 'object') {
          const modelName = toPascalCase(name);
          if (depth >= MAX_DEPTH) return 'Any';
          generateModel(val, modelName, depth + 1);
          return modelName;
        }
        return 'Any';
      };

      const generateModel = (obj: any, modelName: string, depth: number) => {
        if (depth > MAX_DEPTH) return;
        if (generatedModels.has(modelName)) return;
        generatedModels.add(modelName);

        let modelCode = '';
        if (version === 'v2') {
          modelCode = `class ${modelName}(BaseModel):\n`;
        } else if (version === 'v1') {
          modelCode = `class ${modelName}(BaseModel):\n`;
        } else {
          modelCode = `@dataclass\nclass ${modelName}:\n`;
        }

        const entries = Object.entries(obj || Object.create(null));

        if (entries.length === 0) {
          modelCode += `    pass\n`;
        } else {
          let hasAlias = false;

          entries.forEach(([key, value]) => {
            const snakeKey = toSnakeCase(key);
            const pyType = getType(value, key, depth);
            const isOptional = value === null || value === undefined || pyType.startsWith('Optional[');

            if (isOptional) usedTypes.add('Optional');

            if (version === 'v2') {
              if (snakeKey !== key) {
                hasAlias = true;
                if (isOptional) {
                  modelCode += `    ${snakeKey}: ${pyType} = Field(default=None, alias=${JSON.stringify(key)})\n`;
                } else {
                  modelCode += `    ${snakeKey}: ${pyType} = Field(alias=${JSON.stringify(key)})\n`;
                }
              } else if (isOptional) {
                modelCode += `    ${snakeKey}: ${pyType} = None\n`;
              } else {
                modelCode += `    ${snakeKey}: ${pyType}\n`;
              }
            } else if (version === 'v1') {
              if (snakeKey !== key) {
                hasAlias = true;
                if (isOptional) {
                  modelCode += `    ${snakeKey}: ${pyType} = Field(None, alias=${JSON.stringify(key)})\n`;
                } else {
                  modelCode += `    ${snakeKey}: ${pyType} = Field(..., alias=${JSON.stringify(key)})\n`;
                }
              } else if (isOptional) {
                modelCode += `    ${snakeKey}: ${pyType} = None\n`;
              } else {
                modelCode += `    ${snakeKey}: ${pyType}\n`;
              }
            } else {
              // Dataclass
              const safeCommentKey = key.replace(/[\n\r\t\v\f]/g, ' ').replace(/#/g, '');
              const comment = snakeKey !== key ? `  # Original JSON key: ${safeCommentKey}` : '';
              if (isOptional) {
                modelCode += `    ${snakeKey}: ${pyType} = None${comment}\n`;
              } else {
                modelCode += `    ${snakeKey}: ${pyType}${comment}\n`;
              }
            }
          });

          if (version === 'v1' && hasAlias) {
            modelCode += `\n    class Config:\n        allow_population_by_field_name = True\n`;
          }
        }

        models.unshift(modelCode);
      };

      if (Array.isArray(data)) {
        if (data.length > 0) {
          getType(data[0], 'Item', 0);
        }
      } else {
        generateModel(data, 'Model', 0);
      }

      // Build header imports
      const typingImports = new Set<string>();
      if (usedTypes.has('List')) typingImports.add('List');
      if (usedTypes.has('Optional')) typingImports.add('Optional');
      typingImports.add('Any');

      let header = '';
      if (typingImports.size > 0) {
        header += `from typing import ${Array.from(typingImports).sort().join(', ')}\n`;
      }

      if (version === 'v2') {
        header += `from pydantic import BaseModel, Field\n\n`;
      } else if (version === 'v1') {
        header += `from pydantic import BaseModel, Field\n\n`;
      } else {
        header += `from dataclasses import dataclass\n\n`;
      }

      setOutput(header + models.join('\n\n').trim());
      setError(null);
    } catch (e: any) {
      setError(t('error.invalid_json'));
      setOutput('');
    }
  }, [t, version]);

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
    } else {
      generatePydantic(input);
    }
  }, [input, generatePydantic, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true);
    toast.success(t('jsontopydantic.toast_copied', 'Copied Pydantic models to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    toast.success(t('jsontopydantic.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `models.py`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('jsontopydantic.toast_downloaded', 'Downloaded models.py!'));
  };

  const loadPreset = (key: keyof typeof PRESETS) => {
    setInput(PRESETS[key]);
    toast.success(t('jsontopydantic.toast_preset_loaded', 'Preset loaded successfully!'));
  };

  const isPresetActive = (presetKey: keyof typeof PRESETS) => {
    return input.trim() === PRESETS[presetKey].trim();
  };

  const handlersRef = useRef({ handleClear, handleCopy, output });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, output };
  }, [handleClear, handleCopy, output]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        if (handlersRef.current.output) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('jsontopydantic.presets_title', 'Quick Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('user')}
            aria-pressed={isPresetActive('user')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
              isPresetActive('user')
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('jsontopydantic.preset_user', 'User Profile')}
          </button>
          <button
            onClick={() => loadPreset('order')}
            aria-pressed={isPresetActive('order')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
              isPresetActive('order')
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('jsontopydantic.preset_order', 'E-Commerce Order')}
          </button>
          <button
            onClick={() => loadPreset('api')}
            aria-pressed={isPresetActive('api')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
              isPresetActive('api')
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('jsontopydantic.preset_api', 'API Config & Settings')}
          </button>
        </div>
      </div>

      {/* Target Format Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5 w-full md:w-auto min-w-[280px]">
          <label htmlFor="pydantic-version-select" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('jsontopydantic.target_format', 'Python Target Format')}
          </label>
          <select
            id="pydantic-version-select"
            value={version}
            onChange={(e) => setVersion(e.target.value as PydanticVersion)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="v2">Pydantic V2 (BaseModel, Field)</option>
            <option value="v1">Pydantic V1 (BaseModel, class Config)</option>
            <option value="dataclass">Python Dataclasses (@dataclass)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Code Editor Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('jsontopydantic.input_label', 'JSON Input')}
            </label>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all px-3 py-1.5 rounded-xl flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"name": "John", "age": 30, "is_active": true}'
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="pydantic-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              {t('jsontopydantic.output_label', 'Pydantic Models')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && input && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/20 dark:bg-black/20 ml-1">C</Kbd>}
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
          <Info className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsontopydantic.about_title', 'About JSON to Pydantic conversion')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsontopydantic.about_text', 'This tool generates Python Pydantic models from your JSON data. It supports Pydantic V2, Pydantic V1, and Python Dataclasses, automatically converting property names to snake_case, handling Python keywords and Pydantic internal fields with Field aliases.')}
          </p>
        </div>
      </div>
    </div>
  );
}
