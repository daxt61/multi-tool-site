import { useState, useEffect, useCallback } from 'react';
import { FileCode, Copy, Check, Trash2, Terminal, Download, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function HTMLToMarkdown({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output });
  }, [input, output, onStateChange]);

  const convertHTMLToMarkdown = useCallback((html: string) => {
    if (!html.trim()) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

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
    if (input.length <= MAX_LENGTH) {
      setOutput(convertHTMLToMarkdown(input));
    }
  }, [input, convertHTMLToMarkdown]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="html-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">HTML {t('common.input')}</label>
            </div>
            <button
              onClick={handleClear}
              disabled={!input && !output}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="html-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="<p>Hello <strong>World</strong>!</p>"
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
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
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="markdown-output"
            value={output}
            readOnly
            placeholder={t('htmltomarkdown.placeholder')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
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
