import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Network, FileCode, Copy, Check, Trash2, AlertCircle, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

type CasingOption = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';
type CypherMode = 'MERGE' | 'CREATE';

interface Preset {
  id: string;
  label: string;
  data: string;
}

const CYPHER_PRESETS: Preset[] = [
  {
    id: 'ecommerce_graph',
    label: 'E-Commerce Catalog',
    data: `CREATE TABLE categories (
  category_id INT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
  product_id INT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category_id INT,
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

INSERT INTO categories (category_id, category_name) VALUES (1, 'Electronics');
INSERT INTO products (product_id, title, price, category_id) VALUES (101, 'Wireless Headphones', 149.99, 1);

SELECT * FROM products WHERE product_id = 101;`
  },
  {
    id: 'user_roles_graph',
    label: 'User Auth & Roles',
    data: `CREATE TABLE roles (
  role_id INT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL
);

CREATE TABLE users (
  user_id INT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  role_id INT,
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

INSERT INTO roles (role_id, role_name) VALUES (10, 'Admin');
INSERT INTO users (user_id, username, email, role_id) VALUES (1001, 'alice_admin', 'alice@company.com', 10);`
  },
  {
    id: 'social_graph',
    label: 'Social Graph & Posts',
    data: `CREATE TABLE users (
  user_id INT PRIMARY KEY,
  handle VARCHAR(50) NOT NULL,
  display_name VARCHAR(100)
);

CREATE TABLE posts (
  post_id INT PRIMARY KEY,
  content TEXT NOT NULL,
  author_id INT NOT NULL,
  created_at TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(user_id)
);

INSERT INTO users (user_id, handle, display_name) VALUES (1, 'john_doe', 'John Doe');
INSERT INTO posts (post_id, content, author_id) VALUES (501, 'Hello Neo4j Graph!', 1);`
  }
];

export function SQLToCypher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || CYPHER_PRESETS[0].data);
  const [output, setOutput] = useState<string>(initialData?.output || '');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string | null>('ecommerce_graph');

  const [cypherMode, setCypherMode] = useState<CypherMode>('MERGE');
  const [labelCasing, setLabelCasing] = useState<CasingOption>('PascalCase');
  const [propCasing, setPropCasing] = useState<CasingOption>('camelCase');
  const [includeConstraints, setIncludeConstraints] = useState<boolean>(true);
  const [includeRelationships, setIncludeRelationships] = useState<boolean>(true);

  const primaryInputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const transformCase = (str: string, style: CasingOption): string => {
    if (style === 'original' || !str) return str;

    const words = str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .trim()
      .split(/\s+/);

    if (words.length === 0 || (words.length === 1 && !words[0])) return str;

    if (style === 'snake_case') {
      return words.map(w => w.toLowerCase()).join('_');
    }

    if (style === 'camelCase') {
      return words
        .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
        .join('');
    }

    if (style === 'PascalCase') {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }

    return str;
  };

  const sanitizeKey = (key: string, style: CasingOption): string => {
    let transformed = transformCase(key, style);
    let safeKey = transformed.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(safeKey)) safeKey = '_' + safeKey;
    if (['__proto__', 'constructor', 'prototype'].includes(key) || !safeKey) {
      safeKey = '_' + (safeKey || 'prop');
    }
    return safeKey;
  };

  const sanitizeStrVal = (val: string): string => {
    const trimmed = val.trim();
    if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  };

  const parseSqlToCypher = useCallback((sql: string): string => {
    if (!sql.trim()) return '';

    const statements = sql
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(Boolean);

    const cypherStatements: string[] = [];
    const createdConstraints = new Set<string>();

    for (const stmt of statements) {
      if (stmt.startsWith('--') || stmt.startsWith('#')) continue;

      // 1. CREATE TABLE DDL
      if (/^CREATE\ TABLE\b/i.test(stmt)) {
        const tableMatch = stmt.match(/CREATE\ TABLE\s+(?:IF\ NOT\ EXISTS\s+)?\`?([a-zA-Z0-9_\.]+)\`?\s*\(([\s\S]*)\)/i);
        if (tableMatch) {
          const rawFullTable = tableMatch[1].replace(/[\`\"\[\]]/g, '');
          const rawTableName = rawFullTable.includes('.') ? rawFullTable.split('.').pop()! : rawFullTable;
          const nodeLabel = sanitizeKey(rawTableName, labelCasing);
          const body = tableMatch[2];

          const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
          let pkCol = '';
          const fkDefs: Array<{ fkCol: string; targetTable: string; targetCol: string }> = [];

          for (const line of lines) {
            if (/^PRIMARY\ KEY\b/i.test(line)) {
              const pkMatch = line.match(/PRIMARY\ KEY\s*\(([^)]+)\)/i);
              if (pkMatch) {
                pkCol = sanitizeKey(pkMatch[1].split(',')[0].trim().replace(/[\`\"\[\]]/g, ''), propCasing);
              }
              continue;
            }

            if (/FOREIGN\ KEY/i.test(line)) {
              const fkMatch = line.match(/FOREIGN\ KEY\s*\(\`?([a-zA-Z0-9_]+)\`?\)\s*REFERENCES\s*\`?([a-zA-Z0-9_]+)\`?\s*\(\`?([a-zA-Z0-9_]+)\`?\)/i);
              if (fkMatch) {
                fkDefs.push({
                  fkCol: sanitizeKey(fkMatch[1], propCasing),
                  targetTable: sanitizeKey(fkMatch[2], labelCasing),
                  targetCol: sanitizeKey(fkMatch[3], propCasing)
                });
              }
              continue;
            }

            const colMatch = line.match(/^\`?([a-zA-Z0-9_]+)\`?\s+([a-zA-Z0-9_\(\)]+)/);
            if (colMatch) {
              const colName = sanitizeKey(colMatch[1], propCasing);
              if (/PRIMARY\ KEY/i.test(line)) {
                pkCol = colName;
              }
            }
          }

          if (includeConstraints && pkCol) {
            const constraintName = `constraint_${nodeLabel.toLowerCase()}_${pkCol.toLowerCase()}`;
            if (!createdConstraints.has(constraintName)) {
              createdConstraints.add(constraintName);
              cypherStatements.push(`// Node uniqueness constraint for :${nodeLabel}`);
              cypherStatements.push(`CREATE CONSTRAINT FOR (n:${nodeLabel}) REQUIRE n.${pkCol} IS UNIQUE;`);
              cypherStatements.push('');
            }
          }

          cypherStatements.push(`// Node label mapping for SQL table "${rawTableName}" -> :${nodeLabel}`);
          if (cypherMode === 'MERGE') {
            cypherStatements.push(`// Usage: MERGE (n:${nodeLabel} { ${pkCol || 'id'}: <val> })`);
          } else {
            cypherStatements.push(`// Usage: CREATE (n:${nodeLabel} { ... })`);
          }
          cypherStatements.push('');
        }
        continue;
      }

      // 2. INSERT INTO
      if (/^INSERT\ INTO\b/i.test(stmt)) {
        const insertMatch = stmt.match(/INSERT\ INTO\s+\`?([a-zA-Z0-9_\.]+)\`?\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
        if (insertMatch) {
          const rawFullTable = insertMatch[1].replace(/[\`\"\[\]]/g, '');
          const rawTableName = rawFullTable.includes('.') ? rawFullTable.split('.').pop()! : rawFullTable;
          const nodeLabel = sanitizeKey(rawTableName, labelCasing);
          const cols = insertMatch[2].split(',').map(c => sanitizeKey(c.trim().replace(/[\`\"\[\]]/g, ''), propCasing));

          // Smart comma splitting for values
          const rawValsStr = insertMatch[3];
          const vals: string[] = [];
          let currentVal = '';
          let inQuotes = false;
          let quoteChar = '';

          for (let i = 0; i < rawValsStr.length; i++) {
            const ch = rawValsStr[i];
            if (ch === "'" || ch === '"') {
              if (!inQuotes) {
                inQuotes = true;
                quoteChar = ch;
              } else if (ch === quoteChar) {
                inQuotes = false;
              }
            }
            if (ch === ',' && !inQuotes) {
              vals.push(sanitizeStrVal(currentVal));
              currentVal = '';
            } else {
              currentVal += ch;
            }
          }
          if (currentVal.trim()) {
            vals.push(sanitizeStrVal(currentVal));
          }

          // Separate PK and normal attributes for MERGE
          const propPairs: string[] = [];
          let pkPropName = cols[0] || 'id';
          let pkPropVal = vals[0] || '1';

          const pkIndex = cols.findIndex(c => /id|pk|key/i.test(c));
          if (pkIndex !== -1 && vals[pkIndex] !== undefined) {
            pkPropName = cols[pkIndex];
            pkPropVal = vals[pkIndex];
          }

          cols.forEach((col, idx) => {
            const rawV = vals[idx];
            let formattedV = `'${rawV}'`;
            if (rawV === 'true' || rawV === 'false') formattedV = rawV;
            else if (rawV !== undefined && !isNaN(Number(rawV)) && rawV !== '') formattedV = rawV;

            propPairs.push(`${col}: ${formattedV}`);
          });

          if (cypherMode === 'MERGE') {
            let formattedPkVal = `'${pkPropVal}'`;
            if (pkPropVal === 'true' || pkPropVal === 'false') formattedPkVal = pkPropVal;
            else if (!isNaN(Number(pkPropVal)) && pkPropVal !== '') formattedPkVal = pkPropVal;

            cypherStatements.push(`MERGE (n:${nodeLabel} { ${pkPropName}: ${formattedPkVal} })`);
            cypherStatements.push(`SET n = { ${propPairs.join(', ')} };`);
          } else {
            cypherStatements.push(`CREATE (:${nodeLabel} { ${propPairs.join(', ')} });`);
          }

          // Foreign Key relationship creation if enabled
          if (includeRelationships) {
            const fkCols = cols.filter(c => c.endsWith('_id') || c.endsWith('Id') || c === 'parent_id');
            for (const fkCol of fkCols) {
              if (fkCol === pkPropName) continue;
              const targetEntity = sanitizeKey(fkCol.replace(/_?id$/i, 's'), labelCasing);
              const fkIndex = cols.indexOf(fkCol);
              const fkVal = vals[fkIndex];
              if (fkVal) {
                let formattedFkVal = `'${fkVal}'`;
                if (!isNaN(Number(fkVal)) && fkVal !== '') formattedFkVal = fkVal;

                const relType = `HAS_${sanitizeKey(fkCol.replace(/_?id$/i, ''), 'snake_case').toUpperCase()}`;
                cypherStatements.push(
                  `MATCH (a:${nodeLabel} { ${pkPropName}: ${isNaN(Number(pkPropVal)) ? `'${pkPropVal}'` : pkPropVal} }), (b:${targetEntity} { id: ${formattedFkVal} })\nMERGE (a)-[:${relType}]->(b);`
                );
              }
            }
          }
        }
        continue;
      }

      // 3. SELECT Queries
      if (/^SELECT\b/i.test(stmt)) {
        const selectMatch = stmt.match(/SELECT\s+(.+)\s+FROM\s+\`?([a-zA-Z0-9_\.]+)\`?(?:\s+WHERE\s+(.+))?/i);
        if (selectMatch) {
          const fieldsStr = selectMatch[1].trim();
          const rawFullTable = selectMatch[2].replace(/[\`\"\[\]]/g, '');
          const rawTableName = rawFullTable.includes('.') ? rawFullTable.split('.').pop()! : rawFullTable;
          const nodeLabel = sanitizeKey(rawTableName, labelCasing);
          const whereClause = selectMatch[3] ? selectMatch[3].trim() : '';

          let whereCypher = '';
          if (whereClause) {
            const idMatch = whereClause.match(/(?:[a-zA-Z0-9_]+)\s*=\s*(?:'([^']+)'|"([^"]+)"|([0-9a-zA-Z_\-]+))/i);
            if (idMatch) {
              const matchedVal = idMatch[1] || idMatch[2] || idMatch[3];
              const formattedVal = isNaN(Number(matchedVal)) ? `'${matchedVal}'` : matchedVal;
              whereCypher = ` WHERE n.id = ${formattedVal}`;
            }
          }

          if (fieldsStr === '*') {
            cypherStatements.push(`MATCH (n:${nodeLabel})${whereCypher}\nRETURN n;`);
          } else {
            const fields = fieldsStr.split(',').map(f => sanitizeKey(f.trim().replace(/[\`\"\[\]]/g, ''), propCasing));
            const returnFields = fields.map(f => `n.${f}`).join(', ');
            cypherStatements.push(`MATCH (n:${nodeLabel})${whereCypher}\nRETURN ${returnFields};`);
          }
        }
        continue;
      }
    }

    return cypherStatements.join('\n');
  }, [cypherMode, labelCasing, propCasing, includeConstraints, includeRelationships]);

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

      const cypherCode = parseSqlToCypher(input);
      if (!cypherCode.trim()) {
        setError(t('sqltocypher.no_statements_found') || 'No recognizable SQL CREATE TABLE, INSERT INTO, or SELECT statements found.');
        setOutput('');
        return;
      }

      setOutput(cypherCode);
      setError('');
    } catch (e: any) {
      setError('SQL Parsing Error: ' + (e.message || e));
    }
  }, [input, parseSqlToCypher, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  useEffect(() => {
    onStateChange?.({ input, output, cypherMode, labelCasing, propCasing, includeConstraints, includeRelationships });
  }, [input, output, cypherMode, labelCasing, propCasing, includeConstraints, includeRelationships, onStateChange]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('common.cleared', { defaultValue: 'Cleared' }));
    primaryInputRef.current?.focus();
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', { defaultValue: 'Copied to clipboard' }));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current || !containerRef.current.contains(document.activeElement)) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const selectedText = window.getSelection()?.toString();
        if (!selectedText) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleApplyPreset = (preset: Preset) => {
    setInput(preset.data);
    setActivePreset(preset.id);
    toast.success(t('common.preset_applied', { name: preset.label, defaultValue: `Applied preset: ${preset.label}` }));
    primaryInputRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neo4j-cypher-${Date.now()}.cypher`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded') || 'Downloaded file');
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Start Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('sqltocypher.presets_title') || 'Quick Start SQL Presets'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CYPHER_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              aria-pressed={activePreset === preset.id}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePreset === preset.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="sql-cypher-mode" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltocypher.mode_label') || 'Cypher Clause Mode'}
          </label>
          <select
            id="sql-cypher-mode"
            value={cypherMode}
            onChange={e => setCypherMode(e.target.value as CypherMode)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="MERGE">MERGE (Idempotent Upsert)</option>
            <option value="CREATE">CREATE (Always Add Nodes)</option>
          </select>
        </div>

        <div>
          <label htmlFor="sql-cypher-label-casing" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltocypher.label_casing') || 'Node Label Casing'}
          </label>
          <select
            id="sql-cypher-label-casing"
            value={labelCasing}
            onChange={e => setLabelCasing(e.target.value as CasingOption)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="PascalCase">PascalCase (:User, :Product)</option>
            <option value="snake_case">snake_case (:user_account)</option>
            <option value="original">Original Table Name</option>
          </select>
        </div>

        <div>
          <label htmlFor="sql-cypher-prop-casing" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltocypher.prop_casing') || 'Property Casing'}
          </label>
          <select
            id="sql-cypher-prop-casing"
            value={propCasing}
            onChange={e => setPropCasing(e.target.value as CasingOption)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="camelCase">camelCase (n.firstName)</option>
            <option value="snake_case">snake_case (n.first_name)</option>
            <option value="PascalCase">PascalCase (n.FirstName)</option>
            <option value="original">Original Column Name</option>
          </select>
        </div>

        <div className="flex items-center gap-4 pt-2 col-span-1 md:col-span-2 lg:col-span-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeConstraints}
              onChange={e => setIncludeConstraints(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('sqltocypher.include_constraints') || 'Generate CREATE CONSTRAINT for Primary Keys'}
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeRelationships}
              onChange={e => setIncludeRelationships(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('sqltocypher.include_relationships') || 'Generate Relationships for Foreign Keys'}
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Editor & Output Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-500" />
              <label htmlFor="sql-cypher-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltocypher.input_label') || 'SQL Statements Input'}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">
                Esc
              </kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear') || 'Clear'}
              </button>
            </div>
          </div>
          <textarea
            id="sql-cypher-input"
            ref={primaryInputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder="CREATE TABLE users (user_id INT PRIMARY KEY, name VARCHAR(100));"
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="cypher-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltocypher.output_label') || 'Generated Neo4j Cypher Output'}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900">
                Ctrl+C
              </kbd>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download') || 'Download'}
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
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{' '}
                {copied ? t('common.copied') || 'Copied' : t('common.copy') || 'Copy'}
              </button>
            </div>
          </div>
          <textarea
            id="cypher-output"
            value={output}
            readOnly
            placeholder={t('sqltocypher.placeholder_output') || 'Generated Neo4j Cypher queries will appear here...'}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      {/* Educational / Documentation Footer */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
          <Network className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">{t('sqltocypher.about_title') || 'SQL to Neo4j Cypher Generator'}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltocypher.about_text') ||
              'Convert relational SQL CREATE TABLE, INSERT INTO, and SELECT queries into Neo4j Cypher graph queries.'}
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-5">
            <li>{t('sqltocypher.list_item_1') || 'Transforms SQL tables into Node Labels and columns into Node Properties.'}</li>
            <li>{t('sqltocypher.list_item_2') || 'Maps Primary Keys into CREATE CONSTRAINT unique index statements.'}</li>
            <li>{t('sqltocypher.list_item_3') || 'Supports MERGE or CREATE clauses and automatically creates graph relationships for Foreign Keys.'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
