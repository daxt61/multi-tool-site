import React, { useState, useEffect, useCallback, useRef } from "react";
import { Table, Copy, Check, Download, AlertCircle, Sparkles, Trash2, Settings, Info, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const MAX_LENGTH = 100000;
const MAX_ROWS = 1000;
const MAX_COLS = 100;

// Helper to convert cell DOM node to Markdown inline formatting
function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue || "";
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const childrenText = Array.from(el.childNodes).map(nodeToMarkdown).join("");

    switch (tag) {
      case "b":
      case "strong":
        return `**${childrenText.trim()}**`;
      case "i":
      case "em":
        return `*${childrenText.trim()}*`;
      case "code":
        return `\`${childrenText.trim()}\``;
      case "a": {
        const href = el.getAttribute("href");
        if (href) {
          return `[${childrenText.trim()}](${href})`;
        }
        return childrenText;
      }
      case "br":
        return " ";
      default:
        return childrenText;
    }
  }

  return "";
}

export function HTMLTableToMarkdown({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
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
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>PROD-101</td>
      <td><b>Wireless Mouse</b></td>
      <td>Electronics</td>
      <td>$29.99</td>
      <td><a href="https://example.com/stock">In Stock</a></td>
    </tr>
    <tr>
      <td>PROD-102</td>
      <td><code>Mechanical Keyboard</code></td>
      <td>Electronics</td>
      <td>$89.50</td>
      <td>In Stock</td>
    </tr>
    <tr>
      <td>PROD-103</td>
      <td><i>Ergonomic Chair</i></td>
      <td>Furniture</td>
      <td>$199.00</td>
      <td>Out of Stock</td>
    </tr>
  </tbody>
</table>`
  );

  const [alignment, setAlignment] = useState<"left" | "center" | "right"> (initialData?.alignment || "left");
  const [compact, setCompact] = useState<boolean>(initialData?.compact || false);
  const [headerMode, setHeaderMode] = useState<"auto" | "firstRow" | "none">(initialData?.headerMode || "auto");
  const [trimCells, setTrimCells] = useState<boolean>(initialData?.trimCells !== false);
  const [skipEmptyRows, setSkipEmptyRows] = useState<boolean>(initialData?.skipEmptyRows !== false);

  const [markdownOutput, setMarkdownOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ htmlInput, alignment, compact, headerMode, trimCells, skipEmptyRows });
  }, [htmlInput, alignment, compact, headerMode, trimCells, skipEmptyRows, onStateChange]);

  const convertTable = useCallback(() => {
    if (!htmlInput.trim()) {
      setMarkdownOutput("");
      setError(null);
      return;
    }

    if (htmlInput.length > MAX_LENGTH) {
      setError(t("error.max_length", { max: MAX_LENGTH.toLocaleString() }));
      setMarkdownOutput("");
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlInput, "text/html");
      const table = doc.querySelector("table");

      if (!table) {
        setError(t("htmltabletomarkdown.error_no_table", "No valid <table> element found."));
        setMarkdownOutput("");
        return;
      }

      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length === 0) {
        setError(t("htmltabletomarkdown.error_empty_table", "The table element contains no rows (<tr>)."));
        setMarkdownOutput("");
        return;
      }

      if (rows.length > MAX_ROWS) {
        setError(t("htmltabletomarkdown.error_max_rows", { max: MAX_ROWS }));
        setMarkdownOutput("");
        return;
      }

      // Expand cells based on rowspan and colspan
      const grid: string[][] = [];

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = Array.from(row.querySelectorAll("td, th"));

        if (cells.length > MAX_COLS) {
          setError(t("htmltabletomarkdown.error_max_cols", { max: MAX_COLS }));
          setMarkdownOutput("");
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

          let cellValue = nodeToMarkdown(cell);
          if (trimCells) {
            cellValue = cellValue.trim();
          }
          // Escape pipes for Markdown cell safety
          cellValue = cellValue.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

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

      if (grid.length === 0) {
        setMarkdownOutput("");
        return;
      }

      // Filter empty rows if requested
      const filteredGrid = skipEmptyRows
        ? grid.filter((r) => r.some((c) => c && c.trim() !== ""))
        : grid;

      if (filteredGrid.length === 0) {
        setMarkdownOutput("");
        return;
      }

      const maxCols = Math.max(...filteredGrid.map((r) => r.length));
      const normalizedGrid = filteredGrid.map((r) => {
        const padded = [...r];
        while (padded.length < maxCols) {
          padded.push("");
        }
        return padded;
      });

      let headerRow: string[];
      let bodyRows: string[][];

      const hasTh = table.querySelector("th") !== null;

      if (headerMode === "firstRow" || (headerMode === "auto" && (hasTh || normalizedGrid.length > 1))) {
        headerRow = normalizedGrid[0];
        bodyRows = normalizedGrid.slice(1);
      } else {
        headerRow = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
        bodyRows = normalizedGrid;
      }

      // Calculate column widths
      const colWidths = Array(maxCols).fill(3);
      const allRows = [headerRow, ...bodyRows];

      allRows.forEach((r) => {
        r.forEach((cell, i) => {
          colWidths[i] = Math.max(colWidths[i], cell.length);
        });
      });

      const formatCell = (val: string, width: number) => {
        if (compact) return val;
        return val.padEnd(width, " ");
      };

      // Header row line
      const headerCells = headerRow.map((cell, i) => formatCell(cell, colWidths[i]));
      const headerLine = compact ? `|${headerCells.join("|")}|` : `| ${headerCells.join(" | ")} |`;

      // Separator row line
      const separatorCells = colWidths.map((w) => {
        const minDashes = Math.max(3, compact ? 3 : w);
        if (alignment === "center") {
          return `:${"-".repeat(minDashes - 2)}:`;
        } else if (alignment === "right") {
          return `${"-".repeat(minDashes - 1)}:`;
        } else {
          return `:${"-".repeat(minDashes - 1)}`;
        }
      });

      const separatorLine = compact ? `|${separatorCells.join("|")}|` : `| ${separatorCells.join(" | ")} |`;

      // Body rows
      const bodyLines = bodyRows.map((row) => {
        const formatted = row.map((cell, i) => formatCell(cell, colWidths[i]));
        return compact ? `|${formatted.join("|")}|` : `| ${formatted.join(" | ")} |`;
      });

      const result = [headerLine, separatorLine, ...bodyLines].join("\n");
      setMarkdownOutput(result);
      setError(null);
    } catch (err: any) {
      setError(t("htmltabletomarkdown.error_invalid_html", { msg: err.message || "" }));
      setMarkdownOutput("");
    }
  }, [htmlInput, alignment, compact, headerMode, trimCells, skipEmptyRows, t]);

  useEffect(() => {
    convertTable();
  }, [convertTable]);

  const loadPreset = (preset: "ecommerce" | "users" | "status") => {
    let presetHtml = "";
    if (preset === "ecommerce") {
      presetHtml = `<table>
  <thead>
    <tr>
      <th>Product</th>
      <th>Details</th>
      <th>Price</th>
      <th>Availability</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Pro Laptop</b></td>
      <td>16GB RAM, 1TB SSD</td>
      <td>$1,299.00</td>
      <td><code>In Stock</code></td>
    </tr>
    <tr>
      <td><b>Wireless Headphones</b></td>
      <td>Noise Cancelling</td>
      <td>$199.50</td>
      <td><code>In Stock</code></td>
    </tr>
  </tbody>
</table>`;
    } else if (preset === "users") {
      presetHtml = `<table>
  <tr>
    <th colspan="2">Employee Name</th>
    <th rowspan="2">Role</th>
    <th rowspan="2">Contact</th>
  </tr>
  <tr>
    <th>First</th>
    <th>Last</th>
  </tr>
  <tr>
    <td>Alice</td>
    <td>Smith</td>
    <td><b>Lead Engineer</b></td>
    <td><a href="mailto:alice@example.com">Email Alice</a></td>
  </tr>
  <tr>
    <td>Bob</td>
    <td>Jones</td>
    <td><i>Product Manager</i></td>
    <td><a href="mailto:bob@example.com">Email Bob</a></td>
  </tr>
</table>`;
    } else if (preset === "status") {
      presetHtml = `<table>
  <thead>
    <tr>
      <th>Service</th>
      <th>Environment</th>
      <th>Status</th>
      <th>Latency</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Auth Service</b></td>
      <td>Production</td>
      <td><span style="color:green">Operational</span></td>
      <td><code>24ms</code></td>
    </tr>
    <tr>
      <td><b>Payment Gateway</b></td>
      <td>Production</td>
      <td><span style="color:green">Operational</span></td>
      <td><code>42ms</code></td>
    </tr>
  </tbody>
</table>`;
    }
    setHtmlInput(presetHtml);
    toast.success(t("htmltabletomarkdown.toast_preset_loaded", "Preset loaded successfully!"));
  };

  const handleCopy = useCallback(() => {
    if (!markdownOutput) return;
    navigator.clipboard.writeText(markdownOutput);
    setCopied(true);
    toast.success(t("htmltabletomarkdown.toast_copied", "Markdown table markup copied to clipboard!"));
    setTimeout(() => setCopied(false), 2000);
  }, [markdownOutput, t]);

  const handleClear = useCallback(() => {
    setHtmlInput("");
    setMarkdownOutput("");
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.success(t("htmltabletomarkdown.toast_cleared", "Input cleared!"));
  }, [t]);

  const handleDownload = () => {
    if (!markdownOutput) return;
    const blob = new Blob([markdownOutput], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "table.md";
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
            {t("htmltabletomarkdown.presets_title", "Quick Presets:")}
          </span>
          <button
            onClick={() => loadPreset("ecommerce")}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {t("htmltabletomarkdown.preset_catalog", "E-Commerce Catalog")}
          </button>
          <button
            onClick={() => loadPreset("users")}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {t("htmltabletomarkdown.preset_spanned", "Spanned Cells Profile")}
          </button>
          <button
            onClick={() => loadPreset("status")}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            {t("htmltabletomarkdown.preset_status", "System Status Matrix")}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Alignment Selection */}
          <div className="space-y-1.5">
            <label id="html-md-alignment-label" htmlFor="html-md-alignment" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t("htmltabletomarkdown.column_alignment", "Column Alignment")}
            </label>
            <div id="html-md-alignment" aria-labelledby="html-md-alignment-label" className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl">
              <button
                type="button"
                onClick={() => setAlignment("left")}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  alignment === "left"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Left Align"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAlignment("center")}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  alignment === "center"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Center Align"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAlignment("right")}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  alignment === "right"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Right Align"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Header Mode Selection */}
          <div className="space-y-1.5">
            <label htmlFor="html-md-header-mode" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t("htmltabletomarkdown.header_mode", "Header Detection")}
            </label>
            <select
              id="html-md-header-mode"
              value={headerMode}
              onChange={(e) => setHeaderMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="auto">{t("htmltabletomarkdown.header_auto", "Auto-detect Headers (TH)")}</option>
              <option value="firstRow">{t("htmltabletomarkdown.header_first", "Force First Row as Header")}</option>
              <option value="none">{t("htmltabletomarkdown.header_none", "No Headers")}</option>
            </select>
          </div>

          {/* Compact Padding Mode */}
          <div className="flex items-center justify-between sm:justify-start gap-3 pt-4 sm:pt-6">
            <label htmlFor="html-md-compact" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
              {t("htmltabletomarkdown.compact_mode", "Compact (No extra padding)")}
            </label>
            <input
              id="html-md-compact"
              type="checkbox"
              checked={compact}
              onChange={(e) => setCompact(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
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
            {t("htmltabletomarkdown.trim_cells", "Trim cell whitespace")}
          </label>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={skipEmptyRows}
              onChange={(e) => setSkipEmptyRows(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t("htmltabletomarkdown.skip_empty_rows", "Skip completely empty rows")}
          </label>
        </div>
      </div>

      {/* Main Input / Output Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HTML Table Source Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="html-md-input" className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-500" />
              {t("htmltabletomarkdown.input_label", "HTML Table Markup Source")}
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
              id="html-md-input"
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

        {/* Markdown Table Output Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="html-md-output" className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-500" />
              {t("htmltabletomarkdown.output_label", "Markdown Table Markup Output")}
            </label>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!markdownOutput}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                {t("common.download", "Download")}
              </button>
              <button
                onClick={handleCopy}
                disabled={!markdownOutput}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm ${
                  copied ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t("common.copied", "Copied!") : t("common.copy", "Copy Markdown")}
              </button>
            </div>
          </div>

          <textarea
            id="html-md-output"
            readOnly
            value={markdownOutput}
            placeholder={t("htmltabletomarkdown.placeholder_output", "Generated Markdown table markup will appear here...")}
            rows={14}
            className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
          <Info className="w-4 h-4 text-indigo-500" />
          {t("htmltabletomarkdown.about_title", "About HTML Table to Markdown Converter")}
        </div>
        <p className="leading-relaxed">
          {t(
            "htmltabletomarkdown.about_text",
            "Convert raw HTML <table> markup directly into clean, formatted Markdown table syntax. Preserves inline formatting (bold, italic, code, links), expands spanned cells (rowspan and colspan), and supports column alignment customization. All processing runs entirely client-side in your browser for total data privacy."
          )}
        </p>
      </div>
    </div>
  );
}

export default HTMLTableToMarkdown;
