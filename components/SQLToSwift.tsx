import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, RefreshCw, Code2, Sparkles, FileCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

// Swift reserved keywords that require backtick escaping when used as identifiers
const SWIFT_RESERVED_KEYWORDS = new Set([
  'associatedtype', 'class', 'deinit', 'enum', 'extension', 'fileprivate', 'func', 'import',
  'init', 'inout', 'internal', 'let', 'open', 'operator', 'private', 'precedencegroup',
  'protocol', 'public', 'rethrows', 'static', 'struct', 'subscript', 'typealias', 'var',
  'break', 'case', 'catch', 'continue', 'default', 'defer', 'do', 'else', 'fallthrough',
  'for', 'guard', 'if', 'in', 'repeat', 'return', 'throw', 'switch', 'where', 'while',
  'any', 'as', 'await', 'false', 'is', 'nil', 'self', 'Self', 'super', 'true', 'try', 'type'
]);

const PRESETS = [
  {
    id: 'ecommerce',
    nameKey: 'sqltoswift.preset_ecommerce',
    sql: `CREATE TABLE products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock_quantity INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  metadata JSON NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`
  },
  {
    id: 'user_auth',
    nameKey: 'sqltoswift.preset_user_auth',
    sql: `CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  email_verified_at TIMESTAMP NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    id: 'blog',
    nameKey: 'sqltoswift.preset_blog',
    sql: `CREATE TABLE posts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  author_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content LONGTEXT NOT NULL,
  view_count INT UNSIGNED NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  }
];

type TypeKind = 'struct' | 'class';
type PropertyCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';

export function SQLToSwift({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || PRESETS[0].sql);
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(PRESETS[0].id);

  // Configuration options
  const [typeKind, setTypeKind] = useState<TypeKind>(initialData?.typeKind || 'struct');
  const [propertyCasing, setPropertyCasing] = useState<PropertyCasing>(initialData?.propertyCasing || 'camelCase');
  const [generateCodingKeys, setGenerateCodingKeys] = useState(initialData?.generateCodingKeys ?? true);
  const [useIdentifiable, setUseIdentifiable] = useState(initialData?.useIdentifiable ?? true);
  const [useDateType, setUseDateType] = useState(initialData?.useDateType ?? true);
  const [useUUIDType, setUseUUIDType] = useState(initialData?.useUUIDType ?? true);
  const [generateInit, setGenerateInit] = useState(initialData?.generateInit ?? false);
  const [makePublic, setMakePublic] = useState(initialData?.makePublic ?? true);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      typeKind,
      propertyCasing,
      generateCodingKeys,
      useIdentifiable,
      useDateType,
      useUUIDType,
      generateInit,
      makePublic,
    });
  }, [input, output, typeKind, propertyCasing, generateCodingKeys, useIdentifiable, useDateType, useUUIDType, generateInit, makePublic, onStateChange]);

  const toPascalCase = (str: string): string => {
    const pascal = str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
    if (!pascal) return 'Model';
    if (/^[0-9]/.test(pascal)) return 'Model' + pascal;
    return pascal;
  };

  const toCamelCase = (str: string): string => {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  };

  const toSnakeCase = (str: string): string => {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_');
  };

  const formatPropertyName = (colName: string, casing: PropertyCasing): string => {
    switch (casing) {
      case 'camelCase': return toCamelCase(colName);
      case 'snake_case': return toSnakeCase(colName);
      case 'PascalCase': return toPascalCase(colName);
      case 'original':
      default: return colName;
    }
  };

  const formatSwiftIdentifier = (name: string): string => {
    let clean = name.replace(/[`\r\n]/g, '').trim();
    if (!clean) clean = 'property';

    const startsWithDigit = /^[0-9]/.test(clean);
    const isKeyword = SWIFT_RESERVED_KEYWORDS.has(clean);

    if (startsWithDigit || isKeyword) {
      return `\`${clean}\``;
    }
    return clean;
  };

  const mapSqlToSwiftType = (sqlType: string, isUuidCol: boolean): string => {
    const upper = sqlType.toUpperCase();

    if (isUuidCol && useUUIDType && (upper.includes('VARCHAR(36)') || upper.includes('CHAR(36)') || upper.includes('UUID') || upper.includes('GUID'))) {
      return 'UUID';
    }

    if (upper.includes('TINYINT(1)') || upper === 'BOOLEAN' || upper === 'BOOL') {
      return 'Bool';
    }
    if (upper.includes('BIGINT')) {
      return 'Int64';
    }
    if (upper.includes('INT') || upper.includes('SMALLINT') || upper.includes('MEDIUMINT')) {
      return 'Int';
    }
    if (upper.includes('FLOAT') || upper.includes('DOUBLE') || upper.includes('DECIMAL') || upper.includes('NUMERIC') || upper.includes('REAL')) {
      return 'Double';
    }
    if (upper.includes('JSON')) {
      return 'Data';
    }
    if (useDateType && (upper.includes('DATE') || upper.includes('TIME') || upper.includes('TIMESTAMP') || upper.includes('YEAR'))) {
      return 'Date';
    }
    if (upper.includes('BLOB') || upper.includes('BYTEA') || upper.includes('BINARY')) {
      return 'Data';
    }
    return 'String';
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

      const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`"']?(\w+)[`"']?\.)?[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\)(?:;|\s*$)/gi;
      let match;
      const parsedTables: Array<{
        tableName: string;
        columns: Array<{ name: string; type: string; nullable: boolean; isPk: boolean; originalName: string }>;
      }> = [];

      while ((match = createTableRegex.exec(input)) !== null) {
        const rawTableName = match[2] || match[1] || 'table_model';
        const body = match[3];

        const columns: Array<{ name: string; type: string; nullable: boolean; isPk: boolean; originalName: string }> = [];
        const lines = body.split('\n');

        lines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('#') || trimmed.startsWith('/*')) return;

          if (/^(?:CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|KEY|INDEX|UNIQUE\s+KEY|UNIQUE)\b/i.test(trimmed)) {
            return;
          }

          const colMatch = trimmed.match(/^[`"']?(\w+)[`"']?\s+([A-Za-z0-9_()]+)/i);
          if (colMatch) {
            const originalName = colMatch[1];
            const rawType = colMatch[2];
            const isNullable = !/NOT\s+NULL/i.test(trimmed);
            const isPk = /PRIMARY\s+KEY/i.test(trimmed) || originalName.toLowerCase() === 'id';
            const isUuidCol = originalName.toLowerCase().includes('uuid') || originalName.toLowerCase().includes('guid') || rawType.toLowerCase().includes('uuid');

            const swiftType = mapSqlToSwiftType(rawType, isUuidCol);

            columns.push({
              name: originalName,
              type: swiftType,
              nullable: isNullable,
              isPk,
              originalName
            });
          }
        });

        if (columns.length > 0) {
          parsedTables.push({
            tableName: rawTableName,
            columns
          });
        }
      }

      if (parsedTables.length === 0) {
        setError(t('sqltoswift.no_tables_found'));
        setOutput('');
        return;
      }

      const generatedTypes: string[] = [];
      let requiresFoundation = false;

      parsedTables.forEach(table => {
        const typeName = toPascalCase(table.tableName);
        const hasIdCol = table.columns.some(c => c.originalName.toLowerCase() === 'id' || c.isPk);

        const properties = table.columns.map(col => {
          const formatted = formatPropertyName(col.name, propertyCasing);
          const swiftIdentifier = formatSwiftIdentifier(formatted);
          if (col.type === 'Date' || col.type === 'UUID' || col.type === 'Data') {
            requiresFoundation = true;
          }
          return {
            originalName: col.originalName,
            swiftKey: swiftIdentifier,
            swiftType: col.type,
            nullable: col.nullable,
            isPk: col.isPk
          };
        });

        const protocols = ['Codable'];
        if (useIdentifiable && hasIdCol) {
          protocols.push('Identifiable');
        }

        const visibility = makePublic ? 'public ' : '';
        let code = `${visibility}${typeKind} ${typeName}: ${protocols.join(', ')} {\n`;

        // Property Declarations
        properties.forEach(prop => {
          const typeStr = prop.nullable ? `${prop.swiftType}?` : prop.swiftType;
          const comment = prop.swiftKey.replace(/`/g, '') !== prop.originalName ? ` // original: ${prop.originalName}` : '';
          code += `    ${visibility}let ${prop.swiftKey}: ${typeStr}${comment}\n`;
        });

        // Memberwise Initializer
        if (generateInit) {
          code += `\n    ${visibility}init(\n`;
          code += properties.map(p => {
            const typeStr = p.nullable ? `${p.swiftType}? = nil` : p.swiftType;
            return `        ${p.swiftKey}: ${typeStr}`;
          }).join(',\n');
          code += `\n    ) {\n`;
          properties.forEach(p => {
            code += `        self.${p.swiftKey} = ${p.swiftKey}\n`;
          });
          code += `    }\n`;
        }

        // CodingKeys enum generation
        const needsCodingKeys = generateCodingKeys && properties.some(p => p.originalName !== p.swiftKey.replace(/`/g, ''));
        if (needsCodingKeys && properties.length > 0) {
          code += `\n    ${visibility}enum CodingKeys: String, CodingKey {\n`;
          properties.forEach(p => {
            const cleanKey = p.swiftKey.replace(/`/g, '');
            if (p.originalName !== cleanKey) {
              code += `        case ${p.swiftKey} = "${p.originalName}"\n`;
            } else {
              code += `        case ${p.swiftKey}\n`;
            }
          });
          code += `    }\n`;
        }

        code += `}`;
        generatedTypes.push(code);
      });

      let finalOutput = '';
      if (requiresFoundation) {
        finalOutput += 'import Foundation\n\n';
      }
      finalOutput += generatedTypes.join('\n\n');

      setOutput(finalOutput);
      setError('');
    } catch (err: any) {
      setError(t('sqltoswift.error_parsing') + ': ' + err.message);
      setOutput('');
    }
  }, [input, typeKind, propertyCasing, generateCodingKeys, useIdentifiable, useDateType, useUUIDType, generateInit, makePublic, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltoswift.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('sqltoswift.toast_cleared'));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [t]);

  const handleLoadPreset = (preset: typeof PRESETS[0]) => {
    setInput(preset.sql);
    setActivePreset(preset.id);
    toast.success(t('sqltoswift.preset_loaded'));
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/x-swift' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Models.swift';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded'));
  };

  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              {t('sqltoswift.presets_title')}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Swift 5.9+ / Codable / Identifiable</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                aria-pressed={isActive}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                {t(preset.nameKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          {t('common.options')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Type Construct */}
          <div className="space-y-2">
            <label htmlFor="swift-type-kind-select" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {t('sqltoswift.type_kind')}
            </label>
            <select
              id="swift-type-kind-select"
              value={typeKind}
              onChange={(e) => setTypeKind(e.target.value as TypeKind)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="struct">struct (Value Type / Recommended)</option>
              <option value="class">class (Reference Type)</option>
            </select>
          </div>

          {/* Property Casing */}
          <div className="space-y-2">
            <label htmlFor="property-casing-select" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {t('sqltoswift.property_casing')}
            </label>
            <select
              id="property-casing-select"
              value={propertyCasing}
              onChange={(e) => setPropertyCasing(e.target.value as PropertyCasing)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="camelCase">camelCase (stockQuantity)</option>
              <option value="snake_case">snake_case (stock_quantity)</option>
              <option value="PascalCase">PascalCase (StockQuantity)</option>
              <option value="original">Original Column Name</option>
            </select>
          </div>

          {/* Checkboxes Group 1 */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={generateCodingKeys}
                onChange={(e) => setGenerateCodingKeys(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 transition-colors">
                {t('sqltoswift.generate_coding_keys')}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={useIdentifiable}
                onChange={(e) => setUseIdentifiable(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 transition-colors">
                {t('sqltoswift.use_identifiable')}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={makePublic}
                onChange={(e) => setMakePublic(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 transition-colors">
                {t('sqltoswift.make_public')}
              </span>
            </label>
          </div>

          {/* Checkboxes Group 2 */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={useDateType}
                onChange={(e) => setUseDateType(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 transition-colors">
                {t('sqltoswift.use_date_type')}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={useUUIDType}
                onChange={(e) => setUseUUIDType(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 transition-colors">
                {t('sqltoswift.use_uuid_type')}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={generateInit}
                onChange={(e) => setGenerateInit(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 transition-colors">
                {t('sqltoswift.generate_init')}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Conversion Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <label htmlFor="sql-swift-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoswift.sql_input_label')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">
                Esc
              </Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-swift-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder={t('sqltoswift.placeholder_sql')}
            className="w-full h-[480px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="swift-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoswift.output_label')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="swift-output"
            value={output}
            readOnly
            placeholder={t('sqltoswift.placeholder_output')}
            className="w-full h-[480px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Guide Info Footer */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 space-y-4">
        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-500" />
          {t('sqltoswift.about_title')}
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('sqltoswift.about_text')}
        </p>
      </div>
    </div>
  );
}
