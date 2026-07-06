import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, ArrowLeftRight, Download, FileCode, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as yaml from 'js-yaml';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function XmlYamlConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const xmlRef = useRef<HTMLTextAreaElement>(null);
  const yamlRef = useRef<HTMLTextAreaElement>(null);

  const [xmlInput, setXmlInput] = useState(initialData?.xml || '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item id="1">\n    <name>Item One</name>\n    <active>true</active>\n  </item>\n</root>');
  const [yamlInput, setYamlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedXml, setCopiedXml] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);

  const sanitizeKey = (key: string): string => {
    const dangerous = ['__proto__', 'constructor', 'prototype'];
    return dangerous.includes(key) ? `_${key}` : key;
  };

  const xmlToObj = (node: Node, depth: number): any => {
    if (depth > MAX_DEPTH) return null;

    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue?.trim();
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const obj = Object.create(null);
    const element = node as Element;

    // Attributes
    if (element.attributes.length > 0) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        obj[`@${sanitizeKey(attr.name)}`] = attr.value;
      }
    }

    // Children
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE && !child.nodeValue?.trim()) continue;

      const childResult = xmlToObj(child, depth + 1);
      if (childResult === null) continue;

      const key = sanitizeKey(child.nodeName);

      if (child.nodeType === Node.TEXT_NODE) {
          if (element.attributes.length === 0 && element.childNodes.length === 1) return childResult;
          obj['#text'] = childResult;
      } else {
          if (obj[key]) {
            if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
            obj[key].push(childResult);
          } else {
            obj[key] = childResult;
          }
      }
    }

    return obj;
  };

  const objToXml = (obj: any, rootName: string): string => {
    const doc = document.implementation.createDocument(null, rootName, null);
    const root = doc.documentElement;

    const build = (parent: Element, data: any) => {
      if (typeof data !== 'object' || data === null) {
        parent.textContent = String(data);
        return;
      }

      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('@')) {
          parent.setAttribute(key.slice(1), String(value));
        } else if (key === '#text') {
          parent.textContent = String(value);
        } else if (Array.isArray(value)) {
          value.forEach(item => {
            const child = doc.createElement(key);
            parent.appendChild(child);
            build(child, item);
          });
        } else {
          const child = doc.createElement(key);
          parent.appendChild(child);
          build(child, value);
        }
      }
    };

    build(root, obj);
    const serializer = new XMLSerializer();
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(doc);
  };

  const convertXmlToYaml = useCallback((input: string) => {
    try {
      if (!input.trim()) {
        setYamlInput('');
        setError(null);
        return;
      }

      if (input.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        setYamlInput('');
        return;
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(input, 'text/xml');
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid XML');
      }

      const obj: Record<string, any> = Object.create(null);
      const root = xmlDoc.documentElement;
      obj[root.nodeName] = xmlToObj(root, 0);

      setYamlInput(yaml.dump(obj));
      setError(null);
    } catch (e: any) {
      setError(`XML Error: ${e.message}`);
    }
  }, []);

  const convertYamlToXml = useCallback((input: string) => {
    try {
      if (!input.trim()) {
        setXmlInput('');
        setError(null);
        return;
      }

      if (input.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        setXmlInput('');
        return;
      }

      const parsed = yaml.load(input) as Record<string, any>;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('YAML must be an object at root level');
      }

      const rootKeys = Object.keys(parsed);
      if (rootKeys.length !== 1) {
        throw new Error('XML requires exactly one root element');
      }

      const rootName = rootKeys[0];
      setXmlInput(objToXml(parsed[rootName], rootName));
      setError(null);
    } catch (e: any) {
      setError(`YAML Error: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    convertXmlToYaml(xmlInput);
  }, []);

  useEffect(() => {
    onStateChange?.({ xml: xmlInput });
  }, [xmlInput]);

  const handleXmlChange = (val: string) => {
    setXmlInput(val);
    convertXmlToYaml(val);
  };

  const handleYamlChange = (val: string) => {
    setYamlInput(val);
    convertYamlToXml(val);
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(xmlInput);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(yamlInput);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const handleClear = () => {
    setXmlInput('');
    setYamlInput('');
    setError(null);
    xmlRef.current?.focus();
  };

  const handleDownload = (content: string, type: 'xml' | 'yaml') => {
    const blob = new Blob([content], { type: type === 'xml' ? 'text/xml' : 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data.${type}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-3 h-3" /> XML
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(xmlInput, 'xml')}
                disabled={!xmlInput}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopyXml}
                disabled={!xmlInput}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1 border ${
                  copiedXml
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copiedXml ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedXml ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            ref={xmlRef}
            value={xmlInput}
            onChange={(e) => handleXmlChange(e.target.value)}
            placeholder="<root>...</root>"
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-3 h-3" /> YAML
            </label>
            <div className="flex gap-2">
               <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
              <button
                onClick={() => handleDownload(yamlInput, 'yaml')}
                disabled={!yamlInput}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopyYaml}
                disabled={!yamlInput}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1 border ${
                  copiedYaml
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copiedYaml ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedYaml ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            ref={yamlRef}
            value={yamlInput}
            onChange={(e) => handleYamlChange(e.target.value)}
            placeholder="root: ..."
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-bold animate-pulse">
            <ArrowLeftRight className="w-3 h-3" />
            {t('common.bidirectional_sync', 'Bidirectional Sync Enabled')}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <Info className="w-4 h-4" /> {t('xml_yaml.about_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('xml_yaml.about_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <ArrowLeftRight className="w-4 h-4" /> {t('xml_yaml.tech_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('xml_yaml.tech_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
