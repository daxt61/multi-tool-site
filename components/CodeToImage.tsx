import { useState, useRef } from 'react';
import { Copy, Check, Download, Image as ImageIcon, Settings2, Palette, Code, Type } from 'lucide-react';

export function CodeToImage() {
  const [code, setCode] = useState(`function helloWorld() {\n  console.log("Hello, World!");\n}`);
  const [theme, setTheme] = useState('indigo');
  const [padding, setPadding] = useState('48');
  const [language, setLanguage] = useState('javascript');
  const [fontSize, setFontSize] = useState('14');
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const themes: Record<string, string> = {
    indigo: 'from-indigo-500 to-purple-600',
    sunset: 'from-orange-500 to-rose-500',
    ocean: 'from-blue-400 to-emerald-500',
    midnight: 'from-slate-800 to-slate-950',
    candy: 'from-pink-400 to-purple-500',
    emerald: 'from-emerald-400 to-teal-500',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = async () => {
    if (!previewRef.current) return;

    // In a real environment, we might use html-to-image or similar.
    // For this implementation, we'll provide a friendly message.
    alert("Dans un environnement de production complet, cette fonction utiliserait 'html-to-image' pour exporter le snippet. Pour l'instant, vous pouvez faire une capture d'écran de la prévisualisation !");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-3 h-3 text-indigo-500" /> Paramètres
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Arrière-plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(themes).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`h-8 rounded-lg bg-gradient-to-br ${themes[t]} border-2 transition-all ${theme === t ? 'border-indigo-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Remplissage (Padding)</label>
                <input
                  type="range"
                  min="16"
                  max="96"
                  step="8"
                  value={padding}
                  onChange={(e) => setPadding(e.target.value)}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Taille de police</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="12">12px</option>
                  <option value="14">14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                </select>
              </div>
            </div>

            <button
              onClick={downloadImage}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Download className="w-4 h-4" /> Exporter PNG
            </button>
          </div>
        </div>

        {/* Editor & Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Code className="w-3 h-3" /> Code Source
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-40 p-4 bg-slate-900 text-slate-300 font-mono text-sm border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              spellCheck={false}
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> Prévisualisation
            </label>
            <div
              ref={previewRef}
              className={`rounded-3xl bg-gradient-to-br ${themes[theme]} flex items-center justify-center transition-all overflow-hidden`}
              style={{ padding: `${padding}px` }}
            >
              <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-2xl w-full border border-white/10 overflow-hidden">
                {/* Window Controls */}
                <div className="px-4 py-3 flex items-center gap-2 bg-white/5 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-grow text-center text-[10px] font-medium text-white/30 font-mono">
                    {language}.js
                  </div>
                </div>
                {/* Code Area */}
                <div className="p-6">
                  <pre
                    className="font-mono text-white/90 leading-relaxed whitespace-pre"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    <code>{code}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
