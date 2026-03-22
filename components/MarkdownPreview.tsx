import { useState } from 'react';
import { Eye, Code, Trash2, Info, FileText } from 'lucide-react';

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
    const placeholders: string[] = [];
    let html = escapeHTML(text);

    html = html.replace(/```(?:[a-z]*)\n?([\s\S]*?)```/g, (_, code) => {
      const p = `__BLOCK_${placeholders.length}__`;
      placeholders.push(`<pre class="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl my-6 font-mono text-sm overflow-x-auto text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"><code>${code}</code></pre>`);
      return p;
    });

    html = html.replace(/`(.*?)`/g, (_, code) => {
      const p = `__INLINE_${placeholders.length}__`;
      placeholders.push(`<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-indigo-600 dark:text-indigo-400 font-mono text-sm border border-slate-200 dark:border-slate-700">${code}</code>`);
      return p;
    });
    
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-8 mb-4 text-slate-900 dark:text-white">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-10 mb-6 text-slate-900 dark:text-white">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black mt-12 mb-8 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">$1</h1>');
    
    html = html.replace(/^\s*&gt;\s+(.*)$/gim, '<blockquote class="border-l-4 border-indigo-500 dark:border-indigo-400 pl-6 italic my-8 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 py-4 pr-4 rounded-r-2xl">$1</blockquote>');
    
    html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li class="ml-6 list-disc text-slate-700 dark:text-slate-300 my-2">$1</li>');
    html = html.replace(/((?:<li.*?>.*?<\/li>\s*)+)/g, '<ul class="my-6">$1</ul>');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    html = html.replace(/\[(.*?)\]\(([^)\s\<\>"\']+)\)/g, (match, linkText, url) => {
      const isSafe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) &&
                    !/[\u0000-\u001F\u007F-\u009F]/.test(url) &&
                    !url.includes('&#') &&
                    !url.toLowerCase().includes('javascript:');
      return isSafe
        ? `<a href="${url}" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-4 hover:text-indigo-500 transition-colors font-bold" rel="noopener noreferrer" target="_blank">${linkText}</a>`
        : `<span class="text-slate-400 underline decoration-dotted" title="Lien non sécurisé">${linkText}</span>`;
    });
    
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/<br>\s*<(ul|li|blockquote|pre|h1|h2|h3)/gi, '<$1');
    html = html.replace(/<\/(ul|li|blockquote|pre|h1|h2|h3)>\s*<br>/gi, '</$1>');
    
    placeholders.forEach((content, i) => {
      html = html.replace(new RegExp(`__(?:BLOCK|INLINE)_${i}__`, 'g'), content);
    });

    return html;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setMode('edit')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'edit' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code className="w-4 h-4" /> Édition
          </button>
          <button
            onClick={() => setMode('split')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'split' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Divisé
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'preview' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" /> Aperçu
          </button>
        </div>
        <button
          onClick={() => setMarkdown('')}
          className="text-xs font-bold px-4 py-2 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-2"
        >
          <Trash2 className="w-3 h-3" /> Effacer
        </button>
      </div>

      <div className={`grid gap-8 ${mode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(mode === 'edit' || mode === 'split') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Code className="w-4 h-4 text-indigo-500" />
              <label htmlFor="md-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Éditeur Markdown</label>
            </div>
            <textarea
              id="md-input"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-[600px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
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
              className="w-full h-[600px] p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-y-auto prose dark:prose-invert max-w-none shadow-inner"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          </div>
        )}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <FileText className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">Guide Rapide Markdown</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <code className="text-indigo-500 font-bold"># Titre</code>
              <p className="text-slate-500 text-xs">H1 Header</p>
            </div>
            <div className="space-y-1">
              <code className="text-indigo-500 font-bold">**Gras**</code>
              <p className="text-slate-500 text-xs">Texte important</p>
            </div>
            <div className="space-y-1">
              <code className="text-indigo-500 font-bold">*Italique*</code>
              <p className="text-slate-500 text-xs">Texte accentué</p>
            </div>
            <div className="space-y-1">
              <code className="text-indigo-500 font-bold">- Liste</code>
              <p className="text-slate-500 text-xs">Puces non ordonnées</p>
            </div>
            <div className="space-y-1">
              <code className="text-indigo-500 font-bold">[Lien](url)</code>
              <p className="text-slate-500 text-xs">Lien hypertexte</p>
            </div>
            <div className="space-y-1">
              <code className="text-indigo-500 font-bold">`Code`</code>
              <p className="text-slate-500 text-xs">Code en ligne</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
