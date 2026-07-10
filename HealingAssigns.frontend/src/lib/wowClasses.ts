export const WOW_CLASSES = [
    { id: 1, name: 'Warrior', color: '#C69B6D' },
    { id: 2, name: 'Priest', color: '#FFFFFF' },
    { id: 3, name: 'Mage', color: '#3FC7EB' },
    { id: 4, name: 'Druid', color: '#FF7C0A' },
    { id: 5, name: 'Hunter', color: '#AAD372' },
    { id: 6, name: 'Rogue', color: '#FFF468' },
    { id: 7, name: 'Shaman', color: '#0070DD' },
    { id: 8, name: 'Paladin', color: '#F48CBA' },
    { id: 9, name: 'Warlock', color: '#8788EE' },
]

export function getClassColor(playerClassId: number | null): string | null {
    if (!playerClassId) return null
    return WOW_CLASSES.find((c) => c.id === playerClassId)?.color ?? null
}

export function getClassName(playerClassId: number | null): string | null {
    if (!playerClassId) return null
    return WOW_CLASSES.find((c) => c.id === playerClassId)?.name ?? null
}
