import { useState } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, ArrowLeftRight, Download } from 'lucide-react';
import yaml from 'js-yaml';

const MAX_LENGTH = 100000;

export function YAMLJSONConverter() {
  const [yamlInput, setYamlInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'yaml' | 'json' | null>(null);

  const convertYamlToJson = (val: string) => {
    try {
      setError('');
      if (!val.trim()) {
        setJsonInput('');
        return;
      }
      // Sentinel: Implement input length limit to mitigate client-side Denial of Service (DoS)
      if (val.length > MAX_LENGTH) {
        setError(`L'entrée est trop longue. Limite de ${MAX_LENGTH.toLocaleString()} caractères.`);
        return;
      }
      const obj = yaml.load(val);
      setJsonInput(JSON.stringify(obj, null, 2));
    } catch (e: any) {
      setError('YAML invalide : ' + e.message);
    }
  };

  const convertJsonToYaml = (val: string) => {
    try {
      setError('');
      if (!val.trim()) {
        setYamlInput('');
        return;
      }
      // Sentinel: Implement input length limit to mitigate client-side Denial of Service (DoS)
      if (val.length > MAX_LENGTH) {
        setError(`L'entrée est trop longue. Limite de ${MAX_LENGTH.toLocaleString()} caractères.`);
        return;
      }
      const obj = JSON.parse(val);
      setYamlInput(yaml.dump(obj));
    } catch (e: any) {
      setError('JSON invalide : ' + e.message);
    }
  };

  const handleYamlChange = (val: string) => {
    setYamlInput(val);
    convertYamlToJson(val);
  };

  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    convertJsonToYaml(val);
  };

  const copyToClipboard = (text: string, type: 'yaml' | 'json') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>

        {/* YAML Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="yaml-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">YAML</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(yamlInput, 'data.yaml')}
                disabled={!yamlInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={() => copyToClipboard(yamlInput, 'yaml')}
                disabled={!yamlInput}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === 'yaml'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied === 'yaml' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'yaml' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => {setYamlInput(''); setJsonInput(''); setError('');}}
                disabled={!yamlInput && !jsonInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            id="yaml-input"
            value={yamlInput}
            onChange={(e) => handleYamlChange(e.target.value)}
            placeholder="key: value\nlist:\n  - item 1"
            className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${yamlInput.length > MAX_LENGTH ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-3xl outline-none focus:ring-2 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>

        {/* JSON Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">JSON</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(jsonInput, 'data.json')}
                disabled={!jsonInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={() => copyToClipboard(jsonInput, 'json')}
                disabled={!jsonInput}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === 'json'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied === 'json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'json' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            value={jsonInput}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='{"key": "value", "list": ["item 1"]}'
            className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${jsonInput.length > MAX_LENGTH ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-3xl outline-none focus:ring-2 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4">À propos de la conversion YAML/JSON</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
          YAML et JSON sont deux formats de sérialisation de données largement utilisés. Le YAML est souvent privilégié pour les fichiers de configuration grâce à sa lisibilité, tandis que le JSON est le standard pour les échanges de données via API.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Comme tous nos outils, la conversion s'effectue localement dans votre navigateur. Aucune donnée n'est transmise à nos serveurs, garantissant ainsi la confidentialité de vos fichiers de configuration.
        </p>
      </div>
    </div>
  );
}
