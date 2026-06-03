import { useState, useRef, useEffect, useCallback } from 'react';
import { ImageIcon, Download, Upload, Info, AlertCircle, RefreshCcw, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type DeficiencyType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

const MATRICES: Record<DeficiencyType, number[]> = {
  none: [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ],
  protanopia: [
    0.56667, 0.43333, 0,
    0.55833, 0.44167, 0,
    0, 0.24167, 0.75833
  ],
  deuteranopia: [
    0.625, 0.375, 0,
    0.7, 0.3, 0,
    0, 0.3, 0.7
  ],
  tritanopia: [
    0.95, 0.05, 0,
    0, 0.43333, 0.56667,
    0, 0.475, 0.525
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
  const [deficiency, setDeficiency] = useState<DeficiencyType>('none');
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const applyFilter = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    setProcessing(true);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    if (deficiency === 'none') {
      setProcessing(false);
      return;
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const matrix = MATRICES[deficiency];

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      data[i] = r * matrix[0] + g * matrix[1] + b * matrix[2];
      data[i + 1] = r * matrix[3] + g * matrix[4] + b * matrix[5];
      data[i + 2] = r * matrix[6] + g * matrix[7] + b * matrix[8];
    }

    ctx.putImageData(imageData, 0, 0);
    setProcessing(false);
  }, [deficiency]);

  useEffect(() => {
    if (image) {
      applyFilter();
    }
  }, [image, deficiency, applyFilter]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        setImage(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `simulator-${deficiency}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 mb-4 block">
                {t('colorblind.upload_title', 'Charger une image')}
              </label>
              <label className="relative group cursor-pointer block">
                <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 group-hover:border-indigo-500 transition-all flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-950">
                  <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-500">{t('common.upload', 'Choisir un fichier')}</span>
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 block">
                {t('colorblind.type_title', 'Type de vision')}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(MATRICES) as DeficiencyType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDeficiency(type)}
                    className={`px-4 py-3 rounded-xl text-left text-sm font-bold transition-all border ${
                      deficiency === type
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t(`colorblind.type.${type}`, type.charAt(0).toUpperCase() + type.slice(1))}
                  </button>
                ))}
              </div>
            </div>

            {image && (
              <button
                onClick={handleDownload}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all"
              >
                <Download className="w-5 h-5" /> {t('common.download')}
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden relative min-h-[400px] flex items-center justify-center p-4">
            {!image ? (
              <div className="text-center space-y-4 opacity-20">
                <ImageIcon className="w-24 h-24 mx-auto" />
                <p className="font-black uppercase tracking-widest">{t('colorblind.waiting', 'En attente d\'une image...')}</p>
              </div>
            ) : (
              <>
                <canvas ref={canvasRef} className="max-w-full h-auto rounded-xl shadow-2xl" />
                {processing && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
                    <RefreshCcw className="w-12 h-12 text-white animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" /> {t('colorblind.about_title', 'À propos du simulateur')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('colorblind.about_text', 'Ce simulateur utilise des matrices de transformation colorimétrique pour approximer la vision des personnes atteintes de divers types de daltonisme.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-500" /> {t('colorblind.types_info_title', 'Les types de daltonisme')}
          </h4>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <li><strong>Protanopie :</strong> Absence de récepteurs au rouge.</li>
            <li><strong>Deutéranopie :</strong> Absence de récepteurs au vert.</li>
            <li><strong>Tritanopie :</strong> Absence de récepteurs au bleu.</li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('common.privacy', 'Confidentialité')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('colorblind.privacy_text', 'Le traitement est effectué localement dans votre navigateur via l\'API Canvas. Vos images ne sont jamais envoyées à nos serveurs.')}
          </p>
        </div>
      </div>
    </div>
  );
}
