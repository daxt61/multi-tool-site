import { useState, useMemo } from 'react';
import { Copy, Check, Trash2, Braces, FileCode, Info, AlertCircle } from 'lucide-react';

export function JSONSchemaGenerator() {
  const [jsonInput, setJsonInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSchema = (obj: any): any => {
    const type = typeof obj;

    if (obj === null) {
      return { type: 'null' };
    }

    if (Array.isArray(obj)) {
      const items = obj.length > 0 ? generateSchema(obj[0]) : {};
      return {
        type: 'array',
        items
      };
    }

    if (type === 'object') {
      const properties: any = {};
      const required: string[] = [];

      Object.entries(obj).forEach(([key, value]) => {
        properties[key] = generateSchema(value);
        required.push(key);
      });

      return {
        type: 'object',
        properties,
        required
      };
    }

    return { type };
  };

  const schemaResult = useMemo(() => {
    if (!jsonInput.trim()) {
      setError(null);
      return '';
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setError(null);
      const schema = {
        $schema: "http://json-schema.org/draft-07/schema#",
        title: "Generated Schema",
        ...generateSchema(parsed)
      };
      return JSON.stringify(schema, null, 2);
    } catch (e: any) {
      setError(e.message);
      return '';
    }
  }, [jsonInput]);

  const handleCopy = () => {
    if (!schemaResult) return;
    navigator.clipboard.writeText(schemaResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setJsonInput('');
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" /> JSON d'entrée
            </label>
            <button
              onClick={handleClear}
              disabled={!jsonInput}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <div className="relative group">
            <textarea
              id="json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "nom": "Jean", "age": 30 }'
              className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-[2rem] outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm dark:text-slate-300 resize-none`}
            />
            {error && (
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="schema-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" /> JSON Schema généré
            </label>
            <button
              onClick={handleCopy}
              disabled={!schemaResult}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-6 h-[500px] overflow-auto border border-slate-800 shadow-xl shadow-indigo-500/5">
            <pre className="text-sm font-mono text-indigo-400 leading-relaxed">
              {schemaResult || <span className="text-slate-600 italic">Le schéma apparaîtra ici après avoir saisi un JSON valide...</span>}
            </pre>
          </div>
        </div>
      </div>

      {/* Info Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <Braces className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Qu'est-ce que JSON Schema ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            JSON Schema est un vocabulaire qui permet d'annoter et de valider les documents JSON. Il fournit une structure claire pour vos données.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Comment ça marche ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'outil analyse récursivement votre objet JSON pour en déduire les types, les propriétés et les champs requis pour générer un schéma Draft 7.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <FileCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Utilisation</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilisez le schéma généré pour valider les entrées de vos APIs, générer de la documentation ou des interfaces utilisateur dynamiques.
          </p>
        </div>
      </div>
    </div>
  );
}
