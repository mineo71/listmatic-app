"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { HoneycombItem, TaskIcon } from "./HoneycombTypes"
import { axialToPixel } from "./honeycombUtils"

export const useHoneycombItems = (onProgressUpdate: (progress: number) => void) => {
    const [items, setItems] = useState<HoneycombItem[]>([])
    const { t } = useTranslation()

    useEffect(() => {
        const mainPixel = axialToPixel(0, 0)
        setItems([
            {
                id: "main",
                q: 0,
                r: 0,
                x: mainPixel.x,
                y: mainPixel.y,
                title: t("hexagon.main_goal"),
                description: "",
                icon: "Star" as TaskIcon,
                priority: "high",
                completed: false,
                connections: [],
                color: "#FDE68A",
                isMain: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ])
    }, [t])

    useEffect(() => {
        const totalItems = items.filter((item) => !item.isMain).length
        const completedItems = items.filter((item) => !item.isMain && item.completed).length
        const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0
        onProgressUpdate(progress)
    }, [items, onProgressUpdate])

    return { items, setItems }
}

