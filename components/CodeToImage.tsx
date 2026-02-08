import { useState, useRef } from 'react';
import { Download, Image as ImageIcon, Palette, Code, Check } from 'lucide-react';

const THEMES = [
  { name: 'Sunset', from: '#f87171', to: '#6366f1' },
  { name: 'Ocean', from: '#38bdf8', to: '#2563eb' },
  { name: 'Emerald', from: '#34d399', to: '#059669' },
  { name: 'Midnight', from: '#1e293b', to: '#0f172a' },
  { name: 'Rose', from: '#fb7185', to: '#e11d48' },
  { name: 'Amber', from: '#fbbf24', to: '#d97706' },
];

export function CodeToImage() {
  const [code, setCode] = useState('function helloWorld() {\n  console.log("Hello, World!");\n}');
  const [theme, setTheme] = useState(THEMES[0]);
  const [fontSize, setFontSize] = useState(16);
  const [padding, setPadding] = useState(60);

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = code.split('\n');
    const lineHeight = fontSize * 1.5;
    const horizontalPadding = padding;
    const verticalPadding = padding;

    // Calculate dimensions
    ctx.font = `${fontSize}px monospace`;
    let maxLineWidth = 0;
    lines.forEach(line => {
      const width = ctx.measureText(line).width;
      if (width > maxLineWidth) maxLineWidth = width;
    });

    const innerWidth = Math.max(maxLineWidth + 80, 400);
    const innerHeight = (lines.length * lineHeight) + 80;

    const canvasWidth = innerWidth + (horizontalPadding * 2);
    const canvasHeight = innerHeight + (verticalPadding * 2);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 1. Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, theme.from);
    gradient.addColorStop(1, theme.to);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Code Container (Glassmorphism)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // slate-900 with alpha
    const rx = horizontalPadding;
    const ry = verticalPadding;
    const rw = innerWidth;
    const rh = innerHeight;
    const radius = 24;

    ctx.beginPath();
    ctx.moveTo(rx + radius, ry);
    ctx.lineTo(rx + rw - radius, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
    ctx.lineTo(rx + rw, ry + rh - radius);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
    ctx.lineTo(rx + radius, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
    ctx.lineTo(rx, ry + radius);
    ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
    ctx.closePath();
    ctx.fill();

    // 3. Header Dots
    const dotY = ry + 25;
    const firstDotX = rx + 25;
    ctx.fillStyle = '#ff5f56'; ctx.beginPath(); ctx.arc(firstDotX, dotY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffbd2e'; ctx.beginPath(); ctx.arc(firstDotX + 20, dotY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#27c93f'; ctx.beginPath(); ctx.arc(firstDotX + 40, dotY, 6, 0, Math.PI * 2); ctx.fill();

    // 4. Code Rendering
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    lines.forEach((line, i) => {
      const x = rx + 30;
      const y = ry + 60 + (i * lineHeight);

      // Basic syntax highlighting logic (manual parsing)
      let currentX = x;
      const tokens = line.split(/(\s+|[().,;{}[\]]|['"].*?['"]|\b(?:function|const|let|var|if|else|return|console|log)\b)/);

      tokens.forEach(token => {
        if (!token) return;

        if (/^(function|const|let|var|if|else|return)$/.test(token)) {
          ctx.fillStyle = '#c084fc'; // purple
        } else if (/^(console|log)$/.test(token)) {
          ctx.fillStyle = '#60a5fa'; // blue
        } else if (/^['"].*?['"]$/.test(token)) {
          ctx.fillStyle = '#4ade80'; // green
        } else if (/^[().,;{}[\]]$/.test(token)) {
          ctx.fillStyle = '#94a3b8'; // slate-400
        } else {
          ctx.fillStyle = '#e2e8f0'; // slate-200
        }

        ctx.fillText(token, currentX, y);
        currentX += ctx.measureText(token).width;
      });
    });

    const link = document.createElement('a');
    link.download = 'snippet.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Code className="w-3 h-3" /> Code Source
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300 resize-none"
              placeholder="Collez votre code ici..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Palette className="w-3 h-3" /> Thème du dégradé
            </label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setTheme(t)}
                  className={`h-12 rounded-xl transition-all border-2 ${theme.name === t.name ? 'border-indigo-500 scale-105 shadow-lg' : 'border-transparent hover:scale-105'}`}
                  style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                  title={t.name}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Taille police</label>
              <input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Padding</label>
              <input type="number" value={padding} onChange={(e) => setPadding(Number(e.target.value))} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm" />
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleDownload}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-slate-900/10"
            >
              <Download className="w-5 h-5" /> Exporter en PNG
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> Prévisualisation
            </label>
          </div>

          <div
            className="p-12 md:p-16 rounded-[3rem] transition-all duration-500 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
          >
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
               <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 border-b border-white/5">
                 <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                 <div className="ml-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">snippet.js</div>
               </div>
               <div className="p-8 overflow-auto max-h-[400px]">
                  <pre className="font-mono text-indigo-100 whitespace-pre" style={{ fontSize: `${fontSize}px` }}>
                    {code}
                  </pre>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
