import type { SortingStrategy } from "@dnd-kit/sortable";

// Pack the proposed order using the same dimensions and gap as the flex list.
// Swapping rectangles would stretch differently sized skill chips.
export function skillSortingTransform(
  { rects, activeIndex, overIndex, index }: Parameters<SortingStrategy>[0],
  width: number,
  gap: number,
): ReturnType<SortingStrategy> {
  const original = rects[index];
  if (!original || activeIndex < 0 || overIndex < 0 || !rects.length)
    return null;
  const order = rects.map((_, i) => i);
  order.splice(overIndex, 0, ...order.splice(activeIndex, 1));
  const left = rects[0].left;
  const top = rects[0].top;
  let x = 0;
  let y = 0;
  let rowHeight = 0;

  for (const item of order) {
    const rect = rects[item];
    if (!rect) return null;
    if (x > 0 && x + rect.width > width + 0.5) {
      x = 0;
      y += rowHeight + gap;
      rowHeight = 0;
    }
    if (item === index) {
      return {
        x: left + x - original.left,
        y: top + y - original.top,
        scaleX: 1,
        scaleY: 1,
      };
    }
    x += rect.width + gap;
    rowHeight = Math.max(rowHeight, rect.height);
  }
  return null;
}
