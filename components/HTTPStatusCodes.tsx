import { useState, useMemo } from 'react';
import { Search, Copy, Check, Info, Globe, AlertCircle, CheckCircle2, HelpCircle, Ban, X } from 'lucide-react';

interface StatusCode {
  code: string;
  name: string;
  description: string;
}

interface StatusCategory {
  id: string;
  range: string;
  title: string;
  icon: any;
  color: string;
  bg: string;
  codes: StatusCode[];
}

const STATUS_CODES: StatusCategory[] = [
  {
    id: '1xx',
    range: '100-199',
    title: 'Information',
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    codes: [
      { code: '100', name: 'Continue', description: 'Le client doit continuer sa requête.' },
      { code: '101', name: 'Switching Protocols', description: 'Le serveur accepte de changer de protocole.' },
      { code: '102', name: 'Processing', description: 'Le serveur a reçu la requête et la traite.' },
      { code: '103', name: 'Early Hints', description: 'Permet au client de commencer le préchargement de ressources.' },
    ]
  },
  {
    id: '2xx',
    range: '200-299',
    title: 'Succès',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    codes: [
      { code: '200', name: 'OK', description: 'La requête a réussi.' },
      { code: '201', name: 'Created', description: 'La requête a réussi et une ressource a été créée.' },
      { code: '202', name: 'Accepted', description: 'La requête a été acceptée mais le traitement n\'est pas fini.' },
      { code: '204', name: 'No Content', description: 'La requête a réussi mais il n\'y a pas de contenu à renvoyer.' },
      { code: '206', name: 'Partial Content', description: 'Le serveur renvoie une partie de la ressource.' },
    ]
  },
  {
    id: '3xx',
    range: '300-399',
    title: 'Redirection',
    icon: Globe,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    codes: [
      { code: '301', name: 'Moved Permanently', description: 'La ressource a été déplacée de façon permanente.' },
      { code: '302', name: 'Found', description: 'La ressource se trouve temporairement à une autre URL.' },
      { code: '304', name: 'Not Modified', description: 'La ressource n\'a pas été modifiée depuis la dernière requête.' },
      { code: '307', name: 'Temporary Redirect', description: 'Redirection temporaire, la méthode HTTP ne doit pas changer.' },
      { code: '308', name: 'Permanent Redirect', description: 'Redirection permanente, la méthode HTTP ne doit pas changer.' },
    ]
  },
  {
    id: '4xx',
    range: '400-499',
    title: 'Erreur Client',
    icon: HelpCircle,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    codes: [
      { code: '400', name: 'Bad Request', description: 'La syntaxe de la requête est erronée.' },
      { code: '401', name: 'Unauthorized', description: 'Authentification nécessaire pour accéder à la ressource.' },
      { code: '403', name: 'Forbidden', description: 'Le serveur refuse d\'exécuter la requête.' },
      { code: '404', name: 'Not Found', description: 'La ressource demandée n\'a pas été trouvée.' },
      { code: '405', name: 'Method Not Allowed', description: 'La méthode de requête n\'est pas autorisée pour cette ressource.' },
      { code: '408', name: 'Request Timeout', description: 'Le temps d\'attente de la requête du client est écoulé.' },
      { code: '409', name: 'Conflict', description: 'La requête ne peut être traitée en raison d\'un conflit.' },
      { code: '410', name: 'Gone', description: 'La ressource n\'est plus disponible et ne le sera plus.' },
      { code: '422', name: 'Unprocessable Entity', description: 'La requête est bien formée mais contient des erreurs sémantiques.' },
      { code: '429', name: 'Too Many Requests', description: 'L\'utilisateur a envoyé trop de requêtes dans un temps donné.' },
    ]
  },
  {
    id: '5xx',
    range: '500-599',
    title: 'Erreur Serveur',
    icon: Ban,
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    codes: [
      { code: '500', name: 'Internal Server Error', description: 'Erreur interne du serveur.' },
      { code: '501', name: 'Not Implemented', description: 'Le serveur ne supporte pas la fonctionnalité demandée.' },
      { code: '502', name: 'Bad Gateway', description: 'Le serveur a reçu une réponse invalide d\'un serveur distant.' },
      { code: '503', name: 'Service Unavailable', description: 'Le serveur est temporairement incapable de traiter la requête.' },
      { code: '504', name: 'Gateway Timeout', description: 'Le serveur n\'a pas reçu de réponse à temps d\'un autre serveur.' },
    ]
  }
];

export function HTTPStatusCodes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return STATUS_CODES;

    return STATUS_CODES.map(cat => ({
      ...cat,
      codes: cat.codes.filter(c =>
        c.code.includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      )
    })).filter(cat => cat.codes.length > 0);
  }, [searchQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Search Header */}
      <div className="max-w-xl mx-auto space-y-6 text-center">
        <div className="relative group">
          <label htmlFor="status-search" className="sr-only">Rechercher un code d'état</label>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            id="status-search"
            type="text"
            placeholder="Rechercher par code, nom ou description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Effacer la recherche"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="space-y-16">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <section key={category.id} className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className={`p-3 rounded-2xl ${category.bg} ${category.color}`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black dark:text-white">{category.title}</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{category.range}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {category.codes.map((item) => (
                  <div
                    key={item.code}
                    className="group p-6 bg-white dark:bg-slate-900/40 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className={`text-3xl font-black font-mono tracking-tighter ${category.color}`}>
                          {item.code}
                        </span>
                        <button
                          onClick={() => handleCopy(item.code, item.code)}
                          className={`p-2 rounded-xl transition-all ${
                            copiedCode === item.code
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 opacity-0 group-hover:opacity-100'
                          }`}
                          title="Copier le code"
                        >
                          {copiedCode === item.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold mb-2">Aucun code trouvé</h4>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Essayez un autre mot-clé ou effacez la recherche.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-all"
            >
              Effacer la recherche
            </button>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-6 max-w-3xl mx-auto">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm">
          <Globe className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">À propos des codes d'état HTTP</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les codes de réponse HTTP indiquent si une requête HTTP spécifique a été complétée avec succès. Les réponses sont regroupées en cinq classes : les réponses informatives, les succès, les redirections, les erreurs client et les erreurs serveur.
          </p>
        </div>
      </div>
    </div>
  );
}
