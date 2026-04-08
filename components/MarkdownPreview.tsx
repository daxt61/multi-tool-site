import { useState } from 'react';
import { Eye, Code, Trash2, Copy, Check, FileDown, AlertCircle } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

const MAX_LENGTH = 50000;

export function MarkdownPreview() {
  const [markdown, setMarkdown] = useState('# Titre\n\nVotre texte **Markdown** ici...');
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const escapeHTML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHtml = () => {
    if (!markdown) return;
    const html = renderMarkdown(markdown);
    navigator.clipboard.writeText(html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleDownload = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderMarkdown = (text: string) => {
    if (text.length > MAX_LENGTH) {
      return `<div class="text-rose-500 font-bold p-4 border border-rose-200 rounded-xl bg-rose-50">L'entrée est trop longue pour être traitée en toute sécurité (maximum ${MAX_LENGTH.toLocaleString()} caractères).</div>`;
    }
    const placeholders: string[] = [];

    // Escape input to prevent XSS
    let html = escapeHTML(text);

    // 1. Multi-line code blocks (Protect them from subsequent rules)
    html = html.replace(/```(?:[a-z]*)\n?([\s\S]*?)```/g, (_, code) => {
      const p = `__BLOCK_${placeholders.length}__`;
      placeholders.push(`<pre class="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg my-4 font-mono text-sm overflow-x-auto text-slate-900 dark:text-slate-100"><code>${code}</code></pre>`);
      return p;
    });

    // 2. Code inline (Protect them)
    html = html.replace(/`(.*?)`/g, (_, code) => {
      const p = `__INLINE_${placeholders.length}__`;
      placeholders.push(`<code class="bg-gray-100 dark:bg-slate-800 px-1 rounded text-indigo-600 dark:text-indigo-400 font-mono text-sm">${code}</code>`);
      return p;
    });
    
    // 3. Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-6 mb-2 text-slate-900 dark:text-white">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black mt-10 mb-6 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">$1</h1>');
    
    // 4. Blockquotes
    html = html.replace(/^\s*&gt;\s+(.*)$/gim, '<blockquote class="border-l-4 border-slate-300 dark:border-slate-700 pl-4 italic my-6 text-slate-600 dark:text-slate-400">$1</blockquote>');
    
    // 5. Unordered lists
    html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li class="ml-6 list-disc text-slate-700 dark:text-slate-300 my-1">$1</li>');
    // Wrap adjacent <li> in <ul>
    html = html.replace(/((?:<li.*?>.*?<\/li>\s*)+)/g, '<ul class="my-4">$1</ul>');

    // 6. Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');

    // 7. Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // 8. Links
    // Sentinel: Exclude quotes and other attribute-breaking characters from the URL match.
    html = html.replace(/\[(.*?)\]\(([^)\s\<\>"\']+)\)/g, (match, linkText, url) => {
      // Sentinel: Improved protocol check to prevent XSS.
      // We whitelist common safe protocols and ensure the URL doesn't contain
      // encoded characters that could be used for bypasses.
      const isSafe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) &&
                    !/[\u0000-\u001F\u007F-\u009F]/.test(url) && // No control characters
                    !url.includes('&#') && // No numeric HTML entities in URL part
                    !url.toLowerCase().includes('&colon;') &&
                    !url.toLowerCase().includes('javascript:'); // Double check for javascript:

      // Use escapeHTML for the href attribute to prevent attribute injection.
      return isSafe
        ? `<a href="${escapeHTML(url)}" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-4 hover:text-indigo-500 transition-colors" rel="noopener noreferrer" target="_blank">${linkText}</a>`
        : `<span class="text-slate-400 underline decoration-dotted" title="Lien non sécurisé">${linkText}</span>`;
    });
    
    // 9. Line breaks (apply only to non-block content)
    html = html.replace(/\n/g, '<br>');

    // Clean up breaks around block elements to avoid excessive spacing
    html = html.replace(/<br>\s*<(ul|li|blockquote|pre|h1|h2|h3)/gi, '<$1');
    html = html.replace(/<\/(ul|li|blockquote|pre|h1|h2|h3)>\s*<br>/gi, '</$1>');
    
    // 10. Restore placeholders
    placeholders.forEach((content, i) => {
      html = html.replace(new RegExp(`__(?:BLOCK|INLINE)_${i}__`, 'g'), content);
    });

    return html;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setMode('edit')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              mode === 'edit' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" /> Édition
          </button>
          <button
            onClick={() => setMode('split')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              mode === 'split' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Divisé
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              mode === 'preview' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" /> Aperçu
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={!markdown}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
              copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié' : 'Markdown'}
          </button>
          <button
            onClick={handleCopyHtml}
            disabled={!markdown}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
              copiedHtml ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
            }`}
          >
            {copiedHtml ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
            {copiedHtml ? 'HTML Copié' : 'HTML'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!markdown}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" /> Télécharger
          </button>
          <button
            onClick={() => setMarkdown('')}
            disabled={!markdown}
            aria-label="Effacer le markdown"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Effacer
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${mode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="markdown-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
                Markdown
              </label>
            </div>
            <textarea
              id="markdown-input"
              value={markdown}
              onChange={(e) => {
                const val = e.target.value;
                setMarkdown(val);
                if (val.length > MAX_LENGTH) {
                  setError(`L'entrée est trop longue. Limite de ${MAX_LENGTH.toLocaleString()} caractères pour la prévisualisation.`);
                } else {
                  setError(null);
                }
              }}
              className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-[2.5rem] outline-none focus:ring-2 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm`}
              placeholder="# Titre..."
            />
          </div>
        )}
        
        {(mode === 'preview' || mode === 'split') && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Aperçu
              </span>
            </div>
            <div className="relative group">
              <div
                className={`w-full h-[500px] p-8 bg-white dark:bg-slate-950/50 border ${error ? 'border-rose-500/50' : 'border-slate-200 dark:border-slate-800'} rounded-[2.5rem] overflow-y-auto prose dark:prose-invert max-w-none shadow-sm`}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
              />
              {error && (
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
