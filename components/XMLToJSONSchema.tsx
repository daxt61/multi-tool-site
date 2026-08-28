import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Settings, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

const DRAFT_URLS: Record<string, string> = {
  'Draft-07': 'http://json-schema.org/draft-07/schema#',
  'Draft-04': 'http://json-schema.org/draft-04/schema#',
  'Draft-06': 'http://json-schema.org/draft-06/schema#',
  'Draft 2019-09': 'https://json-schema.org/draft/2019-09/schema',
  'Draft 2020-12': 'https://json-schema.org/draft/2020-12/schema',
};

interface Preset {
  name: string;
  xml: string;
}

const PRESETS: Preset[] = [
  {
    name: 'User Record XML',
    xml: `<user id="101" active="true">
  <username>alex_developer</username>
  <email>alex@example.com</email>
  <roles>
    <role>admin</role>
    <role>developer</role>
  </roles>
  <profile>
    <firstName>Alex</firstName>
    <lastName>Rivera</lastName>
  </profile>
</user>`
  },
  {
    name: 'Product Catalog XML',
    xml: `<catalog department="Electronics">
  <product id="PRD-001" price="49.99">
    <title>Wireless Headphones</title>
    <inStock>true</inStock>
    <tags>
      <tag>audio</tag>
      <tag>bluetooth</tag>
    </tags>
  </product>
  <product id="PRD-002" price="199.00">
    <title>Smart Watch</title>
    <inStock>false</inStock>
  </product>
</catalog>`
  },
  {
    name: 'Server Config XML',
    xml: `<configuration env="production">
  <server port="8080" ssl="true">
    <host>api.example.com</host>
    <timeoutMs>5000</timeoutMs>
  </server>
  <database poolSize="10">
    <driver>postgresql</driver>
    <connectionString>postgres://user:pass@localhost:5432/db</connectionString>
  </database>
</configuration>`
  }
];

const sanitizeKey = (key: string): string => {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return '_' + key;
  }
  return key;
};

const parsePrimitiveValue = (str: string): { type: string; val: any; format?: string } => {
  const trimmed = str.trim();
  if (trimmed === 'true' || trimmed === 'false') {
    return { type: 'boolean', val: trimmed === 'true' };
  }
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return { type: 'number', val: Number(trimmed) };
  }
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(trimmed)) {
    return { type: 'string', val: trimmed, format: 'date-time' };
  }
  return { type: 'string', val: trimmed };
};

function xmlToJsonObject(node: Node, depth: number = 0): any {
  if (depth > MAX_DEPTH) return null;

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const obj: any = Object.create(null);
    let hasChildren = false;

    // Attributes
    if (element.attributes.length > 0) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        const attrKey = sanitizeKey(`@${attr.name}`);
        obj[attrKey] = parsePrimitiveValue(attr.value).val;
        hasChildren = true;
      }
    }

    // Group child elements by tag name to infer arrays
    const childTagGroups: Record<string, Element[]> = Object.create(null);
    let textContent = '';

    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        const childElem = child as Element;
        const tagName = sanitizeKey(childElem.tagName);
        if (!childTagGroups[tagName]) {
          childTagGroups[tagName] = [];
        }
        childTagGroups[tagName].push(childElem);
        hasChildren = true;
      } else if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
        textContent += child.nodeValue || '';
      }
    }

    const tagEntries = Object.entries(childTagGroups);
    if (tagEntries.length > 0) {
      tagEntries.forEach(([tagName, group]) => {
        if (group.length > 1) {
          obj[tagName] = group.map((elem) => xmlToJsonObject(elem, depth + 1));
        } else {
          obj[tagName] = xmlToJsonObject(group[0], depth + 1);
        }
      });
      return obj;
    }

    if (!hasChildren) {
      const parsed = parsePrimitiveValue(textContent);
      return parsed.val;
    }

    if (textContent.trim()) {
      obj['#text'] = parsePrimitiveValue(textContent).val;
    }

    return obj;
  }

  return null;
}

export function XMLToJSONSchema({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  const [xmlInput, setXmlInput] = useState(initialData?.xmlInput || '');
  const [draftVersion, setDraftVersion] = useState<string>(initialData?.draftVersion || 'Draft-07');
  const [requiredMode, setRequiredMode] = useState<'auto' | 'optional'>(initialData?.requiredMode || 'auto');
  const [additionalProperties, setAdditionalProperties] = useState<boolean>(initialData?.additionalProperties ?? true);
  const [includeDefaults, setIncludeDefaults] = useState<boolean>(initialData?.includeDefaults ?? false);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({
      xmlInput,
      draftVersion,
      requiredMode,
      additionalProperties,
      includeDefaults,
    });
  }, [xmlInput, draftVersion, requiredMode, additionalProperties, includeDefaults, onStateChange]);

  const generateSchemaFromObj = useCallback((obj: any, depth: number = 0): any => {
    if (depth > MAX_DEPTH) {
      return { type: 'object', description: 'Maximum depth reached' };
    }

    if (obj === null || obj === undefined) {
      return { type: 'null' };
    }

    const type = typeof obj;

    if (Array.isArray(obj)) {
      const items = obj.length > 0 ? generateSchemaFromObj(obj[0], depth + 1) : {};
      const schema: any = {
        type: 'array',
        items,
      };
      if (includeDefaults) {
        schema.default = [];
      }
      return schema;
    }

    if (type === 'object') {
      const properties: any = Object.create(null);
      const required: string[] = [];

      Object.entries(obj).forEach(([rawKey, value]) => {
        const key = sanitizeKey(rawKey);
        properties[key] = generateSchemaFromObj(value, depth + 1);
        if (requiredMode === 'auto') {
          required.push(key);
        }
      });

      const schema: any = {
        type: 'object',
        properties,
      };

      if (required.length > 0) {
        schema.required = required;
      }

      if (!additionalProperties) {
        schema.additionalProperties = false;
      }

      if (includeDefaults) {
        schema.default = {};
      }

      return schema;
    }

    const schema: any = { type };

    if (type === 'string' && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(obj)) {
      schema.format = 'date-time';
    }

    if (includeDefaults) {
      if (type === 'string') schema.default = '';
      else if (type === 'number') schema.default = 0;
      else if (type === 'boolean') schema.default = false;
    }

    return schema;
  }, [requiredMode, additionalProperties, includeDefaults]);

  const schemaResult = useMemo(() => {
    if (!xmlInput.trim()) {
      return '';
    }

    try {
      if (xmlInput.length > MAX_LENGTH) {
        setError(t('xmltojsonschema.error_max_length', { max: MAX_LENGTH.toLocaleString() }));
        return '';
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlInput, 'application/xml');

      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        setError(t('xmltojsonschema.error_xml_parse', 'Invalid XML syntax') + ': ' + (parserError.textContent || 'XML parse error'));
        return '';
      }

      const rootElement = doc.documentElement;
      if (!rootElement) {
        setError(t('xmltojsonschema.error_no_root', 'No root XML element found'));
        return '';
      }

      setError(null);
      const convertedObj = Object.create(null);
      const rootTagName = sanitizeKey(rootElement.tagName);
      convertedObj[rootTagName] = xmlToJsonObject(rootElement, 0);

      const schema = {
        $schema: DRAFT_URLS[draftVersion] || DRAFT_URLS['Draft-07'],
        title: `${rootTagName} Schema`,
        ...generateSchemaFromObj(convertedObj, 0)
      };

      return JSON.stringify(schema, null, 2);
    } catch (e: any) {
      setError(e.message);
      return '';
    }
  }, [xmlInput, draftVersion, generateSchemaFromObj, t]);

  const handleCopy = useCallback(() => {
    if (!schemaResult) return;
    navigator.clipboard.writeText(schemaResult);
    setCopied(true);
    toast.success(t('xmltojsonschema.toast_copied', 'Copied JSON Schema to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [schemaResult, t]);

  const handleClear = useCallback(() => {
    setXmlInput('');
    setError(null);
    toast.success(t('xmltojsonschema.toast_cleared', 'Inputs cleared'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!schemaResult) return;
    const blob = new Blob([schemaResult], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'xml-schema.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('xmltojsonschema.toast_downloaded', 'Downloaded schema.json'));
  };

  const handleApplyPreset = (preset: Preset) => {
    setXmlInput(preset.xml);
    toast.success(t('xmltojsonschema.toast_preset', 'Applied preset: ') + preset.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Configuration Card */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Settings className="w-4 h-4 text-indigo-500" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('xmltojsonschema.options_title', 'XML to Schema Configuration')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Draft version selection */}
          <div className="space-y-2">
            <label htmlFor="draft-version-select" className="text-xs font-bold text-slate-500 px-1">
              {t('xmltojsonschema.draft_version', 'Draft Version')}
            </label>
            <select
              id="draft-version-select"
              value={draftVersion}
              onChange={(e) => setDraftVersion(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-sm text-slate-700 dark:text-slate-200"
            >
              {Object.keys(DRAFT_URLS).map((ver) => (
                <option key={ver} value={ver}>
                  {ver}
                </option>
              ))}
            </select>
          </div>

          {/* Required Fields Mode */}
          <div className="space-y-2">
            <label htmlFor="required-mode-auto" className="text-xs font-bold text-slate-500 px-1">
              {t('xmltojsonschema.required_mode', 'Required Fields Mode')}
            </label>
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                id="required-mode-auto"
                type="button"
                onClick={() => setRequiredMode('auto')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  requiredMode === 'auto' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t('xmltojsonschema.req_auto', 'All Required')}
              </button>
              <button
                id="required-mode-optional"
                type="button"
                onClick={() => setRequiredMode('optional')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  requiredMode === 'optional' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t('xmltojsonschema.req_optional', 'All Optional')}
              </button>
            </div>
          </div>
        </div>

        {/* Option Toggles */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setAdditionalProperties(!additionalProperties)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              additionalProperties
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {additionalProperties ? <Check className="w-4 h-4 inline mr-1" /> : null} {t('xmltojsonschema.additional_properties', 'Allow additional properties')}
          </button>
          <button
            type="button"
            onClick={() => setIncludeDefaults(!includeDefaults)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              includeDefaults
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {includeDefaults ? <Check className="w-4 h-4 inline mr-1" /> : null} {t('xmltojsonschema.include_defaults', 'Include default values')}
          </button>
        </div>

        {/* Presets */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('xmltojsonschema.presets_title', 'Quick Start XML Presets')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 transition-all shadow-sm"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="xml-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <FileCode className="w-4 h-4 text-indigo-500" /> {t('xmltojsonschema.input_label', 'Input XML')}
            </label>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">
                Esc
              </Kbd>
              <button
                type="button"
                onClick={handleClear}
                disabled={!xmlInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear', 'Clear')}
              </button>
            </div>
          </div>
          <div className="relative group">
            <textarea
              id="xml-input"
              ref={inputRef}
              value={xmlInput}
              onChange={(e) => setXmlInput(e.target.value)}
              placeholder={`<user id="1">\n  <name>Alice</name>\n  <email>alice@example.com</email>\n</user>`}
              className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${
                error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              } rounded-[2rem] outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
            />
          </div>
        </div>

        {/* Output Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-schema-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <FileCode className="w-4 h-4 text-indigo-500" /> {t('xmltojsonschema.output_label', 'Generated JSON Schema')}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!schemaResult}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" /> {t('common.download', 'Download')}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!schemaResult}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-6 h-[500px] overflow-auto border border-slate-800 shadow-xl shadow-indigo-500/5">
            <pre id="json-schema-output" className="text-sm font-mono text-indigo-400 leading-relaxed">
              {schemaResult || <span className="text-slate-600 italic">{t('xmltojsonschema.placeholder_output', 'Generated JSON Schema will appear here...')}</span>}
            </pre>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
        </div>
      )}

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <FileCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('xmltojsonschema.about_title', 'About XML to JSON Schema')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'xmltojsonschema.about_text',
              'Convert raw XML structure documents into standardized JSON Schema Draft specifications. Attributes are preserved as @attribute properties and repeated tags are grouped into typed arrays.'
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('xmltojsonschema.how_title', 'How it works')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'xmltojsonschema.how_text',
              'The tool uses browser-native DOMParser to recursively convert XML elements, attributes, child nodes, and arrays into inferred JSON types (string, number, boolean, date-time).'
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('xmltojsonschema.use_title', 'Use Cases')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'xmltojsonschema.use_text',
              'Ideal for migrating legacy XML SOAP / REST APIs to JSON endpoints, inferring structural schemas for validation, and generating API documentation contracts.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
