import { View, Text, TouchableOpacity } from 'react-native';
import { getIcon } from '@/lib/icons';
import { formatCurrency } from '@/lib/currency';
import type { Transaction, UserSettings } from '@/types';

interface Props {
  transaction: Transaction;
  settings: UserSettings;
  onPress?: (transaction: Transaction) => void;
}

export default function TransactionItem({ transaction, settings, onPress }: Props) {
  const { category, account, amount, note } = transaction;
  const IconComponent = getIcon(category?.icon ?? 'more-horizontal');
  const isIncome = amount > 0;
  const sign = isIncome ? '+' : '-';
  const formatted = `${sign}${formatCurrency(amount, settings)}`;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-3 bg-surface"
    >
      <View
        style={{ backgroundColor: category?.color ?? '#8a96b8' }}
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
      >
        <IconComponent color="white" size={18} />
      </View>

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
