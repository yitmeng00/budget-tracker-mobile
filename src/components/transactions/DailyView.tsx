import { SectionList, View, Text } from 'react-native';
import TransactionItem from './TransactionItem';
import { formatCurrency } from '@/lib/currency';
import { formatDateHeader } from '@/lib/date';
import { useColors } from '@/context/ThemeContext';
import { useStrings } from '@/context/LanguageContext';
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
  const colors = useColors();
  const t = useStrings();
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: colors.bg,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>
              {formatDateHeader(section.date)}
            </Text>
            <Text
              style={{
                color: net >= 0 ? colors.income : colors.expense,
                fontSize: 12,
                fontWeight: '600',
              }}
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
          {index < section.data.length - 1 && (
            <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
          )}
        </View>
      )}
      SectionSeparatorComponent={() => <View className="h-2" />}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingVertical: 64 }}>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>{t.noTransactionsThisMonth}</Text>
        </View>
      }
    />
  );
}
