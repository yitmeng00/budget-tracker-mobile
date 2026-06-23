import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useMonth } from '@/hooks/useMonth';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import MonthHeader from '@/components/ui/MonthHeader';
import SummaryCards from '@/components/transactions/SummaryCards';
import DailyView from '@/components/transactions/DailyView';
import AddTransactionSheet from '@/components/transactions/AddTransactionSheet';
import type { Transaction } from '@/types';

export default function TransactionsScreen() {
  const { year, month, prev, next } = useMonth();
  const { data: transactions = [] } = useTransactions(year, month);
  const { data: settings = DEFAULT_SETTINGS } = useSettings();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

  const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const net = income - expenses;

  function openAdd() {
    setEditingTransaction(undefined);
    setSheetVisible(true);
  }

  function openEdit(t: Transaction) {
    setEditingTransaction(t);
    setSheetVisible(true);
  }

  function closeSheet() {
    setSheetVisible(false);
    setEditingTransaction(undefined);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <MonthHeader year={year} month={month} onPrev={prev} onNext={next} />

      <SummaryCards income={income} expenses={expenses} net={net} settings={settings} />

      <DailyView transactions={transactions} settings={settings} onPressTransaction={openEdit} />

      <TouchableOpacity
        onPress={openAdd}
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

      <AddTransactionSheet
        visible={sheetVisible}
        onClose={closeSheet}
        transaction={editingTransaction}
      />
    </SafeAreaView>
  );
}
