import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Database, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield', 'type', 'id'
]);

export function SQLToDjango({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [fieldCasing, setFieldCasing] = useState<'snake_case' | 'camelCase' | 'PascalCase' | 'original'>(initialData?.fieldCasing || 'snake_case');
  const [allowNullBlank, setAllowNullBlank] = useState(initialData?.allowNullBlank ?? true);
  const [generateStrMethod, setGenerateStrMethod] = useState(initialData?.generateStrMethod ?? true);
  const [generateMetaClass, setGenerateMetaClass] = useState(initialData?.generateMetaClass ?? true);
  const [generateAdminCode, setGenerateAdminCode] = useState(initialData?.generateAdminCode ?? true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      fieldCasing,
      allowNullBlank,
      generateStrMethod,
      generateMetaClass,
      generateAdminCode,
    });
  }, [input, output, fieldCasing, allowNullBlank, generateStrMethod, generateMetaClass, generateAdminCode, onStateChange]);

  const PRESETS = {
    ecommerce: `-- E-Commerce Catalog Schema
CREATE TABLE categories (
  category_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id INT DEFAULT NULL
);

CREATE TABLE products (
  product_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  category_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  metadata JSON,
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);`,
    user_auth: `-- User Authentication & Roles Schema
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  login_count INT DEFAULT 0,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE roles (
  role_id INT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  permissions JSON
);`,
    blog: `-- Blog CMS & Comments Schema
CREATE TABLE posts (
  post_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  body TEXT NOT NULL,
  published_at DATETIME,
  view_count INT DEFAULT 0,
  is_draft BOOLEAN DEFAULT TRUE
);

CREATE TABLE comments (
  comment_id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(post_id)
);`
  };

  const escapePythonString = (str: string) => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  };

  const toPascalCase = (str: string) => {
    const pascal = str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    if (!pascal) return 'Model';
    return /^[0-9]/.test(pascal) ? `Model${pascal}` : pascal;
  };

  const toCamelCase = (str: string) => {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  };

  const toSnakeCase = (str: string) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  };

  const formatFieldName = (name: string) => {
    let formatted = name;
    if (fieldCasing === 'snake_case') {
      formatted = toSnakeCase(name);
    } else if (fieldCasing === 'camelCase') {
      formatted = toCamelCase(name);
    } else if (fieldCasing === 'PascalCase') {
      formatted = toPascalCase(name);
    }

    if (PYTHON_KEYWORDS.has(formatted) || /^[0-9]/.test(formatted)) {
      formatted = `${formatted}_field`;
    }

    return formatted;
  };

  const getClassName = (tableName: string) => {
    let name = toPascalCase(tableName);
    if (name.endsWith('ies') && name.length > 3) {
      name = name.slice(0, -3) + 'y';
    } else if (name.endsWith('s') && name.length > 3) {
      name = name.slice(0, -1);
    }
    if (PYTHON_KEYWORDS.has(name)) {
      name = `${name}Model`;
    }
    return name;
  };

  const mapSqlTypeToDjango = (sqlType: string): { djangoField: string; extraArgs: string[] } => {
    if (!sqlType) return { djangoField: 'models.CharField', extraArgs: ['max_length=255'] };
    const type = sqlType.toUpperCase();

    if (type.includes('BIGINT')) return { djangoField: 'models.BigIntegerField', extraArgs: [] };
    if (type.includes('SMALLINT')) return { djangoField: 'models.SmallIntegerField', extraArgs: [] };
    if (type.includes('INT') || type.includes('SERIAL')) return { djangoField: 'models.IntegerField', extraArgs: [] };
    if (type.includes('BOOLEAN') || type.includes('BOOL') || type.includes('TINYINT(1)')) return { djangoField: 'models.BooleanField', extraArgs: [] };
    if (type.includes('DECIMAL') || type.includes('NUMERIC') || type.includes('MONEY')) {
      const match = type.match(/\((\d+)\s*,\s*(\d+)\)/);
      const maxDigits = match ? match[1] : '10';
      const decimalPlaces = match ? match[2] : '2';
      return { djangoField: 'models.DecimalField', extraArgs: [`max_digits=${maxDigits}`, `decimal_places=${decimalPlaces}`] };
    }
    if (type.includes('FLOAT') || type.includes('REAL') || type.includes('DOUBLE')) return { djangoField: 'models.FloatField', extraArgs: [] };
    if (type.includes('UUID')) return { djangoField: 'models.UUIDField', extraArgs: [] };
    if (type.includes('DATETIME') || type.includes('TIMESTAMP')) return { djangoField: 'models.DateTimeField', extraArgs: [] };
    if (type.includes('DATE')) return { djangoField: 'models.DateField', extraArgs: [] };
    if (type.includes('TIME')) return { djangoField: 'models.TimeField', extraArgs: [] };
    if (type.includes('JSON')) return { djangoField: 'models.JSONField', extraArgs: [] };
    if (type.includes('TEXT') || type.includes('CLOB')) return { djangoField: 'models.TextField', extraArgs: [] };
    if (type.includes('BLOB') || type.includes('BYTEA') || type.includes('VARBINARY')) return { djangoField: 'models.BinaryField', extraArgs: [] };

    const strMatch = type.match(/VARCHAR\((\d+)\)/) || type.match(/CHAR\((\d+)\)/);
    if (strMatch) {
      return { djangoField: 'models.CharField', extraArgs: [`max_length=${strMatch[1]}`] };
    }

    return { djangoField: 'models.CharField', extraArgs: ['max_length=255'] };
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

      const cleanInput = input
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["`]?(\w+)["`]?\.)?["`]?(\w+)["`]?\s*\(([\s\S]*?)\);/gi;
      let match;
      const modelBlocks: string[] = [];
      const generatedModelNames: string[] = [];
      const foreignKeyMap = Object.create(null) as Record<string, Array<{ fkCol: string; targetTable: string; targetCol: string }>>;

      while ((match = tableRegex.exec(cleanInput)) !== null) {
        const rawTableName = match[2];
        const columnsContent = match[3];
        const className = getClassName(rawTableName);
        generatedModelNames.push(className);

        const columnLines: string[] = [];
        let currentLine = '';
        let inQuotes = false;
        let quoteChar = '';
        let parenDepth = 0;

        for (let i = 0; i < columnsContent.length; i++) {
          const char = columnsContent[i];
          if ((char === '"' || char === '`' || char === "'") && columnsContent[i - 1] !== '\\') {
            if (!inQuotes) {
              inQuotes = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              inQuotes = false;
            }
          }

          if (!inQuotes) {
            if (char === '(') parenDepth++;
            if (char === ')') parenDepth--;
          }

          if (char === ',' && !inQuotes && parenDepth === 0) {
            columnLines.push(currentLine.trim());
            currentLine = '';
          } else {
            currentLine += char;
          }
        }
        if (currentLine.trim()) columnLines.push(currentLine.trim());

        const fields: Array<{
          rawName: string;
          attrName: string;
          sqlType: string;
          isPrimaryKey: boolean;
          isNullable: boolean;
          isUnique: boolean;
          defaultValue?: string;
        }> = [];

        foreignKeyMap[rawTableName] = [];

        columnLines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) return;
          const upper = trimmed.toUpperCase();

          if (upper.startsWith('CONSTRAINT') || upper.startsWith('FOREIGN KEY')) {
            const fkMatch = trimmed.match(/FOREIGN\s+KEY\s*\((?:["`]?(\w+)["`]?)\)\s*REFERENCES\s*(?:["`]?(\w+)["`]?)\s*\((?:["`]?(\w+)["`]?)\)/i);
            if (fkMatch) {
              foreignKeyMap[rawTableName].push({
                fkCol: fkMatch[1],
                targetTable: fkMatch[2],
                targetCol: fkMatch[3],
              });
            }
            return;
          }

          if (upper.startsWith('PRIMARY KEY') || upper.startsWith('UNIQUE') || upper.startsWith('INDEX') || upper.startsWith('KEY')) {
            return;
          }

          let rawName = '';
          let sqlType = '';

          if (trimmed.startsWith('"') || trimmed.startsWith('`') || trimmed.startsWith("'")) {
            const quote = trimmed[0];
            let i = 1;
            while (i < trimmed.length && (trimmed[i] !== quote || trimmed[i - 1] === '\\')) {
              rawName += trimmed[i];
              i++;
            }
            const remaining = trimmed.substring(i + 1).trim();
            sqlType = remaining.split(/\s+/)[0];
          } else {
            const parts = trimmed.split(/\s+/);
            rawName = parts[0];
            sqlType = parts[1];
          }

          if (!rawName) return;

          const isPrimaryKey = upper.includes('PRIMARY KEY');
          const isNullable = !upper.includes('NOT NULL') && !isPrimaryKey;
          const isUnique = upper.includes('UNIQUE');

          let defaultValue: string | undefined = undefined;
          const defaultMatch = trimmed.match(/DEFAULT\s+('([^']*)'|"([^"]*)"|[\w_()+.-]+)/i);
          if (defaultMatch) {
            defaultValue = defaultMatch[1];
          }

          fields.push({
            rawName,
            attrName: formatFieldName(rawName),
            sqlType,
            isPrimaryKey,
            isNullable,
            isUnique,
            defaultValue,
          });
        });

        // Check for inline REFERENCES
        columnLines.forEach(line => {
          const inlineFkMatch = line.match(/(?:["`]?(\w+)["`]?)\s+[\w()]+\s+.*REFERENCES\s+(?:["`]?(\w+)["`]?)\s*\((?:["`]?(\w+)["`]?)\)/i);
          if (inlineFkMatch) {
            foreignKeyMap[rawTableName].push({
              fkCol: inlineFkMatch[1],
              targetTable: inlineFkMatch[2],
              targetCol: inlineFkMatch[3],
            });
          }
        });

        const attributesCode: string[] = [];
        const fieldNamesList: string[] = [];

        fields.forEach(f => {
          const fkInfo = foreignKeyMap[rawTableName]?.find(fk => fk.fkCol.toLowerCase() === f.rawName.toLowerCase());

          if (fkInfo) {
            const targetModel = getClassName(fkInfo.targetTable);
            const fkArgs: string[] = [`'${targetModel}'`, 'on_delete=models.CASCADE'];
            if (f.isNullable && allowNullBlank) {
              fkArgs.push('null=True', 'blank=True');
            }
            if (f.attrName !== f.rawName) {
              fkArgs.push(`db_column='${escapePythonString(f.rawName)}'`);
            }

            let fkAttrName = f.attrName;
            if (fkAttrName.endsWith('_id')) {
              fkAttrName = fkAttrName.slice(0, -3);
            }
            attributesCode.push(`    ${fkAttrName} = models.ForeignKey(${fkArgs.join(', ')})`);
            fieldNamesList.push(fkAttrName);
            return;
          }

          const { djangoField, extraArgs } = mapSqlTypeToDjango(f.sqlType);
          const args = [...extraArgs];

          if (f.isPrimaryKey) {
            args.push('primary_key=True');
          }

          if (f.isNullable && allowNullBlank) {
            args.push('null=True', 'blank=True');
          }

          if (f.isUnique) {
            args.push('unique=True');
          }

          if (f.defaultValue) {
            if (f.defaultValue.toUpperCase() === 'TRUE') args.push('default=True');
            else if (f.defaultValue.toUpperCase() === 'FALSE') args.push('default=False');
            else if (!isNaN(Number(f.defaultValue))) args.push(`default=${f.defaultValue}`);
            else if (f.defaultValue.startsWith("'") || f.defaultValue.startsWith('"')) {
              args.push(`default=${f.defaultValue}`);
            }
          }

          if (f.attrName !== f.rawName) {
            args.push(`db_column='${escapePythonString(f.rawName)}'`);
          }

          attributesCode.push(`    ${f.attrName} = ${djangoField}(${args.join(', ')})`);
          fieldNamesList.push(f.attrName);
        });

        const bodyLines = [...attributesCode];

        if (generateMetaClass) {
          bodyLines.push('');
          bodyLines.push('    class Meta:');
          bodyLines.push(`        db_table = '${escapePythonString(rawTableName)}'`);
        }

        if (generateStrMethod && fieldNamesList.length > 0) {
          const strField = fieldNamesList.find(fn => fn.includes('name') || fn.includes('title') || fn.includes('slug')) || fieldNamesList[0];
          bodyLines.push('');
          bodyLines.push('    def __str__(self):');
          bodyLines.push(`        return str(self.${strField})`);
        }

        if (bodyLines.length === 0) {
          bodyLines.push('    pass');
        }

        modelBlocks.push(`class ${className}(models.Model):\n${bodyLines.join('\n')}`);
      }

      if (modelBlocks.length === 0) {
        setError(t('sqltodjango.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
        return;
      }

      let finalOutput = `from django.db import models\n\n`;
      finalOutput += modelBlocks.join('\n\n');

      if (generateAdminCode && generatedModelNames.length > 0) {
        finalOutput += `\n\n# admin.py\nfrom django.contrib import admin\n`;
        finalOutput += `from .models import ${generatedModelNames.join(', ')}\n\n`;
        generatedModelNames.forEach(cls => {
          finalOutput += `@admin.register(${cls})\nclass ${cls}Admin(admin.ModelAdmin):\n    pass\n\n`;
        });
      }

      setOutput(finalOutput.trim());
      setError('');
    } catch (e: any) {
      setError(t('sqltodjango.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, fieldCasing, allowNullBlank, generateStrMethod, generateMetaClass, generateAdminCode, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltodjango.toast_copied', 'Django models copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    toast.success(t('common.cleared', 'Cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'models.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sqltodjango.toast_downloaded', 'Downloaded models.py!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    toast.success(t('sqltodjango.preset_loaded', 'Loaded SQL preset!'));
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
            {t('sqltodjango.presets_title', 'Quick Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltodjango.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltodjango.preset_user_auth', 'User Auth & Roles')}
          </button>
          <button
            onClick={() => loadPreset('blog')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltodjango.preset_blog', 'Blog CMS & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="django-field-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltodjango.field_casing', 'Field Casing')}
          </label>
          <select
            id="django-field-casing"
            value={fieldCasing}
            onChange={(e) => setFieldCasing(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (Standard Django)</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original Column Name</option>
          </select>
        </div>

        <div className="flex flex-col justify-end space-y-2 pt-2 md:pt-0">
          <div className="flex items-center gap-2">
            <input
              id="allow-null-blank"
              type="checkbox"
              checked={allowNullBlank}
              onChange={(e) => setAllowNullBlank(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="allow-null-blank" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltodjango.allow_null_blank', 'Allow null=True, blank=True')}
            </label>
          </div>
        </div>

        <div className="flex flex-col justify-end space-y-2 pt-2 md:pt-0">
          <div className="flex items-center gap-2">
            <input
              id="generate-str"
              type="checkbox"
              checked={generateStrMethod}
              onChange={(e) => setGenerateStrMethod(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="generate-str" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltodjango.generate_str', 'Generate __str__ method')}
            </label>
          </div>
        </div>

        <div className="flex flex-col justify-end space-y-2 pt-2 md:pt-0">
          <div className="flex items-center gap-2">
            <input
              id="generate-meta"
              type="checkbox"
              checked={generateMetaClass}
              onChange={(e) => setGenerateMetaClass(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="generate-meta" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltodjango.generate_meta', 'Generate Meta class (db_table)')}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="generate-admin"
              type="checkbox"
              checked={generateAdminCode}
              onChange={(e) => setGenerateAdminCode(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="generate-admin" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltodjango.generate_admin', 'Generate admin.py registration')}
            </label>
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-django-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltodjango.sql_input_label', 'SQL CREATE TABLE DDL')}
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
            id="sql-django-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltodjango.placeholder_sql', 'Paste SQL CREATE TABLE DDL statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="django-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltodjango.output_label', 'Generated Django Models')}
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
            id="django-output"
            value={output}
            readOnly
            placeholder={t('sqltodjango.placeholder_output', 'Generated Django models will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('sqltodjango.about_title', 'About SQL to Django Models Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltodjango.about_text', 'Convert SQL CREATE TABLE DDL queries directly into Python Django ORM models. Supports primary keys, foreign key relationships, database field types, Meta class configurations, __str__ methods, and admin.py registrations.')}
          </p>
        </div>
      </div>
    </div>
  );
}
