import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HoneycombControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

const HoneycombControls: React.FC<HoneycombControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  const { t } = useTranslation();

  return (
    <div className="absolute top-4 right-4">
      <div className="bg-white rounded-md shadow-md flex">
        <button
          onClick={onZoomOut}
          disabled={zoom <= 0.5}
          className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 rounded-l-md"
          title={t('actions.zoomOut')}
        >
          <ZoomOut size={20} />
        </button>
        <div className="px-3 flex items-center border-l border-r border-gray-200 min-w-[4rem] justify-center">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={onZoomIn}
          disabled={zoom >= 2}
          className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          title={t('actions.zoomIn')}
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={onResetView}
          className="p-2 text-gray-600 hover:bg-gray-50 border-l border-gray-200 rounded-r-md"
          title={t('actions.resetView')}
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};

export default HoneycombControls;