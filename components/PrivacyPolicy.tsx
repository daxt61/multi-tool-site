import {
  Shield,
  Database,
  Eye,
  Lock,
  Cookie,
  Users,
  Mail,
  FileText,
  AlertCircle,
} from "lucide-react";

export function PrivacyPolicy() {
  const lastUpdated = "20 janvier 2025";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Politique de Confidentialité
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Dernière mise à jour : {lastUpdated}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                Chez Boîte à Outils, nous accordons une importance primordiale à
                la protection de votre vie privée. Cette politique de
                confidentialité explique comment nous collectons, utilisons et
                protégeons vos informations.
              </p>
            </div>
          </div>
        </div>

        {/* Collecte des données */}
        <section className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-lg shadow-md">
              <Database className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                1. Collecte des Données
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Nous nous engageons à collecter le minimum de données nécessaires
                au fonctionnement de nos services :
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Données techniques :</strong> Adresse IP, type de
                    navigateur, système d'exploitation (à des fins de
                    statistiques anonymes)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Données de contact :</strong> Uniquement si vous nous
                    contactez via le formulaire (nom, email, message)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Données d'utilisation :</strong> Statistiques
                    anonymisées sur l'utilisation des outils
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Utilisation des données */}
        <section className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg shadow-md">
              <Eye className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                2. Utilisation des Données
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Les données collectées sont utilisées exclusivement pour :
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
                  <span>Améliorer la qualité et la performance de nos outils</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
                  <span>Répondre à vos demandes de contact</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
                  <span>Analyser l'utilisation du site de manière anonyme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
                  <span>Assurer la sécurité et la stabilité du service</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Stockage local */}
        <section className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-lg shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                3. Stockage et Sécurité
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Nous mettons en place des mesures de sécurité appropriées :
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Traitement local :</strong> La majorité de nos outils
                    fonctionnent directement dans votre navigateur. Vos données
                    ne quittent pas votre appareil.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Connexion sécurisée :</strong> Notre site utilise le
                    protocole HTTPS pour chiffrer toutes les communications.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Pas de stockage permanent :</strong> Nous ne
                    conservons pas vos données d'utilisation des outils.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Cookies */}
        <section className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-lg shadow-md">
              <Cookie className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                4. Cookies et Technologies Similaires
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Notre site peut utiliser des cookies pour :
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Cookies essentiels :</strong> Nécessaires au bon
                    fonctionnement du site
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Cookies analytiques :</strong> Pour comprendre
                    l'utilisation du site (anonymisés)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Cookies publicitaires :</strong> Pour afficher des
                    publicités pertinentes
                  </span>
                </li>
              </ul>
              <p className="text-gray-600 mt-4 text-sm">
                Vous pouvez configurer votre navigateur pour refuser les cookies,
                bien que cela puisse affecter certaines fonctionnalités.
              </p>
            </div>
          </div>
        </section>

        {/* Partage des données */}
        <section className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-lg shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                5. Partage des Données
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Nous ne vendons jamais vos données personnelles. Nous pouvons
                partager des informations uniquement dans les cas suivants :
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                  <span>
                    Avec votre consentement explicite
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                  <span>
                    Pour se conformer à des obligations légales
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                  <span>
                    Avec des prestataires de services (hébergement, analytics)
                    sous contrat de confidentialité
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Vos droits */}
        <section className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                6. Vos Droits (RGPD)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Conformément au Règlement Général sur la Protection des Données
                (RGPD), vous disposez des droits suivants :
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Droit d'accès :</strong> Obtenir une copie de vos
                    données personnelles
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Droit de rectification :</strong> Corriger des données
                    inexactes
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Droit à l'effacement :</strong> Demander la
                    suppression de vos données
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Droit à la portabilité :</strong> Recevoir vos données
                    dans un format structuré
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></span>
                  <span>
                    <strong>Droit d'opposition :</strong> Vous opposer au
                    traitement de vos données
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-lg shadow-md">
              <Mail className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                7. Nous Contacter
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Pour toute question concernant cette politique de confidentialité
                ou pour exercer vos droits, vous pouvez nous contacter :
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-200">
                  <strong>Email :</strong> contact@boiteaoutils.fr
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Nous nous engageons à répondre à votre demande dans un délai de
                  30 jours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Modifications */}
        <section className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-700 text-white rounded-lg shadow-md">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                8. Modifications de cette Politique
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Nous nous réservons le droit de modifier cette politique de
                confidentialité à tout moment. Les modifications seront publiées
                sur cette page avec une date de mise à jour. Nous vous encourageons
                à consulter régulièrement cette page pour rester informé de nos
                pratiques en matière de protection des données.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
