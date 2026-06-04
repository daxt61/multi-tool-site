import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, RefreshCcw, Eye, ImageIcon, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SimulationType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

const MATRICES: Record<SimulationType, number[] | null> = {
  none: null,
  protanopia: [
    0.567, 0.433, 0.0,
    0.558, 0.442, 0.0,
    0.0, 0.242, 0.758
  ],
  deuteranopia: [
    0.625, 0.375, 0.0,
    0.7, 0.3, 0.0,
    0.0, 0.3, 0.7
  ],
  tritanopia: [
    0.95, 0.05, 0.0,
    0.0, 0.433, 0.567,
    0.0, 0.475, 0.525
  ],
  achromatopsia: [
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114
  ]
};

export function ColorBlindnessSimulator() {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [simulationType, setSimulationType] = useState<SimulationType>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(t('imagecompressor.error_size'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        setImage(event.target?.result as string);
        setError(null);
        applySimulation(simulationType, img);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const applySimulation = useCallback((type: SimulationType, imgInput?: HTMLImageElement) => {
    const img = imgInput || originalImageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    setIsProcessing(true);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    const matrix = MATRICES[type];
    if (matrix) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        data[i] = r * matrix[0] + g * matrix[1] + b * matrix[2];
        data[i + 1] = r * matrix[3] + g * matrix[4] + b * matrix[5];
        data[i + 2] = r * matrix[6] + g * matrix[7] + b * matrix[8];
      }
      ctx.putImageData(imageData, 0, 0);
    }
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    if (image) {
      applySimulation(simulationType);
    }
  }, [simulationType, image, applySimulation]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `simulated-${simulationType}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const types: { id: SimulationType; label: string; desc: string }[] = [
    { id: 'none', label: t('colorblindness.type_none'), desc: t('colorblindness.desc_none') },
    { id: 'protanopia', label: t('colorblindness.type_protanopia'), desc: t('colorblindness.desc_protanopia') },
    { id: 'deuteranopia', label: t('colorblindness.type_deuteranopia'), desc: t('colorblindness.desc_deuteranopia') },
    { id: 'tritanopia', label: t('colorblindness.type_tritanopia'), desc: t('colorblindness.desc_tritanopia') },
    { id: 'achromatopsia', label: t('colorblindness.type_achromatopsia'), desc: t('colorblindness.desc_achromatopsia') }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-500" /> {t('common.upload')}
              </h3>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2" />
                  <p className="text-xs font-bold text-slate-500">{t('imagecompressor.upload_prompt')}</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
              </label>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" /> {t('common.options')}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {types.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSimulationType(type.id)}
                    className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                      simulationType === type.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/20 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-indigo-500/30'
                    }`}
                  >
                    <span className={`text-sm font-black ${simulationType === type.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {type.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={!image || isProcessing}
              className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-5 h-5" /> {t('common.download')}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-4 md:p-8 min-h-[400px] flex items-center justify-center relative overflow-hidden">
            {!image ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100 dark:border-slate-700">
                  <ImageIcon className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold italic">{t('colorextractor.waiting')}</p>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                    <RefreshCcw className="w-10 h-10 text-indigo-500 animate-spin" />
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[70vh] rounded-xl shadow-2xl transition-opacity duration-300"
                />
              </div>
            )}
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
             <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <Info className="w-6 h-6" />
             </div>
             <div className="space-y-2">
                <h4 className="font-bold dark:text-white">{t('colorblindness.how_title')}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('colorblindness.how_text')}
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
