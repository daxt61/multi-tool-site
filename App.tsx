import React, { useState, useEffect, useMemo, useCallback, useDeferredValue, lazy, Suspense } from "react";
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
  useSearchParams,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import i18n from "./i18n";
import {
  Calculator as CalcIcon,
  Ruler,
  Key,
  Play,
  Type,
  Palette,
  Timer,
  FileText,
  Hash,
  QrCode,
  Percent,
  FileType,
  Fuel,
  DollarSign,
  Blend,
  PieChart,
  Heart,
  Fingerprint,
  Code,
  Calendar,
  FileCode,
  Link as LinkIcon,
  Image as ImageIcon,
  Globe,
  CaseSensitive,
  Columns,
  Monitor,
  Maximize,
  Triangle,
  GraduationCap,
  Activity,
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
  Send,
  Briefcase,
  Search,
  Shuffle,
  MousePointer2,
  ArrowLeft,
  Database,
  ArrowLeftRight,
  X,
  Share2,
  Sun,
  Terminal,
  Music,
  Star,
  Check,
  Table,
  Eye,
  Braces,
  Tag,
  LayoutGrid,
  ArrowRight, Loader2,
  Sparkles,
  Moon,
  Droplets,
  ListChecks,
  ShieldCheck,
  Scissors,
  Binary,
  Volume2,
  Layers,
  Network,
  Clock,
  Download,
  FileUp,
  Target,
  ImagePlus,
  SunDim,
  Wifi,
  FileSearch,
} from "lucide-react";
const AdPlaceholder = lazy(() => import("./components/AdPlaceholder").then(m => ({ default: m.AdPlaceholder })));


// ⚡ Bolt Optimization: Code Splitting
// Using React.lazy to split each tool into its own chunk.
// This reduces the initial JavaScript bundle by ~40% (from 386kB to 228kB),
// significantly improving the initial load time and Time to Interactive (TTI).
const Calculator = lazy(() => import("./components/Calculator").then(m => ({ default: m.Calculator })));
const UnitConverter = lazy(() => import("./components/UnitConverter").then(m => ({ default: m.UnitConverter })));
const PasswordGenerator = lazy(() => import("./components/PasswordGenerator").then(m => ({ default: m.PasswordGenerator })));
const WordCounter = lazy(() => import("./components/WordCounter").then(m => ({ default: m.WordCounter })));
const ColorConverter = lazy(() => import("./components/ColorConverter").then(m => ({ default: m.ColorConverter })));
const TimerTool = lazy(() => import("./components/TimerTool").then(m => ({ default: m.TimerTool })));
const TextFormatter = lazy(() => import("./components/TextFormatter").then(m => ({ default: m.TextFormatter })));
const NumberConverter = lazy(() => import("./components/NumberConverter").then(m => ({ default: m.NumberConverter })));
const QRCodeGenerator = lazy(() => import("./components/QRCodeGenerator").then(m => ({ default: m.QRCodeGenerator })));
const PercentageCalculator = lazy(() => import("./components/PercentageCalculator").then(m => ({ default: m.PercentageCalculator })));
const LoremIpsumGenerator = lazy(() => import("./components/LoremIpsumGenerator").then(m => ({ default: m.LoremIpsumGenerator })));
const CurrencyConverter = lazy(() => import("./components/CurrencyConverter").then(m => ({ default: m.CurrencyConverter })));
const BMICalculator = lazy(() => import("./components/BMICalculator").then(m => ({ default: m.BMICalculator })));
const UUIDGenerator = lazy(() => import("./components/UUIDGenerator").then(m => ({ default: m.UUIDGenerator })));
const Base64Tool = lazy(() => import("./components/Base64Tool").then(m => ({ default: m.Base64Tool })));
const DateCalculator = lazy(() => import("./components/DateCalculator").then(m => ({ default: m.DateCalculator })));
const MarkdownPreview = lazy(() => import("./components/MarkdownPreview").then(m => ({ default: m.MarkdownPreview })));
const MarkdownTableGenerator = lazy(() => import("./components/MarkdownTableGenerator").then(m => ({ default: m.MarkdownTableGenerator })));
const JSONCSVConverter = lazy(() => import("./components/JSONCSVConverter").then(m => ({ default: m.JSONCSVConverter })));
const URLEncoder = lazy(() => import("./components/URLEncoder").then(m => ({ default: m.URLEncoder })));
const ImageCompressor = lazy(() => import("./components/ImageCompressor").then(m => ({ default: m.ImageCompressor })));
const IPAddressTool = lazy(() => import("./components/IPAddressTool").then(m => ({ default: m.IPAddressTool })));
const CaseConverter = lazy(() => import("./components/CaseConverter").then(m => ({ default: m.CaseConverter })));
const DiffChecker = lazy(() => import("./components/DiffChecker").then(m => ({ default: m.DiffChecker })));
const AspectRatioCalculator = lazy(() => import("./components/AspectRatioCalculator").then(m => ({ default: m.AspectRatioCalculator })));
const MorseCodeConverter = lazy(() => import("./components/MorseCodeConverter").then(m => ({ default: m.MorseCodeConverter })));
const FileToBase64 = lazy(() => import("./components/FileToBase64").then(m => ({ default: m.FileToBase64 })));
const About = lazy(() => import("./components/About").then(m => ({ default: m.About })));
const Contact = lazy(() => import("./components/Contact").then(m => ({ default: m.Contact })));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const InvoiceGenerator = lazy(() => import("./components/InvoiceGenerator").then(m => ({ default: m.InvoiceGenerator })));
const MarginCalculator = lazy(() => import("./components/MarginCalculator").then(m => ({ default: m.MarginCalculator })));
const LoanCalculator = lazy(() => import("./components/LoanCalculator").then(m => ({ default: m.LoanCalculator })));
const SavingsCalculator = lazy(() => import("./components/SavingsCalculator").then(m => ({ default: m.SavingsCalculator })));
const BudgetPlanner = lazy(() => import("./components/BudgetPlanner").then(m => ({ default: m.BudgetPlanner })));
const VATCalculator = lazy(() => import("./components/VATCalculator").then(m => ({ default: m.VATCalculator })));
const TipCalculator = lazy(() => import("./components/TipCalculator").then(m => ({ default: m.TipCalculator })));
const SalaryCalculator = lazy(() => import("./components/SalaryCalculator").then(m => ({ default: m.SalaryCalculator })));
const ROICalculator = lazy(() => import("./components/ROICalculator").then(m => ({ default: m.ROICalculator })));
const FuelCostCalculator = lazy(() => import("./components/FuelCostCalculator").then(m => ({ default: m.FuelCostCalculator })));
const ExpenseTracker = lazy(() => import("./components/ExpenseTracker").then(m => ({ default: m.ExpenseTracker })));
const BPMCounter = lazy(() => import("./components/BPMCounter").then(m => ({ default: m.BPMCounter })));
const HashGenerator = lazy(() => import("./components/HashGenerator").then(m => ({ default: m.HashGenerator })));
const UnixTimestampConverter = lazy(() => import("./components/UnixTimestampConverter").then(m => ({ default: m.UnixTimestampConverter })));
const RandomGenerator = lazy(() => import("./components/RandomGenerator").then(m => ({ default: m.RandomGenerator })));
const JSONFormatter = lazy(() => import("./components/JSONFormatter").then(m => ({ default: m.JSONFormatter })));
const SQLFormatter = lazy(() => import("./components/SQLFormatter").then(m => ({ default: m.SQLFormatter })));
const YAMLJSONConverter = lazy(() => import("./components/YAMLJSONConverter").then(m => ({ default: m.YAMLJSONConverter })));
const CronGenerator = lazy(() => import("./components/CronGenerator").then(m => ({ default: m.CronGenerator })));
const HTMLEntityConverter = lazy(() => import("./components/HTMLEntityConverter").then(m => ({ default: m.HTMLEntityConverter })));
const JSONToTS = lazy(() => import("./components/JSONToTS").then(m => ({ default: m.JSONToTS })));
const ListCleaner = lazy(() => import("./components/ListCleaner").then(m => ({ default: m.ListCleaner })));
const JWTDecoder = lazy(() => import("./components/JWTDecoder").then(m => ({ default: m.JWTDecoder })));
const CodeMinifier = lazy(() => import("./components/CodeMinifier").then(m => ({ default: m.CodeMinifier })));
const BinaryTextConverter = lazy(() => import("./components/BinaryTextConverter").then(m => ({ default: m.BinaryTextConverter })));
const Base64ToImage = lazy(() => import("./components/Base64ToImage").then(m => ({ default: m.Base64ToImage })));
const UnitPriceCalculator = lazy(() => import("./components/UnitPriceCalculator").then(m => ({ default: m.UnitPriceCalculator })));
const AgeCalculator = lazy(() => import("./components/AgeCalculator").then(m => ({ default: m.AgeCalculator })));
const ColorPaletteGenerator = lazy(() => import("./components/ColorPaletteGenerator").then(m => ({ default: m.ColorPaletteGenerator })));
const RegExTester = lazy(() => import("./components/RegExTester").then(m => ({ default: m.RegExTester })));
const UserAgentAnalyzer = lazy(() => import("./components/UserAgentAnalyzer").then(m => ({ default: m.UserAgentAnalyzer })));
const SlugGenerator = lazy(() => import("./components/SlugGenerator").then(m => ({ default: m.SlugGenerator })));
const Metronome = lazy(() => import("./components/Metronome").then(m => ({ default: m.Metronome })));
const TextToSpeech = lazy(() => import("./components/TextToSpeech").then(m => ({ default: m.TextToSpeech })));
const GlassmorphismGenerator = lazy(() => import("./components/GlassmorphismGenerator").then(m => ({ default: m.GlassmorphismGenerator })));
const ImageToWebP = lazy(() => import("./components/ImageToWebP").then(m => ({ default: m.ImageToWebP })));
const BMRCalculator = lazy(() => import("./components/BMRCalculator").then(m => ({ default: m.BMRCalculator })));
const NumberToWords = lazy(() => import("./components/NumberToWords").then(m => ({ default: m.NumberToWords })));
const BoxShadowGenerator = lazy(() => import("./components/BoxShadowGenerator").then(m => ({ default: m.BoxShadowGenerator })));
const MetaTagsGenerator = lazy(() => import("./components/MetaTagsGenerator").then(m => ({ default: m.MetaTagsGenerator })));
const CSSUnitConverter = lazy(() => import("./components/CSSUnitConverter").then(m => ({ default: m.CSSUnitConverter })));
const RomanNumeralConverter = lazy(() => import("./components/RomanNumeralConverter").then(m => ({ default: m.RomanNumeralConverter })));
const XMLFormatter = lazy(() => import("./components/XMLFormatter").then(m => ({ default: m.XMLFormatter })));
const ColorContrastChecker = lazy(() => import("./components/ColorContrastChecker").then(m => ({ default: m.ColorContrastChecker })));
const JSONSchemaGenerator = lazy(() => import("./components/JSONSchemaGenerator").then(m => ({ default: m.JSONSchemaGenerator })));
const ZodSchemaGenerator = lazy(() => import("./components/ZodSchemaGenerator").then(m => ({ default: m.ZodSchemaGenerator })));
const SubnetCalculator = lazy(() => import("./components/SubnetCalculator").then(m => ({ default: m.SubnetCalculator })));
const TimezoneConverter = lazy(() => import("./components/TimezoneConverter").then(m => ({ default: m.TimezoneConverter })));
const DownloadTimeCalculator = lazy(() => import("./components/DownloadTimeCalculator").then(m => ({ default: m.DownloadTimeCalculator })));
const FreelanceTaxCalculator = lazy(() => import("./components/FreelanceTaxCalculator").then(m => ({ default: m.FreelanceTaxCalculator })));
const SleepCalculator = lazy(() => import("./components/SleepCalculator").then(m => ({ default: m.SleepCalculator })));
const WaterCalculator = lazy(() => import("./components/WaterCalculator").then(m => ({ default: m.WaterCalculator })));
const UTMBuilder = lazy(() => import("./components/UTMBuilder").then(m => ({ default: m.UTMBuilder })));
const DiscountCalculator = lazy(() => import("./components/DiscountCalculator").then(m => ({ default: m.DiscountCalculator })));
const OvertimeCalculator = lazy(() => import("./components/OvertimeCalculator").then(m => ({ default: m.OvertimeCalculator })));
const RetirementCalculator = lazy(() => import("./components/RetirementCalculator").then(m => ({ default: m.RetirementCalculator })));
const GradeCalculator = lazy(() => import("./components/GradeCalculator").then(m => ({ default: m.GradeCalculator })));
const BodyFatCalculator = lazy(() => import("./components/BodyFatCalculator").then(m => ({ default: m.BodyFatCalculator })));
const BreakevenCalculator = lazy(() => import("./components/BreakevenCalculator").then(m => ({ default: m.BreakevenCalculator })));
const SocialMediaLinks = lazy(() => import("./components/SocialMediaLinks").then(m => ({ default: m.SocialMediaLinks })));
const MockDataGenerator = lazy(() => import("./components/MockDataGenerator").then(m => ({ default: m.MockDataGenerator })));
const ChartGenerator = lazy(() => import("./components/ChartGenerator").then(m => ({ default: m.ChartGenerator })));
const NatoPhoneticTranslator = lazy(() => import("./components/NatoPhoneticTranslator").then(m => ({ default: m.NatoPhoneticTranslator })));
const CreditCardValidator = lazy(() => import("./components/CreditCardValidator").then(m => ({ default: m.CreditCardValidator })));
const BrailleTranslator = lazy(() => import("./components/BrailleTranslator").then(m => ({ default: m.BrailleTranslator })));
const UrlParser = lazy(() => import("./components/UrlParser").then(m => ({ default: m.UrlParser })));
const JsonXmlConverter = lazy(() => import("./components/JsonXmlConverter").then(m => ({ default: m.JsonXmlConverter })));
const DPICalculator = lazy(() => import("./components/DPICalculator").then(m => ({ default: m.DPICalculator })));
const GPAConverter = lazy(() => import("./components/GPAConverter").then(m => ({ default: m.GPAConverter })));
const GradientGenerator = lazy(() => import("./components/GradientGenerator").then(m => ({ default: m.GradientGenerator })));
const CesarCipher = lazy(() => import("./components/CesarCipher").then(m => ({ default: m.CesarCipher })));
const DurationCalculator = lazy(() => import("./components/DurationCalculator").then(m => ({ default: m.DurationCalculator })));
const FinancialRatios = lazy(() => import("./components/FinancialRatios").then(m => ({ default: m.FinancialRatios })));
const ColorMixer = lazy(() => import("./components/ColorMixer").then(m => ({ default: m.ColorMixer })));
const ChmodCalculator = lazy(() => import("./components/ChmodCalculator").then(m => ({ default: m.ChmodCalculator })));
const LeetspeakConverter = lazy(() => import("./components/LeetspeakConverter").then(m => ({ default: m.LeetspeakConverter })));
const JsonTreeViewer = lazy(() => import("./components/JsonTreeViewer").then(m => ({ default: m.JsonTreeViewer })));
const CURLConverter = lazy(() => import("./components/CURLConverter").then(m => ({ default: m.CURLConverter })));
const SVGPlaceholder = lazy(() => import("./components/SVGPlaceholder").then(m => ({ default: m.SVGPlaceholder })));
const TextTransformer = lazy(() => import("./components/TextTransformer").then(m => ({ default: m.TextTransformer })));
const FinancialCalculator = lazy(() => import("./components/FinancialCalculator").then(m => ({ default: m.FinancialCalculator })));
const HTTPStatusCodes = lazy(() => import("./components/HTTPStatusCodes").then(m => ({ default: m.HTTPStatusCodes })));
const IBANValidator = lazy(() => import("./components/IBANValidator").then(m => ({ default: m.IBANValidator })));
const VigenereCipher = lazy(() => import("./components/VigenereCipher").then(m => ({ default: m.VigenereCipher })));
const ListComparator = lazy(() => import("./components/ListComparator").then(m => ({ default: m.ListComparator })));
const CursorReference = lazy(() => import("./components/CursorReference").then(m => ({ default: m.CursorReference })));
const WhatsAppLinkGenerator = lazy(() => import("./components/WhatsAppLinkGenerator").then(m => ({ default: m.WhatsAppLinkGenerator })));
const SecurityHeadersGenerator = lazy(() => import("./components/SecurityHeadersGenerator").then(m => ({ default: m.SecurityHeadersGenerator })));
const WiFiGenerator = lazy(() => import("./components/WiFiGenerator").then(m => ({ default: m.WiFiGenerator })));
const RobotsTxtGenerator = lazy(() => import("./components/RobotsTxtGenerator").then(m => ({ default: m.RobotsTxtGenerator })));
const CSSTriangleGenerator = lazy(() => import("./components/CSSTriangleGenerator").then(m => ({ default: m.CSSTriangleGenerator })));
const CSSBorderRadiusGenerator = lazy(() => import("./components/CSSBorderRadiusGenerator").then(m => ({ default: m.CSSBorderRadiusGenerator })));

// ⚡ Bolt Optimization: Pre-calculating tool map and search index for O(1) lookups and faster filtering
const toolsMap: Record<string, Tool> = {};
const TOOL_SEARCH_INDEX = new Map<string, { name: string; description: string }>();

interface Tool {
  id: string;
  name: string;
  nameEn?: string;
  icon: React.ElementType;
  description: string;
  descriptionEn?: string;
  Component: React.ElementType<{ initialData?: any; onStateChange?: (state: any) => void }>;
  category: string;
  keywords?: string[];
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
  { id: "health", name: "Santé", icon: Heart },
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
    nameEn: "Invoice Generator",
    icon: Receipt,
    description: "Générateur de factures professionnelles",
    descriptionEn: "Professional invoice generator",
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
  {
    id: "fuel-cost",
    name: "Coût Trajet",
    icon: Fuel,
    description: "Calculer le coût en carburant d'un trajet",
    Component: FuelCostCalculator,
    category: "business",
  },
  {
    id: "financial-ratios",
    name: "Ratios Financiers",
    icon: PieChart,
    description: "Calculer les ratios de liquidité, rentabilité et endettement",
    Component: FinancialRatios,
    category: "business",
  },
  {
    id: "freelance-tax",
    name: "Cotisations Freelance",
    icon: PiggyBank,
    description: "Simulation de cotisations auto-entrepreneur",
    Component: FreelanceTaxCalculator,
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
    keywords: ["crédit", "immobilier", "taux", "mensualité", "banque"],
  },
  {
    id: "savings-calculator",
    name: "Épargne",
    icon: PiggyBank,
    description: "Simulation de croissance d'épargne",
    Component: SavingsCalculator,
    category: "budget",
    keywords: ["argent", "capital", "intérêts", "placement", "retraite"],
  },
  {
    id: "compound-interest",
    name: "Intérêts Composés",
    icon: TrendingUp,
    description: "Calculateur de croissance d'investissement avec intérêts composés et tableau détaillé",
    Component: FinancialCalculator,
    category: "budget",
  },
  {
    id: "iban-validator",
    name: "Validateur IBAN",
    icon: CreditCard,
    description: "Vérifier la validité structurelle d'un IBAN (MOD-97)",
    Component: IBANValidator,
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
    keywords: ["argent", "change", "taux", "dollar", "euro", "voyage"],
  },
  {
    id: "unit-price-calculator",
    name: "Prix Unitaire",
    icon: Tag,
    description: "Comparer le prix au kilo ou à l'unité",
    Component: UnitPriceCalculator,
    category: "budget",
    keywords: ["achat", "comparaison", "kilo", "unité", "prix", "économies"],
  },
  {
    id: "discount-calculator",
    name: "Soldes & Remises",
    icon: Tag,
    description: "Calculer le prix final après une ou plusieurs remises",
    Component: DiscountCalculator,
    category: "budget",
  },
  {
    id: "overtime-calculator",
    name: "Heures Sup",
    icon: Clock,
    description: "Calculer le gain net des heures supplémentaires",
    Component: OvertimeCalculator,
    category: "budget",
  },
  {
    id: "retirement-calculator",
    name: "Retraite",
    icon: Landmark,
    description: "Âge légal et trimestres (Réforme 2023)",
    Component: RetirementCalculator,
    category: "budget",
  },
  {
    id: "grade-calculator",
    name: "Notes",
    icon: ListChecks,
    description: "Calculer sa moyenne et note nécessaire",
    Component: GradeCalculator,
    category: "calculators",
  },
  {
    id: "duration-calculator",
    name: "Durées",
    icon: Clock,
    description: "Additionner ou soustraire des intervalles de temps",
    Component: DurationCalculator,
    category: "calculators",
  },
  {
    id: "gpa-converter",
    name: "GPA",
    icon: GraduationCap,
    description: "Convertisseur de notes en GPA (4.0/5.0)",
    Component: GPAConverter,
    category: "calculators",
  },
  {
    id: "breakeven-calculator",
    name: "Seuil de Rentabilité",
    icon: Target,
    description: "Calculer le point mort et la rentabilité",
    Component: BreakevenCalculator,
    category: "business",
  },
  {
    id: "mock-data",
    name: "Mock Data",
    icon: Database,
    description: "Générateur de données de test (JSON, CSV)",
    Component: MockDataGenerator,
    category: "dev",
  },
  {
    id: "chart-generator",
    name: "Graphiques",
    icon: LineChart,
    description: "Générer des graphiques à partir de données",
    Component: ChartGenerator,
    category: "business",
  },
  // Calculators
  {
    id: "calculator",
    name: "Calculatrice",
    icon: CalcIcon,
    description: "Calculatrice simple et scientifique",
    Component: Calculator,
    category: "calculators",
    keywords: ["math", "calcul", "scientifique", "sin", "cos", "tan"],
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
    category: "health",
    keywords: ["imc", "bmi", "poids", "santé", "corps"],
  },
  {
    id: "body-fat-calculator",
    name: "Masse Grasse",
    icon: Activity,
    description: "Estimer son taux de graisse corporelle",
    Component: BodyFatCalculator,
    category: "health",
  },
  {
    id: "bmr-calculator",
    name: "BMR & TDEE",
    icon: Activity,
    description: "Métabolisme de base et besoins caloriques",
    Component: BMRCalculator,
    category: "health",
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
  {
    id: "sleep-calculator",
    name: "Sommeil",
    icon: Moon,
    description: "Calculer les cycles de sommeil et réveils idéaux",
    Component: SleepCalculator,
    category: "health",
  },
  {
    id: "water-calculator",
    name: "Besoins en Eau",
    icon: Droplets,
    description: "Estimer vos besoins en hydratation quotidienne",
    Component: WaterCalculator,
    category: "health",
  },
  // Converters
  {
    id: "unit-converter",
    name: "Unités",
    nameEn: "Unit Converter",
    icon: Ruler,
    description: "Longueurs, poids, températures",
    descriptionEn: "Length, weight, temperature converter",
    Component: UnitConverter,
    category: "converters",
    keywords: ["conversion", "mètres", "kilos", "température", "pression", "vitesse"],
  },
  {
    id: "css-unit-converter",
    name: "Unités CSS",
    icon: Maximize,
    description: "Convertir px, rem, em, vw, vh",
    Component: CSSUnitConverter,
    category: "converters",
  },
  {
    id: "color-converter",
    name: "Couleurs",
    icon: Palette,
    description: "HEX, RGB, HSL Converter",
    Component: ColorConverter,
    category: "converters",
    keywords: ["hex", "rgb", "hsl", "cmyk", "oklch", "contraste", "accessibilité", "wcag"],
  },
  {
    id: "number-converter",
    name: "Base",
    icon: Hash,
    description: "Binaire, Décimal, Hexadécimal",
    Component: NumberConverter,
    category: "converters",
    keywords: ["binaire", "hex", "décimal", "octal", "bigint", "base"],
  },
  {
    id: "dpi-calculator",
    name: "DPI / PPI",
    icon: Monitor,
    description: "Calculer la densité de pixels d'un écran",
    Component: DPICalculator,
    category: "converters",
  },
  {
    id: "roman-numeral",
    name: "Chiffres Romains",
    icon: Hash,
    description: "Convertisseur de chiffres romains",
    Component: RomanNumeralConverter,
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
  {
    id: "contrast-checker",
    name: "Contrast-mètre",
    icon: Eye,
    description: "Vérifier le contraste de couleurs (WCAG)",
    Component: ColorContrastChecker,
    category: "converters",
  },
  {
    id: "color-mixer",
    name: "Mélangeur de Couleurs",
    icon: Blend,
    description: "Mélanger deux couleurs pour en créer une nouvelle",
    Component: ColorMixer,
    category: "converters",
  },
  // Text Tools
  {
    id: "word-counter",
    name: "Mots",
    nameEn: "Word Counter",
    icon: Type,
    description: "Compteur de mots et caractères",
    descriptionEn: "Word and character counter",
    Component: WordCounter,
    category: "text",
    keywords: ["texte", "lettres", "lignes", "lisibilité", "seo", "densité", "mots-clés"],
  },
  {
    id: "text-transformer",
    name: "Transformateur",
    icon: Type,
    description: "Inverser, mettre à l'envers ou formater votre texte avec des styles Unicode",
    Component: TextTransformer,
    category: "text",
  },
  {
    id: "number-to-words",
    name: "Nombres en lettres",
    icon: FileText,
    description: "Convertir des nombres en toutes lettres",
    Component: NumberToWords,
    category: "text",
  },
  {
    id: "slug-generator",
    name: "Slug",
    icon: LinkIcon,
    description: "Générateur de slugs d'URL propres",
    Component: SlugGenerator,
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
    id: "cesar-cipher",
    name: "César",
    icon: Shield,
    description: "Chiffre de César pour crypter/décrypter du texte",
    Component: CesarCipher,
    category: "text",
  },
  {
    id: "vigenere-cipher",
    name: "Vigenère",
    icon: Key,
    description: "Chiffrer ou déchiffrer du texte avec le chiffre de Vigenère",
    Component: VigenereCipher,
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
    keywords: ["doublons", "tri", "préfixe", "suffixe", "nettoyage", "formatage"],
  },
  {
    id: "nato-translator",
    name: "Alphabet OTAN",
    icon: Volume2,
    description: "Traduire du texte en alphabet phonétique de l'OTAN (Alpha, Bravo...)",
    Component: NatoPhoneticTranslator,
    category: "text",
  },
  {
    id: "braille-translator",
    name: "Traducteur Braille",
    icon: Type,
    description: "Convertir du texte en Braille Grade 1 et vice versa",
    Component: BrailleTranslator,
    category: "text",
  },
  {
    id: "leetspeak-converter",
    name: "Leetspeak",
    icon: Type,
    description: "Convertir du texte en l3375p34|<",
    Component: LeetspeakConverter,
    category: "text",
  },
  // Dev Tools
  {
    id: "password-generator",
    name: "Mots de passe",
    nameEn: "Password Generator",
    icon: Key,
    description: "Générateur de clés sécurisées",
    descriptionEn: "Secure password generator",
    Component: PasswordGenerator,
    category: "dev",
    keywords: ["sécurité", "passphrase", "crypto", "robuste"],
  },
  {
    id: "credit-card-validator",
    name: "Validateur de Carte",
    icon: ShieldCheck,
    description: "Vérifier la validité d'une carte bancaire (Luhn)",
    Component: CreditCardValidator,
    category: "dev",
  },
  {
    id: "json-schema",
    name: "Schéma JSON",
    icon: Braces,
    description: "Générer un JSON Schema à partir d'un JSON",
    Component: JSONSchemaGenerator,
    category: "dev",
  },
  {
    id: "zod-schema",
    name: "Schéma Zod",
    icon: ShieldCheck,
    description: "Générer un schéma Zod à partir d'un JSON",
    Component: ZodSchemaGenerator,
    category: "dev",
    keywords: ["typescript", "validation", "zod", "schema", "json"],
  },
  {
    id: "json-tree-viewer",
    name: "JSON Tree Viewer",
    icon: Braces,
    description: "Visualiser et filtrer une structure JSON en arbre",
    Component: JsonTreeViewer,
    category: "dev",
  },
  {
    id: "chmod",
    name: "Chmod",
    icon: Terminal,
    description: "Calculateur de permissions Unix (Octal et Symbolique)",
    Component: ChmodCalculator,
    category: "dev",
    keywords: ["linux", "unix", "permissions", "chmod", "serveur", "sécurité"],
  },
  {
    id: "subnet-calculator",
    name: "Calculateur IP",
    icon: Network,
    description: "Calcul de sous-réseaux IPv4 et CIDR",
    Component: SubnetCalculator,
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
    keywords: ["code", "image", "url", "lien", "scanner"],
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
    id: "regex-tester",
    name: "RegEx",
    icon: Search,
    description: "Testeur d'expressions régulières",
    Component: RegExTester,
    category: "dev",
  },
  {
    id: "utm-builder",
    name: "UTM Builder",
    icon: Share2,
    description: "Générateur de liens de suivi UTM",
    Component: UTMBuilder,
    category: "dev",
  },
  {
    id: "social-links",
    name: "Liens Sociaux",
    icon: Share2,
    description: "Générer des liens de partage pour réseaux sociaux",
    Component: SocialMediaLinks,
    category: "dev",
  },
  {
    id: "box-shadow",
    name: "Box Shadow",
    icon: Layers,
    description: "Générateur visuel d'ombres CSS",
    Component: BoxShadowGenerator,
    category: "dev",
  },
  {
    id: "gradient-generator",
    name: "Dégradés CSS",
    icon: Palette,
    description: "Générateur visuel de dégradés CSS",
    Component: GradientGenerator,
    category: "dev",
  },
  {
    id: "meta-tags",
    name: "Meta Tags",
    icon: Search,
    description: "Générateur de balises meta SEO",
    Component: MetaTagsGenerator,
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
    id: "xml-formatter",
    name: "Formateur XML",
    icon: FileCode,
    description: "Embellir, minifier et valider votre XML",
    Component: XMLFormatter,
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
    id: "url-parser",
    name: "Analyseur d'URL",
    icon: Search,
    description: "Décortiquer une URL (protocole, hôte, paramètres)",
    Component: UrlParser,
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
    icon: ImageIcon,
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
    keywords: ["0101", "ASCII", "codage", "décodage", "ordinateur", "base2"],
  },
  {
    id: "json-xml",
    name: "JSON <> XML",
    icon: FileCode,
    description: "Convertisseur bidirectionnel JSON et XML",
    Component: JsonXmlConverter,
    category: "dev",
  },
  {
    id: "curl-converter",
    name: "cURL Converter",
    icon: Terminal,
    description: "Transformer des commandes cURL en fetch JavaScript",
    Component: CURLConverter,
    category: "dev",
  },
  {
    id: "svg-placeholder",
    name: "Placeholder SVG",
    icon: ImagePlus,
    description: "Générer des images de remplacement en SVG",
    Component: SVGPlaceholder,
    category: "dev",
  },
  {
    id: "http-status",
    name: "Codes HTTP",
    icon: Globe,
    description: "Référence complète des codes d'état HTTP",
    Component: HTTPStatusCodes,
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
    keywords: ["pomodoro", "chronomètre", "temps", "minuteur", "productivité"],
  },
  {
    id: "image-compressor",
    name: "Images",
    icon: ImageIcon,
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
  {
    id: "user-agent",
    name: "User Agent",
    icon: Monitor,
    description: "Analyseur de navigateur et système",
    Component: UserAgentAnalyzer,
    category: "other",
  },
  {
    id: "metronome",
    name: "Métronome",
    icon: Music,
    description: "Métronome précis pour la pratique musicale",
    Component: Metronome,
    category: "other",
  },
  {
    id: "text-to-speech",
    name: "Synthèse Vocale",
    icon: Volume2,
    description: "Convertir du texte en parole",
    Component: TextToSpeech,
    category: "other",
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    icon: Layers,
    description: "Générateur CSS d'effets de verre",
    Component: GlassmorphismGenerator,
    category: "dev",
  },
  {
    id: "image-to-webp",
    name: "Convertir en WebP",
    icon: ImageIcon,
    description: "Optimiser vos images au format WebP",
    Component: ImageToWebP,
    category: "other",
  },
  {
    id: "timezone-converter",
    name: "Fuseaux Horaires",
    icon: Clock,
    description: "Convertisseur de temps international",
    Component: TimezoneConverter,
    category: "other",
  },
  {
    id: "download-time",
    name: "Temps de téléchargement",
    icon: Clock,
    description: "Estimer le temps de transfert de fichiers",
    Component: DownloadTimeCalculator,
    category: "other",
  },
  {
    id: "list-comparator",
    name: "Comparateur de Listes",
    icon: Columns,
    description: "Comparer deux listes pour trouver les éléments communs ou uniques",
    Component: ListComparator,
    category: "text",
    keywords: ["liste", "comparaison", "doublons", "intersection", "différence"],
  },
  {
    id: "cursor-reference",
    name: "Curseurs CSS",
    icon: MousePointer2,
    description: "Référence visuelle et codes CSS pour tous les types de curseurs",
    Component: CursorReference,
    category: "dev",
    keywords: ["css", "cursor", "design", "ui", "ux", "souris"],
  },
  {
    id: "whatsapp-link",
    name: "Lien WhatsApp",
    icon: Send,
    description: "Générer un lien wa.me avec un message pré-rempli",
    Component: WhatsAppLinkGenerator,
    category: "business",
    keywords: ["contact", "message", "whatsapp", "link", "discussion"],
  },
  {
    id: "security-headers",
    name: "Headers Sécurité",
    icon: Shield,
    description: "Générer des en-têtes de sécurité HTTP (CSP, HSTS, etc.)",
    Component: SecurityHeadersGenerator,
    category: "dev",
    keywords: ["sécurité", "http", "headers", "csp", "hsts", "protection", "security"],
  },
  {
    id: "wifi-generator",
    name: "WiFi QR Code",
    icon: Wifi,
    description: "Générer un QR Code pour partager votre connexion WiFi",
    Component: WiFiGenerator,
    category: "other",
    keywords: ["wifi", "qr", "code", "réseau", "partage", "sécurité", "connexion"],
  },
  {
    id: "robots-txt",
    name: "Robots.txt",
    icon: FileSearch,
    description: "Générer un fichier robots.txt pour le SEO",
    Component: RobotsTxtGenerator,
    category: "dev",
    keywords: ["seo", "robots", "txt", "google", "indexation", "sitemap", "webmaster"],
  },
  {
    id: "css-triangle",
    name: "Triangle CSS",
    nameEn: "CSS Triangle",
    icon: Triangle,
    description: "Générateur visuel de triangles en pur CSS",
    descriptionEn: "Visual pure CSS triangle generator",
    Component: CSSTriangleGenerator,
    category: "dev",
    keywords: ["css", "triangle", "shape", "design", "frontend", "pure css"],
  },
  {
    id: "css-border-radius",
    name: "Border Radius CSS",
    nameEn: "CSS Border Radius",
    icon: Maximize,
    description: "Générateur visuel de border-radius pour CSS",
    descriptionEn: "Visual CSS border-radius generator",
    Component: CSSBorderRadiusGenerator,
    category: "dev",
    keywords: ["css", "border-radius", "design", "frontend", "rounded corners"],
  },
];

// Initialize toolsMap and search index
tools.forEach(tool => {
  toolsMap[tool.id] = tool;
  const category = categories.find(c => c.id === tool.category);
  TOOL_SEARCH_INDEX.set(tool.id, {
    name: `${tool.name} ${category?.name || ''} ${tool.keywords?.join(' ') || ''}`.toLowerCase(),
    description: tool.description.toLowerCase(),
  });
});

// ⚡ Bolt Optimization: Memoized Tool Card component
// Prevents unnecessary re-renders of all tool items when search or category changes.
const ToolCard = React.memo(({ tool, isFavorite, onToggleFavorite }: {
  tool: Tool;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
}) => {
  const titleId = `tool-title-${tool.id}`;
  const descId = `tool-desc-${tool.id}`;

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'fr';
  const name = (currentLang === 'en' && tool.nameEn) ? tool.nameEn : tool.name;
  const description = (currentLang === 'en' && tool.descriptionEn) ? tool.descriptionEn : tool.description;

  return (
    <div
      className="group p-5 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-left flex flex-col h-full relative"
    >
      <div className="flex justify-between items-start mb-4 relative z-20">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-all group-hover:rotate-3">
          <tool.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
          <span className="sr-only">{currentLang === 'fr' ? `Icône de ${name}` : `${name} icon`}</span>
        </div>
        <button
          onClick={(e) => onToggleFavorite(e, tool.id)}
          className={`p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'}`}
          aria-label={isFavorite ? t("tool.remove_favorite") : t("tool.add_favorite")}
        >
          <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <Link
        to={`/${currentLang}/outil/${tool.id}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-all"
        aria-labelledby={titleId}
        aria-describedby={descId}
      />

      <h4 id={titleId} className="font-bold text-slate-900 dark:text-white mb-2 relative z-0">{name}</h4>
      <p id={descId} className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-grow leading-relaxed relative z-0">{description}</p>

      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 relative z-0">
        {t("tool.open")} <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
});
ToolCard.displayName = "ToolCard";


function LoadingTool() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-indigo-500/20 rounded-full"></div>
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin absolute top-0 left-0" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Chargement de l'outil...</p>
    </div>
  );
}

function ThemeToggle({ navigate, location }: { navigate: any, location: any }) {
  const { theme, setTheme } = useTheme();
  const { i18n: i18nInstance } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const toggleLanguage = () => {
    const currentLang = i18nInstance.language || 'fr';
    const newLang = currentLang === 'fr' ? 'en' : 'fr';
    const currentPath = location.pathname;

    let newPath = currentPath;
    if (currentPath === '/' || currentPath === '/fr' || currentPath === '/en') {
      newPath = `/${newLang}`;
    } else {
      newPath = currentPath.replace(/^\/(fr|en)/, `/${newLang}`);
    }
    navigate(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleLanguage}
        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        aria-label="Changer de langue"
      >
        {i18nInstance.language === 'fr' ? 'EN' : 'FR'}
      </button>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        aria-label="Changer de thème"
      >
        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </div>
  );
}

function LangWrapper() {
  const { lang } = useParams();
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    if (lang && (lang === 'en' || lang === 'fr') && i18nInstance.language !== lang) {
      i18nInstance.changeLanguage(lang);
    }
  }, [lang, i18nInstance]);

  return <Outlet />;
}

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n: i18nInstance } = useTranslation();

  const handleToolVisit = useCallback((id: string) => {
    // Sentinel: Validate tool ID before adding to recent history.
    if (!Object.prototype.hasOwnProperty.call(toolsMap, id)) return;

    setRecents(prev => {
      const newRecents = [id, ...prev.filter(r => r !== id)].slice(0, 4);
      localStorage.setItem("recents", JSON.stringify(newRecents));
      return newRecents;
    });
  }, []);
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
        ? parsed.filter(id => Object.prototype.hasOwnProperty.call(toolsMap, id)).slice(0, 100)
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
        ? parsed.filter(id => Object.prototype.hasOwnProperty.call(toolsMap, id)).slice(0, 4)
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
      // Filter by category (including favorites)
      if (selectedCategory === "favorites") {
        if (!favoriteSet.has(tool.id)) return false;
      } else if (selectedCategory && selectedCategory !== "all") {
        if (tool.category !== selectedCategory) return false;
      }

      // Filter by search query if present
      if (query) {
        const searchEntry = TOOL_SEARCH_INDEX.get(tool.id);
        const matchesSearch = searchEntry?.name.includes(query) ||
                             searchEntry?.description.includes(query);
        return matchesSearch;
      }

      return true;
    });
  }, [selectedCategory, deferredSearchQuery, favoriteSet]);

  const recentTools = useMemo(() => {
    return recents.map(id => toolsMap[id]).filter(Boolean);
  }, [recents]);

  const handleExportFavorites = useCallback(() => {
    if (favorites.length === 0) return;
    const blob = new Blob([JSON.stringify(favorites, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `favoris-boite-a-outils.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [favorites]);

  const handleImportFavorites = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const validIds = imported.filter(id => Object.prototype.hasOwnProperty.call(toolsMap, id));
          setFavorites(prev => {
            const combined = Array.from(new Set([...prev, ...validIds])).slice(0, 100);
            localStorage.setItem("favorites", JSON.stringify(combined));
            return combined;
          });
          e.target.value = ''; // Reset input
        }
      } catch (err) {
        console.error("Failed to import favorites", err);
      }
    };
    reader.readAsText(file);
  }, []);

  const toggleFavorite = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Sentinel: Validate tool ID before toggling favorite status.
    if (!Object.prototype.hasOwnProperty.call(toolsMap, id)) return;

    setFavorites(prev => {
      const newFavs = prev.includes(id)
        ? prev.filter(f => f !== id)
        : [...prev, id].slice(0, 100); // Sentinel: Enforce max 100 favorites limit.
      localStorage.setItem("favorites", JSON.stringify(newFavs));
      return newFavs;
    });
  }, []);

  const handleToolSelect = useCallback((id: string) => {
    const currentLang = i18nInstance.language || 'fr';
    navigate(`/${currentLang}/outil/${id}`);
  }, [navigate, i18nInstance.language]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
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
      const baseUrl = "https://multitools-five.vercel.app";
      const fullUrl = `${baseUrl}${path}`;
      const currentLang = i18nInstance.language || 'fr';
      const otherLang = currentLang === 'fr' ? 'en' : 'fr';

      let title = t("app.title");
      let description = t("app.description");
      let ogImage = `${baseUrl}/password-tool.png`;

      // Extract tool ID from localized path /fr/outil/id or /en/outil/id
      const toolMatch = path.match(/^\/(?:fr|en)\/outil\/([^\/]+)/);
      if (toolMatch) {
        const id = toolMatch[1];
        const tool = tools.find(t => t.id === id);
        if (tool) {
          const toolName = (currentLang === 'en' && tool.nameEn) ? tool.nameEn : tool.name;
          const toolDesc = (currentLang === 'en' && tool.descriptionEn) ? tool.descriptionEn : tool.description;
          title = `${toolName} - ${t("footer.copy")}`;
          description = `${toolDesc}. ${currentLang === 'fr' ? 'Un outil gratuit, privé et facile à utiliser.' : 'A free, private and easy to use tool.'}`;
          // Map specific tool icons to preview images if available, otherwise use default
          if (id === 'password-generator') ogImage = `${baseUrl}/password-tool.png`;
          else if (id === 'security-headers') ogImage = `${baseUrl}/security-headers-tool.png`;
          else if (id === 'whatsapp-link') ogImage = `${baseUrl}/whatsapp-tool.png`;
        }
      } else if (path.includes("/a-propos")) {
        title = `${t("nav.about")} - ${t("footer.copy")}`;
      } else if (path.includes("/contact")) {
        title = `${t("nav.contact")} - ${t("footer.copy")}`;
      } else if (path.includes("/confidentialite")) {
        title = `${t("nav.privacy")} - ${t("footer.copy")}`;
      }

      document.title = title;

      const updateTag = (selector: string, attr: string, value: string) => {
        let el = document.querySelector(selector);
        if (!el) {
          const tag = selector.startsWith('meta') ? 'meta' : (selector.startsWith('link') ? 'link' : '');
          if (!tag) return;
          el = document.createElement(tag);
          if (selector.includes('[')) {
            const attrMatch = selector.match(/\[(.*?)="(.*?)"\]/);
            if (attrMatch) el.setAttribute(attrMatch[1], attrMatch[2]);
          }
          document.head.appendChild(el);
        }
        el.setAttribute(attr, value);
      };

      updateTag('meta[name="description"]', 'content', description);
      updateTag('meta[property="og:title"]', 'content', title);
      updateTag('meta[property="og:description"]', 'content', description);
      updateTag('meta[property="og:url"]', 'content', fullUrl);
      updateTag('meta[property="og:image"]', 'content', ogImage);
      updateTag('meta[property="twitter:title"]', 'content', title);
      updateTag('meta[property="twitter:description"]', 'content', description);
      updateTag('meta[property="twitter:url"]', 'content', fullUrl);
      updateTag('meta[property="twitter:image"]', 'content', ogImage);
      updateTag('link[rel="canonical"]', 'href', fullUrl);

      // Hreflang tags
      const otherPath = path.replace(`/${currentLang}`, `/${otherLang}`);
      const otherUrl = `${baseUrl}${otherPath}`;
      updateTag(`link[hreflang="${currentLang}"]`, 'href', fullUrl);
      updateTag(`link[hreflang="${otherLang}"]`, 'href', otherUrl);
      updateTag('link[hreflang="x-default"]', 'href', `${baseUrl}/fr${path.replace(`/${currentLang}`, '')}`);
    };

    updateSEO();
  }, [location, t, i18nInstance.language]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/50">
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-[100] px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-xl -translate-y-24 focus:translate-y-0 transition-transform duration-200"
      >
        Aller au contenu principal
      </a>

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative">
        {/* Nav Header */}
        <header className="flex justify-between items-center mb-16">
          <Link
            to={`/${i18nInstance.language}`}
            className="flex items-center gap-2 group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-lg"
          >
            <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
              <Sparkles className="w-6 h-6 text-white dark:text-slate-900" />
            </div>
            <span className="text-xl font-bold tracking-tight">{t("footer.copy")}</span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 mr-4">
              <Link to={`/${i18nInstance.language}/a-propos`} className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-lg">{t("nav.about")}</Link>
              <Link to={`/${i18nInstance.language}/contact`} className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-lg">{t("nav.contact")}</Link>
            </nav>
            <ThemeToggle navigate={navigate} location={location} />
          </div>
        </header>

        <main id="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/fr" replace />} />
          <Route path="/:lang" element={<LangWrapper />}>
            <Route index element={
            <div className="space-y-20">
              {/* Minimal Hero */}
              <div className="max-w-2xl mx-auto text-center space-y-8">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
                  <Trans i18nKey="hero.title">
                    Des outils simples pour des <span className="text-slate-400 dark:text-slate-600">tâches complexes.</span>
                  </Trans>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t("hero.subtitle")}
                </p>

                <div className="relative group max-w-lg mx-auto">
                  <label htmlFor="tool-search" className="sr-only">{t("search.placeholder")}</label>
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-slate-400" /></div>
                  <input
                    id="tool-search"
                    type="text"
                    placeholder={t("search.placeholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchQuery('');
                      } else if (e.key === 'Enter' && filteredTools.length > 0) {
                        handleToolSelect(filteredTools[0].id);
                      }
                    }}
                    className={`block w-full pl-11 ${searchQuery ? 'pr-12' : 'pr-4'} py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400`}
                  />
                  {!searchQuery && (
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800">
                        /
                      </kbd>
                    </div>
                  )}
                  {searchQuery && (
                    <div className="absolute inset-y-0 right-4 flex items-center gap-2">
                      <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800">
                        Esc
                      </kbd>
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-lg"
                        aria-label={t("search.clear")}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      const randomTool = tools[Math.floor(Math.random() * tools.length)];
                      handleToolSelect(randomTool.id);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none group/random"
                    aria-label={t("search.luck")}
                  >
                    <Shuffle className="w-4 h-4 transition-transform duration-500 group-hover/random:rotate-180" /> {t("search.luck")}
                  </button>
                </div>
              </div>

              {/* Recents */}
              {!searchQuery && recentTools.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500" aria-labelledby="recent-tools-title">
                  <h2 id="recent-tools-title" className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 px-1">{t("recent.title")}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {recentTools.map(tool => (
                      <Link
                        key={tool.id}
                        to={`/${i18nInstance.language}/outil/${tool.id}`}
                        className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                          <tool.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                        </div>
                        <span className="font-semibold text-sm truncate">{tool.name}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Main Content */}
              <div className="space-y-12">
                <h2 className="sr-only">Tous les outils</h2>
                {/* Category Nav */}
                <div className="sticky top-4 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-4 border-b border-slate-200/50 dark:border-slate-800/50 -mx-4 px-4">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id === "all" ? null : cat.id)}
                        aria-pressed={(selectedCategory === cat.id) || (cat.id === "all" && !selectedCategory)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${
                          (selectedCategory === cat.id) || (cat.id === "all" && !selectedCategory)
                            ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-md shadow-indigo-500/10"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-700"
                        }`}
                      >
                        <cat.icon className="w-4 h-4" />
                      {t(`category.${cat.id}`)}
                      </button>
                    ))}

                    {selectedCategory === 'favorites' && (
                      <div className="flex items-center gap-2 ml-auto">
                        {favorites.length > 0 && (
                          <button
                            onClick={handleExportFavorites}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border border-indigo-100 dark:border-indigo-900/30"
                          >
                            <Download className="w-4 h-4" /> {t("favorites.export")}
                          </button>
                        )}
                        <label
                          tabIndex={0}
                          role="button"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement)?.click();
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border border-slate-200 dark:border-slate-800 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                        >
                          <FileUp className="w-4 h-4" /> {t("favorites.import")}
                          <input type="file" accept=".json" onChange={handleImportFavorites} className="hidden" />
                        </label>
                      </div>
                    )}
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
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                      {selectedCategory === "favorites" && !searchQuery ? <Star className="w-8 h-8" /> : <Search className="w-8 h-8" />}
                    </div>
                    <h4 className="text-xl font-bold mb-2">
                      {selectedCategory === "favorites" && !searchQuery ? t("favorites.empty") : t("search.no_results")}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                      {selectedCategory === "favorites" && !searchQuery
                        ? t("favorites.hint")
                        : "Essayez un autre mot-clé ou effacez les filtres."}
                    </p>
                    <button
                      onClick={() => {
                        if (selectedCategory === "favorites" && !searchQuery) {
                          setSelectedCategory(null);
                        } else {
                          setSearchQuery("");
                          setSelectedCategory(null);
                        }
                      }}
                      className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-all"
                    >
                      {selectedCategory === "favorites" && !searchQuery ? t("category.all") : t("search.clear")}
                    </button>
                  </div>
                )}
              </div>

              <Suspense fallback={null}>
                <AdPlaceholder size="large" className="opacity-50 grayscale hover:grayscale-0 transition-all" />
              </Suspense>

              <footer className="pt-20 pb-10 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-bold">{t("footer.copy")} © {new Date().getFullYear()}</span>
                  </div>
                  <div className="flex gap-8">
                    <Link to={`/${i18nInstance.language}/a-propos`} className="text-sm font-medium text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">{t("nav.about")}</Link>
                    <Link to={`/${i18nInstance.language}/confidentialite`} className="text-sm font-medium text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">{t("nav.privacy")}</Link>
                    <Link to={`/${i18nInstance.language}/contact`} className="text-sm font-medium text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">{t("nav.contact")}</Link>
                  </div>
                </div>
              </footer>
            </div>
          } />
            <Route path="outil/:toolId" element={<ToolView favorites={favorites} toggleFavorite={toggleFavorite} onVisit={handleToolVisit} />} />
            <Route path="a-propos" element={<InfoPage title={t("nav.about")} component={<About />} />} />
            <Route path="contact" element={<InfoPage title={t("nav.contact")} component={<Contact />} />} />
            <Route path="confidentialite" element={<InfoPage title={t("nav.privacy")} component={<PrivacyPolicy />} />} />
          </Route>
        </Routes>
        </main>
      </div>
    </div>
  );
}

function ToolView({ favorites, toggleFavorite, onVisit }: {
  favorites: string[],
  toggleFavorite: (e: React.MouseEvent, id: string) => void,
  onVisit: (id: string) => void
}) {
  const { toolId } = useParams();
  const { t, i18n: i18nInstance } = useTranslation();
  const [searchParams] = useSearchParams();
  // ⚡ Bolt Optimization: Use toolsMap for O(1) lookup
  const currentTool = toolId ? toolsMap[toolId] : null;
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [toolState, setToolState] = useState<any>(null);

  useEffect(() => {
    setToolState(null);
    if (toolId) {
      onVisit(toolId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [toolId, onVisit]);

  const initialData = useMemo(() => {
    const data = searchParams.get('data');
    // Sentinel: Mitigate DoS attacks via large shared state data (limit to 10KB)
    if (!data || data.length > 10000) return null;
    try {
      const json = decodeURIComponent(Array.prototype.map.call(atob(data), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(json);
    } catch (e) {
      console.error('Failed to parse tool state from URL', e);
      return null;
    }
  }, [searchParams]);

  const category = useMemo(() => {
    if (!currentTool) return null;
    return categories.find(c => c.id === currentTool.category);
  }, [currentTool]);

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('data');
    navigator.clipboard.writeText(url.toString());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareWithState = () => {
    if (!toolState) return;
    const json = JSON.stringify(toolState);
    const data = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
    const url = new URL(window.location.href);
    url.searchParams.set('data', data);
    navigator.clipboard.writeText(url.toString());
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  if (!currentTool) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">{t("tool.not_found")}</h2>
        <Link to={`/${i18nInstance.language}`} className="text-indigo-600 font-bold hover:underline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-lg">{t("nav.home")}</Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        to={`/${i18nInstance.language}`}
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-lg"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t("nav.home")}
      </Link>

      <div className="mb-12 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            {category && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-widest">
                <category.icon className="w-3 h-3" /> {t(`category.${category.id}`)}
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{(i18nInstance.language === 'en' && currentTool.nameEn) ? currentTool.nameEn : currentTool.name}</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">{(i18nInstance.language === 'en' && currentTool.descriptionEn) ? currentTool.descriptionEn : currentTool.description}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                linkCopied
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                  : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {linkCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
              {linkCopied ? t("tool.copied") : t("tool.copy")}
            </button>
            {toolState && (
              <button
                onClick={handleShareWithState}
                title={t("tool.share_config")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  shareCopied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                }`}
              >
                {shareCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {shareCopied ? t("tool.config_copied") : t("tool.share_config")}
              </button>
            )}
            <button
              onClick={(e) => toggleFavorite(e, currentTool.id)}
              aria-pressed={favorites.includes(currentTool.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                favorites.includes(currentTool.id)
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                  : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <Star className={`w-5 h-5 ${favorites.includes(currentTool.id) ? 'fill-current' : ''}`} />
              {favorites.includes(currentTool.id) ? t("tool.favorite") : t("tool.add_favorite")}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-5 md:p-12 shadow-sm min-h-[500px]">
        <Suspense fallback={<LoadingTool />}>
          <currentTool.Component initialData={initialData} onStateChange={setToolState} />
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

function InfoPage({ title, component }: { title: string, component: React.ReactNode }) {
  const { t, i18n: i18nInstance } = useTranslation();
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        to={`/${i18nInstance.language}`}
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-lg"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t("nav.home")}
      </Link>
      <h1 className="text-4xl font-black mb-12">{title}</h1>
      <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-5 md:p-12 shadow-sm">
        <Suspense fallback={<LoadingTool />}>
          {component}
        </Suspense>
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
