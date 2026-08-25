import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileSpreadsheet,
  Copy,
  Trash2,
  Download,
  Check,
  RefreshCw,
  Sparkles,
  Info,
  Type,
  Sliders,
  Eye,
  EyeOff,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface CSVColumnRenamerProps {
  initialData?: any;
  onStateChange?: (state: any) => void;
}

const MAX_LENGTH = 100000;

interface ColumnTransform {
  originalName: string;
  newName: string;
  casing: 'asis' | 'lowercase' | 'uppercase' | 'capitalize' | 'camelCase' | 'snake_case' | 'kebab_case';
  prefix: string;
  suffix: string;
  fallback: string;
  visible: boolean;
}

const PRESETS = {
  user_import: {
    nameKey: 'csv_renamer.preset_user_import',
    data: `id,first_name,last_name,email_address,phone_num,created_at
1,John,Doe,john.doe@example.com,555-0199,2024-01-15
2,Jane,Smith,jane.smith@example.com,,2024-02-20
3,Robert,Johnson,robert.j@example.com,555-0142,2024-03-10`,
  },
  ecommerce: {
    nameKey: 'csv_renamer.preset_ecommerce',
    data: `sku,prod_name,unit_price,qty_in_stock,supplier_code
SKU-1001,Wireless Headphones,99.99,45,SUP-A
SKU-1002,USB-C Charging Cable,14.50,120,SUP-B
SKU-1003,Ergonomic Mouse,49.00,0,SUP-A`,
  },
  financial: {
    nameKey: 'csv_renamer.preset_financial',
    data: `trans_id,acc_num,amount_val,curr,tx_status
TX-9081,ACC-4491,1250.00,USD,posted
TX-9082,ACC-8812,-45.50,EUR,pending
TX-9083,ACC-4491,300.25,USD,posted`,
  },
};

export const CSVColumnRenamer: React.FC<CSVColumnRenamerProps> = ({
  initialData,
  onStateChange,
}) => {
  const { t } = useTranslation();
  const [inputCsv, setInputCsv] = useState<string>(
    initialData?.inputCsv || PRESETS.user_import.data
  );
  const [inputDelimiter, setInputDelimiter] = useState<string>(
    initialData?.inputDelimiter || 'auto'
  );
  const [outputDelimiter, setOutputDelimiter] = useState<string>(
    initialData?.outputDelimiter || ','
  );
  const [hasHeader, setHasHeader] = useState<boolean>(
    initialData?.hasHeader !== undefined ? initialData.hasHeader : true
  );
  const [columnTransforms, setColumnTransforms] = useState<ColumnTransform[]>([]);
  const [copied, setLinkCopied] = useState<boolean>(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-detect delimiter helper
  const detectDelimiter = useCallback((text: string): string => {
    const sample = text.split('\n').slice(0, 5).join('\n');
    const counts = {
      ',': (sample.match(/,/g) || []).length,
      ';': (sample.match(/;/g) || []).length,
      '\t': (sample.match(/\t/g) || []).length,
      '|': (sample.match(/\|/g) || []).length,
    };
    let maxDelim = ',';
    let maxCount = 0;
    for (const [delim, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxDelim = delim;
      }
    }
    return maxDelim;
  }, []);

  const activeInputDelimiter = useMemo(() => {
    if (inputDelimiter === 'auto') {
      return detectDelimiter(inputCsv);
    }
    return inputDelimiter;
  }, [inputDelimiter, inputCsv, detectDelimiter]);

  // Parse input CSV into rows and matrix
  const parsedData = useMemo(() => {
    if (!inputCsv.trim()) {
      return { headers: [], rows: [] };
    }

    const lines = inputCsv
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    if (lines.length === 0) return { headers: [], rows: [] };

    const parseLine = (line: string): string[] => {
      const delim = activeInputDelimiter;
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delim && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const matrix = lines.map(parseLine);
    if (matrix.length === 0) return { headers: [], rows: [] };

    let headers: string[] = [];
    let rows: string[][] = [];

    if (hasHeader) {
      headers = matrix[0].map((h, idx) => h.trim() || `column_${idx + 1}`);
      rows = matrix.slice(1);
    } else {
      const colCount = Math.max(...matrix.map((r) => r.length));
      headers = Array.from({ length: colCount }, (_, i) => `column_${i + 1}`);
      rows = matrix;
    }

    return { headers, rows };
  }, [inputCsv, activeInputDelimiter, hasHeader]);

  // Sync column transforms when parsed headers change
  useEffect(() => {
    const newHeaders = parsedData.headers;
    setColumnTransforms((prev) => {
      return newHeaders.map((header) => {
        const existing = prev.find((p) => p.originalName === header);
        if (existing) {
          return existing;
        }
        return {
          originalName: header,
          newName: header,
          casing: 'asis',
          prefix: '',
          suffix: '',
          fallback: '',
          visible: true,
        };
      });
    });
  }, [parsedData.headers]);

  // Apply transforms to cell values
  const transformValue = useCallback(
    (val: string, transform: ColumnTransform): string => {
      let result = val.trim();
      if (!result && transform.fallback) {
        result = transform.fallback;
      }

      if (result) {
        switch (transform.casing) {
          case 'lowercase':
            result = result.toLowerCase();
            break;
          case 'uppercase':
            result = result.toUpperCase();
            break;
          case 'capitalize':
            result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
            break;
          case 'camelCase':
            result = result
              .toLowerCase()
              .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
            break;
          case 'snake_case':
            result = result
              .replace(/([a-z])([A-Z])/g, '$1_$2')
              .replace(/[\s-]+/g, '_')
              .toLowerCase();
            break;
          case 'kebab_case':
            result = result
              .replace(/([a-z])([A-Z])/g, '$1-$2')
              .replace(/[\s_]+/g, '-')
              .toLowerCase();
            break;
          default:
            break;
        }

        if (transform.prefix) result = transform.prefix + result;
        if (transform.suffix) result = result + transform.suffix;
      }

      return result;
    },
    []
  );

  // Generate output CSV
  const outputCsv = useMemo(() => {
    if (!inputCsv.trim() || parsedData.headers.length === 0) return '';

    const visibleTransforms = columnTransforms.filter((t) => t.visible);
    if (visibleTransforms.length === 0) return '';

    const escapeCell = (cell: string, delim: string): string => {
      if (cell.includes(delim) || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    };

    const lines: string[] = [];

    // Header line
    if (hasHeader) {
      const headerLine = visibleTransforms
        .map((t) => escapeCell(t.newName || t.originalName, outputDelimiter))
        .join(outputDelimiter);
      lines.push(headerLine);
    }

    // Data rows
    parsedData.rows.forEach((row) => {
      const transformedCells = visibleTransforms.map((t) => {
        const colIdx = parsedData.headers.indexOf(t.originalName);
        const rawValue = colIdx !== -1 && colIdx < row.length ? row[colIdx] : '';
        const finalValue = transformValue(rawValue, t);
        return escapeCell(finalValue, outputDelimiter);
      });
      lines.push(transformedCells.join(outputDelimiter));
    });

    return lines.join('\n');
  }, [inputCsv, parsedData, columnTransforms, hasHeader, outputDelimiter, transformValue]);

  // Sync state upward
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        inputCsv,
        inputDelimiter,
        outputDelimiter,
        hasHeader,
      });
    }
  }, [inputCsv, inputDelimiter, outputDelimiter, hasHeader, onStateChange]);

  const handleCopy = useCallback(() => {
    if (!outputCsv) return;
    navigator.clipboard.writeText(outputCsv);
    setLinkCopied(true);
    toast.success(t('csv_renamer.toast_copied', 'Transformed CSV copied to clipboard!'));
    setTimeout(() => setLinkCopied(false), 2000);
  }, [outputCsv, t]);

  const handleClear = useCallback(() => {
    setInputCsv('');
    setColumnTransforms([]);
    toast.success(t('csv_renamer.toast_cleared', 'Inputs cleared!'));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [t]);

  const handleDownload = useCallback(() => {
    if (!outputCsv) return;
    const blob = new Blob([outputCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `renamed_columns_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('csv_renamer.toast_downloaded', 'CSV file downloaded!'));
  }, [outputCsv, t]);

  const handleLoadPreset = useCallback(
    (presetKey: keyof typeof PRESETS) => {
      const preset = PRESETS[presetKey];
      setInputCsv(preset.data);
      toast.success(t('csv_renamer.toast_preset_loaded', 'Preset loaded!'));
    },
    [t]
  );

  // Keyboard shortcut handlers pattern
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable);

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !isEditable) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateTransform = (
    index: number,
    field: keyof ColumnTransform,
    value: any
  ) => {
    setColumnTransforms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  return (
    <div
      className="space-y-6"
      data-testid="csv-renamer-container"
    >
      {/* Presets Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('csv_renamer.presets', 'Quick Presets')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => (
            <button
              key={key}
              onClick={() => handleLoadPreset(key)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {t(PRESETS[key].nameKey, key)}
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar: Delimiters & Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <label
            htmlFor="input-delimiter-select"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
          >
            {t('csv_renamer.input_delimiter', 'Input Delimiter')}
          </label>
          <select
            id="input-delimiter-select"
            value={inputDelimiter}
            onChange={(e) => setInputDelimiter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="auto">✨ Auto Detect</option>
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="&#9;">Tab (\t)</option>
            <option value="|">Pipe (|)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="output-delimiter-select"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
          >
            {t('csv_renamer.output_delimiter', 'Output Delimiter')}
          </label>
          <select
            id="output-delimiter-select"
            value={outputDelimiter}
            onChange={(e) => setOutputDelimiter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="&#9;">Tab (\t)</option>
            <option value="|">Pipe (|)</option>
          </select>
        </div>

        <div className="flex items-center pt-5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('csv_renamer.has_header', 'First row is header')}
            </span>
          </label>
        </div>
      </div>

      {/* Main Input / Output Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input CSV */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="csv-renamer-input"
              className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('csv_renamer.input_label', 'Raw CSV Input')}
            </label>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{inputCsv.length} / {MAX_LENGTH}</span>
              <button
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                title={t('common.clear', 'Clear')}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <textarea
            id="csv-renamer-input"
            ref={inputRef}
            rows={12}
            value={inputCsv}
            maxLength={MAX_LENGTH}
            onChange={(e) => setInputCsv(e.target.value)}
            placeholder={t('csv_renamer.placeholder_input', 'Paste CSV/TSV data here...')}
            className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        {/* Right: Output CSV */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="csv-renamer-output"
              className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              {t('csv_renamer.output_label', 'Transformed CSV Output')}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!outputCsv}
                className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {t('common.copy', 'Copy')} <Kbd className="ml-1 text-[10px]">C</Kbd>
              </button>
              <button
                onClick={handleDownload}
                disabled={!outputCsv}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                {t('common.download', 'Download')}
              </button>
            </div>
          </div>
          <textarea
            id="csv-renamer-output"
            readOnly
            rows={12}
            value={outputCsv}
            placeholder={t('csv_renamer.placeholder_output', 'Transformed CSV will appear here...')}
            className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none"
          />
        </div>
      </div>

      {/* Column Customization Table */}
      {columnTransforms.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('csv_renamer.customize_columns', 'Customize Columns & Transformation Rules')}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {columnTransforms.filter((t) => t.visible).length} / {columnTransforms.length} {t('csv_renamer.columns_active', 'active')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase">
                  <th className="pb-3 px-2">Visible</th>
                  <th className="pb-3 px-2">Original Header</th>
                  <th className="pb-3 px-2">New Header Name</th>
                  <th className="pb-3 px-2">Value Casing</th>
                  <th className="pb-3 px-2">Prefix</th>
                  <th className="pb-3 px-2">Suffix</th>
                  <th className="pb-3 px-2">Default Fallback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {columnTransforms.map((tForm, idx) => (
                  <tr
                    key={tForm.originalName + idx}
                    className={`transition-colors ${
                      tForm.visible ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30' : 'opacity-40 bg-slate-50/20'
                    }`}
                  >
                    <td className="py-2.5 px-2">
                      <button
                        onClick={() => updateTransform(idx, 'visible', !tForm.visible)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          tForm.visible
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}
                        title={tForm.visible ? 'Hide Column' : 'Show Column'}
                      >
                        {tForm.visible ? (
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-2 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {tForm.originalName}
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={tForm.newName}
                        onChange={(e) => updateTransform(idx, 'newName', e.target.value)}
                        placeholder={tForm.originalName}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <select
                        value={tForm.casing}
                        onChange={(e) => updateTransform(idx, 'casing', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="asis">As-Is</option>
                        <option value="lowercase">lowercase</option>
                        <option value="uppercase">UPPERCASE</option>
                        <option value="capitalize">Capitalize</option>
                        <option value="camelCase">camelCase</option>
                        <option value="snake_case">snake_case</option>
                        <option value="kebab_case">kebab-case</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={tForm.prefix}
                        onChange={(e) => updateTransform(idx, 'prefix', e.target.value)}
                        placeholder="e.g. US-"
                        className="w-24 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={tForm.suffix}
                        onChange={(e) => updateTransform(idx, 'suffix', e.target.value)}
                        placeholder="e.g. USD"
                        className="w-24 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={tForm.fallback}
                        onChange={(e) => updateTransform(idx, 'fallback', e.target.value)}
                        placeholder="e.g. N/A"
                        className="w-24 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> {t('common.clear', 'Clear & Focus')}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>C</Kbd> {t('common.copy', 'Copy Output')}
          </span>
        </div>
        <span className="text-[11px] opacity-75">
          100% Client-side CSV Transformation
        </span>
      </div>
    </div>
  );
};

export default CSVColumnRenamer;
