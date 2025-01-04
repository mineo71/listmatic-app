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
          {
            id: '1-1-1',
            title: 'Check emails',
            completed: false,
            createdAt: new Date()
          },
          {
            id: '1-1-2',
            title: 'Team meeting',
            completed: true,
            createdAt: new Date()
          }
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
          {
            id: '2-1-1',
            title: 'Write first draft',
            completed: false,
            createdAt: new Date()
          }
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