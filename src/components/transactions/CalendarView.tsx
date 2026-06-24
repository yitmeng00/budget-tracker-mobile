import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/lib/colors';
import { todayISO } from '@/lib/date';
import { formatCurrency } from '@/lib/currency';
import TransactionItem from './TransactionItem';
import type { Transaction, UserSettings, WeekDay } from '@/types';

const ALL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOffset(weekStart: WeekDay): number {
  if (weekStart === 'Monday') return 1;
  if (weekStart === 'Saturday') return 6;
  return 0;
}

function dayHeaders(weekStart: WeekDay): string[] {
  const off = startOffset(weekStart);
  return [...ALL_DAYS.slice(off), ...ALL_DAYS.slice(0, off)];
}

function buildGrid(year: number, month: number, weekStart: WeekDay): (number | null)[] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const leading = (firstDow - startOffset(weekStart) + 7) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = Array(leading).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

type DayMap = Record<string, { income: number; expenses: number }>;

function buildDayMap(transactions: Transaction[]): DayMap {
  const map: DayMap = {};
  for (const t of transactions) {
    if (!map[t.date]) map[t.date] = { income: 0, expenses: 0 };
    if (t.amount > 0) map[t.date].income += t.amount;
    else map[t.date].expenses += Math.abs(t.amount);
  }
  return map;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function fmtShort(n: number): string {
  const sign = n >= 0 ? '+' : '-';
  const abs = Number(Math.abs(n).toFixed(2));
  return `${sign}${abs}`;
}

interface Props {
  year: number;
  month: number;
  transactions: Transaction[];
  settings: UserSettings;
  onPressTransaction: (t: Transaction) => void;
  onDuplicateTransaction?: (t: Transaction) => void;
}

export default function CalendarView({
  year,
  month,
  transactions,
  settings,
  onPressTransaction,
  onDuplicateTransaction,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const weekStart = settings.week_start;
  const headers = useMemo(() => dayHeaders(weekStart), [weekStart]);
  const cells = useMemo(() => buildGrid(year, month, weekStart), [year, month, weekStart]);
  const dayMap = useMemo(() => buildDayMap(transactions), [transactions]);
  const today = todayISO();

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const selectedTransactions = selectedDate
    ? transactions.filter((t) => t.date === selectedDate)
    : [];

  function toggleDate(dateStr: string) {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      bounces={false}
    >
      {/* Day-of-week headers */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingTop: 4, paddingBottom: 2 }}>
        {headers.map((h) => (
          <View key={h} style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.textMuted,
                textTransform: 'uppercase',
              }}
            >
              {h}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar rows */}
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
          {row.map((day, colIdx) => {
            if (day === null) {
              return <View key={`e-${rowIdx}-${colIdx}`} style={{ flex: 1, height: 56 }} />;
            }
            const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
            const data = dayMap[dateStr];
            const isSelected = selectedDate === dateStr;
            const isToday = today === dateStr;

            return (
              <TouchableOpacity
                key={dateStr}
                onPress={() => toggleDate(dateStr)}
                style={{ flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected
                      ? colors.accent
                      : isToday
                        ? colors.accentSoft
                        : 'transparent',
                    borderWidth: isToday && !isSelected ? 1.5 : 0,
                    borderColor: colors.accent,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isToday || isSelected ? '700' : '400',
                      color: isSelected ? 'white' : isToday ? colors.accent : colors.textPrimary,
                    }}
                  >
                    {day}
                  </Text>
                </View>

                {data &&
                  (() => {
                    const net = data.income - data.expenses;
                    return (
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: '500',
                          marginTop: 2,
                          color: net >= 0 ? colors.income : colors.expense,
                        }}
                      >
                        {fmtShort(net)}
                      </Text>
                    );
                  })()}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Selected day transactions */}
      {selectedDate && (
        <View style={{ marginTop: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted }}>
              {selectedTransactions.length === 0
                ? 'No transactions'
                : `${selectedTransactions.length} transaction${selectedTransactions.length > 1 ? 's' : ''}`}
            </Text>
            {selectedTransactions.length > 0 && (
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color:
                    selectedTransactions.reduce((s, t) => s + t.amount, 0) >= 0
                      ? colors.income
                      : colors.expense,
                }}
              >
                {formatCurrency(
                  Math.abs(selectedTransactions.reduce((s, t) => s + t.amount, 0)),
                  settings,
                )}
              </Text>
            )}
          </View>

          {selectedTransactions.map((t, i) => (
            <View key={t.id}>
              <TransactionItem
                transaction={t}
                settings={settings}
                onPress={onPressTransaction}
                onDuplicate={onDuplicateTransaction}
              />
              {i < selectedTransactions.length - 1 && (
                <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
