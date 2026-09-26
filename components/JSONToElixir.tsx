import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, Braces, AlertCircle, Info, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

const ELIXIR_KEYWORDS = new Set([
  'def', 'defmodule', 'defstruct', 'defmacro', 'defp', 'do', 'end', 'case', 'cond',
  'if', 'unless', 'try', 'catch', 'rescue', 'after', 'else', 'for', 'receive', 'fn',
  'quote', 'unquote', 'import', 'require', 'use', 'alias', 'nil', 'true', 'false',
  'and', 'or', 'not', 'when', 'in', 'schema', 'embedded_schema', 'field'
]);

export function JSONToElixir({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [output, setOutput] = useState('');
  const [moduleName, setModuleName] = useState(initialData?.moduleName || 'MyApp.User');
  const [outputType, setOutputType] = useState<'defstruct' | 'ecto_embed'>(initialData?.outputType || 'defstruct');
  const [casing, setCasing] = useState<'snake_case' | 'camelCase' | 'PascalCase' | 'original'>(initialData?.casing || 'snake_case');
  const [useTypespec, setUseTypespec] = useState(initialData?.useTypespec ?? true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({
      jsonInput,
      moduleName,
      outputType,
      casing,
      useTypespec,
    });
  }, [jsonInput, moduleName, outputType, casing, useTypespec, onStateChange]);

  const PRESETS = {
    user_profile: {
      key: 'user_profile',
      json: JSON.stringify(
        {
          id: 101,
          uuid: "e3a89012-4c22-4d1a-821b-252a123a09fa",
          username: "johndoe",
          email: "john.doe@example.com",
          is_active: true,
          roles: ["admin", "developer"],
          profile: {
            first_name: "John",
            last_name: "Doe",
            avatar_url: "https://example.com/avatar.png",
            age: 32,
            rating: 4.85
          },
          last_login: "2026-03-31T14:30:00Z"
        },
        null,
        2
      )
    },
    ecommerce_order: {
      key: 'ecommerce_order',
      json: JSON.stringify(
        {
          order_id: "ORD-98765",
          customer_id: 4022,
          total_amount: 149.99,
          currency: "USD",
          status: "completed",
          items: [
            {
              item_id: "SKU-1001",
              name: "Wireless Mechanical Keyboard",
              quantity: 1,
              price: 119.99
            }
          ]
        },
        null,
        2
      )
    },
    api_config: {
      key: 'api_config',
      json: JSON.stringify(
        {
          host: "0.0.0.0",
          port: 8080,
          debug: false,
          max_connections: 50
        },
        null,
        2
      )
    }
  };

  const toSnakeCase = (str: string) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  };

  const toCamelCase = (str: string) => {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  };

  const toPascalCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
  };

  const formatKey = useCallback((key: string): string => {
    let formatted = key;
    if (casing === 'snake_case') formatted = toSnakeCase(key);
    else if (casing === 'camelCase') formatted = toCamelCase(key);
    else if (casing === 'PascalCase') formatted = toPascalCase(key);

    if (ELIXIR_KEYWORDS.has(formatted.toLowerCase())) {
      formatted = `${formatted}_val`;
    }
    return formatted;
  }, [casing]);

  const inferElixirType = useCallback((val: any, depth: number = 0): string => {
    if (depth > MAX_DEPTH) return 'any()';
    if (val === null) return 'any()';

    switch (typeof val) {
      case 'string':
        return 'String.t()';
      case 'number':
        return Number.isInteger(val) ? 'integer()' : 'float()';
      case 'boolean':
        return 'boolean()';
      case 'object':
        if (Array.isArray(val)) {
          if (val.length === 0) return 'list()';
          return `list(${inferElixirType(val[0], depth + 1)})`;
        } else {
          return 'map()';
        }
      default:
        return 'any()';
    }
  }, []);

  const inferEctoType = useCallback((val: any, depth: number = 0): string => {
    if (depth > MAX_DEPTH) return ':string';
    if (val === null) return ':string';

    switch (typeof val) {
      case 'string':
        return ':string';
      case 'number':
        return Number.isInteger(val) ? ':integer' : ':float';
      case 'boolean':
        return ':boolean';
      case 'object':
        if (Array.isArray(val)) {
          if (val.length === 0) return '{:array, :string}';
          return `{:array, ${inferEctoType(val[0], depth + 1)}}`;
        } else {
          return ':map';
        }
      default:
        return ':string';
    }
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
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setError(t('jsontoelixir.must_be_object', 'Root JSON must be an object.'));
        setOutput('');
        return;
      }

      const safeModule = moduleName.trim() ? moduleName.trim() : 'MyApp.Schema';
      const keys = Object.keys(parsed);

      let code = `defmodule ${safeModule} do\n`;

      if (outputType === 'defstruct') {
        const fieldsWithDefaults = keys.map(k => {
          const formattedKey = formatKey(k);
          const val = parsed[k];
          let defaultVal = 'nil';
          if (typeof val === 'string') defaultVal = `"${val.replace(/"/g, '\\"')}"`;
          else if (typeof val === 'number') defaultVal = `${val}`;
          else if (typeof val === 'boolean') defaultVal = `${val}`;
          else if (Array.isArray(val)) defaultVal = '[]';
          else if (typeof val === 'object' && val !== null) defaultVal = '%{}';

          return `${formattedKey}: ${defaultVal}`;
        });

        if (useTypespec) {
          const typespecFields = keys.map(k => `${formatKey(k)}: ${inferElixirType(parsed[k])}`);
          code += `  @type t :: %__MODULE__{\n    ${typespecFields.join(',\n    ')}\n  }\n\n`;
        }

        code += `  defstruct [\n    ${fieldsWithDefaults.join(',\n    ')}\n  ]\n`;
      } else {
        code += `  use Ecto.Schema\n  import Ecto.Changeset\n\n`;
        code += `  embedded_schema do\n`;
        keys.forEach(k => {
          const formattedKey = formatKey(k);
          const ectoType = inferEctoType(parsed[k]);
          code += `    field :${formattedKey}, ${ectoType}\n`;
        });
        code += `  end\n\n`;

        code += `  @doc false\n  def changeset(schema, attrs) do\n`;
        code += `    schema\n`;
        code += `    |> cast(attrs, [${keys.map(k => `:${formatKey(k)}`).join(', ')}])\n`;
        code += `    |> validate_required([])\n`;
        code += `  end\n`;
      }

      code += `end`;

      setOutput(code);
      setError(null);
    } catch (e: any) {
      setError(t('error.invalid_json', 'Invalid JSON syntax. Please check your input.'));
      setOutput('');
    }
  }, [jsonInput, moduleName, outputType, formatKey, useTypespec, inferElixirType, inferEctoType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('jsontoelixir.toast_copied', 'Elixir module copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setJsonInput('');
    setOutput('');
    setError(null);
    setActivePreset(null);
    toast.success(t('common.cleared', 'Cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'module.ex';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded module.ex!'));
  }, [output, t]);

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setJsonInput(preset.json);
    setActivePreset(preset.key);
    toast.success(t('jsontoelixir.preset_loaded', 'Loaded JSON preset!'));
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
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('jsontoelixir.presets_title', 'Quick Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('user_profile')}
            aria-pressed={activePreset === 'user_profile'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
              activePreset === 'user_profile'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('jsontoelixir.preset_user_profile', 'User Profile')}
          </button>
          <button
            onClick={() => loadPreset('ecommerce_order')}
            aria-pressed={activePreset === 'ecommerce_order'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
              activePreset === 'ecommerce_order'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('jsontoelixir.preset_ecommerce', 'E-Commerce Order')}
          </button>
          <button
            onClick={() => loadPreset('api_config')}
            aria-pressed={activePreset === 'api_config'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
              activePreset === 'api_config'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('jsontoelixir.preset_api_config', 'API Config')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="elixir-module-name" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('jsontoelixir.module_name', 'Module Name')}
          </label>
          <input
            id="elixir-module-name"
            type="text"
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            placeholder="e.g. MyApp.User"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="elixir-output-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('jsontoelixir.output_type', 'Output Format')}
          </label>
          <select
            id="elixir-output-type"
            value={outputType}
            onChange={(e) => setOutputType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="defstruct">Elixir Struct (defstruct)</option>
            <option value="ecto_embed">Ecto Embedded Schema (embedded_schema)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="elixir-json-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('jsontoelixir.field_casing', 'Field Casing')}
          </label>
          <select
            id="elixir-json-casing"
            value={casing}
            onChange={(e) => setCasing(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (Standard Elixir)</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original Keys</option>
          </select>
        </div>

        {outputType === 'defstruct' && (
          <div className="col-span-1 md:col-span-3 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <input
              id="use-typespec"
              type="checkbox"
              checked={useTypespec}
              onChange={(e) => setUseTypespec(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="use-typespec" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('jsontoelixir.use_typespec', 'Generate @type t :: %__MODULE__{...} Specification')}
            </label>
          </div>
        )}
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-elixir-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <Braces className="w-4 h-4 text-indigo-500" /> {t('common.input')} (JSON)
            </label>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!jsonInput && !output}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="json-elixir-input"
            ref={inputRef}
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder='{"name": "John", "age": 30}'
            className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-3xl outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="elixir-struct-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <FileCode className="w-4 h-4 text-purple-500" /> {t('jsontoelixir.output_label', 'Elixir Code')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" aria-hidden="true" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                title={`${t('common.copy')} (C)`}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 shadow-sm'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && jsonInput && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 border-indigo-200 dark:border-indigo-800 text-indigo-400 dark:bg-slate-900 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="elixir-struct-output"
            value={output}
            readOnly
            placeholder={t('jsontoelixir.placeholder_output', 'Generated Elixir module definition will appear here...')}
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
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
          <h4 className="font-bold dark:text-white">{t('jsontoelixir.about_title', 'About JSON to Elixir Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsontoelixir.about_text', 'Convert JSON payloads into Elixir defstruct modules or Ecto Embedded Schemas (embedded_schema) with type specifications (@type t) and changeset functions.')}
          </p>
        </div>
      </div>
    </div>
  );
}
