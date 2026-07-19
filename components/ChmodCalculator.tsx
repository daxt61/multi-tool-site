import { useState, useEffect, useMemo, useRef } from 'react';
import { Shield, Copy, Check, Trash2, Info, Terminal, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

type PermissionType = 'read' | 'write' | 'execute';
type RoleType = 'owner' | 'group' | 'public';

interface PermissionState {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export function ChmodCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  const [permissions, setPermissions] = useState<Record<RoleType, PermissionState>>(initialData?.permissions || {
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    public: { read: true, write: false, execute: true },
  });

  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ permissions });
  }, [permissions, onStateChange]);

  const { octal, symbolic } = useMemo(() => {
    const calculateRoleValue = (role: PermissionState) => {
      let val = 0;
      if (role.read) val += 4;
      if (role.write) val += 2;
      if (role.execute) val += 1;
      return val;
    };

    const getSymbolicRole = (role: PermissionState) => {
      return (
        (role.read ? 'r' : '-') +
        (role.write ? 'w' : '-') +
        (role.execute ? 'x' : '-')
      );
    };

    const ownerVal = calculateRoleValue(permissions.owner);
    const groupVal = calculateRoleValue(permissions.group);
    const publicVal = calculateRoleValue(permissions.public);

    return {
      octal: `${ownerVal}${groupVal}${publicVal}`,
      symbolic: `-${getSymbolicRole(permissions.owner)}${getSymbolicRole(permissions.group)}${getSymbolicRole(permissions.public)}`,
    };
  }, [permissions]);

  const togglePermission = (role: RoleType, type: PermissionType) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [type]: !prev[role][type],
      },
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setPermissions({
      owner: { read: false, write: false, execute: false },
      group: { read: false, write: false, execute: false },
      public: { read: false, write: false, execute: false },
    });
    firstButtonRef.current?.focus();
  };

  // Keyboard shortcut listener for Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );
      if (isEditable) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const roles: RoleType[] = ['owner', 'group', 'public'];
  const permissionTypes: PermissionType[] = ['read', 'write', 'execute'];

  const PERM_VALS: Record<PermissionType, number> = {
    read: 4,
    write: 2,
    execute: 1,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex justify-end px-1 gap-2 items-center">
        <Kbd modifier={null} className="text-slate-400">Esc</Kbd>
        <button
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3.5 h-3.5" /> {t('chmod.clear_all')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Shield className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t(`chmod.${role}`)}</h3>
            </div>
            <div className="space-y-3">
              {permissionTypes.map((type) => {
                const isFirst = role === 'owner' && type === 'read';
                return (
                  <button
                    key={type}
                    ref={isFirst ? firstButtonRef : undefined}
                    onClick={() => togglePermission(role, type)}
                    aria-pressed={permissions[role][type]}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      permissions[role][type]
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        permissions[role][type] ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {permissions[role][type] && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-bold text-sm">{t(`chmod.${type}`)}</span>
                    </div>
                    <span className="text-xs font-mono font-bold opacity-50">{PERM_VALS[type]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <button
            onClick={() => handleCopy(octal, 'octal')}
            className={`absolute top-6 right-6 p-2.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
              copied === 'octal'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-white/10 text-white/40 border-transparent hover:text-white hover:bg-white/20'
            }`}
            aria-label={t('common.copy') + ' - ' + t('chmod.octal_code')}
          >
            {copied === 'octal' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">{t('chmod.octal_code')}</div>
          <div className="text-6xl md:text-7xl font-black text-white font-mono tracking-tighter">
            {octal}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 relative group overflow-hidden">
          <button
            onClick={() => handleCopy(symbolic, 'symbolic')}
            className={`absolute top-6 right-6 p-2.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              copied === 'symbolic'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 shadow-sm border-slate-100 dark:border-slate-700'
            }`}
            aria-label={t('common.copy') + ' - ' + t('chmod.symbolic')}
          >
            {copied === 'symbolic' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">{t('chmod.symbolic')}</div>
          <div className="text-4xl md:text-5xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
            {symbolic}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-500" />
            <h4 className="font-bold dark:text-white">{t('chmod.cli_usage')}</h4>
          </div>
          <div className="bg-slate-950 p-6 rounded-2xl font-mono text-sm space-y-2">
            <div className="text-slate-500"># Changer les permissions / Change permissions</div>
            <div className="text-white">
              <span className="text-indigo-400">chmod</span> {octal} fichier.txt
            </div>
            <div className="pt-4 text-slate-500"># Récursif (dossiers) / Recursive (directories)</div>
            <div className="text-white">
              <span className="text-indigo-400">chmod</span> -R {octal} dossier/
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
          <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold dark:text-white">{t('chmod.how_it_works')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('chmod.how_desc1')} <br />
              <span className="font-bold text-indigo-600">4</span> ({t('chmod.read')}) + <span className="font-bold text-indigo-600">2</span> ({t('chmod.write')}) + <span className="font-bold text-indigo-600">1</span> ({t('chmod.execute')}).
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('chmod.how_desc2')}
            </p>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('chmod.common_codes')}</h3>
          <ul className="space-y-2">
            {[
              { code: '777', key: 'chmod.common.777' },
              { code: '755', key: 'chmod.common.755' },
              { code: '644', key: 'chmod.common.644' },
              { code: '600', key: 'chmod.common.600' },
            ].map(item => (
              <li key={item.code} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-500">{item.code}</code> {t(item.key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('chmod.security')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('chmod.security_desc')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Terminal className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('chmod.symbolic_vs_octal')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('chmod.sym_vs_oct_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
