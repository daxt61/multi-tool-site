import { Info, Target, Wrench, Users, CheckCircle2, Globe2 } from "lucide-react";

export function About() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-full text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-widest">
          <Info className="w-4 h-4" /> À propos de nous
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight">
          Simplifier votre quotidien <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">avec les bons outils.</span>
        </h2>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Boîte à Outils est une plateforme moderne qui regroupe tous les utilitaires essentiels dont vous avez besoin, accessibles instantanément et gratuitement.
        </p>
      </section>

      {/* Stats/Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: <CheckCircle2 className="text-green-500" />, title: "Gratuit", desc: "Tous nos outils sont accessibles sans frais ni abonnement." },
          { icon: <Globe2 className="text-blue-500" />, title: "Privé", desc: "Vos données restent dans votre navigateur. Rien n'est stocké sur nos serveurs." },
          { icon: <Zap className="text-amber-500" />, title: "Rapide", desc: "Pas d'installation, pas d'inscription. Cliquez et utilisez." },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
              {item.icon}
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h4>
            <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Notre Mission */}
        <section className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black mb-6">Notre Mission</h3>
            <p className="text-indigo-100 text-lg leading-relaxed mb-8">
              Nous croyons que les outils numériques devraient être accessibles à tous, sans barrière technique ni inscription. Notre objectif est de construire la boîte à outils la plus complète et la plus agréable à utiliser du web.
            </p>
            <ul className="space-y-4">
              {['Simplicité d\'utilisation', 'Performance maximale', 'Respect total de la vie privée'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-bold text-indigo-50">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Nos Outils */}
        <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[3rem] p-10 shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-8">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-6">Plus de 35 outils</h3>
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-8">
            Nous ajoutons régulièrement de nouveaux outils basés sur vos retours. Notre collection couvre tous les besoins :
          </p>
          <div className="grid grid-cols-2 gap-4">
            {['Finance', 'Développement', 'Conversion', 'Texte', 'Images', 'Calcul'].map((cat, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl font-bold text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                {cat}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Équipe/Contact */}
      <section className="bg-gray-900 rounded-[3rem] p-12 text-center text-white overflow-hidden relative">
         <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
         <Users className="w-16 h-16 text-indigo-500 mx-auto mb-8 opacity-50" />
         <h3 className="text-3xl font-black mb-4">Conçu pour la communauté</h3>
         <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-0">
           Boîte à Outils est un projet passionné, conçu pour aider les étudiants, les développeurs et les professionnels à gagner du temps chaque jour.
         </p>
      </section>
    </div>
  );
}

function Zap({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
}
