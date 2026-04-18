import { useState, useEffect } from 'react';
import { Shuffle, Copy, Check, RefreshCw, Hash, Type, AlignLeft, Trash2, Download } from 'lucide-react';

export function RandomGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [min, setMin] = useState(initialData?.min ?? 1);
  const [max, setMax] = useState(initialData?.max ?? 100);
  const [randomNumber, setRandomNumber] = useState<number | null>(null);

  const [strLength, setStrLength] = useState(initialData?.strLength ?? 12);
  const [randomString, setRandomString] = useState('');
  const [includeUpper, setIncludeUpper] = useState(initialData?.includeUpper ?? true);
  const [includeLower, setIncludeLower] = useState(initialData?.includeLower ?? true);
  const [includeNumbers, setIncludeNumbers] = useState(initialData?.includeNumbers ?? true);

  const [list, setList] = useState(initialData?.list ?? '');

  useEffect(() => {
    onStateChange?.({ min, max, strLength, includeUpper, includeLower, includeNumbers, list });
  }, [min, max, strLength, includeUpper, includeLower, includeNumbers, list, onStateChange]);
  const [shuffledList, setShuffledList] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[][]>([]);
  const [teamCount, setTeamCount] = useState(2);
  const [winner, setWinner] = useState<string | null>(null);

  const [copied, setCopied] = useState('');
  const [diceResult, setDiceResult] = useState<{ value: number, type: number } | null>(null);
  const [coinResult, setCoinResult] = useState<'pile' | 'face' | null>(null);

  // Secure random generator using crypto.getRandomValues with rejection sampling
  const getSecureRandom = (range: number): number => {
    if (range <= 0) return 0;

    const array = new Uint32Array(1);
    if (range >= 0x100000000) {
      window.crypto.getRandomValues(array);
      return array[0];
    }
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
    let finalMin = min;
    let finalMax = max;
    if (min > max) {
      finalMin = max;
      finalMax = min;
      setMin(finalMin);
      setMax(finalMax);
    }
    const range = finalMax - finalMin + 1;
    if (range <= 0) return;
    const val = getSecureRandom(range) + finalMin;
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
    const items = list.split('\n').filter((i: string) => i.trim() !== '');
    if (items.length === 0) return;
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = getSecureRandom(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledList(shuffled);
    setWinner(null);
    setTeams([]);
  };

  const pickWinner = () => {
    const items = list.split('\n').filter((i: string) => i.trim() !== '');
    if (items.length === 0) return;
    const randomIndex = getSecureRandom(items.length);
    setWinner(items[randomIndex]);
    setShuffledList([]);
    setTeams([]);
  };

  const generateTeams = () => {
    const items = list.split('\n').filter((i: string) => i.trim() !== '');
    if (items.length === 0) return;

    // Shuffle first
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = getSecureRandom(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const safeTeamCount = Math.max(1, Math.min(20, teamCount));
    const newTeams: string[][] = Array.from({ length: safeTeamCount }, () => []);
    shuffled.forEach((item, index) => {
      newTeams[index % safeTeamCount].push(item);
    });

    setTeams(newTeams);
    setShuffledList([]);
    setWinner(null);
  };

  const rollDice = (sides: number) => {
    const val = getSecureRandom(sides) + 1;
    setDiceResult({ value: val, type: sides });
  };

  const flipCoin = () => {
    const val = getSecureRandom(2);
    setCoinResult(val === 0 ? 'pile' : 'face');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleDownload = (text: string, filename: string) => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
            <label htmlFor="num-min" className="text-xs font-bold text-slate-400 px-1 cursor-pointer">MIN</label>
            <input
              id="num-min"
              type="number"
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="num-max" className="text-xs font-bold text-slate-400 px-1 cursor-pointer">MAX</label>
            <input
              id="num-max"
              type="number"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 self-end">
              <button
                onClick={() => randomNumber !== null && handleDownload(randomNumber.toString(), 'nombre-aleatoire')}
                disabled={randomNumber === null}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" /> Télécharger
              </button>
              <button
                onClick={() => setRandomNumber(null)}
                disabled={randomNumber === null}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <button
              onClick={generateNumber}
              className="h-14 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> Générer
            </button>
          </div>

          {randomNumber !== null && (
            <div className="h-14 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-2xl flex items-center justify-between px-6 animate-in zoom-in-95 duration-300">
              <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{randomNumber}</span>
              <button
                onClick={() => copyToClipboard(randomNumber.toString(), 'num')}
                className={`p-2 rounded-xl transition-all border ${
                  copied === 'num'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-400 hover:text-indigo-500 border-transparent'
                }`}
                aria-label="Copier le nombre"
              >
                {copied === 'num' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
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

        <div className="flex justify-end gap-2 px-1">
          <button
            onClick={() => handleDownload(randomString, 'chaine-aleatoire')}
            disabled={!randomString}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <Download className="w-3 h-3" /> Télécharger
          </button>
          <button
            onClick={() => setRandomString('')}
            disabled={!randomString}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
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
                <label htmlFor="str-length" className="text-xs font-bold text-slate-400 cursor-pointer">LONGUEUR</label>
                <input
                  id="str-length"
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
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 shadow-sm rounded-xl transition-all border ${
                  copied === 'str'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 border-slate-100 dark:border-slate-700'
                }`}
                aria-label="Copier la chaîne"
              >
                {copied === 'str' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="lg:col-span-4 flex items-end">
            <button
              onClick={generateString}
              disabled={!includeUpper && !includeLower && !includeNumbers}
              className="w-full h-14 lg:h-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-6 h-6" /> Générer
            </button>
          </div>
        </div>
      </section>

      {/* Dice & Coin Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <section className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <Shuffle className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Lancer de Dés</h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
               {[4, 6, 8, 10, 12, 20].map(sides => (
                 <button
                   key={sides}
                   onClick={() => rollDice(sides)}
                   className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-500 transition-all group"
                 >
                   <span className="text-lg font-black dark:text-white group-hover:text-indigo-600">D{sides}</span>
                 </button>
               ))}
            </div>
            {diceResult && (
               <div className="flex items-center justify-center p-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl border-2 border-indigo-200 dark:border-indigo-500/20 animate-in zoom-in-95">
                  <div className="text-center space-y-2">
                     <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{diceResult.value}</div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Résultat D{diceResult.type}</div>
                  </div>
               </div>
            )}
         </section>

         <section className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <Shuffle className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Pile ou Face</h3>
            </div>
            <div className="flex justify-center">
               <button
                 onClick={flipCoin}
                 className="w-32 h-32 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10"
               >
                 LANCER
               </button>
            </div>
            {coinResult && (
               <div className="flex items-center justify-center p-8 bg-amber-50 dark:bg-amber-500/10 rounded-3xl border-2 border-amber-200 dark:border-amber-500/20 animate-in zoom-in-95">
                  <div className="text-center space-y-2">
                     <div className="text-4xl font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">{coinResult}</div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Résultat du tirage</div>
                  </div>
               </div>
            )}
         </section>
      </div>

      {/* List Shuffle */}
      <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex items-center gap-2 px-1">
          <AlignLeft className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Mélanger une Liste</h3>
        </div>

        <div className="flex justify-end gap-2 px-1">
          {(shuffledList.length > 0 || winner || teams.length > 0) && (
            <button
              onClick={() => {
                const text = winner || (teams.length > 0 ? teams.map((t, i) => `Équipe ${i + 1}:\n${t.join('\n')}`).join('\n\n') : shuffledList.join('\n'));
                handleDownload(text, 'resultat-tirage');
              }}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Download className="w-3 h-3" /> Télécharger
            </button>
          )}
          <button
            onClick={() => {setList(''); setShuffledList([]); setWinner(null); setTeams([]);}}
            disabled={!list && shuffledList.length === 0 && !winner && teams.length === 0}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label htmlFor="list-input" className="text-xs font-bold text-slate-400 px-1 cursor-pointer">ENTRÉE (Une ligne par élément)</label>
            <textarea
              id="list-input"
              value={list}
              onChange={(e) => setList(e.target.value)}
              className="w-full h-64 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-medium dark:text-slate-300"
              placeholder="Élément 1&#10;Élément 2&#10;Élément 3..."
            />
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label htmlFor="team-count" className="text-xs font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Nombre d'équipes :</label>
                <input
                  id="team-count"
                  type="number"
                  min="2"
                  max="20"
                  value={teamCount}
                  onChange={(e) => setTeamCount(Number(e.target.value))}
                  className="w-full bg-transparent font-bold outline-none dark:text-white"
                />
                <button
                  onClick={generateTeams}
                  disabled={!list.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  Générer Équipes
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={shuffleList}
                  disabled={!list.trim()}
                  className="py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Shuffle className="w-5 h-5" /> Mélanger
                </button>
                <button
                  onClick={pickWinner}
                  disabled={!list.trim()}
                  className="py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className="w-5 h-5" /> Tirer au sort
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-slate-400">RÉSULTAT</label>
              {(shuffledList.length > 0 || winner || teams.length > 0) && (
                <button
                  onClick={() => {
                    const text = winner || (teams.length > 0 ? teams.map((t, i) => `Équipe ${i + 1}:\n${t.join('\n')}`).join('\n\n') : shuffledList.join('\n'));
                    copyToClipboard(text, 'list');
                  }}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border ${
                    copied === 'list'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'text-indigo-600 dark:text-indigo-400 border-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                  }`}
                >
                  {copied === 'list' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'list' ? 'Copié' : 'Copier'}
                </button>
              )}
            </div>
            <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-y-auto space-y-2 relative group/result">
              {teams.length > 0 && (
                <button
                  onClick={() => {
                    const text = teams.map((t, i) => `Équipe ${i + 1}:\n${t.join('\n')}`).join('\n\n');
                    copyToClipboard(text, 'teams-all');
                  }}
                  className={`absolute top-4 right-4 z-10 p-2 rounded-xl transition-all border ${
                    copied === 'teams-all'
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                      : "bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 border-slate-100 dark:border-slate-700 opacity-0 group-hover/result:opacity-100"
                  }`}
                  title="Copier toutes les équipes"
                >
                  {copied === 'teams-all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
              {winner ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="text-xs font-black uppercase tracking-widest text-indigo-500">Gagnant Tiré au sort !</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white bg-indigo-50 dark:bg-indigo-500/10 px-8 py-6 rounded-2xl border-2 border-indigo-500/20 text-center break-all max-w-full">
                    {winner}
                  </div>
                  <button
                    onClick={() => copyToClipboard(winner, 'winner-btn')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      copied === 'winner-btn'
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                        : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    {copied === 'winner-btn' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied === 'winner-btn' ? "Copié" : "Copier le gagnant"}
                  </button>
                </div>
              ) : teams.length > 0 ? (
                <div className="space-y-6">
                  {teams.map((team, i) => (
                    <div key={i} className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Équipe {i + 1}</div>
                      <div className="grid grid-cols-1 gap-2">
                        {team.map((member, j) => (
                          <div key={j} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-bold text-sm dark:text-slate-200">
                            {member}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : shuffledList.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-300 font-bold italic text-center px-4">
                  La liste mélangée, le gagnant ou les équipes apparaîtront ici
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
