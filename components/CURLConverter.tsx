import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Copy, Check, Trash2, AlertCircle, Code, Download, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000; // 100KB

type OutputLanguage = 'fetch' | 'axios' | 'python' | 'php' | 'go' | 'ruby' | 'java' | 'csharp';

export function CURLConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState<OutputLanguage>(initialData?.language || 'fetch');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, language });
  }, [input, language, onStateChange]);

  const generateFetch = (url: string, method: string, headers: Record<string, string>, data: string | null) => {
    let code = `fetch(${JSON.stringify(url)}, {\n`;
    code += `  method: ${JSON.stringify(method)},\n`;
    if (Object.keys(headers).length > 0) {
      code += `  headers: {\n`;
      Object.entries(headers).forEach(([k, v]) => {
        code += `    ${JSON.stringify(k)}: ${JSON.stringify(v)},\n`;
      });
      code += `  },\n`;
    }
    if (data) code += `  body: ${JSON.stringify(data)},\n`;
    code += `})\n.then(response => response.json())\n.then(data => console.log(data))\n.catch(error => console.error('Error:', error));`;
    return code;
  };

  const generateAxios = (url: string, method: string, headers: Record<string, string>, data: string | null) => {
    let code = `axios({\n`;
    code += `  method: ${JSON.stringify(method.toLowerCase())},\n`;
    code += `  url: ${JSON.stringify(url)},\n`;
    if (Object.keys(headers).length > 0) {
      code += `  headers: {\n`;
      Object.entries(headers).forEach(([k, v]) => {
        code += `    ${JSON.stringify(k)}: ${JSON.stringify(v)},\n`;
      });
      code += `  },\n`;
    }
    if (data) {
      try {
        const jsonData = JSON.parse(data);
        code += `  data: ${JSON.stringify(jsonData, null, 2).split('\n').join('\n  ')},\n`;
      } catch {
        code += `  data: ${JSON.stringify(data)},\n`;
      }
    }
    code += `})\n.then(response => console.log(response.data))\n.catch(error => console.error(error));`;
    return code;
  };

  const toPythonLiteral = (val: any): string => {
    if (val === null) return 'None';
    if (val === true) return 'True';
    if (val === false) return 'False';
    if (Array.isArray(val)) {
      return `[${val.map(toPythonLiteral).join(', ')}]`;
    }
    if (typeof val === 'object') {
      const entries = Object.entries(val).map(([k, v]) => `${JSON.stringify(k)}: ${toPythonLiteral(v)}`);
      return `{${entries.join(', ')}}`;
    }
    return JSON.stringify(val);
  };

  const generatePython = (url: string, method: string, headers: Record<string, string>, data: string | null) => {
    let code = `import requests\n\n`;
    code += `url = ${JSON.stringify(url)}\n`;
    if (Object.keys(headers).length > 0) {
      code += `headers = {\n`;
      Object.entries(headers).forEach(([k, v]) => {
        code += `    ${JSON.stringify(k)}: ${JSON.stringify(v)},\n`;
      });
      code += `}\n`;
    }
    if (data) {
      try {
        const jsonData = JSON.parse(data);
        code += `payload = ${toPythonLiteral(jsonData)}\n`;
      } catch {
        code += `payload = ${JSON.stringify(data)}\n`;
      }
    }

    code += `response = requests.request(\n`;
    code += `    method=${JSON.stringify(method)},\n`;
    code += `    url=url,\n`;
    if (Object.keys(headers).length > 0) code += `    headers=headers,\n`;
    if (data) code += `    json=payload\n`;
    code += `)\n\nprint(response.json())`;
    return code;
  };

  const toPHPLiteral = (val: string) => {
    // Sentinel: Use single quotes in PHP to prevent variable interpolation ($var)
    // and only escape backslashes and single quotes.
    return `'${val.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  };

  const generatePHP = (url: string, method: string, headers: Record<string, string>, data: string | null) => {
    let code = `<?php\n\n$ch = curl_init();\n\n`;
    code += `curl_setopt($ch, CURLOPT_URL, ${toPHPLiteral(url)});\n`;
    code += `curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n`;
    code += `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, ${toPHPLiteral(method)});\n`;

    if (Object.keys(headers).length > 0) {
      code += `$headers = [\n`;
      Object.entries(headers).forEach(([k, v]) => {
        code += `    ${toPHPLiteral(k + ': ' + v)},\n`;
      });
      code += `];\n`;
      code += `curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);\n`;
    }

    if (data) {
      code += `curl_setopt($ch, CURLOPT_POSTFIELDS, ${toPHPLiteral(data)});\n`;
    }

    code += `\n$response = curl_exec($ch);\ncurl_close($ch);\n\necho $response;`;
    return code;
  };

  const generateGo = (url: string, method: string, headers: Record<string, string>, data: string | null) => {
    let code = `package main\n\nimport (\n\t"fmt"\n\t"io"\n\t"net/http"\n`;
    if (data) code += `\t"strings"\n`;
    code += `)\n\nfunc main() {\n\tclient := &http.Client{}\n`;

    if (data) {
      code += `\tvar data = strings.NewReader(\`${data.replace(/`/g, '` + "`" + `')}\`)\n`;
      code += `\treq, err := http.NewRequest(${JSON.stringify(method)}, ${JSON.stringify(url)}, data)\n`;
    } else {
      code += `\treq, err := http.NewRequest(${JSON.stringify(method)}, ${JSON.stringify(url)}, nil)\n`;
    }

    code += `\tif err != nil {\n\t\tpanic(err)\n\t}\n`;

    Object.entries(headers).forEach(([k, v]) => {
      code += `\treq.Header.Set(${JSON.stringify(k)}, ${JSON.stringify(v)})\n`;
    });

    code += `\tresp, err := client.Do(req)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer resp.Body.Close()\n`;
    code += `\tbodyText, err := io.ReadAll(resp.Body)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tfmt.Printf("%s\\n", bodyText)\n}`;
    return code;
  };

  const toRubyLiteral = (val: string) => {
    return `'${val.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  };

  const generateRuby = (url: string, method: string, headers: Record<string, string>, data: string | null) => {
    let code = `require 'net/http'\nrequire 'uri'\n\n`;
    code += `uri = URI.parse(${toRubyLiteral(url)})\n`;
    // method is typically GET, POST, etc. but we should still be safe.
    // Net::HTTP expects a class name like Get, Post, etc.
    const rubyMethodClass = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
    code += `request = Net::HTTP::${rubyMethodClass.replace(/[^A-Za-z]/g, '')}.new(uri)\n`;

    Object.entries(headers).forEach(([k, v]) => {
      code += `request[${toRubyLiteral(k)}] = ${toRubyLiteral(v)}\n`;
    });

    if (data) {
      code += `request.body = ${toRubyLiteral(data)}\n`;
    }

    code += `\nresponse = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|\n  http.request(request)\nend\n\nputs response.body`;
    return code;
  };

  const generateJavaOkHttp = (url: string, method: string, headers: Record<string, string>, data: string | null) => {
    let code = `import okhttp3.*;\nimport java.io.IOException;\n\npublic class Main {\n`;
    code += `  public static void main(String[] args) throws IOException {\n`;
    code += `    OkHttpClient client = new OkHttpClient().newBuilder().build();\n`;

    if (data) {
      code += `    MediaType mediaType = MediaType.parse(${JSON.stringify(headers['Content-Type'] || 'text/plain')});\n`;
      code += `    RequestBody body = RequestBody.create(mediaType, ${JSON.stringify(data)});\n`;
    }

    code += `    Request request = new Request.Builder()\n`;
    code += `      .url(${JSON.stringify(url)})\n`;
    code += `      .method(${JSON.stringify(method)}, ${data ? 'body' : 'null'})\n`;

    Object.entries(headers).forEach(([k, v]) => {
      code += `      .addHeader(${JSON.stringify(k)}, ${JSON.stringify(v)})\n`;
    });

    code += `      .build();\n`;
    code += `    Response response = client.newCall(request).execute();\n`;
    code += `    System.out.println(response.body().string());\n`;
    code += `  }\n}`;
    return code;
  };

  const generateCSharpRestSharp = (url: string, method: string, headers: Record<string, string>, data: string | null) => {
    let code = `using RestSharp;\n\nvar client = new RestClient(${JSON.stringify(url)});\n`;
    code += `var request = new RestRequest(Method.${method.toUpperCase()});\n`;

    Object.entries(headers).forEach(([k, v]) => {
      code += `request.AddHeader(${JSON.stringify(k)}, ${JSON.stringify(v)});\n`;
    });

    if (data) {
      code += `request.AddParameter(${JSON.stringify(headers['Content-Type'] || 'text/plain')}, ${JSON.stringify(data)}, ParameterType.RequestBody);\n`;
    }

    code += `IRestResponse response = client.Execute(request);\n`;
    code += `Console.WriteLine(response.Content);`;
    return code;
  };

  const parseCURL = useCallback((curl: string, lang: OutputLanguage) => {
    if (!curl.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const urlMatch = curl.match(/curl\s+.*?['"]?(https?:\/\/[^\s'"]+)['"]?/);
      if (!urlMatch) {
        throw new Error(t('curlconverter.error_invalid_curl'));
      }

      const url = urlMatch[1];
      const methodMatch = curl.match(/-X\s+(\w+)/);
      const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

      const headers: Record<string, string> = {};
      const headerMatches = curl.matchAll(/-H\s+['"]([^'"]+)['"]/g);
      for (const match of headerMatches) {
        const [key, ...valueParts] = match[1].split(':');
        headers[key.trim()] = valueParts.join(':').trim();
      }

      const dataMatch = curl.match(/(?:-d|--data|--data-raw)\s+['"]?([\s\S]+?)['"]?(?:\s+-[A-Z]|$)/);
      const data = dataMatch ? dataMatch[1] : null;

      let code = '';
      switch (lang) {
        case 'fetch': code = generateFetch(url, method, headers, data); break;
        case 'axios': code = generateAxios(url, method, headers, data); break;
        case 'python': code = generatePython(url, method, headers, data); break;
        case 'php': code = generatePHP(url, method, headers, data); break;
        case 'go': code = generateGo(url, method, headers, data); break;
        case 'ruby': code = generateRuby(url, method, headers, data); break;
        case 'java': code = generateJavaOkHttp(url, method, headers, data); break;
        case 'csharp': code = generateCSharpRestSharp(url, method, headers, data); break;
      }

      setOutput(code);
      setError(null);
    } catch (e: any) {
      setError(t('curlconverter.error_conversion'));
      setOutput('');
    }
  }, [t]);

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
    } else {
      parseCURL(input, language);
    }
  }, [input, language, parseCURL, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
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
    const extensions: Record<OutputLanguage, string> = { fetch: 'js', axios: 'js', python: 'py', php: 'php', go: 'go', ruby: 'rb', java: 'java', csharp: 'cs' };
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `request.${extensions[language]}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap gap-2">
          {(['fetch', 'axios', 'python', 'php', 'go', 'ruby', 'java', 'csharp'] as OutputLanguage[]).map((lang) => (
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
              {lang === 'php' ? 'PHP cURL' : lang === 'python' ? 'Python Requests' : lang === 'java' ? 'Java OkHttp' : lang === 'csharp' ? 'C# RestSharp' : lang}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="curl-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" /> {t('curlconverter.curl_command')}
            </label>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                disabled={!input}
                aria-label={t('common.clear')}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-transparent px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="curl-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='curl https://api.example.com/v1/data -H "Authorization: Bearer token"'
            className={`w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-[2rem] outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="output-area" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-500" /> {language === 'python' ? 'Python' : language === 'php' ? 'PHP' : language === 'java' ? 'Java' : language === 'csharp' ? 'C#' : 'JavaScript'} Output
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold bg-white/50 dark:bg-black/20 ml-1">C</kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="output-area"
            value={output}
            readOnly
            placeholder={t('curlconverter.placeholder_output')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
         <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Info className="w-6 h-6" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">{t('curlconverter.how_title')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('curlconverter.how_text')}
            </p>
         </div>
      </div>
    </div>
  );
}
