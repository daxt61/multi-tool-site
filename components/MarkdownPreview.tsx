import { useState, useMemo } from 'react';
import { Eye, Code, Split, FileText, Info } from 'lucide-react';

export function MarkdownPreview() {
  const [markdown, setMarkdown] = useState('# Bienvenue sur l\'Éditeur Markdown\n\nVoici quelques fonctionnalités :\n- **Gras** et *Italique*\n- Listes à puces\n  - Sous-éléments\n    - Encore plus profond\n- Blocs de code\n- Liens [comme celui-ci](https://google.com)\n\n```js\nconsole.log("Hello, World!");\n```');
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');

  const escapeHTML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const renderMarkdown = useMemo(() => {
    const lines = markdown.split('\n');
    let html = '';
    const listStack: string[] = [];
    const placeholders: string[] = [];

    const flushLists = (targetLevel = 0) => {
      while (listStack.length > targetLevel) {
        html += '</ul>';
        listStack.pop();
      }
    };

    let inCodeBlock = false;
    let codeContent = '';
    let codeLang = '';

    lines.forEach((line) => {
      // Code blocks
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLang = line.trim().slice(3);
          codeContent = '';
          flushLists();
        } else {
          inCodeBlock = false;
          const p = `__CODE_${placeholders.length}__`;
          placeholders.push(`<pre class="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl my-6 font-mono text-sm overflow-x-auto border border-slate-200 dark:border-slate-700"><code>${escapeHTML(codeContent)}</code></pre>`);
          html += p;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      // Headers
      if (line.startsWith('#')) {
        flushLists();
        const level = line.match(/^#+/)?.[0].length || 0;
        const text = line.replace(/^#+\s*/, '');
        const escapedText = escapeHTML(text);
        if (level === 1) html += `<h1 class="text-3xl font-black mt-10 mb-6 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">${escapedText}</h1>`;
        else if (level === 2) html += `<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">${escapedText}</h2>`;
        else if (level === 3) html += `<h3 class="text-xl font-bold mt-6 mb-2 text-slate-900 dark:text-white">${escapedText}</h3>`;
        else html += `<h${level} class="font-bold mt-4 mb-2 text-slate-900 dark:text-white">${escapedText}</h${level}>`;
        return;
      }

      // Blockquotes
      if (line.trim().startsWith('>')) {
        flushLists();
        const text = line.trim().replace(/^>\s*/, '');
        html += `<blockquote class="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5 pl-6 py-4 italic my-6 text-slate-600 dark:text-slate-400 rounded-r-xl">${escapeHTML(text)}</blockquote>`;
        return;
      }

      // Lists
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
      if (listMatch) {
        const indent = listMatch[1].length;
        const level = Math.floor(indent / 2) + 1;
        const text = listMatch[3];

        if (level > listStack.length) {
          while (listStack.length < level) {
            html += `<ul class="${listStack.length === 0 ? 'list-disc space-y-1 my-4' : 'ml-6 list-disc space-y-1 my-2'}">`;
            listStack.push('ul');
          }
        } else if (level < listStack.length) {
          flushLists(level);
        }

        html += `<li class="text-slate-700 dark:text-slate-300">${escapeHTML(text)}</li>`;
        return;
      }

      // Paragraphs
      if (line.trim() === '') {
        flushLists();
        html += '<div class="h-4"></div>';
      } else {
        flushLists();
        html += `<p class="text-slate-700 dark:text-slate-300 leading-relaxed my-2">${escapeHTML(line)}</p>`;
      }
    });

    flushLists();

    // Inline rules
    let finalHtml = html;
    
    // Bold
    finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    // Italic
    finalHtml = finalHtml.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    // Inline code
    finalHtml = finalHtml.replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-indigo-600 dark:text-indigo-400 font-mono text-sm border border-slate-200 dark:border-slate-700">$1</code>');
    // Links
    finalHtml = finalHtml.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
        const isSafe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) && !url.toLowerCase().includes('javascript:');
        return isSafe
            ? `<a href="${url}" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-4 font-bold hover:text-indigo-500" target="_blank" rel="noopener noreferrer">${text}</a>`
            : `<span class="text-slate-400">${text}</span>`;
    });

    // Restore code blocks
    placeholders.forEach((content, i) => {
      finalHtml = finalHtml.replace(`__CODE_${i}__`, content);
    });

    return finalHtml;
  }, [markdown]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Mode Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'edit', name: 'Édition', icon: Code },
            { id: 'split', name: 'Divisé', icon: Split },
            { id: 'preview', name: 'Aperçu', icon: Eye },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === item.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-8 ${mode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Markdown Source
              </label>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-[600px] p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-inner"
              placeholder="# Votre titre..."
            />
          </div>
        )}
        
        {(mode === 'preview' || mode === 'split') && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Rendu Final
              </label>
            </div>
            <div
              className="w-full h-[600px] p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-y-auto shadow-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown }}
            />
          </div>
        )}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/50 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">Traitement local & sécurisé</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Votre contenu Markdown est traité entièrement dans votre navigateur. Aucune donnée n'est envoyée à nos serveurs, garantissant une confidentialité totale pour vos notes et documents. Le moteur de rendu supporte les syntaxes standards GFM (GitHub Flavored Markdown).
          </p>
        </div>
      </div>
    </div>
  );
}
