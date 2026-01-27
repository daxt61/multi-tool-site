import { useState } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, ArrowLeftRight } from 'lucide-react';
import yaml from 'js-yaml';

export function YAMLJSONConverter() {
  const [yamlInput, setYamlInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'yaml' | 'json' | null>(null);

  const convertYamlToJson = (val: string) => {
    try {
      if (!val.trim()) {
        setJsonInput('');
        return;
      }
      const obj = yaml.load(val);
      setJsonInput(JSON.stringify(obj, null, 2));
      setError('');
    } catch (e: any) {
      setError('YAML invalide : ' + e.message);
    }
  };

  const convertJsonToYaml = (val: string) => {
    try {
      if (!val.trim()) {
        setYamlInput('');
        return;
      }
      const obj = JSON.parse(val);
      setYamlInput(yaml.dump(obj));
      setError('');
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
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">YAML</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(yamlInput, 'yaml')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'yaml' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied === 'yaml' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'yaml' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => {setYamlInput(''); setJsonInput(''); setError('');}}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            value={yamlInput}
            onChange={(e) => handleYamlChange(e.target.value)}
            placeholder="key: value\nlist:\n  - item 1"
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* JSON Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">JSON</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(jsonInput, 'json')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'json' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied === 'json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'json' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='{"key": "value", "list": ["item 1"]}'
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
