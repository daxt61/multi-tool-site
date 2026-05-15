import { useState, useEffect } from 'react';
import { FileCode, Copy, Check, Trash2, Download, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 50000;

export function MarkdownToHTML({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [markdown, setMarkdown] = useState(initialData?.markdown || '');
  const [html, setHtml] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ markdown });
    renderMarkdown(markdown);
  }, [markdown]);

  const escapeHTML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const renderMarkdown = (text: string) => {
    if (!text.trim()) {
      setHtml('');
      return;
    }
    if (text.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);

    const placeholders: string[] = [];

    // Initial escape to prevent XSS
    let processed = escapeHTML(text);

    // 1. Code blocks (Protect them)
    processed = processed.replace(/```(?:[a-z]*)\n?([\s\S]*?)```/g, (_, code) => {
      const p = `__BLOCK_${placeholders.length}__`;
      placeholders.push(`<pre><code>${code}</code></pre>`);
      return p;
    });

    // 2. Inline code (Protect them)
    processed = processed.replace(/`(.*?)`/g, (_, code) => {
      const p = `__INLINE_${placeholders.length}__`;
      placeholders.push(`<code>${code}</code>`);
      return p;
    });

    // 3. Headers
    processed = processed.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    processed = processed.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    processed = processed.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 4. Blockquotes
    processed = processed.replace(/^\s*&gt;\s+(.*)$/gim, '<blockquote>$1</blockquote>');

    // 5. Lists
    processed = processed.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
    processed = processed.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul>$1</ul>');

    // 6. Strikethrough
    processed = processed.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // 7. Bold
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 8. Italic
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 9. Links
    processed = processed.replace(/\[(.*?)\]\(([^)\s\<\>"\']+)\)/g, (match, linkText, url) => {
      const isSafe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) &&
                    !/[\u0000-\u001F\u007F-\u009F]/.test(url) &&
                    !url.includes('&#') &&
                    !url.toLowerCase().includes('&colon;') &&
                    !url.toLowerCase().includes('javascript:');

      return isSafe ? `<a href="${escapeHTML(url)}">${linkText}</a>` : linkText;
    });

    // 10. Paragraphs (Wrap lines that aren't already wrapped in block elements)
    processed = processed.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('<pre') || trimmed.startsWith('<blockquote')) {
        return line;
      }
      return `<p>${line}</p>`;
    }).join('\n');

    // Restore placeholders
    placeholders.forEach((content, i) => {
      processed = processed.replace(new RegExp(`__(?:BLOCK|INLINE)_${i}__`, 'g'), () => content);
    });

    setHtml(processed.trim());
  };

  const handleCopy = () => {
    if (!html) return;
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `content-${Date.now()}.html`;
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="md-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Markdown</label>
            <button
              onClick={() => setMarkdown('')}
              disabled={!markdown}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="md-input"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="# Title\n\n**Bold text** and [link](https://example.com)"
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">HTML Output</label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!html}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!html}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={html}
            placeholder="HTML will appear here..."
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-inner"
          />
        </div>
      </div>
    </div>
  );
}
