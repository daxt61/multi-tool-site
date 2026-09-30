import { useState, useMemo, useEffect, useRef } from 'react';
import { Copy, Check, Info, Globe, Share2, Search, Monitor, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

export function MetaTagsGenerator() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState('');
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const getHostname = (urlStr: string) => {
    try {
      return new URL(urlStr || 'https://votre-site.com').hostname;
    } catch {
      return 'votre-site.com';
    }
  };

  const metaTags = useMemo(() => {
    const eTitle = escapeHtml(title);
    const eDesc = escapeHtml(description);
    const eUrl = escapeHtml(url);
    const eImage = escapeHtml(image);

    const tags = [
      '<!-- Primary Meta Tags -->',
      `<title>${eTitle || 'Titre de la page'}</title>`,
      `<meta name="title" content="${eTitle}">`,
      `<meta name="description" content="${eDesc}">`,
      '',
      '<!-- Open Graph / Facebook -->',
      '<meta property="og:type" content="website">',
      `<meta property="og:url" content="${eUrl}">`,
      `<meta property="og:title" content="${eTitle}">`,
      `<meta property="og:description" content="${eDesc}">`,
      `<meta property="og:image" content="${eImage}">`,
      '',
      '<!-- Twitter -->',
      '<meta property="twitter:card" content="summary_large_image">',
      `<meta property="twitter:url" content="${eUrl}">`,
      `<meta property="twitter:title" content="${eTitle}">`,
      `<meta property="twitter:description" content="${eDesc}">`,
      `<meta property="twitter:image" content="${eImage}">`
    ];
    return tags.join('\n');
  }, [title, description, url, image]);

  const handleCopy = () => {
    navigator.clipboard.writeText(metaTags);
    setCopied(true);
    toast.success(t('metatags.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setTitle('');
    setDescription('');
    setUrl('');
    setImage('');
    toast.success(t('metatags.toast_cleared'));
    primaryInputRef.current?.focus();
  };

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        containerRef.current &&
        !containerRef.current.contains(activeElement) &&
        activeElement !== document.body
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
        const isEditingText =
          activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
        if (!isEditingText) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('metatags.config_title')}</h3>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all px-3 py-1.5 rounded-full flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('common.clear')}</span>
              <Kbd modifier={null}>Esc</Kbd>
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="meta-title" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 cursor-pointer">
                {t('metatags.page_title')}
              </label>
              <input
                ref={primaryInputRef}
                id="meta-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('metatags.page_title_placeholder')}
                autoComplete="off"
                spellCheck={false}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
              <div className="flex justify-between text-[10px] font-bold px-1">
                <span className={title.length > 60 ? 'text-rose-500' : 'text-slate-400'}>
                  {title.length} / 60 {t('metatags.title_recommended')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="meta-desc" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 cursor-pointer">
                {t('metatags.description')}
              </label>
              <textarea
                id="meta-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('metatags.description_placeholder')}
                autoComplete="off"
                spellCheck={false}
                className="w-full h-32 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium dark:text-white resize-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
              <div className="flex justify-between text-[10px] font-bold px-1">
                <span className={description.length > 160 ? 'text-rose-500' : 'text-slate-400'}>
                  {description.length} / 160 {t('metatags.title_recommended')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="meta-url" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 cursor-pointer">
                {t('metatags.page_url')}
              </label>
              <input
                id="meta-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('metatags.page_url_placeholder')}
                autoComplete="off"
                spellCheck={false}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="meta-image" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 cursor-pointer">
                {t('metatags.og_image')}
              </label>
              <input
                id="meta-image"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder={t('metatags.og_image_placeholder')}
                autoComplete="off"
                spellCheck={false}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Previews */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" /> {t('metatags.google_preview')}
            </h3>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="text-[#1a0dab] text-xl font-medium mb-1 truncate max-w-full">
                {title || 'Titre de la page apparaissant dans Google'}
              </div>
              <div className="text-[#006621] text-sm mb-1 truncate">
                {url || 'https://votre-site.com'}
              </div>
              <div className="text-[#4d5156] text-sm line-clamp-2">
                {description || 'La description meta aide les utilisateurs à comprendre le contenu de votre page depuis les résultats de recherche.'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" /> {t('metatags.social_preview')}
            </h3>
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="aspect-[1.91/1] bg-slate-100 flex items-center justify-center relative border-b border-slate-100">
                {image ? (
                  <img src={image} alt="OG Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-300 gap-2">
                    <Globe className="w-12 h-12 opacity-20" aria-hidden="true" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('metatags.share_image')}</span>
                  </div>
                )}
              </div>
              <div className="p-6 bg-slate-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{getHostname(url)}</div>
                <div className="text-[#1c1e21] font-bold mb-1 line-clamp-1">{title || 'Titre du partage social'}</div>
                <div className="text-[#606770] text-sm line-clamp-2">{description || 'La description courte de votre page pour attirer l\'attention sur les réseaux.'}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="html-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('metatags.html_code')}
              </label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-6 py-2 rounded-full transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>{copied ? t('common.copied') : t('common.copy')}</span>
                <Kbd modifier={null} className="bg-white/20 text-white border-white/20">C</Kbd>
              </button>
            </div>
            <pre id="html-output" className="p-6 bg-slate-900 text-indigo-300 rounded-[2rem] font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-60">
              {metaTags}
            </pre>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('metatags.why_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('metatags.why_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('metatags.og_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('metatags.og_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('metatags.best_practices_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('metatags.best_practices_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
