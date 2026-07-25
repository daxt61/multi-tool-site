import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  FileCode,
  Check,
  Copy,
  Plus,
  ArrowRight,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { Kbd } from './ui/Kbd';

// Official SemVer 2.0.0 Regex
const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

interface SemVerParts {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
  build: string | null;
  raw: string;
}

// Parse version string into parts
function parseSemVer(version: string): SemVerParts | null {
  const clean = version.trim().replace(/^v/i, '');
  const match = clean.match(SEMVER_REGEX);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
    build: match[5] || null,
    raw: clean,
  };
}

// Compare two parsed versions
// Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
function compareSemVer(v1: SemVerParts, v2: SemVerParts): number {
  if (v1.major !== v2.major) return v1.major > v2.major ? 1 : -1;
  if (v1.minor !== v2.minor) return v1.minor > v2.minor ? 1 : -1;
  if (v1.patch !== v2.patch) return v1.patch > v2.patch ? 1 : -1;

  // Pre-release comparison
  if (v1.prerelease && !v2.prerelease) return -1; // Pre-release is lower than normal version
  if (!v1.prerelease && v2.prerelease) return 1;
  if (!v1.prerelease && !v2.prerelease) return 0;

  const p1Parts = v1.prerelease!.split('.');
  const p2Parts = v2.prerelease!.split('.');

  const len = Math.max(p1Parts.length, p2Parts.length);
  for (let i = 0; i < len; i++) {
    const p1 = p1Parts[i];
    const p2 = p2Parts[i];

    if (p1 === undefined) return -1;
    if (p2 === undefined) return 1;

    if (p1 === p2) continue;

    const p1Num = /^\d+$/.test(p1) ? parseInt(p1, 10) : NaN;
    const p2Num = /^\d+$/.test(p2) ? parseInt(p2, 10) : NaN;

    const p1IsNum = !isNaN(p1Num);
    const p2IsNum = !isNaN(p2Num);

    if (p1IsNum && p2IsNum) {
      if (p1Num !== p2Num) return p1Num > p2Num ? 1 : -1;
    } else if (!p1IsNum && !p2IsNum) {
      if (p1 !== p2) return p1 > p2 ? 1 : -1;
    } else {
      // Numeric identifiers always have lower precedence than non-numeric identifiers
      return p1IsNum ? -1 : 1;
    }
  }

  return 0;
}

// Increment version helper
function incrementVersion(parts: SemVerParts, type: string, prTag = 'alpha'): string {
  let { major, minor, patch, prerelease } = parts;

  const cleanPrerelease = (pr: string | null): { tag: string; num: number } => {
    if (!pr) return { tag: prTag, num: 0 };
    const parts = pr.split('.');
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last)) {
      const num = parseInt(last, 10);
      return { tag: parts.slice(0, -1).join('.'), num };
    }
    return { tag: pr, num: -1 };
  };

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'premajor':
      return `${major + 1}.0.0-${prTag}.0`;
    case 'preminor':
      return `${major}.${minor + 1}.0-${prTag}.0`;
    case 'prepatch':
      return `${major}.${minor}.${patch + 1}-${prTag}.0`;
    case 'prerelease': {
      if (!prerelease) {
        return `${major}.${minor}.${patch + 1}-${prTag}.0`;
      }
      const { tag, num } = cleanPrerelease(prerelease);
      if (num === -1) {
        return `${major}.${minor}.${patch}-${tag}.0`;
      }
      return `${major}.${minor}.${patch}-${tag}.${num + 1}`;
    }
    default:
      return `${major}.${minor}.${patch}`;
  }
}

// Simple SemVer Range Matcher
function satisfyRange(versionStr: string, rangeStr: string): boolean {
  const parsedVer = parseSemVer(versionStr);
  if (!parsedVer) return false;

  // Normalize range string: replace duplicate spaces, split into sub-ranges (or operators)
  const range = rangeStr.trim().replace(/\s+/g, ' ');
  if (!range || range === '*' || range.toLowerCase() === 'x') return true;

  // Handle hyphen range e.g., 1.2.3 - 2.3.4
  if (range.includes(' - ')) {
    const [start, end] = range.split(' - ');
    const pStart = parseSemVer(start);
    const pEnd = parseSemVer(end);
    if (!pStart || !pEnd) return false;
    return compareSemVer(parsedVer, pStart) >= 0 && compareSemVer(parsedVer, pEnd) <= 0;
  }

  // Handle comma or space separated requirements (AND logic)
  // Split on spaces (unless part of operators like '>= 1.0.0')
  const clauses = range.split(' ');
  for (let i = 0; i < clauses.length; i++) {
    let clause = clauses[i];
    if (!clause) continue;

    // Tilde match ~1.2.3 or ~1.2
    if (clause.startsWith('~')) {
      const rest = clause.slice(1);
      const parts = rest.split('.');
      if (parts.length === 1) { // ~1
        const major = parseInt(parts[0], 10);
        if (isNaN(major)) return false;
        return parsedVer.major === major;
      } else if (parts.length === 2) { // ~1.2
        const major = parseInt(parts[0], 10);
        const minor = parseInt(parts[1], 10);
        if (isNaN(major) || isNaN(minor)) return false;
        return parsedVer.major === major && parsedVer.minor === minor;
      } else { // ~1.2.3
        const pRange = parseSemVer(rest);
        if (!pRange) return false;
        return (
          compareSemVer(parsedVer, pRange) >= 0 &&
          parsedVer.major === pRange.major &&
          parsedVer.minor === pRange.minor
        );
      }
    }

    // Caret match ^1.2.3 or ^0.2.3 or ^0.0.3
    if (clause.startsWith('^')) {
      const rest = clause.slice(1);
      const pRange = parseSemVer(rest);
      if (!pRange) return false;
      if (compareSemVer(parsedVer, pRange) < 0) return false;

      if (pRange.major > 0) {
        return parsedVer.major === pRange.major;
      }
      if (pRange.minor > 0) {
        return parsedVer.major === 0 && parsedVer.minor === pRange.minor;
      }
      return parsedVer.major === 0 && parsedVer.minor === 0 && parsedVer.patch === pRange.patch;
    }

    // Wildcards 1.x or 1.2.x or 1.*
    if (clause.includes('.x') || clause.includes('.X') || clause.includes('.*')) {
      const parts = clause.toLowerCase().replace(/x|\*/g, 'x').split('.');
      if (parts[0] === 'x') return true;
      const major = parseInt(parts[0], 10);
      if (parsedVer.major !== major) return false;
      if (parts[1] === 'x') return true;
      const minor = parseInt(parts[1], 10);
      if (parsedVer.minor !== minor) return false;
      return true;
    }

    // Comparison operators >=, <=, >, <, =, !=
    let op = '';
    let verPart = clause;
    if (clause.startsWith('>=') || clause.startsWith('<=') || clause.startsWith('!=')) {
      op = clause.slice(0, 2);
      verPart = clause.slice(2);
    } else if (clause.startsWith('>') || clause.startsWith('<') || clause.startsWith('=')) {
      op = clause.slice(0, 1);
      verPart = clause.slice(1);
    }

    const pClause = parseSemVer(verPart);
    if (!pClause) return false;

    const comp = compareSemVer(parsedVer, pClause);
    if (op === '>=') {
      if (comp < 0) return false;
    } else if (op === '<=') {
      if (comp > 0) return false;
    } else if (op === '>') {
      if (comp <= 0) return false;
    } else if (op === '<') {
      if (comp >= 0) return false;
    } else if (op === '!=') {
      if (comp === 0) return false;
    } else { // '=' or plain version
      if (comp !== 0) return false;
    }
  }

  return true;
}

export function SemVerAnalyzer() {
  const { t } = useTranslation();

  // Mode Selection: 'analyzer' | 'comparator' | 'ranges'
  const [activeTab, setActiveTab] = useState<'analyzer' | 'comparator' | 'ranges'>('analyzer');

  // Analyzer States
  const [versionInput, setVersionInput] = useState('1.2.3-beta.1+build.104');
  const [preReleaseTag, setPrereleaseTag] = useState('alpha');
  const versionInputRef = useRef<HTMLInputElement>(null);

  // Comparator States
  const [compA, setCompA] = useState('1.8.2-alpha.5');
  const [compB, setCompB] = useState('1.8.2-beta.2');
  const compARef = useRef<HTMLInputElement>(null);

  // Range Tester States
  const [rangeInput, setRangeInput] = useState('^1.2.0');
  const [testVersionsText, setTestVersionsText] = useState('1.2.3\n1.3.0\n2.0.0\n0.9.1\n1.1.9');
  const rangeInputRef = useRef<HTMLInputElement>(null);

  // Parse result for the current version
  const parsed = useMemo(() => parseSemVer(versionInput), [versionInput]);

  // Comparison result
  const comparisonResult = useMemo(() => {
    const pA = parseSemVer(compA);
    const pB = parseSemVer(compB);
    if (!pA || !pB) return null;
    const cmp = compareSemVer(pA, pB);
    return {
      sign: cmp === 1 ? '>' : cmp === -1 ? '<' : '=',
      text: cmp === 1 ? t('semver.comp.greater', 'Version A is greater than B') : cmp === -1 ? t('semver.comp.lesser', 'Version A is lower than B') : t('semver.comp.equal', 'Versions are equal'),
      isCompatible: pA.major === pB.major && (pA.major > 0 || pA.minor === pB.minor)
    };
  }, [compA, compB, t]);

  // Range tests results
  const rangeResults = useMemo(() => {
    const list = testVersionsText.split('\n').map(v => v.trim()).filter(Boolean);
    return list.map(v => {
      const isValid = parseSemVer(v) !== null;
      const isMatch = isValid ? satisfyRange(v, rangeInput) : false;
      return { version: v, isValid, isMatch };
    });
  }, [rangeInput, testVersionsText]);

  // Handle Increments
  const triggerIncrement = (type: string) => {
    if (!parsed) return;
    const next = incrementVersion(parsed, type, preReleaseTag);
    setVersionInput(next);
    toast.success(t('semver.analyzer.incremented', 'Version incremented successfully'));
  };

  // Copy with toast
  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  // Local escape key handlers ref-pattern
  const handlersRef = useRef({
    onEscape: () => {
      if (activeTab === 'analyzer') {
        setVersionInput('1.0.0');
        versionInputRef.current?.focus();
        toast.info(t('semver.reset.success', 'Input reset to 1.0.0'));
      } else if (activeTab === 'comparator') {
        setCompA('1.0.0');
        setCompB('1.0.0');
        compARef.current?.focus();
        toast.info(t('semver.reset.success_comp', 'Comparator inputs reset'));
      } else {
        setRangeInput('^1.0.0');
        rangeInputRef.current?.focus();
        toast.info(t('semver.reset.success_range', 'Range input reset'));
      }
    }
  });

  useEffect(() => {
    handlersRef.current = {
      onEscape: () => {
        if (activeTab === 'analyzer') {
          setVersionInput('1.0.0');
          versionInputRef.current?.focus();
          toast.info(t('semver.reset.success', 'Input reset to 1.0.0'));
        } else if (activeTab === 'comparator') {
          setCompA('1.0.0');
          setCompB('1.0.0');
          compARef.current?.focus();
          toast.info(t('semver.reset.success_comp', 'Comparator inputs reset'));
        } else {
          setRangeInput('^1.0.0');
          rangeInputRef.current?.focus();
          toast.info(t('semver.reset.success_range', 'Range input reset'));
        }
      }
    };
  }, [activeTab, t]);

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Prevent global reset if user is working on other inputs
        const target = e.target as HTMLElement;
        if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
          // Allow normal ESC to unfocus or we trigger our custom handler
        }
        handlersRef.current.onEscape();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('analyzer')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'analyzer'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {t('semver.tab.analyzer', 'Analyzer & Incrementor')}
        </button>
        <button
          onClick={() => setActiveTab('comparator')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'comparator'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          {t('semver.tab.comparator', 'Version Comparator')}
        </button>
        <button
          onClick={() => setActiveTab('ranges')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'ranges'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <Search className="w-4 h-4" />
          {t('semver.tab.ranges', 'Range Tester & Cheat Sheet')}
        </button>
      </div>

      {/* 1. ANALYZER TAB */}
      {activeTab === 'analyzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="ver-input" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                    {t('semver.analyzer.label', 'Semantic Version String')}
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400 font-medium">Reset:</span>
                    <Kbd>Esc</Kbd>
                  </div>
                </div>
                <input
                  id="ver-input"
                  ref={versionInputRef}
                  type="text"
                  value={versionInput}
                  onChange={(e) => setVersionInput(e.target.value)}
                  placeholder="e.g., 1.2.3-beta.1+build.99"
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="pr-tag" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('semver.analyzer.pr_tag', 'Custom Pre-release Tag')}
                </label>
                <input
                  id="pr-tag"
                  type="text"
                  value={preReleaseTag}
                  onChange={(e) => setPrereleaseTag(e.target.value)}
                  placeholder="alpha, beta, rc..."
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setVersionInput('1.0.0');
                    setPrereleaseTag('alpha');
                    versionInputRef.current?.focus();
                  }}
                  className="w-full py-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('common.reset', 'Reset')}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {/* Parse Info Display */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold dark:text-white text-lg flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-500" />
                  {t('semver.analyzer.details', 'Version Breakdown')}
                </h3>
                {parsed ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-full border border-emerald-200 dark:border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('semver.status.valid', 'Valid SemVer 2.0.0')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black rounded-full border border-rose-200 dark:border-rose-500/20">
                    <XCircle className="w-3.5 h-3.5" /> {t('semver.status.invalid', 'Invalid SemVer')}
                  </span>
                )}
              </div>

              {parsed ? (
                <div className="space-y-6">
                  {/* Visual Parts Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-center">
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Major</p>
                      <p className="text-xl font-black text-indigo-700 dark:text-indigo-400 mt-1">{parsed.major}</p>
                    </div>
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-center">
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Minor</p>
                      <p className="text-xl font-black text-indigo-700 dark:text-indigo-400 mt-1">{parsed.minor}</p>
                    </div>
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-center">
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Patch</p>
                      <p className="text-xl font-black text-indigo-700 dark:text-indigo-400 mt-1">{parsed.patch}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-center col-span-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pre-Release</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate mt-2" title={parsed.prerelease || '-'}>
                        {parsed.prerelease || '-'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-center col-span-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Build Meta</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate mt-2" title={parsed.build || '-'}>
                        {parsed.build || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Incrementor Buttons */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {t('semver.analyzer.increments', 'Version Increment Actions')}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button
                        onClick={() => triggerIncrement('major')}
                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 rounded-xl font-bold text-xs text-left transition-all"
                      >
                        <span className="text-indigo-600 dark:text-indigo-400 block mb-1">Major (+1.0.0)</span>
                        <code className="text-slate-500 font-mono block">{parsed.major + 1}.0.0</code>
                      </button>
                      <button
                        onClick={() => triggerIncrement('minor')}
                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 rounded-xl font-bold text-xs text-left transition-all"
                      >
                        <span className="text-indigo-600 dark:text-indigo-400 block mb-1">Minor (+0.1.0)</span>
                        <code className="text-slate-500 font-mono block">{parsed.major}.{parsed.minor + 1}.0</code>
                      </button>
                      <button
                        onClick={() => triggerIncrement('patch')}
                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 rounded-xl font-bold text-xs text-left transition-all"
                      >
                        <span className="text-indigo-600 dark:text-indigo-400 block mb-1">Patch (+0.0.1)</span>
                        <code className="text-slate-500 font-mono block">{parsed.major}.{parsed.minor}.{parsed.patch + 1}</code>
                      </button>
                      <button
                        onClick={() => triggerIncrement('prerelease')}
                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 rounded-xl font-bold text-xs text-left transition-all"
                      >
                        <span className="text-indigo-600 dark:text-indigo-400 block mb-1">Pre-release (+1)</span>
                        <code className="text-slate-500 font-mono block truncate">
                          {incrementVersion(parsed, 'prerelease', preReleaseTag)}
                        </code>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <button
                        onClick={() => triggerIncrement('premajor')}
                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 rounded-xl font-bold text-xs text-left transition-all"
                      >
                        <span className="text-indigo-600 block mb-1">Pre-major</span>
                        <code className="text-slate-500 font-mono block truncate">{parsed.major + 1}.0.0-{preReleaseTag}.0</code>
                      </button>
                      <button
                        onClick={() => triggerIncrement('preminor')}
                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 rounded-xl font-bold text-xs text-left transition-all"
                      >
                        <span className="text-indigo-600 block mb-1">Pre-minor</span>
                        <code className="text-slate-500 font-mono block truncate">{parsed.major}.{parsed.minor + 1}.0-{preReleaseTag}.0</code>
                      </button>
                      <button
                        onClick={() => triggerIncrement('prepatch')}
                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 rounded-xl font-bold text-xs text-left transition-all"
                      >
                        <span className="text-indigo-600 block mb-1">Pre-patch</span>
                        <code className="text-slate-500 font-mono block truncate">{parsed.major}.{parsed.minor}.{parsed.patch + 1}-{preReleaseTag}.0</code>
                      </button>
                    </div>
                  </div>

                  {/* Copy actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleCopy(versionInput, t('semver.copied.full', 'Version copied to clipboard'))}
                      className="flex-1 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      {t('semver.copy.full', 'Copy Version')}
                    </button>
                    <button
                      onClick={() => handleCopy(`${parsed.major}.${parsed.minor}.${parsed.patch}`, t('semver.copied.simple', 'Core version copied'))}
                      className="px-6 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white rounded-xl font-bold text-sm transition-all"
                    >
                      {t('semver.copy.simple', 'Copy Core (x.y.z)')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-60" />
                  <p className="font-bold mb-1">{t('semver.error.invalid_title', 'Format incorrect')}</p>
                  <p className="text-xs max-w-sm mx-auto">
                    {t('semver.error.invalid_desc', 'The string is not a valid Semantic Version 2.0.0. Please check for proper major.minor.patch segments.')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. COMPARATOR TAB */}
      {activeTab === 'comparator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
              <div className="space-y-2">
                <label htmlFor="comp-a" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('semver.comp.version_a', 'Version A')}
                </label>
                <input
                  id="comp-a"
                  ref={compARef}
                  type="text"
                  value={compA}
                  onChange={(e) => setCompA(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="comp-b" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('semver.comp.version_b', 'Version B')}
                </label>
                <input
                  id="comp-b"
                  type="text"
                  value={compB}
                  onChange={(e) => setCompB(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <button
                onClick={() => {
                  setCompA('1.0.0');
                  setCompB('1.0.1');
                  compARef.current?.focus();
                }}
                className="w-full py-3 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                {t('common.reset', 'Reset')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-sm">
              <h3 className="font-bold dark:text-white text-lg flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-indigo-500" />
                {t('semver.comp.results', 'Comparison Results')}
              </h3>

              {comparisonResult ? (
                <div className="space-y-6 text-center py-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-slate-400">A</p>
                      <code className="text-lg font-black font-mono text-slate-700 dark:text-slate-300">{compA}</code>
                    </div>
                    <div id="comparison-sign" className="text-3xl font-black text-indigo-600 dark:text-indigo-400 px-4">
                      {comparisonResult.sign}
                    </div>
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-slate-400">B</p>
                      <code className="text-lg font-black font-mono text-slate-700 dark:text-slate-300">{compB}</code>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 max-w-md mx-auto">
                    <p className="font-bold dark:text-white text-base mb-1">{comparisonResult.text}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {comparisonResult.isCompatible
                        ? t('semver.comp.compatible_desc', 'These versions share the same major number and are backward-compatible.')
                        : t('semver.comp.breaking_desc', 'These versions represent a breaking change relative to each other.')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-60" />
                  <p className="font-bold mb-1">{t('semver.comp.invalid_inputs', 'Incorrect input versions')}</p>
                  <p className="text-xs">
                    {t('semver.comp.invalid_inputs_desc', 'Ensure both Version A and Version B are valid SemVer 2.0.0 strings.')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. RANGE TESTER TAB */}
      {activeTab === 'ranges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
              <div className="space-y-2">
                <label htmlFor="range-input" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('semver.range.input_label', 'SemVer Range / Condition')}
                </label>
                <input
                  id="range-input"
                  ref={rangeInputRef}
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="e.g. ^1.2.3, ~2.0.0, >=1.0.0 <3.0.0"
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="test-versions" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('semver.range.versions_label', 'Versions to Test (one per line)')}
                </label>
                <textarea
                  id="test-versions"
                  rows={5}
                  value={testVersionsText}
                  onChange={(e) => setTestVersionsText(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold font-mono focus:border-indigo-500 outline-none transition-all dark:text-white resize-none"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <button
                onClick={() => {
                  setRangeInput('^1.2.0');
                  setTestVersionsText('1.2.3\n1.3.0\n2.0.0\n0.9.1\n1.1.9');
                  rangeInputRef.current?.focus();
                }}
                className="w-full py-3 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                {t('common.reset', 'Reset')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-sm">
              <h3 className="font-bold dark:text-white text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                {t('semver.range.results', 'Evaluation Results')}
              </h3>

              <div className="space-y-3">
                {rangeResults.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      !r.isValid
                        ? 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/30 dark:border-slate-800'
                        : r.isMatch
                        ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                        : 'bg-rose-50/50 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30 text-rose-800 dark:text-rose-400'
                    }`}
                  >
                    <code className="font-bold font-mono text-sm">{r.version}</code>
                    <div className="flex items-center gap-2">
                      {!r.isValid ? (
                        <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300">
                          {t('semver.status.invalid', 'Invalid')}
                        </span>
                      ) : r.isMatch ? (
                        <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 rounded-md text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> {t('semver.range.satisfied', 'Satisfies')}
                        </span>
                      ) : (
                        <span className="text-xs font-bold bg-rose-100 dark:bg-rose-900/40 px-2.5 py-1 rounded-md text-rose-700 dark:text-rose-300 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> {t('semver.range.mismatch', 'Excluded')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Range Cheat Sheet Info */}
              <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-sm dark:text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-500" />
                  {t('semver.range.cheatsheet', 'Range Syntax Cheat Sheet')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <p className="dark:text-slate-300">
                      <code className="font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">^1.2.3</code>{' '}
                      {t('semver.range.caret_desc', 'Caret: Allow backward-compatible changes (>=1.2.3 <2.0.0)')}
                    </p>
                    <p className="dark:text-slate-300">
                      <code className="font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">~1.2.3</code>{' '}
                      {t('semver.range.tilde_desc', 'Tilde: Allow patch increments only (>=1.2.3 <1.3.0)')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="dark:text-slate-300">
                      <code className="font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">1.x</code>{' '}
                      {t('semver.range.wildcard_desc', 'Wildcard: Matches any minor/patch number in major 1')}
                    </p>
                    <p className="dark:text-slate-300">
                      <code className="font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">&gt;=1.0.0 &lt;2.0.0</code>{' '}
                      {t('semver.range.and_desc', 'Combined: Multiple conditions separated by a space')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
