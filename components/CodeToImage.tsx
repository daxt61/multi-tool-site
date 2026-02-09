import { useState, useRef, useEffect } from 'react';
import { Download, Copy, Check, Type, Palette, Code2, RefreshCw, Layout } from 'lucide-react';

const THEMES = [
  { name: 'Aurora', from: '#00d2ff', to: '#3a7bd5' },
  { name: 'Sunset', from: '#f12711', to: '#f5af19' },
  { name: 'Ocean', from: '#2193b0', to: '#6dd5ed' },
  { name: 'Midnight', from: '#232526', to: '#414345' },
  { name: 'Lush', from: '#56ab2f', to: '#a8e063' },
  { name: 'Mauve', from: '#734b6d', to: '#42275a' },
  { name: 'Frost', from: '#000428', to: '#004e92' },
  { name: 'Passion', from: '#e53935', to: '#e35d5b' },
];

export function CodeToImage() {
  const [code, setCode] = useState(`function helloWorld() {\n  console.log("Hello, World!");\n}`);
  const [theme, setTheme] = useState(THEMES[0]);
  const [padding, setPadding] = useState(48);
  const [fontSize, setFontSize] = useState(16);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set font for measurement
    ctx.font = `${fontSize}px "Fira Code", "Courier New", monospace`;

    const lines = code.split('\n');
    const lineHeight = fontSize * 1.5;

    // Measure max line width
    let maxLineWidth = 0;
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      maxLineWidth = Math.max(maxLineWidth, metrics.width);
    });

    const xOffsetValue = showLineNumbers ? 50 : 20;
    const contentWidth = maxLineWidth + xOffsetValue + 40;
    const contentHeight = lines.length * lineHeight + 80;

    canvas.width = contentWidth + (padding * 2);
    canvas.height = contentHeight + (padding * 2);

    // Draw Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, theme.from);
    gradient.addColorStop(1, theme.to);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Window Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 20;

    // Draw Window Body
    const winX = padding;
    const winY = padding;
    const winW = canvas.width - (padding * 2);
    const winH = canvas.height - (padding * 2);

    ctx.fillStyle = '#1e1e1e';
    roundRect(ctx, winX, winY, winW, winH, 12, true, false);

    ctx.shadowBlur = 0; // Reset shadow

    // Draw Window Controls
    const dotRadius = 6;
    const dotY = winY + 20;
    ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(winX + 20 + (i * 20), dotY, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Code
    ctx.font = `${fontSize}px "Fira Code", "Courier New", monospace`;
    ctx.textBaseline = 'top';

    lines.forEach((line, i) => {
      const y = winY + 50 + (i * lineHeight);

      if (showLineNumbers) {
        ctx.fillStyle = '#555';
        ctx.fillText((i + 1).toString().padStart(2, ' '), winX + 20, y);
      }

      const xOffset = showLineNumbers ? 50 : 20;

      // Basic Syntax Highlighting (Regex based)
      let currentX = winX + xOffset;
      const tokens = line.match(/(".*?"|'.*?'|`.*?`|\s+|[a-zA-Z_]\w*|[0-9]+|.)/g) || [];

      tokens.forEach(token => {
        if (/^(function|const|let|var|return|if|else|for|while|import|export|from|default|class|extends|async|await|try|catch|finally|type|interface)$/.test(token)) {
          ctx.fillStyle = '#c586c0'; // Keyword
        } else if (/^(console|log|window|document|Math|JSON)$/.test(token)) {
          ctx.fillStyle = '#4fc1ff'; // Global
        } else if (/^\d+$/.test(token)) {
          ctx.fillStyle = '#b5cea8'; // Number
        } else if (/^(".*?"|'.*?'|`.*?`)$/.test(token)) {
          ctx.fillStyle = '#ce9178'; // String
        } else if (/^(\(|\)|\{|\}|\[|\]|;|,|\.)$/.test(token)) {
          ctx.fillStyle = '#808080'; // Punctuation
        } else {
          ctx.fillStyle = '#d4d4d4'; // Default
        }

        ctx.fillText(token, currentX, y);
        currentX += ctx.measureText(token).width;
      });
    });
  };

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: boolean, stroke: boolean) {
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
    if (stroke) ctx.stroke();
  }

  useEffect(() => {
    drawCanvas();
  }, [code, theme, padding, fontSize, showLineNumbers]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'code-snippet.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor & Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Code</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 p-6 bg-slate-900 text-slate-300 border border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed resize-none"
              placeholder="Collez votre code ici..."
            />
          </div>

          <div className="bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-3 text-indigo-500">
              <Palette className="w-5 h-5" />
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Apparence</h3>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setTheme(t)}
                  className={`w-full aspect-square rounded-xl transition-all border-2 ${
                    theme.name === t.name ? 'border-indigo-500 scale-110 z-10' : 'border-transparent'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                  title={t.name}
                />
              ))}
            </div>

            <div className="space-y-4 pt-2">
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Padding</span>
                    <span>{padding}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={padding}
                    onChange={(e) => setPadding(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Taille de police</span>
                    <span>{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
               </div>
               <button
                 onClick={() => setShowLineNumbers(!showLineNumbers)}
                 className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                   showLineNumbers ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-400'
                 }`}
               >
                 <span className="font-bold text-xs">Numéros de ligne</span>
                 <Check className={`w-4 h-4 ${showLineNumbers ? 'opacity-100' : 'opacity-0'}`} />
               </button>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Download className="w-5 h-5" /> Télécharger PNG
          </button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Aperçu</label>
          <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 flex items-center justify-center overflow-auto min-h-[500px]">
             <canvas ref={canvasRef} className="max-w-full h-auto shadow-2xl rounded-xl" />
          </div>
          <div className="flex items-center gap-3 justify-center text-slate-400 text-xs font-medium italic">
            <Layout className="w-3 h-3" /> Le rendu s'adapte automatiquement à la longueur de votre code.
          </div>
        </div>
      </div>
    </div>
  );
}
