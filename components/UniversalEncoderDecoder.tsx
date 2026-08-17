import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftRight,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  Settings,
  Info,
  Type,
  FileCode,
  Globe,
  Settings2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const MAX_LENGTH = 50000; // DoS Protection Limit

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const Z85_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&_<>[]{}@%$#";

// Helper Encoders & Decoders
const encodeBase32 = (bytes: Uint8Array): string => {
  let result = "";
  let bits = 0;
  let value = 0;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      result += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    result += B32_ALPHABET[(value << (5 - bits)) & 31];
  }
  while (result.length % 8 !== 0) {
    result += "=";
  }
  return result;
};

const decodeBase32 = (str: string): Uint8Array => {
  const s = str.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (let i = 0; i < s.length; i++) {
    const idx = B32_ALPHABET.indexOf(s[i]);
    if (idx === -1) throw new Error("Invalid Base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
};

const encodeBase58 = (bytes: Uint8Array): string => {
  if (bytes.length === 0) return "";
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) {
    zeros++;
  }
  let x = 0n;
  for (let i = 0; i < bytes.length; i++) {
    x = (x << 8n) | BigInt(bytes[i]);
  }
  let result = "";
  while (x > 0n) {
    const mod = x % 58n;
    result = B58_ALPHABET[Number(mod)] + result;
    x = x / 58n;
  }
  for (let i = 0; i < zeros; i++) {
    result = B58_ALPHABET[0] + result;
  }
  return result;
};

const decodeBase58 = (str: string): Uint8Array => {
  const s = str.trim().replace(/\s+/g, "");
  if (!s) return new Uint8Array(0);
  let zeros = 0;
  while (zeros < s.length && s[zeros] === B58_ALPHABET[0]) {
    zeros++;
  }
  let x = 0n;
  for (let i = zeros; i < s.length; i++) {
    const idx = B58_ALPHABET.indexOf(s[i]);
    if (idx === -1) throw new Error("Invalid Base58 character");
    x = (x * 58n) + BigInt(idx);
  }
  const bytes: number[] = [];
  while (x > 0n) {
    bytes.push(Number(x & 0xFFn));
    x = x >> 8n;
  }
  bytes.reverse();
  const result = new Uint8Array(zeros + bytes.length);
  result.set(new Uint8Array(bytes), zeros);
  return result;
};

const encodeZ85 = (bytes: Uint8Array): string => {
  const remainder = bytes.length % 4;
  const padding = remainder === 0 ? 0 : 4 - remainder;
  const padded = new Uint8Array(bytes.length + padding);
  padded.set(bytes);

  let result = "";
  for (let i = 0; i < padded.length; i += 4) {
    let val = (padded[i] << 24) | (padded[i+1] << 16) | (padded[i+2] << 8) | padded[i+3];
    val = val >>> 0;
    let divisor = 85 * 85 * 85 * 85;
    for (let j = 0; j < 5; j++) {
      const digit = Math.floor(val / divisor) % 85;
      result += Z85_ALPHABET[digit];
      divisor /= 85;
    }
  }
  return result + (padding > 0 ? `_p${padding}` : "");
};

const decodeZ85 = (str: string): Uint8Array => {
  const s = str.trim().replace(/\s+/g, "");
  if (!s) return new Uint8Array(0);
  const padMatch = s.match(/_p(\d)$/);
  const padding = padMatch ? parseInt(padMatch[1], 10) : 0;
  const cleanStr = padMatch ? s.slice(0, padMatch.index) : s;

  if (cleanStr.length % 5 !== 0) throw new Error("Invalid Z85 length");
  const bytes: number[] = [];
  for (let i = 0; i < cleanStr.length; i += 5) {
    let val = 0;
    let multiplier = 85 * 85 * 85 * 85;
    for (let j = 0; j < 5; j++) {
      const idx = Z85_ALPHABET.indexOf(cleanStr[i + j]);
      if (idx === -1) throw new Error("Invalid Z85 character");
      val += idx * multiplier;
      multiplier /= 85;
    }
    bytes.push((val >>> 24) & 255);
    bytes.push((val >>> 16) & 255);
    bytes.push((val >>> 8) & 255);
    bytes.push(val & 255);
  }
  const result = new Uint8Array(bytes);
  return padding > 0 ? result.slice(0, result.length - padding) : result;
};

const encodeHex = (bytes: Uint8Array, prefix: string, separator: string): string => {
  const hexParts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const hex = bytes[i].toString(16).padStart(2, "0");
    hexParts.push(prefix + hex);
  }
  return hexParts.join(separator);
};

const decodeHex = (str: string, prefix: string, separator: string): Uint8Array => {
  let clean = str.trim();
  if (prefix) {
    const escPrefix = prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    clean = clean.replace(new RegExp(escPrefix, 'g'), '');
  }
  if (separator) {
    const escSep = separator.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    clean = clean.replace(new RegExp(escSep, 'g'), '');
  }
  clean = clean.replace(/\s+/g, '');
  if (clean.length % 2 !== 0) {
    throw new Error("Invalid hex length");
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    const byteVal = parseInt(clean.slice(i, i + 2), 16);
    if (isNaN(byteVal)) throw new Error("Invalid hex character");
    bytes[i / 2] = byteVal;
  }
  return bytes;
};

const encodeBinary = (bytes: Uint8Array, separator: string): string => {
  const binParts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    binParts.push(bytes[i].toString(2).padStart(8, "0"));
  }
  return binParts.join(separator);
};

const decodeBinary = (str: string, separator: string): Uint8Array => {
  let clean = str.trim();
  if (separator) {
    const escSep = separator.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    clean = clean.replace(new RegExp(escSep, 'g'), '');
  }
  clean = clean.replace(/\s+/g, '');
  if (clean.length % 8 !== 0) {
    throw new Error("Invalid binary length");
  }
  const bytes = new Uint8Array(clean.length / 8);
  for (let i = 0; i < clean.length; i += 8) {
    const byteVal = parseInt(clean.slice(i, i + 8), 2);
    if (isNaN(byteVal)) throw new Error("Invalid binary character");
    bytes[i / 8] = byteVal;
  }
  return bytes;
};

const encodeDecimal = (bytes: Uint8Array, delimiter: string): string => {
  const decParts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    decParts.push(bytes[i].toString(10));
  }
  return decParts.join(delimiter);
};

const decodeDecimal = (str: string, delimiter: string): Uint8Array => {
  const clean = str.trim();
  if (!clean) return new Uint8Array(0);
  const parts = delimiter ? clean.split(delimiter) : clean.split(/\s+/);
  const bytes: number[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const val = parseInt(trimmed, 10);
    if (isNaN(val) || val < 0 || val > 255) throw new Error("Invalid decimal byte value");
    bytes.push(val);
  }
  return new Uint8Array(bytes);
};

const encodeOctal = (bytes: Uint8Array, delimiter: string): string => {
  const octParts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    octParts.push(bytes[i].toString(8).padStart(3, "0"));
  }
  return octParts.join(delimiter);
};

const decodeOctal = (str: string, delimiter: string): Uint8Array => {
  const clean = str.trim();
  if (!clean) return new Uint8Array(0);
  const parts = delimiter ? clean.split(delimiter) : clean.split(/\s+/);
  const bytes: number[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const val = parseInt(trimmed, 8);
    if (isNaN(val) || val < 0 || val > 255) throw new Error("Invalid octal byte value");
    bytes.push(val);
  }
  return new Uint8Array(bytes);
};

const encodeBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const decodeBase64 = (str: string): Uint8Array => {
  const binary = atob(str.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const encodeCaesar = (str: string, shift: number): string => {
  return str.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(((code - 65 + shift) % 26) + 65);
    } else if (code >= 97 && code <= 122) {
      return String.fromCharCode(((code - 97 + shift) % 26) + 97);
    }
    return char;
  }).join('');
};

const decodeCaesar = (str: string, shift: number): string => {
  const revShift = (26 - (shift % 26)) % 26;
  return encodeCaesar(str, revShift);
};

const encodeHtmlEntities = (str: string): string => {
  return str.replace(/[\u0000-\u001f\u007f-\u009f&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return `&#${c.charCodeAt(0)};`;
    }
  });
};

const decodeHtmlEntities = (str: string): string => {
  if (!str) return '';
  try {
    const doc = new DOMParser().parseFromString(str, 'text/html');
    return doc.documentElement.textContent || '';
  } catch {
    return '';
  }
};

type ActiveFormat =
  | "text"
  | "hex"
  | "bin"
  | "dec"
  | "oct"
  | "b64"
  | "b32"
  | "b58"
  | "b85"
  | "url"
  | "html"
  | "caesar";

export function UniversalEncoderDecoder({
  initialData,
  onStateChange,
}: {
  initialData?: any;
  onStateChange?: (state: any) => void;
}) {
  const { t } = useTranslation();

  const [activeFormat, setActiveFormat] = useState<ActiveFormat>(
    initialData?.activeFormat || "text"
  );
  const [textVal, setTextVal] = useState(initialData?.textVal || "Hello World!");
  const [hexVal, setHexVal] = useState("");
  const [binVal, setBinVal] = useState("");
  const [decVal, setDecVal] = useState("");
  const [octVal, setOctVal] = useState("");
  const [b64Val, setB64Val] = useState("");
  const [b32Val, setB32Val] = useState("");
  const [b58Val, setB58Val] = useState("");
  const [b85Val, setB85Val] = useState("");
  const [urlVal, setUrlVal] = useState("");
  const [htmlVal, setHtmlVal] = useState("");
  const [caesarVal, setCaesarVal] = useState("");

  // Encoding formatting configurations
  const [hexPrefix, setHexPrefix] = useState(initialData?.hexPrefix || "");
  const [hexSeparator, setHexSeparator] = useState(initialData?.hexSeparator || " ");
  const [binSeparator, setBinSeparator] = useState(initialData?.binSeparator || " ");
  const [decDelimiter, setDecDelimiter] = useState(initialData?.decDelimiter || " ");
  const [octDelimiter, setOctDelimiter] = useState(initialData?.octDelimiter || " ");
  const [caesarShift, setCaesarShift] = useState(initialData?.caesarShift || 3);

  const [error, setError] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<ActiveFormat | null>(null);

  const primaryInputRef = useRef<HTMLTextAreaElement>(null);

  // Propagate state to parent
  useEffect(() => {
    onStateChange?.({
      activeFormat,
      textVal,
      hexPrefix,
      hexSeparator,
      binSeparator,
      decDelimiter,
      octDelimiter,
      caesarShift,
    });
  }, [
    activeFormat,
    textVal,
    hexPrefix,
    hexSeparator,
    binSeparator,
    decDelimiter,
    octDelimiter,
    caesarShift,
    onStateChange,
  ]);

  // Unified Conversion Engine
  const updateAllFields = useCallback(
    (plainText: string) => {
      try {
        setError(null);
        if (plainText.length > MAX_LENGTH) {
          setError(t("error.max_length", { max: MAX_LENGTH.toLocaleString() }));
          return;
        }

        const encoder = new TextEncoder();
        const bytes = encoder.encode(plainText);

        // Plain Text
        setTextVal(plainText);

        // Hexadecimal
        setHexVal(encodeHex(bytes, hexPrefix, hexSeparator));

        // Binary
        setBinVal(encodeBinary(bytes, binSeparator));

        // Decimal
        setDecVal(encodeDecimal(bytes, decDelimiter));

        // Octal
        setOctVal(encodeOctal(bytes, octDelimiter));

        // Base64
        setB64Val(encodeBase64(bytes));

        // Base32
        setB32Val(encodeBase32(bytes));

        // Base58
        setB58Val(encodeBase58(bytes));

        // Base85 (Z85)
        setB85Val(encodeZ85(bytes));

        // URL Encoded
        setUrlVal(encodeURIComponent(plainText));

        // HTML Entities
        setHtmlVal(encodeHtmlEntities(plainText));

        // Caesar Cipher
        setCaesarVal(encodeCaesar(plainText, caesarShift));
      } catch (err: any) {
        setError(err.message || "Encoding error");
      }
    },
    [hexPrefix, hexSeparator, binSeparator, decDelimiter, octDelimiter, caesarShift, t]
  );

  // Trigger re-encoding whenever configuration settings change
  useEffect(() => {
    updateAllFields(textVal);
  }, [hexPrefix, hexSeparator, binSeparator, decDelimiter, octDelimiter, caesarShift, updateAllFields]);

  // Handle manual input modification in any textbox
  const handleFieldChange = (format: ActiveFormat, value: string) => {
    setActiveFormat(format);
    if (value.length > MAX_LENGTH) {
      setError(t("error.max_length", { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);

    try {
      let plain = "";
      const decoder = new TextDecoder("utf-8", { fatal: true });

      switch (format) {
        case "text":
          plain = value;
          break;
        case "hex":
          setHexVal(value);
          if (!value.trim()) break;
          plain = decoder.decode(decodeHex(value, hexPrefix, hexSeparator));
          break;
        case "bin":
          setBinVal(value);
          if (!value.trim()) break;
          plain = decoder.decode(decodeBinary(value, binSeparator));
          break;
        case "dec":
          setDecVal(value);
          if (!value.trim()) break;
          plain = decoder.decode(decodeDecimal(value, decDelimiter));
          break;
        case "oct":
          setOctVal(value);
          if (!value.trim()) break;
          plain = decoder.decode(decodeOctal(value, octDelimiter));
          break;
        case "b64":
          setB64Val(value);
          if (!value.trim()) break;
          plain = decoder.decode(decodeBase64(value));
          break;
        case "b32":
          setB32Val(value);
          if (!value.trim()) break;
          plain = decoder.decode(decodeBase32(value));
          break;
        case "b58":
          setB58Val(value);
          if (!value.trim()) break;
          plain = decoder.decode(decodeBase58(value));
          break;
        case "b85":
          setB85Val(value);
          if (!value.trim()) break;
          plain = decoder.decode(decodeZ85(value));
          break;
        case "url":
          setUrlVal(value);
          if (!value.trim()) break;
          plain = decodeURIComponent(value);
          break;
        case "html":
          setHtmlVal(value);
          if (!value.trim()) break;
          plain = decodeHtmlEntities(value);
          break;
        case "caesar":
          setCaesarVal(value);
          if (!value.trim()) break;
          plain = decodeCaesar(value, caesarShift);
          break;
      }

      // Update remaining fields with newly recovered standard plain text
      if (format === "text") {
        updateAllFields(value);
      } else {
        setTextVal(plain);
        // Recalculate other targets
        const encoder = new TextEncoder();
        const bytes = encoder.encode(plain);

        if (format !== "hex") setHexVal(encodeHex(bytes, hexPrefix, hexSeparator));
        if (format !== "bin") setBinVal(encodeBinary(bytes, binSeparator));
        if (format !== "dec") setDecVal(encodeDecimal(bytes, decDelimiter));
        if (format !== "oct") setOctVal(encodeOctal(bytes, octDelimiter));
        if (format !== "b64") setB64Val(encodeBase64(bytes));
        if (format !== "b32") setB32Val(encodeBase32(bytes));
        if (format !== "b58") setB58Val(encodeBase58(bytes));
        if (format !== "b85") setB85Val(encodeZ85(bytes));
        if (format !== "url") setUrlVal(encodeURIComponent(plain));
        if (format !== "html") setHtmlVal(encodeHtmlEntities(plain));
        if (format !== "caesar") setCaesarVal(encodeCaesar(plain, caesarShift));
      }
    } catch (err: any) {
      setError(t("universal_encoder.error_parse", { defaultValue: "Decoding failed - Invalid format bytes" }));
    }
  };

  // Copy target text value
  const handleCopy = useCallback((format: ActiveFormat) => {
    let targetText = "";
    switch (format) {
      case "text": targetText = textVal; break;
      case "hex": targetText = hexVal; break;
      case "bin": targetText = binVal; break;
      case "dec": targetText = decVal; break;
      case "oct": targetText = octVal; break;
      case "b64": targetText = b64Val; break;
      case "b32": targetText = b32Val; break;
      case "b58": targetText = b58Val; break;
      case "b85": targetText = b85Val; break;
      case "url": targetText = urlVal; break;
      case "html": targetText = htmlVal; break;
      case "caesar": targetText = caesarVal; break;
    }
    if (!targetText) return;
    navigator.clipboard.writeText(targetText);
    setCopiedFormat(format);
    toast.success(t("universal_encoder.toast_copied", { defaultValue: "Copied to clipboard!" }));
    setTimeout(() => setCopiedFormat(null), 1500);
  }, [textVal, hexVal, binVal, decVal, octVal, b64Val, b32Val, b58Val, b85Val, urlVal, htmlVal, caesarVal, t]);

  // Clear everything & return focus
  const handleReset = useCallback(() => {
    setTextVal("");
    setHexVal("");
    setBinVal("");
    setDecVal("");
    setOctVal("");
    setB64Val("");
    setB32Val("");
    setB58Val("");
    setB85Val("");
    setUrlVal("");
    setHtmlVal("");
    setCaesarVal("");
    setError(null);
    setActiveFormat("text");
    toast.success(t("universal_encoder.toast_reset", { defaultValue: "Cleared all values!" }));
    primaryInputRef.current?.focus();
  }, [t]);

  // Use refs to prevent stale closure in global keyboard listener
  const handlersRef = useRef({ handleReset, handleCopy, activeFormat });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy, activeFormat };
  }, [handleReset, handleCopy, activeFormat]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute("contenteditable") === "true";

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy(handlersRef.current.activeFormat);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Settings Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase text-xs tracking-widest">
            <Settings2 className="w-4 h-4" />
            {t("universal_encoder.settings_title", { defaultValue: "Formatting Configurations" })}
          </div>
          <button
            onClick={handleReset}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            aria-label="Reset all inputs"
          >
            <RotateCcw className="w-4 h-4" />
            {t("common.reset")}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Hex Settings */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
              {t("universal_encoder.hex_prefix", { defaultValue: "Hex Prefix" })}
            </span>
            <select
              value={hexPrefix}
              onChange={(e) => setHexPrefix(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none font-medium dark:text-white"
            >
              <option value="">{t("universal_encoder.none", { defaultValue: "None" })}</option>
              <option value="0x">0x</option>
              <option value="\x">\x</option>
              <option value="%">%</option>
            </select>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
              {t("universal_encoder.hex_separator", { defaultValue: "Hex Separator" })}
            </span>
            <select
              value={hexSeparator}
              onChange={(e) => setHexSeparator(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none font-medium dark:text-white"
            >
              <option value="">{t("universal_encoder.none", { defaultValue: "None" })}</option>
              <option value=" ">{t("universal_encoder.space", { defaultValue: "Space" })}</option>
              <option value=",">Comma (,)</option>
              <option value="-">Dash (-)</option>
            </select>
          </div>

          {/* Binary Sep */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
              {t("universal_encoder.bin_separator", { defaultValue: "Binary Separator" })}
            </span>
            <select
              value={binSeparator}
              onChange={(e) => setBinSeparator(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none font-medium dark:text-white"
            >
              <option value="">{t("universal_encoder.none", { defaultValue: "None" })}</option>
              <option value=" ">{t("universal_encoder.space", { defaultValue: "Space" })}</option>
              <option value="-">Dash (-)</option>
            </select>
          </div>

          {/* Dec/Oct delimiter */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
              {t("universal_encoder.dec_delimiter", { defaultValue: "Dec/Oct Separator" })}
            </span>
            <select
              value={decDelimiter}
              onChange={(e) => {
                setDecDelimiter(e.target.value);
                setOctDelimiter(e.target.value);
              }}
              className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none font-medium dark:text-white"
            >
              <option value=" ">{t("universal_encoder.space", { defaultValue: "Space" })}</option>
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
            </select>
          </div>

          {/* Caesar shift */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
              {t("universal_encoder.caesar_shift", { defaultValue: "Caesar Shift (Key)" })}
            </span>
            <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 rounded-xl">
              <input
                type="range"
                min="0"
                max="25"
                value={caesarShift}
                onChange={(e) => setCaesarShift(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 rounded-lg"
              />
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 min-w-5 text-center">
                {caesarShift}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 12 Formats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* 1. Plain Text */}
        <div className={`p-5 rounded-2xl border transition-all ${activeFormat === "text" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-indigo-500" />
              {t("universal_encoder.format_text", { defaultValue: "Plain Text (UTF-8)" })}
            </span>
            <button
              onClick={() => handleCopy("text")}
              className={`p-1.5 rounded-lg transition-colors ${copiedFormat === "text" ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title="Copy format"
            >
              {copiedFormat === "text" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            ref={primaryInputRef}
            id="text-textarea"
            value={textVal}
            onChange={(e) => handleFieldChange("text", e.target.value)}
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs leading-relaxed resize-none outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* 2. Hexadecimal */}
        <div className={`p-5 rounded-2xl border transition-all ${activeFormat === "hex" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-amber-500" />
              {t("universal_encoder.format_hex", { defaultValue: "Hexadecimal" })}
            </span>
            <button
              onClick={() => handleCopy("hex")}
              className={`p-1.5 rounded-lg transition-colors ${copiedFormat === "hex" ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title="Copy format"
            >
              {copiedFormat === "hex" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="hex-textarea"
            value={hexVal}
            onChange={(e) => handleFieldChange("hex", e.target.value)}
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs leading-relaxed resize-none outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* 3. Binary */}
        <div className={`p-5 rounded-2xl border transition-all ${activeFormat === "bin" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-emerald-500" />
              {t("universal_encoder.format_bin", { defaultValue: "Binary" })}
            </span>
            <button
              onClick={() => handleCopy("bin")}
              className={`p-1.5 rounded-lg transition-colors ${copiedFormat === "bin" ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title="Copy format"
            >
              {copiedFormat === "bin" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="bin-textarea"
            value={binVal}
            onChange={(e) => handleFieldChange("bin", e.target.value)}
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs leading-relaxed resize-none outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* 4. Base64 */}
        <div className={`p-5 rounded-2xl border transition-all ${activeFormat === "b64" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-500" />
              {t("universal_encoder.format_b64", { defaultValue: "Base64" })}
            </span>
            <button
              onClick={() => handleCopy("b64")}
              className={`p-1.5 rounded-lg transition-colors ${copiedFormat === "b64" ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title="Copy format"
            >
              {copiedFormat === "b64" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="b64-textarea"
            value={b64Val}
            onChange={(e) => handleFieldChange("b64", e.target.value)}
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs leading-relaxed resize-none outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* 5. Base32 */}
        <div className={`p-5 rounded-2xl border transition-all ${activeFormat === "b32" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-violet-500" />
              {t("universal_encoder.format_b32", { defaultValue: "Base32" })}
            </span>
            <button
              onClick={() => handleCopy("b32")}
              className={`p-1.5 rounded-lg transition-colors ${copiedFormat === "b32" ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title="Copy format"
            >
              {copiedFormat === "b32" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="b32-textarea"
            value={b32Val}
            onChange={(e) => handleFieldChange("b32", e.target.value)}
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs leading-relaxed resize-none outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* 6. Base58 */}
        <div className={`p-5 rounded-2xl border transition-all ${activeFormat === "b58" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-500" />
              {t("universal_encoder.format_b58", { defaultValue: "Base58" })}
            </span>
            <button
              onClick={() => handleCopy("b58")}
              className={`p-1.5 rounded-lg transition-colors ${copiedFormat === "b58" ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title="Copy format"
            >
              {copiedFormat === "b58" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="b58-textarea"
            value={b58Val}
            onChange={(e) => handleFieldChange("b58", e.target.value)}
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs leading-relaxed resize-none outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* 7. Base85 (Z85) */}
        <div className={`p-5 rounded-2xl border transition-all ${activeFormat === "b85" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-cyan-500" />
              {t("universal_encoder.format_b85", { defaultValue: "Base85 (Z85)" })}
            </span>
            <button
              onClick={() => handleCopy("b85")}
              className={`p-1.5 rounded-lg transition-colors ${copiedFormat === "b85" ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title="Copy format"
            >
              {copiedFormat === "b85" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="b85-textarea"
            value={b85Val}
            onChange={(e) => handleFieldChange("b85", e.target.value)}
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs leading-relaxed resize-none outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* 8. URL Encoded */}
        <div className={`p-5 rounded-2xl border transition-all ${activeFormat === "url" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-pink-500" />
              {t("universal_encoder.format_url", { defaultValue: "URL Encoded" })}
            </span>
            <button
              onClick={() => handleCopy("url")}
              className={`p-1.5 rounded-lg transition-colors ${copiedFormat === "url" ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title="Copy format"
            >
              {copiedFormat === "url" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="url-textarea"
            value={urlVal}
            onChange={(e) => handleFieldChange("url", e.target.value)}
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs leading-relaxed resize-none outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* 9. HTML Entities */}
        <div className={`p-5 rounded-2xl border transition-all ${activeFormat === "html" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-600" />
              {t("universal_encoder.format_html", { defaultValue: "HTML Entities" })}
            </span>
            <button
              onClick={() => handleCopy("html")}
              className={`p-1.5 rounded-lg transition-colors ${copiedFormat === "html" ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title="Copy format"
            >
              {copiedFormat === "html" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="html-textarea"
            value={htmlVal}
            onChange={(e) => handleFieldChange("html", e.target.value)}
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs leading-relaxed resize-none outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* 10. Decimal ASCII */}
        <div className={`p-5 rounded-2xl border transition-all ${activeFormat === "dec" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-yellow-600" />
              {t("universal_encoder.format_dec", { defaultValue: "Decimal (ASCII)" })}
            </span>
            <button
              onClick={() => handleCopy("dec")}
              className={`p-1.5 rounded-lg transition-colors ${copiedFormat === "dec" ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title="Copy format"
            >
              {copiedFormat === "dec" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="dec-textarea"
            value={decVal}
            onChange={(e) => handleFieldChange("dec", e.target.value)}
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs leading-relaxed resize-none outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* 11. Octal */}
        <div className={`p-5 rounded-2xl border transition-all ${activeFormat === "oct" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-gray-500" />
              {t("universal_encoder.format_oct", { defaultValue: "Octal" })}
            </span>
            <button
              onClick={() => handleCopy("oct")}
              className={`p-1.5 rounded-lg transition-colors ${copiedFormat === "oct" ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title="Copy format"
            >
              {copiedFormat === "oct" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="oct-textarea"
            value={octVal}
            onChange={(e) => handleFieldChange("oct", e.target.value)}
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs leading-relaxed resize-none outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* 12. Caesar Cipher */}
        <div className={`p-5 rounded-2xl border transition-all ${activeFormat === "caesar" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-sky-500" />
              {t("universal_encoder.format_caesar", { defaultValue: "Caesar Cipher" })}
            </span>
            <button
              onClick={() => handleCopy("caesar")}
              className={`p-1.5 rounded-lg transition-colors ${copiedFormat === "caesar" ? "text-emerald-500 bg-emerald-500/10" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              title="Copy format"
            >
              {copiedFormat === "caesar" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="caesar-textarea"
            value={caesarVal}
            onChange={(e) => handleFieldChange("caesar", e.target.value)}
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs leading-relaxed resize-none outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>
      </div>

      {/* Raccourcis Clavier Informational Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span>{t("universal_encoder.keyboard_shortcuts", { defaultValue: "Keyboard Shortcuts:" })}</span>
          <Kbd modifier={null}>Esc</Kbd>
          <span className="text-slate-400 font-normal">{t("universal_encoder.shortcut_clear", { defaultValue: "Clear all values" })}</span>
          <span className="mx-1">•</span>
          <Kbd modifier={null}>C</Kbd>
          <span className="text-slate-400 font-normal">{t("universal_encoder.shortcut_copy", { defaultValue: "Copy active field content" })}</span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          {t("universal_encoder.active_format_indicator", { defaultValue: "Active: " })}{activeFormat.toUpperCase()}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t("universal_encoder.about_title", { defaultValue: "About Universal Text Encoder & Decoder" })}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("universal_encoder.about_desc", { defaultValue: "This is a premium, high-fidelity all-in-one coder suite. Type into any format's textbox, and it acts as the primary source—decoding its own representation back to UTF-8 plain text, and propagating that change in real-time across all 11 other encoding formats simultaneously! Includes configurations for hexadecimal, binary, decimal, and octal formatting, plus custom Caesar Cipher shift offsets. Fully safe against client-side Denial of Service with strict length limits, executing 100% offline inside your browser." })}
          </p>
        </div>
      </div>
    </div>
  );
}
