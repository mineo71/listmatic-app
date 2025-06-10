/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Trash2, Calendar, Clock, Search, Check, Plus } from 'lucide-react';
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
  '#FCD34D', '#F87171', '#6EE7B7', '#93C5FD', '#C4B5FD',
];

const PRIORITIES = ['low', 'medium', 'high'];

// Helper function to validate and normalize color values
const validateColor = (color: string | undefined | null): string => {
  if (!color || typeof color !== 'string') {
    return PRESET_COLORS[0];
  }
  
  const trimmedColor = color.trim();
  const hexRegex = /^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
  
  if (hexRegex.test(trimmedColor)) {
    return trimmedColor.startsWith('#') ? trimmedColor : `#${trimmedColor}`;
  }
  
  return PRESET_COLORS[0];
};

// Helper function to validate icon
const validateIcon = (icon: TaskIcon | undefined | null): TaskIcon => {
  if (!icon || typeof icon !== 'string') {
    return 'None';
  }
  
  if (icon === 'None' || ICONS.includes(icon)) {
    return icon;
  }
  
  return 'None';
};

// Helper function to validate priority
const validatePriority = (priority: TaskPriority | undefined | null): TaskPriority => {
  if (!priority || !['low', 'medium', 'high'].includes(priority)) {
    return 'medium';
  }
  return priority;
};

// Enhanced Icon Selector Component
const IconSelector = ({
  selectedIcon,
  onIconChange,
  className = ''
}: {
  selectedIcon: TaskIcon;
  onIconChange: (icon: TaskIcon) => void;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Close dropdown on window resize or scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleClose = () => {
      setIsOpen(false);
      setSearchQuery('');
    };

    window.addEventListener('resize', handleClose);
    window.addEventListener('scroll', handleClose);

    return () => {
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('scroll', handleClose);
    };
  }, [isOpen]);

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return ICONS;
    }
    
    const query = searchQuery.toLowerCase();
    return ICONS.filter(icon => 
      icon.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const renderIcon = (icon: TaskIcon) => {
    if (icon === 'None') {
      return <div className="w-5 h-5" />;
    }
    
    const Icon = ICONS_MAP[icon as keyof typeof ICONS_MAP];
    if (!Icon) {
      return <div className="w-5 h-5" />;
    }
    
    return <Icon size={20} />;
  };

  const renderIconOption = (icon: TaskIcon) => (
    <button
      key={icon}
      type="button"
      onClick={() => {
        onIconChange(icon);
        setIsOpen(false);
        setSearchQuery('');
      }}
      className={`flex items-center gap-3 w-full p-3 text-left hover:bg-gray-100 rounded-lg transition-colors ${
        selectedIcon === icon ? 'bg-amber-50 border border-amber-200' : ''
      }`}
    >
      <div className="flex-shrink-0">
        {renderIcon(icon)}
      </div>
      <span className="text-sm font-medium text-gray-700">{icon}</span>
      {selectedIcon === icon && (
        <Check size={16} className="ml-auto text-amber-600" />
      )}
    </button>
  );

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('hexagon.icon')}
      </label>
      
      {/* Selected Icon Display */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-3 py-2 text-left 
          border border-gray-300 rounded-md focus:outline-none focus:ring-2 
          focus:ring-amber-500 focus:border-transparent hover:bg-gray-50 ${className}`}
      >
        <div className="flex items-center gap-2">
          {renderIcon(selectedIcon)}
          <span className="text-sm text-gray-700">{selectedIcon}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown using Portal */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[999]"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />
          
          {/* Dropdown Content */}
          <div 
            className="fixed z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-hidden"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              minWidth: '250px'
            }}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('placeholders.searchIcons') || 'Search icons...'}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Icons Grid */}
            <div className="max-h-60 overflow-y-auto p-2">
              {filteredIcons.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {t('placeholders.noIconsFound') || 'No icons found'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredIcons.map(renderIconOption)}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

// Color Palette Component
const ColorPalette = ({
  selectedColor,
  onColorChange,
  className = ''
}: {
  selectedColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}) => {
  const [customColor, setCustomColor] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const { t } = useTranslation();

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onColorChange(newColor);
    setShowCustomPicker(false);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('hexagon.color')}
      </label>
      
      {/* Color Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onColorChange(color)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-200 hover:scale-110 ${
              selectedColor === color
                ? 'ring-2 ring-amber-500 ring-offset-2 shadow-lg'
                : 'hover:shadow-md'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        
        {/* Custom Color Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCustomPicker(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-dashed border-gray-400 
              hover:border-gray-600 transition-colors flex items-center justify-center
              hover:bg-gray-100"
            title={t('hexagon.customColor') || 'Custom color'}
          >
            <Plus size={14} className="text-gray-600" />
          </button>
          
          {/* Hidden color input */}
          {showCustomPicker && (
            <input
              type="color"
              value={selectedColor}
              onChange={handleCustomColorChange}
              className="absolute top-0 left-0 w-8 h-8 sm:w-9 sm:h-9 opacity-0 cursor-pointer"
              title={t('hexagon.pickCustomColor') || 'Pick custom color'}
            />
          )}
        </div>
      </div>
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
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<TaskIcon>('None');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState<string>('');
  const [deadlineTime, setDeadlineTime] = useState<string>('');

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setSelectedIcon(validateIcon(initialData.icon));
      setSelectedColor(validateColor(initialData.color));
      setPriority(validatePriority(initialData.priority));
      
      // Handle deadline
      if (initialData.deadline) {
        try {
          const date = new Date(initialData.deadline);
          if (!isNaN(date.getTime())) {
            setDeadline(date.toISOString().split('T')[0]);
            setDeadlineTime(date.toTimeString().slice(0, 5));
          } else {
            setDeadline('');
            setDeadlineTime('');
          }
        } catch (error) {
          console.warn('Invalid deadline date:', initialData.deadline);
          setDeadline('');
          setDeadlineTime('');
        }
      } else {
        setDeadline('');
        setDeadlineTime('');
      }
    }
  }, [initialData, isOpen]);

  // Prevent body scroll when modal is open
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
      let deadlineDate: Date | undefined;
      
      if (deadline && deadlineTime) {
        try {
          deadlineDate = new Date(`${deadline}T${deadlineTime}`);
          if (isNaN(deadlineDate.getTime())) {
            deadlineDate = undefined;
          }
        } catch (error) {
          console.warn('Invalid deadline format, ignoring:', `${deadline}T${deadlineTime}`);
          deadlineDate = undefined;
        }
      }

      onSubmit({
        title: title.trim(),
        description: description.trim(),
        icon: selectedIcon,
        priority,
        deadline: deadlineDate,
        color: validateColor(selectedColor),
      });
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-[101] p-2 sm:p-4">
        <div
          className="bg-white rounded-lg w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] 
            relative shadow-xl flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {isCreating ? t('modals.createHexagon') : t('modals.editHexagon')}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-4 sm:p-4 space-y-4 sm:space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('hexagon.title')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none
                    focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
                  autoFocus
                  placeholder={t('hexagon.titlePlaceholder')}
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('hexagon.description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none
                    focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow
                    resize-y min-h-[80px] max-h-[150px]"
                  placeholder={t('hexagon.descriptionPlaceholder')}
                />
              </div>

              {/* Icon and Color Row */}
              <div className="space-y-4 sm:space-y-6">
                {/* Icon Selector - Full width on mobile for better UX */}
                <IconSelector
                  selectedIcon={selectedIcon}
                  onIconChange={setSelectedIcon}
                />

                {/* Color Palette - Full width on mobile */}
                <ColorPalette
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                />
              </div>

              {/* Priority and Deadline */}
              <div className="space-y-4 sm:space-y-6">
                {/* Priority Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('hexagon.priority')}
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    {PRIORITIES.map((p, index) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p as TaskPriority)}
                        className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors
                          ${index === 0 ? 'rounded-l-md' : ''}
                          ${index === PRIORITIES.length - 1 ? 'rounded-r-md' : ''}
                          ${priority === p
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                          } border ${index !== PRIORITIES.length - 1 ? 'border-r-0' : ''}`}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none
                          focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="time"
                        value={deadlineTime}
                        onChange={(e) => setDeadlineTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none
                          focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  {/* Delete Button */}
                  {!isCreating && onDelete && !initialData?.isMain && (
                    <button
                      type="button"
                      onClick={onDelete}
                      className="order-2 sm:order-1 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-md
                        hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2
                        focus:ring-red-500 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} />
                      {t('actions.delete')}
                    </button>
                  )}

                  {/* Right side buttons */}
                  <div className="order-1 sm:order-2 flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md
                        hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                        focus:ring-amber-500 transition-colors"
                    >
                      {t('actions.cancel')}
                    </button>

                    <button
                      type="submit"
                      disabled={!title.trim()}
                      className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-md
                        hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                        focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors"
                    >
                      {isCreating ? t('actions.create') : t('actions.save')}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};