import { SectionList, View, Text } from 'react-native';
import TransactionItem from './TransactionItem';
import { formatCurrency } from '@/lib/currency';
import { formatDateHeader } from '@/lib/date';
import { colors } from '@/lib/colors';
import type { Transaction, UserSettings } from '@/types';

interface Section {
  date: string;
  income: number;
  expenses: number;
  data: Transaction[];
}

function groupByDate(transactions: Transaction[]): Section[] {
  const map: Record<string, Section> = {};
  for (const t of transactions) {
    if (!map[t.date]) {
      map[t.date] = { date: t.date, income: 0, expenses: 0, data: [] };
    }
    map[t.date].data.push(t);
    if (t.amount > 0) map[t.date].income += t.amount;
    else map[t.date].expenses += Math.abs(t.amount);
  }
  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
}

interface Props {
  transactions: Transaction[];
  settings: UserSettings;
  onPressTransaction?: (t: Transaction) => void;
  onDuplicateTransaction?: (t: Transaction) => void;
  ListHeaderComponent?: React.ReactElement;
}

export default function DailyView({
  transactions,
  settings,
  onPressTransaction,
  onDuplicateTransaction,
  ListHeaderComponent,
}: Props) {
  const sections = groupByDate(transactions);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={ListHeaderComponent}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      renderSectionHeader={({ section }) => {
        const net = section.income - section.expenses;
        return (
          <View className="flex-row items-center justify-between px-4 py-2 bg-bg">
            <Text className="text-text-muted text-xs font-semibold">
              {formatDateHeader(section.date)}
            </Text>
            <Text
              style={{ color: net >= 0 ? colors.income : colors.expense }}
              className="text-xs font-semibold"
            >
              {net >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(net), settings)}
            </Text>
          </View>
        );
      }}
      renderItem={({ item, index, section }) => (
        <View>
          <TransactionItem
            transaction={item}
            settings={settings}
            onPress={onPressTransaction}
            onDuplicate={onDuplicateTransaction}
          />
          {index < section.data.length - 1 && <View className="h-px bg-border ml-16" />}
        </View>
      )}
      SectionSeparatorComponent={() => <View className="h-2" />}
      ListEmptyComponent={
        <View className="items-center py-16">
          <Text className="text-text-muted text-sm">No transactions this month</Text>
        </View>
      }
    />
  );
}
