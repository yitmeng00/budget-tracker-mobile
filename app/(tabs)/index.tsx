import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useMonth } from '@/hooks/useMonth';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import MonthHeader from '@/components/ui/MonthHeader';
import SummaryCards from '@/components/transactions/SummaryCards';
import DailyView from '@/components/transactions/DailyView';

export default function TransactionsScreen() {
  const { year, month, prev, next } = useMonth();
  const { data: transactions = [] } = useTransactions(year, month);
  const { data: settings = DEFAULT_SETTINGS } = useSettings();

  const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const net = income - expenses;

  const header = <SummaryCards income={income} expenses={expenses} net={net} settings={settings} />;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <MonthHeader year={year} month={month} onPrev={prev} onNext={next} />

      <DailyView transactions={transactions} settings={settings} ListHeaderComponent={header} />

      {/* FAB — add transaction (wired up in PR 4) */}
      <TouchableOpacity
        className="absolute bottom-6 right-5 w-14 h-14 bg-accent rounded-full items-center justify-center"
        style={{
          elevation: 4,
          shadowColor: '#2563eb',
          shadowOpacity: 0.35,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}
        activeOpacity={0.85}
      >
        <Plus color="white" size={26} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
