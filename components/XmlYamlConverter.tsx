import { useState, useEffect, useCallback } from 'react';
import { FileCode, ArrowLeftRight, Copy, Check, Trash2, Download, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import yaml from 'js-yaml';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function XmlYamlConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [direction, setDirection] = useState<'xml-to-yaml' | 'yaml-to-xml'>(initialData?.direction || 'xml-to-yaml');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, direction });
  }, [input, output, direction, onStateChange]);

  const sanitizeKey = (key: string) => {
    const lower = key.toLowerCase();
    if (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') {
      return `_${key}`;
    }
    return key;
  };

  const escapeXml = (unsafe: any) => {
    if (typeof unsafe !== 'string') return String(unsafe);
    return unsafe.replace(/[<>&"']/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&apos;';
        default: return c;
      }
    });
  };

  const xmlToObj = (node: Node, depth = 0): any => {
    if (depth > MAX_DEPTH) return null;
    if (node.nodeType === Node.TEXT_NODE) return node.textContent?.trim();
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const obj: any = Object.create(null);
    const element = node as Element;

    if (element.attributes.length > 0) {
      obj['@attributes'] = Object.create(null);
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        obj['@attributes'][sanitizeKey(attr.name)] = attr.value;
      }
    }

    let hasElementChild = false;
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        hasElementChild = true;
        const name = sanitizeKey((child as Element).tagName);
        const value = xmlToObj(child, depth + 1);
        if (value !== null) {
          if (obj[name]) {
            if (!Array.isArray(obj[name])) obj[name] = [obj[name]];
            obj[name].push(value);
          } else {
            obj[name] = value;
          }
        }
      }
    }

    if (!hasElementChild) {
      const text = element.textContent?.trim();
      if (Object.keys(obj).length === 0) return text || "";
      if (text) obj['#text'] = text;
      return obj;
    }

    return obj;
  };

  const objToXml = (o: any, tab = '', depth = 0): string => {
    if (depth > MAX_DEPTH) return `${tab}<!-- Max depth reached -->\n`;
    let xml = '';
    for (const key in o) {
      if (Object.prototype.hasOwnProperty.call(o, key)) {
        if (key === '@attributes' || key === '#text') continue;
        const val = o[key];
        const cleanKey = escapeXml(key);
        if (Array.isArray(val)) {
          for (const item of val) {
            xml += `${tab}<${cleanKey}>${typeof item === 'object' ? '\n' + objToXml(item, tab + '  ', depth + 1) + tab : escapeXml(item)}</${cleanKey}>\n`;
          }
        } else if (typeof val === 'object' && val !== null) {
          xml += `${tab}<${cleanKey}>\n${objToXml(val, tab + '  ', depth + 1)}${tab}</${cleanKey}>\n`;
        } else {
          xml += `${tab}<${cleanKey}>${escapeXml(val)}</${cleanKey}>\n`;
        }
      }
    }
    return xml;
  };

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }

    try {
      setError(null);
      if (direction === 'xml-to-yaml') {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(input, 'application/xml');
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) throw new Error('XML parsing error');
        const obj = xmlToObj(xmlDoc.documentElement);
        setOutput(yaml.dump(obj));
      } else {
        const obj = yaml.load(input);
        const xmlContent = objToXml(obj, '  ', 0);
        setOutput(`<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${xmlContent}</root>`);
      }
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  }, [input, direction, t]);

  const handleSwap = () => {
    setDirection(direction === 'xml-to-yaml' ? 'yaml-to-xml' : 'xml-to-yaml');
    setInput(output);
    setOutput(input);
    setError(null);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const ext = direction === 'xml-to-yaml' ? 'yaml' : 'xml';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="input-field" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {direction === 'xml-to-yaml' ? t('common.input') + ' XML' : t('common.input') + ' YAML'}
            </label>
            <button onClick={() => {setInput(''); setOutput(''); setError(null);}} className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1 rounded-lg transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            id="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-4 items-center">
          <button onClick={handleSwap} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-all group">
            <ArrowLeftRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 group-hover:rotate-180 transition-all duration-500" />
          </button>
          <button onClick={handleConvert} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
            {t('common.convert')}
          </button>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {direction === 'xml-to-yaml' ? t('common.output') + ' YAML' : t('common.output') + ' XML'}
            </label>
            <div className="flex gap-2">
              <button onClick={handleDownload} disabled={!output} className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleCopy} disabled={!output} className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'} disabled:opacity-50`}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <textarea readOnly value={output} className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm dark:text-slate-300 resize-none shadow-inner" />
        </div>
      </div>
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-600 shrink-0" />
        <div>
          <h4 className="font-bold dark:text-white">{t('xml_yaml.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('xml_yaml.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
