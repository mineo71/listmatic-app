import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Wand2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HoneycombHexagon } from '../hexagon/HoneycombHexagon.tsx';
import { HoneycombEditModal } from '../HoneycombEditModal.tsx';
import TaskSidebar from '../TaskSidebar.tsx';
import toast from 'react-hot-toast';
import { HoneycombCanvasProps, HoneycombItem, Offset, TaskIcon } from './HoneycombtTypes.ts';
import { useHoneycombItems } from './useHoneycombItems.ts';
import { findClosestPosition } from './honeycombUtils.ts';

export const HoneycombCanvas: React.FC<HoneycombCanvasProps> = ({
zoom,
offset,
setOffset,
isSidebarOpen,
setIsSidebarOpen,
onProgressUpdate
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const { items, setItems } = useHoneycombItems(onProgressUpdate);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [ghostPosition, setGhostPosition] = useState<Offset | null>(null);
  const [editingItem, setEditingItem] = useState<HoneycombItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalCreating, setIsModalCreating] = useState(false);
  const [pendingHexagon, setPendingHexagon] = useState<HoneycombItem | null>(null);

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

      const closestPosition = findClosestPosition(mouseX, mouseY, items);
      setGhostPosition(closestPosition);
    }
  }, [isCreating, zoom, offset, items, isEditModalOpen, setOffset]);

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
    setPendingHexagon(null);
  };

  const handleEditSubmit = (data: { title: string; color: string; icon: TaskIcon; description: string }) => {
    if (editingItem && pendingHexagon) {
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
    if (item && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setOffset({
        x: (rect.width / 2 / zoom) - item.x,
        y: (rect.height / 2 / zoom) - item.y
      });
      setSelectedItemId(id);
      setEditingItem(item);
      setIsEditModalOpen(true);
    }
  };

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

  return (
      <div
          ref={containerRef}
          className="relative w-full h-full overflow-hidden bg-gray-50"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
      >
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

