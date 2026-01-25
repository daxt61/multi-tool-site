import { useState } from 'react';
import { Table, Plus, RotateCcw, Copy, Check } from 'lucide-react';

export function MarkdownTableGenerator() {
  const [data, setData] = useState<string[][]>([
    ['En-tête 1', 'En-tête 2', 'En-tête 3'],
    ['Donnée 1', 'Donnée 2', 'Donnée 3'],
    ['Donnée 4', 'Donnée 5', 'Donnée 6']
  ]);
  const [copied, setCopied] = useState(false);

  const updateCell = (r: number, c: number, val: string) => {
    const newData = data.map((row, rowIndex) =>
      rowIndex === r ? row.map((cell, cellIndex) => cellIndex === c ? val : cell) : row
    );
    setData(newData);
  };

  const addRow = () => {
    setData([...data, Array(data[0].length).fill('')]);
  };

  const addCol = () => {
    setData(data.map(row => [...row, '']));
  };

  const removeRow = (r: number) => {
    if (data.length <= 1) return;
    setData(data.filter((_, index) => index !== r));
  };

  const removeCol = (c: number) => {
    if (data[0].length <= 1) return;
    setData(data.map(row => row.filter((_, index) => index !== c)));
  };

  const generateMarkdown = () => {
    if (data.length === 0) return '';
    let md = '| ' + data[0].join(' | ') + ' |\n';
    md += '| ' + data[0].map(() => '---').join(' | ') + ' |\n';
    for (let i = 1; i < data.length; i++) {
      md += '| ' + data[i].join(' | ') + ' |\n';
    }
    return md;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setData([
      ['En-tête 1', 'En-tête 2', 'En-tête 3'],
      ['Donnée 1', 'Donnée 2', 'Donnée 3'],
      ['Donnée 4', 'Donnée 5', 'Donnée 6']
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-3">
          <button
            onClick={addRow}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Ajouter ligne
          </button>
          <button
            onClick={addCol}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Ajouter colonne
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        <button
          onClick={copyToClipboard}
          className={`px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'}`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copié' : 'Copier le Markdown'}
        </button>
      </div>

      <div className="overflow-x-auto bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <table className="w-full border-separate border-spacing-2">
          <thead>
            <tr>
              {data[0].map((_, c) => (
                <th key={c} className="p-1 relative group">
                   <input
                    type="text"
                    value={data[0][c]}
                    onChange={(e) => updateCell(0, c, e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    onClick={() => removeCol(c)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                  >
                    ×
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(1).map((row, r) => (
              <tr key={r}>
                {row.map((_, c) => (
                  <td key={c} className="p-1 relative group">
                    <input
                      type="text"
                      value={data[r + 1][c]}
                      onChange={(e) => updateCell(r + 1, c, e.target.value)}
                      className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    {c === row.length - 1 && (
                       <button
                       onClick={() => removeRow(r + 1)}
                       className="absolute top-1/2 -right-6 -translate-y-1/2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                     >
                       ×
                     </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Table className="w-4 h-4 text-indigo-500" />
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Prévisualisation Markdown</label>
        </div>
        <pre className="p-6 bg-slate-900 text-indigo-300 rounded-3xl font-mono text-sm overflow-x-auto selection:bg-indigo-500/30">
          {generateMarkdown()}
        </pre>
      </div>
    </div>
  );
}
