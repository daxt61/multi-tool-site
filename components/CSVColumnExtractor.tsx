import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileSpreadsheet, Copy, Check, Trash2, Download, Settings2, Sliders, ListChecks, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 1000000;

const DELIMITERS = [
  { label: 'Comma (,)', value: ',' },
  { label: 'Semicolon (;)', value: ';' },
  { label: 'Tab (\\t)', value: '\t' },
  { label: 'Pipe (|)', value: '|' },
];

export function CSVColumnExtractor({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || ',');
  const [selectedColumns, setSelectedColumns] = useState<number[]>(initialData?.selectedColumns || []);
  const [hasHeader, setHasHeader] = useState(initialData?.hasHeader ?? true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, delimiter, selectedColumns, hasHeader });
  }, [input, delimiter, selectedColumns, hasHeader, onStateChange]);

  const parseCSVLine = (line: string, delim: string) => {
    const result = [];
    let startValueIndex = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      if (line[i] === delim && !inQuotes) {
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

  const parsedData = useMemo(() => {
    if (!input.trim()) return [];
    const lines = input.trim().split(/\r?\n/);
    return lines.map((line: string) => parseCSVLine(line, delimiter));
  }, [input, delimiter]);

  const columns = useMemo(() => {
    if (parsedData.length === 0) return [];
    const maxCols = Math.max(...parsedData.map((row: string[]) => row.length));
    const headerRow = hasHeader ? parsedData[0] : [];

    return Array.from({ length: maxCols }, (_, i) => ({
      index: i,
      name: headerRow[i] || `Column ${i + 1}`
    }));
  }, [parsedData, hasHeader]);

  useEffect(() => {
    if (columns.length > 0 && selectedColumns.length === 0) {
      setSelectedColumns([0]);
    }
  }, [columns, selectedColumns.length]);

  const output = useMemo(() => {
    if (parsedData.length === 0 || selectedColumns.length === 0) return '';

    return parsedData.map((row: string[]) => {
      const selected = selectedColumns.map(idx => {
        let val = row[idx] || '';
        if (val.includes(delimiter) || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      return selected.join(delimiter);
    }).join('\n');
  }, [parsedData, selectedColumns, delimiter]);

  const toggleColumn = (idx: number) => {
    setSelectedColumns(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx].sort((a, b) => a - b)
    );
  };

  const moveColumn = (idx: number, dir: 'up' | 'down') => {
    const currentPos = selectedColumns.indexOf(idx);
    if (currentPos === -1) return;

    const newSelected = [...selectedColumns];
    const targetPos = dir === 'up' ? currentPos - 1 : currentPos + 1;

    if (targetPos >= 0 && targetPos < newSelected.length) {
      [newSelected[currentPos], newSelected[targetPos]] = [newSelected[targetPos], newSelected[currentPos]];
      setSelectedColumns(newSelected);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted-columns-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" /> {t('common.input')} CSV
              </label>
              <button
                onClick={() => setInput('')}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              </button>
            </div>
            <textarea
              id="csv-input"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              placeholder={t('csv_extractor.placeholder_input')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-emerald-500" /> {t('common.output')} CSV
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
                  title={t('common.download')}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              id="csv-output"
              value={output}
              readOnly
              placeholder={t('csv_extractor.placeholder_output')}
              className="w-full h-64 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">{t('csv_extractor.input_delimiter')}</label>
                <div className="flex flex-wrap gap-2">
                  {DELIMITERS.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setDelimiter(d.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        delimiter === d.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setHasHeader(!hasHeader)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all font-bold text-sm ${
                  hasHeader
                    ? 'bg-white dark:bg-slate-800 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>{t('csv_extractor.header_checkbox')}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${hasHeader ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {hasHeader && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('csv_extractor.select_columns')}</h3>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
              {columns.length > 0 ? columns.map(col => (
                <div key={col.index} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleColumn(col.index)}
                    className={`flex-1 flex items-center justify-between p-3 rounded-xl border transition-all font-bold text-xs ${
                      selectedColumns.includes(col.index)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <span className="truncate">{col.name}</span>
                    {selectedColumns.includes(col.index) && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {selectedColumns.includes(col.index) && (
                    <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveColumn(col.index, 'up')}
                        disabled={selectedColumns.indexOf(col.index) === 0}
                        className="p-0.5 text-slate-400 hover:text-indigo-500 disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveColumn(col.index, 'down')}
                        disabled={selectedColumns.indexOf(col.index) === selectedColumns.length - 1}
                        className="p-0.5 text-slate-400 hover:text-indigo-500 disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-sm text-slate-400 italic text-center py-4">{t('csv_extractor.empty_cols')}</p>
              )}
            </div>

            {selectedColumns.length > 1 && (
               <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{t('csv_extractor.order')}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedColumns.map((idx, i) => (
                      <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-300">
                        <span className="opacity-50">{i + 1}.</span>
                        <span className="truncate max-w-[80px]">{columns.find(c => c.index === idx)?.name}</span>
                      </div>
                    ))}
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
