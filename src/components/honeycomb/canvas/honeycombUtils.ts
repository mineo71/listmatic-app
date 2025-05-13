import type { HoneycombItem } from "./HoneycombTypes"

export const HEXAGON_SIZE = 60
export const HEXAGON_WIDTH = 2 * HEXAGON_SIZE

export const axialToPixel = (q: number, r: number) => {
    const x = HEXAGON_SIZE * (3 / 2) * q
    const y = HEXAGON_SIZE * (Math.sqrt(3) * (r + q / 2))
    return { x, y }
}

export const hexagonDirections = [
    { dq: 1, dr: 0 },
    { dq: 0, dr: 1 },
    { dq: -1, dr: 1 },
    { dq: -1, dr: 0 },
    { dq: 0, dr: -1 },
    { dq: 1, dr: -1 },
]

export const getAvailableNeighbors = (hex: HoneycombItem, items: HoneycombItem[]) => {
    return hexagonDirections
        .map((direction) => ({
            q: hex.q + direction.dq,
            r: hex.r + direction.dr,
            parentId: hex.id,
        }))
        .filter((neighbor) => !items.some((item) => item.q === neighbor.q && item.r === neighbor.r))
}

export const findClosestNeighbor = (mouseX: number, mouseY: number, items: HoneycombItem[]) => {
    let closestDistance = Number.POSITIVE_INFINITY
    let closestNeighbor: { q: number; r: number; parentId: string } | null = null

    items.forEach((hex) => {
        const availableNeighbors = getAvailableNeighbors(hex, items)
        availableNeighbors.forEach((neighbor) => {
            const pixel = axialToPixel(neighbor.q, neighbor.r)
            const distance = Math.sqrt(Math.pow(mouseX - pixel.x, 2) + Math.pow(mouseY - pixel.y, 2))
            if (distance < closestDistance) {
                closestDistance = distance
                closestNeighbor = neighbor
            }
        })
    })

    return closestNeighbor && closestDistance < HEXAGON_WIDTH ? closestNeighbor : null
}

