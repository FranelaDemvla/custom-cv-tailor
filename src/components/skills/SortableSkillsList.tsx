import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { GripVertical, X } from "lucide-react";
import { clsx } from "clsx";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type CollisionDetection,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { skillSortingTransform } from "../../lib/skillSorting";
import SortableSkill, { skillChipClass, type SkillItem } from "./SortableSkill";

const dropAnimation = {
  duration: 180,
  easing: "ease-out",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0" } },
  }),
};

export default function SortableSkillsList({
  items,
  instructionsId,
  onMove,
  onRemove,
}: {
  items: SkillItem[];
  instructionsId: string;
  onMove: (from: number, to: number) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();
  const skillsList = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState<SkillItem | null>(null);
  const [previousItems, setPreviousItems] = useState(items);
  const [reduceMotion, setReduceMotion] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // An incoming edit invalidates the current drag, but retains sortable keys.
  if (previousItems !== items) {
    setPreviousItems(items);
    setActiveItem(null);
  }

  const collisions: CollisionDetection = (args) => {
    const bounds = skillsList.current?.getBoundingClientRect();
    const pointer = args.pointerCoordinates;
    if (
      bounds &&
      pointer &&
      (pointer.x < bounds.left ||
        pointer.x > bounds.right ||
        pointer.y < bounds.top ||
        pointer.y > bounds.bottom)
    )
      return [];
    const hits = pointerWithin(args);
    if (hits.length) return hits;
    // Use the pointer, not the overlay's center: a wide skill should still
    // target the narrow chip directly under its handle.
    return closestCenter(
      pointer
        ? {
            ...args,
            collisionRect: {
              ...args.collisionRect,
              left: pointer.x,
              right: pointer.x,
              top: pointer.y,
              bottom: pointer.y,
              width: 0,
              height: 0,
            },
          }
        : args,
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisions}
      accessibility={{
        screenReaderInstructions: { draggable: t("editor:skills.reorderHint") },
        announcements: {
          onDragStart: () => t("editor:skills.reorderHint"),
          onDragOver: () => undefined,
          onDragEnd: () => undefined,
          onDragCancel: () => t("editor:skills.cancelled"),
        },
      }}
      onDragStart={({ active }) => {
        setActiveItem(items.find((item) => item.id === active.id) || null);
        setReduceMotion(
          window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        );
      }}
      onDragCancel={() => setActiveItem(null)}
      onDragEnd={({ active, over }) => {
        setActiveItem(null);
        if (over)
          onMove(
            items.findIndex((item) => item.id === active.id),
            items.findIndex((item) => item.id === over.id),
          );
      }}
    >
      <SortableContext
        items={items}
        strategy={(args) =>
          skillSortingTransform(args, skillsList.current?.clientWidth || 0, 6)
        }
      >
        <div ref={skillsList} className="flex flex-wrap gap-1.5">
          {items.map((item, index) => (
            <SortableSkill
              key={item.id}
              item={item}
              instructionsId={instructionsId}
              onMove={(direction) => onMove(index, index + direction)}
              onRemove={() => onRemove(item.id)}
            />
          ))}
        </div>
      </SortableContext>
      {createPortal(
        <DragOverlay dropAnimation={reduceMotion ? null : dropAnimation}>
          {activeItem ? (
            <span
              data-skill-overlay
              aria-hidden="true"
              className={clsx(
                skillChipClass,
                "w-full h-full cursor-grabbing shadow-lg ring-2 ring-brand-500",
              )}
            >
              <GripVertical className="w-3.5 h-3.5 text-brand-400" />
              {activeItem.skill}
              <X className="w-3 h-3 text-brand-400" />
            </span>
          ) : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}
