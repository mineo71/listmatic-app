// src/components/honeycomb/HoneycombHexagon.tsx
import React, { useState } from 'react';

interface HexagonProps {
  id: string;
  x: number;
  y: number;
  title: string;
  color?: string;
  isGhost?: boolean;
  isSelected?: boolean;
  isLinking?: boolean;
  onClick?: () => void;
  onDragStart?: (id: string, e: React.MouseEvent) => void;
  onDragEnd?: () => void;
  onDoubleClick?: () => void;
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
  onClick,
  onDragStart,
  onDragEnd,
  onDoubleClick,
}: HexagonProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const size = 60;
  const width = size * 2;
  const height = Math.sqrt(3) * size;

  const points = [
    [size * Math.cos(0), size * Math.sin(0)],
    [size * Math.cos(Math.PI / 3), size * Math.sin(Math.PI / 3)],
    [size * Math.cos((2 * Math.PI) / 3), size * Math.sin((2 * Math.PI) / 3)],
    [size * Math.cos(Math.PI), size * Math.sin(Math.PI)],
    [size * Math.cos((4 * Math.PI) / 3), size * Math.sin((4 * Math.PI) / 3)],
    [size * Math.cos((5 * Math.PI) / 3), size * Math.sin((5 * Math.PI) / 3)],
  ]
    .map(([x, y]) => `${x + size},${y + (height / 2)}`)
    .join(' ');

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
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
        isHovered ? 'translate-y-[calc(-50%-8px)]' : ''
      } ${isDragging ? 'cursor-grabbing z-50' : 'cursor-grab'}`}
      style={{ 
        left: x, 
        top: y,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <svg
        width={width}
        height={height}
        className={`${isGhost ? 'opacity-50' : ''}`}
        style={{ 
          filter: isHovered 
            ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' 
            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
          
          <filter id={`shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2" />
          </filter>
        </defs>

        <polygon
          points={points}
          fill={`url(#gradient-${id})`}
          stroke={isSelected ? '#D97706' : '#F59E0B'}
          strokeWidth="2"
          filter={`url(#shadow-${id})`}
          className={`transition-colors duration-200 ${
            isLinking ? '!stroke-blue-500 stroke-[3]' : ''
          }`}
        />

        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="text-base font-semibold fill-gray-800 pointer-events-none select-none"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
        >
          {title}
        </text>

        {/* Connection points - only show when hovered and not ghost */}
        {!isGhost && isHovered && (
          <>
            {/* Top */}
            <circle cx={width/2} cy="4" r="6" className="fill-orange-100 stroke-orange-300 stroke-2 cursor-pointer" />
            {/* Top Right */}
            <circle cx={width-15} cy={height/4} r="6" className="fill-orange-100 stroke-orange-300 stroke-2 cursor-pointer" />
            {/* Bottom Right */}
            <circle cx={width-15} cy={height*3/4} r="6" className="fill-orange-100 stroke-orange-300 stroke-2 cursor-pointer" />
            {/* Bottom */}
            <circle cx={width/2} cy={height-4} r="6" className="fill-orange-100 stroke-orange-300 stroke-2 cursor-pointer" />
            {/* Bottom Left */}
            <circle cx={15} cy={height*3/4} r="6" className="fill-orange-100 stroke-orange-300 stroke-2 cursor-pointer" />
            {/* Top Left */}
            <circle cx={15} cy={height/4} r="6" className="fill-orange-100 stroke-orange-300 stroke-2 cursor-pointer" />
          </>
        )}
      </svg>
    </div>
  );
};