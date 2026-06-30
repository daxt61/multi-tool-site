import React, { useState, useEffect, useCallback } from 'react';
import { FileCode, Download, Copy, Check, Trash2, Info, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import yaml from 'js-yaml';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function XmlYamlConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [xmlInput, setXmlInput] = useState(initialData?.xmlInput || '');
  const [yamlInput, setYamlInput] = useState(initialData?.yamlInput || '');
  const [direction, setDirection] = useState<'xml-to-yaml' | 'yaml-to-xml'>(initialData?.direction || 'xml-to-yaml');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ xmlInput, yamlInput, direction });
  }, [xmlInput, yamlInput, direction, onStateChange]);

  const sanitizeKey = (key: string) => {
    const forbidden = ['__proto__', 'constructor', 'prototype'];
    return forbidden.includes(key.toLowerCase()) ? `_${key}` : key;
  };

  const xmlToObj = (node: Node, depth = 0): any => {
    if (depth > MAX_DEPTH) return null;

    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue?.trim() || null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const obj = Object.create(null);
    const element = node as Element;

    if (element.attributes.length > 0) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        obj[`@${sanitizeKey(attr.name)}`] = attr.value;
      }
    }

    const children = element.childNodes;
    if (children.length > 0) {
      let hasElementChild = false;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeType === Node.ELEMENT_NODE) {
          hasElementChild = true;
          const name = sanitizeKey((child as Element).tagName);
          const value = xmlToObj(child, depth + 1);

          if (value === null) continue;

          if (obj[name] === undefined) {
            obj[name] = value;
          } else {
            if (!Array.isArray(obj[name])) {
              obj[name] = [obj[name]];
            }
            obj[name].push(value);
          }
        }
      }

      if (!hasElementChild && element.textContent) {
        const text = element.textContent.trim();
        if (text) {
          if (element.attributes.length > 0) {
             obj['#text'] = text;
          } else {
             return text;
          }
        }
      }
    }

    return Object.keys(obj).length === 0 ? null : obj;
  };

  const objToXml = (o: any, tab: string = '', depth: number = 0): string => {
    if (depth > MAX_DEPTH) return `${tab}<!-- Max depth reached -->\n`;
    if (o === null || o === undefined) return '';
    if (typeof o !== 'object') return String(o);

    let xml = '';
    for (const key in o) {
      if (Object.prototype.hasOwnProperty.call(o, key)) {
        const val = o[key];
        if (key.startsWith('@')) continue; // Handled by parent
        if (key === '#text') continue; // Handled by parent

        const renderElement = (tagName: string, content: any) => {
          let attrStr = '';
          let textVal = '';
          let innerXml = '';

          if (content !== null && typeof content === 'object' && !Array.isArray(content)) {
            for (const k in content) {
              if (k.startsWith('@')) {
                attrStr += ` ${k.slice(1)}="${String(content[k]).replace(/"/g, '&quot;')}"`;
              } else if (k === '#text') {
                textVal = String(content[k]);
              }
            }
            if (!textVal) {
               innerXml = objToXml(content, tab + '  ', depth + 1);
            }
          } else if (Array.isArray(content)) {
             // Arrays are handled by the loop in objToXml calling renderElement multiple times
             return '';
          } else {
            textVal = String(content);
          }

          if (innerXml) {
            return `${tab}<${tagName}${attrStr}>\n${innerXml}${tab}</${tagName}>\n`;
          } else if (textVal) {
             return `${tab}<${tagName}${attrStr}>${escapeXml(textVal)}</${tagName}>\n`;
          } else {
             return `${tab}<${tagName}${attrStr} />\n`;
          }
        };

        if (Array.isArray(val)) {
          for (const item of val) {
            xml += renderElement(key, item);
          }
        } else {
          xml += renderElement(key, val);
        }
      }
    }
    return xml;
  };

  const handleConvert = useCallback(() => {
    const input = direction === 'xml-to-yaml' ? xmlInput : yamlInput;
    if (!input.trim()) {
      direction === 'xml-to-yaml' ? setYamlInput('') : setXmlInput('');
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
        const doc = parser.parseFromString(xmlInput, 'application/xml');
        if (doc.querySelector('parsererror')) throw new Error('XML parsing error');
        const obj = xmlToObj(doc.documentElement);
        setYamlInput(yaml.dump(obj));
      } else {
        const obj = yaml.load(yamlInput);
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${objToXml(obj, '  ', 0)}</root>`;
        setXmlInput(xml);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, [xmlInput, yamlInput, direction, t]);

  const handleSwap = () => {
    setDirection(direction === 'xml-to-yaml' ? 'yaml-to-xml' : 'xml-to-yaml');
    setError(null);
  };

  const handleCopy = () => {
    const output = direction === 'xml-to-yaml' ? yamlInput : xmlInput;
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('common.copied'));
  };

  const handleDownload = () => {
    const output = direction === 'xml-to-yaml' ? yamlInput : xmlInput;
    if (!output) return;
    const ext = direction === 'xml-to-yaml' ? 'yaml' : 'xml';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted-${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="input-field" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {direction === 'xml-to-yaml' ? 'XML' : 'YAML'}
            </label>
            <button
              onClick={() => direction === 'xml-to-yaml' ? setXmlInput('') : setYamlInput('')}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            id="input-field"
            value={direction === 'xml-to-yaml' ? xmlInput : yamlInput}
            onChange={(e) => direction === 'xml-to-yaml' ? setXmlInput(e.target.value) : setYamlInput(e.target.value)}
            placeholder={direction === 'xml-to-yaml' ? '<root><name>John</name></root>' : 'name: John'}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4 items-center">
          <button
            onClick={handleSwap}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-all group"
            title={t('diffchecker.swap_aria')}
          >
            <ArrowLeftRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 group-hover:rotate-180 transition-all duration-500" />
          </button>
          <button
            onClick={handleConvert}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
          >
            {t('common.convert')}
          </button>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {direction === 'xml-to-yaml' ? 'YAML' : 'XML'}
            </label>
            <div className="flex gap-2">
               <button
                 onClick={handleDownload}
                 disabled={direction === 'xml-to-yaml' ? !yamlInput : !xmlInput}
                 className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
               >
                 <Download className="w-3.5 h-3.5" />
               </button>
               <button
                 onClick={handleCopy}
                 disabled={direction === 'xml-to-yaml' ? !yamlInput : !xmlInput}
                 className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'} disabled:opacity-50`}
               >
                 {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
               </button>
            </div>
          </div>
          <textarea
            id="output-field"
            readOnly
            value={direction === 'xml-to-yaml' ? yamlInput : xmlInput}
            placeholder={t('jsontosql.placeholder_output')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm dark:text-slate-300 resize-none shadow-inner"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
         <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Info className="w-6 h-6" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">{t('xml_yaml.about_title', 'About XML/YAML Conversion')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('xml_yaml.about_text', 'Convert between XML and YAML formats instantly. This tool handles nesting, attributes, and text nodes correctly. Like all our converters, the process is done entirely in your browser.')}
            </p>
         </div>
      </div>
    </div>
  );
}
