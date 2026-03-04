import { useState } from 'react';
import { Copy, Check, Trash2, ArrowRightLeft, Type, Link as LinkIcon } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function URLEncoder() {
  const [decoded, setDecoded] = useState('');
  const [encoded, setEncoded] = useState('');
  const [copied, setCopied] = useState<'dec' | 'enc' | null>(null);

  const encode = (t: string) => { try { return t ? encodeURIComponent(t) : ''; } catch { return 'Erreur'; } };
  const decode = (t: string) => { try { return t ? decodeURIComponent(t) : ''; } catch { return 'Erreur'; } };

  const copy = (val: string, type: 'dec' | 'enc') => {
    if (!val) return;
    navigator.clipboard?.writeText(val).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600"><ArrowRightLeft className="w-6 h-6" /></div>
        </div>
        {[
          { id: 'dec', label: 'URL / Texte Décodé', icon: Type, val: decoded, other: setEncoded, self: setDecoded, fn: encode, ph: 'Entrez du texte ou une URL...' },
          { id: 'enc', label: 'URL / Texte Encodé', icon: LinkIcon, val: encoded, other: setDecoded, self: setEncoded, fn: decode, ph: 'Ou entrez du texte encodé...' }
        ].map(s => (
          <div key={s.id} className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <s.icon className="w-4 h-4 text-indigo-500" />
                <label htmlFor={`${s.id}-in`} className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{s.label}</label>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copy(s.val, s.id as any)} className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === s.id ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`} aria-label={`Copier ${s.label}`}>
                  {copied === s.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === s.id ? 'Copié' : 'Copier'}
                </button>
                {s.id === 'dec' && <button onClick={() => { setDecoded(''); setEncoded(''); }} className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1" aria-label="Effacer tout"><Trash2 className="w-3 h-3" /></button>}
              </div>
            </div>
            <textarea id={`${s.id}-in`} value={s.val} onChange={(e) => { s.self(e.target.value); s.other(s.fn(e.target.value)); }} placeholder={s.ph} className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none" />
          </div>
        ))}
      </div>
      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
