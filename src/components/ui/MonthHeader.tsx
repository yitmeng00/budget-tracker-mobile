import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { MONTH_NAMES } from '@/lib/constants';
import { colors } from '@/lib/colors';

interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthHeader({ year, month, onPrev, onNext }: Props) {
  return (
    <View className="flex-row items-center justify-between bg-surface px-4 py-3 border-b border-border">
      <TouchableOpacity onPress={onPrev} hitSlop={12} className="p-1">
        <ChevronLeft color={colors.textMuted} size={22} />
      </TouchableOpacity>

      <Text className="text-text-primary text-base font-semibold">
        {MONTH_NAMES[month - 1]} {year}
      </Text>

      <TouchableOpacity onPress={onNext} hitSlop={12} className="p-1">
        <ChevronRight color={colors.textMuted} size={22} />
      </TouchableOpacity>
    </View>
  );
}
