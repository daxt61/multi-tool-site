import { useState, useRef, useEffect } from 'react';
import { Camera, Download, Settings2, Palette, Type, Copy, Check } from 'lucide-react';

const THEMES = [
  { name: 'Ocean', gradient: 'from-blue-500 to-cyan-500' },
  { name: 'Sunset', gradient: 'from-orange-500 to-rose-500' },
  { name: 'Grape', gradient: 'from-purple-500 to-indigo-500' },
  { name: 'Emerald', gradient: 'from-emerald-500 to-teal-500' },
  { name: 'Dark', gradient: 'from-slate-800 to-slate-900' },
  { name: 'Midnight', gradient: 'from-gray-900 to-black' },
];

export function CodeToImage() {
  const [code, setCode] = useState('function helloWorld() {\n  console.log("Hello, World!");\n  return true;\n}');
  const [theme, setTheme] = useState(THEMES[0]);
  const [fontSize, setFontSize] = useState(16);
  const [padding, setPadding] = useState(40);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = code.split('\n');
    const lineHeight = fontSize * 1.5;

    // Calculate dimensions
    ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", monospace`;
    const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const lineNumberWidth = showLineNumbers ? ctx.measureText('00 ').width : 0;

    const contentWidth = maxLineWidth + lineNumberWidth;
    const contentHeight = lines.length * lineHeight;

    const width = contentWidth + (padding * 2);
    const height = contentHeight + (padding * 2);

    // Scale for high resolution
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (theme.name === 'Midnight') {
      gradient.addColorStop(0, '#111827');
      gradient.addColorStop(1, '#000000');
    } else if (theme.name === 'Dark') {
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
    } else if (theme.name === 'Ocean') {
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#06b6d4');
    } else if (theme.name === 'Sunset') {
      gradient.addColorStop(0, '#f97316');
      gradient.addColorStop(1, '#f43f5e');
    } else if (theme.name === 'Grape') {
      gradient.addColorStop(0, '#a855f7');
      gradient.addColorStop(1, '#6366f1');
    } else if (theme.name === 'Emerald') {
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(1, '#14b8a6');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw window
    const winPadding = 20;
    const winX = padding - winPadding;
    const winY = padding - winPadding;
    const winW = contentWidth + (winPadding * 2);
    const winH = contentHeight + (winPadding * 2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, 12);
    ctx.fill();

    // Draw window dots
    const dots = ['#ff5f56', '#ffbd2e', '#27c93f'];
    dots.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(winX + 20 + (i * 20), winY + 18, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Code
    ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", monospace`;
    ctx.textBaseline = 'top';

    const startY = padding + 15;

    lines.forEach((line, i) => {
      const y = startY + (i * lineHeight);

      if (showLineNumbers) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillText(`${i + 1}`.padStart(2, ' '), padding - 10, y);
      }

      const x = padding + lineNumberWidth;

      // Basic Syntax Highlighting Logic (manual regex)
      const tokens = line.split(/(\s+|[{}()\[\];.,!]|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\d+|\w+)/g).filter(Boolean);
      let currentX = x;

      tokens.forEach(token => {
        if (/^(function|return|if|else|for|while|const|let|var|import|export|from|class|extends|new|try|catch|async|await)$/.test(token)) {
          ctx.fillStyle = '#c678dd'; // Purple
        } else if (/^"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'$/.test(token)) {
          ctx.fillStyle = '#98c379'; // Green
        } else if (/^\d+$/.test(token)) {
          ctx.fillStyle = '#d19a66'; // Orange
        } else if (/^[A-Z]\w*$/.test(token)) {
          ctx.fillStyle = '#e5c07b'; // Yellow (Class/Type)
        } else if (/^[a-z]\w*(?=\()/.test(token)) {
          ctx.fillStyle = '#61afef'; // Blue (Function call)
        } else if (/[{}()\[\];.,!]/.test(token)) {
          ctx.fillStyle = '#abb2bf'; // Gray
        } else {
          ctx.fillStyle = '#ffffff';
        }

        ctx.fillText(token, currentX, y);
        currentX += ctx.measureText(token).width;
      });
    });
  };

  useEffect(() => {
    // Load font before rendering
    document.fonts.load(`${fontSize}px "JetBrains Mono"`).then(renderCanvas);
    renderCanvas();
  }, [code, theme, fontSize, padding, showLineNumbers]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'code-snippet.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const copyToClipboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (blob) {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Side */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
             <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code Source</label>
             </div>
             <textarea
               value={code}
               onChange={(e) => setCode(e.target.value)}
               className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300 resize-none"
               spellCheck={false}
             />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-8">
             <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <Palette className="w-4 h-4" /> Thème du dégradé
                </label>
                <div className="grid grid-cols-3 gap-2">
                   {THEMES.map(t => (
                     <button
                       key={t.name}
                       onClick={() => setTheme(t)}
                       className={`h-12 rounded-xl bg-gradient-to-br ${t.gradient} border-4 transition-all ${theme.name === t.name ? 'border-indigo-600 scale-105 shadow-lg' : 'border-transparent hover:scale-105'}`}
                       title={t.name}
                     />
                   ))}
                </div>
             </div>

             <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Type className="w-4 h-4" /> Taille de police
                   </label>
                   <span className="text-sm font-bold text-indigo-600">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                <div className="flex justify-between items-center">
                   <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Settings2 className="w-4 h-4" /> Padding
                   </label>
                   <span className="text-sm font-bold text-indigo-600">{padding}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                <button
                  onClick={() => setShowLineNumbers(!showLineNumbers)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    showLineNumbers ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-sm">Numéros de ligne</span>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${showLineNumbers ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                    {showLineNumbers && <Check className="w-3 h-3" />}
                  </div>
                </button>
             </div>
          </div>
        </div>

        {/* Preview Side */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-slate-200 dark:bg-slate-800/50 rounded-[2.5rem] p-4 flex items-center justify-center overflow-auto min-h-[500px]">
             <canvas
               ref={canvasRef}
               className="max-w-full h-auto shadow-2xl rounded-xl"
               style={{ width: 'auto', height: 'auto' }}
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button
               onClick={copyToClipboard}
               className={`flex items-center justify-center gap-3 py-5 rounded-3xl font-black text-lg transition-all active:scale-95 ${
                 copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
               }`}
             >
               {copied ? <Check className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
               {copied ? 'Copié !' : 'Copier Image'}
             </button>
             <button
               onClick={downloadImage}
               className="flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg transition-all hover:bg-indigo-700 active:scale-95 shadow-xl shadow-indigo-600/20"
             >
               <Download className="w-6 h-6" />
               Télécharger
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
