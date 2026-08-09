import { useState, useEffect, useRef, useCallback } from 'react';
import { FileCode, Search, Copy, Check, Trash2, AlertCircle, Terminal, Download, Info, Sparkles, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function XSLTTransformer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [xmlInput, setXmlInput] = useState(initialData?.xmlInput || '');
  const [xsltInput, setXsltInput] = useState(initialData?.xsltInput || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const xmlInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ xmlInput, xsltInput, output });
  }, [xmlInput, xsltInput, output, onStateChange]);

  const handleTransform = useCallback(() => {
    try {
      setError('');
      if (!xmlInput.trim() || !xsltInput.trim()) {
        setOutput('');
        return;
      }
      if (xmlInput.length > MAX_LENGTH || xsltInput.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlInput, 'application/xml');
      const xsltDoc = parser.parseFromString(xsltInput, 'application/xml');

      // Check XML parsing error
      const xmlParserError = xmlDoc.querySelector('parsererror');
      if (xmlParserError) {
        throw new Error(`XML Parsing Error: ${xmlParserError.textContent}`);
      }

      // Check XSLT parsing error
      const xsltParserError = xsltDoc.querySelector('parsererror');
      if (xsltParserError) {
        throw new Error(`XSLT Parsing Error: ${xsltParserError.textContent}`);
      }

      // Standard browser XSLTProcessor
      if (typeof window.XSLTProcessor === 'undefined') {
        throw new Error('XSLTProcessor is not supported by your browser.');
      }

      const xsltProcessor = new window.XSLTProcessor();
      xsltProcessor.importStylesheet(xsltDoc);

      const resultDoc = xsltProcessor.transformToDocument(xmlDoc);

      // Some browsers output parsing errors in the output document
      const resultParserError = resultDoc?.querySelector('parsererror');
      if (resultParserError) {
        throw new Error(`Transformation Output Error: ${resultParserError.textContent}`);
      }

      if (resultDoc) {
        const serializer = new XMLSerializer();
        let serialized = '';

        // If the stylesheet transforms to an HTML/XML document or fragments
        if (resultDoc.documentElement) {
          serialized = serializer.serializeToString(resultDoc);
        } else {
          // Fallback or text transformations
          const resultFrag = xsltProcessor.transformToFragment(xmlDoc, document);
          if (resultFrag) {
            const div = document.createElement('div');
            div.appendChild(resultFrag.cloneNode(true));
            serialized = div.innerHTML || resultFrag.textContent || '';
          }
        }

        // Clean up text if it is inside an XML-wrapped document
        setOutput(serialized.trim());
      } else {
        throw new Error('Transformation returned no document.');
      }

    } catch (e: any) {
      setError(e.message || 'Error during XSLT transformation');
      setOutput('');
    }
  }, [xmlInput, xsltInput, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleTransform();
    }, 300);
    return () => clearTimeout(timer);
  }, [xmlInput, xsltInput, handleTransform]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('xslt.copied_toast') || 'Transformed output copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setXmlInput('');
    setXsltInput('');
    setOutput('');
    setError('');
    toast.success(t('xslt.cleared_toast') || 'Inputs cleared!');
    xmlInputRef.current?.focus();
  }, [t]);

  // Use local useRef-backed handlersRef keyboard shortcuts to avoid stale closures
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
    if (!output) return;
    const blob = new Blob([output], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transformed-output.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success') || 'Download successful');
  };

  const presets = [
    {
      name: t('xslt.preset_catalog') || 'E-Commerce Catalog (HTML Table)',
      xml: `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <product>
    <id>P101</id>
    <name>Wireless Headphones</name>
    <category>Electronics</category>
    <price>99.99</price>
    <stock>45</stock>
  </product>
  <product>
    <id>P102</id>
    <name>Mechanical Keyboard</name>
    <category>Electronics</category>
    <price>129.50</price>
    <stock>12</stock>
  </product>
  <product>
    <id>P103</id>
    <name>Leather Wallet</name>
    <category>Accessories</category>
    <price>45.00</price>
    <stock>120</stock>
  </product>
</catalog>`,
      xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html>
      <body>
        <h2>Product Catalog</h2>
        <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
          <tr bgcolor="#4F46E5" style="color: white; font-weight: bold;">
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock Status</th>
          </tr>
          <xsl:for-each select="catalog/product">
            <tr>
              <td><xsl:value-of select="id"/></td>
              <td><strong><xsl:value-of select="name"/></strong></td>
              <td><xsl:value-of select="category"/></td>
              <td>$<xsl:value-of select="price"/></td>
              <td>
                <xsl:choose>
                  <xsl:when test="stock &lt; 20">
                    <span style="color: red; font-weight: bold;">Low Stock (<xsl:value-of select="stock"/>)</span>
                  </xsl:when>
                  <xsl:otherwise>
                    <span style="color: green;">In Stock (<xsl:value-of select="stock"/>)</span>
                  </xsl:otherwise>
                </xsl:choose>
              </td>
            </tr>
          </xsl:for-each>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`
    },
    {
      name: t('xslt.preset_report_card') || 'Student Report Card',
      xml: `<?xml version="1.0" encoding="UTF-8"?>
<report>
  <student>
    <name>Alice Smith</name>
    <grade>A</grade>
    <subject>Mathematics</subject>
    <score>95</score>
  </student>
  <student>
    <name>Bob Jones</name>
    <grade>C</grade>
    <subject>Science</subject>
    <score>72</score>
  </student>
  <student>
    <name>Charlie Brown</name>
    <grade>B</grade>
    <subject>Literature</subject>
    <score>84</score>
  </student>
</report>`,
      xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html>
      <body>
        <h3>Student Grades Report</h3>
        <ul>
          <xsl:for-each select="report/student">
            <li>
              <strong><xsl:value-of select="name"/></strong>:
              <xsl:value-of select="subject"/> -
              Score: <xsl:value-of select="score"/> (<xsl:value-of select="grade"/>)
            </li>
          </xsl:for-each>
        </ul>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`
    }
  ];

  const applyPreset = (xml: string, xslt: string) => {
    setXmlInput(xml);
    setXsltInput(xslt);
    toast.success(t('xslt.preset_loaded') || 'Preset loaded successfully!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" role="region" aria-label={t('tool.xslt-transformer.name', 'XSLT Transformer & Tester')}>
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-3 px-1 items-center">
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
          disabled={!xmlInput && !xsltInput && output === ''}
          className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* XML Document */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="xml-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('xslt.xml_data', 'XML Document')}
              </label>
            </div>
          </div>
          <textarea
            id="xml-input"
            ref={xmlInputRef}
            value={xmlInput}
            onChange={(e) => setXmlInput(e.target.value)}
            placeholder='<?xml version="1.0"?>&#10;<root>&#10;  <item>Hello World</item>&#10;</root>'
            className="w-full h-[350px] p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* XSLT Document */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-indigo-500" />
              <label htmlFor="xslt-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('xslt.xslt_stylesheet', 'XSLT Stylesheet')}
              </label>
            </div>
          </div>
          <textarea
            id="xslt-input"
            value={xsltInput}
            onChange={(e) => setXsltInput(e.target.value)}
            placeholder='<?xml version="1.0"?>&#10;<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">&#10;  <xsl:template match="/">...&#10;  </xsl:template>&#10;</xsl:stylesheet>'
            className="w-full h-[350px] p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Results */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <label htmlFor="result-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('xslt.result', 'Transformed Output')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
            id="result-output"
            value={output}
            readOnly
            placeholder={t('xslt.placeholder_result', 'Transformed output will appear here...')}
            className="w-full h-[350px] p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="space-y-4" role="group" aria-labelledby="xslt-presets-heading">
        <h4 id="xslt-presets-heading" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> {t('xslt.presets_title', 'Interactive Presets')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset.xml, preset.xslt)}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <div className="font-bold text-sm mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{preset.name}</div>
              <div className="text-xs text-slate-400 line-clamp-1">{preset.xml.substring(0, 100)}...</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
            <Info className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">{t('xslt.about_title', 'About XSLT Transformer')}</h4>
        </div>
        <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          <p>
            {t('xslt.about_text_1', 'XSLT (Extensible Stylesheet Language Transformations) is a language for transforming XML documents into other XML documents, HTML, SVG, or plain text.')}
          </p>
          <p>
            {t('xslt.about_text_2', 'This tool processes your transformation entirely client-side using standard browser-native XSLT processors. No data is sent to a server, guaranteeing complete privacy for your documents and stylesheets.')}
          </p>
        </div>
      </div>
    </div>
  );
}
