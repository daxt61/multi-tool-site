import { useState, useEffect } from 'react';
import { FileText, Copy, Check, Trash2, AlertCircle, Eye, Download, FileUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 5 * 1024 * 1024; // 5MB limit for Base64 string

export function Base64ToPDF({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleConvert = () => {
    try {
      setError('');
      if (!input.trim()) {
        setPdfUrl(null);
        return;
      }

      // Cleanup previous URL
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);

      // Clean the base64 string (remove data:application/pdf;base64, prefix if present)
      const cleanBase64 = input.replace(/^data:application\/pdf;base64,/, '').trim();

      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
    } catch (e: any) {
      setError(t('base64pdf.error_decode') + ': ' + e.message);
      setPdfUrl(null);
    }
  };

  const handleClear = () => {
    setInput('');
    setPdfUrl(null);
    setError('');
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'document.pdf';
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_LENGTH) {
      setError(t('error.max_length', { max: '5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setInput(result);
    };
    reader.readAsText(file);
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
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <label htmlFor="base64-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Base64 PDF</label>
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-xs font-bold px-3 py-1 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer">
                <FileUp className="w-3 h-3" /> {t('common.input')} TXT
                <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
              </label>
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !pdfUrl}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="base64-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleConvert();
              } else if (e.key === 'Escape') {
                handleClear();
              }
            }}
            placeholder="JVBERi0xLjQKJ... (Paste your Base64 encoded PDF here)"
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xs leading-relaxed dark:text-slate-300 resize-none"
          />
          <div className="flex justify-center pt-4">
             <button
              onClick={handleConvert}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <Eye className="w-5 h-5" /> {t('base64pdf.view_pdf')}
              <Kbd className="ml-2 hidden sm:inline-flex border-white/20 bg-white/10 text-white">Enter</Kbd>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t('base64pdf.preview')}</span>
            </div>
            <button
              onClick={handleDownload}
              disabled={!pdfUrl}
              className="text-xs font-bold px-4 py-1.5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" /> {t('common.download')} PDF
            </button>
          </div>
          <div className="w-full h-[600px] bg-slate-100 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            ) : (
              <div className="text-center space-y-4 px-8">
                <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-500 shadow-sm">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-medium italic">
                  {t('base64pdf.waiting')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4">{t('base64.about_title')}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('base64pdf.about_text')}
        </p>
      </div>
    </div>
  );
}
