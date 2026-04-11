import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { Plus, Trash2, ChartBar, ChartLine, LayoutGrid, Info } from 'lucide-react';

interface DataPoint {
  label: string;
  value: number;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function ChartGenerator() {
  const [data, setData] = useState<DataPoint[]>([
    { label: 'Janvier', value: 400 },
    { label: 'Février', value: 300 },
    { label: 'Mars', value: 600 },
    { label: 'Avril', value: 800 },
  ]);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const addDataPoint = () => {
    setData([...data, { label: `Point ${data.length + 1}`, value: 0 }]);
  };

  const removeDataPoint = (index: number) => {
    if (data.length <= 1) return;
    setData(data.filter((_, i) => i !== index));
  };

  const updateDataPoint = (index: number, field: keyof DataPoint, val: string) => {
    setData(prevData => prevData.map((point, i) => {
      if (i === index) {
        return {
          ...point,
          [field]: field === 'value' ? (parseFloat(val) || 0) : val
        };
      }
      return point;
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Input Controls */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <LayoutGrid className="w-4 h-4 text-indigo-500" /> Type de graphique
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${chartType === 'bar' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <ChartBar className="w-4 h-4" /> Bâtons
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${chartType === 'line' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <ChartLine className="w-4 h-4" /> Ligne
                </button>
              </div>
            </div>

            <div className="space-y-4">
               <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  Données
               </label>
               <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {data.map((point, index) => (
                    <div key={index} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <input
                        type="text"
                        value={point.label}
                        onChange={(e) => updateDataPoint(index, 'label', e.target.value)}
                        placeholder="Label"
                        className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                      />
                      <input
                        type="number"
                        value={point.value}
                        onChange={(e) => updateDataPoint(index, 'value', e.target.value)}
                        className="w-24 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                      />
                      <button
                        onClick={() => removeDataPoint(index)}
                        className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
               </div>
               <button
                onClick={addDataPoint}
                className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-indigo-500 hover:border-indigo-500/50 hover:bg-indigo-50/30 transition-all font-bold flex items-center justify-center gap-2"
               >
                <Plus className="w-4 h-4" /> Ajouter un point
               </button>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm min-h-[500px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height={400}>
                 {chartType === 'bar' ? (
                   <BarChart data={data}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                     <Tooltip
                        cursor={{fill: '#f1f5f9', radius: 8}}
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                     />
                     <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {data.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Bar>
                   </BarChart>
                 ) : (
                   <LineChart data={data}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                     <Tooltip
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                     />
                     <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={4}
                        dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                     />
                   </LineChart>
                 )}
              </ResponsiveContainer>
           </div>

           <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                 <Info className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                 <h4 className="font-bold dark:text-white">Comment ça marche ?</h4>
                 <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Ajoutez ou modifiez vos points de données dans le panneau de gauche. Le graphique se met à jour instantanément pour visualiser vos chiffres. Vous pouvez basculer entre un graphique en bâtons ou une ligne selon vos besoins.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
