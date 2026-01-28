import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, ClipboardList } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    setTodos([newTodo, ...todos]);
    setInputValue('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    pending: todos.filter(t => !t.completed).length,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-500' },
          { label: 'En cours', value: stats.pending, color: 'text-indigo-500' },
          { label: 'Terminés', value: stats.completed, color: 'text-emerald-500' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-center">
            <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900/40 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <form onSubmit={addTodo} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Quelle est la prochaine tâche ?"
            className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          />
          <button
            type="submit"
            className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        </form>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {todos.length > 0 ? (
            todos.map((todo) => (
              <div
                key={todo.id}
                className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  todo.completed
                    ? 'bg-slate-50 dark:bg-slate-800/30 border-transparent opacity-60'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900/50'
                }`}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`transition-colors ${todo.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}
                >
                  {todo.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>

                <span className={`flex-1 font-medium transition-all ${todo.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {todo.text}
                </span>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <ClipboardList className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-400">Votre liste est vide</p>
                <p className="text-sm text-slate-400">Ajoutez une tâche pour commencer !</p>
              </div>
            </div>
          )}
        </div>

        {todos.some(t => t.completed) && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={clearCompleted}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
            >
              Effacer les tâches terminées
            </button>
          </div>
        )}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-2 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl shadow-sm">
          <ListTodo className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-300">Organisation quotidienne</h4>
          <p className="text-sm text-indigo-700/70 dark:text-indigo-400/70 leading-relaxed">
            Restez organisé et productif. Vos tâches sont sauvegardées localement dans votre navigateur.
          </p>
        </div>
      </div>
    </div>
  );
}
