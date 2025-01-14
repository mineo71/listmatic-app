import { useState, useEffect } from 'react';
import { HoneycombItem } from './HoneycombtTypes';

export const useHoneycombItems = (onProgressUpdate: (progress: number) => void) => {
    const [items, setItems] = useState<HoneycombItem[]>([]);

    useEffect(() => {
        const centerX = 0;
        const centerY = 0;

        setItems([{
            id: 'main',
            x: centerX,
            y: centerY,
            title: 'Main Goal',
            description: '',
            icon: 'Star',
            priority: 'high',
            completed: false,
            connections: [],
            color: '#FDE68A',
            isMain: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }]);
    }, []);

    useEffect(() => {
        const totalItems = items.filter(item => !item.isMain).length;
        const completedItems = items.filter(item => !item.isMain && item.completed).length;
        const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
        onProgressUpdate(progress);
    }, [items, onProgressUpdate]);

    return { items, setItems };
};

