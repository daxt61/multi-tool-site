import { useState, useMemo, useEffect } from 'react';
import { Hash, Copy, Check, RotateCcw, Info, Sliders, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// First 10,000 digits of Pi
const PI_DIGITS = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679" +
"8214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196" +
"4428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273" +
"7245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094" +
"3305727036575959195309218611738193261179310511854807446237996274956735188575272489122793818301194912" +
"9833673362440656643086021394946395224737190702179860943702770539217176293176752384674818467669405132" +
"0005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235" +
"4201995611212902196086403441815981362977477130996051870721134999999837297804995105973173281609631859" +
"5024459455346908302642522308253344685035261931188171010003137838752886587533208381420617177669147303" +
"5982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989" +
"3809525720106548586327886593615338182796823030195203530185296899577362259941389124972177528347913151" +
"5574857242454150695950829533116861727855889075098381754637464939319255060400927701671139009848824012" +
"8583616035637076601047101819429555961989467678374494482553797747268471040475346462080466842590694912" +
"9331367702898915210475216205696602405803815019351125338243003558764024749647326391419927260426992279" +
"6782354781636009341721641219924586315030286182974555706749838505494588586926995690927210797509302955" +
"3211653449872027559602364806654991198818347977535663698074265425278625518184175746728909777727938000" +
"8164706001614524919217321721477235014144197356854816136115735255213347574184946843852332390739414333" +
"4547762416862518983569485562099219222184272550254256887671790494601653466804988627232791786085784383" +
"8279679766814541009538837863609506800642251252051173929848960841284886269456042419652850222106611863" +
"0674427862203919494504712371378696095636437191728746776465757396241389086583264599581339047802759010";

export function PiGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState(initialData?.digits ?? 100);
  const [grouping, setGroup] = useState(initialData?.grouping ?? 10);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ digits, grouping });
  }, [digits, grouping, onStateChange]);

  const piResult = useMemo(() => {
    let base = PI_DIGITS.slice(0, digits + 2); // +2 for "3."
    if (digits === 0) return "3";
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
    navigator.clipboard.writeText(piResult.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([piResult.replace(/\s/g, '')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pi-${digits}-digits.txt`;
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
                  <label htmlFor="pi-digits" className="text-xs font-bold text-slate-500 uppercase">{t('pigenerator.digits', 'Digits')}</label>
                  <span className="text-xs font-black text-indigo-500 font-mono">{digits}</span>
                </div>
                <input
                  id="pi-digits"
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
                  <label htmlFor="pi-grouping" className="text-xs font-bold text-slate-500 uppercase">{t('pigenerator.grouping', 'Grouping')}</label>
                  <span className="text-xs font-black text-indigo-500 font-mono">{grouping}</span>
                </div>
                <input
                  id="pi-grouping"
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
            {piResult}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('pigenerator.about_title', 'About Pi Digits')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('pigenerator.about_text', 'Pi (π) is the ratio of a circle\'s circumference to its diameter. It is an irrational number, meaning its decimal representation never ends and never settles into a permanent repeating pattern. This tool allows you to view and format the first 1,000 digits of Pi.')}
          </p>
        </div>
      </div>
    </div>
  );
}
