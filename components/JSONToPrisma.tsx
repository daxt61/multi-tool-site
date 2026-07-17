import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Settings, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

type Provider = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'sqlserver' | 'cockroachdb';
type IdStrategy = 'autoincrement' | 'uuid' | 'cuid' | 'auto';

export function JSONToPrisma({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [provider, setProvider] = useState<Provider>(initialData?.provider || 'postgresql');
  const [idStrategy, setIdStrategy] = useState<IdStrategy>(initialData?.idStrategy || 'autoincrement');
  const [addTimestamps, setTimestamps] = useState<boolean>(initialData?.addTimestamps ?? true);
  const [addSoftDelete, setSoftDelete] = useState<boolean>(initialData?.addSoftDelete ?? false);
  const [autoRelations, setAutoRelations] = useState<boolean>(initialData?.autoRelations ?? true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ input, provider, idStrategy, addTimestamps, addSoftDelete, autoRelations });
  }, [input, provider, idStrategy, addTimestamps, addSoftDelete, autoRelations, onStateChange]);

  const toPascalCase = (str: string): string => {
    const cleaned = str.replace(/[^a-zA-Z0-9]/g, ' ');
    return cleaned
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  const toCamelCase = (str: string): string => {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  };

  const sanitizeName = (name: string): string => {
    // Sanitize to a valid Prisma identifier
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '');
    if (/^[0-9]/.test(sanitized)) {
      sanitized = 'Model_' + sanitized;
    }
    // Prevent prototype pollution or reserved words
    if (sanitized === '__proto__' || sanitized === 'constructor' || sanitized === 'prototype') {
      sanitized = '_' + sanitized;
    }
    return sanitized || 'Model';
  };

  const inferType = (val: any): string => {
    if (val === null || val === undefined) return 'String';
    if (typeof val === 'boolean') return 'Boolean';
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'Int' : 'Float';
    }
    if (typeof val === 'string') {
      // Simple ISO Date detection
      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(val)) {
        return 'DateTime';
      }
      return 'String';
    }
    return 'Json';
  };

  const generatePrismaSchema = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const models = Object.create(null);
      const relationsToCreate: Array<{
        fromModel: string;
        toModel: string;
        relationField: string;
        fkField: string;
      }> = [];

      const processObject = (obj: any, suggestedName: string, depth: number) => {
        if (depth > MAX_DEPTH) return;
        if (typeof obj !== 'object' || obj === null) return;

        const modelName = toPascalCase(sanitizeName(suggestedName));
        if (models[modelName]) return; // Already processed or recursive loop safeguard

        const fields = Object.create(null);
        models[modelName] = fields;

        Object.entries(obj).forEach(([key, val]) => {
          const safeKey = sanitizeName(key);
          if (safeKey === 'id' || safeKey === '_id') return; // Handled separately as the primary key

          if (val && typeof val === 'object' && !Array.isArray(val)) {
            // Nested object - create relation
            const relationModelName = toPascalCase(sanitizeName(key));
            fields[toCamelCase(key)] = {
              type: relationModelName,
              isRelation: true,
              isArray: false
            };
            // Also need foreign key field
            const fkName = toCamelCase(key) + 'Id';
            fields[fkName] = {
              type: idStrategy === 'autoincrement' ? 'Int' : 'String',
              isFK: true,
              targetModel: relationModelName
            };
            relationsToCreate.push({
              fromModel: modelName,
              toModel: relationModelName,
              relationField: toCamelCase(key),
              fkField: fkName
            });
            processObject(val, key, depth + 1);
          } else if (Array.isArray(val)) {
            if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
              // Array of objects - 1-to-many relation
              const relationModelName = toPascalCase(sanitizeName(key));
              fields[toCamelCase(key)] = {
                type: relationModelName,
                isRelation: true,
                isArray: true
              };
              // Add foreign key details to the child model
              relationsToCreate.push({
                fromModel: relationModelName,
                toModel: modelName,
                relationField: toCamelCase(suggestedName),
                fkField: toCamelCase(suggestedName) + 'Id'
              });
              processObject(val[0], key, depth + 1);
            } else {
              // Primitive array
              fields[safeKey] = {
                type: val.length > 0 ? inferType(val[0]) : 'String',
                isArray: true
              };
            }
          } else {
            // Primitive field
            fields[safeKey] = {
              type: inferType(val),
              isArray: false
            };
          }
        });
      };

      // Root model logic
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
          processObject(parsed[0], 'Root', 0);
        } else {
          setError(t('jsontoprisma.error_array_objects', 'JSON array must contain non-empty objects.'));
          setOutput('');
          return;
        }
      } else if (typeof parsed === 'object' && parsed !== null) {
        processObject(parsed, 'Root', 0);
      } else {
        setError(t('jsontoprisma.error_valid_object', 'JSON must be a valid object or array of objects.'));
        setOutput('');
        return;
      }

      // Populate automatic back-references for relations if autoRelations is true
      if (autoRelations) {
        relationsToCreate.forEach(({ fromModel, toModel, relationField, fkField }) => {
          // If fromModel references toModel, ensure toModel has back-reference to fromModel
          if (models[toModel] && !models[toModel][toCamelCase(fromModel)] && !models[toModel][toCamelCase(fromModel) + 's']) {
            models[toModel][toCamelCase(fromModel) + 's'] = {
              type: fromModel,
              isRelation: true,
              isArray: true
            };
          }
          // Set parent foreign key on child if missing
          if (models[fromModel] && !models[fromModel][fkField]) {
            models[fromModel][fkField] = {
              type: idStrategy === 'autoincrement' ? 'Int' : 'String',
              isFK: true,
              targetModel: toModel
            };
          }
        });
      }

      // Build output string
      let schemaStr = `datasource db {\n  provider = "${provider}"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n`;

      Object.entries(models).forEach(([modelName, fields]: [string, any]) => {
        schemaStr += `model ${modelName} {\n`;

        // Configure ID based on provider & strategy
        const isMongo = provider === 'mongodb';
        if (isMongo) {
          schemaStr += `  id String @id @default(auto()) @map("_id") @db.ObjectId\n`;
        } else {
          const idType = idStrategy === 'autoincrement' ? 'Int' : 'String';
          const defaultAttr = idStrategy === 'autoincrement'
            ? '@default(autoincrement())'
            : (idStrategy === 'uuid' ? '@default(uuid())' : (idStrategy === 'cuid' ? '@default(cuid())' : ''));
          schemaStr += `  id ${idType} @id ${defaultAttr}\n`;
        }

        // Configure other fields
        Object.entries(fields).forEach(([fieldName, config]: [string, any]) => {
          if (config.isRelation) {
            if (config.isArray) {
              schemaStr += `  ${fieldName} ${config.type}[]\n`;
            } else {
              // Find matching relation details to write @relation attribute
              const rel = relationsToCreate.find(r => r.fromModel === modelName && r.relationField === fieldName);
              if (rel) {
                schemaStr += `  ${fieldName} ${config.type} @relation(fields: [${rel.fkField}], references: [id])\n`;
              } else {
                schemaStr += `  ${fieldName} ${config.type}?\n`;
              }
            }
          } else if (config.isFK) {
            // Write foreign key fields (must match ID type, and be optional/mandatory appropriately)
            const typeStr = isMongo ? 'String @db.ObjectId' : config.type;
            schemaStr += `  ${fieldName} ${typeStr}\n`;
          } else {
            // Standard fields
            const arrSymbol = config.isArray ? '[]' : '';
            schemaStr += `  ${fieldName} ${config.type}${arrSymbol}\n`;
          }
        });

        // Timestamps option
        if (addTimestamps) {
          schemaStr += `  createdAt DateTime @default(now())\n`;
          schemaStr += `  updatedAt DateTime @updatedAt\n`;
        }

        // Soft delete option
        if (addSoftDelete) {
          schemaStr += `  deletedAt DateTime?\n`;
        }

        schemaStr += `}\n\n`;
      });

      setOutput(schemaStr.trim());
      setError(null);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
      setOutput('');
    }
  }, [input, provider, idStrategy, addTimestamps, addSoftDelete, autoRelations, t]);

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
    } else {
      generatePrismaSchema();
    }
  }, [input, generatePrismaSchema, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    textareaRef.current?.focus();
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema.prisma`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

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
      {/* Toggles & Options Grid */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Settings className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{t('jsontoprisma.options_title', 'Converter Configuration')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label htmlFor="db-provider" className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('jsontoprisma.provider', 'Database Provider')}</label>
            <select
              id="db-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="mongodb">MongoDB</option>
              <option value="sqlserver">SQL Server</option>
              <option value="cockroachdb">CockroachDB</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="id-strategy" className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('jsontoprisma.id_strategy', 'ID Generation Strategy')}</label>
            <select
              id="id-strategy"
              value={idStrategy}
              disabled={provider === 'mongodb'}
              onChange={(e) => setIdStrategy(e.target.value as IdStrategy)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold disabled:opacity-50"
            >
              <option value="autoincrement">Autoincrement (Int)</option>
              <option value="uuid">UUID (String)</option>
              <option value="cuid">CUID (String)</option>
            </select>
          </div>

          <div className="flex flex-col justify-center space-y-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={addTimestamps}
                onChange={(e) => setTimestamps(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('jsontoprisma.add_timestamps', 'Include Timestamps')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={addSoftDelete}
                onChange={(e) => setSoftDelete(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('jsontoprisma.add_soft_delete', 'Include Soft Delete')}</span>
            </label>
          </div>

          <div className="flex flex-col justify-center space-y-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRelations}
                onChange={(e) => setAutoRelations(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('jsontoprisma.auto_relations', 'Extract Relations & Foreign Keys')}</span>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.input')} JSON</label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
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
            id="json-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{
  "id": 1,
  "email": "user@example.com",
  "name": "Jane Doe",
  "posts": [
    {
      "id": 101,
      "title": "Prisma is amazing",
      "content": "Fully custom relational schema generator!"
    }
  ]
}'
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <label htmlFor="prisma-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Prisma Schema</label>
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
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="prisma-output"
            value={output}
            readOnly
            placeholder="schema.prisma output will appear here..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Educational info card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsontoprisma.about_title', 'About JSON to Prisma')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsontoprisma.about_text', 'This tool automatically converts a JSON object or list of objects into fully configured Prisma Schema models. It analyzes nesting to automatically extract related sub-schemas, mapping proper relationships, back-references, and foreign keys according to modern Prisma standards.')}
          </p>
        </div>
      </div>
    </div>
  );
}
