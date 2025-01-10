import { useState } from 'react';
import { HoneycombCanvas } from './HoneycombCanvas';

export const HoneycombView = () => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);


  //TODO: Implement progress update
  const handleProgressUpdate = (progress: number) => {
    console.log(`Progress: ${progress}%`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative">
        <HoneycombCanvas
          zoom={zoom}
          setZoom={setZoom}
          offset={offset}
          setOffset={setOffset}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onProgressUpdate={handleProgressUpdate}
        />
      </div>
    </div>
  );
};