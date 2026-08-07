import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, Terminal, Download, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function HTMLToMarkdown({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output });
  }, [input, output, onStateChange]);

  const isTooLong = input.length > MAX_LENGTH;

  const convertHTMLToMarkdown = useCallback((html: string) => {
    if (!html.trim()) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Sentinel: Strip script and style elements entirely to prevent data/code leakage in the Markdown output
    doc.querySelectorAll('script, style').forEach(el => el.remove());

    const walk = (node: Node): string => {
      let result = '';
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          result += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tag = el.tagName.toLowerCase();

          switch (tag) {
            case 'h1': result += `\n# ${walk(el)}\n`; break;
            case 'h2': result += `\n## ${walk(el)}\n`; break;
            case 'h3': result += `\n### ${walk(el)}\n`; break;
            case 'h4': result += `\n#### ${walk(el)}\n`; break;
            case 'h5': result += `\n##### ${walk(el)}\n`; break;
            case 'h6': result += `\n###### ${walk(el)}\n`; break;
            case 'p': result += `\n${walk(el)}\n`; break;
            case 'strong':
            case 'b': result += `**${walk(el)}**`; break;
            case 'em':
            case 'i': result += `*${walk(el)}*`; break;
            case 'a': result += `[${walk(el)}](${el.getAttribute('href') || ''})`; break;
            case 'ul': result += `\n${walk(el)}\n`; break;
            case 'ol': result += `\n${walk(el)}\n`; break;
            case 'li': {
               const parent = el.parentElement;
               const prefix = parent?.tagName.toLowerCase() === 'ol' ? '1. ' : '- ';
               result += `${prefix}${walk(el)}\n`;
               break;
            }
            case 'code': {
              const isBlock = el.parentElement?.tagName.toLowerCase() === 'pre';
              if (isBlock) {
                result += `\n\`\`\`\n${el.textContent}\n\`\`\`\n`;
              } else {
                result += `\`${el.textContent}\``;
              }
              break;
            }
            case 'pre': result += walk(el); break;
            case 'br': result += '\n'; break;
            case 'img': result += `![${el.getAttribute('alt') || ''}](${el.getAttribute('src') || ''})`; break;
            case 'blockquote': result += `\n> ${walk(el).replace(/\n/g, '\n> ')}\n`; break;
            case 'hr': result += '\n---\n'; break;
            default: result += walk(el);
          }
        }
      });
      return result;
    };

    return walk(doc.body).trim().replace(/\n{3,}/g, '\n\n');
  }, []);

  useEffect(() => {
    if (isTooLong) {
      setOutput('');
    } else {
      setOutput(convertHTMLToMarkdown(input));
    }
  }, [input, convertHTMLToMarkdown, isTooLong]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('htmltomarkdown.copy_success', 'Successfully copied Markdown output!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    toast.success(t('htmltomarkdown.clear_success', 'Input and output cleared'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'content.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {isTooLong && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {t('htmltomarkdown.error_max_length', 'Input is too long. Limit of 100,000 characters.')}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="html-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">HTML {t('common.input')}</label>
            </div>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 bg-white dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="html-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="<p>Hello <strong>World</strong>!</p>"
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <label htmlFor="markdown-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Markdown {t('common.output')}</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output || isTooLong}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output || isTooLong}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 border ${
                  copied
                    ? 'bg-emerald-500 text-white border-transparent'
                    : 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-transparent hover:border-indigo-500/50'
                } disabled:opacity-50`}
                title={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="markdown-output"
            value={output}
            readOnly
            placeholder={t('htmltomarkdown.placeholder')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
          />
        </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('htmltomarkdown.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('htmltomarkdown.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
