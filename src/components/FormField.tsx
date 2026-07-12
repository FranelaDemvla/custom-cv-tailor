import { clsx } from "clsx";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
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
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] text-surface-400 font-medium">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          "w-full rounded border border-surface-200 bg-surface-50 px-2 py-1",
          "text-xs text-surface-800 placeholder:text-surface-400",
          "focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-transparent",
        )}
      />
    </div>
  );
}