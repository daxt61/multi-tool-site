import { Info, Target, Wrench, Users, CheckCircle2, Globe2, ShieldCheck, Zap } from "lucide-react";

export function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-24 py-12">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          La productivité <br />
          <span className="text-slate-400 dark:text-slate-600">sans compromis.</span>
        </h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
          Boîte à Outils est une plateforme moderne regroupant tous les utilitaires essentiels pour vos tâches quotidiennes.
        </p>
      </section>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Zap className="w-6 h-6" />, title: "Instantané", desc: "Pas de compte, pas d'installation. Vos outils sont prêts." },
          { icon: <ShieldCheck className="w-6 h-6" />, title: "Privé", desc: "Vos données restent locales. Nous ne collectons rien." },
          { icon: <Globe2 className="w-6 h-6" />, title: "Open Source", desc: "Transparence totale sur le code et les algorithmes." },
        ].map((item, i) => (
          <div key={i} className="p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              {item.icon}
            </div>
            <h4 className="text-lg font-black">{item.title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest">
            Notre Mission
          </div>
          <h3 className="text-3xl font-black tracking-tight">Accessibilité & Performance</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Le web regorge de convertisseurs et calculateurs, mais trop souvent ils sont encombrés de publicités, lents ou complexes. Notre mission est de fournir une alternative propre, rapide et agréable.
          </p>
          <ul className="space-y-4">
            {['Performance maximale (Vite + React)', 'Respect total de la vie privée', 'Design intuitif et minimaliste'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-slate-900 dark:bg-black p-10 rounded-[3rem] text-white space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black tracking-tight">Une boîte à outils en constante évolution</h3>
          <p className="text-slate-400 leading-relaxed font-medium">
            Nous ajoutons régulièrement de nouveaux outils basés sur les retours de nos utilisateurs. De la finance au développement, nous couvrons tous vos besoins.
          </p>
          <div className="pt-4 flex flex-wrap gap-2">
            {['Finance', 'Calcul', 'Dev', 'Texte'].map(tag => (
              <span key={tag} className="px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase">{tag}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
