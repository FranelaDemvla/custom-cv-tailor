import { useTranslation } from "react-i18next";
import { GripVertical, X } from "lucide-react";
import { clsx } from "clsx";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type SkillItem = { id: string; skill: string };
export const skillChipClass =
  "inline-flex shrink-0 items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2 py-1 rounded-md border border-brand-100";

export default function SortableSkill({
  item,
  instructionsId,
  onMove,
  onRemove,
}: {
  item: SkillItem;
  instructionsId: string;
  onMove: (direction: number) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    transition: { duration: 180, easing: "ease-out" },
  });
  return (
    <span
      ref={setNodeRef}
      data-skill-id={item.id}
      className={clsx(
        skillChipClass,
        "motion-reduce:transition-none!",
        isDragging && "opacity-25 border-dashed",
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        data-skill-handle
        aria-label={t("editor:skills.reorder", { skill: item.skill })}
        aria-describedby={instructionsId}
        className="touch-none cursor-grab active:cursor-grabbing rounded text-brand-400 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        onKeyDown={(event) => {
          const direction = {
            ArrowLeft: -1,
            ArrowUp: -1,
            ArrowRight: 1,
            ArrowDown: 1,
          }[event.key];
          if (direction === undefined || isDragging) return;
          event.preventDefault();
          onMove(direction);
        }}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      {item.skill}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("editor:skills.remove", { skill: item.skill })}
        className="text-brand-400 hover:text-red-500 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
