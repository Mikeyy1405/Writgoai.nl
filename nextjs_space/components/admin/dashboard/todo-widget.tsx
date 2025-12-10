'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Square, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Todo {
  id: string;
  title: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

interface TodoWidgetProps {
  todos: Todo[];
}

export function TodoWidget({ todos: initialTodos }: TodoWidgetProps) {
  const [todos, setTodos] = useState(initialTodos);

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-zinc-400';
    }
  };

  const pendingTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            ✅ Vandaag Te Doen
          </span>
          <span className="text-sm text-zinc-500">
            {pendingTodos.length}/{todos.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {pendingTodos.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              🎉 Alle taken voltooid!
            </div>
          ) : (
            <>
              {pendingTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 transition-colors group cursor-pointer"
                  onClick={() => toggleTodo(todo.id)}
                >
                  <div className="mt-0.5">
                    <Square className="w-4 h-4 text-zinc-600 group-hover:text-[#FF6B35]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{todo.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-600">{todo.type}</span>
                      <span className={`text-xs ${getPriorityColor(todo.priority)}`}>
                        {todo.priority === 'high' && <AlertCircle className="w-3 h-3 inline mr-1" />}
                        {todo.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {completedTodos.length > 0 && (
                <>
                  <div className="pt-4 pb-2">
                    <p className="text-xs text-zinc-500">Voltooid</p>
                  </div>
                  {completedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950 opacity-50 cursor-pointer"
                      onClick={() => toggleTodo(todo.id)}
                    >
                      <CheckSquare className="w-4 h-4 text-green-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white line-through">{todo.title}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
