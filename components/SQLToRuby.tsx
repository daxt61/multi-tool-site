import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export type RubyConstructStyle = 'class' | 'data' | 'struct' | 'sorbet' | 'dry_struct';
export type RubyPropertyCasing = 'snake_case' | 'camelCase' | 'PascalCase' | 'original';

const RUBY_KEYWORDS = new Set([
  '__ENCODING__', '__LINE__', '__FILE__', 'BEGIN', 'END', 'alias', 'and', 'begin',
  'break', 'case', 'class', 'def', 'defined', 'do', 'else', 'elsif', 'end', 'ensure',
  'false', 'for', 'if', 'in', 'module', 'next', 'nil', 'not', 'or', 'redo', 'rescue',
  'retry', 'return', 'self', 'super', 'then', 'true', 'undef', 'unless', 'until', 'when',
  'while', 'yield', 'attr_accessor', 'attr_reader', 'attr_writer', 'initialize', 'include', 'extend'
]);

export function sanitizeRubyIdentifier(name: string): string {
  if (!name) return 'property';
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^[0-9]/.test(sanitized)) {
    sanitized = `r_${sanitized}`;
  }
  const lower = sanitized.toLowerCase();
  if (RUBY_KEYWORDS.has(lower) || RUBY_KEYWORDS.has(sanitized)) {
    return `${sanitized}_var`;
  }
  return sanitized;
}

export function escapeRubyString(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/#/g, '\\#')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

export function SQLToRuby({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState<string>(initialData?.input || '');
  const [output, setOutput] = useState<string>(initialData?.output || '');
  const [constructStyle, setConstructStyle] = useState<RubyConstructStyle>(initialData?.constructStyle || 'class');
  const [propertyCasing, setPropertyCasing] = useState<RubyPropertyCasing>(initialData?.propertyCasing || 'snake_case');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      constructStyle,
      propertyCasing,
    });
  }, [input, output, constructStyle, propertyCasing, onStateChange]);

  const PRESETS = {
    ecommerce: `-- E-Commerce Catalog Table DDL
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  parent_id INT
);

CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);`,
    user_auth: `-- User Auth & Roles Table DDL
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  login_count INT NOT NULL DEFAULT 0,
  last_login_at TIMESTAMP
);`,
    blog: `-- Blog CMS Table DDL
CREATE TABLE posts (
  id BIGINT PRIMARY KEY,
  author_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  views_count INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP
);`
  };

  const applyCasing = (str: string, casing: RubyPropertyCasing): string => {
    if (casing === 'original') return str;

    const words = str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ')
      .trim()
      .split(/\s+/);

    if (words.length === 0 || !words[0]) return str;

    if (casing === 'snake_case') {
      return words.map(w => w.toLowerCase()).join('_');
    }
    if (casing === 'camelCase') {
      return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }
    if (casing === 'PascalCase') {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }

    return str;
  };

  const mapSqlTypeToRuby = (
    sqlType: string
  ): { rubyType: string; sorbetType: string; dryType: string } => {
    const norm = sqlType.toUpperCase().trim();

    if (norm.includes('INT') || norm.includes('SERIAL')) {
      return { rubyType: 'Integer', sorbetType: 'Integer', dryType: 'Types::Integer' };
    }
    if (norm.includes('DECIMAL') || norm.includes('NUMERIC') || norm.includes('FLOAT') || norm.includes('DOUBLE') || norm.includes('REAL')) {
      return { rubyType: 'Float', sorbetType: 'Float', dryType: 'Types::Float' };
    }
    if (norm.includes('BOOL') || norm.includes('TINYINT(1)')) {
      return { rubyType: 'Boolean', sorbetType: 'T::Boolean', dryType: 'Types::Bool' };
    }
    if (norm.includes('TIME') || norm.includes('DATE')) {
      return { rubyType: 'DateTime', sorbetType: 'DateTime', dryType: 'Types::JSON::DateTime' };
    }
    if (norm.includes('JSON')) {
      return { rubyType: 'Hash', sorbetType: 'T::Hash[Symbol, T.untyped]', dryType: 'Types::Hash' };
    }

    return { rubyType: 'String', sorbetType: 'String', dryType: 'Types::String' };
  };

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

      // Remove single-line comments (-- and //) and block comments
      const cleanSql = input
        .replace(/--.*$/gm, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      // Match CREATE TABLE statements
      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"']?[\w.]+\b[`"']?)\s*\(([\s\S]*?)\)(?:\s*;|\s*$|\s*ENGINE|\s*WITH)/gi;

      const outputBlocks: string[] = [];
      let tableMatch: RegExpExecArray | null;

      while ((tableMatch = tableRegex.exec(cleanSql)) !== null) {
        let rawTableName = tableMatch[1].replace(/[`"']/g, '');
        if (rawTableName.includes('.')) {
          rawTableName = rawTableName.split('.').pop() || rawTableName;
        }

        // Singularize simple plural names or PascalCase
        let singularName = rawTableName;
        if (singularName.toLowerCase().endsWith('ies')) {
          singularName = singularName.slice(0, -3) + 'y';
        } else if (singularName.toLowerCase().endsWith('s') && !singularName.toLowerCase().endsWith('ss')) {
          singularName = singularName.slice(0, -1);
        }

        const className = singularName
          .split('_')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join('');

        const body = tableMatch[2];
        const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

        const columns: Array<{
          rawName: string;
          fieldName: string;
          rubyType: string;
          sorbetType: string;
          dryType: string;
          isNullable: boolean;
        }> = [];

        lines.forEach(line => {
          // Ignore constraint lines
          if (
            /^(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|KEY|INDEX|CHECK)\b/i.test(line)
          ) {
            return;
          }

          const colMatch = line.match(/^[`"']?([\w_]+)[`"']?\s+([A-Za-z0-9_()]+)(.*)/i);
          if (colMatch) {
            const rawColName = colMatch[1];
            const sqlType = colMatch[2];
            const rest = colMatch[3] || '';

            const isNullable = !/NOT\s+NULL/i.test(rest) && !/PRIMARY\s+KEY/i.test(rest);
            const fieldCased = applyCasing(rawColName, propertyCasing);
            const fieldName = sanitizeRubyIdentifier(fieldCased);
            const { rubyType, sorbetType, dryType } = mapSqlTypeToRuby(sqlType);

            columns.push({
              rawName: rawColName,
              fieldName,
              rubyType,
              sorbetType,
              dryType,
              isNullable,
            });
          }
        });

        let classBlock = '';

        if (constructStyle === 'sorbet') {
          classBlock += `class ${className} < T::Struct\n`;
          columns.forEach(col => {
            const propKeyword = !col.isNullable ? 'const' : 'prop';
            const typeSig = !col.isNullable ? col.sorbetType : `T.nilable(${col.sorbetType})`;
            classBlock += `  ${propKeyword} :${col.fieldName}, ${typeSig}\n`;
          });
          classBlock += `end`;
        } else if (constructStyle === 'dry_struct') {
          classBlock += `class ${className} < Dry::Struct\n`;
          columns.forEach(col => {
            const attrType = col.isNullable ? `${col.dryType}.optional` : col.dryType;
            const attrKey = col.isNullable ? 'attribute?' : 'attribute';
            classBlock += `  ${attrKey} :${col.fieldName}, ${attrType}\n`;
          });
          classBlock += `end`;
        } else if (constructStyle === 'data') {
          // Ruby 3.2+ Data.define
          if (columns.length > 0) {
            classBlock += `${className} = Data.define(${columns.map(c => `:${c.fieldName}`).join(', ')})`;
          } else {
            classBlock += `${className} = Data.define`;
          }
        } else if (constructStyle === 'struct') {
          // Struct.new
          if (columns.length > 0) {
            classBlock += `${className} = Struct.new(${columns.map(c => `:${c.fieldName}`).join(', ')}, keyword_init: true) do\n`;
            classBlock += `  # Struct helper methods\n`;
            classBlock += `end`;
          } else {
            classBlock += `${className} = Struct.new do\n  # Empty struct\nend`;
          }
        } else {
          // Standard Ruby Class
          classBlock += `class ${className}\n`;
          if (columns.length > 0) {
            classBlock += `  attr_accessor ${columns.map(c => `:${c.fieldName}`).join(', ')}\n\n`;
            classBlock += `  def initialize(${columns.map(c => `${c.fieldName}: ${c.isNullable ? 'nil' : ''}`).join(', ')})\n`;
            columns.forEach(c => {
              classBlock += `    @${c.fieldName} = ${c.fieldName}\n`;
            });
            classBlock += `  end\n`;
          } else {
            classBlock += `  # No attributes\n`;
          }
          classBlock += `end`;
        }

        outputBlocks.push(classBlock);
      }

      if (outputBlocks.length === 0) {
        setError(t('sqltoruby.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
        return;
      }

      let fullOutput = `# frozen_string_literal: true\n\n`;
      if (constructStyle === 'sorbet') {
        fullOutput = `# typed: strict\n# frozen_string_literal: true\n\nrequire 'sorbet-runtime'\n\n`;
      } else if (constructStyle === 'dry_struct') {
        fullOutput = `# frozen_string_literal: true\n\nrequire 'dry-struct'\nrequire 'dry-types'\n\nmodule Types\n  include Dry.Types()\nend\n\n`;
      }

      fullOutput += outputBlocks.join('\n\n');

      setOutput(fullOutput);
      setError('');
    } catch (e: any) {
      setError(t('sqltoruby.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, constructStyle, propertyCasing, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltoruby.toast_copied', 'Ruby models copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('sqltoruby.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/x-ruby' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'models.rb';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded models.rb!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('sqltoruby.preset_loaded', 'Loaded SQL preset!'));
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
        activeElement?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        if (handlersRef.current.output) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoruby.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            aria-pressed={activePresetId === 'ecommerce'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'ecommerce'
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('sqltoruby.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            aria-pressed={activePresetId === 'user_auth'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'user_auth'
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('sqltoruby.preset_user_auth', 'User Management & Auth')}
          </button>
          <button
            onClick={() => loadPreset('blog')}
            aria-pressed={activePresetId === 'blog'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'blog'
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('sqltoruby.preset_blog', 'Blog CMS')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="sql-ruby-construct-style" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoruby.construct_style', 'Model Construct')}
          </label>
          <select
            id="sql-ruby-construct-style"
            value={constructStyle}
            onChange={(e) => setConstructStyle(e.target.value as RubyConstructStyle)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="class">Standard Class (class Model)</option>
            <option value="data">Ruby 3.2+ Data (Data.define)</option>
            <option value="struct">Struct (Struct.new)</option>
            <option value="sorbet">Sorbet (T::Struct)</option>
            <option value="dry_struct">Dry-Types (Dry::Struct)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sql-ruby-property-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoruby.property_casing', 'Property Casing')}
          </label>
          <select
            id="sql-ruby-property-casing"
            value={propertyCasing}
            onChange={(e) => setPropertyCasing(e.target.value as RubyPropertyCasing)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (@product_name)</option>
            <option value="camelCase">camelCase (@productName)</option>
            <option value="PascalCase">PascalCase (@ProductName)</option>
            <option value="original">Original</option>
          </select>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-ruby-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoruby.sql_input_label', 'SQL CREATE TABLE DDL')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-ruby-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltoruby.placeholder_sql', 'Paste SQL CREATE TABLE DDL here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="ruby-sql-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoruby.output_label', 'Generated Ruby Models')}
              </label>
            </div>
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
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && input && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="ruby-sql-output"
            value={output}
            readOnly
            placeholder={t('sqltoruby.placeholder_output', 'Generated Ruby models will appear here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('sqltoruby.about_title', 'About SQL DDL to Ruby Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltoruby.about_text', 'Convert SQL CREATE TABLE DDL queries directly into strongly-typed Ruby models, Data.define DTOs, Structs, Sorbet T::Struct, or Dry::Struct models.')}
          </p>
        </div>
      </div>
    </div>
  );
}
