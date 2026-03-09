import { useState } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, FileCode } from 'lucide-react';
import { format } from 'sql-formatter';

export function SQLFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState('sql');
  const [indentStyle, setIndentStyle] = useState<'tabularLeft' | 'standard'>('tabularLeft');
  const [realtime, setRealtime] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const languages = [
    { id: 'sql', name: 'Standard SQL' },
    { id: 'mysql', name: 'MySQL' },
    { id: 'postgresql', name: 'PostgreSQL' },
    { id: 'sqlite', name: 'SQLite' },
    { id: 'mariadb', name: 'MariaDB' },
    { id: 'tsql', name: 'T-SQL' },
  ];

  const handleFormat = (val: string = input) => {
    try {
      if (!val.trim()) {
        setOutput('');
        return;
      }
      const formatted = format(val, {
        language: language as any,
        tabWidth: 2,
        keywordCase: 'upper',
        indentStyle: indentStyle
      });
      setOutput(formatted);
      setError('');
    } catch (e: any) {
      if (!realtime) setError('Erreur de formatage : ' + e.message);
    }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (realtime) handleFormat(val);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              language === lang.id
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            {lang.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <label htmlFor="sql-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Requête SQL</label>
            </div>
            <button
              onClick={handleClear}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            id="sql-input"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="SELECT * FROM users WHERE id = 1;"
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="sql-output" className="text-xs font-black uppercase tracking-widest text-slate-400">SQL Formaté</label>
            </div>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 disabled:opacity-50'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            id="sql-output"
            value={output}
            readOnly
            placeholder="Le SQL formaté apparaîtra ici..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              id="realtime-toggle"
              type="checkbox"
              checked={realtime}
              onChange={(e) => setRealtime(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="realtime-toggle" className="text-sm font-bold text-slate-600 dark:text-slate-400">Temps réel</label>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="indent-style" className="text-sm font-bold text-slate-600 dark:text-slate-400">Style :</label>
            <select
              id="indent-style"
              value={indentStyle}
              onChange={(e) => setIndentStyle(e.target.value as any)}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
            >
              <option value="tabularLeft">Tabulaire</option>
              <option value="standard">Standard</option>
            </select>
          </div>
        </div>

        {!realtime && (
          <button
            onClick={() => handleFormat()}
            className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-90 flex items-center gap-2"
          >
            <Database className="w-5 h-5" /> Formater le SQL
          </button>
        )}
      </div>
    </div>
  );
}
