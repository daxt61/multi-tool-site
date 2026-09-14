import React, { useState, useEffect, useCallback, useRef } from "react";
import { FileSpreadsheet, Copy, Check, Download, AlertCircle, Sparkles, Trash2, Settings, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { parse as parseToml } from "smol-toml";
import { Kbd } from "./ui/Kbd";

const MAX_LENGTH = 100000;
const MAX_ROWS = 1000;
const MAX_COLS = 100;

export function TOMLToCSV({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [tomlInput, setTomlInput] = useState(
    initialData?.tomlInput ||
      `# Server Fleet Configuration
[[servers]]
name = "web-prod-01"
ip = "192.168.1.10"
role = "frontend"
memory_gb = 16
active = true

[[servers]]
name = "web-prod-02"
ip = "192.168.1.11"
role = "frontend"
memory_gb = 16
active = true

[[servers]]
name = "db-primary"
ip = "192.168.1.50"
role = "database"
memory_gb = 64
active = true`
  );

  const [delimiter, setDelimiter] = useState<"," | ";" | "\t" | "|" | ":" | "custom">(initialData?.delimiter || ",");
  const [customDelimiter, setCustomDelimiter] = useState<string>(initialData?.customDelimiter || ",");
  const [quoteMode, setQuoteMode] = useState<"smart" | "always" | "strip">(initialData?.quoteMode || "smart");
  const [headerMode, setHeaderMode] = useState<"auto" | "firstRow" | "none">(initialData?.headerMode || "auto");
  const [trimCells, setTrimCells] = useState<boolean>(initialData?.trimCells !== false);
  const [skipEmptyRows, setSkipEmptyRows] = useState<boolean>(initialData?.skipEmptyRows !== false);

  const [csvOutput, setCsvOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ tomlInput, delimiter, customDelimiter, quoteMode, headerMode, trimCells, skipEmptyRows });
  }, [tomlInput, delimiter, customDelimiter, quoteMode, headerMode, trimCells, skipEmptyRows, onStateChange]);

  const activeDelimiter = delimiter === "custom" ? customDelimiter || "," : delimiter === "\t" ? "\t" : delimiter;

  const formatCSVCell = useCallback(
    (cellValue: any): string => {
      let val = cellValue === null || cellValue === undefined ? "" : String(cellValue);
      if (trimCells) {
        val = val.trim();
      }

      if (quoteMode === "strip") {
        return val.replace(/"/g, "");
      }

      const escaped = val.replace(/"/g, '""');
      const needsQuotes =
        quoteMode === "always" ||
        val.includes(activeDelimiter) ||
        val.includes('"') ||
        val.includes("\n") ||
        val.includes("\r");

      return needsQuotes ? `"${escaped}"` : val;
    },
    [trimCells, quoteMode, activeDelimiter]
  );

  const convertToml = useCallback(() => {
    if (!tomlInput.trim()) {
      setCsvOutput("");
      setError(null);
      return;
    }

    if (tomlInput.length > MAX_LENGTH) {
      setError(t("error.max_length", { max: MAX_LENGTH.toLocaleString() }));
      setCsvOutput("");
      return;
    }

    try {
      const parsed = parseToml(tomlInput);

      if (!parsed || typeof parsed !== "object") {
        setError(t("tomltocsv.error_invalid_structure", "TOML content must resolve to an object or table array."));
        setCsvOutput("");
        return;
      }

      // Extract array of records from TOML object
      let records: Record<string, any>[] = [];

      // Check if top-level has array of tables
      const keys = Object.keys(parsed);
      let foundArrayKey: string | null = null;

      for (const k of keys) {
        if (Array.isArray((parsed as any)[k]) && (parsed as any)[k].length > 0) {
          foundArrayKey = k;
          break;
        }
      }

      if (foundArrayKey) {
        records = (parsed as any)[foundArrayKey];
      } else if (keys.length > 0 && typeof (parsed as any)[keys[0]] === "object" && !Array.isArray((parsed as any)[keys[0]])) {
        // Map of tables (e.g. [server1], [server2]) -> transform to array with key as _id or table_name
        records = keys.map((key) => {
          const item = (parsed as any)[key];
          if (item && typeof item === "object" && !Array.isArray(item)) {
            return { _key: key, ...item };
          }
          return { key, value: item };
        });
      } else {
        // Single table dictionary -> key-value rows
        records = keys.map((key) => ({
          key,
          value: typeof (parsed as any)[key] === "object" ? JSON.stringify((parsed as any)[key]) : (parsed as any)[key],
        }));
      }

      if (!records || records.length === 0) {
        setError(t("tomltocsv.error_no_records", "No tabular records found in TOML document."));
        setCsvOutput("");
        return;
      }

      if (records.length > MAX_ROWS) {
        setError(t("tomltocsv.error_max_rows", { max: MAX_ROWS }));
        setCsvOutput("");
        return;
      }

      // Collect all unique header keys across records safely (prototype pollution guarded)
      const headerSet = new Set<string>();
      records.forEach((rec) => {
        if (rec && typeof rec === "object") {
          Object.keys(rec).forEach((k) => {
            if (
              Object.prototype.hasOwnProperty.call(rec, k) &&
              k !== "__proto__" &&
              k !== "constructor" &&
              k !== "prototype"
            ) {
              headerSet.add(k);
            }
          });
        }
      });

      const headers = Array.from(headerSet);

      if (headers.length === 0) {
        setError(t("tomltocsv.error_no_columns", "No valid keys found for CSV columns."));
        setCsvOutput("");
        return;
      }

      if (headers.length > MAX_COLS) {
        setError(t("tomltocsv.error_max_cols", { max: MAX_COLS }));
        setCsvOutput("");
        return;
      }

      const csvLines: string[] = [];

      if (headerMode !== "none") {
        csvLines.push(headers.map((h) => formatCSVCell(h)).join(activeDelimiter));
      }

      for (let i = 0; i < records.length; i++) {
        const rec = records[i] || Object.create(null);
        const rowCells: string[] = [];
        let isRowEmpty = true;

        for (let j = 0; j < headers.length; j++) {
          const colKey = headers[j];
          let val = Object.prototype.hasOwnProperty.call(rec, colKey) ? rec[colKey] : "";

          if (val !== null && typeof val === "object") {
            val = JSON.stringify(val);
          }

          if (val !== "" && val !== null && val !== undefined) {
            isRowEmpty = false;
          }

          rowCells.push(formatCSVCell(val));
        }

        if (skipEmptyRows && isRowEmpty) {
          continue;
        }

        csvLines.push(rowCells.join(activeDelimiter));
      }

      setCsvOutput(csvLines.join("\n"));
      setError(null);
    } catch (err: any) {
      setError(t("tomltocsv.error_invalid_toml", { msg: err.message || "" }));
      setCsvOutput("");
    }
  }, [tomlInput, activeDelimiter, quoteMode, headerMode, trimCells, skipEmptyRows, formatCSVCell, t]);

  useEffect(() => {
    convertToml();
  }, [convertToml]);

  const loadPreset = (preset: "fleet" | "users" | "catalog") => {
    let presetToml = "";
    if (preset === "fleet") {
      presetToml = `# Server Fleet Inventory
[[servers]]
hostname = "web-prod-01"
ip_address = "10.0.1.10"
region = "us-east-1"
cpu_cores = 8
memory_gb = 32
status = "online"

[[servers]]
hostname = "web-prod-02"
ip_address = "10.0.1.11"
region = "us-east-1"
cpu_cores = 8
memory_gb = 32
status = "online"

[[servers]]
hostname = "db-primary"
ip_address = "10.0.2.50"
region = "us-west-2"
cpu_cores = 32
memory_gb = 128
status = "online"`;
    } else if (preset === "users") {
      presetToml = `# User Directory
[[users]]
id = 101
username = "alice_v"
full_name = "Alice Vance"
role = "Admin"
department = "Engineering"
email = "alice@example.com"

[[users]]
id = 102
username = "bob_m"
full_name = "Bob Miller"
role = "Manager"
department = "Product"
email = "bob@example.com"

[[users]]
id = 103
username = "charlie_d"
full_name = "Charlie Davis"
role = "Developer"
department = "Engineering"
email = "charlie@example.com"`;
    } else if (preset === "catalog") {
      presetToml = `# Product Inventory Catalog
[[products]]
sku = "PROD-1001"
name = "Wireless Mechanical Keyboard"
category = "Electronics"
price = 129.99
in_stock = true

[[products]]
sku = "PROD-1002"
name = "Ergonomic Office Chair"
category = "Furniture"
price = 249.50
in_stock = false

[[products]]
sku = "PROD-1003"
name = "4K USB-C Monitor 27-inch"
category = "Electronics"
price = 399.00
in_stock = true`;
    }
    setTomlInput(presetToml);
    toast.success(t("tomltocsv.toast_preset_loaded", "TOML preset loaded successfully!"));
  };

  const handleCopy = useCallback(() => {
    if (!csvOutput) return;
    navigator.clipboard.writeText(csvOutput);
    setCopied(true);
    toast.success(t("tomltocsv.toast_copied", "CSV output copied to clipboard!"));
    setTimeout(() => setCopied(false), 2000);
  }, [csvOutput, t]);

  const handleClear = useCallback(() => {
    setTomlInput("");
    setCsvOutput("");
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.success(t("tomltocsv.toast_cleared", "Input cleared!"));
  }, [t]);

  const handleDownload = () => {
    if (!csvOutput) return;
    const ext = delimiter === "\t" ? "tsv" : "csv";
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `toml-export.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("common.download_success", "Download successful"));
  };

  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditable =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active?.getAttribute("contenteditable") === "true";

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === "c" || e.key === "C") && !e.ctrlKey && !e.metaKey && !isEditable) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Preset Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t("tomltocsv.presets_title", "Quick Presets:")}
          </span>
          <button
            onClick={() => loadPreset("fleet")}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {t("tomltocsv.preset_fleet", "Server Fleet TOML")}
          </button>
          <button
            onClick={() => loadPreset("users")}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {t("tomltocsv.preset_users", "User Directory TOML")}
          </button>
          <button
            onClick={() => loadPreset("catalog")}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {t("tomltocsv.preset_catalog", "E-Commerce Inventory TOML")}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> {t("common.clear", "Clear")}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>C</Kbd> {t("common.copy", "Copy")}
          </span>
        </div>
      </div>

      {/* Configuration Options */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Settings className="w-4 h-4 text-indigo-500" />
          {t("common.options", "Configuration Options")}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Delimiter Selection */}
          <div className="space-y-1.5">
            <label htmlFor="toml-csv-delimiter" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t("tomltocsv.delimiter_label", "Output Delimiter")}
            </label>
            <select
              id="toml-csv-delimiter"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value=",">{t("tomltocsv.delim_comma", "Comma ( , )")}</option>
              <option value=";">{t("tomltocsv.delim_semicolon", "Semicolon ( ; )")}</option>
              <option value={"\t"}>{t("tomltocsv.delim_tab", "Tab ( TSV )")}</option>
              <option value="|">{t("tomltocsv.delim_pipe", "Pipe ( | )")}</option>
              <option value=":">{t("tomltocsv.delim_colon", "Colon ( : )")}</option>
              <option value="custom">{t("tomltocsv.delim_custom", "Custom Character")}</option>
            </select>
          </div>

          {delimiter === "custom" && (
            <div className="space-y-1.5">
              <label htmlFor="toml-csv-custom-delim" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                {t("tomltocsv.custom_delim_label", "Custom Delimiter")}
              </label>
              <input
                id="toml-csv-custom-delim"
                type="text"
                maxLength={5}
                value={customDelimiter}
                onChange={(e) => setCustomDelimiter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          )}

          {/* Quote Mode Selection */}
          <div className="space-y-1.5">
            <label htmlFor="toml-csv-quote-mode" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t("tomltocsv.quote_mode", "Quote Handling")}
            </label>
            <select
              id="toml-csv-quote-mode"
              value={quoteMode}
              onChange={(e) => setQuoteMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="smart">{t("tomltocsv.quote_smart", "Smart (When needed)")}</option>
              <option value="always">{t("tomltocsv.quote_always", "Always Quote Every Cell")}</option>
              <option value="strip">{t("tomltocsv.quote_strip", "Strip All Quotes")}</option>
            </select>
          </div>

          {/* Header Mode Selection */}
          <div className="space-y-1.5">
            <label htmlFor="toml-csv-header-mode" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t("tomltocsv.header_mode", "Header Row")}
            </label>
            <select
              id="toml-csv-header-mode"
              value={headerMode}
              onChange={(e) => setHeaderMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="auto">{t("tomltocsv.header_auto", "Include Header Row")}</option>
              <option value="none">{t("tomltocsv.header_none", "Omit Header Row")}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={trimCells}
              onChange={(e) => setTrimCells(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t("tomltocsv.trim_cells", "Trim cell whitespace")}
          </label>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={skipEmptyRows}
              onChange={(e) => setSkipEmptyRows(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t("tomltocsv.skip_empty_rows", "Skip completely empty rows")}
          </label>
        </div>
      </div>

      {/* Main Input / Output Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TOML Source Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="toml-csv-input" className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              {t("tomltocsv.input_label", "TOML Input Source")}
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("common.clear", "Clear")}
            </button>
          </div>

          <div className="relative">
            <textarea
              id="toml-csv-input"
              ref={inputRef}
              value={tomlInput}
              onChange={(e) => setTomlInput(e.target.value)}
              placeholder="Paste your TOML markup here..."
              rows={14}
              className="w-full p-4 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y placeholder:text-slate-400"
            />
            <div className="absolute bottom-3 right-3 text-[10px] font-medium text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
              {tomlInput.length} / {MAX_LENGTH}
            </div>
          </div>
        </div>

        {/* CSV Output Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="toml-csv-output" className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              {t("tomltocsv.output_label", "CSV / TSV Dataset Output")}
            </label>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!csvOutput}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                {t("common.download", "Download")}
              </button>
              <button
                onClick={handleCopy}
                disabled={!csvOutput}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm ${
                  copied ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t("common.copied", "Copied!") : t("common.copy", "Copy CSV")}
              </button>
            </div>
          </div>

          <textarea
            id="toml-csv-output"
            readOnly
            value={csvOutput}
            placeholder={t("tomltocsv.placeholder_output", "Generated CSV / TSV dataset will appear here...")}
            rows={14}
            className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
          <Info className="w-4 h-4 text-indigo-500" />
          {t("tomltocsv.about_title", "About TOML to CSV / TSV Converter")}
        </div>
        <p className="leading-relaxed">
          {t(
            "tomltocsv.about_text",
            "Convert TOML documents and array of tables directly into clean CSV, TSV, or character-delimited datasets. Supports customizable delimiters, quote rules, header toggles, and cell whitespace trimming. All processing is executed client-side for complete privacy."
          )}
        </p>
      </div>
    </div>
  );
}

export default TOMLToCSV;
