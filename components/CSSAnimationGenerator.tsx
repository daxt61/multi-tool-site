import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Sparkles, Copy, Check, RotateCcw, Info, Settings2, Play, Pause, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

type AnimationPreset = 'fade' | 'rotate' | 'scale' | 'bounce' | 'pulse' | 'slide' | 'shake';

export function CSSAnimationGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [preset, setPreset] = useState<AnimationPreset>(initialData?.preset || 'fade');
  const [duration, setDuration] = useState(initialData?.duration ?? 1);
  const [delay, setDurationDelay] = useState(initialData?.delay ?? 0);
  const [iterationCount, setIterationCount] = useState<string>(initialData?.iterationCount || 'infinite');
  const [timingFunction, setTimingFunction] = useState(initialData?.timingFunction || 'ease-in-out');
  const [direction, setDirection] = useState(initialData?.direction || 'normal');
  const [fillMode, setFillMode] = useState(initialData?.fillMode || 'both');
  const [isPlaying, setIsPlaying] = useState(true);
  const [copied, setCopied] = useState(false);

  const presets: AnimationPreset[] = ['fade', 'rotate', 'scale', 'bounce', 'pulse', 'slide', 'shake'];
  const timingFunctions = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'];
  const directions = ['normal', 'reverse', 'alternate', 'alternate-reverse'];
  const fillModes = ['none', 'forwards', 'backwards', 'both'];

  useEffect(() => {
    onStateChange?.({ preset, duration, delay, iterationCount, timingFunction, direction, fillMode });
  }, [preset, duration, delay, iterationCount, timingFunction, direction, fillMode, onStateChange]);

  const keyframes = useMemo(() => {
    switch (preset) {
      case 'fade':
        return `@keyframes fade {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}`;
      case 'rotate':
        return `@keyframes rotate {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}`;
      case 'scale':
        return `@keyframes scale {\n  from { transform: scale(0.5); opacity: 0; }\n  to { transform: scale(1); opacity: 1; }\n}`;
      case 'bounce':
        return `@keyframes bounce {\n  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }\n  40% { transform: translateY(-30px); }\n  60% { transform: translateY(-15px); }\n}`;
      case 'pulse':
        return `@keyframes pulse {\n  0% { transform: scale(1); }\n  50% { transform: scale(1.1); }\n  100% { transform: scale(1); }\n}`;
      case 'slide':
        return `@keyframes slide {\n  from { transform: translateX(-100%); }\n  to { transform: translateX(0); }\n}`;
      case 'shake':
        return `@keyframes shake {\n  10%, 90% { transform: translate3d(-1px, 0, 0); }\n  20%, 80% { transform: translate3d(2px, 0, 0); }\n  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }\n  40%, 60% { transform: translate3d(4px, 0, 0); }\n}`;
      default:
        return '';
    }
  }, [preset]);

  const animationStyles = {
    animationName: preset,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    animationIterationCount: iterationCount,
    animationTimingFunction: timingFunction,
    animationDirection: direction,
    animationFillMode: fillMode,
    animationPlayState: isPlaying ? 'running' : 'paused',
  };

  const generatedCSS = useMemo(() => {
    return `${keyframes}\n\n.animate-${preset} {\n  animation: ${preset} ${duration}s ${timingFunction} ${delay}s ${iterationCount} ${direction} ${fillMode};\n}`;
  }, [keyframes, preset, duration, timingFunction, delay, iterationCount, direction, fillMode]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedCSS);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [generatedCSS, t]);

  const handleReset = useCallback(() => {
    setPreset('fade');
    setDuration(1);
    setDurationDelay(0);
    setIterationCount('infinite');
    setTimingFunction('ease-in-out');
    setDirection('normal');
    setFillMode('both');
    setIsPlaying(true);
  }, []);

  const handlersRef = useRef({ handleCopy, handleReset });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleReset };
  }, [handleCopy, handleReset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-indigo-500">
              <Settings2 className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('animation.config', 'Configuration')}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 text-rose-400">Esc</Kbd>
              <button
                onClick={handleReset}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all px-3 py-1 rounded-full flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> {t('common.reset')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 px-1">{t('animation.preset', 'Animation Preset')}</label>
              <div className="flex flex-wrap gap-2">
                {presets.map(p => (
                  <button
                    key={p}
                    onClick={() => setPreset(p)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                      preset === p
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="duration-input" className="text-xs font-bold text-slate-500 px-1 cursor-pointer">{t('animation.duration', 'Duration (s)')}</label>
                <input
                  id="duration-input"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={duration}
                  onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="delay-input" className="text-xs font-bold text-slate-500 px-1 cursor-pointer">{t('animation.delay', 'Delay (s)')}</label>
                <input
                  id="delay-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={delay}
                  onChange={(e) => setDurationDelay(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 px-1">{t('animation.timing', 'Timing Function')}</label>
                <select
                  value={timingFunction}
                  onChange={(e) => setTimingFunction(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300 cursor-pointer"
                >
                  {timingFunctions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 px-1">{t('animation.iterations', 'Iterations')}</label>
                <select
                  value={iterationCount}
                  onChange={(e) => setIterationCount(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300 cursor-pointer"
                >
                  <option value="infinite">Infinite</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="5">5</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 px-1">{t('animation.direction', 'Direction')}</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300 cursor-pointer"
                >
                  {directions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 px-1">{t('animation.fill_mode', 'Fill Mode')}</label>
                <select
                  value={fillMode}
                  onChange={(e) => setFillMode(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300 cursor-pointer"
                >
                  {fillModes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('animation.preview', 'Live Preview')}</h3>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={`${isPlaying ? t('common.pause') : t('common.play')} (Space)`}
              className={`p-2 rounded-xl transition-all ${isPlaying ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'}`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 h-[300px] flex items-center justify-center relative overflow-hidden">
             <style dangerouslySetInnerHTML={{ __html: keyframes }} />
             <div
               key={`${preset}-${isPlaying}`}
               style={animationStyles}
               className="w-24 h-24 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20 flex items-center justify-center text-white"
             >
               <Sparkles className="w-10 h-10" />
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2 text-indigo-500">
                  <Code className="w-4 h-4" />
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('animation.code', 'Generated CSS')}</label>
                </div>
                <button
                  onClick={handleCopy}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-2 border ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                  <Kbd modifier={null} className="hidden sm:inline-flex ml-1">C</Kbd>
                </button>
             </div>
             <textarea
               readOnly
               value={generatedCSS}
               className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none font-mono text-xs leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
             />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('animation.about_title', 'About CSS Animations')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('animation.about_text', 'CSS animations make it possible to animate transitions from one CSS style configuration to another. Animations consist of two components: a style describing the CSS animation and a set of keyframes that indicate the start and end states of the animation\'s style, as well as possible intermediate waypoints.')}
          </p>
        </div>
      </div>
    </div>
  );
}
