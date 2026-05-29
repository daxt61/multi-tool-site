import { useState, useEffect, useCallback } from 'react';
import { Monitor, RefreshCcw, Copy, Check, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

interface UAPreset {
  name: string;
  template: () => string;
}

const PRESETS: Record<string, UAPreset> = {
  chrome_windows: {
    name: 'Chrome (Windows)',
    template: () => {
      const ver = getSecureRandomInt(10) + 110;
      return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${ver}.0.0.0 Safari/537.36`;
    }
  },
  chrome_mac: {
    name: 'Chrome (macOS)',
    template: () => {
      const ver = getSecureRandomInt(10) + 110;
      return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${ver}.0.0.0 Safari/537.36`;
    }
  },
  firefox_windows: {
    name: 'Firefox (Windows)',
    template: () => {
      const ver = getSecureRandomInt(10) + 110;
      return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${ver}.0) Gecko/20100101 Firefox/${ver}.0`;
    }
  },
  safari_mac: {
    name: 'Safari (macOS)',
    template: () => {
      return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15`;
    }
  },
  chrome_android: {
    name: 'Chrome (Android)',
    template: () => {
      const ver = getSecureRandomInt(10) + 110;
      return `Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${ver}.0.0.0 Mobile Safari/537.36`;
    }
  },
  safari_iphone: {
    name: 'Safari (iPhone)',
    template: () => {
      return `Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1`;
    }
  },
  edge_windows: {
    name: 'Edge (Windows)',
    template: () => {
      const ver = getSecureRandomInt(10) + 110;
      return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${ver}.0.0.0 Safari/537.36 Edg/${ver}.0.0.0`;
    }
  }
};

export function UAGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [userAgent, setUserAgent] = useState(initialData?.userAgent || '');
  const [selectedPreset, setSelectedPreset] = useState(initialData?.selectedPreset || 'chrome_windows');
  const [copied, setCopied] = useState(false);

  const generate = useCallback((presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      const newUA = preset.template();
      setUserAgent(newUA);
    }
  }, []);

  useEffect(() => {
    if (!userAgent) {
      generate(selectedPreset);
    }
  }, [userAgent, selectedPreset, generate]);

  useEffect(() => {
    onStateChange?.({ userAgent, selectedPreset });
  }, [userAgent, selectedPreset, onStateChange]);

  const handleCopy = () => {
    navigator.clipboard.writeText(userAgent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Monitor className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('uagenerator.presets')}</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedPreset(key);
                  generate(key);
                }}
                className={`p-4 text-left rounded-2xl border transition-all font-bold text-sm ${
                  selectedPreset === key
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('uagenerator.generated_title')}</h3>
            </div>
            <button
              onClick={() => generate(selectedPreset)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
            >
              <RefreshCcw className="w-3 h-3" /> {t('uagenerator.regenerate')}
            </button>
          </div>
          <div className="p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] relative group min-h-[150px] flex items-center">
            <p className="text-lg font-mono font-medium text-slate-700 dark:text-slate-300 break-all leading-relaxed">
              {userAgent}
            </p>
            <button
              onClick={handleCopy}
              className={`absolute top-4 right-4 p-3 rounded-xl transition-all border ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-indigo-600 hover:border-indigo-500'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4 items-start">
            <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-bold text-indigo-900 dark:text-indigo-100">{t('uagenerator.what_is_ua')}</h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                {t('uagenerator.ua_description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
