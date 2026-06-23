import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '@/lib/colors';
import { MONTH_SHORT, MONTH_NAMES } from '@/lib/constants';
import { formatCurrency } from '@/lib/currency';
import type { MonthlySummary, UserSettings } from '@/types';

const CHART_H = 130;

interface Props {
  months: MonthlySummary[];
  settings: UserSettings;
}

export default function TrendChart({ months, settings }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (months.length === 0) {
    return (
      <View style={{ height: CHART_H + 40, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 14, color: colors.textMuted }}>No data</Text>
      </View>
    );
  }

  const maxVal = Math.max(...months.flatMap((m) => [m.income, m.expenses]), 0.01);
  const selected = selectedIdx !== null ? months[selectedIdx] : null;

  return (
    <View>
      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.income }}
          />
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Income</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.expense }}
          />
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Expenses</Text>
        </View>
      </View>

      {/* Bars */}
      <View style={{ flexDirection: 'row', height: CHART_H, gap: 6 }}>
        {months.map((m, i) => {
          const incH = Math.max((m.income / maxVal) * CHART_H, m.income > 0 ? 3 : 0);
          const expH = Math.max((m.expenses / maxVal) * CHART_H, m.expenses > 0 ? 3 : 0);
          const isSelected = selectedIdx === i;
          const isDimmed = selectedIdx !== null && !isSelected;
          return (
            <TouchableOpacity
              key={`${m.year}-${m.month}`}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}
              onPress={() => setSelectedIdx((prev) => (prev === i ? null : i))}
              activeOpacity={0.75}
            >
              <View
                style={{
                  flex: 1,
                  height: incH,
                  backgroundColor: colors.income,
                  borderRadius: 4,
                  opacity: isDimmed ? 0.25 : 0.85,
                }}
              />
              <View
                style={{
                  flex: 1,
                  height: expH,
                  backgroundColor: colors.expense,
                  borderRadius: 4,
                  opacity: isDimmed ? 0.25 : 0.85,
                }}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* X-axis labels */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
        {months.map((m, i) => (
          <Text
            key={`${m.year}-${m.month}`}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: selectedIdx === i ? '700' : '400',
              color: selectedIdx === i ? colors.accent : colors.textMuted,
            }}
          >
            {MONTH_SHORT[m.month - 1]}
          </Text>
        ))}
      </View>

      {/* Selected month detail */}
      {selected &&
        (() => {
          const net = selected.income - selected.expenses;
          return (
            <View
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: colors.bg,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: 10,
                }}
              >
                {MONTH_NAMES[selected.month - 1]} {selected.year}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 3 }}>
                    Income
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.income }}>
                    {formatCurrency(selected.income, settings)}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 3 }}>
                    Net
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
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 3 }}>
                    Expenses
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.expense }}>
                    {formatCurrency(selected.expenses, settings)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })()}
    </View>
  );
}
