import { useState, useRef } from 'react';
import { Download, Copy, Check, Type, Palette, Maximize2 } from 'lucide-react';

export function CodeToImage() {
  const [code, setCode] = useState('function helloWorld() {\n  console.log("Hello, world!");\n}');
  const [title, setTitle] = useState('index.js');
  const [theme, setTheme] = useState('bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500');
  const [padding, setPadding] = useState('p-12');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const themes = [
    { id: 'indigo', class: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500', from: '#6366f1', to: '#ec4899' },
    { id: 'ocean', class: 'bg-gradient-to-br from-blue-400 to-emerald-400', from: '#38bdf8', to: '#10b981' },
    { id: 'sunset', class: 'bg-gradient-to-br from-orange-500 to-rose-500', from: '#f97316', to: '#f43f5e' },
    { id: 'midnight', class: 'bg-slate-900', from: '#0f172a', to: '#0f172a' },
    { id: 'minimal', class: 'bg-slate-100 dark:bg-slate-800', from: '#f1f5f9', to: '#f1f5f9' },
    { id: 'aurora', class: 'bg-gradient-to-tr from-green-300 via-blue-500 to-purple-600', from: '#86efac', to: '#9333ea' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(2, 2);

    // Background
    const currentTheme = themes.find(t => t.class === theme) || themes[0];
    if (theme.includes('gradient')) {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, currentTheme.from);
      grad.addColorStop(1, currentTheme.to);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = currentTheme.from;
    }
    ctx.fillRect(0, 0, width, height);

    // Draw Window Card
    const cardPadding = padding === 'p-6' ? 24 : padding === 'p-12' ? 48 : 80;
    const cardW = width - cardPadding * 2;
    const cardH = height - cardPadding * 2;
    const cardX = cardPadding;
    const cardY = cardPadding;
    const r = 16;

    ctx.beginPath();
    ctx.moveTo(cardX + r, cardY);
    ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, r);
    ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, r);
    ctx.arcTo(cardX, cardY + cardH, cardX, cardY, r);
    ctx.arcTo(cardX, cardY, cardX + cardW, cardY, r);
    ctx.closePath();
    ctx.fillStyle = 'rgba(30, 41, 59, 0.95)'; // slate-900
    ctx.fill();

    // Window Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(cardX + 20, cardY + 20, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(cardX + 36, cardY + 20, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(cardX + 52, cardY + 20, 5, 0, Math.PI * 2); ctx.fill();

    // Title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, cardX + cardW / 2, cardY + 24);

    // Code with simple highlighting
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    const lines = code.split('\n');
    lines.forEach((line, i) => {
      let xOffset = 24;
      const words = line.split(/(\s+)/);
      words.forEach(word => {
        if (['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'export', 'import', 'from', 'async', 'await', 'try', 'catch'].includes(word.trim())) {
          ctx.fillStyle = '#c084fc'; // purple-400
        } else if (['true', 'false', 'null', 'undefined'].includes(word.trim())) {
          ctx.fillStyle = '#fb923c'; // orange-400
        } else if (word.includes('"') || word.includes("'") || word.includes("`")) {
          ctx.fillStyle = '#4ade80'; // green-400
        } else {
          ctx.fillStyle = '#818cf8'; // indigo-400
        }
        ctx.fillText(word, cardX + xOffset, cardY + 60 + i * 22);
        xOffset += ctx.measureText(word).width;
      });
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${title || 'code'}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Editor Side */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 shadow-sm">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Paramètres</label>

              <div className="space-y-2">
                <label htmlFor="filename" className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nom du fichier</label>
                <input
                  id="filename"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Arrière-plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {themes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.class)}
                      className={`h-10 rounded-lg border-2 transition-all ${theme === t.class ? 'border-indigo-500 scale-105' : 'border-transparent'} ${t.class}`}
                      aria-label={`Thème ${t.id}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Padding</label>
                <div className="flex gap-2">
                  {['p-6', 'p-12', 'p-20'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPadding(p)}
                      className={`flex-1 py-2 rounded-lg text-xs font-black transition-all border ${padding === p ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}
                    >
                      {p === 'p-6' ? 'S' : p === 'p-12' ? 'M' : 'L'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
               <button
                onClick={handleDownload}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Download className="w-5 h-5" /> Télécharger l'image
              </button>
              <button
                onClick={handleCopy}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />} {copied ? 'Copié !' : 'Copier le code'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Side */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Aperçu</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              <Maximize2 className="w-3 h-3" /> Wysiwyg
            </div>
          </div>

          <div
            ref={containerRef}
            className={`${theme} ${padding} rounded-[2.5rem] transition-all duration-500 shadow-2xl shadow-black/20 flex items-center justify-center min-h-[400px] overflow-hidden`}
          >
            <div className="w-full max-w-2xl bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
              {/* Window Header */}
              <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
                  {title}
                </div>
                <div className="w-12"></div>
              </div>
              {/* Code Area */}
              <div className="p-6 md:p-8">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="w-full bg-transparent text-indigo-300 font-mono text-sm md:text-base resize-none outline-none leading-relaxed h-[300px] no-scrollbar"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-black dark:text-white flex items-center gap-2 uppercase tracking-widest text-xs text-slate-400">
            <Palette className="w-4 h-4 text-indigo-500" /> Personnalisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Choisissez parmi une sélection de dégradés modernes et ajustez l'espacement pour créer la mise en page parfaite. L'interface s'adapte automatiquement au contenu de votre code.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-black dark:text-white flex items-center gap-2 uppercase tracking-widest text-xs text-slate-400">
            <Type className="w-4 h-4 text-indigo-500" /> Édition Directe
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Vous pouvez modifier le code directement dans l'aperçu pour voir le rendu final. Utilisez la police monospace intégrée pour un look professionnel immédiat.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-black dark:text-white flex items-center gap-2 uppercase tracking-widest text-xs text-slate-400">
            <Download className="w-4 h-4 text-indigo-500" /> Exportation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le bouton de téléchargement génère une image PNG haute résolution. Pour un rendu encore plus précis avec des polices spécifiques, nous recommandons de prendre une capture d'écran de l'aperçu.
          </p>
        </div>
      </div>
    </div>
  );
}
