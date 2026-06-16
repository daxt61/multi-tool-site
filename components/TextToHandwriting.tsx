import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Copy, Trash2, Info, Type, Palette, Move, RotateCcw, PenTool } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function TextToHandwriting() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState('Hello! This is a test of handwriting simulation.\nYou can write anything here.');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Dancing Script');
  const [color, setColor] = useState('#000080'); // Royal Blue
  const [paperType, setPaperType] = useState<'blank' | 'lined' | 'grid'>('lined');
  const [lineSpacing, setLineSpacing] = useState(30);
  const [rotation, setRotate] = useState(0);

  const fonts = [
    { name: 'Dancing Script', url: 'https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap' },
    { name: 'Indie Flower', url: 'https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap' },
    { name: 'Pacifico', url: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap' },
    { name: 'Caveat', url: 'https://fonts.googleapis.com/css2?family=Caveat&display=swap' },
    { name: 'Satisfy', url: 'https://fonts.googleapis.com/css2?family=Satisfy&display=swap' },
    { name: 'Shadows Into Light', url: 'https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap' },
  ];

  useEffect(() => {
    fonts.forEach(f => {
      const link = document.createElement('link');
      link.href = f.url;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    });
  }, []);

  const drawHandwriting = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Paper pattern
    if (paperType === 'lined') {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let y = lineSpacing; y < canvas.height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (paperType === 'grid') {
      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    }

    // Text Setup
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px "${fontFamily}", cursive`;
    ctx.textBaseline = 'top';

    const lines = text.split('\n');
    let y = 40;

    ctx.save();
    ctx.rotate((rotation * Math.PI) / 180);

    lines.forEach((line) => {
      // Add subtle random variations to simulate human writing
      const xVariation = Math.random() * 2;
      const yVariation = Math.random() * 2;
      ctx.fillText(line, 40 + xVariation, y + yVariation);
      y += lineSpacing;
    });

    ctx.restore();
  }, [text, fontSize, fontFamily, color, paperType, lineSpacing, rotation]);

  useEffect(() => {
    // Wait for fonts to load before drawing
    document.fonts.ready.then(drawHandwriting);
  }, [drawHandwriting]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `handwriting-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Content</label>
              <button onClick={() => setText('')} className="text-rose-500 hover:text-rose-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm resize-none"
              placeholder="Enter text to convert..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs outline-none cursor-pointer"
              >
                {fonts.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-10 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Font Size: {fontSize}px</span>
                <button onClick={() => setFontSize(24)} className="text-indigo-500"><RotateCcw className="w-3 h-3" /></button>
              </div>
              <input
                type="range" min="12" max="64" value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Line Spacing: {lineSpacing}</span>
                <button onClick={() => setLineSpacing(30)} className="text-indigo-500"><RotateCcw className="w-3 h-3" /></button>
              </div>
              <input
                type="range" min="20" max="100" value={lineSpacing}
                onChange={(e) => setLineSpacing(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Paper Type</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['blank', 'lined', 'grid'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setPaperType(type)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                    paperType === type ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center px-1">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
               <PenTool className="w-4 h-4 text-indigo-500" /> Preview
             </h3>
             <button
               onClick={handleDownload}
               className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
             >
               <Download className="w-4 h-4" /> Download Image
             </button>
          </div>

          <div className="bg-slate-200 dark:bg-slate-950 p-4 md:p-8 rounded-[2.5rem] border border-slate-300 dark:border-slate-800 shadow-inner overflow-auto flex justify-center">
            <canvas
              ref={canvasRef}
              width={800}
              height={1000}
              className="bg-white shadow-2xl rounded-sm max-w-full h-auto cursor-crosshair"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Humanized Variations
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The generator adds small random offsets to each line and character to simulate the natural inconsistency of human handwriting.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" /> Paper Styles
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Choose between blank, lined, or grid paper to match your preferred writing style. Adjust line spacing to fit the font size perfectly.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <PenTool className="w-4 h-4 text-indigo-500" /> High Resolution
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The canvas renders at a fixed resolution of 800x1000px, ensuring high quality when downloaded for digital notes or printing.
          </p>
        </div>
      </div>
    </div>
  );
}
