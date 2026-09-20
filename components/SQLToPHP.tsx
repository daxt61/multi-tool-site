import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, RefreshCw, Code2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

// PHP Reserved Keywords that cannot be used as unescaped variable names
const PHP_RESERVED_KEYWORDS = new Set([
  'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch', 'class',
  'clone', 'const', 'continue', 'declare', 'default', 'die', 'do', 'echo', 'else',
  'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch',
  'endwhile', 'eval', 'exit', 'extends', 'final', 'finally', 'fn', 'for', 'foreach',
  'function', 'global', 'goto', 'if', 'implements', 'include', 'include_once',
  'instanceof', 'insteadof', 'interface', 'isset', 'list', 'match', 'namespace',
  'new', 'or', 'print', 'private', 'protected', 'public', 'readonly', 'require',
  'require_once', 'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset',
  'use', 'var', 'while', 'xor', 'yield', 'parent', 'self'
]);

const PRESETS = [
  {
    id: 'ecommerce',
    nameKey: 'sqltophp.preset_ecommerce',
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
    nameKey: 'sqltophp.preset_user_auth',
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
    nameKey: 'sqltophp.preset_blog',
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

type TargetMode = 'class_dto' | 'readonly_dto' | 'eloquent';
type PropertyCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';

export function SQLToPHP({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || PRESETS[0].sql);
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(PRESETS[0].id);

  // Configuration toggles
  const [targetMode, setTargetMode] = useState<TargetMode>(initialData?.targetMode || 'readonly_dto');
  const [propertyCasing, setPropertyCasing] = useState<PropertyCasing>(initialData?.propertyCasing || 'camelCase');
  const [namespace, setNamespace] = useState(initialData?.namespace || 'App\\DTOs');
  const [constructorPromotion, setConstructorPromotion] = useState(initialData?.constructorPromotion ?? true);
  const [includeFromArray, setIncludeFromArray] = useState(initialData?.includeFromArray ?? true);
  const [includeToArray, setIncludeToArray] = useState(initialData?.includeToArray ?? true);
  const [includeGettersSetters, setIncludeGettersSetters] = useState(initialData?.includeGettersSetters ?? false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      targetMode,
      propertyCasing,
      namespace,
      constructorPromotion,
      includeFromArray,
      includeToArray,
      includeGettersSetters,
    });
  }, [input, output, targetMode, propertyCasing, namespace, constructorPromotion, includeFromArray, includeToArray, includeGettersSetters, onStateChange]);

  const toPascalCase = (str: string): string => {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('') || 'Model';
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

  const toValidPhpVarName = (name: string): string => {
    let clean = name.replace(/[^a-zA-Z0-9_\x80-\xff]/g, '_');
    if (/^[0-9]/.test(clean)) {
      clean = '_' + clean;
    }
    if (PHP_RESERVED_KEYWORDS.has(clean.toLowerCase())) {
      clean = clean + '_val';
    }
    return clean || 'property';
  };

  const mapSqlToPhpType = (sqlType: string): string => {
    const upper = sqlType.toUpperCase();
    if (upper.includes('INT') || upper.includes('TINYINT') || upper.includes('SMALLINT') || upper.includes('MEDIUMINT') || upper.includes('BIGINT')) {
      if (upper.includes('TINYINT(1)') || upper === 'BOOLEAN' || upper === 'BOOL') return 'bool';
      return 'int';
    }
    if (upper.includes('FLOAT') || upper.includes('DOUBLE') || upper.includes('DECIMAL') || upper.includes('NUMERIC') || upper.includes('REAL')) {
      return 'float';
    }
    if (upper.includes('BOOL')) return 'bool';
    if (upper.includes('JSON')) return 'array';
    if (upper.includes('DATE') || upper.includes('TIME') || upper.includes('TIMESTAMP') || upper.includes('YEAR')) {
      return 'string';
    }
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

      // Regex matching CREATE TABLE statements
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

          // Skip table constraints like PRIMARY KEY (...), CONSTRAINT, KEY, INDEX, UNIQUE KEY
          if (/^(?:CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|KEY|INDEX|UNIQUE\s+KEY|UNIQUE)\b/i.test(trimmed)) {
            return;
          }

          const colMatch = trimmed.match(/^[`"']?(\w+)[`"']?\s+([A-Za-z0-9_()]+)/i);
          if (colMatch) {
            const originalName = colMatch[1];
            const rawType = colMatch[2];
            const isNullable = !/NOT\s+NULL/i.test(trimmed);
            const isPk = /PRIMARY\s+KEY/i.test(trimmed);
            const phpType = mapSqlToPhpType(rawType);

            columns.push({
              name: originalName,
              type: phpType,
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
        setError(t('sqltophp.no_tables_found'));
        setOutput('');
        return;
      }

      const generatedClasses: string[] = [];

      parsedTables.forEach(table => {
        const className = toPascalCase(table.tableName);
        const properties = table.columns.map(col => {
          const formatted = formatPropertyName(col.name, propertyCasing);
          const safeVarName = toValidPhpVarName(formatted);
          return {
            originalName: col.originalName,
            propertyName: safeVarName,
            phpType: col.type,
            nullable: col.nullable,
            isPk: col.isPk
          };
        });

        let code = '';

        if (targetMode === 'eloquent') {
          // Laravel Eloquent Model
          code += `<?php\n\n`;
          if (namespace.trim()) {
            code += `namespace ${namespace.trim()};\n\n`;
          }
          code += `use Illuminate\\Database\\Eloquent\\Model;\n`;
          code += `use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;\n\n`;
          code += `class ${className} extends Model\n{\n`;
          code += `    use HasFactory;\n\n`;
          code += `    protected $table = '${table.tableName}';\n\n`;

          const pkCol = properties.find(p => p.isPk);
          if (pkCol && pkCol.originalName !== 'id') {
            code += `    protected $primaryKey = '${pkCol.originalName}';\n\n`;
          }

          const fillables = properties.map(p => `'${p.originalName}'`).join(', ');
          code += `    protected $fillable = [\n        ${fillables}\n    ];\n\n`;

          const casts = properties
            .filter(p => p.phpType !== 'string')
            .map(p => `'${p.originalName}' => '${p.phpType === 'bool' ? 'boolean' : p.phpType}'`)
            .join(',\n        ');

          if (casts) {
            code += `    protected $casts = [\n        ${casts}\n    ];\n`;
          }

          code += `}\n`;
        } else {
          // Standard DTO or Readonly Class
          code += `<?php\n\n`;
          if (namespace.trim()) {
            code += `namespace ${namespace.trim()};\n\n`;
          }

          const isReadonly = targetMode === 'readonly_dto';
          const classKeyword = isReadonly ? 'readonly class' : 'class';

          code += `${classKeyword} ${className}\n{\n`;

          if (constructorPromotion) {
            code += `    public function __construct(\n`;
            code += properties.map(prop => {
              const typeStr = prop.nullable ? `?${prop.phpType}` : prop.phpType;
              const defaultStr = prop.nullable ? ' = null' : '';
              const comment = prop.propertyName !== prop.originalName ? ` // Original column: ${prop.originalName}` : '';
              return `        public ${typeStr} $${prop.propertyName}${defaultStr},${comment}`;
            }).join('\n');
            code += `\n    ) {}\n`;
          } else {
            // Traditional property declarations
            properties.forEach(prop => {
              const typeStr = prop.nullable ? `?${prop.phpType}` : prop.phpType;
              const comment = prop.propertyName !== prop.originalName ? ` // Original column: ${prop.originalName}` : '';
              code += `    public ${typeStr} $${prop.propertyName};${comment}\n`;
            });

            code += `\n    public function __construct(\n`;
            code += properties.map(prop => {
              const typeStr = prop.nullable ? `?${prop.phpType}` : prop.phpType;
              const defaultStr = prop.nullable ? ' = null' : '';
              return `        ${typeStr} $${prop.propertyName}${defaultStr}`;
            }).join(',\n');
            code += `\n    ) {\n`;
            properties.forEach(prop => {
              code += `        $this->${prop.propertyName} = $${prop.propertyName};\n`;
            });
            code += `    }\n`;
          }

          // Optional Getters and Setters
          if (includeGettersSetters) {
            code += `\n`;
            properties.forEach(prop => {
              const capName = toPascalCase(prop.propertyName);
              const typeStr = prop.nullable ? `?${prop.phpType}` : prop.phpType;
              // Getter
              code += `    public function get${capName}(): ${typeStr}\n    {\n        return $this->${prop.propertyName};\n    }\n\n`;

              // Setter (if not readonly class)
              if (!isReadonly) {
                code += `    public function set${capName}(${typeStr} $${prop.propertyName}): self\n    {\n        $this->${prop.propertyName} = $${prop.propertyName};\n        return $this;\n    }\n\n`;
              }
            });
          }

          // Optional fromArray
          if (includeFromArray) {
            code += `\n    public static function fromArray(array $data): self\n    {\n`;
            code += `        return new self(\n`;
            code += properties.map(prop => {
              const safeKey = prop.originalName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
              const fallback = prop.nullable ? 'null' : (prop.phpType === 'int' || prop.phpType === 'float' ? '0' : (prop.phpType === 'bool' ? 'false' : "''"));
              return `            $data['${safeKey}'] ?? ${fallback}`;
            }).join(',\n');
            code += `\n        );\n    }\n`;
          }

          // Optional toArray
          if (includeToArray) {
            code += `\n    public function toArray(): array\n    {\n        return [\n`;
            code += properties.map(prop => {
              const safeKey = prop.originalName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
              return `            '${safeKey}' => $this->${prop.propertyName},`;
            }).join('\n');
            code += `\n        ];\n    }\n`;
          }

          code += `}\n`;
        }

        generatedClasses.push(code);
      });

      setOutput(generatedClasses.join('\n\n'));
      setError('');
    } catch (err: any) {
      setError(t('sqltophp.error_parsing') + ': ' + err.message);
      setOutput('');
    }
  }, [input, targetMode, propertyCasing, namespace, constructorPromotion, includeFromArray, includeToArray, includeGettersSetters, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltophp.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('sqltophp.toast_cleared'));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [t]);

  const handleLoadPreset = (preset: typeof PRESETS[0]) => {
    setInput(preset.sql);
    setActivePreset(preset.id);
    toast.success(t('sqltophp.preset_loaded'));
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/x-php' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Models.php';
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
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            {t('sqltophp.presets_title')}
          </h3>
          <span className="text-xs text-slate-400 font-medium">PHP 8.1+ / 8.2 / Laravel</span>
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
          {/* Target Mode */}
          <div className="space-y-2">
            <label htmlFor="target-mode-select" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {t('sqltophp.target_mode')}
            </label>
            <select
              id="target-mode-select"
              value={targetMode}
              onChange={(e) => setTargetMode(e.target.value as TargetMode)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="readonly_dto">PHP 8.2 Readonly Class DTO</option>
              <option value="class_dto">PHP 8.1 Standard Class DTO</option>
              <option value="eloquent">Laravel Eloquent Model</option>
            </select>
          </div>

          {/* Property Casing */}
          <div className="space-y-2">
            <label htmlFor="property-casing-select" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {t('sqltophp.property_casing')}
            </label>
            <select
              id="property-casing-select"
              value={propertyCasing}
              onChange={(e) => setPropertyCasing(e.target.value as PropertyCasing)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="camelCase">camelCase ($productName)</option>
              <option value="snake_case">snake_case ($product_name)</option>
              <option value="PascalCase">PascalCase ($ProductName)</option>
              <option value="original">Original SQL Column</option>
            </select>
          </div>

          {/* Namespace */}
          <div className="space-y-2">
            <label htmlFor="namespace-input" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {t('sqltophp.namespace')}
            </label>
            <input
              id="namespace-input"
              type="text"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              placeholder="App\Models"
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-2">
            {targetMode !== 'eloquent' && (
              <>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={constructorPromotion}
                    onChange={(e) => setConstructorPromotion(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 transition-colors">
                    {t('sqltophp.constructor_promotion')}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={includeFromArray}
                    onChange={(e) => setIncludeFromArray(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 transition-colors">
                    {t('sqltophp.include_from_array')}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={includeToArray}
                    onChange={(e) => setIncludeToArray(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 transition-colors">
                    {t('sqltophp.include_to_array')}
                  </span>
                </label>
              </>
            )}
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
              <label htmlFor="sql-php-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltophp.sql_input_label')}
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
            id="sql-php-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder="CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL);"
            className="w-full h-[480px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-500" />
              <label htmlFor="php-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltophp.output_label')}
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
            id="php-output"
            value={output}
            readOnly
            placeholder={t('sqltophp.placeholder_output')}
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
          {t('sqltophp.about_title')}
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('sqltophp.about_text')}
        </p>
      </div>
    </div>
  );
}
