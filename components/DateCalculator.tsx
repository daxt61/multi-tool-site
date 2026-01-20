import { useState } from 'react';

export function DateCalculator() {
  const today = new Date().toISOString().split('T')[0];
  const [date1, setDate1] = useState(today);
  const [date2, setDate2] = useState(today);
  const [daysToAdd, setDaysToAdd] = useState('30');

  const calculateDifference = () => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30.44);
    const diffYears = Math.floor(diffDays / 365.25);

    return { diffDays, diffWeeks, diffMonths, diffYears };
  };

  const addDaysToDate = (date: string, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const getDayOfWeek = (date: string) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[new Date(date).getDay()];
  };

  const diff = calculateDifference();
  const newDate = addDaysToDate(date1, parseInt(daysToAdd) || 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Date Difference Calculator */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Calculer la différence entre deux dates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2">Date de début</label>
            <input
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              className="w-full p-3 rounded-lg text-gray-900"
            />
            <div className="text-xs mt-1 opacity-75">{getDayOfWeek(date1)}</div>
          </div>
          <div>
            <label className="block text-sm mb-2">Date de fin</label>
            <input
              type="date"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
              className="w-full p-3 rounded-lg text-gray-900"
            />
            <div className="text-xs mt-1 opacity-75">{getDayOfWeek(date2)}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white text-blue-600 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold">{diff.diffDays}</div>
            <div className="text-xs">jours</div>
          </div>
          <div className="bg-white text-blue-600 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold">{diff.diffWeeks}</div>
            <div className="text-xs">semaines</div>
          </div>
          <div className="bg-white text-blue-600 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold">{diff.diffMonths}</div>
            <div className="text-xs">mois</div>
          </div>
          <div className="bg-white text-blue-600 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold">{diff.diffYears}</div>
            <div className="text-xs">années</div>
          </div>
        </div>
      </div>

      {/* Add/Subtract Days */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Ajouter/Soustraire des jours</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2">Date de départ</label>
            <input
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              className="w-full p-3 rounded-lg text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Jours à ajouter (négatif pour soustraire)</label>
            <input
              type="number"
              value={daysToAdd}
              onChange={(e) => setDaysToAdd(e.target.value)}
              className="w-full p-3 rounded-lg text-gray-900"
              placeholder="30"
            />
          </div>
        </div>
        <div className="bg-white text-purple-600 p-6 rounded-lg text-center">
          <div className="text-sm mb-2">Nouvelle date</div>
          <div className="text-3xl font-bold">{newDate}</div>
          <div className="text-sm mt-2 opacity-75">{getDayOfWeek(newDate)}</div>
        </div>
      </div>

      {/* Current Date Info */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Informations sur aujourd'hui</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white text-green-600 p-4 rounded-lg text-center">
            <div className="text-sm opacity-75 mb-1">Date</div>
            <div className="font-bold">{today}</div>
          </div>
          <div className="bg-white text-green-600 p-4 rounded-lg text-center">
            <div className="text-sm opacity-75 mb-1">Jour</div>
            <div className="font-bold">{getDayOfWeek(today)}</div>
          </div>
          <div className="bg-white text-green-600 p-4 rounded-lg text-center">
            <div className="text-sm opacity-75 mb-1">Semaine</div>
            <div className="font-bold">
              {Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
