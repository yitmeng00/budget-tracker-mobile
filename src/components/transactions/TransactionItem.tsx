import { View, Text, TouchableOpacity } from 'react-native';
import { formatCurrency } from '@/lib/currency';
import type { Transaction, UserSettings } from '@/types';

interface Props {
  transaction: Transaction;
  settings: UserSettings;
  onPress?: (transaction: Transaction) => void;
}

export default function TransactionItem({ transaction, settings, onPress }: Props) {
  const { category, account, amount, note } = transaction;
  const isIncome = amount > 0;
  const formatted = `${isIncome ? '+' : '-'}${formatCurrency(Math.abs(amount), settings)}`;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-3 bg-surface"
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: category?.color ?? '#8a96b8',
          marginRight: 12,
          flexShrink: 0,
        }}
      />

      <View className="flex-1 min-w-0">
        <Text className="text-text-primary text-sm font-medium" numberOfLines={1}>
          {category?.name ?? 'Unknown'}
        </Text>
        <Text className="text-text-muted text-xs" numberOfLines={1}>
          {note || account?.name || ''}
        </Text>
      </View>

      <Text
        style={{ color: isIncome ? '#16a34a' : '#ef4444' }}
        className="text-sm font-semibold ml-2"
      >
        {formatted}
      </Text>
    </TouchableOpacity>
  );
}
