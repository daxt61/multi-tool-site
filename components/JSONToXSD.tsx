import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileCode, Search, Copy, Check, Trash2, AlertCircle, Terminal, Download, Sparkles, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

function sanitizeName(name: string): string {
  if (!name) return 'Element';
  // XSD NCName regex constraint: start with letter or underscore, followed by letters, digits, underscores, hyphens, periods
  let sanitized = name.replace(/^[^a-zA-Z_]+/, '');
  sanitized = sanitized.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  return sanitized || 'Element';
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function inferType(value: any): string {
  if (value === null || value === undefined) return 'xs:string';
  if (typeof value === 'boolean') return 'xs:boolean';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'xs:integer' : 'xs:decimal';
  }
  if (typeof value === 'string') {
    // Check for ISO Date or DateTime
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'xs:date';
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'xs:dateTime';
    return 'xs:string';
  }
  return 'xs:string';
}

export function JSONToXSD({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [rootElement, setRootElement] = useState(initialData?.rootElement || 'Root');
  const [targetNamespace, setTargetNamespace] = useState(initialData?.targetNamespace || 'http://example.org/schema');
  const [xsdOutput, setXsdOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const jsonInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ jsonInput, rootElement, targetNamespace });
  }, [jsonInput, rootElement, targetNamespace, onStateChange]);

  const generateXsdForNode = useCallback((name: string, data: any, indentLevel: number = 2, depth: number = 0): string => {
    if (depth > MAX_DEPTH) {
      throw new Error(t('json_to_xsd.error_max_depth') || 'Maximum nesting depth exceeded');
    }

    const indent = ' '.repeat(indentLevel * 2);
    const elemName = sanitizeName(name);

    if (data === null || data === undefined) {
      return `${indent}<xs:element name="${elemName}" type="xs:string" nillable="true" />\n`;
    }

    if (typeof data !== 'object') {
      const type = inferType(data);
      return `${indent}<xs:element name="${elemName}" type="${type}" />\n`;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return `${indent}<xs:element name="${elemName}" minOccurs="0" maxOccurs="unbounded">\n` +
               `${indent}  <xs:complexType />\n` +
               `${indent}</xs:element>\n`;
      }

      // Infer structure from array items
      const sampleItem = data[0];
      if (typeof sampleItem !== 'object' || sampleItem === null) {
        const itemType = inferType(sampleItem);
        return `${indent}<xs:element name="${elemName}" type="${itemType}" minOccurs="0" maxOccurs="unbounded" />\n`;
      }

      // Array of objects
      let innerXsd = `${indent}<xs:element name="${elemName}" minOccurs="0" maxOccurs="unbounded">\n`;
      innerXsd += `${indent}  <xs:complexType>\n`;
      innerXsd += `${indent}    <xs:sequence>\n`;

      // Merge keys across objects if array contains multiple objects
      const mergedObj: Record<string, any> = {};
      for (const item of data) {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          Object.assign(mergedObj, item);
        }
      }

      const keysToUse = Object.keys(mergedObj).length > 0 ? mergedObj : sampleItem;
      for (const [key, val] of Object.entries(keysToUse)) {
        if (Object.prototype.hasOwnProperty.call(keysToUse, key)) {
          innerXsd += generateXsdForNode(key, val, indentLevel + 3, depth + 1);
        }
      }

      innerXsd += `${indent}    </xs:sequence>\n`;
      innerXsd += `${indent}  </xs:complexType>\n`;
      innerXsd += `${indent}</xs:element>\n`;
      return innerXsd;
    }

    // Single Object
    let objXsd = `${indent}<xs:element name="${elemName}">\n`;
    objXsd += `${indent}  <xs:complexType>\n`;
    objXsd += `${indent}    <xs:sequence>\n`;

    for (const [key, val] of Object.entries(data)) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        objXsd += generateXsdForNode(key, val, indentLevel + 3, depth + 1);
      }
    }

    objXsd += `${indent}    </xs:sequence>\n`;
    objXsd += `${indent}  </xs:complexType>\n`;
    objXsd += `${indent}</xs:element>\n`;
    return objXsd;
  }, [t]);

  const convertJsonToXsd = useCallback(() => {
    try {
      setError('');
      if (!jsonInput.trim()) {
        setXsdOutput('');
        return;
      }

      if (jsonInput.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      const parsed = JSON.parse(jsonInput);
      const rootName = sanitizeName(rootElement.trim() || 'Root');
      const ns = escapeXml(targetNamespace.trim() || 'http://example.org/schema');

      let xsd = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xsd += `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"\n`;
      xsd += `           targetNamespace="${ns}"\n`;
      xsd += `           xmlns="${ns}"\n`;
      xsd += `           elementFormDefault="qualified">\n\n`;

      xsd += generateXsdForNode(rootName, parsed, 1, 0);

      xsd += `</xs:schema>`;

      setXsdOutput(xsd);
    } catch (e: any) {
      setError((t('json_to_xsd.invalid_json') || 'Invalid JSON syntax') + ': ' + e.message);
      setXsdOutput('');
    }
  }, [jsonInput, rootElement, targetNamespace, generateXsdForNode, t]);

  useEffect(() => {
    if (jsonInput.trim()) {
      convertJsonToXsd();
    } else {
      setXsdOutput('');
    }
  }, [jsonInput, rootElement, targetNamespace, convertJsonToXsd]);

  const handleCopy = useCallback(() => {
    if (!xsdOutput) return;
    navigator.clipboard.writeText(xsdOutput);
    setCopied(true);
    toast.success(t('json_to_xsd.copied_toast') || 'XSD Schema copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [xsdOutput, t]);

  const handleClear = useCallback(() => {
    setJsonInput('');
    setXsdOutput('');
    setError('');
    toast.success(t('json_to_xsd.cleared_toast') || 'Inputs cleared!');
    jsonInputRef.current?.focus();
  }, [t]);

  const handlersRef = useRef({
    onCopy: handleCopy,
    onClear: handleClear,
  });

  useEffect(() => {
    handlersRef.current = {
      onCopy: handleCopy,
      onClear: handleClear,
    };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );

      if (isEditable) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handlersRef.current.onClear();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.onClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.onCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!xsdOutput) return;
    const blob = new Blob([xsdOutput], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeName(rootElement || 'schema')}.xsd`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('json_to_xsd.downloaded_toast') || 'XSD file downloaded!');
  };

  const presets = [
    {
      name: t('json_to_xsd.preset_order') || 'E-Commerce Order',
      root: 'Order',
      json: JSON.stringify({
        id: "ORD-98214",
        date: "2025-02-28",
        customer: {
          name: "John Doe",
          email: "john@example.com",
          premium: true
        },
        items: [
          { sku: "ITEM-01", title: "Wireless Headphones", quantity: 2, unitPrice: 79.99 },
          { sku: "ITEM-02", title: "USB-C Adapter", quantity: 1, unitPrice: 14.50 }
        ],
        totalAmount: 174.48
      }, null, 2)
    },
    {
      name: t('json_to_xsd.preset_user') || 'User Profile',
      root: 'UserProfile',
      json: JSON.stringify({
        userId: 1042,
        username: "jules_dev",
        role: "admin",
        active: true,
        attributes: {
          created: "2024-01-15T08:30:00",
          loginAttempts: 0
        }
      }, null, 2)
    }
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setRootElement(preset.root);
    setJsonInput(preset.json);
    toast.success(t('json_to_xsd.preset_loaded') || 'Preset applied successfully!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" role="region" aria-label={t('tool.json-to-xsd.name')}>
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Top Controls & Shortcuts Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 px-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            <label htmlFor="root-element-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('json_to_xsd.root_element') || 'Root Element'}
            </label>
            <input
              id="root-element-input"
              type="text"
              value={rootElement}
              onChange={(e) => setRootElement(e.target.value)}
              placeholder="Root"
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-mono dark:text-slate-200 w-32"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="target-namespace-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('json_to_xsd.target_namespace') || 'Target Namespace'}
            </label>
            <input
              id="target-namespace-input"
              type="text"
              value={targetNamespace}
              onChange={(e) => setTargetNamespace(e.target.value)}
              placeholder="http://example.org/schema"
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-mono dark:text-slate-200 w-52"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">Esc</Kbd>
            {t('common.clear')}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
            <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
            {t('common.copy')}
          </span>
          <button
            onClick={handleClear}
            disabled={!jsonInput && !xsdOutput}
            className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('json_to_xsd.json_input') || 'JSON Input'}
              </label>
            </div>
          </div>
          <textarea
            id="json-input"
            ref={jsonInputRef}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{\n  "id": 101,\n  "name": "Sample Order",\n  "active": true\n}'
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="xsd-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('json_to_xsd.xsd_output') || 'Generated XSD Schema'}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!xsdOutput}
                title={t('common.download') || 'Download'}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!xsdOutput}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="xsd-output"
            value={xsdOutput}
            readOnly
            placeholder={t('json_to_xsd.xsd_placeholder') || 'XSD Schema will appear here...'}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="space-y-4" role="group" aria-labelledby="json-to-xsd-presets-heading">
        <h4 id="json-to-xsd-presets-heading" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" /> {t('json_to_xsd.presets_title') || 'Quick Presets'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset)}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <div className="font-bold text-sm mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{preset.name}</div>
              <div className="font-mono text-xs text-slate-400 truncate">Root: &lt;{preset.root}&gt;</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
