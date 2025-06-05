/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Plus, Wand2, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HoneycombHexagon } from "../hexagon/HoneycombHexagon"
import { HoneycombEditModal } from "../HoneycombEditModal"
import TaskSidebar from "../TaskSidebar"
import GeminiModal from "../GeminiModal"
import toast from "react-hot-toast"
import type { HoneycombItem, HoneycombCanvasProps, TaskIcon, TaskPriority } from "./HoneycombTypes"
import { axialToPixel, findClosestNeighbor } from "./honeycombUtils"
import { useUnifiedHoneycombItems } from "./useUnifiedHoneycombItems"

// Enhanced interface with new callbacks
interface EnhancedHoneycombCanvasProps extends HoneycombCanvasProps {
  onItemSelection?: (itemId: string | null) => void;
  showParticipantCursors?: boolean; // NEW: Control cursor visibility
  onCursorMove?: (position: { x: number; y: number }) => void; // NEW: Cursor position callback
}

// Constants for canvas limits
const CANVAS_LIMITS = {
  minX: -2000,
  maxX: 2000,
  minY: -2000,
  maxY: 2000,
  minZoom: 0.9,
  maxZoom: 3,
};

// Typed debounce function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const HoneycombCanvas: React.FC<EnhancedHoneycombCanvasProps> = ({
    honeycombId,
    zoom,
    setZoom,
    offset,
    setOffset,
    isTaskSidebarOpen,
    setisTaskSidebarOpen,
    onProgressUpdate,
    // Shared mode props
    isSharedMode = false,
    canEdit = true,
    sessionId,
    participantId,
    participants = [],
    onItemSelection,
    showParticipantCursors = true,
    onCursorMove,
  }) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const lastMousePosRef = useRef({ x: 0, y: 0 })
  const lastZoomRef = useRef(zoom);
  const lastTouchDistanceRef = useRef<number | null>(null);

  // Use unified hook that handles both modes
  const { 
    items, 
    loading, 
    saving, 
    createItem, 
    updateItem, 
    deleteItem, 
    bulkCreateItems,
    toggleItemCompletion 
  } = useUnifiedHoneycombItems(honeycombId, onProgressUpdate, isSharedMode, canEdit, sessionId, participantId);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [ghostHex, setGhostHex] = useState<{ q: number; r: number; parentId: string } | null>(null)
  const [editingItem, setEditingItem] = useState<HoneycombItem | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isModalCreating, setIsModalCreating] = useState(false)
  const [pendingHexagon, setPendingHexagon] = useState<HoneycombItem | null>(null)
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false)

  // Enhanced item selection handler
  const handleItemSelection = useCallback((itemId: string | null) => {
    setSelectedItemId(itemId);
    onItemSelection?.(itemId);
  }, [onItemSelection]);

  // Function to limit canvas panning within bounds
  const limitOffsetToBounds = useCallback((newOffset: { x: number; y: number }) => {
    return {
      x: Math.max(CANVAS_LIMITS.minX, Math.min(CANVAS_LIMITS.maxX, newOffset.x)),
      y: Math.max(CANVAS_LIMITS.minY, Math.min(CANVAS_LIMITS.maxY, newOffset.y)),
    };
  }, []);

  // Calculate which hexagons are in view for optimization
  const visibleItems = useMemo(() => {
    if (!containerRef.current) return items;
    
    const rect = containerRef.current.getBoundingClientRect();
    const viewWidth = rect.width;
    const viewHeight = rect.height;
    
    // Calculate the bounds of the visible area in canvas coordinates
    const visibleLeft = -offset.x / zoom - 100;
    const visibleTop = -offset.y / zoom - 100;
    const visibleRight = visibleLeft + viewWidth / zoom + 200;
    const visibleBottom = visibleTop + viewHeight / zoom + 200;
    
    return items.filter(item => {
      return item.x >= visibleLeft && 
             item.x <= visibleRight && 
             item.y >= visibleTop && 
             item.y <= visibleBottom;
    });
  }, [items, offset, zoom]);

  // Handle AI-generated honeycombs with proper ID handling
  const handleGeminiGenerate = useCallback(async (generatedItems: HoneycombItem[]) => {
    if (isSharedMode && !canEdit) {
      toast.error(t('sharing.noAIGeneration'));
      return;
    }

    // Extract only the fields we need for creation, explicitly excluding id
    // This ensures we don't pass the AI-generated IDs to the database
    const itemsToCreate = generatedItems.map(({ 
      id, // destructure id to exclude it
      createdAt, // exclude these as well
      updatedAt,
      ...rest 
    }) => ({
      ...rest,
      completed: false, // ensure completed is always false initially
    }))
    
    const success = await bulkCreateItems(itemsToCreate)
    
    if (success) {
      toast.success(t('ai.successMessage'))
    }
  }, [bulkCreateItems, t, isSharedMode, canEdit])

  // Fixed zoomAtPoint function for zooming at mouse position
  const zoomAtPoint = useCallback((newZoom: number, clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    newZoom = Math.max(CANVAS_LIMITS.minZoom, Math.min(CANVAS_LIMITS.maxZoom, newZoom));
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    const worldX = (mouseX - offset.x) / zoom;
    const worldY = (mouseY - offset.y) / zoom;
    
    lastZoomRef.current = newZoom;
    setZoom(newZoom);
    
    const newOffsetX = mouseX - worldX * newZoom;
    const newOffsetY = mouseY - worldY * newZoom;
    
    setOffset(limitOffsetToBounds({
      x: newOffsetX,
      y: newOffsetY
    }));
  }, [zoom, offset, setZoom, setOffset, limitOffsetToBounds]);
  
  // Modified wheel event handler for smoother zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
    const newZoom = lastZoomRef.current * zoomFactor;
    zoomAtPoint(newZoom, e.clientX, e.clientY);
  }, [zoomAtPoint]);

  // Setup wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const debouncedWheel = debounce((e: WheelEvent) => handleWheel(e), 5);
    
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      debouncedWheel(e);
    };
    
    container.addEventListener('wheel', wheelHandler, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', wheelHandler);
    };
  }, [handleWheel]);

  // Handle window resize
  useEffect(() => {
    const handleResize = debounce(() => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = rect.width;
      const viewportHeight = rect.height;
      
      if (offset.x === 0 && offset.y === 0) {
        setOffset({
          x: viewportWidth / 2,
          y: viewportHeight / 2,
        });
      }
    }, 100);
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [offset, setOffset]);

  // Touch events for pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistanceRef.current = distance;
    } else if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const delta = distance / lastTouchDistanceRef.current;
      const newZoom = lastZoomRef.current * delta;
      
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      zoomAtPoint(newZoom, midX, midY);
      lastTouchDistanceRef.current = distance;
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - lastMousePosRef.current.x;
      const dy = touch.clientY - lastMousePosRef.current.y;
      
      setOffset(prev => limitOffsetToBounds({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [limitOffsetToBounds, setOffset, zoomAtPoint]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDistanceRef.current = null;
    isDraggingRef.current = false;
  }, []);

  // Mouse handlers for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !isCreating && !isEditModalOpen) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [isCreating, isEditModalOpen]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Track cursor position for shared mode
      if (isSharedMode && onCursorMove && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Calculate world coordinates (canvas content coordinates)
        const worldX = (e.clientX - rect.left - offset.x) / zoom;
        const worldY = (e.clientY - rect.top - offset.y) / zoom;
        onCursorMove({ x: worldX, y: worldY });
      }

      if (isDraggingRef.current) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;

        setOffset(prev => limitOffsetToBounds({
          x: prev.x + dx,
          y: prev.y + dy
        }));

        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      } else if (isCreating && containerRef.current && !isEditModalOpen && canEdit) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / zoom - offset.x / zoom;
        const mouseY = (e.clientY - rect.top) / zoom - offset.y / zoom;

        if (items.length > 0) {
          const closestNeighbor = findClosestNeighbor(mouseX, mouseY, items);
          setGhostHex(closestNeighbor);
        } else {
          // NEW: If no items exist, allow creating the first hexagon at center
          setGhostHex({ q: 0, r: 0, parentId: 'center' });
        }
      }
    },
    [isCreating, zoom, offset, items, isEditModalOpen, setOffset, limitOffsetToBounds, canEdit, isSharedMode, onCursorMove]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Create new hexagon - ENHANCED to handle first hexagon creation
  const createNewHexagon = useCallback(async () => {
    if (!ghostHex || !containerRef.current || !canEdit) return;
  
    const pixel = axialToPixel(ghostHex.q, ghostHex.r);
  
    const newItem: Omit<HoneycombItem, 'id' | 'createdAt' | 'updatedAt'> = {
      q: ghostHex.q,
      r: ghostHex.r,
      x: pixel.x,
      y: pixel.y,
      title: items.length === 0 ? t("hexagon.main_goal") : t("hexagon.new_honeycomb"),
      description: "",
      icon: items.length === 0 ? "Star" as TaskIcon : "None" as TaskIcon,
      priority: items.length === 0 ? "high" : "medium",
      completed: false,
      connections: ghostHex.parentId === 'center' ? [] : [ghostHex.parentId],
      color: "#FDE68A",
      isMain: items.length === 0, // NEW: First hexagon is main
    };
  
    const createdItem = await createItem(newItem)
    
    if (createdItem) {
      // Only update parent connections if it's not the first hexagon
      if (ghostHex.parentId !== 'center') {
        const parentItem = items.find(item => item.id === ghostHex.parentId)
        if (parentItem) {
          await updateItem(parentItem.id, {
            connections: [...parentItem.connections, createdItem.id]
          })
        }
      }
      
      setPendingHexagon(createdItem);
      setEditingItem(createdItem);
      setIsEditModalOpen(true);
      setIsModalCreating(true);
    }
    
    setIsCreating(false);
    setGhostHex(null);
  }, [ghostHex, containerRef, t, createItem, updateItem, items, canEdit]);

  // Enhanced canvas click handler to support center creation
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!isCreating || !canEdit) return;
    
    // If no items exist and user clicks, create first hexagon at center
    if (items.length === 0 && containerRef.current) {
      // Set ghost hex to center position
      setGhostHex({ q: 0, r: 0, parentId: 'center' });
      
      // Create immediately
      setTimeout(() => {
        createNewHexagon();
      }, 50);
    }
  }, [isCreating, canEdit, items.length, createNewHexagon]);

  // Mark task as complete
  const handleMarkComplete = useCallback(async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!canEdit) {
      toast.error(t('sharing.noEditingAllowed'));
      return;
    }
    
    // Prevent multiple rapid clicks
    if (saving) {
      return;
    }
    
    try {
      await toggleItemCompletion(id);
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error(t('messages.updateError'));
    }
  }, [toggleItemCompletion, canEdit, saving, t]);

  // Edit modal handlers
  const handleModalClose = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    setIsModalCreating(false);
    setPendingHexagon(null);
  }, []);

  const handleEditSubmit = useCallback(async (data: {
    title: string;
    color: string;
    icon: TaskIcon;
    description: string;
    priority: TaskPriority;
    deadline?: Date;
  }) => {
    if (!canEdit) {
      toast.error(t('sharing.noEditingAllowed'));
      return;
    }

    if (editingItem && pendingHexagon && isModalCreating) {
      await updateItem(editingItem.id, {
        title: data.title,
        color: data.color,
        icon: data.icon,
        description: data.description,
        priority: data.priority,
        deadline: data.deadline,
      })
    } else if (editingItem) {
      await updateItem(editingItem.id, data)
    }

    setIsEditModalOpen(false);
    setEditingItem(null);
    setIsModalCreating(false);
    setPendingHexagon(null);
  }, [editingItem, pendingHexagon, isModalCreating, updateItem, canEdit, t]);

  // Delete hexagon
  const handleDeleteItem = useCallback(async () => {
    if (!canEdit) {
      toast.error(t('sharing.noEditingAllowed'));
      return;
    }

    if (editingItem && !editingItem.isMain) {
      const itemsToUpdate = items.filter(item => 
        item.connections.includes(editingItem.id)
      )
      
      for (const item of itemsToUpdate) {
        await updateItem(item.id, {
          connections: item.connections.filter(connId => connId !== editingItem.id)
        })
      }

      await deleteItem(editingItem.id)
      
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  }, [editingItem, items, updateItem, deleteItem, canEdit, t]);

  // Edit from sidebar
  const handleSidebarEditClick = useCallback((id: string) => {
    if (isCreating) return;
    
    const item = items.find((i) => i.id === id);
    if (item && containerRef.current) {
      const pixel = axialToPixel(item.q, item.r);
      const rect = containerRef.current.getBoundingClientRect();
      
      const centerX = isTaskSidebarOpen 
        ? (rect.width / 2 - 160) / zoom
        : rect.width / 2 / zoom;
      
      setOffset({
        x: centerX - pixel.x,
        y: rect.height / 2 / zoom - pixel.y,
      });
      
      handleItemSelection(id);

      if (canEdit) {
        setEditingItem({
          ...item,
          isMain: item.id === "main",
        });
        
        setIsEditModalOpen(true);
      }
    }
  }, [isCreating, items, zoom, isTaskSidebarOpen, setOffset, canEdit, handleItemSelection]);

  // Initialize canvas
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setOffset({
        x: rect.width / 2,
        y: rect.height / 2,
      });
    }
  }, [setOffset]);

  // Connect to header zoom buttons
  useEffect(() => {
    lastZoomRef.current = zoom;
  }, [zoom]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gray-50"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCanvasClick} // NEW: Handle canvas clicks for first hexagon
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            <p className="text-gray-600">{t('messages.loading')}</p>
          </div>
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-4 py-2 z-40">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">{t('actions.saving')}</span>
          </div>
        </div>
      )}

      {/* Background grid that scales with zoom */}
      <div
        className="absolute w-[10000px] h-[10000px]"
        style={{
          left: '-5000px',
          top: '-5000px',
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)
          `,
          backgroundSize: `${50/zoom}px ${50/zoom}px, ${50/zoom}px ${50/zoom}px, ${25/zoom}px ${25/zoom}px, ${25/zoom}px ${25/zoom}px`,
          transformOrigin: '50% 50%',
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      />

      {/* Control buttons */}
      {(!isSharedMode || canEdit) && (
        <div className="absolute top-4 left-4 z-10 flex">
          <button
            onClick={() => setIsCreating(!isCreating)}
            className={`flex items-center px-4 py-2 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all ${
              isCreating ? "bg-amber-500 text-white" : "bg-white hover:bg-gray-50"
            }`}
          >
            {isCreating ? <X size={22} /> : <Plus size={22} />}
            <span className="font-xl">{isCreating ? t("actions.done") : t("actions.addHexagon")}</span>
          </button>

          {!isSharedMode && (
            <button 
              onClick={() => setIsGeminiModalOpen(true)}
              className="flex items-center px-4 py-2 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all bg-white hover:bg-gray-50 ml-2"
            >
              <Wand2 size={22} />
            </button>
          )}
        </div>
      )}

      {/* NEW: Empty state message when no items exist */}
      {items.length === 0 && !loading && isCreating && canEdit && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-white/90 rounded-lg shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('canvas.createFirstHexagon')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('canvas.clickAnywhereToStart')}
            </p>
          </div>
        </div>
      )}

      {/* Canvas content */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: '50% 50%'
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
          }}
        >
          {/* Render visible hexagons */}
          {visibleItems.map((item) => {
            const { x, y } = axialToPixel(item.q, item.r);
            
            // Check if this item is selected by any participant
            const selectedByParticipant = participants.find(p => p.selected_item_id === item.id);
            
            return (
              <div key={item.id} className="relative">
                <HoneycombHexagon
                  id={item.id}
                  x={x}
                  y={y}
                  title={item.title}
                  icon={item.icon}
                  description={item.description}
                  isSelected={selectedItemId === item.id}
                  color={item.color}
                  isCreating={isCreating}
                  isCompleted={item.completed}
                  connectedHexagons={items
                    .filter((other) => item.connections.includes(other.id))
                    .map((other) => {
                      const pos = axialToPixel(other.q, other.r);
                      return {
                        id: other.id,
                        x: pos.x,
                        y: pos.y,
                      };
                    })}
                  onClick={() => !isCreating && handleItemSelection(item.id)}
                  onMarkComplete={(e) => !isCreating && handleMarkComplete(item.id, e)}
                  onEdit={() => !isCreating && handleSidebarEditClick(item.id)}
                />
                
                {/* Show participant selection indicator */}
                {selectedByParticipant && selectedByParticipant.id !== participantId && (
                  <div
                    className="absolute top-0 left-0 w-full h-full pointer-events-none z-30"
                    style={{
                      transform: `translate(${x - 60}px, ${y - 60}px)`,
                      border: `3px solid ${selectedByParticipant.color}`,
                      borderRadius: '50%',
                      width: '120px',
                      height: '120px',
                      opacity: 0.6,
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    <div
                      className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs px-2 py-1 rounded text-white"
                      style={{ backgroundColor: selectedByParticipant.color }}
                    >
                      {selectedByParticipant.display_name}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Ghost hexagon for creation mode */}
          {isCreating && ghostHex && canEdit && (
            <HoneycombHexagon
              id="ghost"
              x={axialToPixel(ghostHex.q, ghostHex.r).x}
              y={axialToPixel(ghostHex.q, ghostHex.r).y}
              isGhost
              isCreating={isCreating}
              connections={[]}
              color="rgba(251, 146, 60, 0.8)"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (!isEditModalOpen && canEdit) {
                  createNewHexagon();
                }
              }}
              icon="Plus"
              title=""
            />
          )}

          {/* FIXED: Participant cursors - now correctly positioned in canvas coordinates */}
          {/* Cursors are now handled in SharedCanvasView.tsx for correct positioning */}
        </div>
      </div>

      {/* Modal overlay */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40" 
          onClick={(e) => e.stopPropagation()} 
        />
      )}

      {/* Task sidebar */}
      <TaskSidebar
        isOpen={isTaskSidebarOpen}
        onClose={() => setisTaskSidebarOpen(false)}
        items={items}
        selectedItemId={selectedItemId}
        onItemClick={(id) => {
          if (isCreating) return;
          handleItemSelection(id);
          const item = items.find((i) => i.id === id);
          if (item && containerRef.current) {
            const pos = axialToPixel(item.q, item.r);
            const rect = containerRef.current.getBoundingClientRect();
            
            const centerX = isTaskSidebarOpen 
              ? (rect.width / 2 - 160) / zoom
              : rect.width / 2 / zoom;
            
            setOffset({
              x: centerX - pos.x,
              y: rect.height / 2 / zoom - pos.y,
            });
          }
        }}
        onEditClick={handleSidebarEditClick}
        onCompleteTask={handleMarkComplete}
      />

      {/* Edit modal */}
      {canEdit && (
        <HoneycombEditModal
          isOpen={isEditModalOpen}
          onClose={handleModalClose}
          onSubmit={handleEditSubmit}
          onDelete={handleDeleteItem}
          initialData={
            editingItem
              ? {
                  id: editingItem.id,
                  title: editingItem.title,
                  color: editingItem.color,
                  icon: editingItem.icon,
                  description: editingItem.description,
                  priority: editingItem.priority,
                  deadline: editingItem.deadline,
                  isMain: editingItem.isMain,
                }
              : undefined
          }
          isCreating={isModalCreating}
        />
      )}

      {/* Gemini AI Modal */}
      {!isSharedMode && (
        <GeminiModal
          isOpen={isGeminiModalOpen}
          onClose={() => setIsGeminiModalOpen(false)}
          onGenerate={handleGeminiGenerate}
        />
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};