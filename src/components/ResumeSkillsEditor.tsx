import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { arrayMove } from "@dnd-kit/sortable";
import { SectionLabel } from "./FormField";
import AddSkillInput from "./skills/AddSkillInput";
import SortableSkillsList from "./skills/SortableSkillsList";
import type { SkillItem } from "./skills/SortableSkill";
import type { ResumeData } from "../types";

export default function ResumeSkillsEditor({
  data,
  onChange,
}: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}) {
  const { t } = useTranslation();
  const instructionsId = useId();
  const [model, setModel] = useState<{
    source: ResumeData["skills"];
    items: SkillItem[];
  }>(() => ({
    source: data.skills,
    items: (data.skills || []).map((skill) => ({
      id: crypto.randomUUID(),
      skill,
    })),
  }));
  const [announcement, setAnnouncement] = useState("");

  // Preserve item identities, including duplicate labels, across incoming edits.
  if (model.source !== data.skills) {
    const remaining = [...model.items];
    setModel({
      source: data.skills,
      items: (data.skills || []).map((skill) => {
        const index = remaining.findIndex((item) => item.skill === skill);
        return index < 0
          ? { id: crypto.randomUUID(), skill }
          : remaining.splice(index, 1)[0];
      }),
    });
  }

  const updateSkills = (items: SkillItem[]) => {
    const skills = items.map((item) => item.skill);
    setModel({ source: skills, items });
    onChange({ ...data, skills });
  };

  const moveSkill = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || to >= model.items.length) return;
    updateSkills(arrayMove(model.items, from, to));
    setAnnouncement(
      t("editor:skills.moved", {
        skill: model.items[from].skill,
        position: to + 1,
        count: model.items.length,
      }),
    );
  };

  return (
    <div className="space-y-2">
      <SectionLabel>{t("editor:skills.label")}</SectionLabel>
      <p id={instructionsId} className="text-xs text-(--ui-muted)">
        {t("editor:skills.reorderHint")}
      </p>
      <SortableSkillsList
        items={model.items}
        instructionsId={instructionsId}
        onMove={moveSkill}
        onRemove={(id) =>
          updateSkills(model.items.filter((item) => item.id !== id))
        }
      />
      <span role="status" className="sr-only">
        {announcement}
      </span>
      <AddSkillInput
        onAdd={(skill) =>
          updateSkills([...model.items, { id: crypto.randomUUID(), skill }])
        }
      />
    </div>
  );
}
