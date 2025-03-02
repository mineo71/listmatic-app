import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
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

export const HoneycombCanvas: React.FC<HoneycombCanvasProps> = ({
    zoom,
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

  const { items, setItems } = useHoneycombItems(onProgressUpdate)

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [ghostHex, setGhostHex] = useState<{ q: number; r: number; parentId: string } | null>(null)
  const [editingItem, setEditingItem] = useState<HoneycombItem | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isModalCreating, setIsModalCreating] = useState(false)
  const [pendingHexagon, setPendingHexagon] = useState<HoneycombItem | null>(null)
  const [idCounter, setIdCounter] = useState<number>(1); // Початкове значення idCounter — 10

  // Обробники миші для перетягування полотна
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isCreating && !isEditModalOpen) {
      isDraggingRef.current = true
      lastMousePosRef.current = { x: e.clientX, y: e.clientY }
    }
  }

  const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (isDraggingRef.current) {
          // Перетягуємо полотно
          const dx = e.clientX - lastMousePosRef.current.x
          const dy = e.clientY - lastMousePosRef.current.y

          setOffset((prev) => ({
            x: prev.x + dx,
            y: prev.y + dy,
          }))

          lastMousePosRef.current = { x: e.clientX, y: e.clientY }
        } else if (isCreating && containerRef.current && !isEditModalOpen) {
          // Режим створення нового елемента
          const rect = containerRef.current.getBoundingClientRect()
          const mouseX = (e.clientX - rect.left) / zoom - offset.x / zoom
          const mouseY = (e.clientY - rect.top) / zoom - offset.y / zoom

          const closestNeighbor = findClosestNeighbor(mouseX, mouseY, items)
          setGhostHex(closestNeighbor)
        }
      },
      [isCreating, zoom, offset, items, isEditModalOpen, setOffset],
  )

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  const handleMouseLeave = () => {
    isDraggingRef.current = false
  }

  // Створення нового шестикутника
  const createNewHexagon = () => {
    if (!ghostHex || !containerRef.current) return;
  
    const pixel = axialToPixel(ghostHex.q, ghostHex.r);
  
    // Створюємо новий ID
    const newId = (idCounter + 1).toString();
  
    // Створюємо об’єкт нового елемента
    const newItem: HoneycombItem = {
      id: newId, // Використовуємо інкрементований ID
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
  
    // Збільшуємо лічильник для наступного елемента
    setIdCounter(idCounter + 1);
  
    // Зберігаємо новий елемент
    setPendingHexagon(newItem);
    setEditingItem(newItem);
    setIsEditModalOpen(true);
    setIsModalCreating(true);
    setIsCreating(false);
    setGhostHex(null);
  };

  // Клік по "привиду" нового шестикутника
  const handleGhostClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isEditModalOpen) {
      createNewHexagon()
    }
  }

  // Відмітка про завершення завдання
  const handleMarkComplete = (id: string) => {
    const item = items.find((i) => i.id === id)

    // Якщо це головний елемент (isMain), перевіряємо чи всі інші завершені
    if (item?.isMain) {
      const otherItems = items.filter((i) => !i.isMain)
      const allOthersCompleted = otherItems.every((i) => i.completed)

      if (!allOthersCompleted) {
        toast.error(t("messages.completeOtherTasks"))
        return
      }

      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))

      if (!item.completed) {
        toast.success(t("messages.taskCompleted"))
      }
      return
    }

    // Звичайна відмітка завершення для інших елементів
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))
  }

  // Закриття модалки редагування
  const handleModalClose = () => {
    setIsEditModalOpen(false)
    setEditingItem(null)
    setIsModalCreating(false)
    setPendingHexagon(null)
  }

  // Сабміт (збереження) з модалки редагування
  const handleEditSubmit = (data: {
    title: string
    color: string
    icon: TaskIcon
    description: string
  }) => {
    // Якщо це новий елемент, додаємо його в список
    if (editingItem && pendingHexagon) {
      const hexagonToAdd = {
        ...pendingHexagon,
        title: data.title,
        color: data.color,
        icon: data.icon,
        description: data.description,
      }

      setItems((prev) => [
        // Оновлюємо "connections" у батьківського елемента
        ...prev.map((item) =>
            hexagonToAdd.connections.includes(item.id)
                ? { ...item, connections: [...item.connections, hexagonToAdd.id] }
                : item,
        ),
        // Додаємо новий
        hexagonToAdd,
      ])
    }
    // Якщо редагуємо існуючий
    else if (editingItem) {
      setItems((prev) => prev.map((item) => (item.id === editingItem.id ? { ...item, ...data } : item)))
    }

    // Закриваємо модалку
    setIsEditModalOpen(false)
    setEditingItem(null)
    setIsModalCreating(false)
    setPendingHexagon(null)
  }

  // Видалення елемента
  const handleDeleteItem = () => {
    if (editingItem && !editingItem.isMain) {
      // Прибираємо ідентифікатор видаленого елемента зі зв'язків
      setItems((prev) =>
          prev.map((item) => ({
            ...item,
            connections: item.connections.filter((connId) => connId !== editingItem.id),
          })),
      )

      // Видаляємо сам елемент
      setItems((prev) => prev.filter((item) => item.id !== editingItem.id))
      setIsEditModalOpen(false)
      setEditingItem(null)
    }
  }

  // Перехід до редагування з сайдбара
  const handleSidebarEditClick = (id: string) => {
    if (isCreating) return
    const item = items.find((i) => i.id === id)
    if (item && containerRef.current) {
      // Центруємо обраний елемент на екрані
      const pixel = axialToPixel(item.q, item.r)
      const rect = containerRef.current.getBoundingClientRect()
      setOffset({
        x: rect.width / 2 / zoom - pixel.x,
        y: rect.height / 2 / zoom - pixel.y,
      })
      setSelectedItemId(id)

      // Відкриваємо модалку
      setEditingItem({
        ...item,
        isMain: item.id === "main",
      })
      setIsEditModalOpen(true)
    }
  }

  const exportToJson = (items: HoneycombItem[]) => {
    const dataStr = JSON.stringify(items, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = "honeycomb-data.json"
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const importFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result
        if (typeof content === "string") {
          try {
            const importedItems = JSON.parse(content) as HoneycombItem[]
            setItems(importedItems)
          } catch (error) {
            console.error("Error parsing JSON:", error)
            toast.error(t("messages.invalidJsonFile"))
          }
        }
      }
      reader.readAsText(file)
    }
  }

  // При першому завантаженні центруємо полотно
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setOffset({
        x: rect.width / 2,
        y: rect.height / 2,
      })
    }
  }, [setOffset])

  // "Привид" нового шестикутника, якщо є
  let ghostHexagon = null
  if (isCreating && ghostHex) {
    const { x, y } = axialToPixel(ghostHex.q, ghostHex.r)
    ghostHexagon = (
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
    )
  }

  return (
      <div
          ref={containerRef}
          className="relative w-full h-full overflow-hidden bg-gray-50"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
      >
        {/* Фонове "клітинне" зображення */}
        <div
            className="absolute w-[200vw] h-[200vh] left-[-50vw] top-[-50vh]"
            style={{
              backgroundImage: `
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)
          `,
              backgroundSize: "50px 50px, 50px 50px, 25px 25px, 25px 25px",
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
        />

        {/* Кнопки керування у верхньому лівому куті */}
        <div className="absolute top-4 left-4 z-10 flex">
          {/* Кнопка ввімкнення/вимкнення режиму створення нового елемента */}
          <button
              onClick={() => setIsCreating(!isCreating)}
              className={`flex items-center px-4 py-2 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all ${
                  isCreating ? "bg-amber-500 text-white" : "bg-white hover:bg-gray-50"
              }`}
          >
            {isCreating ? <X size={22} /> : <Plus size={22} />}
            <span className="font-xl">{isCreating ? t("actions.done") : t("actions.addHexagon")}</span>
          </button>

          {/* Додаткові кнопки (наприклад, магічний інструмент) */}
          <button className="flex items-center px-4 py-2 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all bg-white hover:bg-gray-50 ml-2">
            <Wand2 size={22} />
          </button>

          <button
            onClick={() => exportToJson(items)}
            className="flex items-center px-4 py-2 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all bg-white hover:bg-gray-50 ml-2"
            >
              <Download size={22} />
              {/* <span className="font-xl">{t("actions.export")}</span> */}
          </button>

          <label className="flex items-center px-4 py-2 gap-2 rounded-lg shadow-md hover:shadow-lg transition-all bg-white hover:bg-gray-50 ml-2 cursor-pointer">
            <input type="file" accept=".json" onChange={importFromJson} style={{ display: "none" }} />
            <Upload size={22} />
            {/* <span className="font-xl">{t("actions.import")}</span> */}
          </label>
        </div>

        {/* Полотно зі шестикутниками (масштабується за допомогою CSS transform: scale(zoom)) */}
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
            {/* Виводимо існуючі шестикутники */}
            {items.map((item) => {
              const { x, y } = axialToPixel(item.q, item.r)
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
                      // Для ліній з'єднань
                      connectedHexagons={items
                          .filter((other) => item.connections.includes(other.id))
                          .map((other) => {
                            const pos = axialToPixel(other.q, other.r)
                            return {
                              id: other.id,
                              x: pos.x,
                              y: pos.y,
                            }
                          })}
                      onClick={() => !isCreating && setSelectedItemId(item.id)}
                      onMarkComplete={() => !isCreating && handleMarkComplete(item.id)}
                      onEdit={() => !isCreating && handleSidebarEditClick(item.id)}
                  />
              )
            })}

            {/* Привид нового шестикутника (для режиму створення) */}
            {ghostHexagon}
          </div>
        </div>

        {/* Затінення під час відкритої модалки (за потреби) */}
        {isEditModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={(e) => e.stopPropagation()} />
        )}

        {/* Бокова панель із завданнями */}
        <TaskSidebar
            isOpen={isTaskSidebarOpen}
            onClose={() => setisTaskSidebarOpen(false)}
            items={items}
            selectedItemId={selectedItemId}
            onItemClick={(id) => {
              if (isCreating) return
              setSelectedItemId(id)
              const item = items.find((i) => i.id === id)
              if (item && containerRef.current) {
                const pos = axialToPixel(item.q, item.r)
                const rect = containerRef.current.getBoundingClientRect()
                setOffset({
                  x: rect.width / 2 / zoom - pos.x,
                  y: rect.height / 2 / zoom - pos.y,
                })
              }
            }}
            onEditClick={handleSidebarEditClick}
            onCompleteTask={handleMarkComplete}
        />

        {/* Модалка редагування */}
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
  )
}

