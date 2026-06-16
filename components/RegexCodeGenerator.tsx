import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Copy, Check, Trash2, Code, Download, Info, Zap, Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type OutputLanguage = 'javascript' | 'python' | 'php' | 'go' | 'ruby' | 'java' | 'csharp';

export function RegexCodeGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [pattern, setRegex] = useState(initialData?.pattern || '');
  const [flags, setFlags] = useState(initialData?.flags || 'g');
  const [language, setLanguage] = useState<OutputLanguage>(initialData?.language || 'javascript');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ pattern, flags, language });
  }, [pattern, flags, language, onStateChange]);

  const toPHPLiteral = (val: string) => {
    // Sentinel: Use single quotes in PHP to prevent variable interpolation ($var)
    // and only escape backslashes and single quotes.
    return `'${val.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  };

  const toRubyLiteral = (val: string) => {
    // Sentinel: Use single quotes in Ruby to prevent variable interpolation (#{})
    // and only escape backslashes and single quotes.
    return `'${val.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  };

  const toJavaLiteral = (val: string) => {
    // Sentinel: Escape double quotes and backslashes for Java/C# string literals.
    return `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  };

  const generateCode = (pat: string, flg: string, lang: OutputLanguage) => {
    if (!pat) return '';

    // Sentinel: Use safe literal generation for each language to prevent snippet injection.
    const jsPat = JSON.stringify(pat);
    const jsFlags = JSON.stringify(flg);
    const pyPat = JSON.stringify(pat);
    const rbPat = toRubyLiteral(pat);
    const rbFlags = toRubyLiteral(flg);
    const phpPat = toPHPLiteral(pat);
    const phpFlags = toPHPLiteral(flg);
    const javaPat = toJavaLiteral(pat);
    const goPat = `\`${pat.replace(/`/g, '` + "`" + `')}\``;
    const csPat = `@"${pat.replace(/"/g, '""')}"`;

    switch (lang) {
      case 'javascript':
        return `const regex = new RegExp(${jsPat}, ${jsFlags});\nconst str = 'example string';\nlet m;\n\nwhile ((m = regex.exec(str)) !== null) {\n  if (m.index === regex.lastIndex) {\n    regex.lastIndex++;\n  }\n  m.forEach((match, groupIndex) => {\n    console.log(\`Found match, group \${groupIndex}: \${match}\`);\n  });\n}`;

      case 'python':
        const pyFlags = flg.split('').map(f => {
          if (f === 'i') return 're.IGNORECASE';
          if (f === 'm') return 're.MULTILINE';
          if (f === 's') return 're.DOTALL';
          return null;
        }).filter(Boolean).join(' | ') || '0';
        return `import re\n\nregex = re.compile(${pyPat}, ${pyFlags})\ntest_str = "example string"\n\nmatches = regex.finditer(test_str)\n\nfor matchNum, match in enumerate(matches, start=1):\n    print(f"Match {matchNum} was found at {match.start()}-{match.end()}: {match.group()}")\n    for groupNum in range(0, len(match.groups())):\n        groupNum = groupNum + 1\n        print(f"Group {groupNum} found at {match.start(groupNum)}-{match.end(groupNum)}: {match.group(groupNum)}")`;

      case 'php':
        // Note: For PHP we still need delimiters for preg_match_all. We use # as it's less common in patterns.
        // We escape the delimiter in the pattern.
        const phpRegex = `'#' . ${toPHPLiteral(pat.replace(/#/g, '\\#'))} . '#${flg.replace(/[^imsuxADJSU]/g, '')}'`;
        return `<?php\n\n$regex = ${phpRegex};\n$str = 'example string';\n\npreg_match_all($regex, $str, $matches, PREG_SET_ORDER, 0);\n\nforeach ($matches as $match) {\n    echo "Found match: " . $match[0] . "\\n";\n}`;

      case 'go':
        return `package main\n\nimport (\n\t"fmt"\n\t"regexp"\n)\n\nfunc main() {\n\tvar re = regexp.MustCompile(${goPat})\n\tstr := "example string"\n\n\tmatches := re.FindAllStringSubmatch(str, -1)\n\tfor _, match := range matches {\n\t\tfmt.Println("Found match:", match[0])\n\t}\n}`;

      case 'ruby':
        return `regex = Regexp.new(${rbPat}, ${rbFlags}.include?('i') ? Regexp::IGNORECASE : 0)\nstr = 'example string'\n\nstr.scan(regex) do |match|\n  puts "Found match: #{match}"\nend`;

      case 'java':
        let javaFlags = '';
        if (flg.includes('i')) javaFlags += 'Pattern.CASE_INSENSITIVE | ';
        if (flg.includes('m')) javaFlags += 'Pattern.MULTILINE | ';
        if (flg.includes('s')) javaFlags += 'Pattern.DOTALL | ';
        javaFlags = javaFlags.endsWith('| ') ? javaFlags.slice(0, -3) : '0';
        return `import java.util.regex.Matcher;\nimport java.util.regex.Pattern;\n\npublic class Main {\n    public static void main(String[] args) {\n        final String regex = ${javaPat};\n        final String string = "example string";\n\n        final Pattern pattern = Pattern.compile(regex, ${javaFlags});\n        final Matcher matcher = pattern.matcher(string);\n\n        while (matcher.find()) {\n            System.out.println("Full match: " + matcher.group(0));\n            for (int i = 1; i <= matcher.groupCount(); i++) {\n                System.out.println("Group " + i + ": " + matcher.group(i));\n            }\n        }\n    }\n}`;

      case 'csharp':
        let csFlags = 'RegexOptions.None';
        if (flg.includes('i')) csFlags += ' | RegexOptions.IgnoreCase';
        if (flg.includes('m')) csFlags += ' | RegexOptions.Multiline';
        if (flg.includes('s')) csFlags += ' | RegexOptions.Singleline';
        return `using System;\nusing System.Text.RegularExpressions;\n\npublic class Program\n{\n    public static void Main()\n    {\n        string pattern = ${csPat};\n        string input = "example string";\n        RegexOptions options = ${csFlags};\n\n        foreach (Match m in Regex.Matches(input, pattern, options))\n        {\n            Console.WriteLine("Found '{0}' at value {1}", m.Value, m.Index);\n        }\n    }\n}`;

      default:
        return '';
    }
  };

  const output = useMemo(() => generateCode(pattern, flags, language), [pattern, flags, language]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleClear = useCallback(() => {
    setRegex('');
    setFlags('g');
  }, []);

  const handleCopyRef = useRef(handleCopy);
  const handleClearRef = useRef(handleClear);

  useEffect(() => {
    handleCopyRef.current = handleCopy;
    handleClearRef.current = handleClear;
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClearRef.current();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopyRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const extensions: Record<OutputLanguage, string> = { javascript: 'js', python: 'py', php: 'php', go: 'go', ruby: 'rb', java: 'java', csharp: 'cs' };
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `regex_code.${extensions[language]}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap gap-2">
          {(['javascript', 'python', 'php', 'go', 'ruby', 'java', 'csharp'] as OutputLanguage[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none capitalize ${
                language === lang
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {language === lang ? <Check className="w-4 h-4 inline mr-1" /> : null}
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="regex-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-500" /> {t('regexcode.pattern')}
              </label>
              <div className="flex gap-2 items-center">
                <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
                <button
                  onClick={handleClear}
                  disabled={!pattern}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all p-1.5 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xl">/</span>
                <input
                  id="regex-input"
                  type="text"
                  value={pattern}
                  onChange={(e) => setRegex(e.target.value)}
                  placeholder="[a-zA-Z0-9]+"
                  className="w-full pl-8 pr-12 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xl">/</span>
              </div>

              <div className="space-y-2">
                <label htmlFor="flags-input" className="text-xs font-bold text-slate-500 px-1">{t('regexcode.flags')}</label>
                <input
                  id="flags-input"
                  type="text"
                  value={flags}
                  onChange={(e) => setFlags(e.target.value)}
                  placeholder="gim"
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/10 space-y-4">
             <div className="flex items-center gap-3">
               <Info className="w-5 h-5 opacity-50" />
               <h4 className="text-lg font-black">{t('curlconverter.how_title')}</h4>
             </div>
             <p className="text-indigo-100 text-sm font-medium leading-relaxed">
               {t('regextester.quick_help')}
             </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="regex-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-500" /> {t('regexcode.output_title', { lang: language.charAt(0).toUpperCase() + language.slice(1) })}
            </label>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <kbd className="hidden sm:inline-flex items-center justify-center px-1 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-[8px] font-bold bg-white/50 dark:bg-black/20 ml-1">C</kbd>}
              </button>
            </div>
          </div>
          <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-8 border border-slate-800 h-[450px] overflow-auto group">
            {output ? (
              <pre id="regex-output" className="text-sm font-mono text-indigo-400 leading-relaxed whitespace-pre-wrap">{output}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                <Terminal className="w-12 h-12 opacity-10" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-40">{t('common.waiting')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
