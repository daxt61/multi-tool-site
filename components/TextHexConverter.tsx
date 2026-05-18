import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Trash2, ArrowRightLeft, Type, Hexagon, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function TextHexConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [hex, setHex] = useState(initialData?.hex || '');
  const [prefix, setPrefix] = useState<'none' | '0x'>(initialData?.prefix || 'none');
  const [separator, setSeparator] = useState<'none' | 'space' | 'comma'>(initialData?.separator || 'space');
  const [copied, setCopied] = useState<'text' | 'hex' | null>(null);

  useEffect(() => {
    onStateChange?.({ text, hex, prefix, separator });
  }, [text, hex, prefix, separator]);

  const textToHex = useCallback((input: string, p: 'none' | '0x', s: 'none' | 'space' | 'comma') => {
    const hexArray = Array.from(input).map((char) => {
      const h = (char.codePointAt(0) || 0).toString(16).toLowerCase();
      const padded = h.length % 2 !== 0 ? '0' + h : h;
      return p === '0x' ? `0x${padded}` : padded;
    });

    let sep = '';
    if (s === 'space') sep = ' ';
    if (s === 'comma') sep = ',';

    return hexArray.join(sep);
  }, []);

  const hexToText = useCallback((input: string) => {
    try {
      const cleanHex = input.replace(/0x/g, '').replace(/[^0-9a-fA-F]/g, '');
      if (!cleanHex || cleanHex.length % 2 !== 0) return '';

      const codePoints = [];
      for (let i = 0; i < cleanHex.length; i += 2) {
        codePoints.push(parseInt(cleanHex.substring(i, i + 2), 16));
      }
      // Note: simple hex conversion usually assumes single byte or UTF-16
      // For proper UTF-8 handling we'd need TextEncoder/Decoder, but
      // for a simple hex tool, char-by-char or codepoint-by-codepoint is standard.
      return String.fromCodePoint(...codePoints);
    } catch (e) {
      return '';
    }
  }, []);

  const handleTextChange = (value: string) => {
    if (value.length > MAX_LENGTH) return;
    setText(value);
    setHex(textToHex(value, prefix, separator));
  };

  const handleHexChange = (value: string) => {
    if (value.length > MAX_LENGTH * 5) return;
    setHex(value);
    setText(hexToText(value));
  };

  useEffect(() => {
    if (text) {
      setHex(textToHex(text, prefix, separator));
    }
  }, [prefix, separator, text, textToHex]);

  const copyToClipboard = (val: string, type: 'text' | 'hex') => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-1">
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-200 dark:border-slate-700">
               <Settings2 className="w-3.5 h-3.5 text-slate-400" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('texthex.prefix')}</span>
            </div>
            {(['none', '0x'] as const).map(p => (
               <button
                 key={p}
                 onClick={() => setPrefix(p)}
                 className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${prefix === p ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
               >
                 {p === 'none' ? t('common.na') : p}
               </button>
            ))}
         </div>

         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-200 dark:border-slate-700">
               <Settings2 className="w-3.5 h-3.5 text-slate-400" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('texthex.separator')}</span>
            </div>
            {(['none', 'space', 'comma'] as const).map(s => (
               <button
                 key={s}
                 onClick={() => setSeparator(s)}
                 className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${separator === s ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
               >
                 {s === 'none' ? t('common.na') : s === 'space' ? t('texthex.space') : t('texthex.comma')}
               </button>
            ))}
         </div>

        <button
          onClick={() => {
            setText('');
            setHex('');
          }}
          disabled={!text && !hex}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('base64.clear_text')}</label>
            </div>
            <button
              onClick={() => copyToClipboard(text, 'text')}
              disabled={!text}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                copied === 'text'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
              } disabled:opacity-50`}
            >
              {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'text' ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={t('caseconverter.placeholder')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Hex Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Hexagon className="w-4 h-4 text-indigo-500" />
              <label htmlFor="hex-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Hexadecimal</label>
            </div>
            <button
              onClick={() => copyToClipboard(hex, 'hex')}
              disabled={!hex}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                copied === 'hex'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
              } disabled:opacity-50`}
            >
              {copied === 'hex' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'hex' ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <textarea
            id="hex-input"
            value={hex}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder={t('caseconverter.result_placeholder')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 break-all resize-none"
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4">{t('texthex.about_title')}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('texthex.about_text')}
        </p>
      </div>
    </div>
  );
}
