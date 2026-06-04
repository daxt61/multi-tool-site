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
import { Command } from "cmdk";
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
  FileSpreadsheet,
  Fuel,
  UserRound,
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
  Maximize2,
  Triangle,
  GraduationCap,
  Activity,
  Signal,
  Info,
  Mail,
  Hexagon,
  Shield,
  ShieldAlert,
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
  Replace,
  Shuffle,
  MousePointer2,
  ArrowLeft,
  Database,
  ArrowLeftRight,
  ArrowUpDown,
  X,
  Share2,
  Sun,
  Terminal,
  Music,
  Star,
  Check,
  Plus,
  BarChart3,
  Sigma,
  Wand2,
  Grid,
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
  Coffee,
  Volume2,
  Layers,
  Network,
  Clock,
  Download,
  FileUp,
  Target,
  ListOrdered,
  WrapText,
  ImagePlus,
  SunDim,
  Wifi,
  FileSearch,
  Box,
  Repeat,
  RotateCw,
  FolderTree,
  MonitorPlay,
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
const YAMLFormatter = lazy(() => import("./components/YAMLFormatter").then(m => ({ default: m.YAMLFormatter })));
const YAMLJSONConverter = lazy(() => import("./components/YAMLJSONConverter").then(m => ({ default: m.YAMLJSONConverter })));
const CronGenerator = lazy(() => import("./components/CronGenerator").then(m => ({ default: m.CronGenerator })));
const HTMLEntityConverter = lazy(() => import("./components/HTMLEntityConverter").then(m => ({ default: m.HTMLEntityConverter })));
const JSONToTS = lazy(() => import("./components/JSONToTS").then(m => ({ default: m.JSONToTS })));
const JSONToCPP = lazy(() => import("./components/JSONToCPP").then(m => ({ default: m.JSONToCPP })));
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
const CSSGridGenerator = lazy(() => import("./components/CSSGridGenerator").then(m => ({ default: m.CSSGridGenerator })));
const CSSBorderRadiusGenerator = lazy(() => import("./components/CSSBorderRadiusGenerator").then(m => ({ default: m.CSSBorderRadiusGenerator })));
const JSONPathTester = lazy(() => import("./components/JSONPathTester").then(m => ({ default: m.JSONPathTester })));
const SitemapGenerator = lazy(() => import("./components/SitemapGenerator").then(m => ({ default: m.SitemapGenerator })));
const JSONToSQL = lazy(() => import("./components/JSONToSQL").then(m => ({ default: m.JSONToSQL })));
const StringEscaper = lazy(() => import("./components/StringEscaper").then(m => ({ default: m.StringEscaper })));
const FlexboxGenerator = lazy(() => import("./components/FlexboxGenerator").then(m => ({ default: m.FlexboxGenerator })));
const JSONToGo = lazy(() => import("./components/JSONToGo").then(m => ({ default: m.JSONToGo })));
const HTMLToJSX = lazy(() => import("./components/HTMLToJSX").then(m => ({ default: m.HTMLToJSX })));
const JSONToJava = lazy(() => import("./components/JSONToJava").then(m => ({ default: m.JSONToJava })));
const JSONToCSharp = lazy(() => import("./components/JSONToCSharp").then(m => ({ default: m.JSONToCSharp })));
const JSONToPython = lazy(() => import("./components/JSONToPython").then(m => ({ default: m.JSONToPython })));
const JSONToRust = lazy(() => import("./components/JSONToRust").then(m => ({ default: m.JSONToRust })));
const JSONToPHP = lazy(() => import("./components/JSONToPHP").then(m => ({ default: m.JSONToPHP })));
const JSONToKotlin = lazy(() => import("./components/JSONToKotlin").then(m => ({ default: m.JSONToKotlin })));
const JSONToDart = lazy(() => import("./components/JSONToDart").then(m => ({ default: m.JSONToDart })));
const JSONToGraphQL = lazy(() => import("./components/JSONToGraphQL").then(m => ({ default: m.JSONToGraphQL })));
const JSONToMongoose = lazy(() => import("./components/JSONToMongoose").then(m => ({ default: m.JSONToMongoose })));
const HTMLToMarkdown = lazy(() => import("./components/HTMLToMarkdown").then(m => ({ default: m.HTMLToMarkdown })));
const JsonDiff = lazy(() => import("./components/JsonDiff").then(m => ({ default: m.JsonDiff })));
const NeumorphismGenerator = lazy(() => import("./components/NeumorphismGenerator").then(m => ({ default: m.NeumorphismGenerator })));
const JSONToEnv = lazy(() => import("./components/JSONToEnv").then(m => ({ default: m.JSONToEnv })));
const JSONToSwift = lazy(() => import("./components/JSONToSwift").then(m => ({ default: m.JSONToSwift })));
const JSONToRuby = lazy(() => import("./components/JSONToRuby").then(m => ({ default: m.JSONToRuby })));
const JSONToScala = lazy(() => import("./components/JSONToScala").then(m => ({ default: m.JSONToScala })));
const URLExtractor = lazy(() => import("./components/URLExtractor").then(m => ({ default: m.URLExtractor })));
const EmailExtractor = lazy(() => import("./components/EmailExtractor").then(m => ({ default: m.EmailExtractor })));
const NumberExtractor = lazy(() => import("./components/NumberExtractor").then(m => ({ default: m.NumberExtractor })));
const TextHexConverter = lazy(() => import("./components/TextHexConverter").then(m => ({ default: m.TextHexConverter })));
const MarkdownToHTML = lazy(() => import("./components/MarkdownToHTML").then(m => ({ default: m.MarkdownToHTML })));
const HTMLFormatter = lazy(() => import("./components/HTMLFormatter").then(m => ({ default: m.HTMLFormatter })));
const PasswordStrengthMeter = lazy(() => import("./components/PasswordStrengthMeter").then(m => ({ default: m.PasswordStrengthMeter })));
const JSONToProtobuf = lazy(() => import("./components/JSONToProtobuf").then(m => ({ default: m.JSONToProtobuf })));
const JSObjectConverter = lazy(() => import("./components/JSObjectConverter").then(m => ({ default: m.JSObjectConverter })));
const JSONToJoi = lazy(() => import("./components/JSONToJoi").then(m => ({ default: m.JSONToJoi })));
const JSONToTOML = lazy(() => import("./components/JSONToTOML").then(m => ({ default: m.JSONToTOML })));
const PrimeGenerator = lazy(() => import("./components/PrimeGenerator").then(m => ({ default: m.PrimeGenerator })));
const TextToImage = lazy(() => import("./components/TextToImage").then(m => ({ default: m.TextToImage })));
const JSONToAsciiTable = lazy(() => import("./components/JSONToAsciiTable").then(m => ({ default: m.JSONToAsciiTable })));
const UnicodeInspector = lazy(() => import("./components/UnicodeInspector").then(m => ({ default: m.UnicodeInspector })));
const TextRepeater = lazy(() => import("./components/TextRepeater").then(m => ({ default: m.TextRepeater })));
const PascalsTriangle = lazy(() => import("./components/PascalsTriangle").then(m => ({ default: m.PascalsTriangle })));
const TextSplitter = lazy(() => import("./components/TextSplitter").then(m => ({ default: m.TextSplitter })));
const StringJoiner = lazy(() => import("./components/StringJoiner").then(m => ({ default: m.StringJoiner })));
const JSONAnalyzer = lazy(() => import("./components/JSONAnalyzer").then(m => ({ default: m.JSONAnalyzer })));
const WorldClock = lazy(() => import("./components/WorldClock").then(m => ({ default: m.WorldClock })));
const Stopwatch = lazy(() => import("./components/Stopwatch").then(m => ({ default: m.Stopwatch })));
const UnicodeTable = lazy(() => import("./components/UnicodeTable").then(m => ({ default: m.UnicodeTable })));
const ASCIIArtGenerator = lazy(() => import("./components/ASCIIArtGenerator").then(m => ({ default: m.ASCIIArtGenerator })));
const NumberStatistics = lazy(() => import("./components/NumberStatistics").then(m => ({ default: m.NumberStatistics })));
const SequenceGenerator = lazy(() => import("./components/SequenceGenerator").then(m => ({ default: m.SequenceGenerator })));
const ImageEffects = lazy(() => import("./components/ImageEffects").then(m => ({ default: m.ImageEffects })));
const BcryptGenerator = lazy(() => import("./components/BcryptGenerator").then(m => ({ default: m.BcryptGenerator })));
const ColorExtractor = lazy(() => import("./components/ColorExtractor").then(m => ({ default: m.ColorExtractor })));
const CSVMapper = lazy(() => import("./components/CSVMapper").then(m => ({ default: m.CSVMapper })));
const IPExtractor = lazy(() => import("./components/IPExtractor").then(m => ({ default: m.IPExtractor })));
const HashExtractor = lazy(() => import("./components/HashExtractor").then(m => ({ default: m.HashExtractor })));
const ImageToASCII = lazy(() => import("./components/ImageToASCII").then(m => ({ default: m.ImageToASCII })));
const MatrixCalculator = lazy(() => import("./components/MatrixCalculator").then(m => ({ default: m.MatrixCalculator })));
const DataURLGenerator = lazy(() => import("./components/DataURLGenerator").then(m => ({ default: m.DataURLGenerator })));
const Base64ToPDF = lazy(() => import("./components/Base64ToPDF").then(m => ({ default: m.Base64ToPDF })));
const NanoIDGenerator = lazy(() => import("./components/NanoIDGenerator").then(m => ({ default: m.NanoIDGenerator })));
const MnemonicGenerator = lazy(() => import("./components/MnemonicGenerator").then(m => ({ default: m.MnemonicGenerator })));
const LSystemGenerator = lazy(() => import("./components/LSystemGenerator").then(m => ({ default: m.LSystemGenerator })));
const BinaryBitCounter = lazy(() => import("./components/BinaryBitCounter").then(m => ({ default: m.BinaryBitCounter })));
const DivisorsFinder = lazy(() => import("./components/DivisorsFinder").then(m => ({ default: m.DivisorsFinder })));
const HMACGenerator = lazy(() => import("./components/HMACGenerator").then(m => ({ default: m.HMACGenerator })));
const RSAGenerator = lazy(() => import("./components/RSAGenerator").then(m => ({ default: m.RSAGenerator })));
const ZalgoGenerator = lazy(() => import("./components/ZalgoGenerator").then(m => ({ default: m.ZalgoGenerator })));
const UnicodeSpoofer = lazy(() => import("./components/UnicodeSpoofer").then(m => ({ default: m.UnicodeSpoofer })));
const CSVColumnExtractor = lazy(() => import("./components/CSVColumnExtractor").then(m => ({ default: m.CSVColumnExtractor })));
const SQLToJSON = lazy(() => import("./components/SQLToJSON").then(m => ({ default: m.SQLToJSON })));
const UAGenerator = lazy(() => import("./components/UAGenerator").then(m => ({ default: m.UAGenerator })));
const WordsToNumbers = lazy(() => import("./components/WordsToNumbers").then(m => ({ default: m.WordsToNumbers })));
const PiGenerator = lazy(() => import("./components/PiGenerator").then(m => ({ default: m.PiGenerator })));
const ImageColorReplacer = lazy(() => import("./components/ImageColorReplacer").then(m => ({ default: m.ImageColorReplacer })));
const AverageTimeCalculator = lazy(() => import("./components/AverageTimeCalculator").then(m => ({ default: m.AverageTimeCalculator })));
const FindAndReplace = lazy(() => import("./components/FindAndReplace").then(m => ({ default: m.FindAndReplace })));
const ImageResizer = lazy(() => import("./components/ImageResizer").then(m => ({ default: m.ImageResizer })));
const EmojiToImage = lazy(() => import("./components/EmojiToImage").then(m => ({ default: m.EmojiToImage })));
const NumberTransformer = lazy(() => import("./components/NumberTransformer").then(m => ({ default: m.NumberTransformer })));
const NegabinaryConverter = lazy(() => import("./components/NegabinaryConverter").then(m => ({ default: m.NegabinaryConverter })));
const CSSClampGenerator = lazy(() => import("./components/CSSClampGenerator").then(m => ({ default: m.CSSClampGenerator })));
const Base64ToHex = lazy(() => import("./components/Base64ToHex").then(m => ({ default: m.Base64ToHex })));
const JSONToProperties = lazy(() => import("./components/JSONToProperties").then(m => ({ default: m.JSONToProperties })));
const TextShadowGenerator = lazy(() => import("./components/TextShadowGenerator").then(m => ({ default: m.TextShadowGenerator })));
const CSSFormatter = lazy(() => import("./components/CSSFormatter").then(m => ({ default: m.CSSFormatter })));
const FancyTextGenerator = lazy(() => import("./components/FancyTextGenerator").then(m => ({ default: m.FancyTextGenerator })));
const ImageRotator = lazy(() => import("./components/ImageRotator").then(m => ({ default: m.ImageRotator })));
const LifeCalendar = lazy(() => import("./components/LifeCalendar").then(m => ({ default: m.LifeCalendar })));
const NumberSorter = lazy(() => import("./components/NumberSorter").then(m => ({ default: m.NumberSorter })));
const ClockGenerator = lazy(() => import("./components/ClockGenerator").then(m => ({ default: m.ClockGenerator })));
const CSVToSQL = lazy(() => import("./components/CSVToSQL").then(m => ({ default: m.CSVToSQL })));
const JSONToMarkdown = lazy(() => import("./components/JSONToMarkdown").then(m => ({ default: m.JSONToMarkdown })));
const BinaryBitwise = lazy(() => import("./components/BinaryBitwise").then(m => ({ default: m.BinaryBitwise })));
const CSVToXML = lazy(() => import("./components/CSVToXML").then(m => ({ default: m.CSVToXML })));
const TextToOctal = lazy(() => import("./components/TextToOctal").then(m => ({ default: m.TextToOctal })));
const MacAddressGenerator = lazy(() => import("./components/MacAddressGenerator").then(m => ({ default: m.MacAddressGenerator })));
const PalindromeChecker = lazy(() => import("./components/PalindromeChecker").then(m => ({ default: m.PalindromeChecker })));
const DogAgeConverter = lazy(() => import("./components/DogAgeConverter").then(m => ({ default: m.DogAgeConverter })));
const LookAndSayGenerator = lazy(() => import("./components/LookAndSayGenerator").then(m => ({ default: m.LookAndSayGenerator })));
const VCardGenerator = lazy(() => import("./components/VCardGenerator").then(m => ({ default: m.VCardGenerator })));
const LineNumberAdder = lazy(() => import("./components/LineNumberAdder").then(m => ({ default: m.LineNumberAdder })));
const TextWrapper = lazy(() => import("./components/TextWrapper").then(m => ({ default: m.TextWrapper })));
const RandomIPGenerator = lazy(() => import("./components/RandomIPGenerator").then(m => ({ default: m.RandomIPGenerator })));
const RandomDateGenerator = lazy(() => import("./components/RandomDateGenerator").then(m => ({ default: m.RandomDateGenerator })));
const ListToTree = lazy(() => import("./components/ListToTree").then(m => ({ default: m.ListToTree })));
const ScreenRecorder = lazy(() => import("./components/ScreenRecorder").then(m => ({ default: m.ScreenRecorder })));
const HexToImage = lazy(() => import("./components/HexToImage").then(m => ({ default: m.HexToImage })));
const FractalTree = lazy(() => import("./components/FractalTree").then(m => ({ default: m.FractalTree })));
const UnicodeNormalizer = lazy(() => import("./components/UnicodeNormalizer").then(m => ({ default: m.UnicodeNormalizer })));
const IntegerPairGenerator = lazy(() => import("./components/IntegerPairGenerator").then(m => ({ default: m.IntegerPairGenerator })));
const BinaryReverser = lazy(() => import("./components/BinaryReverser").then(m => ({ default: m.BinaryReverser })));

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
    id: "vcard-generator",
    name: "Carte de Visite",
    nameEn: "vCard Generator",
    icon: UserRound,
    description: "Générer des fichiers vCard et codes QR de contact",
    descriptionEn: "Generate vCard files and contact QR codes",
    Component: VCardGenerator,
    category: "business",
    keywords: ["vcard", "contact", "qr", "business card", "vcf", "identity"],
  },
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
    nameEn: "Margin Calculator",
    icon: TrendingUp,
    description: "Calculateur de marges et coefficients",
    descriptionEn: "Margin and coefficient calculator",
    Component: MarginCalculator,
    category: "business",
  },
  {
    id: "vat-calculator",
    name: "TVA",
    nameEn: "VAT Calculator",
    icon: BadgeEuro,
    description: "Calcul de TVA HT et TTC",
    descriptionEn: "VAT calculator (excluding and including tax)",
    Component: VATCalculator,
    category: "business",
  },
  {
    id: "roi-calculator",
    name: "ROI",
    nameEn: "ROI Calculator",
    icon: LineChart,
    description: "Calcul du retour sur investissement",
    descriptionEn: "Return on investment calculator",
    Component: ROICalculator,
    category: "business",
  },
  {
    id: "fuel-cost",
    name: "Coût Trajet",
    nameEn: "Trip Cost",
    icon: Fuel,
    description: "Calculer le coût en carburant d'un trajet",
    descriptionEn: "Calculate the fuel cost of a trip",
    Component: FuelCostCalculator,
    category: "business",
  },
  {
    id: "financial-ratios",
    name: "Ratios Financiers",
    nameEn: "Financial Ratios",
    icon: PieChart,
    description: "Calculer les ratios de liquidité, rentabilité et endettement",
    descriptionEn: "Calculate liquidity, profitability and debt ratios",
    Component: FinancialRatios,
    category: "business",
  },
  {
    id: "freelance-tax",
    name: "Cotisations Freelance",
    nameEn: "Freelance Tax",
    icon: PiggyBank,
    description: "Simulation de cotisations auto-entrepreneur",
    descriptionEn: "Self-employed social security contributions simulation",
    Component: FreelanceTaxCalculator,
    category: "business",
  },
  // Budget & Finance Tools
  {
    id: "budget-planner",
    name: "Budget",
    nameEn: "Budget Planner",
    icon: Wallet,
    description: "Planificateur de budget mensuel",
    descriptionEn: "Monthly budget planner",
    Component: BudgetPlanner,
    category: "budget",
  },
  {
    id: "expense-tracker",
    name: "Dépenses",
    nameEn: "Expense Tracker",
    icon: CreditCard,
    description: "Suivi et catégorisation des dépenses",
    descriptionEn: "Track and categorize expenses",
    Component: ExpenseTracker,
    category: "budget",
  },
  {
    id: "loan-calculator",
    name: "Prêt",
    nameEn: "Loan Calculator",
    icon: Landmark,
    description: "Simulateur de mensualités de crédit",
    descriptionEn: "Credit monthly payment simulator",
    Component: LoanCalculator,
    category: "budget",
    keywords: ["crédit", "immobilier", "taux", "mensualité", "banque"],
  },
  {
    id: "savings-calculator",
    name: "Épargne",
    nameEn: "Savings Calculator",
    icon: PiggyBank,
    description: "Simulation de croissance d'épargne",
    descriptionEn: "Savings growth simulation",
    Component: SavingsCalculator,
    category: "budget",
    keywords: ["argent", "capital", "intérêts", "placement", "retraite"],
  },
  {
    id: "compound-interest",
    name: "Intérêts Composés",
    nameEn: "Compound Interest",
    icon: TrendingUp,
    description: "Calculateur de croissance d'investissement avec intérêts composés et tableau détaillé",
    descriptionEn: "Investment growth calculator with compound interest and detailed table",
    Component: FinancialCalculator,
    category: "budget",
  },
  {
    id: "iban-validator",
    name: "Validateur IBAN",
    nameEn: "IBAN Validator",
    icon: CreditCard,
    description: "Vérifier la validité structurelle d'un IBAN (MOD-97)",
    descriptionEn: "Verify the structural validity of an IBAN (MOD-97)",
    Component: IBANValidator,
    category: "budget",
  },
  {
    id: "salary-calculator",
    name: "Salaire",
    nameEn: "Salary Calculator",
    icon: Banknote,
    description: "Convertisseur salaire Brut / Net",
    descriptionEn: "Gross / Net salary converter",
    Component: SalaryCalculator,
    category: "budget",
  },
  {
    id: "tip-calculator",
    name: "Pourboire",
    nameEn: "Tip Calculator",
    icon: UtensilsCrossed,
    description: "Calcul de pourboire et partage",
    descriptionEn: "Calculate tip and split the bill",
    Component: TipCalculator,
    category: "budget",
  },
  {
    id: "currency-converter",
    name: "Devises",
    nameEn: "Currency Converter",
    icon: DollarSign,
    description: "Convertisseur de devises en temps réel",
    descriptionEn: "Real-time currency converter",
    Component: CurrencyConverter,
    category: "budget",
    keywords: ["argent", "change", "taux", "dollar", "euro", "voyage"],
  },
  {
    id: "unit-price-calculator",
    name: "Prix Unitaire",
    nameEn: "Unit Price",
    icon: Tag,
    description: "Comparer le prix au kilo ou à l'unité",
    descriptionEn: "Compare price per kilo or per unit",
    Component: UnitPriceCalculator,
    category: "budget",
    keywords: ["achat", "comparaison", "kilo", "unité", "prix", "économies"],
  },
  {
    id: "discount-calculator",
    name: "Soldes & Remises",
    nameEn: "Discount Calculator",
    icon: Tag,
    description: "Calculer le prix final après une ou plusieurs remises",
    descriptionEn: "Calculate the final price after one or more discounts",
    Component: DiscountCalculator,
    category: "budget",
  },
  {
    id: "overtime-calculator",
    name: "Heures Sup",
    nameEn: "Overtime Calculator",
    icon: Clock,
    description: "Calculer le gain net des heures supplémentaires",
    descriptionEn: "Calculate the net gain of overtime",
    Component: OvertimeCalculator,
    category: "budget",
  },
  {
    id: "retirement-calculator",
    name: "Retraite",
    nameEn: "Retirement Calculator",
    icon: Landmark,
    description: "Âge légal et trimestres (Réforme 2023)",
    descriptionEn: "Legal age and quarters (2023 Reform)",
    Component: RetirementCalculator,
    category: "budget",
  },
  {
    id: "grade-calculator",
    name: "Notes",
    nameEn: "Grade Calculator",
    icon: ListChecks,
    description: "Calculer sa moyenne et note nécessaire",
    descriptionEn: "Calculate your average and required grade",
    Component: GradeCalculator,
    category: "calculators",
  },
  {
    id: "duration-calculator",
    name: "Durées",
    nameEn: "Duration Calculator",
    icon: Clock,
    description: "Additionner ou soustraire des intervalles de temps",
    descriptionEn: "Add or subtract time intervals",
    Component: DurationCalculator,
    category: "calculators",
  },
  {
    id: "gpa-converter",
    name: "GPA",
    nameEn: "GPA Converter",
    icon: GraduationCap,
    description: "Convertisseur de notes en GPA (4.0/5.0)",
    descriptionEn: "Convert grades to GPA (4.0/5.0)",
    Component: GPAConverter,
    category: "calculators",
  },
  {
    id: "breakeven-calculator",
    name: "Seuil de Rentabilité",
    nameEn: "Breakeven Calculator",
    icon: Target,
    description: "Calculer le point mort et la rentabilité",
    descriptionEn: "Calculate the break-even point and profitability",
    Component: BreakevenCalculator,
    category: "business",
  },
  {
    id: "mock-data",
    name: "Mock Data",
    nameEn: "Mock Data",
    icon: Database,
    description: "Générateur de données de test (JSON, CSV)",
    descriptionEn: "Test data generator (JSON, CSV)",
    Component: MockDataGenerator,
    category: "dev",
  },
  {
    id: "chart-generator",
    name: "Graphiques",
    nameEn: "Chart Generator",
    icon: LineChart,
    description: "Générer des graphiques à partir de données",
    descriptionEn: "Generate charts from data",
    Component: ChartGenerator,
    category: "business",
  },
  // Calculators
  {
    id: "calculator",
    name: "Calculatrice",
    nameEn: "Calculator",
    icon: CalcIcon,
    description: "Calculatrice simple et scientifique",
    descriptionEn: "Simple and scientific calculator",
    Component: Calculator,
    category: "calculators",
    keywords: ["math", "calcul", "scientifique", "sin", "cos", "tan"],
  },
  {
    id: "percentage",
    name: "Pourcentage",
    nameEn: "Percentage",
    icon: Percent,
    description: "Calculs de variations et pourcentages",
    descriptionEn: "Variations and percentage calculations",
    Component: PercentageCalculator,
    category: "calculators",
  },
  {
    id: "bmi-calculator",
    name: "IMC",
    nameEn: "BMI",
    icon: Heart,
    description: "Calcul de l'Indice de Masse Corporelle",
    descriptionEn: "Body Mass Index calculation",
    Component: BMICalculator,
    category: "health",
    keywords: ["imc", "bmi", "poids", "santé", "corps", "weight", "height", "ideal", "oxon"],
  },
  {
    id: "body-fat-calculator",
    name: "Masse Grasse",
    nameEn: "Body Fat",
    icon: Activity,
    description: "Estimer son taux de graisse corporelle",
    descriptionEn: "Estimate your body fat percentage",
    Component: BodyFatCalculator,
    category: "health",
  },
  {
    id: "bmr-calculator",
    name: "BMR & TDEE",
    nameEn: "BMR & TDEE",
    icon: Activity,
    description: "Métabolisme de base et besoins caloriques",
    descriptionEn: "Basal metabolic rate and calorie needs",
    Component: BMRCalculator,
    category: "health",
    keywords: ["calories", "tdee", "mifflin", "diet", "régime", "nutrition"],
  },
  {
    id: "date-calculator",
    name: "Dates",
    nameEn: "Dates",
    icon: Calendar,
    description: "Calcul de durée entre deux dates",
    descriptionEn: "Duration calculation between two dates",
    Component: DateCalculator,
    category: "calculators",
  },
  {
    id: "age-calculator",
    name: "Âge",
    nameEn: "Age",
    icon: Calendar,
    description: "Calculer votre âge exact et prochain anniversaire",
    descriptionEn: "Calculate your exact age and next birthday",
    Component: AgeCalculator,
    category: "calculators",
    keywords: ["birthday", "anniversaire", "zodiac", "zodiaque", "naissance", "birth"],
  },
  {
    id: "sleep-calculator",
    name: "Sommeil",
    nameEn: "Sleep",
    icon: Moon,
    description: "Calculer les cycles de sommeil et réveils idéaux",
    descriptionEn: "Calculate sleep cycles and ideal wake-ups",
    Component: SleepCalculator,
    category: "health",
  },
  {
    id: "water-calculator",
    name: "Besoins en Eau",
    nameEn: "Water Needs",
    icon: Droplets,
    description: "Estimer vos besoins en hydratation quotidienne",
    descriptionEn: "Estimate your daily hydration needs",
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
    keywords: ["conversion", "mètres", "kilos", "température", "pression", "vitesse", "meters", "kilograms", "temperature", "pressure", "speed"],
  },
  {
    id: "css-unit-converter",
    name: "Unités CSS",
    nameEn: "CSS Units",
    icon: Maximize,
    description: "Convertir px, rem, em, vw, vh",
    descriptionEn: "Convert px, rem, em, vw, vh",
    Component: CSSUnitConverter,
    category: "converters",
  },
  {
    id: "color-converter",
    name: "Couleurs",
    nameEn: "Colors",
    icon: Palette,
    description: "HEX, RGB, HSL Converter",
    descriptionEn: "HEX, RGB, HSL converter",
    Component: ColorConverter,
    category: "converters",
    keywords: ["hex", "rgb", "hsl", "cmyk", "oklch", "contraste", "accessibilité", "wcag"],
  },
  {
    id: "number-converter",
    name: "Base",
    nameEn: "Base",
    icon: Hash,
    description: "Binaire, Décimal, Hexadécimal",
    descriptionEn: "Binary, Decimal, Hexadecimal",
    Component: NumberConverter,
    category: "converters",
    keywords: ["binaire", "hex", "décimal", "octal", "bigint", "base"],
  },
  {
    id: "text-hex",
    name: "Texte <> Hex",
    nameEn: "Text <> Hex",
    icon: Hexagon,
    description: "Convertir du texte en hexadécimal et vice-versa",
    descriptionEn: "Convert text to hexadecimal and vice versa",
    Component: TextHexConverter,
    category: "converters",
    keywords: ["hex", "hexadecimal", "encoding", "decoding", "converter"],
  },
  {
    id: "dpi-calculator",
    name: "DPI / PPI",
    nameEn: "DPI / PPI",
    icon: Monitor,
    description: "Calculer la densité de pixels d'un écran",
    descriptionEn: "Calculate screen pixel density",
    Component: DPICalculator,
    category: "converters",
  },
  {
    id: "roman-numeral",
    name: "Chiffres Romains",
    nameEn: "Roman Numerals",
    icon: Hash,
    description: "Convertisseur de chiffres romains",
    descriptionEn: "Roman numeral converter",
    Component: RomanNumeralConverter,
    category: "converters",
    keywords: ["latin", "histoire", "nombres", "ancient", "history"],
  },
  {
    id: "color-palette",
    name: "Palette de couleurs",
    nameEn: "Color Palette",
    icon: Palette,
    description: "Générer des harmonies de couleurs et palettes",
    descriptionEn: "Generate color harmonies and palettes",
    Component: ColorPaletteGenerator,
    category: "converters",
  },
  {
    id: "contrast-checker",
    name: "Contrast-mètre",
    nameEn: "Contrast Checker",
    icon: Eye,
    description: "Vérifier le contraste de couleurs (WCAG)",
    descriptionEn: "Check color contrast (WCAG)",
    Component: ColorContrastChecker,
    category: "converters",
    keywords: ["ratio", "wcag", "accessibility", "color"],
  },
  {
    id: "color-mixer",
    name: "Mélangeur de Couleurs",
    nameEn: "Color Mixer",
    icon: Blend,
    description: "Mélanger deux couleurs pour en créer une nouvelle",
    descriptionEn: "Mix two colors to create a new one",
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
    nameEn: "Transformer",
    icon: Type,
    description: "Inverser, mettre à l'envers ou formater votre texte avec des styles Unicode",
    descriptionEn: "Reverse, flip or format your text with Unicode styles",
    Component: TextTransformer,
    category: "text",
  },
  {
    id: "number-to-words",
    name: "Nombres en lettres",
    nameEn: "Numbers to Words",
    icon: FileText,
    description: "Convertir des nombres en toutes lettres",
    descriptionEn: "Convert numbers to words",
    Component: NumberToWords,
    category: "text",
  },
  {
    id: "slug-generator",
    name: "Slug",
    nameEn: "Slug Generator",
    icon: LinkIcon,
    description: "Générateur de slugs d'URL propres",
    descriptionEn: "Clean URL slug generator",
    Component: SlugGenerator,
    category: "text",
  },
  {
    id: "case-converter",
    name: "Casse",
    nameEn: "Case Converter",
    icon: CaseSensitive,
    description: "camelCase, snake_case, kebab-case",
    descriptionEn: "camelCase, snake_case, kebab-case",
    Component: CaseConverter,
    category: "text",
  },
  {
    id: "cesar-cipher",
    name: "César",
    nameEn: "Caesar Cipher",
    icon: Shield,
    description: "Chiffre de César pour crypter/décrypter du texte",
    descriptionEn: "Caesar cipher to encrypt/decrypt text",
    Component: CesarCipher,
    category: "text",
  },
  {
    id: "vigenere-cipher",
    name: "Vigenère",
    nameEn: "Vigenere Cipher",
    icon: Key,
    description: "Chiffrer ou déchiffrer du texte avec le chiffre de Vigenère",
    descriptionEn: "Encrypt or decrypt text with the Vigenere cipher",
    Component: VigenereCipher,
    category: "text",
  },
  {
    id: "text-formatter",
    name: "Format",
    nameEn: "Text Formatter",
    icon: FileText,
    description: "Mise en forme de texte simple",
    descriptionEn: "Simple text formatting",
    Component: TextFormatter,
    category: "text",
  },
  {
    id: "lorem-ipsum",
    name: "Lorem Ipsum",
    nameEn: "Lorem Ipsum",
    icon: FileType,
    description: "Générateur de texte de remplissage",
    descriptionEn: "Placeholder text generator",
    Component: LoremIpsumGenerator,
    category: "text",
  },
  {
    id: "markdown-preview",
    name: "Markdown",
    nameEn: "Markdown",
    icon: FileCode,
    description: "Éditeur et prévisualisation Markdown",
    descriptionEn: "Markdown editor and preview",
    Component: MarkdownPreview,
    category: "text",
  },
  {
    id: "markdown-table",
    name: "Tableau Markdown",
    nameEn: "Markdown Table",
    icon: Table,
    description: "Générateur de tableaux Markdown visuel",
    descriptionEn: "Visual Markdown table generator",
    Component: MarkdownTableGenerator,
    category: "text",
  },
  {
    id: "diff-checker",
    name: "Diff",
    nameEn: "Diff Checker",
    icon: Columns,
    description: "Comparateur de texte ligne par ligne",
    descriptionEn: "Line by line text comparator",
    Component: DiffChecker,
    category: "text",
  },
  {
    id: "morse-code",
    name: "Morse",
    nameEn: "Morse Code",
    icon: Signal,
    description: "Traducteur de texte en Morse",
    descriptionEn: "Text to Morse translator",
    Component: MorseCodeConverter,
    category: "text",
  },
  {
    id: "list-cleaner",
    name: "Nettoyeur de liste",
    nameEn: "List Cleaner",
    icon: ListChecks,
    description: "Trier, dédoublonner et nettoyer vos listes",
    descriptionEn: "Sort, deduplicate and clean your lists",
    Component: ListCleaner,
    category: "text",
    keywords: ["doublons", "tri", "préfixe", "suffixe", "nettoyage", "formatage"],
  },
  {
    id: "nato-translator",
    name: "Alphabet OTAN",
    nameEn: "NATO Alphabet",
    icon: Volume2,
    description: "Traduire du texte en alphabet phonétique de l'OTAN (Alpha, Bravo...)",
    descriptionEn: "Translate text to NATO phonetic alphabet (Alpha, Bravo...)",
    Component: NatoPhoneticTranslator,
    category: "text",
  },
  {
    id: "braille-translator",
    name: "Traducteur Braille",
    nameEn: "Braille Translator",
    icon: Type,
    description: "Convertir du texte en Braille Grade 1 et vice versa",
    descriptionEn: "Convert text to Braille Grade 1 and vice-versa",
    Component: BrailleTranslator,
    category: "text",
  },
  {
    id: "leetspeak-converter",
    name: "Leetspeak",
    nameEn: "Leetspeak",
    icon: Type,
    description: "Convertir du texte en l3375p34|<",
    descriptionEn: "Convert text to l3375p34|<",
    Component: LeetspeakConverter,
    category: "text",
  },
  {
    id: "string-escaper",
    name: "String Escaper",
    nameEn: "String Escaper",
    icon: ArrowLeftRight,
    description: "Echapper ou dé-échapper des caractères (JSON, HTML, SQL)",
    descriptionEn: "Escape or unescape characters (JSON, HTML, SQL)",
    Component: StringEscaper,
    category: "text",
    keywords: ["escape", "unescape", "html", "json", "sql", "quotes"],
  },
  {
    id: "flexbox-generator",
    name: "Flexbox CSS",
    nameEn: "Flexbox CSS",
    icon: LayoutGrid,
    description: "Générateur visuel de mise en page Flexbox CSS",
    descriptionEn: "Visual CSS Flexbox layout generator",
    Component: FlexboxGenerator,
    category: "dev",
    keywords: ["css", "flexbox", "layout", "design", "frontend", "responsive"],
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
    nameEn: "Card Validator",
    icon: ShieldCheck,
    description: "Vérifier la validité d'une carte bancaire (Luhn)",
    descriptionEn: "Verify the validity of a credit card (Luhn)",
    Component: CreditCardValidator,
    category: "dev",
  },
  {
    id: "json-schema",
    name: "Schéma JSON",
    nameEn: "JSON Schema",
    icon: Braces,
    description: "Générer un JSON Schema à partir d'un JSON",
    descriptionEn: "Generate a JSON Schema from JSON",
    Component: JSONSchemaGenerator,
    category: "dev",
  },
  {
    id: "zod-schema",
    name: "Schéma Zod",
    nameEn: "Zod Schema",
    icon: ShieldCheck,
    description: "Générer un schéma Zod à partir d'un JSON",
    descriptionEn: "Generate a Zod schema from JSON",
    Component: ZodSchemaGenerator,
    category: "dev",
    keywords: ["typescript", "validation", "zod", "schema", "json"],
  },
  {
    id: "json-tree-viewer",
    name: "JSON Tree Viewer",
    nameEn: "JSON Tree Viewer",
    icon: Braces,
    description: "Visualiser et filtrer une structure JSON en arbre",
    descriptionEn: "Visualize and filter a JSON structure in a tree",
    Component: JsonTreeViewer,
    category: "dev",
  },
  {
    id: "chmod",
    name: "Chmod",
    nameEn: "Chmod",
    icon: Terminal,
    description: "Calculateur de permissions Unix (Octal et Symbolique)",
    descriptionEn: "Unix permission calculator (Octal and Symbolic)",
    Component: ChmodCalculator,
    category: "dev",
    keywords: ["linux", "unix", "permissions", "chmod", "serveur", "sécurité"],
  },
  {
    id: "subnet-calculator",
    name: "Calculateur IP",
    nameEn: "IP Calculator",
    icon: Network,
    description: "Calcul de sous-réseaux IPv4 et CIDR",
    descriptionEn: "IPv4 subnet and CIDR calculation",
    Component: SubnetCalculator,
    category: "dev",
  },
  {
    id: "jwt-decoder",
    name: "Décodeur JWT",
    nameEn: "JWT Decoder",
    icon: ShieldCheck,
    description: "Décoder et analyser vos jetons JWT",
    descriptionEn: "Decode and analyze your JWT tokens",
    Component: JWTDecoder,
    category: "dev",
  },
  {
    id: "qr-code",
    name: "QR Code",
    nameEn: "QR Code",
    icon: QrCode,
    description: "Générateur de codes QR",
    descriptionEn: "QR code generator",
    Component: QRCodeGenerator,
    category: "dev",
    keywords: ["code", "image", "url", "lien", "scanner"],
  },
  {
    id: "uuid-generator",
    name: "UUID",
    nameEn: "UUID",
    icon: Fingerprint,
    description: "Générateur d'identifiants uniques",
    descriptionEn: "Unique identifier generator",
    Component: UUIDGenerator,
    category: "dev",
  },
  {
    id: "base64",
    name: "Base64",
    nameEn: "Base64",
    icon: Code,
    description: "Encodeur et décodeur Base64",
    descriptionEn: "Base64 encoder and decoder",
    Component: Base64Tool,
    category: "dev",
  },
  {
    id: "hash-generator",
    name: "Hash",
    nameEn: "Hash",
    icon: Shield,
    description: "SHA-256, SHA-512 Generator",
    descriptionEn: "SHA-256, SHA-512 generator",
    Component: HashGenerator,
    category: "dev",
  },
  {
    id: "regex-tester",
    name: "RegEx",
    nameEn: "RegEx",
    icon: Search,
    description: "Testeur d'expressions régulières",
    descriptionEn: "Regular expression tester",
    Component: RegExTester,
    category: "dev",
  },
  {
    id: "utm-builder",
    name: "UTM Builder",
    nameEn: "UTM Builder",
    icon: Share2,
    description: "Générateur de liens de suivi UTM",
    descriptionEn: "UTM tracking link generator",
    Component: UTMBuilder,
    category: "dev",
  },
  {
    id: "social-links",
    name: "Liens Sociaux",
    nameEn: "Social Links",
    icon: Share2,
    description: "Générer des liens de partage pour réseaux sociaux",
    descriptionEn: "Generate social media sharing links",
    Component: SocialMediaLinks,
    category: "dev",
  },
  {
    id: "box-shadow",
    name: "Box Shadow",
    nameEn: "Box Shadow",
    icon: Layers,
    description: "Générateur visuel d'ombres CSS",
    descriptionEn: "Visual CSS box-shadow generator",
    Component: BoxShadowGenerator,
    category: "dev",
  },
  {
    id: "gradient-generator",
    name: "Dégradés CSS",
    nameEn: "CSS Gradients",
    icon: Palette,
    description: "Générateur visuel de dégradés CSS",
    descriptionEn: "Visual CSS gradient generator",
    Component: GradientGenerator,
    category: "dev",
  },
  {
    id: "meta-tags",
    name: "Meta Tags",
    nameEn: "Meta Tags",
    icon: Search,
    description: "Générateur de balises meta SEO",
    descriptionEn: "SEO meta tags generator",
    Component: MetaTagsGenerator,
    category: "dev",
  },
  {
    id: "json-csv",
    name: "JSON & CSV",
    nameEn: "JSON & CSV",
    icon: FileCode,
    description: "Convertisseur bidirectionnel JSON et CSV",
    descriptionEn: "Bidirectional JSON and CSV converter",
    Component: JSONCSVConverter,
    category: "dev",
  },
  {
    id: "json-to-sql",
    name: "JSON en SQL",
    nameEn: "JSON to SQL",
    icon: Database,
    description: "Convertir un tableau JSON en requêtes SQL INSERT",
    descriptionEn: "Convert a JSON array into SQL INSERT statements",
    Component: JSONToSQL,
    category: "dev",
    keywords: ["database", "sql", "insert", "migration", "data"],
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    nameEn: "JSON Formatter",
    icon: FileCode,
    description: "Prettify, minify et valide votre JSON",
    descriptionEn: "Prettify, minify and validate your JSON",
    Component: JSONFormatter,
    category: "dev",
    keywords: ["formatting", "pretty", "beautify", "json", "lint", "formatage", "valider"],
  },
  {
    id: "xml-formatter",
    name: "Formateur XML",
    nameEn: "XML Formatter",
    icon: FileCode,
    description: "Embellir, minifier et valider votre XML",
    descriptionEn: "Beautify, minify and validate your XML",
    Component: XMLFormatter,
    category: "dev",
    keywords: ["formatting", "pretty", "beautify", "xml", "soap"],
  },
  {
    id: "json-to-ts",
    name: "JSON en TS",
    nameEn: "JSON to TS",
    icon: Code,
    description: "Convertir du JSON en interfaces TypeScript",
    descriptionEn: "Convert JSON to TypeScript interfaces",
    Component: JSONToTS,
    category: "dev",
  },
  {
    id: "json-to-cpp",
    name: "JSON en C++",
    nameEn: "JSON to C++",
    icon: Code,
    description: "Convertir du JSON en structures C++",
    descriptionEn: "Convert JSON to C++ structs",
    Component: JSONToCPP,
    category: "dev",
    keywords: ["cpp", "struct", "json", "types", "cplusplus"],
  },
  {
    id: "sql-formatter",
    name: "SQL Formatter",
    nameEn: "SQL Formatter",
    icon: Database,
    description: "Formater vos requêtes SQL pour la lecture",
    descriptionEn: "Format your SQL queries for readability",
    Component: SQLFormatter,
    category: "dev",
  },
  {
    id: "yaml-formatter",
    name: "Formateur YAML",
    nameEn: "YAML Formatter",
    icon: FileCode,
    description: "Prettify, minify et valide votre YAML",
    descriptionEn: "Prettify, minify and validate your YAML",
    Component: YAMLFormatter,
    category: "dev",
  },
  {
    id: "yaml-json",
    name: "YAML <> JSON",
    nameEn: "YAML <> JSON",
    icon: ArrowLeftRight,
    description: "Convertisseur bidirectionnel YAML et JSON",
    descriptionEn: "Bidirectional YAML and JSON converter",
    Component: YAMLJSONConverter,
    category: "dev",
  },
  {
    id: "cron-generator",
    name: "Cron Generator",
    nameEn: "Cron Generator",
    icon: Clock,
    description: "Générateur visuel d'expressions Cron",
    descriptionEn: "Visual Cron expression generator",
    Component: CronGenerator,
    category: "dev",
    keywords: ["schedule", "linux", "crontab", "planificateur", "tâche"],
  },
  {
    id: "html-entity",
    name: "HTML Entities",
    nameEn: "HTML Entities",
    icon: Code,
    description: "Convertir des caractères en entités HTML",
    descriptionEn: "Convert characters to HTML entities",
    Component: HTMLEntityConverter,
    category: "dev",
  },
  {
    id: "unix-timestamp",
    name: "Unix Timestamp",
    nameEn: "Unix Timestamp",
    icon: Clock,
    description: "Convertisseur de temps Unix et dates",
    descriptionEn: "Unix timestamp and dates converter",
    Component: UnixTimestampConverter,
    category: "dev",
  },
  {
    id: "url-encoder",
    name: "URL",
    nameEn: "URL",
    icon: LinkIcon,
    description: "Encodeur et décodeur d'URL",
    descriptionEn: "URL encoder and decoder",
    Component: URLEncoder,
    category: "dev",
  },
  {
    id: "url-parser",
    name: "Analyseur d'URL",
    nameEn: "URL Parser",
    icon: Search,
    description: "Décortiquer une URL (protocole, hôte, paramètres)",
    descriptionEn: "Parse an URL (protocol, host, parameters)",
    Component: UrlParser,
    category: "dev",
  },
  {
    id: "file-to-base64",
    name: "Fichier en Base64",
    nameEn: "File to Base64",
    icon: FileCode,
    description: "Convertir n'importe quel fichier en chaîne Base64",
    descriptionEn: "Convert any file to Base64 string",
    Component: FileToBase64,
    category: "dev",
  },
  {
    id: "base64-to-image",
    name: "Base64 en Image",
    nameEn: "Base64 to Image",
    icon: ImageIcon,
    description: "Convertir des chaînes Base64 en images",
    descriptionEn: "Convert Base64 strings to images",
    Component: Base64ToImage,
    category: "dev",
  },
  {
    id: "code-minifier",
    name: "Minificateur de code",
    nameEn: "Code Minifier",
    icon: Scissors,
    description: "Minifier JS, CSS et HTML pour le web",
    descriptionEn: "Minify JS, CSS and HTML for the web",
    Component: CodeMinifier,
    category: "dev",
  },
  {
    id: "binary-converter",
    name: "Texte en Binaire",
    nameEn: "Binary Converter",
    icon: Binary,
    description: "Convertisseur bidirectionnel texte et binaire",
    descriptionEn: "Bidirectional text and binary converter",
    Component: BinaryTextConverter,
    category: "dev",
    keywords: ["0101", "ASCII", "codage", "décodage", "ordinateur", "base2"],
  },
  {
    id: "json-xml",
    name: "JSON <> XML",
    nameEn: "JSON <> XML",
    icon: FileCode,
    description: "Convertisseur bidirectionnel JSON et XML",
    descriptionEn: "Bidirectional JSON and XML converter",
    Component: JsonXmlConverter,
    category: "dev",
  },
  {
    id: "curl-converter",
    name: "cURL Converter",
    nameEn: "cURL Converter",
    icon: Terminal,
    description: "Transformer des commandes cURL en fetch JavaScript",
    descriptionEn: "Transform cURL commands into JavaScript fetch",
    Component: CURLConverter,
    category: "dev",
  },
  {
    id: "svg-placeholder",
    name: "Placeholder SVG",
    nameEn: "SVG Placeholder",
    icon: ImagePlus,
    description: "Générer des images de remplacement en SVG",
    descriptionEn: "Generate SVG placeholder images",
    Component: SVGPlaceholder,
    category: "dev",
  },
  {
    id: "http-status",
    name: "Codes HTTP",
    nameEn: "HTTP Codes",
    icon: Globe,
    description: "Référence complète des codes d'état HTTP",
    descriptionEn: "Complete reference of HTTP status codes",
    Component: HTTPStatusCodes,
    category: "dev",
    keywords: ["http", "status", "codes", "error", "server", "rest"],
  },
  // Other Tools
  {
    id: "timer",
    name: "Timer",
    nameEn: "Timer",
    icon: Timer,
    description: "Minuteur et Chronomètre",
    descriptionEn: "Timer and Stopwatch",
    Component: TimerTool,
    category: "other",
    keywords: ["pomodoro", "chronomètre", "temps", "minuteur", "productivité"],
  },
  {
    id: "image-compressor",
    name: "Images",
    nameEn: "Images",
    icon: ImageIcon,
    description: "Compresseur d'images client-side",
    descriptionEn: "Client-side image compressor",
    Component: ImageCompressor,
    category: "other",
  },
  {
    id: "ip-address",
    name: "IP",
    nameEn: "IP",
    icon: Globe,
    description: "Mon adresse IP et infos réseau",
    descriptionEn: "My IP address and network info",
    Component: IPAddressTool,
    category: "other",
  },
  {
    id: "aspect-ratio",
    name: "Ratio",
    nameEn: "Ratio",
    icon: Monitor,
    description: "Calculateur d'aspect ratio",
    descriptionEn: "Aspect ratio calculator",
    Component: AspectRatioCalculator,
    category: "other",
  },
  {
    id: "bpm-counter",
    name: "BPM",
    nameEn: "BPM",
    icon: Music,
    description: "Compteur de battements par minute",
    descriptionEn: "Beats per minute counter",
    Component: BPMCounter,
    category: "other",
    keywords: ["music", "tempo", "ritmo", "beat", "musique", "metronome"],
  },
  {
    id: "random-generator",
    name: "Aléatoire",
    nameEn: "Random",
    icon: Shuffle,
    description: "Nombres, chaînes et listes aléatoires",
    descriptionEn: "Random numbers, strings and lists",
    Component: RandomGenerator,
    category: "other",
  },
  {
    id: "user-agent",
    name: "User Agent",
    nameEn: "User Agent",
    icon: Monitor,
    description: "Analyseur de navigateur et système",
    descriptionEn: "Browser and system analyzer",
    Component: UserAgentAnalyzer,
    category: "other",
  },
  {
    id: "metronome",
    name: "Métronome",
    nameEn: "Metronome",
    icon: Music,
    description: "Métronome précis pour la pratique musicale",
    descriptionEn: "Precise metronome for musical practice",
    Component: Metronome,
    category: "other",
  },
  {
    id: "text-to-speech",
    name: "Synthèse Vocale",
    nameEn: "Text to Speech",
    icon: Volume2,
    description: "Convertir du texte en parole",
    descriptionEn: "Convert text to speech",
    Component: TextToSpeech,
    category: "other",
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    nameEn: "Glassmorphism",
    icon: Layers,
    description: "Générateur CSS d'effets de verre",
    descriptionEn: "CSS glass effect generator",
    Component: GlassmorphismGenerator,
    category: "dev",
  },
  {
    id: "image-to-webp",
    name: "Convertir en WebP",
    nameEn: "Convert to WebP",
    icon: ImageIcon,
    description: "Optimiser vos images au format WebP",
    descriptionEn: "Optimize your images in WebP format",
    Component: ImageToWebP,
    category: "other",
  },
  {
    id: "timezone-converter",
    name: "Fuseaux Horaires",
    nameEn: "Timezones",
    icon: Clock,
    description: "Convertisseur de temps international",
    descriptionEn: "International time converter",
    Component: TimezoneConverter,
    category: "other",
  },
  {
    id: "download-time",
    name: "Temps de téléchargement",
    nameEn: "Download Time",
    icon: Clock,
    description: "Estimer le temps de transfert de fichiers",
    descriptionEn: "Estimate file transfer time",
    Component: DownloadTimeCalculator,
    category: "other",
  },
  {
    id: "list-comparator",
    name: "Comparateur de Listes",
    nameEn: "List Comparator",
    icon: Columns,
    description: "Comparer deux listes pour trouver les éléments communs ou uniques",
    descriptionEn: "Compare two lists to find common or unique elements",
    Component: ListComparator,
    category: "text",
    keywords: ["liste", "comparaison", "doublons", "intersection", "différence", "difference", "symmetric", "set", "ensembles"],
  },
  {
    id: "cursor-reference",
    name: "Curseurs CSS",
    nameEn: "CSS Cursors",
    icon: MousePointer2,
    description: "Référence visuelle et codes CSS pour tous les types de curseurs",
    descriptionEn: "Visual reference and CSS codes for all cursor types",
    Component: CursorReference,
    category: "dev",
    keywords: ["css", "cursor", "design", "ui", "ux", "souris"],
  },
  {
    id: "whatsapp-link",
    name: "Lien WhatsApp",
    nameEn: "WhatsApp Link",
    icon: Send,
    description: "Générer un lien wa.me avec un message pré-rempli",
    descriptionEn: "Generate a wa.me link with a pre-filled message",
    Component: WhatsAppLinkGenerator,
    category: "business",
    keywords: ["contact", "message", "whatsapp", "link", "discussion"],
  },
  {
    id: "security-headers",
    name: "Headers Sécurité",
    nameEn: "Security Headers",
    icon: Shield,
    description: "Générer des en-têtes de sécurité HTTP (CSP, HSTS, etc.)",
    descriptionEn: "Generate HTTP security headers (CSP, HSTS, etc.)",
    Component: SecurityHeadersGenerator,
    category: "dev",
    keywords: ["sécurité", "http", "headers", "csp", "hsts", "protection", "security"],
  },
  {
    id: "wifi-generator",
    name: "WiFi QR Code",
    nameEn: "WiFi QR Code",
    icon: Wifi,
    description: "Générer un QR Code pour partager votre connexion WiFi",
    descriptionEn: "Generate a QR Code to share your WiFi connection",
    Component: WiFiGenerator,
    category: "other",
    keywords: ["wifi", "qr", "code", "réseau", "partage", "sécurité", "connexion"],
  },
  {
    id: "robots-txt",
    name: "Robots.txt",
    nameEn: "Robots.txt",
    icon: FileSearch,
    description: "Générer un fichier robots.txt pour le SEO",
    descriptionEn: "Generate a robots.txt file for SEO",
    Component: RobotsTxtGenerator,
    category: "dev",
    keywords: ["seo", "robots", "txt", "google", "indexation", "sitemap", "webmaster", "crawler"],
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
    id: "css-grid",
    name: "Grid CSS",
    nameEn: "CSS Grid",
    icon: LayoutGrid,
    description: "Générateur visuel de grille CSS (Grid Layout)",
    descriptionEn: "Visual CSS Grid layout generator",
    Component: CSSGridGenerator,
    category: "dev",
    keywords: ["css", "grid", "layout", "design", "frontend", "responsive"],
  },
  {
    id: "neumorphism-generator",
    name: "Neumorphism",
    nameEn: "Neumorphism",
    icon: Box,
    description: "Générateur visuel de design Neumorphisme (Soft UI)",
    descriptionEn: "Visual Neumorphism (Soft UI) design generator",
    Component: NeumorphismGenerator,
    category: "dev",
    keywords: ["css", "neumorphism", "soft ui", "design", "frontend", "shadow"],
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
  {
    id: "json-path",
    name: "JSONPath Tester",
    nameEn: "JSONPath Tester",
    icon: Search,
    description: "Tester des expressions JSONPath sur vos données JSON",
    descriptionEn: "Test JSONPath expressions on your JSON data",
    Component: JSONPathTester,
    category: "dev",
    keywords: ["json", "path", "query", "filter", "extract"],
  },
  {
    id: "sitemap-generator",
    name: "Générateur de Sitemap",
    nameEn: "Sitemap Generator",
    icon: Globe,
    description: "Générer un fichier sitemap.xml pour le SEO",
    descriptionEn: "Generate a sitemap.xml file for SEO",
    Component: SitemapGenerator,
    category: "dev",
    keywords: ["seo", "sitemap", "xml", "google", "indexation"],
  },
  {
    id: "json-to-go",
    name: "JSON en Go",
    nameEn: "JSON to Go",
    icon: Code,
    description: "Convertir du JSON en structures Go",
    descriptionEn: "Convert JSON to Go struct definitions",
    Component: JSONToGo,
    category: "dev",
    keywords: ["golang", "go", "struct", "json", "types"],
  },
  {
    id: "html-to-jsx",
    name: "HTML en JSX",
    nameEn: "HTML to JSX",
    icon: FileCode,
    description: "Convertir du HTML en syntaxe JSX React",
    descriptionEn: "Convert HTML to React JSX syntax",
    Component: HTMLToJSX,
    category: "dev",
    keywords: ["react", "jsx", "html", "frontend", "convert"],
  },
  {
    id: "json-to-java",
    name: "JSON en Java",
    nameEn: "JSON to Java",
    icon: Coffee,
    description: "Convertir du JSON en classes Java (POJO)",
    descriptionEn: "Convert JSON to Java POJO classes",
    Component: JSONToJava,
    category: "dev",
    keywords: ["java", "pojo", "jackson", "gson", "lombok"],
  },
  {
    id: "json-to-csharp",
    name: "JSON en C#",
    nameEn: "JSON to C#",
    icon: Code,
    description: "Convertir du JSON en classes C#",
    descriptionEn: "Convert JSON to C# classes",
    Component: JSONToCSharp,
    category: "dev",
    keywords: ["csharp", "dotnet", "class", "json", "types"],
  },
  {
    id: "json-to-python",
    name: "JSON en Python",
    nameEn: "JSON to Python",
    icon: Terminal,
    description: "Convertir du JSON en dataclasses Python",
    descriptionEn: "Convert JSON to Python dataclasses",
    Component: JSONToPython,
    category: "dev",
    keywords: ["python", "dataclass", "json", "types", "pep8"],
  },
  {
    id: "json-to-rust",
    name: "JSON en Rust",
    nameEn: "JSON to Rust",
    icon: Code,
    description: "Convertir du JSON en structures Rust (Serde)",
    descriptionEn: "Convert JSON to Rust structs (Serde)",
    Component: JSONToRust,
    category: "dev",
    keywords: ["rust", "serde", "struct", "json", "types"],
  },
  {
    id: "json-to-env",
    name: "JSON en ENV",
    nameEn: "JSON to ENV",
    icon: Terminal,
    description: "Convertir du JSON en format de fichier .env",
    descriptionEn: "Convert JSON to .env file format",
    Component: JSONToEnv,
    category: "dev",
    keywords: ["env", "environment", "json", "config", "dotenv"],
  },
  {
    id: "json-to-php",
    name: "JSON en PHP",
    nameEn: "JSON to PHP",
    icon: FileCode,
    description: "Convertir du JSON en classes PHP 8.1+",
    descriptionEn: "Convert JSON to PHP 8.1+ classes",
    Component: JSONToPHP,
    category: "dev",
    keywords: ["php", "class", "json", "types"],
  },
  {
    id: "json-to-kotlin",
    name: "JSON en Kotlin",
    nameEn: "JSON to Kotlin",
    icon: Code,
    description: "Convertir du JSON en data classes Kotlin",
    descriptionEn: "Convert JSON to Kotlin data classes",
    Component: JSONToKotlin,
    category: "dev",
    keywords: ["kotlin", "android", "data class", "json", "types"],
  },
  {
    id: "json-to-dart",
    name: "JSON en Dart",
    nameEn: "JSON to Dart",
    icon: Code,
    description: "Convertir du JSON en classes Dart",
    descriptionEn: "Convert JSON to Dart classes",
    Component: JSONToDart,
    category: "dev",
    keywords: ["dart", "flutter", "class", "json", "types"],
  },
  {
    id: "json-to-graphql",
    name: "JSON en GraphQL",
    nameEn: "JSON to GraphQL",
    icon: Database,
    description: "Générer un schéma GraphQL à partir d'un JSON",
    descriptionEn: "Generate a GraphQL schema from JSON",
    Component: JSONToGraphQL,
    category: "dev",
    keywords: ["graphql", "schema", "api", "json", "types"],
  },
  {
    id: "json-to-mongoose",
    name: "JSON en Mongoose",
    nameEn: "JSON to Mongoose",
    icon: Database,
    description: "Générer un modèle Mongoose à partir d'un JSON",
    descriptionEn: "Generate a Mongoose model from JSON",
    Component: JSONToMongoose,
    category: "dev",
    keywords: ["mongodb", "mongoose", "schema", "model", "json", "node"],
  },
  {
    id: "html-to-markdown",
    name: "HTML en Markdown",
    nameEn: "HTML to Markdown",
    icon: FileCode,
    description: "Convertir du HTML en syntaxe Markdown",
    descriptionEn: "Convert HTML to Markdown syntax",
    Component: HTMLToMarkdown,
    category: "dev",
    keywords: ["html", "markdown", "convert", "cms", "text"],
  },
  {
    id: "json-diff",
    name: "Diff JSON",
    nameEn: "JSON Diff",
    icon: Columns,
    description: "Comparer deux objets JSON structurellement",
    descriptionEn: "Compare two JSON objects structurally",
    Component: JsonDiff,
    category: "dev",
    keywords: ["json", "diff", "compare", "normalize", "structural"],
  },
  {
    id: "json-to-swift",
    name: "JSON en Swift",
    nameEn: "JSON to Swift",
    icon: Code,
    description: "Convertir du JSON en structures Swift (Codable)",
    descriptionEn: "Convert JSON to Swift struct definitions (Codable)",
    Component: JSONToSwift,
    category: "dev",
    keywords: ["swift", "ios", "codable", "struct", "json", "types"],
  },
  {
    id: "json-to-ruby",
    name: "JSON en Ruby",
    nameEn: "JSON to Ruby",
    icon: Code,
    description: "Convertir du JSON en classes Ruby",
    descriptionEn: "Convert JSON to Ruby classes",
    Component: JSONToRuby,
    category: "dev",
    keywords: ["ruby", "class", "json", "types", "rails"],
  },
  {
    id: "json-to-scala",
    name: "JSON en Scala",
    nameEn: "JSON to Scala",
    icon: Code,
    description: "Convertir du JSON en case classes Scala",
    descriptionEn: "Convert JSON to Scala case classes",
    Component: JSONToScala,
    category: "dev",
    keywords: ["scala", "case class", "json", "types", "spark"],
  },
  {
    id: "url-extractor",
    name: "Extracteur d'URLs",
    nameEn: "URL Extractor",
    icon: LinkIcon,
    description: "Extraire et dédoublonner les URLs d'un texte",
    descriptionEn: "Extract and deduplicate URLs from text",
    Component: URLExtractor,
    category: "dev",
    keywords: ["url", "extract", "link", "regex", "crawler"],
  },
  {
    id: "email-extractor",
    name: "Extracteur d'emails",
    nameEn: "Email Extractor",
    icon: Mail,
    description: "Extraire toutes les adresses e-mail d'un texte",
    descriptionEn: "Extract all email addresses from a text",
    Component: EmailExtractor,
    category: "text",
    keywords: ["email", "mail", "extract", "regex", "crawler"],
  },
  {
    id: "number-extractor",
    name: "Extracteur de nombres",
    nameEn: "Number Extractor",
    icon: Hash,
    description: "Extraire tous les nombres d'un texte",
    descriptionEn: "Extract all numbers from a text",
    Component: NumberExtractor,
    category: "text",
    keywords: ["number", "extractor", "regex", "digits", "data cleaning"],
  },
  {
    id: "markdown-to-html",
    name: "Markdown en HTML",
    nameEn: "Markdown to HTML",
    icon: FileCode,
    description: "Convertir du Markdown en HTML brut",
    descriptionEn: "Convert Markdown to raw HTML",
    Component: MarkdownToHTML,
    category: "dev",
    keywords: ["markdown", "html", "convert", "static", "web"],
  },
  {
    id: "html-formatter",
    name: "Formateur HTML",
    nameEn: "HTML Formatter",
    icon: FileCode,
    description: "Embellir ou minifier votre code HTML",
    descriptionEn: "Beautify or minify your HTML code",
    Component: HTMLFormatter,
    category: "dev",
    keywords: ["html", "format", "beautify", "minify", "lint"],
  },
  {
    id: "password-strength",
    name: "Force du mot de passe",
    nameEn: "Password Strength",
    icon: Shield,
    description: "Analyser l'entropie et le temps de crackage",
    descriptionEn: "Analyze entropy and crack time",
    Component: PasswordStrengthMeter,
    category: "dev",
    keywords: ["security", "password", "strength", "entropy", "crack"],
  },
  {
    id: "json-to-protobuf",
    name: "JSON en Protobuf",
    nameEn: "JSON to Protobuf",
    icon: FileCode,
    description: "Convertir du JSON en définitions Protobuf (proto3)",
    descriptionEn: "Convert JSON to Protobuf definitions (proto3)",
    Component: JSONToProtobuf,
    category: "dev",
    keywords: ["grpc", "protobuf", "proto3", "serialization", "json", "types"],
  },
  {
    id: "js-object-converter",
    name: "JS Object <> JSON",
    nameEn: "JS Object <> JSON",
    icon: Code,
    description: "Convertir entre objets JavaScript et JSON",
    descriptionEn: "Convert between JavaScript objects and JSON",
    Component: JSObjectConverter,
    category: "dev",
    keywords: ["javascript", "json", "object", "literal", "convert"],
  },
  {
    id: "json-to-joi",
    name: "JSON en Joi",
    nameEn: "JSON to Joi",
    icon: ShieldCheck,
    description: "Générer un schéma de validation Joi à partir d'un JSON",
    descriptionEn: "Generate a Joi validation schema from JSON",
    Component: JSONToJoi,
    category: "dev",
    keywords: ["validation", "joi", "schema", "javascript", "json"],
  },
  {
    id: "json-to-toml",
    name: "JSON en TOML",
    nameEn: "JSON to TOML",
    icon: FileCode,
    description: "Convertir du JSON en format TOML",
    descriptionEn: "Convert JSON to TOML format",
    Component: JSONToTOML,
    category: "dev",
    keywords: ["toml", "config", "json", "convert"],
  },
  {
    id: "prime-generator",
    name: "Nombres Premiers",
    nameEn: "Prime Generator",
    icon: Hash,
    description: "Générateur de nombres premiers dans un intervalle",
    descriptionEn: "Prime number generator within a range",
    Component: PrimeGenerator,
    category: "calculators",
    keywords: ["math", "prime", "primes", "generator", "numbers"],
  },
  {
    id: "text-to-image",
    name: "Texte en Image",
    nameEn: "Text to Image",
    icon: ImageIcon,
    description: "Convertir du texte en image PNG ou JPEG",
    descriptionEn: "Convert text to PNG or JPEG image",
    Component: TextToImage,
    category: "text",
    keywords: ["image", "convert", "text", "canvas", "design"],
  },
  {
    id: "json-to-ascii",
    name: "JSON en ASCII Table",
    nameEn: "JSON to ASCII Table",
    icon: Table,
    description: "Convertir du JSON en tableau ASCII formaté",
    descriptionEn: "Convert JSON to formatted ASCII table",
    Component: JSONToAsciiTable,
    category: "dev",
    keywords: ["json", "table", "ascii", "format", "developer"],
  },
  {
    id: "unicode-inspector",
    name: "Inspecteur Unicode",
    nameEn: "Unicode Inspector",
    icon: FileSearch,
    description: "Analyser les caractères d'un texte (hex, décimal, HTML)",
    descriptionEn: "Inspect text characters (hex, decimal, HTML)",
    Component: UnicodeInspector,
    category: "text",
    keywords: ["unicode", "hex", "encoding", "entity", "character", "inspect"],
  },
  {
    id: "text-repeater",
    name: "Répétiteur de texte",
    nameEn: "Text Repeater",
    icon: Repeat,
    description: "Répéter un texte plusieurs fois avec un séparateur",
    descriptionEn: "Repeat text multiple times with a separator",
    Component: TextRepeater,
    category: "text",
    keywords: ["repeat", "multiplier", "duplicate", "répéter", "spam", "test data"],
  },
  {
    id: "pascals-triangle",
    name: "Triangle de Pascal",
    nameEn: "Pascal's Triangle",
    icon: Triangle,
    description: "Générer et visualiser le triangle de Pascal",
    descriptionEn: "Generate and visualize Pascal's triangle",
    Component: PascalsTriangle,
    category: "calculators",
    keywords: ["math", "triangle", "pascal", "binomial", "coefficient", "combinatorics"],
  },
  {
    id: "text-splitter",
    name: "Découpeur de texte",
    nameEn: "Text Splitter",
    icon: Scissors,
    description: "Diviser un texte par caractères, lignes ou délimiteur",
    descriptionEn: "Split text by characters, lines or delimiter",
    Component: TextSplitter,
    category: "text",
    keywords: ["split", "divide", "chunks", "text", "découper"],
  },
  {
    id: "string-joiner",
    name: "Joindre du texte",
    nameEn: "String Joiner",
    icon: Plus,
    description: "Joindre des lignes de texte avec un séparateur personnalisé",
    descriptionEn: "Join text lines with a custom separator",
    Component: StringJoiner,
    category: "text",
    keywords: ["join", "concatenate", "lines", "separator", "joindre"],
  },
  {
    id: "json-analyzer",
    name: "Analyseur JSON",
    nameEn: "JSON Analyzer",
    icon: FileSearch,
    description: "Analyse structurelle et statistiques de données JSON",
    descriptionEn: "Structural analysis and statistics for JSON data",
    Component: JSONAnalyzer,
    category: "dev",
    keywords: ["json", "analyze", "stats", "structure", "depth", "keys"],
  },
  {
    id: "world-clock",
    name: "Horloge Mondiale",
    nameEn: "World Clock",
    icon: Globe,
    description: "Suivre l'heure dans plusieurs villes",
    descriptionEn: "Track time across multiple cities",
    Component: WorldClock,
    category: "other",
    keywords: ["time", "timezone", "world", "clock", "heure", "fuseau"],
  },
  {
    id: "stopwatch-pro",
    name: "Chronomètre Pro",
    nameEn: "Pro Stopwatch",
    icon: Timer,
    description: "Chronomètre de haute précision avec tours",
    descriptionEn: "High precision stopwatch with laps",
    Component: Stopwatch,
    category: "other",
    keywords: ["time", "precision", "laps", "timer", "sport"],
  },
  {
    id: "unicode-table",
    name: "Table Unicode",
    nameEn: "Unicode Table",
    icon: Grid,
    description: "Référence Unicode et Emojis",
    descriptionEn: "Unicode and Emoji reference",
    Component: UnicodeTable,
    category: "text",
    keywords: ["unicode", "emoji", "characters", "symbols", "table"],
  },
  {
    id: "ascii-art",
    name: "Art ASCII",
    nameEn: "ASCII Art",
    icon: Type,
    description: "Générer des bannières de texte en ASCII",
    descriptionEn: "Generate ASCII text banners",
    Component: ASCIIArtGenerator,
    category: "text",
    keywords: ["ascii", "art", "banner", "text", "style"],
  },
  {
    id: "number-statistics",
    name: "Statistiques",
    nameEn: "Number Statistics",
    icon: BarChart3,
    description: "Calculer des statistiques à partir d'une liste de nombres",
    descriptionEn: "Calculate statistics from a list of numbers",
    Component: NumberStatistics,
    category: "calculators",
    keywords: ["math", "statistics", "mean", "median", "standard deviation", "sum", "statistiques", "moyenne"],
  },
  {
    id: "sequence-generator",
    name: "Suites Mathématiques",
    nameEn: "Sequence Generator",
    icon: Sigma,
    description: "Générer des suites arithmétiques, géométriques ou de Fibonacci",
    descriptionEn: "Generate arithmetic, geometric, or Fibonacci sequences",
    Component: SequenceGenerator,
    category: "calculators",
    keywords: ["math", "sequence", "fibonacci", "arithmetic", "geometric", "suite"],
  },
  {
    id: "image-effects",
    name: "Effets Photo",
    nameEn: "Image Effects",
    icon: Wand2,
    description: "Appliquer des filtres et effets sur vos images",
    descriptionEn: "Apply filters and effects to your images",
    Component: ImageEffects,
    category: "other",
    keywords: ["image", "filter", "pixelate", "blur", "photo", "effects", "edit"],
  },
  {
    id: "bcrypt-generator",
    name: "Bcrypt Generator",
    nameEn: "Bcrypt Generator",
    icon: Shield,
    description: "Générer et vérifier des hashes Bcrypt pour vos mots de passe",
    descriptionEn: "Generate and verify Bcrypt hashes for your passwords",
    Component: BcryptGenerator,
    category: "dev",
    keywords: ["security", "password", "hash", "bcrypt", "salt", "crypto"],
  },
  {
    id: "color-extractor",
    name: "Extracteur de Couleurs",
    nameEn: "Color Extractor",
    icon: Palette,
    description: "Extraire la palette de couleurs d'une image",
    descriptionEn: "Extract color palette from an image",
    Component: ColorExtractor,
    category: "converters",
    keywords: ["color", "image", "palette", "extraction", "design"],
  },
  {
    id: "csv-mapper",
    name: "Convertisseur CSV",
    nameEn: "CSV Mapper",
    icon: FileSpreadsheet,
    description: "Convertir entre différents délimiteurs CSV (virgule, point-virgule, etc.)",
    descriptionEn: "Convert between different CSV delimiters (comma, semicolon, etc.)",
    Component: CSVMapper,
    category: "dev",
    keywords: ["csv", "delimiter", "mapping", "converter", "format"],
  },
  {
    id: "ip-extractor",
    name: "Extracteur d'IP",
    nameEn: "IP Extractor",
    icon: Globe,
    description: "Extraire les adresses IPv4 et IPv6 d'un texte",
    descriptionEn: "Extract IPv4 and IPv6 addresses from text",
    Component: IPExtractor,
    category: "text",
    keywords: ["ip", "ipv4", "ipv6", "network", "extract", "regex"],
  },
  {
    id: "hash-extractor",
    name: "Extracteur de Hash",
    nameEn: "Hash Extractor",
    icon: Shield,
    description: "Extraire les hashes MD5, SHA1, SHA256 et SHA512 d'un texte",
    descriptionEn: "Extract MD5, SHA1, SHA256 and SHA512 hashes from text",
    Component: HashExtractor,
    category: "dev",
    keywords: ["hash", "md5", "sha1", "sha256", "sha512", "crypto", "extract"],
  },
  {
    id: "image-to-ascii",
    name: "Image en ASCII",
    nameEn: "Image to ASCII",
    icon: ImageIcon,
    description: "Convertir une image en art ASCII textuel",
    descriptionEn: "Convert an image to textual ASCII art",
    Component: ImageToASCII,
    category: "text",
    keywords: ["image", "ascii", "art", "canvas", "textual"],
  },
  {
    id: "matrix-calculator",
    name: "Calculatrice de Matrices",
    nameEn: "Matrix Calculator",
    icon: Grid,
    description: "Effectuer des opérations sur les matrices (addition, multiplication, etc.)",
    descriptionEn: "Perform matrix operations (addition, multiplication, etc.)",
    Component: MatrixCalculator,
    category: "calculators",
    keywords: ["matrix", "math", "algebra", "determinant", "transpose", "calculation"],
  },
  {
    id: "data-url",
    name: "Générateur Data URL",
    nameEn: "Data URL Generator",
    icon: FileUp,
    description: "Convertir des fichiers en Data URL base64 avec aperçu",
    descriptionEn: "Convert files to base64 Data URLs with preview",
    Component: DataURLGenerator,
    category: "dev",
    keywords: ["data", "url", "base64", "inline", "embed", "image", "file"],
  },
  {
    id: "base64-to-pdf",
    name: "Base64 en PDF",
    nameEn: "Base64 to PDF",
    icon: FileText,
    description: "Décoder du Base64 en document PDF avec aperçu",
    descriptionEn: "Decode Base64 into a PDF document with preview",
    Component: Base64ToPDF,
    category: "dev",
    keywords: ["base64", "pdf", "decode", "preview", "download", "file"],
  },
  {
    id: "nanoid",
    name: "Générateur NanoID",
    nameEn: "NanoID Generator",
    icon: Fingerprint,
    description: "Générer des identifiants uniques cryptographiquement sûrs",
    descriptionEn: "Generate cryptographically secure unique identifiers",
    Component: NanoIDGenerator,
    category: "dev",
    keywords: ["id", "nanoid", "unique", "identifier", "secure", "crypto", "random"],
  },
  {
    id: "mnemonic-generator",
    name: "Phrase Secrète",
    nameEn: "Mnemonic Generator",
    icon: Key,
    description: "Générer une phrase de récupération BIP-39 sécurisée",
    descriptionEn: "Generate a secure BIP-39 recovery phrase",
    Component: MnemonicGenerator,
    category: "dev",
    keywords: ["crypto", "wallet", "seed", "mnemonic", "bip39", "security", "recovery"],
  },
  {
    id: "l-system",
    name: "Générateur L-System",
    nameEn: "L-System Generator",
    icon: Sparkles,
    description: "Générer des fractales via des systèmes de Lindenmayer",
    descriptionEn: "Generate fractals using Lindenmayer systems",
    Component: LSystemGenerator,
    category: "calculators",
    keywords: ["fractal", "l-system", "math", "recursive", "turtle", "graphics"],
  },
  {
    id: "bit-counter",
    name: "Compteur de Bits",
    nameEn: "Binary Bit Counter",
    icon: Binary,
    description: "Compter les 0 et 1 dans des données binaires",
    descriptionEn: "Count zeros and ones in binary data",
    Component: BinaryBitCounter,
    category: "dev",
    keywords: ["binary", "bit", "counter", "statistics", "data", "0101"],
  },
  {
    id: "divisors-finder",
    name: "Diviseurs d'un Nombre",
    nameEn: "Divisors Finder",
    icon: Calculator,
    description: "Trouver tous les diviseurs et la factorisation première",
    descriptionEn: "Find all divisors and prime factorization of a number",
    Component: DivisorsFinder,
    category: "calculators",
    keywords: ["math", "divisors", "prime", "factorization", "number", "integers"],
  },
  {
    id: "hmac-generator",
    name: "Générateur HMAC",
    nameEn: "HMAC Generator",
    icon: Shield,
    description: "Générer des codes d'authentification de message (HMAC)",
    descriptionEn: "Generate Hash-based Message Authentication Codes",
    Component: HMACGenerator,
    category: "dev",
    keywords: ["hmac", "security", "hash", "sha256", "sha512", "crypto", "authentication"],
  },
  {
    id: "rsa-generator",
    name: "Générateur RSA",
    nameEn: "RSA Generator",
    icon: Key,
    description: "Générer des paires de clés publiques et privées RSA",
    descriptionEn: "Generate RSA public and private key pairs",
    Component: RSAGenerator,
    category: "dev",
    keywords: ["rsa", "key", "pair", "public", "private", "crypto", "security", "pem"],
  },
  {
    id: "zalgo-text",
    name: "Texte Zalgo",
    nameEn: "Zalgo Text",
    icon: Sparkles,
    description: "Générer du texte glitché et effrayant (Zalgo)",
    descriptionEn: "Generate glitchy and spooky Zalgo text",
    Component: ZalgoGenerator,
    category: "text",
    keywords: ["zalgo", "glitch", "text", "unicode", "spooky", "void"],
  },
  {
    id: "unicode-spoofer",
    name: "Spoofing Unicode",
    nameEn: "Unicode Spoofer",
    icon: ShieldAlert,
    description: "Remplacer des caractères par des homoglyphes Unicode visuellement similaires",
    descriptionEn: "Replace characters with visually similar Unicode homoglyphs",
    Component: UnicodeSpoofer,
    category: "text",
    keywords: ["unicode", "spoof", "homoglyph", "phishing", "deceptive", "characters"],
  },
  {
    id: "csv-extractor",
    name: "Extracteur CSV",
    nameEn: "CSV Column Extractor",
    icon: Columns,
    description: "Extraire, réordonner et filtrer les colonnes d'un fichier CSV",
    descriptionEn: "Extract, reorder and filter columns from a CSV file",
    Component: CSVColumnExtractor,
    category: "dev",
    keywords: ["csv", "extract", "column", "data", "parser", "reorder"],
  },
  {
    id: "sql-to-json",
    name: "SQL en JSON",
    nameEn: "SQL to JSON",
    icon: Database,
    description: "Convertir des requêtes SQL INSERT en un tableau d'objets JSON",
    descriptionEn: "Convert SQL INSERT statements into a JSON array of objects",
    Component: SQLToJSON,
    category: "dev",
    keywords: ["sql", "json", "convert", "database", "insert"],
  },
  {
    id: "ua-generator",
    name: "Générateur de User Agent",
    nameEn: "User Agent Generator",
    icon: Monitor,
    description: "Générer des chaînes User Agent aléatoires et réalistes",
    descriptionEn: "Generate random and realistic User Agent strings",
    Component: UAGenerator,
    category: "dev",
    keywords: ["user agent", "ua", "browser", "fingerprint", "testing"],
  },
  {
    id: "words-to-numbers",
    name: "Mots en Nombres",
    nameEn: "Words to Numbers",
    icon: FileText,
    description: "Convertir des nombres écrits en anglais en chiffres",
    descriptionEn: "Convert English written numbers into digits",
    Component: WordsToNumbers,
    category: "text",
    keywords: ["convert", "words", "numbers", "english", "parsing"],
  },
  {
    id: "pi-generator",
    name: "Décimales de Pi",
    nameEn: "Pi Digits",
    icon: Hash,
    description: "Générer et formater les décimales de Pi (π)",
    descriptionEn: "Generate and format digits of Pi (π)",
    Component: PiGenerator,
    category: "calculators",
    keywords: ["pi", "math", "constant", "digits", "geometry"],
  },
  {
    id: "image-color-replacer",
    name: "Remplacer Couleur Image",
    nameEn: "Replace Image Color",
    icon: ImageIcon,
    description: "Remplacer une couleur dans une image par une autre",
    descriptionEn: "Replace one color in an image with another color",
    Component: ImageColorReplacer,
    category: "other",
    keywords: ["image", "color", "replace", "editor", "canvas", "pixel"],
  },
  {
    id: "average-time",
    name: "Moyenne de Temps",
    nameEn: "Average Time",
    icon: Clock,
    description: "Calculer la moyenne de plusieurs horaires",
    descriptionEn: "Calculate the average of multiple clock times",
    Component: AverageTimeCalculator,
    category: "calculators",
    keywords: ["time", "average", "clock", "mean", "duration"],
  },
  {
    id: "find-replace",
    name: "Chercher & Remplacer",
    nameEn: "Find and Replace",
    icon: Replace,
    description: "Rechercher et remplacer du texte avec RegEx",
    descriptionEn: "Search and replace text with RegEx support",
    Component: FindAndReplace,
    category: "text",
    keywords: ["find", "replace", "regex", "search", "text"],
  },
  {
    id: "image-resizer",
    name: "Redimensionner Image",
    nameEn: "Image Resizer",
    icon: Maximize2,
    description: "Changer les dimensions d'une image",
    descriptionEn: "Resize images to custom dimensions",
    Component: ImageResizer,
    category: "other",
    keywords: ["resize", "image", "dimensions", "width", "height"],
  },
  {
    id: "emoji-to-image",
    name: "Emoji en Image",
    nameEn: "Emoji to Image",
    icon: Sparkles,
    description: "Convertir des emojis en fichiers PNG/JPG",
    descriptionEn: "Convert emojis into PNG/JPG image files",
    Component: EmojiToImage,
    category: "text",
    keywords: ["emoji", "image", "convert", "icon"],
  },
  {
    id: "number-transformer",
    name: "Transformateur de Nombres",
    nameEn: "Number Transformer",
    icon: Hash,
    description: "Inverser, incrémenter ou formater des nombres",
    descriptionEn: "Reverse, increment or format lists of numbers",
    Component: NumberTransformer,
    category: "calculators",
    keywords: ["number", "math", "format", "reverse", "increment"],
  },
  {
    id: "negabinary-converter",
    name: "Convertisseur Négabinaire",
    nameEn: "Negabinary Converter",
    icon: Binary,
    description: "Convertir entre décimal et base -2",
    descriptionEn: "Convert between decimal and base -2",
    Component: NegabinaryConverter,
    category: "calculators",
    keywords: ["negabinary", "binary", "base-2", "math", "converter"],
  },
  {
    id: "css-clamp",
    name: "Générateur CSS clamp()",
    nameEn: "CSS clamp() Generator",
    icon: Maximize,
    description: "Générer des fonctions clamp() pour un design responsif",
    descriptionEn: "Generate clamp() functions for responsive design",
    Component: CSSClampGenerator,
    category: "dev",
    keywords: ["css", "clamp", "responsive", "typography", "fluid"],
  },
  {
    id: "base64-to-hex",
    name: "Base64 <> Hex",
    nameEn: "Base64 <> Hex",
    icon: ArrowLeftRight,
    description: "Convertir entre Base64 et Hexadécimal",
    descriptionEn: "Convert between Base64 and Hexadecimal",
    Component: Base64ToHex,
    category: "dev",
    keywords: ["base64", "hex", "encoding", "decoding", "converter"],
  },
  {
    id: "json-to-properties",
    name: "JSON en Properties",
    nameEn: "JSON to Properties",
    icon: FileCode,
    description: "Convertir du JSON en fichier de propriétés Java (.properties)",
    descriptionEn: "Convert JSON to Java properties file format (.properties)",
    Component: JSONToProperties,
    category: "dev",
    keywords: ["json", "properties", "java", "config", "flatten"],
  },
  {
    id: "text-shadow",
    name: "Text Shadow",
    nameEn: "Text Shadow",
    icon: Type,
    description: "Générateur visuel d'ombres de texte CSS multi-couches",
    descriptionEn: "Visual multi-layer CSS text-shadow generator",
    Component: TextShadowGenerator,
    category: "dev",
    keywords: ["css", "text-shadow", "design", "ui", "frontend", "shadow"],
  },
  {
    id: "css-formatter",
    name: "Formateur CSS",
    nameEn: "CSS Formatter",
    icon: FileCode,
    description: "Embellir, minifier et valider votre CSS",
    descriptionEn: "Beautify, minify and validate your CSS",
    Component: CSSFormatter,
    category: "dev",
    keywords: ["css", "format", "beautify", "minify", "frontend"],
  },
  {
    id: "fancy-text",
    name: "Texte Stylé",
    nameEn: "Fancy Text",
    icon: Sparkles,
    description: "Générer des styles de texte Unicode (Gras, Italique, Script...)",
    descriptionEn: "Generate fancy Unicode text styles (Bold, Italic, Script...)",
    Component: FancyTextGenerator,
    category: "text",
    keywords: ["fancy", "text", "unicode", "fonts", "style", "bold", "italic"],
  },
  {
    id: "image-rotator",
    name: "Rotation Image",
    nameEn: "Image Rotator",
    icon: RotateCw,
    description: "Faire pivoter ou retourner une image localement",
    descriptionEn: "Rotate or flip an image locally",
    Component: ImageRotator,
    category: "other",
    keywords: ["rotate", "flip", "mirror", "image", "canvas", "pivoter"],
  },
  {
    id: "life-calendar",
    name: "Calendrier de Vie",
    nameEn: "Life Calendar",
    icon: Calendar,
    description: "Visualiser votre vie en semaines (Memento Mori)",
    descriptionEn: "Visualize your life in weeks (Memento Mori)",
    Component: LifeCalendar,
    category: "other",
    keywords: ["life", "calendar", "weeks", "memento mori", "time", "visualization"],
  },
  {
    id: "csv-to-sql",
    name: "CSV en SQL",
    nameEn: "CSV to SQL",
    icon: Database,
    description: "Convertir des fichiers CSV en instructions SQL INSERT",
    descriptionEn: "Convert CSV files into SQL INSERT statements",
    Component: CSVToSQL,
    category: "dev",
    keywords: ["csv", "sql", "insert", "database", "import"],
  },
  {
    id: "json-to-markdown",
    name: "JSON en Markdown",
    nameEn: "JSON to Markdown",
    icon: FileCode,
    description: "Convertir des tableaux JSON en tableaux Markdown",
    descriptionEn: "Convert JSON arrays into Markdown tables",
    Component: JSONToMarkdown,
    category: "dev",
    keywords: ["json", "markdown", "table", "documentation"],
  },
  {
    id: "binary-bitwise",
    name: "Opérations Bit à Bit",
    nameEn: "Bitwise Operations",
    icon: Binary,
    description: "Effectuer des opérations logiques binaires (AND, OR, XOR...)",
    descriptionEn: "Perform binary logical operations (AND, OR, XOR...)",
    Component: BinaryBitwise,
    category: "dev",
    keywords: ["binary", "bitwise", "logic", "and", "or", "xor", "not", "shift"],
  },
  {
    id: "csv-to-xml",
    name: "CSV en XML",
    nameEn: "CSV to XML",
    icon: FileCode,
    description: "Transformer des données CSV en format XML structure",
    descriptionEn: "Transform CSV data into structured XML format",
    Component: CSVToXML,
    category: "dev",
    keywords: ["csv", "xml", "convert", "structure", "data"],
  },
  {
    id: "text-to-octal",
    name: "Texte en Octal",
    nameEn: "Text to Octal",
    icon: Hash,
    description: "Convertir du texte en représentation octale (Base 8)",
    descriptionEn: "Convert text into octal representation (Base 8)",
    Component: TextToOctal,
    category: "converters",
    keywords: ["text", "octal", "base8", "encoding", "decoding"],
  },
  {
    id: "number-sorter",
    name: "Trieur de Nombres",
    nameEn: "Number Sorter",
    icon: ArrowUpDown,
    description: "Trier des listes de nombres selon divers critères (valeur, somme des chiffres...)",
    descriptionEn: "Sort lists of numbers using various criteria (value, digit sum...)",
    Component: NumberSorter,
    category: "calculators",
    keywords: ["sort", "numbers", "order", "math", "digit sum", "trier"],
  },
  {
    id: "clock-generator",
    name: "Générateur d'Horloge",
    nameEn: "Clock Generator",
    icon: Clock,
    description: "Générer et personnaliser des horloges analogiques et numériques",
    descriptionEn: "Generate and customize analog and digital clocks",
    Component: ClockGenerator,
    category: "other",
    keywords: ["clock", "time", "analog", "digital", "generator", "horloge"],
  },
  {
    id: "mac-generator",
    name: "Adresses MAC",
    nameEn: "MAC Address Generator",
    icon: Network,
    description: "Générer des adresses MAC aléatoires et formatées",
    descriptionEn: "Generate random and formatted MAC addresses",
    Component: MacAddressGenerator,
    category: "dev",
    keywords: ["mac", "network", "address", "generator", "random", "laa"],
  },
  {
    id: "palindrome-checker",
    name: "Palindrome",
    nameEn: "Palindrome Checker",
    icon: ArrowLeftRight,
    description: "Vérifier si un mot ou une phrase est un palindrome",
    descriptionEn: "Check if a word or phrase is a palindrome",
    Component: PalindromeChecker,
    category: "text",
    keywords: ["palindrome", "text", "check", "reverse", "backwards"],
  },
  {
    id: "dog-age",
    name: "Âge de Chien",
    nameEn: "Dog Age Converter",
    icon: Heart,
    description: "Convertir l'âge d'un chien en équivalent humain",
    descriptionEn: "Convert a dog's age to human year equivalent",
    Component: DogAgeConverter,
    category: "calculators",
    keywords: ["dog", "age", "years", "human", "animal", "converter"],
  },
  {
    id: "look-and-say",
    name: "Regarde et Dis",
    nameEn: "Look and Say Generator",
    icon: Hash,
    description: "Générer les termes de la suite de Conway (Look-and-Say)",
    descriptionEn: "Generate terms of the Look-and-Say (Conway) sequence",
    Component: LookAndSayGenerator,
    category: "calculators",
    keywords: ["look-and-say", "conway", "sequence", "math", "logic"],
  },
  {
    id: "line-number-adder",
    name: "Ajouter numéros de ligne",
    nameEn: "Add Line Numbers",
    icon: ListOrdered,
    description: "Ajouter des numéros séquentiels à chaque ligne de texte",
    descriptionEn: "Add sequential numbers to each line of text",
    Component: LineNumberAdder,
    category: "text",
    keywords: ["line numbers", "counting", "prepend", "prefix", "format"],
  },
  {
    id: "text-wrapper",
    name: "Envelopper le texte",
    nameEn: "Text Wrapper",
    icon: WrapText,
    description: "Envelopper les lignes de texte longues à une largeur spécifiée",
    descriptionEn: "Wrap long lines of text at a specified width",
    Component: TextWrapper,
    category: "text",
    keywords: ["wrap", "text", "lines", "width", "formatting"],
  },
  {
    id: "random-ip-generator",
    name: "IP Aléatoires",
    nameEn: "Random IP Generator",
    icon: Network,
    description: "Générer une liste d'adresses IPv4 ou IPv6 aléatoires",
    descriptionEn: "Generate a list of random IPv4 or IPv6 addresses",
    Component: RandomIPGenerator,
    category: "dev",
    keywords: ["ip", "random", "ipv4", "ipv6", "network", "generator"],
  },
  {
    id: "random-date-generator",
    name: "Dates Aléatoires",
    nameEn: "Random Date Generator",
    icon: Calendar,
    description: "Générer des dates aléatoires dans une plage spécifiée",
    descriptionEn: "Generate random dates within a specified range",
    Component: RandomDateGenerator,
    category: "other",
    keywords: ["random", "date", "generator", "time", "range"],
  },
  {
    id: "list-to-tree",
    name: "Liste en Arbre",
    nameEn: "List to Tree",
    icon: FolderTree,
    description: "Convertir une liste de chemins en arborescence visuelle",
    descriptionEn: "Convert a list of paths into a visual directory tree",
    Component: ListToTree,
    category: "dev",
    keywords: ["tree", "hierarchy", "paths", "visualize", "structure", "folder"],
  },
  {
    id: "screen-recorder",
    name: "Enregistreur d'Écran",
    nameEn: "Screen Recorder",
    icon: MonitorPlay,
    description: "Enregistrer votre écran directement dans le navigateur",
    descriptionEn: "Record your screen directly in the browser",
    Component: ScreenRecorder,
    category: "other",
    keywords: ["record", "video", "capture", "screen", "webm"],
  },
  {
    id: "hex-to-image",
    name: "Hex en Image",
    nameEn: "Hex to Image",
    icon: ImageIcon,
    description: "Convertir des octets hexadécimaux en image (pixels)",
    descriptionEn: "Convert hexadecimal bytes into an image (pixels)",
    Component: HexToImage,
    category: "converters",
    keywords: ["hex", "binary", "image", "pixels", "visualize", "data"],
  },
  {
    id: "fractal-tree",
    name: "Arbre Fractal",
    nameEn: "Fractal Tree",
    icon: Sparkles,
    description: "Générateur interactif d'arbres fractals récursifs",
    descriptionEn: "Interactive recursive fractal tree generator",
    Component: FractalTree,
    category: "calculators",
    keywords: ["fractal", "tree", "recursive", "math", "art", "procedural"],
  },
  {
    id: "unicode-normalizer",
    name: "Normaliseur Unicode",
    nameEn: "Unicode Normalizer",
    icon: Type,
    description: "Convertir du texte stylisé (Unicode) en texte brut ASCII",
    descriptionEn: "Convert stylized Unicode text back to plain ASCII text",
    Component: UnicodeNormalizer,
    category: "text",
    keywords: ["unicode", "normalize", "fancy text", "clean", "ascii"],
  },
  {
    id: "integer-pair-generator",
    name: "Paires d'Entiers",
    nameEn: "Integer Pair Generator",
    icon: Hash,
    description: "Générer des paires de coordonnées (x, y) aléatoires",
    descriptionEn: "Generate random integer coordinate pairs (x, y)",
    Component: IntegerPairGenerator,
    category: "calculators",
    keywords: ["random", "integer", "pairs", "coordinates", "points", "math"],
  },
  {
    id: "binary-reverser",
    name: "Inverseur Binaire",
    nameEn: "Binary Reverser",
    icon: Binary,
    description: "Inverser l'ordre des bits dans un nombre binaire",
    descriptionEn: "Reverse the order of bits in a binary number",
    Component: BinaryReverser,
    category: "dev",
    keywords: ["binary", "reverse", "bits", "alignment", "padding"],
  },
];

// Initialize toolsMap and search index
tools.forEach(tool => {
  toolsMap[tool.id] = tool;
  const category = categories.find(c => c.id === tool.category);
  TOOL_SEARCH_INDEX.set(tool.id, {
    name: `${tool.name} ${tool.nameEn || ''} ${category?.name || ''} ${tool.keywords?.join(' ') || ''}`.toLowerCase(),
    description: `${tool.description} ${tool.descriptionEn || ''}`.toLowerCase(),
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
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-indigo-500/20 rounded-full"></div>
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin absolute top-0 left-0" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">{t("tool.loading")}</p>
    </div>
  );
}

function ThemeToggle({ navigate, location }: { navigate: any, location: any }) {
  const { theme, setTheme } = useTheme();
  const { t, i18n: i18nInstance } = useTranslation();
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
        aria-label={t("nav.lang_toggle")}
        title={t("nav.lang_toggle")}
      >
        {i18nInstance.language === 'fr' ? 'EN' : 'FR'}
      </button>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        aria-label={t("nav.theme_toggle")}
        title={t("nav.theme_toggle")}
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

function CommandMenu({ open, setOpen, onSelect, recentTools = [] }: {
  open: boolean,
  setOpen: (open: boolean) => void,
  onSelect: (id: string) => void,
  recentTools?: Tool[]
}) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'fr';

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-20">
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <Command
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        label={t("nav.search_aria")}
      >
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 py-4">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <Command.Input
            placeholder={t("search.placeholder")}
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-400">
            ESC
          </kbd>
        </div>
        <Command.List className="max-h-[400px] overflow-y-auto p-2 no-scrollbar">
          <Command.Empty className="py-12 text-center text-sm text-slate-500">
            {t("search.no_results")}
          </Command.Empty>

          {recentTools.length > 0 && (
            <Command.Group heading={t("recent.title")} className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              {recentTools.map((tool) => {
                const name = (currentLang === 'en' && tool.nameEn) ? tool.nameEn : tool.name;
                return (
                  <Command.Item
                    key={`recent-${tool.id}`}
                    onSelect={() => {
                      onSelect(tool.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-500 group-aria-selected:text-indigo-600 dark:group-aria-selected:text-indigo-400 transition-colors">
                      <tool.icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">{name}</span>
                    <span className="ml-auto text-[10px] font-medium opacity-50">{t(`category.${tool.category}`)}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          )}

          <Command.Group heading={t("category.all")} className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            {tools.map((tool) => {
              const name = (currentLang === 'en' && tool.nameEn) ? tool.nameEn : tool.name;
              return (
                <Command.Item
                  key={tool.id}
                  onSelect={() => {
                    onSelect(tool.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-500 group-aria-selected:text-indigo-600 dark:group-aria-selected:text-indigo-400 transition-colors">
                    <tool.icon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold">{name}</span>
                  <span className="ml-auto text-[10px] font-medium opacity-50">{t(`category.${tool.category}`)}</span>
                </Command.Item>
              );
            })}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n: i18nInstance } = useTranslation();
  const [commandOpen, setCommandOpen] = useState(false);

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

  // ⚡ Bolt Optimization: Pre-calculate tool counts per category for dashboard badges
  const categoryCounts = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    // Filter tools by search query first if present
    const searchableTools = query ? tools.filter(tool => {
      const searchEntry = TOOL_SEARCH_INDEX.get(tool.id);
      return searchEntry?.name.includes(query) || searchEntry?.description.includes(query);
    }) : tools;

    const counts: Record<string, number> = {
      all: searchableTools.length,
      favorites: searchableTools.filter(t => favoriteSet.has(t.id)).length,
    };

    searchableTools.forEach(tool => {
      counts[tool.category] = (counts[tool.category] || 0) + 1;
    });

    return counts;
  }, [deferredSearchQuery, favoriteSet]);

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
      <CommandMenu open={commandOpen} setOpen={setCommandOpen} onSelect={handleToolSelect} recentTools={recentTools} />
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-[100] px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-xl -translate-y-24 focus:translate-y-0 transition-transform duration-200"
      >
        {t("nav.skip")}
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
            <button
              onClick={() => setCommandOpen(true)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 group"
              aria-label={t("nav.search_label")}
            >
              <Search className="w-5 h-5" />
              <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-bold bg-white dark:bg-slate-900 group-hover:border-indigo-500 transition-colors">
                K
              </kbd>
            </button>
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
                  <h2 id="recent-tools-title" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-6 px-1">{t("recent.title")}</h2>
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
                <h2 className="sr-only">{t("tool.all_tools_aria")}</h2>
                {/* Category Nav */}
                <div className="sticky top-4 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-4 border-b border-slate-200/50 dark:border-slate-800/50 -mx-4 px-4">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id === "all" ? null : cat.id)}
                        aria-pressed={(selectedCategory === cat.id) || (cat.id === "all" && !selectedCategory)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                          (selectedCategory === cat.id) || (cat.id === "all" && !selectedCategory)
                            ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-md shadow-indigo-500/10"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-700"
                        }`}
                      >
                        <cat.icon className="w-4 h-4" />
                      {t(`category.${cat.id}`)}
                      <span className={`ml-1.5 opacity-50 font-mono text-[10px] tabular-nums ${(selectedCategory === cat.id) || (cat.id === "all" && !selectedCategory) ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`}>
                        {categoryCounts[cat.id] || 0}
                      </span>
                      </button>
                    ))}

                    {selectedCategory === 'favorites' && (
                      <div className="flex items-center gap-2 ml-auto">
                        {favorites.length > 0 && (
                          <button
                            onClick={handleExportFavorites}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border border-indigo-100 dark:border-indigo-900/30 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
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
                        : t("search.no_results_hint")}
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

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const relatedTools = useMemo(() => {
    if (!currentTool) return [];
    return tools
      .filter(t => t.category === currentTool.category && t.id !== currentTool.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
  }, [currentTool]);

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

      {relatedTools.length > 0 && (
        <div className="mt-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
              {t("tool.related")}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFavorite={favoriteSet.has(tool.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

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
