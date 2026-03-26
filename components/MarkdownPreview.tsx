import { useState, useMemo } from 'react';
import { Eye, Code, FileText, Info, List, ListOrdered } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function MarkdownPreview() {
  const [markdown, setMarkdown] = useState('# Titre\n\nVotre texte **Markdown** ici...\n\n- Liste 1\n  - Sous-liste A\n- Liste 2\n\n```javascript\nconsole.log("Hello World");\n```\n\nCeci est un paragraphe sur\nplusieurs lignes.');
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
    const listStack: ('ul' | 'ol')[] = [];
    const indentStack: number[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let currentParagraph = '';

    const closeListsToLevel = (level: number) => {
      while (indentStack.length > 0 && indentStack[indentStack.length - 1] > level) {
        const type = listStack.pop();
        indentStack.pop();
        html += `</${type}>\n`;
      }
    };

    const closeAllLists = () => {
      while (listStack.length > 0) {
        const type = listStack.pop();
        html += `</${type}>\n`;
      }
      indentStack.length = 0;
    };

    const flushParagraph = () => {
      if (currentParagraph) {
        html += `<p class="my-4 text-slate-700 dark:text-slate-300 leading-relaxed">${processInline(currentParagraph.trim())}</p>\n`;
        currentParagraph = '';
      }
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Handle Code Blocks
      if (/^```/.test(trimmedLine)) {
        flushParagraph();
        if (inCodeBlock) {
          html += `<pre class="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl my-4 font-mono text-sm overflow-x-auto text-slate-900 dark:text-slate-100"><code>${codeContent.trim()}</code></pre>\n`;
          codeContent = '';
          inCodeBlock = false;
        } else {
          closeAllLists();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += escapeHTML(line) + '\n';
        return;
      }

      if (!trimmedLine) {
        flushParagraph();
        closeAllLists();
        html += '<br>\n';
        return;
      }

      // Handle Lists
      const ulMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
      const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      const listMatch = ulMatch || olMatch;

      if (listMatch) {
        flushParagraph();
        const indent = listMatch[1].length;
        const type = ulMatch ? 'ul' : 'ol';
        const content = listMatch[3];

        if (listStack.length === 0 || indent > indentStack[indentStack.length - 1]) {
          listStack.push(type);
          indentStack.push(indent);
          html += `<${type} class="my-4 ${indent > 0 ? 'ml-6' : ''}">\n`;
        } else if (indent < indentStack[indentStack.length - 1]) {
          closeListsToLevel(indent);
          if (listStack.length === 0 || indent > (indentStack[indentStack.length - 1] || -1)) {
            listStack.push(type);
            indentStack.push(indent);
            html += `<${type} class="my-4 ${indent > 0 ? 'ml-6' : ''}">\n`;
          } else if (type !== listStack[listStack.length - 1]) {
            const oldType = listStack.pop();
            html += `</${oldType}>\n<${type} class="my-4 ${indent > 0 ? 'ml-6' : ''}">\n`;
            listStack.push(type);
          }
        } else if (type !== listStack[listStack.length - 1]) {
          const oldType = listStack.pop();
          html += `</${oldType}>\n<${type} class="my-4 ${indent > 0 ? 'ml-6' : ''}">\n`;
          listStack.push(type);
        }

        html += `<li class="${type === 'ul' ? 'list-disc' : 'list-decimal'} ml-6 text-slate-700 dark:text-slate-300 my-1">${processInline(content)}</li>\n`;
        return;
      }

      // Headers
      if (/^# /.test(trimmedLine)) {
        flushParagraph();
        closeAllLists();
        html += `<h1 class="text-2xl font-black mt-10 mb-6 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">${processInline(trimmedLine.slice(2))}</h1>\n`;
      } else if (/^## /.test(trimmedLine)) {
        flushParagraph();
        closeAllLists();
        html += `<h2 class="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">${processInline(trimmedLine.slice(3))}</h2>\n`;
      } else if (/^### /.test(trimmedLine)) {
        flushParagraph();
        closeAllLists();
        html += `<h3 class="text-lg font-bold mt-6 mb-2 text-slate-900 dark:text-white">${processInline(trimmedLine.slice(4))}</h3>\n`;
      }
      // Blockquotes
      else if (/^> /.test(trimmedLine)) {
        flushParagraph();
        closeAllLists();
        html += `<blockquote class="border-l-4 border-slate-300 dark:border-slate-700 pl-4 italic my-6 text-slate-600 dark:text-slate-400">${processInline(trimmedLine.slice(2))}</blockquote>\n`;
      }
      // Paragraph line
      else {
        closeAllLists();
        currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
      }
    });

    flushParagraph();
    closeAllLists();
    
    if (inCodeBlock) {
      html += `<pre class="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl my-4 font-mono text-sm overflow-x-auto text-slate-900 dark:text-slate-100"><code>${codeContent.trim()}</code></pre>\n`;
    }

    function processInline(text: string) {
      let escaped = escapeHTML(text);

      // Inline code
      escaped = escaped.replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono text-sm">$1</code>');

      // Bold
      escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');

      // Italic
      escaped = escaped.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

      // Links
      escaped = escaped.replace(/\[(.*?)\]\(([^)\s\<\>"\']+)\)/g, (match, linkText, url) => {
        const isSafe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) &&
                      !/[\u0000-\u001F\u007F-\u009F]/.test(url) &&
                      !url.includes('&#') &&
                      !url.toLowerCase().includes('javascript:');
        return isSafe
          ? `<a href="${url}" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-4 hover:text-indigo-500 transition-all" rel="noopener noreferrer" target="_blank">${linkText}</a>`
          : `<span class="text-slate-400 underline decoration-dotted" title="Lien non sécurisé">${linkText}</span>`;
      });

      return escaped;
    }

    return html;
  }, [markdown]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-2" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setMode('edit')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'edit' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Code className="w-4 h-4" /> Édition
          </button>
          <button
            onClick={() => setMode('split')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'split' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Eye className="w-4 h-4" /> Divisé
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'preview' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Eye className="w-4 h-4" /> Aperçu
          </button>
        </div>
      </div>

      <div className={`grid gap-8 ${mode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <FileText className="w-4 h-4 text-indigo-500" />
              <label htmlFor="markdown-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Éditeur Markdown</label>
            </div>
            <textarea
              id="markdown-input"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-[600px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-mono leading-relaxed dark:text-slate-300 resize-none"
              placeholder="# Titre..."
            />
          </div>
        )}
        
        {(mode === 'preview' || mode === 'split') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Eye className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Aperçu Rendu</label>
            </div>
            <div
              className="w-full h-[600px] p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-y-auto prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown }}
            />
          </div>
        )}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex flex-col md:flex-row items-start gap-8 mt-12">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 flex-1">
          <div className="space-y-2">
            <h4 className="font-bold dark:text-white flex items-center gap-2"><List className="w-4 h-4 text-indigo-500" /> Listes à puces</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Utilisez <code>-</code> ou <code>*</code> suivi d'un espace. Gérez les niveaux d'imbrication avec deux espaces de décalage.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold dark:text-white flex items-center gap-2"><ListOrdered className="w-4 h-4 text-indigo-500" /> Listes ordonnées</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Utilisez des chiffres suivis d'un point (ex: <code>1.</code>). Notre parseur gère automatiquement les listes imbriquées.
            </p>
          </div>
        </div>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
