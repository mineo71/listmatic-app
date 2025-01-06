import React, { useState } from 'react';
import { Check, Trash2, Edit2 } from 'lucide-react';
import type { Task } from '@/types/task';

interface HexagonProps {
  task: Task;
  size: number;
  position: { x: number; y: number };
  isPreview?: boolean;
  isSelected?: boolean;
  connected?: boolean;
  onSelect?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  onEdit?: (newTitle: string) => void;  // Updated this line to include newTitle parameter
}

const Hexagon: React.FC<HexagonProps> = ({
  task,
  size,
  position,
  isPreview = false,
  isSelected = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connected = false,
  onSelect,
  onComplete,
  onDelete,
  onEdit
}) => {
  const [showActions, setShowActions] = useState(false);
  
  // Calculate hexagon points
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * Math.PI) / 3;
    return `${size * Math.cos(angle)},${size * Math.sin(angle)}`;
  }).join(' ');

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`
        transition-all duration-200 ease-in-out
        ${isPreview ? 'opacity-50' : 'opacity-100'}
        hover:scale-105
      `}
    >
      {/* Hexagon shape */}
      <polygon
        points={points}
        className={`
          transition-colors duration-200
          ${task.completed ? 'fill-amber-500' : 'fill-white'}
          ${isSelected ? 'stroke-amber-500' : 'stroke-gray-300'}
          ${isPreview ? 'stroke-amber-300 stroke-dashed' : 'stroke-2'}
          hover:stroke-amber-400
        `}
      />
      
      {/* Task title */}
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        className={`
          text-sm 
          select-none
          ${task.completed ? 'fill-white' : 'fill-gray-700'}
          font-medium
        `}
      >
        {task.title}
      </text>

      {/* Action buttons */}
      {showActions && !isPreview && (
        <g className="transition-opacity duration-200">
          {/* Complete button */}
          <circle
            cx={-size/2}
            cy={0}
            r={15}
            className="fill-white stroke-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              onComplete?.();
            }}
          />
          <g transform={`translate(${-size/2 - 8}, -8)`}>
            <Check 
              size={16}
              className={`${task.completed ? 'text-amber-500' : 'text-gray-400'}`}
            />
          </g>

          {/* Edit button */}
          <circle
            cx={0}
            cy={-size/2}
            r={15}
            className="fill-white stroke-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) {
                // Here you might want to trigger a modal or some other UI
                const newTitle = prompt('Enter new title:', task.title);
                if (newTitle) onEdit(newTitle);
              }
            }}
          />
          <g transform={`translate(-8, ${-size/2 - 8})`}>
            <Edit2 size={16} className="text-gray-400" />
          </g>

          {/* Delete button */}
          <circle
            cx={size/2}
            cy={0}
            r={15}
            className="fill-white stroke-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          />
          <g transform={`translate(${size/2 - 8}, -8)`}>
            <Trash2 size={16} className="text-red-400" />
          </g>
        </g>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <circle
          r={size + 5}
          className="fill-none stroke-amber-500 stroke-2 opacity-50"
        />
      )}
    </g>
  );
};

export default Hexagon;