import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { MONTH_NAMES, MONTH_SHORT } from '@/lib/constants';
import { colors } from '@/lib/colors';

interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (year: number, month: number) => void;
}

export default function MonthHeader({ year, month, onPrev, onNext, onJump }: Props) {
  const [picking, setPicking] = useState(false);
  const [pickYear, setPickYear] = useState(year);

  function openPicker() {
    setPickYear(year);
    setPicking(true);
  }

  function selectMonth(m: number) {
    onJump(pickYear, m);
    setPicking(false);
  }

  function selectThisMonth() {
    const now = new Date();
    onJump(now.getFullYear(), now.getMonth() + 1);
    setPicking(false);
  }

  const now = new Date();
  const isCurrentMonth = (y: number, m: number) =>
    y === now.getFullYear() && m === now.getMonth() + 1;

  return (
    <>
      <View className="flex-row items-center justify-between bg-surface px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={onPrev} hitSlop={12} className="p-1">
          <ChevronLeft color={colors.textMuted} size={22} />
        </TouchableOpacity>

        <TouchableOpacity onPress={openPicker} hitSlop={8}>
          <Text className="text-text-primary text-base font-semibold">
            {MONTH_NAMES[month - 1]} {year}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNext} hitSlop={12} className="p-1">
          <ChevronRight color={colors.textMuted} size={22} />
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={picking}
        animationType="fade"
        onRequestClose={() => setPicking(false)}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setPicking(false)}
        >
          {/* Card — stop propagation */}
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              width: 304,
            }}
          >
            {/* Year nav */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <TouchableOpacity onPress={() => setPickYear((y) => y - 1)} hitSlop={12}>
                <ChevronLeft color={colors.textMuted} size={20} />
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                {pickYear}
              </Text>
              <TouchableOpacity onPress={() => setPickYear((y) => y + 1)} hitSlop={12}>
                <ChevronRight color={colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            {/* Month grid — 4 columns */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MONTH_SHORT.map((name, i) => {
                const m = i + 1;
                const isSelected = m === month && pickYear === year;
                const isCurrent = isCurrentMonth(pickYear, m);
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => selectMonth(m)}
                    style={{
                      width: 60,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      backgroundColor: isSelected
                        ? colors.accent
                        : isCurrent
                          ? colors.accentSoft
                          : colors.bg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isSelected || isCurrent ? '600' : '400',
                        color: isSelected
                          ? 'white'
                          : isCurrent
                            ? colors.accent
                            : colors.textPrimary,
                      }}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* This Month */}
            <TouchableOpacity
              onPress={selectThisMonth}
              style={{
                marginTop: 16,
                paddingVertical: 11,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: colors.bg,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.accent }}>
                This Month
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

interface YearHeaderProps {
  year: number;
  onPrev: () => void;
  onNext: () => void;
  disableNext?: boolean;
}

export function YearHeader({ year, onPrev, onNext, disableNext }: YearHeaderProps) {
  return (
    <View className="flex-row items-center justify-between bg-surface px-4 py-3 border-b border-border">
      <TouchableOpacity onPress={onPrev} hitSlop={12} className="p-1">
        <ChevronLeft color={colors.textMuted} size={22} />
      </TouchableOpacity>

      <Text className="text-text-primary text-base font-semibold">{year}</Text>

      <TouchableOpacity onPress={onNext} hitSlop={12} className="p-1" disabled={disableNext}>
        <ChevronRight color={disableNext ? colors.border : colors.textMuted} size={22} />
      </TouchableOpacity>
    </View>
  );
}
