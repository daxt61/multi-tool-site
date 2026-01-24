import { useState, useEffect } from "react";
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
  Clock,
  History,
  Brain,
  Menu,
  X,
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
import { ThemeToggle } from "./components/ThemeToggle";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { ScrollArea } from "./components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet";

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

export default function App() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on tool selection
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [selectedTool]);

  const categories: Category[] = [
    {
      id: "all",
      name: "Tous",
      icon: <CalcIcon className="w-5 h-5" />,
      color: "from-gray-500 to-gray-600",
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
      description: "Calculatrice simple et pratique",
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

  const filteredTools = tools.filter((tool) => {
    if (tool.category === "info") return false;

    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (searchQuery) return true;

    if (!selectedCategory || selectedCategory === "all") return true;
    return tool.category === selectedCategory;
  });

  const currentTool = tools.find((tool) => tool.id === selectedTool);

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || "from-blue-500 to-indigo-600";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Toaster position="top-center" richColors />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-10 sticky top-0 z-50 py-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-b-2xl">
          <div className="flex items-center gap-3">
            {selectedTool && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTool(null)}
                className="md:hidden"
              >
                <ChevronRight className="rotate-180" />
              </Button>
            )}
            <button
              onClick={() => {
                setSelectedTool(null);
                setSelectedCategory(null);
                setSearchQuery("");
              }}
              className="flex items-center gap-2 group"
            >
              <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg group-hover:rotate-12 transition-transform">
                <CalcIcon className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
                Boîte à Outils
              </h1>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {selectedTool && (
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">Tous les outils</h2>
                  </div>
                  <ScrollArea className="h-[calc(100vh-80px)]">
                    <div className="p-4 space-y-1">
                      {tools.filter(t => t.category !== 'info').map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => setSelectedTool(tool.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                            selectedTool === tool.id
                              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className={`p-1.5 rounded-md ${selectedTool === tool.id ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                            {tool.icon}
                          </div>
                          <span className="text-sm truncate">{tool.name}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            )}
            {!selectedTool && (
              <Button
                variant="outline"
                className="hidden md:flex gap-2"
                onClick={() => setSelectedTool("about")}
              >
                <Info className="w-4 h-4" />
                À propos
              </Button>
            )}
          </div>
        </header>

        {/* Hero Section on Landing Page */}
        {!selectedTool ? (
          <>
          <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
            <h2 className="text-4xl sm:text-6xl font-black mb-4 text-slate-900 dark:text-white tracking-tight">
              Optimisez votre <span className="text-indigo-600">productivité</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
              Une collection complète d'outils gratuits, rapides et sans publicité intrusive pour simplifier votre quotidien numérique.
            </p>

            <div className="max-w-2xl mx-auto relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                type="text"
                placeholder="Rechercher un outil (ex: calculatrice, tva, mot de passe...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg shadow-xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all"
              />
            </div>
          </div>

            {/* Category Filter */}
            <div className="mb-8">
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() =>
                      setSelectedCategory(
                        category.id === "all" ? null : category.id
                      )
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                      (selectedCategory === category.id) ||
                      (category.id === "all" && !selectedCategory)
                        ? `bg-gradient-to-br ${category.color} text-white shadow-lg`
                        : "bg-white text-gray-700 hover:bg-gray-100 shadow"
                    }`}
                  >
                    {category.icon}
                    <span className="hidden sm:inline">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tools Count */}
            <div className="text-center mb-4 text-gray-600">
              {filteredTools.length} outil{filteredTools.length > 1 ? "s" : ""}{" "}
              {selectedCategory && selectedCategory !== "all"
                ? `dans ${categories.find((c) => c.id === selectedCategory)?.name}`
                : `disponible${filteredTools.length > 1 ? "s" : ""}`}
            </div>

            {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-left group hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div
                      className={`p-3 bg-gradient-to-br ${getCategoryColor(tool.category)} text-white rounded-lg group-hover:scale-110 transition-transform`}
                    >
                      {tool.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{tool.description}</p>
                </button>
              ))}
            </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-gray-500">Aucun outil trouvé pour "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Effacer la recherche
                </button>
              </div>
            )}

            {/* Bottom Ad */}
            <div className="mt-8">
              <AdPlaceholder size="large" className="max-w-4xl mx-auto" />
            </div>

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-gray-200">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex justify-center gap-6 mb-4">
                  <button
                    onClick={() => setSelectedTool("about")}
                    className="text-gray-600 hover:text-indigo-600 transition-colors text-sm"
                  >
                    À propos
                  </button>
                  <button
                    onClick={() => setSelectedTool("contact")}
                    className="text-gray-600 hover:text-indigo-600 transition-colors text-sm"
                  >
                    Contact
                  </button>
                  <button
                    onClick={() => setSelectedTool("privacy-policy")}
                    className="text-gray-600 hover:text-indigo-600 transition-colors text-sm"
                  >
                    Politique de Confidentialité
                  </button>
                </div>
                <p className="text-gray-500 text-xs">
                  © {new Date().getFullYear()} Boîte à Outils. Tous droits
                  réservés.
                </p>
              </div>
            </footer>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`p-3 bg-gradient-to-br ${getCategoryColor(currentTool?.category || "")} text-white rounded-lg`}
              >
                {currentTool?.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentTool?.name}
                </h2>
                <p className="text-gray-600">{currentTool?.description}</p>
              </div>
            </div>
            <div className="mt-6">{currentTool?.component}</div>
          </div>
        )}
      </div>
    </div>
  );
}
