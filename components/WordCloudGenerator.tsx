import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Cloud, Download, Trash2, RotateCcw, Info, Settings2, Palette, Type, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 50000;
const STOP_WORDS_EN = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with', 'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs', 'do', 'does', 'did', 'done', 'has', 'have', 'had', 'am', 'been', 'being', 'can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would']);
const STOP_WORDS_FR = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'en', 'ce', 'ces', 'ca', 'ci', 'dans', 'pour', 'sur', 'par', 'avec', 'sans', 'sous', 'vers', 'chez', 'mais', 'ou', 'donc', 'or', 'ni', 'car', 'que', 'qui', 'quoi', 'dont', 'où', 'se', 'sa', 'son', 'ses', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se', 'nous', 'vous', 'lui', 'leur', 'lequel', 'laquelle', 'lesquels', 'lesquelles', 'celui', 'celle', 'ceux', 'celles', 'est', 'sont', 'ont', 'fait', 'faire', 'peut', 'pouvoir', 'veut', 'vouloir', 'doit', 'devoir', 'allé', 'aller']);

const THEMES = {
  indigo: ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'],
  emerald: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
  rose: ['#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337'],
  amber: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
  mixed: ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'],
  dark: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8'],
};

interface Word {
  text: string;
  size: number;
  x?: number;
  y?: number;
  rotate?: number;
}

export function WordCloudGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(initialData?.text || '');
  const [maxWords, setMaxWords] = useState(initialData?.maxWords || 50);
  const [theme, setTheme] = useState<keyof typeof THEMES>(initialData?.theme || 'mixed');
  const [fontFamily, setFontFamily] = useState(initialData?.fontFamily || 'Inter, sans-serif');
  const [useStopWords, setUseStopWords] = useState(initialData?.useStopWords ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ text, maxWords, theme, fontFamily, useStopWords });
  }, [text, maxWords, theme, fontFamily, useStopWords, onStateChange]);

  const processWords = useCallback(() => {
    if (!text.trim()) return [];

    const words = text.toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 1);

    const stopWords = i18n.language === 'fr' ? STOP_WORDS_FR : STOP_WORDS_EN;
    const filtered = useStopWords ? words.filter((w: string) => !stopWords.has(w)) : words;

    const freq: Record<string, number> = Object.create(null);
    filtered.forEach((w: string) => {
      freq[w] = (freq[w] || 0) + 1;
    });

    return Object.entries(freq)
      .map(([text, count]) => ({ text, weight: count }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, maxWords);
  }, [text, maxWords, useStopWords, i18n.language]);

  const drawWordCloud = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const processed = processWords();
    if (processed.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const width = containerRef.current.offsetWidth;
    const height = Math.min(window.innerHeight * 0.6, 600);
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const centerX = width / 2;
    const centerY = height / 2;

    const maxWeight = processed[0].weight;
    const minWeight = processed[processed.length - 1].weight;

    const words: Word[] = processed.map(w => ({
      text: w.text,
      size: maxWeight === minWeight ? 40 : 15 + ((w.weight - minWeight) / (maxWeight - minWeight)) * 60,
      rotate: Math.random() < 0.2 ? Math.PI / 2 : 0
    }));

    ctx.clearRect(0, 0, width, height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const placedWords: Word[] = [];

    const isColliding = (w1: Word, w2: Word) => {
      ctx.font = `${w1.size}px ${fontFamily}`;
      const metrics1 = ctx.measureText(w1.text);
      const w1Width = metrics1.width;
      const w1Height = w1.size;

      ctx.font = `${w2.size}px ${fontFamily}`;
      const metrics2 = ctx.measureText(w2.text);
      const w2Width = metrics2.width;
      const w2Height = w2.size;

      const r1 = {
        left: (w1.x || 0) - w1Width / 2,
        right: (w1.x || 0) + w1Width / 2,
        top: (w1.y || 0) - w1Height / 2,
        bottom: (w1.y || 0) + w1Height / 2
      };

      const r2 = {
        left: (w2.x || 0) - w2Width / 2,
        right: (w2.x || 0) + w2Width / 2,
        top: (w2.y || 0) - w2Height / 2,
        bottom: (w2.y || 0) + w2Height / 2
      };

      return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
    };

    words.forEach((word, index) => {
      let angle = 0;
      let radius = 0;
      let found = false;

      while (!found && radius < Math.max(width, height)) {
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        word.x = x;
        word.y = y;

        let collision = false;
        for (const placed of placedWords) {
          if (isColliding(word, placed)) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          found = true;
          placedWords.push(word);

          ctx.font = `${word.size}px ${fontFamily}`;
          const colors = THEMES[theme];
          ctx.fillStyle = colors[index % colors.length];

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(word.rotate || 0);
          ctx.fillText(word.text, 0, 0);
          ctx.restore();
        }

        angle += 0.2;
        radius += 0.5;
      }
    });
  }, [processWords, theme, fontFamily]);

  useEffect(() => {
    const timeout = setTimeout(drawWordCloud, 300);
    return () => clearTimeout(timeout);
  }, [drawWordCloud]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'wordcloud.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success(t('common.downloaded'));
  };

  const handleClear = useCallback(() => {
    setText('');
    setError(null);
  }, []);

  const handleReset = () => {
    setMaxWords(50);
    setTheme('mixed');
    setFontFamily('Inter, sans-serif');
    setUseStopWords(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="wordcloud-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" /> {t('wordcloud.input_text')}
            </label>
            <button
              onClick={handleClear}
              disabled={!text}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="wordcloud-input"
            value={text}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length <= MAX_LENGTH) {
                setText(val);
                setError(null);
              } else {
                setError(t('error.max_length', { max: MAX_LENGTH }));
              }
            }}
            placeholder={t('wordcloud.placeholder')}
            className={`w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
          {error && (
            <div className="flex items-center gap-2 text-rose-500 text-xs font-bold px-1">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-indigo-500" /> {t('wordcloud.options')}
                </label>
                <button
                  onClick={handleReset}
                  className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> {t('common.reset')}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-bold dark:text-slate-300">{t('wordcloud.max_words')}</span>
                  <span className="text-sm font-mono font-black text-indigo-600">{maxWords}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={maxWords}
                  onChange={(e) => setMaxWords(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Palette className="w-3 h-3" /> {t('wordcloud.theme')}
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {Object.keys(THEMES).map(t_key => (
                      <option key={t_key} value={t_key}>{t(`wordcloud.themes.${t_key}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Type className="w-3 h-3" /> {t('wordcloud.font')}
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="'Playfair Display', serif">Serif</option>
                    <option value="'JetBrains Mono', monospace">Mono</option>
                    <option value="'Comic Sans MS', cursive">Casual</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={useStopWords}
                    onChange={(e) => setUseStopWords(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-200 dark:bg-slate-800 peer-checked:bg-indigo-600 rounded-full transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  {t('wordcloud.filter_stop_words')}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-indigo-500" /> {t('wordcloud.visualization')}
          </h3>
          <button
            onClick={handleDownload}
            disabled={!text}
            className="text-xs font-bold px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" /> {t('common.download')} PNG
          </button>
        </div>
        <div
          ref={containerRef}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden flex items-center justify-center min-h-[400px] shadow-inner"
        >
          <canvas ref={canvasRef} className="max-w-full h-auto" />
          {!text.trim() && (
            <div className="absolute flex flex-col items-center gap-3 text-slate-400 animate-pulse">
              <Cloud className="w-12 h-12 opacity-20" />
              <p className="text-sm font-bold italic">{t('wordcloud.waiting')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('wordcloud.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('wordcloud.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
