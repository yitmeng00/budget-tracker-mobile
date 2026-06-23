import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMonth } from '@/hooks/useMonth';
import { useSettings } from '@/hooks/useSettings';
import {
  useMonthsTrend,
  useCategoryStats,
  useYearlySummary,
  useMonthsForYear,
  useYearlyCategoryStats,
} from '@/hooks/useStats';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import MonthHeader, { YearHeader } from '@/components/ui/MonthHeader';
import SummaryCards from '@/components/transactions/SummaryCards';
import TrendChart from '@/components/stats/TrendChart';
import DonutChart from '@/components/stats/DonutChart';
import { colors } from '@/lib/colors';
import { formatCurrency } from '@/lib/currency';
import type { CategoryStats, UserSettings } from '@/types';

type Period = 'month' | 'year';

export default function StatsScreen() {
  const [period, setPeriod] = useState<Period>('month');
  const { year, month, prev, next, jumpTo } = useMonth();
  const currentYear = new Date().getFullYear();
  const [yearView, setYearView] = useState(currentYear);

  const { data: settings = DEFAULT_SETTINGS } = useSettings();

  // Month period
  const { data: trend = [] } = useMonthsTrend(year, month, 6);
  const { data: expCatsMonth = [] } = useCategoryStats(year, month, 'expense');
  const { data: incCatsMonth = [] } = useCategoryStats(year, month, 'income');

  // Year period
  const { data: yearlySummary = { income: 0, expenses: 0 } } = useYearlySummary(yearView);
  const { data: monthsInYear = [] } = useMonthsForYear(yearView);
  const { data: expCatsYear = [] } = useYearlyCategoryStats(yearView, 'expense');
  const { data: incCatsYear = [] } = useYearlyCategoryStats(yearView, 'income');

  const monthData = trend.find((m) => m.year === year && m.month === month) ?? {
    income: 0,
    expenses: 0,
  };
  const monthlyNet = monthData.income - monthData.expenses;
  const yearlyNet = yearlySummary.income - yearlySummary.expenses;

  const expCats = period === 'month' ? expCatsMonth : expCatsYear;
  const incCats = period === 'month' ? incCatsMonth : incCatsYear;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      {/* Navigation */}
      {period === 'month' ? (
        <MonthHeader year={year} month={month} onPrev={prev} onNext={next} onJump={jumpTo} />
      ) : (
        <YearHeader
          year={yearView}
          onPrev={() => setYearView((y) => y - 1)}
          onNext={() => setYearView((y) => y + 1)}
          disableNext={yearView >= currentYear}
        />
      )}

      {/* Summary cards */}
      {period === 'month' ? (
        <SummaryCards
          income={monthData.income}
          expenses={monthData.expenses}
          net={monthlyNet}
          settings={settings}
        />
      ) : (
        <SummaryCards
          income={yearlySummary.income}
          expenses={yearlySummary.expenses}
          net={yearlyNet}
          settings={settings}
        />
      )}

      {/* Period toggle */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 16,
          marginTop: 6,
          marginBottom: 6,
          backgroundColor: colors.bg,
          borderRadius: 12,
          padding: 3,
        }}
      >
        {(['month', 'year'] as Period[]).map((p) => {
          const active = period === p;
          return (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
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
                  fontSize: 13,
                  fontWeight: active ? '600' : '400',
                  color: active ? colors.textPrimary : colors.textMuted,
                }}
              >
                {p === 'month' ? 'Month' : 'Year'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Trend chart */}
        <SectionLabel text={period === 'month' ? 'Last 6 Months' : 'Monthly Trend'} />
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <TrendChart months={period === 'month' ? trend : monthsInYear} settings={settings} />
        </View>

        {/* Expense categories */}
        {expCats.length > 0 && (
          <>
            <SectionLabel text="Expenses by Category" />
            <CategoryBreakdown items={expCats} settings={settings} />
          </>
        )}

        {/* Income categories */}
        {incCats.length > 0 && (
          <>
            <SectionLabel text="Income by Category" />
            <CategoryBreakdown items={incCats} settings={settings} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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

function CategoryBreakdown({
  items,
  settings,
}: {
  items: CategoryStats[];
  settings: UserSettings;
}) {
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
      <DonutChart items={items} settings={settings} />
      <View style={{ height: 1, backgroundColor: colors.border }} />
      {items.map((cat, idx) => {
        const pct = total > 0 ? (cat.total / total) * 100 : 0;
        const barWidth = `${Math.round(pct)}%` as `${number}%`;
        return (
          <View
            key={cat.category_id}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 11,
              borderTopWidth: idx === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            {/* Row 1: dot + name + amount */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: cat.category_color,
                  marginRight: 8,
                }}
              />
              <Text style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}>
                {cat.category_name}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>
                {formatCurrency(cat.total, settings)}
              </Text>
            </View>
            {/* Row 2: progress bar + percentage */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 16 }}>
              <View
                style={{
                  flex: 1,
                  height: 5,
                  backgroundColor: colors.bg,
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginRight: 8,
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
              <Text
                style={{ width: 34, textAlign: 'right', fontSize: 11, color: colors.textMuted }}
              >
                {Math.round(pct)}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
