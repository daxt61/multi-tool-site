import { useState, useMemo } from 'react';
import { Copy, Check, Trash2, Link as LinkIcon, Share2, Info, Globe, Tag, MousePointer2, Megaphone, Terminal, FileText } from 'lucide-react';

export function UTMBuilder() {
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  const generatedUrl = useMemo(() => {
    if (!url) return '';

    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const params = new URLSearchParams(urlObj.search);

      if (source) params.set('utm_source', source);
      if (medium) params.set('utm_medium', medium);
      if (campaign) params.set('utm_campaign', campaign);
      if (term) params.set('utm_term', term);
      if (content) params.set('utm_content', content);

      urlObj.search = params.toString();
      return urlObj.toString();
    } catch (e) {
      return 'URL Invalide';
    }
  }, [url, source, medium, campaign, term, content]);

  const handleCopy = () => {
    if (!generatedUrl || generatedUrl === 'URL Invalide') return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setUrl('');
    setSource('');
    setMedium('');
    setCampaign('');
    setTerm('');
    setContent('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Form */}
        <div className="lg:col-span-7 space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres UTM</h3>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all px-3 py-1.5 rounded-xl flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="utm-url" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-2">
                <Globe className="w-3 h-3" /> URL du site web <span className="text-rose-500">*</span>
              </label>
              <input
                id="utm-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://votre-site.com/page"
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="utm-source" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-2">
                  <Megaphone className="w-3 h-3" /> Source (utm_source) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="utm-source"
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="google, newsletter, facebook..."
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="utm-medium" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-2">
                  <MousePointer2 className="w-3 h-3" /> Support (utm_medium)
                </label>
                <input
                  id="utm-medium"
                  type="text"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  placeholder="cpc, banner, email..."
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="utm-campaign" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Nom de la campagne (utm_campaign)
              </label>
              <input
                id="utm-campaign"
                type="text"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="promo_ete, lancement_produit..."
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="utm-term" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> Terme (utm_term)
                </label>
                <input
                  id="utm-term"
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="mots-clés payants"
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="utm-content" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Contenu (utm_content)
                </label>
                <input
                  id="utm-content"
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="logolink, textlink..."
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="space-y-4 relative z-10">
              <div className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                <LinkIcon className="w-3 h-3" /> URL Générée
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[120px] break-all font-mono text-sm text-indigo-300 leading-relaxed selection:bg-indigo-500/30">
                {generatedUrl || <span className="text-slate-600 italic">Remplissez les champs pour générer l'URL...</span>}
              </div>

              <button
                onClick={handleCopy}
                disabled={!generatedUrl || generatedUrl === 'URL Invalide'}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50'
                }`}
              >
                {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                {copied ? 'URL Copiée !' : 'Copier l\'URL'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <h4 className="font-bold dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" /> Qu'est-ce qu'un UTM ?
            </h4>
            <div className="space-y-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              <p>
                Les paramètres <strong>UTM (Urchin Tracking Module)</strong> sont des tags ajoutés à la fin d'une URL pour suivre l'efficacité des campagnes marketing et des sources de trafic dans des outils comme Google Analytics.
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Source :</strong> D'où vient le trafic (ex: google, facebook).</li>
                <li><strong>Medium :</strong> Le type de support (ex: cpc, email).</li>
                <li><strong>Campagne :</strong> Le nom spécifique de votre promo.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
