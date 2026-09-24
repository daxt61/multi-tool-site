import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Database, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const TS_RESERVED_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for',
  'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
  'while', 'with', 'yield', 'let', 'static', 'await', 'implements',
  'interface', 'package', 'private', 'protected', 'public', 'readonly'
]);

type FieldCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';

export function SQLToTypeORM({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [fieldCasing, setFieldCasing] = useState<FieldCasing>(initialData?.fieldCasing || 'camelCase');
  const [useClassValidator, setUseClassValidator] = useState(initialData?.useClassValidator ?? false);
  const [useConstructor, setUseConstructor] = useState(initialData?.useConstructor ?? true);
  const [useCreateUpdateDateColumns, setUseCreateUpdateDateColumns] = useState(initialData?.useCreateUpdateDateColumns ?? true);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      fieldCasing,
      useClassValidator,
      useConstructor,
      useCreateUpdateDateColumns,
    });
  }, [input, output, fieldCasing, useClassValidator, useConstructor, useCreateUpdateDateColumns, onStateChange]);

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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  role_id INT PRIMARY KEY AUTO_INCREMENT,
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
  is_draft BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  comment_id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);`
  };

  const toPascalCase = (str: string) => {
    const pascal = str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    if (!pascal) return 'Entity';
    return /^[0-9]/.test(pascal) ? `Entity${pascal}` : pascal;
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

    if (TS_RESERVED_KEYWORDS.has(formatted) || /^[0-9]/.test(formatted)) {
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
    if (TS_RESERVED_KEYWORDS.has(name)) {
      name = `${name}Entity`;
    }
    return name;
  };

  const mapSqlTypeToTypeORM = (sqlType: string): { columnType: string; tsType: string; extraOpts?: Record<string, any> } => {
    if (!sqlType) return { columnType: 'varchar', tsType: 'string' };
    const type = sqlType.toUpperCase();

    if (type.includes('BIGINT')) return { columnType: 'bigint', tsType: 'string' };
    if (type.includes('SMALLINT')) return { columnType: 'smallint', tsType: 'number' };
    if (type.includes('TINYINT(1)') || type.includes('BOOLEAN') || type.includes('BOOL')) return { columnType: 'boolean', tsType: 'boolean' };
    if (type.includes('TINYINT')) return { columnType: 'tinyint', tsType: 'number' };
    if (type.includes('INT') || type.includes('SERIAL')) return { columnType: 'int', tsType: 'number' };
    if (type.includes('DECIMAL') || type.includes('NUMERIC')) {
      const match = type.match(/\((\d+)\s*,\s*(\d+)\)/);
      if (match) {
        return {
          columnType: 'decimal',
          tsType: 'number',
          extraOpts: { precision: Number(match[1]), scale: Number(match[2]) }
        };
      }
      return { columnType: 'decimal', tsType: 'number' };
    }
    if (type.includes('FLOAT') || type.includes('REAL')) return { columnType: 'float', tsType: 'number' };
    if (type.includes('DOUBLE')) return { columnType: 'double', tsType: 'number' };
    if (type.includes('UUID')) return { columnType: 'uuid', tsType: 'string' };
    if (type.includes('DATETIME') || type.includes('TIMESTAMP')) return { columnType: 'timestamp', tsType: 'Date' };
    if (type.includes('DATE')) return { columnType: 'date', tsType: 'Date' };
    if (type.includes('TIME')) return { columnType: 'time', tsType: 'string' };
    if (type.includes('JSONB')) return { columnType: 'jsonb', tsType: 'any' };
    if (type.includes('JSON')) return { columnType: 'json', tsType: 'any' };
    if (type.includes('TEXT') || type.includes('CLOB')) return { columnType: 'text', tsType: 'string' };
    if (type.includes('BLOB') || type.includes('BYTEA')) return { columnType: 'bytea', tsType: 'Buffer' };

    const strMatch = type.match(/VARCHAR\((\d+)\)/) || type.match(/CHAR\((\d+)\)/);
    if (strMatch) {
      return {
        columnType: 'varchar',
        tsType: 'string',
        extraOpts: { length: Number(strMatch[1]) }
      };
    }

    return { columnType: 'varchar', tsType: 'string' };
  };

  const formatDefaultValue = (defaultVal: string) => {
    const upper = defaultVal.toUpperCase();
    if (upper === 'TRUE') return 'true';
    if (upper === 'FALSE') return 'false';
    if (upper === 'NULL') return 'null';
    if (upper === 'CURRENT_TIMESTAMP' || upper === 'NOW()' || upper === 'CURRENT_TIMESTAMP()') return "() => 'CURRENT_TIMESTAMP'";
    if (!isNaN(Number(defaultVal))) return defaultVal;
    if (defaultVal.startsWith("'") || defaultVal.startsWith('"')) return defaultVal;
    return `'${defaultVal.replace(/'/g, "\\'")}'`;
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
      const entityBlocks: string[] = [];
      let usesClassValidatorImports = false;

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

        const propertyDefs: string[] = [];

        fields.forEach(f => {
          const { columnType, tsType, extraOpts } = mapSqlTypeToTypeORM(f.sqlType);
          const lowerRaw = f.rawName.toLowerCase();

          const isCreateDate = useCreateUpdateDateColumns && (lowerRaw === 'created_at' || lowerRaw === 'createdat' || lowerRaw === 'creation_date');
          const isUpdateDate = useCreateUpdateDateColumns && (lowerRaw === 'updated_at' || lowerRaw === 'updatedat' || lowerRaw === 'modified_at');

          const decorators: string[] = [];

          if (useClassValidator) {
            usesClassValidatorImports = true;
            if (f.isNullable) {
              decorators.push('  @IsOptional()');
            } else {
              decorators.push('  @IsNotEmpty()');
            }
            if (tsType === 'string') {
              if (lowerRaw.includes('email')) decorators.push('  @IsEmail()');
              else decorators.push('  @IsString()');
            } else if (tsType === 'number') {
              decorators.push('  @IsNumber()');
            } else if (tsType === 'boolean') {
              decorators.push('  @IsBoolean()');
            } else if (tsType === 'Date') {
              decorators.push('  @IsDate()');
            }
          }

          if (f.isPrimaryKey) {
            if (columnType === 'uuid') {
              decorators.push("  @PrimaryGeneratedColumn('uuid')");
            } else if (f.isAutoIncrement) {
              decorators.push('  @PrimaryGeneratedColumn()');
            } else {
              decorators.push(`  @PrimaryColumn({ type: '${columnType}'${f.attrName !== f.rawName ? `, name: '${f.rawName}'` : ''} })`);
            }
          } else if (isCreateDate) {
            decorators.push(`  @CreateDateColumn({ type: '${columnType}'${f.attrName !== f.rawName ? `, name: '${f.rawName}'` : ''} })`);
          } else if (isUpdateDate) {
            decorators.push(`  @UpdateDateColumn({ type: '${columnType}'${f.attrName !== f.rawName ? `, name: '${f.rawName}'` : ''} })`);
          } else {
            const colOpts: string[] = [`type: '${columnType}'`];
            if (f.attrName !== f.rawName) colOpts.push(`name: '${f.rawName}'`);
            if (extraOpts?.length) colOpts.push(`length: ${extraOpts.length}`);
            if (extraOpts?.precision !== undefined) colOpts.push(`precision: ${extraOpts.precision}`);
            if (extraOpts?.scale !== undefined) colOpts.push(`scale: ${extraOpts.scale}`);
            if (f.isNullable) colOpts.push('nullable: true');
            if (f.isUnique) colOpts.push('unique: true');
            if (f.defaultValue) colOpts.push(`default: ${formatDefaultValue(f.defaultValue)}`);

            decorators.push(`  @Column({ ${colOpts.join(', ')} })`);
          }

          const propType = f.isNullable ? `${tsType} | null` : tsType;
          propertyDefs.push(`${decorators.join('\n')}\n  ${f.attrName}!: ${propType};`);
        });

        let constructorCode = '';
        if (useConstructor) {
          constructorCode = `\n\n  constructor(init?: Partial<${className}>) {\n    Object.assign(this, init);\n  }`;
        }

        const classDef = `@Entity('${rawTableName}')\nexport class ${className} {\n${propertyDefs.join('\n\n')}${constructorCode}\n}`;
        entityBlocks.push(classDef);
      }

      if (entityBlocks.length === 0) {
        setError(t('sqltotypeorm.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
        return;
      }

      const typeormImports = new Set(['Entity', 'Column']);
      if (cleanInput.toUpperCase().includes('PRIMARY KEY')) {
        typeormImports.add('PrimaryGeneratedColumn');
        typeormImports.add('PrimaryColumn');
      }
      if (useCreateUpdateDateColumns) {
        if (cleanInput.toLowerCase().includes('created') || cleanInput.toLowerCase().includes('creation')) typeormImports.add('CreateDateColumn');
        if (cleanInput.toLowerCase().includes('updated') || cleanInput.toLowerCase().includes('modified')) typeormImports.add('UpdateDateColumn');
      }

      let header = `import { ${Array.from(typeormImports).join(', ')} } from 'typeorm';\n`;
      if (usesClassValidatorImports) {
        header += `import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsDate, IsEmail } from 'class-validator';\n`;
      }
      header += '\n';

      setOutput((header + entityBlocks.join('\n\n')).trim());
      setError('');
    } catch (e: any) {
      setError(t('sqltotypeorm.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, fieldCasing, useClassValidator, useConstructor, useCreateUpdateDateColumns, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltotypeorm.toast_copied', 'TypeORM entities copied to clipboard!'));
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
    const blob = new Blob([output], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'entities.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sqltotypeorm.toast_downloaded', 'Downloaded entities.ts!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePreset(presetKey);
    toast.success(t('sqltotypeorm.preset_loaded', 'Loaded SQL preset!'));
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
            {t('sqltotypeorm.presets_title', 'Quick Presets')}
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
                {t(`sqltotypeorm.preset_${pKey}`, pKey === 'ecommerce' ? 'E-Commerce Catalog' : pKey === 'user_auth' ? 'User Auth & Roles' : 'Blog CMS')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="typeorm-field-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltotypeorm.field_casing', 'Field Casing')}
          </label>
          <select
            id="typeorm-field-casing"
            value={fieldCasing}
            onChange={(e) => setFieldCasing(e.target.value as FieldCasing)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="camelCase">camelCase (TypeORM Standard)</option>
            <option value="snake_case">snake_case</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original Column Name</option>
          </select>
        </div>

        <div className="flex flex-col justify-end space-y-2 pt-2 md:pt-0">
          <div className="flex items-center gap-2">
            <input
              id="typeorm-validator"
              type="checkbox"
              checked={useClassValidator}
              onChange={(e) => setUseClassValidator(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="typeorm-validator" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltotypeorm.use_class_validator', 'class-validator Decorators')}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="typeorm-constructor"
              type="checkbox"
              checked={useConstructor}
              onChange={(e) => setUseConstructor(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="typeorm-constructor" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltotypeorm.use_constructor', 'Partial Constructor')}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="typeorm-datecols"
              type="checkbox"
              checked={useCreateUpdateDateColumns}
              onChange={(e) => setUseCreateUpdateDateColumns(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="typeorm-datecols" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltotypeorm.use_date_cols', '@CreateDateColumn & @UpdateDateColumn')}
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
              <label htmlFor="sql-typeorm-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltotypeorm.sql_input_label', 'SQL CREATE TABLE DDL')}
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
            id="sql-typeorm-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (activePreset) setActivePreset(null);
            }}
            placeholder={t('sqltotypeorm.placeholder_sql', 'Paste SQL CREATE TABLE DDL statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="typeorm-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltotypeorm.output_label', 'Generated TypeORM Entities')}
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
            id="typeorm-output"
            value={output}
            readOnly
            placeholder={t('sqltotypeorm.placeholder_output', 'Generated TypeORM entities will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('sqltotypeorm.about_title', 'About SQL to TypeORM Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltotypeorm.about_text', 'Convert SQL CREATE TABLE DDL queries into strongly-typed TypeORM Entity classes with decorators (@Entity, @PrimaryGeneratedColumn, @Column, @CreateDateColumn, @UpdateDateColumn). Supports class-validator decorators, partial constructor initializers, casing options, and TS reserved keyword escaping.')}
          </p>
        </div>
      </div>
    </div>
  );
}
