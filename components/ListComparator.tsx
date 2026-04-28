import { useState, useMemo, useEffect } from 'react';
import { Columns, Copy, Check, Trash2, ArrowRightLeft, Info, ListFilter, Download, AlertCircle } from 'lucide-react';

const MAX_LENGTH = 100000;

export function ListComparator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [listA, setListA] = useState(initialData?.listA || '');
  const [listB, setListB] = useState(initialData?.listB || '');
  const [caseSensitive, setCaseSensitive] = useState(initialData?.caseSensitive ?? false);
  const [trimItems, setTrimItems] = useState(initialData?.trimItems ?? true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ listA, listB, caseSensitive, trimItems });
  }, [listA, listB, caseSensitive, trimItems]);

  const processList = (text: string) => {
    let items = text.split('\n').filter(line => line.length > 0);
    if (trimItems) {
      items = items.map(i => i.trim()).filter(i => i.length > 0);
    }
    return items;
  };

  const results = useMemo(() => {
    if (listA.length > MAX_LENGTH || listB.length > MAX_LENGTH) {
      return { common: [], onlyA: [], onlyB: [], union: [] };
    }

    const itemsA = processList(listA);
    const itemsB = processList(listB);

    const setA = new Set(caseSensitive ? itemsA : itemsA.map(i => i.toLowerCase()));
    const setB = new Set(caseSensitive ? itemsB : itemsB.map(i => i.toLowerCase()));

    const common = itemsA.filter(item => {
      const val = caseSensitive ? item : item.toLowerCase();
      return setB.has(val);
    });
    const uniqueCommon = Array.from(new Set(caseSensitive ? common : common.map(c => c.toLowerCase())))
      .map(val => itemsA.find(orig => (caseSensitive ? orig : orig.toLowerCase()) === val) || val);

    const onlyA = itemsA.filter(item => {
      const val = caseSensitive ? item : item.toLowerCase();
      return !setB.has(val);
    });
    const uniqueOnlyA = Array.from(new Set(caseSensitive ? onlyA : onlyA.map(c => c.toLowerCase())))
      .map(val => itemsA.find(orig => (caseSensitive ? orig : orig.toLowerCase()) === val) || val);

    const onlyB = itemsB.filter(item => {
      const val = caseSensitive ? item : item.toLowerCase();
      return !setA.has(val);
    });
    const uniqueOnlyB = Array.from(new Set(caseSensitive ? onlyB : onlyB.map(c => c.toLowerCase())))
      .map(val => itemsB.find(orig => (caseSensitive ? orig : orig.toLowerCase()) === val) || val);

    const union = Array.from(new Set([...itemsA, ...itemsB].map(i => caseSensitive ? i : i.toLowerCase())))
      .map(val => [...itemsA, ...itemsB].find(orig => (caseSensitive ? orig : orig.toLowerCase()) === val) || val);

    return {
      common: uniqueCommon,
      onlyA: uniqueOnlyA,
      onlyB: uniqueOnlyB,
      union
    };
  }, [listA, listB, caseSensitive, trimItems]);

  const handleCopy = (items: string[], id: string) => {
    if (items.length === 0) return;
    navigator.clipboard.writeText(items.join('\n'));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (items: string[], filename: string) => {
    if (items.length === 0) return;
    const blob = new Blob([items.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setListA('');
    setListB('');
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex justify-between items-center px-1">
        <div className="flex gap-4">
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              caseSensitive
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            Respecter la casse
          </button>
          <button
            onClick={() => setTrimItems(!trimItems)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              trimItems
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            Nettoyer les espaces
          </button>
        </div>
        <button
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all"
        >
          <Trash2 className="w-4 h-4" /> Tout effacer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label htmlFor="list-a" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Liste A</label>
          <textarea
            id="list-a"
            value={listA}
            onChange={(e) => {
              setListA(e.target.value);
              if (e.target.value.length > MAX_LENGTH) setError('Entrée trop longue');
              else setError(null);
            }}
            placeholder="Élément 1&#10;Élément 2..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg font-medium dark:text-slate-300 resize-none"
          />
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
            {processList(listA).length} éléments
          </div>
        </div>
        <div className="space-y-4">
          <label htmlFor="list-b" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Liste B</label>
          <textarea
            id="list-b"
            value={listB}
            onChange={(e) => {
              setListB(e.target.value);
              if (e.target.value.length > MAX_LENGTH) setError('Entrée trop longue');
              else setError(null);
            }}
            placeholder="Élément A&#10;Élément B..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg font-medium dark:text-slate-300 resize-none"
          />
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
            {processList(listB).length} éléments
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
        {[
          { id: 'common', name: 'Communs (A ∩ B)', items: results.common, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { id: 'onlyA', name: 'Seulement dans A (A - B)', items: results.onlyA, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { id: 'onlyB', name: 'Seulement dans B (B - A)', items: results.onlyB, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { id: 'union', name: 'Unique Total (A ∪ B)', items: results.union, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
        ].map((res) => (
          <div key={res.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col group">
            <div className={`p-4 ${res.bg} flex justify-between items-center`}>
              <div className="space-y-1">
                <div className={`text-[10px] font-black uppercase tracking-widest ${res.color}`}>{res.name}</div>
                <div className="text-2xl font-black dark:text-white">{res.items.length}</div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleCopy(res.items, res.id)}
                  className={`p-2 rounded-xl transition-all ${copiedId === res.id ? 'bg-white text-emerald-600 shadow-sm' : 'hover:bg-white/50 text-slate-500'}`}
                  title="Copier"
                >
                  {copiedId === res.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDownload(res.items, `liste-${res.id}`)}
                  className="p-2 rounded-xl hover:bg-white/50 text-slate-500 transition-all"
                  title="Télécharger"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-grow h-48 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {res.items.length > 0 ? (
                <div className="space-y-2">
                  {res.items.map((item, i) => (
                    <div key={i} className="text-sm font-medium text-slate-600 dark:text-slate-400 break-all border-b border-slate-50 dark:border-slate-800 pb-1">
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-bold text-slate-300 italic">
                  Aucun résultat
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4 max-w-2xl mx-auto">
         <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm">
            <ArrowRightLeft className="w-6 h-6" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">Opérations sur les ensembles</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Cet outil traite vos listes comme des ensembles mathématiques. Il permet de filtrer rapidement les doublons et de comparer le contenu de deux sources de données différentes de manière visuelle.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Cas d'usage
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Comparer des listes d'emails, de mots-clés SEO, d'IDs de produits ou de lignes de logs pour identifier les différences ou les redondances.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-indigo-500" /> Options de nettoyage
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'option "Nettoyer les espaces" supprime les espaces inutiles en début et fin de chaque ligne. "Respecter la casse" permet de différencier "Texte" et "texte".
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Columns className="w-4 h-4 text-indigo-500" /> Confidentialité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Comme pour tous nos outils, les données restent sur votre appareil. Rien n'est envoyé sur nos serveurs.
          </p>
        </div>
      </div>
    </div>
  );
}
