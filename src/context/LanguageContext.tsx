import { createContext, useContext } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { translations, type Strings } from '@/lib/i18n';

const LanguageContext = createContext<Strings>(translations.en);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { data: settings = DEFAULT_SETTINGS } = useSettings();
  const strings = translations[settings.language] ?? translations.en;
  return <LanguageContext.Provider value={strings}>{children}</LanguageContext.Provider>;
}

export function useStrings(): Strings {
  return useContext(LanguageContext);
}
