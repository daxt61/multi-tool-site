import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  Copy,
  Check,
  RotateCcw,
  Info,
  Sliders,
  Sparkles,
  Download,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const MAX_START_NUMBER = 1000000000;
const DEFAULT_START_NUMBER = 27;
const MAX_ITERATIONS_LIMIT = 5000;

type DelimiterType = "comma" | "space" | "arrow" | "newline";

export function CollatzSequence({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const startInputRef = useRef<HTMLInputElement>(null);

  const [startNumberInput, setStartInput] = useState<string>(
    initialData?.startNumber?.toString() || String(DEFAULT_START_NUMBER)
  );
  const [maxIterationsInput, setMaxIterationsInput] = useState<string>(
    initialData?.maxIterations?.toString() || "2000"
  );
  const [delimiter, setDelimiter] = useState<DelimiterType>(
    initialData?.delimiter || "arrow"
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<{ step: number; value: number; x: number; y: number } | null>(null);

  // Parse starting number with fallback and clamping
  const startNumber = useMemo(() => {
    const num = parseInt(startNumberInput, 10);
    if (isNaN(num) || num <= 0) return 0;
    return Math.min(num, MAX_START_NUMBER);
  }, [startNumberInput]);

  // Parse max iterations with fallback and clamping
  const maxIterations = useMemo(() => {
    const num = parseInt(maxIterationsInput, 10);
    if (isNaN(num) || num <= 0) return 1000;
    return Math.min(num, MAX_ITERATIONS_LIMIT);
  }, [maxIterationsInput]);

  // Compute Collatz sequence
  const sequence = useMemo(() => {
    if (startNumber <= 0) return [];
    const seq: number[] = [startNumber];
    let current = startNumber;
    let iterations = 0;

    while (current > 1 && iterations < maxIterations) {
      if (current % 2 === 0) {
        current = current / 2;
      } else {
        // Safe check for potential overflow beyond max safe integer representation
        if (current > (Number.MAX_SAFE_INTEGER - 1) / 3) {
          break;
        }
        current = 3 * current + 1;
      }
      seq.push(current);
      iterations++;
    }
    return seq;
  }, [startNumber, maxIterations]);

  // Send state changes to URL syncing
  useEffect(() => {
    onStateChange?.({
      startNumber,
      maxIterations,
      delimiter
    });
  }, [startNumber, maxIterations, delimiter, onStateChange]);

  // Detailed statistics
  const stats = useMemo(() => {
    if (sequence.length === 0) {
      return {
        steps: 0,
        peak: 0,
        peakStep: 0,
        evens: 0,
        odds: 0,
        ratio: 0,
        average: 0
      };
    }

    let peak = sequence[0];
    let peakStep = 0;
    let evens = 0;
    let odds = 0;
    let sum = 0;

    sequence.forEach((val, idx) => {
      sum += val;
      if (val > peak) {
        peak = val;
        peakStep = idx;
      }
      if (val % 2 === 0) {
        evens++;
      } else {
        odds++;
      }
    });

    const average = sum / sequence.length;
    const ratio = startNumber > 0 ? peak / startNumber : 0;

    return {
      steps: sequence.length - 1,
      peak,
      peakStep,
      evens,
      odds,
      ratio,
      average
    };
  }, [sequence, startNumber]);

  // Format sequence output
  const formattedSequence = useMemo(() => {
    if (sequence.length === 0) return "";
    switch (delimiter) {
      case "comma":
        return sequence.join(", ");
      case "space":
        return sequence.join(" ");
      case "arrow":
        return sequence.join(" → ");
      case "newline":
        return sequence.join("\n");
      default:
        return sequence.join(", ");
    }
  }, [sequence, delimiter]);

  // Copy sequence to clipboard
  const handleCopy = useCallback(() => {
    if (!formattedSequence) return;
    navigator.clipboard.writeText(formattedSequence);
    setCopied(true);
    toast.success(t("collatz.success_copied", "Collatz sequence copied to clipboard!"));
    setTimeout(() => setCopied(false), 2000);
  }, [formattedSequence, t]);

  // Download sequence as file
  const handleDownload = useCallback(() => {
    if (!formattedSequence) return;
    const blob = new Blob([formattedSequence], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `collatz_sequence_${startNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("collatz.success_downloaded", "Sequence downloaded successfully!"));
  }, [formattedSequence, startNumber, t]);

  // Reset to default starting configuration
  const handleClear = useCallback(() => {
    setStartInput(String(DEFAULT_START_NUMBER));
    setMaxIterationsInput("2000");
    setDelimiter("arrow");
    setHoveredNode(null);
    toast.info(t("collatz.reset_complete", "Visualizer reset to defaults."));
    setTimeout(() => startInputRef.current?.focus(), 0);
  }, [t]);

  // Keyboard shortcut support
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

  // SVG Chart Trajectory Coordinates Mapping
  const chartWidth = 700;
  const chartHeight = 280;
  const chartPadding = { top: 20, right: 30, bottom: 30, left: 55 };

  const chartPoints = useMemo(() => {
    if (sequence.length === 0) return [];

    const xMin = 0;
    const xMax = sequence.length - 1;
    // Map log-scale values or linear values. Collatz trajectory ranges can be massive,
    // so let's allow toggling linear vs logarithmic or scaling beautifully dynamically.
    const yMin = 1;
    const yMax = stats.peak;

    const points = sequence.map((val, idx) => {
      // Prevent division by zero if single element
      const xRatio = xMax === 0 ? 0.5 : idx / xMax;
      const x = chartPadding.left + xRatio * (chartWidth - chartPadding.left - chartPadding.right);

      // Using logarithmic scaling to prevent massive peak blowouts from flattening the rest of the chart
      const logVal = Math.log10(val);
      const logMax = Math.log10(yMax || 10);
      const logMin = 0; // log10(1) = 0
      const logRatio = logMax === logMin ? 0.5 : (logVal - logMin) / (logMax - logMin);

      const y = chartHeight - chartPadding.bottom - logRatio * (chartHeight - chartPadding.top - chartPadding.bottom);

      return { step: idx, value: val, x, y };
    });

    return points;
  }, [sequence, stats.peak]);

  // Construct SVG Path strings
  const pathD = useMemo(() => {
    if (chartPoints.length < 2) return "";
    return chartPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }, [chartPoints]);

  const areaD = useMemo(() => {
    if (chartPoints.length < 2) return "";
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const bottomY = chartHeight - chartPadding.bottom;
    return `${pathD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [chartPoints, pathD]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* DoS / Limit Warnings */}
      {startNumber > MAX_START_NUMBER && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{t("collatz.warning_max_number", "Starting number capped at 1,000,000,000 to prevent system slowdown.")}</span>
        </div>
      )}

      {/* Main Layout: Inputs & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Side: Parameters & Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Sliders className="w-4 h-4 text-indigo-500" /> {t("collatz.parameters", "Parameters")}
              </div>
              <button
                onClick={handleClear}
                className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-md"
                title={`${t("common.clear", "Reset")} (Esc)`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t("common.clear", "Reset")}
              </button>
            </div>

            {/* Starting Number Input */}
            <div className="space-y-2">
              <label htmlFor="start-number-input" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                {t("collatz.start_number_label", "Starting Number (n)")}
              </label>
              <input
                id="start-number-input"
                ref={startInputRef}
                type="number"
                min="1"
                max={MAX_START_NUMBER}
                value={startNumberInput}
                onChange={(e) => setStartInput(e.target.value)}
                placeholder="27"
                className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              />
            </div>

            {/* Iteration Limit */}
            <div className="space-y-2">
              <label htmlFor="max-iterations-input" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                {t("collatz.max_iterations_label", "Max Iterations")}
              </label>
              <input
                id="max-iterations-input"
                type="number"
                min="10"
                max={MAX_ITERATIONS_LIMIT}
                value={maxIterationsInput}
                onChange={(e) => setMaxIterationsInput(e.target.value)}
                placeholder="2000"
                className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              />
            </div>

            {/* Delimiter Selection */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                {t("collatz.delimiter_label", "Output Delimiter")}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "arrow", label: "→ Arrow" },
                  { id: "comma", label: ", Comma" },
                  { id: "space", label: "␣ Space" },
                  { id: "newline", label: "↵ Newline" }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDelimiter(opt.id as DelimiterType)}
                    className={`p-2.5 text-xs font-bold rounded-xl border transition-all text-left ${
                      delimiter === opt.id
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive SVGs and Live Visual Trajectory */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/40 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <TrendingUp className="w-4 h-4 text-indigo-500" /> {t("collatz.trajectory_chart", "Trajectory Trajectory (Log Scale)")}
              </div>
              {sequence.length > 0 && (
                <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-md">
                  {t("collatz.steps_count", "{{count}} Steps", { count: stats.steps })}
                </div>
              )}
            </div>

            {/* SVG Visualizer */}
            <div className="relative w-full overflow-hidden bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              {sequence.length > 0 ? (
                <div className="relative">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-auto select-none"
                    aria-label="Collatz trajectory path graph"
                  >
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>

                    {/* Chart Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                      const y = chartPadding.top + ratio * (chartHeight - chartPadding.top - chartPadding.bottom);
                      const logValue = Math.pow(10, (1 - ratio) * Math.log10(stats.peak || 10));
                      const displayVal = Math.round(logValue);

                      return (
                        <g key={i} className="opacity-40 dark:opacity-20">
                          <line
                            x1={chartPadding.left}
                            y1={y}
                            x2={chartWidth - chartPadding.right}
                            y2={y}
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeDasharray="4,4"
                            className="text-slate-300 dark:text-slate-700"
                          />
                          <text
                            x={chartPadding.left - 8}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="9"
                            fontWeight="bold"
                            className="fill-slate-400 font-mono"
                          >
                            {displayVal.toLocaleString()}
                          </text>
                        </g>
                      );
                    })}

                    {/* X-Axis labels (Iterations / Steps) */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                      const x = chartPadding.left + ratio * (chartWidth - chartPadding.left - chartPadding.right);
                      const stepVal = Math.round(ratio * stats.steps);

                      return (
                        <text
                          key={i}
                          x={x}
                          y={chartHeight - 8}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          className="fill-slate-400 font-mono opacity-80"
                        >
                          S{stepVal}
                        </text>
                      );
                    })}

                    {/* Area under the line */}
                    {areaD && (
                      <path d={areaD} fill="url(#chartGradient)" />
                    )}

                    {/* Trajectory path line */}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Interactive nodes / dot points */}
                    {chartPoints.map((point) => {
                      // Only render visible nodes if sequence isn't excessively long to preserve layout rendering performance
                      if (sequence.length > 100 && point.step % Math.ceil(sequence.length / 50) !== 0 && point.step !== stats.peakStep && point.step !== stats.steps) {
                        return null;
                      }

                      const isPeak = point.step === stats.peakStep;
                      return (
                        <circle
                          key={point.step}
                          cx={point.x}
                          cy={point.y}
                          r={isPeak ? 5 : 3.5}
                          className={`cursor-pointer transition-all ${
                            isPeak
                              ? "fill-amber-500 stroke-amber-200 dark:stroke-amber-900"
                              : "fill-indigo-600 stroke-white dark:stroke-slate-900 hover:scale-125"
                          }`}
                          strokeWidth="1.5"
                          onMouseEnter={() => setHoveredNode(point)}
                          onMouseLeave={() => setHoveredNode(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Tooltip Overlay */}
                  {hoveredNode && (
                    <div
                      className="absolute p-3 bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 rounded-xl text-xs text-white space-y-1 shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-150 z-30"
                      style={{
                        left: `${(hoveredNode.x / chartWidth) * 100}%`,
                        top: `${(hoveredNode.y / chartHeight) * 100 - 15}%`,
                        transform: "translate(-50%, -100%)"
                      }}
                    >
                      <div className="font-bold text-[10px] text-indigo-400 uppercase tracking-wider">
                        {t("collatz.step_tooltip", "Step {{step}}", { step: hoveredNode.step })}
                      </div>
                      <div className="font-black font-mono text-sm">
                        {hoveredNode.value.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-700">
                  <TrendingUp className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm font-bold">{t("collatz.enter_value_prompt", "Enter a valid start number to visualize.")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed statistics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: t("collatz.stat_steps", "Total Steps"), value: stats.steps },
          { label: t("collatz.stat_peak", "Peak Value"), value: stats.peak.toLocaleString() },
          { label: t("collatz.stat_peak_step", "Peak at Step"), value: `S${stats.peakStep}` },
          { label: t("collatz.stat_evens", "Even Values"), value: stats.evens },
          { label: t("collatz.stat_odds", "Odd Values"), value: stats.odds },
          { label: t("collatz.stat_ratio", "Peak / Start Ratio"), value: `${stats.ratio.toFixed(2)}x` }
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              {stat.label}
            </div>
            <div className="text-lg font-black font-mono tracking-tight dark:text-white">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Trajectory String Output Display */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="collatz-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> {t("collatz.generated_sequence", "Generated Sequence")}
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={sequence.length === 0}
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              title={t("common.download", "Download")}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopy}
              disabled={sequence.length === 0}
              className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                copied
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                  : "bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
              } disabled:opacity-50`}
              title={`${t("common.copy", "Copy")} (C)`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t("common.copied", "Copied") : t("common.copy", "Copy")}
              {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/30 dark:bg-black/20 border-indigo-200">C</Kbd>}
            </button>
          </div>
        </div>
        <textarea
          id="collatz-output"
          value={formattedSequence}
          readOnly
          placeholder={t("collatz.output_placeholder", "Sequence output will appear here...")}
          className="w-full h-44 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed resize-none scrollbar-thin"
        />
      </div>

      {/* Info Panel / About */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 md:p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t("collatz.about_title", "About the Collatz Conjecture")}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("collatz.about_text", "The Collatz Conjecture is one of the most famous unsolved problems in mathematics. Also known as the 3n + 1 problem, it starts with any positive integer n. If n is even, divide it by 2. If n is odd, multiply it by 3 and add 1. The conjecture asserts that no matter what number you start with, you will always eventually reach 1. This visualizer provides rich step analytics, peak evaluations, and logarithmic trend paths.")}
          </p>
        </div>
      </div>
    </div>
  );
}
