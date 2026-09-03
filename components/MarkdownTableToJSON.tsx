import React, { useState, useEffect, useCallback, useRef } from "react";
import { Table, Copy, Check, Download, AlertCircle, Sparkles, Trash2, FileJson, Settings, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const MAX_LENGTH = 100000;

export function MarkdownTableToJSON({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [markdownInput, setMarkdownInput] = useState(
    initialData?.markdownInput ||
      `| SKU | Product Name | Category | Price | In Stock |
| :--- | :--- | :--- | :---: | :---: |
| ELE-101 | Wireless Mouse | Electronics | 29.99 | true |
| ELE-102 | Mechanical Keyboard | Electronics | 89.50 | true |
| FUR-201 | Ergonomic Desk Chair | Furniture | 199.00 | false |
| KIT-301 | Stainless Water Bottle | Kitchen | 15.00 | true |`
  );

  const [outputMode, setOutputMode] = useState<"objects" | "2d" | "map">(initialData?.outputMode || "objects");
  const [keyFormat, setKeyFormat] = useState<"original" | "camel" | "snake" | "pascal" | "constant">(initialData?.keyFormat || "camel");
  const [parseTypes, setParseTypes] = useState<boolean>(initialData?.parseTypes !== false);
  const [emptyCells, setEmptyCells] = useState<"empty" | "null" | "skip">(initialData?.emptyCells || "empty");
  const [trimCells, setTrimCells] = useState<boolean>(initialData?.trimCells !== false);

  const [jsonOutput, setJsonOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ markdownInput, outputMode, keyFormat, parseTypes, emptyCells, trimCells });
  }, [markdownInput, outputMode, keyFormat, parseTypes, emptyCells, trimCells, onStateChange]);

  const formatKey = useCallback(
    (str: string): string => {
      let clean = str.trim();
      if (!clean) return "";

      clean = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      switch (keyFormat) {
        case "camel":
          return clean
            .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
            .replace(/^[A-Z]/, (chr) => chr.toLowerCase())
            .replace(/[^a-zA-Z0-9]/g, "");
        case "snake":
          return clean
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
        case "pascal":
          return clean
            .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
            .replace(/^[a-z]/, (chr) => chr.toUpperCase())
            .replace(/[^a-zA-Z0-9]/g, "");
        case "constant":
          return clean
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
        case "original":
        default:
          return clean;
      }
    },
    [keyFormat]
  );

  const parseCellValue = useCallback(
    (val: string): any => {
      const trimmed = trimCells ? val.trim() : val;
      if (!trimmed) {
        if (emptyCells === "null") return null;
        return "";
      }

      if (parseTypes) {
        if (trimmed.toLowerCase() === "true") return true;
        if (trimmed.toLowerCase() === "false") return false;
        if (trimmed.toLowerCase() === "null") return null;

        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          const num = Number(trimmed);
          if (!isNaN(num)) return num;
        }
      }

      return trimmed;
    },
    [parseTypes, emptyCells, trimCells]
  );

  // Helper to split a Markdown table row into cells, respecting escaped pipes
  const parseMarkdownRow = (rowStr: string): string[] => {
    let clean = rowStr.trim();
    if (clean.startsWith("|")) clean = clean.slice(1);
    if (clean.endsWith("|")) clean = clean.slice(0, -1);

    const cells: string[] = [];
    let currentCell = "";
    let isEscaped = false;

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (char === "\\" && !isEscaped) {
        isEscaped = true;
        continue;
      }

      if (char === "|" && !isEscaped) {
        cells.push(currentCell);
        currentCell = "";
      } else {
        currentCell += char;
        isEscaped = false;
      }
    }
    cells.push(currentCell);

    return cells.map((c) => (trimCells ? c.trim() : c));
  };

  const isSeparatorRow = (rowStr: string): boolean => {
    const clean = rowStr.trim().replace(/^\||\|$/g, "");
    const parts = clean.split("|");
    return parts.every((p) => /^\s*:?-+:?\s*$/.test(p));
  };

  const convertTable = useCallback(() => {
    if (!markdownInput.trim()) {
      setJsonOutput("");
      setError(null);
      return;
    }

    if (markdownInput.length > MAX_LENGTH) {
      setError(t("error.max_length", { max: MAX_LENGTH.toLocaleString() }));
      setJsonOutput("");
      return;
    }

    try {
      const lines = markdownInput
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter((l: string) => l.startsWith("|") || l.endsWith("|"));

      if (lines.length < 2) {
        setError(t("markdowntabletojson.error_no_table", "No valid Markdown table found (requires header and data rows)."));
        setJsonOutput("");
        return;
      }

      const rows: string[][] = [];
      let separatorFound = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isSeparatorRow(line)) {
          separatorFound = true;
          continue;
        }
        rows.push(parseMarkdownRow(line));
      }

      if (rows.length === 0) {
        setError(t("markdowntabletojson.error_no_rows", "No data rows found in Markdown table."));
        setJsonOutput("");
        return;
      }

      const rawHeaders = rows[0];
      const headers = rawHeaders.map((h, idx) => {
        const formatted = formatKey(h);
        return formatted || `column${idx + 1}`;
      });

      const dataRows = rows.slice(1);
      let parsedOutput: any = null;

      if (outputMode === "objects") {
        const list: any[] = [];
        dataRows.forEach((row) => {
          const obj = Object.create(null);
          headers.forEach((header, cIdx) => {
            const rawVal = row[cIdx] !== undefined ? row[cIdx] : "";
            const parsedVal = parseCellValue(rawVal);

            if (emptyCells === "skip" && (parsedVal === "" || parsedVal === null)) {
              return;
            }

            const safeKey = header.trim();
            if (safeKey !== "__proto__" && safeKey !== "constructor" && safeKey !== "prototype") {
              obj[safeKey] = parsedVal;
            }
          });
          list.push(obj);
        });
        parsedOutput = list;
      } else if (outputMode === "2d") {
        const tableArray: any[][] = [];
        tableArray.push(headers);
        dataRows.forEach((row) => {
          const formattedRow = row.map((cell) => parseCellValue(cell));
          tableArray.push(formattedRow);
        });
        parsedOutput = tableArray;
      } else if (outputMode === "map") {
        const mapObj = Object.create(null);
        dataRows.forEach((row) => {
          const keyCell = row[0] !== undefined ? String(row[0]).trim() : "";
          if (!keyCell) return;

          if (keyCell === "__proto__" || keyCell === "constructor" || keyCell === "prototype") {
            return;
          }

          const properties = Object.create(null);
          headers.slice(1).forEach((header, cIdx) => {
            const rawVal = row[cIdx + 1] !== undefined ? row[cIdx + 1] : "";
            const parsedVal = parseCellValue(rawVal);

            if (emptyCells === "skip" && (parsedVal === "" || parsedVal === null)) {
              return;
            }

            const safeHeader = header.trim();
            if (safeHeader !== "__proto__" && safeHeader !== "constructor" && safeHeader !== "prototype") {
              properties[safeHeader] = parsedVal;
            }
          });

          mapObj[keyCell] = properties;
        });
        parsedOutput = mapObj;
      }

      setJsonOutput(JSON.stringify(parsedOutput, null, 2));
      setError(null);
    } catch (err: any) {
      setError(t("markdowntabletojson.error_invalid", { msg: err.message || "" }));
      setJsonOutput("");
    }
  }, [markdownInput, outputMode, formatKey, parseCellValue, emptyCells, t]);

  useEffect(() => {
    convertTable();
  }, [convertTable]);

  const loadPreset = (preset: "catalog" | "users" | "status") => {
    let presetMd = "";
    if (preset === "catalog") {
      presetMd = `| SKU | Product Name | Category | Price | Stock |
| :--- | :--- | :--- | :---: | :---: |
| ELE-101 | Wireless Mouse | Electronics | 29.99 | 150 |
| ELE-102 | Mechanical Keyboard | Electronics | 89.50 | 45 |
| FUR-201 | Ergonomic Desk Chair | Furniture | 199.00 | 12 |
| KIT-301 | Stainless Water Bottle | Kitchen | 15.00 | 80 |`;
    } else if (preset === "users") {
      presetMd = `| User ID | Full Name | Role | Department | Active |
| :--- | :--- | :--- | :--- | :---: |
| USR-001 | Alice Vance | Lead Engineer | Engineering | true |
| USR-002 | Bob Miller | Product Manager | Product | true |
| USR-003 | Charlie Smith | UX Designer | Design | false |`;
    } else if (preset === "status") {
      presetMd = `| Service | Host | Environment | Status | Latency MS |
| :--- | :--- | :--- | :--- | :---: |
| Auth API | auth-prod-1 | Production | Operational | 24 |
| Payment Gateway | pay-prod-2 | Production | Operational | 42 |
| Search Worker | srch-prod-4 | Production | Operational | 12 |`;
    }
    setMarkdownInput(presetMd);
    toast.success(t("markdowntabletojson.toast_preset_loaded", "Preset loaded successfully!"));
  };

  const handleCopy = useCallback(() => {
    if (!jsonOutput) return;
    navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    toast.success(t("common.copied", "Copied to clipboard!"));
    setTimeout(() => setCopied(false), 2000);
  }, [jsonOutput, t]);

  const handleClear = useCallback(() => {
    setMarkdownInput("");
    setJsonOutput("");
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.success(t("common.clear", "Cleared!"));
  }, [t]);

  const handleDownload = () => {
    if (!jsonOutput) return;
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "table.json";
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
            {t("markdowntabletojson.presets_title", "Quick Presets:")}
          </span>
          <button
            onClick={() => loadPreset("catalog")}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {t("markdowntabletojson.preset_catalog", "Product Catalog")}
          </button>
          <button
            onClick={() => loadPreset("users")}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {t("markdowntabletojson.preset_users", "User Directory")}
          </button>
          <button
            onClick={() => loadPreset("status")}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {t("markdowntabletojson.preset_status", "System Status")}
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
          {/* Output Mode Selection */}
          <div className="space-y-1.5">
            <label htmlFor="md-json-output-mode" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t("markdowntabletojson.output_mode", "Output Structure Mode")}
            </label>
            <select
              id="md-json-output-mode"
              value={outputMode}
              onChange={(e) => setOutputMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="objects">{t("markdowntabletojson.mode_objects", "Array of Objects [{}, {}]")}</option>
              <option value="2d">{t("markdowntabletojson.mode_2d", "2D Value Array [[], []]")}</option>
              <option value="map">{t("markdowntabletojson.mode_map", "Key-Value Map {key: {}}")}</option>
            </select>
          </div>

          {/* Key Casing Options */}
          {outputMode !== "2d" && (
            <div className="space-y-1.5">
              <label htmlFor="md-json-key-format" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                {t("markdowntabletojson.key_formatting", "Header Key Formatting")}
              </label>
              <select
                id="md-json-key-format"
                value={keyFormat}
                onChange={(e) => setKeyFormat(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="original">{t("markdowntabletojson.key_original", "Keep Original Text")}</option>
                <option value="camel">camelCase</option>
                <option value="snake">snake_case</option>
                <option value="pascal">PascalCase</option>
                <option value="constant">CONSTANT_CASE</option>
              </select>
            </div>
          )}

          {/* Empty Cells Options */}
          <div className="space-y-1.5">
            <label htmlFor="md-json-empty-cells" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t("markdowntabletojson.empty_cells", "Empty Cells Handling")}
            </label>
            <select
              id="md-json-empty-cells"
              value={emptyCells}
              onChange={(e) => setEmptyCells(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="empty">{t("markdowntabletojson.empty_keep", "Keep as Empty Strings (\"\")")}</option>
              <option value="null">{t("markdowntabletojson.empty_nullify", "Nullify (null)")}</option>
              <option value="skip">{t("markdowntabletojson.empty_skip", "Skip/Ignore Property")}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={parseTypes}
              onChange={(e) => setParseTypes(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t("markdowntabletojson.parse_types", "Parse Numbers, Booleans & Nulls")}
          </label>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={trimCells}
              onChange={(e) => setTrimCells(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t("markdowntabletojson.trim_cells", "Trim cell whitespace")}
          </label>
        </div>
      </div>

      {/* Main Input / Output Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Markdown Input Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="md-json-input" className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-500" />
              {t("markdowntabletojson.input_label", "Markdown Table Markup Input")}
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
              id="md-json-input"
              ref={inputRef}
              value={markdownInput}
              onChange={(e) => setMarkdownInput(e.target.value)}
              placeholder="Paste your Markdown table markup here..."
              rows={14}
              className="w-full p-4 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y placeholder:text-slate-400"
            />
            <div className="absolute bottom-3 right-3 text-[10px] font-medium text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
              {markdownInput.length} / {MAX_LENGTH}
            </div>
          </div>
        </div>

        {/* JSON Output Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="md-json-output" className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileJson className="w-4 h-4 text-emerald-500" />
              {t("markdowntabletojson.output_label", "Parsed JSON Output")}
            </label>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!jsonOutput}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                {t("common.download", "Download")}
              </button>
              <button
                onClick={handleCopy}
                disabled={!jsonOutput}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm ${
                  copied ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t("common.copied", "Copied!") : t("common.copy", "Copy JSON")}
              </button>
            </div>
          </div>

          <textarea
            id="md-json-output"
            readOnly
            value={jsonOutput}
            placeholder={t("markdowntabletojson.placeholder_output", "Parsed JSON output will appear here...")}
            rows={14}
            className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
          <Info className="w-4 h-4 text-indigo-500" />
          {t("markdowntabletojson.about_title", "About Markdown Table to JSON Converter")}
        </div>
        <p className="leading-relaxed">
          {t(
            "markdowntabletojson.about_text",
            "Convert Markdown table markup into structured JSON format. Supports multiple output structures (Array of Objects, 2D Array, Key-Value Map), header key casing transformations, auto-type casting (booleans, numbers, nulls), and prototype pollution protections. All processing runs entirely client-side in your browser for total data privacy."
          )}
        </p>
      </div>
    </div>
  );
}

export default MarkdownTableToJSON;
