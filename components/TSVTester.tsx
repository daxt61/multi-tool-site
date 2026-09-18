import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  FileSearch, Copy, Check, Trash2, Download, CheckCircle2,
  AlertTriangle, XCircle, Info, Settings2, Sparkles, FileSpreadsheet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_ROWS = 2000;

export interface ValidationError {
  line: number;
  column?: number;
  headerName?: string;
  type: 'col_count' | 'empty_cell' | 'type_mismatch' | 'duplicate_row';
  message: string;
  severity: 'error' | 'warning';
}

const PRESETS = [
  {
    id: 'clean_catalog',
    nameKey: 'tsvtester.preset_clean',
    input: "Product_ID\tName\tPrice\tIn_Stock\tRelease_Date\nP101\tWireless Mouse\t29.99\ttrue\t2023-01-15\nP102\tMechanical Keyboard\t89.50\ttrue\t2022-11-20\nP103\tUSB-C Hub\t45.00\tfalse\t2023-05-10\nP104\t4K Monitor\t349.99\ttrue\t2023-08-01",
  },
  {
    id: 'mismatched_data',
    nameKey: 'tsvtester.preset_mismatched',
    input: "User_ID\tEmail\tAge\tIs_Active\n101\tuser1@example.com\t28\ttrue\n102\tuser2@example.com\tthirty\ttrue\tExtra_Cell\n103\tuser3-invalid-email\t34\ttrue\n104\tuser4@example.com\t\tfalse\n101\tuser1@example.com\t28\ttrue",
  },
  {
    id: 'financial_missing',
    nameKey: 'tsvtester.preset_financial',
    input: "Tx_ID\tAccount\tAmount\tStatus\tTimestamp\nTX-8801\tACC-12001\t1250.50\tCompleted\t2024-03-01T10:15:00Z\nTX-8802\tACC-12002\t\tPending\t2024-03-01T10:18:00Z\nTX-8803\tACC-12003\t-450.00\tFailed\nTX-8804\tACC-12004\t89.99\tCompleted\t2024-03-01T10:25:00Z",
  },
];

export function TSVTester({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input ?? PRESETS[0].input);
  const [hasHeader, setHasHeader] = useState<boolean>(initialData?.hasHeader ?? true);
  const [checkTypes, setCheckTypes] = useState<boolean>(initialData?.checkTypes ?? true);
  const [allowEmpty, setAllowEmpty] = useState<boolean>(initialData?.allowEmpty ?? false);
  const [checkDuplicates, setCheckDuplicates] = useState<boolean>(initialData?.checkDuplicates ?? true);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ input, hasHeader, checkTypes, allowEmpty, checkDuplicates });
  }, [input, hasHeader, checkTypes, allowEmpty, checkDuplicates, onStateChange]);

  const analysis = useMemo(() => {
    if (!input || !input.trim()) {
      return {
        totalRows: 0,
        expectedCols: 0,
        validRows: 0,
        errorRows: 0,
        emptyCells: 0,
        errors: [] as ValidationError[],
        colTypes: [] as string[],
        headers: [] as string[],
      };
    }

    if (input.length > MAX_LENGTH) {
      return {
        totalRows: 0,
        expectedCols: 0,
        validRows: 0,
        errorRows: 1,
        emptyCells: 0,
        errors: [{
          line: 0,
          type: 'col_count' as const,
          message: t('error.max_length', { max: MAX_LENGTH.toLocaleString() }),
          severity: 'error' as const,
        }],
        colTypes: [],
        headers: [],
      };
    }

    const lines = input.split(/\r?\n/).filter(line => line.length > 0);
    const rowCount = Math.min(lines.length, MAX_ROWS);

    if (rowCount === 0) {
      return {
        totalRows: 0,
        expectedCols: 0,
        validRows: 0,
        errorRows: 0,
        emptyCells: 0,
        errors: [],
        colTypes: [],
        headers: [],
      };
    }

    const parsedRows = lines.slice(0, rowCount).map(line => line.split('\t'));
    const startIndex = hasHeader ? 1 : 0;
    const headerRow = hasHeader ? parsedRows[0] : parsedRows[0].map((_, idx) => `Col_${idx + 1}`);
    const expectedCols = headerRow.length;

    const errors: ValidationError[] = [];
    let emptyCellsCount = 0;
    const invalidLines = new Set<number>();

    // 1. Column Count and Empty Cell Inspection
    for (let i = startIndex; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      const lineNumber = i + 1;

      if (row.length !== expectedCols) {
        invalidLines.add(lineNumber);
        errors.push({
          line: lineNumber,
          type: 'col_count',
          message: t('tsvtester.err_col_count', {
            line: lineNumber,
            actual: row.length,
            expected: expectedCols,
            defaultValue: `Line ${lineNumber}: Row has ${row.length} columns (Expected ${expectedCols})`
          }),
          severity: 'error',
        });
      }

      for (let c = 0; c < row.length; c++) {
        const cell = row[c].trim();
        if (cell === '') {
          emptyCellsCount++;
          if (!allowEmpty) {
            invalidLines.add(lineNumber);
            errors.push({
              line: lineNumber,
              column: c + 1,
              headerName: headerRow[c] || `Col_${c + 1}`,
              type: 'empty_cell',
              message: t('tsvtester.err_empty_cell', {
                line: lineNumber,
                col: c + 1,
                name: headerRow[c] || `Col_${c + 1}`,
                defaultValue: `Line ${lineNumber}, Col ${c + 1} (${headerRow[c] || `Col_${c + 1}`}): Empty cell value`
              }),
              severity: 'warning',
            });
          }
        }
      }
    }

    // 2. Data Type Inference & Consistency Check
    const colTypes: string[] = new Array(expectedCols).fill('unknown');
    if (checkTypes && parsedRows.length > startIndex) {
      for (let c = 0; c < expectedCols; c++) {
        let isNum = true;
        let isBool = true;
        let isDate = true;
        let isEmail = true;
        let sampleCount = 0;

        for (let i = startIndex; i < parsedRows.length; i++) {
          const val = (parsedRows[i][c] || '').trim();
          if (!val) continue;
          sampleCount++;

          if (isNum && isNaN(Number(val))) isNum = false;
          if (isBool && !['true', 'false', '1', '0', 'yes', 'no'].includes(val.toLowerCase())) isBool = false;
          if (isDate && isNaN(Date.parse(val))) isDate = false;
          if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) isEmail = false;
        }

        if (sampleCount === 0) colTypes[c] = 'string';
        else if (isNum) colTypes[c] = 'number';
        else if (isBool) colTypes[c] = 'boolean';
        else if (isDate) colTypes[c] = 'date';
        else if (isEmail) colTypes[c] = 'email';
        else colTypes[c] = 'string';
      }

      // Check Type Mismatches against inferred column type
      for (let i = startIndex; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const lineNumber = i + 1;
        const checkCols = Math.min(row.length, expectedCols);

        for (let c = 0; c < checkCols; c++) {
          const val = (row[c] || '').trim();
          if (!val) continue;
          const expectedType = colTypes[c];

          if (expectedType === 'number' && isNaN(Number(val))) {
            invalidLines.add(lineNumber);
            errors.push({
              line: lineNumber,
              column: c + 1,
              headerName: headerRow[c],
              type: 'type_mismatch',
              message: t('tsvtester.err_type_mismatch', {
                line: lineNumber,
                col: c + 1,
                name: headerRow[c],
                expected: expectedType,
                actual: val,
                defaultValue: `Line ${lineNumber}, Col ${c + 1} (${headerRow[c]}): Value "${val}" is not a valid ${expectedType}`
              }),
              severity: 'error',
            });
          } else if (expectedType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            invalidLines.add(lineNumber);
            errors.push({
              line: lineNumber,
              column: c + 1,
              headerName: headerRow[c],
              type: 'type_mismatch',
              message: t('tsvtester.err_email_mismatch', {
                line: lineNumber,
                col: c + 1,
                name: headerRow[c],
                actual: val,
                defaultValue: `Line ${lineNumber}, Col ${c + 1} (${headerRow[c]}): Value "${val}" is not a valid email address`
              }),
              severity: 'warning',
            });
          }
        }
      }
    }

    // 3. Duplicate Row Detection (Prototype pollution protected map)
    if (checkDuplicates) {
      const rowSeenMap = Object.create(null);
      for (let i = startIndex; i < parsedRows.length; i++) {
        const rawLine = lines[i].trim();
        const lineNumber = i + 1;
        if (rowSeenMap[rawLine]) {
          invalidLines.add(lineNumber);
          errors.push({
            line: lineNumber,
            type: 'duplicate_row',
            message: t('tsvtester.err_duplicate_row', {
              line: lineNumber,
              original: rowSeenMap[rawLine],
              defaultValue: `Line ${lineNumber}: Duplicate row (Identical to line ${rowSeenMap[rawLine]})`
            }),
            severity: 'warning',
          });
        } else {
          rowSeenMap[rawLine] = lineNumber;
        }
      }
    }

    const totalDataRows = parsedRows.length - startIndex;
    const errorRowsCount = invalidLines.size;
    const validRowsCount = Math.max(0, totalDataRows - errorRowsCount);

    return {
      totalRows: totalDataRows,
      expectedCols,
      validRows: validRowsCount,
      errorRows: errorRowsCount,
      emptyCells: emptyCellsCount,
      errors,
      colTypes,
      headers: headerRow,
    };
  }, [input, hasHeader, checkTypes, allowEmpty, checkDuplicates, t]);

  const generateReport = useCallback(() => {
    let report = `TSV DATA QUALITY & SYNTAX REPORT\n`;
    report += `====================================\n`;
    report += `Total Data Rows: ${analysis.totalRows}\n`;
    report += `Expected Columns: ${analysis.expectedCols}\n`;
    report += `Valid Rows: ${analysis.validRows}\n`;
    report += `Rows with Issues: ${analysis.errorRows}\n`;
    report += `Empty Cells Detected: ${analysis.emptyCells}\n\n`;

    if (analysis.headers.length > 0) {
      report += `COLUMN SCHEMAS & TYPES:\n`;
      analysis.headers.forEach((h, idx) => {
        report += ` - Col ${idx + 1} [${h}]: ${analysis.colTypes[idx] || 'string'}\n`;
      });
      report += `\n`;
    }

    if (analysis.errors.length === 0) {
      report += `STATUS: PASSED (No TSV syntax or type errors detected).\n`;
    } else {
      report += `DETAILED ISSUES & LOGS (${analysis.errors.length}):\n`;
      analysis.errors.forEach((err, i) => {
        report += ` [${i + 1}] Line ${err.line} - [${err.severity.toUpperCase()}] ${err.message}\n`;
      });
    }

    return report;
  }, [analysis]);

  const handleCopyReport = useCallback(() => {
    const report = generateReport();
    navigator.clipboard.writeText(report);
    setCopied(true);
    toast.success(t('tsvtester.toast_copied', { defaultValue: 'Validation report copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [generateReport, t]);

  const handleDownloadReport = useCallback(() => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tsv-validation-report-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('tsvtester.toast_downloaded', { defaultValue: 'Report downloaded!' }));
  }, [generateReport, t]);

  const handleClear = useCallback(() => {
    setInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.success(t('tsvtester.toast_cleared', { defaultValue: 'TSV input cleared!' }));
  }, [t]);

  const handleLoadPreset = useCallback((preset: typeof PRESETS[0]) => {
    setInput(preset.input);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.success(t('tsvtester.toast_preset_loaded', { defaultValue: 'Preset loaded!' }));
  }, [t]);

  const handlersRef = useRef({
    handleCopyReport,
    handleClear,
  });

  useEffect(() => {
    handlersRef.current = {
      handleCopyReport,
      handleClear,
    };
  }, [handleCopyReport, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (!isEditable && e.key.toLowerCase() === 'c' && !(e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handlersRef.current.handleCopyReport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          {t('tsvtester.presets_title', { defaultValue: 'Quick Presets:' })}
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 rounded-xl text-xs font-bold transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {t(preset.nameKey, { defaultValue: preset.id })}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Input & Editor Area */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="tsv-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              {t('tsvtester.input_label', { defaultValue: 'TSV Dataset Source' })}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">
                {input.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()} chars
              </span>
              <button
                onClick={handleClear}
                className="p-1.5 text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-rose-500"
                title={t('common.clear')}
                aria-label={t('common.clear')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <textarea
            id="tsv-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tsvtester.placeholder', { defaultValue: 'Col1\tCol2\tCol3\nVal1\tVal2\tVal3' })}
            className="w-full h-[420px] p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xs leading-relaxed dark:text-slate-200 resize-none"
          />

          {/* Configuration Options */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              {t('tsvtester.options_title', { defaultValue: 'Tester Rules & Options' })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasHeader}
                  onChange={(e) => setHasHeader(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                {t('tsvtester.has_header', { defaultValue: 'First row is header' })}
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkTypes}
                  onChange={(e) => setCheckTypes(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                {t('tsvtester.check_types', { defaultValue: 'Strict column type validation' })}
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowEmpty}
                  onChange={(e) => setAllowEmpty(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                {t('tsvtester.allow_empty', { defaultValue: 'Allow empty cell values' })}
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkDuplicates}
                  onChange={(e) => setCheckDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                {t('tsvtester.check_duplicates', { defaultValue: 'Detect duplicate rows' })}
              </label>
            </div>
          </div>
        </div>

        {/* Results & Inspection Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <FileSearch className="w-4 h-4 text-indigo-500" />
              {t('tsvtester.results_label', { defaultValue: 'Validation Overview' })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('tsvtester.copy_report', { defaultValue: 'Copy Report' })}
                <Kbd modifier={null} className="bg-indigo-700 text-white border-indigo-500 ml-1">C</Kbd>
              </button>

              <button
                onClick={handleDownloadReport}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500"
                title={t('common.download')}
                aria-label={t('common.download')}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t('tsvtester.stat_rows', { defaultValue: 'Data Rows' })}
              </span>
              <p className="text-xl font-black font-mono dark:text-white mt-1">{analysis.totalRows}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t('tsvtester.stat_cols', { defaultValue: 'Expected Cols' })}
              </span>
              <p className="text-xl font-black font-mono dark:text-white mt-1">{analysis.expectedCols}</p>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                {t('tsvtester.stat_valid', { defaultValue: 'Valid Rows' })}
              </span>
              <p className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                {analysis.validRows}
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${
              analysis.errorRows > 0
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/30 text-rose-600 dark:text-rose-400'
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400'
            }`}>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {t('tsvtester.stat_issues', { defaultValue: 'Rows with Issues' })}
              </span>
              <p className="text-xl font-black font-mono mt-1">{analysis.errorRows}</p>
            </div>
          </div>

          {/* Status Header */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            analysis.errors.length === 0
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-300'
          }`}>
            {analysis.errors.length === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <p className="text-xs font-bold leading-relaxed">
              {analysis.errors.length === 0
                ? t('tsvtester.status_passed', { defaultValue: 'Dataset valid: No syntax or type anomalies detected.' })
                : t('tsvtester.status_issues', { count: analysis.errors.length, defaultValue: `Found ${analysis.errors.length} issue(s) across the dataset.` })}
            </p>
          </div>

          {/* Column Type Badges */}
          {analysis.headers.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                {t('tsvtester.col_types_title', { defaultValue: 'Inferred Column Types' })}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.headers.map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-mono font-bold dark:text-slate-300"
                  >
                    <span className="text-indigo-500">{h}:</span>
                    <span className="text-slate-500 dark:text-slate-400">{analysis.colTypes[i] || 'string'}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Issues Log Scroll Area */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[220px] overflow-y-auto space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              {t('tsvtester.issues_log_title', { defaultValue: 'Detailed Error Log' })}
            </span>
            {analysis.errors.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                {t('tsvtester.no_errors', { defaultValue: 'No warnings or errors to report.' })}
              </p>
            ) : (
              analysis.errors.map((err, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border text-xs leading-relaxed font-mono flex items-start gap-2 ${
                    err.severity === 'error'
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {err.severity === 'error' ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <span>{err.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* About Box */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
        <Info className="w-6 h-6 text-indigo-600 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-bold dark:text-white">
            {t('tsvtester.about_title', { defaultValue: 'About TSV Tester & Validator' })}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('tsvtester.about_text', {
              defaultValue: 'Validate tab-separated value (TSV) files for column count consistency, missing values, data type mismatches, and duplicate records. Features automatic type inference, interactive presets, and downloadable quality reports.'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
