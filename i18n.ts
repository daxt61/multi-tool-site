import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      "app.title": "Toolbox - Simple tools for complex tasks",
      "app.description": "A collection of free, private, and open-source utilities to boost your daily productivity.",
      "nav.about": "About",
      "nav.contact": "Contact",
      "nav.privacy": "Privacy",
      "nav.home": "Back to dashboard",
      "hero.title": "Simple tools for <1>complex tasks.</1>",
      "hero.subtitle": "A collection of free, private, and open-source utilities to boost your daily productivity.",
      "search.placeholder": "Search for a tool...",
      "search.luck": "I'm feeling lucky",
      "search.no_results": "No tool found",
      "search.clear": "Clear everything",
      "category.all": "All",
      "category.favorites": "Favorites",
      "category.business": "Business",
      "category.budget": "Finance",
      "category.health": "Health",
      "category.calculators": "Calculators",
      "category.converters": "Conversion",
      "category.text": "Text",
      "category.dev": "Dev",
      "category.other": "Other",
      "favorites.empty": "No favorites yet",
      "favorites.hint": "Click the star on a tool to add it to your favorites list.",
      "favorites.export": "Export",
      "favorites.import": "Import",
      "recent.title": "Recent Tools",
      "footer.copy": "Toolbox",
      "tool.open": "Open",
      "tool.copied": "Link copied",
      "tool.copy": "Copy link",
      "tool.share_config": "Share config",
      "tool.config_copied": "Config copied",
      "tool.favorite": "Favorite",
      "tool.add_favorite": "Add to favorites",
      "tool.not_found": "Tool not found",
      "tool.remove_favorite": "Remove from favorites",
    }
  },
  fr: {
    translation: {
      "app.title": "Boîte à Outils - Outils simples pour tâches complexes",
      "app.description": "Une collection d'utilitaires gratuits, privés et open-source pour booster votre productivité au quotidien.",
      "nav.about": "À propos",
      "nav.contact": "Contact",
      "nav.privacy": "Confidentialité",
      "nav.home": "Retour au tableau de bord",
      "hero.title": "Des outils simples pour des <1>tâches complexes.</1>",
      "hero.subtitle": "Une collection d'utilitaires gratuits, privés et open-source pour booster votre productivité au quotidien.",
      "search.placeholder": "Rechercher un outil...",
      "search.luck": "J'ai de la chance",
      "search.no_results": "Aucun outil trouvé",
      "search.clear": "Effacer tout",
      "category.all": "Tous",
      "category.favorites": "Favoris",
      "category.business": "Business",
      "category.budget": "Finance",
      "category.health": "Santé",
      "category.calculators": "Calculatrices",
      "category.converters": "Conversion",
      "category.text": "Texte",
      "category.dev": "Dev",
      "category.other": "Autres",
      "favorites.empty": "Aucun favori pour le moment",
      "favorites.hint": "Cliquez sur l'étoile d'un outil pour l'ajouter à votre liste de favoris.",
      "favorites.export": "Exporter",
      "favorites.import": "Importer",
      "recent.title": "Outils Récents",
      "footer.copy": "Boîte à Outils",
      "tool.open": "Ouvrir",
      "tool.copied": "Lien copié",
      "tool.copy": "Copier lien",
      "tool.share_config": "Partager config",
      "tool.config_copied": "Config copiée",
      "tool.favorite": "Favori",
      "tool.add_favorite": "Mettre en favori",
      "tool.not_found": "Outil non trouvé",
      "tool.remove_favorite": "Retirer des favoris",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['path', 'cookie', 'htmlTag', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
    }
  });

export default i18n;
