// src/components/hive/HoneycombViewWrapper.tsx
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HoneycombView } from './HoneycombView';
import type { Hive, Honeycomb } from '@/types';

type ContextType = {
  hives: Hive[];
  onUpdateHoneycomb: (honeycomb: Honeycomb) => void;
};

export const HoneycombViewWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation();
  const { hives, onUpdateHoneycomb } = useOutletContext<ContextType>();

  // Find the honeycomb in the hives structure
  const findHoneycomb = (hives: Hive[]): Honeycomb | undefined => {
    for (const hive of hives) {
      // Check in current hive's honeycombs
      const found = hive.honeycombs.find(hc => hc.id === id);
      if (found) return found;

      // Check in subHives
      for (const subHive of hive.subHives) {
        const foundInSub = subHive.honeycombs.find(hc => hc.id === id);
        if (foundInSub) return foundInSub;
      }
    }
    return undefined;
  };

  const honeycomb = findHoneycomb(hives);

  if (!honeycomb) {
    // If honeycomb is not found, redirect to home
    navigate('/', { replace: true });
    return null;
  }

  return (
    <HoneycombView
      honeycomb={honeycomb}
      onUpdate={onUpdateHoneycomb}
    />
  );
};