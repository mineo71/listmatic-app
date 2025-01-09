import React, { useState, useMemo } from 'react';
import { Check, Settings } from 'lucide-react';

interface HexagonProps {
  id: string;
  x: number;
  y: number;
  title: string;
  color?: string;
  isGhost?: boolean;
  isSelected?: boolean;
  isLinking?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  onDragStart?: (id: string, e: React.MouseEvent) => void;
  onDragEnd?: () => void;
  onMarkComplete?: () => void;
  onEdit?: () => void;
}

const darkenColor = (hex: string, percent: number) => {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  r = Math.floor(r * (100 - percent) / 100);
  g = Math.floor(g * (100 - percent) / 100);
  b = Math.floor(b * (100 - percent) / 100);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

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

  const points = useMemo(() => {
    const vertices = [
      [size * Math.cos(0), size * Math.sin(0)],
      [size * Math.cos(Math.PI / 3), size * Math.sin(Math.PI / 3)],
      [size * Math.cos((2 * Math.PI) / 3), size * Math.sin((2 * Math.PI) / 3)],
      [size * Math.cos(Math.PI), size * Math.sin(Math.PI)],
      [size * Math.cos((4 * Math.PI) / 3), size * Math.sin((4 * Math.PI) / 3)],
      [size * Math.cos((5 * Math.PI) / 3), size * Math.sin((5 * Math.PI) / 3)],
    ];

    return vertices.map(([px, py]) => ({
      x: px + size,
      y: py + (height / 2),
      toString() { return `${this.x},${this.y}`; }
    }));
  }, [size, height]);

  const sideFaces = useMemo(() => {
    const depth = isHovered ? 12 : 8;
    return {
      right: `M ${points[1]} L ${points[2]} L ${points[2].x},${points[2].y + depth} L ${points[1].x},${points[1].y + depth} Z`,
      bottom: `M ${points[2]} L ${points[3]} L ${points[3].x},${points[3].y + depth} L ${points[2].x},${points[2].y + depth} Z`,
      left: `M ${points[3]} L ${points[4]} L ${points[4].x},${points[4].y + depth} L ${points[3].x},${points[3].y + depth} Z`,
    };
  }, [points, isHovered]);

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
      onClick={(e) => {
        e.stopPropagation();
        if (!isHovered) {
          onClick?.(e);
        }
      }}
    >
      <svg
        width={width}
        height={height + (isHovered ? 12 : 8)}
        className={`${isGhost ? 'opacity-50' : ''}`}
        style={{ 
          filter: `drop-shadow(0 ${isHovered ? '12px 24px' : '8px 16px'} rgba(0,0,0,${isHovered ? '0.2' : '0.15'}))`,
          transition: 'all 0.2s ease-out'
        }}
      >
        <defs>
          <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isCompleted ? darkenColor(color, 20) : color} stopOpacity="1" />
            <stop offset="100%" stopColor={isCompleted ? darkenColor(color, 30) : color} stopOpacity="0.9" />
          </linearGradient>
          
          <linearGradient id={`side-gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={darkenColor(color, 20)} stopOpacity="0.9" />
            <stop offset="100%" stopColor={darkenColor(color, 40)} stopOpacity="0.4" />
          </linearGradient>

          <clipPath id={`hexagon-clip-${id}`}>
            <polygon points={points.join(' ')} />
          </clipPath>
        </defs>

        <g className="transition-transform duration-200">
          <path d={sideFaces.left} fill={`url(#side-gradient-${id})`} opacity="0.7" />
          <path d={sideFaces.bottom} fill={`url(#side-gradient-${id})`} opacity="0.85" />
          <path d={sideFaces.right} fill={`url(#side-gradient-${id})`} opacity="0.7" />
        </g>

        <polygon
          points={points.join(' ')}
          fill={`url(#gradient-${id})`}
          stroke={isSelected ? '#D97706' : '#F59E0B'}
          strokeWidth={isSelected ? "3" : "2"}
          className={`transition-all duration-200 ${
            isLinking ? '!stroke-blue-500 stroke-[3]' : ''
          }`}
        />

        <g transform={`translate(${width/2}, ${height/2})`}>
          {isCompleted && (
            <path
              d="M-30,-5 L-10,15 L30,-20"
              stroke="#22C55E"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw"
            />
          )}
          
          <text
            dominantBaseline="middle"
            textAnchor="middle"
            className={`text-base font-semibold fill-gray-800 pointer-events-none select-none
              ${isCompleted ? 'line-through opacity-70' : ''}`}
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          >
            {title}
          </text>
        </g>

        {/* Action Overlay */}
        {isHovered && !isGhost && (
          <g clipPath={`url(#hexagon-clip-${id})`}>
            {/* Top half - Complete button */}
            <rect
              x="0"
              y="0"
              width={width}
              height={height/2}
              fill={`${color}CC`}
              className="cursor-pointer transition-opacity backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onMarkComplete?.();
              }}
            />
            <foreignObject x={width/2-12} y={height/4-12} width="24" height="24">
              <Check className="text-green-600" />
            </foreignObject>

            {/* Bottom half - Settings button */}
            <rect
              x="0"
              y={height/2}
              width={width}
              height={height/2}
              fill={`${color}CC`}
              className="cursor-pointer transition-opacity backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEdit?.();
                return false;
              }}
            />
            <foreignObject x={width/2-12} y={height*3/4-12} width="24" height="24">
              <div onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEdit?.();
                return false;
              }}>
                <Settings className="text-gray-600" />
              </div>
            </foreignObject>
          </g>
        )}
      </svg>
    </div>
  );
};