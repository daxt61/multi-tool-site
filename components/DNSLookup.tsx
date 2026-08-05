import { useState, useEffect, useCallback, useRef } from 'react';
import { Globe, Copy, Check, Trash2, Search, AlertCircle, Info, Activity, Database, Server, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_DOMAIN_LENGTH = 253;

interface DNSRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DNSResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: Array<{ name: string; type: number }>;
  Answer?: Array<DNSRecord>;
  Authority?: Array<DNSRecord>;
  Additional?: Array<DNSRecord>;
  Comment?: string;
}

const RECORD_TYPES = [
  { value: 'A', label: 'A (IPv4)', desc: 'Maps a hostname to an IPv4 address' },
  { value: 'AAAA', label: 'AAAA (IPv6)', desc: 'Maps a hostname to an IPv6 address' },
  { value: 'CNAME', label: 'CNAME', desc: 'Alias of one name to another' },
  { value: 'MX', label: 'MX', desc: 'Mail exchange servers' },
  { value: 'TXT', label: 'TXT', desc: 'Arbitrary text records (SPF, verification)' },
  { value: 'NS', label: 'NS', desc: 'Authoritative name servers' },
  { value: 'CAA', label: 'CAA', desc: 'Certificate Authority Authorization' },
];

const PROVIDERS = [
  { value: 'cloudflare', label: 'Cloudflare', url: 'https://cloudflare-dns.com/dns-query' },
  { value: 'google', label: 'Google Public DNS', url: 'https://dns.google/resolve' },
];

export function DNSLookup({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [domain, setDomain] = useState(initialData?.domain || '');
  const [recordType, setRecordType] = useState(initialData?.recordType || 'A');
  const [provider, setProvider] = useState(initialData?.provider || 'cloudflare');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DNSResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync state to parent for sharing URL configurations
  useEffect(() => {
    onStateChange?.({ domain, recordType, provider });
  }, [domain, recordType, provider, onStateChange]);

  const cleanDomainInput = (input: string): string => {
    let cleaned = input.trim();
    // Remove protocol schemes if added
    cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/i, '');
    // Remove port numbers or path segments
    cleaned = cleaned.split('/')[0].split(':')[0];
    return cleaned;
  };

  const validateDomain = (host: string): boolean => {
    if (!host) return false;
    if (host.length > MAX_DOMAIN_LENGTH) return false;

    // Strict domain validation regex
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    // Also allow 'localhost' or simple valid formats
    return domainRegex.test(host) || host.toLowerCase() === 'localhost';
  };

  const handleQuery = useCallback(async () => {
    const targetDomain = cleanDomainInput(domain);
    if (!targetDomain) {
      setError(null);
      setResults(null);
      return;
    }

    if (!validateDomain(targetDomain)) {
      setError(t('dns_lookup.error_invalid_domain', { defaultValue: 'Please enter a valid domain name (e.g., google.com)' }));
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const activeProvider = PROVIDERS.find(p => p.value === provider) || PROVIDERS[0];
    const url = new URL(activeProvider.url);
    url.searchParams.set('name', targetDomain);
    url.searchParams.set('type', recordType);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'accept': 'application/dns-json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DNSResponse = await response.json();
      setResults(data);
      if (data.Answer && data.Answer.length > 0) {
        toast.success(t('dns_lookup.query_success', { defaultValue: 'DNS query successful!' }));
      } else {
        toast.info(t('dns_lookup.query_no_records', { defaultValue: 'Query completed, but no records were returned.' }));
      }
    } catch (err) {
      console.error(err);
      setError(t('dns_lookup.error_failed_fetch', { defaultValue: 'Failed to fetch DNS records. Please verify your connection or try another provider.' }));
    } finally {
      setLoading(false);
    }
  }, [domain, recordType, provider, t]);

  // Execute query if initial data is present on mount
  useEffect(() => {
    if (initialData?.domain) {
      handleQuery();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = useCallback(() => {
    if (!results) return;
    const formattedJson = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    toast.success(t('common.copied', { defaultValue: 'Copied!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [results, t]);

  const handleClear = useCallback(() => {
    setDomain('');
    setResults(null);
    setError(null);
    const inputEl = document.getElementById('domain-input');
    if (inputEl) {
      (inputEl as HTMLInputElement).focus();
    }
    toast.info(t('dns_lookup.cleared', { defaultValue: 'Input and results cleared' }));
  }, [t]);

  const handlersRef = useRef({
    handleCopy,
    handleClear
  });

  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

  // Register global shortcuts: Escape to clear/focus, C to copy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getRecordTypeName = (typeId: number): string => {
    const typeMapping: Record<number, string> = {
      1: 'A',
      2: 'NS',
      5: 'CNAME',
      6: 'SOA',
      12: 'PTR',
      15: 'MX',
      16: 'TXT',
      28: 'AAAA',
      257: 'CAA',
    };
    return typeMapping[typeId] || `TYPE-${typeId}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Control Box */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Domain Input */}
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="domain-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" /> {t('dns_lookup.domain_label', { defaultValue: 'Domain Name' })}
            </label>
            <div className="relative flex items-center">
              <input
                id="domain-input"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuery();
                  }
                }}
                placeholder="example.com"
                className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed"
              />
              <div className="absolute right-3 flex items-center gap-1.5">
                <Kbd modifier={null} className="hidden sm:inline-flex border-slate-200 dark:border-slate-800 text-slate-400">Esc</Kbd>
                {domain && (
                  <button
                    onClick={handleClear}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                    aria-label={t('common.clear')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Record Type Dropdown */}
          <div className="space-y-2">
            <label htmlFor="record-type" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" /> {t('dns_lookup.record_type_label', { defaultValue: 'Record Type' })}
            </label>
            <select
              id="record-type"
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-sm"
            >
              {RECORD_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
          {/* DoH Provider */}
          <div className="space-y-2 col-span-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-500" /> {t('dns_lookup.provider_label', { defaultValue: 'DNS Server (DoH Provider)' })}
            </span>
            <div className="flex gap-4">
              {PROVIDERS.map((prov) => (
                <button
                  key={prov.value}
                  onClick={() => setProvider(prov.value)}
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    provider === prov.value
                      ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {prov.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-6">
            <button
              onClick={handleQuery}
              disabled={loading || !domain.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold rounded-2xl transition-all shadow-md shadow-indigo-600/10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('dns_lookup.loading', { defaultValue: 'Resolving...' })}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  {t('dns_lookup.query_btn', { defaultValue: 'Resolve DNS' })}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {results && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> {t('dns_lookup.results_title', { defaultValue: 'DNS Records' })}
            </h3>
            <button
              onClick={handleCopy}
              className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 shadow-sm'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t('common.copied') : t('dns_lookup.copy_json', { defaultValue: 'Copy Response' })}
              {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 border-indigo-200 dark:border-indigo-800 text-indigo-400 dark:bg-slate-900 ml-1">C</Kbd>}
            </button>
          </div>

          {/* Records Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 font-bold text-slate-400 dark:text-slate-500">{t('dns_lookup.table_type', { defaultValue: 'Type' })}</th>
                    <th className="p-4 font-bold text-slate-400 dark:text-slate-500">{t('dns_lookup.table_name', { defaultValue: 'Name' })}</th>
                    <th className="p-4 font-bold text-slate-400 dark:text-slate-500">{t('dns_lookup.table_ttl', { defaultValue: 'TTL' })}</th>
                    <th className="p-4 font-bold text-slate-400 dark:text-slate-500">{t('dns_lookup.table_data', { defaultValue: 'Data / Value' })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {results.Answer && results.Answer.length > 0 ? (
                    results.Answer.map((record, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-500">
                          {getRecordTypeName(record.type)}
                        </td>
                        <td className="p-4 font-mono text-slate-600 dark:text-slate-400 break-all">{record.name}</td>
                        <td className="p-4 font-mono text-slate-500 tabular-nums">{record.TTL}s</td>
                        <td className="p-4 font-mono text-slate-800 dark:text-slate-300 break-all">
                          <div className="flex items-center justify-between gap-3 group">
                            <span>{record.data}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(record.data);
                                toast.success(t('common.copied', { defaultValue: 'Copied!' }));
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all text-slate-400"
                              title={t('common.copy')}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">
                        {t('dns_lookup.no_records_found', { defaultValue: 'No answers returned for this query.' })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Raw JSON Accordion / View */}
          <div className="p-6 bg-slate-900 text-indigo-300 rounded-3xl space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 block">
              {t('dns_lookup.raw_json', { defaultValue: 'Raw DoH JSON Response' })}
            </span>
            <pre className="max-h-[300px] overflow-auto font-mono text-xs leading-relaxed text-indigo-300 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Info Block */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('dns_lookup.about_title', { defaultValue: 'About DNS Lookup' })}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('dns_lookup.about_text', { defaultValue: 'This tool performs real-time DNS queries securely in your browser using DNS-over-HTTPS (DoH) protocols. You can query A, AAAA, TXT, MX, NS, CNAME, and CAA records directly using Google Public DNS or Cloudflare servers without leaking local network configurations.' })}
          </p>
        </div>
      </div>
    </div>
  );
}
