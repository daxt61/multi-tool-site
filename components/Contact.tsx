import { useState } from "react";
import { Mail, Send, User, MessageSquare, CheckCircle } from "lucide-react";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation d'envoi - en production, intégrer avec un service d'email
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 border border-green-100 dark:border-green-900/50">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-500 text-white rounded-full shadow-lg">
              <CheckCircle className="w-12 h-12" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
            Message Envoyé !
          </h3>
          <p className="text-green-700 dark:text-green-400 mb-6">
            Merci de nous avoir contactés. Nous reviendrons vers vous dans les
            plus brefs délais.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({ name: "", email: "", subject: "", message: "" });
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Envoyer un autre message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Informations de contact */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-xl p-6 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Nous Contacter
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Vous avez une question, une suggestion ou vous souhaitez nous
              signaler un problème ? N'hésitez pas à nous écrire.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                    contact@boiteaoutils.fr
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 transition-colors">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Délai de réponse
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Nous nous efforçons de répondre à tous les messages dans un délai
              de 24 à 48 heures ouvrées.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 transition-colors shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Envoyez-nous un message
            </h3>

            <div className="space-y-5">
              {/* Nom */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nom complet
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Adresse email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              {/* Sujet */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Sujet
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
                >
                  <option value="">Sélectionnez un sujet</option>
                  <option value="question">Question générale</option>
                  <option value="suggestion">Suggestion d'amélioration</option>
                  <option value="bug">Signaler un problème</option>
                  <option value="partnership">Partenariat</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Message
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none outline-none"
                    placeholder="Décrivez votre demande en détail..."
                  />
                </div>
              </div>

              {/* Bouton d'envoi */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
              >
                <Send className="w-5 h-5" />
                Envoyer le message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
