import { useState, useCallback } from 'react';
import { Palette, Trash2, Copy, Check, Plus, MoveHorizontal, RefreshCcw, Sun, ArrowRight, Layers } from 'lucide-react';

interface ColorStop {
  id: string;
  color: string;
  position: number;
}

export function GradientGenerator() {
  const [type, setType] = useState<'linear' | 'radial'>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<ColorStop[]>([
    { id: '1', color: '#6366f1', position: 0 },
    { id: '2', color: '#a855f7', position: 100 }
  ]);
  const [copied, setCopied] = useState(false);

  const gradientString = type === 'linear'
    ? `linear-gradient(${angle}deg, ${[...stops].sort((a, b) => a.position - b.position).map(s => `${s.color} ${s.position}%`).join(', ')})`
    : `radial-gradient(circle, ${[...stops].sort((a, b) => a.position - b.position).map(s => `${s.color} ${s.position}%`).join(', ')})`;

  const handleAddStop = () => {
    if (stops.length >= 5) return;
    const newStop: ColorStop = {
      id: crypto.randomUUID(),
      color: '#ffffff',
      position: 50
    };
    setStops([...stops, newStop]);
  };

  const handleRemoveStop = (id: string) => {
    if (stops.length <= 2) return;
    setStops(stops.filter(s => s.id !== id));
  };

  const handleUpdateStop = (id: string, updates: Partial<ColorStop>) => {
    setStops(stops.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`background: ${gradientString};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRandomize = () => {
    const randomHex = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setStops(stops.map(s => ({ ...s, color: randomHex() })));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" /> Configuration
              </h3>
              <button
                onClick={handleRandomize}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
              >
                <RefreshCcw className="w-3 h-3" /> Aléatoire
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => setType('linear')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'linear' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Linéaire
                </button>
                <button
                  onClick={() => setType('radial')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'radial' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Radial
                </button>
              </div>

              {type === 'linear' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Angle ({angle}°)</label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={angle}
                    onChange={(e) => setAngle(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Points de couleur</label>
                  <button
                    onClick={handleAddStop}
                    disabled={stops.length >= 5}
                    className="text-xs font-bold text-indigo-600 flex items-center gap-1 disabled:opacity-30"
                  >
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
                <div className="space-y-3">
                  {stops.map((stop) => (
                    <div key={stop.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <input
                        type="color"
                        value={stop.color}
                        onChange={(e) => handleUpdateStop(stop.id, { color: e.target.value })}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
                      />
                      <div className="flex-1 space-y-1">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={stop.position}
                          onChange={(e) => handleUpdateStop(stop.id, { position: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold w-8 text-slate-400">{stop.position}%</span>
                      <button
                        onClick={() => handleRemoveStop(stop.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        disabled={stops.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div
            className="w-full h-[400px] rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-white/20 relative group overflow-hidden"
            style={{ background: gradientString }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm">
               <span className="text-white font-black uppercase tracking-widest text-sm drop-shadow-md">Aperçu du dégradé</span>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Code CSS
              </h3>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié' : 'Copier CSS'}
              </button>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl font-mono text-xs md:text-sm text-indigo-300 break-all leading-relaxed">
              background: {gradientString};
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
