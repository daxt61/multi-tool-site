import React, { useState } from 'react';
import { Copy, Check, Trash2, FileCode, Wand2, Info, AlertCircle, Download } from 'lucide-react';

export function XMLFormatter() {
  const [xml, setXml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
  const prettifyXml = (sourceXml: string) => {
    try {
      setError(null);
      if (!sourceXml.trim()) return '';

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(sourceXml, 'application/xml');

      // Check for parsing errors
      const parseError = xmlDoc.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        setError('XML invalide : ' + parseError[0].textContent);
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
      setError('Erreur de formatage : ' + e.message);
      return sourceXml;
    }
  };

  const handleFormat = () => {
    const formatted = prettifyXml(xml);
    setXml(formatted);
  };

  const handleMinify = () => {
    try {
      const minified = xml.replace(/>\s+</g, '><').trim();
      setXml(minified);
      setError(null);
    } catch (e) {
      setError('Erreur lors de la minification');
    }
  };

  const copyToClipboard = () => {
    if (!xml) return;
    navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
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
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-500" />
            <label htmlFor="xml-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Éditeur XML</label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleFormat}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/10"
            >
              <Wand2 className="w-3.5 h-3.5" /> Embellir
            </button>
            <button
              onClick={handleMinify}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all"
            >
              Minifier
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!xml}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                copied ? 'bg-emerald-500 text-white' : 'text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
              } disabled:opacity-50`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copié' : 'Copier'}
            </button>
            <button
              onClick={handleDownload}
              disabled={!xml}
              className="text-xs font-bold px-4 py-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Télécharger
            </button>
            <button
              onClick={() => {setXml(''); setError(null);}}
              className="text-xs font-bold px-4 py-2 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Effacer
            </button>
          </div>
        </div>

        <textarea
          id="xml-input"
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          placeholder="<root>\n  <child>Contenu</child>\n</root>"
          className="w-full h-[500px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-inner"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-4">
          <h3 className="font-bold flex items-center gap-2 dark:text-white">
            <Info className="w-4 h-4 text-indigo-500" /> À propos de l'outil
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ce formateur XML analyse votre code et le restructure pour le rendre lisible. Il gère l'indentation automatique, les attributs et les commentaires. Tout le traitement est effectué localement dans votre navigateur pour une confidentialité totale.
          </p>
        </div>
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/10 space-y-4">
           <h3 className="font-bold">Fonctionnalités</h3>
           <ul className="text-sm text-indigo-100 space-y-2">
             <li className="flex items-center gap-2">
               <Check className="w-4 h-4" /> Indentation automatique (2 espaces)
             </li>
             <li className="flex items-center gap-2">
               <Check className="w-4 h-4" /> Validation de la syntaxe XML
             </li>
             <li className="flex items-center gap-2">
               <Check className="w-4 h-4" /> Minification en un clic
             </li>
             <li className="flex items-center gap-2">
               <Check className="w-4 h-4" /> Support des commentaires et attributs
             </li>
           </ul>
        </div>
      </div>
    </div>
  );
}
