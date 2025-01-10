import type { Point } from './types';

interface HexagonShapeProps {
  points: Point[];
  gradientId: string;
  isSelected: boolean;
  isLinking: boolean;
}

export const HexagonShape = ({ points, gradientId, isSelected, isLinking }: HexagonShapeProps) => (
  <polygon
    points={points.join(' ')}
    fill={`url(#${gradientId})`}
    stroke={isSelected ? '#D97706' : '#F59E0B'}
    strokeWidth={isSelected ? "3" : "2"}
    className={`transition-all duration-200 ${
      isLinking ? '!stroke-blue-500 stroke-[3]' : ''
    }`}
  />
);