import { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Copy, Check, Download, AlertCircle, Info, LinkIcon } from 'lucide-react';

interface SitemapURL {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const MAX_URLS = 1000;

export function SitemapGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [urls, setUrls] = useState<SitemapURL[]>(initialData?.urls || [{ url: 'https://example.com/', priority: '1.0', changefreq: 'daily' }]);
  const [baseUrl, setBaseUrl] = useState(initialData?.baseUrl || 'https://example.com');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    onStateChange?.({ urls, baseUrl, output });
  }, [urls, baseUrl, output]);

  const generateSitemap = () => {
    try {
      setError('');
      if (urls.length === 0) {
        setOutput('');
        return;
      }

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      urls.forEach((item) => {
        if (!item.url) return;
        xml += '  <url>\n';
        xml += `    <loc>${item.url}</loc>\n`;
        if (item.lastmod) xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
        if (item.changefreq) xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
        if (item.priority) xml += `    <priority>${item.priority}</priority>\n`;
        xml += '  </url>\n';
      });

      xml += '</urlset>';
      setOutput(xml);
    } catch (e: any) {
      setError('Erreur de génération : ' + e.message);
    }
  };

  useEffect(() => {
    generateSitemap();
  }, [urls]);

  const addUrl = () => {
    if (urls.length >= MAX_URLS) {
      setError(`Limite de ${MAX_URLS} URLs atteinte.`);
      return;
    }
    setUrls([...urls, { url: baseUrl, priority: '0.5', changefreq: 'monthly' }]);
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, field: keyof SitemapURL, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = { ...newUrls[index], [field]: value };
    setUrls(newUrls);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkAdd = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    if (lines.length + urls.length > MAX_URLS) {
      setError(`L'ajout de ces URLs dépasserait la limite de ${MAX_URLS}.`);
      return;
    }
    const newEntries = lines.map(url => ({ url, priority: '0.5', changefreq: 'monthly' }));
    setUrls([...urls, ...newEntries]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Configuration des URLs</h3>
            </div>
            <button
              onClick={addUrl}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/10"
            >
              <Plus className="w-3 h-3" /> Ajouter une URL
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
            {urls.map((item, index) => (
              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 relative group animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => removeUrl(index)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">URL</label>
                  <input
                    type="url"
                    value={item.url}
                    onChange={(e) => updateUrl(index, 'url', e.target.value)}
                    placeholder="https://example.com/page"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fréquence</label>
                    <select
                      value={item.changefreq}
                      onChange={(e) => updateUrl(index, 'changefreq', e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="always">Always</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priorité ({item.priority})</label>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.1"
                      value={item.priority}
                      onChange={(e) => updateUrl(index, 'priority', e.target.value)}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20 space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Ajout en masse</h4>
            </div>
            <textarea
              placeholder="Collez une liste d'URLs (une par ligne)..."
              onBlur={(e) => {
                if (e.target.value) {
                  handleBulkAdd(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full h-24 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              <label htmlFor="sitemap-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">XML Sitemap</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> Télécharger
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="sitemap-output"
            value={output}
            readOnly
            className="w-full h-[600px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
            <Info className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">Qu'est-ce qu'un Sitemap ?</h4>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Un sitemap est un fichier XML qui répertorie les URLs d'un site ainsi que des métadonnées complémentaires sur chaque URL (date de dernière modification, fréquence de mise à jour, importance relative). Il permet aux moteurs de recherche comme Google d'explorer votre site de manière plus intelligente et efficace.
        </p>
      </div>
    </div>
  );
}
