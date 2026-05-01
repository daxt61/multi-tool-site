import { useState, useEffect } from 'react';
import { Download, Trash2, FileSearch, Plus, X, Copy, Check, Info, AlertCircle } from 'lucide-react';

const MAX_RULES = 20;
const MAX_PATHS_PER_RULE = 20;
const MAX_LENGTH = 500;

interface Rule {
  userAgent: string;
  disallow: string[];
  allow: string[];
}

export function RobotsTxtGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [rules, setRules] = useState<Rule[]>(() => {
    const initialRules = initialData?.rules || [{ userAgent: '*', disallow: ['/cgi-bin/', '/admin/'], allow: ['/'] }];
    return initialRules.slice(0, MAX_RULES).map((rule: any) => ({
      ...rule,
      userAgent: String(rule.userAgent || '').slice(0, MAX_LENGTH),
      disallow: (rule.disallow || []).slice(0, MAX_PATHS_PER_RULE).map((p: any) => String(p).slice(0, MAX_LENGTH)),
      allow: (rule.allow || []).slice(0, MAX_PATHS_PER_RULE).map((p: any) => String(p).slice(0, MAX_LENGTH))
    }));
  });
  const [sitemap, setSitemap] = useState((initialData?.sitemap || '').slice(0, MAX_LENGTH));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ rules, sitemap });
  }, [rules, sitemap]);

  const addRule = () => {
    if (rules.length >= MAX_RULES) {
      setError(`Nombre maximal de groupes de règles atteint (${MAX_RULES}).`);
      return;
    }
    setError(null);
    setRules([...rules, { userAgent: '*', disallow: [], allow: [] }]);
  };

  const removeRule = (index: number) => {
    setError(null);
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateUserAgent = (index: number, val: string) => {
    if (val.length > MAX_LENGTH) return;
    const newRules = [...rules];
    newRules[index].userAgent = val;
    setRules(newRules);
  };

  const addPath = (index: number, type: 'disallow' | 'allow') => {
    if (rules[index][type].length >= MAX_PATHS_PER_RULE) {
      setError(`Nombre maximal de chemins atteint pour ce groupe (${MAX_PATHS_PER_RULE}).`);
      return;
    }
    setError(null);
    const newRules = [...rules];
    newRules[index][type].push('');
    setRules(newRules);
  };

  const updatePath = (ruleIndex: number, pathIndex: number, type: 'disallow' | 'allow', val: string) => {
    if (val.length > MAX_LENGTH) return;
    const newRules = [...rules];
    newRules[ruleIndex][type][pathIndex] = val;
    setRules(newRules);
  };

  const removePath = (ruleIndex: number, pathIndex: number, type: 'disallow' | 'allow') => {
    const newRules = [...rules];
    newRules[ruleIndex][type] = newRules[ruleIndex][type].filter((_, i) => i !== pathIndex);
    setRules(newRules);
  };

  const robotsContent = rules.map(rule => {
    let res = `User-agent: ${rule.userAgent}\n`;
    rule.disallow.forEach(path => { if (path) res += `Disallow: ${path}\n`; });
    rule.allow.forEach(path => { if (path) res += `Allow: ${path}\n`; });
    return res;
  }).join('\n') + (sitemap ? `\nSitemap: ${sitemap}` : '');

  const handleCopy = () => {
    navigator.clipboard.writeText(robotsContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([robotsContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'robots.txt';
    link.click();
  };

  const handleClear = () => {
    setRules([{ userAgent: '*', disallow: [], allow: [] }]);
    setSitemap('');
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Editor */}
        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-indigo-500" /> Configuration
              </h3>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-full transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>

            <div className="space-y-6">
              {rules.map((rule, ruleIdx) => (
                <div key={ruleIdx} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4 relative group">
                  {rules.length > 1 && (
                    <button
                      onClick={() => removeRule(ruleIdx)}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">User-Agent</label>
                    <input
                      type="text"
                      value={rule.userAgent}
                      onChange={(e) => updateUserAgent(ruleIdx, e.target.value)}
                      placeholder="Ex: *, Googlebot"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-bold text-rose-500 uppercase tracking-widest">Disallow</label>
                        <button onClick={() => addPath(ruleIdx, 'disallow')} className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Ajouter
                        </button>
                      </div>
                      <div className="space-y-2">
                        {rule.disallow.map((path, pathIdx) => (
                          <div key={pathIdx} className="flex gap-2">
                            <input
                              type="text"
                              value={path}
                              onChange={(e) => updatePath(ruleIdx, pathIdx, 'disallow', e.target.value)}
                              placeholder="/path/"
                              className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm font-mono dark:text-white"
                            />
                            <button onClick={() => removePath(ruleIdx, pathIdx, 'disallow')} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Allow</label>
                        <button onClick={() => addPath(ruleIdx, 'allow')} className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Ajouter
                        </button>
                      </div>
                      <div className="space-y-2">
                        {rule.allow.map((path, pathIdx) => (
                          <div key={pathIdx} className="flex gap-2">
                            <input
                              type="text"
                              value={path}
                              onChange={(e) => updatePath(ruleIdx, pathIdx, 'allow', e.target.value)}
                              placeholder="/"
                              className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm font-mono dark:text-white"
                            />
                            <button onClick={() => removePath(ruleIdx, pathIdx, 'allow')} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addRule}
                className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 font-bold hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Ajouter un groupe de règles
              </button>

              <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <label htmlFor="sitemap" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Sitemap URL (Optionnel)</label>
                <input
                  id="sitemap"
                  type="url"
                  value={sitemap}
                  onChange={(e) => {
                    setSitemap(e.target.value.slice(0, MAX_LENGTH));
                  }}
                  placeholder="https://example.com/sitemap.xml"
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Aperçu robots.txt</h3>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="text-xs font-bold px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Télécharger
              </button>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-lg'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl min-h-[400px]">
            <pre className="font-mono text-emerald-400 text-sm leading-relaxed whitespace-pre-wrap">
              {robotsContent || '# Le contenu apparaîtra ici'}
            </pre>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-3xl space-y-4">
             <div className="flex items-center gap-3">
               <Info className="w-5 h-5 text-indigo-500" />
               <span className="text-xs font-black uppercase tracking-widest text-slate-400">À quoi ça sert ?</span>
             </div>
             <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
               Le fichier <strong>robots.txt</strong> indique aux robots d'exploration des moteurs de recherche (comme Google) les pages ou les fichiers qu'ils peuvent ou ne peuvent pas demander à votre site.
             </p>
             <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside">
               <li><strong>*</strong> cible tous les robots.</li>
               <li><strong>Disallow</strong> interdit l'accès à un chemin.</li>
               <li><strong>Allow</strong> autorise explicitement l'accès.</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
