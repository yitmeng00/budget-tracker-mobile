import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
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
import { useBudgets } from '@/hooks/useBudgets';
import type { BudgetEntry, CategoryStats, UserSettings } from '@/types';

type Period = 'month' | 'year';

export default function StatsScreen() {
  const [period, setPeriod] = useState<Period>('month');
  const { year, month, prev, next, jumpTo } = useMonth();
  const currentYear = new Date().getFullYear();
  const [yearView, setYearView] = useState(currentYear);

  const { data: settings = DEFAULT_SETTINGS } = useSettings();

  // Budget (monthly only)
  const { data: budgets = [] } = useBudgets(year, month);

  // Month period
  const { data: trend = [], isPlaceholderData: trendStale } = useMonthsTrend(year, month, 6);
  const { data: expCatsMonth = [] } = useCategoryStats(year, month, 'expense');
  const { data: incCatsMonth = [] } = useCategoryStats(year, month, 'income');

  // Year period
  const { data: yearlySummary = { income: 0, expenses: 0 }, isPlaceholderData: yearStale } =
    useYearlySummary(yearView);
  const { data: monthsInYear = [] } = useMonthsForYear(yearView);
  const { data: expCatsYear = [] } = useYearlyCategoryStats(yearView, 'expense');
  const { data: incCatsYear = [] } = useYearlyCategoryStats(yearView, 'income');

  const isStale = period === 'month' ? trendStale : yearStale;

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

      <View style={{ flex: 1, opacity: isStale ? 0.4 : 1 }}>
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
                    fontSize: 14,
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

          {/* Budget (monthly view only) */}
          {period === 'month' && budgets.some((b) => b.effective_amount !== null) && (
            <>
              <SectionLabel text="Budget" />
              <BudgetBreakdown budgets={budgets} settings={settings} />
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function BudgetBreakdown({
  budgets,
  settings,
}: {
  budgets: BudgetEntry[];
  settings: UserSettings;
}) {
  const budgeted = budgets.filter((b) => b.effective_amount !== null);
  const overCount = budgeted.filter((b) => b.spent > (b.effective_amount ?? 0)).length;

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
      {/* Summary row */}
      {overCount > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: '#fef2f2',
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.expense, fontWeight: '600' }}>
            {overCount} {overCount === 1 ? 'category' : 'categories'} over budget
          </Text>
        </View>
      )}

      {budgeted.map((entry, idx) => {
        const budget = entry.effective_amount ?? 0;
        const pct = budget > 0 ? entry.spent / budget : 0;
        const clamped = Math.min(pct, 1);
        const isOver = entry.spent > budget;
        const barColor = isOver ? colors.expense : pct >= 0.8 ? '#f59e0b' : colors.income;

        return (
          <View
            key={entry.category_id}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 11,
              borderTopWidth: idx === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            {/* Row 1: dot + name + over badge + amounts */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: entry.category_color,
                  marginRight: 8,
                }}
              />
              <Text style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}>
                {entry.category_name}
              </Text>
              {isOver && (
                <View
                  style={{
                    backgroundColor: '#fef2f2',
                    borderRadius: 6,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.expense }}>
                    OVER
                  </Text>
                </View>
              )}
              <Text style={{ fontSize: 14, color: isOver ? colors.expense : colors.textMuted }}>
                {formatCurrency(entry.spent, settings)}
                <Text style={{ color: colors.textFaint }}>
                  {' '}
                  / {formatCurrency(budget, settings)}
                </Text>
              </Text>
            </View>

            {/* Row 2: progress bar */}
            <View style={{ paddingLeft: 16 }}>
              <View
                style={{
                  height: 5,
                  backgroundColor: colors.bg,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${clamped * 100}%`,
                    height: '100%',
                    backgroundColor: barColor,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
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
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
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
                style={{ width: 34, textAlign: 'right', fontSize: 12, color: colors.textMuted }}
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
