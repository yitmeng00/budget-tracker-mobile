import { View, Text } from 'react-native';
import { formatCurrency } from '@/lib/currency';
import type { UserSettings } from '@/types';

interface Props {
  income: number;
  expenses: number;
  net: number;
  settings: UserSettings;
}

interface CardProps {
  label: string;
  amount: number;
  amountColor: string;
}

function Card({ label, amount, amountColor }: CardProps) {
  return (
    <View className="flex-1 bg-surface rounded-2xl p-3 items-center">
      <Text className="text-text-muted text-xs mb-1">{label}</Text>
      <Text
        style={{ color: amountColor }}
        className="text-sm font-semibold"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {amount.toFixed(2)}
      </Text>
    </View>
  );
}

export default function SummaryCards({ income, expenses, net, settings }: Props) {
  const fmt = (n: number) => formatCurrency(n, settings);

  return (
    <View className="flex-row gap-2 px-4 py-3">
      <View className="flex-1 bg-surface rounded-2xl p-3 items-center">
        <Text className="text-text-muted text-xs mb-1">Income</Text>
        <Text className="text-income text-sm font-semibold" numberOfLines={1} adjustsFontSizeToFit>
          {fmt(income)}
        </Text>
      </View>

      <View className="flex-1 bg-surface rounded-2xl p-3 items-center">
        <Text className="text-text-muted text-xs mb-1">Expenses</Text>
        <Text className="text-expense text-sm font-semibold" numberOfLines={1} adjustsFontSizeToFit>
          {fmt(expenses)}
        </Text>
      </View>

      <View className="flex-1 bg-surface rounded-2xl p-3 items-center">
        <Text className="text-text-muted text-xs mb-1">Net</Text>
        <Text
          style={{ color: net >= 0 ? '#16a34a' : '#ef4444' }}
          className="text-sm font-semibold"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {fmt(Math.abs(net))}
        </Text>
      </View>
    </View>
  );
}
