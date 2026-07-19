import { useState, useEffect, useCallback, useRef } from 'react';
import { FileSearch, Copy, Check, Trash2, Download, AlertCircle, Info, Braces } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function XPathTester({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputXmlRef = useRef<HTMLTextAreaElement>(null);

  const [xmlInput, setXmlInput] = useState(
    initialData?.xmlInput ||
    `<bookstore>\n  <book category="cooking">\n    <title lang="en">Everyday Italian</title>\n    <author>Giada De Laurentiis</author>\n    <year>2005</year>\n    <price>30.00</price>\n  </book>\n  <book category="children">\n    <title lang="en">Harry Potter</title>\n    <author>J.K. Rowling</author>\n    <year>1997</year>\n    <price>29.99</price>\n  </book>\n</bookstore>`
  );
  const [xpathQuery, setXpathQuery] = useState(initialData?.xpathQuery || '//book[price < 30]/title/text()');
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ xmlInput, xpathQuery });
  }, [xmlInput, xpathQuery, onStateChange]);

  const executeXPath = useCallback(() => {
    if (!xmlInput.trim() || !xpathQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    if (xmlInput.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setResults([]);
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlInput, 'text/xml');

      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error(parserError.textContent || 'XML parsing error');
      }

      const evaluator = new XPathEvaluator();
      const expression = evaluator.createExpression(xpathQuery);
      const result = expression.evaluate(doc, XPathResult.ANY_TYPE, null);

      const items: string[] = [];

      if (result.resultType === XPathResult.NUMBER_TYPE) {
        items.push(String(result.numberValue));
      } else if (result.resultType === XPathResult.STRING_TYPE) {
        items.push(result.stringValue);
      } else if (result.resultType === XPathResult.BOOLEAN_TYPE) {
        items.push(String(result.booleanValue));
      } else {
        let node = result.iterateNext();
        const serializer = new XMLSerializer();
        while (node) {
          if (node.nodeType === Node.ATTRIBUTE_NODE) {
            items.push(`${node.nodeName}="${node.nodeValue}"`);
          } else if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
            items.push(node.nodeValue || '');
          } else {
            items.push(serializer.serializeToString(node));
          }
          node = result.iterateNext();
        }
      }

      setResults(items);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Error executing XPath');
      setResults([]);
    }
  }, [xmlInput, xpathQuery, t]);

  useEffect(() => {
    const timer = setTimeout(executeXPath, 300);
    return () => clearTimeout(timer);
  }, [executeXPath]);

  const handleCopy = () => {
    if (results.length === 0) return;
    const text = results.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('common.copied', 'Copied to clipboard!'));
  };

  const handleClear = useCallback(() => {
    setXmlInput('');
    setXpathQuery('');
    setResults([]);
    setError(null);
    inputXmlRef.current?.focus();
  }, []);

  const handleDownload = () => {
    if (results.length === 0) return;
    const text = results.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `xpath-results-${Date.now()}.txt`);
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'File downloaded'));
  };

  const handleXmlChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    setXmlInput(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Query Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="xpath-query" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Braces className="w-4 h-4 text-indigo-500" /> {t('xpathtester.query_label', 'XPath Expression')}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('common.clear', 'Clear')}
              <Kbd modifier={null}>Esc</Kbd>
            </button>
          </div>
        </div>
        <input
          id="xpath-query"
          type="text"
          value={xpathQuery}
          onChange={(e) => setXpathQuery(e.target.value)}
          placeholder="/bookstore/book[1]/title"
          className="w-full px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-base outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* XML Document */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="xml-document" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-indigo-500" /> {t('xpathtester.xml_label', 'XML Document')}
            </label>
          </div>
          <textarea
            id="xml-document"
            ref={inputXmlRef}
            value={xmlInput}
            onChange={(e) => handleXmlChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="<root><child>text</child></root>"
            spellCheck={false}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm resize-none dark:text-slate-300"
          />
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-emerald-500" /> {t('xpathtester.result_label', 'Query Results')} ({results.length})
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={results.length === 0}
                className="p-2 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-30"
                aria-label={t('common.copy', 'Copy')}
                title={t('common.copy', 'Copy')}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownload}
                disabled={results.length === 0}
                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors disabled:opacity-30"
                aria-label={t('common.download', 'Download')}
                title={t('common.download', 'Download')}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="w-full h-96 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-auto font-mono text-sm dark:text-slate-300 space-y-2">
            {results.length > 0 ? (
              results.map((result, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 break-all">
                  <span className="inline-block px-1.5 py-0.5 mr-2 rounded bg-indigo-500/10 text-indigo-500 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  {result}
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic text-sm p-2">{t('xpathtester.no_results', 'No matches found.')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('xpathtester.about_title', 'About XPath Tester')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('xpathtester.about_text', 'XPath (XML Path Language) is a query language for selecting nodes from an XML document. It also provides basic calculations and processing of text or numeric values. This tool lets you safely parse XML or HTML documents locally in your browser and verify your queries.')}
          </p>
        </div>
      </div>
    </div>
  );
}
