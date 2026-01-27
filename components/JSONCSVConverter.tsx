import { useState } from 'react';
import { FileCode, FileSpreadsheet, Copy, Check, Trash2, AlertCircle } from 'lucide-react';

export function JSONCSVConverter() {
  const [jsonInput, setJsonInput] = useState('');
  const [csvInput, setCsvInput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'json' | 'csv' | null>(null);

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const parseCSVLine = (line: string) => {
    const result = [];
    let startValueIndex = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      if (line[i] === ',' && !inQuotes) {
        result.push(line.substring(startValueIndex, i));
        startValueIndex = i + 1;
      }
    }
    result.push(line.substring(startValueIndex));
    return result.map(v => {
      v = v.trim();
      if (v.startsWith('"') && v.endsWith('"')) {
        return v.substring(1, v.length - 1).replace(/""/g, '"');
      }
      return v;
    });
  };

  const jsonToCsv = (json: string) => {
    try {
      setError('');
      if (!json.trim()) return '';
      const obj = JSON.parse(json);
      const array = Array.isArray(obj) ? obj : [obj];
      if (array.length === 0) return '';

      const headers = Object.keys(array[0]);
      const csvRows = [
        headers.join(','),
        ...array.map(row => headers.map(header => formatValue(row[header])).join(','))
      ];
      return csvRows.join('\n');
    } catch (e) {
      setError('JSON invalide');
      return '';
    }
  };

  const csvToJson = (csv: string) => {
    try {
      setError('');
      if (!csv.trim()) return '';
      const lines = csv.trim().split('\n');
      if (lines.length < 2) return '';
      const headers = parseCSVLine(lines[0]);
      const result = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        return headers.reduce((obj, header, index) => {
          let val: any = values[index];
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (!isNaN(Number(val)) && val !== '') val = Number(val);
          obj[header] = val;
          return obj;
        }, {} as any);
      });
      return JSON.stringify(result, null, 2);
    } catch (e) {
      setError('CSV invalide');
      return '';
    }
  };

  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    const csv = jsonToCsv(val);
    if (csv) setCsvInput(csv);
  };

  const handleCsvChange = (val: string) => {
    setCsvInput(val);
    const json = csvToJson(val);
    if (json) setJsonInput(json);
  };

  const copyToClipboard = (text: string, type: 'json' | 'csv') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* JSON Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">JSON</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(jsonInput, 'json')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'json' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied === 'json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'json' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => {setJsonInput(''); setCsvInput(''); setError('');}}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='[{"id": 1, "name": "Test"}]'
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* CSV Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">CSV</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(csvInput, 'csv')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'csv' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied === 'csv' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'csv' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            value={csvInput}
            onChange={(e) => handleCsvChange(e.target.value)}
            placeholder='id,name\n1,Test'
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
