/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trash2, Calendar, Clock, ChevronDown, Check, Plus } from 'lucide-react';
import type { TaskIcon, TaskPriority } from '../../types';
import { ICONS_MAP, ICONS } from '@/utils/icons';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    icon: TaskIcon;
    priority: TaskPriority;
    deadline?: Date;
    color: string;
  }) => void;
  onDelete?: () => void;
  initialData?: {
    id?: string;
    title: string;
    description?: string;
    icon?: TaskIcon;
    priority?: TaskPriority;
    deadline?: Date;
    color?: string;
    isMain?: boolean;
  };
  isCreating?: boolean;
}

const PRESET_COLORS = [
  // Light colors
  '#FDE68A', '#FCA5A5', '#A7F3D0', '#BFDBFE', '#DDD6FE', '#FBCFE8',
  // Medium colors
  '#FCD34D', '#F87171', '#6EE7B7', '#93C5FD', '#C4B5FD', '#F9A8D4',
  // Vibrant colors
  '#FBBF24', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
  // Pastel colors
  '#FEF3C7', '#FEE2E2', '#D1FAE5', '#DBEAFE', '#EDE9FE', '#FCE7F3',
];

const PRIORITIES = ['low', 'medium', 'high'];
// Dropdown component
const Dropdown = ({
                    label,
                    value,
                    onChange,
                    options,
                    renderOption,
                    renderValue,
                    className = ''
                  }: {
  label: string;
  value: any;
  onChange: (value: any) => void;
  options: any[];
  renderOption: (option: any) => React.ReactNode;
  renderValue: (value: any) => React.ReactNode;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center justify-between w-full px-3 py-2 text-left 
          border border-gray-300 rounded-md focus:outline-none focus:ring-2 
          focus:ring-amber-500 focus:border-transparent ${className}`}
        >
          {renderValue(value)}
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
            <>
              <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsOpen(false)}
              />
              <div className="absolute z-40 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                {options.map((option, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => {
                          onChange(option);
                          setIsOpen(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100"
                    >
                      {renderOption(option)}
                    </button>
                ))}
              </div>
            </>
        )}
      </div>
  );
};

export const HoneycombEditModal = ({
                                     isOpen,
                                     onClose,
                                     onSubmit,
                                     onDelete,
                                     initialData = {
                                       title: '',
                                       description: '',
                                       icon: 'None' as TaskIcon,
                                       priority: 'medium' as TaskPriority,
                                       color: PRESET_COLORS[0]
                                     },
                                     isCreating = false,
                                   }: EditModalProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description || '');
  const [selectedIcon, setSelectedIcon] = useState<TaskIcon>(initialData.icon || 'None');
  const [selectedColor, setSelectedColor] = useState(initialData.color || PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(initialData.priority || 'medium');
  const [deadline, setDeadline] = useState<string>('');
  const [deadlineTime, setDeadlineTime] = useState<string>('');
  const [isCustomColor, setIsCustomColor] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setSelectedIcon(initialData.icon || 'None');
      setSelectedColor(initialData.color || PRESET_COLORS[0]);
      setPriority(initialData.priority || 'medium');
      if (initialData.deadline) {
        const date = new Date(initialData.deadline);
        setDeadline(date.toISOString().split('T')[0]);
        setDeadlineTime(date.toTimeString().slice(0, 5));
      } else {
        setDeadline('');
        setDeadlineTime('');
      }
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const deadlineDate = deadline && deadlineTime
          ? new Date(`${deadline}T${deadlineTime}`)
          : undefined;

      onSubmit({
        title: title.trim(),
        description: description.trim(),
        icon: selectedIcon,
        priority,
        deadline: deadlineDate,
        color: selectedColor,
      });
      onClose();
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setIsCustomColor(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
    setSelectedColor(e.target.value);
    setIsCustomColor(true);
  };

  return (
      <>
        <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />

        <div className="fixed inset-0 flex items-center justify-center z-[101]">
          <div
              className="bg-white rounded-lg w-full max-w-2xl p-6 relative shadow-xl mx-4"
              onClick={e => e.stopPropagation()}
          >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {isCreating ? t('modals.createHexagon') : t('modals.editHexagon')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('hexagon.title')}
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none
                  focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
                    autoFocus
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('hexagon.description')}
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none
                  focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow
                  resize-y min-h-[80px] max-h-[200px]"
                    placeholder={t('hexagon.descriptionPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Icon Dropdown */}
                <Dropdown
                    label={t('hexagon.icon')}
                    value={selectedIcon}
                    onChange={setSelectedIcon}
                    options={['None', ...ICONS]} // Add 'None' as first option
                    renderOption={(icon) => {
                      if (icon === 'None') {
                        return (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4" /> {/* Empty space for alignment */}
                              <span>None</span>
                              {icon === selectedIcon && <Check size={16} className="ml-auto text-amber-500" />}
                            </div>
                        );
                      }
                      const Icon = ICONS_MAP[icon as keyof typeof ICONS_MAP];
                      return (
                          <div className="flex items-center gap-2">
                            <Icon size={16} />
                            <span>{icon}</span>
                            {icon === selectedIcon && <Check size={16} className="ml-auto text-amber-500" />}
                          </div>
                      );
                    }}
                    renderValue={(icon) => {
                      if (icon === 'None') {
                        return (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4" /> {/* Empty space for alignment */}
                              <span>None</span>
                            </div>
                        );
                      }
                      const Icon = ICONS_MAP[icon as keyof typeof ICONS_MAP];
                      return (
                          <div className="flex items-center gap-2">
                            <Icon size={16} />
                            <span>{icon}</span>
                          </div>
                      );
                    }}
                />

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('hexagon.color')}
                  </label>
                  <div className="flex gap-2">
                    <Dropdown
                        label=""
                        value={selectedColor}
                        onChange={handleColorChange}
                        options={PRESET_COLORS}
                        className="!p-1"
                        renderOption={(color) => (
                            <div className="flex items-center gap-2">
                              <div
                                  className="w-6 h-6 rounded-full"
                                  style={{ backgroundColor: color }}
                              />
                              <span>{color}</span>
                              {color === selectedColor && !isCustomColor && (
                                  <Check size={16} className="ml-auto text-amber-500" />
                              )}
                            </div>
                        )}
                        renderValue={(color) => (
                            <div
                                className="w-8 h-8 rounded-full"
                                style={{ backgroundColor: isCustomColor ? customColor : color }}
                            />
                        )}
                    />
                    <div className="relative mt-2">
                      <input
                          type="color"
                          value={customColor}
                          onChange={handleCustomColorChange}
                          className="sr-only"
                          id="custom-color"
                      />
                      <label
                          htmlFor="custom-color"
                          className="flex items-center justify-center w-[42px] h-[42px] border border-gray-300
                        rounded-md cursor-pointer hover:bg-gray-50"
                      >
                        <Plus size={20} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('hexagon.priority')}
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    {PRIORITIES.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p as TaskPriority)}
                            className={`flex-1 px-4 py-2 text-sm first:rounded-l-md last:rounded-r-md
                        ${priority === p
                                ? 'bg-amber-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            } border border-gray-300 font-medium capitalize
                        ${p !== PRIORITIES[PRIORITIES.length - 1] ? 'border-r-0' : ''}`}
                        >
                          {t(`priority.${p}`)}
                        </button>
                    ))}
                  </div>
                </div>

                {/* Deadline Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('hexagon.deadline')}
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none
                          focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="time"
                            value={deadlineTime}
                            onChange={(e) => setDeadlineTime(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none
                          focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4">
                {!isCreating && onDelete && initialData?.id !== 'main' && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md
                    hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2
                    focus:ring-red-500 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} />
                      {t('actions.delete')}
                    </button>
                )}

                <div className={`flex gap-2 ${!isCreating && onDelete && initialData?.id !== 'main' ? '' : 'ml-auto'}`}>
                  <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md
                    hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                    focus:ring-amber-500 transition-colors"
                  >
                    {t('actions.cancel')}
                  </button>

                  <button
                      type="submit"
                      disabled={!title.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md
                    hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                    focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                  >
                    {isCreating ? t('actions.create') : t('actions.save')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </>
  );
}

