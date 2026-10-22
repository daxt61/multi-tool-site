import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles, FileCode } from 'lucide-react';
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

const escapeJsString = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
};

type ModelStyle = 'define' | 'class';
type Language = 'js' | 'ts';
type FieldCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';

export function GraphQLToSequelize({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
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
  const [idType, setIdType] = useState<'serial' | 'uuid' | 'string'>(initialData?.idType || 'serial');
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
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
      idType,
      activePresetId,
    });
  }, [input, output, modelStyle, language, fieldCasing, timestamps, underscored, freezeTableName, idType, activePresetId, onStateChange]);

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

  const getClassName = (typeName: string) => {
    let name = toPascalCase(typeName);
    if (JS_RESERVED_KEYWORDS.has(name)) {
      name = `${name}Model`;
    }
    return name;
  };

  const mapGqlTypeToSequelize = (gqlTypeStr: string, enumNames: Set<string>): { dataType: string; tsType: string; isNonNull: boolean; isList: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;
    const isList = typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']');
    const baseType = isList ? typeWithoutOuterBang.slice(1, -1).replace(/!$/, '').trim() : typeWithoutOuterBang;

    let dataType = 'DataTypes.STRING';
    let tsType = 'string';

    if (baseType === 'ID') {
      if (idType === 'uuid') {
        dataType = 'DataTypes.UUID';
        tsType = 'string';
      } else if (idType === 'serial') {
        dataType = 'DataTypes.INTEGER';
        tsType = 'number';
      } else {
        dataType = 'DataTypes.STRING';
        tsType = 'string';
      }
    } else if (baseType === 'String') {
      dataType = 'DataTypes.STRING';
      tsType = 'string';
    } else if (baseType === 'Int') {
      dataType = 'DataTypes.INTEGER';
      tsType = 'number';
    } else if (baseType === 'Float') {
      dataType = 'DataTypes.FLOAT';
      tsType = 'number';
    } else if (baseType === 'Boolean') {
      dataType = 'DataTypes.BOOLEAN';
      tsType = 'boolean';
    } else if (baseType === 'DateTime' || baseType === 'Date' || baseType === 'Timestamp') {
      dataType = 'DataTypes.DATE';
      tsType = 'Date';
    } else if (baseType === 'JSON' || baseType === 'JSONObject') {
      dataType = 'DataTypes.JSON';
      tsType = 'object | any';
    } else if (enumNames.has(baseType)) {
      dataType = `DataTypes.ENUM(...Object.values(${toPascalCase(baseType)}Enum))`;
      tsType = toPascalCase(baseType) + 'Enum';
    }

    if (isList) {
      dataType = `DataTypes.ARRAY(${dataType})`;
      tsType = `${tsType}[]`;
    }

    return { dataType, tsType, isNonNull, isList };
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
      const modelBlocks: string[] = [];
      const enumCodeBlocks: string[] = [];

      // Generate Enum JavaScript/TypeScript Const Enums
      Object.keys(enumMap).forEach(enumName => {
        const values = enumMap[enumName] as string[];
        const enumPascal = toPascalCase(enumName) + 'Enum';
        if (language === 'ts') {
          const enumMembers = values.map(v => `  ${toPascalCase(v)} = '${escapeJsString(v)}'`).join(',\n');
          enumCodeBlocks.push(`export enum ${enumPascal} {\n${enumMembers}\n}`);
        } else {
          const enumMembers = values.map(v => `  ${toPascalCase(v)}: '${escapeJsString(v)}'`).join(',\n');
          enumCodeBlocks.push(`const ${enumPascal} = {\n${enumMembers}\n};`);
        }
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
          dataType: string;
          tsType: string;
          isPrimaryKey: boolean;
          isNullable: boolean;
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
          const { dataType, tsType, isNonNull } = mapGqlTypeToSequelize(rawTypeStr, enumNames);
          const isNullable = !isNonNull && !isPrimaryKey;

          fields.push({
            rawName: rawFieldName,
            attrName,
            gqlType: rawTypeStr,
            dataType,
            tsType,
            isPrimaryKey,
            isNullable,
          });
        });

        if (fields.length === 0) continue;

        if (modelStyle === 'define') {
          const fieldDefs = fields.map(f => {
            const props: string[] = [];
            props.push(`    type: ${f.dataType}`);

            if (f.isPrimaryKey) {
              props.push('    primaryKey: true');
              if (idType === 'serial') props.push('    autoIncrement: true');
              if (idType === 'uuid') props.push('    defaultValue: DataTypes.UUIDV4');
            }

            if (!f.isNullable) props.push('    allowNull: false');
            else props.push('    allowNull: true');

            if (f.attrName !== f.rawName) {
              props.push(`    field: '${escapeJsString(f.rawName)}'`);
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
              fields.map(f => `  ${f.attrName}${f.isNullable ? '?' : ''}: ${f.tsType};`).join('\n') +
              `\n}\n\nexport interface ${className}CreationAttributes extends Optional<${className}Attributes, '${fields.filter(f => f.isPrimaryKey || f.isNullable).map(f => f.attrName).join("' | '")}'> {}`;

            const classProps = fields.map(f => `  public ${f.attrName}!: ${f.tsType};`).join('\n');

            const initFields = fields.map(f => {
              const props: string[] = [`    type: ${f.dataType}`];
              if (f.isPrimaryKey) {
                props.push('    primaryKey: true');
                if (idType === 'serial') props.push('    autoIncrement: true');
                if (idType === 'uuid') props.push('    defaultValue: DataTypes.UUIDV4');
              }
              if (!f.isNullable) props.push('    allowNull: false');
              if (f.attrName !== f.rawName) props.push(`    field: '${escapeJsString(f.rawName)}'`);
              return `    ${f.attrName}: {\n${props.join(',\n')}\n    }`;
            });

            const classDef = `${interfacesCode}\n\nexport class ${className} extends Model<${className}Attributes, ${className}CreationAttributes> implements ${className}Attributes {\n${classProps}\n\n  public static initModel(sequelize: Sequelize): typeof ${className} {\n    return ${className}.init({\n${initFields.join(',\n')}\n    }, {\n      sequelize,\n      tableName: '${rawTableName}',\n      timestamps: ${timestamps},\n      underscored: ${underscored},\n      freezeTableName: ${freezeTableName},\n    });\n  }\n}`;
            modelBlocks.push(classDef);
          } else {
            // JS Class Style
            const initFields = fields.map(f => {
              const props: string[] = [`    type: ${f.dataType}`];
              if (f.isPrimaryKey) {
                props.push('    primaryKey: true');
                if (idType === 'serial') props.push('    autoIncrement: true');
                if (idType === 'uuid') props.push('    defaultValue: DataTypes.UUIDV4');
              }
              if (!f.isNullable) props.push('    allowNull: false');
              if (f.attrName !== f.rawName) props.push(`    field: '${escapeJsString(f.rawName)}'`);
              return `    ${f.attrName}: {\n${props.join(',\n')}\n    }`;
            });

            const classDef = `class ${className} extends Model {\n  static initModel(sequelize) {\n    return super.init({\n${initFields.join(',\n')}\n    }, {\n      sequelize,\n      tableName: '${rawTableName}',\n      timestamps: ${timestamps},\n      underscored: ${underscored},\n      freezeTableName: ${freezeTableName},\n    });\n  }\n}\n\nmodule.exports = ${className};`;
            modelBlocks.push(classDef);
          }
        }
      }

      if (modelBlocks.length === 0) {
        setError(t('graphqltosequelize.no_types_found', 'No valid GraphQL types, interfaces, or inputs found.'));
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

      let fullOutput = header;
      if (enumCodeBlocks.length > 0) {
        fullOutput += enumCodeBlocks.join('\n\n') + '\n\n';
      }
      fullOutput += modelBlocks.join('\n\n');

      setOutput(fullOutput.trim());
      setError('');
    } catch (e: any) {
      setError(t('graphqltosequelize.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, modelStyle, language, fieldCasing, timestamps, underscored, freezeTableName, idType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltosequelize.toast_copied', 'Sequelize models copied to clipboard!'));
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
    toast.success(t('graphqltosequelize.toast_downloaded', `Downloaded models.${ext}!`));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltosequelize.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltosequelize.presets_title', 'Quick Start Presets:')}
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
                {t(`graphqltosequelize.preset_${pKey}`, pKey === 'ecommerce' ? 'E-Commerce Catalog' : pKey === 'user_auth' ? 'User Management & Auth' : 'Social Feed & Comments')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="sequelize-model-style" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltosequelize.model_style', 'Model Style')}
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
            {t('graphqltosequelize.language', 'Language')}
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
            {t('graphqltosequelize.field_casing', 'Field Casing')}
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
            <option value="original">Original Field Name</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sequelize-id-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltosequelize.id_type', 'ID Scalar Mapping')}
          </label>
          <select
            id="sequelize-id-type"
            value={idType}
            onChange={(e) => setIdType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="serial">INTEGER Auto-Increment</option>
            <option value="uuid">UUID (DataTypes.UUID)</option>
            <option value="string">STRING</option>
          </select>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label htmlFor="seq-timestamps" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              id="seq-timestamps"
              type="checkbox"
              checked={timestamps}
              onChange={(e) => setTimestamps(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltosequelize.timestamps', 'timestamps: true')}
          </label>

          <label htmlFor="seq-underscored" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              id="seq-underscored"
              type="checkbox"
              checked={underscored}
              onChange={(e) => setUnderscored(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltosequelize.underscored', 'underscored: true')}
          </label>

          <label htmlFor="seq-freezetable" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              id="seq-freezetable"
              type="checkbox"
              checked={freezeTableName}
              onChange={(e) => setFreezeTableName(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltosequelize.freeze_table_name', 'freezeTableName: true')}
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-sequelize-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltosequelize.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-sequelize-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (activePresetId) setActivePresetId(null);
            }}
            placeholder={t('graphqltosequelize.placeholder_graphql', 'Paste GraphQL SDL schema statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="sequelize-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltosequelize.output_label', 'Generated Sequelize Models')}
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
            placeholder={t('graphqltosequelize.placeholder_output', 'Generated Sequelize models will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltosequelize.about_title', 'About GraphQL SDL to Sequelize Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltosequelize.about_text', 'Convert GraphQL Schema Definition Language (SDL) types, interfaces, inputs, and enums into Sequelize v6/v7 ORM model definitions. Supports TypeScript & JavaScript, sequelize.define() vs ES6 class models, data types, primary keys, field name mappings, and table configuration options.')}
          </p>
        </div>
      </div>
    </div>
  );
}
