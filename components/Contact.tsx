import { Mail, MessageSquare, Send, Github, Twitter, Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function Contact() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight">{t("contact.title")}</h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">{t("contact.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Info */}
        <div className="space-y-8">
          <div className="grid gap-4">
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center gap-6">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Mail className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{t("contact.email")}</p>
                <p className="font-bold">contact@boiteaoutils.com</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center gap-6">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                <MessageSquare className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{t("contact.support")}</p>
                <p className="font-bold">{t("contact.support_desc")}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-900 hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              aria-label={t("contact.github")}
              title={t("contact.github")}
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-sky-500 hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              aria-label={t("contact.twitter")}
              title={t("contact.twitter")}
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/20 dark:shadow-none">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-6">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-in zoom-in">
                <Check className="w-10 h-10" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-black">{t("contact.success_title")}</h3>
              <p className="text-slate-500 font-medium">{t("contact.success_desc")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="contact-email" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 block">
                  {t("contact.email_label")}
                </label>
                <input
                  id="contact-email"
                  required
                  type="email"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  placeholder={t("contact.email_placeholder")}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="contact-message" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 block">
                  {t("contact.message_label")}
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 transition-all resize-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  placeholder={t("contact.message_placeholder")}
                />
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black text-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                {t("contact.send_btn")} <Send className="w-5 h-5" aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
