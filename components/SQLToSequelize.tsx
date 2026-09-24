import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Database, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const JS_RESERVED_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
  'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
  'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
  'let', 'static', 'enum', 'await', 'implements', 'package', 'protected',
  'interface', 'private', 'public', 'null', 'true', 'false', 'undefined'
]);

type ModelStyle = 'define' | 'class';
type Language = 'js' | 'ts';
type FieldCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';

export function SQLToSequelize({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [modelStyle, setModelStyle] = useState<ModelStyle>(initialData?.modelStyle || 'define');
  const [language, setLanguage] = useState<Language>(initialData?.language || 'ts');
  const [fieldCasing, setFieldCasing] = useState<FieldCasing>(initialData?.fieldCasing || 'camelCase');
  const [timestamps, setTimestamps] = useState(initialData?.timestamps ?? true);
  const [underscored, setUnderscored] = useState(initialData?.underscored ?? true);
  const [freezeTableName, setFreezeTableName] = useState(initialData?.freezeTableName ?? true);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      modelStyle,
      language,
      fieldCasing,
      timestamps,
      underscored,
      freezeTableName,
    });
  }, [input, output, modelStyle, language, fieldCasing, timestamps, underscored, freezeTableName, onStateChange]);

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
  sku VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  category_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  metadata JSON
);`,
    user_auth: `-- User Auth & Roles Schema
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
    blog: `-- Blog CMS Schema
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
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL
);`
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
    if (fieldCasing === 'camelCase') {
      formatted = toCamelCase(name);
    } else if (fieldCasing === 'snake_case') {
      formatted = toSnakeCase(name);
    } else if (fieldCasing === 'PascalCase') {
      formatted = toPascalCase(name);
    }

    if (JS_RESERVED_KEYWORDS.has(formatted) || /^[0-9]/.test(formatted)) {
      formatted = `${formatted}Field`;
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
    if (JS_RESERVED_KEYWORDS.has(name)) {
      name = `${name}Model`;
    }
    return name;
  };

  const mapSqlTypeToSequelize = (sqlType: string): string => {
    if (!sqlType) return 'DataTypes.STRING';
    const type = sqlType.toUpperCase();

    if (type.includes('BIGINT')) return 'DataTypes.BIGINT';
    if (type.includes('SMALLINT')) return 'DataTypes.SMALLINT';
    if (type.includes('TINYINT(1)') || type.includes('BOOLEAN') || type.includes('BOOL')) return 'DataTypes.BOOLEAN';
    if (type.includes('TINYINT')) return 'DataTypes.TINYINT';
    if (type.includes('INT') || type.includes('SERIAL')) return 'DataTypes.INTEGER';
    if (type.includes('DECIMAL') || type.includes('NUMERIC')) {
      const match = type.match(/\((\d+)\s*,\s*(\d+)\)/);
      if (match) return `DataTypes.DECIMAL(${match[1]}, ${match[2]})`;
      return 'DataTypes.DECIMAL';
    }
    if (type.includes('FLOAT') || type.includes('REAL')) return 'DataTypes.FLOAT';
    if (type.includes('DOUBLE')) return 'DataTypes.DOUBLE';
    if (type.includes('UUID')) return 'DataTypes.UUID';
    if (type.includes('DATETIME') || type.includes('TIMESTAMP')) return 'DataTypes.DATE';
    if (type.includes('DATE')) return 'DataTypes.DATEONLY';
    if (type.includes('TIME')) return 'DataTypes.TIME';
    if (type.includes('JSON')) return 'DataTypes.JSON';
    if (type.includes('TEXT') || type.includes('CLOB')) return 'DataTypes.TEXT';
    if (type.includes('BLOB') || type.includes('BYTEA')) return 'DataTypes.BLOB';

    const strMatch = type.match(/VARCHAR\((\d+)\)/) || type.match(/CHAR\((\d+)\)/);
    if (strMatch) {
      return `DataTypes.STRING(${strMatch[1]})`;
    }

    return 'DataTypes.STRING';
  };

  const mapSqlTypeToTs = (sqlType: string): string => {
    if (!sqlType) return 'string';
    const type = sqlType.toUpperCase();
    if (type.includes('INT') || type.includes('SERIAL') || type.includes('DECIMAL') || type.includes('FLOAT') || type.includes('DOUBLE') || type.includes('NUMERIC')) return 'number';
    if (type.includes('BOOLEAN') || type.includes('BOOL') || type.includes('TINYINT(1)')) return 'boolean';
    if (type.includes('JSON')) return 'object | any';
    if (type.includes('DATETIME') || type.includes('TIMESTAMP') || type.includes('DATE') || type.includes('TIME')) return 'Date';
    return 'string';
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
          isAutoIncrement: boolean;
          isNullable: boolean;
          isUnique: boolean;
          defaultValue?: string;
        }> = [];

        columnLines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) return;
          const upper = trimmed.toUpperCase();

          if (
            upper.startsWith('CONSTRAINT') ||
            upper.startsWith('PRIMARY KEY') ||
            upper.startsWith('FOREIGN KEY') ||
            upper.startsWith('UNIQUE') ||
            upper.startsWith('INDEX') ||
            upper.startsWith('KEY')
          ) {
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
          const isAutoIncrement = upper.includes('AUTO_INCREMENT') || upper.includes('SERIAL');
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
            isAutoIncrement,
            isNullable,
            isUnique,
            defaultValue,
          });
        });

        if (modelStyle === 'define') {
          const fieldDefs = fields.map(f => {
            const props: string[] = [];
            props.push(`    type: ${mapSqlTypeToSequelize(f.sqlType)}`);

            if (f.isPrimaryKey) props.push('    primaryKey: true');
            if (f.isAutoIncrement) props.push('    autoIncrement: true');
            if (f.isNullable === false) props.push('    allowNull: false');
            else if (f.isNullable === true) props.push('    allowNull: true');
            if (f.isUnique) props.push('    unique: true');

            if (f.defaultValue) {
              if (f.defaultValue.toUpperCase() === 'TRUE') props.push('    defaultValue: true');
              else if (f.defaultValue.toUpperCase() === 'FALSE') props.push('    defaultValue: false');
              else if (!isNaN(Number(f.defaultValue))) props.push(`    defaultValue: ${f.defaultValue}`);
              else props.push(`    defaultValue: ${f.defaultValue}`);
            }

            if (f.attrName !== f.rawName) {
              props.push(`    field: '${f.rawName}'`);
            }

            return `  ${f.attrName}: {\n${props.join(',\n')}\n  }`;
          });

          const modelDef = language === 'ts'
            ? `export const init${className}Model = (sequelize: Sequelize) => {\n  return sequelize.define('${className}', {\n${fieldDefs.join(',\n')}\n  }, {\n    tableName: '${rawTableName}',\n    timestamps: ${timestamps},\n    underscored: ${underscored},\n    freezeTableName: ${freezeTableName},\n  });\n};`
            : `const ${className} = sequelize.define('${className}', {\n${fieldDefs.join(',\n')}\n}, {\n  tableName: '${rawTableName}',\n  timestamps: ${timestamps},\n  underscored: ${underscored},\n  freezeTableName: ${freezeTableName},\n});\n\nmodule.exports = ${className};`;

          modelBlocks.push(modelDef);
        } else {
          // Class Model Style
          if (language === 'ts') {
            const interfacesCode = `export interface ${className}Attributes {\n` +
              fields.map(f => `  ${f.attrName}${f.isNullable ? '?' : ''}: ${mapSqlTypeToTs(f.sqlType)};`).join('\n') +
              `\n}\n\nexport interface ${className}CreationAttributes extends Optional<${className}Attributes, '${fields.filter(f => f.isPrimaryKey || f.isNullable || f.isAutoIncrement).map(f => f.attrName).join("' | '")}'> {}`;

            const classProps = fields.map(f => `  public ${f.attrName}!: ${mapSqlTypeToTs(f.sqlType)};`).join('\n');

            const initFields = fields.map(f => {
              const props: string[] = [`    type: ${mapSqlTypeToSequelize(f.sqlType)}`];
              if (f.isPrimaryKey) props.push('    primaryKey: true');
              if (f.isAutoIncrement) props.push('    autoIncrement: true');
              if (f.isNullable === false) props.push('    allowNull: false');
              if (f.isUnique) props.push('    unique: true');
              if (f.attrName !== f.rawName) props.push(`    field: '${f.rawName}'`);
              return `    ${f.attrName}: {\n${props.join(',\n')}\n    }`;
            });

            const classDef = `${interfacesCode}\n\nexport class ${className} extends Model<${className}Attributes, ${className}CreationAttributes> implements ${className}Attributes {\n${classProps}\n\n  public static initModel(sequelize: Sequelize): typeof ${className} {\n    return ${className}.init({\n${initFields.join(',\n')}\n    }, {\n      sequelize,\n      tableName: '${rawTableName}',\n      timestamps: ${timestamps},\n      underscored: ${underscored},\n      freezeTableName: ${freezeTableName},\n    });\n  }\n}`;
            modelBlocks.push(classDef);
          } else {
            // JS Class Style
            const initFields = fields.map(f => {
              const props: string[] = [`    type: ${mapSqlTypeToSequelize(f.sqlType)}`];
              if (f.isPrimaryKey) props.push('    primaryKey: true');
              if (f.isAutoIncrement) props.push('    autoIncrement: true');
              if (f.isNullable === false) props.push('    allowNull: false');
              if (f.isUnique) props.push('    unique: true');
              if (f.attrName !== f.rawName) props.push(`    field: '${f.rawName}'`);
              return `    ${f.attrName}: {\n${props.join(',\n')}\n    }`;
            });

            const classDef = `class ${className} extends Model {\n  static initModel(sequelize) {\n    return super.init({\n${initFields.join(',\n')}\n    }, {\n      sequelize,\n      tableName: '${rawTableName}',\n      timestamps: ${timestamps},\n      underscored: ${underscored},\n      freezeTableName: ${freezeTableName},\n    });\n  }\n}\n\nmodule.exports = ${className};`;
            modelBlocks.push(classDef);
          }
        }
      }

      if (modelBlocks.length === 0) {
        setError(t('sqltosequelize.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
        return;
      }

      let header = '';
      if (modelStyle === 'define') {
        if (language === 'ts') {
          header = `import { Sequelize, DataTypes } from 'sequelize';\n\n`;
        } else {
          header = `const { DataTypes } = require('sequelize');\n\n`;
        }
      } else {
        if (language === 'ts') {
          header = `import { Model, Sequelize, DataTypes, Optional } from 'sequelize';\n\n`;
        } else {
          header = `const { Model, DataTypes } = require('sequelize');\n\n`;
        }
      }

      setOutput((header + modelBlocks.join('\n\n')).trim());
      setError('');
    } catch (e: any) {
      setError(t('sqltosequelize.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, modelStyle, language, fieldCasing, timestamps, underscored, freezeTableName, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltosequelize.toast_copied', 'Sequelize models copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('common.cleared', 'Cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const ext = language === 'ts' ? 'ts' : 'js';
    const blob = new Blob([output], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `models.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sqltosequelize.toast_downloaded', `Downloaded models.${ext}!`));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePreset(presetKey);
    toast.success(t('sqltosequelize.preset_loaded', 'Loaded SQL preset!'));
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

      const isBodyOrContainer =
        !activeElement ||
        activeElement === document.body ||
        containerRef.current?.contains(activeElement as Node);

      if (e.key === 'Escape' && isBodyOrContainer) {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!isEditable && isBodyOrContainer && handlersRef.current.output) {
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
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltosequelize.presets_title', 'Quick Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['ecommerce', 'user_auth', 'blog'] as const).map((pKey) => {
            const isActive = activePreset === pKey;
            return (
              <button
                key={pKey}
                type="button"
                onClick={() => loadPreset(pKey)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                }`}
              >
                {t(`sqltosequelize.preset_${pKey}`, pKey === 'ecommerce' ? 'E-Commerce Catalog' : pKey === 'user_auth' ? 'User Auth & Roles' : 'Blog CMS')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="sequelize-model-style" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltosequelize.model_style', 'Model Style')}
          </label>
          <select
            id="sequelize-model-style"
            value={modelStyle}
            onChange={(e) => setModelStyle(e.target.value as ModelStyle)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="define">sequelize.define()</option>
            <option value="class">Class extends Model</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sequelize-language" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltosequelize.language', 'Language')}
          </label>
          <select
            id="sequelize-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ts">TypeScript (.ts)</option>
            <option value="js">JavaScript (.js)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sequelize-field-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltosequelize.field_casing', 'Field Casing')}
          </label>
          <select
            id="sequelize-field-casing"
            value={fieldCasing}
            onChange={(e) => setFieldCasing(e.target.value as FieldCasing)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="camelCase">camelCase (Sequelize Default)</option>
            <option value="snake_case">snake_case</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original Column Name</option>
          </select>
        </div>

        <div className="flex flex-col justify-end space-y-2 pt-2 md:pt-0">
          <div className="flex items-center gap-2">
            <input
              id="seq-timestamps"
              type="checkbox"
              checked={timestamps}
              onChange={(e) => setTimestamps(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="seq-timestamps" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltosequelize.timestamps', 'timestamps: true')}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="seq-underscored"
              type="checkbox"
              checked={underscored}
              onChange={(e) => setUnderscored(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="seq-underscored" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltosequelize.underscored', 'underscored: true')}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="seq-freezetable"
              type="checkbox"
              checked={freezeTableName}
              onChange={(e) => setFreezeTableName(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="seq-freezetable" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltosequelize.freeze_table_name', 'freezeTableName: true')}
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
              <label htmlFor="sql-sequelize-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltosequelize.sql_input_label', 'SQL CREATE TABLE DDL')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                type="button"
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-sequelize-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (activePreset) setActivePreset(null);
            }}
            placeholder={t('sqltosequelize.placeholder_sql', 'Paste SQL CREATE TABLE DDL statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="sequelize-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltosequelize.output_label', 'Generated Sequelize Models')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" aria-hidden="true" /> {t('common.download')}
              </button>
              <button
                type="button"
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
            id="sequelize-output"
            value={output}
            readOnly
            placeholder={t('sqltosequelize.placeholder_output', 'Generated Sequelize models will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('sqltosequelize.about_title', 'About SQL to Sequelize Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltosequelize.about_text', 'Convert SQL CREATE TABLE DDL statements directly into Sequelize v6/v7 ORM model definitions. Supports TypeScript & JavaScript, sequelize.define() vs ES6 class models, data types, primary keys, auto increments, field name mappings, and table configuration options.')}
          </p>
        </div>
      </div>
    </div>
  );
}
