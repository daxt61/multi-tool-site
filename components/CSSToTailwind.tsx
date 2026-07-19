import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, Sparkles, Trash2, Info, Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_INPUT_LENGTH = 100000;

// Safe dictionary mapping of static CSS properties to Tailwind classes
const STATIC_MAPPINGS: Record<string, string> = Object.assign(Object.create(null), {
  // Display
  "display:flex": "flex",
  "display:grid": "grid",
  "display:block": "block",
  "display:inline-block": "inline-block",
  "display:inline": "inline",
  "display:none": "hidden",
  "display:inline-flex": "inline-flex",
  "display:inline-grid": "inline-grid",
  "display:table": "table",
  "display:table-row": "table-row",
  "display:table-cell": "table-cell",

  // Flexbox & Grid direction/wrap
  "flex-direction:row": "flex-row",
  "flex-direction:row-reverse": "flex-row-reverse",
  "flex-direction:column": "flex-col",
  "flex-direction:column-reverse": "flex-col-reverse",
  "flex-wrap:wrap": "flex-wrap",
  "flex-wrap:nowrap": "flex-nowrap",
  "flex-wrap:wrap-reverse": "flex-wrap-reverse",
  "flex-grow:0": "grow-0",
  "flex-grow:1": "grow",
  "flex-shrink:0": "shrink-0",
  "flex-shrink:1": "shrink",

  // Alignments
  "justify-content:flex-start": "justify-start",
  "justify-content:flex-end": "justify-end",
  "justify-content:center": "justify-center",
  "justify-content:space-between": "justify-between",
  "justify-content:space-around": "justify-around",
  "justify-content:space-evenly": "justify-evenly",
  "align-items:flex-start": "items-start",
  "align-items:flex-end": "items-end",
  "align-items:center": "items-center",
  "align-items:baseline": "items-baseline",
  "align-items:stretch": "items-stretch",
  "align-self:auto": "self-auto",
  "align-self:flex-start": "self-start",
  "align-self:flex-end": "self-end",
  "align-self:center": "self-center",
  "align-self:stretch": "self-stretch",
  "align-self:baseline": "self-baseline",

  // Positioning
  "position:static": "static",
  "position:fixed": "fixed",
  "position:absolute": "absolute",
  "position:relative": "relative",
  "position:sticky": "sticky",

  // Typography
  "text-align:left": "text-left",
  "text-align:center": "text-center",
  "text-align:right": "text-right",
  "text-align:justify": "text-justify",
  "text-align:start": "text-start",
  "text-align:end": "text-end",
  "text-transform:uppercase": "uppercase",
  "text-transform:lowercase": "lowercase",
  "text-transform:capitalize": "capitalize",
  "text-transform:none": "normal-case",
  "font-style:italic": "italic",
  "font-style:normal": "not-italic",
  "white-space:normal": "whitespace-normal",
  "white-space:nowrap": "whitespace-nowrap",
  "white-space:pre": "whitespace-pre",
  "white-space:pre-line": "whitespace-pre-line",
  "white-space:pre-wrap": "whitespace-pre-wrap",
  "word-break:break-all": "break-all",
  "word-break:break-word": "break-words",
  "word-break:normal": "break-normal",

  // Box Sizing
  "box-sizing:border-box": "box-border",
  "box-sizing:content-box": "box-content",

  // Overflow
  "overflow:auto": "overflow-auto",
  "overflow:hidden": "overflow-hidden",
  "overflow:visible": "overflow-visible",
  "overflow:scroll": "overflow-scroll",
  "overflow-x:auto": "overflow-x-auto",
  "overflow-x:hidden": "overflow-x-hidden",
  "overflow-x:visible": "overflow-x-visible",
  "overflow-x:scroll": "overflow-x-scroll",
  "overflow-y:auto": "overflow-y-auto",
  "overflow-y:hidden": "overflow-y-hidden",
  "overflow-y:visible": "overflow-y-visible",
  "overflow-y:scroll": "overflow-y-scroll",

  // User Select / Cursor / Pointer Events
  "user-select:none": "select-none",
  "user-select:text": "select-text",
  "user-select:all": "select-all",
  "user-select:auto": "select-auto",
  "cursor:auto": "cursor-auto",
  "cursor:default": "cursor-default",
  "cursor:pointer": "cursor-pointer",
  "cursor:wait": "cursor-wait",
  "cursor:text": "cursor-text",
  "cursor:move": "cursor-move",
  "cursor:not-allowed": "cursor-not-allowed",
  "pointer-events:none": "pointer-events-none",
  "pointer-events:auto": "pointer-events-auto",

  // Font Weights
  "font-weight:100": "font-thin",
  "font-weight:200": "font-extralight",
  "font-weight:300": "font-light",
  "font-weight:400": "font-normal",
  "font-weight:normal": "font-normal",
  "font-weight:500": "font-medium",
  "font-weight:600": "font-semibold",
  "font-weight:700": "font-bold",
  "font-weight:bold": "font-bold",
  "font-weight:800": "font-extrabold",
  "font-weight:900": "font-black"
});

// Unit mappings for standard Tailwind properties (spacing, sizing, etc.)
const PROPERTY_PREFIXES: Record<string, string> = Object.assign(Object.create(null), {
  "padding": "p",
  "padding-top": "pt",
  "padding-right": "pr",
  "padding-bottom": "pb",
  "padding-left": "pl",
  "margin": "m",
  "margin-top": "mt",
  "margin-right": "mr",
  "margin-bottom": "mb",
  "margin-left": "ml",
  "gap": "gap",
  "row-gap": "gap-y",
  "column-gap": "gap-x",
  "width": "w",
  "height": "h",
  "max-width": "max-w",
  "max-height": "max-h",
  "min-width": "min-w",
  "min-height": "min-h",
  "top": "top",
  "right": "right",
  "bottom": "bottom",
  "left": "left",
  "z-index": "z",
  "border-width": "border",
  "border-top-width": "border-t",
  "border-right-width": "border-r",
  "border-bottom-width": "border-b",
  "border-left-width": "border-l",
  "border-radius": "rounded",
  "font-size": "text",
  "line-height": "leading",
  "letter-spacing": "tracking",
  "opacity": "opacity"
});

// Exact matches for spacing values
const SPACING_MAP: Record<string, string> = Object.assign(Object.create(null), {
  "0": "0", "0px": "0",
  "1px": "px",
  "2px": "0.5", "0.125rem": "0.5",
  "4px": "1", "0.25rem": "1",
  "6px": "1.5", "0.375rem": "1.5",
  "8px": "2", "0.5rem": "2",
  "10px": "2.5", "0.625rem": "2.5",
  "12px": "3", "0.75rem": "3",
  "14px": "3.5", "0.875rem": "3.5",
  "16px": "4", "1rem": "4",
  "20px": "5", "1.25rem": "5",
  "24px": "6", "1.5rem": "6",
  "28px": "7", "1.75rem": "7",
  "32px": "8", "2rem": "8",
  "36px": "9", "2.25rem": "9",
  "40px": "10", "2.5rem": "10",
  "44px": "11", "2.75rem": "11",
  "48px": "12", "3rem": "12",
  "56px": "14", "3.5rem": "14",
  "64px": "16", "4rem": "16",
  "80px": "20", "5rem": "20",
  "96px": "24", "6rem": "24",
  "112px": "28", "7rem": "28",
  "128px": "32", "8rem": "32",
  "144px": "36", "9rem": "36",
  "160px": "40", "10rem": "40",
  "176px": "44", "11rem": "44",
  "192px": "48", "12rem": "48",
  "208px": "52", "13rem": "52",
  "224px": "56", "14rem": "56",
  "240px": "60", "15rem": "60",
  "256px": "64", "16rem": "64",
  "288px": "72", "18rem": "72",
  "320px": "80", "20rem": "80",
  "384px": "96", "24rem": "96",
  "100%": "full",
  "50%": "1/2",
  "33.333333%": "1/3",
  "66.666667%": "2/3",
  "25%": "1/4",
  "75%": "3/4",
  "auto": "auto"
});

// Sizing exact mapping (e.g. height, max-width)
const HEIGHT_MAP: Record<string, string> = Object.assign(Object.create(null), {
  "100vh": "screen",
  "100%": "full",
  "min-content": "min",
  "max-content": "max",
  "fit-content": "fit",
  "auto": "auto"
});

const WIDTH_MAP: Record<string, string> = Object.assign(Object.create(null), {
  "100vw": "screen",
  "100%": "full",
  "min-content": "min",
  "max-content": "max",
  "fit-content": "fit",
  "auto": "auto"
});

// Font Sizes mapping
const FONT_SIZES: Record<string, string> = Object.assign(Object.create(null), {
  "12px": "xs", "0.75rem": "xs",
  "14px": "sm", "0.875rem": "sm",
  "16px": "base", "1rem": "base",
  "18px": "lg", "1.125rem": "lg",
  "20px": "xl", "1.25rem": "xl",
  "24px": "2xl", "1.5rem": "2xl",
  "30px": "3xl", "1.875rem": "3xl",
  "36px": "4xl", "2.25rem": "4xl",
  "48px": "5xl", "3rem": "5xl",
  "60px": "6xl", "3.75rem": "6xl",
  "72px": "7xl", "4.5rem": "7xl",
  "96px": "8xl", "6rem": "8xl",
  "128px": "9xl", "8rem": "9xl"
});

// Rounded corners mapping
const ROUNDED_MAP: Record<string, string> = Object.assign(Object.create(null), {
  "0": "none", "0px": "none",
  "2px": "sm",
  "4px": "", "0.25rem": "",
  "6px": "md", "0.375rem": "md",
  "8px": "lg", "0.5rem": "lg",
  "12px": "xl", "0.75rem": "xl",
  "16px": "2xl", "1rem": "2xl",
  "24px": "3xl", "1.5rem": "3xl",
  "9999px": "full", "50%": "full"
});

export function CSSToTailwind({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [cssInput, setCssInput] = useState(initialData?.cssInput || '');
  const [useArbitrary, setUseArbitrary] = useState(initialData?.useArbitrary !== false);
  const [formatAsClassName, setFormatAsClassName] = useState(!!initialData?.formatAsClassName);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ cssInput, useArbitrary, formatAsClassName });
  }, [cssInput, useArbitrary, formatAsClassName, onStateChange]);

  const convertCSSToTailwind = useCallback((input: string): string => {
    if (!input.trim()) return '';

    // Enforce maximum length constraint for performance and DoS prevention
    const trimmedInput = input.slice(0, MAX_INPUT_LENGTH);

    // Clean standard CSS rules by removing comments and selectors
    // e.g., `.class { display: flex; }` -> `display: flex;`
    let cleanStyles = trimmedInput
      .replace(/\/\*[\s\S]*?\*\//g, '') // strip CSS comments
      .replace(/^[^{]*\{([\s\S]*?)\}/gm, '$1') // extract content within curly braces if block format is used
      .replace(/\}[\s\S]*$/, ''); // clean leftover braces if any

    // Split into individual style declarations
    const lines = cleanStyles.split(/[;\n]+/);
    const classes: string[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Extract property name and value
      const separatorIdx = line.indexOf(':');
      if (separatorIdx === -1) continue;

      const property = line.slice(0, separatorIdx).trim().toLowerCase();
      const value = line.slice(separatorIdx + 1).trim();

      if (!property || !value) continue;

      const fullStyleKey = `${property}:${value.replace(/\s+/g, '')}`;

      // 1. Direct Static Mapping Check
      if (Object.prototype.hasOwnProperty.call(STATIC_MAPPINGS, fullStyleKey)) {
        classes.push(STATIC_MAPPINGS[fullStyleKey]);
        continue;
      }

      // 2. Dynamic Prefix Mapping Check
      if (Object.prototype.hasOwnProperty.call(PROPERTY_PREFIXES, property)) {
        const prefix = PROPERTY_PREFIXES[property];

        // Check for padding / margin multi-values (e.g. padding: 16px 24px)
        if (property === 'padding' || property === 'margin') {
          const parts = value.split(/\s+/).filter(Boolean);
          if (parts.length > 1 && parts.length <= 4) {
            const resolvedParts = parts.map(p => {
              const valLower = p.toLowerCase();
              if (Object.prototype.hasOwnProperty.call(SPACING_MAP, valLower)) {
                return SPACING_MAP[valLower];
              }
              return useArbitrary ? `[${p}]` : null;
            });

            if (resolvedParts.every(p => p !== null)) {
              if (resolvedParts.length === 2) {
                classes.push(`${prefix}y-${resolvedParts[0]}`);
                classes.push(`${prefix}x-${resolvedParts[1]}`);
              } else if (resolvedParts.length === 3) {
                classes.push(`${prefix}t-${resolvedParts[0]}`);
                classes.push(`${prefix}x-${resolvedParts[1]}`);
                classes.push(`${prefix}b-${resolvedParts[2]}`);
              } else if (resolvedParts.length === 4) {
                classes.push(`${prefix}t-${resolvedParts[0]}`);
                classes.push(`${prefix}r-${resolvedParts[1]}`);
                classes.push(`${prefix}b-${resolvedParts[2]}`);
                classes.push(`${prefix}l-${resolvedParts[3]}`);
              }
              continue;
            }
          }
        }

        // Specific property rules
        if (property === 'font-size') {
          const valLower = value.toLowerCase();
          if (Object.prototype.hasOwnProperty.call(FONT_SIZES, valLower)) {
            classes.push(`text-${FONT_SIZES[valLower]}`);
          } else if (useArbitrary) {
            classes.push(`text-[${value.replace(/\s+/g, '')}]`);
          }
          continue;
        }

        if (property === 'border-radius') {
          const valLower = value.toLowerCase();
          if (Object.prototype.hasOwnProperty.call(ROUNDED_MAP, valLower)) {
            const roundedVal = ROUNDED_MAP[valLower];
            classes.push(roundedVal ? `rounded-${roundedVal}` : 'rounded');
          } else if (useArbitrary) {
            classes.push(`rounded-[${value.replace(/\s+/g, '')}]`);
          }
          continue;
        }

        if (property === 'width') {
          const valLower = value.toLowerCase();
          if (Object.prototype.hasOwnProperty.call(WIDTH_MAP, valLower)) {
            classes.push(`w-${WIDTH_MAP[valLower]}`);
          } else if (Object.prototype.hasOwnProperty.call(SPACING_MAP, valLower)) {
            classes.push(`w-${SPACING_MAP[valLower]}`);
          } else if (useArbitrary) {
            classes.push(`w-[${value.replace(/\s+/g, '')}]`);
          }
          continue;
        }

        if (property === 'height') {
          const valLower = value.toLowerCase();
          if (Object.prototype.hasOwnProperty.call(HEIGHT_MAP, valLower)) {
            classes.push(`h-${HEIGHT_MAP[valLower]}`);
          } else if (Object.prototype.hasOwnProperty.call(SPACING_MAP, valLower)) {
            classes.push(`h-${SPACING_MAP[valLower]}`);
          } else if (useArbitrary) {
            classes.push(`h-[${value.replace(/\s+/g, '')}]`);
          }
          continue;
        }

        // Standard dynamic mapping (padding, margin, gap, top, bottom, right, left, etc.)
        const valLower = value.toLowerCase();
        if (Object.prototype.hasOwnProperty.call(SPACING_MAP, valLower)) {
          classes.push(`${prefix}-${SPACING_MAP[valLower]}`);
        } else if (useArbitrary) {
          classes.push(`${prefix}-[${value.replace(/\s+/g, '')}]`);
        }
        continue;
      }

      // 3. Colors mapping (background-color, color, border-color)
      if (property === 'background-color' || property === 'background') {
        const cleanedVal = value.replace(/\s+/g, '');
        // handle basic colors
        if (cleanedVal === 'transparent') {
          classes.push('bg-transparent');
        } else if (cleanedVal === 'currentColor') {
          classes.push('bg-current');
        } else if (useArbitrary) {
          classes.push(`bg-[${cleanedVal}]`);
        }
        continue;
      }

      if (property === 'color') {
        const cleanedVal = value.replace(/\s+/g, '');
        if (cleanedVal === 'transparent') {
          classes.push('text-transparent');
        } else if (cleanedVal === 'currentColor') {
          classes.push('text-current');
        } else if (useArbitrary) {
          classes.push(`text-[${cleanedVal}]`);
        }
        continue;
      }

      if (property === 'border-color') {
        const cleanedVal = value.replace(/\s+/g, '');
        if (cleanedVal === 'transparent') {
          classes.push('border-transparent');
        } else if (cleanedVal === 'currentColor') {
          classes.push('border-current');
        } else if (useArbitrary) {
          classes.push(`border-[${cleanedVal}]`);
        }
        continue;
      }

      // 4. Fallback arbitrary values for any custom properties if useArbitrary is enabled
      if (useArbitrary) {
        // Safe sanitization of values to prevent bracket injection
        const safeValue = value.replace(/[;{}]/g, '').replace(/\s+/g, '');
        if (safeValue) {
          classes.push(`${property}-[${safeValue}]`);
        }
      }
    }

    // Filter duplicates and join
    const uniqueClasses = Array.from(new Set(classes));
    return uniqueClasses.join(' ');
  }, [useArbitrary]);

  const tailwindOutput = useMemo(() => {
    const rawClasses = convertCSSToTailwind(cssInput);
    if (!rawClasses) return '';
    return formatAsClassName ? `className="${rawClasses}"` : rawClasses;
  }, [cssInput, formatAsClassName, convertCSSToTailwind]);

  const handleCopy = useCallback(() => {
    if (!tailwindOutput) return;
    navigator.clipboard.writeText(tailwindOutput);
    setCopied(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [tailwindOutput, t]);

  const handleClear = useCallback(() => {
    setCssInput('');
    textareaRef.current?.focus();
  }, []);

  // Handle local keyboard shortcuts on target textarea
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  }, [handleClear]);

  // Global keyboard shortcuts for non-editable areas
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditable = active instanceof HTMLInputElement ||
                         active instanceof HTMLTextAreaElement ||
                         active?.getAttribute('contenteditable') === 'true';
      if (isEditable) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'c' && tailwindOutput) {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleClear, handleCopy, tailwindOutput]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Configuration Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-black dark:text-white">
            {t('csstotailwind.options', 'Options')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={useArbitrary}
              onChange={(e) => setUseArbitrary(e.target.checked)}
              className="w-5 h-5 text-indigo-600 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-bold block dark:text-white">
                {t('csstotailwind.use_arbitrary', 'Use arbitrary values')}
              </span>
              <span className="text-xs text-slate-400">
                e.g., p-[17px]
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={formatAsClassName}
              onChange={(e) => setFormatAsClassName(e.target.checked)}
              className="w-5 h-5 text-indigo-600 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-bold block dark:text-white">
                {t('csstotailwind.prefix_className', 'Format as JSX className')}
              </span>
              <span className="text-xs text-slate-400">
                className="..."
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CSS Input Side */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="css-input" className="text-sm font-black uppercase tracking-widest text-slate-400">
              {t('csstotailwind.input_label', 'CSS Declarations')}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition-colors"
                title={`${t('common.clear', 'Clear')} (Esc)`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <Kbd modifier={null} className="hidden sm:inline-flex border-slate-200 dark:border-slate-800 text-slate-400">Esc</Kbd>
            </div>
          </div>

          <textarea
            id="css-input"
            ref={textareaRef}
            value={cssInput}
            onChange={(e) => setCssInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('csstotailwind.placeholder', "Paste CSS declarations here... e.g.\nbackground-color: #3b82f6;\npadding: 16px 24px;\nborder-radius: 8px;\ndisplay: flex;\nalign-items: center;")}
            className="w-full h-80 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none shadow-inner"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Tailwind Output Side */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-widest text-slate-400">
              {t('csstotailwind.output_label', 'Tailwind Classes')}
            </span>
            <div className="flex items-center gap-2">
              {tailwindOutput && (
                <>
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-bold border ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-700'}`}
                    title={`${t('common.copy', 'Copy')} (C)`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}</span>
                  </button>
                  <Kbd modifier={null} className="hidden sm:inline-flex border-slate-200 dark:border-slate-800 text-slate-400">C</Kbd>
                </>
              )}
            </div>
          </div>

          <div className="w-full h-80 p-6 bg-slate-900 dark:bg-black border border-slate-900 rounded-3xl shadow-inner font-mono text-sm text-slate-100 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto whitespace-pre-wrap break-all pr-2">
              {tailwindOutput || (
                <span className="text-slate-500 italic">
                  {t('csstotailwind.empty_output', 'Tailwind CSS classes will appear here...')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" />
            {t('csstotailwind.about_title', 'About CSS to Tailwind CSS Converter')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('csstotailwind.about_text', 'This utility automatically maps standard CSS properties to their equivalent Tailwind CSS utility classes. If a value does not exactly match a default Tailwind spacing or sizing step, it can be mapped to an arbitrary Tailwind v3 value, preserving your styles while transitioning to utility-first styling.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            {t('csstotailwind.how_it_works', 'How it works')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Paste raw CSS style blocks, selectors, or individual declarations (e.g., `background-color: #3b82f6;`). The parser cleans brackets and comments, maps common key-values like flex alignment, text alignments, typography weights/styles, and scales spacing values automatically to Tailwind units.
          </p>
        </div>
      </div>
    </div>
  );
}
