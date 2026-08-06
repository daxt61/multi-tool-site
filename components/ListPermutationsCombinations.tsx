import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Shuffle, Copy, Check, Trash2, Download, Info, RotateCcw, Sliders, Settings2, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const DEFAULT_MAX_COMBINATIONS = 5000;
const ABSOLUTE_MAX_COMBINATIONS = 20000;
const MAX_INPUT_LENGTH = 100000;

export function ListPermutationsCombinations({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Core Inputs State
  const [inputText, setInputText] = useState<string>(() => {
    return initialData?.inputText ?? "apple\nbanana\ncherry";
  });

  const [mode, setMode] = useState<"lines" | "chars">(initialData?.mode || "lines");
  const [operation, setOperation] = useState<"permutations" | "combinations" | "combinations-repetition" | "variations" | "variations-repetition">(
    initialData?.operation || "permutations"
  );

  const [kValue, setKValue] = useState<number>(initialData?.kValue ?? 2);
  const [ensureUnique, setEnsureUnique] = useState<boolean>(initialData?.ensureUnique ?? true);

  // Formatting Settings
  const [itemSeparator, setItemSeparator] = useState<string>(() => {
    if (initialData?.itemSeparator !== undefined) return initialData.itemSeparator;
    return "comma-space";
  });
  const [customItemSeparator, setCustomItemDelimiter] = useState<string>(initialData?.customItemSeparator || " ");

  const [tupleSeparator, setTupleSeparator] = useState<string>(initialData?.tupleSeparator || "newline");
  const [customTupleSeparator, setCustomTupleSeparator] = useState<string>(initialData?.customTupleSeparator || "\n");

  const [tuplePrefix, setTuplePrefix] = useState<string>(initialData?.tuplePrefix || "");
  const [tupleSuffix, setTupleSuffix] = useState<string>(initialData?.tupleSuffix || "");

  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(initialData?.removeEmpty ?? true);
  const [maxCombos, setMaxCombos] = useState<number>(() => {
    const loaded = Number(initialData?.maxCombos);
    return isNaN(loaded) ? DEFAULT_MAX_COMBINATIONS : Math.min(Math.max(1, loaded), ABSOLUTE_MAX_COMBINATIONS);
  });

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with parent dashboard
  useEffect(() => {
    onStateChange?.({
      inputText,
      mode,
      operation,
      kValue,
      ensureUnique,
      itemSeparator,
      customItemSeparator,
      tupleSeparator,
      customTupleSeparator,
      tuplePrefix,
      tupleSuffix,
      trimItems,
      removeEmpty,
      maxCombos,
    });
  }, [
    inputText,
    mode,
    operation,
    kValue,
    ensureUnique,
    itemSeparator,
    customItemSeparator,
    tupleSeparator,
    customTupleSeparator,
    tuplePrefix,
    tupleSuffix,
    trimItems,
    removeEmpty,
    maxCombos,
    onStateChange,
  ]);

  // Parse input into elements list
  const baseItems = useMemo(() => {
    if (!inputText) return [];
    if (inputText.length > MAX_INPUT_LENGTH) return [];

    let items: string[] = [];
    if (mode === "lines") {
      items = inputText.split("\n");
      if (trimItems) {
        items = items.map((item) => item.trim());
      }
      if (removeEmpty) {
        items = items.filter((item) => item.length > 0);
      }
    } else {
      // Character mode
      // Convert to array of graphemes / characters
      items = Array.from(inputText);
      if (removeEmpty) {
        items = items.filter((char) => char !== "\n" && char !== "\r" && char.trim() !== "");
      }
    }
    return items;
  }, [inputText, mode, trimItems, removeEmpty]);

  // Calculate combinations safely
  const computedResult = useMemo(() => {
    if (inputText.length > MAX_INPUT_LENGTH) {
      return t("error.max_length", { max: MAX_INPUT_LENGTH.toLocaleString() });
    }
    if (baseItems.length === 0) return "";

    const n = baseItems.length;
    let k = kValue;
    if (operation === "permutations") {
      k = n;
    }

    // Safety checks for K
    if (k < 1) k = 1;
    if (operation !== "combinations-repetition" && operation !== "variations-repetition" && k > n) {
      k = n;
    }

    const itemsToProcess = ensureUnique && (operation === "combinations-repetition" || operation === "variations-repetition")
      ? Array.from(new Set(baseItems))
      : baseItems;

    const limit = maxCombos;
    const combinations: string[][] = [];

    // Helper functions for combinations/permutations generators
    try {
      if (operation === "permutations") {
        const sorted = ensureUnique ? [...itemsToProcess].sort((a, b) => a.localeCompare(b)) : itemsToProcess;
        const used = Array(sorted.length).fill(false);

        const backtrack = (current: string[]) => {
          if (combinations.length >= limit) return;
          if (current.length === sorted.length) {
            combinations.push([...current]);
            return;
          }
          for (let i = 0; i < sorted.length; i++) {
            if (used[i]) continue;
            if (ensureUnique && i > 0 && sorted[i] === sorted[i - 1] && !used[i - 1]) continue;

            used[i] = true;
            current.push(sorted[i]);
            backtrack(current);
            current.pop();
            used[i] = false;
          }
        };
        backtrack([]);
      } else if (operation === "combinations") {
        const sorted = ensureUnique ? [...itemsToProcess].sort((a, b) => a.localeCompare(b)) : itemsToProcess;

        const backtrack = (start: number, current: string[]) => {
          if (combinations.length >= limit) return;
          if (current.length === k) {
            combinations.push([...current]);
            return;
          }
          for (let i = start; i < sorted.length; i++) {
            if (ensureUnique && i > start && sorted[i] === sorted[i - 1]) continue;
            current.push(sorted[i]);
            backtrack(i + 1, current);
            current.pop();
          }
        };
        backtrack(0, []);
      } else if (operation === "combinations-repetition") {
        const sorted = ensureUnique ? [...itemsToProcess].sort((a, b) => a.localeCompare(b)) : itemsToProcess;

        const backtrack = (start: number, current: string[]) => {
          if (combinations.length >= limit) return;
          if (current.length === k) {
            combinations.push([...current]);
            return;
          }
          for (let i = start; i < sorted.length; i++) {
            if (ensureUnique && i > start && sorted[i] === sorted[i - 1]) continue;
            current.push(sorted[i]);
            backtrack(i, current);
            current.pop();
          }
        };
        backtrack(0, []);
      } else if (operation === "variations") {
        const sorted = ensureUnique ? [...itemsToProcess].sort((a, b) => a.localeCompare(b)) : itemsToProcess;
        const used = Array(sorted.length).fill(false);

        const backtrack = (current: string[]) => {
          if (combinations.length >= limit) return;
          if (current.length === k) {
            combinations.push([...current]);
            return;
          }
          for (let i = 0; i < sorted.length; i++) {
            if (used[i]) continue;
            if (ensureUnique && i > 0 && sorted[i] === sorted[i - 1] && !used[i - 1]) continue;

            used[i] = true;
            current.push(sorted[i]);
            backtrack(current);
            current.pop();
            used[i] = false;
          }
        };
        backtrack([]);
      } else if (operation === "variations-repetition") {
        const sorted = ensureUnique ? [...itemsToProcess].sort((a, b) => a.localeCompare(b)) : itemsToProcess;

        const backtrack = (current: string[]) => {
          if (combinations.length >= limit) return;
          if (current.length === k) {
            combinations.push([...current]);
            return;
          }
          for (let i = 0; i < sorted.length; i++) {
            if (ensureUnique && i > 0 && sorted[i] === sorted[i - 1]) continue;
            current.push(sorted[i]);
            backtrack(current);
            current.pop();
          }
        };
        backtrack([]);
      }
    } catch (err) {
      console.error(err);
    }

    // Join elements and format tuples
    const actualItemDelim = (() => {
      switch (itemSeparator) {
        case "none": return "";
        case "space": return " ";
        case "comma": return ",";
        case "comma-space": return ", ";
        case "pipe": return "|";
        case "custom": return customItemSeparator;
        default: return mode === "chars" ? "" : ", ";
      }
    })();

    const actualTupleSep = (() => {
      switch (tupleSeparator) {
        case "newline": return "\n";
        case "comma": return ", ";
        case "space": return " ";
        case "semicolon": return "; ";
        case "custom": return customTupleSeparator;
        default: return "\n";
      }
    })();

    return combinations
      .map((tuple) => `${tuplePrefix}${tuple.join(actualItemDelim)}${tupleSuffix}`)
      .join(actualTupleSep);
  }, [
    baseItems,
    inputText,
    operation,
    kValue,
    ensureUnique,
    itemSeparator,
    customItemSeparator,
    tupleSeparator,
    customTupleSeparator,
    tuplePrefix,
    tupleSuffix,
    mode,
    maxCombos,
    t,
  ]);

  const outputCharCount = useMemo(() => {
    return computedResult.length;
  }, [computedResult]);

  const totalPossibleEstimations = useMemo(() => {
    const n = baseItems.length;
    if (n === 0) return 0;
    let k = kValue;
    if (operation === "permutations") {
      k = n;
    }
    if (k < 1) return 0;

    const factorial = (num: number): number => {
      let r = 1;
      for (let i = 2; i <= num; i++) r *= i;
      return r;
    };

    const choose = (total: number, select: number): number => {
      if (select > total) return 0;
      return factorial(total) / (factorial(select) * factorial(total - select));
    };

    if (operation === "permutations") {
      return factorial(n);
    } else if (operation === "combinations") {
      return choose(n, k);
    } else if (operation === "combinations-repetition") {
      return choose(n + k - 1, k);
    } else if (operation === "variations") {
      return choose(n, k) * factorial(k);
    } else if (operation === "variations-repetition") {
      return Math.pow(n, k);
    }
    return 0;
  }, [baseItems, operation, kValue]);

  // Actions
  const handleClear = useCallback(() => {
    setInputText("");
    setError(null);
    toast.success(t("recent.cleared", "Cleared"));
    inputRef.current?.focus();
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!computedResult) return;
    navigator.clipboard.writeText(computedResult);
    setCopied(true);
    toast.success(t("cartesian.toast_copied", "Copied to clipboard!"));
    setTimeout(() => setCopied(false), 2000);
  }, [computedResult, t]);

  const handleDownload = useCallback(() => {
    if (!computedResult) return;
    const blob = new Blob([computedResult], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `permutations-combinations-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("common.download_success", "Download successful"));
  }, [computedResult, t]);

  // Keyboard shortcut hook
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
        return;
      }

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column - Options */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t("common.options")}
            </div>

            <div className="space-y-4">
              {/* Mode Mode: Lines or Chars */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t("listpermcomb.mode_label", "Generation Mode")}
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setMode("lines");
                      setItemSeparator("comma-space");
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mode === "lines"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {t("listpermcomb.mode_lines", "Lines")}
                  </button>
                  <button
                    onClick={() => {
                      setMode("chars");
                      setItemSeparator("none");
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mode === "chars"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {t("listpermcomb.mode_chars", "Characters")}
                  </button>
                </div>
              </div>

              {/* Operation type selector */}
              <div className="space-y-1.5">
                <label htmlFor="operation-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t("listpermcomb.operation_label", "Operation")}
                </label>
                <select
                  id="operation-select"
                  value={operation}
                  onChange={(e) => setOperation(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-slate-200"
                >
                  <option value="permutations">{t("listpermcomb.op_permutations", "Permutations (No repetition)")}</option>
                  <option value="combinations">{t("listpermcomb.op_combinations", "Combinations (No repetition)")}</option>
                  <option value="combinations-repetition">{t("listpermcomb.op_combinations_rep", "Combinations (With repetition)")}</option>
                  <option value="variations">{t("listpermcomb.op_variations", "Variations (No repetition)")}</option>
                  <option value="variations-repetition">{t("listpermcomb.op_variations_rep", "Variations (With repetition)")}</option>
                </select>
              </div>

              {/* K Value - Subset size */}
              {operation !== "permutations" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor="k-value-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {t("listpermcomb.k_value_label", "Subset size (k)")}
                    </label>
                    <span className="text-xs font-bold text-indigo-500 font-mono">{kValue}</span>
                  </div>
                  <input
                    id="k-value-input"
                    type="number"
                    min="1"
                    max={operation === "combinations-repetition" || operation === "variations-repetition" ? 10 : baseItems.length || 1}
                    value={kValue}
                    onChange={(e) => setKValue(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}

              {/* Ensure Unique outputs */}
              <button
                onClick={() => setEnsureUnique(!ensureUnique)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all font-bold text-xs ${
                  ensureUnique
                    ? "bg-white dark:bg-slate-800 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                }`}
              >
                <span>{t("listpermcomb.ensure_unique", "Ensure unique results")}</span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${ensureUnique ? "bg-indigo-500 border-indigo-500" : "border-slate-300"}`}>
                  {ensureUnique && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
              </button>
            </div>

            {/* Separators Configuration */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="item-sep-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.item_join_label", "Join items by")}
                  </label>
                  <select
                    id="item-sep-select"
                    value={itemSeparator}
                    onChange={(e) => setItemSeparator(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-slate-200"
                  >
                    <option value="none">{t("cartesian.opt_none", "None (Attach)")}</option>
                    <option value="space">{t("linesorter.separator_space", "Space")}</option>
                    <option value="comma">{t("linesorter.separator_comma", "Comma (,)")}</option>
                    <option value="comma-space">{t("cartesian.opt_comma_space", "Comma & Space (, )")}</option>
                    <option value="pipe">{t("linesorter.separator_pipe", "Pipe (|)")}</option>
                    <option value="custom">{t("listseparatorchanger.separator_custom", "Custom")}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tuple-sep-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.tuple_sep_label", "Separate combinations")}
                  </label>
                  <select
                    id="tuple-sep-select"
                    value={tupleSeparator}
                    onChange={(e) => setTupleSeparator(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-slate-200"
                  >
                    <option value="newline">{t("linesorter.separator_newline", "Newline (\\n)")}</option>
                    <option value="comma">{t("linesorter.separator_comma", "Comma (,)")}</option>
                    <option value="semicolon">{t("linesorter.separator_semicolon", "Semicolon (;)")}</option>
                    <option value="space">{t("linesorter.separator_space", "Space")}</option>
                    <option value="custom">{t("listseparatorchanger.separator_custom", "Custom")}</option>
                  </select>
                </div>
              </div>

              {/* Custom item separator or tuple separator */}
              {itemSeparator === "custom" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label htmlFor="custom-item-sep" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.custom_item_delim", "Custom join delim")}
                  </label>
                  <input
                    id="custom-item-sep"
                    type="text"
                    value={customItemSeparator}
                    onChange={(e) => setCustomItemDelimiter(e.target.value)}
                    placeholder="e.g. -"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
              )}

              {tupleSeparator === "custom" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label htmlFor="custom-tuple-sep" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.custom_tuple_sep", "Custom combination separator")}
                  </label>
                  <input
                    id="custom-tuple-sep"
                    type="text"
                    value={customTupleSeparator}
                    onChange={(e) => setCustomTupleSeparator(e.target.value)}
                    placeholder="e.g. ///"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
              )}

              {/* Tuple Prefixes/Suffixes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="prefix-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.tuple_prefix_label", "Combination Prefix")}
                  </label>
                  <input
                    id="prefix-input"
                    type="text"
                    value={tuplePrefix}
                    onChange={(e) => setTuplePrefix(e.target.value)}
                    placeholder="e.g. ("
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="suffix-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.tuple_suffix_label", "Combination Suffix")}
                  </label>
                  <input
                    id="suffix-input"
                    type="text"
                    value={tupleSuffix}
                    onChange={(e) => setTupleSuffix(e.target.value)}
                    placeholder="e.g. )"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
              </div>

              {/* Limit combinations safeguard */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="limit-combos-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t("cartesian.max_combos_label", "Limit total combinations")}
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">Max: {ABSOLUTE_MAX_COMBINATIONS.toLocaleString()}</span>
                </div>
                <input
                  id="limit-combos-input"
                  type="number"
                  min="1"
                  max={ABSOLUTE_MAX_COMBINATIONS}
                  value={maxCombos}
                  onChange={(e) => setMaxCombos(Math.min(ABSOLUTE_MAX_COMBINATIONS, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Toggles */}
              {mode === "lines" && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={trimItems}
                      onChange={(e) => setTrimItems(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                      {t("linesorter.opt_trim", "Trim Whitespace")}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={removeEmpty}
                      onChange={(e) => setRemoveEmpty(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                      {t("linesorter.opt_remove_empty", "Remove Empty Lines")}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Inputs and Outputs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Input text */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="perm-comb-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                {t("common.input")}
                <span className="font-mono text-[10px] font-normal lowercase">
                  ({baseItems.length} {mode === "lines" ? t("listcleaner.item_count_other", "items") : t("wordcounter.stat.characters").toLowerCase()})
                </span>
              </label>

              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                title={`${t("common.clear")} (Esc)`}
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                {t("common.clear")}
                <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
              </button>
            </div>

            <textarea
              id="perm-comb-input"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, MAX_INPUT_LENGTH))}
              placeholder={mode === "lines" ? "apple\nbanana\ncherry" : "abc"}
              className="w-full h-44 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
            />
          </div>

          {/* Statistics summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("cartesian.stat_active_lists", "Input Items")}</div>
              <div className="text-base font-black dark:text-white font-mono" aria-live="polite" aria-atomic="true">
                {baseItems.length}
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("cartesian.stat_total_combinations", "Possible Results")}</div>
              <div data-testid="total-combinations-val" className="text-base font-black dark:text-white font-mono" aria-live="polite" aria-atomic="true">
                {totalPossibleEstimations > ABSOLUTE_MAX_COMBINATIONS ? `${totalPossibleEstimations.toLocaleString()} (Truncated)` : totalPossibleEstimations.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl col-span-2 md:col-span-1 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("cartesian.stat_char_count", "Characters count")}</div>
              <div className="text-base font-black dark:text-white font-mono" aria-live="polite" aria-atomic="true">
                {outputCharCount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Output text */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="perm-comb-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                {t("common.result", "Result")}
              </label>

              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!computedResult}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all disabled:opacity-50"
                  title={t("common.download", "Download")}
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!computedResult}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                    copied
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                      : "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50"
                  } disabled:opacity-50`}
                  title={`${t("common.copy", "Copy")} (C)`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                  {copied ? t("common.copied", "Copied") : t("common.copy", "Copy")}
                  {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-slate-800">C</Kbd>}
                </button>
              </div>
            </div>

            <textarea
              id="perm-comb-output"
              value={computedResult}
              readOnly
              placeholder={t("linesorter.output_placeholder", "Results will appear here...")}
              className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none cursor-default"
            />
          </div>
        </div>
      </div>

      {/* About Box */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t("listpermcomb.about_title", "About Permutations & Combinations Generator")}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("listpermcomb.about_text", "This helper generates combinations, permutations, and variations of lists of lines or individual text characters with or without repetition. It supports custom prefixes/suffixes, custom item joins, output limits, and operates entirely locally inside your browser for full privacy.")}
          </p>
        </div>
      </div>
    </div>
  );
}
