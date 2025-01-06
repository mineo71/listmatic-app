import React from 'react';
import { ZoomIn, ZoomOut, Plus, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HoneycombControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAddTask: () => void;
  onResetView: () => void;
  isAddingTask: boolean;
}

const HoneycombControls: React.FC<HoneycombControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onAddTask,
  onResetView,
  isAddingTask,
}) => {
  const { t } = useTranslation();

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={onAddTask}
          className={`
            p-2 rounded-md shadow-md
            ${isAddingTask ? 'bg-amber-100 text-amber-600' : 'bg-white text-gray-600'}
            hover:bg-amber-50 transition-colors
          `}
          title={t('actions.addTask')}
        >
          <Plus size={20} />
        </button>

        <div className="bg-white rounded-md shadow-md flex">
          <button
            onClick={onZoomOut}
            disabled={zoom <= 0.5}
            className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 rounded-l-md"
            title={t('actions.zoomOut')}
          >
            <ZoomOut size={20} />
          </button>
          <div className="px-3 flex items-center border-l border-r border-gray-200">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={onZoomIn}
            disabled={zoom >= 2}
            className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 rounded-r-md"
            title={t('actions.zoomIn')}
          >
            <ZoomIn size={20} />
          </button>
        </div>
      </div>

      <button
        onClick={onResetView}
        className="p-2 rounded-md shadow-md bg-white text-gray-600 hover:bg-gray-50"
        title={t('actions.resetView')}
      >
        <RotateCcw size={20} />
      </button>
    </div>
  );
};

export default HoneycombControls;