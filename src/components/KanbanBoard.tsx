"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Task, TaskStatus } from "@/types";
import { Clock, BookOpen, PenTool, Edit2, Trash2 } from "lucide-react";
import { updateTaskStatus, deleteTask, updateTaskDetails } from "@/app/actions/tasks";
import { EditTaskModal } from "./EditTaskModal";
import { toast } from "react-hot-toast";

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const COLUMNS: TaskStatus[] = ["To Do", "In Progress", "Done"];

export function KanbanBoard({ tasks, setTasks }: KanbanBoardProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const draggedTask = tasks.find(t => t.id === result.draggableId);
    if (!draggedTask) return;

    const destinationStatus = destination.droppableId as TaskStatus;
    
    // Optimistic UI update
    setTasks(prev => 
      prev.map(t => 
        t.id === draggedTask.id ? { ...t, status: destinationStatus } : t
      )
    );

    // Persist to database
    try {
      await updateTaskStatus(draggedTask.id, destinationStatus);
    } catch (error) {
      toast.error("Failed to save task status");
      // Revert on failure
      setTasks(prev => 
        prev.map(t => 
          t.id === draggedTask.id ? { ...t, status: source.droppableId as TaskStatus } : t
        )
      );
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    
    // Optimistic delete
    setTasks(prev => prev.filter(t => t.id !== taskId));
    
    try {
      await deleteTask(taskId);
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
      // Note: Full robust implementation would restore the task on failure
    }
  };

  const handleEditSave = async (taskId: string, data: { task_title: string; description: string; due_date: string; task_type: string }) => {
    try {
      await updateTaskDetails(taskId, data);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data, task_type: data.task_type as Task["task_type"] } : t));
      toast.success("Task updated");
    } catch (error) {
      toast.error("Failed to update task");
      throw error; // Re-throw to keep modal open if failed
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const getTaskIcon = (type: string) => {
    switch(type) {
      case "Reading": return <BookOpen size={14} className="text-blue-500" />;
      case "Assignment": return <PenTool size={14} className="text-purple-500" />;
      case "Exam": return <Clock size={14} className="text-red-500" />;
      default: return <BookOpen size={14} />;
    }
  };

  const isDueSoon = (dateStr: string) => {
    const dueDate = new Date(dateStr);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {COLUMNS.map((status) => (
            <div key={status} className="flex flex-col bg-slate-100/50 rounded-2xl p-4 border border-slate-200/60">
              <h3 className="font-semibold text-slate-700 mb-4 px-2 flex items-center justify-between">
                {status}
                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">
                  {getTasksByStatus(status).length}
                </span>
              </h3>
              
              <Droppable droppableId={status}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex-1 space-y-3 min-h-[200px]"
                  >
                    {getTasksByStatus(status).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded-xl shadow-sm border ${snapshot.isDragging ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-slate-200'} transition-all group`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                {getTaskIcon(task.task_type)}
                                <span className="text-xs font-medium text-slate-500">{task.task_type}</span>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingTask(task)} className="text-slate-400 hover:text-blue-600"><Edit2 size={14}/></button>
                                <button onClick={() => handleDelete(task.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                              </div>
                            </div>
                            
                            <h4 className="font-semibold text-slate-900 mb-1">{task.task_title}</h4>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4">{task.description}</p>
                            
                            <div className="flex items-center justify-between mt-auto">
                              <span className="text-xs text-slate-400 truncate max-w-[100px]">{task.course_id}</span>
                              <span className={`text-xs font-medium flex items-center gap-1 ${isDueSoon(task.due_date) ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50'} px-2 py-1 rounded-md`}>
                                <Clock size={12} />
                                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {editingTask && (
        <EditTaskModal 
          task={editingTask} 
          isOpen={true} 
          onClose={() => setEditingTask(null)} 
          onSave={handleEditSave}
        />
      )}
    </>
  );
}
