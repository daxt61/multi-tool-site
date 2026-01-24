import { Mail, MessageSquare, Send, MapPin, Phone, Github, Twitter } from "lucide-react";
import { useState } from "react";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Info Side */}
        <div className="space-y-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
              Une question ? <br />
              <span className="text-indigo-600 dark:text-indigo-400">Contactez-nous.</span>
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed">
              Nous sommes à votre écoute pour toute suggestion d'outil, signalement de bug ou demande de partenariat.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6 p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-indigo-500 transition-colors">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">contact@boiteaoutils.com</p>
              </div>
            </div>

            <div className="flex items-center gap-6 p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-indigo-500 transition-colors">
              <div className="p-4 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Support</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">Réponse sous 24h</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
             <button className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                <Github className="w-6 h-6" />
             </button>
             <button className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl hover:bg-sky-500 hover:text-white transition-all shadow-sm">
                <Twitter className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Form Side */}
        <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-2xl shadow-indigo-500/5 relative overflow-hidden">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                <Send className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">Message envoyé !</h3>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Nom complet</label>
                  <input
                    required
                    type="text"
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all dark:text-white"
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Email</label>
                  <input
                    required
                    type="email"
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all dark:text-white"
                    placeholder="jean@exemple.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Sujet</label>
                <select className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all dark:text-white appearance-none">
                  <option>Suggestion d'outil</option>
                  <option>Signalement de bug</option>
                  <option>Partenariat</option>
                  <option>Autre</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Message</label>
                <textarea
                  required
                  rows={5}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all dark:text-white resize-none"
                  placeholder="Comment pouvons-nous vous aider ?"
                />
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-3"
              >
                Envoyer le message
                <Send className="w-6 h-6" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
