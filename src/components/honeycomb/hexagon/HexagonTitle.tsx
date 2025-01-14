import { ICONS_MAP } from '@/utils/icons';
import type { TaskIcon } from '@/types';

interface HexagonTitleProps {
  width: number;
  height: number;
  title?: string;
  isCompleted: boolean;
  icon?: TaskIcon;
}

const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.slice(0, maxLength) + '..' : text;
};

export const HexagonTitle = ({ width, height, title, isCompleted, icon }: HexagonTitleProps) => {
  // Get the icon component if it exists and isn't 'None'
  const IconComponent = icon && icon !== 'None' ? ICONS_MAP[icon as keyof typeof ICONS_MAP] : null;

  return (
    <g transform={`translate(${width/2}, ${height/2})`}>
      {IconComponent && (
        <foreignObject
          x="-16"
          y={title ? "-30" : "-17"}
          width="34"
          height="34"
          className="pointer-events-none"
        >
          <div className="flex items-center justify-center w-full h-full">
            <IconComponent className="w-full h-full text-gray-800" />
          </div>
        </foreignObject>
      )}
      
      {title && (
        <text
          dominantBaseline="middle"
          textAnchor="middle"
          y={IconComponent ? "20" : "0"}
          className={`text-sm font-semibold fill-gray-800 pointer-events-none select-none
            ${isCompleted ? 'line-through opacity-80' : ''}`}
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
        >
          {truncateText(title, IconComponent ? 9 : 11)}
        </text>
      )}

      {isCompleted && (
        <path
          d="M-30,-5 L-10,15 L30,-20"
          stroke="#22C55E"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw"
        />
      )}
    </g>
  );
};