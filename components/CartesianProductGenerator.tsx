import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Grid3X3, Copy, Check, Trash2, Download, Info, RotateCcw, Plus, AlertTriangle, Eye, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const DEFAULT_MAX_COMBINATIONS = 5000;
const ABSOLUTE_MAX_COMBINATIONS = 20000;

export function CartesianProductGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const firstTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Core Inputs State: array of lists
  const [lists, setLists] = useState<string[]>(() => {
    if (Array.isArray(initialData?.lists) && initialData.lists.length >= 2) {
      return initialData.lists;
    }
    return ["red\ngreen\nblue", "apple\nbanana", "1\n2"];
  });

  // Settings
  const [inputDelimiter, setInputDelimiter] = useState<string>(initialData?.inputDelimiter || "newline");
  const [customInputDelimiter, setCustomInputDelimiter] = useState<string>(initialData?.customInputDelimiter || "");
  const [itemDelimiter, setItemDelimiter] = useState<string>(initialData?.itemDelimiter || "comma-space");
  const [customItemDelimiter, setCustomItemDelimiter] = useState<string>(initialData?.customItemDelimiter || " ");

  const [tupleSeparator, setTupleSeparator] = useState<string>(initialData?.tupleSeparator || "newline");
  const [customTupleSeparator, setCustomTupleSeparator] = useState<string>(initialData?.customTupleSeparator || "\n");

  const [tuplePrefix, setTuplePrefix] = useState<string>(initialData?.tuplePrefix || "(");
  const [tupleSuffix, setTupleSuffix] = useState<string>(initialData?.tupleSuffix || ")");

  const [itemPrefix, setItemPrefix] = useState<string>(initialData?.itemPrefix || "");
  const [itemSuffix, setItemSuffix] = useState<string>(initialData?.itemSuffix || "");

  const [caseMode, setCaseMode] = useState<string>(initialData?.caseMode || "as-is");
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(initialData?.removeEmpty ?? true);
  const [maxCombos, setMaxCombos] = useState<number>(() => {
    const loaded = Number(initialData?.maxCombos);
    return isNaN(loaded) ? DEFAULT_MAX_COMBINATIONS : Math.min(Math.max(1, loaded), ABSOLUTE_MAX_COMBINATIONS);
  });

  const [copied, setCopied] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  // URL state sync
  useEffect(() => {
    onStateChange?.({
      lists,
      inputDelimiter,
      customInputDelimiter,
      itemDelimiter,
      customItemDelimiter,
      tupleSeparator,
      customTupleSeparator,
      tuplePrefix,
      tupleSuffix,
      itemPrefix,
      itemSuffix,
      caseMode,
      trimItems,
      removeEmpty,
      maxCombos,
    });
  }, [
    lists,
    inputDelimiter,
    customInputDelimiter,
    itemDelimiter,
    customItemDelimiter,
    tupleSeparator,
    customTupleSeparator,
    tuplePrefix,
    tupleSuffix,
    itemPrefix,
    itemSuffix,
    caseMode,
    trimItems,
    removeEmpty,
    maxCombos,
    onStateChange,
  ]);

  // Parse custom delimiter safely
  const getDelimiterRegex = useCallback((type: string, customVal: string) => {
    switch (type) {
      case "comma": return /,/g;
      case "semicolon": return /;/g;
      case "space": return /\s+/g;
      case "pipe": return /\|/g;
      case "newline": return /\n/g;
      case "custom": {
        if (!customVal) return /\n/g;
        // Escape regex special chars to prevent crashes
        const escaped = customVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(escaped, "g");
      }
      default: return /\n/g;
    }
  }, []);

  // Parse each list input into individual items
  const parsedLists = useMemo(() => {
    const delimiter = getDelimiterRegex(inputDelimiter, customInputDelimiter);
    return lists.map((list) => {
      if (!list) return [];
      let items = list.split(delimiter);

      if (trimItems) {
        items = items.map((item) => item.trim());
      }
      if (removeEmpty) {
        items = items.filter((item) => item.length > 0);
      }

      // Case conversion
      items = items.map((item) => {
        switch (caseMode) {
          case "upper": return item.toUpperCase();
          case "lower": return item.toLowerCase();
          case "capitalize": {
            if (!item) return item;
            return item.charAt(0).toUpperCase() + item.slice(1);
          }
          default: return item;
        }
      });

      return items;
    });
  }, [lists, inputDelimiter, customInputDelimiter, trimItems, removeEmpty, caseMode, getDelimiterRegex]);

  // Compute stats
  const listSizes = useMemo(() => {
    return parsedLists.map((l) => l.length);
  }, [parsedLists]);

  const totalCalculatedCombinations = useMemo(() => {
    if (parsedLists.length === 0) return 0;
    // Calculate total product of lengths
    let product = 1;
    for (const l of parsedLists) {
      product *= l.length;
      if (product > ABSOLUTE_MAX_COMBINATIONS * 10) {
        return product; // Early exit for extremely large numbers to avoid overflow
      }
    }
    return product;
  }, [parsedLists]);

  // Compute actual cartesian product combinations
  const computedResult = useMemo(() => {
    if (parsedLists.length === 0 || totalCalculatedCombinations === 0) {
      setWarning(null);
      return "";
    }

    if (totalCalculatedCombinations > maxCombos) {
      setWarning("limit");
    } else {
      setWarning(null);
    }

    // Standard recursive cartesian product generator
    const combinations: string[][] = [];
    const maxToGen = Math.min(totalCalculatedCombinations, maxCombos);

    const generate = (listIndex: number, current: string[]) => {
      if (combinations.length >= maxToGen) return;
      if (listIndex === parsedLists.length) {
        combinations.push([...current]);
        return;
      }

      const currentList = parsedLists[listIndex];
      for (let i = 0; i < currentList.length; i++) {
        if (combinations.length >= maxToGen) return;
        current.push(currentList[i]);
        generate(listIndex + 1, current);
        current.pop();
      }
    };

    generate(0, []);

    // Helper for item joining
    const actualItemDelim = (() => {
      switch (itemDelimiter) {
        case "comma": return ",";
        case "comma-space": return ", ";
        case "space": return " ";
        case "pipe": return "|";
        case "none": return "";
        case "custom": return customItemDelimiter;
        default: return ", ";
      }
    })();

    // Helper for tuple joining
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

    // Apply prefix and suffix to elements and tuples
    const formattedTuples = combinations.map((tuple) => {
      const wrappedItems = tuple.map((item) => `${itemPrefix}${item}${itemSuffix}`);
      const joinedItems = wrappedItems.join(actualItemDelim);
      return `${tuplePrefix}${joinedItems}${tupleSuffix}`;
    });

    return formattedTuples.join(actualTupleSep);
  }, [
    parsedLists,
    totalCalculatedCombinations,
    maxCombos,
    itemDelimiter,
    customItemDelimiter,
    tupleSeparator,
    customTupleSeparator,
    tuplePrefix,
    tupleSuffix,
    itemPrefix,
    itemSuffix,
  ]);

  const outputCharCount = useMemo(() => {
    return computedResult.length;
  }, [computedResult]);

  // Actions
  const handleAddList = useCallback(() => {
    if (lists.length >= 8) {
      toast.error(t("cartesian.toast_max_lists", "Maximum of 8 lists allowed."));
      return;
    }
    setLists((prev) => [...prev, ""]);
    toast.success(t("cartesian.toast_list_added", "Added List #{{num}}", { num: lists.length + 1 }));
  }, [lists, t]);

  const handleRemoveList = useCallback((index: number) => {
    if (lists.length <= 2) {
      toast.error(t("cartesian.toast_min_lists", "At least two lists are required to generate a Cartesian product."));
      return;
    }
    setLists((prev) => prev.filter((_, i) => i !== index));
    toast.success(t("cartesian.toast_list_removed", "Removed List #{{num}}", { num: index + 1 }));
  }, [lists, t]);

  const handleListChange = useCallback((index: number, val: string) => {
    setLists((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  }, []);

  const handleClear = useCallback(() => {
    setLists(["", ""]);
    toast.success(t("cartesian.toast_cleared", "Inputs cleared."));
    firstTextareaRef.current?.focus();
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!computedResult) return;
    navigator.clipboard.writeText(computedResult);
    setCopied(true);
    toast.success(t("cartesian.toast_copied", "Cartesian product combinations copied to clipboard!"));
    setTimeout(() => setCopied(false), 2000);
  }, [computedResult, t]);

  const handleDownload = useCallback(() => {
    if (!computedResult) return;
    const blob = new Blob([computedResult], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cartesian-product-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [computedResult]);

  // useRef-backed handlersRef to safeguard keyboard shortcuts
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

      const isEditable = activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA";

      if (e.key === "Escape") {
        if (isInputFocused || !isEditable) {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
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
      {warning === "limit" && (
        <div role="alert" className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-start gap-3 text-amber-600 dark:text-amber-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p>{t("cartesian.warning_limit_title", "Combinations limit reached!")}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("cartesian.warning_limit_text", "Only the first {{max}} combinations out of {{total}} are generated to keep your browser fast. You can adjust the limit in Options.", { max: maxCombos.toLocaleString(), total: totalCalculatedCombinations.toLocaleString() })}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Multiple Lists Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t("cartesian.lists_header", "Input Lists (Sets)")}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleAddList}
                disabled={lists.length >= 8}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/30 hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
                title={t("cartesian.add_list_tooltip", "Add a new list")}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                {t("cartesian.add_list_btn", "Add List")}
              </button>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lists.map((listContent, idx) => {
              const listId = `cartesian-list-${idx}`;
              return (
                <div key={idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 relative group">
                  <div className="flex justify-between items-center">
                    <label htmlFor={listId} className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {t("cartesian.list_label_numbered", "List #{{num}}", { num: idx + 1 })}
                      <span className="ml-1.5 font-mono text-[10px] text-slate-400">
                        ({listSizes[idx] || 0} {t("common.words", "items")})
                      </span>
                    </label>
                    {lists.length > 2 && (
                      <button
                        onClick={() => handleRemoveList(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                        aria-label={t("cartesian.remove_list_aria", "Remove List #{{num}}", { num: idx + 1 })}
                        title={t("cartesian.remove_list_aria", "Remove List #{{num}}", { num: idx + 1 })}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <textarea
                    id={listId}
                    ref={idx === 0 ? firstTextareaRef : undefined}
                    value={listContent}
                    onChange={(e) => handleListChange(idx, e.target.value)}
                    placeholder={t("cartesian.list_placeholder", "Item 1\nItem 2...")}
                    className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xs dark:text-slate-300 resize-none"
                  />
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("cartesian.stat_active_lists", "Active Lists")}</div>
              <div className="text-lg font-black dark:text-white font-mono" aria-live="polite" aria-atomic="true">
                {lists.length}
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("cartesian.stat_total_combinations", "Total Combinations")}</div>
              <div className="text-lg font-black dark:text-white font-mono" aria-live="polite" aria-atomic="true">
                {totalCalculatedCombinations.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl col-span-2 sm:col-span-1 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("cartesian.stat_char_count", "Characters count")}</div>
              <div className="text-lg font-black dark:text-white font-mono" aria-live="polite" aria-atomic="true">
                {outputCharCount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Options & Output */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-slate-400" aria-hidden="true" />
              {t("common.options")}
            </h3>

            {/* Delimiter / Parser settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="input-delim-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.input_delim_label", "Item Separator")}
                  </label>
                  <select
                    id="input-delim-select"
                    value={inputDelimiter}
                    onChange={(e) => setInputDelimiter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-slate-200"
                  >
                    <option value="newline">{t("linesorter.separator_newline", "Newline (\\n)")}</option>
                    <option value="comma">{t("linesorter.separator_comma", "Comma (,)")}</option>
                    <option value="semicolon">{t("linesorter.separator_semicolon", "Semicolon (;)")}</option>
                    <option value="space">{t("linesorter.separator_space", "Space")}</option>
                    <option value="pipe">{t("linesorter.separator_pipe", "Pipe (|)")}</option>
                    <option value="custom">{t("listseparatorchanger.separator_custom", "Custom")}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="item-join-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.item_join_label", "Join items by")}
                  </label>
                  <select
                    id="item-join-select"
                    value={itemDelimiter}
                    onChange={(e) => setItemDelimiter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-slate-200"
                  >
                    <option value="comma-space">{t("cartesian.opt_comma_space", "Comma & Space (, )")}</option>
                    <option value="comma">{t("linesorter.separator_comma", "Comma (,)")}</option>
                    <option value="space">{t("linesorter.separator_space", "Space")}</option>
                    <option value="pipe">{t("linesorter.separator_pipe", "Pipe (|)")}</option>
                    <option value="none">{t("cartesian.opt_none", "None (Attach)")}</option>
                    <option value="custom">{t("listseparatorchanger.separator_custom", "Custom")}</option>
                  </select>
                </div>
              </div>

              {/* Custom delims inline if selected */}
              {(inputDelimiter === "custom" || itemDelimiter === "custom") && (
                <div className="grid grid-cols-2 gap-4 pt-1 animate-in fade-in zoom-in-95">
                  {inputDelimiter === "custom" ? (
                    <div className="space-y-1.5">
                      <label htmlFor="custom-input-delim-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                        {t("cartesian.custom_input_delim", "Custom input delim")}
                      </label>
                      <input
                        id="custom-input-delim-input"
                        type="text"
                        value={customInputDelimiter}
                        onChange={(e) => setCustomInputDelimiter(e.target.value)}
                        placeholder="e.g. ###"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                      />
                    </div>
                  ) : <div />}

                  {itemDelimiter === "custom" ? (
                    <div className="space-y-1.5">
                      <label htmlFor="custom-item-delim-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                        {t("cartesian.custom_item_delim", "Custom join delim")}
                      </label>
                      <input
                        id="custom-item-delim-input"
                        type="text"
                        value={customItemDelimiter}
                        onChange={(e) => setCustomItemDelimiter(e.target.value)}
                        placeholder="e.g. _"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                      />
                    </div>
                  ) : <div />}
                </div>
              )}

              {/* Combinations Output Separator */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="tuple-sep-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.tuple_sep_label", "Separate combinations")}
                  </label>
                  <select
                    id="tuple-sep-select"
                    value={tupleSeparator}
                    onChange={(e) => setTupleSeparator(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-slate-200"
                  >
                    <option value="newline">{t("linesorter.separator_newline", "Newline (\\n)")}</option>
                    <option value="comma">{t("linesorter.separator_comma", "Comma (,)")}</option>
                    <option value="semicolon">{t("linesorter.separator_semicolon", "Semicolon (;)")}</option>
                    <option value="space">{t("linesorter.separator_space", "Space")}</option>
                    <option value="custom">{t("listseparatorchanger.separator_custom", "Custom")}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="case-mode-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("listcleaner.case", "Case")}
                  </label>
                  <select
                    id="case-mode-select"
                    value={caseMode}
                    onChange={(e) => setCaseMode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-slate-200"
                  >
                    <option value="as-is">{t("cartesian.case_asis", "Keep original (As-is)")}</option>
                    <option value="upper">{t("wordcounter.btn.uppercase", "UPPERCASE")}</option>
                    <option value="lower">{t("wordcounter.btn.lowercase", "lowercase")}</option>
                    <option value="capitalize">{t("wordcounter.btn.capitalize", "Capitalize")}</option>
                  </select>
                </div>
              </div>

              {tupleSeparator === "custom" && (
                <div className="space-y-1.5 pt-1 animate-in fade-in zoom-in-95">
                  <label htmlFor="custom-tuple-sep-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.custom_tuple_sep", "Custom combination separator")}
                  </label>
                  <input
                    id="custom-tuple-sep-input"
                    type="text"
                    value={customTupleSeparator}
                    onChange={(e) => setCustomTupleSeparator(e.target.value)}
                    placeholder="e.g. \n\n"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>
              )}

              {/* Tuple Wrapping Prefixes & Suffixes */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label htmlFor="tuple-prefix-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.tuple_prefix_label", "Combination Prefix")}
                  </label>
                  <input
                    id="tuple-prefix-input"
                    type="text"
                    value={tuplePrefix}
                    onChange={(e) => setTuplePrefix(e.target.value)}
                    placeholder="e.g. ("
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="tuple-suffix-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.tuple_suffix_label", "Combination Suffix")}
                  </label>
                  <input
                    id="tuple-suffix-input"
                    type="text"
                    value={tupleSuffix}
                    onChange={(e) => setTupleSuffix(e.target.value)}
                    placeholder="e.g. )"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Items Within Tuple Prefix & Suffix */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label htmlFor="item-prefix-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.item_prefix_label", "Item Wrap Prefix")}
                  </label>
                  <input
                    id="item-prefix-input"
                    type="text"
                    value={itemPrefix}
                    onChange={(e) => setItemPrefix(e.target.value)}
                    placeholder='e.g. "'
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="item-suffix-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.item_suffix_label", "Item Wrap Suffix")}
                  </label>
                  <input
                    id="item-suffix-input"
                    type="text"
                    value={itemSuffix}
                    onChange={(e) => setItemSuffix(e.target.value)}
                    placeholder='e.g. "'
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Toggles and Max Combinations Safeguard */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="max-combos-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t("cartesian.max_combos_label", "Limit total combinations")}
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    Max: {ABSOLUTE_MAX_COMBINATIONS.toLocaleString()}
                  </span>
                </div>
                <input
                  id="max-combos-input"
                  type="number"
                  min="1"
                  max={ABSOLUTE_MAX_COMBINATIONS}
                  value={maxCombos}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) {
                      setMaxCombos(Math.min(Math.max(1, val), ABSOLUTE_MAX_COMBINATIONS));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />

                <div className="grid grid-cols-1 gap-2 pt-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
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

                  <label className="flex items-center gap-3 cursor-pointer group">
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
              </div>
            </div>
          </div>

          {/* Combinations Output Textarea */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="combinations-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
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
              id="combinations-output"
              value={computedResult}
              readOnly
              placeholder={t("linesorter.output_placeholder", "Combinations will appear here...")}
              className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none cursor-default"
            />
          </div>
        </div>
      </div>

      {/* About Box */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t("cartesian.about_title", "About Cartesian Product")}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("cartesian.about_text", "A Cartesian product is a mathematical operation that returns a set from multiple sets. Specifically, it generates all possible ordered combinations where the first element is selected from the first list, the second from the second, and so on. This interactive generator supports custom delimiters, element wrapping, prefixes, suffixes, and strict performance limits to handle your sets completely within your browser.")}
          </p>
        </div>
      </div>
    </div>
  );
}
