interface HexagonTitleProps {
  width: number;
  height: number;
  title: string;
  isCompleted: boolean;
}

export const HexagonTitle = ({ width, height, title, isCompleted }: HexagonTitleProps) => (
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
);