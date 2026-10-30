import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Calendar,
  Info,
  Landmark,
  History,
  BookOpen,
  User,
  Trash2,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

interface Preset {
  id: string;
  label: string;
  year: string;
  month: string;
  quarters: string;
  description: string;
}

const PRESETS: Preset[] = [
  {
    id: "early-career",
    label: "Début de carrière (1995)",
    year: "1995",
    month: "1",
    quarters: "16",
    description: "Né en 1995 - 16 trimestres validés",
  },
  {
    id: "mid-career",
    label: "Milieu de carrière (1980)",
    year: "1980",
    month: "6",
    quarters: "80",
    description: "Né en 1980 - 80 trimestres validés",
  },
  {
    id: "senior-career",
    label: "Carrière avancée (1965)",
    year: "1965",
    month: "3",
    quarters: "140",
    description: "Né en 1965 - 140 trimestres validés",
  },
  {
    id: "pre-retirement",
    label: "Proche retraite (1961)",
    year: "1961",
    month: "9",
    quarters: "168",
    description: "Né en sep. 1961 - 168 trimestres validés",
  },
];

export function RetirementCalculator() {
  const [birthYear, setBirthYear] = useState<string>("1980");
  const [birthMonth, setBirthMonth] = useState<string>("1");
  const [validatedQuarters, setValidatedQuarters] = useState<string>("0");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const birthYearInputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const year = parseInt(birthYear, 10);
    const month = parseInt(birthMonth, 10);
    const quarters = parseInt(validatedQuarters, 10) || 0;

    if (isNaN(year) || year < 1950 || year > 2024) return null;

    let legalAgeMonths = 62 * 12;
    let requiredQuarters = 167;

    if (year < 1961 || (year === 1961 && month < 9)) {
      legalAgeMonths = 62 * 12;
      requiredQuarters = 167;
    } else if (year === 1961 && month >= 9) {
      legalAgeMonths = 62 * 12 + 3;
      requiredQuarters = 168;
    } else if (year === 1962) {
      legalAgeMonths = 62 * 12 + 6;
      requiredQuarters = 169;
    } else if (year === 1963) {
      legalAgeMonths = 62 * 12 + 9;
      requiredQuarters = 170;
    } else if (year === 1964) {
      legalAgeMonths = 63 * 12;
      requiredQuarters = 171;
    } else if (year === 1965) {
      legalAgeMonths = 63 * 12 + 3;
      requiredQuarters = 172;
    } else if (year === 1966) {
      legalAgeMonths = 63 * 12 + 6;
      requiredQuarters = 172;
    } else if (year === 1967) {
      legalAgeMonths = 63 * 12 + 9;
      requiredQuarters = 172;
    } else {
      legalAgeMonths = 64 * 12;
      requiredQuarters = 172;
    }

    const retirementYear = year + Math.floor(legalAgeMonths / 12);
    const retirementMonth = month + (legalAgeMonths % 12);

    let finalRetirementYear = retirementYear;
    let finalRetirementMonth = retirementMonth;
    if (finalRetirementMonth > 12) {
      finalRetirementYear += 1;
      finalRetirementMonth -= 12;
    }

    const remainingQuarters = Math.max(0, requiredQuarters - quarters);

    return {
      legalAgeYears: Math.floor(legalAgeMonths / 12),
      legalAgeRemainingMonths: legalAgeMonths % 12,
      requiredQuarters,
      retirementDate: `${String(finalRetirementMonth).padStart(2, "0")}/${finalRetirementYear}`,
      remainingQuarters,
      isFullRate: quarters >= requiredQuarters,
    };
  }, [birthYear, birthMonth, validatedQuarters]);

  const handleApplyPreset = (preset: Preset) => {
    setBirthYear(preset.year);
    setBirthMonth(preset.month);
    setValidatedQuarters(preset.quarters);
    setActivePresetId(preset.id);
    toast.success(`Préréglage appliqué : ${preset.label}`);
    birthYearInputRef.current?.focus();
  };

  const handleClear = useCallback(() => {
    setBirthYear("1980");
    setBirthMonth("1");
    setValidatedQuarters("0");
    setActivePresetId(null);
    toast.success("Calculateur de retraite réinitialisé");
    birthYearInputRef.current?.focus();
  }, []);

  const handleCopySummary = useCallback(() => {
    if (!results) {
      toast.error("Veuillez saisir une année de naissance valide.");
      return;
    }
    const summaryText = [
      `--- Estimation de Retraite ---`,
      `Date de naissance : ${birthMonth.padStart(2, "0")}/${birthYear}`,
      `Trimestres validés : ${validatedQuarters}`,
      `Âge légal de départ : ${results.legalAgeYears} ans${results.legalAgeRemainingMonths > 0 ? ` et ${results.legalAgeRemainingMonths} mois` : ""}`,
      `Date de départ estimée : ${results.retirementDate}`,
      `Trimestres requis : ${results.requiredQuarters}`,
      `Reste à valider : ${results.remainingQuarters} trimestre(s)`,
    ].join("\n");

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    toast.success("Synthèse de retraite copiée dans le presse-papiers !");
    setTimeout(() => setCopied(false), 2000);
  }, [results, birthMonth, birthYear, validatedQuarters]);

  const handlersRef = useRef({ handleClear, handleCopySummary });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopySummary };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;

      const activeElem = document.activeElement;
      const isInput =
        activeElem &&
        (activeElem.tagName === "INPUT" ||
          activeElem.tagName === "SELECT" ||
          activeElem.tagName === "TEXTAREA");

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (
        (e.key === "c" || e.key === "C") &&
        !isInput &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        handlersRef.current.handleCopySummary();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-8">
      {/* Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Préréglages rapides de carrière
          </label>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Kbd modifier={null}>Esc</Kbd> Réinit.
            <Kbd modifier={null}>C</Kbd> Copier
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              aria-pressed={activePresetId === preset.id}
              className={`p-3 rounded-2xl text-left border transition-all text-xs font-bold focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePresetId === preset.id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                  : "bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="truncate">{preset.label}</div>
              <div
                className={`text-[10px] mt-0.5 truncate font-normal ${
                  activePresetId === preset.id ? "text-indigo-100" : "text-slate-400"
                }`}
              >
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label
              htmlFor="birth-year"
              className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
            >
              <User className="w-3.5 h-3.5" /> Date de naissance
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="birth-month"
                className="text-[10px] font-bold text-slate-400 uppercase px-1"
              >
                Mois
              </label>
              <select
                id="birth-month"
                value={birthMonth}
                onChange={(e) => {
                  setBirthMonth(e.target.value);
                  setActivePresetId(null);
                }}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString("fr-FR", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="birth-year"
                className="text-[10px] font-bold text-slate-400 uppercase px-1"
              >
                Année
              </label>
              <input
                id="birth-year"
                ref={birthYearInputRef}
                type="number"
                value={birthYear}
                onChange={(e) => {
                  setBirthYear(e.target.value);
                  setActivePresetId(null);
                }}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="1980"
                min="1950"
                max="2024"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label
              htmlFor="quarters"
              className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2"
            >
              <History className="w-3.5 h-3.5" /> Trimestres déjà validés
            </label>
            <input
              id="quarters"
              type="number"
              value={validatedQuarters}
              onChange={(e) => {
                setValidatedQuarters(e.target.value);
                setActivePresetId(null);
              }}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
              placeholder="0"
              min="0"
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-6 rounded-3xl flex items-start gap-4">
            <div className="p-2 bg-white dark:bg-slate-800 text-amber-600 rounded-xl shadow-sm shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
              Calcul basé sur la réforme française des retraites de 2023. Les cas particuliers (carrières longues, pénibilité, handicap) nécessitent une étude personnalisée.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs text-center">
              Âge légal de départ
            </div>
            <div className="text-5xl md:text-7xl font-black text-white font-mono tracking-tighter text-center">
              {results ? `${results.legalAgeYears} ans` : "--"}
              {results && results.legalAgeRemainingMonths > 0 && (
                <span className="text-2xl md:text-3xl block text-indigo-400">
                  et {results.legalAgeRemainingMonths} mois
                </span>
              )}
            </div>
            <div className="text-indigo-400 font-bold text-sm uppercase tracking-widest text-center mt-2">
              Date estimée : {results ? results.retirementDate : "--"}
            </div>

            <button
              onClick={handleCopySummary}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copied ? "Synthèse copiée !" : "Copier la synthèse"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Trimestres requis
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {results ? results.requiredQuarters : "--"}
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-3xl space-y-2 text-center">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Reste à valider
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {results ? results.remainingQuarters : "--"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">La réforme 2023</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La réforme prévoit un relèvement progressif de l'âge légal de 62 à 64 ans, à raison de 3 mois par génération à partir du 1er septembre 1961.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Durée d'assurance</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Pour obtenir une retraite à "taux plein", vous devez valider un certain nombre de trimestres (172 pour les générations 1965 et après).
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Landmark className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Âge du taux plein</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'âge d'annulation de la décote reste fixé à 67 ans, même si vous n'avez pas tous vos trimestres.
          </p>
        </div>
      </div>
    </div>
  );
}
