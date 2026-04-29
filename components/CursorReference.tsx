import { useState } from 'react';
import { MousePointer2, Copy, Check, Info, Search, X } from 'lucide-react';

const CURSORS = [
  { name: 'default', description: 'Le curseur par défaut (souvent une flèche).' },
  { name: 'pointer', description: 'Indique un lien ou un élément cliquable.' },
  { name: 'wait', description: 'Indique que le programme est occupé (sablier).' },
  { name: 'progress', description: 'Indique que le programme travaille en arrière-plan.' },
  { name: 'text', description: 'Indique que le texte peut être sélectionné.' },
  { name: 'move', description: 'Indique que l\'élément peut être déplacé.' },
  { name: 'help', description: 'Indique qu\'une aide est disponible.' },
  { name: 'not-allowed', description: 'Indique que l\'action n\'est pas autorisée.' },
  { name: 'crosshair', description: 'Un curseur en forme de croix.' },
  { name: 'zoom-in', description: 'Indique qu\'un zoom avant est possible.' },
  { name: 'zoom-out', description: 'Indique qu\'un zoom arrière est possible.' },
  { name: 'grab', description: 'Indique que l\'élément peut être saisi.' },
  { name: 'grabbing', description: 'Indique que l\'élément est en train d\'être saisi.' },
  { name: 'all-scroll', description: 'Indique que le défilement est possible dans toutes les directions.' },
  { name: 'col-resize', description: 'Indique qu\'une colonne peut être redimensionnée horizontalement.' },
  { name: 'row-resize', description: 'Indique qu\'une ligne peut être redimensionnée verticalement.' },
  { name: 'n-resize', description: 'Redimensionnement vers le haut (nord).' },
  { name: 'e-resize', description: 'Redimensionnement vers la droite (est).' },
  { name: 's-resize', description: 'Redimensionnement vers le bas (sud).' },
  { name: 'w-resize', description: 'Redimensionnement vers la gauche (ouest).' },
  { name: 'ne-resize', description: 'Redimensionnement vers le haut et la droite.' },
  { name: 'nw-resize', description: 'Redimensionnement vers le haut et la gauche.' },
  { name: 'se-resize', description: 'Redimensionnement vers le bas et la droite.' },
  { name: 'sw-resize', description: 'Redimensionnement vers le bas et la gauche.' },
  { name: 'ew-resize', description: 'Redimensionnement horizontal.' },
  { name: 'ns-resize', description: 'Redimensionnement vertical.' },
  { name: 'nesw-resize', description: 'Redimensionnement diagonal (NE/SW).' },
  { name: 'nwse-resize', description: 'Redimensionnement diagonal (NW/SE).' },
  { name: 'no-drop', description: 'Indique que l\'élément ne peut pas être déposé ici.' },
  { name: 'none', description: 'Aucun curseur ne sera affiché.' },
  { name: 'context-menu', description: 'Indique qu\'un menu contextuel est disponible.' },
  { name: 'cell', description: 'Indique qu\'une ou plusieurs cellules peuvent être sélectionnées.' },
  { name: 'vertical-text', description: 'Indique que le texte vertical peut être sélectionné.' },
  { name: 'alias', description: 'Indique qu\'un alias ou un raccourci doit être créé.' },
  { name: 'copy', description: 'Indique que quelque chose doit être copié.' },
];

export function CursorReference() {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const filteredCursors = CURSORS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (name: string) => {
    const code = `cursor: ${name};`;
    navigator.clipboard.writeText(code);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="max-w-md mx-auto relative group">
        <label htmlFor="cursor-search" className="sr-only">Rechercher un curseur</label>
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          id="cursor-search"
          type="text"
          placeholder="Rechercher un curseur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCursors.map((cursor) => (
          <div
            key={cursor.name}
            style={{ cursor: cursor.name }}
            className="group p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col text-left relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-all">
                <MousePointer2 className="w-6 h-6" />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(cursor.name); }}
                className={`p-2 rounded-xl transition-all border z-20 ${
                  copied === cursor.name
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500 md:opacity-0 group-hover:opacity-100 md:focus-visible:opacity-100'
                }`}
                title="Copier le CSS"
                aria-label={`Copier le CSS pour ${cursor.name}`}
              >
                {copied === cursor.name ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">{cursor.name}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
              {cursor.description}
            </p>

            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <code className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md">
                cursor: {cursor.name};
              </code>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Survolez-moi</span>
            </div>
          </div>
        ))}
      </div>

      {filteredCursors.length === 0 && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 font-bold">Aucun curseur trouvé pour "{search}"</p>
        </div>
      )}

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="flex items-start gap-6 relative z-10">
          <div className="p-4 bg-white/10 rounded-3xl">
            <Info className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-black">Comment l'utiliser ?</h3>
            <p className="text-indigo-100/70 leading-relaxed font-medium">
              La propriété CSS <code>cursor</code> définit le type de curseur à afficher lorsque la souris survole un élément.
              C'est un élément clé de l'expérience utilisateur (UX) pour indiquer si un élément est cliquable, déplaçable ou en attente.
            </p>
            <div className="flex flex-wrap gap-2">
              {['UX', 'CSS3', 'Accessibilité', 'Feedback visuel'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-white/50">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
