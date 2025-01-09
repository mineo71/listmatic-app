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
  isMain?: boolean;
  isCompleted?: boolean;
  isCreating?: boolean;
  connections: string[];
  connectedHexagons?: {
    id: string;
    x: number;
    y: number;
  }[];
  onClick?: () => void;
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
  isMain = false,
  isCompleted = false,
  isCreating = false,
  connectedHexagons = [],
  onClick,
  onMarkComplete,
  onEdit,
}: HexagonProps) => {
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

  const connectionPaths = useMemo(() => {
    return connectedHexagons.map(connected => {
      const dx = connected.x - x;
      const dy = connected.y - y;
      const angle = Math.atan2(dy, dx);
      
      const padding = size * 0.9;
      const startX = x + Math.cos(angle) * padding;
      const startY = y + Math.sin(angle) * padding;
      const endX = connected.x - Math.cos(angle) * padding;
      const endY = connected.y - Math.sin(angle) * padding;
      
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const curvature = 20;
      const controlX = midX - Math.sin(angle) * curvature;
      const controlY = midY + Math.cos(angle) * curvature;

      return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
    });
  }, [x, y, connectedHexagons, size]);

  const sideFaces = useMemo(() => {
    const depth = isHovered && !isCreating ? 12 : 8;
    return {
      right: `M ${points[1]} L ${points[2]} L ${points[2].x},${points[2].y + depth} L ${points[1].x},${points[1].y + depth} Z`,
      bottom: `M ${points[2]} L ${points[3]} L ${points[3].x},${points[3].y + depth} L ${points[2].x},${points[2].y + depth} Z`,
      left: `M ${points[3]} L ${points[4]} L ${points[4].x},${points[4].y + depth} L ${points[3].x},${points[3].y + depth} Z`,
    };
  }, [points, isHovered, isCreating]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGhost && onClick) {
      onClick();
    } else if (!isMain && !isCreating && onClick) {
      onClick();
    }
  };

  return (
    <>
      {!isGhost && connectionPaths.map((path, index) => (
        <svg
          key={`connection-${index}`}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <path
            d={path}
            stroke={darkenColor(color, 20)}
            strokeWidth="3"
            fill="none"
            strokeDasharray="5,5"
            className="transition-all duration-300"
          />
        </svg>
      ))}
      
      <div
        className={`absolute transform transition-all duration-200 ease-out
          ${isHovered && !isCreating ? '-translate-y-3' : ''} 
          ${isCompleted ? 'opacity-80' : ''}
          ${isMain ? 'cursor-default' : isCreating ? 'cursor-default' : 'cursor-pointer'}
          ${isCreating ? 'pointer-events-none' : ''}`}
        style={{ 
          left: x, 
          top: y,
          transform: `translate(-50%, -50%) ${isHovered && !isCreating ? 'scale(1.05)' : 'scale(1)'}`,
          zIndex: isHovered ? 10 : 1
        }}
        onMouseEnter={() => !isCreating && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <svg
          width={width}
          height={height + (isHovered && !isCreating ? 12 : 8)}
          className={isGhost ? 'opacity-80 animate-pulse' : ''}
          style={{ 
            filter: isGhost ? 'none' : `drop-shadow(0 ${isHovered && !isCreating ? '12px 24px' : '8px 16px'} rgba(0,0,0,${isHovered && !isCreating ? '0.2' : '0.15'}))`,
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
            strokeWidth={isSelected || isMain ? "3" : "2"}
            className="transition-all duration-200"
          />

          <g transform={`translate(${width/2}, ${height/2})`}>
            {isCompleted && !isMain && (
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
                ${isCompleted && !isMain ? 'line-through opacity-70' : ''}`}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
            >
              {title}
            </text>
          </g>

          {isHovered && !isGhost && !isCreating && !isMain && (
            <g>
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

              <rect
                x="0"
                y={height/2}
                width={width}
                height={height/2}
                fill={`${color}CC`}
                className="cursor-pointer transition-opacity backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
              />
              <foreignObject x={width/2-12} y={height*3/4-12} width="24" height="24">
                <Settings className="text-gray-600" />
              </foreignObject>
            </g>
          )}
        </svg>
      </div>
    </>
  );
};