import { useState, useDeferredValue, useMemo } from 'react';
import { Eye, Code } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

const MAX_CHARS = 50000;

export function MarkdownPreview() {
  const [markdown, setMarkdown] = useState('# Titre\n\nVotre texte **Markdown** ici...');
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');

  // ⚡ Bolt Optimization: useDeferredValue to keep the UI responsive during typing
  const deferredMarkdown = useDeferredValue(markdown);

  const escapeHTML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const renderMarkdown = (text: string) => {
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
                    !url.includes('&#') && // No HTML entities in URL part
                    !url.toLowerCase().includes('javascript:'); // Double check for javascript:
      return isSafe
        ? `<a href="${url}" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-4 hover:text-indigo-500 transition-colors" rel="noopener noreferrer" target="_blank">${linkText}</a>`
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
    <div className="max-w-6xl mx-auto">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('edit')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            mode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          <Code className="w-4 h-4 inline mr-2" />
          Édition
        </button>
        <button
          onClick={() => setMode('split')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            mode === 'split' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Divisé
        </button>
        <button
          onClick={() => setMode('preview')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            mode === 'preview' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          Aperçu
        </button>
      </div>

      <div className={`grid gap-4 ${mode === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-700">
                Markdown
              </label>
              <span className={`text-xs font-bold ${markdown.length > MAX_CHARS ? 'text-rose-500' : 'text-slate-400'}`}>
                {markdown.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value.slice(0, MAX_CHARS + 1000))}
              className={`w-full h-96 p-4 border rounded-lg resize-none font-mono text-sm outline-none focus:ring-2 transition-all ${
                markdown.length > MAX_CHARS
                ? 'border-rose-300 focus:ring-rose-500/20'
                : 'border-gray-300 focus:ring-indigo-500/20'
              }`}
              placeholder="# Titre..."
            />
            {markdown.length > MAX_CHARS && (
              <p className="text-xs text-rose-500 font-bold animate-pulse">
                Limite de caractères dépassée. Le rendu est désactivé pour des raisons de performance.
              </p>
            )}
          </div>
        )}
        
        {(mode === 'preview' || mode === 'split') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Aperçu
            </label>
            <div
              className="w-full h-96 p-4 border border-gray-300 rounded-lg overflow-y-auto bg-white prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: markdown.length <= MAX_CHARS
                  ? renderMarkdown(deferredMarkdown)
                  : '<div class="text-rose-500 p-4 font-bold italic">Contenu trop volumineux pour l\'aperçu direct.</div>'
              }}
            />
          </div>
        )}
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
