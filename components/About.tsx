import { Info, Target, Wrench, Users } from "lucide-react";

export function About() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Introduction */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-md">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Qui sommes-nous ?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Boîte à Outils est une plateforme en ligne gratuite qui regroupe
                tous les outils essentiels dont vous avez besoin au quotidien.
                Notre mission est de vous fournir des outils simples, rapides et
                efficaces, accessibles directement depuis votre navigateur.
              </p>
            </div>
          </div>
        </section>

        {/* Notre Mission */}
        <section className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg shadow-md">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Notre Mission
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Nous croyons que les outils numériques devraient être accessibles
                à tous, sans inscription ni téléchargement. C'est pourquoi nous
                avons créé cette boîte à outils complète qui vous permet de :
              </p>
              <ul className="mt-4 space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Effectuer des calculs et conversions rapidement
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Générer des mots de passe sécurisés
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Encoder et décoder vos données
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Formater et manipuler du texte
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Nos Outils */}
        <section className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-lg shadow-md">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nos Outils
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Notre collection comprend plus de 20 outils soigneusement conçus
                pour répondre à vos besoins quotidiens :
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">Calculatrice</div>
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">Convertisseur d'unités</div>
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">Générateur de mots de passe</div>
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">Compteur de mots</div>
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">Convertisseur de couleurs</div>
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">Minuteur & Chronomètre</div>
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">Générateur QR Code</div>
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">Et bien plus encore...</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pour Vous */}
        <section className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-lg shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Conçu Pour Vous
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Que vous soyez développeur, étudiant, professionnel ou simplement
                à la recherche d'un outil pratique, notre plateforme est conçue
                pour être intuitive et facile à utiliser. Tous nos outils
                fonctionnent directement dans votre navigateur, sans nécessiter
                d'installation ni de création de compte.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                Merci de faire confiance à Boîte à Outils !
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
