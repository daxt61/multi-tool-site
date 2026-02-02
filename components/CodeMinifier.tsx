import { useState, useMemo } from "react";
import { Scissors, Copy, Check, Trash2, Zap, Info, Shield, Code, FileCode } from "lucide-react";

export function CodeMinifier() {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"js" | "css" | "html">("js");
  const [copied, setCopied] = useState(false);

  const minifiedCode = useMemo(() => {
    if (!code) return "";

    const minifyJS = (val: string) => {
      let res = val;
      const placeholders: string[] = [];

      // 1. Preserve strings and regex literals to avoid breaking them
      // Masking strings
      res = res.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, (match) => {
        placeholders.push(match);
        return `__STR_${placeholders.length - 1}__`;
      });

      // Masking regex literals (simplified but covers common cases)
      res = res.replace(/\/(?![*\/])(?:\\.|[^\/\\\n])+\/(?=[gimuy]*[\s\.,;=)|\]}]|$)/g, (match) => {
        placeholders.push(match);
        return `__REG_${placeholders.length - 1}__`;
      });

      // 2. Remove comments
      res = res.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");

      // 3. Minify whitespace
      res = res.replace(/\s+/g, " ");
      res = res.replace(/\s*([;=+\-*/%&|^!<>?:{}[\](),])\s*/g, "$1");
      res = res.trim();

      // 4. Restore strings and regex
      placeholders.forEach((p, i) => {
        res = res.replace(`__STR_${i}__`, p).replace(`__REG_${i}__`, p);
      });
      return res;
    };

    const minifyCSS = (val: string) => {
      let res = val;
      res = res.replace(/\/\*[\s\S]*?\*\//g, ""); // Comments
      res = res.replace(/\s+/g, " "); // Spaces
      res = res.replace(/\s*([{:;,])\s*/g, "$1"); // Space around symbols
      res = res.replace(/;}/g, "}"); // Last semicolon
      return res.trim();
    };

    const minifyHTML = (val: string) => {
      let res = val;
      const placeholders: string[] = [];

      // Preserve <pre> and <code> tags
      res = res.replace(/<(pre|code)[\s\S]*?<\/\1>/gi, (match) => {
        placeholders.push(match);
        return `__PRE_${placeholders.length - 1}__`;
      });

      res = res.replace(/<!--[\s\S]*?-->/g, ""); // Comments
      res = res.replace(/>\s+</g, "><"); // Spaces between tags
      res = res.replace(/\s+/g, " "); // Multiple spaces

      // Restore preserved tags
      placeholders.forEach((p, i) => {
        res = res.replace(`__PRE_${i}__`, p);
      });
      return res.trim();
    };

    try {
      if (type === "js") return minifyJS(code);
      if (type === "css") return minifyCSS(code);
      if (type === "html") return minifyHTML(code);
      return code;
    } catch (e) {
      return "Erreur lors de la minification";
    }
  }, [code, type]);

  const stats = useMemo(() => {
    if (!code || !minifiedCode) return null;
    const original = code.length;
    const minified = minifiedCode.length;
    const saved = original - minified;
    const percent = ((saved / original) * 100).toFixed(1);
    return { original, minified, saved, percent };
  }, [code, minifiedCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(minifiedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          {(["js", "css", "html"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                type === t
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {stats && (
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-800/50">
              -{stats.percent}% de réduction
            </div>
            <div className="text-slate-400">
              {stats.minified} octets
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Code Source</label>
            <button onClick={() => setCode("")} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-slate-300"
            placeholder={`Collez votre code ${type.toUpperCase()} ici...`}
          />
        </div>

        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Code Minifié</label>
            <button
              onClick={handleCopy}
              disabled={!minifiedCode}
              className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'} disabled:opacity-30`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <div className="flex-1 p-6 bg-slate-900 rounded-[2rem] font-mono text-sm text-indigo-300 overflow-auto break-all">
            {minifiedCode || <span className="text-slate-600 italic">Le résultat apparaîtra ici...</span>}
          </div>
        </div>
      </div>

      {/* Educational Section */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-10 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Zap className="w-3 h-3" /> Performance Web
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">Pourquoi minifier votre code ?</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              La minification est le processus de suppression de tous les caractères inutiles du code source sans en changer la fonctionnalité. Cela inclut les espaces blancs, les retours à la ligne et les commentaires.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex-shrink-0 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Chargement plus rapide :</strong> Des fichiers plus petits signifient moins de données à transférer pour vos utilisateurs.</p>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex-shrink-0 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Économie de bande passante :</strong> Réduisez vos coûts d'hébergement et la consommation de données mobiles.</p>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex-shrink-0 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Meilleur SEO :</strong> Google favorise les sites qui se chargent rapidement, améliorant votre classement.</p>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" /> Sécurité et Confidentialité
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Contrairement à d'autres outils en ligne, notre minificateur traite tout votre code <strong>localement dans votre navigateur</strong>. Vos scripts et styles ne sont jamais envoyés à un serveur, garantissant que vos secrets et votre propriété intellectuelle restent privés.
              </p>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Fonctionnement technique</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <div className="text-indigo-500 mb-1"><Code className="w-4 h-4" /></div>
                    <div className="text-[10px] font-bold dark:text-white">Analyse Regex</div>
                    <div className="text-[9px] text-slate-400">Identification des tokens</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <div className="text-indigo-500 mb-1"><FileCode className="w-4 h-4" /></div>
                    <div className="text-[10px] font-bold dark:text-white">Compression</div>
                    <div className="text-[9px] text-slate-400">Nettoyage des espaces</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
