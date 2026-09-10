import type {
  AppPreferences,
  ProviderSettings,
  ThemePreference,
} from "../types";

const KEY = "custom-cv.preferences.v1";

export function readPreferences(defaultProvider: ProviderSettings): AppPreferences {
  const fallback: AppPreferences = {
    schemaVersion: 1,
    defaultProvider,
    theme: "system",
    language: "en",
    lastActiveId: null,
  };
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const record = JSON.parse(raw) as Record<string, unknown>;
    const provider = record.defaultProvider && typeof record.defaultProvider === "object"
      ? record.defaultProvider as Record<string, unknown>
      : {};
    return {
      schemaVersion: 1,
      defaultProvider: {
        provider: provider.provider === "openai" ? "openai" : "local",
        model: typeof provider.model === "string" ? provider.model : defaultProvider.model,
        baseUrl: typeof provider.baseUrl === "string" ? provider.baseUrl : defaultProvider.baseUrl,
        transport: provider.transport === "responses" ? "responses" : "chat",
      },
      theme: record.theme === "light" || record.theme === "dark" ? record.theme : "system",
      language: record.language === "es" ? "es" : "en",
      lastActiveId: typeof record.lastActiveId === "string" ? record.lastActiveId : null,
    };
  } catch {
    return fallback;
  }
}

export function savePreferences(
  preferences: Partial<AppPreferences>,
  defaults: AppPreferences,
) {
  if (typeof localStorage === "undefined") return;
  const next: AppPreferences = {
    ...defaults,
    ...preferences,
    schemaVersion: 1,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Preferences are helpful but should not block document editing.
  }
}

export function saveThemePreference(theme: ThemePreference, defaults: AppPreferences) {
  savePreferences({ theme }, defaults);
}
