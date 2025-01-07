// src/data/mockData.ts
import type { Hive } from '@/types';

export const initialHives: Hive[] = [
  {
    id: '1',
    name: 'Work Tasks',
    honeycombs: [
      {
        id: '1-1',
        name: 'Daily Tasks',
        tasks: [

        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    subHives: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Personal Projects',
    honeycombs: [
      {
        id: '2-1',
        name: 'Blog Ideas',
        tasks: [
          
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    subHives: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];