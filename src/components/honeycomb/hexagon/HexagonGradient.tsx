interface HexagonGradientProps {
  id: string;
  color: string;
  isCompleted: boolean;
}

export const HexagonGradient = ({ id, color, isCompleted }: HexagonGradientProps) => {
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

  return (
    <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={isCompleted ? darkenColor(color, 20) : color} stopOpacity="1" />
      <stop offset="100%" stopColor={isCompleted ? darkenColor(color, 30) : color} stopOpacity="0.9" />
    </linearGradient>
  );
};