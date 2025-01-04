import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { Honeycomb, Task } from '@/types';

interface HoneycombViewProps {
  honeycomb: Honeycomb;
  onUpdate: (updatedHoneycomb: Honeycomb) => void;
}

export const HoneycombView = ({ honeycomb, onUpdate }: HoneycombViewProps) => {
  const { t } = useTranslation();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date(),
    };

    onUpdate({
      ...honeycomb,
      tasks: [...honeycomb.tasks, newTask],
      updatedAt: new Date(),
    });

    setNewTaskTitle('');
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = honeycomb.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    onUpdate({
      ...honeycomb,
      tasks: updatedTasks,
      updatedAt: new Date(),
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm(t('confirmations.deleteTask'))) {
      const updatedTasks = honeycomb.tasks.filter(task => task.id !== taskId);
      onUpdate({
        ...honeycomb,
        tasks: updatedTasks,
        updatedAt: new Date(),
      });
    }
  };

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditedTaskTitle(task.title);
  };

  const handleEditTask = () => {
    if (!editedTaskTitle.trim() || !editingTaskId) return;

    const updatedTasks = honeycomb.tasks.map(task =>
      task.id === editingTaskId
        ? { ...task, title: editedTaskTitle.trim() }
        : task
    );

    onUpdate({
      ...honeycomb,
      tasks: updatedTasks,
      updatedAt: new Date(),
    });

    setEditingTaskId(null);
    setEditedTaskTitle('');
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditedTaskTitle('');
  };

  const completionPercentage = honeycomb.tasks.length
    ? Math.round(
        (honeycomb.tasks.filter(task => task.completed).length / honeycomb.tasks.length) * 100
      )
    : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{honeycomb.name}</h1>
        <div className="bg-gray-200 h-2 rounded-full">
          <div 
            className="bg-amber-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {t('progress', { percentage: completionPercentage })}
        </p>
      </div>

      <form onSubmit={handleAddTask} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={t('placeholders.newTask')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            {t('actions.addTask')}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {honeycomb.tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{t('messages.noTasks')}</p>
        ) : (
          honeycomb.tasks.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200 group"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggleTask(task.id)}
                className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              
              {editingTaskId === task.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTaskTitle}
                    onChange={(e) => setEditedTaskTitle(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handleEditTask}
                    className="p-1 text-green-600 hover:text-green-700"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <span 
                    className={`flex-1 ${
                      task.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditingTask(task)}
                      className="p-1 text-gray-400 hover:text-amber-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};