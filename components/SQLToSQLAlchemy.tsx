import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Database, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function SQLToSQLAlchemy({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [syntaxVersion, setSyntaxVersion] = useState<'2.0' | '1.4'>(initialData?.syntaxVersion || '2.0');
  const [columnCasing, setColumnCasing] = useState<'snake_case' | 'camelCase' | 'PascalCase' | 'original'>(initialData?.columnCasing || 'snake_case');
  const [includeRepr, setIncludeRepr] = useState(initialData?.includeRepr ?? true);
  const [includeToDict, setIncludeToDict] = useState(initialData?.includeToDict ?? false);
  const [includeImports, setIncludeImports] = useState(initialData?.includeImports ?? true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      syntaxVersion,
      columnCasing,
      includeRepr,
      includeToDict,
      includeImports,
    });
  }, [input, output, syntaxVersion, columnCasing, includeRepr, includeToDict, includeImports, onStateChange]);

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

  const PYTHON_KEYWORDS = new Set([
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
    'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
    'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
    'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
    'while', 'with', 'yield', 'type', 'id'
  ]);

  const escapePythonString = (str: string) => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
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

  const formatColumnName = (name: string) => {
    let formatted = name;
    if (columnCasing === 'snake_case') {
      formatted = toSnakeCase(name);
    } else if (columnCasing === 'camelCase') {
      formatted = toCamelCase(name);
    } else if (columnCasing === 'PascalCase') {
      formatted = toPascalCase(name);
    }

    if (PYTHON_KEYWORDS.has(formatted) || /^[0-9]/.test(formatted)) {
      formatted = `${formatted}_`;
    }

    return formatted;
  };

  const getClassName = (tableName: string) => {
    let name = toPascalCase(tableName);
    if (name.endsWith('s') && name.length > 3) {
      name = name.slice(0, -1);
    }
    if (PYTHON_KEYWORDS.has(name)) {
      name = `${name}Model`;
    }
    return name;
  };

  const mapSqlTypeToAlchemy = (sqlType: string): { alchemyType: string; pythonHint: string; needsImport: string } => {
    if (!sqlType) return { alchemyType: 'String', pythonHint: 'str', needsImport: 'String' };
    const type = sqlType.toUpperCase();

    if (type.includes('BIGINT')) return { alchemyType: 'BigInteger', pythonHint: 'int', needsImport: 'BigInteger' };
    if (type.includes('SMALLINT')) return { alchemyType: 'SmallInteger', pythonHint: 'int', needsImport: 'SmallInteger' };
    if (type.includes('INT') || type.includes('SERIAL')) return { alchemyType: 'Integer', pythonHint: 'int', needsImport: 'Integer' };
    if (type.includes('BOOLEAN') || type.includes('BOOL') || type.includes('TINYINT(1)')) return { alchemyType: 'Boolean', pythonHint: 'bool', needsImport: 'Boolean' };
    if (type.includes('DECIMAL') || type.includes('NUMERIC') || type.includes('MONEY')) return { alchemyType: 'Numeric', pythonHint: 'Decimal', needsImport: 'Numeric' };
    if (type.includes('FLOAT') || type.includes('REAL')) return { alchemyType: 'Float', pythonHint: 'float', needsImport: 'Float' };
    if (type.includes('DOUBLE')) return { alchemyType: 'Float', pythonHint: 'float', needsImport: 'Float' };
    if (type.includes('UUID')) return { alchemyType: 'UUID', pythonHint: 'uuid.UUID', needsImport: 'UUID' };
    if (type.includes('DATETIME') || type.includes('TIMESTAMP')) return { alchemyType: 'DateTime', pythonHint: 'datetime', needsImport: 'DateTime' };
    if (type.includes('DATE')) return { alchemyType: 'Date', pythonHint: 'date', needsImport: 'Date' };
    if (type.includes('TIME')) return { alchemyType: 'Time', pythonHint: 'time', needsImport: 'Time' };
    if (type.includes('JSON')) return { alchemyType: 'JSON', pythonHint: 'dict[str, Any]', needsImport: 'JSON' };
    if (type.includes('TEXT') || type.includes('CLOB')) return { alchemyType: 'Text', pythonHint: 'str', needsImport: 'Text' };
    if (type.includes('BLOB') || type.includes('BYTEA') || type.includes('VARBINARY')) return { alchemyType: 'LargeBinary', pythonHint: 'bytes', needsImport: 'LargeBinary' };

    const strMatch = type.match(/VARCHAR\((\d+)\)/) || type.match(/CHAR\((\d+)\)/);
    if (strMatch) {
      return { alchemyType: `String(${strMatch[1]})`, pythonHint: 'str', needsImport: 'String' };
    }

    return { alchemyType: 'String', pythonHint: 'str', needsImport: 'String' };
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
      const alchemyTypes = new Set<string>();
      const pythonTypeImports = new Set<string>();

      const foreignKeyMap = Object.create(null) as Record<string, Array<{ fkCol: string; targetTable: string; targetCol: string }>>;

      while ((match = tableRegex.exec(cleanInput)) !== null) {
        const rawTableName = match[2];
        const columnsContent = match[3];
        const className = getClassName(rawTableName);

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
          fkRef?: { targetTable: string; targetCol: string };
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
          const isNullable = !upper.includes('NOT NULL') && !isPrimaryKey && !upper.includes('PRIMARY KEY');
          const isUnique = upper.includes('UNIQUE');

          let defaultValue: string | undefined = undefined;
          const defaultMatch = trimmed.match(/DEFAULT\s+('([^']*)'|"([^"]*)"|[\w_()+.-]+)/i);
          if (defaultMatch) {
            defaultValue = defaultMatch[1];
          }

          fields.push({
            rawName,
            attrName: formatColumnName(rawName),
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
        const initFields: string[] = [];

        fields.forEach(f => {
          const { alchemyType, pythonHint, needsImport } = mapSqlTypeToAlchemy(f.sqlType);
          alchemyTypes.add(needsImport.split('(')[0]);

          if (pythonHint === 'Decimal') pythonTypeImports.add('from decimal import Decimal');
          if (pythonHint === 'datetime') pythonTypeImports.add('from datetime import datetime');
          if (pythonHint === 'date') pythonTypeImports.add('from datetime import date');
          if (pythonHint === 'time') pythonTypeImports.add('from datetime import time');
          if (pythonHint === 'uuid.UUID') pythonTypeImports.add('import uuid');
          if (pythonHint.includes('Any')) pythonTypeImports.add('from typing import Any');

          const fkInfo = foreignKeyMap[rawTableName]?.find(fk => fk.fkCol.toLowerCase() === f.rawName.toLowerCase());

          const columnArgs: string[] = [];

          if (f.attrName !== f.rawName) {
            columnArgs.push(`"${escapePythonString(f.rawName)}"`);
          }

          if (fkInfo) {
            alchemyTypes.add('ForeignKey');
            columnArgs.push(`ForeignKey("${escapePythonString(fkInfo.targetTable)}.${escapePythonString(fkInfo.targetCol)}")`);
          }

          if (f.isPrimaryKey) columnArgs.push('primary_key=True');
          if (f.isNullable) columnArgs.push('nullable=True');
          else if (!f.isPrimaryKey) columnArgs.push('nullable=False');
          if (f.isUnique) columnArgs.push('unique=True');

          if (f.defaultValue) {
            if (f.defaultValue.toUpperCase() === 'TRUE') columnArgs.push('default=True');
            else if (f.defaultValue.toUpperCase() === 'FALSE') columnArgs.push('default=False');
            else if (f.defaultValue.toUpperCase() === 'CURRENT_TIMESTAMP' || f.defaultValue.toUpperCase() === 'NOW()') {
              pythonTypeImports.add('from datetime import datetime');
              columnArgs.push('default=datetime.utcnow');
            } else if (!isNaN(Number(f.defaultValue))) {
              columnArgs.push(`default=${f.defaultValue}`);
            } else {
              columnArgs.push(`default=${f.defaultValue}`);
            }
          }

          initFields.push(f.attrName);

          if (syntaxVersion === '2.0') {
            const optionalType = f.isNullable ? `Mapped[Optional[${pythonHint}]]` : `Mapped[${pythonHint}]`;
            if (f.isNullable) pythonTypeImports.add('from typing import Optional');

            const colArgsStr = columnArgs.length > 0 ? `mapped_column(${alchemyType}, ${columnArgs.join(', ')})` : `mapped_column(${alchemyType})`;
            attributesCode.push(`    ${f.attrName}: ${optionalType} = ${colArgsStr}`);
          } else {
            // 1.4 Column syntax
            const colArgsStr = [alchemyType, ...columnArgs].join(', ');
            attributesCode.push(`    ${f.attrName} = Column(${colArgsStr})`);
          }
        });

        // Generate methods
        const methodsCode: string[] = [];

        if (includeRepr) {
          const reprFields = initFields.slice(0, 3).map(attr => `${attr}={self.${attr}!r}`).join(', ');
          methodsCode.push(`    def __repr__(self) -> str:\n        return f"<${className}(${reprFields})>"`);
        }

        if (includeToDict) {
          const dictFields = initFields.map(attr => `"${attr}": self.${attr}`).join(', ');
          methodsCode.push(`    def to_dict(self) -> dict[str, Any]:\n        return {${dictFields}}`);
          pythonTypeImports.add('from typing import Any');
        }

        const classBody = [
          `    __tablename__ = "${escapePythonString(rawTableName)}"`,
          '',
          ...attributesCode,
          ...(methodsCode.length > 0 ? ['', ...methodsCode] : [])
        ].join('\n');

        modelBlocks.push(`class ${className}(Base):\n${classBody}`);
      }

      if (modelBlocks.length === 0) {
        setError(t('sqltosqlalchemy.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
        return;
      }

      const importLines: string[] = [];

      if (includeImports) {
        if (syntaxVersion === '2.0') {
          importLines.push('from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column');
        } else {
          importLines.push('from sqlalchemy.orm import declarative_base');
          importLines.push('from sqlalchemy import Column');
        }

        const alcTypesArray = Array.from(alchemyTypes).filter(Boolean).sort();
        if (alcTypesArray.length > 0) {
          importLines.push(`from sqlalchemy import ${alcTypesArray.join(', ')}`);
        }

        const pyImportsArray = Array.from(pythonTypeImports).sort();
        if (pyImportsArray.length > 0) {
          importLines.push(...pyImportsArray);
        }

        importLines.push('');
        if (syntaxVersion === '2.0') {
          importLines.push('class Base(DeclarativeBase):\n    pass\n');
        } else {
          importLines.push('Base = declarative_base()\n');
        }
      }

      const fullOutput = [
        ...(includeImports ? [importLines.join('\n')] : []),
        modelBlocks.join('\n\n')
      ].join('\n');

      setOutput(fullOutput);
      setError('');
    } catch (e: any) {
      setError(t('sqltosqlalchemy.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, syntaxVersion, columnCasing, includeRepr, includeToDict, includeImports, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
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
    toast.success(t('common.downloaded', 'Downloaded models.py!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    toast.success(t('sqltosqlalchemy.preset_loaded', 'Loaded SQL preset!'));
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
            {t('sqltosqlalchemy.presets_title', 'Quick Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltosqlalchemy.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltosqlalchemy.preset_user_auth', 'User Auth & Roles')}
          </button>
          <button
            onClick={() => loadPreset('blog')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltosqlalchemy.preset_blog', 'Blog CMS & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="alchemy-syntax-version" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltosqlalchemy.syntax_version', 'SQLAlchemy Syntax Version')}
          </label>
          <select
            id="alchemy-syntax-version"
            value={syntaxVersion}
            onChange={(e) => setSyntaxVersion(e.target.value as '2.0' | '1.4')}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="2.0">SQLAlchemy 2.0 (Mapped[T] = mapped_column)</option>
            <option value="1.4">SQLAlchemy 1.4 (Column(Integer, ...))</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="alchemy-column-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltosqlalchemy.column_casing', 'Column Attribute Casing')}
          </label>
          <select
            id="alchemy-column-casing"
            value={columnCasing}
            onChange={(e) => setColumnCasing(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (Standard Python)</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original Column Name</option>
          </select>
        </div>

        <div className="flex flex-col justify-end space-y-2 pt-2 md:pt-0">
          <div className="flex items-center gap-2">
            <input
              id="include-imports"
              type="checkbox"
              checked={includeImports}
              onChange={(e) => setIncludeImports(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="include-imports" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltosqlalchemy.include_imports', 'Include Imports & Base Class')}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="include-repr"
              type="checkbox"
              checked={includeRepr}
              onChange={(e) => setIncludeRepr(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="include-repr" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltosqlalchemy.include_repr', 'Generate __repr__ Method')}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="include-to-dict"
              type="checkbox"
              checked={includeToDict}
              onChange={(e) => setIncludeToDict(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="include-to-dict" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltosqlalchemy.include_to_dict', 'Generate to_dict() Method')}
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
              <label htmlFor="sql-sqlalchemy-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltosqlalchemy.sql_input_label', 'SQL CREATE TABLE DDL')}
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
            id="sql-sqlalchemy-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltosqlalchemy.placeholder_sql', 'Paste SQL CREATE TABLE DDL statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="sqlalchemy-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltosqlalchemy.output_label', 'Generated SQLAlchemy Models')}
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
            id="sqlalchemy-output"
            value={output}
            readOnly
            placeholder={t('sqltosqlalchemy.placeholder_output', 'Generated SQLAlchemy models will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('sqltosqlalchemy.about_title', 'About SQL to SQLAlchemy Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltosqlalchemy.about_text', 'Convert SQL CREATE TABLE DDL queries directly into Python SQLAlchemy 2.0 (Mapped[T] = mapped_column) or 1.4 ORM models. Supports primary keys, foreign key references, type inference, Python reserved keyword escaping, and helper methods.')}
          </p>
        </div>
      </div>
    </div>
  );
}
