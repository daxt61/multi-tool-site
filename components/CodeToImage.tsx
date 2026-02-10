import { useState, useRef, useEffect } from 'react';
import { Camera, Download, Copy, Check, Type, Palette, Layout, Code } from 'lucide-react';

const THEMES = [
  { name: 'Indigo Night', bg: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', text: '#ffffff' },
  { name: 'Ocean', bg: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)', text: '#ffffff' },
  { name: 'Sunset', bg: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', text: '#ffffff' },
  { name: 'Emerald', bg: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', text: '#ffffff' },
  { name: 'Slate', bg: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', text: '#ffffff' },
  { name: 'Rose', bg: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', text: '#ffffff' },
];

export function CodeToImage() {
  const [code, setCode] = useState('function helloWorld() {\n  console.log("Hello, World!");\n}');
  const [theme, setTheme] = useState(THEMES[0]);
  const [padding, setPadding] = useState(64);
  const [fontSize, setFontSize] = useState(16);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = code.split('\n');
    const lineHeight = fontSize * 1.5;

    // Calculate dimensions
    ctx.font = `${fontSize}px "Fira Code", monospace`;
    let maxLineWidth = 0;
    lines.forEach(line => {
      const width = ctx.measureText(line).width;
      if (width > maxLineWidth) maxLineWidth = width;
    });

    const contentWidth = maxLineWidth + (showLineNumbers ? 60 : 40);
    const contentHeight = lines.length * lineHeight + 40;

    canvas.width = contentWidth + padding * 2;
    canvas.height = contentHeight + padding * 2;

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    const colors = theme.bg.match(/#[a-fA-F0-9]{6}/g) || ['#6366f1', '#a855f7'];
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Editor Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    // Draw Editor Background
    ctx.fillStyle = '#1e293b';
    const editorX = padding;
    const editorY = padding;
    const editorWidth = contentWidth;
    const editorHeight = contentHeight;
    const radius = 16;

    ctx.beginPath();
    ctx.moveTo(editorX + radius, editorY);
    ctx.lineTo(editorX + editorWidth - radius, editorY);
    ctx.quadraticCurveTo(editorX + editorWidth, editorY, editorX + editorWidth, editorY + radius);
    ctx.lineTo(editorX + editorWidth, editorY + editorHeight - radius);
    ctx.quadraticCurveTo(editorX + editorWidth, editorY + editorHeight, editorX + editorWidth - radius, editorY + editorHeight);
    ctx.lineTo(editorX + radius, editorY + editorHeight);
    ctx.quadraticCurveTo(editorX, editorY + editorHeight, editorX, editorY + editorHeight - radius);
    ctx.lineTo(editorX, editorY + radius);
    ctx.quadraticCurveTo(editorX, editorY, editorX + radius, editorY);
    ctx.closePath();
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Draw Window Controls
    const dotColors = ['#ff5f56', '#ffbd2e', '#27c93f'];
    dotColors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(editorX + 20 + i * 20, editorY + 20, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Code
    ctx.font = `${fontSize}px "Fira Code", monospace`;
    ctx.textBaseline = 'top';

    lines.forEach((line, i) => {
      const y = editorY + 50 + i * lineHeight;

      if (showLineNumbers) {
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'right';
        ctx.fillText(String(i + 1), editorX + 40, y);
      }

      ctx.textAlign = 'left';
      const xStart = editorX + (showLineNumbers ? 60 : 30);

      // Simple Syntax Highlighting (Regex based)
      let xOffset = 0;
      const tokens = line.split(/(\s+|[(){}[\].,;]|\b(?:function|const|let|var|if|else|return|for|while|import|from|export|default|class|extends|await|async|try|catch)\b|\b\d+\b|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g);

      tokens.forEach(token => {
        if (!token) return;

        if (/^(?:function|const|let|var|if|else|return|for|while|import|from|export|default|class|extends|await|async|try|catch)$/.test(token)) {
          ctx.fillStyle = '#c678dd'; // Keywords
        } else if (/^\d+$/.test(token)) {
          ctx.fillStyle = '#d19a66'; // Numbers
        } else if (/^["'].*["']$/.test(token)) {
          ctx.fillStyle = '#98c379'; // Strings
        } else if (/^[(){}[\].,;]$/.test(token)) {
          ctx.fillStyle = '#abb2bf'; // Punctuation
        } else {
          ctx.fillStyle = '#e06c75'; // Default (identifiers)
        }

        if (/\s+/.test(token)) {
           // Skip spaces for highlighting but keep offset
        }

        ctx.fillText(token, xStart + xOffset, y);
        xOffset += ctx.measureText(token).width;
      });
    });
  };

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

  const handleCopy = () => {
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
        {/* Editor Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Code className="w-3 h-3" /> Code Source
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-48 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300"
                spellCheck={false}
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Palette className="w-3 h-3" /> Thème
              </label>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setTheme(t)}
                    className={`h-12 rounded-xl transition-all border-2 ${
                      theme.name === t.name ? 'border-indigo-500 scale-105' : 'border-transparent'
                    }`}
                    style={{ background: t.bg }}
                    title={t.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Padding</label>
                  <span className="text-xs font-bold text-indigo-500">{padding}px</span>
               </div>
               <input
                 type="range"
                 min="20"
                 max="120"
                 value={padding}
                 onChange={(e) => setPadding(Number(e.target.value))}
                 className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
               />
            </div>

            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Taille Police</label>
                  <span className="text-xs font-bold text-indigo-500">{fontSize}px</span>
               </div>
               <input
                 type="range"
                 min="12"
                 max="24"
                 value={fontSize}
                 onChange={(e) => setFontSize(Number(e.target.value))}
                 className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
               />
            </div>

            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${
                showLineNumbers ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-400'
              }`}
            >
               <span className="font-bold text-sm">Numéros de ligne</span>
               <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${showLineNumbers ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                 {showLineNumbers && <Check className="w-3 h-3 stroke-[3]" />}
               </div>
            </button>
          </div>
        </div>

        {/* Preview & Actions */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
             <canvas ref={canvasRef} className="max-w-full h-auto rounded-xl shadow-2xl" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
             <button
               onClick={handleCopy}
               className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 ${
                 copied ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
               }`}
             >
               {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
               {copied ? 'Copié dans le presse-papier' : 'Copier l\'image'}
             </button>
             <button
               onClick={handleDownload}
               className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
             >
               <Download className="w-5 h-5" /> Télécharger PNG
             </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
         <div className="space-y-4">
            <h4 className="font-bold flex items-center gap-2"><Camera className="w-4 h-4 text-indigo-500" /> Prêt pour les réseaux</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Générez des captures d'écran de code élégantes pour Twitter, LinkedIn ou vos articles de blog en un clic.
            </p>
         </div>
         <div className="space-y-4">
            <h4 className="font-bold flex items-center gap-2"><Layout className="w-4 h-4 text-indigo-500" /> Personnalisation</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Ajustez le padding, la taille de la police et choisissez parmi des dégradés modernes pour correspondre à votre style.
            </p>
         </div>
         <div className="space-y-4">
            <h4 className="font-bold flex items-center gap-2"><Type className="w-4 h-4 text-indigo-500" /> Rendu local</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Le rendu est effectué directement dans votre navigateur via HTML5 Canvas. Vos extraits de code ne sont jamais envoyés sur nos serveurs.
            </p>
         </div>
      </div>
    </div>
  );
}
