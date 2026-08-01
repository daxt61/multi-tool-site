import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, FileUp, Download, AlertCircle, RefreshCw, BarChart2, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_SIZE = 1000000; // 1MB limits for DoS mitigation

interface CompressionStats {
  originalSize: number;
  outputSize: number;
  ratio: number;
  savings: number;
}

export function GzipDeflateConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  // Settings & Toggles
  const [mode, setMode] = useState<'compress' | 'decompress'>(initialData?.mode || 'compress');
  const [format, setFormat] = useState<'gzip' | 'deflate'>(initialData?.format || 'gzip');
  const [inputType, setInputType] = useState<'text' | 'file'>(initialData?.inputType || 'text');

  // Text state
  const [inputText, setInputText] = useState(initialData?.inputText || '');
  const [textInputFormat, setTextInputFormat] = useState<'text' | 'base64' | 'hex'>(initialData?.textInputFormat || 'text');
  const [outputText, setOutputText] = useState('');
  const [textOutputFormat, setTextOutputFormat] = useState<'base64' | 'hex' | 'text'>(initialData?.textOutputFormat || 'base64');

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileOutputData, setFileOutputData] = useState<Uint8Array | null>(null);

  // General state
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [processing, setProcessing] = useState(false);

  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with URL state
  useEffect(() => {
    onStateChange?.({
      mode,
      format,
      inputType,
      inputText,
      textInputFormat,
      textOutputFormat
    });
  }, [mode, format, inputType, inputText, textInputFormat, textOutputFormat, onStateChange]);

  // Adjust input/output formats logically based on compression/decompression mode
  useEffect(() => {
    if (mode === 'compress') {
      if (textInputFormat !== 'text' && textInputFormat !== 'base64' && textInputFormat !== 'hex') {
        setTextInputFormat('text');
      }
      if (textOutputFormat === 'text') {
        setTextOutputFormat('base64');
      }
    } else {
      if (textInputFormat === 'text') {
        setTextInputFormat('base64');
      }
      if (textOutputFormat !== 'text' && textOutputFormat !== 'base64' && textOutputFormat !== 'hex') {
        setTextOutputFormat('text');
      }
    }
  }, [mode, textInputFormat, textOutputFormat]);

  // Conversions
  const uint8ArrayToHex = (arr: Uint8Array): string => {
    return Array.prototype.map.call(arr, (x: number) => ('00' + x.toString(16)).slice(-2)).join(' ');
  };

  const hexToUint8Array = (str: string): Uint8Array => {
    const clean = str.replace(/[^0-9A-Fa-f]/g, '');
    if (clean.length % 2 !== 0) {
      throw new Error('Invalid Hex string');
    }
    const arr = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      arr[i / 2] = parseInt(clean.substring(i, i + 2), 16);
    }
    return arr;
  };

  const uint8ArrayToBase64 = (arr: Uint8Array): string => {
    let binary = '';
    const len = arr.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return btoa(binary);
  };

  const base64ToUint8Array = (str: string): Uint8Array => {
    const clean = str.replace(/[\r\n\s]/g, '');
    const binary = atob(clean);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      arr[i] = binary.charCodeAt(i);
    }
    return arr;
  };

  // Compression helper
  const compressData = async (data: Uint8Array, compressionFormat: 'gzip' | 'deflate'): Promise<Uint8Array> => {
    const stream = new Response(data.buffer as ArrayBuffer).body;
    if (!stream) throw new Error('Stream support is missing in this browser');
    const compressionStream = new CompressionStream(compressionFormat);
    const compressedStream = stream.pipeThrough(compressionStream);
    const buffer = await new Response(compressedStream).arrayBuffer();
    return new Uint8Array(buffer);
  };

  // Decompression helper
  const decompressData = async (data: Uint8Array, decompressionFormat: 'gzip' | 'deflate'): Promise<Uint8Array> => {
    const stream = new Response(data.buffer as ArrayBuffer).body;
    if (!stream) throw new Error('Stream support is missing in this browser');
    const decompressionStream = new DecompressionStream(decompressionFormat);
    const decompressedStream = stream.pipeThrough(decompressionStream);
    const buffer = await new Response(decompressedStream).arrayBuffer();
    return new Uint8Array(buffer);
  };

  const handleProcessText = useCallback(async () => {
    if (!inputText) {
      setOutputText('');
      setStats(null);
      setError(null);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // 1. Get input as Uint8Array
      let inputBytes: Uint8Array;
      if (textInputFormat === 'text') {
        inputBytes = new TextEncoder().encode(inputText);
      } else if (textInputFormat === 'hex') {
        inputBytes = hexToUint8Array(inputText);
      } else {
        inputBytes = base64ToUint8Array(inputText);
      }

      // Check size limit
      if (inputBytes.byteLength > MAX_SIZE) {
        throw new Error(t('gzip_deflate.error_too_large', { size: '1MB' }) || 'Input exceeds the 1MB limit for safety.');
      }

      // 2. Perform compression or decompression
      let outputBytes: Uint8Array;
      if (mode === 'compress') {
        outputBytes = await compressData(inputBytes, format);
      } else {
        outputBytes = await decompressData(inputBytes, format);
      }

      // 3. Format output
      let outputStr = '';
      if (textOutputFormat === 'text') {
        outputStr = new TextDecoder().decode(outputBytes);
      } else if (textOutputFormat === 'hex') {
        outputStr = uint8ArrayToHex(outputBytes);
      } else {
        outputStr = uint8ArrayToBase64(outputBytes);
      }

      setOutputText(outputStr);

      // 4. Update stats
      const originalSize = inputBytes.byteLength;
      const outputSize = outputBytes.byteLength;
      const ratio = originalSize > 0 ? originalSize / outputSize : 0;
      const savings = originalSize > 0 ? ((originalSize - outputSize) / originalSize) * 100 : 0;

      setStats({
        originalSize,
        outputSize,
        ratio,
        savings
      });

    } catch (err: any) {
      console.error(err);
      setOutputText('');
      setStats(null);
      setError(err.message || t('gzip_deflate.invalid_input_error') || 'Failed to process input. Make sure the input format matches your selections.');
    } finally {
      setProcessing(false);
    }
  }, [inputText, textInputFormat, textOutputFormat, mode, format, t]);

  // Run processing when text changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleProcessText();
    }, 200);
    return () => clearTimeout(timer);
  }, [inputText, textInputFormat, textOutputFormat, mode, format, handleProcessText]);

  // File drop/selection handlers
  const handleFileChange = async (file: File) => {
    if (file.size > MAX_SIZE) {
      setError(t('gzip_deflate.error_too_large', { size: '1MB' }) || 'Selected file exceeds the 1MB limit for safety.');
      setSelectedFile(null);
      setFileOutputData(null);
      setStats(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const inputBytes = new Uint8Array(arrayBuffer);

      let outputBytes: Uint8Array;
      if (mode === 'compress') {
        outputBytes = await compressData(inputBytes, format);
      } else {
        outputBytes = await decompressData(inputBytes, format);
      }

      setFileOutputData(outputBytes);

      const originalSize = inputBytes.byteLength;
      const outputSize = outputBytes.byteLength;
      const ratio = originalSize > 0 ? originalSize / outputSize : 0;
      const savings = originalSize > 0 ? ((originalSize - outputSize) / originalSize) * 100 : 0;

      setStats({
        originalSize,
        outputSize,
        ratio,
        savings
      });
    } catch (err: any) {
      console.error(err);
      setFileOutputData(null);
      setStats(null);
      setError(err.message || t('gzip_deflate.invalid_input_error') || 'Failed to process input. Make sure the input format matches your selections.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadFile = () => {
    if (!fileOutputData || !selectedFile) return;

    let filename = selectedFile.name;
    if (mode === 'compress') {
      filename = `${filename}.${format === 'gzip' ? 'gz' : 'deflate'}`;
    } else {
      // Try to strip compression extensions
      filename = filename.replace(/\.(gz|deflate)$/i, '');
      if (filename === selectedFile.name) {
        filename = `${filename}.decompressed`;
      }
    }

    const blob = new Blob([fileOutputData.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('gzip_deflate.download_success') || 'File downloaded successfully.');
  };

  const handleClear = useCallback(() => {
    setInputText('');
    setOutputText('');
    setSelectedFile(null);
    setFileOutputData(null);
    setStats(null);
    setError(null);
    if (inputType === 'text') {
      textInputRef.current?.focus();
    }
    toast.success(t('recent.cleared') || 'Cleared');
  }, [inputType, t]);

  const copyToClipboard = useCallback(() => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    toast.success(t('tool.copied') || 'Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [outputText, t]);

  // Global Keyboard Shortcuts
  const handlersRef = useRef({
    handleClear,
    copyToClipboard,
    outputText,
    inputType,
    textInputRef
  });

  useEffect(() => {
    handlersRef.current = { handleClear, copyToClipboard, outputText, inputType, textInputRef };
  }, [handleClear, copyToClipboard, outputText, inputType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT" ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        if (!isEditable || activeEl === handlersRef.current.textInputRef.current) {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
      } else if (e.key.toLowerCase() === 'c' && !isEditable) {
        e.preventDefault();
        if (handlersRef.current.inputType === 'text' && handlersRef.current.outputText) {
          handlersRef.current.copyToClipboard();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner Alert (For errors/warnings) */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Configuration Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-6 items-center justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          {/* Mode toggle */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {t('gzip_deflate.mode_label') || 'Mode'}
            </span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setMode('compress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === 'compress'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t('gzip_deflate.mode_compress') || 'Compress'}
              </button>
              <button
                onClick={() => setMode('decompress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === 'decompress'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t('gzip_deflate.mode_decompress') || 'Decompress'}
              </button>
            </div>
          </div>

          {/* Format toggle */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {t('gzip_deflate.format_label') || 'Algorithm'}
            </span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setFormat('gzip')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  format === 'gzip'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                GZIP
              </button>
              <button
                onClick={() => setFormat('deflate')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  format === 'deflate'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                DEFLATE
              </button>
            </div>
          </div>

          {/* Input source toggle */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {t('gzip_deflate.source_label') || 'Source'}
            </span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setInputType('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  inputType === 'text'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t('gzip_deflate.source_text') || 'Text / Bytes'}
              </button>
              <button
                onClick={() => setInputType('file')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  inputType === 'file'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t('gzip_deflate.source_file') || 'File Upload'}
              </button>
            </div>
          </div>
        </div>

        {/* Clear Actions */}
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

      {/* Main Conversion Layout */}
      {inputType === 'text' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 px-1">
              <div className="flex items-center gap-2">
                <FileUp className="w-4 h-4 text-indigo-500" />
                <label htmlFor="gzip-input-text" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                  {t('gzip_deflate.input_label') || 'Input Data'}
                </label>
              </div>

              {/* Input format selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{t('gzip_deflate.format_select') || 'Format:'}</span>
                <select
                  id="gzip-input-format"
                  value={textInputFormat}
                  onChange={(e) => setTextInputFormat(e.target.value as any)}
                  className="bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  {mode === 'compress' && <option value="text">{t('gzip_deflate.fmt_plaintext') || 'Plain Text'}</option>}
                  <option value="base64">Base64</option>
                  <option value="hex">Hex</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <textarea
                id="gzip-input-text"
                ref={textInputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  textInputFormat === 'text'
                    ? t('gzip_deflate.placeholder_plain') || 'Type or paste plain text here...'
                    : textInputFormat === 'base64'
                    ? 'Type or paste Base64 encoding here...'
                    : 'Type or paste Hexadecimal representation here...'
                }
                className="w-full h-[360px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
              />
              {processing && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 px-1">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-500" />
                <label htmlFor="gzip-output-text" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                  {t('gzip_deflate.output_label') || 'Output Data'}
                </label>
              </div>

              <div className="flex items-center gap-3">
                {/* Output format selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{t('gzip_deflate.format_select') || 'Format:'}</span>
                  <select
                    id="gzip-output-format"
                    value={textOutputFormat}
                    onChange={(e) => setTextOutputFormat(e.target.value as any)}
                    className="bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="base64">Base64</option>
                    <option value="hex">Hex</option>
                    {mode === 'decompress' && <option value="text">{t('gzip_deflate.fmt_plaintext') || 'Plain Text'}</option>}
                  </select>
                </div>

                {/* Copy / Action buttons */}
                <button
                  onClick={copyToClipboard}
                  disabled={!outputText}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? t('common.copied') : t('common.copy')}
                  {!copied && <Kbd modifier={null} className="hidden sm:inline-flex items-center justify-center w-4 h-4 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900 ml-1">C</Kbd>}
                </button>
              </div>
            </div>

            <textarea
              id="gzip-output-text"
              readOnly
              value={outputText}
              placeholder={t('gzip_deflate.placeholder_output') || 'Output will appear here...'}
              className="w-full h-[360px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 break-all resize-none"
            />
          </div>
        </div>
      ) : (
        /* File Upload Layout */
        <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500">
                <FileUp className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold">{t('gzip_deflate.file_upload_title') || 'Compress or Decompress Files'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('gzip_deflate.file_upload_desc', { size: '1MB' }) || 'Drag and drop or select any file up to 1MB. The file is processed purely on your device for absolute privacy.'}
              </p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileChange(file);
              }}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:border-indigo-500/50 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer relative"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file);
                }}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 break-all">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">({(selectedFile.size / 1024).toFixed(2)} KB)</p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile();
                      }}
                      disabled={!fileOutputData}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t('gzip_deflate.download_button') || 'Download Result'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-400 flex flex-col items-center gap-1">
                  <span>{t('gzip_deflate.drop_hint') || 'Click or drop files here'}</span>
                </div>
              )}

              {processing && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Compression Statistics Panel */}
      {stats && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('gzip_deflate.stat_original') || 'Original Size'}</span>
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
              {stats.originalSize.toLocaleString()} B
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('gzip_deflate.stat_compressed') || 'Processed Size'}</span>
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
              {stats.outputSize.toLocaleString()} B
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('gzip_deflate.stat_ratio') || 'Compression Ratio'}</span>
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
              {stats.ratio.toFixed(2)}:1
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('gzip_deflate.stat_savings') || 'Space Savings'}</span>
            </div>
            <p className={`text-xl font-black tabular-nums ${stats.savings >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stats.savings.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Educational info section */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          {t('gzip_deflate.about_title') || 'About GZIP & DEFLATE Compression'}
        </h4>
        <div className="text-sm text-slate-500 dark:text-slate-400 space-y-4 leading-relaxed">
          <p>
            {t('gzip_deflate.about_desc1') || 'Gzip and Deflate are robust and extremely common lossless data compression algorithms based on the LZ77 and Huffman coding methodologies. GZIP wrapping extends the Deflate payload with file-system headers and error-checking checksum protections.'}
          </p>
          <p>
            {t('gzip_deflate.about_desc2') || 'This tool implements bidirectional offline compression and decompression directly on your browser using modern client-side stream engines. No data is ever transmitted to remote network servers, keeping your payloads secure and private.'}
          </p>
        </div>
      </div>
    </div>
  );
}
