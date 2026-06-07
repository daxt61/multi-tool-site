import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, ListChecks, ArrowRight, Download, Settings2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ChecklistFormat = 'markdown' | 'html' | 'text_brackets' | 'text_circles' | 'notion';

interface FormatConfig {
  id: ChecklistFormat;
  name: string;
  prefix: string;
  suffix: string;
}

const FORMATS: FormatConfig[] = [
  { id: 'markdown', name: 'Markdown', prefix: '- [ ] ', suffix: '' },
  { id: 'html', name: 'HTML', prefix: '<li><input type="checkbox"> ', suffix: '</li>' },
  { id: 'text_brackets', name: 'Text [ ]', prefix: '[ ] ', suffix: '' },
  { id: 'text_circles', name: 'Text ○', prefix: '○ ', suffix: '' },
  { id: 'notion', name: 'Notion Style', prefix: '☐ ', suffix: '' },
];

export function ListToChecklist({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [format, setFormat] = useState<ChecklistFormat>(initialData?.format || 'markdown');
  const [removeEmpty, setRemoveEmpty] = useState(initialData?.removeEmpty ?? true);
  const [trimLines, setTrimLines] = useState(initialData?.trimLines ?? true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, format, removeEmpty, trimLines });
  }, [input, format, removeEmpty, trimLines]);

  const output = useMemo(() => {
    let lines = input.split('\n');
    if (trimLines) lines = lines.map((l: string) => l.trim());
    if (removeEmpty) lines = lines.filter((l: string) => l.length > 0);

    const config = FORMATS.find(f => f.id === format)!;
    let result = lines.map((line: string) => `${config.prefix}${line}${config.suffix}`).join('\n');

    if (format === 'html' && result.length > 0) {
      result = `<ul>\n${result}\n</ul>`;
    }

    return result;
  }, [input, format, removeEmpty, trimLines]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = () => {
    if (!output) return;
    const ext = format === 'html' ? 'html' : (format === 'markdown' ? 'md' : 'txt');
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `checklist-${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInput('');
    textareaRef.current?.focus();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="list-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('checklist.input_label', 'Your List (one item per line)')}
            </label>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="list-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            placeholder={t('checklist.placeholder', 'Milk\nEggs\nBread\nApples...')}
          />
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('checklist.output_label', 'Converted Checklist')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-indigo-600 dark:text-indigo-400 border-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <div className="relative group">
            <pre className="w-full h-80 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-auto font-mono text-sm leading-relaxed dark:text-slate-300">
              {output || <span className="text-slate-400">{t('common.waiting')}</span>}
            </pre>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
         <div className="flex items-center gap-3 px-1">
            <Settings2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
               {t('common.options')}
            </h3>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
               <label className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">
                  {t('checklist.format_label', 'Format')}
               </label>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all border ${
                        format === f.id
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex flex-col justify-center gap-4">
               <label className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-500/30 transition-all group">
                  <input
                    type="checkbox"
                    checked={removeEmpty}
                    onChange={(e) => setRemoveEmpty(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                  />
                  <div className="flex-1">
                     <div className="text-sm font-bold text-slate-700 dark:text-white">{t('checklist.remove_empty', 'Remove empty lines')}</div>
                     <div className="text-xs text-slate-400">{t('checklist.remove_empty_desc', 'Automatically skip lines with no text')}</div>
                  </div>
               </label>

               <label className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-500/30 transition-all group">
                  <input
                    type="checkbox"
                    checked={trimLines}
                    onChange={(e) => setTrimLines(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                  />
                  <div className="flex-1">
                     <div className="text-sm font-bold text-slate-700 dark:text-white">{t('checklist.trim_lines', 'Trim whitespace')}</div>
                     <div className="text-xs text-slate-400">{t('checklist.trim_lines_desc', 'Remove spaces at the start and end of lines')}</div>
                  </div>
               </label>
            </div>
         </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <ListChecks className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('checklist.about_title', 'About Checklist Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('checklist.about_text', 'Quickly transform your messy notes and lists into structured checklists. This tool is perfect for preparing todo lists for Markdown editors, coding projects (HTML), or simply making text-based lists look professional for emails and documentation.')}
          </p>
        </div>
      </div>
    </div>
  );
}
