import { useState, useRef, useEffect } from 'react';
import { Download, Copy, Check, Type, Palette, RefreshCw, Image as ImageIcon } from 'lucide-react';

export function CodeToImage() {
  const [code, setCode] = useState('function hello() {\n  console.log("Hello, World!");\n}');
  const [theme, setTheme] = useState('dark');
  const [padding, setPadding] = useState(40);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions
    const lines = code.split('\n');
    const lineHeight = 24;
    const fontSize = 16;
    const font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

    ctx.font = font;
    let maxLineWidth = 0;
    lines.forEach(line => {
      const width = ctx.measureText(line).width;
      if (width > maxLineWidth) maxLineWidth = width;
    });

    const contentWidth = maxLineWidth + padding * 2;
    const contentHeight = lines.length * lineHeight + padding * 2 + 40; // +40 for window controls

    canvas.width = contentWidth;
    canvas.height = contentHeight;

    // Draw Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (theme === 'dark') {
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
    } else {
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Editor Window
    const winX = padding;
    const winY = padding;
    const winW = canvas.width - padding * 2;
    const winH = canvas.height - padding * 2;

    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.fillStyle = theme === 'dark' ? '#000000' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, 12);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Window Controls
    const colors = ['#ff5f56', '#ffbd2e', '#27c93f'];
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(winX + 20 + i * 20, winY + 20, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Code
    ctx.font = font;
    ctx.fillStyle = theme === 'dark' ? '#f8fafc' : '#1e293b';
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => {
      ctx.fillText(line, winX + 20, winY + 50 + i * lineHeight);
    });
  };

  useEffect(() => {
    drawCode();
  }, [code, theme, padding]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'code-snippet.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Code</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none dark:text-slate-300"
              spellCheck="false"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Thème</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none"
              >
                <option value="dark">Sombre</option>
                <option value="light">Clair</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Marge</label>
              <input
                type="range"
                min="20"
                max="100"
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-4"
              />
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" /> Télécharger l'image
          </button>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Aperçu</label>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-4 flex items-center justify-center overflow-auto min-h-[400px]">
            <canvas ref={canvasRef} className="max-w-full shadow-2xl rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
