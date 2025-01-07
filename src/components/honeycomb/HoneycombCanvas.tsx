// src/components/honeycomb/HoneycombCanvas.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Plus, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HoneycombHexagon } from './HoneycombHexagon';
import { HoneycombTaskModal } from './HoneycombTaskModal';
import { HoneycombEditModal } from './HoneycombEditModal';

interface HoneycombItem {
  id: string;
  x: number;
  y: number;
  title: string;
  color?: string;
}

interface DragState {
  itemId: string;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}

export const HoneycombCanvas = () => {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [items, setItems] = useState<HoneycombItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HoneycombItem | null>(null);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [linkingFromId, setLinkingFromId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

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
      // Check if cursor is within bounds
      if (e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom) {
        // Get mouse position relative to container
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        // Snap to grid (50px grid)
        x = Math.round(x / 50) * 50;
        y = Math.round(y / 50) * 50;
        
        setGhostPosition({ x, y });
      } else {
        setGhostPosition(null);
      }
    }
  }, [isDragging, dragStart, isCreating, zoom, offset, dragState]);

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isCreating && !dragState && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Only open modal if click is within bounds
      if (e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom) {
        setPendingPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        setIsCreateModalOpen(true);
      } else {
        // Cancel creation if clicked outside
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

  const handleHexagonDragStart = (id: string, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left) / zoom - offset.x;
      const y = (e.clientY - rect.top) / zoom - offset.y;
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

  const handleTaskSubmit = (data: { title: string }) => {
    if (pendingPosition) {
      const newItem: HoneycombItem = {
        id: Date.now().toString(),
        x: pendingPosition.x,
        y: pendingPosition.y,
        title: data.title,
      };
      setItems(prev => [...prev, newItem]);
      setPendingPosition(null);
      setIsCreating(false);
      setGhostPosition(null);
      setIsCreateModalOpen(false);
    }
  };

  const handleEditSubmit = (data: { title: string; color: string }) => {
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

  // Add keyboard event listener for Esc key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCreating) {
        setIsCreating(false);
        setGhostPosition(null);
        setPendingPosition(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreating]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50 border-2 border-gray-200">
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
          }}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
        >
          <ZoomOut size={20} />
        </button>
      </div>

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
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px),
              linear-gradient(to right, #f3f4f6 1px, transparent 1px),
              linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px, 50px 50px, 10px 10px, 10px 10px',
            backgroundPosition: '0 0, 0 0, 0 0, 0 0'
          }}
        >
          {items.map(item => (
            <HoneycombHexagon
              key={item.id}
              id={item.id}
              x={item.x}
              y={item.y}
              title={item.title}
              color={item.color}
              isSelected={selectedItemId === item.id}
              isLinking={linkingFromId === item.id}
              onClick={() => setSelectedItemId(item.id)}
              onDoubleClick={() => handleHexagonDoubleClick(item)}
              onDragStart={handleHexagonDragStart}
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

      {/* Add Button */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-4 items-end z-10">
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`flex items-center px-6 py-3 gap-2 rounded-full shadow-lg hover:shadow-xl transition-all ${
            isCreating ? 'bg-amber-500 text-white' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <Plus size={24} />
          <span className="text-lg font-medium">{t('actions.addHexagon')}</span>
        </button>
      </div>

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
        } : { title: '', color: undefined }}
      />
    </div>
  );
};