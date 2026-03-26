import React, { useState } from 'react';
import { Eye, Code, FileText, Copy, Check } from 'lucide-react';

export function MarkdownPreview() {
  const [markdown, setMarkdown] = useState('# Titre\n\nVotre texte **Markdown** ici...\n\n- Liste à puce\n  - Élément imbriqué\n- Autre élément');
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [copied, setCopied] = useState(false);

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
    const result: string[] = [];
    const listStack: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    const closeLists = (depth: number) => {
      while (listStack.length > depth) {
        const type = listStack.pop();
        result.push(type === 'ol' ? '</ol>' : '</ul>');
      }
    };

    lines.forEach((line) => {
      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          result.push(`<pre class="bg-slate-900 text-indigo-400 p-6 rounded-2xl my-6 font-mono text-sm overflow-x-auto shadow-inner"><code>${escapeHTML(codeBlockContent.join('\n'))}</code></pre>`);
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Handle Lists
      const listMatch = line.match(/^(\s*)([-*]|(\d+)\.)\s+(.*)$/);
      if (listMatch) {
        const indent = listMatch[1].length;
        const depth = Math.floor(indent / 2);
        const isOrdered = !!listMatch[3];
        const content = listMatch[4];
        const type = isOrdered ? 'ol' : 'ul';

        if (depth > listStack.length - 1) {
          while (depth > listStack.length - 1) {
            const className = isOrdered ? 'my-2 ml-4 space-y-2 list-decimal' : 'my-2 ml-4 space-y-2 list-disc';
            result.push(`<${type} class="${className}">`);
            listStack.push(type);
          }
        } else if (depth < listStack.length - 1) {
          closeLists(depth + 1);
        } else if (listStack.length > 0 && listStack[listStack.length - 1] !== type) {
          // Same depth but different type (e.g. UL followed by OL)
          closeLists(depth);
          const className = isOrdered ? 'my-2 ml-4 space-y-2 list-decimal' : 'my-2 ml-4 space-y-2 list-disc';
          result.push(`<${type} class="${className}">`);
          listStack.push(type);
        }

        result.push(`<li class="text-slate-700 dark:text-slate-300 ml-4">${parseInline(content)}</li>`);
        return;
      } else if (line.trim() === '') {
        // Keep blank lines for spacing, but don't close lists yet
      } else {
        closeLists(0);
      }

      // Headers
      if (line.startsWith('# ')) {
        result.push(`<h1 class="text-3xl font-black mt-10 mb-6 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">${parseInline(line.slice(2))}</h1>`);
      } else if (line.startsWith('## ')) {
        result.push(`<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">${parseInline(line.slice(3))}</h2>`);
      } else if (line.startsWith('### ')) {
        result.push(`<h3 class="text-xl font-bold mt-6 mb-2 text-slate-900 dark:text-white">${parseInline(line.slice(4))}</h3>`);
      } else if (line.startsWith('> ')) {
        result.push(`<blockquote class="border-l-4 border-indigo-500 pl-4 italic my-6 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 py-2 rounded-r-lg">${parseInline(line.slice(2))}</blockquote>`);
      } else if (line.trim() !== '') {
        result.push(`<p class="my-4 text-slate-700 dark:text-slate-300 leading-relaxed">${parseInline(line)}</p>`);
      }
    });

    closeLists(0);
    return result.join('');
  };

  const parseInline = (text: string) => {
    let html = escapeHTML(text);

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono text-sm border border-slate-200 dark:border-slate-700">$1</code>');
    // Links
    html = html.replace(/\[(.*?)\]\(([^)\s\<\>"\']+)\)/g, (match, linkText, url) => {
      const isSafe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) &&
                    !/[\u0000-\u001F\u007F-\u009F]/.test(url) &&
                    !url.includes('&#') &&
                    !url.toLowerCase().includes('javascript:');
      return isSafe
        ? `<a href="${url}" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-4 hover:text-indigo-500 transition-colors" rel="noopener noreferrer" target="_blank">${linkText}</a>`
        : `<span class="text-slate-400 underline decoration-dotted" title="Lien non sécurisé">${linkText}</span>`;
    });

    return html;
  };

  const copyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setMode('edit')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'edit' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Code className="w-4 h-4" />
            Édition
          </button>
          <button
            onClick={() => setMode('split')}
            className={`hidden md:flex px-6 py-2 rounded-xl text-sm font-bold transition-all items-center gap-2 ${
              mode === 'split' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Divisé
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'preview' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            Aperçu
          </button>
        </div>

        <button
          onClick={copyMarkdown}
          className="w-full md:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copié' : 'Copier le Markdown'}
        </button>
      </div>

      <div className={`grid gap-6 ${mode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className="space-y-4">
            <label htmlFor="markdown-editor" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
              <FileText className="w-3 h-3" /> Éditeur Markdown
            </label>
            <textarea
              id="markdown-editor"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-[600px] p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white resize-none"
              placeholder="# Votre titre..."
            />
          </div>
        )}
        
        {(mode === 'preview' || mode === 'split') && (
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
              <Eye className="w-3 h-3" /> Rendu visuel
            </label>
            <div className="w-full h-[600px] p-8 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-y-auto shadow-sm">
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">Aide au formatage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-500">
          <div><code className="text-indigo-500 font-bold">#</code> Titre H1</div>
          <div><code className="text-indigo-500 font-bold">**gras**</code> Gras</div>
          <div><code className="text-indigo-500 font-bold">-</code> Liste</div>
          <div><code className="text-indigo-500 font-bold">[lien](url)</code> Lien</div>
        </div>
      </div>
    </div>
  );
}
