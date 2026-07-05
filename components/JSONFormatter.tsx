import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Maximize2, Minimize2, Download, SortAsc, Wrench, ShieldCheck, Database, Code, Coffee, FileJson } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import yaml from 'js-yaml';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function JSONFormatter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [indentSize, setIndentSize] = useState(initialData?.indentSize || '2');
  const [sortKeys, setSortKeys] = useState(initialData?.sortKeys || false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [phpCopied, setPhpCopied] = useState(false);
  const [pythonCopied, setPythonCopied] = useState(false);
  const [csCopied, setCsCopied] = useState(false);
  const [javaCopied, setJavaCopied] = useState(false);
  const [yamlCopied, setYamlCopied] = useState(false);
  const [goCopied, setGoCopied] = useState(false);
  const [rustCopied, setRustCopied] = useState(false);
  const [avroCopied, setAvroCopied] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, indentSize, sortKeys });
  }, [input, output, indentSize, sortKeys]);

  const sortObjectKeys = useCallback((obj: any): any => {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
      }
      return obj;
    }

    return Object.keys(obj)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = sortObjectKeys(obj[key]);
        return acc;
      }, {});
  }, []);

  const escapeSnippetString = (str: string, quoteType: 'single' | 'double' = 'double') => {
    // Sentinel: Escape backslashes, control characters, and quotes to prevent breakout
    // from string literals or attributes in generated code snippets.
    const escaped = str
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');

    if (quoteType === 'single') {
      return escaped.replace(/'/g, "\\'");
    }
    return escaped.replace(/"/g, '\\"');
  };

  const handlePrettify = useCallback(() => {
    try {
      if (!input.trim() || input.length > MAX_LENGTH) return;
      let parsed = JSON.parse(input);
      if (sortKeys) {
        parsed = sortObjectKeys(parsed);
      }
      const indent = indentSize === 'tab' ? '\t' : Number(indentSize);
      const formatted = JSON.stringify(parsed, null, indent);
      setOutput(formatted);
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, sortKeys, sortObjectKeys, indentSize, t]);

  const handleCopyAsPython = useCallback(() => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);

      const toPython = (obj: any): string => {
        if (obj === null) return 'None';
        if (typeof obj === 'boolean') return obj ? 'True' : 'False';
        if (typeof obj === 'number') return JSON.stringify(obj);
        if (typeof obj === 'string') return `'${escapeSnippetString(obj, 'single')}'`;
        if (Array.isArray(obj)) {
          return `[${obj.map(toPython).join(', ')}]`;
        }
        if (typeof obj === 'object') {
          const entries = Object.entries(obj).map(([k, v]) => `'${escapeSnippetString(k, 'single')}': ${toPython(v)}`);
          return `{${entries.join(', ')}}`;
        }
        return 'None';
      };

      const pythonDict = toPython(parsed);
      navigator.clipboard.writeText(pythonDict);
      setPythonCopied(true);
      setTimeout(() => setPythonCopied(false), 2000);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, t]);

  const handleCopyAsAvro = useCallback(() => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      const recordNames = new Set<string>();

      const inferAvroType = (val: any, fieldName: string, depth: number, recordNames: Set<string>): any => {
        if (depth > 20) return "string";
        if (val === null) return ["null", "string"];

        if (Array.isArray(val)) {
          const itemType = val.length > 0 ? inferAvroType(val[0], fieldName + "Item", depth + 1, recordNames) : "string";
          return { type: "array", items: itemType };
        }

        if (typeof val === 'object') {
          let name = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
          let finalName = name;
          let counter = 1;
          while (recordNames.has(finalName)) {
            finalName = name + counter++;
          }
          recordNames.add(finalName);

          return {
            type: "record",
            name: finalName,
            fields: Object.entries(val).map(([key, value]) => ({
              name: key,
              type: inferAvroType(value, key, depth + 1, recordNames)
            }))
          };
        }

        if (typeof val === 'number') {
          if (Number.isInteger(val)) {
            return val > 2147483647 || val < -2147483648 ? "long" : "int";
          }
          return "double";
        }

        if (typeof val === 'boolean') return "boolean";
        return "string";
      };

      const avroSchema = {
        type: "record",
        name: "AutoGeneratedSchema",
        namespace: "com.example",
        fields: Object.entries(parsed).map(([key, value]) => ({
          name: key,
          type: inferAvroType(value, key, 1, recordNames)
        }))
      };

      navigator.clipboard.writeText(JSON.stringify(avroSchema, null, 2));
      setAvroCopied(true);
      setTimeout(() => setAvroCopied(false), 2000);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, t]);

  const handleCopyAsJava = useCallback(() => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);

      const toPascalCase = (str: string) => {
        return str
          .replace(/[^a-z0-9]/gi, ' ')
          .split(' ')
          .filter(Boolean)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('') || 'AutoGenerated';
      };

      const toCamelCase = (str: string) => {
        const pascal = toPascalCase(str);
        return pascal.charAt(0).toLowerCase() + pascal.slice(1);
      };

      const classes: any[] = [];
      const classNames = new Set<string>();

      const getJavaType = (val: any, fieldName: string, depth: number): string => {
        if (val === null || val === undefined) return 'Object';
        if (depth > 20) return 'Object';

        if (Array.isArray(val)) {
          const itemType = val.length > 0 ? getJavaType(val[0], fieldName, depth + 1) : 'Object';
          return `List<${itemType}>`;
        }

        if (typeof val === 'object') {
          let className = toPascalCase(fieldName);
          if (className === 'Root') className = 'RootObject';
          if (className === 'List' || className === 'Object') className += 'Item';

          let finalName = className;
          let counter = 1;
          while (classNames.has(finalName)) {
            finalName = className + counter++;
          }

          const fields = Object.entries(val).map(([key, value]) => {
            let name = toCamelCase(key);
            const keywords = ['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false', 'null'];
            if (keywords.includes(name) || /^[0-9]/.test(name)) {
              name = '_' + name;
            }
            return {
              name: name,
              type: getJavaType(value, key, depth + 1),
              originalKey: key
            };
          });

          classes.push({ name: finalName, fields });
          classNames.add(finalName);
          return finalName;
        }

        if (typeof val === 'number') return Number.isInteger(val) ? 'Integer' : 'Double';
        if (typeof val === 'boolean') return 'Boolean';
        return 'String';
      };

      getJavaType(parsed, 'Root', 0);

      let outputText = 'import com.fasterxml.jackson.annotation.JsonProperty;\nimport java.util.List;\n\n';
      classes.reverse().forEach((javaClass) => {
        outputText += `public class ${javaClass.name} {\n`;
        javaClass.fields.forEach((field: any) => {
          outputText += `    @JsonProperty("${escapeSnippetString(field.originalKey, 'double')}")\n`;
          outputText += `    private ${field.type} ${field.name};\n\n`;
        });

        javaClass.fields.forEach((field: any) => {
          const capitalized = field.name.charAt(0).toUpperCase() + field.name.slice(1);
          outputText += `    public ${field.type} get${capitalized}() { return ${field.name}; }\n`;
          outputText += `    public void set${capitalized}(${field.type} ${field.name}) { this.${field.name} = ${field.name}; }\n\n`;
        });
        outputText = outputText.trimEnd() + '\n}\n\n';
      });

      navigator.clipboard.writeText(outputText.trim());
      setJavaCopied(true);
      setTimeout(() => setJavaCopied(false), 2000);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, t]);

  const handleCopyAsCSharp = useCallback(() => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);

      const toPascalCase = (str: string) => {
        return str
          .replace(/[^a-z0-9]/gi, ' ')
          .split(' ')
          .filter(Boolean)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('') || 'AutoGenerated';
      };

      const classes: any[] = [];
      const classNames = new Set<string>();

      const getCSharpType = (val: any, fieldName: string, depth: number): string => {
        if (val === null || val === undefined) return 'object';
        if (depth > 20) return 'object';

        if (Array.isArray(val)) {
          const itemType = val.length > 0 ? getCSharpType(val[0], fieldName, depth + 1) : 'object';
          return `List<${itemType}>`;
        }

        if (typeof val === 'object') {
          let className = toPascalCase(fieldName);
          if (className === 'Root') className = 'RootObject';
          if (className === 'List' || className === 'Object') className += 'Item';

          let finalName = className;
          let counter = 1;
          while (classNames.has(finalName)) {
            finalName = className + counter++;
          }

          const fields = Object.entries(val).map(([key, value]) => {
            let name = toPascalCase(key);
            const keywords = ['abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock', 'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params', 'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'virtual', 'void', 'volatile', 'while'];
            if (keywords.includes(name.toLowerCase()) || /^[0-9]/.test(name)) {
              name = '@' + name;
            }
            return {
              name: name,
              type: getCSharpType(value, key, depth + 1),
              originalKey: key
            };
          });

          classes.push({ name: finalName, fields });
          classNames.add(finalName);
          return finalName;
        }

        if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'double';
        if (typeof val === 'boolean') return 'bool';
        return 'string';
      };

      getCSharpType(parsed, 'Root', 0);

      let outputText = 'using System.Text.Json.Serialization;\nusing System.Collections.Generic;\n\n';
      classes.reverse().forEach((csClass) => {
        outputText += `public class ${csClass.name}\n{\n`;
        csClass.fields.forEach((field: any) => {
          outputText += `    [JsonPropertyName("${escapeSnippetString(field.originalKey, 'double')}")]\n`;
          outputText += `    public ${field.type} ${field.name} { get; set; }\n\n`;
        });
        outputText = outputText.trimEnd() + '\n}\n\n';
      });

      navigator.clipboard.writeText(outputText.trim());
      setCsCopied(true);
      setTimeout(() => setCsCopied(false), 2000);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, t]);

  const handleFix = useCallback(() => {
    try {
      // Robust contextual repair logic that avoids modifying content inside strings
      const fixedInput = input
        // 1. Handle strings and keys (skip double quoted strings, convert single quoted to double, wrap unquoted keys)
        .replace(/"(?:\\.|[^"\\])*"|'([^'\\]*(?:\\.[^'\\]*)*)'|(\b\w+\b)\s*:/g, (match: string, p1: string | undefined, p2: string | undefined) => {
          if (match.startsWith('"')) return match; // Skip double quoted strings
          if (p1 !== undefined) {
            return '"' + p1.replace(/"/g, '\\"') + '"'; // Single quoted string to double
          }
          if (p2 !== undefined) {
            return '"' + p2 + '":'; // Unquoted key to double quoted
          }
          return match;
        })
        // 2. Handle trailing commas
        .replace(/"(?:\\.|[^"\\])*"|(,\s*[}\]])/g, (match: string, p1: string | undefined) => {
          if (match.startsWith('"')) return match;
          return p1?.slice(1) || '';
        });

      const parsed = JSON.parse(fixedInput);
      setInput(JSON.stringify(parsed, null, indentSize === 'tab' ? '\t' : Number(indentSize)));
      setError('');
      setFixed(true);
      setTimeout(() => setFixed(false), 2000);
    } catch (e: any) {
      setError(t('jsonformatter.error_repair') + e.message);
    }
  }, [input, indentSize, t]);

  const handleMinify = useCallback(() => {
    try {
      if (!input.trim() || input.length > MAX_LENGTH) return;
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed);
      setOutput(formatted);
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, t]);

  const handleValidate = useCallback(() => {
    try {
      if (!input.trim()) return;
      JSON.parse(input);
      setError('');
      setValidated(true);
      setTimeout(() => setValidated(false), 2000);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, t]);

  const handleCopyAsPHP = useCallback(() => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);

      const toPHP = (obj: any): string => {
        if (obj === null) return 'null';
        if (typeof obj === 'string') return `'${escapeSnippetString(obj, 'single')}'`;
        if (typeof obj === 'number' || typeof obj === 'boolean') return JSON.stringify(obj);
        if (Array.isArray(obj)) {
          return `[${obj.map(toPHP).join(', ')}]`;
        }
        if (typeof obj === 'object') {
          const entriesPHP = Object.entries(obj).map(([k, v]) => `'${escapeSnippetString(k, 'single')}' => ${toPHP(v)}`);
          return `[${entriesPHP.join(', ')}]`;
        }
        return 'null';
      };

      const phpArray = toPHP(parsed);
      navigator.clipboard.writeText(phpArray);
      setPhpCopied(true);
      setTimeout(() => setPhpCopied(false), 2000);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, t]);

  const handleCopyAsYAML = useCallback(() => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      const yamlString = yaml.dump(parsed, { indent: 2 });
      navigator.clipboard.writeText(yamlString);
      setYamlCopied(true);
      setTimeout(() => setYamlCopied(false), 2000);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, t]);

  const handleCopyAsGo = useCallback(() => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);

      const toPascalCase = (str: string) => {
        return str
          .replace(/[^a-z0-9]/gi, ' ')
          .split(' ')
          .filter(Boolean)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('') || 'AutoGenerated';
      };

      const structs: string[] = [];
      const structNames = new Set<string>();

      const sanitizeGoIdentifier = (str: string) => {
        let sanitized = toPascalCase(str);
        if (/^[0-9]/.test(sanitized)) sanitized = 'Field' + sanitized;
        return sanitized;
      };

      const getGoType = (val: any, fieldName: string, depth: number): string => {
        if (val === null || val === undefined) return 'interface{}';
        if (depth > 20) return 'interface{}';

        if (Array.isArray(val)) {
          const itemType = val.length > 0 ? getGoType(val[0], fieldName, depth + 1) : 'interface{}';
          return `[]${itemType}`;
        }

        if (typeof val === 'object') {
          let className = sanitizeGoIdentifier(fieldName);
          if (className === 'Root') className = 'RootObject';

          let finalName = className;
          let counter = 1;
          while (structNames.has(finalName)) {
            finalName = className + counter++;
          }

          const fields = Object.entries(val).map(([key, value]) => {
            let name = sanitizeGoIdentifier(key);
            return `    ${name} ${getGoType(value, key, depth + 1)} \`json:"${escapeSnippetString(key, 'double')}"\``;
          });

          structs.push(`type ${finalName} struct {\n${fields.join('\n')}\n}`);
          structNames.add(finalName);
          return finalName;
        }

        if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float64';
        if (typeof val === 'boolean') return 'bool';
        return 'string';
      };

      getGoType(parsed, 'Root', 0);
      navigator.clipboard.writeText(structs.reverse().join('\n\n'));
      setGoCopied(true);
      setTimeout(() => setGoCopied(false), 2000);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, t]);

  const handleCopyAsRust = useCallback(() => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);

      const toPascalCase = (str: string) => {
        return str
          .replace(/[^a-z0-9]/gi, ' ')
          .split(' ')
          .filter(Boolean)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('') || 'AutoGenerated';
      };

      const toSnakeCase = (str: string) => {
        return str
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase();
      };

      const structs: string[] = [];
      const structNames = new Set<string>();

      const sanitizeRustIdentifier = (str: string) => {
        let sanitized = toSnakeCase(str);
        const keywords = ['as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while', 'async', 'await', 'dyn', 'abstract', 'become', 'box', 'do', 'final', 'macro', 'override', 'priv', 'typeof', 'unsized', 'virtual', 'yield', 'try'];

        if (/^[0-9]/.test(sanitized)) {
          sanitized = `field_${sanitized}`;
        } else if (keywords.includes(sanitized)) {
          sanitized = `r#${sanitized}`;
        }

        return sanitized;
      };

      const getRustType = (val: any, fieldName: string, depth: number): string => {
        if (val === null || val === undefined) return 'Option<serde_json::Value>';
        if (depth > 20) return 'serde_json::Value';

        if (Array.isArray(val)) {
          const itemType = val.length > 0 ? getRustType(val[0], fieldName, depth + 1) : 'serde_json::Value';
          return `Vec<${itemType}>`;
        }

        if (typeof val === 'object') {
          let className = toPascalCase(fieldName);
          if (className === 'Root') className = 'RootObject';

          let finalName = className;
          let counter = 1;
          while (structNames.has(finalName)) {
            finalName = className + counter++;
          }

          const fields = Object.entries(val).map(([key, value]) => {
            const rustKey = sanitizeRustIdentifier(key);
            const type = getRustType(value, key, depth + 1);
            if (rustKey !== key || rustKey.startsWith('r#')) {
               return `    #[serde(rename = "${escapeSnippetString(key, 'double')}")]\n    pub ${rustKey}: ${type},`;
            }
            return `    pub ${rustKey}: ${type},`;
          });

          structs.push(`#[derive(Serialize, Deserialize)]\npub struct ${finalName} {\n${fields.join('\n')}\n}`);
          structNames.add(finalName);
          return finalName;
        }

        if (typeof val === 'number') return Number.isInteger(val) ? 'i64' : 'f64';
        if (typeof val === 'boolean') return 'bool';
        return 'String';
      };

      getRustType(parsed, 'Root', 0);
      navigator.clipboard.writeText(`use serde::{Serialize, Deserialize};\n\n${structs.reverse().join('\n\n')}`);
      setRustCopied(true);
      setTimeout(() => setRustCopied(false), 2000);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    inputRef.current?.focus();
  }, []);

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError('');
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('jsonformatter.input_label')}
                <span className="ml-2 lowercase font-medium opacity-70">
                  ({input.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()})
                </span>
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                aria-label={t('common.clear')}
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handlePrettify();
              }
            }}
            placeholder='{"key": "value"}'
            className={`w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border ${error.includes('trop longue') ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-3xl outline-none focus:ring-2 ${error.includes('trop longue') ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <label htmlFor="json-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.output')}</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('common.download')}
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="json-output"
            value={output}
            readOnly
            placeholder={t('jsonformatter.placeholder_output')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center items-center">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          {[
            { label: t('jsonformatter.indent_2'), value: '2' },
            { label: t('jsonformatter.indent_4'), value: '4' },
            { label: t('jsonformatter.indent_tab'), value: 'tab' }
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setIndentSize(opt.value)}
              aria-pressed={indentSize === opt.value}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                indentSize === opt.value
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortKeys(!sortKeys)}
          aria-pressed={sortKeys}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border ${
            sortKeys
              ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
              : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          <SortAsc className="w-4 h-4" /> {t('jsonformatter.sort_keys')}
        </button>

        <button
          onClick={handleCopyAsAvro}
          disabled={!input.trim()}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
            avroCopied
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
            : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          {avroCopied ? <Check className="w-4 h-4" /> : <Database className="w-4 h-4" />}
          {avroCopied ? t('common.copied') : t('jsonformatter.copy_avro')}
        </button>

        <button
          onClick={handleFix}
          disabled={!input.trim()}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
            fixed
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
              : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          {fixed ? <Check className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
          {fixed ? t('jsonformatter.fixed_success') : t('jsonformatter.fix')}
        </button>

        <button
          onClick={handleValidate}
          disabled={!input.trim()}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
            validated
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
              : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          {validated ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          {validated ? t('jsonformatter.valid') : t('jsonformatter.validate')}
        </button>

        <button
          onClick={handleCopyAsPHP}
          disabled={!input.trim()}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
            phpCopied
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
            : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          {phpCopied ? <Check className="w-4 h-4" /> : <Database className="w-4 h-4" />}
          {phpCopied ? t('common.copied') : t('jsonformatter.copy_php')}
        </button>

        <button
          onClick={handleCopyAsPython}
          disabled={!input.trim()}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
            pythonCopied
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
            : 'text-slate-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          {pythonCopied ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          {pythonCopied ? t('common.copied') : t('jsonformatter.copy_python')}
        </button>

        <button
          onClick={handleCopyAsCSharp}
          disabled={!input.trim()}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
            csCopied
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
            : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          {csCopied ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          {csCopied ? t('common.copied') : t('jsonformatter.copy_csharp')}
        </button>

        <button
          onClick={handleCopyAsJava}
          disabled={!input.trim()}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
            javaCopied
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
            : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          {javaCopied ? <Check className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
          {javaCopied ? t('common.copied') : t('jsonformatter.copy_java')}
        </button>

        <button
          onClick={handleCopyAsYAML}
          disabled={!input.trim()}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
            yamlCopied
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
            : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          {yamlCopied ? <Check className="w-4 h-4" /> : <FileJson className="w-4 h-4" />}
          {yamlCopied ? t('common.copied') : t('jsonformatter.copy_yaml')}
        </button>

        <button
          onClick={handleCopyAsGo}
          disabled={!input.trim()}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
            goCopied
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
            : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          {goCopied ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          {goCopied ? t('common.copied') : t('jsonformatter.copy_go')}
        </button>

        <button
          onClick={handleCopyAsRust}
          disabled={!input.trim()}
          className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
            rustCopied
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
            : 'text-slate-600 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
          }`}
        >
          {rustCopied ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          {rustCopied ? t('common.copied') : t('jsonformatter.copy_rust')}
        </button>

        <button
          onClick={handlePrettify}
          disabled={!input.trim()}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Maximize2 className="w-5 h-5" /> {t('jsonformatter.beautify')}
          <Kbd className="ml-2 hidden sm:inline-flex border-white/20 bg-white/10 text-white">Enter</Kbd>
        </button>
        <button
          onClick={handleMinify}
          disabled={!input.trim()}
          className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Minimize2 className="w-5 h-5" /> {t('jsonformatter.minify')}
        </button>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">{t('jsonformatter.tips_title')}</h4>
        <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1 list-disc list-inside">
          <li>{t('jsonformatter.tip_1')}</li>
          <li>{t('jsonformatter.tip_2')}</li>
          <li>{t('jsonformatter.tip_3')}</li>
        </ul>
      </div>
    </div>
  );
}
