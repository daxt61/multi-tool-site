import { useState, useCallback, useEffect } from 'react';
import { Activity, RotateCcw } from 'lucide-react';

export function BPMCounter() {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);

  const handleTap = useCallback(() => {
    const now = Date.now();
    setTaps(prev => {
      const newTaps = [...prev, now].slice(-10); // Keep last 10 taps
      if (newTaps.length > 1) {
        const intervals = [];
        for (let i = 1; i < newTaps.length; i++) {
          intervals.push(newTaps[i] - newTaps[i - 1]);
        }
        const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        setBpm(Math.round(60000 / averageInterval));
      }
      return newTaps;
    });
  }, []);

  const reset = () => {
    setTaps([]);
    setBpm(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap]);

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-12">
        <div className="text-7xl font-bold text-indigo-600 mb-2">
          {bpm || '--'}
        </div>
        <div className="text-gray-500 font-semibold uppercase tracking-wider">
          Beats Per Minute
        </div>
      </div>

      <button
        onClick={handleTap}
        className="w-48 h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center text-white gap-2 mx-auto mb-8 select-none flex-shrink-0"
      >
        <Activity className="w-12 h-12" />
        <span className="font-bold text-xl uppercase">Tap</span>
      </button>

      <div className="text-sm text-gray-600 mb-8">
        Appuyez sur le bouton ou la barre d'espace en rythme
      </div>

      <button
        onClick={reset}
        className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors mx-auto"
      >
        <RotateCcw className="w-4 h-4" />
        Réinitialiser
      </button>

      {/* SEO Content Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 pt-12 text-left">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pourquoi utiliser un compteur de BPM ?</h2>
          <p className="text-gray-600 mb-4">
            Le tempo, mesuré en Battements Par Minute (BPM), est le cœur de toute composition musicale. Que vous soyez musicien, DJ ou producteur, connaître le tempo précis d'un morceau est indispensable pour le mixage, la synchronisation ou l'apprentissage d'un instrument.
          </p>
          <p className="text-gray-600">
            Notre outil "Tap Tempo" vous permet de déterminer cette valeur en temps réel simplement en tapant sur votre clavier ou votre écran.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Comment fonctionne cet outil ?</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li><strong>Moyenne glissante :</strong> Nous calculons la moyenne des intervalles entre vos 10 dernières frappes pour une précision maximale.</li>
            <li><strong>Multi-plateforme :</strong> Utilisez le bouton tactile sur mobile ou la barre d'espace/entrée sur ordinateur.</li>
            <li><strong>Gratuit et instantané :</strong> Pas besoin de logiciel complexe, obtenez le tempo en quelques secondes.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
