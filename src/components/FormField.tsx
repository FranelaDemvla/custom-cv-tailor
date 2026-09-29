import { clsx } from "clsx";
import { useId } from "react";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--ui-muted)">
      {children}
    </h4>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <label htmlFor={id} className="field-label text-[10px]">
          {label}
        </label>
      )}
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx("ui-control w-full py-1 text-xs")}
      />
    </div>
  );
}
