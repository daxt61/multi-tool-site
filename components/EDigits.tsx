import { useState, useMemo, useEffect } from 'react';
import { Hash, Copy, Check, Download, Sliders, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// First 2,000 digits of e (Euler's number)
const E_DIGITS = "2.71828182845904523536028747135266249775724709369995957496696762772407663035354759457138217852516642742746639193200305992181741359662904357290033429526059563073813232862794349076323382988075319525101901157383418793070215408914993488416750924476146066808226480016847741185374234544243710753907774499206955170276183860626133138458300075204493382656029760673711320070932870912744374704723069697720931014169283681902551510865746377211125238978442505695369677078544996996794686445490598793163688923009879312773617821542499922957635148220826989519366803318252886939849646510582093923982948879332036250944311730123819706841614039701983767932068328237646480429531180232878250981945581530175671736133206981125099618188159304169035159888851934580727386673858942287922849989208680582574927961048419844436346324496848756023362482704197862320900216099023530436994184914631409343173814364054625315209618369088870701676839642437814059271456354906130310720851038375051011574770417189861068739696552126715468895703503540212340784981933432106817012100562788023519303322474501585390473041995777709350366041699732972508868769664035557071622684471625607988265178713419512466520103059212366771943252786753985589448969709640975459185695638023637016211204774272283648961342251644507818244235294863637214174023889344124796357437026375529444833799801612549227850925778256209262264832627793338656648162772516401910590049164499828931505660472580277863186415519565324425869829469593080191529872117255634754639644791014590409058629849679128740687050489585867174798546677575732056812884592054133405392200011378630094556068816674001698420558040336379537645203040243225661352783695117788386387443966253224985065499588623428189970773327617178392803494650143455889707194258639877275471096295374152111513683506275260232648472870392076431005958411661205452970302364725492966693811513732275364509888903136020572481765851180630364428123149655070475102544650117272115551948668508003685322818315219600373562527944951582841882947876108526398139";

export function EDigits({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState(initialData?.digits ?? 100);
  const [grouping, setGroup] = useState(initialData?.grouping ?? 10);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ digits, grouping });
  }, [digits, grouping, onStateChange]);

  const eResult = useMemo(() => {
    let base = E_DIGITS.slice(0, digits + 2); // +2 for "2."
    if (digits === 0) return "2";
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
    navigator.clipboard.writeText(eResult.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([eResult.replace(/\s/g, '')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `e-${digits}-digits.txt`;
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
                  <label htmlFor="e-digits" className="text-xs font-bold text-slate-500 uppercase">{t('pigenerator.digits', 'Digits')}</label>
                  <span className="text-xs font-black text-indigo-500 font-mono">{digits}</span>
                </div>
                <input
                  id="e-digits"
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
                  <label htmlFor="e-grouping" className="text-xs font-bold text-slate-500 uppercase">{t('pigenerator.grouping', 'Grouping')}</label>
                  <span className="text-xs font-black text-indigo-500 font-mono">{grouping}</span>
                </div>
                <input
                  id="e-grouping"
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
            {eResult}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('edigits.about_title', 'About Euler\'s Number')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('edigits.about_text', 'Euler\'s number (e) is a mathematical constant approximately equal to 2.71828 which is the base of the natural logarithm. It is the limit of (1 + 1/n)ⁿ as n approaches infinity. This tool allows you to view and format the first 2,000 digits of e.')}
          </p>
        </div>
      </div>
    </div>
  );
}
