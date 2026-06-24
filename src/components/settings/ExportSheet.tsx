import { useRef, useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import { useColors } from '@/context/ThemeContext';
import { MONTH_SHORT } from '@/lib/constants';
import { exportTransactionsCSV, type ExportScope } from '@/services/importExport';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type ScopeType = 'month' | 'year' | 'all';

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;

// Past 24 months including current
const MONTHS_24: { year: number; month: number }[] = [];
for (let i = 0; i < 24; i++) {
  let m = CURRENT_MONTH - i;
  let y = CURRENT_YEAR;
  while (m <= 0) {
    m += 12;
    y -= 1;
  }
  MONTHS_24.push({ year: y, month: m });
}

// Current year + 2 previous
const YEARS: number[] = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function ExportSheet({ visible, onClose }: Props) {
  const colors = useColors();
  const backdrop = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(800)).current;

  const [scopeType, setScopeType] = useState<ScopeType>('month');
  const [selectedMonth, setSelectedMonth] = useState({ year: CURRENT_YEAR, month: CURRENT_MONTH });
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(false);

  function handleClose() {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 800, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  useEffect(() => {
    if (visible) {
      backdrop.setValue(0);
      translateY.setValue(800);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 35,
          stiffness: 400,
          mass: 1,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(backdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function handleExport() {
    if (loading) return;
    setLoading(true);
    try {
      let scope: ExportScope;
      if (scopeType === 'month') {
        scope = { type: 'month', year: selectedMonth.year, month: selectedMonth.month };
      } else if (scopeType === 'year') {
        scope = { type: 'year', year: selectedYear };
      } else {
        scope = { type: 'all' };
      }
      await exportTransactionsCSV(scope);
      handleClose();
    } catch (e) {
      Alert.alert('Export Failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const SCOPE_LABELS: { value: ScopeType; label: string }[] = [
    { value: 'month', label: 'Monthly' },
    { value: 'year', label: 'Yearly' },
    { value: 'all', label: 'All time' },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={{ flex: 1 }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            opacity: backdrop,
          }}
        />
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            transform: [{ translateY }],
          }}
        >
          {/* Drag indicator */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={handleClose} style={{ minWidth: 60 }}>
              <Text style={{ fontSize: 15, color: colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
              Export CSV
            </Text>
            <TouchableOpacity
              onPress={handleExport}
              disabled={loading}
              style={{ minWidth: 60, alignItems: 'flex-end' }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: loading ? colors.textFaint : colors.accent,
                }}
              >
                {loading ? 'Exporting…' : 'Export'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 36 }}>
            {/* Scope type picker */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 10,
              }}
            >
              Range
            </Text>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.bg,
                borderRadius: 10,
                padding: 3,
                marginBottom: 20,
              }}
            >
              {SCOPE_LABELS.map((s) => {
                const active = scopeType === s.value;
                return (
                  <TouchableOpacity
                    key={s.value}
                    onPress={() => setScopeType(s.value)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 7,
                      alignItems: 'center',
                      backgroundColor: active ? colors.surface : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: active ? '600' : '400',
                        color: active ? colors.textPrimary : colors.textMuted,
                      }}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Monthly picker */}
            {scopeType === 'month' && (
              <>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    marginBottom: 10,
                  }}
                >
                  Month
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginHorizontal: -16 }}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                  {MONTHS_24.map((m) => {
                    const isSelected =
                      selectedMonth.year === m.year && selectedMonth.month === m.month;
                    const label =
                      `${MONTH_SHORT[m.month - 1]} ${m.year !== CURRENT_YEAR ? m.year : ''}`.trim();
                    return (
                      <TouchableOpacity
                        key={`${m.year}-${m.month}`}
                        onPress={() => setSelectedMonth(m)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: isSelected ? colors.accent : colors.bg,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: isSelected ? '600' : '400',
                            color: isSelected ? 'white' : colors.textPrimary,
                          }}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Yearly picker */}
            {scopeType === 'year' && (
              <>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    marginBottom: 10,
                  }}
                >
                  Year
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {YEARS.map((y) => {
                    const isSelected = selectedYear === y;
                    return (
                      <TouchableOpacity
                        key={y}
                        onPress={() => setSelectedYear(y)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: 'center',
                          backgroundColor: isSelected ? colors.accent : colors.bg,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: isSelected ? '600' : '400',
                            color: isSelected ? 'white' : colors.textPrimary,
                          }}
                        >
                          {y}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* All time – no sub-selection needed */}
            {scopeType === 'all' && (
              <Text style={{ fontSize: 14, color: colors.textMuted }}>
                All transactions will be included in the export.
              </Text>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
