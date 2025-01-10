// src/components/honeycomb/hexagon/HexagonActions.tsx
import React from 'react';
import { Check, Settings } from 'lucide-react';
import type { Point } from './types';

interface HexagonActionsProps {
  points: Point[];
  width: number;
  height: number;
  color: string;
  onMarkComplete: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
}

export const HexagonActions = ({ 
  points, 
  width, 
  height, 
  color, 
  onMarkComplete, 
  onEdit 
}: HexagonActionsProps) => {
  // Create the full hexagon path for the overlay
  const hexagonPath = points.map((point, i) => 
    `${i === 0 ? 'M' : 'L'} ${point.x},${point.y}`
  ).join(' ') + ' Z';

  // Create dividing line for top and bottom sections
  const dividerPath = `M ${points[5].x},${points[5].y} L ${points[2].x},${points[2].y}`;

  const handleTopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkComplete(e);
  };

  const handleBottomClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(e);
  };

  return (
    <g>
      {/* Background blur and color overlay */}
      <defs>
        <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <clipPath id="hexagonClip">
          <path d={hexagonPath} />
        </clipPath>
      </defs>

      {/* Full hexagon background with blur */}
      <path
        d={hexagonPath}
        fill={`${color}E6`}
        filter="url(#blur)"
        style={{
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Clickable areas */}
      <g clipPath="url(#hexagonClip)">
        {/* Top half - Complete */}
        <path
          d={`M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y} L ${points[2].x},${points[2].y} L ${points[5].x},${points[5].y} Z`}
          fill="transparent"
          className="cursor-pointer"
          onClick={handleTopClick}
        />

        {/* Bottom half - Edit */}
        <path
          d={`M ${points[2].x},${points[2].y} L ${points[3].x},${points[3].y} L ${points[4].x},${points[4].y} L ${points[5].x},${points[5].y} Z`}
          fill="transparent"
          className="cursor-pointer"
          onClick={handleBottomClick}
        />
      </g>

      {/* Action buttons with higher z-index */}
      <g style={{ pointerEvents: 'none' }}>
        {/* Complete button */}
        <foreignObject 
          x={width/2-12} 
          y={height/4-12} 
          width="24" 
          height="24"
        >
          <div className="backdrop-blur-none flex items-center justify-center">
            <Check className="text-black w-6 h-6" style={{ strokeWidth: 2.5 }} />
          </div>
        </foreignObject>

        {/* Edit button */}
        <foreignObject 
          x={width/2-12} 
          y={height*3/4-12} 
          width="24" 
          height="24"
        >
          <div className="backdrop-blur-none flex items-center justify-center">
            <Settings className="text-black w-6 h-6" style={{ strokeWidth: 2.5 }} />
          </div>
        </foreignObject>
      </g>

      {/* Visual separator line */}
      <path
        d={dividerPath}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="1"
        strokeDasharray="4 4"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  );
};