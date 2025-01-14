import { HoneycombItem, Offset } from './HoneycombtTypes';
import { HEXAGON_HEIGHT, HEXAGON_WIDTH } from './HoneyComb';

export const getAvailablePositions = (centerX: number, centerY: number, items: HoneycombItem[]) => {
    const positions = [
        { x: centerX, y: centerY - HEXAGON_HEIGHT },
        { x: centerX + HEXAGON_WIDTH * 0.75, y: centerY - HEXAGON_HEIGHT * 0.5 },
        { x: centerX + HEXAGON_WIDTH * 0.75, y: centerY + HEXAGON_HEIGHT * 0.5 },
        { x: centerX, y: centerY + HEXAGON_HEIGHT },
        { x: centerX - HEXAGON_WIDTH * 0.75, y: centerY + HEXAGON_HEIGHT * 0.5 },
        { x: centerX - HEXAGON_WIDTH * 0.75, y: centerY - HEXAGON_HEIGHT * 0.5 },
    ];

    return positions.filter(pos =>
        !items.some(item =>
            Math.abs(item.x - pos.x) < 10 && Math.abs(item.y - pos.y) < 10
        )
    );
};

export const findClosestPosition = (mouseX: number, mouseY: number, items: HoneycombItem[]): Offset | null => {
    let closestDistance = Infinity;
    let closestPosition = null;

    items.forEach(item => {
        const availablePositions = getAvailablePositions(item.x, item.y, items);
        availablePositions.forEach(pos => {
            const distance = Math.sqrt(
                Math.pow(mouseX - pos.x, 2) + Math.pow(mouseY - pos.y, 2)
            );
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPosition = pos;
            }
        });
    });

    return closestPosition && closestDistance < HEXAGON_WIDTH ? closestPosition : null;
};

