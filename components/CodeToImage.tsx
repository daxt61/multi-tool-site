import { useState, useRef, useEffect } from 'react';
import { Download, Check, Palette, Type, Code } from 'lucide-react';

const THEMES = [
  { name: 'Sunset', from: '#f093fb', to: '#f5576c' },
  { name: 'Ocean', from: '#43e97b', to: '#38f9d7' },
  { name: 'Indigo', from: '#667eea', to: '#764ba2' },
  { name: 'Midnight', from: '#243b55', to: '#141e30' },
  { name: 'Aurora', from: '#00c6ff', to: '#0072ff' },
  { name: 'Peach', from: '#ff9a9e', to: '#fecfef' },
];

export function CodeToImage() {
  const [code, setCode] = useState('function helloWorld() {\n  console.log("Hello, world!");\n}');
  const [theme, setTheme] = useState(THEMES[2]);
  const [fontSize, setFontSize] = useState(16);
  const [padding, setPadding] = useState(40);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = code.split('\n');
    const lineHeight = fontSize * 1.5;

    // Calculate dimensions
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    let maxLineWidth = 0;
    lines.forEach(line => {
      const width = ctx.measureText(line).width;
      if (width > maxLineWidth) maxLineWidth = width;
    });

    const lnWidth = showLineNumbers ? fontSize * 3 : 0;
    const innerWidth = maxLineWidth + lnWidth + 40;
    const innerHeight = lines.length * lineHeight + 40;

    const canvasWidth = innerWidth + padding * 2;
    const canvasHeight = innerHeight + padding * 2;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, theme.from);
    gradient.addColorStop(1, theme.to);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw Code Container
    const containerX = padding;
    const containerY = padding;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';

    // Rounded Rect for Container
    const r = 16;
    ctx.beginPath();
    ctx.moveTo(containerX + r, containerY);
    ctx.lineTo(containerX + innerWidth - r, containerY);
    ctx.quadraticCurveTo(containerX + innerWidth, containerY, containerX + innerWidth, containerY + r);
    ctx.lineTo(containerX + innerWidth, containerY + innerHeight - r);
    ctx.quadraticCurveTo(containerX + innerWidth, containerY + innerHeight, containerX + innerWidth - r, containerY + innerHeight);
    ctx.lineTo(containerX + r, containerY + innerHeight);
    ctx.quadraticCurveTo(containerX, containerY + innerHeight, containerX, containerY + innerHeight - r);
    ctx.lineTo(containerX, containerY + r);
    ctx.quadraticCurveTo(containerX, containerY, containerX + r, containerY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Window Controls
    const dotX = containerX + 20;
    const dotY = containerY + 20;
    const colors = ['#ff5f56', '#ffbd2e', '#27c93f'];
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(dotX + i * 20, dotY, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Code
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    ctx.textBaseline = 'top';

    lines.forEach((line, i) => {
      const y = containerY + 50 + i * lineHeight;

      if (showLineNumbers) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'right';
        ctx.fillText((i + 1).toString(), containerX + lnWidth - 10, y);
      }

      ctx.textAlign = 'left';
      // Basic syntax highlighting (very simple manual parsing)
      let currentX = containerX + lnWidth + 10;

      const words = line.split(/(\s+|[(){}[\];.,'"])/);
      words.forEach(word => {
        if (/^(function|const|let|var|if|else|return|export|import|from|class|extends|new|try|catch)$/.test(word)) {
          ctx.fillStyle = '#c678dd'; // Purple
        } else if (/^(console|window|document|Math|JSON)$/.test(word)) {
          ctx.fillStyle = '#e5c07b'; // Yellow
        } else if (/^[0-9]+$/.test(word)) {
          ctx.fillStyle = '#d19a66'; // Orange
        } else if (/^['"].*['"]$/.test(word)) {
          ctx.fillStyle = '#98c379'; // Green
        } else if (/[(){}[\];.,]/.test(word)) {
          ctx.fillStyle = '#abb2bf'; // Gray
        } else {
          ctx.fillStyle = '#61afef'; // Blue
        }
        ctx.fillText(word, currentX, y);
        currentX += ctx.measureText(word).width;
      });
    });
  };

  useEffect(() => {
    drawCanvas();
  }, [code, theme, fontSize, padding, showLineNumbers]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'code-snippet.png';
    link.href = url;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Preview Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Prévisualisation</h3>
            <div className="flex gap-2">
              <button
                onClick={downloadImage}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-4 h-4" /> PNG
              </button>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center overflow-auto min-h-[500px]">
            <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg shadow-2xl" />
          </div>
        </div>

        {/* Settings Area */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            {/* Code Input */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-500">
                <Code className="w-4 h-4" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Code</h4>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300"
                spellCheck={false}
              />
            </div>

            {/* Theme Picker */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-500">
                <Palette className="w-4 h-4" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Thème</h4>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setTheme(t)}
                    className={`h-12 rounded-xl transition-all border-2 ${
                      theme.name === t.name ? 'border-indigo-500 scale-105 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                    title={t.name}
                  />
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Taille Police</label>
                  <span className="text-xs font-black text-indigo-500">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Marge</label>
                  <span className="text-xs font-black text-indigo-500">{padding}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Toggles */}
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                showLineNumbers
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <span className="font-bold text-sm">Numéros de ligne</span>
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                showLineNumbers ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {showLineNumbers && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
