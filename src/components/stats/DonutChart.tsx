import { useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/lib/colors';
import { formatCurrency } from '@/lib/currency';
import type { CategoryStats, UserSettings } from '@/types';

const SIZE = 164;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 72;
const OUTER_R_SELECTED = 82;
const INNER_R = 46;

function polarToCartesian(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function slicePath(startDeg: number, endDeg: number, outerR: number): string {
  if (endDeg - startDeg >= 359.99) {
    const mid = startDeg + 180;
    return slicePath(startDeg, mid, outerR) + ' ' + slicePath(mid, endDeg - 0.01, outerR);
  }
  const os = polarToCartesian(outerR, startDeg);
  const oe = polarToCartesian(outerR, endDeg);
  const is = polarToCartesian(INNER_R, startDeg);
  const ie = polarToCartesian(INNER_R, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${os.x.toFixed(2)} ${os.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oe.x.toFixed(2)} ${oe.y.toFixed(2)}`,
    `L ${ie.x.toFixed(2)} ${ie.y.toFixed(2)}`,
    `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${is.x.toFixed(2)} ${is.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

interface Props {
  items: CategoryStats[];
  settings: UserSettings;
}

export default function DonutChart({ items, settings }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const total = items.reduce((s, c) => s + c.total, 0);
  if (total === 0) return null;

  let cursor = 0;
  const slices = items.map((cat) => {
    const deg = (cat.total / total) * 360;
    const isSelected = cat.category_id === selectedId;
    const path = slicePath(cursor, cursor + deg, isSelected ? OUTER_R_SELECTED : OUTER_R);
    cursor += deg;
    return { ...cat, path, isSelected, pct: (cat.total / total) * 100 };
  });

  const selectedCat = slices.find((s) => s.isSelected) ?? null;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          {slices.map((s) => (
            <Path
              key={s.category_id}
              d={s.path}
              fill={s.category_color}
              stroke="white"
              strokeWidth={2}
              opacity={selectedId === null || s.isSelected ? 1 : 0.35}
              onPress={() =>
                setSelectedId((prev) => (prev === s.category_id ? null : s.category_id))
              }
            />
          ))}
        </Svg>

        {/* Center label */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selectedCat ? (
            <>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: selectedCat.category_color,
                  marginBottom: 4,
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  textAlign: 'center',
                  marginBottom: 2,
                  paddingHorizontal: 8,
                }}
                numberOfLines={1}
              >
                {selectedCat.category_name}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.textPrimary,
                  textAlign: 'center',
                  paddingHorizontal: 8,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(selectedCat.total, settings)}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                {Math.round(selectedCat.pct)}%
              </Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>Total</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: colors.textPrimary,
                  textAlign: 'center',
                  paddingHorizontal: 8,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(total, settings)}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
