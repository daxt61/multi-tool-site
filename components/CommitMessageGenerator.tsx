import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FileText, Copy, Check, Trash2, Info, Terminal, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_INPUT_LENGTH = 1000;

export function CommitMessageGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  const [type, setType] = useState(initialData?.type || 'feat');
  const [scope, setScope] = useState(initialData?.scope || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [hasBreaking, setBreaking] = useState(initialData?.hasBreaking || false);
  const [breakingDetails, setBreakingDetails] = useState(initialData?.breakingDetails || '');
  const [issueReference, setIssueReference] = useState(initialData?.issueReference || '');
  const [isGitCommand, setIsGitCommand] = useState(initialData?.isGitCommand || false);
  const [isLowercaseSubject, setIsLowercaseSubject] = useState(initialData?.isLowercaseSubject || true);
  const [copied, setCopied] = useState(false);

  const subjectInputRef = useRef<HTMLInputElement>(null);

  // Sanitization / Length limits helper
  const handleStringInput = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_INPUT_LENGTH) {
      setter(val);
    }
  };

  const commitTypes = [
    { value: 'feat', label: 'feat', desc: 'A new feature' },
    { value: 'fix', label: 'fix', desc: 'A bug fix' },
    { value: 'docs', label: 'docs', desc: 'Documentation only changes' },
    { value: 'style', label: 'style', desc: 'Changes that do not affect the meaning of the code (white-space, formatting, etc.)' },
    { value: 'refactor', label: 'refactor', desc: 'A code change that neither fixes a bug nor adds a feature' },
    { value: 'perf', label: 'perf', desc: 'A code change that improves performance' },
    { value: 'test', label: 'test', desc: 'Adding missing tests or correcting existing tests' },
    { value: 'build', label: 'build', desc: 'Changes that affect the build system or external dependencies' },
    { value: 'ci', label: 'ci', desc: 'Changes to our CI configuration files and scripts' },
    { value: 'chore', label: 'chore', desc: 'Other changes that do not modify src or test files' },
    { value: 'revert', label: 'revert', desc: 'Reverts a previous commit' },
  ];

  // Dynamic commit message compilation
  const generatedMessage = useMemo(() => {
    let finalSubject = subject.trim();
    if (isLowercaseSubject && finalSubject.length > 0) {
      finalSubject = finalSubject.charAt(0).toLowerCase() + finalSubject.slice(1);
    }

    const scopePart = scope.trim() ? `(${scope.trim()})` : '';
    const breakingIndicator = hasBreaking ? '!' : '';

    let header = `${type}${scopePart}${breakingIndicator}: ${finalSubject}`;
    let result = header;

    if (body.trim()) {
      result += `\n\n${body.trim()}`;
    }

    if (hasBreaking && breakingDetails.trim()) {
      result += `\n\nBREAKING CHANGE: ${breakingDetails.trim()}`;
    }

    if (issueReference.trim()) {
      result += `\n\n${issueReference.trim()}`;
    }

    if (isGitCommand) {
      // Escape double quotes inside the message for the terminal command
      const escapedResult = result.replace(/"/g, '\\"');
      return `git commit -m "${escapedResult}"`;
    }

    return result;
  }, [type, scope, subject, body, hasBreaking, breakingDetails, issueReference, isGitCommand, isLowercaseSubject]);

  // Handle parent state updates for sharing configuration
  useEffect(() => {
    onStateChange?.({
      type,
      scope,
      subject,
      body,
      hasBreaking,
      breakingDetails,
      issueReference,
      isGitCommand,
      isLowercaseSubject,
      generatedMessage,
    });
  }, [type, scope, subject, body, hasBreaking, breakingDetails, issueReference, isGitCommand, isLowercaseSubject, generatedMessage, onStateChange]);

  const handleCopy = useCallback(() => {
    if (!subject.trim()) {
      toast.error(t('commitgen.err_empty_subject') || 'Please enter a subject first!');
      return;
    }
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    toast.success(t('commitgen.copied_success') || 'Commit message copied successfully!');
    setTimeout(() => setCopied(false), 2000);
  }, [generatedMessage, subject, t]);

  const handleClear = useCallback(() => {
    setType('feat');
    setScope('');
    setSubject('');
    setBody('');
    setBreaking(false);
    setBreakingDetails('');
    setIssueReference('');
    toast.success(t('commitgen.reset_success') || 'Generator reset!');
    subjectInputRef.current?.focus();
  }, [t]);

  // Setup useRef handlers to safeguard keyboard shortcuts against stale closures
  const handlersRef = useRef({
    onClear: handleClear,
    onCopy: handleCopy,
  });

  useEffect(() => {
    handlersRef.current = {
      onClear: handleClear,
      onCopy: handleCopy,
    };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        if (e.key === "Escape") {
          e.preventDefault();
          handlersRef.current.onClear();
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.onClear();
      } else if (e.key.toLowerCase() === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.onCopy();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8" role="region" aria-label={t('commitgen.title') || "Conventional Commit Message Generator"}>
      {/* Keyboard Hint Header */}
      <div className="flex justify-end gap-3 px-1 items-center">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">Esc</Kbd>
          {t('common.clear')}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
          <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
          {t('common.copy')}
        </span>
        <button
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Type of change selection */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">
              {t('commitgen.type_label') || "Type of Change"}
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {commitTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  title={t.desc}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    type === t.value
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scope */}
            <div className="space-y-2">
              <label htmlFor="commit-scope" className="text-xs font-black uppercase tracking-widest text-slate-400 block cursor-pointer">
                {t('commitgen.scope_label') || "Scope (Optional)"}
              </label>
              <input
                id="commit-scope"
                type="text"
                value={scope}
                onChange={handleStringInput(setScope)}
                placeholder="e.g. auth, parser, api"
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold text-sm dark:text-white"
              />
            </div>

            {/* Subject / Summary */}
            <div className="space-y-2">
              <label htmlFor="commit-subject" className="text-xs font-black uppercase tracking-widest text-slate-400 block cursor-pointer">
                {t('commitgen.subject_label') || "Subject / Summary"} <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="commit-subject"
                ref={subjectInputRef}
                type="text"
                value={subject}
                onChange={handleStringInput(setSubject)}
                placeholder="e.g. add support for multifactor authentication"
                required
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold text-sm dark:text-white"
              />
            </div>
          </div>

          {/* Body */}
          <div className="space-y-2">
            <label htmlFor="commit-body" className="text-xs font-black uppercase tracking-widest text-slate-400 block cursor-pointer">
              {t('commitgen.body_label') || "Body / Detailed Description (Optional)"}
            </label>
            <textarea
              id="commit-body"
              value={body}
              onChange={handleStringInput(setBody)}
              placeholder="e.g. Include a motivation for this change and contrasting with previous behavior."
              rows={4}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold text-sm dark:text-white resize-none"
            />
          </div>

          {/* Breaking Change Toggle */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <input
                id="commit-breaking"
                type="checkbox"
                checked={hasBreaking}
                onChange={(e) => setBreaking(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="commit-breaking" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> {t('commitgen.breaking_toggle') || "Introducing breaking changes"}
              </label>
            </div>

            {hasBreaking && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <label htmlFor="commit-breaking-details" className="text-xs font-black uppercase tracking-widest text-slate-400 block cursor-pointer">
                  {t('commitgen.breaking_details_label') || "Breaking Change Description"}
                </label>
                <input
                  id="commit-breaking-details"
                  type="text"
                  value={breakingDetails}
                  onChange={handleStringInput(setBreakingDetails)}
                  placeholder="e.g. this endpoint now returns standard ISO dates instead of Unix timestamps"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-semibold text-sm dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Issues reference */}
          <div className="space-y-2">
            <label htmlFor="commit-issues" className="text-xs font-black uppercase tracking-widest text-slate-400 block cursor-pointer">
              {t('commitgen.issues_label') || "Issues References (Optional)"}
            </label>
            <input
              id="commit-issues"
              type="text"
              value={issueReference}
              onChange={handleStringInput(setIssueReference)}
              placeholder="e.g. Closes #12, Fixes #43"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold text-sm dark:text-white"
            />
          </div>

          {/* Preferences */}
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-3">
              <input
                id="pref-lowercase"
                type="checkbox"
                checked={isLowercaseSubject}
                onChange={(e) => setIsLowercaseSubject(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="pref-lowercase" className="text-sm font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                {t('commitgen.lowercase_toggle') || "Force lowercase subject first letter"}
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="pref-gitcmd"
                type="checkbox"
                checked={isGitCommand}
                onChange={(e) => setIsGitCommand(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="pref-gitcmd" className="text-sm font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                {t('commitgen.gitcmd_toggle') || "Wrap in Git command line template"}
              </label>
            </div>
          </div>
        </div>

        {/* Live Output */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-500" />
              {t('commitgen.output_label') || "Live Compiled Commit"}
            </span>
            <button
              onClick={handleCopy}
              disabled={!subject.trim()}
              className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 flex items-center gap-2 cursor-pointer ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>

          <div className="relative">
            <pre
              id="generated-commit-output"
              className="w-full min-h-[480px] p-6 bg-slate-900 rounded-3xl overflow-auto font-mono text-sm leading-relaxed text-indigo-300 border border-slate-800 whitespace-pre-wrap break-all"
            >
              {subject.trim() ? (
                generatedMessage
              ) : (
                <span className="text-slate-500 italic">
                  {t('commitgen.waiting_subject') || "Waiting for a valid subject title..."}
                </span>
              )}
            </pre>
          </div>
        </div>
      </div>

      {/* Guidelines and specs section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
          <Info className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('commitgen.info_title') || "Conventional Commits 1.0.0"}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('commitgen.info_desc') || "The Conventional Commits specification is a lightweight convention on top of commit messages. It provides an easy set of rules for creating an explicit commit history; which makes it easier to write automated tools on top of. This convention aligns with SemVer, by describing features, fixes, and breaking changes in commit messages."}
          </p>
        </div>
      </div>
    </div>
  );
}
