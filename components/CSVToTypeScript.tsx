import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileCode,
  Copy,
  Check,
  Trash2,
  Download,
  FileSpreadsheet,
  Settings,
  Info,
  Sparkles,
  Code2
} from 'lucide-react';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

interface CSVToTypeScriptProps {
  initialData?: any;
  onStateChange?: (state: any) => void;
}

export const CSVToTypeScript: React.FC<CSVToTypeScriptProps> = ({
  initialData,
  onStateChange,
}) => {
  const { t } = useTranslation();

  const [input, setInput] = useState<string>(
    initialData?.input ||
      `id,full_name,email,is_active,age,balance,created_at\n1,Alice Vance,alice@example.com,true,30,1250.50,2024-01-15\n2,Bob Miller,bob@example.com,false,25,0.00,2024-02-01\n3,Charlie Smith,charlie@example.com,true,42,890.75,2024-02-20`
  );

  const [typeName, setTypeName] = useState<string>(initialData?.typeName || 'Record');
  const [outputMode, setOutputMode] = useState<'interface' | 'type'>(
    initialData?.outputMode || 'interface'
  );
  const [casing, setCasing] = useState<'original' | 'camelCase' | 'snake_case' | 'PascalCase'>(
    initialData?.casing || 'camelCase'
  );
  const [isOptional, setIsOptional] = useState<boolean>(initialData?.isOptional || false);
  const [delimiter, setDelimiter] = useState<string>(initialData?.delimiter || 'auto');

  const [copied, setCopied] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-detect delimiter
  const detectDelimiter = (text: string): string => {
    const sample = text.slice(0, 5000);
    const counts = {
      ',': (sample.match(/,/g) || []).length,
      '\t': (sample.match(/\t/g) || []).length,
      ';': (sample.match(/;/g) || []).length,
      '|': (sample.match(/\|/g) || []).length,
    };
    let maxDelim = ',';
    let maxCount = -1;
    for (const [delim, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxDelim = delim;
      }
    }
    return maxCount > 0 ? maxDelim : ',';
  };

  const parseCSVLine = (line: string, delimChar: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimChar && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Casing transformation helper
  const transformKey = (key: string, mode: 'original' | 'camelCase' | 'snake_case' | 'PascalCase'): string => {
    const cleanKey = key.trim().replace(/^["']|["']$/g, '');
    if (mode === 'original') return cleanKey;

    const words = cleanKey
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(/\s+/);

    if (words.length === 0 || !words[0]) return cleanKey;

    if (mode === 'camelCase') {
      return words[0].toLowerCase() + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }
    if (mode === 'PascalCase') {
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }
    if (mode === 'snake_case') {
      return words.map((w) => w.toLowerCase()).join('_');
    }
    return cleanKey;
  };

  // Type inference helper
  const inferType = (values: string[]): string => {
    let hasNumber = false;
    let hasBoolean = false;
    let hasString = false;
    let hasNull = false;

    for (const val of values) {
      const trimmed = val.trim();
      if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
        hasNull = true;
        continue;
      }

      if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'false') {
        hasBoolean = true;
      } else if (!isNaN(Number(trimmed)) && !isNaN(parseFloat(trimmed))) {
        hasNumber = true;
      } else {
        hasString = true;
      }
    }

    const types: string[] = [];
    if (hasString) types.push('string');
    if (hasNumber && !hasString) types.push('number');
    if (hasBoolean && !hasString && !hasNumber) types.push('boolean');
    if (types.length === 0) types.push('string');
    if (hasNull) types.push('null');

    return types.join(' | ');
  };

  // Code generator
  const generateTypeScript = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    if (input.length > MAX_LENGTH) {
      toast.error(t('error.max_length', { max: MAX_LENGTH }));
      return;
    }

    const actualDelim = delimiter === 'auto' ? detectDelimiter(input) : delimiter;
    const lines = input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setOutput('');
      return;
    }

    const headers = parseCSVLine(lines[0], actualDelim);
    const dataRows = lines.slice(1).map((line) => parseCSVLine(line, actualDelim));

    const fields = headers.map((header, colIdx) => {
      const colValues = dataRows.map((row) => row[colIdx] || '');
      const propName = transformKey(header, casing);
      const safePropName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propName)
        ? propName
        : JSON.stringify(propName);
      const tsType = inferType(colValues);
      const optionalSymbol = isOptional ? '?' : '';
      return `  ${safePropName}${optionalSymbol}: ${tsType};`;
    });

    const cleanTypeName = transformKey(typeName || 'Record', 'PascalCase');

    if (outputMode === 'interface') {
      setOutput(`export interface ${cleanTypeName} {\n${fields.join('\n')}\n}`);
    } else {
      setOutput(`export type ${cleanTypeName} = {\n${fields.join('\n')}\n};`);
    }
  }, [input, typeName, outputMode, casing, isOptional, delimiter, t]);

  useEffect(() => {
    generateTypeScript();
  }, [generateTypeScript]);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        input,
        typeName,
        outputMode,
        casing,
        isOptional,
        delimiter,
      });
    }
  }, [input, typeName, outputMode, casing, isOptional, delimiter, onStateChange]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('csvtotypescript.toast_copied', 'TypeScript definitions copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.success(t('csvtotypescript.toast_cleared', 'Input cleared!'));
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/typescript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${typeName || 'types'}.ts`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success', 'Download successful'));
  };

  // Keyboard shortcut listener
  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !isEditable) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Presets
  const presets = [
    {
      name: t('csvtotypescript.preset_user', 'User Account'),
      data: `id,full_name,email,is_active,age,balance,created_at\n1,Alice Vance,alice@example.com,true,30,1250.50,2024-01-15\n2,Bob Miller,bob@example.com,false,25,0.00,2024-02-01\n3,Charlie Smith,charlie@example.com,true,42,890.75,2024-02-20`,
    },
    {
      name: t('csvtotypescript.preset_products', 'Product Inventory TSV'),
      data: `sku\tproduct_name\tcategory\tprice\tin_stock\nELE-101\tWireless Mouse\tElectronics\t29.99\ttrue\nELE-102\tMechanical Keyboard\tElectronics\t89.50\ttrue\nFUR-201\tErgonomic Chair\tFurniture\t199.00\tfalse`,
    },
    {
      name: t('csvtotypescript.preset_orders', 'Orders Log'),
      data: `order_id,customer_id,total_amount,status,shipped\n1001,USR-45,149.99,Completed,true\n1002,USR-82,89.00,Pending,false\n1003,USR-12,230.50,Completed,true`,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Bar with Presets & Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t('csvtotypescript.presets_title', 'Quick Presets:')}
          </span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(preset.data);
                toast.success(t('csvtotypescript.toast_preset_loaded', 'Preset loaded!'));
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> {t('common.clear', 'Clear')}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>C</Kbd> {t('common.copy', 'Copy')}
          </span>
        </div>
      </div>

      {/* Options Controls */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Settings className="w-4 h-4 text-indigo-500" />
          {t('common.options', 'Configuration Options')}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Type / Interface Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="csv-ts-type-name"
              className="block text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              {t('csvtotypescript.type_name', 'Type / Interface Name')}
            </label>
            <input
              id="csv-ts-type-name"
              type="text"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder="e.g. User, Product, Order"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Export Mode */}
          <div className="space-y-1.5">
            <label
              htmlFor="csv-ts-output-mode"
              className="block text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              {t('csvtotypescript.output_mode', 'Output Format')}
            </label>
            <select
              id="csv-ts-output-mode"
              value={outputMode}
              onChange={(e) => setOutputMode(e.target.value as 'interface' | 'type')}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="interface">interface Name &#123; ... &#125;</option>
              <option value="type">type Name = &#123; ... &#125;</option>
            </select>
          </div>

          {/* Property Casing */}
          <div className="space-y-1.5">
            <label
              htmlFor="csv-ts-casing"
              className="block text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              {t('csvtotypescript.field_casing', 'Property Casing')}
            </label>
            <select
              id="csv-ts-casing"
              value={casing}
              onChange={(e) =>
                setCasing(e.target.value as 'original' | 'camelCase' | 'snake_case' | 'PascalCase')
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="camelCase">camelCase</option>
              <option value="snake_case">snake_case</option>
              <option value="PascalCase">PascalCase</option>
              <option value="original">Original Header</option>
            </select>
          </div>

          {/* Delimiter Selection */}
          <div className="space-y-1.5">
            <label
              htmlFor="csv-ts-delimiter"
              className="block text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              {t('csvdelimiter.label', 'Delimiter')}
            </label>
            <select
              id="csv-ts-delimiter"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="auto">✨ Auto-Detect</option>
              <option value=",">Comma (,)</option>
              <option value="&#9;">Tab (\t)</option>
              <option value=";">Semicolon (;)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
        </div>

        {/* Optional Fields Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <input
            id="csv-ts-optional"
            type="checkbox"
            checked={isOptional}
            onChange={(e) => setIsOptional(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
          <label
            htmlFor="csv-ts-optional"
            className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            {t('csvtotypescript.make_optional', 'Mark all properties as optional (?)')}
          </label>
        </div>
      </div>

      {/* Main Input / Output Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Input Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="csv-ts-input"
              className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              {t('csvtotypescript.input_label', 'CSV / TSV Input Data')}
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('common.clear', 'Clear')}
            </button>
          </div>

          <div className="relative">
            <textarea
              id="csv-ts-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your CSV or TSV data here..."
              rows={14}
              className="w-full p-4 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y placeholder:text-slate-400"
            />
            <div className="absolute bottom-3 right-3 text-[10px] font-medium text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
              {input.length} / {MAX_LENGTH}
            </div>
          </div>
        </div>

        {/* TypeScript Output Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="ts-output"
              className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
            >
              <FileCode className="w-4 h-4 text-indigo-500" />
              {t('csvtotypescript.output_label', 'TypeScript Code')}
            </label>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                {t('common.download', 'Download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy TS')}
              </button>
            </div>
          </div>

          <textarea
            id="ts-output"
            ref={outputRef}
            readOnly
            value={output}
            placeholder={t(
              'csvtotypescript.placeholder_output',
              'Generated TypeScript definitions will appear here...'
            )}
            rows={14}
            className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
          <Info className="w-4 h-4 text-indigo-500" />
          {t('csvtotypescript.about_title', 'About CSV to TypeScript Converter')}
        </div>
        <p className="leading-relaxed">
          {t(
            'csvtotypescript.about_text',
            'Convert CSV or TSV datasets into clean, strongly-typed TypeScript interface or type alias definitions. Features automatic column data type inference (string, number, boolean, null), field casing customization (camelCase, snake_case, PascalCase, original), optional field toggles, and instant copy/download functionality. All processing occurs entirely client-side in your browser for complete data privacy.'
          )}
        </p>
      </div>
    </div>
  );
};

export default CSVToTypeScript;
