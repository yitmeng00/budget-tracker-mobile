import { useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useCategories } from '@/hooks/useCategories';
import { useColors } from '@/context/ThemeContext';
import type { TransactionFilters } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: TransactionFilters;
  onChange: (f: TransactionFilters) => void;
}

const TYPE_OPTIONS: { label: string; value: TransactionFilters['type'] }[] = [
  { label: 'All', value: undefined },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
];

export default function FilterSheet({ visible, onClose, filters, onChange }: Props) {
  const colors = useColors();
  const { data: categories = [] } = useCategories();
  const backdrop = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(800)).current;

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

  function toggleType(value: TransactionFilters['type']) {
    onChange({
      ...filters,
      type: filters.type === value ? undefined : value,
      categoryIds: undefined,
    });
  }

  function toggleCategory(id: number) {
    const current = filters.categoryIds ?? [];
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    onChange({ ...filters, categoryIds: next.length ? next : undefined });
  }

  function handleClear() {
    onChange({});
  }

  const hasFilters = !!filters.type || (filters.categoryIds?.length ?? 0) > 0;

  const visibleCategories =
    filters.type === 'income'
      ? categories.filter((c) => c.type === 'income')
      : filters.type === 'expense'
        ? categories.filter((c) => c.type === 'expense')
        : categories;

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
            }}
          >
            {hasFilters ? (
              <TouchableOpacity onPress={handleClear}>
                <Text style={{ fontSize: 15, color: colors.expense }}>Clear</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 44 }} />
            )}
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
              Filter
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.accent }}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: 480 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          >
            {/* Type */}
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
              Type
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {TYPE_OPTIONS.map(({ label, value }) => {
                const active = filters.type === value;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => toggleType(value)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 10,
                      alignItems: 'center',
                      backgroundColor: active ? colors.accent : colors.bg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: active ? '600' : '400',
                        color: active ? 'white' : colors.textPrimary,
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Categories */}
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
              Category
            </Text>
            <View style={{ backgroundColor: colors.bg, borderRadius: 12, overflow: 'hidden' }}>
              {visibleCategories.map((cat, idx) => {
                const selected = (filters.categoryIds ?? []).includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      borderTopWidth: idx === 0 ? 0 : 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: cat.color,
                        marginRight: 10,
                      }}
                    />
                    <Text style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}>
                      {cat.name}
                    </Text>
                    {selected && (
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: colors.accent,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
