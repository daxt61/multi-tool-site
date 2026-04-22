import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Search, X, Copy, Check, Trash2, FolderOpen, FileCode, Braces } from 'lucide-react';

interface TreeNodeProps {
  label: string;
  value: any;
  depth: number;
  searchQuery: string;
  isInitiallyExpanded?: boolean;
}

const TreeNode = ({ label, value, depth, searchQuery, isInitiallyExpanded = false }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  const toggle = () => setIsExpanded(!isExpanded);

  const highlightSearch = (text: string) => {
    if (!searchQuery) return text;
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase()
            ? <span key={i} className="bg-yellow-200 dark:bg-yellow-800/50 text-slate-900 dark:text-white px-0.5 rounded">{part}</span>
            : part
        )}
      </>
    );
  };

  const renderValue = () => {
    if (value === null) return <span className="text-rose-500">null</span>;
    if (typeof value === 'boolean') return <span className="text-amber-500">{String(value)}</span>;
    if (typeof value === 'number') return <span className="text-indigo-500 font-mono">{value}</span>;
    if (typeof value === 'string') return <span className="text-emerald-600 dark:text-emerald-400">"{highlightSearch(value)}"</span>;
    return null;
  };

  const children = isObject ? Object.entries(value) : [];

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group ${depth === 0 ? 'mt-2' : ''}`}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        onClick={isObject ? toggle : undefined}
      >
        {isObject ? (
          <>
            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {label ? <>{highlightSearch(label)}: </> : ''}
              <span className="text-xs text-slate-400 font-normal">
                {isArray ? `Array(${children.length})` : `Object`}
              </span>
            </span>
          </>
        ) : (
          <>
            <div className="w-4 h-4" />
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {highlightSearch(label)}:
            </span>
            <span className="ml-2 truncate">{renderValue()}</span>
          </>
        )}
      </div>

      {isObject && isExpanded && (
        <div className="border-l border-slate-200 dark:border-slate-800 ml-4">
          {children.map(([key, val]) => (
            <TreeNode
              key={key}
              label={key}
              value={val}
              depth={depth + 1}
              searchQuery={searchQuery}
              isInitiallyExpanded={isInitiallyExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function JsonTreeViewer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandAll, setExpandAll] = useState(false);

  const parsedJson = useMemo(() => {
    if (!jsonInput.trim()) {
      setError(null);
      return null;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      setError(null);
      return parsed;
    } catch (e: any) {
      setError(`JSON Invalide: ${e.message}`);
      return null;
    }
  }, [jsonInput]);

  useEffect(() => {
    onStateChange?.({ jsonInput });
  }, [jsonInput, onStateChange]);

  const handleCopy = () => {
    if (!jsonInput) return;
    navigator.clipboard.writeText(jsonInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Entrée JSON</label>
            <div className="flex gap-2">
               <button
                onClick={handleCopy}
                disabled={!jsonInput || !!error}
                className={`text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-transparent hover:bg-indigo-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => setJsonInput('')}
                disabled={!jsonInput}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <div className="relative group">
            <textarea
              id="json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "exemple": "valeur", "tableau": [1, 2, 3] }'
              className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-3xl outline-none focus:ring-2 transition-all font-mono text-sm dark:text-slate-300 resize-none`}
            />
            {error && (
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-rose-500 text-white text-xs font-bold rounded-xl animate-in fade-in slide-in-from-bottom-2">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Tree Viewer */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Visualisation en Arbre</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setExpandAll(!expandAll)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all whitespace-nowrap"
              >
                {expandAll ? 'Tout Réduire' : 'Tout Développer'}
              </button>
            </div>
          </div>

          <div className="w-full h-[500px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-y-auto p-4 custom-scrollbar shadow-inner">
            {parsedJson ? (
              <TreeNode
                label=""
                value={parsedJson}
                depth={0}
                searchQuery={searchQuery}
                isInitiallyExpanded={expandAll}
                key={expandAll ? 'expanded' : 'collapsed'}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Braces className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">Entrez un JSON valide pour commencer l'exploration</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
         <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl space-y-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 dark:border-slate-700">
               <FolderOpen className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm dark:text-white">Exploration Hiérarchique</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Parcourez vos structures JSON complexes de manière visuelle en développant les objets et tableaux.</p>
         </div>
         <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl space-y-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 dark:border-slate-700">
               <Search className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm dark:text-white">Recherche Rapide</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Filtrez instantanément les clés et les valeurs pour trouver précisément l'information que vous cherchez.</p>
         </div>
         <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl space-y-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 dark:border-slate-700">
               <FileCode className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm dark:text-white">Formatage Automatique</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Coloration syntaxique intégrée pour différencier les types de données (chaînes, nombres, booléens, null).</p>
         </div>
      </div>
    </div>
  );
}
