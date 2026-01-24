import { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
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
  Link,
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
  Sun,
  Moon,
  Music,
  Star,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Calculator } from "./components/Calculator";
import { PomodoroTimer } from "./components/PomodoroTimer";
import { TimestampConverter } from "./components/TimestampConverter";
import { UnitConverter } from "./components/UnitConverter";
import { PasswordGenerator } from "./components/PasswordGenerator";
import { WordCounter } from "./components/WordCounter";
import { ColorConverter } from "./components/ColorConverter";
import { TimerTool } from "./components/TimerTool";
import { TextFormatter } from "./components/TextFormatter";
import { NumberConverter } from "./components/NumberConverter";
import { QRCodeGenerator } from "./components/QRCodeGenerator";
import { PercentageCalculator } from "./components/PercentageCalculator";
import { LoremIpsumGenerator } from "./components/LoremIpsumGenerator";
import { CurrencyConverter } from "./components/CurrencyConverter";
import { BMICalculator } from "./components/BMICalculator";
import { UUIDGenerator } from "./components/UUIDGenerator";
import { Base64Tool } from "./components/Base64Tool";
import { DateCalculator } from "./components/DateCalculator";
import { MarkdownPreview } from "./components/MarkdownPreview";
import { JSONFormatter } from "./components/JSONFormatter";
import { URLEncoder } from "./components/URLEncoder";
import { ImageCompressor } from "./components/ImageCompressor";
import { IPAddressTool } from "./components/IPAddressTool";
import { CaseConverter } from "./components/CaseConverter";
import { DiffChecker } from "./components/DiffChecker";
import { AspectRatioCalculator } from "./components/AspectRatioCalculator";
import { MorseCodeConverter } from "./components/MorseCodeConverter";
import { HashGenerator } from "./components/HashGenerator";
import { BPMCounter } from "./components/BPMCounter";
import { FindAndReplace } from "./components/FindAndReplace";
import { AdPlaceholder } from "./components/AdPlaceholder";
import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { InvoiceGenerator } from "./components/InvoiceGenerator";
import { MarginCalculator } from "./components/MarginCalculator";
import { LoanCalculator } from "./components/LoanCalculator";
import { SavingsCalculator } from "./components/SavingsCalculator";
import { BudgetPlanner } from "./components/BudgetPlanner";
import { VATCalculator } from "./components/VATCalculator";
import { TipCalculator } from "./components/TipCalculator";
import { SalaryCalculator } from "./components/SalaryCalculator";
import { ROICalculator } from "./components/ROICalculator";
import { ExpenseTracker } from "./components/ExpenseTracker";
import { BPMCounter } from "./components/BPMCounter";
import { HashGenerator } from "./components/HashGenerator";

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  component: React.ReactNode;
  category: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all text-gray-700 dark:text-gray-200 border border-transparent dark:border-gray-700"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

function MainApp() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [recents, setRecents] = useState<string[]>(() => {
    const saved = localStorage.getItem("recents");
    return saved ? JSON.parse(saved) : [];
  });

  const categories: Category[] = [
    {
      id: "all",
      name: "Tous",
      icon: <CalcIcon className="w-5 h-5" />,
      color: "from-gray-500 to-gray-600",
    },
    {
      id: "favorites",
      name: "Favoris",
      icon: <Star className="w-5 h-5" />,
      color: "from-yellow-400 to-orange-500",
    },
    {
      id: "business",
      name: "Business",
      icon: <Briefcase className="w-5 h-5" />,
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "budget",
      name: "Budget & Finance",
      icon: <Wallet className="w-5 h-5" />,
      color: "from-green-500 to-green-600",
    },
    {
      id: "calculators",
      name: "Calculatrices",
      icon: <CalcIcon className="w-5 h-5" />,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "converters",
      name: "Convertisseurs",
      icon: <Ruler className="w-5 h-5" />,
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "text",
      name: "Texte",
      icon: <Type className="w-5 h-5" />,
      color: "from-pink-500 to-pink-600",
    },
    {
      id: "dev",
      name: "Développement",
      icon: <Code className="w-5 h-5" />,
      color: "from-indigo-500 to-indigo-600",
    },
    {
      id: "other",
      name: "Autres",
      icon: <Globe className="w-5 h-5" />,
      color: "from-teal-500 to-teal-600",
    },
  ];

const tools: Tool[] = [
    // Business Tools
    {
      id: "invoice-generator",
      name: "Générateur de factures",
      icon: <Receipt className="w-6 h-6" />,
      description: "Créer et imprimer des factures professionnelles",
      component: <InvoiceGenerator />,
      category: "business",
    },
    {
      id: "margin-calculator",
      name: "Calculateur de marge",
      icon: <TrendingUp className="w-6 h-6" />,
      description: "Calculer marges et coefficients de vente",
      component: <MarginCalculator />,
      category: "business",
    },
    {
      id: "vat-calculator",
      name: "Calculateur de TVA",
      icon: <BadgeEuro className="w-6 h-6" />,
      description: "Convertir HT/TTC avec différents taux",
      component: <VATCalculator />,
      category: "business",
    },
    {
      id: "roi-calculator",
      name: "Calculateur de ROI",
      icon: <LineChart className="w-6 h-6" />,
      description: "Calculer le retour sur investissement",
      component: <ROICalculator />,
      category: "business",
    },
    // Budget & Finance Tools
    {
      id: "budget-planner",
      name: "Planificateur de budget",
      icon: <Wallet className="w-6 h-6" />,
      description: "Planifier et suivre votre budget mensuel",
      component: <BudgetPlanner />,
      category: "budget",
    },
    {
      id: "expense-tracker",
      name: "Suivi des dépenses",
      icon: <CreditCard className="w-6 h-6" />,
      description: "Enregistrer et catégoriser vos dépenses",
      component: <ExpenseTracker />,
      category: "budget",
    },
    {
      id: "loan-calculator",
      name: "Calculateur de prêt",
      icon: <Landmark className="w-6 h-6" />,
      description: "Simuler vos mensualités de crédit",
      component: <LoanCalculator />,
      category: "budget",
    },
    {
      id: "savings-calculator",
      name: "Calculateur d'épargne",
      icon: <PiggyBank className="w-6 h-6" />,
      description: "Simuler la croissance de votre épargne",
      component: <SavingsCalculator />,
      category: "budget",
    },
    {
      id: "salary-calculator",
      name: "Calculateur de salaire",
      icon: <Banknote className="w-6 h-6" />,
      description: "Convertir brut/net facilement",
      component: <SalaryCalculator />,
      category: "budget",
    },
    {
      id: "tip-calculator",
      name: "Calculateur de pourboire",
      icon: <UtensilsCrossed className="w-6 h-6" />,
      description: "Calculer le pourboire et partager l'addition",
      component: <TipCalculator />,
      category: "budget",
    },
    {
      id: "currency-converter",
      name: "Convertisseur de devises",
      icon: <DollarSign className="w-6 h-6" />,
      description: "Convertir entre différentes devises",
      component: <CurrencyConverter />,
      category: "budget",
    },
    // Calculators
    {
      id: "calculator",
      name: "Calculatrice",
      icon: <CalcIcon className="w-6 h-6" />,
      description: "Calculatrice simple et scientifique",
      component: <Calculator />,
      category: "calculators",
    },
    {
      id: "percentage",
      name: "Calculateur de pourcentage",
      icon: <Percent className="w-6 h-6" />,
      description: "Calculer des pourcentages facilement",
      component: <PercentageCalculator />,
      category: "calculators",
    },
    {
      id: "bmi-calculator",
      name: "Calculateur d'IMC",
      icon: <Heart className="w-6 h-6" />,
      description: "Calculer votre indice de masse corporelle",
      component: <BMICalculator />,
      category: "calculators",
    },
    {
      id: "date-calculator",
      name: "Calculateur de dates",
      icon: <Calendar className="w-6 h-6" />,
      description: "Calculer des différences de dates",
      component: <DateCalculator />,
      category: "calculators",
    },
    // Converters
    {
      id: "unit-converter",
      name: "Convertisseur d'unités",
      icon: <Ruler className="w-6 h-6" />,
      description: "Convertir longueurs, poids, températures",
      component: <UnitConverter />,
      category: "converters",
    },
    {
      id: "color-converter",
      name: "Convertisseur de couleurs",
      icon: <Palette className="w-6 h-6" />,
      description: "Convertir HEX, RGB, HSL",
      component: <ColorConverter />,
      category: "converters",
    },
    {
      id: "number-converter",
      name: "Convertisseur de base",
      icon: <Hash className="w-6 h-6" />,
      description: "Binaire, décimal, hexadécimal",
      component: <NumberConverter />,
      category: "converters",
    },
    // Text Tools
    {
      id: "word-counter",
      name: "Compteur de mots",
      icon: <Type className="w-6 h-6" />,
      description: "Compter les mots et caractères",
      component: <WordCounter />,
      category: "text",
    },
    {
      id: "case-converter",
      name: "Convertisseur de casse",
      icon: <CaseSensitive className="w-6 h-6" />,
      description: "camelCase, snake_case, kebab-case...",
      component: <CaseConverter />,
      category: "text",
    },
    {
      id: "text-formatter",
      name: "Formateur de texte",
      icon: <FileText className="w-6 h-6" />,
      description: "Majuscules, minuscules, capitaliser",
      component: <TextFormatter />,
      category: "text",
    },
    {
      id: "lorem-ipsum",
      name: "Générateur Lorem Ipsum",
      icon: <FileType className="w-6 h-6" />,
      description: "Générer du texte de remplissage",
      component: <LoremIpsumGenerator />,
      category: "text",
    },
    {
      id: "markdown-preview",
      name: "Éditeur Markdown",
      icon: <FileCode className="w-6 h-6" />,
      description: "Prévisualiser votre Markdown",
      component: <MarkdownPreview />,
      category: "text",
    },
    {
      id: "diff-checker",
      name: "Comparateur de texte",
      icon: <Columns className="w-6 h-6" />,
      description: "Comparer deux textes ligne par ligne",
      component: <DiffChecker />,
      category: "text",
    },
    {
      id: "morse-code",
      name: "Convertisseur Morse",
      icon: <Signal className="w-6 h-6" />,
      description: "Convertir texte en code Morse",
      component: <MorseCodeConverter />,
      category: "text",
    },
    {
      id: "find-replace",
      name: "Chercher et Remplacer",
      icon: <Search className="w-6 h-6" />,
      description: "Rechercher et remplacer du texte",
      component: <FindAndReplace />,
      category: "text",
    },
    // Dev Tools
    {
      id: "password-generator",
      name: "Générateur de mots de passe",
      icon: <Key className="w-6 h-6" />,
      description: "Créer des mots de passe sécurisés",
      component: <PasswordGenerator />,
      category: "dev",
    },
    {
      id: "qr-code",
      name: "Générateur de QR Code",
      icon: <QrCode className="w-6 h-6" />,
      description: "Créer des QR codes personnalisés",
      component: <QRCodeGenerator />,
      category: "dev",
    },
    {
      id: "uuid-generator",
      name: "Générateur d'UUID",
      icon: <Fingerprint className="w-6 h-6" />,
      description: "Générer des identifiants uniques",
      component: <UUIDGenerator />,
      category: "dev",
    },
    {
      id: "base64",
      name: "Encodeur/Décodeur Base64",
      icon: <Code className="w-6 h-6" />,
      description: "Encoder et décoder en Base64",
      component: <Base64Tool />,
      category: "dev",
    },
    {
      id: "json-formatter",
      name: "Formateur JSON",
      icon: <Code className="w-6 h-6" />,
      description: "Formatter et valider du JSON",
      component: <JSONFormatter />,
      category: "dev",
    },
    {
      id: "hash-generator",
      name: "Générateur de Hash",
      icon: <Shield className="w-6 h-6" />,
      description: "Générer SHA-256, SHA-512...",
      component: <HashGenerator />,
      category: "dev",
    },
    {
      id: "url-encoder",
      name: "Encodeur URL",
      icon: <Link className="w-6 h-6" />,
      description: "Encoder et décoder des URLs",
      component: <URLEncoder />,
      category: "dev",
    },
    {
      id: "timestamp-converter",
      name: "Convertisseur de Timestamp",
      icon: <History className="w-6 h-6" />,
      description: "Convertir dates et timestamps Unix",
      component: <TimestampConverter />,
      category: "dev",
    },
    {
      id: "hash-generator",
      name: "Générateur de Hash",
      icon: <Hash className="w-6 h-6" />,
      description: "Générer des hashs SHA-256, SHA-512",
      component: <HashGenerator />,
      category: "dev",
    },
    // Other Tools
    {
      id: "pomodoro",
      name: "Pomodoro",
      icon: <Brain className="w-6 h-6" />,
      description: "Timer pour la méthode Pomodoro",
      component: <PomodoroTimer />,
      category: "other",
    },
    {
      id: "timer",
      name: "Minuteur & Chronomètre",
      icon: <Timer className="w-6 h-6" />,
      description: "Timer et chronomètre pratiques",
      component: <TimerTool />,
      category: "other",
    },
    {
      id: "image-compressor",
      name: "Compresseur d'images",
      icon: <Image className="w-6 h-6" />,
      description: "Compresser vos images",
      component: <ImageCompressor />,
      category: "other",
    },
    {
      id: "ip-address",
      name: "Mon adresse IP",
      icon: <Globe className="w-6 h-6" />,
      description: "Afficher votre adresse IP et infos",
      component: <IPAddressTool />,
      category: "other",
    },
    {
      id: "aspect-ratio",
      name: "Calculateur de Ratio",
      icon: <Monitor className="w-6 h-6" />,
      description: "Calculer les dimensions et l'aspect ratio",
      component: <AspectRatioCalculator />,
      category: "other",
    },
    {
      id: "bpm-counter",
      name: "Compteur BPM",
      icon: <Music className="w-6 h-6" />,
      description: "Calculer les battements par minute",
      component: <BPMCounter />,
      category: "other",
    },
    // Info Pages (hidden from categories)
    {
      id: "about",
      name: "À propos",
      icon: <Info className="w-6 h-6" />,
      description: "En savoir plus sur Boîte à Outils",
      component: <About />,
      category: "info",
    },
    {
      id: "contact",
      name: "Contact",
      icon: <Mail className="w-6 h-6" />,
      description: "Nous contacter pour vos questions",
      component: <Contact />,
      category: "info",
    },
  {
    id: "privacy-policy",
    name: "Politique de Confidentialité",
    icon: <Shield className="w-6 h-6" />,
    description: "Protection de vos données personnelles",
    component: <PrivacyPolicy />,
    category: "info",
  },
];

export default function App() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTool) {
      const tool = tools.find(t => t.id === selectedTool);
      if (tool) {
        document.title = `${tool.name} - Boîte à Outils`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', tool.description);
        }
      }
    } else {
      document.title = "Boîte à Outils - Tous vos outils essentiels en un seul endroit";
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', "Découvrez une collection complète d'outils gratuits en ligne : calculatrices, convertisseurs, outils de texte et de développement. Simple, rapide et efficace.");
      }
    }
  }, [selectedTool]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = tools.filter((tool) => {
    if (tool.category === "info") return false;

    if (selectedCategory === "favorites") {
      return favorites.includes(tool.id);
    }

    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (searchQuery) return true;

    if (!selectedCategory || selectedCategory === "all") return true;
    return tool.category === selectedCategory;
  });

  const recentTools = tools.filter(t => recents.includes(t.id))
    .sort((a, b) => recents.indexOf(a.id) - recents.indexOf(b.id));

  const currentTool = tools.find((tool) => tool.id === selectedTool);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newFavs = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem("favorites", JSON.stringify(newFavs));
  };

  const handleToolSelect = (id: string) => {
    setSelectedTool(id);
    const newRecents = [id, ...recents.filter(r => r !== id)].slice(0, 4);
    setRecents(newRecents);
    localStorage.setItem("recents", JSON.stringify(newRecents));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || "from-blue-500 to-indigo-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <button
            onClick={() => setSelectedTool(null)}
            className="flex items-center gap-3 group"
          >
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
              <CalcIcon className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">Boîte à Outils</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Utilitaires gratuits & simples</p>
            </div>
          </button>

          <ThemeToggle />
        </div>

        {/* Back button when tool is selected */}
        {selectedTool && (
          <button
            onClick={() => setSelectedTool(null)}
            className="mb-8 px-5 py-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-gray-700 dark:text-gray-200 font-semibold border border-gray-100 dark:border-gray-700"
          >
            ← Retour à l'accueil
          </button>
        )}

        {/* Tool Grid or Selected Tool */}
        {!selectedTool ? (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center py-10 md:py-20 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-500/20 px-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
               <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>

               <h2 className="text-4xl md:text-6xl font-extrabold mb-6">Tous vos outils en un clic</h2>
               <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
                 Plus de 35 outils gratuits pour simplifier votre quotidien. Calculatrices, convertisseurs, générateurs et bien plus encore.
               </p>

               <div className="max-w-2xl mx-auto relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Que cherchez-vous aujourd'hui ?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-14 pr-6 py-5 border-none rounded-2xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/20 shadow-xl text-lg"
                />
              </div>
            </div>

            {/* Recents Section */}
            {!searchQuery && recentTools.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6 ml-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Récemment utilisés</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recentTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all text-left"
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryColor(tool.category)} text-white`}>
                        {tool.icon}
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{tool.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Category Filter - Sticky */}
            <div className="sticky top-4 z-40 py-2 -mx-4 px-4">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-2 overflow-x-auto no-scrollbar">
                <div className="flex gap-2 min-w-max">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() =>
                        setSelectedCategory(
                          category.id === "all" ? null : category.id
                        )
                      }
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                        (selectedCategory === category.id) ||
                        (category.id === "all" && !selectedCategory)
                          ? `bg-gradient-to-br ${category.color} text-white shadow-lg`
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {category.icon}
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="space-y-8">
              <div className="flex justify-between items-center ml-2">
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {filteredTools.length} outil{filteredTools.length > 1 ? "s" : ""}{" "}
                  {selectedCategory && selectedCategory !== "all"
                    ? `dans ${categories.find((c) => c.id === selectedCategory)?.name}`
                    : "disponibles"}
                </div>
              </div>

              {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className="group bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 p-6 text-left border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col h-full"
                  >
                    {/* Hover Decoration */}
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getCategoryColor(tool.category)} opacity-0 group-hover:opacity-5 transition-opacity blur-3xl -mr-16 -mt-16`}></div>

                    <div className="flex justify-between items-start mb-6">
                      <div
                        className={`p-4 bg-gradient-to-br ${getCategoryColor(tool.category)} text-white rounded-2xl group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10`}
                      >
                        {tool.icon}
                      </div>
                      <button
                        onClick={(e) => toggleFavorite(e, tool.id)}
                        className={`p-2 rounded-full transition-colors ${favorites.includes(tool.id) ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}`}
                      >
                        <Star className={`w-6 h-6 ${favorites.includes(tool.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed flex-grow">{tool.description}</p>

                    <div className="mt-6 flex items-center text-indigo-600 dark:text-indigo-400 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      Ouvrir l'outil <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </button>
                ))}
              </div>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[2rem] border border-dashed border-gray-300 dark:border-gray-700">
                  <div className="bg-gray-100 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun outil trouvé</p>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">Nous n'avons pas pu trouver d'outil correspondant à "{searchQuery}"</p>
                  <button
                    onClick={() => {setSearchQuery(""); setSelectedCategory(null);}}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Voir tous les outils
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Ad */}
            <div className="mt-8">
              <AdPlaceholder size="large" className="max-w-4xl mx-auto" />
            </div>

            {/* Footer */}
            <footer className="mt-20 py-10 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <CalcIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">Boîte à Outils</span>
                </div>

                <div className="flex flex-wrap justify-center gap-8">
                  <button onClick={() => setSelectedTool("about")} className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors font-medium">À propos</button>
                  <button onClick={() => setSelectedTool("contact")} className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors font-medium">Contact</button>
                  <button onClick={() => setSelectedTool("privacy-policy")} className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors font-medium">Confidentialité</button>
                </div>

                <p className="text-gray-400 text-sm">
                  © {new Date().getFullYear()} Boîte à Outils. Tous droits réservés.
                </p>
              </div>
            </footer>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 min-h-[600px] flex flex-col">
            <div className={`p-8 bg-gradient-to-br ${getCategoryColor(currentTool?.category || "")} text-white`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl">
                    {currentTool?.icon}
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-2">
                      {currentTool?.name}
                    </h2>
                    <p className="text-indigo-100 font-medium">{currentTool?.description}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                   <button
                    onClick={(e) => toggleFavorite(e, currentTool?.id || "")}
                    className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all flex items-center gap-2 font-bold"
                  >
                    <Star className={`w-5 h-5 ${favorites.includes(currentTool?.id || "") ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    {favorites.includes(currentTool?.id || "") ? 'Favori' : 'Ajouter aux favoris'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-grow p-6 md:p-12 bg-white dark:bg-gray-800">
              {currentTool?.component}
            </div>

            {/* Tool Footer Ad */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <AdPlaceholder size="banner" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MainApp />
    </ThemeProvider>
  );
}
