import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, FileCode, Wand2, Info, AlertCircle, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

export function XMLFormatter() {
  const { t } = useTranslation();
  const [xml, setXml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const MAX_DEPTH = 50;

  // Improved XML Prettifier using DOMParser
  const prettifyXml = useCallback((sourceXml: string) => {
    try {
      setError(null);
      if (!sourceXml.trim()) return '';

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(sourceXml, 'application/xml');

      // Check for parsing errors
      const parseError = xmlDoc.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        setError(t('error.invalid_xml') + ' : ' + parseError[0].textContent);
        return sourceXml;
      }

      const format = (node: Node, level: number, depth: number): string => {
        // Sentinel: Implement recursion depth limit to prevent stack overflow DoS.
        if (depth > MAX_DEPTH) {
          return '<!-- Max depth reached -->';
        }

        const indent = '  '.repeat(level);
        let result = '';

        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          result += `\n${indent}<${element.tagName}`;

          // Attributes
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            result += ` ${attr.name}="${escapeHtml(attr.value)}"`;
          }

          if (element.childNodes.length === 0) {
            result += ' />';
          } else {
            result += '>';
            let hasChildElements = false;
            for (let i = 0; i < element.childNodes.length; i++) {
              if (element.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                hasChildElements = true;
                break;
              }
            }

            for (let i = 0; i < element.childNodes.length; i++) {
              result += format(element.childNodes[i], level + 1, depth + 1);
            }

            if (hasChildElements) {
              result += `\n${indent}`;
            }
            result += `</${element.tagName}>`;
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (text) result += escapeHtml(text);
        } else if (node.nodeType === Node.COMMENT_NODE) {
          result += `\n${indent}<!--${node.textContent}-->`;
        }

        return result;
      };

      let result = '';
      for (let i = 0; i < xmlDoc.childNodes.length; i++) {
        result += format(xmlDoc.childNodes[i], 0, 0);
      }
      return result.trim();
    } catch (e: any) {
      setError(t('error.invalid_xml') + ' : ' + e.message);
      return sourceXml;
    }
  }, [t]);

  const handleFormat = useCallback(() => {
    const formatted = prettifyXml(xml);
    setXml(formatted);
  }, [xml, prettifyXml]);

  const handleMinify = useCallback(() => {
    try {
      const minified = xml.replace(/>\s+</g, '><').trim();
      setXml(minified);
      setError(null);
    } catch (e) {
      setError(t('error.invalid_xml'));
    }
  }, [xml, t]);

  const copyToClipboard = useCallback(() => {
    if (!xml) return;
    navigator.clipboard.writeText(xml);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [xml, t]);

  const handleDownload = useCallback(() => {
    if (!xml) return;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formatted.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success'));
  }, [xml, t]);

  const handleClear = useCallback(() => {
    setXml('');
    setError(null);
    textareaRef.current?.focus();
  }, []);

  const handlersRef = useRef({
    handleClear,
    copyToClipboard
  });

  useEffect(() => {
    handlersRef.current = { handleClear, copyToClipboard };
  }, [handleClear, copyToClipboard]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
        return;
      }
      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.copyToClipboard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-500" />
            <label htmlFor="xml-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('xmlformatter.editor')}</label>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={handleFormat}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Wand2 className="w-3.5 h-3.5" /> {t('xmlformatter.beautify')}
            </button>
            <button
              onClick={handleMinify}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              {t('xmlformatter.minify')}
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!xml}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copied ? 'bg-emerald-500 text-white' : 'text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
              } disabled:opacity-50`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
              {!copied && <Kbd modifier={null} className="hidden sm:inline-flex bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ml-1">C</Kbd>}
            </button>
            <button
              onClick={handleDownload}
              disabled={!xml}
              className="text-xs font-bold px-4 py-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Download className="w-3.5 h-3.5" /> {t('common.download')}
            </button>
            <button
              onClick={handleClear}
              className="text-xs font-bold px-4 py-2 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              <Kbd modifier={null} className="hidden sm:inline-flex bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
            </button>
          </div>
        </div>

        <textarea
          id="xml-input"
          ref={textareaRef}
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          placeholder="<root>\n  <child>Contenu</child>\n</root>"
          className="w-full h-[500px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-inner"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-4">
          <h3 className="font-bold flex items-center gap-2 dark:text-white">
            <Info className="w-4 h-4 text-indigo-500" /> {t('xmlformatter.about_title')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('xmlformatter.about_text')}
          </p>
        </div>
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/10 space-y-4">
           <h3 className="font-bold">{t('xmlformatter.features_title')}</h3>
           <ul className="text-sm text-indigo-100 space-y-2">
             <li className="flex items-center gap-2">
               <Check className="w-4 h-4" /> {t('xmlformatter.feat_indent')}
             </li>
             <li className="flex items-center gap-2">
               <Check className="w-4 h-4" /> {t('xmlformatter.feat_validate')}
             </li>
             <li className="flex items-center gap-2">
               <Check className="w-4 h-4" /> {t('xmlformatter.feat_minify')}
             </li>
             <li className="flex items-center gap-2">
               <Check className="w-4 h-4" /> {t('xmlformatter.feat_comments')}
             </li>
           </ul>
        </div>
      </div>
    </div>
  );
}
