import { View, Text, TouchableOpacity } from 'react-native';
import { useColors } from '@/context/ThemeContext';
import type { ViewMode } from '@/types';

interface Props {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const MODES: { key: ViewMode; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'monthly', label: 'Monthly' },
];

export default function ViewToggle({ value, onChange }: Props) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 8,
        backgroundColor: colors.bg,
        borderRadius: 12,
        padding: 3,
      }}
    >
      {MODES.map(({ key, label }) => {
        const active = value === key;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onChange(key)}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: 9,
              alignItems: 'center',
              backgroundColor: active ? colors.surface : 'transparent',
              ...(active && {
                shadowColor: '#000',
                shadowOpacity: 0.07,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1 },
              }),
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: active ? '600' : '400',
                color: active ? colors.textPrimary : colors.textMuted,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
