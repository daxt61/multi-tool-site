import { useState, useEffect, useMemo, useCallback } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, Trash2, Send, Phone } from 'lucide-react';

export function WhatsAppLinkGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || '');
  const [message, setMessage] = useState(initialData?.message || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ phoneNumber, message });
  }, [phoneNumber, message]);

  const generatedLink = useMemo(() => {
    if (!phoneNumber) return '';
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanNumber}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
  }, [phoneNumber, message]);

  const handleCopy = useCallback(() => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedLink]);

  const handleClear = () => {
    setPhoneNumber('');
    setMessage('');
    setCopied(false);
  };

  const handleOpen = () => {
    if (generatedLink) {
      window.open(generatedLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end items-center px-1">
        <button
          onClick={handleClear}
          disabled={!phoneNumber && !message}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> Effacer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone-number" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <Phone className="w-3 h-3" /> Numéro de téléphone
              </label>
              <input
                id="phone-number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono dark:text-white"
              />
              <p className="text-[10px] text-slate-400 px-1">Incluez l'indicatif pays sans le signe + (ex: 336...)</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <MessageSquare className="w-3 h-3" /> Message (optionnel)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Bonjour, j'aimerais avoir plus d'informations..."
                className="w-full h-32 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
            <Send className="w-12 h-12 mb-6 opacity-50" />
            <h3 className="text-2xl font-black mb-4">Lien prêt à l'emploi</h3>
            <p className="text-indigo-100 font-medium leading-relaxed mb-8">
              Générez un lien direct vers une discussion WhatsApp. Idéal pour votre site web, signature d'email ou réseaux sociaux.
            </p>

            <div className="space-y-4">
              <div className="bg-white/10 rounded-2xl p-4 font-mono text-xs break-all border border-white/10">
                {generatedLink || 'En attente d\'un numéro...'}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  disabled={!generatedLink}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-indigo-600 hover:bg-indigo-50 disabled:opacity-50'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié' : 'Copier le lien'}
                </button>
                <button
                  onClick={handleOpen}
                  disabled={!generatedLink}
                  className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  <ExternalLink className="w-4 h-4" /> Tester
                </button>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/20 flex items-start gap-4">
            <div className="p-2 bg-white dark:bg-slate-800 text-emerald-600 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <Phone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold dark:text-white text-sm text-emerald-900">Astuce de formatage</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Utilisez le format international complet sans préfixes (ex: 33600000000 au lieu de +33 6 00 00 00 00).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
