import { useState, useCallback, useMemo } from 'react';
import { Copy, Check, Trash2, RefreshCw, FileCode, FileSpreadsheet, Download, Settings2, Table } from 'lucide-react';

const FIRST_NAMES = ['Jean', 'Marie', 'Pierre', 'Anne', 'Thomas', 'Julie', 'Nicolas', 'Léa', 'Julien', 'Sarah', 'Benoît', 'Chloé', 'David', 'Emma', 'Éric', 'Inès', 'Hugo', 'Jade', 'Léo', 'Manon'];
const LAST_NAMES = ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard'];
const CITIES = ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille'];
const COUNTRIES = ['France', 'Belgique', 'Suisse', 'Canada', 'Luxembourg', 'Sénégal', 'Côte d\'Ivoire', 'Maroc', 'Algérie', 'Tunisie'];
const COMPANIES = ['TechCorp', 'Innovate', 'GlobalSolutions', 'FutureSystems', 'WebFlow', 'DataDynamics', 'CloudNine', 'SoftServe', 'SmartScale', 'NetWorks'];
const DOMAINS = ['gmail.com', 'yahoo.fr', 'outlook.com', 'orange.fr', 'icloud.com', 'protonmail.com'];

export function MockDataGenerator() {
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  const generateData = useCallback(() => {
    const newData = [];
    for (let i = 0; i < count; i++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      newData.push({
        id: i + 1,
        prenom: firstName,
        nom: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${DOMAINS[Math.floor(Math.random() * DOMAINS.length)]}`,
        telephone: `0${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        entreprise: COMPANIES[Math.floor(Math.random() * COMPANIES.length)],
        ville: CITIES[Math.floor(Math.random() * CITIES.length)],
        pays: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
      });
    }
    setGeneratedData(newData);
    setCopied(false);
  }, [count]);

  const outputText = useMemo(() => {
    if (generatedData.length === 0) return '';
    if (format === 'json') {
      return JSON.stringify(generatedData, null, 2);
    } else {
      const headers = Object.keys(generatedData[0]).join(',');
      const rows = generatedData.map(row =>
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
      );
      return [headers, ...rows].join('\n');
    }
  }, [generatedData, format]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([outputText], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock-data.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" /> Configuration
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Quantité</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Format</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setFormat('json')}
                    className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${format === 'json' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setFormat('csv')}
                    className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${format === 'csv' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={generateData}
            className="w-full h-[60px] bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Générer les données
          </button>
        </div>
      </div>

      {generatedData.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              {format === 'json' ? <FileCode className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
              Aperçu {format.toUpperCase()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Télécharger
              </button>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'}`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={outputText}
            className="w-full h-96 p-8 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2.5rem] font-mono text-sm leading-relaxed resize-none outline-none"
          />

          {/* Table Preview */}
          <div className="pt-8 space-y-4">
             <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Table className="w-4 h-4" /> Aperçu Visuel
             </div>
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            {Object.keys(generatedData[0]).map(key => (
                               <th key={key} className="p-4 text-[10px] font-black uppercase text-slate-400">{key}</th>
                            ))}
                         </tr>
                      </thead>
                      <tbody>
                         {generatedData.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                               {Object.values(row).map((val: any, j) => (
                                  <td key={j} className="p-4 text-sm font-medium dark:text-slate-300 truncate max-w-[150px]">{val}</td>
                               ))}
                            </tr>
                         ))}
                      </tbody>
                   </table>
                   {count > 5 && (
                      <div className="p-4 text-center text-xs font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                         + {count - 5} autres lignes générées...
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
