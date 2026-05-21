import { useState, useMemo, useEffect } from 'react';
import { Type, Copy, Check, Trash2, Sliders, Info, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100;

// Simple Block Font Data (5 lines high)
const BLOCK_FONT: Record<string, string[]> = {
  'A': ['  ███  ', ' ██ ██ ', '███████', '██   ██', '██   ██'],
  'B': ['██████ ', '██   ██', '██████ ', '██   ██', '██████ '],
  'C': [' █████ ', '██     ', '██     ', '██     ', ' █████ '],
  'D': ['██████ ', '██   ██', '██   ██', '██   ██', '██████ '],
  'E': ['███████', '██     ', '█████  ', '██     ', '███████'],
  'F': ['███████', '██     ', '█████  ', '██     ', '██     '],
  'G': [' █████ ', '██     ', '██  ███', '██   ██', ' █████ '],
  'H': ['██   ██', '██   ██', '███████', '██   ██', '██   ██'],
  'I': ['█████', '  ██ ', '  ██ ', '  ██ ', '█████'],
  'J': ['   ███', '    ██', '    ██', '██  ██', ' ████ '],
  'K': ['██  ██', '██ ██ ', '████  ', '██ ██ ', '██  ██'],
  'L': ['██     ', '██     ', '██     ', '██     ', '███████'],
  'M': ['██   ██', '███ ███', '██ █ ██', '██   ██', '██   ██'],
  'N': ['██   ██', '████  ██', '██ ██ ██', '██  ████', '██   ██'],
  'O': [' █████ ', '██   ██', '██   ██', '██   ██', ' █████ '],
  'P': ['██████ ', '██   ██', '██████ ', '██     ', '██     '],
  'Q': [' █████ ', '██   ██', '██   ██', '██  ██ ', ' ████ ██'],
  'R': ['██████ ', '██   ██', '██████ ', '██   ██', '██   ██'],
  'S': [' █████ ', '██     ', ' █████ ', '     ██', ' █████ '],
  'T': ['███████', '  ███  ', '  ██   ', '  ██   ', '  ██   '],
  'U': ['██   ██', '██   ██', '██   ██', '██   ██', ' █████ '],
  'V': ['██   ██', '██   ██', ' ██ ██ ', ' ██ ██ ', '  ███  '],
  'W': ['██   ██', '██   ██', '██ █ ██', '███████', '██   ██'],
  'X': ['██   ██', ' ██ ██ ', '  ███  ', ' ██ ██ ', '██   ██'],
  'Y': ['██   ██', ' ██ ██ ', '  ███  ', '  ██   ', '  ██   '],
  'Z': ['███████', '   ██  ', '  ██   ', ' ██    ', '███████'],
  '0': [' █████ ', '██  ███', '██ █ ██', '███  ██', ' █████ '],
  '1': ['  ███  ', '   ██  ', '   ██  ', '   ██  ', ' ██████'],
  '2': [' █████ ', '     ██', '  █████', ' ██    ', '███████'],
  '3': ['██████ ', '    ██ ', ' █████ ', '    ██ ', '██████ '],
  '4': ['██   ██', '██   ██', '███████', '     ██', '     ██'],
  '5': ['███████', '██     ', '██████ ', '     ██', '██████ '],
  '6': [' █████ ', '██     ', '██████ ', '██   ██', ' █████ '],
  '7': ['███████', '    ██ ', '   ██  ', '  ██   ', ' ██    '],
  '8': [' █████ ', '██   ██', ' █████ ', '██   ██', ' █████ '],
  '9': [' █████ ', '██   ██', ' ██████', '     ██', ' █████ '],
  ' ': ['     ', '     ', '     ', '     ', '     '],
  '!': [' ██ ', ' ██ ', ' ██ ', '    ', ' ██ '],
  '?': [' ████ ', '    ██', '  ███ ', '      ', '  ██  '],
  '.': ['    ', '    ', '    ', '    ', ' ██ '],
  ':': ['    ', ' ██ ', '    ', ' ██ ', '    '],
  '-': ['       ', '       ', ' █████ ', '       ', '       '],
  '+': ['       ', '   █   ', ' █████ ', '   █   ', '       '],
};

// Simple Thin Font
const THIN_FONT: Record<string, string[]> = {
  'A': ['  /\\  ', ' /  \\ ', '/────\\', '│    │', '│    │'],
  'B': ['┌───┐ ', '│   │ ', '├───┤ ', '│   │ ', '└───┘ '],
  'C': ['┌───┐ ', '│     ', '│     ', '│     ', '└───┘ '],
  'D': ['┌───┐ ', '│   │ ', '│   │ ', '│   │ ', '└───┘ '],
  'E': ['┌────┐', '│     ', '├────┤', '│     ', '└────┘'],
  'F': ['┌────┐', '│     ', '├──── ', '│     ', '│     '],
  'G': ['┌───┐ ', '│     ', '│  ─┐ ', '│   │ ', '└───┘ '],
  'H': ['│   │ ', '│   │ ', '├───┤ ', '│   │ ', '│   │ '],
  'I': ['┌───┐', '  │  ', '  │  ', '  │  ', '└───┘'],
  'J': ['   ─┐', '    │', '    │', '│   │', '└───┘'],
  'K': ['│  / ', '│ /  ', '├─   ', '│ \\  ', '│  \\ '],
  'L': ['│    ', '│    ', '│    ', '│    ', '└────'],
  'M': ['│\\ /│', '│ V │', '│   │', '│   │', '│   │'],
  'N': ['│\\  │', '│ \\ │', '│  \\│', '│   │', '│   │'],
  'O': ['┌───┐', '│   │', '│   │', '│   │', '└───┘'],
  'P': ['┌───┐', '│   │', '├───┘', '│    ', '│    '],
  'Q': ['┌───┐', '│   │', '│   │', '│  \\│', '└───┘'],
  'R': ['┌───┐', '│   │', '├───┘', '│  \\ ', '│   \\'],
  'S': ['┌───┐', '└─┐  ', '  └─┐', '┌───┘', '└───┘'],
  'T': ['──┬──', '  │  ', '  │  ', '  │  ', '  │  '],
  'U': ['│   │', '│   │', '│   │', '│   │', '└───┘'],
  'V': ['│   │', '│   │', ' \\ / ', '  V  ', '     '],
  'W': ['│   │', '│   │', '│ W │', '│/ \\│', '     '],
  'X': ['\\   /', ' \\ / ', '  X  ', ' / \\ ', '/   \\'],
  'Y': ['\\   /', ' \\ / ', '  V  ', '  │  ', '  │  '],
  'Z': ['┌───┐', '   / ', '  /  ', ' /   ', '└───┘'],
  ' ': ['    ', '    ', '    ', '    ', '    '],
  '0': ['┌───┐', '│  /│', '│ / │', '│/  │', '└───┘'],
  '1': [' ──┐ ', '   │ ', '   │ ', '   │ ', ' ──┴─'],
  '2': ['┌───┐', '    │', '┌───┘', '│    ', '└───┘'],
  '3': ['┌───┐', '    │', ' ───┤', '    │', '└───┘'],
  '4': ['│   │', '│   │', '└───┤', '    │', '    │'],
  '5': ['┌───┐', '│    ', '└───┐', '    │', '└───┘'],
  '6': ['┌───┐', '│    ', '├───┐', '│   │', '└───┘'],
  '7': ['┌───┐', '    │', '   / ', '  /  ', ' /   '],
  '8': ['┌───┐', '│   │', '├───┤', '│   │', '└───┘'],
  '9': ['┌───┐', '│   │', '└───┤', '    │', '└───┘'],
};

export function ASCIIArtGenerator() {
  const { t } = useTranslation();
  const [input, setInput] = useState('ASCII');
  const [font, setFont] = useState<'block' | 'thin'>('block');
  const [copied, setCopied] = useState(false);

  const art = useMemo(() => {
    if (!input.trim()) return '';

    const chars = input.toUpperCase().split('').slice(0, MAX_LENGTH);
    const fontData = font === 'block' ? BLOCK_FONT : THIN_FONT;
    const lines = ['', '', '', '', ''];

    chars.forEach(char => {
      const glyph = fontData[char] || fontData[' '];
      glyph.forEach((line, i) => {
        lines[i] += line + '  ';
      });
    });

    return lines.join('\n');
  }, [input, font]);

  const handleCopy = () => {
    if (!art) return;
    navigator.clipboard.writeText(art);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!art) return;
    const blob = new Blob([art], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ascii-art-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-6 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <Type className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="ascii-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('asciiart.input_label')}</label>
                <input
                  id="ascii-input"
                  type="text"
                  maxLength={MAX_LENGTH}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                  placeholder={t('asciiart.placeholder')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('asciiart.font_style')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFont('block')}
                    className={`p-3 rounded-xl text-xs font-bold transition-all border ${
                      font === 'block'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t('asciiart.font_block')}
                  </button>
                  <button
                    onClick={() => setFont('thin')}
                    className={`p-3 rounded-xl text-xs font-bold transition-all border ${
                      font === 'thin'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t('asciiart.font_thin')}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
               <button
                 onClick={() => setInput('')}
                 className="flex-1 p-3 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 transition-all font-bold text-xs"
               >
                 {t('common.clear')}
               </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
           <div className="flex justify-between items-center px-1">
             <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('asciiart.output_label')}</h3>
             </div>
             <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!art}
                  className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Download className="w-3 h-3" /> {t('common.download')}
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!art}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    copied
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                      : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                  } disabled:opacity-50`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
             </div>
          </div>

          <div className="bg-slate-950 rounded-[2.5rem] p-10 overflow-x-auto min-h-[300px] flex items-center justify-center border border-slate-800 shadow-2xl">
             <pre className="font-mono text-indigo-500 leading-none whitespace-pre text-sm sm:text-base md:text-lg lg:text-xl">
                {art || '...'}
             </pre>
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('asciiart.about_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('asciiart.about_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('asciiart.limits_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('asciiart.limits_text', { max: MAX_LENGTH })}
          </p>
        </div>
      </div>
    </div>
  );
}
