import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type ScalaVersion = 'scala3' | 'scala2';
type JsonFramework = 'none' | 'circe' | 'play' | 'upickle' | 'jackson';
type PropertyCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';
type IdType = 'String' | 'Long' | 'UUID';
type DateTimeType = 'String' | 'Instant' | 'ZonedDateTime' | 'OffsetDateTime';

const SCALA_KEYWORDS = new Set([
  'abstract', 'case', 'catch', 'class', 'def', 'do', 'else', 'extends', 'false', 'final',
  'finally', 'for', 'forSome', 'if', 'implicit', 'import', 'lazy', 'match', 'new', 'null',
  'object', 'override', 'package', 'private', 'protected', 'return', 'sealed', 'super',
  'this', 'throw', 'trait', 'try', 'true', 'type', 'val', 'var', 'while', 'with', 'yield',
  'given', 'using', 'opaque', 'inline', 'enum', 'open', 'transparent', 'infix', 'derives'
]);

export function GraphQLToScala({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [packageName, setPackageName] = useState(initialData?.packageName || 'com.example.graphql.model');
  const [scalaVersion, setScalaVersion] = useState<ScalaVersion>(initialData?.scalaVersion || 'scala3');
  const [jsonFramework, setJsonFramework] = useState<JsonFramework>(initialData?.jsonFramework || 'circe');
  const [propertyCasing, setPropertyCasing] = useState<PropertyCasing>(initialData?.propertyCasing || 'camelCase');
  const [useOptionForNullable, setUseOptionForNullable] = useState<boolean>(initialData?.useOptionForNullable !== undefined ? initialData.useOptionForNullable : true);
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
      scalaVersion,
      jsonFramework,
      propertyCasing,
      useOptionForNullable,
      idType,
      dateTimeType,
    });
  }, [input, output, packageName, scalaVersion, jsonFramework, propertyCasing, useOptionForNullable, idType, dateTimeType, onStateChange]);

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

  const escapeScalaString = (str: string): string => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\$/g, '\\$');
  };

  const sanitizePackageName = (name: string): string => {
    return name
      .replace(/[^\w.]/g, '')
      .replace(/^\.+|\.+$|\.(?=\.)/g, '');
  };

  const sanitizeScalaIdentifier = (name: string): string => {
    let clean = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!/^[a-zA-Z_]/.test(clean)) {
      clean = `_${clean}`;
    }
    if (SCALA_KEYWORDS.has(clean.toLowerCase())) {
      return `\`${clean}\``;
    }
    return clean;
  };

  const mapGqlTypeToScala = (
    gqlTypeStr: string,
    customScalars: Set<string>
  ): { scalaType: string; isNonNull: boolean; isList: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const innerGql = typeWithoutOuterBang.slice(1, -1).trim();
      const innerConverted = mapGqlTypeToScala(innerGql, customScalars);
      let innerType = innerConverted.scalaType;
      if (!innerConverted.isNonNull && useOptionForNullable) {
        innerType = `Option[${innerType}]`;
      }
      return { scalaType: `List[${innerType}]`, isNonNull, isList: true };
    }

    let base = typeWithoutOuterBang;
    let scalaType = 'Any';

    if (base === 'String') scalaType = 'String';
    else if (base === 'Int') scalaType = 'Int';
    else if (base === 'Float') scalaType = 'Double';
    else if (base === 'Boolean') scalaType = 'Boolean';
    else if (base === 'ID') scalaType = idType;
    else if (base === 'DateTime' || base === 'Date' || base === 'Time' || base === 'Timestamp') {
      scalaType = dateTimeType;
    } else if (base === 'JSON' || base === 'JSONObject' || base === 'JSONSchema') {
      scalaType = 'Map[String, Any]';
    } else if (customScalars.has(base)) {
      scalaType = 'String';
    } else {
      scalaType = sanitizeScalaIdentifier(base);
    }

    return { scalaType, isNonNull, isList: false };
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
      if (idType === 'UUID') imports.add('import java.util.UUID');
      if (dateTimeType === 'Instant') imports.add('import java.time.Instant');
      if (dateTimeType === 'ZonedDateTime') imports.add('import java.time.ZonedDateTime');
      if (dateTimeType === 'OffsetDateTime') imports.add('import java.time.OffsetDateTime');

      if (jsonFramework === 'circe') {
        imports.add('import io.circe._');
        imports.add('import io.circe.generic.JsonCodec');
      } else if (jsonFramework === 'play') {
        imports.add('import play.api.libs.json._');
      } else if (jsonFramework === 'upickle') {
        imports.add('import upickle.default._');
      } else if (jsonFramework === 'jackson') {
        imports.add('import com.fasterxml.jackson.annotation.JsonProperty');
      }

      const outputBlocks: string[] = [];

      // 1. Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const enumName = sanitizeScalaIdentifier(enumMatch[1]);
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);

        let block = '';
        if (scalaVersion === 'scala3') {
          if (jsonFramework === 'circe') block += '@JsonCodec\n';
          block += `enum ${enumName}:\n`;
          enumValues.forEach(v => {
            const valCased = sanitizeScalaIdentifier(v);
            let anno = '';
            if (jsonFramework === 'circe' && v !== valCased) {
              anno = `  @key("${escapeScalaString(v)}")\n`;
            } else if (jsonFramework === 'upickle' && v !== valCased) {
              anno = `  @key("${escapeScalaString(v)}")\n`;
            }
            block += `${anno}  case ${valCased}\n`;
          });
        } else {
          // Scala 2.13
          block += `sealed trait ${enumName}\n`;
          block += `object ${enumName} {\n`;
          enumValues.forEach(v => {
            const valCased = sanitizeScalaIdentifier(v);
            block += `  case object ${valCased} extends ${enumName}\n`;
          });
          block += `}`;
        }
        outputBlocks.push(block.trimEnd());
      }

      // 2. Unions
      const unionRegex = /union\s+([A-Za-z0-9_]+)\s*=\s*([^;\n]+)/g;
      let unionMatch: RegExpExecArray | null;
      while ((unionMatch = unionRegex.exec(cleanInput)) !== null) {
        const unionName = sanitizeScalaIdentifier(unionMatch[1]);
        const typesList = unionMatch[2]
          .split('|')
          .map(t => sanitizeScalaIdentifier(t.trim()))
          .filter(Boolean);

        let block = '';
        if (scalaVersion === 'scala3') {
          block += `type ${unionName} = ${typesList.join(' | ')}`;
        } else {
          block += `sealed trait ${unionName}`;
        }
        outputBlocks.push(block);
      }

      // 3. Custom Scalars
      customScalars.forEach(scalarName => {
        const typeName = sanitizeScalaIdentifier(scalarName);
        if (scalaVersion === 'scala3') {
          outputBlocks.push(`opaque type ${typeName} = String`);
        } else {
          outputBlocks.push(`type ${typeName} = String`);
        }
      });

      // 4. Object Types, Interfaces, Inputs
      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+([^{]+))?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const kind = structMatch[1];
        const rawTypeName = structMatch[2];
        const implementsClause = structMatch[3];
        const body = structMatch[4];

        const scalaTypeName = sanitizeScalaIdentifier(rawTypeName);

        let extendsClause = '';
        if (implementsClause) {
          const interfaces = implementsClause
            .split('&')
            .map(i => sanitizeScalaIdentifier(i.trim()))
            .filter(Boolean);
          if (interfaces.length > 0) {
            extendsClause = ` extends ${interfaces.join(' with ')}`;
          }
        }

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        if (kind === 'interface') {
          let block = `trait ${scalaTypeName}${extendsClause} {\n`;
          lines.forEach(line => {
            const cleanLine = line.replace(/\([^)]*\)/, '');
            const colonIdx = cleanLine.indexOf(':');
            if (colonIdx === -1) return;

            const rawFieldName = cleanLine.substring(0, colonIdx).trim();
            const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();
            if (!rawFieldName || !rawTypeStr) return;

            const propCased = applyCasing(rawFieldName, propertyCasing);
            const scalaPropName = sanitizeScalaIdentifier(propCased);
            const { scalaType, isNonNull, isList } = mapGqlTypeToScala(rawTypeStr, customScalars);

            let finalScalaType = scalaType;
            if (!isNonNull && useOptionForNullable && !isList) {
              finalScalaType = `Option[${scalaType}]`;
            }

            block += `  def ${scalaPropName}: ${finalScalaType}\n`;
          });
          block += `}`;
          outputBlocks.push(block);
        } else {
          let annotations = '';
          if (jsonFramework === 'circe') {
            annotations += '@JsonCodec\n';
          }

          let block = `${annotations}final case class ${scalaTypeName}(\n`;
          const paramLines: string[] = [];

          lines.forEach(line => {
            const cleanLine = line.replace(/\([^)]*\)/, '');
            const colonIdx = cleanLine.indexOf(':');
            if (colonIdx === -1) return;

            const rawFieldName = cleanLine.substring(0, colonIdx).trim();
            const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();
            if (!rawFieldName || !rawTypeStr) return;

            const propCased = applyCasing(rawFieldName, propertyCasing);
            const scalaPropName = sanitizeScalaIdentifier(propCased);
            const { scalaType, isNonNull, isList } = mapGqlTypeToScala(rawTypeStr, customScalars);

            let finalScalaType = scalaType;
            let defaultVal = '';

            if (!isNonNull && useOptionForNullable && !isList) {
              finalScalaType = `Option[${scalaType}]`;
              defaultVal = ' = None';
            }

            let fieldAnno = '';
            if (jsonFramework === 'upickle' && rawFieldName !== scalaPropName) {
              fieldAnno = `@key("${escapeScalaString(rawFieldName)}") `;
            } else if (jsonFramework === 'jackson' && rawFieldName !== scalaPropName) {
              fieldAnno = `@JsonProperty("${escapeScalaString(rawFieldName)}") `;
            }

            paramLines.push(`  ${fieldAnno}${scalaPropName}: ${finalScalaType}${defaultVal}`);
          });

          block += paramLines.join(',\n');
          block += `)${extendsClause}`;

          if (jsonFramework === 'play') {
            block += `\n\nobject ${scalaTypeName} {\n  implicit val format: OFormat[${scalaTypeName}] = Json.format[${scalaTypeName}]\n}`;
          } else if (jsonFramework === 'upickle') {
            block += `\n\nobject ${scalaTypeName} {\n  implicit val rw: ReadWriter[${scalaTypeName}] = macroRW\n}`;
          }

          outputBlocks.push(block);
        }
      }

      if (outputBlocks.length === 0) {
        setError(t('graphqltoscala.no_types_found', 'No valid GraphQL types, interfaces, inputs, or enums found.'));
        setOutput('');
        return;
      }

      let fullOutput = '';
      const cleanPkg = sanitizePackageName(packageName);
      if (cleanPkg) {
        fullOutput += `package ${cleanPkg}\n\n`;
      }

      if (imports.size > 0) {
        fullOutput += Array.from(imports).sort().join('\n') + '\n\n';
      }

      fullOutput += outputBlocks.join('\n\n');
      setOutput(fullOutput);
      setError('');
    } catch (e: any) {
      setError(t('graphqltoscala.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, packageName, scalaVersion, jsonFramework, propertyCasing, useOptionForNullable, idType, dateTimeType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltoscala.toast_copied', 'Scala classes copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('graphqltoscala.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GraphQLModels.scala';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded GraphQLModels.scala!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltoscala.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltoscala.presets_title', 'Quick Start Presets:')}
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
            {t('graphqltoscala.preset_ecommerce', 'E-Commerce Catalog')}
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
            {t('graphqltoscala.preset_user_auth', 'User Management & Auth')}
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
            {t('graphqltoscala.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="package-name" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltoscala.package_name', 'Package Name')}
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
            <label htmlFor="scala-version" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltoscala.scala_version', 'Scala Version')}
            </label>
            <select
              id="scala-version"
              value={scalaVersion}
              onChange={(e) => setScalaVersion(e.target.value as ScalaVersion)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="scala3">Scala 3 (enum & union types)</option>
              <option value="scala2">Scala 2.13 (sealed traits)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="json-framework" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltoscala.json_framework', 'JSON Library')}
            </label>
            <select
              id="json-framework"
              value={jsonFramework}
              onChange={(e) => setJsonFramework(e.target.value as JsonFramework)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="circe">Circe (@JsonCodec)</option>
              <option value="play">Play JSON (OFormat)</option>
              <option value="upickle">uPickle (ReadWriter)</option>
              <option value="jackson">Jackson (@JsonProperty)</option>
              <option value="none">None (Plain Scala)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="property-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltoscala.property_casing', 'Property Casing')}
            </label>
            <select
              id="property-casing"
              value={propertyCasing}
              onChange={(e) => setPropertyCasing(e.target.value as PropertyCasing)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="camelCase">camelCase (Scala default)</option>
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
                <option value="ZonedDateTime">java.time.ZonedDateTime</option>
                <option value="OffsetDateTime">java.time.OffsetDateTime</option>
                <option value="String">String</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                checked={useOptionForNullable}
                onChange={(e) => setUseOptionForNullable(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              Scala Option (`Option[T]`)
            </label>
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-scala-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltoscala.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-scala-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={t('graphqltoscala.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="scala-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltoscala.output_label', 'Generated Scala Code')}
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
            id="scala-output"
            value={output}
            readOnly
            placeholder={t('graphqltoscala.placeholder_output', 'Generated Scala case classes will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltoscala.about_title', 'About GraphQL SDL to Scala Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltoscala.about_text', 'Convert GraphQL Schema Definition Language (SDL) types, interfaces, inputs, enums, and unions into strongly-typed Scala 2 or Scala 3 case classes, traits, enums, and union types with Circe, Play JSON, uPickle, or Jackson annotations.')}
          </p>
        </div>
      </div>
    </div>
  );
}
