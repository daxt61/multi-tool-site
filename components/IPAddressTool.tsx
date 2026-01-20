import { useState, useEffect } from 'react';
import { Globe, MapPin, Wifi } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function IPAddressTool() {
  const [ipInfo, setIpInfo] = useState({
    ip: '123.456.789.012',
    city: 'Paris',
    region: 'Île-de-France',
    country: 'FR',
    timezone: 'Europe/Paris',
    isp: 'Fournisseur d\'accès Internet'
  });

  // Simuler la récupération des infos IP
  useEffect(() => {
    // En production, vous utiliseriez une vraie API comme ipapi.co ou ip-api.com
    // fetch('https://ipapi.co/json/')
    //   .then(res => res.json())
    //   .then(data => setIpInfo(data));
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-8 rounded-lg mb-6 text-center">
        <Globe className="w-16 h-16 mx-auto mb-4" />
        <div className="text-sm opacity-90 mb-2">Votre adresse IP</div>
        <div className="text-5xl font-bold mb-2">{ipInfo.ip}</div>
        <div className="text-sm opacity-75">
          ⚠️ Données fictives à titre d'exemple
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">Localisation</span>
          </div>
          <p className="text-gray-700">{ipInfo.city}, {ipInfo.region}</p>
          <p className="text-gray-500 text-sm">{ipInfo.country}</p>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">Fuseau horaire</span>
          </div>
          <p className="text-gray-700">{ipInfo.timezone}</p>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <Wifi className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">Fournisseur d'accès (ISP)</span>
          </div>
          <p className="text-gray-700">{ipInfo.isp}</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <p className="font-semibold mb-2">ℹ️ Note importante</p>
        <p>
          Ces informations sont à titre indicatif et peuvent ne pas refléter votre localisation exacte.
          Pour obtenir des données réelles, une API externe serait nécessaire.
        </p>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
