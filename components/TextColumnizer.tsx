import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Columns, Copy, Check, Trash2, Download,
  Settings2, AlignLeft, AlignCenter, AlignRight, Info, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function TextColumnizer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || '');
  const [columns, setColumns] = useState<number>(initialData?.columns || 2);
  const [separator, setSeparator] = useState<string>(initialData?.separator || 'tab');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>(initialData?.alignment || 'left');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, columns, separator, alignment });
  }, [input, columns, separator, alignment, onStateChange]);

  const output = useMemo(() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) return '';

    const lines = input.split('\n').filter((l: string) => l.trim().length > 0);
    if (lines.length === 0) return '';

    const rows = Math.ceil(lines.length / columns);
    const grid: string[][] = Array.from({ length: rows }, () => Array(columns).fill(''));

    // Find max width for each column for padding
    const colMaxLengths = Array(columns).fill(0);
    lines.forEach((line: string, i: number) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      if (col < columns) {
        grid[row][col] = line.trim();
        colMaxLengths[col] = Math.max(colMaxLengths[col], line.trim().length);
      }
    });

    const sep = separator === 'tab' ? '\t' : (separator === 'pipe' ? ' | ' : '   ');

    return grid.map(row => {
      return row.map((cell, colIndex) => {
        if (!cell && colIndex >= Math.ceil(lines.length / rows)) return '';
        const padding = colMaxLengths[colIndex] - cell.length;
        if (alignment === 'left') return cell + ' '.repeat(padding);
        if (alignment === 'right') return ' '.repeat(padding) + cell;
        const left = Math.floor(padding / 2);
        const right = padding - left;
        return ' '.repeat(left) + cell + ' '.repeat(right);
      }).filter(cell => cell !== '').join(sep);
    }).join('\n');
  }, [input, columns, separator, alignment]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `columns-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="col-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Columns className="w-4 h-4 text-indigo-500" /> {t('common.input')}
            </label>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
            >
              {t('common.clear')}
            </button>
          </div>
          <textarea
            id="col-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value.length > MAX_LENGTH) setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
              else setError(null);
            }}
            placeholder={t('textcolumnizer.placeholder', 'Enter list items, one per line...')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="col-output" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-600 bg-slate-100 dark:bg-slate-800 border border-transparent'}`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <pre className="w-full h-80 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl overflow-auto font-mono text-sm leading-relaxed">
              {output || <span className="text-slate-600 italic">{t('common.waiting')}</span>}
            </pre>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t('textcolumnizer.columns', 'Columns')}</label>
                  <span className="text-xs font-bold text-indigo-500 font-mono">{columns}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('textcolumnizer.separator', 'Separator')}</label>
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  {[
                    { id: 'tab', label: 'Tab' },
                    { id: 'space', label: 'Space' },
                    { id: 'pipe', label: 'Pipe' },
                  ].map(sep => (
                    <button
                      key={sep.id}
                      onClick={() => setSeparator(sep.id)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${separator === sep.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {sep.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('texttoimage.alignment')}</label>
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => setAlignment(align)}
                      className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${alignment === align ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {align === 'left' && <AlignLeft className="w-4 h-4" />}
                      {align === 'center' && <AlignCenter className="w-4 h-4" />}
                      {align === 'right' && <AlignRight className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
            <Info className="w-6 h-6 text-indigo-600 shrink-0" />
            <div className="space-y-2">
              <h4 className="font-bold dark:text-white">{t('textcolumnizer.about_title', 'Column Layout')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('textcolumnizer.about_text', 'Arrange any list of items into a balanced multi-column grid. The tool automatically calculates widths and adds padding for perfect alignment.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
