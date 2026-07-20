import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Shield, Copy, Check, Trash2, Download, AlertCircle, RefreshCw, Binary, ArrowLeftRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const MAX_LENGTH = 100000;

export function XORCipher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  // Core State
  const [input, setInput] = useState(initialData?.input || "");
  const [inputFormat, setInputFormat] = useState<"text" | "hex" | "binary">(initialData?.inputFormat || "text");
  const [key, setKey] = useState(initialData?.key || "key");
  const [keyFormat, setKeyFormat] = useState<"text" | "hex" | "binary">(initialData?.keyFormat || "text");
  const [outputFormat, setOutputFormat] = useState<"text" | "hex" | "binary" | "base64">(initialData?.outputFormat || "hex");
  const [escapeNonPrintable, setEscapeNonPrintable] = useState(initialData?.escapeNonPrintable ?? true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state to parent for URL sharing
  useEffect(() => {
    onStateChange?.({
      input,
      inputFormat,
      key,
      keyFormat,
      outputFormat,
      escapeNonPrintable,
    });
  }, [input, inputFormat, key, keyFormat, outputFormat, escapeNonPrintable, onStateChange]);

  // Convert string to bytes according to selected format
  const parseToBytes = useCallback((str: string, format: "text" | "hex" | "binary"): { bytes: Uint8Array; err: string | null } => {
    if (!str) return { bytes: new Uint8Array(0), err: null };

    if (format === "text") {
      return { bytes: new TextEncoder().encode(str), err: null };
    }

    if (format === "hex") {
      const clean = str.replace(/[^0-9a-fA-F]/g, "");
      if (/[^0-9a-fA-F\s:\-,]/.test(str)) {
        return { bytes: new Uint8Array(0), err: t("xor.error_invalid_hex_chars", "Hex input contains invalid characters.") };
      }
      if (clean.length % 2 !== 0) {
        return { bytes: new Uint8Array(0), err: t("xor.error_hex_odd", "Hex string must have an even number of characters.") };
      }
      const bytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < clean.length; i += 2) {
        bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
      }
      return { bytes, err: null };
    }

    if (format === "binary") {
      const clean = str.replace(/[^01]/g, "");
      if (/[^01\s]/.test(str)) {
        return { bytes: new Uint8Array(0), err: t("xor.error_invalid_binary_chars", "Binary input contains characters other than 0 and 1.") };
      }
      if (clean.length % 8 !== 0) {
        return { bytes: new Uint8Array(0), err: t("xor.error_binary_multiple_8", "Binary string length must be a multiple of 8 bits.") };
      }
      const bytes = new Uint8Array(clean.length / 8);
      for (let i = 0; i < clean.length; i += 8) {
        bytes[i / 8] = parseInt(clean.substring(i, i + 8), 2);
      }
      return { bytes, err: null };
    }

    return { bytes: new Uint8Array(0), err: "Unknown format" };
  }, [t]);

  // Format bytes to target format
  const formatBytes = useCallback((bytes: Uint8Array, format: "text" | "hex" | "binary" | "base64", escape: boolean): string => {
    if (bytes.length === 0) return "";

    if (format === "text") {
      if (escape) {
        // Safe escaping of non-printable or non-ASCII characters
        let result = "";
        for (let i = 0; i < bytes.length; i++) {
          const b = bytes[i];
          // Allow tab, newline, carriage return, and printable ASCII
          if ((b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13) {
            result += String.fromCharCode(b);
          } else {
            result += `\\x${b.toString(16).padStart(2, "0").toUpperCase()}`;
          }
        }
        return result;
      } else {
        try {
          return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        } catch {
          return Array.from(bytes).map(b => String.fromCharCode(b)).join("");
        }
      }
    }

    if (format === "hex") {
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ");
    }

    if (format === "binary") {
      return Array.from(bytes)
        .map(b => b.toString(2).padStart(8, "0"))
        .join(" ");
    }

    if (format === "base64") {
      try {
        let binaryStr = "";
        for (let i = 0; i < bytes.length; i++) {
          binaryStr += String.fromCharCode(bytes[i]);
        }
        return btoa(binaryStr);
      } catch {
        return "";
      }
    }

    return "";
  }, []);

  // Compute XOR Operation
  const output = useMemo(() => {
    if (input.length > MAX_LENGTH) {
      setError(t("error.max_length", { max: MAX_LENGTH.toLocaleString() }));
      return "";
    }

    const { bytes: inputBytes, err: inputErr } = parseToBytes(input, inputFormat);
    if (inputErr) {
      setError(inputErr);
      return "";
    }

    const { bytes: keyBytes, err: keyErr } = parseToBytes(key, keyFormat);
    if (keyErr) {
      setError(keyErr);
      return "";
    }

    setError(null);

    if (inputBytes.length === 0) return "";
    if (keyBytes.length === 0) {
      return formatBytes(inputBytes, outputFormat, escapeNonPrintable);
    }

    const resultBytes = new Uint8Array(inputBytes.length);
    for (let i = 0; i < inputBytes.length; i++) {
      resultBytes[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return formatBytes(resultBytes, outputFormat, escapeNonPrintable);
  }, [input, inputFormat, key, keyFormat, outputFormat, escapeNonPrintable, parseToBytes, formatBytes, t]);

  // Core Actions
  const handleClear = useCallback(() => {
    setInput("");
    setError(null);
    inputRef.current?.focus();
  }, []);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t("common.copied"));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `xor-output.${outputFormat === "text" ? "txt" : outputFormat}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("common.downloaded"));
  };

  const handleSwapInputOutput = () => {
    if (!output || error) return;
    // We can swap if the output format matches one of the input formats
    if (outputFormat === "base64") {
      toast.error(t("xor.error_swap_base64", "Cannot swap when output is Base64. Change output format to Text, Hex, or Binary."));
      return;
    }
    setInput(output);
    setInputFormat(outputFormat);
  };

  // Keyboard shortcut handlers (useRef pattern for stability)
  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== "Escape") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute lengths for statistics
  const inputCharCount = input.length;
  const inputByteCount = useMemo(() => {
    const { bytes } = parseToBytes(input, inputFormat);
    return bytes.length;
  }, [input, inputFormat, parseToBytes]);

  const outputCharCount = output.length;
  const outputByteCount = useMemo(() => {
    // If output is text/hex/binary, we can reconstruct the byte count from output, or just use the input byte count if no errors
    if (error) return 0;
    const { bytes } = parseToBytes(input, inputFormat);
    return bytes.length;
  }, [input, inputFormat, error, parseToBytes]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Format Options & Form Validation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800">
        {/* Input format */}
        <div className="space-y-2">
          <label htmlFor="input-format-select" className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t("xor.input_format", "Input Format")}
          </label>
          <select
            id="input-format-select"
            value={inputFormat}
            onChange={(e) => setInputFormat(e.target.value as any)}
            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
          >
            <option value="text">{t("xor.format_text", "Plain Text (UTF-8)")}</option>
            <option value="hex">{t("xor.format_hex", "Hexadecimal Bytes")}</option>
            <option value="binary">{t("xor.format_binary", "Binary Bits (0/1)")}</option>
          </select>
        </div>

        {/* Key format */}
        <div className="space-y-2">
          <label htmlFor="key-format-select" className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t("xor.key_format", "Key Format")}
          </label>
          <select
            id="key-format-select"
            value={keyFormat}
            onChange={(e) => setKeyFormat(e.target.value as any)}
            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
          >
            <option value="text">{t("xor.format_text", "Plain Text (UTF-8)")}</option>
            <option value="hex">{t("xor.format_hex", "Hexadecimal Bytes")}</option>
            <option value="binary">{t("xor.format_binary", "Binary Bits (0/1)")}</option>
          </select>
        </div>

        {/* Output format */}
        <div className="space-y-2">
          <label htmlFor="output-format-select" className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t("xor.output_format", "Output Format")}
          </label>
          <select
            id="output-format-select"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as any)}
            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
          >
            <option value="text">{t("xor.format_text", "Plain Text (UTF-8)")}</option>
            <option value="hex">{t("xor.format_hex", "Hexadecimal Bytes")}</option>
            <option value="binary">{t("xor.format_binary", "Binary Bits (0/1)")}</option>
            <option value="base64">{t("xor.format_base64", "Base64 String")}</option>
          </select>
        </div>
      </div>

      {/* Secret Key configuration */}
      <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="xor-key-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t("xor.key_label", "XOR Secret Key")}
          </label>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {key.length} {t("common.characters")}
          </div>
        </div>
        <input
          id="xor-key-input"
          ref={keyRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t("xor.key_placeholder", "Enter XOR key...")}
          className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg dark:text-white"
        />
      </div>

      {/* Main textareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input box */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("common.input")}
            </span>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> {t("common.clear")}
              <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
            </button>
          </div>
          <textarea
            ref={inputRef}
            id="xor-input-textarea"
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("xor.input_placeholder", "Enter data to XOR...")}
            className="w-full h-72 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
            <div>
              {inputCharCount} {t("common.characters")}
            </div>
            <div>
              {inputByteCount} {inputByteCount === 1 ? "byte" : "bytes"}
            </div>
          </div>
        </div>

        {/* Output box */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("common.result")}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleSwapInputOutput}
                disabled={!output || !!error || outputFormat === "base64"}
                title={t("xor.swap_input_output", "Swap Input and Output")}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <ArrowLeftRight className="w-3 h-3" /> {t("common.swap", "Swap")}
              </button>
              <button
                onClick={handleDownload}
                disabled={!output || !!error}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t("common.download")}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output || !!error}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t("common.copied") : t("common.copy")}
                {!copied && <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-slate-200 dark:border-slate-700">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="xor-output-textarea"
            value={output}
            readOnly
            placeholder={t("common.waiting")}
            className="w-full h-72 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
            <div>
              {outputCharCount} {t("common.characters")}
            </div>
            <div>
              {outputByteCount} {outputByteCount === 1 ? "byte" : "bytes"}
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      {outputFormat === "text" && (
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          <input
            id="escape-non-printable-checkbox"
            type="checkbox"
            checked={escapeNonPrintable}
            onChange={(e) => setEscapeNonPrintable(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="escape-non-printable-checkbox" className="text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
            {t("xor.escape_non_printable", "Escape non-printable ASCII or invalid UTF-8 bytes (e.g. \\x00)")}
          </label>
        </div>
      )}

      {/* Validation Errors */}
      {error && (
        <div role="alert" className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Shield className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t("xor.about_title", "About XOR Cipher & Bitwise Operations")}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("xor.about_text", "XOR (exclusive OR) is a logical operation on bits. The bitwise XOR operation compares each bit of the input bytes with the corresponding bit of the key bytes. If the bits are different, the output bit is 1; if they are the same, the output is 0. Repeating-key XOR applies the key cyclically over the input length, making it a simple yet highly effective obfuscation tool often used in reverse engineering, binary analysis, and cryptographic proofs.")}
          </p>
        </div>
      </div>
    </div>
  );
}
