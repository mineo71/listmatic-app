// src/data/mockData.ts
import type { Hive } from '@/types';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

export const initialHives: Hive[] = [
  {
    id: '1',
    name: 'Work Projects',
    description: 'All active work projects and tasks',
    icon: 'Briefcase',
    color: '#FDE68A',
    honeycombs: [
      {
        id: '1-1',
        name: 'Website Redesign',
        description: 'Company website redesign project',
        icon: 'Code',
        color: '#93C5FD',
        tasks: [
          {
            id: '1-1-1',
            title: 'Homepage Layout',
            description: 'Create new responsive layout for homepage',
            icon: 'Code',
            priority: 'high',
            completed: false,
            deadline: tomorrow,
            color: '#93C5FD',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '1-1-2',
            title: 'Mobile Navigation',
            description: 'Implement mobile-friendly navigation menu',
            icon: 'Code',
            priority: 'medium',
            completed: true,
            deadline: nextWeek,
            color: '#93C5FD',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '1-2',
        name: 'Marketing Campaign',
        description: 'Q1 Marketing Campaign Planning',
        icon: 'BarChart',
        color: '#F9A8D4',
        tasks: [
          {
            id: '1-2-1',
            title: 'Social Media Strategy',
            description: 'Develop social media content strategy for Q1',
            icon: 'MessageCircle',
            priority: 'high',
            completed: false,
            deadline: nextWeek,
            color: '#F9A8D4',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    subHives: [
      {
        id: '1-sub-1',
        name: 'Internal Tools',
        description: 'Internal tooling and automation projects',
        icon: 'Settings',
        color: '#A7F3D0',
        honeycombs: [
          {
            id: '1-sub-1-1',
            name: 'Analytics Dashboard',
            description: 'Internal analytics dashboard development',
            icon: 'PieChart',
            color: '#A7F3D0',
            tasks: [
              {
                id: '1-sub-1-1-1',
                title: 'Data Pipeline',
                description: 'Set up data pipeline for real-time analytics',
                icon: 'Cloud',
                priority: 'medium',
                completed: false,
                deadline: nextWeek,
                color: '#A7F3D0',
                createdAt: new Date(),
                updatedAt: new Date()
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
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Personal Goals',
    description: 'Personal development and goals tracking',
    icon: 'Target',
    color: '#C4B5FD',
    honeycombs: [
      {
        id: '2-1',
        name: 'Fitness Goals',
        description: 'Health and fitness tracking',
        icon: 'Heart',
        color: '#FCA5A5',
        tasks: [
          {
            id: '2-1-1',
            title: 'Morning Workout',
            description: '30-minute morning workout routine',
            icon: 'Timer',
            priority: 'medium',
            completed: false,
            deadline: tomorrow,
            color: '#FCA5A5',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2-2',
        name: 'Learning',
        description: 'Educational goals and courses',
        icon: 'FileText',
        color: '#6EE7B7',
        tasks: [
          {
            id: '2-2-1',
            title: 'TypeScript Course',
            description: 'Complete advanced TypeScript course',
            icon: 'Code',
            priority: 'high',
            completed: false,
            deadline: nextWeek,
            color: '#6EE7B7',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2-2-2',
            title: 'React Native Tutorial',
            description: 'Work through React Native crash course',
            icon: 'Code',
            priority: 'low',
            completed: false,
            deadline: nextWeek,
            color: '#6EE7B7',
            createdAt: new Date(),
            updatedAt: new Date()
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
    id: '3',
    name: 'Home Projects',
    description: 'Home improvement and organization',
    icon: 'Home',
    color: '#FBBF24',
    honeycombs: [
      {
        id: '3-1',
        name: 'Kitchen Renovation',
        description: 'Kitchen remodeling project planning',
        icon: 'Building',
        color: '#FCD34D',
        tasks: [
          {
            id: '3-1-1',
            title: 'Design Layout',
            description: 'Create kitchen layout design',
            icon: 'Building',
            priority: 'medium',
            completed: false,
            deadline: nextWeek,
            color: '#FCD34D',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '3-1-2',
            title: 'Get Quotes',
            description: 'Contact contractors for quotes',
            icon: 'FileText',
            priority: 'high',
            completed: false,
            deadline: nextWeek,
            color: '#FCD34D',
            createdAt: new Date(),
            updatedAt: new Date()
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