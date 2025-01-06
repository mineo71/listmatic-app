import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Task, Point } from '@/types/task';
import Hexagon from './Hexagon';
import HoneycombControls from './HoneycombControls';
import Connection from './Connection';

interface HexPosition extends Point {
  id: string;
  connectedTo?: string[];
}

interface HoneycombViewProps {
  tasks: Task[];
  onTaskAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  isAddingTask: boolean;
  onAddingTaskComplete: () => void;
  pendingTask: { title: string } | null;
}

const HoneycombView: React.FC<HoneycombViewProps> = ({
  tasks,
  onTaskAdd,
  onTaskUpdate,
  onTaskDelete,
  isAddingTask,
  onAddingTaskComplete,
  pendingTask
}) => {
  // View state
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Task placement state
  const [hexPositions, setHexPositions] = useState<HexPosition[]>([]);
  const [previewPosition, setPreviewPosition] = useState<Point | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Hexagon geometry constants
  const HEX_SIZE = 50;
  const HEX_WIDTH = HEX_SIZE * 2;
  const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

  // Initialize first hexagon position in the center
  useEffect(() => {
    if (tasks.length > 0 && hexPositions.length === 0) {
      setHexPositions([
        { id: tasks[0].id, x: 0, y: 0, connectedTo: [] }
      ]);
    }
  }, [tasks, hexPositions.length]);

  // Calculate valid snap points for a new hexagon
  const getSnapPoints = useCallback((hexPosition: Point): Point[] => {
    const angles = [0, 60, 120, 180, 240, 300];
    return angles.map(angle => {
      const radian = (angle * Math.PI) / 180;
      return {
        x: hexPosition.x + HEX_WIDTH * Math.cos(radian),
        y: hexPosition.y + HEX_WIDTH * Math.sin(radian)
      };
    });
  }, []);

  // Find nearest valid snap point to mouse position
  const findNearestSnapPoint = useCallback((mousePos: Point): Point | null => {
    const allSnapPoints = hexPositions.flatMap(pos => getSnapPoints(pos));
    const validSnapPoints = allSnapPoints.filter(point => 
      !hexPositions.some(pos => 
        Math.abs(pos.x - point.x) < HEX_WIDTH/2 && 
        Math.abs(pos.y - point.y) < HEX_HEIGHT/2
      )
    );

    return validSnapPoints.reduce((nearest, point) => {
      const distance = Math.hypot(mousePos.x - point.x, mousePos.y - point.y);
      const minDistance = nearest ? Math.hypot(mousePos.x - nearest.x, mousePos.y - nearest.y) : Infinity;
      return distance < minDistance ? point : nearest;
    }, null as Point | null);
  }, [hexPositions]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mousePos = {
      x: (e.clientX - rect.left - window.innerWidth/2) / zoom - center.x,
      y: (e.clientY - rect.top - window.innerHeight/2) / zoom - center.y
    };

    if (isAddingTask && pendingTask) {
      const snapPoint = findNearestSnapPoint(mousePos);
      setPreviewPosition(snapPoint);
    } else if (isDragging && dragStartPoint) {
      const dx = (e.clientX - dragStartPoint.x) / zoom;
      const dy = (e.clientY - dragStartPoint.y) / zoom;
      setCenter(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStartPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isAddingTask) {
      setIsDragging(true);
      setDragStartPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isAddingTask && previewPosition && pendingTask) {
      // Find the nearest existing hexagon to connect to
      const nearestHex = hexPositions.reduce((nearest, hex) => {
        const distance = Math.hypot(previewPosition.x - hex.x, previewPosition.y - hex.y);
        const nearestDistance = Math.hypot(previewPosition.x - nearest.x, previewPosition.y - nearest.y);
        return distance < nearestDistance ? hex : nearest;
      }, hexPositions[0]);

      onTaskAdd({
        title: pendingTask.title,
        completed: false
      });

      // Add new position with connection to nearest hexagon
      const newTaskId = (tasks[tasks.length - 1]?.id || 'new-task');
      setHexPositions(prev => [
        ...prev.map(hex => 
          hex.id === nearestHex.id
            ? { ...hex, connectedTo: [...(hex.connectedTo || []), newTaskId] }
            : hex
        ),
        { 
          ...previewPosition, 
          id: newTaskId, 
          connectedTo: [nearestHex.id] 
        }
      ]);
      
      setPreviewPosition(null);
      onAddingTaskComplete();
    }
    setIsDragging(false);
    setDragStartPoint(null);
  };

  const handleTaskDelete = (taskId: string) => {
    setHexPositions(prev => {
      const filtered = prev.filter(hex => hex.id !== taskId);
      return filtered.map(hex => ({
        ...hex,
        connectedTo: hex.connectedTo?.filter(id => id !== taskId) || []
      }));
    });
    onTaskDelete(taskId);
    setSelectedTaskId(null);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gray-50"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setDragStartPoint(null);
      }}
      onWheel={(e) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        setZoom(z => Math.max(0.5, Math.min(2, z + delta)));
      }}
    >
      <svg
        width="100%"
        height="100%"
        className="transition-transform duration-75"
      >
        <g transform={`translate(${window.innerWidth/2 + center.x}px, ${window.innerHeight/2 + center.y}px) scale(${zoom})`}>
          {/* Connections between hexagons */}
          {hexPositions.map((hex) => 
            hex.connectedTo?.map((connectedId) => {
              const connectedHex = hexPositions.find(h => h.id === connectedId);
              if (!connectedHex) return null;
              
              return (
                <Connection
                  key={`${hex.id}-${connectedId}`}
                  start={hex}
                  end={connectedHex}
                  active={selectedTaskId === hex.id || selectedTaskId === connectedId}
                />
              );
            })
          )}

          {/* Existing hexagons */}
          {tasks.map(task => {
            const position = hexPositions.find(pos => pos.id === task.id);
            if (!position) return null;
            
            return (
              <Hexagon
                key={task.id}
                task={task}
                size={HEX_SIZE}
                position={position}
                isSelected={task.id === selectedTaskId}
                onSelect={() => setSelectedTaskId(task.id)}
                onComplete={() => onTaskUpdate(task.id, { completed: !task.completed })}
                onDelete={() => handleTaskDelete(task.id)}
                onEdit={(newTitle) => onTaskUpdate(task.id, { title: newTitle })}
              />
            );
          })}

          {/* Preview hexagon */}
          {isAddingTask && previewPosition && pendingTask && (
            <Hexagon
              task={{
                id: 'preview',
                title: pendingTask.title,
                completed: false,
                createdAt: new Date()
              }}
              size={HEX_SIZE}
              position={previewPosition}
              isPreview
            />
          )}
        </g>
      </svg>

      <HoneycombControls
        zoom={zoom}
        onZoomIn={() => setZoom(z => Math.min(z + 0.1, 2))}
        onZoomOut={() => setZoom(z => Math.max(z - 0.1, 0.5))}
        onResetView={() => {
          setZoom(1);
          setCenter({ x: 0, y: 0 });
        }}
      />
    </div>
  );
};

export default HoneycombView;