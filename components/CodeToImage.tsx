import { useState, useRef, useEffect } from 'react';
import { Camera, Download, Palette, Code, Info, Check, Type } from 'lucide-react';

const THEMES = [
  { id: 'indigo', name: 'Indigo Night', bg: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' },
  { id: 'sunset', name: 'Sunset Glow', bg: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
  { id: 'emerald', name: 'Emerald Forest', bg: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' },
  { id: 'ocean', name: 'Deep Ocean', bg: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' },
  { id: 'slate', name: 'Minimal Slate', bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
  { id: 'candy', name: 'Candy Floss', bg: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' },
];

export function CodeToImage() {
  const [code, setCode] = useState('function helloWorld() {\n  console.log("Hello, World!");\n}');
  const [theme, setTheme] = useState(THEMES[0]);
  const [padding, setPadding] = useState(48);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const highlightCode = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number) => {
    const tokens = [
      { regex: /\b(function|const|let|var|return|if|else|for|while|import|export|from|class|extends|new|try|catch|finally|async|await|typeof|instanceof)\b/g, color: '#c678dd' },
      { regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, color: '#98c379' },
      { regex: /\/\/.*/g, color: '#5c6370' },
      { regex: /\b\d+\b/g, color: '#d19a66' },
      { regex: /\b(console|log|window|document|Math|JSON|Object|Array)\b/g, color: '#e5c07b' },
    ];

    const lines = text.split('\n');
    let currentY = y;

    lines.forEach((line, i) => {
      let currentX = x;
      if (showLineNumbers) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText(`${i + 1}`.padStart(2, ' '), currentX - 35, currentY);
      }

      let lastIndex = 0;
      const matches: { index: number, length: number, color: string }[] = [];

      tokens.forEach(token => {
        let match;
        token.regex.lastIndex = 0; // Reset regex
        while ((match = token.regex.exec(line)) !== null) {
          matches.push({ index: match.index, length: match[0].length, color: token.color });
        }
      });

      matches.sort((a, b) => a.index - b.index);

      // Filter overlapping matches
      const filteredMatches: typeof matches = [];
      let currentPos = 0;
      matches.forEach(m => {
        if (m.index >= currentPos) {
          filteredMatches.push(m);
          currentPos = m.index + m.length;
        }
      });

      let lastXInLine = 0;
      filteredMatches.forEach(match => {
        if (match.index > lastXInLine) {
          ctx.fillStyle = '#abb2bf';
          const part = line.substring(lastXInLine, match.index);
          ctx.fillText(part, currentX, currentY);
          currentX += ctx.measureText(part).width;
        }
        ctx.fillStyle = match.color;
        const part = line.substring(match.index, match.index + match.length);
        ctx.fillText(part, currentX, currentY);
        currentX += ctx.measureText(part).width;
        lastXInLine = match.index + match.length;
      });

      if (lastXInLine < line.length) {
        ctx.fillStyle = '#abb2bf';
        ctx.fillText(line.substring(lastXInLine), currentX, currentY);
      }

      currentY += fontSize * 1.5;
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontSize = 16;
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

    const lines = code.split('\n');
    const longestLine = lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);

    const contentWidth = Math.max(400, longestLine + (showLineNumbers ? 100 : 60));
    const contentHeight = lines.length * fontSize * 1.5 + 80;

    canvas.width = contentWidth + padding * 2;
    canvas.height = contentHeight + padding * 2;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (theme.id === 'indigo') { gradient.addColorStop(0, '#6366f1'); gradient.addColorStop(1, '#a855f7'); }
    else if (theme.id === 'sunset') { gradient.addColorStop(0, '#f59e0b'); gradient.addColorStop(1, '#ef4444'); }
    else if (theme.id === 'emerald') { gradient.addColorStop(0, '#10b981'); gradient.addColorStop(1, '#3b82f6'); }
    else if (theme.id === 'ocean') { gradient.addColorStop(0, '#0ea5e9'); gradient.addColorStop(1, '#2563eb'); }
    else if (theme.id === 'slate') { gradient.addColorStop(0, '#1e293b'); gradient.addColorStop(1, '#0f172a'); }
    else if (theme.id === 'candy') { gradient.addColorStop(0, '#ec4899'); gradient.addColorStop(1, '#8b5cf6'); }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    ctx.fillStyle = '#282c34';
    const winX = padding;
    const winY = padding;
    const winW = contentWidth;
    const winH = contentHeight;
    const radius = 12;

    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(winX, winY, winW, winH, radius) : ctx.rect(winX, winY, winW, winH);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const controls = ['#ff5f56', '#ffbd2e', '#27c93f'];
    controls.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(winX + 25 + i * 20, winY + 25, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    ctx.textBaseline = 'top';
    highlightCode(ctx, code, winX + (showLineNumbers ? 60 : 30), winY + 60, fontSize);
  };

  useEffect(() => {
    draw();
  }, [code, theme, padding, showLineNumbers]);

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Code Source</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Collez votre code ici..."
              className="w-full h-64 p-6 bg-slate-900 text-slate-300 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed resize-none"
              spellCheck={false}
            />
          </div>

          <div className="overflow-auto bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex justify-center">
            <canvas ref={canvasRef} className="max-w-full h-auto shadow-2xl rounded-lg" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Thème
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t)}
                    className={`p-1 rounded-xl border-2 transition-all ${
                      theme.id === t.id ? 'border-indigo-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="h-12 rounded-lg" style={{ background: t.bg }}></div>
                    <div className="text-[10px] font-bold mt-1 text-center truncate">{t.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Type className="w-4 h-4" /> Mise en page
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Espacement</span>
                    <span>{padding}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={padding}
                    onChange={(e) => setPadding(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <button
                  onClick={() => setShowLineNumbers(!showLineNumbers)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    showLineNumbers
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-black">Numéros de ligne</span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    showLineNumbers ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {showLineNumbers && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={downloadImage}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-6 h-6" /> Télécharger PNG
            </button>
          </div>

          <div className="p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-500/20">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-4 font-black text-sm uppercase tracking-widest">
              <Camera className="w-5 h-5" /> Social Media
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Créez des captures d'écran professionnelles de votre code pour les réseaux sociaux. Tout est généré localement.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-3">
          <h4 className="font-black dark:text-white flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-500" /> Coloration syntaxique
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Un moteur de rendu léger pour mettre en valeur les mots-clés de votre code.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-black dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" /> Dégradés
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Choisissez des fonds modernes pour vos partages.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-black dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Canvas API
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Rendu haute fidélité utilisant les capacités natives de votre navigateur.
          </p>
        </div>
      </div>
    </div>
  );
}
