import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import type { ChangeEvent } from 'react';
import { FileText, Cpu, Globe } from 'lucide-react';
import type { Model } from '../types';

interface HeaderProps {
  model: Model;
  onModelChange: (model: Model) => void;
}

const LANGUAGES = [
  { code: 'en', key: 'common:language.en' as const },
  { code: 'es', key: 'common:language.es' as const },
];

export default function Header({ model, onModelChange }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="border-b border-surface-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
        <FileText className="w-6 h-6 text-brand-600" />
        <h1 className="text-xl font-semibold text-surface-900">{t('common:app.title')}</h1>
        <span className="text-sm text-surface-400">{t('common:app.subtitle')}</span>
        <div className="ml-auto flex items-center gap-2">
          <Globe className="w-4 h-4 text-surface-400" />
          <select
            value={i18next.language}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => i18next.changeLanguage(e.target.value)}
            className="text-sm border border-surface-200 rounded-lg px-3 py-1.5 bg-surface-50 text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {LANGUAGES.map(({ code, key }) => (
              <option key={code} value={code}>
                {t(key)}
              </option>
            ))}
          </select>
          <Cpu className="w-4 h-4 text-surface-400" />
          <select
            value={model}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onModelChange(e.target.value as Model)}
            className="text-sm border border-surface-200 rounded-lg px-3 py-1.5 bg-surface-50 text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="local">{t('common:models.local')}</option>
            <option value="openai">{t('common:models.gpt4o')}</option>
          </select>
        </div>
      </div>
    </header>
  );
}