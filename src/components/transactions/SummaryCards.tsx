import { View, Text } from 'react-native';
import { formatCurrency } from '@/lib/currency';
import { useColors } from '@/context/ThemeContext';
import type { UserSettings } from '@/types';

interface Props {
  income: number;
  expenses: number;
  net: number;
  settings: UserSettings;
}

export default function SummaryCards({ income, expenses, net, settings }: Props) {
  const colors = useColors();
  const fmt = (n: number) => formatCurrency(n, settings);

  const cardStyle = {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center' as const,
  };
  const labelStyle = { fontSize: 12, color: colors.textMuted, marginBottom: 4 };
  const valueStyle = { fontSize: 14, fontWeight: '600' as const };

  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={cardStyle}>
        <Text style={labelStyle}>Income</Text>
        <Text style={[valueStyle, { color: colors.income }]} numberOfLines={1} adjustsFontSizeToFit>
          {fmt(income)}
        </Text>
      </View>

      <View style={cardStyle}>
        <Text style={labelStyle}>Expenses</Text>
        <Text
          style={[valueStyle, { color: colors.expense }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {fmt(expenses)}
        </Text>
      </View>

      <View style={cardStyle}>
        <Text style={labelStyle}>Net</Text>
        <Text
          style={[valueStyle, { color: net >= 0 ? colors.income : colors.expense }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {fmt(Math.abs(net))}
        </Text>
      </View>
    </View>
  );
}
