import { RotateCcw, ZoomIn, ZoomOut, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MobileControlsMenuProps {
    zoom: number;
    handleReset: () => void;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    toggleTaskSidebar: () => void;
    isTaskSidebarOpen: boolean;
}

const MobileControlsMenu = ({zoom, handleReset, handleZoomIn, handleZoomOut, toggleTaskSidebar, isTaskSidebarOpen,}: MobileControlsMenuProps) => {
    const { t } = useTranslation();

    return (
        <div
            className={`sm:hidden fixed bottom-4 right-4 bg-white rounded-xl shadow-md flex items-center gap-3 px-4 py-2 z-50 ${
                isTaskSidebarOpen ? 'hidden' : ''
            }`}
        >
            <button
                onClick={handleReset}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title={t('actions.resetView')}
            >
                <RotateCcw size={20}/>
            </button>
            <button
                onClick={handleZoomOut}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title={t('actions.zoomOut')}
            >
                <ZoomOut size={20}/>
            </button>
            <span className="text-sm text-gray-700">{Math.round(zoom * 100)}%</span>
            <button
                onClick={handleZoomIn}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title={t('actions.zoomIn')}
            >
                <ZoomIn size={20}/>
            </button>
            <button
                onClick={toggleTaskSidebar}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title={t('actions.share')}
            >
                <List size={20}/>
            </button>
        </div>
    );
};

export default MobileControlsMenu;
