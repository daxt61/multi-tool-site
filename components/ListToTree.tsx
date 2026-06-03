import { useState, useMemo, useEffect } from 'react';
import { Network, Copy, Check, Trash2, Settings2, Download, FolderTree, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TreeNode {
  name: string;
  children: Record<string, TreeNode>;
}

type BranchStyle = 'unicode' | 'ascii' | 'bold' | 'minimal';

const STYLES: Record<BranchStyle, { vertical: string; branch: string; last: string; space: string }> = {
  unicode: { vertical: '│  ', branch: '├── ', last: '└── ', space: '   ' },
  ascii:   { vertical: '|  ', branch: '|-- ', last: '`-- ', space: '   ' },
  bold:    { vertical: '┃  ', branch: '┣━━ ', last: '┗━━ ', space: '   ' },
  minimal: { vertical: '  ', branch: '- ', last: '- ', space: '  ' }
};

export function ListToTree({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setList] = useState(initialData?.input || 'src/components/ui/button.tsx\nsrc/components/ui/card.tsx\nsrc/App.tsx\npackage.json\nREADME.md');
  const [rootName, setRootName] = useState(initialData?.rootName || 'project');
  const [style, setStyle] = useState<BranchStyle>(initialData?.style || 'unicode');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, rootName, style });
  }, [input, rootName, style, onStateChange]);

  const treeString = useMemo(() => {
    const lines = input.split('\n').filter((l: string) => l.trim());
    if (lines.length === 0) return '';

    const root: TreeNode = { name: rootName, children: {} };

    lines.forEach((line: string) => {
      const parts = line.split(/[\\/]/).filter(Boolean);
      let current = root;
      parts.forEach((part: string) => {
        if (!current.children[part]) {
          current.children[part] = { name: part, children: {} };
        }
        current = current.children[part];
      });
    });

    const chars = STYLES[style];
    let result = rootName + '\n';

    const render = (node: TreeNode, prefix = '') => {
      const keys = Object.keys(node.children).sort();
      keys.forEach((key, index) => {
        const isLast = index === keys.length - 1;
        const child = node.children[key];
        result += prefix + (isLast ? chars.last : chars.branch) + child.name + '\n';
        render(child, prefix + (isLast ? chars.space : chars.vertical));
      });
    };

    render(root);
    return result;
  }, [input, rootName, style]);

  const handleCopy = () => {
    if (!treeString) return;
    navigator.clipboard.writeText(treeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!treeString) return;
    const blob = new Blob([treeString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tree-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="list-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('listtotree.input_label', 'Liste de chemins')}
                </label>
                <button
                  onClick={() => setList('')}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <textarea
                id="list-input"
                value={input}
                onChange={(e) => setList(e.target.value)}
                placeholder="folder/file.txt..."
                className="w-full h-64 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm resize-none"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 px-1">
                <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Options</h4>
              </div>

              <div className="space-y-2">
                <label htmlFor="root-name" className="text-[10px] font-bold text-slate-500 px-1">Nom de la racine</label>
                <input
                  id="root-name"
                  type="text"
                  value={rootName}
                  onChange={(e) => setRootName(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 px-1">Style de branches</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STYLES) as BranchStyle[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`py-2 px-3 rounded-lg text-[10px] font-bold transition-all border ${
                        style === s
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('listtotree.output_label', 'Structure en Arbre')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!treeString}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download', 'Télécharger')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!treeString}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied', 'Copié') : t('common.copy', 'Copier')}
              </button>
            </div>
          </div>
          <div className="relative">
            <pre className="w-full min-h-[500px] p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-auto font-mono text-sm leading-relaxed text-indigo-300">
              {treeString || t('common.waiting', 'En attente de données...')}
            </pre>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-indigo-500" /> {t('listtotree.about_title', 'À propos de List to Tree')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listtotree.about_text', 'Convertissez instantanément une liste plate de chemins de fichiers ou de dossiers en une structure arborescente visuelle. Utile pour la documentation technique, les fichiers README ou la visualisation d\'architecture de projet.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('listtotree.guide_title', 'Conseils d\'utilisation')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listtotree.guide_text', 'Vous pouvez utiliser des barres obliques (/) ou des barres obliques inverses (\\) comme séparateurs. L\'outil trie automatiquement les dossiers et fichiers par ordre alphabétique pour un rendu propre.')}
          </p>
        </div>
      </div>
    </div>
  );
}
