import React, { useState, useMemo } from 'react';

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
  onDoubleClick?: () => void;
}

// Helper function to darken a hex color
const darkenColor = (hex: string, percent: number) => {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Darken
  r = Math.floor(r * (100 - percent) / 100);
  g = Math.floor(g * (100 - percent) / 100);
  b = Math.floor(b * (100 - percent) / 100);

  // Convert back to hex
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
  onDoubleClick,
}: HexagonProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate hexagon dimensions
  const size = 60; // Base size
  const width = size * 2;
  const height = Math.sqrt(3) * size;

  // Calculate points for the hexagon shape
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

  // Connection points coordinates (for the small circles)
  const connectionPoints = useMemo(() => [
    { x: width/2, y: 4, position: 'top' },
    { x: width-15, y: height/4, position: 'topRight' },
    { x: width-15, y: height*3/4, position: 'bottomRight' },
    { x: width/2, y: height-4, position: 'bottom' },
    { x: 15, y: height*3/4, position: 'bottomLeft' },
    { x: 15, y: height/4, position: 'topLeft' },
  ], [width, height]);

  // Event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button === 0) { // Left click only
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

  // Generate SVG path for side faces (2.5D effect)
  const sideFaces = useMemo(() => {
    const depth = isHovered ? 12 : 8; // Depth of 3D effect
    return {
      right: `M ${points[1]} L ${points[2]} L ${points[2].x},${points[2].y + depth} L ${points[1].x},${points[1].y + depth} Z`,
      bottomRight: `M ${points[2]} L ${points[3]} L ${points[3].x},${points[3].y + depth} L ${points[2].x},${points[2].y + depth} Z`,
      bottomLeft: `M ${points[3]} L ${points[4]} L ${points[4].x},${points[4].y + depth} L ${points[3].x},${points[3].y + depth} Z`,
      rightShadow: `M ${points[0]} L ${points[1]} L ${points[1].x},${points[1].y + depth} L ${points[0].x},${points[0].y + depth} Z`
    };
  }, [points, isHovered]);

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
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.();
      }}
    >
      <svg
        width={width}
        height={height + (isHovered ? 12 : 8)} // Add space for 3D effect
        className={`${isGhost ? 'opacity-50' : ''}`}
        style={{ 
          filter: `drop-shadow(0 ${isHovered ? '12px 24px' : '8px 16px'} rgba(0,0,0,${isHovered ? '0.2' : '0.15'}))`,
          transition: 'all 0.2s ease-out'
        }}
      >
        <defs>
          {/* Main face gradient */}
          <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isCompleted ? darkenColor(color, 20) : color} stopOpacity="1" />
            <stop offset="100%" stopColor={isCompleted ? darkenColor(color, 30) : color} stopOpacity="0.9" />
          </linearGradient>
          
          {/* Side face gradient */}
          <linearGradient id={`side-gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={darkenColor(color, 20)} stopOpacity="0.9" />
            <stop offset="100%" stopColor={darkenColor(color, 40)} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Side faces for 2.5D effect */}
        <g className="transition-transform duration-200">
          <path
            d={sideFaces.right}
            fill={`url(#side-gradient-${id})`}
            className="transition-all duration-200"
            opacity="0.7"
          />
          <path
            d={sideFaces.bottomRight}
            fill={`url(#side-gradient-${id})`}
            className="transition-all duration-200"
            opacity="0.85"
          />
          <path
            d={sideFaces.bottomLeft}
            fill={`url(#side-gradient-${id})`}
            className="transition-all duration-200"
            opacity="0.7"
          />
          <path
            d={sideFaces.rightShadow}
            fill={`url(#side-gradient-${id})`}
            className="transition-all duration-200"
            opacity="0.7"
          />
        </g>

        {/* Main hexagon face */}
        <polygon
          points={points.join(' ')}
          fill={`url(#gradient-${id})`}
          stroke={isSelected ? '#D97706' : '#F59E0B'}
          strokeWidth={isSelected ? "3" : "2"}
          className={`transition-all duration-200 ${
            isLinking ? '!stroke-blue-500 stroke-[3]' : ''
          }`}
        />

        {/* Content group */}
        <g transform={`translate(${width/2}, ${height/2})`}>
          {/* Completion checkmark */}
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
          
          {/* Title text */}
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

        {/* Connection points - only show when hovered and not ghost */}
        {!isGhost && isHovered && (
          <g>
            {connectionPoints.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="6"
                className="fill-orange-100 stroke-orange-300 stroke-2 cursor-pointer
                  hover:fill-orange-200 hover:stroke-orange-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle connection point click
                }}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};