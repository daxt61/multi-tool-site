import { useState, useEffect } from 'react';
import { Table, Plus, RotateCcw, Copy, Check, Download, AlertCircle, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_ROWS = 50;
const MAX_COLS = 10;
const MAX_CELL_LENGTH = 1000;

export function MarkdownTableGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [data, setData] = useState<string[][]>(() => {
    // Sentinel: Validate and slice initialData to mitigate local DoS from massive tables.
    const rawData = initialData?.data || [
      ['En-tête 1', 'En-tête 2', 'En-tête 3'],
      ['Donnée 1', 'Donnée 2', 'Donnée 3'],
      ['Donnée 4', 'Donnée 5', 'Donnée 6']
    ];

    if (!Array.isArray(rawData)) return [['']];

    return rawData.slice(0, MAX_ROWS).map(row =>
      Array.isArray(row) ? row.slice(0, MAX_COLS).map(cell => String(cell || '').slice(0, MAX_CELL_LENGTH)) : []
    );
  });

  const [alignments, setAlignments] = useState<('left' | 'center' | 'right')[]>(() => {
    if (initialData?.alignments && Array.isArray(initialData.alignments)) {
      return initialData.alignments.slice(0, MAX_COLS);
    }
    return Array(data[0].length).fill('left');
  });

  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ data, alignments });
  }, [data, alignments]);

  const updateCell = (r: number, c: number, val: string) => {
    if (val.length > MAX_CELL_LENGTH) {
      setError(`La cellule est limitée à ${MAX_CELL_LENGTH} caractères.`);
      return;
    }
    setError(null);
    const newData = data.map((row, rowIndex) =>
      rowIndex === r ? row.map((cell, cellIndex) => cellIndex === c ? val : cell) : row
    );
    setData(newData);
  };

  const addRow = () => {
    if (data.length >= MAX_ROWS) {
      setError(`Nombre maximal de lignes atteint (${MAX_ROWS}).`);
      return;
    }
    setError(null);
    setData([...data, Array(data[0].length).fill('')]);
  };

  const addCol = () => {
    if (data[0].length >= MAX_COLS) {
      setError(`Nombre maximal de colonnes atteint (${MAX_COLS}).`);
      return;
    }
    setError(null);
    setData(data.map(row => [...row, '']));
    setAlignments([...alignments, 'left']);
  };

  const removeRow = (r: number) => {
    if (data.length <= 1) return;
    setError(null);
    setData(data.filter((_, index) => index !== r));
  };

  const removeCol = (c: number) => {
    if (data[0].length <= 1) return;
    setError(null);
    setData(data.map(row => row.filter((_, index) => index !== c)));
    setAlignments(alignments.filter((_, index) => index !== c));
  };

  const generateMarkdown = () => {
    if (data.length === 0) return '';
    const escape = (val: string) => String(val).replace(/\|/g, '\\|');
    let md = '| ' + data[0].map(escape).join(' | ') + ' |\n';
    md += '| ' + alignments.map(a => {
      if (a === 'center') return ':---:';
      if (a === 'right') return '---:';
      return ':---';
    }).join(' | ') + ' |\n';
    for (let i = 1; i < data.length; i++) {
      md += '| ' + data[i].map(escape).join(' | ') + ' |\n';
    }
    return md;
  };

  const generateHtml = () => {
    if (data.length === 0) return '';
    const escape = (val: string) => String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    let html = '<table class="table-auto border-collapse border border-slate-400">\n';

    // Header
    html += '  <thead>\n    <tr>\n';
    data[0].forEach((cell, idx) => {
      const alignClass = alignments[idx] === 'center' ? 'text-center' : (alignments[idx] === 'right' ? 'text-right' : 'text-left');
      html += `      <th class="border border-slate-300 px-4 py-2 ${alignClass}">${escape(cell)}</th>\n`;
    });
    html += '    </tr>\n  </thead>\n';

    // Body
    html += '  <tbody>\n';
    for (let i = 1; i < data.length; i++) {
      html += '    <tr>\n';
      data[i].forEach((cell, idx) => {
        const alignClass = alignments[idx] === 'center' ? 'text-center' : (alignments[idx] === 'right' ? 'text-right' : 'text-left');
        html += `      <td class="border border-slate-300 px-4 py-2 ${alignClass}">${escape(cell)}</td>\n`;
      });
      html += '    </tr>\n';
    }
    html += '  </tbody>\n</table>';

    return html;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyHtmlToClipboard = () => {
    navigator.clipboard.writeText(generateHtml());
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleDownload = () => {
    const content = generateMarkdown();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `table-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setData([
      ['En-tête 1', 'En-tête 2', 'En-tête 3'],
      ['Donnée 1', 'Donnée 2', 'Donnée 3'],
      ['Donnée 4', 'Donnée 5', 'Donnée 6']
    ]);
    setAlignments(['left', 'left', 'left']);
    setError(null);
  };

  const updateAlignment = (c: number, align: 'left' | 'center' | 'right') => {
    const newAlignments = [...alignments];
    newAlignments[c] = align;
    setAlignments(newAlignments);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-3">
          <button
            onClick={addRow}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> {t('markdown.add_row')}
          </button>
          <button
            onClick={addCol}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> {t('markdown.add_col')}
          </button>
          <button
            onClick={reset}
            disabled={JSON.stringify(data) === JSON.stringify([['En-tête 1', 'En-tête 2', 'En-tête 3'],['Donnée 1', 'Donnée 2', 'Donnée 3'],['Donnée 4', 'Donnée 5', 'Donnée 6']])}
            className="px-4 py-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <Download className="w-4 h-4" /> Télécharger
          </button>
          <button
            onClick={copyHtmlToClipboard}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              copiedHtml
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {copiedHtml ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
            {copiedHtml ? 'Copié' : 'Copier HTML'}
          </button>
          <button
            onClick={copyToClipboard}
            className={`px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié' : 'Copier le Markdown'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <table className="w-full border-separate border-spacing-2">
          <thead>
            <tr>
              {data[0].map((_, c) => (
                <th key={c} className="p-1 relative group">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button
                          key={a}
                          onClick={() => updateAlignment(c, a)}
                          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-all ${
                            alignments[c] === a
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                          }`}
                          title={t(`markdown.align_${a}`)}
                        >
                          {a.charAt(0).toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={data[0][c]}
                      onChange={(e) => updateCell(0, c, e.target.value)}
                      className={`w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        alignments[c] === 'center' ? 'text-center' : (alignments[c] === 'right' ? 'text-right' : 'text-left')
                      }`}
                    />
                  </div>
                  <button
                    onClick={() => removeCol(c)}
                    className="absolute top-8 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
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
                      className={`w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        alignments[c] === 'center' ? 'text-center' : (alignments[c] === 'right' ? 'text-right' : 'text-left')
                      }`}
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
