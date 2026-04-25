import React, { useState, useEffect, useMemo } from 'react';
import { ImageIcon, Copy, Check, Trash2, Download, Palette, Type, Maximize } from 'lucide-react';

export function SVGPlaceholder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [width, setWidth] = useState(initialData?.width ?? 800);
  const [height, setHeight] = useState(initialData?.height ?? 450);
  const [text, setText] = useState(initialData?.text || '');
  const [bgColor, setBgColor] = useState(initialData?.bgColor || '#f1f5f9');
  const [textColor, setTextColor] = useState(initialData?.textColor || '#64748b');
  const [fontSize, setFontSize] = useState(initialData?.fontSize ?? 24);
  const [copied, setCopied] = useState<'svg' | 'uri' | null>(null);

  useEffect(() => {
    onStateChange?.({ width, height, text, bgColor, textColor, fontSize });
  }, [width, height, text, bgColor, textColor, fontSize, onStateChange]);

  const svgContent = useMemo(() => {
    const escapeHtml = (str: string) => {
      return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m] || m));
    };
    const displayText = escapeHtml(text || `${width} x ${height}`);
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="sans-serif" font-size="${fontSize}" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${displayText}</text>
</svg>`;
  }, [width, height, text, bgColor, textColor, fontSize]);

  const dataUri = useMemo(() => {
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  }, [svgContent]);

  const handleCopy = (type: 'svg' | 'uri') => {
    const content = type === 'svg' ? svgContent : dataUri;
    navigator.clipboard.writeText(content);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `placeholder-${width}x${height}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setText('');
    setWidth(800);
    setHeight(450);
    setBgColor('#f1f5f9');
    setTextColor('#64748b');
    setFontSize(24);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Controls */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="svg-width" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Largeur (px)</label>
                <input
                  id="svg-width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="svg-height" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Hauteur (px)</label>
                <input
                  id="svg-height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="svg-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte (Optionnel)</label>
                <button
                  onClick={handleClear}
                  className="text-xs font-bold text-rose-500 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Réinitialiser
                </button>
              </div>
              <input
                id="svg-text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`${width} x ${height}`}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <Palette className="w-4 h-4 text-indigo-500" /> Couleurs
                </label>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fond</div>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full h-12 rounded-xl cursor-pointer border-2 border-white dark:border-slate-700 shadow-sm"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Texte</div>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full h-12 rounded-xl cursor-pointer border-2 border-white dark:border-slate-700 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label htmlFor="font-size" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <Type className="w-4 h-4 text-indigo-500" /> Taille Police
                </label>
                <input
                  id="font-size"
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(Math.max(1, Number(e.target.value)))}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6">
          <div className="w-full aspect-video bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center p-8 overflow-hidden">
             <div
               className="w-full h-full shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
               dangerouslySetInnerHTML={{ __html: svgContent }}
             />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[400px]">
             <button
               onClick={() => handleCopy('svg')}
               className={`py-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${
                 copied === 'svg'
                   ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                   : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
               }`}
             >
               {copied === 'svg' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
               Copier SVG
             </button>
             <button
               onClick={() => handleCopy('uri')}
               className={`py-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${
                 copied === 'uri'
                   ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                   : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
               }`}
             >
               {copied === 'uri' ? <Check className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
               Copier Data URI
             </button>
             <button
               onClick={handleDownload}
               className="sm:col-span-2 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               <Download className="w-5 h-5" />
               Télécharger SVG
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
