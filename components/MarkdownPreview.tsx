import { useState } from 'react';
import { Eye, Code } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function MarkdownPreview() {
  const [markdown, setMarkdown] = useState('# Titre\n\nVotre texte **Markdown** ici...\n\n- Liste 1\n  - Sous-liste A\n    - Sous-sous-liste i\n  - Sous-liste B\n- Liste 2');
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');

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
    let escapedText = escapeHTML(text);

    // 1. Multi-line code blocks
    escapedText = escapedText.replace(/```(?:[a-z]*)\n?([\s\S]*?)```/g, (_, code) => {
      const p = `__BLOCK_${placeholders.length}__`;
      placeholders.push(`<pre class="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg my-4 font-mono text-sm overflow-x-auto text-slate-900 dark:text-slate-100"><code>${code}</code></pre>`);
      return p;
    });

    // 2. Inline code
    escapedText = escapedText.replace(/`(.*?)`/g, (_, code) => {
      const p = `__INLINE_${placeholders.length}__`;
      placeholders.push(`<code class="bg-gray-100 dark:bg-slate-800 px-1 rounded text-indigo-600 dark:text-indigo-400 font-mono text-sm">${code}</code>`);
      return p;
    });

    const lines = escapedText.split('\n');
    let html = '';
    const listStack: number[] = []; // Stores indentation levels of nested lists

    const closeLists = (toLevel: number) => {
      let closed = '';
      while (listStack.length > toLevel) {
        listStack.pop();
        closed += '</ul>';
      }
      return closed;
    };

    lines.forEach((line) => {
      // 3. Headers
      if (/^### (.*$)/.test(line)) {
        html += closeLists(0) + line.replace(/^### (.*$)/, '<h3 class="text-lg font-bold mt-6 mb-2 text-slate-900 dark:text-white">$1</h3>');
        return;
      }
      if (/^## (.*$)/.test(line)) {
        html += closeLists(0) + line.replace(/^## (.*$)/, '<h2 class="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">$1</h2>');
        return;
      }
      if (/^# (.*$)/.test(line)) {
        html += closeLists(0) + line.replace(/^# (.*$)/, '<h1 class="text-2xl font-black mt-10 mb-6 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">$1</h1>');
        return;
      }

      // 4. Blockquotes
      if (/^\s*&gt;\s+(.*)$/.test(line)) {
        html += closeLists(0) + line.replace(/^\s*&gt;\s+(.*)$/, '<blockquote class="border-l-4 border-slate-300 dark:border-slate-700 pl-4 italic my-6 text-slate-600 dark:text-slate-400">$1</blockquote>');
        return;
      }

      // 5. Unordered Lists (Stateful nested parsing)
      const listMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
      if (listMatch) {
        const indent = listMatch[1].length;
        const content = listMatch[3];

        if (listStack.length === 0 || indent > listStack[listStack.length - 1]) {
          listStack.push(indent);
          html += '<ul class="my-4">';
        } else if (indent < listStack[listStack.length - 1]) {
          while (listStack.length > 0 && indent < listStack[listStack.length - 1]) {
            listStack.pop();
            html += '</ul>';
          }
          if (listStack.length === 0 || indent > listStack[listStack.length - 1]) {
              listStack.push(indent);
              html += '<ul class="my-4">';
          }
        }

        html += `<li class="ml-6 list-disc text-slate-700 dark:text-slate-300 my-1">${content}</li>`;
        return;
      }

      // Empty line closes all lists
      if (line.trim() === '') {
        html += closeLists(0) + '<br>';
        return;
      }

      // Regular paragraph line
      html += closeLists(0) + line + '<br>';
    });

    html += closeLists(0);

    // 6. Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');

    // 7. Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // 8. Links
    html = html.replace(/\[(.*?)\]\(([^)\s\<\>"\']+)\)/g, (match, linkText, url) => {
      const isSafe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) &&
                    !/[\u0000-\u001F\u007F-\u009F]/.test(url) &&
                    !url.includes('&#') &&
                    !url.toLowerCase().includes('javascript:');
      return isSafe
        ? `<a href="${url}" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-4 hover:text-indigo-500 transition-colors" rel="noopener noreferrer" target="_blank">${linkText}</a>`
        : `<span class="text-slate-400 underline decoration-dotted" title="Lien non sécurisé">${linkText}</span>`;
    });

    // Cleanup: Avoid excessive spacing around block elements
    html = html.replace(/<br>\s*<(ul|li|blockquote|pre|h1|h2|h3)/gi, '<$1');
    html = html.replace(/<\/(ul|li|blockquote|pre|h1|h2|h3)>\s*<br>/gi, '</$1>');

    // 9. Restore placeholders
    placeholders.forEach((content, i) => {
      html = html.replace(new RegExp(`__(?:BLOCK|INLINE)_${i}__`, 'g'), content);
    });

    return html;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('edit')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all border ${
            mode === 'edit' ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-lg shadow-indigo-500/10' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <Code className="w-4 h-4 inline mr-2" />
          Édition
        </button>
        <button
          onClick={() => setMode('split')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all border ${
            mode === 'split' ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-lg shadow-indigo-500/10' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          Divisé
        </button>
        <button
          onClick={() => setMode('preview')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all border ${
            mode === 'preview' ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-lg shadow-indigo-500/10' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          Aperçu
        </button>
      </div>

      <div className={`grid gap-8 ${mode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Markdown</label>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-[600px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-inner"
              placeholder="# Titre..."
            />
          </div>
        )}
        
        {(mode === 'preview' || mode === 'split') && (
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Rendu</label>
            <div
              className="w-full h-[600px] p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-y-auto prose dark:prose-invert prose-slate max-w-none shadow-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
