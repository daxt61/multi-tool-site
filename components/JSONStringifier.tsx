import { useState, useEffect } from 'react';
import { FileCode, Copy, Check, Trash2, ArrowLeftRight, Download, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function JSONStringifier({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [json, setJson] = useState(initialData?.json || '');
  const [stringified, setStringified] = useState(initialData?.stringified || '');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ json, stringified });
  }, [json, stringified, onStateChange]);

  const handleStringify = () => {
    try {
      if (!json.trim()) return;
      const parsed = JSON.parse(json);
      setStringified(JSON.stringify(JSON.stringify(parsed)));
    } catch (e) {
      // If it's not valid JSON, just stringify the raw text
      setStringified(JSON.stringify(json));
    }
  };

  const handleParse = () => {
    try {
      if (!stringified.trim()) return;
      const unquoted = JSON.parse(stringified);
      try {
        const parsed = JSON.parse(unquoted);
        setJson(JSON.stringify(parsed, null, 2));
      } catch (e) {
        setJson(unquoted);
      }
    } catch (e) {
       // Ignore
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" /> {t('jsonformatter.input_label')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setJson('')}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
              >
                {t('common.clear')}
              </button>
              <button
                onClick={() => handleCopy(json, 'json')}
                className={`p-1.5 rounded-lg transition-all ${copied === 'json' ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 hover:text-indigo-500 bg-slate-50'}`}
              >
                {copied === 'json' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='{"key": "value"}'
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="string-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" /> {t('jsonstringifier.stringified')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setStringified('')}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
              >
                {t('common.clear')}
              </button>
              <button
                onClick={() => handleCopy(stringified, 'str')}
                className={`p-1.5 rounded-lg transition-all ${copied === 'str' ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 hover:text-indigo-500 bg-slate-50'}`}
              >
                {copied === 'str' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <textarea
            id="string-output"
            value={stringified}
            onChange={(e) => setStringified(e.target.value)}
            placeholder='"{\"key\": \"value\"}"'
            className="w-full h-80 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={handleStringify}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
        >
          {t('jsonstringifier.stringify_btn')} <ArrowLeftRight className="w-5 h-5" />
        </button>
        <button
          onClick={handleParse}
          className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <ArrowLeftRight className="w-5 h-5 rotate-180" /> {t('jsonstringifier.parse_btn')}
        </button>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsonstringifier.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsonstringifier.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
