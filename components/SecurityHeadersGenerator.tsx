import { useState, useEffect, useMemo } from 'react';
import { Shield, Copy, Check, Terminal, Server, Globe, Download, Info } from 'lucide-react';

interface HeadersState {
  csp: boolean;
  hsts: boolean;
  xframe: boolean;
  xss: boolean;
  nosniff: boolean;
  referrer: boolean;
  permissions: boolean;
}

export function SecurityHeadersGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [options, setOptions] = useState<HeadersState>(initialData?.options || {
    csp: true,
    hsts: true,
    xframe: true,
    xss: true,
    nosniff: true,
    referrer: true,
    permissions: true,
  });
  const [copied, setCopied] = useState('');

  useEffect(() => {
    onStateChange?.({ options });
  }, [options]);

  const headers = useMemo(() => {
    const list: { name: string; value: string }[] = [];
    if (options.csp) list.push({ name: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; object-src 'none';" });
    if (options.hsts) list.push({ name: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' });
    if (options.xframe) list.push({ name: 'X-Frame-Options', value: 'DENY' });
    if (options.xss) list.push({ name: 'X-XSS-Protection', value: '1; mode=block' });
    if (options.nosniff) list.push({ name: 'X-Content-Type-Options', value: 'nosniff' });
    if (options.referrer) list.push({ name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' });
    if (options.permissions) list.push({ name: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' });
    return list;
  }, [options]);

  const nginxConfig = useMemo(() => {
    return headers.map(h => `add_header ${h.name} "${h.value}" always;`).join('\n');
  }, [headers]);

  const apacheConfig = useMemo(() => {
    return headers.map(h => `Header set ${h.name} "${h.value}"`).join('\n');
  }, [headers]);

  const netlifyConfig = useMemo(() => {
    return `[[headers]]\n  for = "/*"\n  [headers.values]\n${headers.map(h => `    ${h.name} = "${h.value}"`).join('\n')}`;
  }, [headers]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const toggleOption = (key: keyof HeadersState) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Options */}
        <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Shield className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">En-têtes de sécurité</h3>
          </div>
          <div className="space-y-3">
            {[
              { id: 'csp', label: 'CSP (Content Security Policy)', desc: 'Prévient les attaques XSS' },
              { id: 'hsts', label: 'HSTS', desc: 'Force la connexion HTTPS' },
              { id: 'xframe', label: 'X-Frame-Options', desc: 'Empêche le clickjacking' },
              { id: 'nosniff', label: 'X-Content-Type-Options', desc: 'Empêche le reniflage de MIME' },
              { id: 'referrer', label: 'Referrer-Policy', desc: 'Contrôle les infos de provenance' },
              { id: 'permissions', label: 'Permissions-Policy', desc: 'Désactive les APIs navigateur' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleOption(opt.id as keyof HeadersState)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  options[opt.id as keyof HeadersState]
                    ? 'bg-white dark:bg-slate-800 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                    : 'bg-transparent border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-sm ${options[opt.id as keyof HeadersState] ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {opt.label}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    options[opt.id as keyof HeadersState] ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-700'
                  }`}>
                    {options[opt.id as keyof HeadersState] && <Check className="w-3 h-3 text-white stroke-[4]" />}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Configurations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nginx */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Nginx</span>
                </div>
                <button
                  onClick={() => handleCopy(nginxConfig, 'nginx')}
                  className={`p-2 rounded-xl transition-all ${copied === 'nginx' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}
                >
                  {copied === 'nginx' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="bg-slate-900 dark:bg-black rounded-3xl p-6 h-48 overflow-auto border border-slate-800">
                <pre className="text-xs font-mono text-indigo-400 leading-relaxed">{nginxConfig}</pre>
              </div>
            </div>

            {/* Apache */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Apache (.htaccess)</span>
                </div>
                <button
                  onClick={() => handleCopy(apacheConfig, 'apache')}
                  className={`p-2 rounded-xl transition-all ${copied === 'apache' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}
                >
                  {copied === 'apache' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="bg-slate-900 dark:bg-black rounded-3xl p-6 h-48 overflow-auto border border-slate-800">
                <pre className="text-xs font-mono text-indigo-400 leading-relaxed">{apacheConfig}</pre>
              </div>
            </div>
          </div>

          {/* Netlify / Vercel style */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Netlify (netlify.toml)</span>
              </div>
              <button
                onClick={() => handleCopy(netlifyConfig, 'netlify')}
                className={`p-2 rounded-xl transition-all ${copied === 'netlify' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}
              >
                {copied === 'netlify' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="bg-slate-900 dark:bg-black rounded-3xl p-8 border border-slate-800 shadow-xl shadow-indigo-500/5">
              <pre className="text-sm font-mono text-indigo-400 leading-relaxed">{netlifyConfig}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Footer */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" /> Pourquoi ces en-têtes ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les en-têtes de sécurité HTTP indiquent au navigateur comment se comporter lors de l'interaction avec votre site. Ils constituent une première ligne de défense essentielle contre les vulnérabilités courantes comme le Cross-Site Scripting (XSS) et le détournement de session.
          </p>
        </div>
        <div className="flex-1 space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Recommandations
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Il est fortement conseillé d'utiliser au minimum <strong>HSTS</strong>, <strong>X-Content-Type-Options</strong> et une <strong>CSP</strong> basique. Testez toujours vos configurations dans un environnement de pré-production avant de les déployer.
          </p>
        </div>
      </div>
    </div>
  );
}
