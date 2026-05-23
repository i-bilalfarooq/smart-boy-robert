"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, Calendar as CalendarIcon, Plus } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { KanbanBoard } from "@/components/KanbanBoard";
import { SmartCalendar } from "@/components/SmartCalendar";
import { Task } from "@/types";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [view, setView] = useState<'kanban' | 'calendar'>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setTasks(data as Task[]);
      }
    }
    
    fetchTasks();
  }, [supabase]);

  const handleTasksExtracted = (newTasks: Task[]) => {
    setTasks(prev => [...newTasks, ...prev]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's your study plan.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={20} /> Add Task
        </button>
      </header>

      <UploadZone onTasksExtracted={handleTasksExtracted} />

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h2 className="text-xl font-semibold text-slate-800">Your Tasks</h2>
        <div className="flex p-1 bg-slate-200 rounded-lg">
          <button 
            onClick={() => setView('kanban')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <LayoutGrid size={16} /> Board
          </button>
          <button 
            onClick={() => setView('calendar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <CalendarIcon size={16} /> Calendar
          </button>
        </div>
      </div>

      <div className="min-h-[500px]">
        {view === 'kanban' ? (
          <KanbanBoard tasks={tasks} setTasks={setTasks} />
        ) : (
          <SmartCalendar tasks={tasks} />
        )}
      </div>
    </div>
  );
}
