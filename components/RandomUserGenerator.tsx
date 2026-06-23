import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { User, Download, Copy, Check, RefreshCw, Trash2, FileCode, FileSpreadsheet, Info, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

const MAX_USERS = 500;

const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];
const COUNTRIES = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Australia', 'Japan', 'Brazil', 'India', 'Spain'];
const JOBS = ['Software Engineer', 'Data Scientist', 'Designer', 'Project Manager', 'Marketing Specialist', 'Sales Representative', 'Accountant', 'HR Manager', 'Teacher', 'Doctor'];
const DOMAINS = ['example.com', 'test.org', 'mail.net', 'company.com', 'service.io'];

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  country: string;
  job: string;
}

export function RandomUserGenerator() {
  const { t } = useTranslation();
  const [count, setCount] = useState(10);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [copied, setCopied] = useState<'json' | 'csv' | null>(null);

  const handleClear = useCallback(() => {
    setUsers([]);
    setCopied(null);
  }, []);

  const handleClearRef = useRef(handleClear);
  useEffect(() => {
    handleClearRef.current = handleClear;
  }, [handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClearRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const generateUsers = useCallback(() => {
    const newUsers: UserProfile[] = [];
    const limit = Math.min(count, MAX_USERS);

    for (let i = 0; i < limit; i++) {
      const firstName = FIRST_NAMES[getSecureRandomInt(FIRST_NAMES.length)];
      const lastName = LAST_NAMES[getSecureRandomInt(LAST_NAMES.length)];
      const domain = DOMAINS[getSecureRandomInt(DOMAINS.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;

      newUsers.push({
        id: crypto.randomUUID(),
        firstName,
        lastName,
        email,
        age: 18 + getSecureRandomInt(62),
        country: COUNTRIES[getSecureRandomInt(COUNTRIES.length)],
        job: JOBS[getSecureRandomInt(JOBS.length)]
      });
    }
    setUsers(newUsers);
  }, [count]);

  const handleCopy = (format: 'json' | 'csv') => {
    let content = '';
    if (format === 'json') {
      content = JSON.stringify(users, null, 2);
    } else {
      const headers = ['id', 'firstName', 'lastName', 'email', 'age', 'country', 'job'];
      const rows = users.map(u => headers.map(h => (u as any)[h]).join(','));
      content = [headers.join(','), ...rows].join('\n');
    }

    navigator.clipboard.writeText(content);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (format: 'json' | 'csv') => {
    let content = '';
    let type = '';
    let ext = '';

    if (format === 'json') {
      content = JSON.stringify(users, null, 2);
      type = 'application/json';
      ext = 'json';
    } else {
      const headers = ['id', 'firstName', 'lastName', 'email', 'age', 'country', 'job'];
      const rows = users.map(u => headers.map(h => (u as any)[h]).join(','));
      content = [headers.join(','), ...rows].join('\n');
      type = 'text/csv';
      ext = 'csv';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `random-users-${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <label htmlFor="user-count" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              {t('common.count')} (Max {MAX_USERS})
            </label>
            <div className="flex items-center gap-3">
              <input
                id="user-count"
                type="number"
                min="1"
                max={MAX_USERS}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(MAX_USERS, parseInt(e.target.value) || 0)))}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl font-mono font-black text-lg w-32 focus:border-indigo-500 outline-none transition-all dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2 items-center">
            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
            <button
              onClick={handleClear}
              disabled={users.length === 0}
              className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-500 rounded-2xl font-bold transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-5 h-5" /> {t('common.clear')}
            </button>
          </div>
          <button
            onClick={generateUsers}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> {t('random.generate')}
          </button>
        </div>
      </div>

      {users.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" /> {t('common.result')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy('json')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 border ${copied === 'json' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
              >
                {copied === 'json' ? <Check className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />} JSON
              </button>
              <button
                onClick={() => handleCopy('csv')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 border ${copied === 'csv' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
              >
                {copied === 'csv' ? <Check className="w-3.5 h-3.5" /> : <FileSpreadsheet className="w-3.5 h-3.5" />} CSV
              </button>
              <button
                onClick={() => handleDownload('json')}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> JSON
              </button>
              <button
                onClick={() => handleDownload('csv')}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-black text-indigo-500 uppercase tracking-tighter whitespace-nowrap">ID</th>
                    <th className="px-6 py-4 font-black text-indigo-500 uppercase tracking-tighter whitespace-nowrap">Name</th>
                    <th className="px-6 py-4 font-black text-indigo-500 uppercase tracking-tighter whitespace-nowrap">Email</th>
                    <th className="px-6 py-4 font-black text-indigo-500 uppercase tracking-tighter whitespace-nowrap">Age</th>
                    <th className="px-6 py-4 font-black text-indigo-500 uppercase tracking-tighter whitespace-nowrap">Country</th>
                    <th className="px-6 py-4 font-black text-indigo-500 uppercase tracking-tighter whitespace-nowrap">Job</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{user.id}</td>
                      <td className="px-6 py-4 font-bold dark:text-slate-200">{user.firstName} {user.lastName}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{user.email}</td>
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{user.age}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{user.country}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{user.job}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('random_user.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('random_user.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
