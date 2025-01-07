// src/components/honeycomb/HoneycombViewWrapper.tsx
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import type { Hive, Honeycomb } from '@/types';
import { HoneycombCanvas } from '../honeycomb/HoneycombCanvas';

type ContextType = {
  hives: Hive[];
  onUpdateHoneycomb: (honeycomb: Honeycomb) => void;
};

export const HoneycombViewWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hives } = useOutletContext<ContextType>();

  const findHoneycomb = (hives: Hive[]): Honeycomb | undefined => {
    for (const hive of hives) {
      const found = hive.honeycombs.find(hc => hc.id === id);
      if (found) return found;

      for (const subHive of hive.subHives) {
        const foundInSub = subHive.honeycombs.find(hc => hc.id === id);
        if (foundInSub) return foundInSub;
      }
    }
    return undefined;
  };

  const honeycomb = findHoneycomb(hives);

  if (!honeycomb) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">{honeycomb.name}</h1>
      </div>
      <div className="flex-grow h-0">
        <HoneycombCanvas key={honeycomb.id} />
      </div>
    </div>
  );
};