import { useState, useMemo } from 'react';
import { Search, Info, X, Microscope, Beaker, Zap, Wind, Mountain, Droplets } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Element {
  symbol: string;
  name: string;
  number: number;
  weight: number;
  category: string;
  group: number;
  period: number;
  summary: string;
  appearance?: string;
  phase: string;
  density: number;
  melt?: number;
  boil?: number;
}

const ELEMENTS: Element[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', weight: 1.008, category: 'diatomic nonmetal', group: 1, period: 1, phase: 'Gas', density: 0.00008988, melt: 13.99, boil: 20.271, summary: 'Hydrogen is a chemical element with symbol H and atomic number 1. With a standard atomic weight of 1.008, hydrogen is the lightest element on the periodic table.' },
  { number: 2, symbol: 'He', name: 'Helium', weight: 4.0026, category: 'noble gas', group: 18, period: 1, phase: 'Gas', density: 0.0001785, melt: 0.95, boil: 4.222, summary: 'Helium is a chemical element with symbol He and atomic number 2. It is a colorless, odorless, tasteless, non-toxic, inert, monatomic gas that heads the noble gas group in the periodic table.' },
  { number: 3, symbol: 'Li', name: 'Lithium', weight: 6.94, category: 'alkali metal', group: 1, period: 2, phase: 'Solid', density: 0.534, melt: 453.65, boil: 1603, summary: 'Lithium (from Greek: λίθος lithos, "stone") is a chemical element with the symbol Li and atomic number 3. It is a soft, silver-white metal belonging to the alkali metal group of chemical elements.' },
  { number: 4, symbol: 'Be', name: 'Beryllium', weight: 9.0122, category: 'alkaline earth metal', group: 2, period: 2, phase: 'Solid', density: 1.85, melt: 1560, boil: 2742, summary: 'Beryllium is a chemical element with symbol Be and atomic number 4. It is a relatively rare element in the universe, usually occurring as a product of the spallation of larger atomic nuclei that have collided with cosmic rays.' },
  { number: 5, symbol: 'B', name: 'Boron', weight: 10.81, category: 'metalloid', group: 13, period: 2, phase: 'Solid', density: 2.08, melt: 2349, boil: 4273, summary: 'Boron is a metalloid chemical element with symbol B and atomic number 5. Produced entirely by cosmic ray spallation and supernovae and not by stellar nucleosynthesis, it is a low-abundance element in the Solar system and in the Earth\'s crust.' },
  { number: 6, symbol: 'C', name: 'Carbon', weight: 12.011, category: 'polyatomic nonmetal', group: 14, period: 2, phase: 'Solid', density: 1.821, melt: 3823, boil: 4098, summary: 'Carbon (from Latin: carbo "coal") is a chemical element with symbol C and atomic number 6. On the periodic table, it is the first of six elements in column (group) 14, which have common chemical properties.' },
  { number: 7, symbol: 'N', name: 'Nitrogen', weight: 14.007, category: 'diatomic nonmetal', group: 15, period: 2, phase: 'Gas', density: 0.0012506, melt: 63.15, boil: 77.355, summary: 'Nitrogen is a chemical element with symbol N and atomic number 7. It was first discovered and isolated by Scottish physician Daniel Rutherford in 1772.' },
  { number: 8, symbol: 'O', name: 'Oxygen', weight: 15.999, category: 'diatomic nonmetal', group: 16, period: 2, phase: 'Gas', density: 0.001429, melt: 54.36, boil: 90.188, summary: 'Oxygen is a chemical element with symbol O and atomic number 8. It is a member of the chalcogen group on the periodic table, a highly reactive nonmetal, and an oxidizing agent that readily forms oxides with most elements as well as with other compounds.' },
  { number: 9, symbol: 'F', name: 'Fluorine', weight: 18.998, category: 'diatomic nonmetal', group: 17, period: 2, phase: 'Gas', density: 0.001696, melt: 53.48, boil: 85.03, summary: 'Fluorine is a chemical element with symbol F and atomic number 9. It is the most electronegative element and is extremely reactive: almost all other elements, including some noble gases, form compounds with fluorine.' },
  { number: 10, symbol: 'Ne', name: 'Neon', weight: 20.180, category: 'noble gas', group: 18, period: 2, phase: 'Gas', density: 0.0008999, melt: 24.56, boil: 27.07, summary: 'Neon is a chemical element with symbol Ne and atomic number 10. It is a noble gas. Neon is a colorless, odorless, inert monatomic gas under standard conditions, with about two-thirds the density of air.' },
  { number: 11, symbol: 'Na', name: 'Sodium', weight: 22.990, category: 'alkali metal', group: 1, period: 3, phase: 'Solid', density: 0.968, melt: 370.944, boil: 1156.09, summary: 'Sodium /ˈsoʊdiəm/ is a chemical element with symbol Na (from Ancient Greek Νάτριο) and atomic number 11. It is a soft, silver-white, highly reactive metal.' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', weight: 24.305, category: 'alkaline earth metal', group: 2, period: 3, phase: 'Solid', density: 1.738, melt: 923, boil: 1363, summary: 'Magnesium is a chemical element with symbol Mg and atomic number 12. It is a shiny gray solid which bears a close physical resemblance to the other five elements in the second column (group 2, or alkaline earth metals) of the periodic table.' },
  { number: 13, symbol: 'Al', name: 'Aluminium', weight: 26.982, category: 'post-transition metal', group: 13, period: 3, phase: 'Solid', density: 2.70, melt: 933.47, boil: 2743, summary: 'Aluminium (or aluminum; see different spellings) is a chemical element in the boron group with symbol Al and atomic number 13. It is a silvery-white, soft, nonmagnetic, ductile metal.' },
  { number: 14, symbol: 'Si', name: 'Silicon', weight: 28.085, category: 'metalloid', group: 14, period: 3, phase: 'Solid', density: 2.329, melt: 1687, boil: 3538, summary: 'Silicon is a chemical element with symbol Si and atomic number 14. It is a hard and brittle crystalline solid with a blue-gray metallic luster; and it is a tetravalent metalloid and semiconductor.' },
  { number: 15, symbol: 'P', name: 'Phosphorus', weight: 30.974, category: 'polyatomic nonmetal', group: 15, period: 3, phase: 'Solid', density: 1.823, melt: 317.3, boil: 553.7, summary: 'Phosphorus is a chemical element with symbol P and atomic number 15. As an element, phosphorus exists in two major forms—white phosphorus and red phosphorus—but because it is highly reactive, phosphorus is never found as a free element on Earth.' },
  { number: 16, symbol: 'S', name: 'Sulfur', weight: 32.06, category: 'polyatomic nonmetal', group: 16, period: 3, phase: 'Solid', density: 2.07, melt: 388.36, boil: 717.8, summary: 'Sulfur or sulphur (see spelling differences) is a chemical element with symbol S and atomic number 16. It is abundant, multivalent, and nonmetallic. Under normal conditions, sulfur atoms form cyclic octatomic molecules with a chemical formula S8.' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', weight: 35.45, category: 'diatomic nonmetal', group: 17, period: 3, phase: 'Gas', density: 0.003214, melt: 171.6, boil: 239.11, summary: 'Chlorine is a chemical element with symbol Cl and atomic number 17. It also has a relative atomic mass of 35.5. Chlorine is a yellow-green gas under standard conditions, where it forms diatomic molecules.' },
  { number: 18, symbol: 'Ar', name: 'Argon', weight: 39.948, category: 'noble gas', group: 18, period: 3, phase: 'Gas', density: 0.0017837, melt: 83.81, boil: 87.302, summary: 'Argon is a chemical element with symbol Ar and atomic number 18. It is in group 18 of the periodic table and is a noble gas. Argon is the third most abundant gas in the Earth\'s atmosphere, at 0.934% (9,340 ppmv).' },
  { number: 19, symbol: 'K', name: 'Potassium', weight: 39.098, category: 'alkali metal', group: 1, period: 4, phase: 'Solid', density: 0.862, melt: 336.7, boil: 1032, summary: 'Potassium is a chemical element with symbol K (from Neo-Latin kalium) and atomic number 19. It was first isolated from potash, the ashes of plants, from which its name derives. In the periodic table, potassium is one of the alkali metals.' },
  { number: 20, symbol: 'Ca', name: 'Calcium', weight: 40.078, category: 'alkaline earth metal', group: 2, period: 4, phase: 'Solid', density: 1.54, melt: 1115, boil: 1757, summary: 'Calcium is a chemical element with symbol Ca and atomic number 20. Calcium is a soft gray alkaline earth metal, fifth-most-abundant element by mass in the Earth\'s crust.' },
  { number: 26, symbol: 'Fe', name: 'Iron', weight: 55.845, category: 'transition metal', group: 8, period: 4, phase: 'Solid', density: 7.874, melt: 1811, boil: 3134, summary: 'Iron is a chemical element with symbol Fe (from Latin: ferrum) and atomic number 26. It is a metal that belongs to the first transition series and group 8 of the periodic table.' },
  { number: 29, symbol: 'Cu', name: 'Copper', weight: 63.546, category: 'transition metal', group: 11, period: 4, phase: 'Solid', density: 8.96, melt: 1357.77, boil: 2835, summary: 'Copper is a chemical element with symbol Cu (from Latin: cuprum) and atomic number 29. It is a soft, malleable, and ductile metal with very high thermal and electrical conductivity.' },
  { number: 30, symbol: 'Zn', name: 'Zinc', weight: 65.38, category: 'transition metal', group: 12, period: 4, phase: 'Solid', density: 7.14, melt: 692.68, boil: 1180, summary: 'Zinc is a chemical element with symbol Zn and atomic number 30. It is the first element in group 12 of the periodic table. In some respects zinc is chemically similar to magnesium: both elements exhibit only one normal oxidation state (+2).' },
  { number: 47, symbol: 'Ag', name: 'Silver', weight: 107.8682, category: 'transition metal', group: 11, period: 5, phase: 'Solid', density: 10.49, melt: 1234.93, boil: 2435, summary: 'Silver is a chemical element with symbol Ag (from the Latin argentum, derived from the Proto-Indo-European h₂erǵ: "shiny" or "white") and atomic number 47. A soft, white, lustrous transition metal, it exhibits the highest electrical conductivity, thermal conductivity, and reflectivity of any metal.' },
  { number: 79, symbol: 'Au', name: 'Gold', weight: 196.96657, category: 'transition metal', group: 11, period: 6, phase: 'Solid', density: 19.3, melt: 1337.33, boil: 3129, summary: 'Gold is a chemical element with symbol Au (from Latin: aurum) and atomic number 79, making it one of the higher atomic number elements that occur naturally. In its purest form, it is a bright, slightly reddish yellow, dense, soft, malleable, and ductile metal.' },
  { number: 80, symbol: 'Hg', name: 'Mercury', weight: 200.592, category: 'transition metal', group: 12, period: 6, phase: 'Liquid', density: 13.534, melt: 234.321, boil: 629.88, summary: 'Mercury is a chemical element with symbol Hg and atomic number 80. It is commonly known as quicksilver and was formerly named hydrargyrum (/haɪˈdrɑːrdʒərəm/).' },
  { number: 82, symbol: 'Pb', name: 'Lead', weight: 207.2, category: 'post-transition metal', group: 14, period: 6, phase: 'Solid', density: 11.34, melt: 600.61, boil: 2022, summary: 'Lead is a chemical element with symbol Pb (from the Latin plumbum) and atomic number 82. It is a heavy metal that is denser than most common materials. Lead is soft and malleable, and also has a relatively low melting point.' },
  { number: 21, symbol: 'Sc', name: 'Scandium', weight: 44.955, category: 'transition metal', group: 3, period: 4, phase: 'Solid', density: 2.985, melt: 1814, boil: 3109, summary: 'Scandium is a chemical element with symbol Sc and atomic number 21. A silvery-white metallic d-block element, it has historically been sometimes classified as a rare earth element.' },
  { number: 22, symbol: 'Ti', name: 'Titanium', weight: 47.867, category: 'transition metal', group: 4, period: 4, phase: 'Solid', density: 4.506, melt: 1941, boil: 3560, summary: 'Titanium is a chemical element with symbol Ti and atomic number 22. It is a lustrous transition metal with a silver color, low density, and high strength.' },
  { number: 23, symbol: 'V', name: 'Vanadium', weight: 50.941, category: 'transition metal', group: 5, period: 4, phase: 'Solid', density: 6.11, melt: 2183, boil: 3680, summary: 'Vanadium is a chemical element with symbol V and atomic number 23. It is a hard, silvery-gray, malleable transition metal.' },
  { number: 24, symbol: 'Cr', name: 'Chromium', weight: 51.996, category: 'transition metal', group: 6, period: 4, phase: 'Solid', density: 7.19, melt: 2180, boil: 2944, summary: 'Chromium is a chemical element with symbol Cr and atomic number 24. It is a steely-gray, lustrous, hard and brittle transition metal.' },
  { number: 25, symbol: 'Mn', name: 'Manganese', weight: 54.938, category: 'transition metal', group: 7, period: 4, phase: 'Solid', density: 7.21, melt: 1519, boil: 2334, summary: 'Manganese is a chemical element with symbol Mn and atomic number 25. It is not found as a free element in nature; it is often found in minerals in combination with iron.' },
  { number: 27, symbol: 'Co', name: 'Cobalt', weight: 58.933, category: 'transition metal', group: 9, period: 4, phase: 'Solid', density: 8.9, melt: 1768, boil: 3200, summary: 'Cobalt is a chemical element with symbol Co and atomic number 27. Like iron, cobalt is found in the Earth\'s crust only in chemically combined form.' },
  { number: 28, symbol: 'Ni', name: 'Nickel', weight: 58.693, category: 'transition metal', group: 10, period: 4, phase: 'Solid', density: 8.908, melt: 1728, boil: 3003, summary: 'Nickel is a chemical element with symbol Ni and atomic number 28. It is a silvery-white lustrous metal with a slight golden tinge.' },
  { number: 31, symbol: 'Ga', name: 'Gallium', weight: 69.723, category: 'post-transition metal', group: 13, period: 4, phase: 'Solid', density: 5.91, melt: 302.91, boil: 2477, summary: 'Gallium is a chemical element with symbol Ga and atomic number 31. Elemental gallium is a soft, silvery blue metal at standard temperature and pressure.' },
  { number: 32, symbol: 'Ge', name: 'Germanium', weight: 72.63, category: 'metalloid', group: 14, period: 4, phase: 'Solid', density: 5.323, melt: 1211.4, boil: 3106, summary: 'Germanium is a chemical element with symbol Ge and atomic number 32. It is a lustrous, hard-brittle, grayish-white metalloid in the carbon group.' },
  { number: 33, symbol: 'As', name: 'Arsenic', weight: 74.921, category: 'metalloid', group: 15, period: 4, phase: 'Solid', density: 5.727, melt: 1090, boil: 887, summary: 'Arsenic is a chemical element with symbol As and atomic number 33. Arsenic occurs in many minerals, usually in combination with sulfur and metals.' },
  { number: 34, symbol: 'Se', name: 'Selenium', weight: 78.971, category: 'polyatomic nonmetal', group: 16, period: 4, phase: 'Solid', density: 4.81, melt: 494, boil: 958, summary: 'Selenium is a chemical element with symbol Se and atomic number 34. It is a nonmetal with properties that are intermediate between the elements above and below in the periodic table.' },
  { number: 35, symbol: 'Br', name: 'Bromine', weight: 79.904, category: 'diatomic nonmetal', group: 17, period: 4, phase: 'Liquid', density: 3.1028, melt: 265.8, boil: 332, summary: 'Bromine is a chemical element with symbol Br and atomic number 35. It is the third-lightest halogen, and is a fuming red-brown liquid at room temperature.' },
  { number: 36, symbol: 'Kr', name: 'Krypton', weight: 83.798, category: 'noble gas', group: 18, period: 4, phase: 'Gas', density: 0.003733, melt: 115.79, boil: 119.93, summary: 'Krypton is a chemical element with symbol Kr and atomic number 36. It is a member of group 18 (noble gases) elements.' },
  { number: 53, symbol: 'I', name: 'Iodine', weight: 126.90, category: 'diatomic nonmetal', group: 17, period: 5, phase: 'Solid', density: 4.933, melt: 386.85, boil: 457.4, summary: 'Iodine is a chemical element with symbol I and atomic number 53. The heaviest of the stable halogens, it exists as a lustrous, purple-black metallic solid at standard conditions.' },
  { number: 54, symbol: 'Xe', name: 'Xenon', weight: 131.29, category: 'noble gas', group: 18, period: 5, phase: 'Gas', density: 0.005887, melt: 161.4, boil: 165.03, summary: 'Xenon is a chemical element with symbol Xe and atomic number 54. It is a colorless, dense, odorless noble gas found in Earth\'s atmosphere in trace amounts.' },
  { number: 55, symbol: 'Cs', name: 'Caesium', weight: 132.90, category: 'alkali metal', group: 1, period: 6, phase: 'Solid', density: 1.93, melt: 301.59, boil: 944, summary: 'Caesium (IUPAC spelling) (also spelled cesium in North American English) is a chemical element with symbol Cs and atomic number 55.' },
  { number: 56, symbol: 'Ba', name: 'Barium', weight: 137.32, category: 'alkaline earth metal', group: 2, period: 6, phase: 'Solid', density: 3.51, melt: 1000, boil: 2118, summary: 'Barium is a chemical element with symbol Ba and atomic number 56. It is the fifth element in group 2 and is a soft, silvery alkaline earth metal.' },
  { number: 92, symbol: 'U', name: 'Uranium', weight: 238.02, category: 'actinide', group: 3, period: 7, phase: 'Solid', density: 19.1, melt: 1405.3, boil: 4404, summary: 'Uranium is a chemical element with symbol U and atomic number 92. It is a silvery-white metal in the actinide series of the periodic table.' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'diatomic nonmetal': 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400',
  'noble gas': 'bg-purple-100 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400',
  'alkali metal': 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400',
  'alkaline earth metal': 'bg-orange-100 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400',
  'metalloid': 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400',
  'polyatomic nonmetal': 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-500',
  'post-transition metal': 'bg-teal-100 border-teal-200 text-teal-800 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-400',
  'transition metal': 'bg-rose-100 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400',
  'lanthanide': 'bg-pink-100 border-pink-200 text-pink-800 dark:bg-pink-900/30 dark:border-pink-800 dark:text-pink-400',
  'actinide': 'bg-indigo-100 border-indigo-200 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400',
};

export function PeriodicTable() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);

  const filteredElements = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ELEMENTS;
    return ELEMENTS.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.symbol.toLowerCase().includes(q) ||
      e.number.toString() === q
    );
  }, [search]);

  const grid = useMemo(() => {
    const matrix: (Element | null)[][] = Array.from({ length: 7 }, () => Array(18).fill(null));
    ELEMENTS.forEach(e => {
      matrix[e.period - 1][e.group - 1] = e;
    });
    return matrix;
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative group max-w-md w-full">
          <label htmlFor="element-search" className="sr-only">Search Element</label>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            id="element-search"
            type="text"
            placeholder="Search by name, symbol, or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-slate-950">
              <div className={`w-2 h-2 rounded-full ${color.split(' ')[0]}`} />
              <span className="text-slate-500 dark:text-slate-400">{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Periodic Grid */}
      <div className="overflow-x-auto pb-8 no-scrollbar">
        <div className="inline-grid grid-cols-[repeat(18,minmax(0,1fr))] gap-2 min-w-[1000px]">
          {grid.map((row, r) => (
            row.map((cell, c) => {
              const isMatch = cell && filteredElements.includes(cell);
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => cell && setSelectedElement(cell)}
                  disabled={!cell}
                  className={`relative w-full aspect-square p-1 rounded-lg border transition-all flex flex-col items-center justify-center group ${
                    !cell ? 'opacity-0 cursor-default' :
                    isMatch ? 'hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/5' :
                    'opacity-30 grayscale blur-[1px]'
                  } ${cell ? CATEGORY_COLORS[cell.category] || 'bg-slate-100 border-slate-200' : ''}`}
                >
                  {cell && (
                    <>
                      <span className="absolute top-0.5 left-1 text-[8px] font-black opacity-50">{cell.number}</span>
                      <span className="text-lg font-black leading-none">{cell.symbol}</span>
                      <span className="text-[7px] font-bold truncate w-full text-center">{cell.name}</span>
                    </>
                  )}
                </button>
              );
            })
          ))}
        </div>
      </div>

      {/* Selected Element Detail */}
      {selectedElement && (
        <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500/30 rounded-[2.5rem] p-8 md:p-12 relative animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <button
            onClick={() => setSelectedElement(null)}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col lg:flex-row gap-12 relative z-0">
            <div className="flex flex-col items-center gap-6 lg:w-48">
               <div className={`w-32 h-32 md:w-40 md:h-48 rounded-[2rem] border-4 flex flex-col items-center justify-center relative shadow-2xl ${CATEGORY_COLORS[selectedElement.category]}`}>
                  <span className="absolute top-3 left-4 text-sm font-black opacity-40">{selectedElement.number}</span>
                  <span className="text-5xl md:text-6xl font-black">{selectedElement.symbol}</span>
                  <span className="text-xs font-bold uppercase tracking-widest mt-2">{selectedElement.name}</span>
                  <span className="absolute bottom-3 text-[10px] font-mono opacity-50">{selectedElement.weight}</span>
               </div>
               <div className="flex flex-col items-center text-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Category</span>
                  <span className="text-sm font-bold text-indigo-500">{selectedElement.category}</span>
               </div>
            </div>

            <div className="flex-1 space-y-8">
              <div>
                <h3 className="text-3xl font-black mb-4 flex items-center gap-3">
                  {selectedElement.name}
                  <span className="text-sm px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-bold text-slate-500">#{selectedElement.number}</span>
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                  {selectedElement.summary}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-1"><Microscope className="w-3 h-3" /> Phase</span>
                  <span className="text-lg font-black dark:text-white">{selectedElement.phase}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-1"><Beaker className="w-3 h-3" /> Density</span>
                  <span className="text-lg font-black dark:text-white">{selectedElement.density} g/cm³</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-1"><Zap className="w-3 h-3" /> Melt</span>
                  <span className="text-lg font-black dark:text-white">{selectedElement.melt ?? 'N/A'} K</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-1"><Wind className="w-3 h-3" /> Boil</span>
                  <span className="text-lg font-black dark:text-white">{selectedElement.boil ?? 'N/A'} K</span>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <Mountain className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-500">Group: <span className="text-slate-900 dark:text-white">{selectedElement.group}</span></span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <Droplets className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-500">Period: <span className="text-slate-900 dark:text-white">{selectedElement.period}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ/Educational Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> What is it?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The periodic table is a tabular display of the chemical elements. It is widely used in chemistry, physics, and other sciences, and is generally seen as an icon of chemistry.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Microscope className="w-4 h-4 text-indigo-500" /> Arrangement
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Elements are arranged by atomic number, electron configuration, and recurring chemical properties. Rows are called periods and columns are called groups.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" /> Fun Fact
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Hydrogen is the most abundant element in the universe, making up about 75% of all baryonic mass. On Earth, however, it is mostly found in compounds like water.
          </p>
        </div>
      </div>
    </div>
  );
}
