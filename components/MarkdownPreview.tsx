import { useState, useMemo, useDeferredValue } from 'react';
import { Eye, Code, FileText, AlertCircle, Copy, Check } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function MarkdownPreview() {
  const [markdown, setMarkdown] = useState('# Titre\n\nVotre texte **Markdown** ici...');
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [copied, setCopied] = useState(false);

  const deferredMarkdown = useDeferredValue(markdown);

  const MAX_CHARS = 50000;

  const escapeHTML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const renderMarkdown = useMemo(() => {
    const text = deferredMarkdown.slice(0, MAX_CHARS);
    const placeholders: string[] = [];

    // Escape input to prevent XSS
    let html = escapeHTML(text);

    // 1. Multi-line code blocks (Protect them from subsequent rules)
    html = html.replace(/```(?:[a-z]*)\n?([\s\S]*?)```/g, (_, code) => {
      const p = `__BLOCK_${placeholders.length}__`;
      placeholders.push(`<pre class="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl my-4 font-mono text-sm overflow-x-auto text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"><code>${code}</code></pre>`);
      return p;
    });

    // 2. Code inline (Protect them)
    html = html.replace(/`(.*?)`/g, (_, code) => {
      const p = `__INLINE_${placeholders.length}__`;
      placeholders.push(`<code class="bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono text-sm font-bold">${code}</code>`);
      return p;
    });
    
    // 3. Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-black mt-8 mb-3 text-slate-900 dark:text-white">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-black mt-10 mb-4 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-black mt-12 mb-6 text-slate-900 dark:text-white">$1</h1>');
    
    // 4. Blockquotes
    html = html.replace(/^\s*&gt;\s+(.*)$/gim, '<blockquote class="border-l-4 border-indigo-500 pl-6 italic my-8 text-slate-600 dark:text-slate-400 text-lg">$1</blockquote>');
    
    // 5. Unordered lists
    html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li class="ml-6 list-disc text-slate-700 dark:text-slate-300 my-2">$1</li>');
    html = html.replace(/((?:<li.*?>.*?<\/li>\s*)+)/g, '<ul class="my-6 space-y-1">$1</ul>');

    // 6. Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>');

    // 7. Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-800 dark:text-slate-200">$1</em>');
    
    // 8. Links
    html = html.replace(/\[(.*?)\]\(([^)\s\<\>"\']+)\)/g, (match, linkText, url) => {
      const isSafe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) &&
                    !/[\u0000-\u001F\u007F-\u009F]/.test(url) &&
                    !url.includes('&#') &&
                    !url.toLowerCase().includes('javascript:');
      return isSafe
        ? `<a href="${url}" class="text-indigo-600 dark:text-indigo-400 font-bold underline decoration-indigo-500/30 underline-offset-4 hover:decoration-indigo-500 transition-all" rel="noopener noreferrer" target="_blank">${linkText}</a>`
        : `<span class="text-slate-400 underline decoration-dotted" title="Lien non sécurisé">${linkText}</span>`;
    });
    
    // 9. Line breaks
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/<br>\s*<(ul|li|blockquote|pre|h1|h2|h3)/gi, '<$1');
    html = html.replace(/<\/(ul|li|blockquote|pre|h1|h2|h3)>\s*<br>/gi, '</$1>');
    
    // 10. Restore placeholders
    placeholders.forEach((content, i) => {
      html = html.replace(new RegExp(`__(?:BLOCK|INLINE)_${i}__`, 'g'), content);
    });

    return html;
  }, [deferredMarkdown]);

  const copyHTML = () => {
    navigator.clipboard?.writeText(renderMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'edit', label: 'Édition', icon: Code },
            { id: 'split', label: 'Divisé', icon: FileText },
            { id: 'preview', label: 'Aperçu', icon: Eye },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setMode(btn.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                mode === btn.id
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <btn.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{btn.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={copyHTML}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
            copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'HTML Copié !' : 'Copier le HTML'}
        </button>
      </div>

      {markdown.length > MAX_CHARS && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-amber-700 dark:text-amber-400 text-sm font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Limite de {MAX_CHARS} caractères atteinte. Le texte supplémentaire ne sera pas traité.
        </div>
      )}

      <div className={`grid gap-8 ${mode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Code className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Markdown</h3>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-[600px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
              placeholder="# Votre titre..."
            />
          </div>
        )}
        
        {(mode === 'preview' || mode === 'split') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Eye className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Rendu</h3>
            </div>
            <div
              className="w-full h-[600px] p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-y-auto prose dark:prose-invert max-w-none prose-slate"
              dangerouslySetInnerHTML={{ __html: renderMarkdown }}
            />
          </div>
        )}
      </div>

      <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
        <AdPlaceholder size="banner" className="opacity-50 grayscale hover:grayscale-0 transition-all" />
      </div>
    </div>
  );
}
