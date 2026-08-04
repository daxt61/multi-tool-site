import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Copy, Check, Trash2, AlertCircle, FileUp, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit to prevent DoS

export function HashGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState(initialData?.inputText || '');
  const [casing, setCasing] = useState<'lower' | 'upper'>(initialData?.casing || 'lower');
  const [format, setFormat] = useState<'hex' | 'base64'>(initialData?.format || 'hex');
  const [file, setFile] = useState<File | null>(null);
  const [isFileMode, setIsFileMode] = useState<boolean>(initialData?.isFileMode || false);

  const [hashes, setHashes] = useState<{ [key: string]: string }>(initialData?.hashes || {
    'SHA-1': '',
    'SHA-256': '',
    'SHA-384': '',
    'SHA-512': '',
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ inputText, hashes, casing, format, isFileMode });
  }, [inputText, hashes, casing, format, isFileMode, onStateChange]);

  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Buffer formatting utility
  const formatBuffer = useCallback((buffer: ArrayBuffer): string => {
    if (format === 'base64') {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binary);
      return casing === 'upper' ? b64.toUpperCase() : b64;
    } else {
      const hashArray = Array.from(new Uint8Array(buffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return casing === 'upper' ? hashHex.toUpperCase() : hashHex;
    }
  }, [casing, format]);

  // Generate hashes for text
  const generateTextHashes = useCallback(async (text: string) => {
    if (!text) {
      setHashes({ 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });
      return;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);

      const hashAlgorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
      const newHashes: { [key: string]: string } = {};

      for (const algo of hashAlgorithms) {
        const hashBuffer = await crypto.subtle.digest(algo, data);
        newHashes[algo] = formatBuffer(hashBuffer);
      }

      setHashes(newHashes);
    } catch (e: any) {
      setError(t('hashgenerator.error_generation') + ' : ' + e.message);
    }
  }, [formatBuffer, t]);

  // Generate hashes for file
  const generateFileHashes = useCallback(async (targetFile: File) => {
    if (targetFile.size > MAX_FILE_SIZE) {
      setError(t('hashgenerator.file_size_error', { max: '10MB' }) || 'File size is too large (maximum 10MB).');
      setHashes({ 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });
      return;
    }

    try {
      setError(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) return;

        const hashAlgorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
        const newHashes: { [key: string]: string } = {};

        for (const algo of hashAlgorithms) {
          const hashBuffer = await crypto.subtle.digest(algo, arrayBuffer);
          newHashes[algo] = formatBuffer(hashBuffer);
        }

        setHashes(newHashes);
      };
      reader.readAsArrayBuffer(targetFile);
    } catch (e: any) {
      setError(t('hashgenerator.error_generation') + ' : ' + e.message);
    }
  }, [formatBuffer, t]);

  useEffect(() => {
    if (isFileMode) {
      if (file) {
        generateFileHashes(file);
      } else {
        setHashes({ 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });
      }
    } else {
      generateTextHashes(inputText);
    }
  }, [inputText, file, isFileMode, casing, format, generateTextHashes, generateFileHashes]);

  const handleTextChange = (text: string) => {
    setInputText(text);

    if (text.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setHashes({ 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });
      return;
    }

    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const copyToClipboard = (text: string, algo: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(algo);
    toast.success(t('tool.link_copied') || 'Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = useCallback(() => {
    setInputText('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setHashes({ 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    toast.success(t('recent.cleared') || 'Cleared');
  }, [t]);

  const handleCopyAll = () => {
    const textToCopy = Object.entries(hashes)
      .filter(([_, value]) => !!value)
      .map(([algo, value]) => `${algo}: ${value}`)
      .join('\n');
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied('all');
    toast.success(t('tool.link_copied') || 'Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const handlersRef = useRef({
    handleClear,
    handleCopyAll,
    hashes,
    inputText
  });

  useEffect(() => {
    handlersRef.current = {
      handleClear,
      handleCopyAll,
      hashes,
      inputText
    };
  }, [handleClear, handleCopyAll, hashes, inputText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopyAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Mode and Styling configurations */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-6 items-center justify-between">
        <div className="flex flex-wrap items-center gap-6">
          {/* Mode Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setIsFileMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isFileMode
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t('hashgenerator.mode_text') || 'Text'}
            </button>
            <button
              onClick={() => setIsFileMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isFileMode
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t('hashgenerator.mode_file') || 'File'}
            </button>
          </div>

          {/* Casing Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCasing('lower')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                casing === 'lower'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t('hashgenerator.case_lower') || 'lowercase'}
            </button>
            <button
              onClick={() => setCasing('upper')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                casing === 'upper'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t('hashgenerator.case_upper') || 'UPPERCASE'}
            </button>
          </div>

          {/* Format Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setFormat('hex')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                format === 'hex'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              HEX
            </button>
            <button
              onClick={() => setFormat('base64')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                format === 'base64'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Base64
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
          <button
            onClick={handleClear}
            className="text-xs font-bold px-4 py-2.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1.5 border border-transparent focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-4 h-4" /> {t('common.clear') || 'Clear'}
          </button>
        </div>
      </div>

      {!isFileMode ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="hash-input" className="block text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              {t('hashgenerator.input_label')}
            </label>
            <button
              onClick={handleCopyAll}
              disabled={!Object.values(hashes).some(h => !!h)}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copied === 'all'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 border-transparent hover:bg-indigo-100 dark:hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {copied === 'all' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'all' ? t('common.copied') : t('hashgenerator.copy_all')}
              {copied !== 'all' && <Kbd modifier={null} className="ml-1 bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 text-indigo-500">C</Kbd>}
            </button>
          </div>
          <textarea
            id="hash-input"
            ref={textareaRef}
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={t('hashgenerator.input_placeholder')}
            className={`w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-3xl outline-none focus:ring-2 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400">
            {t('hashgenerator.file_label') || 'Upload File'}
          </label>
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center bg-slate-50 dark:bg-slate-900/20 space-y-4 relative">
            <FileUp className="w-12 h-12 text-indigo-500 mx-auto animate-pulse" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {file ? file.name : (t('hashgenerator.file_drag_prompt') || 'Drag and drop or browse file')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {file ? `${(file.size / 1024).toFixed(2)} KB` : (t('hashgenerator.file_limit_prompt') || 'Maximum size: 10MB')}
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {Object.entries(hashes).map(([algo, hash]) => (
          <div key={algo} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold tracking-widest">
                {algo}
              </span>
              <button
                onClick={() => copyToClipboard(hash, algo)}
                disabled={!hash}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === algo
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
                aria-label={copied === algo ? t('common.copied') : `${t('common.copy')} ${algo}`}
              >
                {copied === algo ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === algo ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <div className="font-mono text-sm break-all bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              {hash || t('hashgenerator.waiting')}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-500/5 p-6 rounded-[2rem] flex items-start gap-4 border border-amber-200 dark:border-amber-900/20">
          <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
          <div className="text-sm">
            <p className="font-bold mb-1 text-amber-900 dark:text-amber-100">SHA-1 Security Warning</p>
            <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
              {t('hashgenerator.sha1_warning')}
            </p>
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] flex items-start gap-4 border border-indigo-100 dark:border-indigo-900/20">
          <Shield className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
          <div className="text-sm">
            <p className="font-bold mb-1 text-slate-900 dark:text-white">{t('hashgenerator.security_note_title')}</p>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('hashgenerator.security_note_text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
