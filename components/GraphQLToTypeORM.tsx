import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles, FileCode } from 'lucide-react';
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

const escapeJsString = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
};

type FieldCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';

export function GraphQLToTypeORM({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [fieldCasing, setFieldCasing] = useState<FieldCasing>(initialData?.fieldCasing || 'camelCase');
  const [useClassValidator, setUseClassValidator] = useState(initialData?.useClassValidator ?? false);
  const [useConstructor, setUseConstructor] = useState(initialData?.useConstructor ?? true);
  const [useCreateUpdateDateColumns, setUseCreateUpdateDateColumns] = useState(initialData?.useCreateUpdateDateColumns ?? true);
  const [idType, setIdType] = useState<'uuid' | 'auto-increment' | 'string'>(initialData?.idType || 'auto-increment');
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
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
      idType,
      activePresetId,
    });
  }, [input, output, fieldCasing, useClassValidator, useConstructor, useCreateUpdateDateColumns, idType, activePresetId, onStateChange]);

  const PRESETS = {
    ecommerce: `# E-Commerce Catalog Schema
type Category {
  id: ID!
  name: String!
  slug: String!
  description: String
  parentId: ID
}

type Product {
  id: ID!
  title: String!
  description: String
  price: Float!
  sku: String!
  isActive: Boolean!
  categoryId: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  metadata: JSON
}

input CreateProductInput {
  title: String!
  description: String
  price: Float!
  categoryId: ID!
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}`,
    user_auth: `# User Auth & Roles Schema
type User {
  id: ID!
  email: String!
  passwordHash: String!
  fullName: String!
  isVerified: Boolean!
  loginCount: Int
  lastLogin: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Role {
  id: ID!
  roleName: String!
  permissions: JSON
}`,
    social_feed: `# Social Feed & Comments Schema
type Post {
  id: ID!
  title: String!
  slug: String!
  body: String!
  publishedAt: DateTime
  viewCount: Int
  isDraft: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Comment {
  id: ID!
  postId: ID!
  authorName: String!
  content: String!
  createdAt: DateTime!
}`
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

  const getClassName = (typeName: string) => {
    let name = toPascalCase(typeName);
    if (TS_RESERVED_KEYWORDS.has(name)) {
      name = `${name}Entity`;
    }
    return name;
  };

  const mapGqlTypeToTypeORM = (
    gqlTypeStr: string,
    enumNames: Set<string>
  ): { columnType: string; tsType: string; isNonNull: boolean; isList: boolean; isEnum: boolean; baseType: string } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;
    const isList = typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']');
    const baseType = isList ? typeWithoutOuterBang.slice(1, -1).replace(/!$/, '').trim() : typeWithoutOuterBang;

    let columnType = 'varchar';
    let tsType = 'string';
    let isEnum = false;

    if (baseType === 'ID') {
      if (idType === 'uuid') {
        columnType = 'uuid';
        tsType = 'string';
      } else if (idType === 'auto-increment') {
        columnType = 'int';
        tsType = 'number';
      } else {
        columnType = 'varchar';
        tsType = 'string';
      }
    } else if (baseType === 'String') {
      columnType = 'varchar';
      tsType = 'string';
    } else if (baseType === 'Int') {
      columnType = 'int';
      tsType = 'number';
    } else if (baseType === 'Float') {
      columnType = 'float';
      tsType = 'number';
    } else if (baseType === 'Boolean') {
      columnType = 'boolean';
      tsType = 'boolean';
    } else if (baseType === 'DateTime' || baseType === 'Date' || baseType === 'Timestamp') {
      columnType = 'timestamp';
      tsType = 'Date';
    } else if (baseType === 'JSON' || baseType === 'JSONObject') {
      columnType = 'json';
      tsType = 'any';
    } else if (enumNames.has(baseType)) {
      columnType = 'enum';
      tsType = toPascalCase(baseType) + 'Enum';
      isEnum = true;
    }

    if (isList) {
      tsType = `${tsType}[]`;
      if (!isEnum) columnType = 'json';
    }

    return { columnType, tsType, isNonNull, isList, isEnum, baseType };
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
        setOutput('');
        return;
      }

      const cleanInput = input
        .replace(/#.*$/gm, '')
        .replace(/"""[\s\S]*?"""/g, '')
        .replace(/"[\s\S]*?"/g, (m: string) => m.includes('\n') ? '""' : m);

      // Collect Enums
      const enumNames = new Set<string>();
      const enumMap = Object.create(null);
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const enumName = enumMatch[1];
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);
        if (enumValues.length > 0) {
          enumNames.add(enumName);
          enumMap[enumName] = enumValues;
        }
      }

      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;
      const entityBlocks: string[] = [];
      const enumCodeBlocks: string[] = [];
      let usesClassValidatorImports = false;

      // Generate Enum TypeScript Const Enums
      Object.keys(enumMap).forEach(enumName => {
        const values = enumMap[enumName] as string[];
        const enumPascal = toPascalCase(enumName) + 'Enum';
        const enumMembers = values.map(v => `  ${toPascalCase(v)} = '${escapeJsString(v)}'`).join(',\n');
        enumCodeBlocks.push(`export enum ${enumPascal} {\n${enumMembers}\n}`);
      });

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const rawTypeName = structMatch[2];
        const body = structMatch[3];
        const className = getClassName(rawTypeName);
        const rawTableName = toSnakeCase(rawTypeName) + 's';

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        const fields: Array<{
          rawName: string;
          attrName: string;
          gqlType: string;
          columnType: string;
          tsType: string;
          isPrimaryKey: boolean;
          isNullable: boolean;
          isEnum: boolean;
          baseType: string;
        }> = [];

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const attrName = formatFieldName(rawFieldName);
          const isPrimaryKey = rawFieldName.toLowerCase() === 'id';
          const { columnType, tsType, isNonNull, isEnum, baseType } = mapGqlTypeToTypeORM(rawTypeStr, enumNames);
          const isNullable = !isNonNull && !isPrimaryKey;

          fields.push({
            rawName: rawFieldName,
            attrName,
            gqlType: rawTypeStr,
            columnType,
            tsType,
            isPrimaryKey,
            isNullable,
            isEnum,
            baseType,
          });
        });

        if (fields.length === 0) continue;

        const propertyDefs: string[] = [];

        fields.forEach(f => {
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
            if (f.tsType.startsWith('string')) {
              if (lowerRaw.includes('email')) decorators.push('  @IsEmail()');
              else decorators.push('  @IsString()');
            } else if (f.tsType.startsWith('number')) {
              decorators.push('  @IsNumber()');
            } else if (f.tsType.startsWith('boolean')) {
              decorators.push('  @IsBoolean()');
            } else if (f.tsType.startsWith('Date')) {
              decorators.push('  @IsDate()');
            }
          }

          if (f.isPrimaryKey) {
            if (idType === 'uuid') {
              decorators.push(`  @PrimaryGeneratedColumn('uuid'${f.attrName !== f.rawName ? `, { name: '${escapeJsString(f.rawName)}' }` : ''})`);
            } else if (idType === 'auto-increment') {
              decorators.push(`  @PrimaryGeneratedColumn(${f.attrName !== f.rawName ? `{ name: '${escapeJsString(f.rawName)}' }` : ''})`);
            } else {
              decorators.push(`  @PrimaryColumn({ type: 'varchar'${f.attrName !== f.rawName ? `, name: '${escapeJsString(f.rawName)}'` : ''} })`);
            }
          } else if (isCreateDate) {
            decorators.push(`  @CreateDateColumn({ type: 'timestamp'${f.attrName !== f.rawName ? `, name: '${escapeJsString(f.rawName)}'` : ''} })`);
          } else if (isUpdateDate) {
            decorators.push(`  @UpdateDateColumn({ type: 'timestamp'${f.attrName !== f.rawName ? `, name: '${escapeJsString(f.rawName)}'` : ''} })`);
          } else {
            const colOpts: string[] = [];
            if (f.isEnum) {
              colOpts.push("type: 'enum'");
              colOpts.push(`enum: ${toPascalCase(f.baseType)}Enum`);
            } else {
              colOpts.push(`type: '${f.columnType}'`);
            }

            if (f.attrName !== f.rawName) colOpts.push(`name: '${escapeJsString(f.rawName)}'`);
            if (f.isNullable) colOpts.push('nullable: true');

            decorators.push(`  @Column({ ${colOpts.join(', ')} })`);
          }

          const propType = f.isNullable ? `${f.tsType} | null` : f.tsType;
          propertyDefs.push(`${decorators.join('\n')}\n  ${f.attrName}!: ${propType};`);
        });

        let constructorCode = '';
        if (useConstructor) {
          constructorCode = `\n\n  constructor(init?: Partial<${className}>) {\n    Object.assign(this, init);\n  }`;
        }

        const classDef = `@Entity('${escapeJsString(rawTableName)}')\nexport class ${className} {\n${propertyDefs.join('\n\n')}${constructorCode}\n}`;
        entityBlocks.push(classDef);
      }

      if (entityBlocks.length === 0) {
        setError(t('graphqltotypeorm.no_types_found', 'No valid GraphQL types or inputs found.'));
        setOutput('');
        return;
      }

      const typeormImports = new Set(['Entity', 'Column']);
      if (input.toLowerCase().includes('id:')) {
        typeormImports.add(idType === 'string' ? 'PrimaryColumn' : 'PrimaryGeneratedColumn');
      }
      if (useCreateUpdateDateColumns) {
        if (input.toLowerCase().includes('createdat') || input.toLowerCase().includes('created_at')) typeormImports.add('CreateDateColumn');
        if (input.toLowerCase().includes('updatedat') || input.toLowerCase().includes('updated_at')) typeormImports.add('UpdateDateColumn');
      }

      let header = `import { ${Array.from(typeormImports).join(', ')} } from 'typeorm';\n`;
      if (usesClassValidatorImports) {
        header += `import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsDate, IsEmail } from 'class-validator';\n`;
      }
      header += '\n';

      let fullOutput = header;
      if (enumCodeBlocks.length > 0) {
        fullOutput += enumCodeBlocks.join('\n\n') + '\n\n';
      }
      fullOutput += entityBlocks.join('\n\n');

      setOutput(fullOutput.trim());
      setError('');
    } catch (e: any) {
      setError(t('graphqltotypeorm.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, fieldCasing, useClassValidator, useConstructor, useCreateUpdateDateColumns, idType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltotypeorm.toast_copied', 'TypeORM entities copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
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
    toast.success(t('graphqltotypeorm.toast_downloaded', 'Downloaded entities.ts!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltotypeorm.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltotypeorm.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['ecommerce', 'user_auth', 'social_feed'] as const).map((pKey) => {
            const isActive = activePresetId === pKey;
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
                {t(`graphqltotypeorm.preset_${pKey}`, pKey === 'ecommerce' ? 'E-Commerce Catalog' : pKey === 'user_auth' ? 'User Management & Auth' : 'Social Feed & Comments')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="typeorm-field-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltotypeorm.field_casing', 'Field Casing')}
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
            <option value="original">Original Field Name</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="typeorm-id-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltotypeorm.id_type', 'ID Primary Key Strategy')}
          </label>
          <select
            id="typeorm-id-type"
            value={idType}
            onChange={(e) => setIdType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="auto-increment">Auto-Increment Integer</option>
            <option value="uuid">UUID (@PrimaryGeneratedColumn('uuid'))</option>
            <option value="string">Varchar String (@PrimaryColumn)</option>
          </select>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label htmlFor="typeorm-validator" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              id="typeorm-validator"
              type="checkbox"
              checked={useClassValidator}
              onChange={(e) => setUseClassValidator(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltotypeorm.use_class_validator', 'class-validator Decorators')}
          </label>

          <label htmlFor="typeorm-constructor" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              id="typeorm-constructor"
              type="checkbox"
              checked={useConstructor}
              onChange={(e) => setUseConstructor(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltotypeorm.use_constructor', 'Partial Constructor')}
          </label>

          <label htmlFor="typeorm-datecols" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              id="typeorm-datecols"
              type="checkbox"
              checked={useCreateUpdateDateColumns}
              onChange={(e) => setUseCreateUpdateDateColumns(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltotypeorm.use_date_cols', '@CreateDateColumn & @UpdateDateColumn')}
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-typeorm-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltotypeorm.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-typeorm-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (activePresetId) setActivePresetId(null);
            }}
            placeholder={t('graphqltotypeorm.placeholder_graphql', 'Paste GraphQL SDL schema statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="typeorm-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltotypeorm.output_label', 'Generated TypeORM Entities')}
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
            placeholder={t('graphqltotypeorm.placeholder_output', 'Generated TypeORM entities will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltotypeorm.about_title', 'About GraphQL SDL to TypeORM Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltotypeorm.about_text', 'Convert GraphQL Schema Definition Language (SDL) statements into strongly-typed TypeORM Entity classes with decorators (@Entity, @PrimaryGeneratedColumn, @Column, @CreateDateColumn, @UpdateDateColumn). Supports class-validator decorators, partial constructor initializers, casing options, and TS reserved keyword escaping.')}
          </p>
        </div>
      </div>
    </div>
  );
}
