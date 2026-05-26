import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Copy, Check, Trash2, Download, Settings2, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 10000;

const HOMOGLYPH_MAP: Record<string, string[]> = {
  'a': ['а', 'ａ', 'ɑ', 'α', 'а', 'å', 'á', 'à', 'â', 'ã', 'ä'],
  'b': ['Ь', 'ｂ', 'ʙ', 'β', 'ъ', 'ь', 'Ъ', 'Б'],
  'c': ['с', 'ｃ', 'ⅽ', 'ç', 'ć', 'č', 'ċ'],
  'd': ['ԁ', 'ｄ', 'ⅾ', 'đ', 'ď', 'ð'],
  'e': ['е', 'ｅ', '℮', 'è', 'é', 'ê', 'ë', 'ē', 'ė', 'ę'],
  'f': ['ｆ', 'ƒ', 'ḟ'],
  'g': ['ɡ', 'ｇ', 'ġ', 'ğ', 'ģ'],
  'h': ['һ', 'ｈ', 'ћ', 'ĥ', 'ħ'],
  'i': ['і', 'ｉ', 'ⅰ', 'í', 'ì', 'î', 'ï', 'ī', 'į'],
  'j': ['ј', 'ｊ', 'ĵ'],
  'k': ['ｋ', 'ḳ', 'ķ'],
  'l': ['ⅼ', 'ｌ', 'ĺ', 'ļ', 'ľ', 'ŀ', 'ł'],
  'm': ['ｍ', 'ṃ', 'ḿ'],
  'n': ['ո', 'ｎ', 'ñ', 'ń', 'ņ', 'ň'],
  'o': ['о', 'ｏ', 'ο', 'ó', 'ò', 'ô', 'õ', 'ö', 'ø', 'ō'],
  'p': ['р', 'ｐ', 'ρ', 'ṕ', 'ṗ'],
  'q': ['ｑ', 'զ', 'ɋ'],
  'r': ['ｒ', 'ŕ', 'ŗ', 'ř'],
  's': ['ѕ', 'ｓ', 'ś', 'ş', 'š', 'ș'],
  't': ['ｔ', 'ţ', 'ť', 'ț'],
  'u': ['ս', 'ｕ', 'ú', 'ù', 'û', 'ü', 'ū', 'ų', 'ů'],
  'v': ['ｖ', 'ⅴ', 'ѵ', 'ν'],
  'w': ['ｗ', 'ѡ', 'ŵ'],
  'x': ['х', 'ｘ', 'ⅹ', 'ẋ'],
  'y': ['у', 'ｙ', 'ý', 'ÿ', 'ŷ'],
  'z': ['ｚ', 'ź', 'ż', 'ž'],
  'A': ['А', 'Ａ', 'Α', 'À', 'Á', 'Â', 'Ã', 'Ä', 'Å'],
  'B': ['В', 'Ｂ', 'Β', 'Ḃ', 'Ḅ'],
  'C': ['С', 'Ｃ', 'Ⅽ', 'Ç', 'Ć', 'Č', 'Ċ'],
  'D': ['Ｄ', 'Ⅾ', 'Ď', 'Đ'],
  'E': ['Е', 'Ｅ', 'Ε', 'È', 'É', 'Ê', 'Ë', 'Ē', 'Ė', 'Ę'],
  'F': ['Ｆ', 'Ƒ', 'Ḟ'],
  'G': ['Ｇ', 'Ġ', 'Ğ', 'Ģ'],
  'H': ['Ｈ', 'Η', 'Ĥ', 'Ħ'],
  'I': ['І', 'Ｉ', 'Ⅰ', 'Í', 'Ì', 'Î', 'Ï', 'Ī', 'Į'],
  'J': ['Ｊ', 'Ĵ'],
  'K': ['Ｋ', 'Κ', 'Ķ'],
  'L': ['Ｌ', 'Ⅼ', 'Ĺ', 'Ļ', 'Ľ', 'Ł'],
  'M': ['Ｍ', 'Μ', 'Ṁ', 'Ṃ'],
  'N': ['Ｎ', 'Ν', 'Ñ', 'Ń', 'Ņ', 'Ň'],
  'O': ['О', 'Ｏ', 'Ο', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', 'Ø', 'Ō'],
  'P': ['Р', 'Ｐ', 'Ρ', 'Ṕ', 'Ṗ'],
  'Q': ['Ｑ', 'Ḋ', 'Ǫ'],
  'R': ['Ｒ', 'Ŕ', 'Ŗ', 'Ř'],
  'S': ['Ｓ', 'Ś', 'Ş', 'Š', 'Ș'],
  'T': ['Ｔ', 'Τ', 'Ţ', 'Ť', 'Ț'],
  'U': ['Ｕ', 'Ú', 'Ù', 'Û', 'Ü', 'Ū', 'Ų', 'Ů'],
  'V': ['Ｖ', 'Ⅴ', 'Ѵ', 'ν'],
  'W': ['Ｗ', 'Ŵ'],
  'X': ['Ｘ', 'Χ', 'Ẋ'],
  'Y': ['Ｙ', 'Υ', 'Ý', 'Ÿ', 'Ŷ'],
  'Z': ['Ｚ', 'Ζ', 'Ź', 'Ż', 'Ž'],
  '0': ['０', '０'],
  '1': ['１', 'Ⅰ', 'ⅼ'],
  '2': ['２', 'Ⅱ'],
  '3': ['３', 'Ⅲ'],
  '4': ['４', 'Ⅳ'],
  '5': ['５', 'Ⅴ'],
  '6': ['６', 'Ⅵ'],
  '7': ['７', 'Ⅶ'],
  '8': ['８', 'Ⅷ'],
  '9': ['９', 'Ⅸ']
};

export function UnicodeSpoofer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [spoofLevel, setSpoofLevel] = useState(initialData?.spoofLevel ?? 1); // 0 to 1
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, spoofLevel });
  }, [input, spoofLevel, onStateChange]);

  const generateSpoof = useCallback(() => {
    if (!input) {
      setOutput('');
      return;
    }

    let result = '';
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const homoglyphs = HOMOGLYPH_MAP[char];

      if (homoglyphs && Math.random() < spoofLevel) {
        result += homoglyphs[Math.floor(Math.random() * homoglyphs.length)];
      } else {
        result += char;
      }
    }
    setOutput(result);
  }, [input, spoofLevel]);

  useEffect(() => {
    generateSpoof();
  }, [generateSpoof]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spoofed-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="spoof-input" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.input')}</label>
              <button
                onClick={() => setInput('')}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              </button>
            </div>
            <textarea
              id="spoof-input"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              placeholder={t('unicode_spoofer.placeholder', 'Enter text to spoof (e.g. example.com)...')}
              className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none shadow-sm font-mono"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="spoof-output" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
                  title={t('common.download')}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <div
              id="spoof-output"
              className="w-full min-h-[160px] p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-auto text-xl break-words whitespace-pre-wrap dark:text-white font-mono"
            >
              {output || <span className="text-slate-300 dark:text-slate-700 italic">{t('random.placeholder_str')}</span>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('unicode_spoofer.probability', 'Spoof Probability')}</span>
                  <span className="text-xs font-black font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg">{Math.round(spoofLevel * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={spoofLevel}
                  onChange={(e) => setSpoofLevel(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <button
                onClick={generateSpoof}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
              >
                <RefreshCcw className="w-5 h-5" /> {t('common.reset')}
              </button>
            </div>
          </div>

          <div className="p-8 bg-amber-600 rounded-[2rem] text-white shadow-xl shadow-amber-600/20 space-y-4">
             <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 opacity-50" />
              <h3 className="text-xl font-black">{t('unicode_spoofer.warning_title')}</h3>
            </div>
            <p className="text-amber-50 text-sm leading-relaxed">
              {t('unicode_spoofer.warning_text', 'Unicode spoofing replaces standard letters with visually similar characters from other alphabets. Use this tool for educational and testing purposes only.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
