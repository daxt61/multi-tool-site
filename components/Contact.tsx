import { Mail, Send, Github, Twitter, Check, Shield, User, Clock, X, Loader2 } from "lucide-react";
import { useState } from "react";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const maxAttempts = 3;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts >= maxAttempts) {
      setError("Trop de tentatives. Accès bloqué.");
      return;
    }

    setIsVerifying(true);
    setError("");
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: adminCode })
      });

      if (res.ok) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        fetchMessages(adminCode);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(`Code incorrect. (${newAttempts}/${maxAttempts})`);
      }
    } catch (e) {
      setError("Erreur de connexion");
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchMessages = async (code: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contact?code=${code}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email');
    const message = formData.get('message');

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message })
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert("Erreur lors de l'envoi");
      }
    } catch (e) {
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-16 relative">
      {/* Admin Login Toggle */}
      <div className="absolute top-0 right-0 z-10">
        {!isAdmin && (
          <div className="relative">
            {showAdminLogin ? (
              <form onSubmit={handleAdminLogin} className="flex gap-2 animate-in slide-in-from-right-4 items-center bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl">
                <input
                  autoFocus
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Code admin"
                  disabled={attempts >= maxAttempts || isVerifying}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-indigo-500 w-32 transition-all"
                />
                <button
                  type="submit"
                  disabled={attempts >= maxAttempts || isVerifying}
                  className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : "Vérifier"}
                </button>
                <button type="button" onClick={() => {setShowAdminLogin(false); setError("");}} className="p-1.5 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                title="Admin Login"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            {error && <p className="absolute top-full right-0 mt-2 text-[10px] font-bold text-rose-500 whitespace-nowrap bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded border border-rose-100 dark:border-rose-900/20">{error}</p>}
          </div>
        )}
      </div>

      <div className="text-center space-y-4 pt-8">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight">
          {isAdmin ? "Gestion des messages" : "Contactez-nous."}
        </h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
          {isAdmin ? `Interface d'administration confidentielle.` : "Une suggestion ? Un bug ? Nous sommes à votre écoute."}
        </p>
      </div>

      {isAdmin ? (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="flex justify-between items-center px-2">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Derniers messages ({messages.length})</h3>
             <button onClick={() => fetchMessages(adminCode)} className="text-xs font-bold text-indigo-500 hover:underline">Rafraîchir</button>
           </div>

           {loading ? (
             <div className="flex justify-center py-20">
               <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
             </div>
           ) : messages.length === 0 ? (
             <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 font-bold">Aucun message reçu pour le moment.</p>
             </div>
           ) : (
             <div className="grid gap-4">
               {messages.map((msg: any) => (
                 <div key={msg.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
                   <div className="flex justify-between items-start">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600">
                         <User className="w-4 h-4" />
                       </div>
                       <div>
                         <p className="font-bold text-sm">{msg.email}</p>
                         <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                           <Clock className="w-3 h-3" /> {msg.date}
                         </p>
                       </div>
                     </div>
                   </div>
                   <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.message}</p>
                 </div>
               ))}
             </div>
           )}

           <div className="flex justify-center pt-8">
             <button onClick={() => setIsAdmin(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2">
               <X className="w-4 h-4" /> Déconnexion
             </button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Social / Info */}
          <div className="space-y-8 flex flex-col justify-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-black">Suivez-nous</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Restez informé des dernières mises à jour et nouveaux outils en nous suivant sur les réseaux sociaux.
              </p>
              <div className="flex gap-4">
                <button className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-900 hover:text-white transition-all group">
                  <Github className="w-6 h-6 transition-transform group-hover:scale-110" />
                </button>
                <button className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-sky-500 hover:text-white transition-all group">
                  <Twitter className="w-6 h-6 transition-transform group-hover:scale-110" />
                </button>
              </div>
            </div>

            <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
               <Mail className="w-8 h-8 mb-4 opacity-50" />
               <h4 className="text-xl font-bold mb-2">Besoin d'aide ?</h4>
               <p className="text-indigo-100 text-sm font-medium">Utilisez le formulaire pour nous faire part de vos besoins, suggestions ou bugs rencontrés.</p>
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
                <button onClick={() => setSubmitted(false)} className="text-sm font-bold text-indigo-500 hover:underline">Envoyer un autre message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Email</label>
                  <input
                    required
                    name="email"
                    type="email"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 transition-all dark:text-white"
                    placeholder="jean@exemple.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Message</label>
                  <textarea
                    required
                    name="message"
                    rows={4}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 transition-all resize-none dark:text-white"
                    placeholder="Comment pouvons-nous vous aider ?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black text-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Envoyer <Send className="w-5 h-5" /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
