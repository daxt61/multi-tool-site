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
    // Escape input to prevent XSS
    let html = escapeHTML(text);

    // 1. Code inline (processed first to protect content)
    html = html.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
    
    // 2. Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');
    
    // 3. Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    
    // 4. Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // 5. Links (processed after bold/italic to ensure we don't match if tags were injected into URL)
    // The URL regex excludes < and > to prevent attribute breakout from previous rules
    html = html.replace(/\[(.*?)\]\(([^)\s\<\>]+)\)/g, (match, linkText, url) => {
      const isSafe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url);
      return isSafe
        ? `<a href="${url}" class="text-blue-500 underline" rel="noopener noreferrer" target="_blank">${linkText}</a>`
        : `<span class="text-blue-500 underline" title="Lien non sécurisé">${linkText}</span>`;
    });
    
    // 6. Line breaks
    html = html.replace(/\n/g, '<br>');
    
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Markdown
            </label>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none font-mono text-sm"
              placeholder="# Titre..."
            />
          </div>
        )}
        
        {(mode === 'preview' || mode === 'split') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Aperçu
            </label>
            <div
              className="w-full h-96 p-4 border border-gray-300 rounded-lg overflow-y-auto bg-white prose"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          </div>
        )}
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
