import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useMonth } from '@/hooks/useMonth';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { useYearlySummary } from '@/hooks/useStats';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import MonthHeader, { YearHeader } from '@/components/ui/MonthHeader';
import ViewToggle from '@/components/ui/ViewToggle';
import SummaryCards from '@/components/transactions/SummaryCards';
import DailyView from '@/components/transactions/DailyView';
import CalendarView from '@/components/transactions/CalendarView';
import MonthlyView from '@/components/transactions/MonthlyView';
import AddTransactionSheet from '@/components/transactions/AddTransactionSheet';
import type { Transaction, ViewMode } from '@/types';

export default function TransactionsScreen() {
  const { year, month, prev, next, jumpTo } = useMonth();
  const { data: transactions = [] } = useTransactions(year, month);
  const { data: settings = DEFAULT_SETTINGS } = useSettings();

  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

  const currentYear = new Date().getFullYear();
  const [yearView, setYearView] = useState(currentYear);
  const { data: yearlySummary = { income: 0, expenses: 0 } } = useYearlySummary(yearView);

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

  const isMonthly = viewMode === 'monthly';
  const yearlyNet = yearlySummary.income - yearlySummary.expenses;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      {isMonthly ? (
        <YearHeader
          year={yearView}
          onPrev={() => setYearView((y) => y - 1)}
          onNext={() => setYearView((y) => y + 1)}
          disableNext={yearView >= currentYear}
        />
      ) : (
        <MonthHeader year={year} month={month} onPrev={prev} onNext={next} onJump={jumpTo} />
      )}

      {isMonthly ? (
        <SummaryCards
          income={yearlySummary.income}
          expenses={yearlySummary.expenses}
          net={yearlyNet}
          settings={settings}
        />
      ) : (
        <SummaryCards income={income} expenses={expenses} net={net} settings={settings} />
      )}

      <ViewToggle value={viewMode} onChange={setViewMode} />

      {viewMode === 'daily' && (
        <DailyView transactions={transactions} settings={settings} onPressTransaction={openEdit} />
      )}

      {viewMode === 'calendar' && (
        <CalendarView
          year={year}
          month={month}
          transactions={transactions}
          settings={settings}
          onPressTransaction={openEdit}
        />
      )}

      {viewMode === 'monthly' && <MonthlyView year={yearView} settings={settings} />}

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
