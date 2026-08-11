import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Palette,
  Copy,
  Check,
  RotateCcw,
  Download,
  Search,
  Settings2,
  Info,
  AlertCircle,
  FileCode,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  ArrowUpDown
} from "lucide-react";
import { Kbd } from "./ui/Kbd";

const MAX_LENGTH = 100000;

interface SelectorResult {
  selector: string;
  score: [number, number, number]; // [a, b, c]
  ids: string[];
  classes: string[];
  attributes: string[];
  pseudoClasses: string[];
  elements: string[];
  pseudoElements: string[];
  isValid: boolean;
}

export function CSSSpecificityCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Input states
  const [selectorsInput, setSelectorsInput] = useState<string>(
    initialData?.selectorsInput ||
      "header .navigation li a:hover\n#main-content article.post [data-author]\nfooter::after\n:not(.is-hidden) button:active\n:is(section, main) p:nth-child(2)"
  );
  const [sortOrder, setSortOrder] = useState<"cascade" | "source" | "none">(initialData?.sortOrder || "cascade");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with URL if onStateChange is provided
  useEffect(() => {
    onStateChange?.({ selectorsInput, sortOrder });
  }, [selectorsInput, sortOrder, onStateChange]);

  const presets = useMemo(() => [
    {
      name: t("css_specificity.preset.basic", "Basic Layout"),
      data: "body\nheader\n#logo\n.nav-item\nmain section p"
    },
    {
      name: t("css_specificity.preset.interactive", "Interactive Styles"),
      data: "a:hover\nbutton:active::before\ninput[type=\"text\"]:focus\nli.active > a"
    },
    {
      name: t("css_specificity.preset.complex", "Complex Selectors"),
      data: "#sidebar .widget:nth-child(even) a[href^=\"https\"]\n.card:not(.is-disabled) .btn:hover\n:is(article, aside) > h2 + p\n:where(.modal, .popup) .close-btn"
    }
  ], [t]);

  const loadPreset = (data: string) => {
    setSelectorsInput(data);
    setError(null);
    toast.success(t("css_specificity.toast.preset_loaded", "Preset loaded successfully!"));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClear = useCallback(() => {
    setSelectorsInput("");
    setError(null);
    toast.success(t("css_specificity.toast.cleared", "Cleared all inputs!"));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [t]);

  // Specificity Parser
  const calculateSpecificity = useCallback((selector: string): SelectorResult => {
    const trimmed = selector.trim();
    if (!trimmed) {
      return {
        selector: "",
        score: [0, 0, 0],
        ids: [],
        classes: [],
        attributes: [],
        pseudoClasses: [],
        elements: [],
        pseudoElements: [],
        isValid: false
      };
    }

    let a = 0; // IDs
    let b = 0; // Classes, Attributes, Pseudo-classes
    let c = 0; // Elements, Pseudo-elements

    const ids: string[] = [];
    const classes: string[] = [];
    const attributes: string[] = [];
    const pseudoClasses: string[] = [];
    const elements: string[] = [];
    const pseudoElements: string[] = [];

    let currentStr = trimmed;

    // 1. Strip comments
    currentStr = currentStr.replace(/\/\*[\s\S]*?\*\//g, "");

    // Helper to recursively parse inside pseudo-classes (not, is, where, has, nth-child)
    const parseNested = (subSelector: string) => {
      const subResult = calculateSpecificity(subSelector);
      a += subResult.score[0];
      b += subResult.score[1];
      c += subResult.score[2];
      ids.push(...subResult.ids);
      classes.push(...subResult.classes);
      attributes.push(...subResult.attributes);
      pseudoClasses.push(...subResult.pseudoClasses);
      elements.push(...subResult.elements);
      pseudoElements.push(...subResult.pseudoElements);
    };

    try {
      // 2. Extract Attributes [...]
      // Regex matches attribute selectors taking nested quotes into account
      const attrRegex = /\[([^\]'"]*|'[^']*'|"[^"]*")*\]/g;
      currentStr = currentStr.replace(attrRegex, (match) => {
        b++;
        attributes.push(match);
        return " "; // replace with space to avoid stitching surrounding text
      });

      // 3. Extract Double-colon Pseudo-elements (e.g. ::after, ::before, ::first-line)
      const doubleColonRegex = /::([a-zA-Z0-9_-]+)/g;
      currentStr = currentStr.replace(doubleColonRegex, (match, name) => {
        c++;
        pseudoElements.push(match);
        return " ";
      });

      // 4. Extract Single-colon Pseudo-elements (legacy notation)
      const legacyPseudoElements = /:(before|after|first-line|first-letter|selection|placeholder-shown)\b/gi;
      currentStr = currentStr.replace(legacyPseudoElements, (match) => {
        c++;
        pseudoElements.push(match);
        return " ";
      });

      // 5. Extract Pseudo-classes with parameters recursively (not, is, where, has, nth-child)
      // We process character by character to handle nested parentheses correctly
      let index = 0;
      while ((index = currentStr.indexOf(":")) !== -1) {
        // Find end of pseudo-class name
        let nameEnd = index + 1;
        while (nameEnd < currentStr.length && /[a-zA-Z0-9_-]/.test(currentStr[nameEnd])) {
          nameEnd++;
        }
        const pseudoName = currentStr.substring(index + 1, nameEnd).toLowerCase();

        if (!pseudoName) {
          // Solitary colon, replace to avoid infinite loop
          currentStr = currentStr.substring(0, index) + " " + currentStr.substring(index + 1);
          continue;
        }

        // If it has parameters (followed by '(')
        if (nameEnd < currentStr.length && currentStr[nameEnd] === "(") {
          // Find matching closing parenthesis
          let parenDepth = 1;
          let scan = nameEnd + 1;
          while (scan < currentStr.length && parenDepth > 0) {
            if (currentStr[scan] === "(") parenDepth++;
            else if (currentStr[scan] === ")") parenDepth--;
            scan++;
          }

          if (parenDepth === 0) {
            const wholeMatch = currentStr.substring(index, scan);
            const argsStr = currentStr.substring(nameEnd + 1, scan - 1).trim();

            if (pseudoName === "where") {
              // :where() has 0 specificity, ignore argument specificity
              pseudoClasses.push(wholeMatch);
            } else if (pseudoName === "is" || pseudoName === "not" || pseudoName === "has" || pseudoName === "matches") {
              // Specificity is the max specificity of its arguments
              pseudoClasses.push(wholeMatch);

              // Split arguments by comma (ignoring commas inside nested parens/quotes)
              const args: string[] = [];
              let argStart = 0;
              let subParenDepth = 0;
              let inQuote = false;
              let quoteChar = "";

              for (let i = 0; i < argsStr.length; i++) {
                const char = argsStr[i];
                if ((char === '"' || char === "'") && (i === 0 || argsStr[i - 1] !== "\\")) {
                  if (inQuote && char === quoteChar) {
                    inQuote = false;
                  } else if (!inQuote) {
                    inQuote = true;
                    quoteChar = char;
                  }
                }
                if (!inQuote) {
                  if (char === "(") subParenDepth++;
                  else if (char === ")") subParenDepth--;
                  else if (char === "," && subParenDepth === 0) {
                    args.push(argsStr.substring(argStart, i).trim());
                    argStart = i + 1;
                  }
                }
              }
              args.push(argsStr.substring(argStart).trim());

              let maxA = 0;
              let maxB = 0;
              let maxC = 0;

              args.forEach(arg => {
                if (arg) {
                  const subResult = calculateSpecificity(arg);
                  const subScore = subResult.score;
                  if (subScore[0] > maxA || (subScore[0] === maxA && subScore[1] > maxB) || (subScore[0] === maxA && subScore[1] === maxB && subScore[2] > maxC)) {
                    maxA = subScore[0];
                    maxB = subScore[1];
                    maxC = subScore[2];
                  }
                }
              });

              a += maxA;
              b += maxB;
              c += maxC;
            } else if (pseudoName === "nth-child" || pseudoName === "nth-last-child") {
              // Adds 1 to B (for nth-child itself) + specificity of the optional "of selector"
              b++;
              pseudoClasses.push(wholeMatch);

              const ofIndex = argsStr.toLowerCase().indexOf("of ");
              if (ofIndex !== -1) {
                const ofSelector = argsStr.substring(ofIndex + 3).trim();
                parseNested(ofSelector);
              }
            } else {
              // Standard pseudo-class with arguments, e.g. :lang(en)
              b++;
              pseudoClasses.push(wholeMatch);
            }

            // Remove the whole matched pseudo-class from the string
            currentStr = currentStr.substring(0, index) + " " + currentStr.substring(scan);
          } else {
            // Unmatched parenthesis, treat as standard pseudo-class
            b++;
            pseudoClasses.push(":" + pseudoName);
            currentStr = currentStr.substring(0, index) + " " + currentStr.substring(nameEnd);
          }
        } else {
          // Standard pseudo-class without arguments, e.g. :hover, :focus
          b++;
          pseudoClasses.push(":" + pseudoName);
          currentStr = currentStr.substring(0, index) + " " + currentStr.substring(nameEnd);
        }
      }

      // 6. Extract IDs
      const idRegex = /#([a-zA-Z0-9_-]+)/g;
      currentStr = currentStr.replace(idRegex, (match) => {
        a++;
        ids.push(match);
        return " ";
      });

      // 7. Extract Classes
      const classRegex = /\.([a-zA-Z0-9_-]+)/g;
      currentStr = currentStr.replace(classRegex, (match) => {
        b++;
        classes.push(match);
        return " ";
      });

      // 8. Extract Elements (remnants after stripping IDs, classes, attributes, pseudo-classes)
      // Remove combinators, universal selectors, and whitespace
      currentStr = currentStr.replace(/[\s>+~|]+/g, " ");
      currentStr = currentStr.replace(/\*/g, " "); // universal selector has 0 specificity

      const elementRegex = /\b[a-zA-Z0-9_-]+\b/g;
      let match;
      while ((match = elementRegex.exec(currentStr)) !== null) {
        // Exclude numeric values (like grid grid-cols, or numbers, and ensure it starts with a letter or standard prefix)
        if (/^[a-zA-Z_-]/.test(match[0])) {
          c++;
          elements.push(match[0]);
        }
      }

    } catch (err) {
      // Gracefully handle parsing anomalies
    }

    return {
      selector: trimmed,
      score: [a, b, c],
      ids,
      classes,
      attributes,
      pseudoClasses,
      elements,
      pseudoElements,
      isValid: true
    };
  }, [t]);

  // Process all input selectors
  const parsedSelectors = useMemo(() => {
    if (selectorsInput.length > MAX_LENGTH) {
      setError(t("error.max_length", { max: MAX_LENGTH.toLocaleString() }));
      return [];
    }
    setError(null);

    const lines = selectorsInput.split(/\r?\n/).filter(line => line.trim().length > 0);
    const results = lines.map(line => calculateSpecificity(line));

    if (sortOrder === "cascade") {
      // Sort highest specificity first
      return [...results].sort((x, y) => {
        if (x.score[0] !== y.score[0]) return y.score[0] - x.score[0];
        if (x.score[1] !== y.score[1]) return y.score[1] - x.score[1];
        if (x.score[2] !== y.score[2]) return y.score[2] - x.score[2];
        return 0; // Preserve source order otherwise
      });
    }

    return results;
  }, [selectorsInput, sortOrder, calculateSpecificity, t]);

  const handleCopy = useCallback(() => {
    if (parsedSelectors.length === 0) return;
    const reportText = parsedSelectors
      .map(
        item =>
          `Selector: ${item.selector}\nSpecificity: (${item.score.join(", ")})\nIDs: ${item.ids.length > 0 ? item.ids.join(", ") : "None"}\nClasses: ${item.classes.length > 0 ? item.classes.join(", ") : "None"}\nAttributes: ${item.attributes.length > 0 ? item.attributes.join(", ") : "None"}\nPseudo-classes: ${item.pseudoClasses.length > 0 ? item.pseudoClasses.join(", ") : "None"}\nElements: ${item.elements.length > 0 ? item.elements.join(", ") : "None"}\nPseudo-elements: ${item.pseudoElements.length > 0 ? item.pseudoElements.join(", ") : "None"}\n--------------------------------`
      )
      .join("\n");

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    toast.success(t("css_specificity.toast.copied", "Copied results to clipboard!"));
    setTimeout(() => setCopied(false), 2000);
  }, [parsedSelectors, t]);

  const handleDownload = () => {
    if (parsedSelectors.length === 0) return;
    const reportText = parsedSelectors
      .map(
        item =>
          `Selector: ${item.selector}\nSpecificity: (${item.score.join(", ")})\nIDs: ${item.ids.length > 0 ? item.ids.join(", ") : "None"}\nClasses: ${item.classes.length > 0 ? item.classes.join(", ") : "None"}\nAttributes: ${item.attributes.length > 0 ? item.attributes.join(", ") : "None"}\nPseudo-classes: ${item.pseudoClasses.length > 0 ? item.pseudoClasses.join(", ") : "None"}\nElements: ${item.elements.length > 0 ? item.elements.join(", ") : "None"}\nPseudo-elements: ${item.pseudoElements.length > 0 ? item.pseudoElements.join(", ") : "None"}\n--------------------------------`
      )
      .join("\n");

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "css-specificity-report.txt";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("css_specificity.toast.downloaded", "Report downloaded successfully!"));
  };

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      const { handleClear, handleCopy } = handlersRef.current;

      if (isEditable && e.key !== "Escape") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-8" data-testid="css-specificity-container">
      {/* Presets Grid */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">
          {t("css_specificity.presets", "Quick Presets:")}
        </span>
        {presets.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => loadPreset(preset.data)}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-xl transition-all"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: CSS Input Area */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="selectors-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t("css_specificity.input_label", "CSS Selectors (One per line)")}
            </label>
            <div className="flex items-center gap-2">
              <Kbd>Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!selectorsInput}
                className="text-xs font-bold px-3 py-1 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-xl transition-all disabled:opacity-50"
              >
                {t("common.clear", "Clear")}
              </button>
            </div>
          </div>

          <textarea
            id="selectors-input"
            ref={inputRef}
            value={selectorsInput}
            onChange={(e) => setSelectorsInput(e.target.value)}
            placeholder={t("css_specificity.placeholder", "Paste CSS selectors here (one per line)...")}
            className={`w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border ${
              error ? "border-rose-500 ring-rose-500/20" : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
            } rounded-3xl outline-none focus:ring-2 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm`}
          />

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Info character count */}
          <div className="flex justify-between text-[11px] text-slate-400 px-2 font-mono">
            <span>{t("css_specificity.input_chars", "Characters:")} {selectorsInput.length.toLocaleString()}</span>
            <span>{t("css_specificity.max_chars", "Max Limit:")} {MAX_LENGTH.toLocaleString()}</span>
          </div>

          {/* Sort Controls */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-[2rem] space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-500 px-1 border-b border-slate-200 dark:border-slate-800 pb-2">
              <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                {t("css_specificity.sort_title", "Cascade Sorting Options")}
              </h3>
            </div>
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSortOrder("cascade")}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                  sortOrder === "cascade"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {t("css_specificity.sort.cascade", "Cascade Priority")}
              </button>
              <button
                onClick={() => setSortOrder("none")}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                  sortOrder === "none"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {t("css_specificity.sort.asis", "As Entered")}
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Results & Detailed Score Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                {t("css_specificity.results_label", "Specificity Breakdown")}
              </label>
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-md">
                {parsedSelectors.length} {t("css_specificity.selectors_count", "selectors")}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={parsedSelectors.length === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50"
                title={t("common.download", "Download")}
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                onClick={handleCopy}
                disabled={parsedSelectors.length === 0}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? t("common.copied", "Copied") : t("common.copy", "Copy")}
                {!copied && <Kbd className="bg-indigo-500/20 text-indigo-100 border-indigo-500/30 ml-1.5">C</Kbd>}
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {parsedSelectors.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                <Palette className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-slate-400 italic">
                  {t("css_specificity.empty_state", "Enter selectors to calculate specificity...")}
                </p>
              </div>
            ) : (
              parsedSelectors.map((item, idx) => {
                const totalScore = item.score[0] * 100 + item.score[1] * 10 + item.score[2];
                const isHighest = idx === 0 && sortOrder === "cascade";

                return (
                  <div
                    key={idx}
                    className={`p-6 bg-white dark:bg-slate-900/40 border rounded-3xl shadow-sm transition-all space-y-4 ${
                      isHighest
                        ? "border-emerald-500/40 ring-1 ring-emerald-500/20 bg-emerald-500/[0.01]"
                        : "border-slate-200 dark:border-slate-800 hover:border-indigo-500/40"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div className="font-mono text-sm font-bold truncate text-slate-800 dark:text-slate-100 max-w-md">
                        {item.selector}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isHighest && (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded uppercase tracking-wider">
                            {t("css_specificity.highest", "Highest Priority")}
                          </span>
                        )}
                        <span className="font-mono text-xs font-black px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          ({item.score.join(", ")})
                        </span>
                      </div>
                    </div>

                    {/* Breakdown grids */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {t("css_specificity.ids_title", "IDs (A)")}
                        </div>
                        <div className="text-xl font-black font-mono text-indigo-500">
                          {item.score[0]}
                        </div>
                        {item.ids.length > 0 && (
                          <div className="text-[10px] font-mono text-slate-500 truncate" title={item.ids.join(", ")}>
                            {item.ids.join(", ")}
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {t("css_specificity.classes_title", "Classes / Attrs (B)")}
                        </div>
                        <div className="text-xl font-black font-mono text-indigo-500">
                          {item.score[1]}
                        </div>
                        {([...item.classes, ...item.attributes, ...item.pseudoClasses]).length > 0 && (
                          <div
                            className="text-[10px] font-mono text-slate-500 truncate"
                            title={([...item.classes, ...item.attributes, ...item.pseudoClasses]).join(", ")}
                          >
                            {([...item.classes, ...item.attributes, ...item.pseudoClasses]).join(", ")}
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {t("css_specificity.elements_title", "Elements (C)")}
                        </div>
                        <div className="text-xl font-black font-mono text-indigo-500">
                          {item.score[2]}
                        </div>
                        {([...item.elements, ...item.pseudoElements]).length > 0 && (
                          <div
                            className="text-[10px] font-mono text-slate-500 truncate"
                            title={([...item.elements, ...item.pseudoElements]).join(", ")}
                          >
                            {([...item.elements, ...item.pseudoElements]).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Info Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            {t("css_specificity.guide.about_title", "How Specificity Works")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              "css_specificity.guide.about_desc",
              "CSS specificity is a weight applied to a given CSS declaration, determined by the number of each selector type in the matching selector. If multiple declarations have equal specificity, the last declaration found in the CSS is applied."
            )}
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            {t("css_specificity.guide.triad_title", "The Specificity Triad")}
          </h4>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
            <li><strong>{t("css_specificity.guide.triad_id", "IDs (A):")}</strong> {t("css_specificity.guide.triad_id_desc", "e.g., #header. Counts 1-0-0.")}</li>
            <li><strong>{t("css_specificity.guide.triad_class", "Classes/Attrs/Pseudo-classes (B):")}</strong> {t("css_specificity.guide.triad_class_desc", "e.g., .btn, [type], :hover. Counts 0-1-0.")}</li>
            <li><strong>{t("css_specificity.guide.triad_elem", "Elements/Pseudo-elements (C):")}</strong> {t("css_specificity.guide.triad_elem_desc", "e.g., div, ::before. Counts 0-0-1.")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            {t("css_specificity.guide.exceptions_title", "Special Exceptions")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              "css_specificity.guide.exceptions_desc",
              "The universal selector (*), combinators (+, >, ~) and :where() have no effect on specificity. Special pseudo-classes (:not, :is, :has) have the specificity of their most specific argument."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
