import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Copy, Check, Trash2, Download, Plus, Trash, Layers, HelpCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface Service {
  name: string;
  image: string;
  ports: string;
  restart: string;
  env: { key: string; value: string }[];
  volumes: string[];
  command: string;
  dependsOn: string[];
}

const DEFAULT_SERVICES: Service[] = [
  {
    name: 'web',
    image: 'nginx:alpine',
    ports: '80:80',
    restart: 'always',
    env: [{ key: 'NODE_ENV', value: 'production' }],
    volumes: ['html:/usr/share/nginx/html'],
    command: '',
    dependsOn: []
  }
];

const PRESETS: Record<string, { name: string; services: Service[] }> = {
  mern: {
    name: 'MERN Stack (MongoDB, Express, React, Node)',
    services: [
      {
        name: 'frontend',
        image: 'node:18-alpine',
        ports: '3000:3000',
        restart: 'always',
        env: [{ key: 'REACT_APP_API_URL', value: 'http://localhost:5000' }],
        volumes: ['./frontend:/app'],
        command: 'npm start',
        dependsOn: ['backend']
      },
      {
        name: 'backend',
        image: 'node:18-alpine',
        ports: '5000:5000',
        restart: 'always',
        env: [
          { key: 'PORT', value: '5000' },
          { key: 'MONGO_URI', value: 'mongodb://db:27017/mern' }
        ],
        volumes: ['./backend:/app'],
        command: 'npm run dev',
        dependsOn: ['db']
      },
      {
        name: 'db',
        image: 'mongo:6.0',
        ports: '27017:27017',
        restart: 'always',
        env: [],
        volumes: ['mongo-data:/data/db'],
        command: '',
        dependsOn: []
      }
    ]
  },
  lamp: {
    name: 'LAMP Stack (Linux, Apache, MySQL, PHP)',
    services: [
      {
        name: 'web',
        image: 'php:8.1-apache',
        ports: '80:80',
        restart: 'always',
        env: [],
        volumes: ['./src:/var/www/html'],
        command: '',
        dependsOn: ['db']
      },
      {
        name: 'db',
        image: 'mysql:8.0',
        ports: '3306:3306',
        restart: 'always',
        env: [
          { key: 'MYSQL_ROOT_PASSWORD', value: 'secret' },
          { key: 'MYSQL_DATABASE', value: 'lamp' }
        ],
        volumes: ['db-data:/var/lib/mysql'],
        command: '',
        dependsOn: []
      }
    ]
  },
  django_postgres: {
    name: 'Django + PostgreSQL',
    services: [
      {
        name: 'web',
        image: 'python:3.10-alpine',
        ports: '8000:8000',
        restart: 'always',
        env: [
          { key: 'DEBUG', value: '1' },
          { key: 'DATABASE_URL', value: 'postgres://postgres:secret@db:5432/django' }
        ],
        volumes: ['.:/code'],
        command: 'python manage.py runserver 0.0.0.0:8000',
        dependsOn: ['db']
      },
      {
        name: 'db',
        image: 'postgres:15-alpine',
        ports: '5432:5432',
        restart: 'always',
        env: [
          { key: 'POSTGRES_DB', value: 'django' },
          { key: 'POSTGRES_USER', value: 'postgres' },
          { key: 'POSTGRES_PASSWORD', value: 'secret' }
        ],
        volumes: ['postgres-data:/var/lib/postgresql/data'],
        command: '',
        dependsOn: []
      }
    ]
  }
};

export function DockerComposeGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [version, setVersion] = useState<string>(initialData?.version || '3.8');
  const [services, setServices] = useState<Service[]>(initialData?.services || DEFAULT_SERVICES);
  const [copied, setCopied] = useState(false);

  // State synchronization
  useEffect(() => {
    onStateChange?.({ version, services });
  }, [version, services, onStateChange]);

  const generateYaml = useCallback(() => {
    let yaml = `version: "${version}"\n\nservices:\n`;

    services.forEach((service) => {
      const sanitizedName = service.name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
      if (!sanitizedName) return;

      yaml += `  ${sanitizedName}:\n`;
      yaml += `    image: ${service.image.trim() || 'ubuntu:latest'}\n`;

      if (service.ports.trim()) {
        yaml += `    ports:\n`;
        yaml += `      - "${service.ports.trim()}"\n`;
      }

      if (service.restart && service.restart !== 'no') {
        yaml += `    restart: ${service.restart}\n`;
      }

      const validEnv = service.env.filter(e => e.key.trim());
      if (validEnv.length > 0) {
        yaml += `    environment:\n`;
        validEnv.forEach((e) => {
          yaml += `      - ${e.key.trim()}=${e.value.trim()}\n`;
        });
      }

      const validVolumes = service.volumes.filter(v => v.trim());
      if (validVolumes.length > 0) {
        yaml += `    volumes:\n`;
        validVolumes.forEach((v) => {
          yaml += `      - ${v.trim()}\n`;
        });
      }

      if (service.command.trim()) {
        yaml += `    command: ${service.command.trim()}\n`;
      }

      const validDepends = service.dependsOn.filter(d => d.trim());
      if (validDepends.length > 0) {
        yaml += `    depends_on:\n`;
        validDepends.forEach((d) => {
          yaml += `      - ${d.trim()}\n`;
        });
      }
    });

    // Extract named volumes
    const namedVolumesSet = new Set<string>();
    services.forEach((service) => {
      service.volumes.forEach((v) => {
        const parts = v.split(':');
        if (parts[0] && !parts[0].startsWith('.') && !parts[0].startsWith('/') && !parts[0].startsWith('~')) {
          namedVolumesSet.add(parts[0].trim());
        }
      });
    });

    if (namedVolumesSet.size > 0) {
      yaml += `\nvolumes:\n`;
      namedVolumesSet.forEach((v) => {
        yaml += `  ${v}:\n`;
      });
    }

    return yaml;
  }, [version, services]);

  const handleCopy = useCallback(() => {
    const yaml = generateYaml();
    navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('common.copied', 'Copied to clipboard!'));
  }, [generateYaml, t]);

  const handleClear = useCallback(() => {
    setServices([
      {
        name: 'web',
        image: 'nginx:alpine',
        ports: '80:80',
        restart: 'always',
        env: [],
        volumes: [],
        command: '',
        dependsOn: []
      }
    ]);
    toast.success(t('docker_compose.cleared', 'Configuration cleared!'));
  }, [t]);

  const handleDownload = () => {
    const yaml = generateYaml();
    const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'docker-compose.yml';
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success', 'File downloaded successfully!'));
  };

  const loadPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setServices(JSON.parse(JSON.stringify(preset.services)));
      toast.success(t('docker_compose.preset_loaded', 'Preset loaded!'));
    }
  };

  // Keyboard shortcut handlers pattern with handlersRef to prevent stale closures
  const handlersRef = useRef({ handleCopy, handleClear, loadPreset });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear, loadPreset };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );

      // C to copy output (only when not typing in editable element)
      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditable) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }

      // Escape to clear/reset
      if (e.key === 'Escape' && !isEditable) {
        e.preventDefault();
        handlersRef.current.handleClear();
      }

      // T to load first preset (MERN)
      if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditable) {
        e.preventDefault();
        handlersRef.current.loadPreset('mern');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const addService = () => {
    if (services.length >= 8) {
      toast.error(t('docker_compose.max_services', 'Maximum 8 services allowed.'));
      return;
    }
    setServices([
      ...services,
      {
        name: `service${services.length + 1}`,
        image: 'ubuntu:latest',
        ports: '',
        restart: 'always',
        env: [],
        volumes: [],
        command: '',
        dependsOn: []
      }
    ]);
  };

  const removeService = (index: number) => {
    if (services.length <= 1) {
      toast.error(t('docker_compose.min_services', 'At least one service is required.'));
      return;
    }
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof Service, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const addEnvVar = (serviceIndex: number) => {
    const updated = [...services];
    if (updated[serviceIndex].env.length >= 10) {
      toast.error(t('docker_compose.max_env', 'Maximum 10 env variables per service.'));
      return;
    }
    updated[serviceIndex].env.push({ key: '', value: '' });
    setServices(updated);
  };

  const removeEnvVar = (serviceIndex: number, envIndex: number) => {
    const updated = [...services];
    updated[serviceIndex].env = updated[serviceIndex].env.filter((_, i) => i !== envIndex);
    setServices(updated);
  };

  const updateEnvVar = (serviceIndex: number, envIndex: number, field: 'key' | 'value', val: string) => {
    const updated = [...services];
    updated[serviceIndex].env[envIndex][field] = val;
    setServices(updated);
  };

  const addVolume = (serviceIndex: number) => {
    const updated = [...services];
    if (updated[serviceIndex].volumes.length >= 5) {
      toast.error(t('docker_compose.max_volumes', 'Maximum 5 volumes per service.'));
      return;
    }
    updated[serviceIndex].volumes.push('');
    setServices(updated);
  };

  const removeVolume = (serviceIndex: number, volIndex: number) => {
    const updated = [...services];
    updated[serviceIndex].volumes = updated[serviceIndex].volumes.filter((_, i) => i !== volIndex);
    setServices(updated);
  };

  const updateVolume = (serviceIndex: number, volIndex: number, val: string) => {
    const updated = [...services];
    updated[serviceIndex].volumes[volIndex] = val;
    setServices(updated);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Presets bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem]">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Templates / Presets</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESETS).map((key) => (
            <button
              key={key}
              onClick={() => loadPreset(key)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-xs font-bold transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              {PRESETS[key].name}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset <Kbd modifier={null}>Esc</Kbd>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Service Designer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-500" /> Services / Containers
            </h2>
            <button
              onClick={addService}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Plus className="w-4 h-4" /> Add Service
            </button>
          </div>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
            {services.map((service, sIndex) => (
              <div
                key={sIndex}
                className="p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 relative group/service"
              >
                {/* Header of service block */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black">
                      {sIndex + 1}
                    </span>
                    <input
                      type="text"
                      aria-label="Service name"
                      value={service.name}
                      onChange={(e) => updateService(sIndex, 'name', e.target.value)}
                      placeholder="e.g. web"
                      className="bg-transparent border-none text-base font-black outline-none focus:ring-2 focus:ring-indigo-500/20 rounded px-1 max-w-[150px] dark:text-white"
                    />
                  </div>
                  <button
                    onClick={() => removeService(sIndex)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                    title="Remove Service"
                    aria-label="Remove Service"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>

                {/* Standard Config */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Docker Image</label>
                    <input
                      type="text"
                      value={service.image}
                      onChange={(e) => updateService(sIndex, 'image', e.target.value)}
                      placeholder="e.g. nginx:alpine"
                      className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Ports Mapping</label>
                    <input
                      type="text"
                      value={service.ports}
                      onChange={(e) => updateService(sIndex, 'ports', e.target.value)}
                      placeholder="e.g. 80:80"
                      className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                {/* Env Variables Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Environment Variables</span>
                    <button
                      onClick={() => addEnvVar(sIndex)}
                      className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add Env
                    </button>
                  </div>
                  {service.env.map((env, eIndex) => (
                    <div key={eIndex} className="flex gap-2 items-center">
                      <input
                        type="text"
                        aria-label="Env key"
                        value={env.key}
                        onChange={(e) => updateEnvVar(sIndex, eIndex, 'key', e.target.value)}
                        placeholder="KEY"
                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                      />
                      <span className="text-slate-400 font-mono text-xs">=</span>
                      <input
                        type="text"
                        aria-label="Env value"
                        value={env.value}
                        onChange={(e) => updateEnvVar(sIndex, eIndex, 'value', e.target.value)}
                        placeholder="VALUE"
                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                      />
                      <button
                        onClick={() => removeEnvVar(sIndex, eIndex)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        aria-label="Delete environment variable"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Volumes Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Volumes / Bind Mounts</span>
                    <button
                      onClick={() => addVolume(sIndex)}
                      className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add Volume
                    </button>
                  </div>
                  {service.volumes.map((vol, vIndex) => (
                    <div key={vIndex} className="flex gap-2 items-center">
                      <input
                        type="text"
                        aria-label="Volume mapping"
                        value={vol}
                        onChange={(e) => updateVolume(sIndex, vIndex, e.target.value)}
                        placeholder="e.g. ./html:/usr/share/nginx/html"
                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                      />
                      <button
                        onClick={() => removeVolume(sIndex, vIndex)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        aria-label="Delete volume mapping"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Additional / Advanced Config Collapsible */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Restart Policy</label>
                    <select
                      value={service.restart}
                      onChange={(e) => updateService(sIndex, 'restart', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                    >
                      <option value="no">no</option>
                      <option value="always">always</option>
                      <option value="unless-stopped">unless-stopped</option>
                      <option value="on-failure">on-failure</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Startup Command</label>
                    <input
                      type="text"
                      value={service.command}
                      onChange={(e) => updateService(sIndex, 'command', e.target.value)}
                      placeholder="e.g. npm start"
                      className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Generated Output & Options */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">docker-compose.yml</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="text-slate-400 hover:text-indigo-500 p-2 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg flex items-center gap-1.5"
                title="Copy configuration"
                aria-label="Copy configuration"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <Kbd modifier={null} className="select-none text-[10px]">C</Kbd>
              </button>
              <button
                onClick={handleDownload}
                className="text-slate-400 hover:text-emerald-500 p-2 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
                title="Download docker-compose.yml"
                aria-label="Download docker-compose.yml"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative group/output">
            <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none group-hover/output:bg-indigo-500/10 transition-all"></div>
            <pre className="relative p-6 bg-slate-900 text-slate-100 border border-slate-800 rounded-[2.5rem] font-mono text-xs leading-relaxed overflow-x-auto min-h-[450px] shadow-lg select-text">
              <code>{generateYaml()}</code>
            </pre>
          </div>

          {/* Docker-compose info */}
          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 space-y-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-indigo-500" />
              <h4 className="font-bold dark:text-white">Docker Compose Guide</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Create a file named <code>docker-compose.yml</code>, paste this content inside, and run:
            </p>
            <pre className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl text-[10px] font-mono font-bold dark:text-indigo-400 select-all">
              docker compose up -d
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
