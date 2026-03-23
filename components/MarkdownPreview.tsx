import { useState } from 'react';
import { Eye, Code } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function MarkdownPreview() {
  const [markdown, setMarkdown] = useState('# Titre\n\nVotre texte **Markdown** ici...');
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
    const lines = text.split('\n');
    let html = '';
    const listStack: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent = '';

    const closeListTags = (targetDepth: number) => {
      while (listStack.length > targetDepth) {
        listStack.pop();
        html += '</ul>';
      }
    };

    lines.forEach((line) => {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          html += `<pre class="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl my-4 font-mono text-sm overflow-x-auto text-slate-900 dark:text-slate-100"><code>${escapeHTML(codeBlockContent)}</code></pre>`;
          codeBlockContent = '';
          inCodeBlock = false;
        } else {
          closeListTags(0);
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        return;
      }

      // Handle headers
      const headerMatch = line.match(/^(#{1,3})\s+(.*)$/);
      if (headerMatch) {
        closeListTags(0);
        const level = headerMatch[1].length;
        const content = processInline(headerMatch[2]);
        const classes = level === 1
          ? 'text-2xl font-black mt-10 mb-6 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2'
          : level === 2
          ? 'text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white'
          : 'text-lg font-bold mt-6 mb-2 text-slate-900 dark:text-white';
        html += `<h${level} class="${classes}">${content}</h${level}>`;
        return;
      }

      // Handle blockquotes
      const quoteMatch = line.match(/^\s*>\s+(.*)$/);
      if (quoteMatch) {
        closeListTags(0);
        html += `<blockquote class="border-l-4 border-slate-300 dark:border-slate-700 pl-4 italic my-6 text-slate-600 dark:text-slate-400">${processInline(quoteMatch[1])}</blockquote>`;
        return;
      }

      // Handle lists (Nested)
      const listMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
      if (listMatch) {
        const indent = listMatch[1].length;
        const depth = Math.floor(indent / 2);

        if (depth > listStack.length) {
          while (listStack.length < depth) {
            listStack.push('ul');
            html += '<ul class="my-4 ml-6 list-disc text-slate-700 dark:text-slate-300">';
          }
        } else if (depth < listStack.length) {
          closeListTags(depth);
        } else if (listStack.length === 0) {
          listStack.push('ul');
          html += '<ul class="my-4 list-disc text-slate-700 dark:text-slate-300">';
        }

        html += `<li class="my-1">${processInline(listMatch[3])}</li>`;
        return;
      }

      // Close lists if line is not a list item
      if (line.trim() === '') {
        closeListTags(0);
        html += '<br>';
      } else {
        closeListTags(0);
        html += `<p class="my-2">${processInline(line)}</p>`;
      }
    });

    closeListTags(0);
    return html;
  };

  const processInline = (text: string) => {
    let escaped = escapeHTML(text);

    // Inline code
    escaped = escaped.replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 rounded-md text-indigo-600 dark:text-indigo-400 font-mono text-sm">$1</code>');
    
    // Bold
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');

    // Italic
    escaped = escaped.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Links (Improved XSS Protection)
    escaped = escaped.replace(/\[(.*?)\]\(([^)\s<>"\']+)\)/g, (match, linkText, url) => {
      const isSafe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) &&
                    !/[\u0000-\u001F\u007F-\u009F]/.test(url) &&
                    !url.includes('&#') &&
                    !url.toLowerCase().includes('javascript:');
      return isSafe
        ? `<a href="${url}" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-4 hover:text-indigo-500 transition-colors" rel="noopener noreferrer" target="_blank">${linkText}</a>`
        : `<span class="text-slate-400 underline decoration-dotted" title="Lien non sécurisé">${linkText}</span>`;
    });

    return escaped;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
        <button
          onClick={() => setMode('edit')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            mode === 'edit' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Code className="w-4 h-4 inline mr-2" />
          Édition
        </button>
        <button
          onClick={() => setMode('split')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            mode === 'split' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Divisé
        </button>
        <button
          onClick={() => setMode('preview')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            mode === 'preview' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          Aperçu
        </button>
      </div>

      <div className={`grid gap-6 ${mode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Markdown</label>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-[600px] p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-white"
              placeholder="# Titre..."
            />
          </div>
        )}
        
        {(mode === 'preview' || mode === 'split') && (
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Aperçu</label>
            <div
              className="w-full h-[600px] p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-y-auto prose dark:prose-invert max-w-none shadow-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          </div>
        )}
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
