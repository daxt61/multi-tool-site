import { useState, useEffect } from 'react';
import { FileCode, ArrowLeftRight, Copy, Check, Trash2, Download, Info, AlertCircle } from 'lucide-react';

const MAX_LENGTH = 100000;

export function JsonXmlConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [direction, setDirection] = useState<'json-to-xml' | 'xml-to-json'>(initialData?.direction || 'json-to-xml');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, direction });
  }, [input, output, direction, onStateChange]);

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

  const jsonToXml = (jsonStr: string) => {
    try {
      const obj = JSON.parse(jsonStr);
      const toXml = (o: any, tab: string = ''): string => {
        let xml = '';
        for (const key in o) {
          if (Object.prototype.hasOwnProperty.call(o, key)) {
            const val = o[key];
            const cleanKey = escapeXml(key);
            if (Array.isArray(val)) {
              for (const item of val) {
                if (typeof item === 'object' && item !== null) {
                  xml += `${tab}<${cleanKey}>\n${toXml(item, tab + '  ')}${tab}</${cleanKey}>\n`;
                } else {
                  xml += `${tab}<${cleanKey}>${escapeXml(item)}</${cleanKey}>\n`;
                }
              }
            } else if (typeof val === 'object' && val !== null) {
              xml += `${tab}<${cleanKey}>\n${toXml(val, tab + '  ')}${tab}</${cleanKey}>\n`;
            } else {
              xml += `${tab}<${cleanKey}>${escapeXml(val)}</${cleanKey}>\n`;
            }
          }
        }
        return xml;
      };
      return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${toXml(obj, '  ')}</root>`;
    } catch (e: any) {
      throw new Error('JSON invalide : ' + e.message);
    }
  };

  const xmlToJson = (xmlStr: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
      const parseError = xmlDoc.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        throw new Error(parseError[0].textContent || 'Erreur de parsing XML');
      }

      const toJson = (node: Node): any => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent?.trim();
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return null;
        }

        const obj: any = {};
        const element = node as Element;

        if (element.attributes.length > 0) {
          obj['@attributes'] = {};
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            obj['@attributes'][attr.name] = attr.value;
          }
        }

        let hasChildElements = false;
        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];
          if (child.nodeType === Node.ELEMENT_NODE) {
            hasChildElements = true;
            const name = (child as Element).tagName;
            const value = toJson(child);
            if (value !== null) {
              if (obj[name]) {
                if (!Array.isArray(obj[name])) {
                  obj[name] = [obj[name]];
                }
                obj[name].push(value);
              } else {
                obj[name] = value;
              }
            }
          }
        }

        if (!hasChildElements) {
          const text = element.textContent?.trim();
          if (Object.keys(obj).length === 0) return text || "";
          if (text) obj['#text'] = text;
          return obj;
        }

        return obj;
      };

      return JSON.stringify(toJson(xmlDoc.documentElement), null, 2);
    } catch (e: any) {
      throw new Error('XML invalide : ' + e.message);
    }
  };

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(`L'entrée est trop longue (max ${MAX_LENGTH.toLocaleString()} caractères)`);
      return;
    }

    try {
      setError(null);
      if (direction === 'json-to-xml') {
        setOutput(jsonToXml(input));
      } else {
        setOutput(xmlToJson(input));
      }
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  };

  const handleSwap = () => {
    setDirection(direction === 'json-to-xml' ? 'xml-to-json' : 'json-to-xml');
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
    const extension = direction === 'json-to-xml' ? 'xml' : 'json';
    const blob = new Blob([output], { type: direction === 'json-to-xml' ? 'application/xml' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted.${extension}`;
    link.click();
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="input-field" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {direction === 'json-to-xml' ? 'Entrée JSON' : 'Entrée XML'}
            </label>
            <button
              onClick={() => {setInput(''); setOutput(''); setError(null);}}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            id="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === 'json-to-xml' ? '{"name": "John", "age": 30}' : '<root><name>John</name><age>30</age></root>'}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>

        {/* Controls */}
        <div className="lg:col-span-2 flex flex-col gap-4 items-center">
          <button
            onClick={handleSwap}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-all group"
            title="Inverser la direction"
          >
            <ArrowLeftRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 group-hover:rotate-180 transition-all duration-500" />
          </button>
          <button
            onClick={handleConvert}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Convertir
          </button>
        </div>

        {/* Output */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {direction === 'json-to-xml' ? 'Résultat XML' : 'Résultat JSON'}
            </label>
            <div className="flex gap-2">
               <button
                 onClick={handleDownload}
                 disabled={!output}
                 className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
               >
                 <Download className="w-3.5 h-3.5" />
               </button>
               <button
                 onClick={handleCopy}
                 disabled={!output}
                 className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-500 text-white' : 'text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'} disabled:opacity-50`}
               >
                 {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
               </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Le résultat s'affichera ici..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm dark:text-slate-300 resize-none shadow-inner"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
         <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Info className="w-6 h-6" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">Comment fonctionne la conversion ?</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Cet outil transforme vos structures de données JSON en XML et vice versa.
              <strong>JSON vers XML :</strong> Crée un élément racine &lt;root&gt; et transforme chaque paire clé-valeur en balises. Les tableaux sont répétés sous le même nom de balise.
              <strong>XML vers JSON :</strong> Analyse la structure hiérarchique et les attributs (préfixés par @attributes) pour générer un objet JSON propre.
            </p>
         </div>
      </div>
    </div>
  );
}
