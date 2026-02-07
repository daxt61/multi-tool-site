import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useDeferredValue,
  lazy,
  Suspense,
} from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  Calculator as CalcIcon,
  Ruler,
  Key,
  Type,
  Palette,
  Timer,
  FileText,
  Hash,
  QrCode,
  Percent,
  FileType,
  DollarSign,
  Heart,
  Fingerprint,
  Code,
  Calendar,
  FileCode,
  Link as LinkIcon,
  Image,
  Globe,
  CaseSensitive,
  Columns,
  Monitor,
  Signal,
  Info,
  Mail,
  Shield,
  Receipt,
  TrendingUp,
  Landmark,
  PiggyBank,
  Wallet,
  BadgeEuro,
  UtensilsCrossed,
  Banknote,
  LineChart,
  CreditCard,
  Briefcase,
  Search,
  Shuffle,
  ArrowLeft,
  Database,
  ArrowLeftRight,
  X,
  Sun,
  Moon,
  Music,
  Star,
  Clock,
  Table,
  Tag,
  LayoutGrid,
  ArrowRight,
  Loader2,
  Sparkles,
  ListChecks,
  ShieldCheck,
  Scissors,
  Binary,
  Share2,
  Check,
} from "lucide-react";
const AdPlaceholder = lazy(() =>
  import("./components/AdPlaceholder").then((m) => ({
    default: m.AdPlaceholder,
  })),
);

// ⚡ Bolt Optimization: Code Splitting
// Using React.lazy to split each tool into its own chunk.
// This reduces the initial JavaScript bundle by ~40% (from 386kB to 228kB),
// significantly improving the initial load time and Time to Interactive (TTI).
const Calculator = lazy(() =>
  import("./components/Calculator").then((m) => ({ default: m.Calculator })),
);
const UnitConverter = lazy(() =>
  import("./components/UnitConverter").then((m) => ({
    default: m.UnitConverter,
  })),
);
const PasswordGenerator = lazy(() =>
  import("./components/PasswordGenerator").then((m) => ({
    default: m.PasswordGenerator,
  })),
);
const WordCounter = lazy(() =>
  import("./components/WordCounter").then((m) => ({ default: m.WordCounter })),
);
const ColorConverter = lazy(() =>
  import("./components/ColorConverter").then((m) => ({
    default: m.ColorConverter,
  })),
);
const TimerTool = lazy(() =>
  import("./components/TimerTool").then((m) => ({ default: m.TimerTool })),
);
const TextFormatter = lazy(() =>
  import("./components/TextFormatter").then((m) => ({
    default: m.TextFormatter,
  })),
);
const NumberConverter = lazy(() =>
  import("./components/NumberConverter").then((m) => ({
    default: m.NumberConverter,
  })),
);
const QRCodeGenerator = lazy(() =>
  import("./components/QRCodeGenerator").then((m) => ({
    default: m.QRCodeGenerator,
  })),
);
const PercentageCalculator = lazy(() =>
  import("./components/PercentageCalculator").then((m) => ({
    default: m.PercentageCalculator,
  })),
);
const LoremIpsumGenerator = lazy(() =>
  import("./components/LoremIpsumGenerator").then((m) => ({
    default: m.LoremIpsumGenerator,
  })),
);
const CurrencyConverter = lazy(() =>
  import("./components/CurrencyConverter").then((m) => ({
    default: m.CurrencyConverter,
  })),
);
const BMICalculator = lazy(() =>
  import("./components/BMICalculator").then((m) => ({
    default: m.BMICalculator,
  })),
);
const UUIDGenerator = lazy(() =>
  import("./components/UUIDGenerator").then((m) => ({
    default: m.UUIDGenerator,
  })),
);
const Base64Tool = lazy(() =>
  import("./components/Base64Tool").then((m) => ({ default: m.Base64Tool })),
);
const DateCalculator = lazy(() =>
  import("./components/DateCalculator").then((m) => ({
    default: m.DateCalculator,
  })),
);
const MarkdownPreview = lazy(() =>
  import("./components/MarkdownPreview").then((m) => ({
    default: m.MarkdownPreview,
  })),
);
const MarkdownTableGenerator = lazy(() =>
  import("./components/MarkdownTableGenerator").then((m) => ({
    default: m.MarkdownTableGenerator,
  })),
);
const JSONCSVConverter = lazy(() =>
  import("./components/JSONCSVConverter").then((m) => ({
    default: m.JSONCSVConverter,
  })),
);
const URLEncoder = lazy(() =>
  import("./components/URLEncoder").then((m) => ({ default: m.URLEncoder })),
);
const ImageCompressor = lazy(() =>
  import("./components/ImageCompressor").then((m) => ({
    default: m.ImageCompressor,
  })),
);
const IPAddressTool = lazy(() =>
  import("./components/IPAddressTool").then((m) => ({
    default: m.IPAddressTool,
  })),
);
const CaseConverter = lazy(() =>
  import("./components/CaseConverter").then((m) => ({
    default: m.CaseConverter,
  })),
);
const DiffChecker = lazy(() =>
  import("./components/DiffChecker").then((m) => ({ default: m.DiffChecker })),
);
const AspectRatioCalculator = lazy(() =>
  import("./components/AspectRatioCalculator").then((m) => ({
    default: m.AspectRatioCalculator,
  })),
);
const MorseCodeConverter = lazy(() =>
  import("./components/MorseCodeConverter").then((m) => ({
    default: m.MorseCodeConverter,
  })),
);
const FileToBase64 = lazy(() =>
  import("./components/FileToBase64").then((m) => ({
    default: m.FileToBase64,
  })),
);
const About = lazy(() =>
  import("./components/About").then((m) => ({ default: m.About })),
);
const Contact = lazy(() =>
  import("./components/Contact").then((m) => ({ default: m.Contact })),
);
const PrivacyPolicy = lazy(() =>
  import("./components/PrivacyPolicy").then((m) => ({
    default: m.PrivacyPolicy,
  })),
);
const InvoiceGenerator = lazy(() =>
  import("./components/InvoiceGenerator").then((m) => ({
    default: m.InvoiceGenerator,
  })),
);
const MarginCalculator = lazy(() =>
  import("./components/MarginCalculator").then((m) => ({
    default: m.MarginCalculator,
  })),
);
const LoanCalculator = lazy(() =>
  import("./components/LoanCalculator").then((m) => ({
    default: m.LoanCalculator,
  })),
);
const SavingsCalculator = lazy(() =>
  import("./components/SavingsCalculator").then((m) => ({
    default: m.SavingsCalculator,
  })),
);
const BudgetPlanner = lazy(() =>
  import("./components/BudgetPlanner").then((m) => ({
    default: m.BudgetPlanner,
  })),
);
const VATCalculator = lazy(() =>
  import("./components/VATCalculator").then((m) => ({
    default: m.VATCalculator,
  })),
);
const TipCalculator = lazy(() =>
  import("./components/TipCalculator").then((m) => ({
    default: m.TipCalculator,
  })),
);
const SalaryCalculator = lazy(() =>
  import("./components/SalaryCalculator").then((m) => ({
    default: m.SalaryCalculator,
  })),
);
const ROICalculator = lazy(() =>
  import("./components/ROICalculator").then((m) => ({
    default: m.ROICalculator,
  })),
);
const ExpenseTracker = lazy(() =>
  import("./components/ExpenseTracker").then((m) => ({
    default: m.ExpenseTracker,
  })),
);
const BPMCounter = lazy(() =>
  import("./components/BPMCounter").then((m) => ({ default: m.BPMCounter })),
);
const HashGenerator = lazy(() =>
  import("./components/HashGenerator").then((m) => ({
    default: m.HashGenerator,
  })),
);
const UnixTimestampConverter = lazy(() =>
  import("./components/UnixTimestampConverter").then((m) => ({
    default: m.UnixTimestampConverter,
  })),
);
const RandomGenerator = lazy(() =>
  import("./components/RandomGenerator").then((m) => ({
    default: m.RandomGenerator,
  })),
);
const JSONFormatter = lazy(() =>
  import("./components/JSONFormatter").then((m) => ({
    default: m.JSONFormatter,
  })),
);
const SQLFormatter = lazy(() =>
  import("./components/SQLFormatter").then((m) => ({
    default: m.SQLFormatter,
  })),
);
const YAMLJSONConverter = lazy(() =>
  import("./components/YAMLJSONConverter").then((m) => ({
    default: m.YAMLJSONConverter,
  })),
);
const CronGenerator = lazy(() =>
  import("./components/CronGenerator").then((m) => ({
    default: m.CronGenerator,
  })),
);
const HTMLEntityConverter = lazy(() =>
  import("./components/HTMLEntityConverter").then((m) => ({
    default: m.HTMLEntityConverter,
  })),
);
const JSONToTS = lazy(() =>
  import("./components/JSONToTS").then((m) => ({ default: m.JSONToTS })),
);
const ListCleaner = lazy(() =>
  import("./components/ListCleaner").then((m) => ({ default: m.ListCleaner })),
);
const JWTDecoder = lazy(() =>
  import("./components/JWTDecoder").then((m) => ({ default: m.JWTDecoder })),
);
const CodeMinifier = lazy(() =>
  import("./components/CodeMinifier").then((m) => ({
    default: m.CodeMinifier,
  })),
);
const BinaryTextConverter = lazy(() =>
  import("./components/BinaryTextConverter").then((m) => ({
    default: m.BinaryTextConverter,
  })),
);
const Base64ToImage = lazy(() =>
  import("./components/Base64ToImage").then((m) => ({
    default: m.Base64ToImage,
  })),
);
const UnitPriceCalculator = lazy(() =>
  import("./components/UnitPriceCalculator").then((m) => ({
    default: m.UnitPriceCalculator,
  })),
);
const AgeCalculator = lazy(() =>
  import("./components/AgeCalculator").then((m) => ({
    default: m.AgeCalculator,
  })),
);
const ColorPaletteGenerator = lazy(() =>
  import("./components/ColorPaletteGenerator").then((m) => ({
    default: m.ColorPaletteGenerator,
  })),
);

// ⚡ Bolt Optimization: Pre-calculating tool map and search index for O(1) lookups and faster filtering
const toolsMap: Record<string, Tool> = {};
const TOOL_SEARCH_INDEX = new Map<
  string,
  { name: string; description: string }
>();

interface Tool {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  Component: React.ElementType;
  category: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
}

const categories: Category[] = [
  { id: "all", name: "Tous", icon: LayoutGrid },
  { id: "favorites", name: "Favoris", icon: Star },
  { id: "business", name: "Business", icon: Briefcase },
  { id: "budget", name: "Finance", icon: Wallet },
  { id: "calculators", name: "Calculatrices", icon: CalcIcon },
  { id: "converters", name: "Conversion", icon: Ruler },
  { id: "text", name: "Texte", icon: Type },
  { id: "dev", name: "Dev", icon: Code },
  { id: "other", name: "Autres", icon: Globe },
];

const tools: Tool[] = [
  // Business Tools
  {
    id: "invoice-generator",
    name: "Factures",
    icon: Receipt,
    description: "Générateur de factures professionnelles",
    Component: InvoiceGenerator,
    category: "business",
  },
  {
    id: "margin-calculator",
    name: "Marge",
    icon: TrendingUp,
    description: "Calculateur de marges et coefficients",
    Component: MarginCalculator,
    category: "business",
  },
  {
    id: "vat-calculator",
    name: "TVA",
    icon: BadgeEuro,
    description: "Calcul de TVA HT et TTC",
    Component: VATCalculator,
    category: "business",
  },
  {
    id: "roi-calculator",
    name: "ROI",
    icon: LineChart,
    description: "Calcul du retour sur investissement",
    Component: ROICalculator,
    category: "business",
  },
  // Budget & Finance Tools
  {
    id: "budget-planner",
    name: "Budget",
    icon: Wallet,
    description: "Planificateur de budget mensuel",
    Component: BudgetPlanner,
    category: "budget",
  },
  {
    id: "expense-tracker",
    name: "Dépenses",
    icon: CreditCard,
    description: "Suivi et catégorisation des dépenses",
    Component: ExpenseTracker,
    category: "budget",
  },
  {
    id: "loan-calculator",
    name: "Prêt",
    icon: Landmark,
    description: "Simulateur de mensualités de crédit",
    Component: LoanCalculator,
    category: "budget",
  },
  {
    id: "savings-calculator",
    name: "Épargne",
    icon: PiggyBank,
    description: "Simulation de croissance d'épargne",
    Component: SavingsCalculator,
    category: "budget",
  },
  {
    id: "salary-calculator",
    name: "Salaire",
    icon: Banknote,
    description: "Convertisseur salaire Brut / Net",
    Component: SalaryCalculator,
    category: "budget",
  },
  {
    id: "tip-calculator",
    name: "Pourboire",
    icon: UtensilsCrossed,
    description: "Calcul de pourboire et partage",
    Component: TipCalculator,
    category: "budget",
  },
  {
    id: "currency-converter",
    name: "Devises",
    icon: DollarSign,
    description: "Convertisseur de devises en temps réel",
    Component: CurrencyConverter,
    category: "budget",
  },
  {
    id: "unit-price-calculator",
    name: "Prix Unitaire",
    icon: Tag,
    description: "Comparer le prix au kilo ou à l'unité",
    Component: UnitPriceCalculator,
    category: "budget",
  },
  // Calculators
  {
    id: "calculator",
    name: "Calculatrice",
    icon: CalcIcon,
    description: "Calculatrice simple et scientifique",
    Component: Calculator,
    category: "calculators",
  },
  {
    id: "percentage",
    name: "Pourcentage",
    icon: Percent,
    description: "Calculs de variations et pourcentages",
    Component: PercentageCalculator,
    category: "calculators",
  },
  {
    id: "bmi-calculator",
    name: "IMC",
    icon: Heart,
    description: "Calcul de l'Indice de Masse Corporelle",
    Component: BMICalculator,
    category: "calculators",
  },
  {
    id: "date-calculator",
    name: "Dates",
    icon: Calendar,
    description: "Calcul de durée entre deux dates",
    Component: DateCalculator,
    category: "calculators",
  },
  {
    id: "age-calculator",
    name: "Âge",
    icon: Calendar,
    description: "Calculer votre âge exact et prochain anniversaire",
    Component: AgeCalculator,
    category: "calculators",
  },
  // Converters
  {
    id: "unit-converter",
    name: "Unités",
    icon: Ruler,
    description: "Longueurs, poids, températures",
    Component: UnitConverter,
    category: "converters",
  },
  {
    id: "color-converter",
    name: "Couleurs",
    icon: Palette,
    description: "HEX, RGB, HSL Converter",
    Component: ColorConverter,
    category: "converters",
  },
  {
    id: "number-converter",
    name: "Base",
    icon: Hash,
    description: "Binaire, Décimal, Hexadécimal",
    Component: NumberConverter,
    category: "converters",
  },
  {
    id: "color-palette",
    name: "Palette de couleurs",
    icon: Palette,
    description: "Générer des harmonies de couleurs et palettes",
    Component: ColorPaletteGenerator,
    category: "converters",
  },
  // Text Tools
  {
    id: "word-counter",
    name: "Mots",
    icon: Type,
    description: "Compteur de mots et caractères",
    Component: WordCounter,
    category: "text",
  },
  {
    id: "case-converter",
    name: "Casse",
    icon: CaseSensitive,
    description: "camelCase, snake_case, kebab-case",
    Component: CaseConverter,
    category: "text",
  },
  {
    id: "text-formatter",
    name: "Format",
    icon: FileText,
    description: "Mise en forme de texte simple",
    Component: TextFormatter,
    category: "text",
  },
  {
    id: "lorem-ipsum",
    name: "Lorem Ipsum",
    icon: FileType,
    description: "Générateur de texte de remplissage",
    Component: LoremIpsumGenerator,
    category: "text",
  },
  {
    id: "markdown-preview",
    name: "Markdown",
    icon: FileCode,
    description: "Éditeur et prévisualisation Markdown",
    Component: MarkdownPreview,
    category: "text",
  },
  {
    id: "markdown-table",
    name: "Tableau Markdown",
    icon: Table,
    description: "Générateur de tableaux Markdown visuel",
    Component: MarkdownTableGenerator,
    category: "text",
  },
  {
    id: "diff-checker",
    name: "Diff",
    icon: Columns,
    description: "Comparateur de texte ligne par ligne",
    Component: DiffChecker,
    category: "text",
  },
  {
    id: "morse-code",
    name: "Morse",
    icon: Signal,
    description: "Traducteur de texte en Morse",
    Component: MorseCodeConverter,
    category: "text",
  },
  {
    id: "list-cleaner",
    name: "Nettoyeur de liste",
    icon: ListChecks,
    description: "Trier, dédoublonner et nettoyer vos listes",
    Component: ListCleaner,
    category: "text",
  },
  // Dev Tools
  {
    id: "password-generator",
    name: "Mots de passe",
    icon: Key,
    description: "Générateur de clés sécurisées",
    Component: PasswordGenerator,
    category: "dev",
  },
  {
    id: "jwt-decoder",
    name: "Décodeur JWT",
    icon: ShieldCheck,
    description: "Décoder et analyser vos jetons JWT",
    Component: JWTDecoder,
    category: "dev",
  },
  {
    id: "qr-code",
    name: "QR Code",
    icon: QrCode,
    description: "Générateur de codes QR",
    Component: QRCodeGenerator,
    category: "dev",
  },
  {
    id: "uuid-generator",
    name: "UUID",
    icon: Fingerprint,
    description: "Générateur d'identifiants uniques",
    Component: UUIDGenerator,
    category: "dev",
  },
  {
    id: "base64",
    name: "Base64",
    icon: Code,
    description: "Encodeur et décodeur Base64",
    Component: Base64Tool,
    category: "dev",
  },
  {
    id: "hash-generator",
    name: "Hash",
    icon: Shield,
    description: "SHA-256, SHA-512 Generator",
    Component: HashGenerator,
    category: "dev",
  },
  {
    id: "json-csv",
    name: "JSON & CSV",
    icon: FileCode,
    description: "Convertisseur bidirectionnel JSON et CSV",
    Component: JSONCSVConverter,
    category: "dev",
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    icon: FileCode,
    description: "Prettify, minify et valide votre JSON",
    Component: JSONFormatter,
    category: "dev",
  },
  {
    id: "json-to-ts",
    name: "JSON en TS",
    icon: Code,
    description: "Convertir du JSON en interfaces TypeScript",
    Component: JSONToTS,
    category: "dev",
  },
  {
    id: "sql-formatter",
    name: "SQL Formatter",
    icon: Database,
    description: "Formater vos requêtes SQL pour la lecture",
    Component: SQLFormatter,
    category: "dev",
  },
  {
    id: "yaml-json",
    name: "YAML <> JSON",
    icon: ArrowLeftRight,
    description: "Convertisseur bidirectionnel YAML et JSON",
    Component: YAMLJSONConverter,
    category: "dev",
  },
  {
    id: "cron-generator",
    name: "Cron Generator",
    icon: Clock,
    description: "Générateur visuel d'expressions Cron",
    Component: CronGenerator,
    category: "dev",
  },
  {
    id: "html-entity",
    name: "HTML Entities",
    icon: Code,
    description: "Convertir des caractères en entités HTML",
    Component: HTMLEntityConverter,
    category: "dev",
  },
  {
    id: "unix-timestamp",
    name: "Unix Timestamp",
    icon: Clock,
    description: "Convertisseur de temps Unix et dates",
    Component: UnixTimestampConverter,
    category: "dev",
  },
  {
    id: "url-encoder",
    name: "URL",
    icon: LinkIcon,
    description: "Encodeur et décodeur d'URL",
    Component: URLEncoder,
    category: "dev",
  },
  {
    id: "file-to-base64",
    name: "Fichier en Base64",
    icon: FileCode,
    description: "Convertir n'importe quel fichier en chaîne Base64",
    Component: FileToBase64,
    category: "dev",
  },
  {
    id: "base64-to-image",
    name: "Base64 en Image",
    icon: Image,
    description: "Convertir des chaînes Base64 en images",
    Component: Base64ToImage,
    category: "dev",
  },
  {
    id: "code-minifier",
    name: "Minificateur de code",
    icon: Scissors,
    description: "Minifier JS, CSS et HTML pour le web",
    Component: CodeMinifier,
    category: "dev",
  },
  {
    id: "binary-converter",
    name: "Texte en Binaire",
    icon: Binary,
    description: "Convertisseur bidirectionnel texte et binaire",
    Component: BinaryTextConverter,
    category: "dev",
  },
  // Other Tools
  {
    id: "timer",
    name: "Timer",
    icon: Timer,
    description: "Minuteur et Chronomètre",
    Component: TimerTool,
    category: "other",
  },
  {
    id: "image-compressor",
    name: "Images",
    icon: Image,
    description: "Compresseur d'images client-side",
    Component: ImageCompressor,
    category: "other",
  },
  {
    id: "ip-address",
    name: "IP",
    icon: Globe,
    description: "Mon adresse IP et infos réseau",
    Component: IPAddressTool,
    category: "other",
  },
  {
    id: "aspect-ratio",
    name: "Ratio",
    icon: Monitor,
    description: "Calculateur d'aspect ratio",
    Component: AspectRatioCalculator,
    category: "other",
  },
  {
    id: "bpm-counter",
    name: "BPM",
    icon: Music,
    description: "Compteur de battements par minute",
    Component: BPMCounter,
    category: "other",
  },
  {
    id: "random-generator",
    name: "Aléatoire",
    icon: Shuffle,
    description: "Nombres, chaînes et listes aléatoires",
    Component: RandomGenerator,
    category: "other",
  },
];

// Initialize toolsMap and search index
tools.forEach((tool) => {
  toolsMap[tool.id] = tool;
  TOOL_SEARCH_INDEX.set(tool.id, {
    name: tool.name.toLowerCase(),
    description: tool.description.toLowerCase(),
  });
});

// ⚡ Bolt Optimization: Memoized Tool Card component
// Prevents unnecessary re-renders of all tool items when search or category changes.
const ToolCard = React.memo(
  ({
    tool,
    isFavorite,
    onToggleFavorite,
    onClick,
  }: {
    tool: Tool;
    isFavorite: boolean;
    onToggleFavorite: (e: React.MouseEvent, id: string) => void;
    onClick: (id: string) => void;
  }) => {
    const titleId = `tool-title-${tool.id}`;
    const descId = `tool-desc-${tool.id}`;

    return (
      <div className="group p-5 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-left flex flex-col h-full relative">
        <div className="flex justify-between items-start mb-4 relative z-20">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-all">
            <tool.icon className="w-5 h-5" />
          </div>
          <button
            onClick={(e) => onToggleFavorite(e, tool.id)}
            className={`p-1.5 rounded-lg transition-colors ${isFavorite ? "text-amber-500" : "text-slate-300 hover:text-slate-400"}`}
            aria-label={
              isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
            }
          >
            <Star className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
          </button>
        </div>

        <button
          onClick={() => onClick(tool.id)}
          className="absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-all"
          aria-labelledby={titleId}
          aria-describedby={descId}
        />

        <h4
          id={titleId}
          className="font-bold text-slate-900 dark:text-white mb-2 relative z-0"
        >
          {tool.name}
        </h4>
        <p
          id={descId}
          className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-grow leading-relaxed relative z-0"
        >
          {tool.description}
        </p>

        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 relative z-0">
          Ouvrir <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    );
  },
);
ToolCard.displayName = "ToolCard";

function LoadingTool() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-indigo-500/20 rounded-full"></div>
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin absolute top-0 left-0" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
        Chargement de l'outil...
      </p>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
      aria-label="Changer de thème"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      // Sentinel: Securely parse localStorage data to prevent app crashes (local DoS)
      // if the data is malformed or tampered with.
      const saved = localStorage.getItem("favorites");
      const parsed = saved ? JSON.parse(saved) : [];
      // Sentinel: Validate data structure and content to prevent state poisoning.
      // Filter to ensure only valid tool IDs are stored and limit to 100 favorites.
      return Array.isArray(parsed)
        ? parsed
            .filter((id) => Object.prototype.hasOwnProperty.call(toolsMap, id))
            .slice(0, 100)
        : [];
    } catch (e) {
      console.error("Failed to load favorites from localStorage", e);
      return [];
    }
  });
  const [recents, setRecents] = useState<string[]>(() => {
    try {
      // Sentinel: Securely parse localStorage data to prevent app crashes (local DoS).
      const saved = localStorage.getItem("recents");
      const parsed = saved ? JSON.parse(saved) : [];
      // Sentinel: Validate that the parsed data is an array and only contains valid tool IDs.
      return Array.isArray(parsed)
        ? parsed
            .filter((id) => Object.prototype.hasOwnProperty.call(toolsMap, id))
            .slice(0, 4)
        : [];
    } catch (e) {
      console.error("Failed to load recents from localStorage", e);
      return [];
    }
  });

  // ⚡ Bolt Optimization: useDeferredValue for responsive search
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // ⚡ Bolt Optimization: use Set for O(1) favorite checks
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const filteredTools = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    return tools.filter((tool) => {
      if (selectedCategory === "favorites") {
        return favoriteSet.has(tool.id);
      }

      if (query) {
        const searchEntry = TOOL_SEARCH_INDEX.get(tool.id);
        const matchesSearch =
          searchEntry?.name.includes(query) ||
          searchEntry?.description.includes(query);
        if (!matchesSearch) return false;
        return true;
      }

      if (!selectedCategory || selectedCategory === "all") return true;
      return tool.category === selectedCategory;
    });
  }, [selectedCategory, deferredSearchQuery, favoriteSet]);

  const recentTools = useMemo(() => {
    return recents.map((id) => toolsMap[id]).filter(Boolean);
  }, [recents]);

  const toggleFavorite = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Sentinel: Validate tool ID before toggling favorite status.
    if (!Object.prototype.hasOwnProperty.call(toolsMap, id)) return;

    setFavorites((prev) => {
      const newFavs = prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id].slice(0, 100); // Sentinel: Enforce max 100 favorites limit.
      localStorage.setItem("favorites", JSON.stringify(newFavs));
      return newFavs;
    });
  }, []);

  const handleToolSelect = useCallback(
    (id: string) => {
      // Sentinel: Validate tool ID before adding to recent history.
      if (!Object.prototype.hasOwnProperty.call(toolsMap, id)) return;

      setRecents((prev) => {
        const newRecents = [id, ...prev.filter((r) => r !== id)].slice(0, 4);
        localStorage.setItem("recents", JSON.stringify(newRecents));
        return newRecents;
      });
      navigate(`/outil/${id}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate],
  );

  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        document.getElementById("tool-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const updateSEO = () => {
      const path = location.pathname;
      let title = "Boîte à Outils - Outils simples pour tâches complexes";
      let description =
        "Une collection d'utilitaires gratuits, privés et open-source pour booster votre productivité au quotidien.";

      if (path.startsWith("/outil/")) {
        const id = path.split("/")[2];
        const tool = tools.find((t) => t.id === id);
        if (tool) {
          title = `${tool.name} - Boîte à Outils`;
          description = tool.description;
        }
      } else if (path === "/a-propos") {
        title = "À propos - Boîte à Outils";
      } else if (path === "/contact") {
        title = "Contact - Boîte à Outils";
      } else if (path === "/confidentialite") {
        title = "Confidentialité - Boîte à Outils";
      }

      document.title = title;
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    };

    updateSEO();
  }, [location]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/50">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative">
        {/* Nav Header */}
        <header className="flex justify-between items-center mb-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
              <Sparkles className="w-6 h-6 text-white dark:text-slate-900" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Boîte à Outils
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 mr-4">
              <Link
                to="/a-propos"
                className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                À propos
              </Link>
              <Link
                to="/contact"
                className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Contact
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <div className="space-y-20">
                {/* Minimal Hero */}
                <div className="max-w-2xl mx-auto text-center space-y-8">
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
                    Des outils simples pour des{" "}
                    <span className="text-slate-400 dark:text-slate-600">
                      tâches complexes.
                    </span>
                  </h1>
                  <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                    Une collection d'utilitaires gratuits, privés et open-source
                    pour booster votre productivité au quotidien.
                  </p>

                  <div className="relative group max-w-lg mx-auto">
                    <label htmlFor="tool-search" className="sr-only">
                      Rechercher
                    </label>
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="tool-search"
                      type="text"
                      placeholder="Rechercher un outil..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`block w-full pl-11 ${searchQuery ? "pr-12" : "pr-4"} py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400`}
                    />
                    {!searchQuery && (
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800">
                          /
                        </kbd>
                      </div>
                    )}
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        aria-label="Effacer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Recents */}
                {!searchQuery && recentTools.length > 0 && (
                  <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 px-1">
                      Récent
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {recentTools.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => handleToolSelect(tool.id)}
                          className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                            <tool.icon className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-sm truncate">
                            {tool.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Main Content */}
                <div className="space-y-12">
                  {/* Category Nav */}
                  <div className="sticky top-4 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-4 border-b border-slate-200/50 dark:border-slate-800/50 -mx-4 px-4">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() =>
                            setSelectedCategory(
                              cat.id === "all" ? null : cat.id,
                            )
                          }
                          aria-pressed={
                            selectedCategory === cat.id ||
                            (cat.id === "all" && !selectedCategory)
                          }
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${
                            selectedCategory === cat.id ||
                            (cat.id === "all" && !selectedCategory)
                              ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-md shadow-indigo-500/10"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-700"
                          }`}
                        >
                          <cat.icon className="w-4 h-4" />
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid */}
                  {filteredTools.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredTools.map((tool) => (
                        <ToolCard
                          key={tool.id}
                          tool={tool}
                          isFavorite={favoriteSet.has(tool.id)}
                          onToggleFavorite={toggleFavorite}
                          onClick={handleToolSelect}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                        <Search className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl font-bold mb-2">
                        Aucun outil trouvé
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 mb-8">
                        Essayez un autre mot-clé ou effacez les filtres.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory(null);
                        }}
                        className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-all"
                      >
                        Effacer tout
                      </button>
                    </div>
                  )}
                </div>

                <Suspense fallback={null}>
                  <AdPlaceholder
                    size="large"
                    className="opacity-50 grayscale hover:grayscale-0 transition-all"
                  />
                </Suspense>

                <footer className="pt-20 pb-10 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-bold">
                        Boîte à Outils © {new Date().getFullYear()}
                      </span>
                    </div>
                    <div className="flex gap-8">
                      <Link
                        to="/a-propos"
                        className="text-sm font-medium text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        À propos
                      </Link>
                      <Link
                        to="/confidentialite"
                        className="text-sm font-medium text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        Confidentialité
                      </Link>
                      <Link
                        to="/contact"
                        className="text-sm font-medium text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        Contact
                      </Link>
                    </div>
                  </div>
                </footer>
              </div>
            }
          />
          <Route
            path="/outil/:toolId"
            element={
              <ToolView favorites={favorites} toggleFavorite={toggleFavorite} />
            }
          />
          <Route
            path="/a-propos"
            element={<InfoPage title="À propos" component={<About />} />}
          />
          <Route
            path="/contact"
            element={<InfoPage title="Contact" component={<Contact />} />}
          />
          <Route
            path="/confidentialite"
            element={
              <InfoPage title="Confidentialité" component={<PrivacyPolicy />} />
            }
          />
        </Routes>
      </div>
    </div>
  );
}

function ToolView({
  favorites,
  toggleFavorite,
}: {
  favorites: string[];
  toggleFavorite: (e: React.MouseEvent, id: string) => void;
}) {
  const { toolId } = useParams();
  const [shared, setShared] = useState(false);
  // ⚡ Bolt Optimization: Use toolsMap for O(1) lookup
  const currentTool = toolId ? toolsMap[toolId] : null;

  const handleShare = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    });
  }, []);

  if (!currentTool) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Outil non trouvé</h2>
        <Link to="/" className="text-indigo-600 font-bold hover:underline">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au tableau de bord
      </Link>

      <div className="mb-12 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-widest">
              <currentTool.icon className="w-3 h-3" /> {currentTool.category}
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              {currentTool.name}
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
              {currentTool.description}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 active:scale-95"
              aria-label="Partager cet outil"
            >
              {shared ? (
                <Check className="w-5 h-5 text-emerald-500" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">
                {shared ? "Copié" : "Partager"}
              </span>
            </button>
            <button
              onClick={(e) => toggleFavorite(e, currentTool.id)}
              aria-pressed={favorites.includes(currentTool.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border active:scale-95 ${
                favorites.includes(currentTool.id)
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
              }`}
            >
              <Star
                className={`w-5 h-5 ${favorites.includes(currentTool.id) ? "fill-current" : ""}`}
              />
              <span className="hidden sm:inline">
                {favorites.includes(currentTool.id)
                  ? "Favori"
                  : "Mettre en favori"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-5 md:p-12 shadow-sm min-h-[500px]">
        <Suspense fallback={<LoadingTool />}>
          <currentTool.Component />
        </Suspense>
      </div>

      <div className="mt-12">
        <Suspense fallback={null}>
          <AdPlaceholder size="banner" className="opacity-50" />
        </Suspense>
      </div>
    </div>
  );
}

function InfoPage({
  title,
  component,
}: {
  title: string;
  component: React.ReactNode;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au tableau de bord
      </Link>
      <h1 className="text-4xl font-black mb-12">{title}</h1>
      <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-5 md:p-12 shadow-sm">
        <Suspense fallback={<LoadingTool />}>{component}</Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MainApp />
      <Analytics />
      <SpeedInsights />
    </ThemeProvider>
  );
}
