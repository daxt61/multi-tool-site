import { useState, useMemo } from 'react';
import { Share2, Copy, Check, MessageSquare, Twitter, Linkedin, Mail, Send, ExternalLink, Trash2, Info, Globe } from 'lucide-react';

export function SocialMediaLinks() {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const shareLinks = useMemo(() => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);

    return [
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: <MessageSquare className="w-5 h-5" />,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        link: `https://wa.me/?text=${encodedText}${encodedText ? '%20' : ''}${encodedUrl}`
      },
      {
        id: 'telegram',
        name: 'Telegram',
        icon: <Send className="w-5 h-5" />,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        link: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
      },
      {
        id: 'twitter',
        name: 'Twitter (X)',
        icon: <Twitter className="w-5 h-5" />,
        color: 'text-slate-900 dark:text-white',
        bg: 'bg-slate-100 dark:bg-white/10',
        link: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: <Linkedin className="w-5 h-5" />,
        color: 'text-blue-700',
        bg: 'bg-blue-50 dark:bg-blue-700/10',
        link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
      },
      {
        id: 'email',
        name: 'Email',
        icon: <Mail className="w-5 h-5" />,
        color: 'text-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        link: `mailto:?subject=${encodedText}&body=${encodedText}${encodedText ? '%0A%0A' : ''}${encodedUrl}`
      }
    ];
  }, [url, text]);

  const handleCopy = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setUrl('');
    setText('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="share-url" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Globe className="w-3 h-3" /> URL à partager
            </label>
            <button
              onClick={handleClear}
              disabled={!url && !text}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <input
            id="share-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            placeholder="https://votre-site.com"
          />

          <div className="space-y-3">
            <label htmlFor="share-text" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              Message d'accompagnement
            </label>
            <textarea
              id="share-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white resize-none"
              placeholder="Regardez ce super outil !"
            />
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
             <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                <Share2 className="w-5 h-5" />
             </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               Générez instantanément des liens de partage optimisés pour les réseaux sociaux. Pas besoin de bibliothèques lourdes, juste des liens directs.
             </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Liens générés</h3>
          <div className="grid gap-3">
            {shareLinks.map((platform) => (
              <div
                key={platform.id}
                className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${platform.bg} ${platform.color} rounded-xl flex items-center justify-center`}>
                    {platform.icon}
                  </div>
                  <span className="font-bold dark:text-white">{platform.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(platform.link, platform.id)}
                    className={`p-2 rounded-xl transition-all ${copied === platform.id ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    aria-label={`Copier le lien ${platform.name}`}
                  >
                    {copied === platform.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={platform.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                    aria-label={`Ouvrir le lien ${platform.name}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Utilité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Idéal pour les développeurs web qui souhaitent ajouter des boutons de partage sans utiliser de scripts tiers lourds et intrusifs pour la vie privée.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" /> Encodage
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'outil encode automatiquement les caractères spéciaux (espaces, emojis, ponctuation) pour garantir que vos liens fonctionnent parfaitement sur toutes les plateformes.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> Confidentialité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Comme tous nos outils, le traitement est fait à 100% dans votre navigateur. Aucune URL ou message que vous saisissez n'est envoyé à nos serveurs.
          </p>
        </div>
      </div>
    </div>
  );
}
