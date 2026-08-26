import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Copy, Check, Trash2, ArrowRightLeft, FileCode, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

interface PresetsType {
  name: string;
  svg: string;
}

const PRESETS: PresetsType[] = [
  {
    name: 'Home Icon',
    svg: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="#4f46e5" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
  <polyline points="9 22 9 12 15 12 15 22"></polyline>
</svg>`
  },
  {
    name: 'Star Icon',
    svg: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="#eab308" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
</svg>`
  },
  {
    name: 'Settings Icon',
    svg: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="#64748b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="3"></circle>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
</svg>`
  },
  {
    name: 'Heart Icon',
    svg: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="#f43f5e" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
</svg>`
  }
];

const ATTRIBUTE_MAP: Record<string, string> = {
  'accent-height': 'accentHeight',
  'accept-charset': 'acceptCharset',
  'alignment-baseline': 'alignmentBaseline',
  'allow-reorder': 'allowReorder',
  'arabic-form': 'arabicForm',
  'attribute-name': 'attributeName',
  'attribute-type': 'attributeType',
  'auto-reverse': 'autoReorder',
  'base-frequency': 'baseFrequency',
  'base-profile': 'baseProfile',
  'baseline-shift': 'baselineShift',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'color-interpolation': 'colorInterpolation',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'color-profile': 'colorProfile',
  'color-rendering': 'colorRendering',
  'content-script-type': 'contentScriptType',
  'content-style-type': 'contentStyleType',
  'cursor': 'cursor',
  'cx': 'cx',
  'cy': 'cy',
  'd': 'd',
  'diffuse-constant': 'diffuseConstant',
  'direction': 'direction',
  'display': 'display',
  'divisor': 'divisor',
  'dominant-baseline': 'dominantBaseline',
  'edge-mode': 'edgeMode',
  'elevation': 'elevation',
  'enable-background': 'enableBackground',
  'external-resources-required': 'externalResourcesRequired',
  'fill': 'fill',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'filter': 'filter',
  'filter-res': 'filterRes',
  'filter-units': 'filterUnits',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-size-adjust': 'fontSizeAdjust',
  'font-stretch': 'fontSizeAdjust',
  'font-style': 'fontStyle',
  'font-variant': 'fontVariant',
  'font-weight': 'fontWeight',
  'format': 'format',
  'from': 'from',
  'fx': 'fx',
  'fy': 'fy',
  'g1': 'g1',
  'g2': 'g2',
  'glyph-name': 'glyphName',
  'glyph-orientation-horizontal': 'glyphOrientationHorizontal',
  'glyph-orientation-vertical': 'glyphOrientationVertical',
  'glyph-ref': 'glyphRef',
  'gradient-transform': 'gradientTransform',
  'gradient-units': 'gradientUnits',
  'hanging': 'hanging',
  'height': 'height',
  'horiz-adv-x': 'horizAdvX',
  'horiz-origin-x': 'horizOriginX',
  'image-rendering': 'imageRendering',
  'in': 'in',
  'in2': 'in2',
  'intercept': 'intercept',
  'k': 'k',
  'k1': 'k1',
  'k2': 'k2',
  'k3': 'k3',
  'k4': 'k4',
  'kernel-matrix': 'kernelMatrix',
  'kernel-unit-length': 'kernelUnitLength',
  'kerning': 'kerning',
  'key-points': 'keyPoints',
  'key-splines': 'keySplines',
  'key-times': 'keyTimes',
  'length-adjust': 'lengthAdjust',
  'letter-spacing': 'letterSpacing',
  'lighting-color': 'lightingColor',
  'limiting-cone-angle': 'limitingConeAngle',
  'local': 'local',
  'marker-end': 'markerEnd',
  'marker-mid': 'markerMid',
  'marker-start': 'markerStart',
  'marker-height': 'markerHeight',
  'marker-units': 'markerUnits',
  'marker-width': 'markerWidth',
  'mask': 'mask',
  'mask-content-units': 'maskContentUnits',
  'mask-units': 'maskUnits',
  'mathematical': 'mathematical',
  'mode': 'mode',
  'num-octaves': 'numOctaves',
  'opacity': 'opacity',
  'operator': 'operator',
  'order': 'order',
  'orient': 'orient',
  'orientation': 'orientation',
  'origin': 'origin',
  'overflow': 'overflow',
  'overline-position': 'overlinePosition',
  'overline-thickness': 'overlineThickness',
  'paint-order': 'paintOrder',
  'panose-1': 'panose1',
  'path-length': 'pathLength',
  'pattern-content-units': 'patternContentUnits',
  'pattern-transform': 'patternTransform',
  'pattern-units': 'patternUnits',
  'pointer-events': 'pointerEvents',
  'points': 'points',
  'points-at-x': 'pointsAtX',
  'points-at-y': 'pointsAtY',
  'points-at-z': 'pointsAtZ',
  'preserve-alpha': 'preserveAlpha',
  'preserve-aspect-ratio': 'preserveAspectRatio',
  'primitive-units': 'primitiveUnits',
  'r': 'r',
  'radius': 'radius',
  'ref-x': 'refX',
  'ref-y': 'refY',
  'rendering-intent': 'renderingRendering',
  'repeat-count': 'repeatCount',
  'repeat-dur': 'repeatDur',
  'required-extensions': 'requiredExtensions',
  'required-features': 'requiredFeatures',
  'restart': 'restart',
  'result': 'result',
  'rotate': 'rotate',
  'rx': 'rx',
  'ry': 'ry',
  'scale': 'scale',
  'seed': 'seed',
  'shape-rendering': 'shapeRendering',
  'slope': 'slope',
  'spacing': 'spacing',
  'specular-constant': 'specularConstant',
  'specular-exponent': 'specularExponent',
  'speed': 'speed',
  'spread-method': 'spreadMethod',
  'start-offset': 'startOffset',
  'std-deviation': 'stdDeviation',
  'stemh': 'stemh',
  'stemv': 'stemv',
  'stitch-tiles': 'stitchTiles',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'strikethrough-position': 'strikethroughPosition',
  'strikethrough-thickness': 'strikethroughThickness',
  'string': 'string',
  'stroke': 'stroke',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-opacity': 'strokeOpacity',
  'stroke-width': 'strokeWidth',
  'surface-scale': 'surfaceScale',
  'system-language': 'systemLanguage',
  'table-values': 'tableValues',
  'target-x': 'targetX',
  'target-y': 'targetY',
  'text-anchor': 'textAnchor',
  'text-decoration': 'textDecoration',
  'text-rendering': 'textRendering',
  'text-length': 'textLength',
  'to': 'to',
  'transform': 'transform',
  'u1': 'u1',
  'u2': 'u2',
  'underline-position': 'underlinePosition',
  'underline-thickness': 'underlineThickness',
  'unicode': 'unicode',
  'unicode-bidi': 'unicodeBidi',
  'unicode-range': 'unicodeRange',
  'units-per-em': 'unitsPerEm',
  'v-alphabetic': 'vAlphabetic',
  'v-mathematical': 'vMathematical',
  'v-hanging': 'vHanging',
  'v-ideographic': 'vIdeographic',
  'view-box': 'viewBox',
  'viewBox': 'viewBox',
  'visibility': 'visibility',
  'width': 'width',
  'widths': 'widths',
  'word-spacing': 'wordSpacing',
  'writing-mode': 'writingMode',
  'x': 'x',
  'x-channel-selector': 'xChannelSelector',
  'x1': 'x1',
  'x2': 'x2',
  'xmlns': 'xmlns',
  'y': 'y',
  'y-channel-selector': 'yChannelSelector',
  'y1': 'y1',
  'y2': 'y2',
  'z': 'z',
  'zoom-and-pan': 'zoomAndPan'
};

const DANGEROUS_ATTRIBUTES = ['__proto__', 'constructor', 'prototype', 'onmouseover', 'onclick', 'onerror'];

function SafeSvgPreview({ svgString }: { svgString: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgEl = doc.documentElement;
      if (svgEl && svgEl.nodeName.toLowerCase() === 'svg' && !doc.querySelector('parsererror')) {
        svgEl.querySelectorAll('script, style').forEach(el => el.remove());

        const sanitizeNode = (node: Element) => {
          const attrsToRemove: string[] = [];
          for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            if (attr.name.startsWith('on') || attr.value.toLowerCase().includes('javascript:')) {
              attrsToRemove.push(attr.name);
            }
          }
          attrsToRemove.forEach(a => node.removeAttribute(a));
          Array.from(node.children).forEach(sanitizeNode);
        };
        sanitizeNode(svgEl);

        svgEl.setAttribute('width', '16');
        svgEl.setAttribute('height', '16');

        containerRef.current.replaceChildren(svgEl);
      }
    } catch {
      // Fallback
    }
  }, [svgString]);

  return <span ref={containerRef} className="w-4 h-4 inline-flex items-center justify-center flex-shrink-0" />;
}

export function SVGToReact({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [svgInput, setSvgInput] = useState(initialData?.svg || PRESETS[0].svg);
  const [componentName, setComponentName] = useState(initialData?.componentName || 'SvgComponent');
  const [language, setLanguage] = useState<'typescript' | 'javascript'>(initialData?.language || 'typescript');
  const [platform, setPlatform] = useState<'web' | 'native'>(initialData?.platform || 'web');
  const [useForwardRef, setUseForwardRef] = useState(initialData?.useForwardRef ?? true);
  const [useReactMemo, setUseReactMemo] = useState(initialData?.useReactMemo ?? false);
  const [replaceColors, setReplaceColors] = useState(initialData?.replaceColors ?? true);
  const [customSize, setCustomSize] = useState(initialData?.customSize ?? true);

  const [outputCode, setOutputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClear = useCallback(() => {
    setSvgInput('');
    setOutputCode('');
    setError(null);
    textareaRef.current?.focus();
  }, []);

  const camelCaseAttribute = (attrName: string): string => {
    if (DANGEROUS_ATTRIBUTES.includes(attrName)) {
      return '';
    }
    return ATTRIBUTE_MAP[attrName] || attrName;
  };

  const cleanColor = (val: string): string => {
    const clean = val.trim();
    if (replaceColors && clean && clean !== 'none' && clean !== 'transparent' && !clean.startsWith('url')) {
      return 'currentColor';
    }
    return clean;
  };

  const convertSvgToReact = useCallback(() => {
    if (!svgInput.trim()) {
      setOutputCode('');
      setError(null);
      return;
    }

    if (svgInput.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutputCode('');
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgInput.trim(), 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error(parserError.textContent || 'Invalid SVG XML');
      }

      const svgNode = doc.documentElement;
      if (svgNode.nodeName.toLowerCase() !== 'svg') {
        throw new Error('Root element must be <svg>');
      }

      // Track react-native-svg components needed
      const nativeImports = new Set<string>();

      const serializeNode = (node: Element, indent: string = '    '): string => {
        const tagNameRaw = node.nodeName.toLowerCase();
        if (tagNameRaw === 'style' || tagNameRaw === 'script') {
          return ''; // Ignore inline scripts and CSS styles for safety and simplicity
        }

        let tagName = node.nodeName;
        if (platform === 'native') {
          // React Native Svg Tag Mapping
          const rnName = tagNameRaw.charAt(0).toUpperCase() + tagNameRaw.slice(1);
          if (rnName === 'Svg') {
            tagName = 'Svg';
          } else {
            tagName = rnName;
            nativeImports.add(rnName);
          }
        }

        const attrs: string[] = [];
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          const attrName = attr.name.toLowerCase();

          if (DANGEROUS_ATTRIBUTES.includes(attrName)) continue;

          let propName = camelCaseAttribute(attr.name);
          if (!propName) continue;

          let propVal = attr.value;

          // Process dimensions if size override is active
          if (customSize && (attrName === 'width' || attrName === 'height') && tagNameRaw === 'svg') {
            propVal = `{size || ${isNaN(Number(propVal)) ? `'${propVal}'` : propVal}}`;
          } else if (attrName === 'fill' || attrName === 'stroke') {
            propVal = cleanColor(propVal);
          }

          if (propVal.startsWith('{') && propVal.endsWith('}')) {
            attrs.push(`${propName}=${propVal}`);
          } else {
            attrs.push(`${propName}="${propVal.replace(/"/g, '&quot;')}"`);
          }
        }

        // Add spread props to root element
        if (tagNameRaw === 'svg') {
          if (platform === 'web') {
            attrs.push('{...props}');
          } else if (platform === 'native') {
            attrs.push('{...props}');
          }
        }

        const children: string[] = [];
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          if (child.nodeType === Node.ELEMENT_NODE) {
            const childStr = serializeNode(child as Element, indent + '  ');
            if (childStr) children.push(childStr);
          }
        }

        const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
        if (children.length > 0) {
          return `${indent}<${tagName}${attrsStr}>\n${children.join('\n')}\n${indent}</${tagName}>`;
        } else {
          return `${indent}<${tagName}${attrsStr} />`;
        }
      };

      const svgContent = serializeNode(svgNode);

      // Assemble final code
      let code = '';

      // 1. Imports
      if (platform === 'web') {
        if (language === 'typescript') {
          if (useForwardRef) {
            code += `import React, { forwardRef${useReactMemo ? ', memo' : ''} } from 'react';\n\n`;
          } else {
            code += `import React${useReactMemo ? ', { memo }' : ''} from 'react';\n\n`;
          }
          if (customSize) {
            code += `interface SvgProps extends React.SVGProps<SVGSVGElement> {\n  size?: number | string;\n}\n\n`;
          } else {
            code += `interface SvgProps extends React.SVGProps<SVGSVGElement> {}\n\n`;
          }
        } else {
          if (useForwardRef) {
            code += `import React, { forwardRef${useReactMemo ? ', memo' : ''} } from 'react';\n\n`;
          } else {
            code += `import React${useReactMemo ? ', { memo }' : ''} from 'react';\n\n`;
          }
        }
      } else {
        // native platform
        const importsList = Array.from(nativeImports).sort();
        if (language === 'typescript') {
          code += `import React${useReactMemo ? ', { memo }' : ''} from 'react';\n`;
          code += `import Svg, { SvgProps${importsList.length > 0 ? ', ' + importsList.join(', ') : ''} } from 'react-native-svg';\n\n`;
          if (customSize) {
            code += `interface CustomSvgProps extends SvgProps {\n  size?: number | string;\n}\n\n`;
          }
        } else {
          code += `import React${useReactMemo ? ', { memo }' : ''} from 'react';\n`;
          code += `import Svg, { ${importsList.length > 0 ? importsList.join(', ') + ', ' : ''}SvgProps } from 'react-native-svg';\n\n`;
        }
      }

      // 2. Component signature
      const propsType = platform === 'web'
        ? (language === 'typescript' ? 'SvgProps' : '')
        : (language === 'typescript' ? (customSize ? 'CustomSvgProps' : 'SvgProps') : '');

      const propsDecl = propsType ? `props: ${propsType}` : 'props';
      const sizeParam = customSize ? `, size = 24` : '';
      const sizeDestruct = customSize ? `{ size, ...props }` : 'props';

      let componentBody = '';
      if (useForwardRef && platform === 'web') {
        const refType = language === 'typescript' ? '<SVGSVGElement, SvgProps>' : '';
        const bodyProps = customSize ? `{ size, ...props }` : 'props';
        componentBody = `const ${componentName} = forwardRef${refType}((${bodyProps}, ref) => {\n  return (\n${svgContent.replace(' {...props}', ' ref={ref} {...props}')}\n  );\n});`;
      } else {
        const destructuredProps = customSize ? `{ size, ...props }` : 'props';
        const finalPropsDecl = language === 'typescript' ? `(${destructuredProps}: ${propsType})` : `(${destructuredProps})`;
        componentBody = `const ${componentName} = ${finalPropsDecl} => {\n  return (\n${svgContent}\n  );\n};`;
      }

      code += componentBody + '\n\n';

      // 3. Export
      let exportDecl = '';
      if (useReactMemo) {
        exportDecl = `export default memo(${componentName});`;
      } else {
        exportDecl = `export default ${componentName};`;
      }
      code += exportDecl;

      setOutputCode(code);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error converting SVG to React');
    }
  }, [svgInput, componentName, language, platform, useForwardRef, useReactMemo, replaceColors, customSize, t]);

  useEffect(() => {
    convertSvgToReact();
  }, [svgInput, componentName, language, platform, useForwardRef, useReactMemo, replaceColors, customSize, convertSvgToReact]);

  useEffect(() => {
    onStateChange?.({
      svg: svgInput,
      componentName,
      language,
      platform,
      useForwardRef,
      useReactMemo,
      replaceColors,
      customSize
    });
  }, [svgInput, componentName, language, platform, useForwardRef, useReactMemo, replaceColors, customSize, onStateChange]);

  const handleCopy = useCallback(() => {
    if (!outputCode) return;
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [outputCode, t]);

  const handleLoadPreset = (presetSvg: string) => {
    setSvgInput(presetSvg);
    toast.success(t('common.reset'));
  };

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

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div role="alert" className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Preset Row */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('svg_to_react.presets_title')}</h4>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleLoadPreset(preset.svg)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:border-indigo-500 transition-all text-slate-700 dark:text-slate-300"
            >
              <SafeSvgPreview svgString={preset.svg} />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="svg-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('svg_to_react.input_label')}
              </label>
              <button
                onClick={handleClear}
                disabled={!svgInput}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              </button>
            </div>
            <textarea
              id="svg-input"
              ref={textareaRef}
              value={svgInput}
              onChange={(e) => setSvgInput(e.target.value)}
              placeholder={t('svg_to_react.placeholder')}
              className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xs leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          {/* Configuration */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('svg_to_react.options_title')}</h4>

            {/* Component Name */}
            <div className="space-y-2">
              <label htmlFor="comp-name" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                {t('svg_to_react.component_name')}
              </label>
              <input
                id="comp-name"
                type="text"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
              />
            </div>

            {/* Language */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">{t('svg_to_react.language_label')}</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'typescript', label: 'TypeScript (TSX)' },
                  { id: 'javascript', label: 'JavaScript (JSX)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setLanguage(opt.id as any)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${language === opt.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 hover:border-indigo-500'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Platform */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">{t('svg_to_react.platform_label')}</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'web', label: t('svg_to_react.platform_web') },
                  { id: 'native', label: t('svg_to_react.platform_native') }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setPlatform(opt.id as any)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${platform === opt.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 hover:border-indigo-500'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-4 pt-2">
              {platform === 'web' && (
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useForwardRef}
                    onChange={(e) => setUseForwardRef(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('svg_to_react.forward_ref')}</span>
                </label>
              )}

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useReactMemo}
                  onChange={(e) => setUseReactMemo(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('svg_to_react.react_memo')}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={replaceColors}
                  onChange={(e) => setReplaceColors(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('svg_to_react.replace_colors')}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={customSize}
                  onChange={(e) => setCustomSize(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('svg_to_react.custom_size')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Output panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('svg_to_react.output_label')}
            </label>
            <button
              onClick={handleCopy}
              disabled={!outputCode}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'text-indigo-600 dark:text-indigo-400 border-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              } disabled:opacity-50`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <textarea
            readOnly
            value={outputCode}
            placeholder={t('svg_to_react.output_placeholder')}
            className="w-full h-[620px] p-6 bg-slate-900 text-indigo-400 border border-slate-800 rounded-3xl outline-none font-mono text-xs leading-relaxed resize-none shadow-inner"
          />
        </div>
      </div>

      {/* Info & Education */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <Info className="w-4 h-4" /> {t('svg_to_react.about_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('svg_to_react.about_text_1')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <Sparkles className="w-4 h-4" /> Features & Conversions
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('svg_to_react.about_text_2')}
          </p>
        </div>
      </div>
    </div>
  );
}
