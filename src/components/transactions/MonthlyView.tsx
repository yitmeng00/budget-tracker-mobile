import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useMonthsForYear } from '@/hooks/useStats';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/currency';
import { colors } from '@/lib/colors';
import { MONTH_NAMES } from '@/lib/constants';
import TransactionItem from './TransactionItem';
import type { MonthlySummary, Transaction, UserSettings } from '@/types';

interface Props {
  year: number;
  settings: UserSettings;
  onPressTransaction?: (t: Transaction) => void;
  onDuplicateTransaction?: (t: Transaction) => void;
}

export default function MonthlyView({
  year,
  settings,
  onPressTransaction,
  onDuplicateTransaction,
}: Props) {
  const { data: months = [] } = useMonthsForYear(year);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={{ marginHorizontal: 16, marginTop: 8 }}>
        {months.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>No data for {year}</Text>
          </View>
        ) : (
          [...months]
            .reverse()
            .map((m) => (
              <MonthRow
                key={m.month}
                summary={m}
                year={year}
                settings={settings}
                onPressTransaction={onPressTransaction}
                onDuplicateTransaction={onDuplicateTransaction}
              />
            ))
        )}
      </View>
    </ScrollView>
  );
}

function MonthRow({
  summary,
  year,
  settings,
  onPressTransaction,
  onDuplicateTransaction,
}: {
  summary: MonthlySummary;
  year: number;
  settings: UserSettings;
  onPressTransaction?: (t: Transaction) => void;
  onDuplicateTransaction?: (t: Transaction) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: transactions = [] } = useTransactions(year, summary.month);

  const net = summary.income - summary.expenses;

  return (
    <View
      style={{
        marginBottom: 10,
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity onPress={() => setExpanded((prev) => !prev)} activeOpacity={0.7}>
        <View style={{ padding: 16 }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
              {MONTH_NAMES[summary.month - 1]}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: net >= 0 ? colors.income : colors.expense,
              }}
            >
              {net >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(net), settings)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 5 }}>
            <Text style={{ fontSize: 14, color: colors.income }}>
              ↑ {formatCurrency(summary.income, settings)}
            </Text>
            <Text style={{ fontSize: 14, color: colors.expense }}>
              ↓ {formatCurrency(summary.expenses, settings)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          {transactions.length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>No transactions</Text>
            </View>
          ) : (
            transactions.map((t, idx) => (
              <View key={t.id}>
                {idx > 0 && (
                  <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />
                )}
                <TransactionItem
                  transaction={t}
                  settings={settings}
                  onPress={onPressTransaction}
                  onDuplicate={onDuplicateTransaction}
                />
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}
