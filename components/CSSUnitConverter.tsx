import { useState, useMemo } from 'react';
import { Ruler, Maximize, Copy, Check, Trash2, Info, Settings2 } from 'lucide-react';

type Unit = 'px' | 'rem' | 'em' | 'vw' | 'vh' | '%';

interface UnitStat {
  unit: Unit;
  label: string;
}

const UNITS: UnitStat[] = [
  { unit: 'px', label: 'Pixels' },
  { unit: 'rem', label: 'REM' },
  { unit: 'em', label: 'EM' },
  { unit: 'vw', label: 'Viewport Width' },
  { unit: 'vh', label: 'Viewport Height' },
  { unit: '%', label: 'Pourcentage' },
];

export function CSSUnitConverter() {
  const [value, setValue] = useState('16');
  const [baseSize, setBaseSize] = useState('16');
  const [viewportWidth, setViewportWidth] = useState('1920');
  const [viewportHeight, setViewportHeight] = useState('1080');
  const [sourceUnit, setSourceUnit] = useState<Unit>('px');
  const [copied, setCopied] = useState<Unit | null>(null);

  const results = useMemo(() => {
    const num = parseFloat(value);
    const base = parseFloat(baseSize) || 16;
    const vw = parseFloat(viewportWidth) || 1920;
    const vh = parseFloat(viewportHeight) || 1080;

    if (isNaN(num)) return null;

    // Convert source to pixels first
    let px = 0;
    switch (sourceUnit) {
      case 'px': px = num; break;
      case 'rem': px = num * base; break;
      case 'em': px = num * base; break;
      case 'vw': px = (num * vw) / 100; break;
      case 'vh': px = (num * vh) / 100; break;
      case '%': px = (num * base) / 100; break;
    }

    return {
      px: px,
      rem: px / base,
      em: px / base,
      vw: (px / vw) * 100,
      vh: (px / vh) * 100,
      '%': (px / base) * 100,
    };
  }, [value, baseSize, viewportWidth, viewportHeight, sourceUnit]);

  const handleCopy = (val: number, unit: Unit) => {
    const formatted = parseFloat(val.toFixed(4));
    navigator.clipboard.writeText(`${formatted}${unit}`);
    setCopied(unit);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Input */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="mainValue" className="text-xs font-black uppercase tracking-widest text-slate-400">Valeur à convertir</label>
              <button
                onClick={() => setValue('')}
                disabled={!value}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <input
                id="mainValue"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="flex-1 bg-transparent text-4xl font-black font-mono outline-none dark:text-white"
                placeholder="0"
              />
              <select
                value={sourceUnit}
                onChange={(e) => setSourceUnit(e.target.value as Unit)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-lg outline-none cursor-pointer"
              >
                {UNITS.map(u => (
                  <option key={u.unit} value={u.unit}>{u.unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {UNITS.filter(u => u.unit !== sourceUnit).map((u) => {
              const res = results ? results[u.unit] : 0;
              return (
                <div key={u.unit} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center group transition-all hover:border-indigo-500/30">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{u.label}</div>
                    <div className="text-2xl font-black font-mono tracking-tight dark:text-white">
                      {results ? parseFloat(res.toFixed(4)) : '0'}
                      <span className="text-sm text-indigo-500 ml-1">{u.unit}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(res, u.unit)}
                    className={`p-3 rounded-xl transition-all ${copied === u.unit ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800'}`}
                  >
                    {copied === u.unit ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Settings2 className="w-5 h-5" />
              <h4 className="font-bold uppercase tracking-widest text-xs">Configuration</h4>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="baseSize" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base Font Size (px)</label>
                <input
                  id="baseSize"
                  type="number"
                  value={baseSize}
                  onChange={(e) => setBaseSize(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="vpWidth" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Viewport Width (px)</label>
                <input
                  id="vpWidth"
                  type="number"
                  value={viewportWidth}
                  onChange={(e) => setViewportWidth(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="vpHeight" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Viewport Height (px)</label>
                <input
                  id="vpHeight"
                  type="number"
                  value={viewportHeight}
                  onChange={(e) => setViewportHeight(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                La configuration est utilisée pour calculer les unités relatives (rem, em, vw, vh).
              </p>
            </div>
          </div>

          <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <Ruler className="w-10 h-10 mb-6 opacity-50" />
            <h3 className="text-xl font-black mb-4">Pixels vs REM</h3>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
              Utiliser des unités relatives comme le <code>rem</code> améliore l'accessibilité en respectant les préférences de taille de texte de l'utilisateur.
            </p>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> REM & EM
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            <code>rem</code> est relatif à la taille de police de la racine (html), tandis que <code>em</code> est relatif à la taille de police de l'élément parent.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Maximize className="w-4 h-4 text-indigo-500" /> Viewport Units
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            <code>vw</code> et <code>vh</code> sont basés sur les dimensions de la fenêtre d'affichage (1vw = 1% de la largeur). Très utiles pour le design responsive.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" /> Pourquoi un convertisseur ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Il permet de traduire rapidement des maquettes (souvent en px) en code CSS moderne et accessible utilisant des unités relatives.
          </p>
        </div>
      </div>
    </div>
  );
}
