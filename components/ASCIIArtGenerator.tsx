import { useState, useEffect, useMemo } from 'react';
import { Type, Copy, Check, Trash2, Download, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FONTS: Record<string, Record<string, string[]>> = {
  'Block': {
    'A': ['  ███   ', ' ██ ██  ', '██   ██ ', '███████ ', '██   ██ '],
    'B': ['██████  ', '██   ██ ', '██████  ', '██   ██ ', '██████  '],
    'C': [' █████  ', '██      ', '██      ', '██      ', ' █████  '],
    'D': ['██████  ', '██   ██ ', '██   ██ ', '██   ██ ', '██████  '],
    'E': ['███████ ', '██      ', '█████   ', '██      ', '███████ '],
    'F': ['███████ ', '██      ', '█████   ', '██      ', '██      '],
    'G': [' █████  ', '██      ', '██  ███ ', '██   ██ ', ' █████  '],
    'H': ['██   ██ ', '██   ██ ', '███████ ', '██   ██ ', '██   ██ '],
    'I': ['███████ ', '  ███   ', '  ██    ', '  ███   ', '███████ '],
    'J': ['   ████ ', '    ██  ', '    ██  ', '██  ██  ', ' ████   '],
    'K': ['██  ██  ', '██ ██   ', '████    ', '██ ██   ', '██  ██  '],
    'L': ['██      ', '██      ', '██      ', '██      ', '███████ '],
    'M': ['██   ██ ', '███ ███ ', '██ ██ ██', '██   ██ ', '██   ██ '],
    'N': ['██   ██ ', '███  ██ ', '██ ██ ██', '██  ███ ', '██   ██ '],
    'O': [' █████  ', '██   ██ ', '██   ██ ', '██   ██ ', ' █████  '],
    'P': ['██████  ', '██   ██ ', '██████  ', '██      ', '██      '],
    'Q': [' █████  ', '██   ██ ', '██   ██ ', '██  ███ ', ' ████ ██'],
    'R': ['██████  ', '██   ██ ', '██████  ', '██  ██  ', '██   ██ '],
    'S': [' █████  ', '██      ', ' █████  ', '     ██ ', ' █████  '],
    'T': ['███████ ', '  ███   ', '  ███   ', '  ███   ', '  ███   '],
    'U': ['██   ██ ', '██   ██ ', '██   ██ ', '██   ██ ', ' █████  '],
    'V': ['██   ██ ', '██   ██ ', ' ██ ██  ', ' ██ ██  ', '  ███   '],
    'W': ['██   ██ ', '██   ██ ', '██ ██ ██', '████ ███', '██   ██ '],
    'X': ['██   ██ ', ' ██ ██  ', '  ███   ', ' ██ ██  ', '██   ██ '],
    'Y': ['██   ██ ', ' ██ ██  ', '  ███   ', '  ███   ', '  ███   '],
    'Z': ['███████ ', '   ███  ', '  ███   ', ' ███    ', '███████ '],
    ' ': ['    ', '    ', '    ', '    ', '    '],
  },
  'Slim': {
    'A': [' /\\ ', '/--\\', '|  |'],
    'B': ['|--\\', '|--/', '|--\\'],
    'C': [' /--', '|   ', ' \\--'],
    'D': ['|--\\', '|  |', '|--/'],
    'E': ['|---', '|-- ', '|---'],
    'F': ['|---', '|-- ', '|   '],
    'G': [' /--', '| -|', ' \\--'],
    'H': ['|  |', '|--|', '|  |'],
    'I': ['-|-', ' | ', '-|-'],
    'J': ['  |', '  |', '--|'],
    'K': ['| /', '|< ', '| \\'],
    'L': ['|   ', '|   ', '|___'],
    'M': ['|\\/|', '|  |', '|  |'],
    'N': ['|\\ |', '| \\|', '|  |'],
    'O': [' /--\\ ', '|    |', ' \\--/ '],
    'P': ['|--\\', '|--/', '|   '],
    'Q': [' /--\\ ', '|  \\|', ' \\--X '],
    'R': ['|--\\', '|--/', '|  \\'],
    'S': [' /--', ' \\-- ', ' --/'],
    'T': ['---', ' | ', ' | '],
    'U': ['|  |', '|  |', '\\__/'],
    'V': ['\\  /', ' \\/ ', '  V '],
    'W': ['|  |', '|/\\|', '|  |'],
    'X': ['\\  /', ' >< ', '/  \\'],
    'Y': ['\\ /', ' V ', ' | '],
    'Z': ['--/', ' / ', '/--'],
    ' ': ['  ', '  ', '  '],
  },
  'Mini': {
    'A': ['┌─┐', '├─┤', '┴ ┴'],
    'B': ['├─┐', '├─┤', '└─┘'],
    'C': ['┌─┐', '│  ', '└─┘'],
    'D': ['┌─┐', '│ │', '└─┘'],
    'E': ['┌─┐', '├─ ', '└─┘'],
    'F': ['┌─┐', '├─ ', '┴  '],
    'G': ['┌─┐', '│ ┐', '└─┘'],
    'H': ['│ │', '├─┤', '│ │'],
    'I': ['──┐', '  │', '──┘'],
    'J': ['  │', '  │', '──┘'],
    'K': ['│ ╱', '├─ ', '│ ╲'],
    'L': ['│  ', '│  ', '└──'],
    'M': ['┌┬┐', '│││', '┴ ┴'],
    'N': ['┌─┐', '│ │', '┘ └'],
    'O': ['┌─┐', '│ │', '└─┘'],
    'P': ['┌─┐', '├─┘', '┴  '],
    'Q': ['┌─┐', '│ │', '└─┘'],
    'R': ['┌─┐', '├┬┘', '┴└─'],
    'S': ['┌─┐', '└─┐', '──┘'],
    'T': ['──┬', '  │ ', '  ┴ '],
    'U': ['│ │', '│ │', '└─┘'],
    'V': ['╲ ╱', ' ╲╱ ', '  V '],
    'W': ['│ │', '│││', '└┴┘'],
    'X': ['╲╱ ', ' ╳ ', '╱╲ '],
    'Y': ['╲╱ ', ' │ ', ' ┴ '],
    'Z': ['┌──', ' ╱ ', '└──'],
    ' ': ['   ', '   ', '   '],
  },
  'Bubble': {
    'A': [' Ⓐ '], 'B': [' Ⓑ '], 'C': [' Ⓒ '], 'D': [' Ⓓ '], 'E': [' Ⓔ '], 'F': [' Ⓕ '], 'G': [' Ⓖ '], 'H': [' Ⓗ '], 'I': [' Ⓘ '], 'J': [' Ⓙ '], 'K': [' Ⓚ '], 'L': [' Ⓛ '], 'M': [' Ⓜ '], 'N': [' Ⓝ '], 'O': [' Ⓞ '], 'P': [' Ⓟ '], 'Q': [' Ⓠ '], 'R': [' Ⓡ '], 'S': [' Ⓢ '], 'T': [' Ⓣ '], 'U': [' Ⓤ '], 'V': [' Ⓥ '], 'W': [' Ⓦ '], 'X': [' Ⓧ '], 'Y': [' Ⓨ '], 'Z': [' Ⓩ '], ' ': ['   '],
  },
  'Digital': {
    'A': [' ╔═╗ ', ' ╠═╣ ', ' ╩ ╩ '],
    'B': [' ╠═╗ ', ' ╠═╣ ', ' ╚═╝ '],
    'C': [' ╔═╗ ', ' ║   ', ' ╚═╝ '],
    'D': [' ╠═╗ ', ' ║ ║ ', ' ╚═╝ '],
    'E': [' ╠═╣ ', ' ╠═  ', ' ╚═╝ '],
    'F': [' ╠═╣ ', ' ╠═  ', ' ╩   '],
    'G': [' ╔═╗ ', ' ║ ╦ ', ' ╚═╝ '],
    'H': [' ║ ║ ', ' ╠═╣ ', ' ║ ║ '],
    'I': [' ╦ ', ' ║ ', ' ╩ '],
    'J': ['   ║ ', '   ║ ', ' ╚═╝ '],
    'K': [' ║ ╩ ', ' ╠═  ', ' ║ ╦ '],
    'L': [' ║   ', ' ║   ', ' ╚═╝ '],
    'M': [' ║║║ ', ' ║║║ ', ' ╩ ╩ '],
    'N': [' ║╗║ ', ' ║║║ ', ' ╩╚╩ '],
    'O': [' ╔═╗ ', ' ║ ║ ', ' ╚═╝ '],
    'P': [' ╠═╗ ', ' ╠═╝ ', ' ╩   '],
    'Q': [' ╔═╗ ', ' ║ ║ ', ' ╚═╩ '],
    'R': [' ╠═╗ ', ' ╠╦╝ ', ' ╩╚═ '],
    'S': [' ╔═╗ ', ' ╚═╗ ', ' ╚═╝ '],
    'T': [' ╦╦╦ ', '  ║  ', '  ╩  '],
    'U': [' ║ ║ ', ' ║ ║ ', ' ╚═╝ '],
    'V': [' ║ ║ ', ' ╚╗╔╝', '  ╚╝ '],
    'W': [' ║ ║ ', ' ║║║ ', ' ╚╩╝ '],
    'X': [' ╚╦╝ ', '  ╬  ', ' ╔╩╗ '],
    'Y': [' ╚╦╝ ', '  ║  ', '  ╩  '],
    'Z': [' ╔═╝ ', ' ╔═╝ ', ' ╚═╝ '],
    ' ': ['     ', '     ', '     '],
  },
  'Straight': {
    'A': ['  /\\  ', ' /__\\ ', '/    \\'],
    'B': ['|--\\ ', '|--/ ', '|--/ '],
    'C': [' /--\\', '|    ', ' \\--/'],
    'D': ['|--\\ ', '|   |', '|--/ '],
    'E': ['|--- ', '|--- ', '|--- '],
    'F': ['|--- ', '|--- ', '|    '],
    'G': [' /--\\', '|  -_', ' \\--/'],
    'H': ['|   |', '|---|', '|   |'],
    'I': [' --- ', '  |  ', ' --- '],
    'J': ['   -|', '    |', ' ---/'],
    'K': ['|  / ', '|-<  ', '|  \\ '],
    'L': ['|    ', '|    ', '|--- '],
    'M': ['|\\/| ', '|  | ', '|  | '],
    'N': ['|\\ | ', '| \\| ', '|  | '],
    'O': [' /--\\', '|    |', ' \\--/'],
    'P': ['|--\\ ', '|--/ ', '|    '],
    'Q': [' /--\\', '|  \\|', ' \\--X'],
    'R': ['|--\\ ', '|--/ ', '|  \\ '],
    'S': [' /---', ' `---', ' ---/'],
    'T': [' --- ', '  |  ', '  |  '],
    'U': ['|   |', '|   |', ' \\--/'],
    'V': ['\\   /', ' \\ / ', '  V  '],
    'W': ['|   |', '| | |', ' \\_/ '],
    'X': ['\\  / ', ' ><  ', '/  \\ '],
    'Y': ['\\   /', ' \\ / ', '  |  '],
    'Z': [' --- ', '   / ', ' --- '],
    ' ': ['     ', '     ', '     '],
  },
  'Minimal': {
    'A': ['/\\'], 'B': ['|)'], 'C': ['( '], 'D': ['|)'], 'E': ['|-'], 'F': ['|-'], 'G': ['(-'], 'H': ['|-|'], 'I': ['|'], 'J': ['_|'], 'K': ['|<'], 'L': ['|_'], 'M': ['|\\/|'], 'N': ['|\\|'], 'O': ['()'], 'P': ['|p'], 'Q': ['(q)'], 'R': ['|r'], 'S': [' s'], 'T': ['+'], 'U': ['|_|'], 'V': ['\\/'], 'W': ['\\/\\/'], 'X': ['><'], 'Y': ['\\/'], 'Z': ['/_'], ' ': [' '],
  }
};

export function ASCIIArtGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || 'HELLO');
  const [font, setFont] = useState(initialData?.font || 'Block');
  const [customChar, setCustomCharacter] = useState(initialData?.customChar || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ text, font, customChar });
  }, [text, font, customChar, onStateChange]);

  const asciiArt = useMemo(() => {
    if (!text) return '';
    const selectedFont = FONTS[font];
    const linesCount = selectedFont['A'].length;
    const lines = Array(linesCount).fill('');

    for (const char of text.toUpperCase()) {
      const charGrid = selectedFont[char] || selectedFont[' '];
      for (let i = 0; i < linesCount; i++) {
        let linePart = charGrid[i];
        if (customChar && customChar.length > 0) {
          linePart = linePart.replace(/[█#@*+=]/g, customChar.charAt(0));
        }
        lines[i] += linePart + ' ';
      }
    }

    return lines.join('\n');
  }, [text, font, customChar]);

  const handleCopy = () => {
    if (!asciiArt) return;
    navigator.clipboard.writeText(asciiArt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!asciiArt) return;
    const blob = new Blob([asciiArt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ascii-art-${text.toLowerCase().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-2">
              <label htmlFor="ascii-input" className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('common.input')}</label>
              <input
                id="ascii-input"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 20))}
                placeholder={t('ascii_art.input_placeholder')}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
              />
              <p className="text-[10px] text-slate-400 italic">{t('ascii_art.hint')}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="font-select" className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('ascii_art.font')}</label>
              <select
                id="font-select"
                value={font}
                onChange={(e) => setFont(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
              >
                {Object.keys(FONTS).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="custom-char" className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('ascii_art.custom_char')}</label>
              <input
                id="custom-char"
                type="text"
                value={customChar}
                onChange={(e) => setCustomCharacter(e.target.value.slice(0, 1))}
                placeholder={t('ascii_art.custom_char_placeholder')}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Type className="w-4 h-4 text-indigo-500" /> {t('common.output')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!asciiArt}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!asciiArt}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={() => setText('')}
                disabled={!text}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                title={t('common.clear')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] overflow-x-auto shadow-inner border border-slate-800"
            aria-live="polite"
            aria-atomic="true"
          >
            <pre className="font-mono text-xs md:text-sm text-indigo-400 leading-none whitespace-pre select-all">
              {asciiArt || ' '}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
