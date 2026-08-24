import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Wand2, Play, Copy, Check, Trash2, Plus, MoveUp, MoveDown, Info,
  Settings, Terminal, FileCode, CheckCircle2, RefreshCw, HelpCircle, Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface RuleToken {
  id: string;
  type: string;
  value: string;
  quantifier: 'none' | 'exactly' | 'at_least' | 'between' | 'zero_or_more' | 'one_or_more' | 'optional';
  qtyValue: number;
  qtyMin: number;
  qtyMax: number;
  captureGroup: 'none' | 'normal' | 'named';
  captureName: string;
}

export function RegexBuilder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const testTextRef = useRef<HTMLTextAreaElement>(null);

  // Default presets / initial state
  const defaultRules: RuleToken[] = [
    {
      id: '1',
      type: 'start_anchor',
      value: '',
      quantifier: 'none',
      qtyValue: 1,
      qtyMin: 1,
      qtyMax: 2,
      captureGroup: 'none',
      captureName: ''
    },
    {
      id: '2',
      type: 'letters',
      value: '',
      quantifier: 'one_or_more',
      qtyValue: 1,
      qtyMin: 1,
      qtyMax: 2,
      captureGroup: 'none',
      captureName: ''
    },
    {
      id: '3',
      type: 'digits',
      value: '',
      quantifier: 'exactly',
      qtyValue: 3,
      qtyMin: 1,
      qtyMax: 2,
      captureGroup: 'none',
      captureName: ''
    },
    {
      id: '4',
      type: 'end_anchor',
      value: '',
      quantifier: 'none',
      qtyValue: 1,
      qtyMin: 1,
      qtyMax: 2,
      captureGroup: 'none',
      captureName: ''
    }
  ];

  // States
  const [rules, setRules] = useState<RuleToken[]>(initialData?.rules || defaultRules);
  const [globalFlag, setGlobalFlag] = useState<boolean>(initialData?.globalFlag ?? true);
  const [caseInsensitiveFlag, setCaseInsensitiveFlag] = useState<boolean>(initialData?.caseInsensitiveFlag ?? true);
  const [multilineFlag, setMultilineFlag] = useState<boolean>(initialData?.multilineFlag ?? false);
  const [testText, setTestText] = useState<string>(initialData?.testText || 'abc123\nXYZ789\ntest4567');
  const [copiedPattern, setCopiedPattern] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('js');

  useEffect(() => {
    onStateChange?.({
      rules,
      globalFlag,
      caseInsensitiveFlag,
      multilineFlag,
      testText
    });
  }, [rules, globalFlag, caseInsensitiveFlag, multilineFlag, testText, onStateChange]);

  // Compile RegExp pattern from rules list
  const compiledRegexString = useMemo(() => {
    let pattern = '';

    rules.forEach((rule) => {
      let rulePattern = '';

      // Determine raw token pattern
      switch (rule.type) {
        case 'start_anchor':
          rulePattern = '^';
          break;
        case 'end_anchor':
          rulePattern = '$';
          break;
        case 'any_char':
          rulePattern = '.';
          break;
        case 'digits':
          rulePattern = '\\d';
          break;
        case 'non_digits':
          rulePattern = '\\D';
          break;
        case 'whitespace':
          rulePattern = '\\s';
          break;
        case 'non_whitespace':
          rulePattern = '\\S';
          break;
        case 'word_char':
          rulePattern = '\\w';
          break;
        case 'word_boundary':
          rulePattern = '\\b';
          break;
        case 'lowercase':
          rulePattern = '[a-z]';
          break;
        case 'uppercase':
          rulePattern = '[A-Z]';
          break;
        case 'letters':
          rulePattern = '[a-zA-Z]';
          break;
        case 'alphanumeric':
          rulePattern = '[a-zA-Z0-9]';
          break;
        case 'literal_text': {
          // Escape regex special chars
          const escaped = (rule.value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          rulePattern = escaped || '';
          break;
        }
        case 'custom_class': {
          let custom = rule.value || '';
          if (custom && !custom.startsWith('[') && !custom.endsWith(']')) {
            custom = `[${custom}]`;
          }
          rulePattern = custom || '[]';
          break;
        }
        default:
          rulePattern = '';
      }

      // Add quantifier if rule is not an anchor or boundary
      const isAnchorOrBoundary = ['start_anchor', 'end_anchor', 'word_boundary'].includes(rule.type);
      if (!isAnchorOrBoundary && rulePattern) {
        // Wrap literal_text in parenthesis if it's more than 1 char and has a quantifier
        if (rule.type === 'literal_text' && (rule.value || '').length > 1 && rule.quantifier !== 'none') {
          rulePattern = `(?:${rulePattern})`;
        }

        switch (rule.quantifier) {
          case 'exactly':
            rulePattern += `{${Math.max(1, Math.min(1000, rule.qtyValue))}}`;
            break;
          case 'at_least':
            rulePattern += `{${Math.max(1, Math.min(1000, rule.qtyValue))},}`;
            break;
          case 'between': {
            const min = Math.max(1, Math.min(1000, rule.qtyMin));
            const max = Math.max(min, Math.min(1000, rule.qtyMax));
            rulePattern += `{${min},${max}}`;
            break;
          }
          case 'zero_or_more':
            rulePattern += '*';
            break;
          case 'one_or_more':
            rulePattern += '+';
            break;
          case 'optional':
            rulePattern += '?';
            break;
        }
      }

      // Apply Capture Group wrapping
      if (rulePattern && !isAnchorOrBoundary) {
        if (rule.captureGroup === 'normal') {
          rulePattern = `(${rulePattern})`;
        } else if (rule.captureGroup === 'named' && rule.captureName) {
          const cleanName = rule.captureName.replace(/[^a-zA-Z0-9]/g, '');
          if (cleanName) {
            rulePattern = `(?<${cleanName}>${rulePattern})`;
          } else {
            rulePattern = `(${rulePattern})`;
          }
        }
      }

      pattern += rulePattern;
    });

    return pattern;
  }, [rules]);

  // Compiled Flags
  const compiledFlags = useMemo(() => {
    let flags = '';
    if (globalFlag) flags += 'g';
    if (caseInsensitiveFlag) flags += 'i';
    if (multilineFlag) flags += 'm';
    return flags;
  }, [globalFlag, caseInsensitiveFlag, multilineFlag]);

  // Construct Javascript representation
  const regExpLiteral = useMemo(() => {
    return `/${compiledRegexString || ''}/${compiledFlags}`;
  }, [compiledRegexString, compiledFlags]);

  // Live matching logic
  const matchesResult = useMemo(() => {
    if (!compiledRegexString) return { count: 0, list: [] };

    try {
      // Limit regex performance timeout by avoiding run locks
      const regex = new RegExp(compiledRegexString, compiledFlags);

      if (globalFlag) {
        const matches = Array.from(testText.matchAll(regex));
        return {
          count: matches.length,
          list: matches.map(m => m[0]).slice(0, 100) // limit display to first 100
        };
      } else {
        const match = testText.match(regex);
        return {
          count: match ? 1 : 0,
          list: match ? [match[0]] : []
        };
      }
    } catch (e) {
      return { count: 0, list: [] };
    }
  }, [compiledRegexString, compiledFlags, testText, globalFlag]);

  // Add a new visual token
  const addRule = (type: string) => {
    const isAnchor = ['start_anchor', 'end_anchor'].includes(type);
    const newRule: RuleToken = {
      id: Date.now().toString(),
      type,
      value: type === 'literal_text' ? 'abc' : type === 'custom_class' ? 'a-z_' : '',
      quantifier: isAnchor ? 'none' : 'exactly',
      qtyValue: 1,
      qtyMin: 1,
      qtyMax: 2,
      captureGroup: 'none',
      captureName: ''
    };
    setRules([...rules, newRule]);
    toast.success(t('regexbuilder.toast_rule_added') || 'Rule block added!');
  };

  // Remove a token
  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    toast.success(t('regexbuilder.toast_rule_removed') || 'Rule block removed.');
  };

  // Move token up/down
  const moveRule = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= rules.length) return;

    const updated = [...rules];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setRules(updated);
  };

  // Modify individual token field
  const updateRuleField = (id: string, field: keyof RuleToken, val: any) => {
    setRules(rules.map((rule) => {
      if (rule.id === id) {
        return { ...rule, [field]: val };
      }
      return rule;
    }));
  };

  // Clear all
  const handleClear = useCallback(() => {
    setRules([]);
    setTestText('');
    toast.success(t('regexbuilder.toast_reset') || 'Regex builder reset!');
    testTextRef.current?.focus();
  }, [t]);

  // Copy RegExp
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(regExpLiteral);
    setCopiedPattern(true);
    toast.success(t('regexbuilder.toast_copied') || 'RegExp pattern copied!');
    setTimeout(() => setCopiedPattern(false), 2000);
  }, [regExpLiteral, t]);

  // Keyboard shortcut handlers
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
        handlersRef.current.onClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.onCopy();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Multi-language code snippets
  const codeSnippets = useMemo(() => {
    // Helper to format safe string literals for code generators
    const toPHPLiteral = (val: string) => `'${val.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    const toJavaLiteral = (val: string) => `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

    const jsPat = JSON.stringify(compiledRegexString);
    const jsFlags = JSON.stringify(compiledFlags);
    const jsText = JSON.stringify(testText);

    const pyPat = JSON.stringify(compiledRegexString);
    const pyText = JSON.stringify(testText);

    const goPat = `\`${compiledRegexString.replace(/`/g, '` + "`" + `')}\``;
    const goText = `\`${testText.replace(/`/g, '` + "`" + `')}\``;

    const rustPat = JSON.stringify(compiledRegexString);
    const rustText = JSON.stringify(testText);

    const phpPat = `'/' . ${toPHPLiteral(compiledRegexString.replace(/\//g, '\\/'))} . '/${compiledFlags.replace(/[^imsuxADJSU]/g, '')}'`;
    const phpText = toPHPLiteral(testText);

    const javaPat = toJavaLiteral(compiledRegexString);
    const javaText = toJavaLiteral(testText);

    const csPat = `@"${compiledRegexString.replace(/"/g, '""')}"`;
    const csText = `@"${testText.replace(/"/g, '""')}"`;

    return {
      js: `// JavaScript / TypeScript\nconst regex = new RegExp(${jsPat}, ${jsFlags});\nconst text = ${jsText};\nconst matches = [...text.matchAll(regex)];\nconsole.log(matches.map(m => m[0]));`,
      python: `# Python 3\nimport re\n\npattern = re.compile(${pyPat}, ${compiledFlags.includes('i') ? 're.IGNORECASE' : '0'}${compiledFlags.includes('m') ? ' | re.MULTILINE' : ''})\ntext = ${pyText}\nmatches = pattern.findall(text)\nprint(matches)`,
      go: `// Go\npackage main\n\nimport (\n\t"fmt"\n\t"regexp"\n)\n\nfunc main() {\n\tpattern := ${goPat}\n\t// Note: Go doesn't support case-insensitive inline flag the same way, prefix (?i) instead\n\tregex := regexp.MustCompile(pattern)\n\ttext := ${goText}\n\tmatches := regex.FindAllString(text, -1)\n\tfmt.Println(matches)\n}`,
      rust: `// Rust\n// Add to Cargo.toml: regex = "1.9"\nuse regex::Regex;\n\nfn main() {\n    let re = Regex::new(${rustPat}).unwrap();\n    let text = ${rustText};\n    let matches: Vec<&str> = re.find_iter(text).map(|mat| mat.as_str()).collect();\n    println!("{:?}", matches);\n}`,
      php: `<?php\n// PHP\n$pattern = ${phpPat};\n$text = ${phpText};\npreg_match_all($pattern, $text, $matches);\nprint_r($matches[0]);`,
      java: `// Java\nimport java.util.regex.Matcher;\nimport java.util.regex.Pattern;\n\npublic class Main {\n    public static void main(String[] args) {\n        Pattern pattern = Pattern.compile(${javaPat}, ${compiledFlags.includes('i') ? 'Pattern.CASE_INSENSITIVE' : '0'}${compiledFlags.includes('m') ? ' | Pattern.MULTILINE' : ''});\n        Matcher matcher = pattern.matcher(${javaText});\n        while (matcher.find()) {\n            System.out.println(matcher.group());\n        }\n    }\n}`,
      csharp: `// C# (.NET)\nusing System;\nusing System.Text.RegularExpressions;\n\nclass Program {\n    static void main() {\n        var options = RegexOptions.None;\n        ${compiledFlags.includes('i') ? 'options |= RegexOptions.IgnoreCase;' : ''}\n        ${compiledFlags.includes('m') ? 'options |= RegexOptions.Multiline;' : ''}\n        var regex = new Regex(${csPat}, options);\n        var text = ${csText};\n        foreach (Match match in regex.Matches(text)) {\n            Console.WriteLine(match.Value);\n        }\n    }\n}`
    };
  }, [compiledRegexString, compiledFlags, testText]);

  return (
    <div className="max-w-5xl mx-auto space-y-10" role="region" aria-label={t('regexbuilder.title') || 'Visual RegEx Builder'}>

      {/* Header action panel */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          {t('regexbuilder.editor_subtitle') || 'Drag & Configure tokens to construct your expression'}
        </h2>
        <div className="flex gap-3 items-center">
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
      </div>

      {/* Main RegExp Display Panel */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
          <Play className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" /> {t('regexbuilder.expression_label') || 'Compiled Expression'}
        </div>

        <div className="text-3xl md:text-5xl font-mono font-black text-white tracking-wider break-all px-4 select-all" aria-live="polite" aria-atomic="true">
          {regExpLiteral}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleCopy}
            className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              copiedPattern ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-white text-slate-900 hover:bg-slate-100'
            }`}
          >
            {copiedPattern ? <Check className="w-6 h-6" aria-hidden="true" /> : <Copy className="w-6 h-6" aria-hidden="true" />}
            {copiedPattern ? t('common.copied') : t('regexbuilder.copy_pattern') || 'Copy Expression'}
          </button>
        </div>
      </div>

      {/* Global Flags Grid */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
          <Settings className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('regexbuilder.flags_title') || 'Global Regex Flags'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-indigo-500/40 transition-colors">
            <input
              type="checkbox"
              checked={globalFlag}
              onChange={(e) => setGlobalFlag(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-bold block dark:text-white">{t('regextester.flag_g') || 'Global (g)'}</span>
              <span className="text-[10px] text-slate-400 block">{t('regexbuilder.flag_g_desc') || 'Find all matches rather than stopping at the first'}</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-indigo-500/40 transition-colors">
            <input
              type="checkbox"
              checked={caseInsensitiveFlag}
              onChange={(e) => setCaseInsensitiveFlag(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-bold block dark:text-white">{t('regextester.flag_i') || 'Case Insensitive (i)'}</span>
              <span className="text-[10px] text-slate-400 block">{t('regexbuilder.flag_i_desc') || 'Ignore upper/lower case distinctions'}</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-indigo-500/40 transition-colors">
            <input
              type="checkbox"
              checked={multilineFlag}
              onChange={(e) => setMultilineFlag(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-bold block dark:text-white">{t('regextester.flag_m') || 'Multiline (m)'}</span>
              <span className="text-[10px] text-slate-400 block">{t('regexbuilder.flag_m_desc') || 'Make anchors ^ and $ match start/end of lines'}</span>
            </div>
          </label>
        </div>
      </div>

      {/* Interactive Rules List & Builder */}
      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          {t('regexbuilder.builder_title') || 'Regex Token Sequence'}
        </h3>

        {/* Tokens List */}
        <div className="space-y-4" aria-live="polite">
          {rules.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
              <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-30 animate-pulse text-indigo-500" />
              <p className="font-bold">{t('regexbuilder.empty_rules') || 'No tokens added yet.'}</p>
              <p className="text-xs opacity-60 mt-1">{t('regexbuilder.empty_rules_desc') || 'Click on any token block below to build your expression.'}</p>
            </div>
          ) : (
            rules.map((rule, idx) => {
              const isAnchorOrBoundary = ['start_anchor', 'end_anchor', 'word_boundary'].includes(rule.type);
              return (
                <div
                  key={rule.id}
                  className="flex flex-col md:flex-row items-start md:items-center gap-4 p-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm relative group animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  {/* Left Controls: Drag/Move & Delete */}
                  <div className="flex md:flex-col gap-1 shrink-0">
                    <button
                      onClick={() => moveRule(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                      title={t('common.move_up') || 'Move Up'}
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveRule(idx, 'down')}
                      disabled={idx === rules.length - 1}
                      className="p-1 rounded bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                      title={t('common.move_down') || 'Move Down'}
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Token Type Tag */}
                  <div className="w-full md:w-44 shrink-0">
                    <div className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 inline-block">
                      {t(`regexbuilder.token_${rule.type}`) || rule.type.replace('_', ' ')}
                    </div>
                  </div>

                  {/* Token Config Fields (dynamic based on type) */}
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Specific Inputs (literal_text, custom_class) */}
                    {['literal_text', 'custom_class'].includes(rule.type) && (
                      <div className="space-y-1">
                        <label htmlFor={`val-${rule.id}`} className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {t('regexbuilder.label_value') || 'Match Value'}
                        </label>
                        <input
                          id={`val-${rule.id}`}
                          type="text"
                          value={rule.value}
                          onChange={(e) => updateRuleField(rule.id, 'value', e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold dark:text-white"
                        />
                      </div>
                    )}

                    {/* Quantifier (skip for anchors) */}
                    {!isAnchorOrBoundary && (
                      <>
                        <div className="space-y-1">
                          <label htmlFor={`qty-${rule.id}`} className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {t('regexbuilder.label_quantity') || 'Quantity'}
                          </label>
                          <select
                            id={`qty-${rule.id}`}
                            value={rule.quantifier}
                            onChange={(e) => updateRuleField(rule.id, 'quantifier', e.target.value)}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white"
                          >
                            <option value="none">{t('regexbuilder.qty_none') || 'Once'}</option>
                            <option value="exactly">{t('regexbuilder.qty_exactly') || 'Exactly N times'}</option>
                            <option value="at_least">{t('regexbuilder.qty_at_least') || 'At least N times'}</option>
                            <option value="between">{t('regexbuilder.qty_between') || 'Between N and M times'}</option>
                            <option value="zero_or_more">{t('regexbuilder.qty_zero_or_more') || 'Zero or more (*)'}</option>
                            <option value="one_or_more">{t('regexbuilder.qty_one_or_more') || 'One or more (+)'}</option>
                            <option value="optional">{t('regexbuilder.qty_optional') || 'Optional (0 or 1)'}</option>
                          </select>
                        </div>

                        {/* Quantitative values (exactly, at_least, between) */}
                        {['exactly', 'at_least'].includes(rule.quantifier) && (
                          <div className="space-y-1">
                            <label htmlFor={`qty-val-${rule.id}`} className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {t('regexbuilder.label_times') || 'Times (N)'}
                            </label>
                            <input
                              id={`qty-val-${rule.id}`}
                              type="number"
                              min="1"
                              max="1000"
                              value={rule.qtyValue}
                              onChange={(e) => updateRuleField(rule.id, 'qtyValue', parseInt(e.target.value) || 1)}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white"
                            />
                          </div>
                        )}

                        {rule.quantifier === 'between' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label htmlFor={`qty-min-${rule.id}`} className="text-[10px] font-black uppercase tracking-wider text-slate-400">Min</label>
                              <input
                                id={`qty-min-${rule.id}`}
                                type="number"
                                min="1"
                                max="1000"
                                value={rule.qtyMin}
                                onChange={(e) => updateRuleField(rule.id, 'qtyMin', parseInt(e.target.value) || 1)}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label htmlFor={`qty-max-${rule.id}`} className="text-[10px] font-black uppercase tracking-wider text-slate-400">Max</label>
                              <input
                                id={`qty-max-${rule.id}`}
                                type="number"
                                min="1"
                                max="1000"
                                value={rule.qtyMax}
                                onChange={(e) => updateRuleField(rule.id, 'qtyMax', parseInt(e.target.value) || 1)}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Capture Group Option */}
                    {!isAnchorOrBoundary && (
                      <div className="space-y-1">
                        <label htmlFor={`grp-${rule.id}`} className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {t('regexbuilder.label_capture') || 'Capture Group'}
                        </label>
                        <select
                          id={`grp-${rule.id}`}
                          value={rule.captureGroup}
                          onChange={(e) => updateRuleField(rule.id, 'captureGroup', e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white"
                        >
                          <option value="none">{t('regexbuilder.grp_none') || 'No capture'}</option>
                          <option value="normal">{t('regexbuilder.grp_normal') || 'Standard ( )'}</option>
                          <option value="named">{t('regexbuilder.grp_named') || 'Named group'}</option>
                        </select>
                      </div>
                    )}

                    {/* Named Group Name field */}
                    {rule.captureGroup === 'named' && !isAnchorOrBoundary && (
                      <div className="space-y-1 col-span-1 sm:col-span-2 md:col-span-3">
                        <label htmlFor={`grp-name-${rule.id}`} className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {t('regexbuilder.label_group_name') || 'Group Variable Name'}
                        </label>
                        <input
                          id={`grp-name-${rule.id}`}
                          type="text"
                          value={rule.captureName}
                          onChange={(e) => updateRuleField(rule.id, 'captureName', e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold dark:text-white"
                          placeholder="groupName"
                        />
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 rounded-2xl transition-all self-end md:self-center shrink-0 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                    title={t('common.remove') || 'Remove'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Token Selector Shelf */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
            <Plus className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            {t('regexbuilder.shelf_title') || 'Click to append rules'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              { type: 'start_anchor', label: t('regexbuilder.token_start_anchor') || 'Start String' },
              { type: 'end_anchor', label: t('regexbuilder.token_end_anchor') || 'End String' },
              { type: 'literal_text', label: t('regexbuilder.token_literal_text') || 'Text/Phrase' },
              { type: 'digits', label: t('regexbuilder.token_digits') || 'Digits (0-9)' },
              { type: 'letters', label: t('regexbuilder.token_letters') || 'Letters (a-z)' },
              { type: 'alphanumeric', label: t('regexbuilder.token_alphanumeric') || 'Alphanumeric' },
              { type: 'any_char', label: t('regexbuilder.token_any_char') || 'Any character' },
              { type: 'whitespace', label: t('regexbuilder.token_whitespace') || 'Space' },
              { type: 'word_char', label: t('regexbuilder.token_word_char') || 'Word char (\w)' },
              { type: 'word_boundary', label: t('regexbuilder.token_word_boundary') || 'Boundary' },
              { type: 'lowercase', label: t('regexbuilder.token_lowercase') || 'Lowercase' },
              { type: 'uppercase', label: t('regexbuilder.token_uppercase') || 'Uppercase' },
              { type: 'custom_class', label: t('regexbuilder.token_custom_class') || 'Custom Class' },
            ].map((token) => (
              <button
                key={token.type}
                onClick={() => addRule(token.type)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 rounded-xl text-xs font-bold transition-all text-slate-700 dark:text-slate-300"
              >
                + {token.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Match Playground & Code Snippets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Playground */}
        <div className="lg:col-span-6 space-y-4">
          <label htmlFor="test-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
            <Eye className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('regexbuilder.test_label') || 'Match Playground'}
          </label>
          <div className="relative group">
            <textarea
              id="test-text"
              ref={testTextRef}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder={t('regextester.test_text_placeholder_input') || 'Enter text here to live match...'}
              className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300"
            />

            {/* Float Stats Badge */}
            <div className="absolute bottom-6 right-6 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25">
              {t('regextester.matches_found_other', { count: matchesResult.count })}
            </div>
          </div>

          {/* Quick info of matches list */}
          {matchesResult.count > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-200/50 dark:border-emerald-500/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-2">
                {t('regexbuilder.matches_list') || 'Matches List:'}
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                {matchesResult.list.map((m, i) => (
                  <span key={i} className="px-2 py-1 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950 font-mono text-xs rounded text-emerald-800 dark:text-emerald-300">
                    {m || <span className="italic opacity-55">empty</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Code Snippets */}
        <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="snippet-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('regexbuilder.code_snippets') || 'Code Snippets'}
              </label>

              <select
                id="language-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold outline-none dark:text-white"
              >
                <option value="js">JavaScript</option>
                <option value="python">Python</option>
                <option value="go">Go Lang</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
                <option value="java">Java</option>
                <option value="csharp">C# (.NET)</option>
              </select>
            </div>

            <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-6 flex-1 min-h-[300px] overflow-auto border border-slate-800 shadow-xl shadow-indigo-500/5 relative">
              <button
                onClick={() => {
                  const snippet = codeSnippets[selectedLanguage as keyof typeof codeSnippets];
                  navigator.clipboard.writeText(snippet);
                  toast.success(t('common.copied') || 'Snippet copied!');
                }}
                className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                title={t('common.copy')}
              >
                <Copy className="w-4 h-4" />
              </button>
              <pre id="snippet-output" className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre select-all">
                {codeSnippets[selectedLanguage as keyof typeof codeSnippets]}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600" aria-hidden="true">
            <Wand2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('regexbuilder.what_is_title') || 'Visual RegExp Builder'}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('regexbuilder.what_is_text') || 'Create complex regular expressions visually without memorizing syntax characters. Add start/end tags, quantities, custom ranges, and capture settings with interactive controllers.'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600" aria-hidden="true">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('regexbuilder.how_it_works_title') || 'Live Interactive Playground'}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('regexbuilder.how_it_works_text') || 'Test your constructed regex immediately against live input text. Matches are continuously computed and shown as a list. You can toggle global/multiline flags to fine-tune operations.'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600" aria-hidden="true">
            <Terminal className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('regexbuilder.advantages_title') || 'Multi-Language Snippets'}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('regexbuilder.advantages_text') || 'Instantly generate fully compliant, secure code snippets in JavaScript, Python, Go, Rust, PHP, Java, and C# to embed directly into your applications.'}
          </p>
        </div>
      </div>
    </div>
  );
}
