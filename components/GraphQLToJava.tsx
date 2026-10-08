import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type ConstructKind = 'class' | 'record';
type JsonAnnotation = 'jackson' | 'gson' | 'none';
type PropertyCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';
type IdType = 'String' | 'UUID' | 'Long';
type DateTimeType = 'Instant' | 'LocalDateTime' | 'Date' | 'String';

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
  'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
  'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
  'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
  'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
  'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'record', 'var',
  'sealed', 'permits', 'yield'
]);

export function GraphQLToJava({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [packageName, setPackageName] = useState(initialData?.packageName || 'com.example.graphql.model');
  const [constructKind, setConstructKind] = useState<ConstructKind>(initialData?.constructKind || 'class');
  const [annotationKind, setAnnotationKind] = useState<JsonAnnotation>(initialData?.annotationKind || 'jackson');
  const [useLombok, setUseLombok] = useState<boolean>(initialData?.useLombok !== undefined ? initialData.useLombok : true);
  const [propertyCasing, setPropertyCasing] = useState<PropertyCasing>(initialData?.propertyCasing || 'camelCase');
  const [idType, setIdType] = useState<IdType>(initialData?.idType || 'String');
  const [dateTimeType, setDateTimeType] = useState<DateTimeType>(initialData?.dateTimeType || 'Instant');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      packageName,
      constructKind,
      annotationKind,
      useLombok,
      propertyCasing,
      idType,
      dateTimeType,
    });
  }, [input, output, packageName, constructKind, annotationKind, useLombok, propertyCasing, idType, dateTimeType, onStateChange]);

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

  const escapeJavaString = (str: string): string => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  };

  const sanitizeJavaIdentifier = (name: string): string => {
    let clean = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!/^[a-zA-Z_]/.test(clean)) {
      clean = `_${clean}`;
    }
    if (JAVA_KEYWORDS.has(clean.toLowerCase())) {
      return `${clean}_`;
    }
    return clean;
  };

  const mapGqlTypeToJava = (
    gqlTypeStr: string,
    customScalars: Set<string>
  ): { javaType: string; isNonNull: boolean; isList: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const innerGql = typeWithoutOuterBang.slice(1, -1).trim();
      const innerConverted = mapGqlTypeToJava(innerGql, customScalars);
      return { javaType: `List<${innerConverted.javaType}>`, isNonNull, isList: true };
    }

    let base = typeWithoutOuterBang;
    let javaType = 'Object';

    if (base === 'String') javaType = 'String';
    else if (base === 'Int') javaType = 'Integer';
    else if (base === 'Float') javaType = 'Double';
    else if (base === 'Boolean') javaType = 'Boolean';
    else if (base === 'ID') javaType = idType;
    else if (base === 'DateTime' || base === 'Date' || base === 'Time' || base === 'Timestamp') {
      javaType = dateTimeType;
    } else if (base === 'JSON' || base === 'JSONObject' || base === 'JSONSchema') {
      javaType = 'Map<String, Object>';
    } else if (customScalars.has(base)) {
      javaType = 'Object';
    } else {
      javaType = sanitizeJavaIdentifier(base);
    }

    return { javaType, isNonNull, isList: false };
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
      imports.add('import java.util.List;');

      if (idType === 'UUID') imports.add('import java.util.UUID;');
      if (dateTimeType === 'Instant') imports.add('import java.time.Instant;');
      if (dateTimeType === 'LocalDateTime') imports.add('import java.time.LocalDateTime;');
      if (dateTimeType === 'Date') imports.add('import java.util.Date;');

      if (annotationKind === 'jackson') {
        imports.add('import com.fasterxml.jackson.annotation.JsonProperty;');
        imports.add('import com.fasterxml.jackson.annotation.JsonSubTypes;');
        imports.add('import com.fasterxml.jackson.annotation.JsonTypeInfo;');
      } else if (annotationKind === 'gson') {
        imports.add('import com.google.gson.annotations.SerializedName;');
      }

      if (constructKind === 'class' && useLombok) {
        imports.add('import lombok.Data;');
        imports.add('import lombok.NoArgsConstructor;');
        imports.add('import lombok.AllArgsConstructor;');
        imports.add('import lombok.Builder;');
      }

      const outputBlocks: string[] = [];

      // 1. Process Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const enumName = sanitizeJavaIdentifier(enumMatch[1]);
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);

        let block = `public enum ${enumName} {\n`;
        enumValues.forEach((v, idx) => {
          const valCased = sanitizeJavaIdentifier(v);
          const comma = idx < enumValues.length - 1 ? ',' : ';';
          let anno = '';
          if (annotationKind === 'jackson' && v !== valCased) {
            anno = `@JsonProperty("${escapeJavaString(v)}") `;
          } else if (annotationKind === 'gson' && v !== valCased) {
            anno = `@SerializedName("${escapeJavaString(v)}") `;
          }
          block += `    ${anno}${valCased}${comma}\n`;
        });
        block += `}`;
        outputBlocks.push(block);
      }

      // 2. Process Unions
      const unionRegex = /union\s+([A-Za-z0-9_]+)\s*=\s*([^;\n]+)/g;
      let unionMatch: RegExpExecArray | null;
      while ((unionMatch = unionRegex.exec(cleanInput)) !== null) {
        const unionName = sanitizeJavaIdentifier(unionMatch[1]);
        const typesList = unionMatch[2]
          .split('|')
          .map(t => t.trim())
          .filter(Boolean);

        let block = '';
        if (annotationKind === 'jackson') {
          block += `@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "__typename")\n`;
          block += `@JsonSubTypes({\n`;
          block += typesList.map(tName => `    @JsonSubTypes.Type(value = ${sanitizeJavaIdentifier(tName)}.class, name = "${escapeJavaString(tName)}")`).join(',\n') + '\n';
          block += `})\n`;
        }

        block += `public interface ${unionName} {\n}`;
        outputBlocks.push(block);
      }

      // 3. Process Object Types, Interfaces, Inputs
      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+([^{]+))?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const kind = structMatch[1];
        const rawTypeName = structMatch[2];
        const implementsClause = structMatch[3];
        const body = structMatch[4];

        const javaTypeName = sanitizeJavaIdentifier(rawTypeName);

        let inheritance = '';
        if (implementsClause) {
          const interfaces = implementsClause
            .split('&')
            .map(i => sanitizeJavaIdentifier(i.trim()))
            .filter(Boolean);
          if (interfaces.length > 0) {
            inheritance = ` implements ${interfaces.join(', ')}`;
          }
        }

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        if (kind === 'interface') {
          let block = `public interface ${javaTypeName}${inheritance} {\n`;
          lines.forEach(line => {
            const cleanLine = line.replace(/\([^)]*\)/, '');
            const colonIdx = cleanLine.indexOf(':');
            if (colonIdx === -1) return;

            const rawFieldName = cleanLine.substring(0, colonIdx).trim();
            const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();
            if (!rawFieldName || !rawTypeStr) return;

            const propCased = applyCasing(rawFieldName, propertyCasing);
            const javaPropName = sanitizeJavaIdentifier(propCased);
            const getterName = `get${javaPropName.charAt(0).toUpperCase()}${javaPropName.slice(1)}`;
            const { javaType } = mapGqlTypeToJava(rawTypeStr, customScalars);

            block += `    ${javaType} ${getterName}();\n`;
          });
          block += `}`;
          outputBlocks.push(block);
        } else if (constructKind === 'record') {
          let block = `public record ${javaTypeName}(\n`;
          const paramLines: string[] = [];

          lines.forEach(line => {
            const cleanLine = line.replace(/\([^)]*\)/, '');
            const colonIdx = cleanLine.indexOf(':');
            if (colonIdx === -1) return;

            const rawFieldName = cleanLine.substring(0, colonIdx).trim();
            const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();
            if (!rawFieldName || !rawTypeStr) return;

            const propCased = applyCasing(rawFieldName, propertyCasing);
            const javaPropName = sanitizeJavaIdentifier(propCased);
            const { javaType } = mapGqlTypeToJava(rawTypeStr, customScalars);

            let fieldAnno = '';
            if (annotationKind === 'jackson') {
              fieldAnno = `@JsonProperty("${escapeJavaString(rawFieldName)}") `;
            } else if (annotationKind === 'gson') {
              fieldAnno = `@SerializedName("${escapeJavaString(rawFieldName)}") `;
            }

            paramLines.push(`    ${fieldAnno}${javaType} ${javaPropName}`);
          });

          block += paramLines.join(',\n');
          block += `)${inheritance} {}`;
          outputBlocks.push(block);
        } else {
          let block = '';
          if (useLombok) {
            block += `@Data\n@NoArgsConstructor\n@AllArgsConstructor\n@Builder\n`;
          }
          block += `public class ${javaTypeName}${inheritance} {\n`;

          const fieldDecls: string[] = [];
          const methods: string[] = [];

          lines.forEach(line => {
            const cleanLine = line.replace(/\([^)]*\)/, '');
            const colonIdx = cleanLine.indexOf(':');
            if (colonIdx === -1) return;

            const rawFieldName = cleanLine.substring(0, colonIdx).trim();
            const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();
            if (!rawFieldName || !rawTypeStr) return;

            const propCased = applyCasing(rawFieldName, propertyCasing);
            const javaPropName = sanitizeJavaIdentifier(propCased);
            const { javaType } = mapGqlTypeToJava(rawTypeStr, customScalars);

            let fieldAnno = '';
            if (annotationKind === 'jackson') {
              fieldAnno = `    @JsonProperty("${escapeJavaString(rawFieldName)}")\n`;
            } else if (annotationKind === 'gson') {
              fieldAnno = `    @SerializedName("${escapeJavaString(rawFieldName)}")\n`;
            }

            fieldDecls.push(`${fieldAnno}    private ${javaType} ${javaPropName};`);

            if (!useLombok) {
              const capProp = javaPropName.charAt(0).toUpperCase() + javaPropName.slice(1);
              const getter = `    public ${javaType} get${capProp}() {\n        return ${javaPropName};\n    }`;
              const setter = `    public void set${capProp}(${javaType} ${javaPropName}) {\n        this.${javaPropName} = ${javaPropName};\n    }`;
              methods.push(getter, setter);
            }
          });

          block += fieldDecls.join('\n\n') + '\n';
          if (!useLombok && methods.length > 0) {
            block += '\n' + methods.join('\n\n') + '\n';
          }
          block += `}`;
          outputBlocks.push(block);
        }
      }

      if (outputBlocks.length === 0) {
        setError(t('graphqltojava.no_types_found', 'No valid GraphQL types, interfaces, inputs, or enums found.'));
        setOutput('');
        return;
      }

      let fullOutput = '';
      if (packageName.trim()) {
        fullOutput += `package ${packageName.trim()};\n\n`;
      }

      if (imports.size > 0) {
        fullOutput += Array.from(imports).sort().join('\n') + '\n\n';
      }

      fullOutput += outputBlocks.join('\n\n');
      setOutput(fullOutput);
      setError('');
    } catch (e: any) {
      setError(t('graphqltojava.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, packageName, constructKind, annotationKind, useLombok, propertyCasing, idType, dateTimeType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltojava.toast_copied', 'Java classes copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('graphqltojava.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GraphQLModels.java';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded GraphQLModels.java!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltojava.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltojava.presets_title', 'Quick Start Presets:')}
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
            {t('graphqltojava.preset_ecommerce', 'E-Commerce Catalog')}
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
            {t('graphqltojava.preset_user_auth', 'User Management & Auth')}
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
            {t('graphqltojava.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="package-name" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltojava.package_name', 'Package Name')}
            </label>
            <input
              id="package-name"
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="com.example.graphql.model"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="construct-kind" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltojava.construct_kind', 'Java Construct')}
            </label>
            <select
              id="construct-kind"
              value={constructKind}
              onChange={(e) => setConstructKind(e.target.value as ConstructKind)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="class">Java Class (POJO)</option>
              <option value="record">Java 17+ Record</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="annotation-kind" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltojava.json_annotations', 'JSON Annotations')}
            </label>
            <select
              id="annotation-kind"
              value={annotationKind}
              onChange={(e) => setAnnotationKind(e.target.value as JsonAnnotation)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="jackson">Jackson (@JsonProperty)</option>
              <option value="gson">Gson (@SerializedName)</option>
              <option value="none">None</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="property-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltojava.property_casing', 'Property Casing')}
            </label>
            <select
              id="property-casing"
              value={propertyCasing}
              onChange={(e) => setPropertyCasing(e.target.value as PropertyCasing)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="camelCase">camelCase (Java default)</option>
              <option value="snake_case">snake_case</option>
              <option value="PascalCase">PascalCase</option>
              <option value="original">Original</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mr-2">ID Scalar:</span>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value as IdType)}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                <option value="String">String</option>
                <option value="UUID">java.util.UUID</option>
                <option value="Long">Long</option>
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mr-2">DateTime Scalar:</span>
              <select
                value={dateTimeType}
                onChange={(e) => setDateTimeType(e.target.value as DateTimeType)}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                <option value="Instant">java.time.Instant</option>
                <option value="LocalDateTime">java.time.LocalDateTime</option>
                <option value="Date">java.util.Date</option>
                <option value="String">String</option>
              </select>
            </div>

            {constructKind === 'class' && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={useLombok}
                  onChange={(e) => setUseLombok(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                Lombok (@Data, @NoArgsConstructor, @Builder)
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
              <label htmlFor="graphql-java-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltojava.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-java-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={t('graphqltojava.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="java-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltojava.output_label', 'Generated Java Code')}
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
            id="java-output"
            value={output}
            readOnly
            placeholder={t('graphqltojava.placeholder_output', 'Generated Java classes will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltojava.about_title', 'About GraphQL SDL to Java Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltojava.about_text', 'Convert GraphQL Schema Definition Language (SDL) types, interfaces, inputs, enums, and unions into strongly-typed Java POJOs or Java 17+ Records with Jackson, Gson, or Lombok annotations.')}
          </p>
        </div>
      </div>
    </div>
  );
}
