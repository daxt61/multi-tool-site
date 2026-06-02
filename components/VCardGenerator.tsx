import { useState, useMemo, useEffect, useCallback } from 'react';
import { Download, UserRound, Building, Phone, Mail, Globe, MapPin, QrCode, Info, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function VCardGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    organization: initialData?.organization || '',
    jobTitle: initialData?.jobTitle || '',
    phoneMobile: initialData?.phoneMobile || '',
    phoneWork: initialData?.phoneWork || '',
    emailPersonal: initialData?.emailPersonal || '',
    emailWork: initialData?.emailWork || '',
    website: initialData?.website || '',
    street: initialData?.street || '',
    city: initialData?.city || '',
    postcode: initialData?.postcode || '',
    country: initialData?.country || '',
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.(formData);
  }, [formData, onStateChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const vCardString = useMemo(() => {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${formData.lastName};${formData.firstName};;;`,
      `FN:${formData.firstName} ${formData.lastName}`.trim(),
    ];

    if (formData.organization) lines.push(`ORG:${formData.organization}`);
    if (formData.jobTitle) lines.push(`TITLE:${formData.jobTitle}`);
    if (formData.phoneMobile) lines.push(`TEL;TYPE=CELL,VOICE:${formData.phoneMobile}`);
    if (formData.phoneWork) lines.push(`TEL;TYPE=WORK,VOICE:${formData.phoneWork}`);
    if (formData.emailPersonal) lines.push(`EMAIL;TYPE=HOME,INTERNET:${formData.emailPersonal}`);
    if (formData.emailWork) lines.push(`EMAIL;TYPE=WORK,INTERNET:${formData.emailWork}`);
    if (formData.website) lines.push(`URL:${formData.website}`);

    if (formData.street || formData.city || formData.postcode || formData.country) {
      lines.push(`ADR;TYPE=WORK:;;${formData.street};${formData.city};;${formData.postcode};${formData.country}`);
    }

    lines.push('END:VCARD');
    return lines.join('\n');
  }, [formData]);

  const qrCodeUrl = useMemo(() => {
    const hasData = Object.values(formData).some(val => val.trim() !== '');
    if (!hasData) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(vCardString)}`;
  }, [vCardString, formData]);

  const downloadVCF = useCallback(() => {
    const blob = new Blob([vCardString], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `${formData.firstName || 'contact'}_${formData.lastName || 'vcard'}.vcf`.toLowerCase();
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [vCardString, formData]);

  const copyVCard = useCallback(() => {
    navigator.clipboard.writeText(vCardString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [vCardString]);

  const InputField = ({ label, name, icon: Icon, placeholder, type = "text" }: any) => (
    <div className="space-y-2">
      <label htmlFor={name} className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
        <Icon className="w-3 h-3" /> {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={(formData as any)[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Form area */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            {/* Identity */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 px-1 border-b border-slate-200 dark:border-slate-800 pb-4">
                <UserRound className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">{t('vcard.name_section')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label={t('vcard.first_name')} name="firstName" icon={UserRound} placeholder="John" />
                <InputField label={t('vcard.last_name')} name="lastName" icon={UserRound} placeholder="Doe" />
                <InputField label={t('vcard.organization')} name="organization" icon={Building} placeholder="Acme Corp" />
                <InputField label={t('vcard.job_title')} name="jobTitle" icon={UserRound} placeholder="Software Engineer" />
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-2 px-1 border-b border-slate-200 dark:border-slate-800 pb-4">
                <Phone className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">{t('vcard.contact_section')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label={t('vcard.phone_mobile')} name="phoneMobile" icon={Phone} placeholder="+33 6 00 00 00 00" type="tel" />
                <InputField label={t('vcard.phone_work')} name="phoneWork" icon={Phone} placeholder="+33 1 00 00 00 00" type="tel" />
                <InputField label={t('vcard.email_personal')} name="emailPersonal" icon={Mail} placeholder="john.doe@gmail.com" type="email" />
                <InputField label={t('vcard.email_work')} name="emailWork" icon={Mail} placeholder="j.doe@acme.com" type="email" />
                <div className="md:col-span-2">
                   <InputField label={t('vcard.website')} name="website" icon={Globe} placeholder="https://www.example.com" type="url" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-2 px-1 border-b border-slate-200 dark:border-slate-800 pb-4">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">{t('vcard.address_section')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <InputField label={t('vcard.street')} name="street" icon={MapPin} placeholder="123 Apple St" />
                </div>
                <InputField label={t('vcard.city')} name="city" icon={MapPin} placeholder="Paris" />
                <InputField label={t('vcard.postcode')} name="postcode" icon={MapPin} placeholder="75000" />
                <div className="md:col-span-2">
                  <InputField label={t('vcard.country')} name="country" icon={Globe} placeholder="France" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Preview & Actions */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-500" /> {t('vcard.preview_section')}
              </h3>
            </div>

            <div className="relative group">
              {qrCodeUrl ? (
                <div className="p-6 bg-white rounded-3xl shadow-2xl shadow-indigo-500/10 border border-slate-100 animate-in zoom-in-95 duration-500">
                  <img
                    src={qrCodeUrl}
                    alt="vCard QR Code"
                    className="w-48 h-48"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-2">
                  <UserRound className="w-12 h-12 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center px-4">{t('common.waiting') || 'Waiting for data...'}</p>
                </div>
              )}
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={downloadVCF}
                disabled={!qrCodeUrl}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                {t('vcard.download_vcf')}
              </button>
              <button
                onClick={copyVCard}
                disabled={!qrCodeUrl}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed ${
                  copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 space-y-4">
             <div className="flex items-center gap-3">
               <Info className="w-5 h-5 text-indigo-500" />
               <h4 className="font-bold dark:text-white">{t('vcard.about_title')}</h4>
             </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               {t('vcard.about_text')}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
