import { createContext, useContext, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSettings } from '@/hooks/useSettings';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { lightColors, darkColors, type ColorPalette } from '@/lib/colors';

type ThemeContextValue = {
  colors: ColorPalette;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: settings = DEFAULT_SETTINGS } = useSettings();
  const systemScheme = useColorScheme();

  const isDark =
    settings.theme === 'dark' || (settings.theme === 'system' && systemScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    // null releases the override so the OS value takes effect;
    // cast required because RN 0.85 types narrowed the parameter to 'light' | 'dark'
    Appearance.setColorScheme(
      (settings.theme === 'system' ? null : settings.theme) as 'light' | 'dark',
    );
  }, [settings.theme]);

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useColors(): ColorPalette {
  return useContext(ThemeContext).colors;
}

export function useIsDark(): boolean {
  return useContext(ThemeContext).isDark;
}
