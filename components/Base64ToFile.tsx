import React, { useState, useEffect } from 'react';
import { FileCode, Download, Trash2, AlertCircle, FileUp, Type, FileType } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Base64ToFile({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [filename, setFilename] = useState(initialData?.filename || 'downloaded-file');
  const [mimeType, setMimeType] = useState(initialData?.mimeType || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, filename, mimeType });
  }, [input, filename, mimeType]);

  const handleClear = () => {
    setInput('');
    setError(null);
  };

  const handleDownload = () => {
    setError(null);
    if (!input) return;

    try {
      // Remove data URL prefix if present (e.g., "data:image/png;base64,")
      const base64Data = input.includes(',') ? input.split(',')[1] : input;

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType || 'application/octet-stream' });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'downloaded-file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(t('error.invalid_decoding', 'Invalid Base64 data'));
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-indigo-500">
              <FileCode className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('base64_to_file.input_label', 'Base64 String')}
              </h3>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleClear();
            }}
            placeholder="SGVsbG8gV29ybGQh..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Options & Action Section */}
        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <FileType className="w-4 h-4 text-indigo-500" />
                  <label htmlFor="filename" className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {t('base64_to_file.filename', 'Filename')}
                  </label>
                </div>
                <input
                  id="filename"
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="image.png"
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Type className="w-4 h-4 text-indigo-500" />
                  <label htmlFor="mimetype" className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {t('base64_to_file.mimetype', 'MIME Type (Optional)')}
                  </label>
                </div>
                <input
                  id="mimetype"
                  type="text"
                  value={mimeType}
                  onChange={(e) => setMimeType(e.target.value)}
                  placeholder="image/png"
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
                <p className="text-[10px] text-slate-400 px-1 italic">
                  {t('base64_to_file.mimetype_hint', 'Example: image/png, application/pdf, text/plain')}
                </p>
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={!input}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Download className="w-6 h-6" />
              {t('base64_to_file.download', 'Download File')}
            </button>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">{t('base64_to_file.about_title', 'About Base64 to File')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('base64_to_file.about_text', 'Convert Base64 encoded strings back into their original file format. This tool supports any file type. If your input includes a Data URL prefix, it will be automatically handled. You can specify a filename and an optional MIME type to ensure the browser correctly identifies the downloaded file.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
