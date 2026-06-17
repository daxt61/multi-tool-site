import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Key, Copy, Check, Trash2, Info, Grid3X3, ArrowDownUp } from 'lucide-react';

const MAX_LENGTH = 5000;

export function PlayfairCipher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [key, setKey] = useState(initialData?.key || 'KEYWORD');
  const [isEncrypt, setIsEncrypt] = useState(initialData?.isEncrypt ?? true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ text, key, isEncrypt });
  }, [text, key, isEncrypt, onStateChange]);

  const matrix = useMemo(() => {
    const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // J is omitted, usually merged with I
    const cleanKey = key.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    const seen = new Set<string>();
    const result: string[] = [];

    // Add key to matrix
    for (const char of cleanKey) {
      if (!seen.has(char)) {
        seen.add(char);
        result.push(char);
      }
    }

    // Add remaining alphabet
    for (const char of alphabet) {
      if (!seen.has(char)) {
        seen.add(char);
        result.push(char);
      }
    }

    // Convert to 2D matrix
    const grid: string[][] = [];
    for (let i = 0; i < 5; i++) {
      grid.push(result.slice(i * 5, (i + 1) * 5));
    }
    return grid;
  }, [key]);

  const processText = (input: string, grid: string[][], encrypt: boolean) => {
    if (!input) return '';
    let cleanText = input.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');

    // Prepare digraphs for encryption
    if (encrypt) {
      let prepared = '';
      for (let i = 0; i < cleanText.length; i++) {
        prepared += cleanText[i];
        if (i + 1 < cleanText.length && cleanText[i] === cleanText[i + 1]) {
          prepared += 'X';
        }
      }
      if (prepared.length % 2 !== 0) prepared += 'X';
      cleanText = prepared;
    }

    // Optimization: flattened grid for faster lookups
    const posMap: Record<string, [number, number]> = {};
    grid.forEach((row, r) => row.forEach((char, c) => posMap[char] = [r, c]));

    let result = '';
    for (let i = 0; i < cleanText.length; i += 2) {
      const a = cleanText[i];
      const b = cleanText[i + 1];
      const [r1, c1] = posMap[a];
      const [r2, c2] = posMap[b];

      if (r1 === r2) {
        // Same row
        const offset = encrypt ? 1 : 4;
        result += grid[r1][(c1 + offset) % 5];
        result += grid[r2][(c2 + offset) % 5];
      } else if (c1 === c2) {
        // Same column
        const offset = encrypt ? 1 : 4;
        result += grid[(r1 + offset) % 5][c1];
        result += grid[(r2 + offset) % 5][c2];
      } else {
        // Rectangle
        result += grid[r1][c2];
        result += grid[r2][c1];
      }
    }

    return result;
  };

  const output = useMemo(() => {
    if (!text) return '';
    if (text.length > MAX_LENGTH) return t('error.max_length', { max: MAX_LENGTH.toLocaleString() });
    return processText(text, matrix, isEncrypt);
  }, [text, matrix, isEncrypt, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Key Input */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Key className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('playfair.key_label', 'Cipher Key')}
              </h3>
            </div>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="SECRET"
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono font-bold uppercase tracking-widest"
            />

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
              <button
                onClick={() => setIsEncrypt(true)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${isEncrypt ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('common.encrypt')}
              </button>
              <button
                onClick={() => setIsEncrypt(false)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${!isEncrypt ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('common.decrypt')}
              </button>
            </div>
          </div>

          {/* Text Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="playfair-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {isEncrypt ? t('common.input') : t('common.output')}
                </label>
                <button
                  onClick={handleClear}
                  className="text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2 py-1 rounded-lg"
                >
                  {t('common.clear')}
                </button>
              </div>
              <textarea
                id="playfair-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('playfair.input_placeholder', 'Enter text to process...')}
                className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="playfair-output" className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {isEncrypt ? t('common.result') : t('common.input')}
                </label>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all text-xs font-bold ${copied ? 'text-emerald-500 bg-emerald-50' : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'} disabled:opacity-50`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <div className="w-full h-80 p-6 bg-slate-900 text-indigo-100 border border-slate-800 rounded-3xl overflow-auto font-mono text-sm leading-relaxed break-all">
                {output || <span className="text-slate-600 italic">{t('common.waiting')}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Matrix Visualization */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Grid3X3 className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('playfair.matrix_preview', '5x5 Matrix')}
              </h3>
            </div>
            <div className="grid grid-cols-5 gap-2 aspect-square">
              {matrix.flat().map((char, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl font-mono font-black text-lg dark:text-white"
                >
                  {char}
                </div>
              ))}
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase">
                <Info className="w-3.5 h-3.5" /> {t('playfair.note_title', 'Cipher Note')}
              </div>
              <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 italic">
                {t('playfair.note_text', "Note: 'J' is replaced by 'I' in the matrix. Digraphs with identical letters are separated by 'X'. Final odd letters are padded with 'X'.")}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
             <h4 className="font-bold dark:text-white">{t('playfair.about_title', 'About Playfair')}</h4>
             <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
               {t('playfair.about_text', 'The Playfair cipher is the first practical digraph substitution cipher. Invented in 1854, it was used for tactical purposes by British forces in the Second Boer War and World War I.')}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
