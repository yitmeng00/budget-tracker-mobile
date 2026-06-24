import { View, Text, TouchableOpacity } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Copy } from 'lucide-react-native';
import { formatCurrency } from '@/lib/currency';
import { useColors } from '@/context/ThemeContext';
import type { Transaction, UserSettings } from '@/types';

interface Props {
  transaction: Transaction;
  settings: UserSettings;
  onPress?: (transaction: Transaction) => void;
  onDuplicate?: (transaction: Transaction) => void;
}

export default function TransactionItem({ transaction, settings, onPress, onDuplicate }: Props) {
  const colors = useColors();
  const { category, account, amount, note } = transaction;
  const isIncome = amount > 0;
  const formatted = `${isIncome ? '+' : '-'}${formatCurrency(Math.abs(amount), settings)}`;

  function renderRightActions() {
    return (
      <TouchableOpacity
        onPress={() => onDuplicate?.(transaction)}
        style={{
          backgroundColor: colors.accent,
          justifyContent: 'center',
          alignItems: 'center',
          width: 76,
        }}
      >
        <Copy color="white" size={18} />
        <Text style={{ color: 'white', fontSize: 11, fontWeight: '600', marginTop: 4 }}>
          Duplicate
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <ReanimatedSwipeable
      renderRightActions={onDuplicate ? renderRightActions : undefined}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        onPress={() => onPress?.(transaction)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.surface,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}
            numberOfLines={1}
          >
            {category?.name ?? 'Unknown'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
            {note || account?.name || ''}
          </Text>
        </View>

        <Text
          style={{
            color: isIncome ? colors.income : colors.expense,
            fontSize: 14,
            fontWeight: '600',
            marginLeft: 8,
          }}
        >
          {formatted}
        </Text>
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
}
