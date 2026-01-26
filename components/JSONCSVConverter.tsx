import { useState } from 'react';
import { FileJson, FileText, ArrowLeftRight, Trash2, Copy, Check, AlertCircle, Download } from 'lucide-react';

export function JSONCSVConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'jsonToCsv' | 'csvToJson'>('jsonToCsv');

  const jsonToCsv = (json: string) => {
    try {
      const data = JSON.parse(json);
      const array = Array.isArray(data) ? data : [data];

      if (array.length === 0) return "";

      const headers = Array.from(new Set(array.flatMap(obj => Object.keys(obj))));
      const csvRows = [];
      csvRows.push(headers.join(','));

      for (const row of array) {
        const values = headers.map(header => {
          const val = row[header];
          if (val === null || val === undefined) return '""';
          const escaped = ('' + val).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      return csvRows.join('\n');
    } catch (e) {
      throw new Error("JSON invalide ou structure incompatible : " + (e as Error).message);
    }
  };

  const parseCsv = (csv: string) => {
    const lines = [];
    let currentLine: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < csv.length; i++) {
      const char = csv[i];
      const nextChar = csv[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentLine.push(currentField);
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentLine.push(currentField);
        if (currentLine.length > 0 || lines.length > 0) lines.push(currentLine);
        currentLine = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    if (currentField !== '' || currentLine.length > 0) {
      currentLine.push(currentField);
      lines.push(currentLine);
    }
    return lines;
  };

  const csvToJson = (csv: string) => {
    try {
      const lines = parseCsv(csv.trim());
      if (lines.length < 2) return "[]";

      const headers = lines[0].map(h => h.trim());
      const result = [];

      for (let i = 1; i < lines.length; i++) {
        const obj: any = {};
        const currentline = lines[i];

        for (let j = 0; j < headers.length; j++) {
          let val = currentline[j] || "";

          // Try to parse as number or boolean
          const lowerVal = val.toLowerCase().trim();
          if (lowerVal === 'true') obj[headers[j]] = true;
          else if (lowerVal === 'false') obj[headers[j]] = false;
          else if (lowerVal === 'null') obj[headers[j]] = null;
          else if (!isNaN(Number(val)) && val.trim() !== "") obj[headers[j]] = Number(val);
          else obj[headers[j]] = val;
        }
        result.push(obj);
      }
      return JSON.stringify(result, null, 2);
    } catch (e) {
      throw new Error("CSV invalide ou erreur de parsing : " + (e as Error).message);
    }
  };

  const handleConvert = () => {
    try {
      setError('');
      if (!input.trim()) return;
      if (mode === 'jsonToCsv') {
        setOutput(jsonToCsv(input));
      } else {
        setOutput(csvToJson(input));
      }
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const element = document.createElement("a");
    const file = new Blob([output], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = mode === 'jsonToCsv' ? "data.csv" : "data.json";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => { setMode('jsonToCsv'); setInput(''); setOutput(''); setError(''); }}
          className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'jsonToCsv' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <FileJson className="w-4 h-4" /> JSON vers CSV
        </button>
        <button
          onClick={() => { setMode('csvToJson'); setInput(''); setOutput(''); setError(''); }}
          className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'csvToJson' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <FileText className="w-4 h-4" /> CSV vers JSON
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              {mode === 'jsonToCsv' ? <FileJson className="w-3 h-3" /> : <FileText className="w-3 h-3" />} Entrée ({mode === 'jsonToCsv' ? 'JSON' : 'CSV'})
            </label>
            <button onClick={clearAll} className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] font-mono text-sm outline-none focus:border-indigo-500 transition-all shadow-inner dark:text-slate-300"
            placeholder={mode === 'jsonToCsv' ? '[{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]' : 'id,name\n1,John\n2,Jane'}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              {mode === 'jsonToCsv' ? <FileText className="w-3 h-3" /> : <FileJson className="w-3 h-3" />} Résultat ({mode === 'jsonToCsv' ? 'CSV' : 'JSON'})
            </label>
            <div className="flex gap-2">
              {output && (
                <>
                  <button onClick={downloadFile} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors" title="Télécharger">
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400'}`}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                </>
              )}
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            className="w-full h-96 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] font-mono text-sm text-indigo-600 dark:text-indigo-400 outline-none shadow-sm"
            placeholder="Le résultat apparaîtra ici..."
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={!input.trim()}
        className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-[2.5rem] font-black text-lg hover:opacity-90 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/10"
      >
        <ArrowLeftRight className="w-6 h-6" /> Convertir maintenant
      </button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">À propos de la conversion</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h4 className="font-bold">JSON vers CSV</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Le JSON doit être un tableau d'objets. Les clés du premier objet seront utilisées comme en-têtes de colonnes. Les valeurs sont automatiquement échappées si elles contiennent des virgules ou des guillemets.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold">CSV vers JSON</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              La première ligne du CSV doit contenir les en-têtes. Le convertisseur tente de détecter automatiquement les nombres, les booléens et les valeurs nulles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
