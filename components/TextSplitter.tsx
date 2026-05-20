import { useState, useEffect, useCallback, useMemo } from 'react';
import { Scissors, Copy, Check, Trash2, Download, AlertCircle, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

type SplitMethod = 'chars' | 'lines' | 'delimiter';

export function TextSplitter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [method, setMethod] = useState<SplitMethod>(initialData?.method || 'chars');
  const [value, setValue] = useState(initialData?.value || 100);
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || '');
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    onStateChange?.({ input, method, value, delimiter });
  }, [input, method, value, delimiter, onStateChange]);

  const chunks = useMemo(() => {
    if (!input || input.length > MAX_LENGTH) return [];

    try {
      if (method === 'chars') {
        const size = Math.max(1, Math.floor(Number(value)));
        const result = [];
        for (let i = 0; i < input.length; i += size) {
          result.push(input.slice(i, i + size));
        }
        return result;
      }

      if (method === 'lines') {
        const lineCount = Math.max(1, Math.floor(Number(value)));
        const lines = input.split('\n');
        const result = [];
        for (let i = 0; i < lines.length; i += lineCount) {
          result.push(lines.slice(i, i + lineCount).join('\n'));
        }
        return result;
      }

      if (method === 'delimiter') {
        if (!delimiter) return [input];
        // Safe split: if it's a very long delimiter or leads to too many chunks
        const result = input.split(delimiter);
        return result.filter((c: string) => c.length > 0 || input.includes(delimiter + delimiter));
      }
    } catch (e) {
      console.error('Split error:', e);
      return [input];
    }

    return [input];
  }, [input, method, value, delimiter]);

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
    setCurrentPage(1);
  }, [input, t]);

  const handleCopyChunk = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadAll = () => {
    if (chunks.length === 0) return;
    const content = chunks.join('\n--- CHUNK SEPARATOR ---\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-split-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInput('');
    setError(null);
  };

  const totalPages = Math.ceil(chunks.length / itemsPerPage);
  const currentChunks = chunks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="split-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-indigo-500" /> {t('common.input')}
            </label>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="split-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('textsplitter.placeholder_input')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none font-mono"
          />
        </div>

        {/* Configuration Section */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Scissors className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('textsplitter.config_title')}</h3>
            </div>

            <div className="space-y-3">
              {[
                { id: 'chars', label: t('textsplitter.method_chars') },
                { id: 'lines', label: t('textsplitter.method_lines') },
                { id: 'delimiter', label: t('textsplitter.method_delimiter') },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id as SplitMethod)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                    method === m.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {method === 'delimiter' ? (
                <div className="space-y-2">
                  <label htmlFor="split-delimiter" className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('textsplitter.delimiter')}</label>
                  <input
                    id="split-delimiter"
                    type="text"
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    placeholder="Ex: , or \n"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="split-value" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                    {method === 'chars' ? t('textsplitter.char_count') : t('textsplitter.line_count')}
                  </label>
                  <input
                    id="split-value"
                    type="number"
                    min="1"
                    value={value}
                    onChange={(e) => setValue(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {chunks.length > 0 && (
            <button
              onClick={handleDownloadAll}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl"
            >
              <Download className="w-5 h-5" /> {t('textsplitter.download_all')}
            </button>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('textsplitter.results_title')}</h3>
            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold">
              {chunks.length} {t('textsplitter.chunks')}
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-slate-400">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {currentChunks.length > 0 ? (
            currentChunks.map((chunk: string, idx: number) => {
              const realIndex = (currentPage - 1) * itemsPerPage + idx;
              return (
                <div key={realIndex} className="group bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
                      Chunk #{realIndex + 1}
                    </span>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold text-slate-400 mr-2 flex items-center">
                        {chunk.length} {t('wordcounter.stat.characters').toLowerCase()}
                      </span>
                      <button
                        onClick={() => handleCopyChunk(chunk, realIndex)}
                        className={`p-2 rounded-xl transition-all border ${
                          copiedIndex === realIndex
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 border-transparent'
                        }`}
                      >
                        {copiedIndex === realIndex ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <pre className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-800 transition-all dark:text-slate-300 max-h-40">
                    {chunk}
                  </pre>
                </div>
              );
            })
          ) : (
            <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-slate-400 italic font-medium">
              {t('textsplitter.empty_results')}
            </div>
          )}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('textsplitter.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('textsplitter.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
