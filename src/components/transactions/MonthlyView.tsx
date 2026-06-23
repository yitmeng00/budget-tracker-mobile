import { View, Text, ScrollView } from 'react-native';
import { useMonthsForYear, useYearlyCategoryStats } from '@/hooks/useStats';
import { formatCurrency } from '@/lib/currency';
import { colors } from '@/lib/colors';
import { MONTH_SHORT } from '@/lib/constants';
import type { CategoryStats, UserSettings } from '@/types';

interface Props {
  year: number;
  settings: UserSettings;
}

export default function MonthlyView({ year, settings }: Props) {
  const { data: months = [] } = useMonthsForYear(year);
  const { data: expCats = [] } = useYearlyCategoryStats(year, 'expense');
  const { data: incCats = [] } = useYearlyCategoryStats(year, 'income');

  const maxMonth = Math.max(...months.map((m) => Math.max(m.income, m.expenses)), 0.01);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Monthly breakdown */}
      <SectionLabel text="By Month" />
      <View
        style={{
          marginHorizontal: 16,
          backgroundColor: colors.surface,
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        {months.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>No data for {year}</Text>
          </View>
        ) : (
          months.map((m, idx) => {
            const mNet = m.income - m.expenses;
            const iw = `${Math.round((m.income / maxMonth) * 100)}%` as `${number}%`;
            const ew = `${Math.round((m.expenses / maxMonth) * 100)}%` as `${number}%`;
            return (
              <View
                key={m.month}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                <View
                  style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
                    {MONTH_SHORT[m.month - 1]}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: mNet >= 0 ? colors.income : colors.expense,
                    }}
                  >
                    {mNet >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(mNet), settings)}
                  </Text>
                </View>

                {/* Income bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: colors.income,
                      marginRight: 8,
                    }}
                  />
                  <View
                    style={{
                      flex: 1,
                      height: 5,
                      backgroundColor: colors.bg,
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: iw,
                        height: '100%',
                        backgroundColor: colors.income,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                  <Text
                    style={{ width: 76, textAlign: 'right', fontSize: 11, color: colors.income }}
                  >
                    {formatCurrency(m.income, settings)}
                  </Text>
                </View>

                {/* Expense bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: colors.expense,
                      marginRight: 8,
                    }}
                  />
                  <View
                    style={{
                      flex: 1,
                      height: 5,
                      backgroundColor: colors.bg,
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: ew,
                        height: '100%',
                        backgroundColor: colors.expense,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                  <Text
                    style={{ width: 76, textAlign: 'right', fontSize: 11, color: colors.expense }}
                  >
                    {formatCurrency(m.expenses, settings)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Expense categories */}
      {expCats.length > 0 && (
        <>
          <SectionLabel text="Expenses by Category" />
          <CategoryList items={expCats} settings={settings} />
        </>
      )}

      {/* Income categories */}
      {incCats.length > 0 && (
        <>
          <SectionLabel text="Income by Category" />
          <CategoryList items={incCats} settings={settings} />
        </>
      )}
    </ScrollView>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingHorizontal: 20,
        marginBottom: 8,
      }}
    >
      {text}
    </Text>
  );
}

function CategoryList({ items, settings }: { items: CategoryStats[]; settings: UserSettings }) {
  const total = items.reduce((s, c) => s + c.total, 0);
  return (
    <View
      style={{
        marginHorizontal: 16,
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      {items.map((cat, idx) => {
        const pct = total > 0 ? (cat.total / total) * 100 : 0;
        const barWidth = `${Math.round(pct)}%` as `${number}%`;
        return (
          <View
            key={cat.category_id}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              borderTopWidth: idx === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: cat.category_color,
                marginRight: 10,
              }}
            />
            <Text style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}>
              {cat.category_name}
            </Text>
            <View
              style={{
                width: 72,
                height: 5,
                backgroundColor: colors.bg,
                borderRadius: 3,
                overflow: 'hidden',
                marginRight: 12,
              }}
            >
              <View
                style={{
                  width: barWidth,
                  height: '100%',
                  backgroundColor: cat.category_color,
                  borderRadius: 3,
                }}
              />
            </View>
            <Text style={{ width: 72, textAlign: 'right', fontSize: 13, color: colors.textMuted }}>
              {formatCurrency(cat.total, settings)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
