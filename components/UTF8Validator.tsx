import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Shield, CheckCircle2, AlertCircle, Copy, Check,
  Trash2, Info, Settings2, FileText, Binary, Hash
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

type InputMode = 'text' | 'hex' | 'base64';

export function UTF8Validator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [mode, setMode] = useState<InputMode>(initialData?.mode || 'text');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, mode });
  }, [input, mode, onStateChange]);

  const validation = useMemo(() => {
    if (!input) return { valid: null, message: '', bytes: [] };
    if (input.length > MAX_LENGTH) return { valid: false, message: t('error.max_length', { max: MAX_LENGTH.toLocaleString() }), bytes: [] };

    try {
      let bytes: Uint8Array;

      if (mode === 'text') {
        bytes = new TextEncoder().encode(input);
      } else if (mode === 'hex') {
        const cleanHex = input.replace(/[^0-9a-fA-F]/g, '');
        if (cleanHex.length % 2 !== 0) throw new Error('Invalid Hex length');
        bytes = new Uint8Array(cleanHex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)));
      } else {
        // Base64
        const binary = atob(input.replace(/[^A-Za-z0-9+/=]/g, ''));
        bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
      }

      // Validate via TextDecoder with fatal: true
      const decoder = new TextDecoder('utf-8', { fatal: true });
      decoder.decode(bytes);

      return {
        valid: true,
        message: t('utf8.valid_msg', 'Valid UTF-8 byte sequence.'),
        bytes: Array.from(bytes)
      };
    } catch (e: any) {
      return {
        valid: false,
        message: e.message || t('utf8.invalid_msg', 'Invalid UTF-8 sequence detected.'),
        bytes: []
      };
    }
  }, [input, mode, t]);

  const handleCopy = useCallback(() => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [input]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {(['text', 'hex', 'base64'] as InputMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {m === 'text' && <><FileText className="w-3 h-3 inline mr-1" /> Text</>}
                  {m === 'hex' && <><Hash className="w-3 h-3 inline mr-1" /> Hex</>}
                  {m === 'base64' && <><Binary className="w-3 h-3 inline mr-1" /> B64</>}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!input}
                className={`p-2 rounded-xl transition-all border ${copied ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800'}`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setInput('')}
                className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'text' ? 'Enter text...' : (mode === 'hex' ? 'e.g. 48 65 6c 6c 6f' : 'e.g. SGVsbG8=')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />

          {validation.valid !== null && (
            <div className={`p-6 rounded-3xl border-2 flex items-start gap-4 animate-in zoom-in-95 duration-300 ${
              validation.valid
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-400'
            }`}>
              {validation.valid ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
              <div>
                <h4 className="font-black uppercase tracking-widest text-xs mb-1">
                  {validation.valid ? t('utf8.valid', 'Valid UTF-8') : t('utf8.invalid', 'Invalid UTF-8')}
                </h4>
                <p className="text-sm font-medium">{validation.message}</p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Shield className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('utf8.stats', 'Byte Analysis')}</h3>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Byte Count</span>
                  <span className="text-lg font-black dark:text-white font-mono">{validation.bytes.length}</span>
               </div>
               <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Hex Preview (First 16)</span>
                  <div className="grid grid-cols-4 gap-1">
                     {validation.bytes.slice(0, 16).map((b, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-1 rounded border border-slate-200 dark:border-slate-700 text-center font-mono text-[10px] font-bold dark:text-indigo-400">
                           {b.toString(16).padStart(2, '0').toUpperCase()}
                        </div>
                     ))}
                     {validation.bytes.length === 0 && <div className="col-span-4 text-[10px] text-slate-400 italic">No data</div>}
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
            <Info className="w-6 h-6 text-indigo-600 shrink-0" />
            <div className="space-y-2">
              <h4 className="font-bold dark:text-white">{t('utf8.about_title', 'About UTF-8')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('utf8.about_text', 'UTF-8 is a variable-width character encoding used for electronic communication. This tool checks if a byte sequence correctly follows the rules of the UTF-8 standard, identifying illegal lead or continuation bytes.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
