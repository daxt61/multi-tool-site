import { useState, useEffect, useCallback, useMemo } from 'react';
import { Copy, RefreshCw, Check, Shield, ShieldAlert, ShieldCheck, Key, BookOpen, Trash2, Download, Eye, EyeOff, AlertCircle, Info, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

const WORDS_FR = [
  'bleu', 'rouge', 'vert', 'jaune', 'noir', 'blanc', 'orange', 'rose', 'gris', 'brun', 'violet', 'marron', 'argent', 'or', 'indigo', 'turquoise', 'beige', 'ocre', 'cyan', 'lime',
  'petit', 'grand', 'rapide', 'lent', 'fort', 'faible', 'chaud', 'froid', 'beau', 'jeune', 'vieux', 'riche', 'pauvre', 'doux', 'dur', 'leger', 'lourd', 'propre', 'sale', 'neuf', 'ancien', 'haut', 'bas', 'large', 'etroit', 'rond', 'carre', 'plat', 'amer', 'sucre',
  'chat', 'chien', 'oiseau', 'lion', 'tigre', 'ours', 'loup', 'renard', 'lapin', 'singe', 'cheval', 'vache', 'cochon', 'poule', 'canard', 'souris', 'rat', 'serpent', 'tortue', 'grenouille', 'poisson', 'requin', 'baleine', 'dauphin', 'abeille', 'fourmi', 'mouche', 'papillon', 'araignee', 'hibou',
  'maison', 'jardin', 'arbre', 'fleur', 'soleil', 'lune', 'etoile', 'mer', 'vent', 'pluie', 'neige', 'glace', 'nuage', 'orage', 'foudre', 'terre', 'ciel', 'montagne', 'vallee', 'riviere', 'lac', 'ocean', 'foret', 'desert', 'plage', 'ile', 'rocher', 'sable', 'herbe', 'buisson',
  'pomme', 'pain', 'eau', 'lait', 'cafe', 'the', 'sucre', 'sel', 'riz', 'pate', 'oeuf', 'fromage', 'beurre', 'viande', 'fruit', 'legume', 'soupe', 'salade', 'miel', 'chocolat', 'gateau', 'pizza', 'jus', 'vin', 'biere', 'noix', 'amande', 'fraise', 'banane', 'citron',
  'table', 'chaise', 'porte', 'fenetre', 'lit', 'armoire', 'miroir', 'tapis', 'rideau', 'canape', 'lampe', 'bureau', 'cuisine', 'salon', 'douche', 'cle', 'sac', 'boite', 'verre', 'bol', 'four', 'frigo', 'poele', 'assiette', 'couteau', 'fourchette', 'cuillere', 'serviette', 'balai', 'savon',
  'livre', 'stylo', 'ecran', 'route', 'pont', 'ville', 'village', 'avion', 'train', 'velo', 'voiture', 'bateau', 'moto', 'bus', 'camion', 'fusée', 'moteur', 'vitesse', 'tel', 'ordi', 'clavier', 'souris', 'montre', 'outil', 'marteau', 'scie', 'vis', 'clou', 'colle', 'papier',
  'joie', 'paix', 'amour', 'espoir', 'force', 'esprit', 'raison', 'action', 'travail', 'succes', 'vie', 'mort', 'temps', 'heure', 'minute', 'seconde', 'jour', 'nuit', 'matin', 'soir', 'midi', 'nord', 'sud', 'est', 'ouest', 'droit', 'gauche', 'centre', 'but', 'nom',
  'tete', 'corps', 'bras', 'main', 'doigt', 'jambe', 'pied', 'dos', 'coeur', 'sang', 'peau', 'os', 'nerf', 'oeil', 'nez', 'bouche', 'oreille', 'cheveu', 'voix', 'souffle', 'rire', 'pleur', 'sommeil', 'reve', 'idee', 'sens', 'gout', 'odeur', 'faim', 'soif',
  'musique', 'danse', 'peinture', 'cinema', 'theatre', 'poeme', 'histoire', 'chant', 'piano', 'guitare', 'violon', 'tambour', 'trompette', 'harpe', 'flute', 'orgue', 'cloche', 'rythme', 'son', 'note', 'film', 'page', 'musee', 'art', 'dessin', 'image', 'photo', 'couleur', 'forme',
  'espace', 'atome', 'photon', 'onde', 'masse', 'poids', 'metal', 'acier', 'fer', 'cuivre', 'platine', 'plastique', 'code', 'web', 'site', 'app', 'bug', 'data', 'cloud', 'pixel', 'octet', 'bit', 'hertz', 'volt', 'watt',
  'marche', 'course', 'vol', 'nage', 'saut', 'cri', 'appel', 'jeu', 'sport', 'fight', 'choc', 'clic', 'zoom', 'scan', 'flux', 'bloc', 'lien', 'post', 'mail', 'chat', 'quiz', 'test', 'avis', 'plan', 'prix', 'gain', 'perte', 'choix', 'vue'
];

const WORDS_EN = [
  'blue', 'red', 'green', 'yellow', 'black', 'white', 'orange', 'pink', 'gray', 'brown', 'purple', 'silver', 'gold', 'indigo', 'turquoise', 'beige', 'cyan', 'lime',
  'small', 'large', 'fast', 'slow', 'strong', 'weak', 'hot', 'cold', 'beautiful', 'young', 'old', 'rich', 'poor', 'soft', 'hard', 'light', 'heavy', 'clean', 'dirty', 'new', 'old', 'high', 'low', 'wide', 'narrow', 'round', 'square', 'flat', 'bitter', 'sweet',
  'cat', 'dog', 'bird', 'lion', 'tiger', 'bear', 'wolf', 'fox', 'rabbit', 'monkey', 'horse', 'cow', 'pig', 'chicken', 'duck', 'mouse', 'rat', 'snake', 'turtle', 'frog', 'fish', 'shark', 'whale', 'dolphin', 'bee', 'ant', 'fly', 'butterfly', 'spider', 'owl',
  'house', 'garden', 'tree', 'flower', 'sun', 'moon', 'star', 'sea', 'wind', 'rain', 'snow', 'ice', 'cloud', 'storm', 'thunder', 'earth', 'sky', 'mountain', 'valley', 'river', 'lake', 'ocean', 'forest', 'desert', 'beach', 'island', 'rock', 'sand', 'grass', 'bush',
  'apple', 'bread', 'water', 'milk', 'coffee', 'tea', 'sugar', 'salt', 'rice', 'pasta', 'egg', 'cheese', 'butter', 'meat', 'fruit', 'vegetable', 'soup', 'salad', 'honey', 'chocolate', 'cake', 'pizza', 'juice', 'wine', 'beer', 'nut', 'almond', 'strawberry', 'banana', 'lemon',
  'table', 'chair', 'door', 'window', 'bed', 'closet', 'mirror', 'rug', 'curtain', 'sofa', 'lamp', 'desk', 'kitchen', 'living', 'shower', 'key', 'bag', 'box', 'glass', 'bowl', 'oven', 'fridge', 'pan', 'plate', 'knife', 'fork', 'spoon', 'towel', 'broom', 'soap',
  'book', 'pen', 'screen', 'road', 'bridge', 'city', 'village', 'plane', 'train', 'bike', 'car', 'boat', 'motor', 'bus', 'truck', 'rocket', 'engine', 'speed', 'phone', 'comp', 'keyboard', 'mouse', 'watch', 'tool', 'hammer', 'saw', 'screw', 'nail', 'glue', 'paper',
  'joy', 'peace', 'love', 'hope', 'force', 'mind', 'reason', 'action', 'work', 'success', 'life', 'death', 'time', 'hour', 'minute', 'second', 'day', 'night', 'morning', 'evening', 'noon', 'north', 'south', 'east', 'west', 'right', 'left', 'center', 'goal', 'name',
  'head', 'body', 'arm', 'hand', 'finger', 'leg', 'foot', 'back', 'heart', 'blood', 'skin', 'bone', 'nerve', 'eye', 'nose', 'mouth', 'ear', 'hair', 'voice', 'breath', 'laugh', 'cry', 'sleep', 'dream', 'idea', 'sense', 'taste', 'smell', 'hunger', 'thirst',
  'music', 'dance', 'paint', 'movie', 'theater', 'poem', 'story', 'song', 'piano', 'guitar', 'violin', 'drum', 'trumpet', 'harp', 'flute', 'organ', 'bell', 'rhythm', 'sound', 'note', 'film', 'page', 'museum', 'art', 'draw', 'image', 'photo', 'color', 'shape',
  'space', 'atom', 'photon', 'wave', 'mass', 'weight', 'metal', 'steel', 'iron', 'copper', 'platinum', 'plastic', 'code', 'web', 'site', 'app', 'bug', 'data', 'cloud', 'pixel', 'byte', 'bit', 'hertz', 'volt', 'watt',
  'walk', 'run', 'flight', 'swim', 'jump', 'shout', 'call', 'game', 'sport', 'fight', 'shock', 'click', 'zoom', 'scan', 'flow', 'block', 'link', 'post', 'mail', 'chat', 'quiz', 'test', 'view', 'plan', 'price', 'gain', 'loss', 'choice'
];

export function PasswordGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<'random' | 'passphrase'>(initialData?.mode || 'random');
  const [passwords, setPasswords] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(initialData?.quantity || 1);
  const [length, setLength] = useState(initialData?.length || 16);
  const [wordCount, setWordCount] = useState(initialData?.wordCount || 4);
  const [capitalizeWords, setCapitalizeWords] = useState(initialData?.capitalizeWords ?? false);
  const [addNumber, setAddNumber] = useState(initialData?.addNumber ?? false);
  const [addSymbol, setAddSymbol] = useState(initialData?.addSymbol ?? false);
  const [includeUppercase, setIncludeUppercase] = useState(initialData?.includeUppercase ?? true);
  const [includeLowercase, setIncludeLowercase] = useState(initialData?.includeLowercase ?? true);
  const [includeNumbers, setIncludeNumbers] = useState(initialData?.includeNumbers ?? true);
  const [includeSymbols, setIncludeSymbols] = useState(initialData?.includeSymbols ?? true);
  const [excludeSimilar, setExcludeSimilar] = useState(initialData?.excludeSimilar ?? false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedHistoryIndex, setCopiedHistoryIndex] = useState<number | null>(null);
  const [copiedHistoryAll, setCopiedHistoryAll] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const generatePassword = useCallback(() => {
    const newPasswords: string[] = [];
    const wordList = i18n.language === 'en' ? WORDS_EN : WORDS_FR;

    for (let q = 0; q < quantity; q++) {
      if (mode === 'random') {
        let charset = '';
        if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (includeNumbers) charset += '0123456789';
        if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (excludeSimilar) {
          charset = charset.replace(/[il1Lo0O]/g, '');
        }

        if (charset === '') {
          setPasswords([]);
          return;
        }

        let newPassword = '';
        for (let i = 0; i < length; i++) {
          newPassword += charset.charAt(getSecureRandomInt(charset.length));
        }
        newPasswords.push(newPassword);
      } else {
        const selectedWords = [];
        for (let i = 0; i < wordCount; i++) {
          let word = wordList[getSecureRandomInt(wordList.length)];
          if (capitalizeWords) {
            word = word.charAt(0).toUpperCase() + word.slice(1);
          }
          selectedWords.push(word);
        }

        let res = selectedWords.join('-');
        if (addNumber) {
          res += getSecureRandomInt(10);
        }
        if (addSymbol) {
          const symbols = '!@#$%^&*';
          res += symbols.charAt(getSecureRandomInt(symbols.length));
        }
        newPasswords.push(res);
      }
    }
    setPasswords(newPasswords);
    setHistory(prev => [...newPasswords, ...prev].slice(0, 10));
    setCopied(false);
  }, [mode, quantity, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, length, wordCount, capitalizeWords, addNumber, addSymbol, i18n.language]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  useEffect(() => {
    onStateChange?.({
      mode, quantity, length, wordCount, capitalizeWords, addNumber, addSymbol,
      includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar
    });
  }, [mode, quantity, length, wordCount, capitalizeWords, addNumber, addSymbol, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, onStateChange]);

  const copyToClipboard = useCallback((text?: string) => {
    const toCopy = text || passwords[0];
    if (!toCopy) return;
    navigator.clipboard.writeText(toCopy);
    if (!text) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [passwords]);

  const calculateEntropy = useCallback((pwd: string) => {
    if (!pwd) return 0;
    let charsetSize = 0;
    if (mode === 'random') {
      if (includeUppercase) charsetSize += 26;
      if (includeLowercase) charsetSize += 26;
      if (includeNumbers) charsetSize += 10;
      if (includeSymbols) charsetSize += 26;
      if (excludeSimilar) charsetSize -= 7;
      return Math.floor(pwd.length * Math.log2(Math.max(charsetSize, 1)));
    } else {
      const wordListSize = i18n.language === 'en' ? WORDS_EN.length : WORDS_FR.length;
      const baseEntropy = wordCount * Math.log2(wordListSize);
      const extraEntropy = (addNumber ? Math.log2(10) : 0) + (addSymbol ? Math.log2(8) : 0);
      return Math.floor(baseEntropy + extraEntropy);
    }
  }, [mode, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, wordCount, addNumber, addSymbol, i18n.language]);

  const getStrength = useCallback((entropy: number) => {
    if (entropy === 0) return { label: '', color: 'bg-slate-200', icon: <ShieldAlert />, feedback: '' };
    if (entropy < 40) return { label: t('passwordgenerator.strength.very_weak'), color: 'bg-rose-600', icon: <ShieldAlert className="w-4 h-4" />, feedback: t('passwordgenerator.feedback.very_weak') };
    if (entropy < 60) return { label: t('passwordgenerator.strength.weak'), color: 'bg-rose-400', icon: <ShieldAlert className="w-4 h-4" />, feedback: t('passwordgenerator.feedback.weak') };
    if (entropy < 80) return { label: t('passwordgenerator.strength.medium'), color: 'bg-amber-500', icon: <Shield className="w-4 h-4" />, feedback: t('passwordgenerator.feedback.medium') };
    if (entropy < 100) return { label: t('passwordgenerator.strength.strong'), color: 'bg-emerald-500', icon: <ShieldCheck className="w-4 h-4" />, feedback: t('passwordgenerator.feedback.strong') };
    return { label: t('passwordgenerator.strength.excellent'), color: 'bg-indigo-600', icon: <ShieldCheck className="w-4 h-4" />, feedback: t('passwordgenerator.feedback.excellent') };
  }, [t]);

  const handleClear = () => {
    setPasswords([]);
    setHistory([]);
  };

  const copyHistoryItem = (item: string, index: number) => {
    navigator.clipboard.writeText(item);
    setCopiedHistoryIndex(index);
    setTimeout(() => setCopiedHistoryIndex(null), 2000);
  };

  const copyHistoryAll = () => {
    if (history.length === 0) return;
    navigator.clipboard.writeText(history.join('\n'));
    setCopiedHistoryAll(true);
    setTimeout(() => setCopiedHistoryAll(false), 2000);
  };

  const handleDownload = () => {
    if (passwords.length === 0) return;
    const blob = new Blob([passwords.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mots-de-passe-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const isBodyFocused = document.activeElement === document.body;

      if ((e.key.toLowerCase() === 'r') || (e.code === 'Space' && isBodyFocused)) {
        e.preventDefault();
        generatePassword();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyToClipboard();
      } else if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setShowPassword(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generatePassword, copyToClipboard, showPassword]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end items-center gap-2 px-1">
        <button
          onClick={() => copyToClipboard(passwords.join('\n'))}
          disabled={passwords.length === 0}
          aria-label={t('passwordgenerator.copy_all')}
          title={t('passwordgenerator.copy_all')}
          className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Copy className="w-3 h-3" /> {t('passwordgenerator.copy_all')}
        </button>
        <button
          onClick={handleDownload}
          disabled={passwords.length === 0}
          aria-label={t('common.download')}
          title={t('common.download')}
          className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Download className="w-3 h-3" /> {t('common.download')}
        </button>
        <button
          onClick={handleClear}
          disabled={passwords.length === 0}
          aria-label={t('common.clear')}
          title={t('common.clear')}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> {t('common.clear')}
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700" role="tablist">
          <button
            onClick={() => setMode('random')}
            role="tab"
            aria-selected={mode === 'random'}
            aria-controls="random-panel"
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              mode === 'random'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Key className="w-4 h-4" /> {t('passwordgenerator.random')}
          </button>
          <button
            onClick={() => setMode('passphrase')}
            role="tab"
            aria-selected={mode === 'passphrase'}
            aria-controls="passphrase-panel"
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              mode === 'passphrase'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" /> {t('passwordgenerator.passphrase')}
          </button>
        </div>
      </div>

      {/* Display Area */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        {passwords.length > 0 && (
          <div className="space-y-6 relative z-10">
            {passwords.map((pwd, idx) => {
              const entropyValue = calculateEntropy(pwd);
              const strengthInfo = getStrength(entropyValue);

              return (
                <div key={idx} className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-white/10 last:border-0 last:pb-0">
                  <div className="flex-1 relative w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={pwd}
                      readOnly
                      aria-label={t('passwordgenerator.password')}
                      className={`w-full bg-transparent font-mono text-white outline-none tracking-tight text-center md:text-left selection:bg-indigo-500/30 ${
                        pwd.length > 30 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
                      } ${!showPassword ? 'text-transparent' : ''}`}
                    />
                    {!showPassword && (
                      <div className="absolute inset-y-0 left-0 right-0 pointer-events-none flex items-center justify-center md:justify-start">
                         <div className="flex gap-1">
                           {[...Array(Math.min(pwd.length, 12))].map((_, i) => (
                             <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />
                           ))}
                           {pwd.length > 12 && <span className="text-white/20 font-mono text-lg leading-none">...</span>}
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="flex-1">
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest text-white ${strengthInfo.color}`}
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {strengthInfo.icon} {strengthInfo.label}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(pwd)}
                      aria-label={t('common.copy')}
                      title={t('common.copy')}
                      className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {passwords.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/20 font-bold italic">{t('passwordgenerator.waiting')}</p>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            <span className="text-sm font-bold">{showPassword ? t('passwordgenerator.hide') : t('passwordgenerator.show')}</span>
            <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 border border-white/20 rounded text-[10px] font-bold bg-white/5 text-white/50 ml-1">V</kbd>
          </button>

          <button
            onClick={generatePassword}
            aria-label={t('passwordgenerator.regenerate_aria')}
            className="px-8 py-3 bg-white text-slate-900 rounded-2xl transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none font-black flex items-center gap-2 group/regen"
          >
            <RefreshCw className="w-5 h-5 group-hover/regen:rotate-180 transition-transform duration-500" />
            <span>{t('passwordgenerator.regenerate')}</span>
            <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 border border-slate-200 rounded text-[10px] font-bold bg-slate-100 text-slate-400 ml-1">R</kbd>
          </button>
        </div>
      </div>

      {history.length > 1 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3 h-3" /> {t('passwordgenerator.recent_history')}
            </h3>
            <button
              onClick={copyHistoryAll}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 border ${
                copiedHistoryAll
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'text-indigo-600 dark:text-indigo-400 border-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }`}
            >
              {copiedHistoryAll ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedHistoryAll ? t('common.copied') : t('passwordgenerator.copy_all')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.slice(1).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => copyHistoryItem(item, idx)}
                aria-label={t('common.copy')}
                title={t('common.copy')}
                className={`group flex items-center gap-3 px-4 py-2 border rounded-xl transition-all text-sm font-mono focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedHistoryIndex === idx
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-indigo-500/50'
                }`}
              >
                <span className="truncate max-w-[150px]">{item}</span>
                {copiedHistoryIndex === idx ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          {/* Quantity Slider */}
          <div className="space-y-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="password-quantity" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.count')}</label>
              <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{quantity}</span>
            </div>
            <input
              id="password-quantity"
              type="range"
              min="1"
              max="50"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            />
          </div>

          {mode === 'random' ? (
            <div className="space-y-6" id="random-panel" role="tabpanel">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="password-length" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('passwordgenerator.length')}</label>
                <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{length}</span>
              </div>
              <input
                id="password-length"
                type="range"
                min="4"
                max="64"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="word-count" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('passwordgenerator.word_count')}</label>
                <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{wordCount}</span>
              </div>
              <input
                id="word-count"
                type="range"
                min="2"
                max="10"
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              />
            </div>
          )}

          {mode === 'random' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t('passwordgenerator.uppercase'), state: includeUppercase, setState: setIncludeUppercase },
                { label: t('passwordgenerator.lowercase'), state: includeLowercase, setState: setIncludeLowercase },
                { label: t('passwordgenerator.numbers'), state: includeNumbers, setState: setIncludeNumbers },
                { label: t('passwordgenerator.symbols'), state: includeSymbols, setState: setIncludeSymbols },
                { label: t('passwordgenerator.exclude_similar'), state: excludeSimilar, setState: setExcludeSimilar },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => opt.setState(!opt.state)}
                  aria-pressed={opt.state}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    opt.state
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-sm">{opt.label}</span>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    opt.state ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {opt.state && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          )}

          {mode === 'passphrase' && (
            <div className="space-y-6" id="passphrase-panel" role="tabpanel">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: t('passwordgenerator.capitalize'), state: capitalizeWords, setState: setCapitalizeWords },
                  { label: t('passwordgenerator.add_number'), state: addNumber, setState: setAddNumber },
                  { label: t('passwordgenerator.add_symbol'), state: addSymbol, setState: setAddSymbol },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => opt.setState(!opt.state)}
                    aria-pressed={opt.state}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      opt.state
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="font-bold text-xs">{opt.label}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      opt.state ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {opt.state && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('passwordgenerator.passphrase_info')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden flex flex-col justify-center">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
           <Activity className="w-12 h-12 mb-6 opacity-50" />
           <h3 className="text-2xl font-black mb-4">{t('passwordgenerator.entropy_calc')}</h3>
           <p className="text-indigo-100 font-medium leading-relaxed mb-6">
             {t('passwordgenerator.entropy_desc')}
           </p>
           <ul className="space-y-2 text-sm text-indigo-100/80">
             <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-300" /> 40 bits : {t('passwordgenerator.strength.very_weak')} ({t('passwordgenerator.time.seconds')})</li>
             <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-300" /> 60 bits : {t('passwordgenerator.strength.standard')} ({t('passwordgenerator.time.days_months')})</li>
             <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-300" /> 80 bits : {t('passwordgenerator.strength.strong')} ({t('passwordgenerator.time.centuries')})</li>
             <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-300" /> 128 bits+ : {t('passwordgenerator.strength.unbreakable')}</li>
           </ul>
        </div>
      </div>
    </div>
  );
}
