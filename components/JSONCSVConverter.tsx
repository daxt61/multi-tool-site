import { useState } from 'react';
import { Check, AlertCircle, Trash2, Copy, FileJson, Zap, FileSpreadsheet, ArrowLeftRight } from 'lucide-react';

export function JSONCSVConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const formatJSON = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError('JSON invalide : ' + (e as Error).message);
      setOutput('');
    }
  };

  const minifyJSON = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
    } catch (e) {
      setError('JSON invalide : ' + (e as Error).message);
      setOutput('');
    }
  };

  const jsonToCsv = () => {
    try {
      if (!input.trim()) return;
      let parsed = JSON.parse(input);

      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }

      if (parsed.length === 0) {
        setOutput('');
        return;
      }

      const headers = Object.keys(parsed[0]);
      const csvRows = [
        headers.join(','),
        ...parsed.map((row: any) =>
          headers.map(fieldName => {
            const val = row[fieldName] ?? '';
            const cell = typeof val === 'object' ? JSON.stringify(val) : String(val);
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          }).join(',')
        )
      ];

      setOutput(csvRows.join('\n'));
      setError('');
    } catch (e) {
      setError('Échec de la conversion JSON vers CSV : ' + (e as Error).message);
      setOutput('');
    }
  };

  const csvToJson = () => {
    try {
      if (!input.trim()) return;
      const lines = input.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) {
        setError('Le CSV doit contenir au moins une ligne d\'en-tête et une ligne de données.');
        return;
      }

      const parseCSVLine = (line: string) => {
        const result = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuote && line[i+1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuote = !inQuote;
            }
          } else if (char === ',' && !inQuote) {
            result.push(cur);
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur);
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.trim());
      const result = lines.slice(1).map(line => {
        const values = parseCSVLine(line).map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] !== undefined ? values[i] : null;
        });
        return obj;
      });

      setOutput(JSON.stringify(result, null, 2));
      setError('');
    } catch (e) {
      setError('Échec de la conversion CSV vers JSON : ' + (e as Error).message);
      setOutput('');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileJson className="w-3 h-3" /> Entrée (JSON ou CSV)
            </label>
            <button
              onClick={clearAll}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-64 lg:h-96 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-2xl resize-none font-mono text-sm outline-none transition-all dark:text-slate-300 shadow-inner"
            placeholder='JSON: [{"id": 1, "name": "John"}]&#10;CSV: id,name&#10;1,John'
          />
        </div>

        {/* Output */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Résultat
            </label>
            {output && (
              <button
                onClick={copyToClipboard}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                  copied ? 'bg-emerald-500 text-white' : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            )}
          </div>
          <textarea
            value={output}
            readOnly
            className="w-full h-64 lg:h-96 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl resize-none font-mono text-sm text-indigo-600 dark:text-indigo-400 outline-none shadow-sm"
            placeholder="Le résultat apparaîtra ici..."
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={formatJSON}
          disabled={!input}
          className="py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          <FileJson className="w-4 h-4" /> JSON Beau
        </button>
        <button
          onClick={minifyJSON}
          disabled={!input}
          className="py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
        >
          Minifier JSON
        </button>
        <button
          onClick={jsonToCsv}
          disabled={!input}
          className="py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          <ArrowLeftRight className="w-4 h-4" /> JSON → CSV
        </button>
        <button
          onClick={csvToJson}
          disabled={!input}
          className="py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          <FileSpreadsheet className="w-4 h-4" /> CSV → JSON
        </button>
      </div>
    </div>
  );
}
