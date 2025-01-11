import React, { useState, useMemo } from 'react';
import { calculateHexagonPoints } from './HexagonPoints';
import { HexagonGradient } from './HexagonGradient';
import { HexagonShape } from './HexagonShape';
import { HexagonTitle } from './HexagonTitle';
import { HexagonActions } from './HexagonActions';

export interface HexagonProps {
  id: string;
  x: number;
  y: number;
  title: string;
  color?: string;
  isGhost?: boolean;
  isSelected?: boolean;
  isLinking?: boolean;
  isCompleted?: boolean;
  isCreating?: boolean;
  connections?: string[];
  connectedHexagons?: Array<{ id: string; x: number; y: number }>;
  onClick?: (e: React.MouseEvent) => void;
  onDragStart?: (id: string, e: React.MouseEvent) => void;
  onDragEnd?: () => void;
  onMarkComplete?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
}

export const HoneycombHexagon = ({
  id,
  x,
  y,
  title,
  color = '#FDE68A',
  isGhost = false,
  isSelected = false,
  isLinking = false,
  isCompleted = false,
  isCreating = false,
  onClick,
  onDragStart,
  onDragEnd,
  onMarkComplete,
  onEdit,
}: HexagonProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const size = 60;
  const width = size * 2;
  const height = Math.sqrt(3) * size;

  const points = useMemo(() => calculateHexagonPoints(size, height), [size, height]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button === 0) {
      setIsDragging(true);
      onDragStart?.(id, e);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
    }
  };

  return (
    <div
      className={`absolute transform transition-all duration-200 ease-out
        ${isHovered ? '-translate-y-3' : ''} 
        ${isDragging ? 'cursor-grabbing z-50' : 'cursor-pointer'}
        ${isCompleted ? 'opacity-80' : ''}`}
      style={{ 
        left: x, 
        top: y,
        transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.05)' : 'scale(1)'}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={onClick}
    >
      <svg
        width={width}
        height={height + (isHovered ? 12 : 8)}
        className={`${isGhost ? 'opacity-50' : ''}`}
        style={{ 
          filter: `drop-shadow(0 ${isHovered ? '8px' : '6px'} ${isHovered ? '8px' : '6px'} rgba(0,0,0,0.25))`,
          transition: 'all 0.2s ease-out',
          isolation: 'isolate'
        }}
      >
        <defs>
          <HexagonGradient id={id} color={color} isCompleted={isCompleted} />
          <clipPath id={`hexagon-clip-${id}`}>
            <polygon points={points.join(' ')} />
          </clipPath>
        </defs>

        <HexagonShape
          points={points}
          gradientId={`gradient-${id}`}
          isSelected={isSelected}
          isLinking={isLinking}
        />

        <HexagonTitle
          width={width}
          height={height}
          title={title}
          isCompleted={isCompleted}
        />

        {isHovered && !isGhost && !isCreating && onMarkComplete && onEdit && (
          <HexagonActions
            points={points}
            width={width}
            height={height}
            color={color}
            onMarkComplete={onMarkComplete}
            onEdit={onEdit}
          />
        )}
      </svg>
    </div>
  );
};