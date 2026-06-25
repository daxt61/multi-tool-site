import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, ArrowLeftRight, Download, FileCode, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as toml from 'smol-toml';

export function TOMLJSONConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const tomlRef = useRef<HTMLTextAreaElement>(null);
  const jsonRef = useRef<HTMLTextAreaElement>(null);

  const [tomlInput, setTomlInput] = useState(initialData?.toml || 'title = "TOML Example"\n\n[database]\nserver = "192.168.1.1"\nports = [ 8001, 8002, 8003 ]\nconnection_max = 5000\nenabled = true');
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedToml, setCopiedToml] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const convertTomlToJson = useCallback((input: string) => {
    try {
      if (!input.trim()) {
        setJsonInput('');
        setError(null);
        return;
      }
      const parsed = toml.parse(input);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e: any) {
      setError(`TOML Error: ${e.message}`);
    }
  }, []);

  const convertJsonToToml = useCallback((input: string) => {
    try {
      if (!input.trim()) {
        setTomlInput('');
        setError(null);
        return;
      }
      const parsed = JSON.parse(input);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error('TOML root must be an object/table');
      }
      setTomlInput(toml.stringify(parsed));
      setError(null);
    } catch (e: any) {
      setError(`JSON Error: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    convertTomlToJson(tomlInput);
  }, []);

  useEffect(() => {
    onStateChange?.({ toml: tomlInput });
  }, [tomlInput]);

  const handleTomlChange = (val: string) => {
    setTomlInput(val);
    convertTomlToJson(val);
  };

  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    convertJsonToToml(val);
  };

  const handleCopyToml = () => {
    navigator.clipboard.writeText(tomlInput);
    setCopiedToml(true);
    setTimeout(() => setCopiedToml(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonInput);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleClear = () => {
    setTomlInput('');
    setJsonInput('');
    setError(null);
    tomlRef.current?.focus();
  };

  const handleDownload = (content: string, type: 'toml' | 'json') => {
    const blob = new Blob([content], { type: type === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data.${type}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TOML Side */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-3 h-3" /> TOML
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(tomlInput, 'toml')}
                disabled={!tomlInput}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopyToml}
                disabled={!tomlInput}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1 border ${
                  copiedToml
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copiedToml ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedToml ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            ref={tomlRef}
            value={tomlInput}
            onChange={(e) => handleTomlChange(e.target.value)}
            placeholder="title = 'Example'..."
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* JSON Side */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-3 h-3" /> JSON
            </label>
            <div className="flex gap-2">
               <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
              <button
                onClick={() => handleDownload(jsonInput, 'json')}
                disabled={!jsonInput}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopyJson}
                disabled={!jsonInput}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1 border ${
                  copiedJson
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copiedJson ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedJson ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            ref={jsonRef}
            value={jsonInput}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='{ "title": "Example" }...'
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-bold animate-pulse">
            <ArrowLeftRight className="w-3 h-3" />
            Bidirectional Sync Enabled
          </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <Info className="w-4 h-4" /> {t('tomljson.what_is_toml', 'What is TOML?')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('tomljson.toml_desc', 'TOML (Tom\'s Obvious, Minimal Language) is a configuration file format that\'s easy to read due to obvious semantics. It is designed to map unambiguously to a hash table. It is widely used in modern development environments, particularly in the Rust ecosystem (Cargo.toml) and for various static site generators.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <ArrowLeftRight className="w-4 h-4" /> {t('tomljson.how_it_works', 'How it works?')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('tomljson.how_text', 'This tool allows you to convert between TOML and JSON formats instantly. As you type in one field, the other is updated automatically. Note that the root of a TOML document must be a table (key-value pairs), so JSON input must be an object.')}
          </p>
        </div>
      </div>
    </div>
  );
}
