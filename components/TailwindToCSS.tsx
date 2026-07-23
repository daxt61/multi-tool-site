import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, Sparkles, Trash2, Info, Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_INPUT_LENGTH = 100000;

// Reversible mappings of static Tailwind classes to CSS property declarations
const REVERSE_STATIC: Record<string, string[]> = Object.assign(Object.create(null), {
  // display
  "flex": ["display: flex"],
  "grid": ["display: grid"],
  "block": ["display: block"],
  "inline-block": ["display: inline-block"],
  "inline": ["display: inline"],
  "hidden": ["display: none"],
  "inline-flex": ["display: inline-flex"],
  "inline-grid": ["display: inline-grid"],
  "table": ["display: table"],
  "table-row": ["display: table-row"],
  "table-cell": ["display: table-cell"],

  // flex/grid layout
  "flex-row": ["flex-direction: row"],
  "flex-row-reverse": ["flex-direction: row-reverse"],
  "flex-col": ["flex-direction: column"],
  "flex-col-reverse": ["flex-direction: column-reverse"],
  "flex-wrap": ["flex-wrap: wrap"],
  "flex-nowrap": ["flex-wrap: nowrap"],
  "flex-wrap-reverse": ["flex-wrap: wrap-reverse"],
  "grow": ["flex-grow: 1"],
  "grow-0": ["flex-grow: 0"],
  "shrink": ["flex-shrink: 1"],
  "shrink-0": ["flex-shrink: 0"],

  // alignments
  "justify-start": ["justify-content: flex-start"],
  "justify-end": ["justify-content: flex-end"],
  "justify-center": ["justify-content: center"],
  "justify-between": ["justify-content: space-between"],
  "justify-around": ["justify-content: space-around"],
  "justify-evenly": ["justify-content: space-evenly"],
  "items-start": ["align-items: flex-start"],
  "items-end": ["align-items: flex-end"],
  "items-center": ["align-items: center"],
  "items-baseline": ["align-items: baseline"],
  "items-stretch": ["align-items: stretch"],
  "self-auto": ["align-self: auto"],
  "self-start": ["align-self: flex-start"],
  "self-end": ["align-self: flex-end"],
  "self-center": ["align-self: center"],
  "self-stretch": ["align-self: stretch"],
  "self-baseline": ["align-self: baseline"],

  // positioning
  "static": ["position: static"],
  "fixed": ["position: fixed"],
  "absolute": ["position: absolute"],
  "relative": ["position: relative"],
  "sticky": ["position: sticky"],

  // font weights
  "font-thin": ["font-weight: 100"],
  "font-extralight": ["font-weight: 200"],
  "font-light": ["font-weight: 300"],
  "font-normal": ["font-weight: 400"],
  "font-medium": ["font-weight: 500"],
  "font-semibold": ["font-weight: 600"],
  "font-bold": ["font-weight: 700"],
  "font-extrabold": ["font-weight: 800"],
  "font-black": ["font-weight: 900"],

  // typography styles
  "italic": ["font-style: italic"],
  "not-italic": ["font-style: normal"],
  "text-left": ["text-align: left"],
  "text-center": ["text-align: center"],
  "text-right": ["text-align: right"],
  "text-justify": ["text-align: justify"],
  "text-start": ["text-align: start"],
  "text-end": ["text-align: end"],
  "uppercase": ["text-transform: uppercase"],
  "lowercase": ["text-transform: lowercase"],
  "capitalize": ["text-transform: capitalize"],
  "normal-case": ["text-transform: none"],
  "whitespace-normal": ["white-space: normal"],
  "whitespace-nowrap": ["white-space: nowrap"],
  "whitespace-pre": ["white-space: pre"],
  "whitespace-pre-line": ["white-space: pre-line"],
  "whitespace-pre-wrap": ["white-space: pre-wrap"],
  "break-all": ["word-break: break-all"],
  "break-words": ["word-break: break-word"],
  "break-normal": ["word-break: normal"],

  // box sizing
  "box-border": ["box-sizing: border-box"],
  "box-content": ["box-sizing: content-box"],

  // overflow
  "overflow-auto": ["overflow: auto"],
  "overflow-hidden": ["overflow: hidden"],
  "overflow-visible": ["overflow: visible"],
  "overflow-scroll": ["overflow: scroll"],
  "overflow-x-auto": ["overflow-x: auto"],
  "overflow-x-hidden": ["overflow-x: hidden"],
  "overflow-x-visible": ["overflow-x: visible"],
  "overflow-x-scroll": ["overflow-x: scroll"],
  "overflow-y-auto": ["overflow-y: auto"],
  "overflow-y-hidden": ["overflow-y: hidden"],
  "overflow-y-visible": ["overflow-y: visible"],
  "overflow-y-scroll": ["overflow-y: scroll"],

  // user selection & cursor
  "select-none": ["user-select: none"],
  "select-text": ["user-select: text"],
  "select-all": ["user-select: all"],
  "select-auto": ["user-select: auto"],
  "cursor-auto": ["cursor: auto"],
  "cursor-default": ["cursor: default"],
  "cursor-pointer": ["cursor: pointer"],
  "cursor-wait": ["cursor: wait"],
  "cursor-text": ["cursor: text"],
  "cursor-move": ["cursor: move"],
  "cursor-not-allowed": ["cursor: not-allowed"],
  "pointer-events-none": ["pointer-events: none"],
  "pointer-events-auto": ["pointer-events: auto"]
});

const REVERSE_PREFIX_MAP: Record<string, string> = Object.assign(Object.create(null), {
  "p": "padding",
  "pt": "padding-top",
  "pr": "padding-right",
  "pb": "padding-bottom",
  "pl": "padding-left",
  "m": "margin",
  "mt": "margin-top",
  "mr": "margin-right",
  "mb": "margin-bottom",
  "ml": "margin-left",
  "gap": "gap",
  "gap-y": "row-gap",
  "gap-x": "column-gap",
  "w": "width",
  "h": "height",
  "max-w": "max-width",
  "max-h": "max-height",
  "min-w": "min-width",
  "min-h": "min-height",
  "top": "top",
  "right": "right",
  "bottom": "bottom",
  "left": "left",
  "z": "z-index",
  "border": "border-width",
  "border-t": "border-top-width",
  "border-r": "border-right-width",
  "border-b": "border-bottom-width",
  "border-l": "border-left-width",
  "rounded": "border-radius",
  "text": "font-size",
  "leading": "line-height",
  "tracking": "letter-spacing",
  "opacity": "opacity"
});

const HEIGHT_MAP: Record<string, string> = Object.assign(Object.create(null), {
  "screen": "100vh",
  "full": "100%",
  "min": "min-content",
  "max": "max-content",
  "fit": "fit-content",
  "auto": "auto"
});

const WIDTH_MAP: Record<string, string> = Object.assign(Object.create(null), {
  "screen": "100vw",
  "full": "100%",
  "min": "min-content",
  "max": "max-content",
  "fit": "fit-content",
  "auto": "auto"
});

const FONT_SIZES: Record<string, string> = Object.assign(Object.create(null), {
  "xs": "0.75rem",
  "sm": "0.875rem",
  "base": "1rem",
  "lg": "1.125rem",
  "xl": "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
  "6xl": "3.75rem",
  "7xl": "4.5rem",
  "8xl": "6rem",
  "9xl": "8rem"
});

const ROUNDED_MAP: Record<string, string> = Object.assign(Object.create(null), {
  "none": "0px",
  "sm": "0.125rem",
  "md": "0.375rem",
  "lg": "0.5rem",
  "xl": "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  "full": "9999px"
});

const TAILWIND_COLORS: Record<string, string> = Object.assign(Object.create(null), {
  "slate-50": "#f8fafc", "slate-100": "#f1f5f9", "slate-200": "#e2e8f0", "slate-300": "#cbd5e1", "slate-400": "#94a3b8", "slate-500": "#64748b", "slate-600": "#475569", "slate-700": "#334155", "slate-800": "#1e293b", "slate-900": "#0f172a", "slate-950": "#020617",
  "gray-50": "#f9fafb", "gray-100": "#f3f4f6", "gray-200": "#e5e7eb", "gray-300": "#d1d5db", "gray-400": "#9ca3af", "gray-500": "#6b7280", "gray-600": "#4b5563", "gray-700": "#374151", "gray-800": "#1f2937", "gray-900": "#111827", "gray-950": "#030712",
  "zinc-50": "#fafafa", "zinc-100": "#f4f4f5", "zinc-200": "#e4e4e7", "zinc-300": "#d4d4d8", "zinc-400": "#a1a1aa", "zinc-500": "#71717a", "zinc-600": "#52525b", "zinc-700": "#3f3f46", "zinc-800": "#27272a", "zinc-900": "#18181b", "zinc-950": "#09090b",
  "neutral-50": "#fafafa", "neutral-100": "#f5f5f5", "neutral-200": "#e5e5e5", "neutral-300": "#d4d4d4", "neutral-400": "#a3a3a3", "neutral-500": "#737373", "neutral-600": "#525252", "neutral-700": "#404040", "neutral-800": "#262626", "neutral-900": "#171717", "neutral-950": "#0a0a0a",
  "stone-50": "#fafaf9", "stone-100": "#f5f5f4", "stone-200": "#e7e5e4", "stone-300": "#d6d3d1", "stone-400": "#a8a29e", "stone-500": "#78716c", "stone-600": "#57534e", "stone-700": "#44403c", "stone-800": "#292524", "stone-900": "#1c1917", "stone-950": "#0c0a09",
  "red-50": "#fef2f2", "red-100": "#fee2e2", "red-200": "#fecaca", "red-300": "#fca5a5", "red-400": "#f87171", "red-500": "#ef4444", "red-600": "#dc2626", "red-700": "#b91c1c", "red-800": "#991b1b", "red-900": "#7f1d1d", "red-950": "#450a0a",
  "orange-50": "#fff7ed", "orange-100": "#ffedd5", "orange-200": "#fed7aa", "orange-300": "#fdba74", "orange-400": "#fb923c", "orange-500": "#f97316", "orange-600": "#ea580c", "orange-700": "#c2410c", "orange-800": "#9a3412", "orange-900": "#7c2d12", "orange-950": "#431407",
  "amber-50": "#fffbeb", "amber-100": "#fef3c7", "amber-200": "#fde68a", "amber-300": "#fcd34d", "amber-400": "#fbbf24", "amber-500": "#f59e0b", "amber-600": "#d97706", "amber-700": "#b45309", "amber-800": "#92400e", "amber-900": "#78350f", "amber-950": "#451a03",
  "yellow-50": "#fefce8", "yellow-100": "#fef9c3", "yellow-200": "#fef08a", "yellow-300": "#fde047", "yellow-400": "#facc15", "yellow-500": "#eab308", "yellow-600": "#ca8a04", "yellow-700": "#a16207", "yellow-800": "#854d0e", "yellow-900": "#713f12", "yellow-950": "#422006",
  "lime-50": "#f7fee7", "lime-100": "#ecfccb", "lime-200": "#d9f99d", "lime-300": "#bef264", "lime-400": "#a3e635", "lime-500": "#84cc16", "lime-600": "#65a30d", "lime-700": "#4d7c0f", "lime-800": "#3f6212", "lime-900": "#365314", "lime-950": "#1a2e05",
  "green-50": "#f0fdf4", "green-100": "#dcfce7", "green-200": "#bbf7d0", "green-300": "#86efac", "green-400": "#4ade80", "green-500": "#22c55e", "green-600": "#16a34a", "green-700": "#15803d", "green-800": "#166534", "green-900": "#14532d", "green-950": "#052e16",
  "emerald-50": "#ecfdf5", "emerald-100": "#d1fae5", "emerald-200": "#a7f3d0", "emerald-300": "#6ee7b7", "emerald-400": "#34d399", "emerald-500": "#10b981", "emerald-600": "#059669", "emerald-700": "#047857", "emerald-800": "#065f46", "emerald-900": "#064e3b", "emerald-950": "#022c22",
  "teal-50": "#f0fdfa", "teal-100": "#ccfbf1", "teal-200": "#99f6e4", "teal-300": "#5eead4", "teal-400": "#2dd4bf", "teal-500": "#14b8a6", "teal-600": "#0d9488", "teal-700": "#0f766e", "teal-800": "#115e59", "teal-900": "#134e4a", "teal-950": "#042f2e",
  "cyan-50": "#ecfeff", "cyan-100": "#cffafe", "cyan-200": "#a5f3fc", "cyan-300": "#67e8f9", "cyan-400": "#22d3ee", "cyan-500": "#06b6d4", "cyan-600": "#0891b2", "cyan-700": "#0e7490", "cyan-800": "#155e75", "cyan-900": "#164e63", "cyan-950": "#083344",
  "sky-50": "#f0f9ff", "sky-100": "#e0f2fe", "sky-200": "#bae6fd", "sky-300": "#7dd3fc", "sky-400": "#38bdf8", "sky-500": "#0ea5e9", "sky-600": "#0284c7", "sky-700": "#0369a1", "sky-800": "#075985", "sky-900": "#0c4a6e", "sky-950": "#082f49",
  "blue-50": "#eff6ff", "blue-100": "#dbeafe", "blue-200": "#bfdbfe", "blue-300": "#93c5fd", "blue-400": "#60a5fa", "blue-500": "#3b82f6", "blue-600": "#2563eb", "blue-700": "#1d4ed8", "blue-800": "#1e40af", "blue-900": "#1e3a8a", "blue-950": "#172554",
  "indigo-50": "#eef2ff", "indigo-100": "#e0e7ff", "indigo-200": "#c7d2fe", "indigo-300": "#a5b4fc", "indigo-400": "#818cf8", "indigo-500": "#6366f1", "indigo-600": "#4f46e5", "indigo-700": "#4338ca", "indigo-800": "#3730a3", "indigo-900": "#312e81", "indigo-950": "#1e1b4b",
  "violet-50": "#f5f3ff", "violet-100": "#ede9fe", "violet-200": "#ddd6fe", "violet-300": "#c4b5fd", "violet-400": "#a78bfa", "violet-500": "#8b5cf6", "violet-600": "#7c3aed", "violet-700": "#6d28d9", "violet-800": "#5b21b6", "violet-900": "#4c1d95", "violet-950": "#2e1065",
  "purple-50": "#faf5ff", "purple-100": "#f3e8ff", "purple-200": "#e9d5ff", "purple-300": "#d8b4fe", "purple-400": "#c084fc", "purple-500": "#a855f7", "purple-600": "#9333ea", "purple-700": "#7e22ce", "purple-800": "#6b21a8", "purple-900": "#581c87", "purple-950": "#3b0764",
  "fuchsia-50": "#fdf4ff", "fuchsia-100": "#fae8ff", "fuchsia-200": "#f5d0fe", "fuchsia-300": "#f0abfc", "fuchsia-400": "#e879f9", "fuchsia-500": "#d946ef", "fuchsia-600": "#c026d3", "fuchsia-700": "#a21caf", "fuchsia-800": "#86198f", "fuchsia-900": "#701a75", "fuchsia-950": "#4a044e",
  "pink-50": "#fdf2f8", "pink-100": "#fce7f3", "pink-200": "#fbcfe8", "pink-300": "#f472b6", "pink-400": "#ec4899", "pink-500": "#db2777", "pink-600": "#db2777", "pink-700": "#be185d", "pink-800": "#9d174d", "pink-900": "#831843", "pink-950": "#500724",
  "rose-50": "#fff1f2", "rose-100": "#ffe4e6", "rose-200": "#fecdd3", "rose-300": "#fda4af", "rose-400": "#fb7185", "rose-500": "#f43f5e", "rose-600": "#e11d48", "rose-700": "#be123c", "rose-800": "#9f1239", "rose-900": "#881337", "rose-950": "#4c051e",
  "white": "#ffffff", "black": "#000000", "transparent": "transparent", "current": "currentColor"
});

export function TailwindToCSS({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [tailwindInput, setTailwindInput] = useState(initialData?.tailwindInput || '');
  const [unitType, setUnitType] = useState<'rem' | 'px'>(initialData?.unitType || 'rem');
  const [useSelector, setUseSelector] = useState(!!initialData?.useSelector);
  const [selectorName, setSelectorName] = useState(initialData?.selectorName || '.my-custom-class');
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ tailwindInput, unitType, useSelector, selectorName });
  }, [tailwindInput, unitType, useSelector, selectorName, onStateChange]);

  // Clean spacing/sizing value back from Tailwind unit representation (e.g. 4 -> 1rem / 16px)
  const formatValue = useCallback((val: string, type: 'spacing' | 'fontSize' | 'borderRadius'): string => {
    const isNum = /^[0-9]+(\.[0-9]+)?$/.test(val);
    if (isNum) {
      const num = parseFloat(val);
      if (type === 'spacing') {
        const remVal = num * 0.25;
        return unitType === 'rem' ? `${remVal}rem` : `${remVal * 16}px`;
      }
    }

    if (val === 'px') {
      return unitType === 'rem' ? '0.0625rem' : '1px';
    }

    // Static dictionary overrides
    if (type === 'fontSize' && Object.prototype.hasOwnProperty.call(FONT_SIZES, val)) {
      const standardRemStr = FONT_SIZES[val];
      if (unitType === 'px' && standardRemStr.endsWith('rem')) {
        return `${parseFloat(standardRemStr) * 16}px`;
      }
      return standardRemStr;
    }

    if (type === 'borderRadius' && Object.prototype.hasOwnProperty.call(ROUNDED_MAP, val)) {
      const standardRemStr = ROUNDED_MAP[val];
      if (unitType === 'px' && standardRemStr.endsWith('rem')) {
        return `${parseFloat(standardRemStr) * 16}px`;
      }
      return standardRemStr;
    }

    return val;
  }, [unitType]);

  const convertTailwindToCSS = useCallback((input: string): string => {
    if (!input.trim()) return '';

    // Enforce maximum length limit to prevent client DoS
    const trimmedInput = input.slice(0, MAX_INPUT_LENGTH);

    // Regex match classes. They might be wrapped in quotes if copied from className="..."
    const classMatches = trimmedInput.match(/className="([^"]+)"/);
    const rawClassStr = classMatches ? classMatches[1] : trimmedInput;

    const tokens = rawClassStr.split(/\s+/).filter(Boolean);
    const cssRules: string[] = [];

    // Process each class token safely
    tokens.forEach((token) => {
      // 1. Check for standard static mapping
      if (Object.prototype.hasOwnProperty.call(REVERSE_STATIC, token)) {
        REVERSE_STATIC[token].forEach((rule) => cssRules.push(rule));
        return;
      }

      // 2. Check for arbitrary value syntax, e.g. p-[17px] or bg-[#ff0000]
      const arbitraryMatch = token.match(/^([a-z0-9-]+)-\[([^\]]+)\]$/i);
      if (arbitraryMatch) {
        const prefix = arbitraryMatch[1];
        const rawVal = arbitraryMatch[2].replace(/_/g, ' '); // Tailwind replaces space with underscore inside brackets

        if (Object.prototype.hasOwnProperty.call(REVERSE_PREFIX_MAP, prefix)) {
          const cssProp = REVERSE_PREFIX_MAP[prefix];
          cssRules.push(`${cssProp}: ${rawVal}`);
        } else if (prefix === 'bg') {
          cssRules.push(`background-color: ${rawVal}`);
        } else if (prefix === 'text') {
          // If the arbitrary value is a color, it's color. Otherwise font-size.
          if (rawVal.startsWith('#') || rawVal.startsWith('rgb') || rawVal.startsWith('hsl')) {
            cssRules.push(`color: ${rawVal}`);
          } else {
            cssRules.push(`font-size: ${rawVal}`);
          }
        } else if (prefix === 'border') {
          if (rawVal.startsWith('#') || rawVal.startsWith('rgb') || rawVal.startsWith('hsl')) {
            cssRules.push(`border-color: ${rawVal}`);
          } else {
            cssRules.push(`border-width: ${rawVal}`);
          }
        }
        return;
      }

      // 3. Dynamic mappings of prefix/shorthands
      // Sizing, spacing, borders, colours
      if (token.startsWith('bg-')) {
        const val = token.slice(3);
        if (Object.prototype.hasOwnProperty.call(TAILWIND_COLORS, val)) {
          cssRules.push(`background-color: ${TAILWIND_COLORS[val]}`);
        }
        return;
      }

      if (token.startsWith('text-')) {
        const val = token.slice(5);
        if (Object.prototype.hasOwnProperty.call(FONT_SIZES, val)) {
          cssRules.push(`font-size: ${formatValue(val, 'fontSize')}`);
        } else if (Object.prototype.hasOwnProperty.call(TAILWIND_COLORS, val)) {
          cssRules.push(`color: ${TAILWIND_COLORS[val]}`);
        }
        return;
      }

      if (token.startsWith('border-')) {
        const val = token.slice(7);
        if (val !== 't' && val !== 'r' && val !== 'b' && val !== 'l') {
          if (Object.prototype.hasOwnProperty.call(TAILWIND_COLORS, val)) {
            cssRules.push(`border-color: ${TAILWIND_COLORS[val]}`);
            return;
          } else if (/^[0-9]+$/.test(val)) {
            cssRules.push(`border-width: ${val}px`);
            return;
          }
        }
      }

      const sortedPrefixes = Object.keys(REVERSE_PREFIX_MAP).sort((a, b) => b.length - a.length);
      for (const prefix of sortedPrefixes) {
        if (token.startsWith(`${prefix}-`)) {
          const val = token.slice(prefix.length + 1);
          const cssProp = REVERSE_PREFIX_MAP[prefix];
          let resolvedVal = val;

          // Handle layout/spacing shorthands inside prefix looping
          if (prefix === 'px') {
            const spacingVal = formatValue(val, 'spacing');
            cssRules.push(`padding-left: ${spacingVal}`);
            cssRules.push(`padding-right: ${spacingVal}`);
            return;
          }
          if (prefix === 'py') {
            const spacingVal = formatValue(val, 'spacing');
            cssRules.push(`padding-top: ${spacingVal}`);
            cssRules.push(`padding-bottom: ${spacingVal}`);
            return;
          }
          if (prefix === 'mx') {
            const spacingVal = formatValue(val, 'spacing');
            cssRules.push(`margin-left: ${spacingVal}`);
            cssRules.push(`margin-right: ${spacingVal}`);
            return;
          }
          if (prefix === 'my') {
            const spacingVal = formatValue(val, 'spacing');
            cssRules.push(`margin-top: ${spacingVal}`);
            cssRules.push(`margin-bottom: ${spacingVal}`);
            return;
          }

          if (cssProp === 'width' && Object.prototype.hasOwnProperty.call(WIDTH_MAP, val)) {
            resolvedVal = WIDTH_MAP[val];
          } else if (cssProp === 'height' && Object.prototype.hasOwnProperty.call(HEIGHT_MAP, val)) {
            resolvedVal = HEIGHT_MAP[val];
          } else if (cssProp === 'font-size') {
            resolvedVal = formatValue(val, 'fontSize');
          } else if (cssProp === 'border-radius') {
            resolvedVal = formatValue(val, 'borderRadius');
          } else if (cssProp.startsWith('padding') || cssProp.startsWith('margin') || cssProp.includes('gap') || ['top', 'bottom', 'left', 'right'].includes(cssProp)) {
            resolvedVal = formatValue(val, 'spacing');
          }

          cssRules.push(`${cssProp}: ${resolvedVal}`);
          return;
        }
      }

      // Handle simple isolated border or rounded keywords
      if (token === 'border') {
        cssRules.push('border-width: 1px');
      } else if (token === 'rounded') {
        cssRules.push('border-radius: 0.25rem');
      }
    });

    if (cssRules.length === 0) return '';

    // Join with proper standard CSS indentation/structure
    const bodyStr = cssRules.map(rule => `  ${rule};`).join('\n');

    if (useSelector) {
      const cleanSelector = selectorName.trim() || '.my-custom-class';
      return `${cleanSelector} {\n${bodyStr}\n}`;
    }

    return cssRules.map(rule => `${rule};`).join('\n');
  }, [formatValue, useSelector, selectorName]);

  const cssOutput = useMemo(() => {
    return convertTailwindToCSS(tailwindInput);
  }, [tailwindInput, convertTailwindToCSS]);

  const handleCopy = useCallback(() => {
    if (!cssOutput) return;
    navigator.clipboard.writeText(cssOutput);
    setCopied(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [cssOutput, t]);

  const handleClear = useCallback(() => {
    setTailwindInput('');
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  }, [handleClear]);

  // Global keydown safely
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
      } else if (e.key.toLowerCase() === 'c' && cssOutput) {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleClear, handleCopy, cssOutput]);

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Unit selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">
              {t('unit_system', 'Output Unit')}
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl gap-1">
              <button
                onClick={() => setUnitType('rem')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${unitType === 'rem' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                REM
              </button>
              <button
                onClick={() => setUnitType('px')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${unitType === 'px' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                PX
              </button>
            </div>
          </div>

          {/* Selector toggle */}
          <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={useSelector}
              onChange={(e) => setUseSelector(e.target.checked)}
              className="w-5 h-5 text-indigo-600 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-bold block dark:text-white">
                {t('wrap_selector', 'Wrap in CSS Selector')}
              </span>
              <span className="text-xs text-slate-400">
                .my-class {'{ ... }'}
              </span>
            </div>
          </label>

          {/* Selector Name */}
          <div className="space-y-2">
            <label htmlFor="selector-name" className="text-xs font-bold text-slate-500 uppercase">
              {t('selector_name', 'Selector Name')}
            </label>
            <input
              id="selector-name"
              type="text"
              disabled={!useSelector}
              value={selectorName}
              onChange={(e) => setSelectorName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tailwind Input Side */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="tailwind-input" className="text-sm font-black uppercase tracking-widest text-slate-400">
              {t('tailwind_input_label', 'Tailwind Classes')}
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
            id="tailwind-input"
            ref={textareaRef}
            value={tailwindInput}
            onChange={(e) => setTailwindInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('tailwind_placeholder', "Paste Tailwind CSS classes here... e.g.\nflex items-center justify-between p-4 bg-blue-500 rounded-[12px] text-lg text-white font-bold")}
            className="w-full h-80 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none shadow-inner"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* CSS Output Side */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-widest text-slate-400">
              {t('css_output_label', 'CSS Declarations')}
            </span>
            <div className="flex items-center gap-2">
              {cssOutput && (
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
            <div className="flex-1 overflow-y-auto whitespace-pre pr-2">
              {cssOutput || (
                <span className="text-slate-500 italic">
                  {t('tailwind_empty_output', 'CSS rules will appear here...')}
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
            {t('tailwind_about_title', 'About Tailwind CSS to CSS Converter')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('tailwind_about_text', 'This utility reverse-engineers default Tailwind CSS classes back into standard CSS layout and design styles. It processes layouts (flex/grid), dimensions, padding, margins, borders, font weights, colors, positioning, and fully supports arbitrary square-bracket syntax (e.g. w-[250px]).')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            {t('csstotailwind.how_it_works', 'How it works')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Enter a space-separated string of Tailwind classes. The parser loops over standard prefixes, maps relative font-sizes and borders, translates colors into standard hexadecimal values, and maps relative units back into standard rem/pixel values.
          </p>
        </div>
      </div>
    </div>
  );
}
