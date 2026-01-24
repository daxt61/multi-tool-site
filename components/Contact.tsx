import { Mail, MessageSquare, Send, Github, Twitter, Check } from "lucide-react";
import { useState } from "react";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Contactez-nous.</h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">Une suggestion ? Un bug ? Nous sommes à votre écoute.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Info */}
        <div className="space-y-8">
          <div className="grid gap-4">
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center gap-6">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Email</p>
                <p className="font-bold">contact@boiteaoutils.com</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center gap-6">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Support</p>
                <p className="font-bold">Réponse sous 24h</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-900 hover:text-white transition-all">
              <Github className="w-5 h-5" />
            </button>
            <button className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-sky-500 hover:text-white transition-all">
              <Twitter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/20 dark:shadow-none">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-6">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-in zoom-in">
                <Check className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black">Message envoyé !</h3>
              <p className="text-slate-500 font-medium">Nous reviendrons vers vous très prochainement.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Email</label>
                <input
                  required
                  type="email"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 transition-all"
                  placeholder="jean@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Message</label>
                <textarea
                  required
                  rows={4}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 transition-all resize-none"
                  placeholder="Comment pouvons-nous vous aider ?"
                />
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black text-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg"
              >
                Envoyer <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
