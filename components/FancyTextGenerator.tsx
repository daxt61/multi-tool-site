import { useState, useEffect, useCallback } from 'react';
import { Type, Copy, Check, Trash2, Info, Download, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 5000;

interface StyleDefinition {
  id: string;
  name: string;
  map: (char: string) => string;
}

const convertChar = (char: string, startCode: number, offset: number = 0) => {
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) { // A-Z
    return String.fromCodePoint(startCode + (code - 65));
  }
  if (code >= 97 && code <= 122) { // a-z
    return String.fromCodePoint(startCode + 26 + offset + (code - 97));
  }
  return char;
};

const STYLES: StyleDefinition[] = [
  {
    id: 'bold_serif',
    name: 'Bold Serif',
    map: (char) => convertChar(char, 0x1D400)
  },
  {
    id: 'bold_sans',
    name: 'Bold Sans',
    map: (char) => convertChar(char, 0x1D5D4)
  },
  {
    id: 'italic_serif',
    name: 'Italic Serif',
    map: (char) => {
      const code = char.charCodeAt(0);
      if (code === 104) return 'ℎ'; // Special case for small h
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D434 + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D44E + (code - 97));
      return char;
    }
  },
  {
    id: 'italic_sans',
    name: 'Italic Sans',
    map: (char) => convertChar(char, 0x1D622)
  },
  {
    id: 'bold_italic_serif',
    name: 'Bold Italic Serif',
    map: (char) => convertChar(char, 0x1D468)
  },
  {
    id: 'bold_italic_sans',
    name: 'Bold Italic Sans',
    map: (char) => convertChar(char, 0x1D656)
  },
  {
    id: 'script_normal',
    name: 'Script',
    map: (char) => {
      const code = char.charCodeAt(0);
      // Script has several gaps in its Unicode block (standardized in earlier versions)
      const special: Record<number, string> = {
        66: 'ℬ', 69: 'ℰ', 70: 'ℱ', 72: 'ℋ', 73: 'ℐ', 76: 'ℒ', 77: 'ℳ', 82: 'ℛ',
        101: 'ℯ', 103: 'ℊ', 111: 'ℴ'
      };
      if (special[code]) return special[code];
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D49C + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D4B6 + (code - 97));
      return char;
    }
  },
  {
    id: 'script_bold',
    name: 'Bold Script',
    map: (char) => convertChar(char, 0x1D4D0)
  },
  {
    id: 'fraktur_normal',
    name: 'Fraktur',
    map: (char) => {
      const code = char.charCodeAt(0);
      const special: Record<number, string> = {
        67: 'ℭ', 72: 'ℌ', 73: 'ℑ', 82: 'ℜ', 90: 'ℨ'
      };
      if (special[code]) return special[code];
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D504 + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D51E + (code - 97));
      return char;
    }
  },
  {
    id: 'fraktur_bold',
    name: 'Bold Fraktur',
    map: (char) => convertChar(char, 0x1D56C)
  },
  {
    id: 'double_struck',
    name: 'Double Struck',
    map: (char) => {
      const code = char.charCodeAt(0);
      const special: Record<number, string> = {
        67: 'ℂ', 72: 'ℍ', 78: 'ℕ', 80: 'ℙ', 81: 'ℚ', 82: 'ℝ', 90: 'ℤ'
      };
      if (special[code]) return special[code];
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D538 + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D552 + (code - 97));
      if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7D8 + (code - 48));
      return char;
    }
  },
  {
    id: 'monospace',
    name: 'Monospace',
    map: (char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D670 + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D68A + (code - 97));
      if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7F6 + (code - 48));
      return char;
    }
  },
  {
    id: 'circled',
    name: 'Circled',
    map: (char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x24B6 + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x24D0 + (code - 97));
      if (code >= 49 && code <= 57) return String.fromCodePoint(0x2460 + (code - 49));
      if (code === 48) return '⓪';
      return char;
    }
  },
  {
    id: 'squared',
    name: 'Squared',
    map: (char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1F130 + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1F130 + (code - 97));
      return char;
    }
  }
];

export function FancyTextGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const transform = useCallback((text: string, styleId: string) => {
    const style = STYLES.find(s => s.id === styleId);
    if (!style) return text;
    return text.split('').map(char => style.map(char)).join('');
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    if (!input) return;
    let report = `${t('fancytext.report_title', 'Fancy Text Styles')}:\n\n`;
    STYLES.forEach(style => {
      report += `${style.name}:\n${transform(input, style.id)}\n\n`;
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fancy-text-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="fancy-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-500" /> {t('common.input')}
          </label>
          <button
            onClick={() => setInput('')}
            disabled={!input}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-3 h-3" /> {t('common.clear')}
          </button>
        </div>
        <textarea
          id="fancy-input"
          value={input}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length > MAX_LENGTH) {
              setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
            } else {
              setError(null);
              setInput(val);
            }
          }}
          placeholder={t('fancytext.placeholder', 'Type something to make it fancy...')}
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl leading-relaxed dark:text-slate-300 resize-none shadow-sm"
        />
      </div>

      {input && (
        <div className="flex justify-end px-1">
          <button
            onClick={handleDownload}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> {t('fancytext.download_all')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STYLES.map((style) => {
          const transformed = transform(input || 'Sample Text', style.id);
          return (
            <div
              key={style.id}
              className="group bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-3 hover:border-indigo-500/30 transition-all relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">
                  {style.name}
                </span>
                <button
                  onClick={() => handleCopy(transformed, style.id)}
                  className={`p-2 rounded-xl transition-all border ${
                    copied === style.id
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                      : 'text-slate-400 hover:text-indigo-500 border-transparent opacity-0 group-hover:opacity-100'
                  }`}
                  aria-label={t('common.copy')}
                >
                  {copied === style.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-2xl font-normal dark:text-white break-all leading-tight">
                {transformed}
              </div>
              {!input && (
                <div className="absolute inset-0 bg-white/10 dark:bg-slate-950/10 backdrop-blur-[1px] pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('fancytext.about_title', 'About Fancy Text')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('fancytext.about_text', 'This tool uses Mathematical Alphanumeric Symbols from the Unicode standard to create various "fancy" text styles. These symbols were originally intended for mathematical notation but are now widely used for decorative purposes on social media and elsewhere. Note that because these are different characters from normal letters, they might not be read correctly by screen readers or be searchable.')}
          </p>
        </div>
      </div>
    </div>
  );
}
