import { useState, useEffect } from 'react';
import { Maximize2, Monitor, Smartphone, Laptop } from 'lucide-react';

export function AspectRatioCalculator() {
  const [width, setWidth] = useState<string>('1920');
  const [height, setHeight] = useState<string>('1080');
  const [ratioW, setRatioW] = useState<string>('16');
  const [ratioH, setRatioH] = useState<string>('9');
  const [lastChanged, setLastChanged] = useState<'dims' | 'ratio'>('dims');

  const commonRatios = [
    { name: '16:9', w: 16, h: 9, icon: <Monitor className="w-4 h-4" /> },
    { name: '4:3', w: 4, h: 3, icon: <Laptop className="w-4 h-4" /> },
    { name: '1:1', w: 1, h: 1, icon: <Maximize2 className="w-4 h-4" /> },
    { name: '9:16', w: 9, h: 16, icon: <Smartphone className="w-4 h-4" /> },
    { name: '21:9', w: 21, h: 9, icon: <Monitor className="w-4 h-4" /> },
  ];

  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const calculateFromDims = (w: number, h: number) => {
    if (w > 0 && h > 0) {
      const common = gcd(w, h);
      setRatioW((w / common).toString());
      setRatioH((h / common).toString());
    }
  };

  const calculateFromRatio = (rw: number, rh: number, val: number, isWidth: boolean) => {
    if (rw > 0 && rh > 0 && val > 0) {
      if (isWidth) {
        setHeight(Math.round((val * rh) / rw).toString());
      } else {
        setWidth(Math.round((val * rw) / rh).toString());
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Dimensions */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Maximize2 className="w-5 h-5 text-blue-500" />
            Dimensions (Pixels)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Largeur (px)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => {
                  setWidth(e.target.value);
                  setLastChanged('dims');
                  calculateFromDims(Number(e.target.value), Number(height));
                }}
                className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Hauteur (px)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  setLastChanged('dims');
                  calculateFromDims(Number(width), Number(e.target.value));
                }}
                className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Ratio */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-purple-500" />
            Ratio
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">Largeur Ratio</label>
                <input
                  type="number"
                  value={ratioW}
                  onChange={(e) => {
                    setRatioW(e.target.value);
                    setLastChanged('ratio');
                    calculateFromRatio(Number(e.target.value), Number(ratioH), Number(width), true);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="text-2xl font-bold text-gray-400 mt-6">:</div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">Hauteur Ratio</label>
                <input
                  type="number"
                  value={ratioH}
                  onChange={(e) => {
                    setRatioH(e.target.value);
                    setLastChanged('ratio');
                    calculateFromRatio(Number(ratioW), Number(e.target.value), Number(width), true);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4">
              <label className="block text-sm text-gray-600 mb-3">Ratios Communs</label>
              <div className="flex flex-wrap gap-2">
                {commonRatios.map((r) => (
                  <button
                    key={r.name}
                    onClick={() => {
                      setRatioW(r.w.toString());
                      setRatioH(r.h.toString());
                      calculateFromRatio(r.w, r.h, Number(width), true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    {r.icon}
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
        <p className="text-blue-800 font-medium">
          Format final : <span className="text-2xl font-bold">{width} x {height}</span> ({ratioW}:{ratioH})
        </p>
      </div>
    </div>
  );
}
