import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Copy,
  Check,
  Trash2,
  Download,
  Sparkles,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const MAX_LENGTH = 100000;

const ELIXIR_KEYWORDS = new Set([
  "def", "defmodule", "defstruct", "defprotocol", "defimpl", "defmacro",
  "quote", "unquote", "if", "unless", "cond", "case", "for", "with", "fn",
  "do", "end", "catch", "rescue", "after", "raise", "throw", "import",
  "require", "use", "alias", "true", "false", "nil", "and", "or", "not",
  "in", "when", "schema", "field", "has_many", "has_one", "belongs_to",
  "many_to_many", "embedded_schema", "embeds_one", "embeds_many", "changeset"
]);

function sanitizeElixirIdentifier(name: string): string {
  if (!name) return "field";
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^[0-9]/.test(sanitized)) {
    sanitized = `field_${sanitized}`;
  }
  if (ELIXIR_KEYWORDS.has(sanitized.toLowerCase())) {
    sanitized = `${sanitized}_field`;
  }
  return sanitized;
}

function escapeElixirString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function transformCasing(name: string, casing: "snake_case" | "camelCase" | "PascalCase" | "original"): string {
  if (casing === "original") return sanitizeElixirIdentifier(name);

  // Split camelCase/PascalCase/snake_case/kebab-case
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .split("_")
    .filter(Boolean);

  if (words.length === 0) return sanitizeElixirIdentifier(name);

  if (casing === "snake_case") {
    return sanitizeElixirIdentifier(words.map((w) => w.toLowerCase()).join("_"));
  } else if (casing === "camelCase") {
    const camel = words[0].toLowerCase() + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
    return sanitizeElixirIdentifier(camel);
  } else if (casing === "PascalCase") {
    const pascal = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
    return sanitizeElixirIdentifier(pascal);
  }
  return sanitizeElixirIdentifier(name);
}

function pluralize(str: string): string {
  if (str.endsWith("y") && !/[aeiou]y$/i.test(str)) {
    return str.slice(0, -1) + "ies";
  }
  if (str.endsWith("s") || str.endsWith("ch") || str.endsWith("sh") || str.endsWith("x") || str.endsWith("z")) {
    return str + "es";
  }
  return str + "s";
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase()
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function toPascalCase(str: string): string {
  const words = str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .split("_")
    .filter(Boolean);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
}

interface GraphQLField {
  name: string;
  type: string;
  isList: boolean;
  isRequired: boolean;
}

interface GraphQLType {
  kind: "type" | "enum" | "input" | "interface";
  name: string;
  fields: GraphQLField[];
  enumValues?: string[];
}

function parseGraphQLSchema(sdl: string): GraphQLType[] {
  const cleanSdl = sdl.replace(/#.*$/gm, "").replace(/"""[\s\S]*?"""/g, "").replace(/"[^"]*"/g, "");
  const types: GraphQLType[] = [];

  // Match enums
  const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = enumRegex.exec(cleanSdl)) !== null) {
    const enumName = match[1];
    const enumBody = match[2];
    const values = enumBody
      .split(/\s+/)
      .map((v) => v.trim())
      .filter(Boolean);
    types.push({
      kind: "enum",
      name: enumName,
      fields: [],
      enumValues: values,
    });
  }

  // Match type / input / interface
  const objectRegex = /(type|input|interface)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
  while ((match = objectRegex.exec(cleanSdl)) !== null) {
    const kind = match[1] as "type" | "input" | "interface";
    const name = match[2];
    const body = match[3];

    // Ignore root operation types if desired, but parsing them is safe
    const fields: GraphQLField[] = [];
    const lines = body.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const fieldMatch = trimmed.match(/^([A-Za-z0-9_]+)(?:\([^)]*\))?\s*:\s*([\[\]A-Za-z0-9_!]+)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const rawType = fieldMatch[2];

        const isList = rawType.includes("[");
        const isRequired = rawType.endsWith("!");
        const baseType = rawType.replace(/[\[\]!]/g, "").trim();

        fields.push({
          name: fieldName,
          type: baseType,
          isList,
          isRequired,
        });
      }
    }

    types.push({
      kind,
      name,
      fields,
    });
  }

  return types;
}

function mapGraphQLToEctoType(gqlType: string): string {
  switch (gqlType) {
    case "String":
      return ":string";
    case "Int":
      return ":integer";
    case "Float":
      return ":float";
    case "Boolean":
      return ":boolean";
    case "ID":
      return ":binary_id";
    case "DateTime":
    case "Time":
    case "NaiveDateTime":
      return ":utc_datetime";
    case "Date":
      return ":date";
    case "JSON":
    case "JsonObject":
      return ":map";
    default:
      return ":string";
  }
}

function mapGraphQLToTypespec(gqlType: string, isList: boolean, isRequired: boolean, definedTypes: Set<string>): string {
  let spec = "String.t()";
  if (gqlType === "String") spec = "String.t()";
  else if (gqlType === "Int") spec = "integer()";
  else if (gqlType === "Float") spec = "float()";
  else if (gqlType === "Boolean") spec = "boolean()";
  else if (gqlType === "ID") spec = "Ecto.UUID.t()";
  else if (gqlType === "DateTime") spec = "DateTime.t()";
  else if (gqlType === "Date") spec = "Date.t()";
  else if (definedTypes.has(gqlType)) spec = `${toPascalCase(gqlType)}.t()`;
  else spec = "term()";

  if (isList) spec = `list(${spec})`;
  if (!isRequired) spec = `${spec} | nil`;

  return spec;
}

interface Preset {
  id: string;
  label: string;
  description: string;
  sdl: string;
}

const PRESETS: Preset[] = [
  {
    id: "ecommerce",
    label: "Catalogue E-Commerce",
    description: "Produits, Catégories, Clients et Commandes",
    sdl: `type Category {
  id: ID!
  name: String!
  slug: String!
  description: String
}

type Product {
  id: ID!
  title: String!
  sku: String!
  price: Float!
  inventoryCount: Int!
  isPublished: Boolean!
  category: Category!
  tags: [String!]
  createdAt: DateTime!
}

type Customer {
  id: ID!
  email: String!
  fullName: String!
  phone: String
  orders: [Order!]!
}

type Order {
  id: ID!
  orderNumber: String!
  totalAmount: Float!
  status: OrderStatus!
  customer: Customer!
  itemsCount: Int!
  placedAt: DateTime!
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  DELIVERED
  CANCELLED
}`,
  },
  {
    id: "user_auth",
    label: "Gestion Utilisateurs & Auth",
    description: "Utilisateurs, Rôles, Profils et Jetons",
    sdl: `type User {
  id: ID!
  username: String!
  email: String!
  isActive: Boolean!
  role: UserRole!
  profile: UserProfile
  createdAt: DateTime!
}

type UserProfile {
  id: ID!
  avatarUrl: String
  bio: String
  website: String
  location: String
}

enum UserRole {
  ADMIN
  MODERATOR
  MEMBER
  GUEST
}

input CreateUserInput {
  username: String!
  email: String!
  role: UserRole
}`,
  },
  {
    id: "social_feed",
    label: "Flux Social & Commentaires",
    description: "Publications, Auteurs et Commentaires",
    sdl: `type Author {
  id: ID!
  handle: String!
  name: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  likesCount: Int!
  published: Boolean!
  author: Author!
  comments: [Comment!]!
  createdAt: DateTime!
}

type Comment {
  id: ID!
  body: String!
  post: Post!
  authorName: String!
  createdAt: DateTime!
}`,
  },
];

export function GraphQLToElixir() {
  const [graphqlInput, setGraphqlInput] = useState<string>(PRESETS[0].sdl);
  const [modulePrefix, setModulePrefix] = useState<string>("MyApp");
  const [fieldCasing, setFieldCasing] = useState<"snake_case" | "camelCase" | "PascalCase" | "original">("snake_case");
  const [useBinaryId, setUseBinaryId] = useState<boolean>(true);
  const [includeTimestamps, setIncludeTimestamps] = useState<boolean>(true);
  const [includeTypespec, setIncludeTypespec] = useState<boolean>(true);
  const [activePresetId, setActivePresetId] = useState<string | null>(PRESETS[0].id);
  const [copied, setCopied] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaInputRef = useRef<HTMLTextAreaElement>(null);

  const elixirOutput = useMemo(() => {
    if (!graphqlInput.trim()) return "";
    if (graphqlInput.length > MAX_LENGTH) {
      return "# Erreur: La taille du schéma dépasse la limite autorisée (100 000 caractères).";
    }

    try {
      const parsedTypes = parseGraphQLSchema(graphqlInput);
      if (parsedTypes.length === 0) {
        return "# Aucun type, interface, entrée ou enum GraphQL valide n'a été trouvé dans le schéma.";
      }

      const definedTypeNames = new Set(parsedTypes.map((t) => t.name));
      const codeBlocks: string[] = [];
      const prefix = modulePrefix.trim() ? `${toPascalCase(modulePrefix.trim())}.` : "";

      for (const t of parsedTypes) {
        if (t.kind === "enum") {
          const moduleName = `${prefix}${toPascalCase(t.name)}`;
          const enumValuesCode = (t.enumValues || [])
            .map((v) => `    :${toSnakeCase(v)}`)
            .join(",\n");

          const block = [
            `defmodule ${moduleName} do`,
            `  @moduledoc """`,
            `  Module représentant l'énumération GraphQL ${t.name}.`,
            `  """`,
            ``,
            `  @type t :: :${(t.enumValues || []).map(toSnakeCase).join(" | :") || "atom()"}`,
            ``,
            `  @values [`,
            enumValuesCode,
            `  ]`,
            ``,
            `  def values, do: @values`,
            `end`,
          ].join("\n");

          codeBlocks.push(block);
        } else if (t.kind === "type" || t.kind === "input" || t.kind === "interface") {
          const moduleName = `${prefix}${toPascalCase(t.name)}`;
          const tableName = toSnakeCase(pluralize(t.name));

          const schemaLines: string[] = [];
          const requiredFields: string[] = [];
          const optionalFields: string[] = [];
          const typespecFields: string[] = [];

          if (useBinaryId && t.kind === "type") {
            schemaLines.push(`  @primary_key {:id, :binary_id, autogenerate: true}`);
            schemaLines.push(`  @foreign_key_type :binary_id`);
          }

          schemaLines.push(`  schema "${tableName}" do`);

          for (const f of t.fields) {
            const fieldName = transformCasing(f.name, fieldCasing);
            const targetType = parsedTypes.find((pt) => pt.name === f.type);

            if (fieldName === "id" && useBinaryId && t.kind === "type") {
              // Primary key handled by @primary_key
              typespecFields.push(`        ${fieldName}: Ecto.UUID.t()`);
              continue;
            }

            if (f.isRequired) {
              requiredFields.push(`:${fieldName}`);
            } else {
              optionalFields.push(`:${fieldName}`);
            }

            if (targetType && targetType.kind === "enum") {
              const enumModule = `${prefix}${toPascalCase(targetType.name)}`;
              if (f.isList) {
                schemaLines.push(`    field :${fieldName}, {:array, Ecto.Enum}, values: ${enumModule}.values()`);
                typespecFields.push(`        ${fieldName}: list(${enumModule}.t())`);
              } else {
                schemaLines.push(`    field :${fieldName}, Ecto.Enum, values: ${enumModule}.values()`);
                typespecFields.push(`        ${fieldName}: ${enumModule}.t()`);
              }
            } else if (targetType && (targetType.kind === "type" || targetType.kind === "interface" || targetType.kind === "input")) {
              const relModule = `${prefix}${toPascalCase(targetType.name)}`;
              if (f.isList) {
                schemaLines.push(`    has_many :${fieldName}, ${relModule}`);
                typespecFields.push(`        ${fieldName}: list(${relModule}.t())`);
              } else {
                schemaLines.push(`    belongs_to :${fieldName}, ${relModule}`);
                typespecFields.push(`        ${fieldName}: ${relModule}.t()`);
              }
            } else {
              const ectoType = mapGraphQLToEctoType(f.type);
              if (f.isList) {
                schemaLines.push(`    field :${fieldName}, {:array, ${ectoType}}`);
              } else {
                schemaLines.push(`    field :${fieldName}, ${ectoType}`);
              }
              const spec = mapGraphQLToTypespec(f.type, f.isList, f.isRequired, definedTypeNames);
              typespecFields.push(`        ${fieldName}: ${spec}`);
            }
          }

          if (includeTimestamps && t.kind === "type") {
            schemaLines.push(`    timestamps()`);
          }

          schemaLines.push(`  end`);

          const allFields = [...requiredFields, ...optionalFields].join(", ");

          const blockLines = [
            `defmodule ${moduleName} do`,
            `  use Ecto.Schema`,
            `  import Ecto.Changeset`,
            ``,
          ];

          if (includeTypespec) {
            blockLines.push(`  @type t :: %__MODULE__{`);
            if (typespecFields.length > 0) {
              blockLines.push(typespecFields.join(",\n"));
            }
            blockLines.push(`  }`);
            blockLines.push(``);
          }

          blockLines.push(schemaLines.join("\n"));
          blockLines.push(``);
          blockLines.push(`  @doc """`);
          blockLines.push(`  Crée un changeset Ecto pour la validation de ${t.name}.`);
          blockLines.push(`  """`);
          blockLines.push(`  def changeset(struct_or_changeset, attrs) do`);
          blockLines.push(`    struct_or_changeset`);
          blockLines.push(`    |> cast(attrs, [${allFields}])`);

          if (requiredFields.length > 0) {
            blockLines.push(`    |> validate_required([${requiredFields.join(", ")}])`);
          }

          blockLines.push(`  end`);
          blockLines.push(`end`);

          codeBlocks.push(blockLines.join("\n"));
        }
      }

      return codeBlocks.join("\n\n");
    } catch (err) {
      return `# Erreur lors de la conversion du schéma GraphQL:\n# ${(err as Error).message}`;
    }
  }, [graphqlInput, modulePrefix, fieldCasing, useBinaryId, includeTimestamps, includeTypespec]);

  const handleApplyPreset = (preset: Preset) => {
    setGraphqlInput(preset.sdl);
    setActivePresetId(preset.id);
    toast.success(`Préréglage appliqué : ${preset.label}`);
    textareaInputRef.current?.focus();
  };

  const handleClear = useCallback(() => {
    setGraphqlInput("");
    setActivePresetId(null);
    toast.success("Saisie GraphQL effacée");
    textareaInputRef.current?.focus();
  }, []);

  const handleCopyCode = useCallback(() => {
    if (!elixirOutput) return;
    navigator.clipboard.writeText(elixirOutput);
    setCopied(true);
    toast.success("Code Elixir Ecto copié dans le presse-papiers !");
    setTimeout(() => setCopied(false), 2000);
  }, [elixirOutput]);

  const handleDownload = useCallback(() => {
    if (!elixirOutput) return;
    const blob = new Blob([elixirOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${toSnakeCase(modulePrefix || "ecto_schema")}.ex`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Fichier .ex téléchargé !");
  }, [elixirOutput, modulePrefix]);

  const handlersRef = useRef({ handleClear, handleCopyCode });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopyCode };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;

      const activeElem = document.activeElement;
      const isInput =
        activeElem &&
        (activeElem.tagName === "INPUT" ||
          activeElem.tagName === "SELECT" ||
          activeElem.tagName === "TEXTAREA");

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (
        (e.key === "c" || e.key === "C") &&
        !isInput &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        handlersRef.current.handleCopyCode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Préréglages rapides GraphQL
          </label>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Kbd modifier={null}>Esc</Kbd> Effacer
            <Kbd modifier={null}>C</Kbd> Copier
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              aria-pressed={activePresetId === preset.id}
              className={`p-3 rounded-2xl text-left border transition-all text-xs font-bold focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePresetId === preset.id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                  : "bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="truncate">{preset.label}</div>
              <div
                className={`text-[10px] mt-0.5 truncate font-normal ${
                  activePresetId === preset.id ? "text-indigo-100" : "text-slate-400"
                }`}
              >
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
          Configuration Elixir Ecto
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="module-prefix" className="block text-xs font-bold text-slate-500 mb-1.5">
              Préfixe de Module / Application
            </label>
            <input
              id="module-prefix"
              type="text"
              value={modulePrefix}
              onChange={(e) => setModulePrefix(e.target.value)}
              placeholder="MyApp"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="field-casing" className="block text-xs font-bold text-slate-500 mb-1.5">
              Casse des Champs de Schéma
            </label>
            <select
              id="field-casing"
              value={fieldCasing}
              onChange={(e) => setFieldCasing(e.target.value as any)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
            >
              <option value="snake_case">snake_case (Standard Elixir)</option>
              <option value="camelCase">camelCase</option>
              <option value="PascalCase">PascalCase</option>
              <option value="original">Original (GraphQL)</option>
            </select>
          </div>

          <div className="flex flex-col justify-center space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={useBinaryId}
                onChange={(e) => setUseBinaryId(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              {"@primary_key {:id, :binary_id}"}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeTimestamps}
                onChange={(e) => setIncludeTimestamps(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Inclure timestamps()
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeTypespec}
                onChange={(e) => setIncludeTypespec(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Spécification de Type @type t
            </label>
          </div>
        </div>
      </div>

      {/* Editor & Output Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label
              htmlFor="graphql-elixir-input"
              className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
            >
              <Code2 className="w-3.5 h-3.5" /> Entrée GraphQL SDL
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" /> Effacer
            </button>
          </div>
          <textarea
            id="graphql-elixir-input"
            ref={textareaInputRef}
            value={graphqlInput}
            onChange={(e) => {
              setGraphqlInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder="type User {\n  id: ID!\n  email: String!\n}"
            className="w-full h-[450px] p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white resize-none"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label
              htmlFor="elixir-output"
              className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
            >
              <Code2 className="w-3.5 h-3.5" /> Schémas Elixir Ecto Générés
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!elixirOutput}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3.5 h-3.5" /> .ex
              </button>
              <button
                onClick={handleCopyCode}
                disabled={!elixirOutput}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-3 py-1 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>
          <textarea
            id="elixir-output"
            readOnly
            value={elixirOutput}
            placeholder="# Les modules d'entités Elixir Ecto générés apparaîtront ici..."
            className="w-full h-[450px] p-4 bg-slate-900 dark:bg-black text-slate-100 border border-slate-800 rounded-2xl font-mono text-sm outline-none resize-none"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Educational Information */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-500">
          À propos du Convertisseur GraphQL SDL vers Elixir Ecto
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Cet outil convertit les types, interfaces, entrées et énumérations du langage de définition de schéma (SDL) GraphQL directement en modules d'entités Elixir Ecto (<code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">use Ecto.Schema</code>).
        </p>
        <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1">
          <li>Génère des champs de base (<code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">field :name, :type</code>) et énumérations (<code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Ecto.Enum</code>).</li>
          <li>Gère les clés primaires binaires (<code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">{"@primary_key {:id, :binary_id, autogenerate: true}"}</code>) et associations (<code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">has_many</code>, <code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">belongs_to</code>).</li>
          <li>Crée automatiquement des fonctions de validation <code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">changeset/2</code> avec <code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">cast</code> et <code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">validate_required</code>.</li>
        </ul>
      </div>
    </div>
  );
}
