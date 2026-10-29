import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Send, FileCode, Copy, Check, Trash2, AlertCircle, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type CasingOption = 'original' | 'camelCase' | 'snake_case' | 'PascalCase';
type OutputStyle = 'jetstream_json' | 'go_nats' | 'node_nats' | 'subjects_list';
type StorageType = 'file' | 'memory';
type RetentionPolicy = 'limits' | 'interest' | 'workqueue';

interface Preset {
  id: string;
  label: string;
  data: string;
}

const GRAPHQL_NATS_PRESETS: Preset[] = [
  {
    id: 'order_events',
    label: 'E-Commerce Order Events',
    data: `type OrderCreated {
  id: ID!
  orderNumber: String!
  customerId: String!
  totalAmount: Float!
  status: String!
  createdAt: String!
}

type OrderUpdated {
  id: ID!
  orderNumber: String!
  status: String!
  updatedAt: String!
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}`
  },
  {
    id: 'user_audit',
    label: 'User Auth Audit Log',
    data: `type UserLoggedIn {
  userId: ID!
  ipAddress: String!
  userAgent: String!
  timestamp: String!
}

type PasswordResetRequested {
  userId: ID!
  email: String!
  requestedAt: String!
}`
  },
  {
    id: 'telemetry',
    label: 'Realtime Analytics Telemetry',
    data: `type MetricRecorded {
  metricName: String!
  value: Float!
  tags: String
  host: String!
  timestamp: String!
}`
  }
];

export function GraphQLToNats({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || GRAPHQL_NATS_PRESETS[0].data);
  const [output, setOutput] = useState<string>(initialData?.output || '');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string | null>('order_events');
  const [casing, setCasing] = useState<CasingOption>('snake_case');
  const [outputStyle, setOutputStyle] = useState<OutputStyle>('jetstream_json');
  const [streamName, setStreamName] = useState<string>('ORDERS_STREAM');
  const [subjectPrefix, setSubjectPrefix] = useState<string>('orders');
  const [storageType, setStorageType] = useState<StorageType>('file');
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicy>('limits');

  const primaryInputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const transformCase = (str: string, style: CasingOption): string => {
    if (style === 'original' || !str) return str;

    const words = str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .trim()
      .split(/\s+/);

    if (words.length === 0 || (words.length === 1 && !words[0])) return str;

    if (style === 'camelCase') {
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('');
    }

    if (style === 'snake_case') {
      return words.map((w) => w.toLowerCase()).join('_');
    }

    if (style === 'PascalCase') {
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
    }

    return str;
  };

  const sanitizeName = (key: string, style: CasingOption): string => {
    let transformed = transformCase(key, style);
    let safeKey = transformed.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(safeKey)) safeKey = '_' + safeKey;
    if (['__proto__', 'constructor', 'prototype'].includes(key) || !safeKey) {
      safeKey = '_' + (safeKey || 'field');
    }
    return safeKey;
  };

  const parseGraphQLSdl = (sdl: string) => {
    const cleaned = sdl.replace(/#.*$/gm, '').replace(/"""[\s\S]*?"""/g, '');

    const typeBlockRegex = /type\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;

    const eventTypes: Array<{
      typeName: string;
      subjectName: string;
      fields: Array<{ name: string; type: string; isNotNull: boolean }>;
    }> = [];

    let typeMatch: RegExpExecArray | null;
    while ((typeMatch = typeBlockRegex.exec(cleaned)) !== null) {
      const rawTypeName = typeMatch[1];
      if (['Query', 'Mutation', 'Subscription'].includes(rawTypeName)) continue;

      const typeName = rawTypeName;
      const formattedSubjectPart = sanitizeName(rawTypeName, casing);
      const subjectName = subjectPrefix
        ? `${subjectPrefix}.${formattedSubjectPart}`
        : formattedSubjectPart;

      const fieldsBody = typeMatch[2];
      const fields: Array<{ name: string; type: string; isNotNull: boolean }> = [];

      const fieldLines = fieldsBody.split('\n');
      for (const rawLine of fieldLines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const fieldMatch = line.match(/^([A-Za-z0-9_]+)(?:\([^)]*\))?\s*:\s*([A-Za-z0-9_!\[\]]+)/);
        if (fieldMatch) {
          const rawFieldName = fieldMatch[1];
          const rawFieldType = fieldMatch[2];

          const colName = sanitizeName(rawFieldName, casing);
          const isNotNull = rawFieldType.endsWith('!');

          fields.push({
            name: colName,
            type: rawFieldType.replace('!', ''),
            isNotNull,
          });
        }
      }

      if (fields.length > 0) {
        eventTypes.push({ typeName, subjectName, fields });
      }
    }

    if (eventTypes.length === 0) {
      throw new Error('No valid GraphQL type definitions found');
    }

    return eventTypes;
  };

  const mapGraphQLToGoType = (gqlType: string): string => {
    const clean = gqlType.replace(/[!\[\]]/g, '').trim();
    if (clean === 'ID' || clean === 'String') return 'string';
    if (clean === 'Int') return 'int64';
    if (clean === 'Float') return 'float64';
    if (clean === 'Boolean') return 'bool';
    return 'string';
  };

  const handleConvert = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      if (input.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      const eventTypes = parseGraphQLSdl(input);
      const subjects = eventTypes.map((e) => e.subjectName);

      if (outputStyle === 'jetstream_json') {
        const config = {
          name: streamName || 'EVENTS_STREAM',
          subjects: subjects.length > 0 ? subjects : [`${subjectPrefix || 'events'}.*`],
          retention: retentionPolicy,
          max_consumers: -1,
          max_msgs: -1,
          max_bytes: -1,
          max_age: 0,
          storage: storageType,
          num_replicas: 1,
          duplicate_window: 120000000000,
        };
        setOutput(JSON.stringify(config, null, 2));
      } else if (outputStyle === 'subjects_list') {
        let text = `# NATS JetStream Subjects for Stream: ${streamName || 'EVENTS_STREAM'}\n\n`;
        eventTypes.forEach((ev) => {
          text += `Subject: ${ev.subjectName}\n`;
          text += `Type:    ${ev.typeName}\n`;
          text += `Payload:\n`;
          ev.fields.forEach((f) => {
            text += `  - ${f.name} (${f.type}${f.isNotNull ? '!' : ''})\n`;
          });
          text += `\n`;
        });
        setOutput(text);
      } else if (outputStyle === 'go_nats') {
        let go = `package main\n\n`;
        go += `import (\n`;
        go += `\t"context"\n`;
        go += `\t"encoding/json"\n`;
        go += `\t"fmt"\n`;
        go += `\t"log"\n`;
        go += `\t"github.com/nats-io/nats.go"\n`;
        go += `\t"github.com/nats-io/nats.go/jetstream"\n`;
        go += `)\n\n`;

        eventTypes.forEach((ev) => {
          const structName = ev.typeName.charAt(0).toUpperCase() + ev.typeName.slice(1);
          go += `type ${structName} struct {\n`;
          ev.fields.forEach((f) => {
            const fieldName = f.name.charAt(0).toUpperCase() + f.name.slice(1);
            go += `\t${fieldName} ${mapGraphQLToGoType(f.type)} \`json:"${f.name}"\`\n`;
          });
          go += `}\n\n`;
        });

        go += `func main() {\n`;
        go += `\tnc, err := nats.Connect(nats.DefaultURL)\n`;
        go += `\tif err != nil { log.Fatal(err) }\n`;
        go += `\tdefer nc.Close()\n\n`;
        go += `\tjs, err := jetstream.New(nc)\n`;
        go += `\tif err != nil { log.Fatal(err) }\n\n`;

        const first = eventTypes[0];
        go += `\t// Publish Example for ${first.typeName}\n`;
        go += `\tevent := ${first.typeName}{\n`;
        first.fields.forEach((f) => {
          const fieldName = f.name.charAt(0).toUpperCase() + f.name.slice(1);
          const goType = mapGraphQLToGoType(f.type);
          const val = goType === 'string' ? `"example"` : goType === 'bool' ? 'true' : '100';
          go += `\t\t${fieldName}: ${val},\n`;
        });
        go += `\t}\n`;
        go += `\tdata, _ := json.Marshal(event)\n`;
        go += `\tack, err := js.Publish(context.Background(), "${first.subjectName}", data)\n`;
        go += `\tif err != nil { log.Fatal(err) }\n`;
        go += `\tfmt.Printf("Published to %s, sequence: %d\\n", "${first.subjectName}", ack.Sequence)\n`;
        go += `}\n`;
        setOutput(go);
      } else if (outputStyle === 'node_nats') {
        let js = `import { connect, JSONCodec } from 'nats';\n\n`;
        js += `async function run() {\n`;
        js += `  const nc = await connect({ servers: 'nats://localhost:4222' });\n`;
        js += `  const jsm = await nc.jetstreamManager();\n`;
        js += `  const jc = JSONCodec();\n\n`;

        js += `  // Create or Update JetStream Stream\n`;
        js += `  await jsm.streams.add({\n`;
        js += `    name: '${streamName || 'EVENTS_STREAM'}',\n`;
        js += `    subjects: [${subjects.map((s) => `'${s}'`).join(', ')}],\n`;
        js += `    storage: '${storageType}',\n`;
        js += `  });\n\n`;

        const jsClient = `  const js = nc.jetstream();\n\n`;
        js += jsClient;

        eventTypes.forEach((ev) => {
          js += `  // Publish ${ev.typeName} Event\n`;
          js += `  await js.publish('${ev.subjectName}', jc.encode({\n`;
          ev.fields.forEach((f) => {
            const val = f.type === 'Int' || f.type === 'Float' ? '123' : f.type === 'Boolean' ? 'true' : `'sample'`;
            js += `    ${f.name}: ${val},\n`;
          });
          js += `  }));\n\n`;
        });

        js += `  console.log('NATS JetStream event publishing completed');\n`;
        js += `  await nc.close();\n`;
        js += `}\n\n`;
        js += `run().catch(console.error);`;
        setOutput(js);
      }

      setError('');
    } catch (e: any) {
      setError('GraphQL Parsing Error: ' + (e.message || e));
    }
  }, [input, casing, outputStyle, streamName, subjectPrefix, storageType, retentionPolicy, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  useEffect(() => {
    onStateChange?.({ input, output, casing, outputStyle, streamName, subjectPrefix, storageType, retentionPolicy });
  }, [input, output, casing, outputStyle, streamName, subjectPrefix, storageType, retentionPolicy, onStateChange]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('graphqltonats.toast_cleared', { defaultValue: 'Inputs cleared!' }));
    primaryInputRef.current?.focus();
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltonats.toast_copied', { defaultValue: 'NATS configuration copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current || !containerRef.current.contains(document.activeElement)) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const selectedText = window.getSelection()?.toString();
        if (!selectedText) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleApplyPreset = (preset: Preset) => {
    setInput(preset.data);
    setActivePresetId(preset.id);
    toast.success(t('graphqltonats.preset_loaded', { name: preset.label, defaultValue: `Loaded preset ${preset.label}!` }));
    primaryInputRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const ext = outputStyle === 'go_nats' ? 'go' : outputStyle === 'node_nats' ? 'js' : outputStyle === 'jetstream_json' ? 'json' : 'txt';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nats-jetstream-${streamName.toLowerCase() || 'config'}-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('graphqltonats.toast_downloaded', { defaultValue: 'Downloaded NATS configuration file!' }));
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Start Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('graphqltonats.presets_title', { defaultValue: 'Quick Start Presets:' })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {GRAPHQL_NATS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              aria-pressed={activePresetId === preset.id}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePresetId === preset.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="graphql-nats-style" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqltonats.output_style', { defaultValue: 'Output Format' })}
          </label>
          <select
            id="graphql-nats-style"
            value={outputStyle}
            onChange={(e) => setOutputStyle(e.target.value as OutputStyle)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="jetstream_json">JetStream Stream Config (JSON)</option>
            <option value="subjects_list">NATS Subjects & Payload List</option>
            <option value="go_nats">Go NATS Publisher / Subscriber</option>
            <option value="node_nats">Node.js nats.js Client</option>
          </select>
        </div>

        <div>
          <label htmlFor="graphql-nats-stream-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqltonats.stream_name', { defaultValue: 'Stream Name' })}
          </label>
          <input
            id="graphql-nats-stream-name"
            type="text"
            value={streamName}
            onChange={(e) => setStreamName(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="ORDERS_STREAM"
          />
        </div>

        <div>
          <label htmlFor="graphql-nats-subject-prefix" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqltonats.subject_prefix', { defaultValue: 'Subject Prefix' })}
          </label>
          <input
            id="graphql-nats-subject-prefix"
            type="text"
            value={subjectPrefix}
            onChange={(e) => setSubjectPrefix(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="orders"
          />
        </div>

        <div>
          <label htmlFor="graphql-nats-casing" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqltonats.field_casing', { defaultValue: 'Subject / Field Casing' })}
          </label>
          <select
            id="graphql-nats-casing"
            value={casing}
            onChange={(e) => setCasing(e.target.value as CasingOption)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Editor & Output Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-500" />
              <label htmlFor="graphql-nats-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltonats.graphql_input_label', { defaultValue: 'GraphQL SDL Input' })}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex text-rose-400 border-rose-200 dark:border-rose-800">
                Esc
              </Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear', { defaultValue: 'Clear' })}
              </button>
            </div>
          </div>
          <textarea
            id="graphql-nats-input"
            ref={primaryInputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={t('graphqltonats.placeholder_graphql', { defaultValue: 'Paste GraphQL SDL event types here...' })}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="nats-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltonats.output_label', { defaultValue: 'Generated NATS JetStream Schema' })}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex text-slate-400 border-slate-200 dark:border-slate-800">
                C
              </Kbd>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download', { defaultValue: 'Download' })}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{' '}
                {copied ? t('common.copied', { defaultValue: 'Copied' }) : t('common.copy', { defaultValue: 'Copy' })}
              </button>
            </div>
          </div>
          <textarea
            id="nats-output"
            value={output}
            readOnly
            placeholder={t('graphqltonats.placeholder_output', { defaultValue: 'Generated NATS stream definition will appear here...' })}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      {/* Educational / Documentation Footer */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
          <Send className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">
            {t('graphqltonats.about_title', { defaultValue: 'About GraphQL SDL to NATS JetStream Converter' })}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltonats.about_text', {
              defaultValue:
                'Convert GraphQL SDL event definitions into NATS JetStream stream configurations, subject topic hierarchies, Go producer/consumer structs, or Node.js nats.js client code.'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
