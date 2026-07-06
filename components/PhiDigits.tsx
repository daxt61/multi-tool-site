import { useState, useMemo, useEffect } from 'react';
import { Hash, Copy, Check, Download, Sliders, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// First 2,000 digits of the Golden Ratio (Phi)
const PHI_DIGITS = "1.61803398874989484820458683436563811772030917980576286213544862270526046281890244970720720418939113748475408807538689175212663386222353693179318006076672635443338908659593958290563832266131992829026788067520876689250171169620703222104321626954862629631361443814975870122034080588795445474924618569536486444924104432077134494704956584678850987433944221254487706647809158846074998871240076521705751797883416625624940758906970400028121042762177111777805315317141011704666599146697987317613560067087480710131795236894275219484353056783002287856997829778347845878228911097625003026961561700250464338243776486102838312683303724292675263116533924731671112115881863851331620384005222165791286675294654906811317159934323597349498509040947621322298101726107059611645629909816290555208524790352406020172799747175342777592778625619432082750513121815628551222480939471234145170223735805772786160086883829523045926478780178899219902707769038953219681986151437803149974110692608867429622675756052317277752035361393621076738937645560606059216589466759551900400555908950229530942312482355212212415444006470340565734797663972394949946584578873039623090375033993856210242369025138680414577995698122445747178034173126453220416397232134044449487302315417676893752103068737880344170093954409627955898678723209512426893557309704509595684401755519881921802064052905518934947592600734852282101088194644544222318891319294689622002301443770269923007803085261180754519288770502109684249362713592518760777884665836150238913493333122310533923213624319263728910670503399282265263556209029798642472759772565508615487543574826471814145127000602389016207773224499435308899909501680328112194320481964387675863314798571911397815397807476150772211750826945863932045652098969855567814106968372884058746103378105444390943683583581381131168993855576975484149144534150912954070050194775486163075422641729394680367319805861833918328599130396072014455950449779212076124785645916160837059498786006970189409886400764436170933417270919143365013715";

export function PhiDigits({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState(initialData?.digits ?? 100);
  const [grouping, setGroup] = useState(initialData?.grouping ?? 10);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ digits, grouping });
  }, [digits, grouping, onStateChange]);

  const phiResult = useMemo(() => {
    let base = PHI_DIGITS.slice(0, digits + 2); // +2 for "1."
    if (digits === 0) return "1";
    if (grouping <= 0) return base;

    const parts = base.split('.');
    const integerPart = parts[0];
    const fractionalPart = parts[1] || '';

    let formattedFraction = '';
    for (let i = 0; i < fractionalPart.length; i++) {
      if (i > 0 && i % grouping === 0) {
        formattedFraction += ' ';
      }
      formattedFraction += fractionalPart[i];
    }

    return formattedFraction ? `${integerPart}.${formattedFraction}` : integerPart;
  }, [digits, grouping]);

  const handleCopy = () => {
    navigator.clipboard.writeText(phiResult.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([phiResult.replace(/\s/g, '')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phi-${digits}-digits.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="phi-digits" className="text-xs font-bold text-slate-500 uppercase">{t('pigenerator.digits', 'Digits')}</label>
                  <span className="text-xs font-black text-indigo-500 font-mono">{digits}</span>
                </div>
                <input
                  id="phi-digits"
                  type="range"
                  min="0"
                  max="2000"
                  step="1"
                  value={digits}
                  onChange={(e) => setDigits(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="phi-grouping" className="text-xs font-bold text-slate-500 uppercase">{t('pigenerator.grouping', 'Grouping')}</label>
                  <span className="text-xs font-black text-indigo-500 font-mono">{grouping}</span>
                </div>
                <input
                  id="phi-grouping"
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={grouping}
                  onChange={(e) => setGroup(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Result Area */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Hash className="w-4 h-4 text-indigo-500" /> {t('common.result')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>

          <div className="w-full min-h-[300px] p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] text-xl font-mono leading-loose dark:text-slate-200 break-all overflow-y-auto">
            {phiResult}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('phidigits.about_title', 'About Golden Ratio')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('phidigits.about_text', 'The Golden Ratio (φ) is a mathematical constant approximately equal to 1.61803. Two quantities are in the golden ratio if their ratio is the same as the ratio of their sum to the larger of the two quantities. This tool allows you to view and format the first 2,000 digits of phi.')}
          </p>
        </div>
      </div>
    </div>
  );
}
