import { useState } from "react";
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
  Info,
  Mail,
  Shield,
} from "lucide-react";
import { Calculator } from "./components/Calculator";
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
import { AdPlaceholder } from "./components/AdPlaceholder";
import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { PrivacyPolicy } from "./components/PrivacyPolicy";

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  component: React.ReactNode;
}

export default function App() {
  const [selectedTool, setSelectedTool] = useState<
    string | null
  >(null);

  const tools: Tool[] = [
    {
      id: "calculator",
      name: "Calculatrice",
      icon: <CalcIcon className="w-6 h-6" />,
      description: "Calculatrice simple et pratique",
      component: <Calculator />,
    },
    {
      id: "unit-converter",
      name: "Convertisseur d'unités",
      icon: <Ruler className="w-6 h-6" />,
      description: "Convertir longueurs, poids, températures",
      component: <UnitConverter />,
    },
    {
      id: "password-generator",
      name: "Générateur de mots de passe",
      icon: <Key className="w-6 h-6" />,
      description: "Créer des mots de passe sécurisés",
      component: <PasswordGenerator />,
    },
    {
      id: "word-counter",
      name: "Compteur de mots",
      icon: <Type className="w-6 h-6" />,
      description: "Compter les mots et caractères",
      component: <WordCounter />,
    },
    {
      id: "color-converter",
      name: "Convertisseur de couleurs",
      icon: <Palette className="w-6 h-6" />,
      description: "Convertir HEX, RGB, HSL",
      component: <ColorConverter />,
    },
    {
      id: "timer",
      name: "Minuteur & Chronomètre",
      icon: <Timer className="w-6 h-6" />,
      description: "Timer et chronomètre pratiques",
      component: <TimerTool />,
    },
    {
      id: "text-formatter",
      name: "Formateur de texte",
      icon: <FileText className="w-6 h-6" />,
      description: "Majuscules, minuscules, capitaliser",
      component: <TextFormatter />,
    },
    {
      id: "number-converter",
      name: "Convertisseur de base",
      icon: <Hash className="w-6 h-6" />,
      description: "Binaire, décimal, hexadécimal",
      component: <NumberConverter />,
    },
    {
      id: "qr-code",
      name: "Générateur de QR Code",
      icon: <QrCode className="w-6 h-6" />,
      description: "Créer des QR codes personnalisés",
      component: <QRCodeGenerator />,
    },
    {
      id: "percentage",
      name: "Calculateur de pourcentage",
      icon: <Percent className="w-6 h-6" />,
      description: "Calculer des pourcentages facilement",
      component: <PercentageCalculator />,
    },
    {
      id: "lorem-ipsum",
      name: "Générateur Lorem Ipsum",
      icon: <FileType className="w-6 h-6" />,
      description: "Générer du texte de remplissage",
      component: <LoremIpsumGenerator />,
    },
    {
      id: "currency-converter",
      name: "Convertisseur de devises",
      icon: <DollarSign className="w-6 h-6" />,
      description: "Convertir entre différentes devises",
      component: <CurrencyConverter />,
    },
    {
      id: "bmi-calculator",
      name: "Calculateur d'IMC",
      icon: <Heart className="w-6 h-6" />,
      description: "Calculer votre indice de masse corporelle",
      component: <BMICalculator />,
    },
    {
      id: "uuid-generator",
      name: "Générateur d'UUID",
      icon: <Fingerprint className="w-6 h-6" />,
      description: "Générer des identifiants uniques",
      component: <UUIDGenerator />,
    },
    {
      id: "base64",
      name: "Encodeur/Décodeur Base64",
      icon: <Code className="w-6 h-6" />,
      description: "Encoder et décoder en Base64",
      component: <Base64Tool />,
    },
    {
      id: "date-calculator",
      name: "Calculateur de dates",
      icon: <Calendar className="w-6 h-6" />,
      description: "Calculer des différences de dates",
      component: <DateCalculator />,
    },
    {
      id: "markdown-preview",
      name: "Éditeur Markdown",
      icon: <FileCode className="w-6 h-6" />,
      description: "Prévisualiser votre Markdown",
      component: <MarkdownPreview />,
    },
    {
      id: "json-formatter",
      name: "Formateur JSON",
      icon: <Code className="w-6 h-6" />,
      description: "Formatter et valider du JSON",
      component: <JSONFormatter />,
    },
    {
      id: "url-encoder",
      name: "Encodeur URL",
      icon: <Link className="w-6 h-6" />,
      description: "Encoder et décoder des URLs",
      component: <URLEncoder />,
    },
    {
      id: "image-compressor",
      name: "Compresseur d'images",
      icon: <Image className="w-6 h-6" />,
      description: "Compresser vos images",
      component: <ImageCompressor />,
    },
    {
      id: "ip-address",
      name: "Mon adresse IP",
      icon: <Globe className="w-6 h-6" />,
      description: "Afficher votre adresse IP et infos",
      component: <IPAddressTool />,
    },
    {
      id: "case-converter",
      name: "Convertisseur de casse",
      icon: <CaseSensitive className="w-6 h-6" />,
      description: "camelCase, snake_case, kebab-case...",
      component: <CaseConverter />,
    },
    {
      id: "about",
      name: "À propos",
      icon: <Info className="w-6 h-6" />,
      description: "En savoir plus sur Boîte à Outils",
      component: <About />,
    },
    {
      id: "contact",
      name: "Contact",
      icon: <Mail className="w-6 h-6" />,
      description: "Nous contacter pour vos questions",
      component: <Contact />,
    },
    {
      id: "privacy-policy",
      name: "Politique de Confidentialité",
      icon: <Shield className="w-6 h-6" />,
      description: "Protection de vos données personnelles",
      component: <PrivacyPolicy />,
    },
  ];

  const currentTool = tools.find(
    (tool) => tool.id === selectedTool,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            🛠️ Boîte à Outils
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Tous vos outils essentiels en un seul endroit
          </p>

          {/* Top Banner Ad */}
          {!selectedTool && (
            <AdPlaceholder
              size="banner"
              className="max-w-4xl mx-auto"
            />
          )}
        </div>

        {/* Back button when tool is selected */}
        {selectedTool && (
          <button
            onClick={() => setSelectedTool(null)}
            className="mb-6 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center gap-2 text-gray-700"
          >
            ← Retour aux outils
          </button>
        )}

        {/* Tool Grid or Selected Tool */}
        {!selectedTool ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-left group hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                      {tool.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {tool.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Bottom Ad */}
            <div className="mt-8">
              <AdPlaceholder
                size="large"
                className="max-w-4xl mx-auto"
              />
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
                  © {new Date().getFullYear()} Boîte à Outils. Tous droits réservés.
                </p>
              </div>
            </footer>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg">
                {currentTool?.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentTool?.name}
                </h2>
                <p className="text-gray-600">
                  {currentTool?.description}
                </p>
              </div>
            </div>
            <div className="mt-6">{currentTool?.component}</div>
          </div>
        )}
      </div>
    </div>
  );
}