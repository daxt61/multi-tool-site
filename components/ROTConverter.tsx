import { useState, useEffect, useCallback } from 'react';
import { Shield, Copy, Check, Trash2, Download, Info, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 50000;

type RotMode = 'rot13' | 'rot5' | 'rot18' | 'rot47';

export function ROTConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [mode, setMode] = useState<RotMode>(initialData?.mode || 'rot13');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, mode });
  }, [input, mode, onStateChange]);

  const rot13 = (str: string) => {
    return str.replace(/[a-zA-Z]/g, (c) => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
  };

  const rot5 = (str: string) => {
    return str.replace(/[0-9]/g, (c) => {
      return String.fromCharCode(((c.charCodeAt(0) - 48 + 5) % 10) + 48);
    });
  };

  const rot47 = (str: string) => {
    return str.split('').map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 33 && code <= 126) {
        return String.fromCharCode(((code - 33 + 47) % 94) + 33);
      }
      return c;
    }).join('');
  };

  const transform = useCallback((text: string, m: RotMode) => {
    if (!text) return '';
    switch (m) {
      case 'rot13': return rot13(text);
      case 'rot5': return rot5(text);
      case 'rot18': return rot13(rot5(text));
      case 'rot47': return rot47(text);
      default: return text;
    }
  }, []);

  const output = transform(input, mode);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rot-transform-${mode}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'rot13', label: 'ROT13' },
            { id: 'rot5', label: 'ROT5' },
            { id: 'rot18', label: 'ROT18' },
            { id: 'rot47', label: 'ROT47' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as RotMode)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                mode === item.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="rot-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" /> {t('common.input')}
            </label>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="rot-input"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
            placeholder={t('stringescaper.placeholder_input')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none font-mono"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <div className="w-full h-64 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-lg leading-relaxed dark:text-white break-all whitespace-pre-wrap font-mono overflow-y-auto">
            {output || <span className="text-slate-400 italic">{t('common.waiting')}</span>}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('rot.about_title', 'About ROT Ciphers')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('rot.about_text', 'ROT (rotate by N places) is a simple substitution cipher that replaces a character with another character some fixed number of positions down the alphabet.')}
          </p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1">
            <li><strong>ROT13</strong>: {t('rot.desc_rot13', 'Shifts letters A-Z by 13 places. Often used for obfuscating spoilers.')}</li>
            <li><strong>ROT5</strong>: {t('rot.desc_rot5', 'Shifts digits 0-9 by 5 places.')}</li>
            <li><strong>ROT18</strong>: {t('rot.desc_rot18', 'Combination of ROT13 and ROT5.')}</li>
            <li><strong>ROT47</strong>: {t('rot.desc_rot47', 'Shifts all visible ASCII characters (33-126) by 47 places.')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
