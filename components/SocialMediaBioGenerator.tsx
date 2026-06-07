import { useState, useCallback, useEffect } from 'react';
import { Copy, Check, RefreshCw, UserCircle, Twitter, Instagram, Linkedin, Sparkles, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

type Vibe = 'professional' | 'creative' | 'minimalist' | 'funny';
type Platform = 'twitter' | 'instagram' | 'linkedin';

const LIMITS: Record<Platform, number> = {
  twitter: 160,
  instagram: 150,
  linkedin: 300, // LinkedIn headlines are shorter, summary is longer, we'll target a "headline" feel
};

const DATA = {
  roles: [
    'Software Engineer', 'Product Designer', 'Digital Marketer', 'Content Creator',
    'Full Stack Developer', 'UX/UI Enthusiast', 'Data Scientist', 'Entrepreneur',
    'Tech Optimist', 'Creative Soul', 'Problem Solver', 'Storyteller'
  ],
  adjectives: [
    'Passionate', 'Dedicated', 'Coffee-driven', 'Innovative', 'Pixel-perfect',
    'Result-oriented', 'Curious', 'Agile', 'Strategic', 'Detail-oriented'
  ],
  interests: [
    'Building things for the web', 'Exploring AI', 'Open source contributor',
    'Mountain hiking & photography', 'Bridging code and design', 'Helping others grow',
    'Lifelong learner', 'Minimalist at heart', 'SaaS builder'
  ],
  ctas: [
    'Let\'s connect!', 'Building in public 🚀', 'Check my latest project 👇',
    'DM for collaborations', 'Coffee is on me ☕', 'Always learning.'
  ],
  funny_endings: [
    'Living one bug at a time 🐛', 'Professional overthinker.', 'I make things move on screens.',
    'Probably drinking too much coffee.', 'Loading my personality...', 'Error 404: Bio not found.'
  ]
};

export function SocialMediaBioGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [vibe, setVibe] = useState<Vibe>(initialData?.vibe || 'professional');
  const [platform, setPlatform] = useState<Platform>(initialData?.platform || 'twitter');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ vibe, platform, bio });
  }, [vibe, platform, bio]);

  const generateBio = useCallback(() => {
    let result = '';
    const pick = (arr: string[]) => arr[getSecureRandomInt(arr.length)];

    if (vibe === 'professional') {
      result = `${pick(DATA.adjectives)} ${pick(DATA.roles)} | ${pick(DATA.interests)}. ${pick(DATA.ctas)}`;
    } else if (vibe === 'creative') {
      result = `✨ ${pick(DATA.roles)} creating ${pick(DATA.interests).toLowerCase()}. ${pick(DATA.ctas)} 🚀`;
    } else if (vibe === 'minimalist') {
      result = `${pick(DATA.roles)}. ${pick(DATA.adjectives)}.`;
    } else if (vibe === 'funny') {
      result = `${pick(DATA.roles)} by day, ${pick(DATA.funny_endings).toLowerCase()}`;
    }

    // Trim to platform limit
    if (result.length > LIMITS[platform]) {
      result = result.substring(0, LIMITS[platform] - 3) + '...';
    }

    setBio(result);
  }, [vibe, platform]);

  const handleCopy = () => {
    if (!bio) return;
    navigator.clipboard.writeText(bio);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Vibe Selection */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              {t('bio.vibe_label', 'Vibe / Style')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['professional', 'creative', 'minimalist', 'funny'] as Vibe[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVibe(v)}
                  className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border ${
                    vibe === v
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {t(`bio.vibe.${v}`, v.charAt(0).toUpperCase() + v.slice(1))}
                </button>
              ))}
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              {t('bio.platform_label', 'Platform')}
            </label>
            <div className="flex gap-2">
              {(['twitter', 'instagram', 'linkedin'] as Platform[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${
                    platform === p
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {p === 'twitter' && <Twitter className="w-4 h-4" />}
                  {p === 'instagram' && <Instagram className="w-4 h-4" />}
                  {p === 'linkedin' && <Linkedin className="w-4 h-4" />}
                  <span className="hidden sm:inline">{t(`bio.platform.${p}`, p.charAt(0).toUpperCase() + p.slice(1))}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={generateBio}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none group"
        >
          <RefreshCw className="w-5 h-5 transition-transform group-hover:rotate-180" />
          {t('bio.generate', 'Generate New Bio')}
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> {t('bio.result_title', 'Generated Bio')}
          </h3>
          <div className="flex gap-2">
             <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${bio.length > LIMITS[platform] ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {bio.length} / {LIMITS[platform]}
             </div>
             <button
               onClick={handleCopy}
               disabled={!bio}
               className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1.5 border ${
                 copied
                   ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                   : 'text-indigo-600 dark:text-indigo-400 border-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
               } disabled:opacity-50 disabled:cursor-not-allowed`}
             >
               {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
               {copied ? t('common.copied') : t('common.copy')}
             </button>
          </div>
        </div>

        <div className="relative group">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full h-40 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl leading-relaxed dark:text-slate-300 resize-none"
            placeholder={t('bio.placeholder', 'Your bio will appear here...')}
          />
        </div>
      </div>

      {/* Platform Previews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-[#1DA1F2]">
               <Twitter className="w-4 h-4 fill-current" />
               <span className="text-xs font-black uppercase tracking-widest">Twitter Preview</span>
            </div>
            <div className="flex gap-3">
               <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
               <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-1">
                     <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                     <div className="w-12 h-2 bg-slate-100 dark:bg-slate-800/50 rounded" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-words line-clamp-4">
                     {bio || '...'}
                  </p>
               </div>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-[#E1306C]">
               <Instagram className="w-4 h-4" />
               <span className="text-xs font-black uppercase tracking-widest">Instagram Preview</span>
            </div>
            <div className="space-y-3">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-[#E1306C] p-0.5">
                     <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="flex-1 space-y-2">
                     <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                     <div className="flex gap-2">
                        <div className="w-10 h-2 bg-slate-100 dark:bg-slate-800/50 rounded" />
                        <div className="w-10 h-2 bg-slate-100 dark:bg-slate-800/50 rounded" />
                     </div>
                  </div>
               </div>
               <p className="text-sm text-slate-700 dark:text-slate-300 break-words whitespace-pre-wrap">
                  <span className="font-bold block mb-1">User Name</span>
                  {bio || '...'}
               </p>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-[#0077B5]">
               <Linkedin className="w-4 h-4 fill-current" />
               <span className="text-xs font-black uppercase tracking-widest">LinkedIn Preview</span>
            </div>
            <div className="space-y-3">
               <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-sm" />
               <div className="space-y-1">
                  <div className="w-28 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-tight">
                     {bio || 'Professional Headline'}
                  </p>
                  <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800/50 rounded mt-1" />
               </div>
            </div>
         </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('bio.about_title', 'About Bio Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bio.about_text', 'First impressions matter. This tool helps you create attention-grabbing bios for your social profiles. Choose a vibe that matches your personality or brand, and generate a base to customize. Remember to keep it authentic!')}
          </p>
        </div>
      </div>
    </div>
  );
}
