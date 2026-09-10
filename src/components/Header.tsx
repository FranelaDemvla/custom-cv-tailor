import { useTranslation } from "react-i18next";
import i18next from "i18next";
import type { ChangeEvent } from "react";
import { FileText, Globe, Moon, Settings2, Sun } from "lucide-react";
import type { ThemePreference } from "../types";

interface HeaderProps {
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onOpenSettings: () => void;
}

const LANGUAGES = [
  { code: "en", key: "common:language.en" as const },
  { code: "es", key: "common:language.es" as const },
];

export default function Header({
  themePreference,
  onThemeChange,
  onOpenSettings,
}: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="border-b border-(--ui-border) bg-(--ui-panel)">
      <div className="mx-auto flex max-w-400 items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-(--ui-text)">
            {t("common:app.title")}
          </h1>
          <p className="hidden text-[11px] text-(--ui-muted) sm:block">
            {t("common:app.subtitle")}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-1.5 sm:flex">
            <Globe className="h-3.5 w-3.5 text-(--ui-muted)" />
            <select
              value={i18next.language.slice(0, 2)}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                i18next.changeLanguage(event.target.value)
              }
              className="ui-compact-control"
              aria-label={t("common:language.label")}
            >
              {LANGUAGES.map(({ code, key }) => (
                <option key={code} value={code}>{t(key)}</option>
              ))}
            </select>
          </div>
          <select
            value={themePreference}
            onChange={(event) => onThemeChange(event.target.value as ThemePreference)}
            className="ui-compact-control"
            aria-label={t("workspace:theme.label")}
          >
            <option value="system">{t("workspace:theme.system")}</option>
            <option value="light">{t("workspace:theme.light")}</option>
            <option value="dark">{t("workspace:theme.dark")}</option>
          </select>
          <span className="hidden text-(--ui-muted) sm:block" aria-hidden="true">
            {themePreference === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          </span>
          <button type="button" onClick={onOpenSettings} className="ui-secondary-button px-2.5" aria-label={t("workspace:actions.settings")}>
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t("workspace:actions.settings")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
