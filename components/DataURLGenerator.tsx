import { useState, useCallback, useEffect, useRef } from 'react';
import { FileUp, Copy, Check, Trash2, FileCode, Image as ImageIcon, AlertCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function DataURLGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dataURL, setDataURL] = useState(initialData?.dataURL || '');
  const [fileName, setFileName] = useState(initialData?.fileName || '');
  const [fileSize, setFileSize] = useState(initialData?.fileSize || 0);
  const [mimeType, setMimeType] = useState(initialData?.mimeType || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ dataURL, fileName, fileSize, mimeType });
  }, [dataURL, fileName, fileSize, mimeType, onStateChange]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(t('imagecompressor.error_size'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setDataURL(result);
      setFileName(file.name);
      setFileSize(file.size);
      setMimeType(file.type);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = useCallback(() => {
    if (!dataURL) return;
    navigator.clipboard.writeText(dataURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [dataURL]);

  const handleReset = useCallback(() => {
    setDataURL('');
    setFileName('');
    setFileSize(0);
    setMimeType('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Keyboard Shortcuts
  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  }, [handleReset, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) {
        if (e.key === 'Escape') {
          handlersRef.current.handleReset();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            {t('common.input')}
          </label>
          <div
            className={`relative h-64 border-2 border-dashed rounded-[2.5rem] transition-all flex flex-col items-center justify-center gap-4 group ${
              dataURL ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/5' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="Upload file"
            />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${dataURL ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:scale-110 group-hover:text-indigo-500'}`}>
              <FileUp className="w-8 h-8" />
            </div>
            <div className="text-center px-6">
              <p className="font-bold dark:text-white">
                {fileName || t('imagecompressor.upload_prompt')}
              </p>
              {fileSize > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {formatFileSize(fileSize)} • {mimeType}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            {t('dataurl.preview')}
          </label>
          <div className="h-64 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center overflow-hidden p-4">
            {mimeType.startsWith('image/') ? (
              <img src={dataURL} alt="Preview" className="max-w-full max-h-full rounded-xl object-contain shadow-lg" />
            ) : dataURL ? (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <FileCode className="w-16 h-16" />
                <span className="text-sm font-bold uppercase tracking-widest">{t('common.na')}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-300 dark:text-slate-700">
                <ImageIcon className="w-16 h-16" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="data-url-output" className="text-xs font-black uppercase tracking-widest text-slate-400">
            Data URL
          </label>
          <div className="flex gap-2 items-center">
            <kbd className="hidden md:inline-flex items-center justify-center w-6 h-6 border rounded text-xs font-bold ml-1 transition-all bg-black/10 border-white/20 text-white/70 group-hover:bg-black/20 dark:bg-slate-100 dark:border-slate-200 dark:text-slate-400">Esc</kbd>
            <button
              onClick={handleReset}
              disabled={!dataURL}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">{t('common.reset')}</span>
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />
            <kbd className="hidden md:inline-flex items-center justify-center w-6 h-6 border rounded text-xs font-bold ml-1 transition-all bg-black/10 border-white/20 text-white/70 group-hover:bg-black/20 dark:bg-slate-100 dark:border-slate-200 dark:text-slate-400">C</kbd>
            <button
              onClick={handleCopy}
              disabled={!dataURL}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 border ${
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
          id="data-url-output"
          readOnly
          value={dataURL}
          placeholder="Data URL will appear here..."
          className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs leading-relaxed dark:text-slate-300 resize-none break-all"
        />
      </div>

      {/* Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4">{t('dataurl.about_title')}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
          {t('dataurl.about_text1')}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('dataurl.about_text2')}
        </p>
      </div>
    </div>
  );
}
