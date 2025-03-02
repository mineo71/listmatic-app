import type React from "react"
import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Plus, Wand2, X } from "lucide-react"
import { Download } from "lucide-react"
import { Upload } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HoneycombHexagon } from "../hexagon/HoneycombHexagon"
import { HoneycombEditModal } from "../HoneycombEditModal"
import TaskSidebar from "../TaskSidebar"
import toast from "react-hot-toast"
import type { HoneycombItem, HoneycombCanvasProps, TaskIcon } from "./HoneycombTypes"
import { axialToPixel, findClosestNeighbor } from "./honeycombUtils"
import { useHoneycombItems } from "./useHoneycombItems"

// Constants for canvas limits
const CANVAS_LIMITS = {
  minX: -2000,
  maxX: 2000,
  minY: -2000,
  maxY: 2000,
  minZoom: 0.9, // 0.7x of default zoom
  maxZoom: 3,   // 5x of default zoom
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

export const HoneycombCanvas: React.FC<HoneycombCanvasProps> = ({
    zoom,
    setZoom,
    offset,
    setOffset,
    isTaskSidebarOpen,
    setisTaskSidebarOpen,
    onProgressUpdate,
  }) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const lastMousePosRef = useRef({ x: 0, y: 0 })
  const lastZoomRef = useRef(zoom);
  const lastTouchDistanceRef = useRef<number | null>(null);

  const { items, setItems } = useHoneycombItems(onProgressUpdate)

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [ghostHex, setGhostHex] = useState<{ q: number; r: number; parentId: string } | null>(null)
  const [editingItem, setEditingItem] = useState<HoneycombItem | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isModalCreating, setIsModalCreating] = useState(false)
  const [pendingHexagon, setPendingHexagon] = useState<HoneycombItem | null>(null)
  const [idCounter, setIdCounter] = useState<number>(1)

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
    const visibleLeft = -offset.x / zoom - 100;  // Add margin for partially visible items
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

  // Fixed zoomAtPoint function for zooming at mouse position
  const zoomAtPoint = useCallback((newZoom: number, clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    // Clamp zoom value between min and max limits
    newZoom = Math.max(CANVAS_LIMITS.minZoom, Math.min(CANVAS_LIMITS.maxZoom, newZoom));
    
    // Get container bounds
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to container
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    // Convert point under mouse to world space before zoom
    const worldX = (mouseX - offset.x) / zoom;
    const worldY = (mouseY - offset.y) / zoom;
    
    // Update zoom
    lastZoomRef.current = newZoom;
    setZoom(newZoom);
    
    // Calculate new offset to keep mouse position fixed over same world point
    const newOffsetX = mouseX - worldX * newZoom;
    const newOffsetY = mouseY - worldY * newZoom;
    
    // Apply new offset with bounds checking
    setOffset(limitOffsetToBounds({
      x: newOffsetX,
      y: newOffsetY
    }));
  }, [zoom, offset, setZoom, setOffset, limitOffsetToBounds]);
  
  // Modified wheel event handler for smoother zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    // Calculate zoom factor: positive deltaY means zoom out, negative means zoom in
    const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
    const newZoom = lastZoomRef.current * zoomFactor;
    
    // Zoom at the mouse position
    zoomAtPoint(newZoom, e.clientX, e.clientY);
  }, [zoomAtPoint]);

  // Setup wheel event listener with proper type handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Create a properly typed debounced wheel handler
    const debouncedWheel = debounce((e: WheelEvent) => handleWheel(e), 5);
    
    // Add the wheel event listener
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      debouncedWheel(e);
    };
    
    container.addEventListener('wheel', wheelHandler, { passive: false });
    
    // Clean up
    return () => {
      container.removeEventListener('wheel', wheelHandler);
    };
  }, [handleWheel]);

  useEffect(() => {
    const handleResize = debounce(() => {
      if (!containerRef.current) return;
      
      // Update grid size 
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = rect.width;
      const viewportHeight = rect.height;
      
      // Adjust center if needed
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
      // Calculate pinch distance
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      // Calculate zoom delta
      const delta = distance / lastTouchDistanceRef.current;
      const newZoom = lastZoomRef.current * delta;
      
      // Find pinch midpoint
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      // Apply zoom
      zoomAtPoint(newZoom, midX, midY);
      
      lastTouchDistanceRef.current = distance;
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      // Handle single touch drag
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
      if (isDraggingRef.current) {
        // Pan the canvas
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;

        setOffset(prev => limitOffsetToBounds({
          x: prev.x + dx,
          y: prev.y + dy
        }));

        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      } else if (isCreating && containerRef.current && !isEditModalOpen) {
        // Ghost hexagon positioning for creation mode
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / zoom - offset.x / zoom;
        const mouseY = (e.clientY - rect.top) / zoom - offset.y / zoom;

        const closestNeighbor = findClosestNeighbor(mouseX, mouseY, items);
        setGhostHex(closestNeighbor);
      }
    },
    [isCreating, zoom, offset, items, isEditModalOpen, setOffset, limitOffsetToBounds]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Create new hexagon
  const createNewHexagon = useCallback(() => {
    if (!ghostHex || !containerRef.current) return;
  
    const pixel = axialToPixel(ghostHex.q, ghostHex.r);
  
    // Create new ID
    const newId = (idCounter + 1).toString();
  
    // Create new hexagon
    const newItem: HoneycombItem = {
      id: newId,
      q: ghostHex.q,
      r: ghostHex.r,
      x: pixel.x,
      y: pixel.y,
      title: t("hexagon.new_honeycomb"),
      description: "",
      icon: "None" as TaskIcon, 
      priority: "medium",
      completed: false,
      connections: [ghostHex.parentId],
      color: "#FDE68A",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  
    // Increment counter
    setIdCounter(idCounter + 1);
  
    // Save new hexagon
    setPendingHexagon(newItem);
    setEditingItem(newItem);
    setIsEditModalOpen(true);
    setIsModalCreating(true);
    setIsCreating(false);
    setGhostHex(null);
  }, [ghostHex, containerRef, idCounter, t]);

  // Ghost hexagon click handler
  const handleGhostClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditModalOpen) {
      createNewHexagon();
    }
  }, [createNewHexagon, isEditModalOpen]);

  // Mark task as complete
  const handleMarkComplete = useCallback((id: string) => {
    const item = items.find((i) => i.id === id);

    // If this is the main item, check if all others are completed
    if (item?.isMain) {
      const otherItems = items.filter((i) => !i.isMain);
      const allOthersCompleted = otherItems.every((i) => i.completed);

      if (!allOthersCompleted) {
        toast.error(t("messages.completeOtherTasks"));
        return;
      }

      setItems((prev) => prev.map((item) => 
        item.id === id ? { ...item, completed: !item.completed } : item
      ));

      if (!item.completed) {
        toast.success(t("messages.taskCompleted"));
      }
      return;
    }

    // Regular mark complete for other items
    setItems((prev) => prev.map((item) => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  }, [items, setItems, t]);

  // Edit modal handlers
  const handleModalClose = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    setIsModalCreating(false);
    setPendingHexagon(null);
  }, []);

  const handleEditSubmit = useCallback((data: {
    title: string;
    color: string;
    icon: TaskIcon;
    description: string;
  }) => {
    // Handle new hexagon
    if (editingItem && pendingHexagon) {
      const hexagonToAdd = {
        ...pendingHexagon,
        title: data.title,
        color: data.color,
        icon: data.icon,
        description: data.description,
      };

      setItems((prev) => [
        // Update parent's connections
        ...prev.map((item) =>
          hexagonToAdd.connections.includes(item.id)
            ? { ...item, connections: [...item.connections, hexagonToAdd.id] }
            : item
        ),
        // Add new hexagon
        hexagonToAdd,
      ]);
    }
    // Handle existing hexagon
    else if (editingItem) {
      setItems((prev) => prev.map((item) => 
        item.id === editingItem.id ? { ...item, ...data } : item
      ));
    }

    // Close modal
    setIsEditModalOpen(false);
    setEditingItem(null);
    setIsModalCreating(false);
    setPendingHexagon(null);
  }, [editingItem, pendingHexagon, setItems]);

  // Delete hexagon
  const handleDeleteItem = useCallback(() => {
    if (editingItem && !editingItem.isMain) {
      // Remove connections to deleted hexagon
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          connections: item.connections.filter((connId) => connId !== editingItem.id),
        }))
      );

      // Remove the hexagon
      setItems((prev) => prev.filter((item) => item.id !== editingItem.id));
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  }, [editingItem, setItems]);

  // Edit from sidebar
  const handleSidebarEditClick = useCallback((id: string) => {
    if (isCreating) return;
    
    const item = items.find((i) => i.id === id);
    if (item && containerRef.current) {
      // Center the selected hexagon
      const pixel = axialToPixel(item.q, item.r);
      const rect = containerRef.current.getBoundingClientRect();
      
      // Calculate center position accounting for sidebar
      const centerX = isTaskSidebarOpen 
        ? (rect.width / 2 - 160) / zoom  // Offset for sidebar
        : rect.width / 2 / zoom;
      
      setOffset({
        x: centerX - pixel.x,
        y: rect.height / 2 / zoom - pixel.y,
      });
      
      setSelectedItemId(id);

      // Open edit modal
      setEditingItem({
        ...item,
        isMain: item.id === "main",
      });
      
      setIsEditModalOpen(true);
    }
  }, [isCreating, items, zoom, isTaskSidebarOpen, setOffset]);

  // Export/Import functions
  const exportToJson = useCallback((items: HoneycombItem[]) => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "honeycomb-data.json";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }, []);

  const importFromJson = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          try {
            const importedItems = JSON.parse(content) as HoneycombItem[];
            setItems(importedItems);
          } catch (error) {
            console.error("Error parsing JSON:", error);
            toast.error(t("messages.invalidJsonFile"));
          }
        }
      };
      reader.readAsText(file);
    }
  }, [setItems, t]);

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
    // When zoom changes from outside (like header buttons), update lastZoomRef
    lastZoomRef.current = zoom;
  }, [zoom]);

  // Generate ghost hexagon when creating
  const ghostHexagon = useMemo(() => {
    if (isCreating && ghostHex) {
      const { x, y } = axialToPixel(ghostHex.q, ghostHex.r);
      return (
        <HoneycombHexagon
          id="ghost"
          x={x}
          y={y}
          isGhost
          isCreating={isCreating}
          connections={[]}
          color="rgba(251, 146, 60, 0.8)"
          onClick={handleGhostClick}
          icon="Plus"
          title=""
        />
      );
    }
    return null;
  }, [isCreating, ghostHex, handleGhostClick]);

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
    >
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

        <button className="flex items-center px-4 py-2 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all bg-white hover:bg-gray-50 ml-2">
          <Wand2 size={22} />
        </button>

        <button
          onClick={() => exportToJson(items)}
          className="flex items-center px-4 py-2 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all bg-white hover:bg-gray-50 ml-2"
        >
          <Download size={22} />
        </button>

        <label className="flex items-center px-4 py-2 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all bg-white hover:bg-gray-50 ml-2 cursor-pointer">
          <input type="file" accept=".json" onChange={importFromJson} style={{ display: "none" }} />
          <Upload size={22} />
        </label>
      </div>



      {/* Canvas content - modified transformation for proper zooming */}
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
          {/* Render only visible hexagons for performance */}
          {visibleItems.map((item) => {
            const { x, y } = axialToPixel(item.q, item.r);
            return (
              <HoneycombHexagon
                key={item.id}
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
                onClick={() => !isCreating && setSelectedItemId(item.id)}
                onMarkComplete={() => !isCreating && handleMarkComplete(item.id)}
                onEdit={() => !isCreating && handleSidebarEditClick(item.id)}
              />
            );
          })}

          {/* Ghost hexagon for creation mode */}
          {ghostHexagon}
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
          setSelectedItemId(id);
          const item = items.find((i) => i.id === id);
          if (item && containerRef.current) {
            const pos = axialToPixel(item.q, item.r);
            const rect = containerRef.current.getBoundingClientRect();
            
            // Adjust center position for sidebar
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
                isMain: editingItem.isMain,
              }
            : undefined
        }
        isCreating={isModalCreating}
      />
    </div>
  );
};