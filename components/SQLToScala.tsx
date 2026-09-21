import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
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
    nameKey: 'sqltoscala.preset_catalog',
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
    nameKey: 'sqltoscala.preset_auth',
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
    nameKey: 'sqltoscala.preset_blog',
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

const SCALA_RESERVED_KEYWORDS = new Set([
  'abstract', 'case', 'catch', 'class', 'def', 'do', 'else', 'extends', 'false', 'final',
  'finally', 'for', 'forSome', 'if', 'implicit', 'import', 'lazy', 'match', 'new', 'null',
  'object', 'override', 'package', 'private', 'protected', 'return', 'sealed', 'super',
  'this', 'throw', 'trait', 'try', 'true', 'type', 'val', 'var', 'while', 'with', 'yield',
  'given', 'using', 'opaque', 'inline', 'open', 'transparent', 'enum'
]);

export function SQLToScala({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || PRESETS[0].sql);
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('catalog');

  // Options
  const [scalaVersion, setScalaVersion] = useState<'scala3' | 'scala2'>(initialData?.scalaVersion || 'scala3');
  const [casing, setCasing] = useState<'camelCase' | 'snake_case' | 'PascalCase' | 'original'>(
    initialData?.casing || 'camelCase'
  );
  const [framework, setFramework] = useState<'circe' | 'play' | 'jackson' | 'slick' | 'plain'>(
    initialData?.framework || 'circe'
  );
  const [packageName, setPackageName] = useState(initialData?.packageName || 'com.example.models');
  const [wrapObject, setWrapObject] = useState<boolean>(initialData?.wrapObject ?? true);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ input, output, scalaVersion, casing, framework, packageName, wrapObject });
  }, [input, output, scalaVersion, casing, framework, packageName, wrapObject, onStateChange]);

  const sanitizeIdentifier = (name: string): string => {
    let clean = name.replace(/[`"']/g, '').trim();
    clean = clean.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(clean)) {
      clean = 'field_' + clean;
    }
    if (SCALA_RESERVED_KEYWORDS.has(clean)) {
      return `\`${clean}\``;
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

  const mapSqlTypeToScala = (sqlType: string): string => {
    const typeUpper = sqlType.toUpperCase().trim();

    if (typeUpper.includes('INT') || typeUpper.includes('SERIAL')) {
      if (typeUpper.includes('BIGINT') || typeUpper.includes('BIGSERIAL')) return 'Long';
      if (typeUpper.includes('SMALLINT') || typeUpper.includes('TINYINT')) return 'Short';
      return 'Int';
    }
    if (typeUpper.includes('DECIMAL') || typeUpper.includes('NUMERIC')) return 'BigDecimal';
    if (typeUpper.includes('FLOAT') || typeUpper.includes('REAL')) return 'Float';
    if (typeUpper.includes('DOUBLE')) return 'Double';
    if (typeUpper.includes('BOOL')) return 'Boolean';
    if (typeUpper.includes('DATE')) return 'java.time.LocalDate';
    if (typeUpper.includes('TIMESTAMP') || typeUpper.includes('DATETIME')) return 'java.time.Instant';
    if (typeUpper.includes('UUID')) return 'java.util.UUID';
    if (typeUpper.includes('JSON') || typeUpper.includes('JSONB')) return 'String';
    if (typeUpper.includes('BYTEA') || typeUpper.includes('BLOB') || typeUpper.includes('BINARY')) return 'Array[Byte]';

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
      const playCodecs: string[] = [];

      let foundTable = false;

      while ((match = tableRegex.exec(input)) !== null) {
        foundTable = true;
        const rawTableName = match[1].split('.').pop() || match[1];
        const className = toPascalCase(rawTableName);
        const body = match[2];

        const lines = body.split('\n');
        const fields: Array<{
          originalName: string;
          scalaName: string;
          scalaType: string;
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
            const scalaName = transformCasing(originalName, casing);
            let baseType = mapSqlTypeToScala(rawType);

            fields.push({
              originalName: originalName.replace(/[`"']/g, ''),
              scalaName,
              scalaType: isNullable ? `Option[${baseType}]` : baseType,
              isNullable,
            });
          }
        }

        let classCode = '';

        if (framework === 'circe') {
          if (scalaVersion === 'scala3') {
            classCode += `@derives(io.circe.Codec.AsObject)\n`;
          } else {
            classCode += `@io.circe.generic.JsonCodec\n`;
          }
        }

        classCode += `final case class ${className}(\n`;
        const fieldDeclarations = fields.map(f => {
          let annotation = '';
          if (framework === 'jackson' && f.originalName !== f.scalaName) {
            annotation = `@com.fasterxml.jackson.annotation.JsonProperty("${f.originalName}") `;
          }
          return `  ${annotation}${f.scalaName}: ${f.scalaType}`;
        });
        classCode += fieldDeclarations.join(',\n');
        classCode += `\n)`;

        classOutputs.push(classCode);

        if (framework === 'play') {
          playCodecs.push(`  implicit val ${className.toLowerCase()}Format: play.api.libs.json.OFormat[${className}] = play.api.libs.json.Json.format[${className}]`);
        }
      }

      if (!foundTable) {
        setError(t('error.no_create_table', 'No CREATE TABLE statements found in SQL input'));
        setOutput('');
        return;
      }

      let finalOutput = '';
      if (packageName.trim()) {
        finalOutput += `package ${packageName.trim()}\n\n`;
      }

      // Imports
      if (framework === 'circe' && scalaVersion === 'scala2') {
        finalOutput += `import io.circe.generic.JsonCodec\n\n`;
      } else if (framework === 'play') {
        finalOutput += `import play.api.libs.json._\n\n`;
      }

      if (wrapObject) {
        finalOutput += `object ${toPascalCase(packageName.split('.').pop() || 'Models')} {\n\n`;
        finalOutput += classOutputs.map(c => c.split('\n').map(l => `  ${l}`).join('\n')).join('\n\n');
        if (playCodecs.length > 0) {
          finalOutput += '\n\n' + playCodecs.join('\n');
        }
        finalOutput += `\n}\n`;
      } else {
        finalOutput += classOutputs.join('\n\n');
        if (playCodecs.length > 0) {
          finalOutput += '\n\n' + playCodecs.join('\n');
        }
      }

      setOutput(finalOutput.trim());
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_sql', 'Invalid SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, scalaVersion, casing, framework, packageName, wrapObject, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handlePresetSelect = (preset: Preset) => {
    setInput(preset.sql);
    setActivePreset(preset.id);
    toast.success(t('sqltoscala.preset_applied', { name: t(preset.nameKey, preset.defaultName) }));
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
    const blob = new Blob([output], { type: 'text/x-scala' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Models.scala';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded Models.scala'));
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
            {t('sqltoscala.quick_presets', 'Quick Presets')}
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
          {t('sqltoscala.generator_options', 'Generator Options')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="scala-version" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              {t('sqltoscala.scala_version', 'Scala Target Version')}
            </label>
            <select
              id="scala-version"
              value={scalaVersion}
              onChange={(e) => setScalaVersion(e.target.value as any)}
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="scala3">Scala 3 (derives Codec)</option>
              <option value="scala2">Scala 2.13 (@JsonCodec)</option>
            </select>
          </div>

          <div>
            <label htmlFor="scala-framework" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              {t('sqltoscala.framework', 'JSON / ORM Framework')}
            </label>
            <select
              id="scala-framework"
              value={framework}
              onChange={(e) => setFramework(e.target.value as any)}
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="circe">Circe Codecs</option>
              <option value="play">Play JSON (OFormat)</option>
              <option value="jackson">Jackson Annotations</option>
              <option value="plain">Plain Case Class</option>
            </select>
          </div>

          <div>
            <label htmlFor="scala-casing" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              {t('sqltoscala.field_casing', 'Field Casing')}
            </label>
            <select
              id="scala-casing"
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

          <div>
            <label htmlFor="scala-package" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              {t('sqltoscala.package_name', 'Package Name')}
            </label>
            <input
              id="scala-package"
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="com.example.models"
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            id="scala-wrap"
            type="checkbox"
            checked={wrapObject}
            onChange={(e) => setWrapObject(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
          />
          <label htmlFor="scala-wrap" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
            {t('sqltoscala.wrap_object', 'Wrap classes inside an enclosing object module')}
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-scala-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
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
            id="sql-scala-input"
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
              <Database className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="scala-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                Scala Output
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
            id="scala-output"
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
          <h4 className="font-bold dark:text-white">{t('sqltoscala.about_title', 'About SQL DDL to Scala Case Class Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltoscala.about_text', 'Convert SQL CREATE TABLE DDL queries into strongly-typed Scala case classes. Supports Scala 3 and Scala 2, Circe Codecs, Play JSON formats, Jackson annotations, property casing transforms, Option[T] nullability, and keyword escaping.')}
          </p>
        </div>
      </div>
    </div>
  );
}
