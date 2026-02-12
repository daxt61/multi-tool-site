import React, { useState, useRef, useEffect } from 'react';
import { Download, Palette, Settings, Sparkles } from 'lucide-react';

const THEMES = {
  indigo: { from: '#4f46e5', to: '#7c3aed', bg: '#1e1b4b' },
  rose: { from: '#e11d48', to: '#f43f5e', bg: '#4c0519' },
  emerald: { from: '#059669', to: '#10b981', bg: '#022c22' },
  amber: { from: '#d97706', to: '#f59e0b', bg: '#451a03' },
  slate: { from: '#475569', to: '#64748b', bg: '#0f172a' },
  sunset: { from: '#f43f5e', to: '#fb923c', bg: '#450a0a' },
};

const tokenize = (line: string) => {
  const tokens: { value: string, type: string }[] = [];
  const regex = /(const|let|var|function|return|if|else|for|while|import|export|from|class|extends|new|true|false|null|undefined|console|log|await|async)|("[^"]*"|'[^']*'|`[^`]*`)|(\d+)|(\/\/.*)|([a-zA-Z_$][a-zA-Z\d_$]*\()|([{}()[\].,;:])|(\s+)|(.+)/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match[1]) tokens.push({ value: match[1], type: 'keyword' });
    else if (match[2]) tokens.push({ value: match[2], type: 'string' });
    else if (match[3]) tokens.push({ value: match[3], type: 'number' });
    else if (match[4]) tokens.push({ value: match[4], type: 'comment' });
    else if (match[5]) tokens.push({ value: match[5], type: 'function' });
    else if (match[6]) tokens.push({ value: match[6], type: 'punctuation' });
    else if (match[7]) tokens.push({ value: match[7], type: 'space' });
    else tokens.push({ value: match[8], type: 'default' });
  }
  return tokens;
};

const getStyleForToken = (type: string) => {
  switch (type) {
    case 'keyword': return '#c678dd';
    case 'string': return '#98c379';
    case 'number': return '#d19a66';
    case 'comment': return '#5c6370';
    case 'function': return '#61afef';
    case 'punctuation': return '#abb2bf';
    default: return '#abb2bf';
  }
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: boolean) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
};

export function CodeToImage() {
  const [code, setCode] = useState(`function helloWorld() {
  console.log("Hello, World!");
  const result = 42 + 10;
  return result;
}`);
  const [theme, setTheme] = useState('indigo');
  const [padding, setPadding] = useState(60);
  const [fontSize, setFontSize] = useState(16);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = code.split('\n');
    const lineHeight = fontSize * 1.5;

    // Measure text
    ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", monospace`;
    let maxWidth = 0;
    lines.forEach(line => {
      const width = ctx.measureText(line).width;
      if (width > maxWidth) maxWidth = width;
    });

    const windowPadding = 40;
    const canvasWidth = maxWidth + (padding * 2) + (windowPadding * 2);
    const canvasHeight = (lines.length * lineHeight) + (padding * 2) + (windowPadding * 2) + 40;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw Background Gradient
    const currentTheme = THEMES[theme as keyof typeof THEMES];
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, currentTheme.from);
    gradient.addColorStop(1, currentTheme.to);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw Window
    const winX = padding;
    const winY = padding;
    const winW = canvasWidth - (padding * 2);
    const winH = canvasHeight - (padding * 2);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.shadowBlur = 40;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    roundRect(ctx, winX, winY, winW, winH, 16, true);
    ctx.shadowBlur = 0;

    // Window controls
    const colors = ['#ff5f56', '#ffbd2e', '#27c93f'];
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(winX + 25 + (i * 20), winY + 25, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Code with basic syntax highlighting
    ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", monospace`;
    ctx.textBaseline = 'top';

    const startX = winX + windowPadding;
    const startY = winY + 60;

    lines.forEach((line, i) => {
      let x = startX;
      const tokens = tokenize(line);
      tokens.forEach(token => {
        ctx.fillStyle = getStyleForToken(token.type);
        ctx.fillText(token.value, x, startY + (i * lineHeight));
        x += ctx.measureText(token.value).width;
      });
    });
  };

  useEffect(() => {
    drawCode();
  }, [code, theme, padding, fontSize]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'code-snippet.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Code</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCode('')}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  Effacer
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-80 p-6 bg-slate-900 text-slate-300 border border-slate-800 rounded-3xl font-mono text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
              placeholder="Paste your code here..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Thème
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(THEMES).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`h-12 rounded-xl transition-all border-2 ${theme === t ? 'border-indigo-500 scale-105' : 'border-transparent'}`}
                    style={{ background: `linear-gradient(135deg, ${THEMES[t as keyof typeof THEMES].from}, ${THEMES[t as keyof typeof THEMES].to})` }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Options
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>Padding</span>
                    <span>{padding}px</span>
                  </div>
                  <input type="range" min="20" max="100" value={padding} onChange={(e) => setPadding(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>Police</span>
                    <span>{fontSize}px</span>
                  </div>
                  <input type="range" min="12" max="24" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={downloadImage}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <Download className="w-6 h-6" />
            Télécharger l'image
          </button>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center px-1 mb-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Aperçu</label>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Rendu Haute Définition
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-4 flex items-center justify-center overflow-auto min-h-[500px]">
            <canvas ref={canvasRef} className="max-w-full shadow-2xl rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
