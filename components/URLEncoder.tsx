import { useState, useCallback, useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Trash2,
  Copy,
  Check,
  Info,
  LinkIcon,
  Code,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const PRESETS = [
  {
    key: "api",
    labelKey: "urlencoder.preset_api",
    defaultLabel: "API Query Params",
    value: "https://api.example.com/v1/search?q=hello world & caffeine=100%&category=dev/tools",
  },
  {
    key: "special",
    labelKey: "urlencoder.preset_special",
    defaultLabel: "Special Chars & Emoji",
    value: "Café & Crème ☕! Price: $19.99 (#1 Deal)",
  },
  {
    key: "oauth",
    labelKey: "urlencoder.preset_oauth",
    defaultLabel: "OAuth Redirect URI",
    value: "https://app.example.com/auth/callback?scope=user:read write&state=xyz/123==",
  },
];

export function URLEncoder({
  initialData,
  onStateChange,
}: {
  initialData?: any;
  onStateChange?: (state: any) => void;
}) {
  const decodedRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();
  const [decoded, setDecoded] = useState(initialData?.decoded || "");
  const [encoded, setEncoded] = useState(initialData?.encoded || "");
  const [copiedDecoded, setCopiedDecoded] = useState(false);
  const [copiedEncoded, setCopiedEncoded] = useState(false);

  useEffect(() => {
    onStateChange?.({ decoded, encoded });
  }, [decoded, encoded, onStateChange]);

  const encode = (text: string) => {
    try {
      return encodeURIComponent(text);
    } catch {
      return t("error.invalid_encoding", "Encoding error");
    }
  };

  const decode = (text: string) => {
    try {
      return decodeURIComponent(text);
    } catch {
      return t("error.invalid_decoding", "Decoding error");
    }
  };

  const handleDecodedChange = (value: string) => {
    setDecoded(value);
    setEncoded(encode(value));
  };

  const handleEncodedChange = (value: string) => {
    setEncoded(value);
    setDecoded(decode(value));
  };

  const handleCopyDecoded = useCallback(() => {
    if (!decoded) return;
    navigator.clipboard.writeText(decoded);
    setCopiedDecoded(true);
    toast.success(t("urlencoder.toast_copied", "Copied to clipboard!"));
    setTimeout(() => setCopiedDecoded(false), 2000);
  }, [decoded, t]);

  const handleCopyEncoded = useCallback(() => {
    if (!encoded) return;
    navigator.clipboard.writeText(encoded);
    setCopiedEncoded(true);
    toast.success(t("urlencoder.toast_copied", "Copied to clipboard!"));
    setTimeout(() => setCopiedEncoded(false), 2000);
  }, [encoded, t]);

  const handleClear = useCallback(() => {
    setDecoded("");
    setEncoded("");
    toast.success(t("urlencoder.toast_cleared", "Cleared!"));
    decodedRef.current?.focus();
  }, [t]);

  const handleApplyPreset = useCallback((value: string) => {
    setDecoded(value);
    setEncoded(encodeURIComponent(value));
    toast.success(t("urlencoder.preset_loaded", "Preset loaded successfully!"));
    decodedRef.current?.focus();
  }, [t]);

  const handleCopyEncodedRef = useRef(handleCopyEncoded);
  const handleClearRef = useRef(handleClear);

  useEffect(() => {
    handleCopyEncodedRef.current = handleCopyEncoded;
    handleClearRef.current = handleClear;
  }, [handleCopyEncoded, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyEncodedRef.current();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClearRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          {t("urlencoder.presets_title", "Quick Presets:")}
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            onClick={() => handleApplyPreset(preset.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {t(preset.labelKey, preset.defaultLabel)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Décodé */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label
              htmlFor="url-decoded"
              className="group text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer"
            >
              <LinkIcon className="w-3 h-3 text-indigo-500 transition-transform group-hover:scale-110" />{" "}
              {t("urlencoder.decoded")}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCopyDecoded}
                disabled={!decoded}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedDecoded
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copiedDecoded ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}{" "}
                {copiedDecoded ? t("common.copied") : t("common.copy")}
              </button>
              <button
                onClick={handleClear}
                disabled={!decoded && !encoded}
                aria-label={t("common.clear")}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-transparent transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t("common.clear")}
                <Kbd modifier={null} className="ml-1 hidden sm:inline-flex text-rose-500 border-rose-200 dark:border-rose-800 bg-white/50 dark:bg-black/20">
                  Esc
                </Kbd>
              </button>
            </div>
          </div>
          <textarea
            id="url-decoded"
            ref={decodedRef}
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleClear();
              }
            }}
            placeholder={t("urlencoder.placeholder_decoded")}
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono resize-none"
          />
        </div>

        {/* Encodé */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label
              htmlFor="url-encoded"
              className="group text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer"
            >
              <Code className="w-3 h-3 text-indigo-500 transition-transform group-hover:scale-110" />{" "}
              {t("urlencoder.encoded")}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCopyEncoded}
                disabled={!encoded}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedEncoded
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copiedEncoded ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}{" "}
                {copiedEncoded ? t("common.copied") : t("common.copy")}
                {!copiedEncoded && (
                  <Kbd modifier={null} className="hidden sm:inline-flex border-indigo-200 dark:border-indigo-800 bg-white/50 dark:bg-black/20">
                    C
                  </Kbd>
                )}
              </button>
            </div>
          </div>
          <textarea
            id="url-encoded"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleClear();
              }
            }}
            placeholder={t("urlencoder.placeholder_encoded")}
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono resize-none break-all"
          />
        </div>
      </div>

      <div className="flex justify-center gap-6">
        <div className="hidden md:flex flex-col items-center gap-2 text-slate-300">
          <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
          <ArrowRight className="w-6 h-6 transition-transform hover:scale-110" />
          <ArrowLeft className="w-6 h-6 transition-transform hover:scale-110" />
          <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" />{" "}
            {t("urlencoder.why_title")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("urlencoder.why_text")}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-indigo-500" />{" "}
            {t("urlencoder.live_update_title")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("urlencoder.live_update_text")}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-indigo-500" />{" "}
            {t("urlencoder.special_chars_title")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("urlencoder.special_chars_text")}
          </p>
        </div>
      </div>
    </div>
  );
}
