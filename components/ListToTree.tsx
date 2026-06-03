import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FolderTree, Copy, Check, Trash2, AlertCircle, Info, Download, SortAsc, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 50000;

interface TreeNode {
  name: string;
  children: Map<string, TreeNode>;
}

export function ListToTree({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [separator, setSeparator] = useState(initialData?.separator || '/');
  const [sortAlphabetically, setSortAlphabetically] = useState(initialData?.sortAlphabetically ?? true);
  const [indentChar, setIndentChar] = useState(initialData?.indentChar || '  ');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, separator, sortAlphabetically, indentChar });
  }, [input, separator, sortAlphabetically, indentChar]);

  const treeData = useMemo(() => {
    if (!input.trim()) return null;
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return null;
    }
    setError(null);

    const root: TreeNode = { name: 'root', children: new Map() };
    const lines = input.split('\n').map((l: string) => l.trim()).filter(Boolean);

    lines.forEach((line: string) => {
      let current = root;
      const parts = line.split(separator).filter(Boolean);
      parts.forEach((part: string) => {
        if (!current.children.has(part)) {
          current.children.set(part, { name: part, children: new Map() });
        }
        current = current.children.get(part)!;
      });
    });

    return root;
  }, [input, separator, t]);

  const generateVisualTree = useCallback((node: TreeNode, depth: number = 0, isLast: boolean = true, prefix: string = ''): string => {
    let result = '';
    if (node.name !== 'root') {
      const connector = isLast ? '└── ' : '├── ';
      result += prefix + connector + node.name + '\n';
    }

    const children = Array.from(node.children.values());
    if (sortAlphabetically) {
      children.sort((a, b) => a.name.localeCompare(b.name));
    }

    const newPrefix = node.name === 'root' ? '' : prefix + (isLast ? '    ' : '│   ');

    children.forEach((child, index) => {
      result += generateVisualTree(child, depth + 1, index === children.length - 1, newPrefix);
    });

    return result;
  }, [sortAlphabetically]);

  const output = useMemo(() => {
    if (!treeData) return '';
    return generateVisualTree(treeData).trim();
  }, [treeData, generateVisualTree]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
    inputRef.current?.focus();
  }, []);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement('a'));
    link.href = url;
    link.download = `tree-${Date.now()}.txt`;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [output]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClear, handleCopy]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-500" />
              <label htmlFor="list-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('common.input')}
              </label>
            </div>
            <div className="flex gap-2 items-center">
               <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="list-input"
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"src/components/ui/Button.tsx\nsrc/components/ui/Input.tsx\nsrc/App.tsx"}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <label htmlFor="tree-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('common.result')}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold bg-white/50 dark:bg-black/20 ml-1">C</kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="tree-output"
            value={output}
            readOnly
            placeholder={t('common.waiting')}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center items-center">
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Settings2 className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Separator:</span>
            <input
              type="text"
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="w-8 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
        </div>

        <button
          onClick={() => setSortAlphabetically(!sortAlphabetically)}
          className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border ${
            sortAlphabetically
              ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
              : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          <SortAsc className="w-4 h-4" /> {t('listcleaner.sort_az')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('unit.guide_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listtotree.guide_text', 'Paste a list of paths or indented strings into the input field. The tool will automatically generate a visual directory tree structure.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listtotree.options_text', 'You can customize the path separator (default is "/") and toggle alphabetical sorting to organize your tree as needed.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc', 'All processing is done locally in your browser. Your data never leaves your device.')}
          </p>
        </div>
      </div>
    </div>
  );
}
