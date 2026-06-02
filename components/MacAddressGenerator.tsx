import { useState, useCallback, useEffect } from 'react';
import { Copy, RefreshCw, Check, Network, Trash2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

export function MacAddressGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [macs, setMacs] = useState<string[]>(initialData?.macs || []);
  const [count, setCount] = useState(initialData?.count || 1);
  const [format, setMacFormat] = useState<'colon' | 'dash' | 'dot' | 'none'>(initialData?.format || 'colon');
  const [caseType, setCaseType] = useState<'uppercase' | 'lowercase'>(initialData?.caseType || 'uppercase');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    onStateChange?.({ macs, count, format, caseType });
  }, [macs, count, format, caseType, onStateChange]);

  const generateMac = useCallback(() => {
    const bytes = [];
    for (let i = 0; i < 6; i++) {
      bytes.push(getSecureRandomInt(256));
    }

    // Unicast & Locally Administered
    bytes[0] = (bytes[0] & 0xfe) | 0x02;

    let hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');

    if (caseType === 'uppercase') {
      hex = hex.toUpperCase();
    }

    if (format === 'colon') {
      return hex.match(/.{2}/g)?.join(':') || hex;
    } else if (format === 'dash') {
      return hex.match(/.{2}/g)?.join('-') || hex;
    } else if (format === 'dot') {
      return hex.match(/.{4}/g)?.join('.') || hex;
    }
    return hex;
  }, [format, caseType]);

  const generateMacs = () => {
    const newMacs = [];
    const safeCount = Math.min(Math.max(1, count), 100);
    for (let i = 0; i < safeCount; i++) {
      newMacs.push(generateMac());
    }
    setMacs(newMacs);
    setCopiedIndex(null);
  };

  const copyToClipboard = (mac: string, index: number) => {
    navigator.clipboard.writeText(mac);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(macs.join('\n'));
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClear = () => {
    setMacs([]);
    setCopiedIndex(null);
  };

  const handleDownload = useCallback(() => {
    if (macs.length === 0) return;
    const blob = new Blob([macs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mac-addresses-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [macs]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end items-center gap-2 px-1">
        <button
          onClick={handleDownload}
          disabled={macs.length === 0}
          className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Download className="w-3 h-3" /> {t('common.download')}
        </button>
        <button
          onClick={handleClear}
          disabled={macs.length === 0}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> {t('common.clear')}
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="mac-count" className="block text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              {t('common.count')}
            </label>
            <input
              id="mac-count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'colon', label: '00:1A:2B' },
                { id: 'dash', label: '00-1A-2B' },
                { id: 'dot', label: '001A.2B3C' },
                { id: 'none', label: '001A2B' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setMacFormat(f.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    format === f.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              {t('listcleaner.case', 'Casse')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'uppercase', label: 'ABC' },
                { id: 'lowercase', label: 'abc' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCaseType(c.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    caseType === c.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={generateMacs}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none group"
        >
          <RefreshCw className="w-5 h-5 transition-transform group-hover:rotate-180" />
          {t('random.generate')}
        </button>

        {macs.length > 1 && (
          <button
            onClick={copyAll}
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              copiedIndex === -1
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {copiedIndex === -1 ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copiedIndex === -1 ? t('common.copied') : t('passwordgenerator.copy_all')}
          </button>
        )}
      </div>

      {macs.length > 0 ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {macs.map((mac, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all group"
            >
              <code className="font-mono text-sm md:text-base text-slate-700 dark:text-slate-300 break-all">{mac}</code>
              <button
                onClick={() => copyToClipboard(mac, index)}
                className={`p-2.5 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedIndex === index
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                }`}
                aria-label={t('common.copy')}
              >
                {copiedIndex === index ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5 transition-transform group-hover:scale-110" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-16 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
            <Network className="w-8 h-8 transition-transform hover:scale-110" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{t('macgenerator.empty_title', 'Aucune adresse MAC générée')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('macgenerator.empty_hint', 'Cliquez sur "Générer" pour créer des adresses MAC aléatoires.')}</p>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl p-6 text-sm text-indigo-900 dark:text-indigo-400 flex gap-4 items-start">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500 shrink-0">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold mb-1">{t('macgenerator.about_title', 'À propos des adresses MAC')}</p>
          <p className="opacity-80 leading-relaxed">
            {t('macgenerator.about_text', 'Une adresse MAC (Media Access Control) est un identifiant unique attribué à une interface réseau pour les communications sur le segment de réseau physique. Ce générateur crée des adresses MAC aléatoires et valides, configurées comme des adresses administrées localement (LAA).')}
          </p>
        </div>
      </div>
    </div>
  );
}
