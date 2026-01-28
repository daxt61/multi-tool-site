import { useState } from 'react';
import { Shuffle, Copy, Check, RefreshCw, Hash, Type, AlignLeft } from 'lucide-react';

export function RandomGenerator() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [randomNumber, setRandomNumber] = useState<number | null>(null);

  const [strLength, setStrLength] = useState(12);
  const [randomString, setRandomString] = useState('');
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);

  const [list, setList] = useState('');
  const [shuffledList, setShuffledList] = useState<string[]>([]);

  const [copied, setCopied] = useState('');

  // Secure random generator using crypto.getRandomValues with rejection sampling
  const getSecureRandom = (range: number): number => {
    if (range <= 0) return 0;
    const array = new Uint32Array(1);
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % range);

    let randomVal;
    do {
      window.crypto.getRandomValues(array);
      randomVal = array[0];
    } while (randomVal >= limit);

    return randomVal % range;
  };

  const generateNumber = () => {
    const range = max - min + 1;
    if (range <= 0) return;
    const val = getSecureRandom(range) + min;
    setRandomNumber(val);
  };

  const generateString = () => {
    let charset = '';
    if (includeUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';

    if (charset === '') return;

    let result = '';
    for (let i = 0; i < strLength; i++) {
      result += charset.charAt(getSecureRandom(charset.length));
    }
    setRandomString(result);
  };

  const shuffleList = () => {
    const items = list.split('\n').filter(i => i.trim() !== '');
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = getSecureRandom(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledList(shuffled);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Random Number */}
      <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex items-center gap-2 px-1">
          <Hash className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre Aléatoire</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 px-1">MIN</label>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 px-1">MAX</label>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>
          <button
            onClick={generateNumber}
            className="h-14 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Générer
          </button>

          {randomNumber !== null && (
            <div className="h-14 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-2xl flex items-center justify-between px-6 animate-in zoom-in-95 duration-300">
              <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{randomNumber}</span>
              <button onClick={() => copyToClipboard(randomNumber.toString(), 'num')} className="text-slate-400 hover:text-indigo-500 transition-colors">
                {copied === 'num' ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Random String */}
      <section className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 shadow-sm">
        <div className="flex items-center gap-2 px-1">
          <Type className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Chaîne Aléatoire</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'ABC', state: includeUpper, set: setIncludeUpper },
                { label: 'abc', state: includeLower, set: setIncludeLower },
                { label: '123', state: includeNumbers, set: setIncludeNumbers },
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => opt.set(!opt.state)}
                  className={`px-6 py-2 rounded-full text-xs font-black transition-all border ${opt.state ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                >
                  {opt.label}
                </button>
              ))}
              <div className="flex items-center gap-3 ml-auto">
                <label className="text-xs font-bold text-slate-400">LONGUEUR</label>
                <input
                  type="number"
                  value={strLength}
                  min="1"
                  max="128"
                  onChange={(e) => setStrLength(Number(e.target.value))}
                  className="w-16 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-sm outline-none"
                />
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={randomString}
                readOnly
                placeholder="Le résultat apparaîtra ici..."
                className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-mono text-xl outline-none transition-all dark:text-white"
              />
              <button
                onClick={() => randomString && copyToClipboard(randomString, 'str')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-slate-800 shadow-sm rounded-xl text-slate-400 hover:text-indigo-500 transition-all border border-slate-100 dark:border-slate-700"
              >
                {copied === 'str' ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="lg:col-span-4 flex items-end">
            <button
              onClick={generateString}
              className="w-full h-14 lg:h-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-6 h-6" /> Générer
            </button>
          </div>
        </div>
      </section>

      {/* List Shuffle */}
      <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex items-center gap-2 px-1">
          <AlignLeft className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Mélanger une Liste</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 px-1">ENTRÉE (Une ligne par élément)</label>
            <textarea
              value={list}
              onChange={(e) => setList(e.target.value)}
              className="w-full h-64 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-medium dark:text-slate-300"
              placeholder="Élément 1&#10;Élément 2&#10;Élément 3..."
            />
            <button
              onClick={shuffleList}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <Shuffle className="w-5 h-5" /> Mélanger la liste
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-slate-400">RÉSULTAT</label>
              <button
                onClick={() => shuffledList.length > 0 && copyToClipboard(shuffledList.join('\n'), 'list')}
                className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
              >
                {copied === 'list' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'list' ? 'Copié' : 'Tout copier'}
              </button>
            </div>
            <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-y-auto space-y-2">
              {shuffledList.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-300 font-bold italic">
                  La liste mélangée apparaîtra ici
                </div>
              ) : (
                shuffledList.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                    <span className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg text-[10px] font-black text-slate-400 border border-slate-100 dark:border-slate-600">{i + 1}</span>
                    <span className="font-bold text-sm dark:text-slate-200">{item}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
