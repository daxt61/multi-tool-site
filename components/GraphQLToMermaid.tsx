import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Network, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function GraphQLToMermaid({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [diagramType, setDiagramType] = useState<'classDiagram' | 'erDiagram'>(initialData?.diagramType || 'classDiagram');
  const [includeEnums, setIncludeEnums] = useState(initialData?.includeEnums ?? true);
  const [includeRelationships, setIncludeRelationships] = useState(initialData?.includeRelationships ?? true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      diagramType,
      includeEnums,
      includeRelationships,
    });
  }, [input, output, diagramType, includeEnums, includeRelationships, onStateChange]);

  const PRESETS = [
    {
      id: 'ecommerce',
      nameKey: 'graphqltomermaid.preset_ecommerce',
      label: 'E-Commerce Catalog',
      graphql: `type Product {
  id: ID!
  title: String!
  description: String
  price: Float!
  inStock: Boolean!
  category: Category!
  reviews: [Review!]!
}

type Category {
  id: ID!
  name: String!
  slug: String!
  products: [Product!]!
}

type Review {
  id: ID!
  rating: Int!
  comment: String
  author: User!
}

type User {
  id: ID!
  email: String!
  name: String!
  reviews: [Review!]!
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}`
    },
    {
      id: 'user_auth',
      nameKey: 'graphqltomermaid.preset_user_auth',
      label: 'User Auth & Permissions',
      graphql: `type User {
  id: ID!
  username: String!
  email: String!
  role: Role!
  status: AccountStatus!
  profile: Profile
}

type Profile {
  id: ID!
  bio: String
  avatarUrl: String
  user: User!
}

type Role {
  id: ID!
  name: String!
  permissions: [Permission!]!
}

type Permission {
  id: ID!
  code: String!
  description: String
}

enum AccountStatus {
  ACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}`
    },
    {
      id: 'social',
      nameKey: 'graphqltomermaid.preset_social',
      label: 'Social Feed & Comments',
      graphql: `type Post {
  id: ID!
  content: String!
  author: User!
  likesCount: Int!
  comments: [Comment!]!
  createdAt: String!
}

type Comment {
  id: ID!
  text: String!
  author: User!
  post: Post!
}

type User {
  id: ID!
  handle: String!
  displayName: String!
  posts: [Post!]!
}`
    }
  ];

  const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9_]/g, '');

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
        .replace(/"[^"]*"/g, '');

      // Simple regex parser for GraphQL SDL
      const typeRegex = /(type|interface|input|enum)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[A-Za-z0-9_,\s&]+)?\s*\{([^}]*)\}/g;

      const types: Record<string, { kind: string; fields: Array<{ name: string; type: string; rawType: string; isArray: boolean; isRequired: boolean }> }> = Object.create(null);
      const enums: Record<string, string[]> = Object.create(null);

      let match;
      while ((match = typeRegex.exec(cleanInput)) !== null) {
        const kind = match[1];
        const typeName = sanitizeName(match[2]);
        const body = match[3];

        if (kind === 'enum') {
          const enumValues = body
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .map(line => sanitizeName(line.split(/\s+/)[0]))
            .filter(Boolean);
          enums[typeName] = enumValues;
          continue;
        }

        const fieldLines = body.split('\n').map(l => l.trim()).filter(Boolean);
        const fields: Array<{ name: string; type: string; rawType: string; isArray: boolean; isRequired: boolean }> = [];

        fieldLines.forEach(line => {
          if (!line || line.startsWith('#')) return;
          const fieldMatch = line.match(/^([A-Za-z0-9_]+)(?:\([^)]*\))?\s*:\s*(\[?([A-Za-z0-9_]+)!?\]?!?)/);
          if (fieldMatch) {
            const fieldName = sanitizeName(fieldMatch[1]);
            const fullType = fieldMatch[2];
            const rawType = sanitizeName(fieldMatch[3]);
            const isArray = fullType.includes('[');
            const isRequired = fullType.includes('!');

            fields.push({
              name: fieldName,
              type: fullType,
              rawType,
              isArray,
              isRequired,
            });
          }
        });

        types[typeName] = { kind, fields };
      }

      const typeNames = new Set(Object.keys(types));
      const enumNames = new Set(Object.keys(enums));

      if (diagramType === 'classDiagram') {
        const lines: string[] = ['classDiagram'];

        // Render Enums
        if (includeEnums) {
          Object.entries(enums).forEach(([enumName, values]) => {
            lines.push(`class ${enumName} {\n  <<enumeration>>`);
            values.forEach(val => lines.push(`  ${val}`));
            lines.push('}');
          });
        }

        // Render Types & Interfaces
        Object.entries(types).forEach(([typeName, { kind, fields }]) => {
          lines.push(`class ${typeName} {`);
          if (kind === 'interface') {
            lines.push('  <<interface>>');
          } else if (kind === 'input') {
            lines.push('  <<input>>');
          }
          fields.forEach(f => {
            lines.push(`  +${f.rawType}${f.isArray ? '[]' : ''} ${f.name}`);
          });
          lines.push('}');
        });

        // Render Relationships
        if (includeRelationships) {
          const addedRels = new Set<string>();

          Object.entries(types).forEach(([typeName, { fields }]) => {
            fields.forEach(f => {
              if (typeNames.has(f.rawType)) {
                const relKey = `${typeName}->${f.rawType}:${f.name}`;
                if (!addedRels.has(relKey)) {
                  addedRels.add(relKey);
                  const connector = f.isArray ? '--> "*"' : '--> "1"';
                  lines.push(`${typeName} ${connector} ${f.rawType} : ${f.name}`);
                }
              } else if (includeEnums && enumNames.has(f.rawType)) {
                const relKey = `${typeName}..>${f.rawType}:${f.name}`;
                if (!addedRels.has(relKey)) {
                  addedRels.add(relKey);
                  lines.push(`${typeName} ..> ${f.rawType} : ${f.name}`);
                }
              }
            });
          });
        }

        setOutput(lines.join('\n'));
      } else {
        // ER Diagram (erDiagram)
        const lines: string[] = ['erDiagram'];

        // Render Entities
        Object.entries(types).forEach(([typeName, { fields }]) => {
          lines.push(`    ${typeName} {`);
          fields.forEach(f => {
            const displayType = f.isArray ? `${f.rawType}_array` : f.rawType;
            lines.push(`        ${displayType} ${f.name}`);
          });
          lines.push('    }');
        });

        if (includeEnums) {
          Object.entries(enums).forEach(([enumName, values]) => {
            lines.push(`    ${enumName} {`);
            values.forEach(val => lines.push(`        string ${val}`));
            lines.push('    }');
          });
        }

        // Render ER Relationships
        if (includeRelationships) {
          const addedRels = new Set<string>();

          Object.entries(types).forEach(([typeName, { fields }]) => {
            fields.forEach(f => {
              if (typeNames.has(f.rawType)) {
                const relKey = `${typeName}-${f.rawType}-${f.name}`;
                if (!addedRels.has(relKey)) {
                  addedRels.add(relKey);
                  const relCard = f.isArray ? '||--|{' : '||--||';
                  lines.push(`    ${typeName} ${relCard} ${f.rawType} : "${f.name}"`);
                }
              }
            });
          });
        }

        setOutput(lines.join('\n'));
      }

      setError('');
    } catch (e: any) {
      setError(t('graphqltomermaid.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, diagramType, includeEnums, includeRelationships, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltomermaid.toast_copied', 'Mermaid diagram syntax copied to clipboard!'));
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
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagram.mmd`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded diagram.mmd!'));
  };

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setInput(preset.graphql);
    setActivePresetId(preset.id);
    toast.success(t('graphqltomermaid.preset_loaded', 'Loaded GraphQL preset!'));
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
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltomermaid.presets_title', 'Quick Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset)}
              aria-pressed={activePresetId === preset.id}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
                activePresetId === preset.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
              }`}
            >
              {t(preset.nameKey, preset.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="mermaid-diagram-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltomermaid.diagram_type', 'Diagram Syntax Style')}
          </label>
          <select
            id="mermaid-diagram-type"
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="classDiagram">Class Diagram (classDiagram)</option>
            <option value="erDiagram">ER Diagram (erDiagram)</option>
          </select>
        </div>

        <div className="col-span-1 md:col-span-2 flex flex-wrap items-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <input
              id="include-enums"
              type="checkbox"
              checked={includeEnums}
              onChange={(e) => setIncludeEnums(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="include-enums" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('graphqltomermaid.include_enums', 'Include Enums in Diagram')}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="include-relationships"
              type="checkbox"
              checked={includeRelationships}
              onChange={(e) => setIncludeRelationships(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="include-relationships" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('graphqltomermaid.include_relationships', 'Generate Type Relationships')}
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
              <label htmlFor="graphql-mermaid-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltomermaid.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-mermaid-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={t('graphqltomermaid.placeholder_graphql', 'Paste GraphQL SDL schema definitions here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-500" aria-hidden="true" />
              <label htmlFor="mermaid-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltomermaid.output_label', 'Generated Mermaid Diagram Code')}
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
            id="mermaid-output"
            value={output}
            readOnly
            placeholder={t('graphqltomermaid.placeholder_output', 'Generated Mermaid syntax will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltomermaid.about_title', 'About GraphQL to Mermaid Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltomermaid.about_text', 'Convert GraphQL SDL schemas into Mermaid Class Diagrams or ER Diagrams for instant architectural visualization and documentation in Markdown.')}
          </p>
        </div>
      </div>
    </div>
  );
}
