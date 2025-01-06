// src/components/tasks/HoneycombView/Connection.tsx
import React from 'react';
import type { Point } from '@/types/task';

interface ConnectionProps {
  start: Point;
  end: Point;
  active?: boolean;
}

const Connection: React.FC<ConnectionProps> = ({ start, end, active = false }) => {
  return (
    <line
      x1={start.x}
      y1={start.y}
      x2={end.x}
      y2={end.y}
      strokeWidth={2}
      className={`
        transition-colors duration-200
        ${active ? 'stroke-amber-400' : 'stroke-gray-200'}
      `}
    />
  );
};

export default Connection;