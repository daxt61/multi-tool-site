import { useState, useEffect } from 'react';
import { Table, Plus, RotateCcw, Copy, Check, Download, AlertCircle, Code, FileSpreadsheet, X as CloseIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_ROWS = 50;
const MAX_COLS = 10;
const MAX_CELL_LENGTH = 1000;

export function MarkdownTableGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [data, setData] = useState<string[][]>(() => {
    // Sentinel: Validate and slice initialData to mitigate local DoS from massive tables.
    const rawData = initialData?.data || [
      [t('markdown.header') + ' 1', t('markdown.header') + ' 2', t('markdown.header') + ' 3'],
      [t('markdown.data') + ' 1', t('markdown.data') + ' 2', t('markdown.data') + ' 3'],
      [t('markdown.data') + ' 4', t('markdown.data') + ' 5', t('markdown.data') + ' 6']
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
  const [isImporting, setIsImporting] = useState(false);
  const [csvInput, setCsvInput] = useState('');

  useEffect(() => {
    onStateChange?.({ data, alignments });
  }, [data, alignments]);

  const updateCell = (r: number, c: number, val: string) => {
    if (val.length > MAX_CELL_LENGTH) {
      setError(t('error.max_length', { max: MAX_CELL_LENGTH }));
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
      setError(t('markdown.error_max_rows', { max: MAX_ROWS }));
      return;
    }
    setError(null);
    setData([...data, Array(data[0].length).fill('')]);
  };

  const addCol = () => {
    if (data[0].length >= MAX_COLS) {
      setError(t('markdown.error_max_cols', { max: MAX_COLS }));
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
      [t('markdown.header') + ' 1', t('markdown.header') + ' 2', t('markdown.header') + ' 3'],
      [t('markdown.data') + ' 1', t('markdown.data') + ' 2', t('markdown.data') + ' 3'],
      [t('markdown.data') + ' 4', t('markdown.data') + ' 5', t('markdown.data') + ' 6']
    ]);
    setAlignments(['left', 'left', 'left']);
    setError(null);
  };

  const updateAlignment = (c: number, align: 'left' | 'center' | 'right') => {
    const newAlignments = [...alignments];
    newAlignments[c] = align;
    setAlignments(newAlignments);
  };

  const handleImportCsv = () => {
    try {
      const lines = csvInput.trim().split('\n');
      if (lines.length === 0 || (lines.length === 1 && !lines[0])) return;

      const parseLine = (line: string) => {
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
        }).slice(0, MAX_COLS);
      };

      const newData = lines.map(parseLine).slice(0, MAX_ROWS);
      if (newData.length > 0) {
        setData(newData);
        setAlignments(Array(newData[0].length).fill('left'));
        setIsImporting(false);
        setCsvInput('');
        setError(null);
      }
    } catch (e) {
      setError(t('markdown.import_csv_error'));
    }
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
            onClick={() => setIsImporting(!isImporting)}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isImporting ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`}
          >
            <FileSpreadsheet className="w-4 h-4" /> {t('markdown.import_csv')}
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl font-bold text-sm flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <RotateCcw className="w-4 h-4" /> {t('common.reset')}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <Download className="w-4 h-4" /> {t('common.download')}
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
            {copiedHtml ? t('common.copied') : t('markdown.copy_html')}
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
            {copied ? t('common.copied') : t('markdown.copy_markdown')}
          </button>
        </div>
      </div>

      {isImporting && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-indigo-500/30 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500">{t('markdown.import_csv_title')}</h4>
            <button onClick={() => setIsImporting(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
          <textarea
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            placeholder="col1,col2,col3&#10;val1,val2,val3"
            className="w-full h-32 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm dark:text-slate-300"
          />
          <button
            onClick={handleImportCsv}
            disabled={!csvInput.trim()}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {t('markdown.import_csv_btn', { count: csvInput.trim().split('\n').filter(Boolean).length })}
          </button>
        </div>
      )}

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
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('markdown.preview_markdown')}</label>
        </div>
        <pre className="p-6 bg-slate-900 text-indigo-300 rounded-3xl font-mono text-sm overflow-x-auto selection:bg-indigo-500/30">
          {generateMarkdown()}
        </pre>
      </div>
    </div>
  );
}
