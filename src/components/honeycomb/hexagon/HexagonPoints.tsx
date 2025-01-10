import type { Point } from './types';

export const calculateHexagonPoints = (size: number, height: number): Point[] => {
  const points = [
    [size * Math.cos(0), size * Math.sin(0)],
    [size * Math.cos(Math.PI / 3), size * Math.sin(Math.PI / 3)],
    [size * Math.cos((2 * Math.PI) / 3), size * Math.sin((2 * Math.PI) / 3)],
    [size * Math.cos(Math.PI), size * Math.sin(Math.PI)],
    [size * Math.cos((4 * Math.PI) / 3), size * Math.sin((4 * Math.PI) / 3)],
    [size * Math.cos((5 * Math.PI) / 3), size * Math.sin((5 * Math.PI) / 3)],
  ];

  return points.map(([px, py]) => ({
    x: px + size,
    y: py + (height / 2),
    toString() { return `${this.x},${this.y}`; }
  }));
};