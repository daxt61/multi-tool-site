import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Braces,
  Copy,
  Check,
  RotateCcw,
  Download,
  Search,
  Settings2,
  SlidersHorizontal,
  Info,
  AlertCircle,
  FileCode,
  LayoutGrid,
  Filter
} from "lucide-react";
import { Kbd } from "./ui/Kbd";

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

type ExtractionMode = "paths" | "keys" | "values" | "strings" | "numbers" | "booleans";
type OutputFormat = "list" | "json" | "csv";
type SortOrder = "none" | "asc" | "desc";

export function JSONDataExtractor({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // States
  const [inputJson, setInputJson] = useState(initialData?.inputJson || "");
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>(initialData?.extractionMode || "paths");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(initialData?.outputFormat || "list");
  const [listSeparator, setListSeparator] = useState(initialData?.listSeparator || "\n");
  const [customSeparator, setCustomSeparator] = useState(initialData?.customSeparator || "");
  const [prefix, setPrefix] = useState(initialData?.prefix || "");
  const [suffix, setSuffix] = useState(initialData?.suffix || "");
  const [deduplicate, setDeduplicate] = useState<boolean>(initialData?.deduplicate ?? true);
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(initialData?.trimWhitespace ?? true);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialData?.sortOrder || "none");
  const [filterQuery, setFilterQuery] = useState(initialData?.filterQuery || "");
  const [filterCaseSensitive, setFilterCaseSensitive] = useState<boolean>(initialData?.filterCaseSensitive ?? false);
  const [filterUseRegex, setFilterUseRegex] = useState<boolean>(initialData?.filterUseRegex ?? false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger State change for URL sharing
  useEffect(() => {
    onStateChange?.({
      inputJson,
      extractionMode,
      outputFormat,
      listSeparator,
      customSeparator,
      prefix,
      suffix,
      deduplicate,
      trimWhitespace,
      sortOrder,
      filterQuery,
      filterCaseSensitive,
      filterUseRegex
    });
  }, [
    inputJson,
    extractionMode,
    outputFormat,
    listSeparator,
    customSeparator,
    prefix,
    suffix,
    deduplicate,
    trimWhitespace,
    sortOrder,
    filterQuery,
    filterCaseSensitive,
    filterUseRegex,
    onStateChange
  ]);

  // Clickable presets
  const presets = useMemo(() => [
    {
      name: t("jsonextractor.preset.user_directory", "User Directory"),
      data: JSON.stringify(
        {
          users: [
            {
              id: 1,
              name: "Leanne Graham",
              username: "Bret",
              email: "Sincere@april.biz",
              address: {
                street: "Kulas Light",
                suite: "Apt. 556",
                city: "Gwenborough",
                zipcode: "92998-3874",
                geo: { lat: "-37.3159", lng: "81.1496" }
              },
              phone: "1-770-736-8031 x56442",
              website: "hildegard.org",
              company: {
                name: "Romaguera-Crona",
                catchPhrase: "Multi-layered client-server neural-net",
                bs: "harness real-time e-markets"
              },
              active: true
            },
            {
              id: 2,
              name: "Ervin Howell",
              username: "Antonette",
              email: "Shanna@melissa.tv",
              address: {
                street: "Victor Plains",
                suite: "Suite 879",
                city: "Wisokyburgh",
                zipcode: "90566-7771",
                geo: { lat: "-43.9509", lng: "-34.4618" }
              },
              phone: "010-692-6593 x09125",
              website: "anastasia.net",
              company: {
                name: "Deckow-Crist",
                catchPhrase: "Proactive didactic contingency",
                bs: "synergize scalable supply-chains"
              },
              active: false
            }
          ]
        },
        null,
        2
      )
    },
    {
      name: t("jsonextractor.preset.app_config", "App Configuration"),
      data: JSON.stringify(
        {
          appName: "TaskMaster Pro",
          version: "2.4.12",
          settings: {
            theme: "dark",
            notifications: {
              email: true,
              push: false,
              sms: false,
              frequency: "daily"
            },
            integrations: ["slack", "github", "jira"],
            limits: {
              maxUsers: 50,
              storageGb: 100,
              apiCallsPerMinute: 1000
            }
          },
          featuresEnabled: {
            billing: true,
            analytics: true,
            betaAccess: false
          }
        },
        null,
        2
      )
    },
    {
      name: t("jsonextractor.preset.ecommerce_receipt", "E-Commerce Receipt"),
      data: JSON.stringify(
        {
          orderId: "ORD-982314-X",
          customer: {
            customerId: "CUST-412",
            name: "Alice Johnson",
            membership: "premium"
          },
          items: [
            { id: "item-1", name: "Wireless Mechanical Keyboard", quantity: 1, price: 129.99 },
            { id: "item-2", name: "Ergonomic Optical Mouse", quantity: 1, price: 59.50 },
            { id: "item-3", name: "USB-C Braided Cable 2m", quantity: 2, price: 15.00 }
          ],
          summary: {
            subtotal: 219.49,
            tax: 17.56,
            shipping: 0.0,
            discount: 10.0,
            total: 227.05
          },
          paid: true
        },
        null,
        2
      )
    }
  ], [t]);

  const loadPreset = (jsonData: string) => {
    setInputJson(jsonData);
    setError(null);
    toast.success(t("jsonextractor.toast.preset_loaded", "Preset loaded successfully!"));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClear = useCallback(() => {
    setInputJson("");
    setError(null);
    toast.success(t("jsonextractor.toast.cleared", "Cleared all inputs!"));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [t]);

  // Safer recursive traversal routine to mitigate DoS and Prototype Pollution
  const performExtraction = useCallback(() => {
    if (!inputJson.trim()) return [];
    if (inputJson.length > MAX_LENGTH) {
      setError(t("error.max_length", { max: MAX_LENGTH.toLocaleString() }));
      return [];
    }

    let parsed: any;
    try {
      parsed = JSON.parse(inputJson);
      setError(null);
    } catch (e: any) {
      setError(t("jsonextractor.error.invalid_json", "Invalid JSON format: ") + e.message);
      return [];
    }

    const results: string[] = [];

    const traverse = (node: any, currentPath: string, depth: number) => {
      if (depth > MAX_DEPTH) return;
      if (node === null || node === undefined) return;

      const nodeType = typeof node;

      if (nodeType !== "object") {
        const valStr = String(node);
        // Basic match checks
        if (extractionMode === "values") {
          results.push(valStr);
        } else if (extractionMode === "strings" && nodeType === "string") {
          results.push(valStr);
        } else if (extractionMode === "numbers" && nodeType === "number") {
          results.push(valStr);
        } else if (extractionMode === "booleans" && nodeType === "boolean") {
          results.push(valStr);
        }
        return;
      }

      // Arrays and Objects
      const isArr = Array.isArray(node);

      for (const key in node) {
        // Prototype Pollution Protection
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          continue;
        }

        if (Object.prototype.hasOwnProperty.call(node, key)) {
          const childPath = currentPath ? `${currentPath}.${key}` : key;
          const childValue = node[key];

          // Key extraction
          if (extractionMode === "keys") {
            results.push(key);
          } else if (extractionMode === "paths") {
            results.push(childPath);
          }

          // Recurse
          traverse(childValue, childPath, depth + 1);
        }
      }
    };

    traverse(parsed, "", 0);
    return results;
  }, [inputJson, extractionMode, t]);

  // Apply filters, unique rules, whitespace adjustments, formatting and prefix/suffix
  const processedOutput = useMemo(() => {
    let raw = performExtraction();

    // Whitespace trimming
    if (trimWhitespace) {
      raw = raw.map(item => item.trim());
    }

    // Filter Query
    if (filterQuery.trim()) {
      const query = filterCaseSensitive ? filterQuery : filterQuery.toLowerCase();
      if (filterUseRegex) {
        try {
          const regex = new RegExp(filterQuery, filterCaseSensitive ? "" : "i");
          raw = raw.filter(item => regex.test(item));
        } catch (e) {
          // Fallback gracefully on bad regex syntax
        }
      } else {
        raw = raw.filter(item => {
          const target = filterCaseSensitive ? item : item.toLowerCase();
          return target.includes(query);
        });
      }
    }

    // Deduplication
    if (deduplicate) {
      raw = Array.from(new Set(raw));
    }

    // Sort order
    if (sortOrder === "asc") {
      raw.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    } else if (sortOrder === "desc") {
      raw.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" }));
    }

    // Apply custom Prefix and Suffix
    if (prefix || suffix) {
      raw = raw.map(item => `${prefix}${item}${suffix}`);
    }

    // Output formatting
    if (outputFormat === "json") {
      return JSON.stringify(raw, null, 2);
    } else if (outputFormat === "csv") {
      return raw.map(item => {
        // Simple escaping for CSV: wrap in double quotes if commas or quotes present
        if (item.includes(",") || item.includes('"') || item.includes("\n")) {
          return `"${item.replace(/"/g, '""')}"`;
        }
        return item;
      }).join(",");
    } else {
      // Plain list
      const sep = listSeparator === "custom" ? customSeparator : listSeparator;
      // Map basic escaped character keys
      const actualSeparator = sep
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r");
      return raw.join(actualSeparator);
    }
  }, [
    performExtraction,
    trimWhitespace,
    filterQuery,
    filterCaseSensitive,
    filterUseRegex,
    deduplicate,
    sortOrder,
    prefix,
    suffix,
    outputFormat,
    listSeparator,
    customSeparator
  ]);

  const itemCount = useMemo(() => {
    if (!processedOutput) return 0;
    if (outputFormat === "json") {
      try {
        const parsed = JSON.parse(processedOutput);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    } else if (outputFormat === "csv") {
      return processedOutput ? processedOutput.split(",").length : 0;
    } else {
      const sep = listSeparator === "custom" ? customSeparator : listSeparator;
      const actualSeparator = sep
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r");
      return processedOutput ? processedOutput.split(actualSeparator).length : 0;
    }
  }, [processedOutput, outputFormat, listSeparator, customSeparator]);

  const handleCopy = useCallback(() => {
    if (!processedOutput) return;
    navigator.clipboard.writeText(processedOutput);
    setCopied(true);
    toast.success(t("jsonextractor.toast.copied", "Copied extracted items to clipboard!"));
    setTimeout(() => setCopied(false), 2000);
  }, [processedOutput, t]);

  const handleDownload = () => {
    if (!processedOutput) return;
    const extension = outputFormat === "json" ? "json" : outputFormat === "csv" ? "csv" : "txt";
    const blob = new Blob([processedOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `json-extracted-data.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("jsonextractor.toast.downloaded", "File downloaded successfully!"));
  };

  // Keyboard shortcut handlers ref safeguard
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
    <div className="space-y-8" data-testid="json-data-extractor-container">
      {/* Presets Grid */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">
          {t("jsonextractor.presets", "Quick Presets:")}
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
        {/* Left column: JSON Input Area */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t("jsonextractor.input_label", "Raw JSON Input")}
            </label>
            <div className="flex items-center gap-2">
              <Kbd className="text-xs">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!inputJson}
                className="text-xs font-bold px-3 py-1 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-xl transition-all disabled:opacity-50"
              >
                {t("common.clear", "Clear")}
              </button>
            </div>
          </div>

          <textarea
            id="json-input"
            ref={inputRef}
            value={inputJson}
            onChange={(e) => {
              setInputJson(e.target.value);
              setError(null);
            }}
            placeholder={t("jsonextractor.placeholder", "Paste your JSON array or object here...")}
            className={`w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border ${
              error ? "border-rose-500 ring-rose-500/20" : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
            } rounded-3xl outline-none focus:ring-2 transition-all font-mono text-xs leading-relaxed dark:text-slate-300 resize-none`}
          />

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Info character count */}
          <div className="flex justify-between text-[11px] text-slate-400 px-2 font-mono">
            <span>{t("jsonextractor.input_chars", "Characters:")} {inputJson.length.toLocaleString()}</span>
            <span>{t("jsonextractor.max_chars", "Max Limit:")} {MAX_LENGTH.toLocaleString()}</span>
          </div>
        </div>

        {/* Right column: Extraction & Configuration Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-6 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-500 px-1 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Settings2 className="w-4 h-4" aria-hidden="true" />
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">
                {t("jsonextractor.options_title", "Extraction & Filter Configuration")}
              </h3>
            </div>

            {/* Config options grid */}
            <div className="space-y-4">
              {/* Extraction Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase block px-1">
                  {t("jsonextractor.extract_mode", "Extraction Mode")}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(["paths", "keys", "values", "strings", "numbers", "booleans"] as ExtractionMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setExtractionMode(mode)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                        extractionMode === mode
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
                          : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50"
                      }`}
                    >
                      {t(`jsonextractor.mode.${mode}`, mode)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Format */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase block px-1">
                  {t("jsonextractor.output_format", "Output Format")}
                </label>
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  {(["list", "json", "csv"] as OutputFormat[]).map((format) => (
                    <button
                      key={format}
                      onClick={() => setOutputFormat(format)}
                      className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                        outputFormat === format
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      }`}
                    >
                      {t(`jsonextractor.format.${format}`, format.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional delimiter/separator when Output Format is plain List */}
              {outputFormat === "list" && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="space-y-2">
                    <label htmlFor="list-separator-select" className="text-xs font-bold text-slate-400 uppercase block px-1">
                      {t("jsonextractor.separator", "Separator")}
                    </label>
                    <select
                      id="list-separator-select"
                      value={listSeparator}
                      onChange={(e) => setListSeparator(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="\n">{t("jsonextractor.separator_newline", "New Line (\\n)")}</option>
                      <option value=", ">{t("jsonextractor.separator_comma", "Comma (,)")}</option>
                      <option value="; ">{t("jsonextractor.separator_semicolon", "Semicolon (;)")}</option>
                      <option value=" ">{t("jsonextractor.separator_space", "Space")}</option>
                      <option value="\t">{t("jsonextractor.separator_tab", "Tab (\\t)")}</option>
                      <option value="custom">{t("jsonextractor.separator_custom", "Custom Character")}</option>
                    </select>
                  </div>

                  {listSeparator === "custom" && (
                    <div className="space-y-2 animate-in zoom-in-95 duration-200">
                      <label htmlFor="custom-separator-input" className="text-xs font-bold text-slate-400 uppercase block px-1">
                        {t("jsonextractor.custom_char", "Custom Sep")}
                      </label>
                      <input
                        id="custom-separator-input"
                        type="text"
                        value={customSeparator}
                        onChange={(e) => setCustomSeparator(e.target.value)}
                        placeholder="e.g. | or --"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Optional Prefix & Suffix */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="prefix-input" className="text-xs font-bold text-slate-400 uppercase block px-1">
                    {t("jsonextractor.prefix", "Prefix")}
                  </label>
                  <input
                    id="prefix-input"
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder='e.g. "id: "'
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="suffix-input" className="text-xs font-bold text-slate-400 uppercase block px-1">
                    {t("jsonextractor.suffix", "Suffix")}
                  </label>
                  <input
                    id="suffix-input"
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="e.g. ;"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Filters / Match Substring */}
              <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                <label htmlFor="filter-query-input" className="text-xs font-bold text-slate-400 uppercase block px-1 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-500" />
                  {t("jsonextractor.filter_label", "Advanced Filter Items")}
                </label>
                <div className="relative">
                  <input
                    id="filter-query-input"
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder={t("jsonextractor.filter_placeholder", "Substring or regex pattern...")}
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setFilterCaseSensitive(!filterCaseSensitive)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      filterCaseSensitive
                        ? "bg-indigo-500 border-indigo-500 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50"
                    }`}
                  >
                    {t("jsonextractor.case_sensitive", "Case Sensitive")}
                  </button>
                  <button
                    onClick={() => setFilterUseRegex(!filterUseRegex)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      filterUseRegex
                        ? "bg-indigo-500 border-indigo-500 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50"
                    }`}
                  >
                    {t("jsonextractor.use_regex", "Use Regex")}
                  </button>
                </div>
              </div>

              {/* Checkboxes & Sorting */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase block px-1">
                    {t("jsonextractor.toggles", "List Modifiers")}
                  </label>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={deduplicate}
                        onChange={(e) => setDeduplicate(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{t("jsonextractor.deduplicate", "Deduplicate Unique values")}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={trimWhitespace}
                        onChange={(e) => setTrimWhitespace(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{t("jsonextractor.trim", "Trim whitespace")}</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="sort-order-select" className="text-xs font-bold text-slate-400 uppercase block px-1">
                    {t("jsonextractor.sort_order", "Sorting Order")}
                  </label>
                  <select
                    id="sort-order-select"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="none">{t("jsonextractor.sort.none", "Default (Traversed)")}</option>
                    <option value="asc">{t("jsonextractor.sort.asc", "Alphabetical (A-Z)")}</option>
                    <option value="desc">{t("jsonextractor.sort.desc", "Reverse (Z-A)")}</option>
                  </select>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Output results Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-3">
            <label htmlFor="extracted-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              {t("jsonextractor.output_label", "Extracted Results")}
            </label>
            <span
              className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-md"
              aria-live="polite"
              aria-atomic="true"
            >
              {itemCount} {t("jsonextractor.items_count", "items")}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={!processedOutput}
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50"
              title={t("common.download", "Download")}
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={handleCopy}
              disabled={!processedOutput}
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

        <textarea
          id="extracted-output"
          value={processedOutput}
          readOnly
          placeholder={t("jsonextractor.output_placeholder", "Extracted content will appear here...")}
          className="w-full h-80 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl outline-none font-mono text-xs leading-relaxed resize-none"
        />
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            {t("jsonextractor.guide.how_title", "What is JSON Data Extractor?")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("jsonextractor.guide.how_desc", "This tool helps you recursively traverse arbitrary JSON structures to pull out exactly what you need: flat nested paths, custom casing keys, string elements, numeric metrics, or raw booleans.")}
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            {t("jsonextractor.guide.features_title", "Format & Customize")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("jsonextractor.guide.features_desc", "Format extracted elements as plain delimited lists, valid JSON arrays, or compliant CSV formats. You can prefix/suffix each element, perform quick sorting, or remove duplicate duplicates in real-time.")}
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            {t("jsonextractor.guide.security_title", "Secure & Fast")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("jsonextractor.guide.security_desc", "Features secure execution on the client-side with full Prototype Pollution and Circular Referencing protections, a maximum traversal depth of 20 levels, and a 100,000 character DoS validation limit.")}
          </p>
        </div>
      </div>
    </div>
  );
}
