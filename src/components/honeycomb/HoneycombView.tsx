// src/components/honeycomb/HoneycombView.tsx
import type { Honeycomb } from '@/types';
import { HoneycombCanvas } from './HoneycombCanvas';

interface HoneycombViewProps {
  honeycomb: Honeycomb;
}

export const HoneycombView = ({ honeycomb }: HoneycombViewProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{honeycomb.name}</h1>
        </div>
      </div>

      <div className="flex-1 relative">
        <HoneycombCanvas />
      </div>
    </div>
  );
};