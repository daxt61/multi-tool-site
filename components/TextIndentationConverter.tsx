import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Indent,
  Outdent,
  Copy,
  Check,
  RotateCcw,
  Download,
  AlertCircle,
  Info,
  Settings2,
  Sparkles,
  ArrowLeftRight,
  Code
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const MAX_LENGTH = 100000;

type ModeType = "tabs_to_spaces" | "spaces_to_tabs" | "add_indent" | "remove_indent" | "trim_indent";
type TrimType = "leading" | "trailing" | "both" | "all_blank_lines";

export function TextIndentationConverter({
  initialData,
  onStateChange,
}: {
  initialData?: any;
  onStateChange?: (state: any) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // States
  const [input, setInput] = useState<string>(initialData?.input || "");
  const [mode, setMode] = useState<ModeType>(initialData?.mode || "tabs_to_spaces");
  const [tabSize, setTabSize] = useState<number>(initialData?.tabSize ?? 4);
  const [indentChar, setIndentChar] = useState<"space" | "tab">(initialData?.indentChar || "space");
  const [indentCount, setIndentCount] = useState<number>(initialData?.indentCount ?? 1);
  const [trimType, setTrimType] = useState<TrimType>(initialData?.trimType || "leading");
  const [lineStartOnly, setLineStartOnly] = useState<boolean>(initialData?.lineStartOnly !== false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // URL state sync
  useEffect(() => {
    onStateChange?.({
      input,
      mode,
      tabSize,
      indentChar,
      indentCount,
      trimType,
      lineStartOnly,
    });
  }, [input, mode, tabSize, indentChar, indentCount, trimType, lineStartOnly, onStateChange]);

  // Handle input change & length check
  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t("indent_converter.error_max_length", { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  // Dynamic Auto-Detect Indentation Level
  const detectedIndent = useMemo(() => {
    if (!input.trim()) return { type: "none", size: 0, label: t("indent_converter.detect_none", "None") };

    const lines = input.split("\n").slice(0, 100).filter(line => line.trim().length > 0);
    let spaceLinesCount = 0;
    let tabLinesCount = 0;
    const spaceIndents: number[] = [];

    lines.forEach(line => {
      const match = line.match(/^([ \t]+)/);
      if (match) {
        const indentStr = match[1];
        if (indentStr.includes("\t")) {
          tabLinesCount++;
        } else {
          spaceLinesCount++;
          spaceIndents.push(indentStr.length);
        }
      }
    });

    if (tabLinesCount > spaceLinesCount) {
      return {
        type: "tab",
        size: 1,
        label: t("indent_converter.detect_tabs", "Tabs"),
      };
    } else if (spaceLinesCount > 0 && spaceIndents.length > 0) {
      // Find the greatest common divisor or the minimum positive diff
      const sorted = [...spaceIndents].sort((a, b) => a - b);
      // Simple heuristic for sizing (usually 2 or 4 or 8)
      let detectedSize = 4;
      const counts: Record<number, number> = Object.create(null);
      sorted.forEach(len => {
        counts[len] = (counts[len] || 0) + 1;
      });

      // Find the most frequent minimum non-zero indentation diff
      const candidates = [2, 4, 8];
      let bestCandidate = 4;
      let maxScore = -1;

      candidates.forEach(cand => {
        let score = 0;
        sorted.forEach(len => {
          if (len % cand === 0) score++;
        });
        if (score > maxScore) {
          maxScore = score;
          bestCandidate = cand;
        }
      });
      detectedSize = bestCandidate;

      return {
        type: "space",
        size: detectedSize,
        label: t("indent_converter.detect_spaces", { size: detectedSize }),
      };
    }

    return { type: "none", size: 0, label: t("indent_converter.detect_none", "None") };
  }, [input, t]);

  // Apply auto-detected settings
  const applyDetectedSettings = () => {
    if (detectedIndent.type === "tab") {
      setIndentChar("tab");
      setTabSize(4);
      toast.success(t("indent_converter.applied_tabs", "Applied Tab settings!"));
    } else if (detectedIndent.type === "space") {
      setIndentChar("space");
      setTabSize(detectedIndent.size);
      toast.success(t("indent_converter.applied_spaces", { size: detectedIndent.size }));
    } else {
      toast.info(t("indent_converter.applied_none", "No indentation detected to apply."));
    }
  };

  // Convert/Transform logic
  const output = useMemo(() => {
    if (!input) return "";
    if (input.length > MAX_LENGTH) return "";

    const lines = input.split("\n");
    const spaceStr = " ".repeat(tabSize);

    const processed = lines.map(line => {
      switch (mode) {
        case "tabs_to_spaces": {
          if (lineStartOnly) {
            // Only convert tabs at the beginning of the line
            const match = line.match(/^(\t+)(.*)$/);
            if (match) {
              const tabs = match[1];
              const rest = match[2];
              return " ".repeat(tabs.length * tabSize) + rest;
            }
            return line;
          } else {
            // Replace all tabs
            return line.replace(/\t/g, spaceStr);
          }
        }
        case "spaces_to_tabs": {
          if (lineStartOnly) {
            // Convert spaces to tabs at line start
            const match = line.match(/^([ ]+)(.*)$/);
            if (match) {
              const spacesCount = match[1].length;
              const rest = match[2];
              const tabsCount = Math.floor(spacesCount / tabSize);
              const remainingSpaces = spacesCount % tabSize;
              return "\t".repeat(tabsCount) + " ".repeat(remainingSpaces) + rest;
            }
            return line;
          } else {
            // Replace all space sequences of tabSize
            const regex = new RegExp(` {${tabSize}}`, "g");
            return line.replace(regex, "\t");
          }
        }
        case "add_indent": {
          const prefix = (indentChar === "tab" ? "\t" : " ").repeat(indentChar === "tab" ? indentCount : indentCount * tabSize);
          return prefix + line;
        }
        case "remove_indent": {
          const singleIndentSize = indentChar === "tab" ? 1 : tabSize;
          const totalToRemove = indentCount * singleIndentSize;
          const charToRemove = indentChar === "tab" ? "\t" : " ";

          let charsRemoved = 0;
          let idx = 0;
          while (idx < line.length && charsRemoved < totalToRemove && line[idx] === charToRemove) {
            idx++;
            charsRemoved += (indentChar === "tab" ? 1 : 1);
          }
          // If we want to support removal of any leading tab/space mix as fallback, we can, but strict match is safer.
          return line.substring(idx);
        }
        case "trim_indent": {
          if (trimType === "leading") {
            return line.trimStart();
          } else if (trimType === "trailing") {
            return line.trimEnd();
          } else if (trimType === "both") {
            return line.trim();
          } else if (trimType === "all_blank_lines") {
            return line; // Handled below during filter
          }
          return line;
        }
        default:
          return line;
      }
    });

    if (mode === "trim_indent" && trimType === "all_blank_lines") {
      return processed.filter(l => l.trim().length > 0).join("\n");
    }

    return processed.join("\n");
  }, [input, mode, tabSize, indentChar, indentCount, trimType, lineStartOnly]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t("indent_converter.copied_success", "Output copied successfully!"));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  // Download output
  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `formatted-indentation-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("indent_converter.download_success", "File downloaded successfully!"));
  };

  // Reset inputs
  const handleReset = useCallback(() => {
    setInput("");
    setMode("tabs_to_spaces");
    setTabSize(4);
    setIndentChar("space");
    setIndentCount(1);
    setTrimType("leading");
    setLineStartOnly(true);
    setError(null);
    toast.info(t("indent_converter.reset_success", "Converter settings reset!"));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [t]);

  // Keyboard shortcut safeguards
  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  }, [handleReset, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      const { handleReset, handleCopy } = handlersRef.current;

      if (isEditable && e.key !== "Escape") return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleReset();
      } else if (e.key.toLowerCase() === "c" && !isEditable) {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div role="alert" className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Inputs and Outputs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Input text */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="indent-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t("indent_converter.input_label", "Source Text")}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">
                  {t("indent_converter.detected", "Detected:")} <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-indigo-500 dark:text-indigo-400 font-bold">{detectedIndent.label}</span>
                </span>
                {detectedIndent.type !== "none" && (
                  <button
                    onClick={applyDetectedSettings}
                    className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg transition-all"
                  >
                    {t("indent_converter.use_detected", "Use Settings")}
                  </button>
                )}
              </div>
            </div>
            <textarea
              id="indent-input"
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={`\tclass Developer {\n\t\tconstructor() {\n\t\t\tthis.indent = "clean";\n\t\t}\n\t}`}
              className="w-full h-72 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300"
            />
          </div>

          {/* Output text */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="indent-output" className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t("indent_converter.output_label", "Processed Output")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  aria-label={t("common.download", "Download as .txt")}
                  title={t("common.download", "Download as .txt")}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  title={`${t("common.copy")} (C)`}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    copied
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                      : "text-slate-600 bg-slate-100 dark:bg-slate-800 border border-transparent hover:bg-slate-200"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                  {copied ? t("common.copied") : t("common.copy")}
                </button>
              </div>
            </div>
            <textarea
              id="indent-output"
              value={output}
              readOnly
              placeholder={t("indent_converter.output_placeholder", "Converted output will appear here...")}
              className="w-full h-72 p-6 bg-slate-900 text-indigo-200 border border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Right column: Interactive Configuration Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-indigo-500">
                <Settings2 className="w-4 h-4" aria-hidden="true" />
                <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                  {t("common.options", "Options")}
                </h3>
              </div>
              <button
                onClick={handleReset}
                aria-label={`${t("common.reset", "Reset")} (Esc)`}
                title={`${t("common.reset", "Reset")} (Esc)`}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Mode selection buttons */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase block px-1">
                {t("indent_converter.operation_mode", "Operation Mode")}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "tabs_to_spaces", label: t("indent_converter.mode_tabs_to_spaces", "Tabs to Spaces"), icon: ArrowLeftRight },
                  { id: "spaces_to_tabs", label: t("indent_converter.mode_spaces_to_tabs", "Spaces to Tabs"), icon: ArrowLeftRight },
                  { id: "add_indent", label: t("indent_converter.mode_add_indent", "Increase Indentation"), icon: Indent },
                  { id: "remove_indent", label: t("indent_converter.mode_remove_indent", "Decrease Indentation"), icon: Outdent },
                  { id: "trim_indent", label: t("indent_converter.mode_trim_indent", "Trim / Clean Indentation"), icon: Code },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id as ModeType)}
                    aria-pressed={mode === item.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      mode === item.id
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/10"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Size Configuration */}
            {(mode === "tabs_to_spaces" || mode === "spaces_to_tabs" || mode === "add_indent" || mode === "remove_indent") && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="tab-size-select" className="text-[10px] font-bold text-slate-400 uppercase">
                    {t("indent_converter.tab_size", "Tab Size (Spaces equivalent)")}
                  </label>
                  <span className="text-xs font-black text-indigo-500 font-mono">{tabSize}</span>
                </div>
                <select
                  id="tab-size-select"
                  value={tabSize}
                  onChange={(e) => setTabSize(parseInt(e.target.value, 10))}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {[1, 2, 3, 4, 6, 8, 12, 16].map((size) => (
                    <option key={size} value={size}>
                      {size} {t("indent_converter.spaces", "spaces")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Addition/Removal Configuration options */}
            {(mode === "add_indent" || mode === "remove_indent") && (
              <div className="space-y-4 pt-2 animate-in fade-in duration-300">
                {/* Indent Character Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block px-1">
                    {t("indent_converter.indent_char", "Indentation Character")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "space", label: t("indent_converter.spaces_option", "Spaces") },
                      { id: "tab", label: t("indent_converter.tabs_option", "Tabs") },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setIndentChar(opt.id as "space" | "tab")}
                        aria-pressed={indentChar === opt.id}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                          indentChar === opt.id
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-slate-950 dark:border-white"
                            : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Indent multiplier count */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor="indent-count-input" className="text-[10px] font-bold text-slate-400 uppercase">
                      {t("indent_converter.indent_count", "Indentation Level / Depth")}
                    </label>
                    <span className="text-xs font-black text-indigo-500 font-mono">{indentCount}</span>
                  </div>
                  <input
                    id="indent-count-input"
                    type="number"
                    min="1"
                    max="10"
                    value={indentCount}
                    onChange={(e) => setIndentCount(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            )}

            {/* Trimming Selection */}
            {mode === "trim_indent" && (
              <div className="space-y-3 pt-2 animate-in fade-in duration-300">
                <label htmlFor="trim-type-select" className="text-[10px] font-bold text-slate-400 uppercase block px-1">
                  {t("indent_converter.trim_type", "Trimming Target")}
                </label>
                <select
                  id="trim-type-select"
                  value={trimType}
                  onChange={(e) => setTrimType(e.target.value as TrimType)}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="leading">{t("indent_converter.trim_leading", "Leading whitespace only")}</option>
                  <option value="trailing">{t("indent_converter.trim_trailing", "Trailing whitespace only")}</option>
                  <option value="both">{t("indent_converter.trim_both", "Both leading & trailing")}</option>
                  <option value="all_blank_lines">{t("indent_converter.trim_blank_lines", "Remove all blank lines")}</option>
                </select>
              </div>
            )}

            {/* Line Start Only constraint toggle */}
            {(mode === "tabs_to_spaces" || mode === "spaces_to_tabs") && (
              <div className="flex items-center gap-3 pt-2 px-1">
                <input
                  id="line-start-only-check"
                  type="checkbox"
                  checked={lineStartOnly}
                  onChange={(e) => setLineStartOnly(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20"
                />
                <label htmlFor="line-start-only-check" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  {t("indent_converter.line_start_only", "Only convert leading indentation")}
                </label>
              </div>
            )}
          </div>

          {/* Quick Shortcuts Hint */}
          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-[2rem] space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 px-1">
              {t("indent_converter.shortcuts_title", "Keyboard Shortcuts")}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Kbd modifier={null} className="bg-white dark:bg-slate-900">Esc</Kbd>
                <span>{t("indent_converter.shortcut_reset", "Reset values")}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Kbd modifier={null} className="bg-white dark:bg-slate-900">C</Kbd>
                <span>{t("indent_converter.shortcut_copy", "Copy result")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive FAQ Info Section */}
      <div className="pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            <span>{t("indent_converter.faq_q1", "What is Indentation Conversion?")}</span>
          </h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("indent_converter.faq_a1", "Code structures use either tabs or spaces to represent nested execution hierarchies. This tool helps you seamlessly standardize files and clean up mixed indent spacing.")}
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            <span>{t("indent_converter.faq_q2", "How does Auto-Detection work?")}</span>
          </h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("indent_converter.faq_a2", "The offline analyzer automatically scans the first 100 lines of text, calculating statistical patterns of tabs versus spaces and sizing to configure matching operations in one click.")}
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            <span>{t("indent_converter.faq_q3", "Is my code secure and private?")}</span>
          </h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("indent_converter.faq_a3", "Yes, 100% private. All processing occurs locally in your browser using pure JavaScript variables. No inputs, codes, or file fragments are ever uploaded or transmitted.")}
          </p>
        </div>
      </div>
    </div>
  );
}
