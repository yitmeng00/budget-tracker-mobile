import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-primary text-lg font-semibold">Transactions</Text>
        <Text className="text-text-muted text-sm mt-1">In Progress</Text>
      </View>
    </SafeAreaView>
  );
}
