import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Wand2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HoneycombHexagon } from './hexagon/HoneycombHexagon';
import { HoneycombEditModal } from './HoneycombEditModal';
import TaskSidebar from './TaskSidebar';
import toast from 'react-hot-toast';
import type { HoneycombItem, TaskIcon } from '@/types';

interface Offset {
  x: number;
  y: number;
}

interface HoneycombCanvasProps {
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  offset: Offset;
  setOffset: (offset: Offset | ((prev: Offset) => Offset)) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onProgressUpdate: (progress: number) => void;
}

const HEXAGON_SIZE = 60;
const HEXAGON_HEIGHT = Math.sqrt(3) * HEXAGON_SIZE;
const HEXAGON_WIDTH = 2 * HEXAGON_SIZE;

export const HoneycombCanvas = ({
  zoom,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setZoom,
  offset,
  setOffset,
  isSidebarOpen,
  setIsSidebarOpen,
  onProgressUpdate
}: HoneycombCanvasProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  
  const [items, setItems] = useState<HoneycombItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [ghostPosition, setGhostPosition] = useState<Offset | null>(null);
  const [editingItem, setEditingItem] = useState<HoneycombItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalCreating, setIsModalCreating] = useState(false);
  const [pendingHexagon, setPendingHexagon] = useState<HoneycombItem | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = 0;
      const centerY = 0;
      
      setItems([{
        id: 'main',
        x: centerX,
        y: centerY,
        title: 'Main Goal',
        description: '',
        icon: 'Star',
        priority: 'high',
        completed: false,
        connections: [],
        color: '#FDE68A',
        isMain: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);

      setOffset({
        x: rect.width / 2,
        y: rect.height / 2
      });
    }
  }, []);

  useEffect(() => {
    const totalItems = items.filter(item => !item.isMain).length;
    const completedItems = items.filter(item => !item.isMain && item.completed).length;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    onProgressUpdate(progress);
  }, [items, onProgressUpdate]);

  const getAvailablePositions = (centerX: number, centerY: number) => {
    const positions = [
      { x: centerX, y: centerY - HEXAGON_HEIGHT },
      { x: centerX + HEXAGON_WIDTH * 0.75, y: centerY - HEXAGON_HEIGHT * 0.5 },
      { x: centerX + HEXAGON_WIDTH * 0.75, y: centerY + HEXAGON_HEIGHT * 0.5 },
      { x: centerX, y: centerY + HEXAGON_HEIGHT },
      { x: centerX - HEXAGON_WIDTH * 0.75, y: centerY + HEXAGON_HEIGHT * 0.5 },
      { x: centerX - HEXAGON_WIDTH * 0.75, y: centerY - HEXAGON_HEIGHT * 0.5 },
    ];

    return positions.filter(pos => 
      !items.some(item => 
        Math.abs(item.x - pos.x) < 10 && Math.abs(item.y - pos.y) < 10
      )
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isCreating && !isEditModalOpen) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      
      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else if (isCreating && containerRef.current && !isEditModalOpen) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoom - (offset.x / zoom);
      const mouseY = (e.clientY - rect.top) / zoom - (offset.y / zoom);
      
      let closestDistance = Infinity;
      let closestPosition = null;
      
      items.forEach(item => {
        const availablePositions = getAvailablePositions(item.x, item.y);
        availablePositions.forEach(pos => {
          const distance = Math.sqrt(
            Math.pow(mouseX - pos.x, 2) + Math.pow(mouseY - pos.y, 2)
          );
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPosition = pos;
          }
        });
      });

      if (closestPosition && closestDistance < HEXAGON_WIDTH) {
        setGhostPosition(closestPosition);
      } else {
        setGhostPosition(null);
      }
    }
  }, [isCreating, zoom, offset, items, isEditModalOpen]);

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  const createNewHexagon = () => {
    if (!ghostPosition || !containerRef.current) return;

    const newItem: HoneycombItem = {
      id: Date.now().toString(),
      x: ghostPosition.x,
      y: ghostPosition.y,
      title: 'New Task',
      description: '',
      icon: 'None',
      priority: 'medium',
      completed: false,
      connections: [],
      color: '#FDE68A',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const closestItem = items.reduce((closest, item) => {
      const distance = Math.sqrt(
        Math.pow(item.x - ghostPosition.x, 2) + 
        Math.pow(item.y - ghostPosition.y, 2)
      );
      if (!closest || distance < closest.distance) {
        return { item, distance };
      }
      return closest;
    }, null as { item: HoneycombItem; distance: number; } | null);

    setPendingHexagon({
      ...newItem,
      connections: closestItem ? [closestItem.item.id] : []
    });

    setEditingItem(newItem);
    setIsEditModalOpen(true);
    setIsModalCreating(true);
    setIsCreating(false);
    setGhostPosition(null);
  };

  const handleGhostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditModalOpen) {
      createNewHexagon();
    }
  };

  const handleMarkComplete = (id: string) => {
    const item = items.find(i => i.id === id);
    
    if (item?.isMain) {
      const otherItems = items.filter(i => !i.isMain);
      const allOthersCompleted = otherItems.every(i => i.completed);
      
      if (!allOthersCompleted) {
        toast.error(t('messages.completeOtherTasks'));
        return;
      }
      
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      ));
      
      if (!item.completed) {
        toast.success(t('messages.taskCompleted'));
      }
      return;
    }
    
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    setIsModalCreating(false);
    setPendingHexagon(null); // Clear pending hexagon on cancel
  };

  const handleEditSubmit = (data: { title: string; color: string; icon: TaskIcon; description: string }) => {
    if (editingItem && pendingHexagon) {
      // Only create the hexagon when the modal is submitted
      const hexagonToAdd = {
        ...pendingHexagon,
        title: data.title,
        color: data.color,
        icon: data.icon,
        description: data.description
      };

      if (pendingHexagon.connections.length > 0) {
        setItems(prev => [
          ...prev.map(item => 
            pendingHexagon.connections.includes(item.id)
              ? { ...item, connections: [...item.connections, hexagonToAdd.id] }
              : item
          ),
          hexagonToAdd
        ]);
      } else {
        setItems(prev => [...prev, hexagonToAdd]);
      }
    } else if (editingItem) {
      // Handle regular edit
      setItems(prev => prev.map(item => 
        item.id === editingItem.id
          ? { ...item, ...data }
          : item
      ));
    }
    
    setIsEditModalOpen(false);
    setEditingItem(null);
    setIsModalCreating(false);
    setPendingHexagon(null);
  };

  const handleDeleteItem = () => {
    if (editingItem && !editingItem.isMain) {
      setItems(prev => prev.map(item => ({
        ...item,
        connections: item.connections.filter(id => id !== editingItem.id)
      })));
      
      setItems(prev => prev.filter(item => item.id !== editingItem.id));
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleSidebarEditClick = (id: string) => {
    if (isCreating) return;
    
    const item = items.find(i => i.id === id);
    if (item) {
      setEditingItem(item);
      setIsEditModalOpen(true);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gray-50"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dynamic Background */}
      <div 
        className="absolute w-[200vw] h-[200vh] left-[-50vw] top-[-50vh]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px, 50px 50px, 25px 25px, 25px 25px',
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      />

        <div className="absolute top-4 left-4 z-10 flex">
          <button
              onClick={() => setIsCreating(!isCreating)}
              className={`flex items-center px-4 py-2 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all ${
                  isCreating ? 'bg-amber-500 text-white' : 'bg-white hover:bg-gray-50'
              }`}
          >
            {isCreating ? <X size={22} /> : <Plus size={22} />}
            <span className="font-xl">
            {isCreating ? t('actions.done') : t('actions.addHexagon')}
          </span>
          </button>
          <button
              className="flex items-center px-4 py-2 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all bg-white hover:bg-gray-50 ml-2"
          >
            <Wand2 size={22} />
          </button>
        </div>

      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${zoom})`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
          }}
        >
          {items.map(item => (
            <HoneycombHexagon
              key={item.id}
              {...item}
              isSelected={selectedItemId === item.id}
              isCreating={isCreating}
              connectedHexagons={items.filter(other => 
                item.connections.includes(other.id)
              ).map(other => ({
                id: other.id,
                x: other.x,
                y: other.y
              }))}
              onClick={() => !isCreating && setSelectedItemId(item.id)}
              onMarkComplete={() => !isCreating && handleMarkComplete(item.id)}
              onEdit={() => !isCreating && handleSidebarEditClick(item.id)}
            />
          ))}

          {isCreating && ghostPosition && (
            <HoneycombHexagon
              id="ghost"
              x={ghostPosition.x}
              y={ghostPosition.y}
              title="+"
              isGhost
              isCreating={isCreating}
              connections={[]}
              color="rgba(251, 146, 60, 0.8)"
              onClick={handleGhostClick}
            />
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={(e) => e.stopPropagation()}
          />
      )}

      <TaskSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        items={items}
        selectedItemId={selectedItemId}
        onItemClick={(id) => {
          if (isCreating) return;
          setSelectedItemId(id);
          const item = items.find(i => i.id === id);
          if (item && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setOffset({
              x: (rect.width / 2 / zoom) - item.x,
              y: (rect.height / 2 / zoom) - item.y
            });
          }
        }}
        onEditClick={handleSidebarEditClick}
      />

      <HoneycombEditModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        onSubmit={handleEditSubmit}
        onDelete={handleDeleteItem}
        initialData={editingItem ? {
          title: editingItem.title,
          color: editingItem.color,
          icon: editingItem.icon,
          description: editingItem.description
        } : undefined}
        isCreating={isModalCreating}
      />
    </div>
  );
};