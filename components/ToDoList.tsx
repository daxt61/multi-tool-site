import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export function ToDoList() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: input.trim(),
      completed: false,
    };
    setTodos([newTodo, ...todos]);
    setInput('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black dark:text-white">Ma Liste</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {todos.length} tâches • {completedCount} terminées
            </p>
          </div>
        </div>

        <form onSubmit={addTodo} className="flex gap-3 mb-8">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ajouter une tâche..."
            className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
          />
          <button
            type="submit"
            className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all active:scale-95"
            aria-label="Ajouter"
          >
            <Plus className="w-6 h-6" />
          </button>
        </form>

        <div className="space-y-3">
          {todos.map(todo => (
            <div
              key={todo.id}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                todo.completed
                  ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/50 opacity-60'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`transition-colors ${todo.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}
              >
                {todo.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </button>
              <span className={`flex-1 font-bold text-sm dark:text-slate-200 ${todo.completed ? 'line-through text-slate-400' : ''}`}>
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                aria-label="Supprimer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {todos.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-medium">
              Aucune tâche pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
