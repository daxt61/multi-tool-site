import { useState, useEffect, useCallback } from 'react';
import { Type, Copy, Check, Trash2, RefreshCw, Info, Share2, Download } from 'lucide-react';

const UPSIDE_DOWN_MAP: Record<string, string> = {
  'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ', 'i': 'ᴉ', 'j': 'ɾ',
  'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u', 'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ',
  'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
  'A': '∀', 'B': 'B', 'C': 'Ɔ', 'D': 'D', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': 'פ', 'H': 'H', 'I': 'I', 'J': 'Ր',
  'K': 'ʞ', 'L': '˥', 'M': 'W', 'N': 'N', 'O': 'O', 'P': 'Ԁ', 'Q': 'Ό', 'R': 'ᴚ', 'S': 'S', 'T': '┴',
  'U': '∩', 'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z',
  '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ', '8': '8', '9': '6', '0': '0',
  '.': '˙', ',': '\'', '\'': ',', '"': '„', '?': '¿', '!': '¡', '(': ')', ')': '(', '[': ']', ']': '[',
  '{': '}', '}': '{', '<': '>', '>': '<', '&': '⅋', '_': '‾'
};

const BUBBLE_MAP: Record<string, string> = {
  'a': 'ⓐ', 'b': 'ⓑ', 'c': 'ⓒ', 'd': 'ⓓ', 'e': 'ⓔ', 'f': 'ⓕ', 'g': 'ⓖ', 'h': 'ⓗ', 'i': 'ⓘ', 'j': 'ⓙ',
  'k': 'ⓚ', 'l': 'ⓛ', 'm': 'ⓜ', 'n': 'ⓝ', 'o': 'ⓞ', 'p': 'ⓟ', 'q': 'ⓠ', 'r': 'ⓡ', 's': 'ⓢ', 't': 'ⓣ',
  'u': 'ⓤ', 'v': 'ⓥ', 'w': 'ⓦ', 'x': 'ⓧ', 'y': 'ⓨ', 'z': 'ⓩ',
  'A': 'Ⓐ', 'B': 'Ⓑ', 'C': 'Ⓒ', 'D': 'Ⓓ', 'E': 'Ⓔ', 'F': 'Ⓕ', 'G': 'Ⓖ', 'H': 'Ⓗ', 'I': 'Ⓘ', 'J': 'Ⓙ',
  'K': 'Ⓚ', 'L': 'Ⓛ', 'M': 'Ⓜ', 'N': 'Ⓝ', 'O': 'Ⓞ', 'P': 'Ⓟ', 'Q': 'Ⓠ', 'R': 'Ⓡ', 'S': 'Ⓢ', 'T': 'Ⓣ',
  'U': 'Ⓤ', 'V': 'Ⓥ', 'W': 'Ⓦ', 'X': 'Ⓧ', 'Y': 'Ⓨ', 'Z': 'Ⓩ',
  '1': '①', '2': '②', '3': '③', '4': '④', '5': '⑤', '6': '⑥', '7': '⑦', '8': '⑧', '9': '⑨', '0': '⓪'
};

const SMALL_CAPS_MAP: Record<string, string> = {
  'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ',
  'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ',
  'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
};

type TransformType = 'reverse' | 'upsideDown' | 'bubble' | 'smallCaps' | 'zalgo';

const ZALGO_UP = ['\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306', '\u0310', '\u0352', '\u0357', '\u0351', '\u0307', '\u0308', '\u030a', '\u0342', '\u0343', '\u0344', '\u034a', '\u034b', '\u034c', '\u0303', '\u0302', '\u030c', '\u0350', '\u0300', '\u0301', '\u030b', '\u030f', '\u0312', '\u0313', '\u0314', '\u033d', '\u0309', '\u0363', '\u0364', '\u0365', '\u0366', '\u0367', '\u0368', '\u0369', '\u036a', '\u036b', '\u036c', '\u036d', '\u036e', '\u036f', '\u033e', '\u035b', '\u0346', '\u031a'];
const ZALGO_MID = ['\u0315', '\u031b', '\u0324', '\u0325', '\u0326', '\u0327', '\u0328', '\u032d', '\u032e', '\u0330', '\u0331', '\u0332', '\u0333', '\u0334', '\u0335', '\u0336', '\u0337', '\u0338', '\u0339', '\u033a', '\u033b', '\u033c', '\u0345', '\u0347', '\u0348', '\u0349', '\u034d', '\u034e', '\u0353', '\u0354', '\u0355', '\u0356', '\u0359', '\u035a', '\u0323'];
const ZALGO_DOWN = ['\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e', '\u031f', '\u0320', '\u0321', '\u0322', '\u0327', '\u0328', '\u0329', '\u032a', '\u032b', '\u032c', '\u032d', '\u032e', '\u032f', '\u0330', '\u0331', '\u0332', '\u0333', '\u0339', '\u033a', '\u033b', '\u033c', '\u0345', '\u0347', '\u0348', '\u0349', '\u034d', '\u034e', '\u0353', '\u0354', '\u0355', '\u0356', '\u0359', '\u035a', '\u035c', '\u035d', '\u035e', '\u035f', '\u0360', '\u0361', '\u0362'];

export function TextTransformer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [input, setInput] = useState(initialData?.input || '');
  const [transform, setTransform] = useState<TransformType>(initialData?.transform || 'reverse');
  const [intensity, setIntensity] = useState(initialData?.intensity || 5);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, transform, intensity });
  }, [input, transform, intensity]);

  const applyTransform = useCallback((text: string, type: TransformType, lvl: number) => {
    switch (type) {
      case 'reverse':
        return text.split('').reverse().join('');
      case 'upsideDown':
        return text.split('').map(char => UPSIDE_DOWN_MAP[char] || char).reverse().join('');
      case 'bubble':
        return text.split('').map(char => BUBBLE_MAP[char] || char).join('');
      case 'smallCaps':
        return text.split('').map(char => SMALL_CAPS_MAP[char.toLowerCase()] || char).join('');
      case 'zalgo':
        return text.split('').map(char => {
          if (/\s/.test(char)) return char;
          let result = char;
          for (let i = 0; i < lvl; i++) {
            result += ZALGO_UP[Math.floor(Math.random() * ZALGO_UP.length)];
            result += ZALGO_MID[Math.floor(Math.random() * ZALGO_MID.length)];
            result += ZALGO_DOWN[Math.floor(Math.random() * ZALGO_DOWN.length)];
          }
          return result;
        }).join('');
      default:
        return text;
    }
  }, []);

  useEffect(() => {
    setOutput(applyTransform(input, transform, intensity));
  }, [input, transform, intensity, applyTransform]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `text-transform-${transform}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="transformer-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-500" /> Texte à transformer
          </label>
          <button
            onClick={handleClear}
            disabled={!input}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="transformer-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Entrez votre texte ici..."
          className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'reverse', label: 'Inverser' },
            { id: 'upsideDown', label: 'Tête en bas' },
            { id: 'bubble', label: 'Bulles' },
            { id: 'smallCaps', label: 'Petites Caps' },
            { id: 'zalgo', label: 'Zalgo (Glitch)' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setTransform(type.id as TransformType)}
              aria-pressed={transform === type.id}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                transform === type.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {transform === 'zalgo' && (
        <div className="max-w-xs mx-auto space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="zalgo-intensity" className="text-xs font-black uppercase tracking-widest text-slate-400">Intensité du Glitch</label>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{intensity}</span>
          </div>
          <input
            id="zalgo-intensity"
            type="range"
            min="1"
            max="15"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="transformer-output" className="text-xs font-black uppercase tracking-widest text-slate-400">Résultat</label>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={!output}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Download className="w-3 h-3" /> Télécharger
            </button>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>
        <div
          id="transformer-output"
          className="w-full min-h-[160px] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-lg leading-relaxed dark:text-white break-all whitespace-pre-wrap font-mono"
        >
          {output || <span className="text-slate-400 italic">Le texte transformé apparaîtra ici...</span>}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">À propos des transformations</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cet outil utilise des caractères Unicode spéciaux pour créer des effets visuels amusants ou utiles. Notez que certains caractères transformés (comme le texte à l'envers ou les bulles) peuvent ne pas être lus correctement par les lecteurs d'écran ou s'afficher différemment selon les polices.
          </p>
        </div>
      </div>
    </div>
  );
}
