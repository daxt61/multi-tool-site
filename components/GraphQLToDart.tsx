import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type ConstructStyle = 'plain' | 'json_serializable' | 'freezed';
type PropertyCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';
type IdType = 'String' | 'int';
type DateTimeType = 'DateTime' | 'String';

const DART_KEYWORDS = new Set([
  'abstract', 'as', 'assert', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'covarient', 'default', 'deferred', 'do', 'dynamic', 'else', 'enum', 'export',
  'extends', 'extension', 'external', 'factory', 'false', 'final', 'finally', 'for', 'Function',
  'get', 'hide', 'if', 'implements', 'import', 'in', 'interface', 'is', 'late', 'library', 'mixin',
  'new', 'null', 'on', 'operator', 'part', 'required', 'rethrow', 'return', 'set', 'show', 'static',
  'super', 'switch', 'sync', 'this', 'throw', 'true', 'try', 'typedef', 'var', 'void', 'while', 'with', 'yield'
]);

export function GraphQLToDart({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [constructStyle, setConstructStyle] = useState<ConstructStyle>(initialData?.constructStyle || 'plain');
  const [propertyCasing, setPropertyCasing] = useState<PropertyCasing>(initialData?.propertyCasing || 'camelCase');
  const [useNullableTypes, setUseNullableTypes] = useState<boolean>(initialData?.useNullableTypes !== undefined ? initialData.useNullableTypes : true);
  const [idType, setIdType] = useState<IdType>(initialData?.idType || 'String');
  const [dateTimeType, setDateTimeType] = useState<DateTimeType>(initialData?.dateTimeType || 'DateTime');
  const [includeCopyWith, setIncludeCopyWith] = useState<boolean>(initialData?.includeCopyWith !== undefined ? initialData.includeCopyWith : true);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      constructStyle,
      propertyCasing,
      useNullableTypes,
      idType,
      dateTimeType,
      includeCopyWith,
    });
  }, [input, output, constructStyle, propertyCasing, useNullableTypes, idType, dateTimeType, includeCopyWith, onStateChange]);

  const PRESETS = {
    ecommerce: `# E-Commerce Catalog Schema
type Category {
  id: ID!
  name: String!
  slug: String!
  parent: Category
}

type Product {
  id: ID!
  title: String!
  description: String
  price: Float!
  sku: String!
  isActive: Boolean!
  category: Category!
  tags: [String!]!
  createdAt: DateTime!
}

input CreateProductInput {
  title: String!
  description: String
  price: Float!
  categoryId: ID!
  tags: [String!]
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}`,
    user_auth: `# User Management & Auth Schema
enum Role {
  ADMIN
  MANAGER
  MEMBER
  GUEST
}

interface Node {
  id: ID!
}

type User implements Node {
  id: ID!
  email: String!
  fullName: String!
  role: Role!
  isVerified: Boolean!
  lastLogin: DateTime
  metadata: JSON
}

input RegisterUserInput {
  email: String!
  password: String!
  fullName: String!
  role: Role
}

union AuthResult = User | AuthError

type AuthError {
  code: String!
  message: String!
}`,
    social_feed: `# Social Feed & Comments Schema
type User {
  id: ID!
  username: String!
  avatarUrl: String
}

type Comment {
  id: ID!
  author: User!
  content: String!
  createdAt: DateTime!
  likesCount: Int!
}

type Post {
  id: ID!
  author: User!
  title: String!
  body: String!
  comments: [Comment!]!
  isPublished: Boolean!
}

union FeedItem = Post | Comment`
  };

  const applyCasing = (str: string, casing: PropertyCasing): string => {
    if (casing === 'original') return str;

    const words = str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ')
      .trim()
      .split(/\s+/);

    if (words.length === 0 || !words[0]) return str;

    if (casing === 'PascalCase') {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }
    if (casing === 'snake_case') {
      return words.map(w => w.toLowerCase()).join('_');
    }
    if (casing === 'camelCase') {
      return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }

    return str;
  };

  const sanitizeDartIdentifier = (name: string): string => {
    let clean = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!/^[a-zA-Z_]/.test(clean)) {
      clean = `field_${clean}`;
    }
    if (DART_KEYWORDS.has(clean)) {
      return `${clean}_`;
    }
    return clean;
  };

  const mapGqlTypeToDart = (
    gqlTypeStr: string,
    customScalars: Set<string>
  ): { dartType: string; isNonNull: boolean; isList: boolean; baseType: string } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const innerGql = typeWithoutOuterBang.slice(1, -1).trim();
      const innerConverted = mapGqlTypeToDart(innerGql, customScalars);
      let innerType = innerConverted.dartType;
      if (!innerConverted.isNonNull && useNullableTypes) {
        innerType = `${innerType}?`;
      }
      return { dartType: `List<${innerType}>`, isNonNull, isList: true, baseType: innerConverted.baseType };
    }

    let base = typeWithoutOuterBang;
    let dartType = 'dynamic';

    if (base === 'String') dartType = 'String';
    else if (base === 'Int') dartType = 'int';
    else if (base === 'Float') dartType = 'double';
    else if (base === 'Boolean') dartType = 'bool';
    else if (base === 'ID') dartType = idType;
    else if (base === 'DateTime' || base === 'Date' || base === 'Time' || base === 'Timestamp') {
      dartType = dateTimeType;
    } else if (base === 'JSON' || base === 'JSONObject' || base === 'JSONSchema') {
      dartType = 'Map<String, dynamic>';
    } else if (customScalars.has(base)) {
      dartType = 'dynamic';
    } else {
      dartType = sanitizeDartIdentifier(base);
    }

    return { dartType, isNonNull, isList: false, baseType: dartType };
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
        .replace(/#.*$/gm, '')
        .replace(/"""[\s\S]*?"""/g, '')
        .replace(/"[\s\S]*?"/g, (m: string) => m.includes('\n') ? '""' : m);

      const customScalars = new Set<string>();
      const scalarRegex = /scalar\s+([A-Za-z0-9_]+)/g;
      let scalarMatch: RegExpExecArray | null;
      while ((scalarMatch = scalarRegex.exec(cleanInput)) !== null) {
        if (scalarMatch[1]) customScalars.add(scalarMatch[1]);
      }

      const imports = new Set<string>();
      if (constructStyle === 'json_serializable') {
        imports.add("import 'package:json_annotation/json_annotation.dart';");
      } else if (constructStyle === 'freezed') {
        imports.add("import 'package:freezed_annotation/freezed_annotation.dart';");
      }

      const outputBlocks: string[] = [];

      // 1. Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const rawEnumName = enumMatch[1];
        const enumName = sanitizeDartIdentifier(rawEnumName);
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);

        let block = '';
        if (constructStyle === 'json_serializable' || constructStyle === 'freezed') {
          block += `@JsonEnum()\n`;
        }

        block += `enum ${enumName} {\n`;
        enumValues.forEach((v, idx) => {
          const valCased = sanitizeDartIdentifier(applyCasing(v, propertyCasing));
          const comma = idx < enumValues.length - 1 ? ',' : ';';
          let anno = '';
          if ((constructStyle === 'json_serializable' || constructStyle === 'freezed') && v !== valCased) {
            anno = `@JsonValue('${v}') `;
          }
          block += `  ${anno}${valCased}${comma}\n`;
        });
        block += `}`;
        outputBlocks.push(block);
      }

      // 2. Unions
      const unionRegex = /union\s+([A-Za-z0-9_]+)\s*=\s*([^;\n]+)/g;
      let unionMatch: RegExpExecArray | null;
      while ((unionMatch = unionRegex.exec(cleanInput)) !== null) {
        const unionName = sanitizeDartIdentifier(unionMatch[1]);
        const typesList = unionMatch[2]
          .split('|')
          .map(t => t.trim())
          .filter(Boolean);

        let block = '';
        if (constructStyle === 'freezed') {
          block += `@freezed\n`;
          block += `class ${unionName} with _\$${unionName} {\n`;
          typesList.forEach(tName => {
            const memberClass = sanitizeDartIdentifier(tName);
            const constructorName = memberClass.charAt(0).toLowerCase() + memberClass.slice(1);
            block += `  const factory ${unionName}.${constructorName}(${memberClass} data) = _${unionName}${memberClass};\n`;
          });
          block += `\n  factory ${unionName}.fromJson(Map<String, dynamic> json) => _\$${unionName}FromJson(json);\n`;
          block += `}`;
        } else {
          block += `abstract class ${unionName} {}\n`;
        }
        outputBlocks.push(block);
      }

      // 3. Custom Scalars
      customScalars.forEach(scalarName => {
        const typeName = sanitizeDartIdentifier(scalarName);
        outputBlocks.push(`typedef ${typeName} = dynamic;`);
      });

      // 4. Objects, Interfaces, Inputs
      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+([^{]+))?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const kind = structMatch[1];
        const rawTypeName = structMatch[2];
        const implementsClause = structMatch[3];
        const body = structMatch[4];

        const dartTypeName = sanitizeDartIdentifier(rawTypeName);
        const fileName = rawTypeName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        let inheritance = '';
        if (implementsClause) {
          const interfaces = implementsClause
            .split('&')
            .map(i => sanitizeDartIdentifier(i.trim()))
            .filter(Boolean);
          if (interfaces.length > 0) {
            inheritance = ` implements ${interfaces.join(', ')}`;
          }
        }

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        const fields: Array<{
          rawFieldName: string;
          dartPropName: string;
          dartTypeStr: string;
          isNullable: boolean;
          baseType: string;
        }> = [];

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();
          if (!rawFieldName || !rawTypeStr) return;

          const propCased = applyCasing(rawFieldName, propertyCasing);
          const dartPropName = sanitizeDartIdentifier(propCased);
          const { dartType, isNonNull, isList, baseType } = mapGqlTypeToDart(rawTypeStr, customScalars);

          const isNullable = !isNonNull && useNullableTypes && !isList;
          let finalType = dartType;
          if (isNullable) {
            finalType = `${dartType}?`;
          }

          fields.push({
            rawFieldName,
            dartPropName,
            dartTypeStr: finalType,
            isNullable,
            baseType,
          });
        });

        if (kind === 'interface') {
          let block = `abstract class ${dartTypeName}${inheritance} {\n`;
          fields.forEach(f => {
            block += `  ${f.dartTypeStr} get ${f.dartPropName};\n`;
          });
          block += `}`;
          outputBlocks.push(block);
        } else if (constructStyle === 'freezed') {
          let block = '';
          block += `part '${fileName}.freezed.dart';\n`;
          block += `part '${fileName}.g.dart';\n\n`;
          block += `@freezed\n`;
          block += `class ${dartTypeName} with _\$${dartTypeName} {\n`;
          block += `  const factory ${dartTypeName}({\n`;
          fields.forEach(f => {
            const requiredStr = f.isNullable ? '' : 'required ';
            const jsonKeyStr = f.rawFieldName !== f.dartPropName ? `@JsonKey(name: '${f.rawFieldName}') ` : '';
            block += `    ${jsonKeyStr}${requiredStr}${f.dartTypeStr} ${f.dartPropName},\n`;
          });
          block += `  }) = _${dartTypeName};\n\n`;
          block += `  factory ${dartTypeName}.fromJson(Map<String, dynamic> json) => _\$${dartTypeName}FromJson(json);\n`;
          block += `}`;
          outputBlocks.push(block);
        } else if (constructStyle === 'json_serializable') {
          let block = '';
          block += `part '${fileName}.g.dart';\n\n`;
          block += `@JsonSerializable()\n`;
          block += `class ${dartTypeName}${inheritance} {\n`;
          fields.forEach(f => {
            if (f.rawFieldName !== f.dartPropName) {
              block += `  @JsonKey(name: '${f.rawFieldName}')\n`;
            }
            block += `  final ${f.dartTypeStr} ${f.dartPropName};\n`;
          });
          block += `\n  const ${dartTypeName}({\n`;
          fields.forEach(f => {
            const requiredStr = f.isNullable ? '' : 'required ';
            block += `    ${requiredStr}this.${f.dartPropName},\n`;
          });
          block += `  });\n\n`;
          block += `  factory ${dartTypeName}.fromJson(Map<String, dynamic> json) => _\$${dartTypeName}FromJson(json);\n`;
          block += `  Map<String, dynamic> toJson() => _\$${dartTypeName}ToJson(this);\n`;
          block += `}`;
          outputBlocks.push(block);
        } else {
          // Plain Dart Class
          let block = `class ${dartTypeName}${inheritance} {\n`;
          fields.forEach(f => {
            block += `  final ${f.dartTypeStr} ${f.dartPropName};\n`;
          });
          block += `\n  const ${dartTypeName}({\n`;
          fields.forEach(f => {
            const requiredStr = f.isNullable ? '' : 'required ';
            block += `    ${requiredStr}this.${f.dartPropName},\n`;
          });
          block += `  });\n\n`;

          // fromJson
          block += `  factory ${dartTypeName}.fromJson(Map<String, dynamic> json) {\n`;
          block += `    return ${dartTypeName}(\n`;
          fields.forEach(f => {
            const key = f.rawFieldName;
            if (f.dartTypeStr.startsWith('DateTime')) {
              block += `      ${f.dartPropName}: json['${key}'] != null ? DateTime.parse(json['${key}'] as String) : ${f.isNullable ? 'null' : 'DateTime.now()'},\n`;
            } else if (f.dartTypeStr.startsWith('double')) {
              block += `      ${f.dartPropName}: (json['${key}'] as num?)${f.isNullable ? '?.toDouble()' : '!.toDouble()'},\n`;
            } else if (f.dartTypeStr.startsWith('int')) {
              block += `      ${f.dartPropName}: json['${key}'] as int${f.isNullable ? '?' : ''},\n`;
            } else if (f.dartTypeStr.startsWith('bool')) {
              block += `      ${f.dartPropName}: json['${key}'] as bool${f.isNullable ? '?' : ''},\n`;
            } else if (f.dartTypeStr.startsWith('List')) {
              block += `      ${f.dartPropName}: (json['${key}'] as List<dynamic>?)?.map((e) => e as String).toList()${f.isNullable ? '' : ' ?? []'},\n`;
            } else {
              block += `      ${f.dartPropName}: json['${key}'] as ${f.dartTypeStr.replace('?', '')}${f.isNullable ? '?' : ''},\n`;
            }
          });
          block += `    );\n  }\n\n`;

          // toJson
          block += `  Map<String, dynamic> toJson() {\n`;
          block += `    return {\n`;
          fields.forEach(f => {
            const key = f.rawFieldName;
            if (f.dartTypeStr.startsWith('DateTime')) {
              block += `      '${key}': ${f.dartPropName}${f.isNullable ? '?' : ''}.toIso8601String(),\n`;
            } else {
              block += `      '${key}': ${f.dartPropName},\n`;
            }
          });
          block += `    };\n  }\n`;

          // copyWith
          if (includeCopyWith) {
            block += `\n  ${dartTypeName} copyWith({\n`;
            fields.forEach(f => {
              block += `    ${f.dartTypeStr}? ${f.dartPropName},\n`;
            });
            block += `  }) {\n`;
            block += `    return ${dartTypeName}(\n`;
            fields.forEach(f => {
              block += `      ${f.dartPropName}: ${f.dartPropName} ?? this.${f.dartPropName},\n`;
            });
            block += `    );\n  }\n`;
          }

          block += `}`;
          outputBlocks.push(block);
        }
      }

      if (outputBlocks.length === 0) {
        setError(t('graphqltodart.no_types_found', 'No valid GraphQL types, interfaces, inputs, or enums found.'));
        setOutput('');
        return;
      }

      let fullOutput = '';
      if (imports.size > 0) {
        fullOutput += Array.from(imports).sort().join('\n') + '\n\n';
      }

      fullOutput += outputBlocks.join('\n\n');
      setOutput(fullOutput);
      setError('');
    } catch (e: any) {
      setError(t('graphqltodart.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, constructStyle, propertyCasing, useNullableTypes, idType, dateTimeType, includeCopyWith, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltodart.toast_copied', 'Dart model classes copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('graphqltodart.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'models.dart';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded models.dart!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltodart.preset_loaded', 'Loaded GraphQL preset!'));
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
        activeElement?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        if (handlersRef.current.output) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltodart.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            aria-pressed={activePresetId === 'ecommerce'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'ecommerce'
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200'
            }`}
          >
            {t('graphqltodart.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            aria-pressed={activePresetId === 'user_auth'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'user_auth'
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200'
            }`}
          >
            {t('graphqltodart.preset_user_auth', 'User Management & Auth')}
          </button>
          <button
            onClick={() => loadPreset('social_feed')}
            aria-pressed={activePresetId === 'social_feed'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'social_feed'
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200'
            }`}
          >
            {t('graphqltodart.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="construct-style" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltodart.construct_style', 'Model Construct Style')}
            </label>
            <select
              id="construct-style"
              value={constructStyle}
              onChange={(e) => setConstructStyle(e.target.value as ConstructStyle)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="plain">Plain Dart Class (fromJson/toJson)</option>
              <option value="json_serializable">json_serializable (@JsonSerializable)</option>
              <option value="freezed">Freezed (@freezed)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="property-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltodart.property_casing', 'Property Casing')}
            </label>
            <select
              id="property-casing"
              value={propertyCasing}
              onChange={(e) => setPropertyCasing(e.target.value as PropertyCasing)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="camelCase">camelCase (Dart default)</option>
              <option value="snake_case">snake_case</option>
              <option value="PascalCase">PascalCase</option>
              <option value="original">Original</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="id-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltodart.id_type', 'ID Scalar Mapping')}
            </label>
            <select
              id="id-type"
              value={idType}
              onChange={(e) => setIdType(e.target.value as IdType)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="String">String</option>
              <option value="int">int</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="datetime-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltodart.datetime_type', 'DateTime Mapping')}
            </label>
            <select
              id="datetime-type"
              value={dateTimeType}
              onChange={(e) => setDateTimeType(e.target.value as DateTimeType)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="DateTime">DateTime</option>
              <option value="String">String</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                checked={useNullableTypes}
                onChange={(e) => setUseNullableTypes(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              Dart Nullable (`T?`)
            </label>

            {constructStyle === 'plain' && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={includeCopyWith}
                  onChange={(e) => setIncludeCopyWith(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                Include `copyWith` Method
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-dart-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltodart.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-dart-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={t('graphqltodart.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="dart-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltodart.output_label', 'Generated Dart Code')}
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
            id="dart-output"
            value={output}
            readOnly
            placeholder={t('graphqltodart.placeholder_output', 'Generated Dart classes will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltodart.about_title', 'About GraphQL SDL to Dart Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltodart.about_text', 'Convert GraphQL Schema Definition Language (SDL) types, interfaces, inputs, enums, and unions into strongly-typed Dart model classes with json_serializable, freezed, or plain fromJson/toJson factories.')}
          </p>
        </div>
      </div>
    </div>
  );
}
