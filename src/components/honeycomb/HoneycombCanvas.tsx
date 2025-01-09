import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HoneycombHexagon } from './HoneycombHexagon';
import { HoneycombTaskModal } from './HoneycombTaskModal';
import { HoneycombEditModal } from './HoneycombEditModal';
import TaskSidebar from './TaskSidebar';

interface HoneycombItem {
  id: string;
  x: number;
  y: number;
  title: string;
  color?: string;
  isCompleted?: boolean;
}

interface DragState {
  itemId: string;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}

interface HoneycombCanvasProps {
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  offset: { x: number; y: number };
  setOffset: (offset: { x: number; y: number }) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export const HoneycombCanvas = ({
  zoom,
  setZoom,
  offset,
  setOffset,
  isSidebarOpen,
  setIsSidebarOpen
}: HoneycombCanvasProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Core state
  const [items, setItems] = useState<HoneycombItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HoneycombItem | null>(null);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isCreating && !dragState) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && !dragState) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    if (dragState) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        let x = (e.clientX - rect.left) / zoom;
        let y = (e.clientY - rect.top) / zoom;
        
        // Snap to grid
        x = Math.round(x / 50) * 50;
        y = Math.round(y / 50) * 50;

        setItems(prevItems => 
          prevItems.map(item => 
            item.id === dragState.itemId
              ? { ...item, x, y }
              : item
          )
        );
      }
    }

    if (isCreating && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom) {
        let x = (e.clientX - rect.left) / zoom - offset.x;
        let y = (e.clientY - rect.top) / zoom - offset.y;
        
        // Snap to grid
        x = Math.round(x / 50) * 50;
        y = Math.round(y / 50) * 50;
        
        setGhostPosition({ x, y });
      } else {
        setGhostPosition(null);
      }
    }
  }, [isDragging, dragStart, isCreating, zoom, offset, dragState, setOffset]);

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isCreating && !dragState && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom) {
        const x = (e.clientX - rect.left) / zoom - offset.x;
        const y = (e.clientY - rect.top) / zoom - offset.y;
        setPendingPosition({ x, y });
        setIsCreateModalOpen(true);
      } else {
        setIsCreating(false);
        setGhostPosition(null);
      }
    }
    setIsDragging(false);
    setDragState(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const deltaY = e.deltaY;
    const delta = deltaY > 0 ? -0.1 : 0.1;
    
    setZoom(prevZoom => {
      const newZoom = Math.max(0.5, Math.min(2, prevZoom + delta));
      return newZoom;
    });
  };

  // Hexagon handlers
  const handleHexagonDragStart = (id: string, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      const item = items.find(item => item.id === id);
      if (item) {
        setDragState({
          itemId: id,
          startX: x,
          startY: y,
          initialX: item.x,
          initialY: item.y
        });
      }
    }
  };

  const handleHexagonDoubleClick = (item: HoneycombItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleHexagonClick = (id: string) => {
    if (selectedItemId === id) {
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === id
            ? { ...item, isCompleted: !item.isCompleted }
            : item
        )
      );
    } else {
      setSelectedItemId(id);
    }
  };

  // Modal handlers
  const handleTaskSubmit = (data: { title: string }) => {
    if (pendingPosition) {
      const newItem: HoneycombItem = {
        id: Date.now().toString(),
        x: pendingPosition.x,
        y: pendingPosition.y,
        title: data.title,
        isCompleted: false
      };
      setItems(prev => [...prev, newItem]);
      setPendingPosition(null);
      setIsCreating(false);
      setGhostPosition(null);
      setIsCreateModalOpen(false);
    }
  };

  const handleEditSubmit = (data: { title: string; color?: string }) => {
    if (editingItem) {
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === editingItem.id
            ? { ...item, ...data }
            : item
        )
      );
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleDeleteHexagon = () => {
    if (editingItem) {
      setItems(prevItems => prevItems.filter(item => item.id !== editingItem.id));
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  };

  const scrollToHexagon = (id: string) => {
    const item = items.find(item => item.id === id);
    if (item && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      setOffset({
        x: centerX - (item.x * zoom),
        y: centerY - (item.y * zoom)
      });
      setSelectedItemId(id);
    }
  };

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreating) {
          setIsCreating(false);
          setGhostPosition(null);
          setPendingPosition(null);
        }
        if (selectedItemId) {
          setSelectedItemId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreating, selectedItemId]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50">
      {/* Add Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`flex items-center px-4 py-2 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all ${
            isCreating ? 'bg-amber-500 text-white' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <Plus size={22} />
          <span className="font-xl">{t('actions.addHexagon')}</span>
        </button>
      </div>

      {/* Main Canvas */}
      <div 
        ref={containerRef}
        className={`w-full h-full ${isCreating ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute inset-0"
          style={{
            width: '400%',
            height: '400%',
            left: '-150%',
            top: '-150%',
            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        >
          {items.map(item => (
            <HoneycombHexagon
              key={item.id}
              {...item}
              isSelected={selectedItemId === item.id}
              onClick={() => handleHexagonClick(item.id)}
              onDragStart={handleHexagonDragStart}
              onEdit={() => handleHexagonDoubleClick(item)}
            />
          ))}

          {isCreating && ghostPosition && (
            <HoneycombHexagon
              id="ghost"
              x={ghostPosition.x}
              y={ghostPosition.y}
              title={t('placeholders.newHexagon')}
              isGhost
            />
          )}
        </div>
      </div>

      {/* Task Sidebar */}
      <TaskSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        items={items}
        selectedItemId={selectedItemId}
        onItemClick={scrollToHexagon}
        onEditClick={(id) => {
          const item = items.find(item => item.id === id);
          if (item) {
            setEditingItem(item);
            setIsEditModalOpen(true);
          }
        }}
      />

      {/* Modals */}
      <HoneycombTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsCreating(false);
          setPendingPosition(null);
          setGhostPosition(null);
        }}
        onSubmit={handleTaskSubmit}
      />

      <HoneycombEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleEditSubmit}
        onDelete={handleDeleteHexagon}
        initialData={editingItem ? {
          title: editingItem.title,
          color: editingItem.color
        } : undefined}
      />
    </div>
  );
};