import { useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { colors } from '@/lib/colors';
import type { ImportResult } from '@/services/importExport';

interface Props {
  visible: boolean;
  onClose: () => void;
  result: ImportResult | null;
}

export default function ImportSheet({ visible, onClose, result }: Props) {
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

  if (!result) return null;

  const hasSkipped = result.skipped.length > 0;

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
            <View style={{ width: 44 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
              Import Complete
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
            {/* Success summary */}
            <View
              style={{
                backgroundColor: result.imported > 0 ? '#f0fdf4' : colors.bg,
                borderRadius: 12,
                padding: 16,
                marginBottom: hasSkipped ? 16 : 0,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: result.imported > 0 ? '#16a34a' : colors.textMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 18 }}>✓</Text>
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
                  {result.imported} transaction{result.imported !== 1 ? 's' : ''} imported
                </Text>
                {hasSkipped && (
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                    {result.skipped.length} row{result.skipped.length !== 1 ? 's' : ''} skipped
                  </Text>
                )}
              </View>
            </View>

            {/* Skipped rows */}
            {hasSkipped && (
              <>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    marginBottom: 8,
                  }}
                >
                  Skipped Rows
                </Text>
                <View style={{ backgroundColor: colors.bg, borderRadius: 12, overflow: 'hidden' }}>
                  {result.skipped.map((item, idx) => (
                    <View
                      key={idx}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderTopWidth: idx === 0 ? 0 : 1,
                        borderTopColor: colors.border,
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: '#fef2f2',
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          marginTop: 1,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.expense }}>
                          {item.rowIndex === 0 ? 'ERR' : `R${item.rowIndex}`}
                        </Text>
                      </View>
                      <Text
                        style={{ flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 18 }}
                      >
                        {item.reason}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
