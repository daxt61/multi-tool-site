import React, { useState, useEffect, useCallback, useRef } from "react";
import { Table, FileJson, Copy, Check, Download, AlertCircle, Sparkles, Trash2, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const MAX_LENGTH = 100000;
const MAX_ROWS = 1000;
const MAX_COLS = 100;

export function HTMLTableToJSON({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [htmlInput, setHtmlInput] = useState(initialData?.htmlInput || "");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration options
  const [outputMode, setOutputMode] = useState<"objects" | "2d" | "map">(initialData?.outputMode || "objects");
  const [parseTypes, setParseTypes] = useState<boolean>(initialData?.parseTypes !== false);
  const [emptyCells, setEmptyCells] = useState<"empty" | "null" | "skip">(initialData?.emptyCells || "empty");
  const [keyFormat, setKeyFormat] = useState<"original" | "camel" | "snake" | "pascal" | "kebab">(initialData?.keyFormat || "camel");
  const [headerMode, setHeaderMode] = useState<"auto" | "firstRow" | "none">(initialData?.headerMode || "auto");
  const [includeIndex, setIncludeIndex] = useState<boolean>(initialData?.includeIndex || false);

  // Output JSON string
  const [jsonOutput, setJsonOutput] = useState("");

  useEffect(() => {
    onStateChange?.({ htmlInput, outputMode, parseTypes, emptyCells, keyFormat, headerMode, includeIndex });
  }, [htmlInput, outputMode, parseTypes, emptyCells, keyFormat, headerMode, includeIndex, onStateChange]);

  const formatKey = useCallback((str: string): string => {
    let clean = str.trim();
    if (!clean) return "";

    // Replace accent characters with standard ascii
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
      case "kebab":
        return clean
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      case "original":
      default:
        return clean;
    }
  }, [keyFormat]);

  const parseCellValue = useCallback((val: string): any => {
    const trimmed = val.trim();
    if (!trimmed) {
      if (emptyCells === "null") return null;
      return "";
    }

    if (parseTypes) {
      // Boolean check
      if (trimmed.toLowerCase() === "true") return true;
      if (trimmed.toLowerCase() === "false") return false;

      // Number check (ensure it is parsed safely and is not NaN)
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        const num = Number(trimmed);
        if (!isNaN(num)) return num;
      }
    }

    return trimmed;
  }, [parseTypes, emptyCells]);

  // Main converter logic
  const convertTable = useCallback(() => {
    if (!htmlInput.trim()) {
      setJsonOutput("");
      setError(null);
      return;
    }

    if (htmlInput.length > MAX_LENGTH) {
      setError(t("htmltabletojson.error_max_length", { max: MAX_LENGTH.toLocaleString() }));
      setJsonOutput("");
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlInput, "text/html");
      const table = doc.querySelector("table");

      if (!table) {
        setError(t("htmltabletojson.error_no_table"));
        setJsonOutput("");
        return;
      }

      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length === 0) {
        setError(t("htmltabletojson.error_empty_table"));
        setJsonOutput("");
        return;
      }

      if (rows.length > MAX_ROWS) {
        setError(t("htmltabletojson.error_max_rows", { max: MAX_ROWS }));
        setJsonOutput("");
        return;
      }

      // Expand cells based on rowspan and colspan
      const grid: string[][] = [];

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = Array.from(row.querySelectorAll("td, th"));

        if (cells.length > MAX_COLS) {
          setError(t("htmltabletojson.error_max_cols", { max: MAX_COLS }));
          setJsonOutput("");
          return;
        }

        if (!grid[r]) grid[r] = [];

        let c = 0;
        for (let cellIdx = 0; cellIdx < cells.length; cellIdx++) {
          const cell = cells[cellIdx];

          // Find first unoccupied slot in the current grid row
          while (grid[r][c] !== undefined) {
            c++;
          }

          let rowspan = parseInt(cell.getAttribute("rowspan") || "1", 10);
          let colspan = parseInt(cell.getAttribute("colspan") || "1", 10);

          // Safeguards against memory-blowup DoS
          if (isNaN(rowspan) || rowspan < 1) rowspan = 1;
          if (isNaN(colspan) || colspan < 1) colspan = 1;
          if (rowspan > 50) rowspan = 50;
          if (colspan > 20) colspan = 20;

          const cellValue = cell.textContent || "";

          // Populate grid cells
          for (let dr = 0; dr < rowspan; dr++) {
            const targetRow = r + dr;
            if (targetRow >= MAX_ROWS) break;

            if (!grid[targetRow]) {
              grid[targetRow] = [];
            }

            for (let dc = 0; dc < colspan; dc++) {
              const targetCol = c + dc;
              if (targetCol >= MAX_COLS) break;
              grid[targetRow][targetCol] = cellValue;
            }
          }

          c += colspan;
        }
      }

      // Determine headers
      let headers: string[] = [];
      let dataRowsStart = 0;

      const hasTh = table.querySelector("th") !== null;

      if (headerMode === "firstRow" || (headerMode === "auto" && (hasTh || grid.length > 1))) {
        // Use first row as headers
        headers = (grid[0] || []).map((h, idx) => {
          const formatted = formatKey(h);
          return formatted || `column${idx + 1}`;
        });
        dataRowsStart = 1;
      } else {
        // No headers, generate column1, column2, etc.
        const numCols = grid[0] ? grid[0].length : 0;
        headers = Array.from({ length: numCols }, (_, idx) => `column${idx + 1}`);
        dataRowsStart = 0;
      }

      // Process rows to construct JSON output
      const dataRows = grid.slice(dataRowsStart);
      let parsedOutput: any = null;

      if (outputMode === "objects") {
        const list: any[] = [];
        dataRows.forEach((row, rIdx) => {
          const obj = Object.create(null);
          if (includeIndex) {
            obj._index = rIdx;
          }
          headers.forEach((header, cIdx) => {
            const rawVal = row[cIdx] !== undefined ? row[cIdx] : "";
            const parsedVal = parseCellValue(rawVal);

            if (emptyCells === "skip" && (parsedVal === "" || parsedVal === null)) {
              return;
            }

            // Secure prototype pollution protection
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
        // Optional index prepending
        if (headerMode !== "none") {
          const headerRow = includeIndex ? ["_index", ...headers] : headers;
          tableArray.push(headerRow);
        }
        dataRows.forEach((row, rIdx) => {
          const formattedRow = row.map(cell => parseCellValue(cell));
          if (includeIndex) {
            formattedRow.unshift(rIdx);
          }
          tableArray.push(formattedRow);
        });
        parsedOutput = tableArray;
      } else if (outputMode === "map") {
        const mapObj = Object.create(null);
        dataRows.forEach((row, rIdx) => {
          const keyCell = row[0] !== undefined ? String(row[0]).trim() : "";
          if (!keyCell) return;

          // Safe key check
          if (keyCell === "__proto__" || keyCell === "constructor" || keyCell === "prototype") {
            return;
          }

          const properties = Object.create(null);
          if (includeIndex) {
            properties._index = rIdx;
          }

          headers.slice(1).forEach((header, cIdx) => {
            const cellValue = row[cIdx + 1] !== undefined ? row[cIdx + 1] : "";
            const parsedVal = parseCellValue(cellValue);

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
      setError(t("htmltabletojson.error_invalid_html", { msg: err.message || "" }));
      setJsonOutput("");
    }
  }, [htmlInput, outputMode, parseTypes, emptyCells, keyFormat, headerMode, includeIndex, formatKey, parseCellValue, t]);

  // Convert whenever options or inputs change
  useEffect(() => {
    convertTable();
  }, [convertTable]);

  // Load Presets
  const loadPreset = (preset: "ecommerce" | "users" | "budget") => {
    let presetHtml = "";
    if (preset === "ecommerce") {
      presetHtml = `<table>
  <thead>
    <tr>
      <th>Product ID</th>
      <th>Name</th>
      <th>Price</th>
      <th>In Stock</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>PROD-001</td>
      <td>Wireless Mouse</td>
      <td>29.99</td>
      <td>true</td>
    </tr>
    <tr>
      <td>PROD-002</td>
      <td>Mechanical Keyboard</td>
      <td>89.50</td>
      <td>true</td>
    </tr>
    <tr>
      <td>PROD-003</td>
      <td>4K Gaming Monitor</td>
      <td>349.00</td>
      <td>false</td>
    </tr>
  </tbody>
</table>`;
    } else if (preset === "users") {
      presetHtml = `<table>
  <tr>
    <th colspan="2">User Profile</th>
    <th rowspan="2">Role</th>
  </tr>
  <tr>
    <th>First Name</th>
    <th>Last Name</th>
  </tr>
  <tr>
    <td>Alice</td>
    <td>Smith</td>
    <td>Administrator</td>
  </tr>
  <tr>
    <td>Bob</td>
    <td>Johnson</td>
    <td>Developer</td>
  </tr>
</table>`;
    } else if (preset === "budget") {
      presetHtml = `<table border="1">
  <thead>
    <tr>
      <th>Month</th>
      <th>Revenue</th>
      <th>Expenses</th>
      <th>Net Savings</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>January</td>
      <td>4500</td>
      <td>3200</td>
      <td>1300</td>
    </tr>
    <tr>
      <td>February</td>
      <td>4700</td>
      <td>3100</td>
      <td>1600</td>
    </tr>
  </tbody>
</table>`;
    }
    setHtmlInput(presetHtml);
    toast.success(t("htmltabletojson.preset_loaded"));
  };

  const handleCopy = () => {
    if (!jsonOutput) return;
    navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    toast.success(t("common.copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!jsonOutput) return;
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `table-parsed-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t("common.downloaded"));
  };

  // Keyboard Event Handlers Preserving closures
  const handlersRef = useRef({
    clear: () => {
      setHtmlInput("");
      setJsonOutput("");
      setError(null);
      const inputEl = document.getElementById("html-table-input");
      if (inputEl) inputEl.focus();
    },
    copy: handleCopy,
  });

  useEffect(() => {
    handlersRef.current = {
      clear: () => {
        setHtmlInput("");
        setJsonOutput("");
        setError(null);
        const inputEl = document.getElementById("html-table-input");
        if (inputEl) inputEl.focus();
      },
      copy: handleCopy,
    };
  }, [jsonOutput]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditable =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        active?.getAttribute("contenteditable") === "true";

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.clear();
        toast.success(t("htmltabletojson.reset_success"));
      } else if (e.key.toLowerCase() === "c" && !isEditable && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlersRef.current.copy();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [t]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Preset Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t("htmltabletojson.presets_title", "Load Template Examples")}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadPreset("ecommerce")}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
          >
            {t("htmltabletojson.preset_ecommerce", "E-Commerce Catalog")}
          </button>
          <button
            onClick={() => loadPreset("users")}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
          >
            {t("htmltabletojson.preset_users", "Spanned Cells Profile")}
          </button>
          <button
            onClick={() => loadPreset("budget")}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
          >
            {t("htmltabletojson.preset_budget", "Monthly Financials")}
          </button>
        </div>
      </div>

      {/* Input / Config / Output Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Input Area */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="html-table-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("htmltabletojson.input_html", "HTML TABLE SOURCE")}
            </label>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex">Esc</Kbd>
              <button
                onClick={() => {
                  setHtmlInput("");
                  setJsonOutput("");
                  setError(null);
                  toast.success(t("htmltabletojson.reset_success"));
                }}
                disabled={!htmlInput}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("common.clear")}
              </button>
            </div>
          </div>
          <textarea
            id="html-table-input"
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
            placeholder={t("htmltabletojson.placeholder_input", "Paste <table>...</table> code here...")}
            className="w-full h-[400px] lg:h-[550px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm leading-relaxed dark:text-slate-300 font-mono resize-none"
          />
        </div>

        {/* Configuration Options Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 text-indigo-500 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Table className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">
                {t("htmltabletojson.config_title", "Parser Configuration")}
              </h3>
            </div>

            {/* Output Mode Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                {t("htmltabletojson.output_mode", "Output Structure Mode")}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "objects", label: t("htmltabletojson.mode_objects", "Array of Objects") },
                  { id: "2d", label: t("htmltabletojson.mode_2d", "2D Value Array") },
                  { id: "map", label: t("htmltabletojson.mode_map", "Key-Value Map") },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setOutputMode(mode.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-all border ${
                      outputMode === mode.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Header Options */}
            <div className="space-y-2">
              <label htmlFor="header-mode-select" className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                {t("htmltabletojson.header_detection", "Header Options")}
              </label>
              <select
                id="header-mode-select"
                value={headerMode}
                onChange={(e) => setHeaderMode(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="auto">{t("htmltabletojson.header_auto", "Auto-detect Headers")}</option>
                <option value="firstRow">{t("htmltabletojson.header_first", "Force First Row")}</option>
                <option value="none">{t("htmltabletojson.header_none", "No Headers (Generic columns)")}</option>
              </select>
            </div>

            {/* Key Formatting (Only applicable to objects or maps) */}
            {outputMode !== "2d" && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <label htmlFor="key-format-select" className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  {t("htmltabletojson.key_formatting", "Object Key Formatting")}
                </label>
                <select
                  id="key-format-select"
                  value={keyFormat}
                  onChange={(e) => setKeyFormat(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="original">{t("htmltabletojson.key_original", "Keep Original Text")}</option>
                  <option value="camel">camelCase</option>
                  <option value="snake">snake_case</option>
                  <option value="pascal">PascalCase</option>
                  <option value="kebab">kebab-case</option>
                </select>
              </div>
            )}

            {/* Toggles */}
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={parseTypes}
                  onChange={(e) => setParseTypes(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500/20"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {t("htmltabletojson.parse_types", "Parse Numbers & Booleans")}
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includeIndex}
                  onChange={(e) => setIncludeIndex(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500/20"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {t("htmltabletojson.include_index", "Include Row Index (_index)")}
                </span>
              </label>
            </div>

            {/* Empty Cells Option */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label htmlFor="empty-cells-select" className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                {t("htmltabletojson.empty_cells", "Empty Cells")}
              </label>
              <select
                id="empty-cells-select"
                value={emptyCells}
                onChange={(e) => setEmptyCells(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="empty">{t("htmltabletojson.empty_keep", "Keep as Empty Strings")}</option>
                <option value="null">{t("htmltabletojson.empty_nullify", "Nullify (null)")}</option>
                <option value="skip">{t("htmltabletojson.empty_skip", "Skip/Ignore Field")}</option>
              </select>
            </div>

          </div>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-output-area" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("htmltabletojson.output_json", "PARSED JSON OUTPUT")}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!jsonOutput}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                {t("common.download")}
              </button>
              <button
                onClick={handleCopy}
                disabled={!jsonOutput}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t("common.copied") : t("common.copy")}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-3.5 h-3.5 ml-1 bg-white/50 dark:bg-black/20">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="json-output-area"
            value={jsonOutput}
            readOnly
            placeholder={t("htmltabletojson.placeholder_output", "JSON output will appear here...")}
            className="w-full h-[400px] lg:h-[550px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none transition-all text-sm leading-relaxed dark:text-slate-300 font-mono resize-none focus:ring-0"
          />
        </div>

      </div>

      {/* Quick Informational Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="p-6 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-indigo-500">
            <Sparkles className="w-4.5 h-4.5" />
            <h4 className="font-black text-sm uppercase tracking-wider">
              {t("htmltabletojson.about_title", "How does the colspan/rowspan handler work?")}
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {t("htmltabletojson.about_desc", "Unlike basic HTML table parsers that align columns purely by TD index, this utility features a fully responsive virtual grid expansion algorithm. It correctly propagates rowspan and colspan cells, guaranteeing tabular structures containing split headers or spanned profiles are translated into fully complete, syntactically correct datasets.")}
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-indigo-500">
            <FileJson className="w-4.5 h-4.5" />
            <h4 className="font-black text-sm uppercase tracking-wider">
              {t("htmltabletojson.modes_title", "What are the output modes?")}
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {t("htmltabletojson.modes_desc", "Array of Objects maps table headers to JSON property keys for each row. 2D Value Array constructs simple raw tables including headers as the first element. Key-Value Map uses the cells in the very first column as main dictionary keys, clustering succeeding cell configurations as their nested values.")}
          </p>
        </div>
      </div>
    </div>
  );
}
