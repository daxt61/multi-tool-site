import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

interface Preset {
  id: string;
  nameKey: string;
  defaultName: string;
  sql: string;
}

const PRESETS: Preset[] = [
  {
    id: 'catalog',
    nameKey: 'sqltodart.preset_catalog',
    defaultName: 'E-Commerce Catalog',
    sql: `CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock_quantity INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category_id INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);`,
  },
  {
    id: 'auth',
    nameKey: 'sqltodart.preset_auth',
    defaultName: 'User Auth & Roles',
    sql: `CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMP,
  metadata JSON
);`,
  },
  {
    id: 'blog',
    nameKey: 'sqltodart.preset_blog',
    defaultName: 'Blog CMS',
    sql: `CREATE TABLE posts (
  post_id INT PRIMARY KEY AUTO_INCREMENT,
  author_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  views_count INT NOT NULL DEFAULT 0,
  published_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);`,
  },
];

const DART_RESERVED_KEYWORDS = new Set([
  'abstract', 'as', 'assert', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'covarient', 'default', 'deferred', 'do', 'dynamic', 'else', 'enum', 'export',
  'extends', 'extension', 'external', 'factory', 'false', 'final', 'finally', 'for', 'Function',
  'get', 'hide', 'if', 'implements', 'import', 'in', 'interface', 'is', 'late', 'library', 'mixin',
  'new', 'null', 'on', 'operator', 'part', 'required', 'rethrow', 'return', 'set', 'show', 'static',
  'super', 'switch', 'sync', 'this', 'throw', 'true', 'try', 'typedef', 'var', 'void', 'while', 'with', 'yield'
]);

export function SQLToDart({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || PRESETS[0].sql);
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('catalog');

  // Options
  const [constructMode, setConstructMode] = useState<'plain' | 'json_serializable' | 'freezed'>(
    initialData?.constructMode || 'plain'
  );
  const [casing, setCasing] = useState<'camelCase' | 'snake_case' | 'PascalCase' | 'original'>(
    initialData?.casing || 'camelCase'
  );
  const [includeCopyWith, setIncludeCopyWith] = useState<boolean>(initialData?.includeCopyWith ?? true);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ input, output, constructMode, casing, includeCopyWith });
  }, [input, output, constructMode, casing, includeCopyWith, onStateChange]);

  const sanitizeIdentifier = (name: string): string => {
    let clean = name.replace(/[`"']/g, '').trim();
    clean = clean.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(clean)) {
      clean = 'field_' + clean;
    }
    if (DART_RESERVED_KEYWORDS.has(clean)) {
      clean = clean + '_';
    }
    return clean || 'field';
  };

  const transformCasing = (str: string, choice: typeof casing): string => {
    const raw = str.replace(/[`"']/g, '').trim();
    if (choice === 'original') return sanitizeIdentifier(raw);

    const parts = raw.split(/[-_\s]+/).filter(Boolean);
    if (parts.length === 0) return sanitizeIdentifier(raw);

    let res = '';
    if (choice === 'camelCase') {
      res = parts[0].toLowerCase() + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
    } else if (choice === 'PascalCase') {
      res = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
    } else if (choice === 'snake_case') {
      res = parts.map(p => p.toLowerCase()).join('_');
    }

    return sanitizeIdentifier(res);
  };

  const toPascalCase = (str: string): string => {
    const raw = str.replace(/[`"']/g, '').trim();
    const parts = raw.split(/[-_\s]+/).filter(Boolean);
    if (parts.length === 0) return 'Model';
    const pascal = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
    return /^[0-9]/.test(pascal) ? `Model${pascal}` : pascal;
  };

  const mapSqlTypeToDart = (sqlType: string): string => {
    const typeUpper = sqlType.toUpperCase().trim();

    if (typeUpper.includes('INT') || typeUpper.includes('SERIAL')) return 'int';
    if (typeUpper.includes('DECIMAL') || typeUpper.includes('NUMERIC') || typeUpper.includes('FLOAT') || typeUpper.includes('DOUBLE') || typeUpper.includes('REAL')) return 'double';
    if (typeUpper.includes('BOOL')) return 'bool';
    if (typeUpper.includes('DATE') || typeUpper.includes('TIMESTAMP') || typeUpper.includes('DATETIME')) return 'DateTime';
    if (typeUpper.includes('JSON') || typeUpper.includes('JSONB')) return 'Map<String, dynamic>';

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

      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"'\w.]+)\s*\(([\s\S]*?)\)(?:;|$)/gi;
      let match: RegExpExecArray | null;
      const classOutputs: string[] = [];

      let foundTable = false;

      while ((match = tableRegex.exec(input)) !== null) {
        foundTable = true;
        const rawTableName = match[1].split('.').pop() || match[1];
        const className = toPascalCase(rawTableName);
        const fileName = rawTableName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const body = match[2];

        const lines = body.split('\n');
        const fields: Array<{
          originalName: string;
          dartName: string;
          dartType: string;
          isNullable: boolean;
        }> = [];

        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith('--') || line.startsWith('//') || line.startsWith('#')) continue;

          const upperLine = line.toUpperCase();
          if (
            upperLine.startsWith('PRIMARY KEY') ||
            upperLine.startsWith('FOREIGN KEY') ||
            upperLine.startsWith('UNIQUE') ||
            upperLine.startsWith('KEY') ||
            upperLine.startsWith('INDEX') ||
            upperLine.startsWith('CONSTRAINT') ||
            upperLine.startsWith('CHECK')
          ) {
            continue;
          }

          const colMatch = line.match(/^([`"'\w]+)\s+([A-Za-z0-9_()]+)(.*)/);
          if (colMatch) {
            const originalName = colMatch[1];
            const rawType = colMatch[2];
            const rest = colMatch[3] || '';

            const isNullable = !rest.toUpperCase().includes('NOT NULL') && !rest.toUpperCase().includes('PRIMARY KEY');
            const dartName = transformCasing(originalName, casing);
            const baseType = mapSqlTypeToDart(rawType);

            fields.push({
              originalName: originalName.replace(/[`"']/g, ''),
              dartName,
              dartType: isNullable ? `${baseType}?` : baseType,
              isNullable,
            });
          }
        }

        let classCode = '';

        if (constructMode === 'freezed') {
          classCode += `import 'package:freezed_annotation/freezed_annotation.dart';\n\n`;
          classCode += `part '${fileName}.freezed.dart';\n`;
          classCode += `part '${fileName}.g.dart';\n\n`;
          classCode += `@freezed\n`;
          classCode += `class ${className} with _\$${className} {\n`;
          classCode += `  const factory ${className}({\n`;
          fields.forEach(f => {
            const requiredStr = f.isNullable ? '' : 'required ';
            const jsonKeyStr = f.originalName !== f.dartName ? `@JsonKey(name: '${f.originalName}') ` : '';
            classCode += `    ${jsonKeyStr}${requiredStr}${f.dartType} ${f.dartName},\n`;
          });
          classCode += `  }) = _${className};\n\n`;
          classCode += `  factory ${className}.fromJson(Map<String, dynamic> json) => _\$${className}FromJson(json);\n`;
          classCode += `}`;
        } else if (constructMode === 'json_serializable') {
          classCode += `import 'package:json_annotation/json_annotation.dart';\n\n`;
          classCode += `part '${fileName}.g.dart';\n\n`;
          classCode += `@JsonSerializable()\n`;
          classCode += `class ${className} {\n`;
          fields.forEach(f => {
            if (f.originalName !== f.dartName) {
              classCode += `  @JsonKey(name: '${f.originalName}')\n`;
            }
            classCode += `  final ${f.dartType} ${f.dartName};\n`;
          });
          classCode += `\n  const ${className}({\n`;
          fields.forEach(f => {
            const requiredStr = f.isNullable ? '' : 'required ';
            classCode += `    ${requiredStr}this.${f.dartName},\n`;
          });
          classCode += `  });\n\n`;
          classCode += `  factory ${className}.fromJson(Map<String, dynamic> json) => _\$${className}FromJson(json);\n`;
          classCode += `  Map<String, dynamic> toJson() => _\$${className}ToJson(this);\n`;
          classCode += `}`;
        } else {
          // Plain Dart class
          classCode += `class ${className} {\n`;
          fields.forEach(f => {
            classCode += `  final ${f.dartType} ${f.dartName};\n`;
          });
          classCode += `\n  const ${className}({\n`;
          fields.forEach(f => {
            const requiredStr = f.isNullable ? '' : 'required ';
            classCode += `    ${requiredStr}this.${f.dartName},\n`;
          });
          classCode += `  });\n\n`;

          // fromJson
          classCode += `  factory ${className}.fromJson(Map<String, dynamic> json) {\n`;
          classCode += `    return ${className}(\n`;
          fields.forEach(f => {
            if (f.dartType.startsWith('DateTime')) {
              classCode += `      ${f.dartName}: json['${f.originalName}'] != null ? DateTime.parse(json['${f.originalName}']) : null,\n`;
            } else if (f.dartType.startsWith('double')) {
              classCode += `      ${f.dartName}: (json['${f.originalName}'] as num?)?.toDouble(),\n`;
            } else if (f.dartType.startsWith('int')) {
              classCode += `      ${f.dartName}: json['${f.originalName}'] as int?,\n`;
            } else if (f.dartType.startsWith('bool')) {
              classCode += `      ${f.dartName}: json['${f.originalName}'] as bool?,\n`;
            } else {
              classCode += `      ${f.dartName}: json['${f.originalName}'] as ${f.dartType.replace('?', '')}?,\n`;
            }
          });
          classCode += `    );\n  }\n\n`;

          // toJson
          classCode += `  Map<String, dynamic> toJson() {\n`;
          classCode += `    return {\n`;
          fields.forEach(f => {
            if (f.dartType.startsWith('DateTime')) {
              classCode += `      '${f.originalName}': ${f.dartName}${f.isNullable ? '?' : ''}.toIso8601String(),\n`;
            } else {
              classCode += `      '${f.originalName}': ${f.dartName},\n`;
            }
          });
          classCode += `    };\n  }\n`;

          // copyWith
          if (includeCopyWith) {
            classCode += `\n  ${className} copyWith({\n`;
            fields.forEach(f => {
              classCode += `    ${f.dartType}? ${f.dartName},\n`;
            });
            classCode += `  }) {\n`;
            classCode += `    return ${className}(\n`;
            fields.forEach(f => {
              classCode += `      ${f.dartName}: ${f.dartName} ?? this.${f.dartName},\n`;
            });
            classCode += `    );\n  }\n`;
          }

          classCode += `}`;
        }

        classOutputs.push(classCode);
      }

      if (!foundTable) {
        setError(t('error.no_create_table', 'No CREATE TABLE statements found in SQL input'));
        setOutput('');
        return;
      }

      setOutput(classOutputs.join('\n\n'));
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_sql', 'Invalid SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, constructMode, casing, includeCopyWith, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handlePresetSelect = (preset: Preset) => {
    setInput(preset.sql);
    setActivePreset(preset.id);
    toast.success(t('sqltodart.preset_applied', { name: t(preset.nameKey, preset.defaultName) }));
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('common.cleared', 'Cleared input'));
    inputRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/x-dart' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'models.dart';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded models.dart'));
  };

  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === 'c' || e.key === 'C') && !isInput && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Presets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('sqltodart.quick_presets', 'Quick Presets')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                aria-pressed={isActive}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
                }`}
              >
                {t(preset.nameKey, preset.defaultName)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options Panel */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
          {t('sqltodart.generator_options', 'Generator Options')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="dart-construct" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              {t('sqltodart.construct_style', 'Model Construct Style')}
            </label>
            <select
              id="dart-construct"
              value={constructMode}
              onChange={(e) => setConstructMode(e.target.value as any)}
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="plain">Plain Dart Class (fromJson / toJson)</option>
              <option value="json_serializable">json_serializable (@JsonSerializable)</option>
              <option value="freezed">Freezed (@freezed)</option>
            </select>
          </div>

          <div>
            <label htmlFor="dart-casing" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              {t('sqltodart.field_casing', 'Field Casing')}
            </label>
            <select
              id="dart-casing"
              value={casing}
              onChange={(e) => setCasing(e.target.value as any)}
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="camelCase">camelCase</option>
              <option value="snake_case">snake_case</option>
              <option value="PascalCase">PascalCase</option>
              <option value="original">Original SQL column name</option>
            </select>
          </div>

          {constructMode === 'plain' && (
            <div className="flex items-center gap-3 pt-6">
              <input
                id="dart-copywith"
                type="checkbox"
                checked={includeCopyWith}
                onChange={(e) => setIncludeCopyWith(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
              />
              <label htmlFor="dart-copywith" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                {t('sqltodart.include_copywith', 'Include copyWith method')}
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-dart-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('common.input')} SQL DDL
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier="none">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-dart-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder="CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL);"
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="dart-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                Dart Output
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <Kbd modifier="cmd">C</Kbd>
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
            id="dart-output"
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
          <h4 className="font-bold dark:text-white">{t('sqltodart.about_title', 'About SQL DDL to Dart Model Class Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltodart.about_text', 'Convert SQL CREATE TABLE DDL queries into strongly-typed Dart / Flutter model classes. Supports plain Dart with fromJson/toJson/copyWith, json_serializable, freezed models, field casing transforms, nullability, and keyword escaping.')}
          </p>
        </div>
      </div>
    </div>
  );
}
