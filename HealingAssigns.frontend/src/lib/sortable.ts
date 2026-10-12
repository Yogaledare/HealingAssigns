import { defaultAnimateLayoutChanges, type AnimateLayoutChanges } from '@dnd-kit/sortable'

/** Skip dnd-kit's own layout animation while sorting and right after a drop.
 *  The optimistic cache update already puts every row where the user saw it
 *  land, so a second animation would make it slide twice. */
export const noAnimateOnDrop: AnimateLayoutChanges = (args) =>
    args.isSorting || args.wasDragging ? false : defaultAnimateLayoutChanges(args)
