import React, { useState, useEffect, useCallback, useRef } from "react";
import { Table, Copy, Check, Download, AlertCircle, Sparkles, Trash2, FileSpreadsheet, Settings, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const MAX_LENGTH = 100000;
const MAX_ROWS = 1000;
const MAX_COLS = 100;

export function HTMLTableToCSV({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [htmlInput, setHtmlInput] = useState(
    initialData?.htmlInput ||
      `<table>
  <thead>
    <tr>
      <th>Product ID</th>
      <th>Name</th>
      <th>Category</th>
      <th>Price</th>
      <th>In Stock</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>PROD-001</td>
      <td>Wireless Mouse</td>
      <td>Electronics</td>
      <td>$29.99</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td>PROD-002</td>
      <td>Mechanical Keyboard</td>
      <td>Electronics</td>
      <td>$89.50</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td>PROD-003</td>
      <td>Ergonomic Desk Chair</td>
      <td>Furniture</td>
      <td>$199.00</td>
      <td>No</td>
    </tr>
  </tbody>
</table>`
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
    onStateChange?.({ htmlInput, delimiter, customDelimiter, quoteMode, headerMode, trimCells, skipEmptyRows });
  }, [htmlInput, delimiter, customDelimiter, quoteMode, headerMode, trimCells, skipEmptyRows, onStateChange]);

  const activeDelimiter = delimiter === "custom" ? customDelimiter || "," : delimiter === "\t" ? "\t" : delimiter;

  const formatCSVCell = useCallback(
    (cellValue: string): string => {
      let val = cellValue;
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

  const convertTable = useCallback(() => {
    if (!htmlInput.trim()) {
      setCsvOutput("");
      setError(null);
      return;
    }

    if (htmlInput.length > MAX_LENGTH) {
      setError(t("error.max_length", { max: MAX_LENGTH.toLocaleString() }));
      setCsvOutput("");
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlInput, "text/html");
      const table = doc.querySelector("table");

      if (!table) {
        setError(t("htmltabletocsv.error_no_table", "No valid <table> element found."));
        setCsvOutput("");
        return;
      }

      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length === 0) {
        setError(t("htmltabletocsv.error_empty_table", "The table element contains no rows (<tr>)."));
        setCsvOutput("");
        return;
      }

      if (rows.length > MAX_ROWS) {
        setError(t("htmltabletocsv.error_max_rows", { max: MAX_ROWS }));
        setCsvOutput("");
        return;
      }

      // Expand cells based on rowspan and colspan
      const grid: string[][] = [];

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = Array.from(row.querySelectorAll("td, th"));

        if (cells.length > MAX_COLS) {
          setError(t("htmltabletocsv.error_max_cols", { max: MAX_COLS }));
          setCsvOutput("");
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

      // Determine headers and data rows
      let headers: string[] = [];
      let dataRowsStart = 0;
      const hasTh = table.querySelector("th") !== null;

      if (headerMode === "firstRow" || (headerMode === "auto" && (hasTh || grid.length > 1))) {
        headers = (grid[0] || []).map((h) => h.trim());
        dataRowsStart = 1;
      } else {
        const numCols = grid[0] ? grid[0].length : 0;
        headers = Array.from({ length: numCols }, (_, i) => `Column ${i + 1}`);
        dataRowsStart = 0;
      }

      const csvLines: string[] = [];

      if (headerMode !== "none" && headers.length > 0) {
        csvLines.push(headers.map((h) => formatCSVCell(h)).join(activeDelimiter));
      }

      const dataRows = grid.slice(dataRowsStart);
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (skipEmptyRows && row.every((c) => !c || c.trim() === "")) {
          continue;
        }
        csvLines.push(row.map((cell) => formatCSVCell(cell || "")).join(activeDelimiter));
      }

      setCsvOutput(csvLines.join("\n"));
      setError(null);
    } catch (err: any) {
      setError(t("htmltabletocsv.error_invalid_html", { msg: err.message || "" }));
      setCsvOutput("");
    }
  }, [htmlInput, activeDelimiter, quoteMode, headerMode, trimCells, skipEmptyRows, formatCSVCell, t]);

  useEffect(() => {
    convertTable();
  }, [convertTable]);

  const loadPreset = (preset: "ecommerce" | "users" | "budget") => {
    let presetHtml = "";
    if (preset === "ecommerce") {
      presetHtml = `<table>
  <thead>
    <tr>
      <th>Product ID</th>
      <th>Name</th>
      <th>Category</th>
      <th>Price</th>
      <th>Stock</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>PROD-101</td>
      <td>Wireless Ergonomic Mouse</td>
      <td>Electronics</td>
      <td>$29.99</td>
      <td>150</td>
    </tr>
    <tr>
      <td>PROD-102</td>
      <td>RGB Mechanical Keyboard</td>
      <td>Electronics</td>
      <td>$89.50</td>
      <td>45</td>
    </tr>
    <tr>
      <td>PROD-103</td>
      <td>UltraWide Gaming Monitor</td>
      <td>Electronics</td>
      <td>$349.00</td>
      <td>12</td>
    </tr>
  </tbody>
</table>`;
    } else if (preset === "users") {
      presetHtml = `<table>
  <tr>
    <th colspan="2">User Profile</th>
    <th rowspan="2">Role</th>
    <th rowspan="2">Status</th>
  </tr>
  <tr>
    <th>First Name</th>
    <th>Last Name</th>
  </tr>
  <tr>
    <td>Alice</td>
    <td>Vance</td>
    <td>Lead Engineer</td>
    <td>Active</td>
  </tr>
  <tr>
    <td>Bob</td>
    <td>Miller</td>
    <td>Product Manager</td>
    <td>Active</td>
  </tr>
</table>`;
    } else if (preset === "budget") {
      presetHtml = `<table border="1">
  <thead>
    <tr>
      <th>Quarter</th>
      <th>Revenue</th>
      <th>Expenses</th>
      <th>Net Profit</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Q1 2024</td>
      <td>$120,000</td>
      <td>$85,000</td>
      <td>$35,000</td>
    </tr>
    <tr>
      <td>Q2 2024</td>
      <td>$145,000</td>
      <td>$90,000</td>
      <td>$55,000</td>
    </tr>
  </tbody>
</table>`;
    }
    setHtmlInput(presetHtml);
    toast.success(t("htmltabletocsv.toast_preset_loaded", "Preset loaded successfully!"));
  };

  const handleCopy = useCallback(() => {
    if (!csvOutput) return;
    navigator.clipboard.writeText(csvOutput);
    setCopied(true);
    toast.success(t("htmltabletocsv.toast_copied", "CSV data copied to clipboard!"));
    setTimeout(() => setCopied(false), 2000);
  }, [csvOutput, t]);

  const handleClear = useCallback(() => {
    setHtmlInput("");
    setCsvOutput("");
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.success(t("htmltabletocsv.toast_cleared", "Input cleared!"));
  }, [t]);

  const handleDownload = () => {
    if (!csvOutput) return;
    const ext = delimiter === "\t" ? "tsv" : "csv";
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `table-export.${ext}`;
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
            {t("htmltabletocsv.presets_title", "Quick Presets:")}
          </span>
          <button
            onClick={() => loadPreset("ecommerce")}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {t("htmltabletocsv.preset_catalog", "E-Commerce Catalog")}
          </button>
          <button
            onClick={() => loadPreset("users")}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {t("htmltabletocsv.preset_users", "User Directory Profile (Spanned)")}
          </button>
          <button
            onClick={() => loadPreset("budget")}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {t("htmltabletocsv.preset_financial", "Monthly Financials")}
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
            <label htmlFor="html-table-csv-delimiter" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t("htmltabletocsv.delimiter_label", "Output Delimiter")}
            </label>
            <select
              id="html-table-csv-delimiter"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value=",">{t("htmltabletocsv.delim_comma", "Comma ( , )")}</option>
              <option value=";">{t("htmltabletocsv.delim_semicolon", "Semicolon ( ; )")}</option>
              <option value="\t">{t("htmltabletocsv.delim_tab", "Tab ( TSV )")}</option>
              <option value="|">{t("htmltabletocsv.delim_pipe", "Pipe ( | )")}</option>
              <option value=":">{t("htmltabletocsv.delim_colon", "Colon ( : )")}</option>
              <option value="custom">{t("htmltabletocsv.delim_custom", "Custom Character")}</option>
            </select>
          </div>

          {delimiter === "custom" && (
            <div className="space-y-1.5">
              <label htmlFor="html-table-csv-custom-delim" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                {t("htmltabletocsv.custom_delim_label", "Custom Delimiter")}
              </label>
              <input
                id="html-table-csv-custom-delim"
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
            <label htmlFor="html-table-csv-quote-mode" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t("htmltabletocsv.quote_mode", "Quote Handling")}
            </label>
            <select
              id="html-table-csv-quote-mode"
              value={quoteMode}
              onChange={(e) => setQuoteMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="smart">{t("htmltabletocsv.quote_smart", "Smart (When needed)")}</option>
              <option value="always">{t("htmltabletocsv.quote_always", "Always Quote Every Cell")}</option>
              <option value="strip">{t("htmltabletocsv.quote_strip", "Strip All Quotes")}</option>
            </select>
          </div>

          {/* Header Mode Selection */}
          <div className="space-y-1.5">
            <label htmlFor="html-table-csv-header-mode" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t("htmltabletocsv.header_mode", "Header Detection")}
            </label>
            <select
              id="html-table-csv-header-mode"
              value={headerMode}
              onChange={(e) => setHeaderMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="auto">{t("htmltabletocsv.header_auto", "Auto-detect Headers (TH)")}</option>
              <option value="firstRow">{t("htmltabletocsv.header_first", "Force First Row as Header")}</option>
              <option value="none">{t("htmltabletocsv.header_none", "No Headers")}</option>
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
            {t("htmltabletocsv.trim_cells", "Trim cell whitespace")}
          </label>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={skipEmptyRows}
              onChange={(e) => setSkipEmptyRows(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t("htmltabletocsv.skip_empty_rows", "Skip completely empty rows")}
          </label>
        </div>
      </div>

      {/* Main Input / Output Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HTML Table Source Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="html-table-csv-input" className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-500" />
              {t("htmltabletocsv.input_label", "HTML Table Markup Source")}
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
              id="html-table-csv-input"
              ref={inputRef}
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              placeholder="Paste your <table>...</table> HTML code here..."
              rows={14}
              className="w-full p-4 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y placeholder:text-slate-400"
            />
            <div className="absolute bottom-3 right-3 text-[10px] font-medium text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
              {htmlInput.length} / {MAX_LENGTH}
            </div>
          </div>
        </div>

        {/* CSV Output Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="html-table-csv-output" className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              {t("htmltabletocsv.output_label", "CSV / TSV Dataset Output")}
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
            id="html-table-csv-output"
            readOnly
            value={csvOutput}
            placeholder={t("htmltabletocsv.placeholder_output", "Generated CSV / TSV dataset will appear here...")}
            rows={14}
            className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
          <Info className="w-4 h-4 text-indigo-500" />
          {t("htmltabletocsv.about_title", "About HTML Table to CSV Converter")}
        </div>
        <p className="leading-relaxed">
          {t(
            "htmltabletocsv.about_text",
            "Convert raw HTML <table> markup directly into clean CSV, TSV, or character-delimited datasets. Handles complex tables with spanned cells (rowspan and colspan), customizable delimiters, quote rules, and automatic header detection. All processing runs entirely client-side in your browser for total data privacy."
          )}
        </p>
      </div>
    </div>
  );
}

export default HTMLTableToCSV;
