import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Copy, Check, Trash2, RotateCcw, Info, Settings2, Keyboard, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const ROTORS = {
  I: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
  II: { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
  III: { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
  IV: { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 'J' },
  V: { wiring: 'VZBRGITYUPSDNHLXAWMJQOTKEC', notch: 'Z' },
};

const REFLECTORS = {
  B: 'YRUHQSLDPXNGOKMIEBFZCWVJAT',
  C: 'FVPJIAOYEDRZRKGUMXTTLHCWNY',
};

interface EnigmaState {
  rotors: (keyof typeof ROTORS)[];
  reflector: keyof typeof REFLECTORS;
  positions: string[];
  rings: number[];
  plugboard: string[];
}

export function EnigmaCipher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [state, setState] = useState<EnigmaState>(initialData?.state || {
    rotors: ['I', 'II', 'III'] as (keyof typeof ROTORS)[],
    reflector: 'B' as keyof typeof REFLECTORS,
    positions: ['A', 'A', 'A'],
    rings: [1, 1, 1],
    plugboard: [],
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ state });
  }, [state, onStateChange]);

  const processChar = useCallback((char: string, currentState: EnigmaState) => {
    const c = char.toUpperCase();
    if (!ALPHABET.includes(c)) return { char, newState: currentState };

    const newState = { ...currentState, positions: [...currentState.positions] };
    const { rotors, reflector, positions, rings, plugboard } = currentState;

    // 1. Rotation logic (Double stepping)
    // Left (0), Middle (1), Right (2)
    const r2 = ROTORS[rotors[1]];
    const r3 = ROTORS[rotors[2]];

    let rotateR1 = false;
    let rotateR2 = false;
    let rotateR3 = true;

    if (positions[1] === r2.notch) {
      rotateR1 = true;
      rotateR2 = true;
    }
    if (positions[2] === r3.notch) {
      rotateR2 = true;
    }

    if (rotateR1) newState.positions[0] = ALPHABET[(ALPHABET.indexOf(positions[0]) + 1) % 26];
    if (rotateR2) newState.positions[1] = ALPHABET[(ALPHABET.indexOf(positions[1]) + 1) % 26];
    if (rotateR3) newState.positions[2] = ALPHABET[(ALPHABET.indexOf(positions[2]) + 1) % 26];

    // 2. Cipher logic
    let index = ALPHABET.indexOf(c);

    // Plugboard
    for (const pair of plugboard) {
      if (pair[0] === ALPHABET[index]) {
        index = ALPHABET.indexOf(pair[1]);
        break;
      } else if (pair[1] === ALPHABET[index]) {
        index = ALPHABET.indexOf(pair[0]);
        break;
      }
    }

    const forward = (idx: number, rotorKey: keyof typeof ROTORS, pos: string, ring: number) => {
      const rotor = ROTORS[rotorKey];
      const mOffset = ALPHABET.indexOf(pos);
      const rOffset = ring - 1;
      const offset = (mOffset - rOffset + 26) % 26;

      const charIdx = (idx + offset) % 26;
      const wiredChar = rotor.wiring[charIdx];
      return (ALPHABET.indexOf(wiredChar) - offset + 26) % 26;
    };

    const backward = (idx: number, rotorKey: keyof typeof ROTORS, pos: string, ring: number) => {
      const rotor = ROTORS[rotorKey];
      const mOffset = ALPHABET.indexOf(pos);
      const rOffset = ring - 1;
      const offset = (mOffset - rOffset + 26) % 26;

      const charIdx = (idx + offset) % 26;
      const wiredIdx = rotor.wiring.indexOf(ALPHABET[charIdx]);
      return (wiredIdx - offset + 26) % 26;
    };

    // Forward through rotors (Right to Left)
    index = forward(index, rotors[2], newState.positions[2], rings[2]);
    index = forward(index, rotors[1], newState.positions[1], rings[1]);
    index = forward(index, rotors[0], newState.positions[0], rings[0]);

    // Reflector
    const reflectedChar = REFLECTORS[reflector][index];
    index = ALPHABET.indexOf(reflectedChar);

    // Backward through rotors (Left to Right)
    index = backward(index, rotors[0], newState.positions[0], rings[0]);
    index = backward(index, rotors[1], newState.positions[1], rings[1]);
    index = backward(index, rotors[2], newState.positions[2], rings[2]);

    // Plugboard again
    for (const pair of plugboard) {
      if (pair[0] === ALPHABET[index]) {
        index = ALPHABET.indexOf(pair[1]);
        break;
      } else if (pair[1] === ALPHABET[index]) {
        index = ALPHABET.indexOf(pair[0]);
        break;
      }
    }

    return { char: ALPHABET[index], newState };
  }, []);

  const handleInputChange = (val: string) => {
    // If user cleared the input
    if (val === '') {
      setInput('');
      setOutput('');
      return;
    }

    // If text was added
    if (val.length > input.length) {
      const addedText = val.slice(input.length);
      let currentOutput = output;
      let currentState = state;

      for (const char of addedText) {
        if (ALPHABET.includes(char.toUpperCase())) {
          const { char: encrypted, newState } = processChar(char, currentState);
          currentOutput += encrypted;
          currentState = newState;
        } else {
          currentOutput += char;
        }
      }

      setInput(val);
      setOutput(currentOutput);
      setState(currentState);
    } else {
      // If text was deleted, we just truncate (not perfect for Enigma but simple)
      setInput(val);
      setOutput(output.slice(0, val.length));
    }
  };

  const handleReset = () => {
    setInput('');
    setOutput('');
    setState({
      rotors: ['I', 'II', 'III'],
      reflector: 'B',
      positions: ['A', 'A', 'A'],
      rings: [1, 1, 1],
      plugboard: [],
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const addPlug = (p: string) => {
    if (p.length !== 2) return;
    const [a, b] = p.toUpperCase().split('');
    if (a === b || !ALPHABET.includes(a) || !ALPHABET.includes(b)) return;
    if (state.plugboard.some(pair => pair.includes(a) || pair.includes(b))) {
        toast.error(t('enigma.error_plug_conflict', 'Letter already used in plugboard'));
        return;
    }
    setState(prev => ({ ...prev, plugboard: [...prev.plugboard, a + b] }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Machine Settings */}
        <div className="lg:col-span-1 space-y-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-1">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('enigma.config', 'Machine Configuration')}</h3>
          </div>

          <div className="space-y-4">
            {/* Rotors Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('enigma.rotors', 'Rotors (Left to Right)')}</label>
              <div className="grid grid-cols-3 gap-2">
                {state.rotors.map((r, i) => (
                  <select
                    key={i}
                    value={r}
                    onChange={(e) => {
                      const newRotors = [...state.rotors];
                      newRotors[i] = e.target.value as keyof typeof ROTORS;
                      setState(prev => ({ ...prev, rotors: newRotors }));
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {Object.keys(ROTORS).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                ))}
              </div>
            </div>

            {/* Positions */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('enigma.positions', 'Starting Positions')}</label>
                <div className="grid grid-cols-3 gap-2">
                    {state.positions.map((p, i) => (
                        <select
                            key={i}
                            value={p}
                            onChange={(e) => {
                                const newPos = [...state.positions];
                                newPos[i] = e.target.value;
                                setState(prev => ({ ...prev, positions: newPos }));
                            }}
                            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            {ALPHABET.split('').map(char => <option key={char} value={char}>{char}</option>)}
                        </select>
                    ))}
                </div>
            </div>

            {/* Rings */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('enigma.rings', 'Ring Settings')}</label>
                <div className="grid grid-cols-3 gap-2">
                    {state.rings.map((r, i) => (
                        <select
                            key={i}
                            value={r}
                            onChange={(e) => {
                                const newRings = [...state.rings];
                                newRings[i] = parseInt(e.target.value);
                                setState(prev => ({ ...prev, rings: newRings }));
                            }}
                            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            {[...Array(26)].map((_, idx) => (
                                <option key={idx + 1} value={idx + 1}>{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</option>
                            ))}
                        </select>
                    ))}
                </div>
            </div>

            {/* Reflector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('enigma.reflector', 'Reflector')}</label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                {Object.keys(REFLECTORS).map(r => (
                  <button
                    key={r}
                    onClick={() => setState(prev => ({ ...prev, reflector: r as keyof typeof REFLECTORS }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${state.reflector === r ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Plugboard */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('enigma.plugboard', 'Plugboard')}</label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[1.5rem]">
                {state.plugboard.map((pair, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black border border-indigo-200 dark:border-indigo-800">
                    {pair}
                    <button onClick={() => setState(prev => ({ ...prev, plugboard: prev.plugboard.filter((_, idx) => idx !== i) }))} className="hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="AB..."
                maxLength={2}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        addPlug((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                    }
                }}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono uppercase"
              />
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-all rounded-xl font-bold text-sm flex items-center justify-center gap-2 group"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform" />
            {t('common.reset')}
          </button>
        </div>

        {/* IO Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-indigo-500" /> {t('common.input')}
                </label>
              </div>
              <textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={t('enigma.placeholder', 'Type message here... Only A-Z will be processed.')}
                className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg uppercase resize-none dark:text-slate-300"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-emerald-500" /> {t('common.output')}
                </label>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 border ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  } disabled:opacity-50`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <div className="w-full h-40 p-6 bg-slate-900 text-indigo-400 rounded-[2rem] border border-slate-800 font-mono text-2xl uppercase overflow-auto break-all">
                {output || <span className="text-slate-700 italic text-sm">{t('common.waiting')}</span>}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-900/20 p-6 rounded-[2rem] flex gap-4">
            <Info className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-100">{t('enigma.about_title', 'About the Enigma Machine')}</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                {t('enigma.about_text', 'The Enigma machine is a cipher device used by the German military during WWII. It is a reciprocal cipher, meaning if "A" encrypts to "B", then "B" will encrypt back to "A" with the same settings. Note: In this simulation, typing increments the rotor positions instantly.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
