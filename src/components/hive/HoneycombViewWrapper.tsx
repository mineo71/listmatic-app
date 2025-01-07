import { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { RotateCcw, ZoomIn, ZoomOut, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Hive, Honeycomb } from '@/types';
import { HoneycombCanvas } from '../honeycomb/HoneycombCanvas';

type ContextType = {
  hives: Hive[];
  onUpdateHoneycomb: (honeycomb: Honeycomb) => void;
};

export const HoneycombViewWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hives } = useOutletContext<ContextType>();

  // View state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Recursively find honeycomb in hives and their subhives
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

  // Redirect to home if honeycomb not found
  if (!honeycomb) {
    navigate('/', { replace: true });
    return null;
  }

  // Handlers for view controls
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom(z => Math.min(z + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(z => Math.max(z - 0.1, 0.5));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with controls */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{honeycomb.name}</h1>
          
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title={t('actions.resetView')}
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title={t('actions.zoomIn')}
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title={t('actions.zoomOut')}
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title={isSidebarOpen ? t('actions.closeSidebar') : t('actions.openSidebar')}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-grow h-0">
        <HoneycombCanvas
          key={honeycomb.id}
          zoom={zoom}
          setZoom={setZoom}
          offset={offset}
          setOffset={setOffset}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </div>
    </div>
  );
};