import { useState, useMemo, useEffect } from 'react';
import { Link as LinkIcon, Globe, FileText, Hash, Search, Copy, Check, Trash2, Info, Download, ShieldCheck, Terminal, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 10000;

export function UrlParser({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState(initialData?.url || '');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ url });
  }, [url]);

  const parsed = useMemo(() => {
    if (!url.trim()) return null;
    if (url.length > MAX_LENGTH) {
      return { isValid: false as const, error: t('urlparser.error_too_long', { max: MAX_LENGTH.toLocaleString() }) };
    }
    try {
      // Handle cases where protocol might be missing
      let urlToParse = url.trim();
      if (!/^[a-z]+:\/\//i.test(urlToParse)) {
        urlToParse = 'https://' + urlToParse;
      }
      const u = new URL(urlToParse);

      const searchParams: { key: string; value: string }[] = [];
      u.searchParams.forEach((value, key) => {
        searchParams.push({ key, value });
      });

      return {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port,
        pathname: u.pathname,
        search: u.search,
        searchParams,
        hash: u.hash,
        origin: u.origin,
        isValid: true as const
      };
    } catch (e) {
      return { isValid: false as const };
    }
  }, [url, t]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    if (!parsed || !parsed.isValid) return;
    const report = `${t('urlparser.results')} : ${url}

${t('urlparser.protocol')} : ${parsed.protocol}
${t('urlparser.host')} : ${parsed.hostname}
${t('urlparser.port')} : ${parsed.port || t('common.na')}
${t('urlparser.path')} : ${parsed.pathname}
${t('urlparser.params')} : ${parsed.search}
${t('urlparser.hash')} : ${parsed.hash || t('common.na')}
${t('urlparser.origin')} : ${parsed.origin}`;

    const blob = new Blob([report], { type: 'text/plain' });
    const urlBlob = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlBlob;
    link.download = `url-analysis-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(urlBlob);
  };

  const handleCopyCurl = () => {
    if (!url) return;
    // Sentinel: Escape double quotes to mitigate command injection in the generated snippet
    const escapedUrl = url.replace(/"/g, '\\"');
    const curl = `curl "${escapedUrl}"`;
    copyToClipboard(curl, 'curl');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="url-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-indigo-500" /> {t('urlparser.title')}
          </label>
          <button
            onClick={() => setUrl('')}
            disabled={!url}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3 h-3" /> {t('common.clear')}
          </button>
        </div>
        <div className="relative group">
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/path?param=value#hash"
            className={`w-full p-6 bg-slate-50 dark:bg-slate-900 border ${url.length > MAX_LENGTH ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-3xl outline-none focus:ring-2 ${url.length > MAX_LENGTH ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all text-lg font-mono dark:text-white`}
          />
          {url && parsed && !parsed.isValid && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500">
               <AlertCircle className="w-5 h-5" />
            </div>
          )}
        </div>
        {url.length > MAX_LENGTH && (
          <div className="flex items-center gap-2 text-rose-500 text-xs font-bold px-4">
            <AlertCircle className="w-4 h-4" />
            {t('urlparser.error_too_long', { max: MAX_LENGTH.toLocaleString() })}
          </div>
        )}
      </div>

      {url && parsed && (
        parsed.isValid ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Actions */}
            <div className="flex justify-between items-center px-1">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{t('urlparser.results')}</h3>
               <div className="flex gap-2">
                 <button
                   onClick={handleCopyCurl}
                   className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                     copied === 'curl'
                       ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                       : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                   }`}
                 >
                   {copied === 'curl' ? <Check className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
                   {copied === 'curl' ? t('urlparser.curl_copied') : t('urlparser.copy_curl')}
                 </button>
                 <button
                   onClick={handleDownload}
                   className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                 >
                   <Download className="w-3 h-3" /> {t('common.download')}
                 </button>
               </div>
            </div>

            {/* Grid of components */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: t('urlparser.protocol'), value: parsed.protocol, icon: <ShieldCheck className="w-4 h-4" /> },
                { label: t('urlparser.host'), value: parsed.hostname, icon: <Globe className="w-4 h-4" /> },
                { label: t('urlparser.port'), value: parsed.port || t('common.standard'), icon: <Hash className="w-4 h-4" /> },
                { label: t('urlparser.path'), value: parsed.pathname, icon: <FileText className="w-4 h-4" /> },
                { label: t('urlparser.hash'), value: parsed.hash || t('common.na'), icon: <Hash className="w-4 h-4" /> },
                { label: t('urlparser.origin'), value: parsed.origin, icon: <LinkIcon className="w-4 h-4" /> },
              ].map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4 group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-indigo-500">
                      {item.icon}
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(item.value, `comp-${idx}`)}
                      aria-label={`${t('common.copy')} ${item.label.toLowerCase()}`}
                      className={`p-2 rounded-xl transition-all relative z-10 ${copied === `comp-${idx}` ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'text-slate-400 hover:text-indigo-500 md:opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
                    >
                      {copied === `comp-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="font-mono text-sm break-all dark:text-white font-bold">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Parameters Section */}
            {parsed.isValid && parsed.searchParams && parsed.searchParams.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Search className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('urlparser.params')} ({parsed.searchParams.length})</h3>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">{t('urlparser.key')}</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">{t('urlparser.value')}</th>
                          <th className="px-6 py-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsed.searchParams.map((param, idx) => (
                          <tr key={idx} className="group hover:bg-white dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400 font-mono">{param.key}</td>
                            <td className="px-6 py-4 font-mono dark:text-slate-300 break-all">{param.value}</td>
                            <td className="px-6 py-4 text-right">
                               <button
                                 onClick={() => copyToClipboard(param.value, `param-${idx}`)}
                                 aria-label={`${t('common.copy')} ${param.key}`}
                                 className={`p-2 rounded-xl transition-all relative z-10 ${copied === `param-${idx}` ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-indigo-500 md:opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
                               >
                                 {copied === `param-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-rose-50 dark:bg-rose-500/5 rounded-[2.5rem] border-2 border-dashed border-rose-200 dark:border-rose-500/20">
             <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-lg">
                <AlertCircle className="w-8 h-8" />
             </div>
             <h4 className="text-xl font-bold text-rose-900 dark:text-rose-400 mb-2">
               {(parsed as any).error || t('urlparser.invalid_url')}
             </h4>
             <p className="text-rose-600/60 dark:text-rose-400/60 font-medium">
               {!(parsed as any).error && t('urlparser.invalid_hint')}
             </p>
          </div>
        )
      )}

      {/* Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
         <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Info className="w-6 h-6" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">{t('urlparser.why_title')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('urlparser.why_text')}
            </p>
         </div>
      </div>
    </div>
  );
}
