import { useState, useEffect, useMemo } from 'react';
import { Type, Copy, Check, Trash2, Download, Info, Search, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 50000;

// Mapping of various stylized Unicode characters back to ASCII
const createNormalizerMap = () => {
  const map: Record<string, string> = {};

  const addRange = (start: number, end: number, asciiStart: number) => {
    for (let i = 0; i <= end - start; i++) {
      map[String.fromCodePoint(start + i)] = String.fromCodePoint(asciiStart + i);
    }
  };

  // Math Bold
  addRange(0x1D400, 0x1D419, 65); // A-Z
  addRange(0x1D41A, 0x1D433, 97); // a-z
  // Math Italic
  addRange(0x1D434, 0x1D44D, 65);
  addRange(0x1D44E, 0x1D467, 97);
  // Math Bold Italic
  addRange(0x1D468, 0x1D481, 65);
  addRange(0x1D482, 0x1D49B, 97);
  // Math Script
  addRange(0x1D49C, 0x1D4B5, 65);
  addRange(0x1D4B6, 0x1D4CF, 97);
  // Math Bold Script
  addRange(0x1D4D0, 0x1D4E9, 65);
  addRange(0x1D4EA, 0x1D503, 97);
  // Math Fraktur
  addRange(0x1D504, 0x1D51D, 65);
  addRange(0x1D51E, 0x1D537, 97);
  // Math Double Struck
  addRange(0x1D538, 0x1D551, 65);
  addRange(0x1D552, 0x1D56B, 97);
  // Math Bold Fraktur
  addRange(0x1D56C, 0x1D585, 65);
  addRange(0x1D586, 0x1D59F, 97);
  // Math Sans-Serif
  addRange(0x1D5A0, 0x1D5B9, 65);
  addRange(0x1D5BA, 0x1D5D3, 97);
  // Math Sans-Serif Bold
  addRange(0x1D5D4, 0x1D5ED, 65);
  addRange(0x1D5EE, 0x1D607, 97);
  // Math Sans-Serif Italic
  addRange(0x1D608, 0x1D621, 65);
  addRange(0x1D622, 0x1D63B, 97);
  // Math Sans-Serif Bold Italic
  addRange(0x1D63C, 0x1D655, 65);
  addRange(0x1D656, 0x1D66F, 97);
  // Math Monospace
  addRange(0x1D670, 0x1D689, 65);
  addRange(0x1D68A, 0x1D6A3, 97);

  // Bold Digits
  addRange(0x1D7CE, 0x1D7D7, 48);
  // Double Struck Digits
  addRange(0x1D7D8, 0x1D7E1, 48);
  // Sans-Serif Digits
  addRange(0x1D7E2, 0x1D7EB, 48);
  // Sans-Serif Bold Digits
  addRange(0x1D7EC, 0x1D7F5, 48);
  // Monospace Digits
  addRange(0x1D7F6, 0x1D7FF, 48);

  // Circled
  addRange(0x24B6, 0x24CF, 65); // A-Z
  addRange(0x24D0, 0x24E9, 97); // a-z
  addRange(0x2460, 0x2468, 49); // 1-9
  map['\u24EA'] = '0';

  // Fullwidth
  addRange(0xFF01, 0xFF5E, 33); // ! to ~

  // Parenthesized
  addRange(0x249C, 0x24B5, 97); // a-z

  // Small Caps (Partial mapping from common set)
  const smallCaps = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ";
  for (let i = 0; i < smallCaps.length; i++) {
    map[smallCaps[i]] = String.fromCharCode(97 + i);
  }

  return map;
};

const NORMALIZER_MAP = createNormalizerMap();

export function UnicodeNormalizer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const normalized = useMemo(() => {
    if (!input) return '';

    // 1. Standard Unicode Normalization (NFD/NFC) to handle accents and decompositions
    let result = input.normalize('NFKD');

    // 2. Custom Map for Mathematical Alphanumeric and other styles
    let final = '';
    // Use for...of on string to correctly iterate over surrogate pairs
    for (const char of result) {
      final += (NORMALIZER_MAP as Record<string, string>)[char] || char;
    }

    // 3. Remove remaining combining marks if we want strictly "clean" text
    return final.replace(/[\u0300-\u036f]/g, "");
  }, [input]);

  const handleCopy = () => {
    if (!normalized) return;
    navigator.clipboard.writeText(normalized);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!normalized) return;
    const blob = new Blob([normalized], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `normalized-text-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="norm-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-500" /> {t('unicodenormalizer.input_label', 'Stylized Unicode Text')}
          </label>
          <button
            onClick={() => setInput('')}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
          >
            <Trash2 className="w-3 h-3" /> {t('common.clear')}
          </button>
        </div>
        <textarea
          id="norm-input"
          value={input}
          onChange={(e) => {
            if (e.target.value.length <= MAX_LENGTH) {
              setInput(e.target.value);
              setError(null);
            } else {
              setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
            }
          }}
          placeholder="Paste fancy text here... e.g., 𝔉𝒶𝔫𝒸𝓎 𝒯ℯ𝓍𝓉"
          className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-500" /> {t('unicodenormalizer.output_label', 'Normalized Plain Text')}
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={!normalized}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> {t('common.download')}
            </button>
            <button
              onClick={handleCopy}
              disabled={!normalized}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all border flex items-center gap-2 disabled:opacity-50 ${
                copied
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
        </div>
        <div className="w-full min-h-[12rem] p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-xl font-medium dark:text-white break-all whitespace-pre-wrap">
          {normalized || <span className="text-slate-400 italic">Standard text will appear here...</span>}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-600 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('unicodenormalizer.about_title', 'About Unicode Normalization')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('unicodenormalizer.about_text', 'Many "fancy" fonts online use Mathematical Alphanumeric Symbols from the Unicode standard. While they look like letters, they are technically different symbols, which can break searchability and accessibility. This tool converts those symbols and other stylized characters back to their standard ASCII equivalents.')}
          </p>
        </div>
      </div>
    </div>
  );
}
