import React, { useState, useRef, useCallback } from 'react';
import type { Task, Point } from '@/types/task';
import Hexagon from './Hexagon';
import HoneycombControls from './HoneycombControls';
import Connection from './Connection';
import TaskForm from '../shared/TaskForm';

interface HoneycombViewProps {
  tasks: Task[];
  onTaskAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
}

interface HexPosition extends Point {
  id: string;
  connectedTo?: string[];  // IDs of connected hexagons
}

const HoneycombView: React.FC<HoneycombViewProps> = ({
  tasks,
  onTaskAdd,
  onTaskUpdate,
  onTaskDelete
}) => {
  // View state
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Hexagon placement state
  const [hexPositions, setHexPositions] = useState<HexPosition[]>([
    // Start with center hexagon
    { id: tasks[0]?.id || 'center', x: 0, y: 0, connectedTo: [] }
  ]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<Point | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<Point | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Hexagon geometry constants
  const HEX_SIZE = 50;
  const HEX_WIDTH = HEX_SIZE * 2;
  const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

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

    if (isAddingMode) {
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
    if (!isAddingMode) {
      setIsDragging(true);
      setDragStartPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isAddingMode && previewPosition) {
      setPendingPosition(previewPosition);
      setShowTaskForm(true);
    }
    setIsDragging(false);
    setDragStartPoint(null);
  };

  const handleTaskDelete = (taskId: string) => {
    // Remove the hexagon and its connections
    setHexPositions(prev => {
      const filtered = prev.filter(hex => hex.id !== taskId);
      // Update connections that referenced the deleted hexagon
      return filtered.map(hex => ({
        ...hex,
        connectedTo: hex.connectedTo?.filter(id => id !== taskId) || []
      }));
    });
    onTaskDelete(taskId);
  };

  const handleTaskAdd = (title: string) => {
    if (pendingPosition) {
      const newTask = {
        title,
        completed: false
      };
      onTaskAdd(newTask);
      
      // Find the nearest existing hexagon to connect to
      const nearestHex = hexPositions.reduce((nearest, hex) => {
        const distance = Math.hypot(pendingPosition.x - hex.x, pendingPosition.y - hex.y);
        return distance < Math.hypot(pendingPosition.x - nearest.x, pendingPosition.y - nearest.y)
          ? hex
          : nearest;
      }, hexPositions[0]);

      // Add new position after task is created
      const newTaskId = (tasks[tasks.length - 1]?.id || 'new-task');
      
      // Update positions with new connections
      setHexPositions(prev => [
        ...prev.map(hex => 
          hex.id === nearestHex.id
            ? { ...hex, connectedTo: [...(hex.connectedTo || []), newTaskId] }
            : hex
        ),
        { 
          ...pendingPosition, 
          id: newTaskId, 
          connectedTo: [nearestHex.id] 
        }
      ]);
      
      setPendingPosition(null);
      setShowTaskForm(false);
      setIsAddingMode(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gray-50"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsDragging(false)}
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
                onEdit={() => setEditingTaskId(task.id)}
              />
            );
          })}

          {/* Preview hexagon */}
          {isAddingMode && previewPosition && (
            <Hexagon
              task={{
                id: 'preview',
                title: 'New Task',
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
        onAddTask={() => setIsAddingMode(true)}
        onResetView={() => {
          setZoom(1);
          setCenter({ x: 0, y: 0 });
        }}
        isAddingTask={isAddingMode}
      />

      {showTaskForm && (
        <TaskForm
          onSubmit={handleTaskAdd}
          onClose={() => {
            setShowTaskForm(false);
            setIsAddingMode(false);
            setPendingPosition(null);
          }}
        />
      )}
    </div>
  );
};

export default HoneycombView;