import { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useMonth } from '@/hooks/useMonth';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import MonthHeader, { YearHeader } from '@/components/ui/MonthHeader';
import ViewToggle from '@/components/ui/ViewToggle';
import DailyView from '@/components/transactions/DailyView';
import CalendarView from '@/components/transactions/CalendarView';
import MonthlyView from '@/components/transactions/MonthlyView';
import AddTransactionSheet from '@/components/transactions/AddTransactionSheet';
import type { Transaction, ViewMode } from '@/types';

export default function TransactionsScreen() {
  const { year, month, prev, next, jumpTo } = useMonth();
  const { data: transactions = [], isPlaceholderData } = useTransactions(year, month);
  const { data: settings = DEFAULT_SETTINGS } = useSettings();

  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

  const currentYear = new Date().getFullYear();
  const [yearView, setYearView] = useState(currentYear);

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

      <ViewToggle value={viewMode} onChange={setViewMode} />

      <View style={{ flex: 1, opacity: isPlaceholderData ? 0.4 : 1 }}>
        {viewMode === 'daily' && (
          <DailyView
            transactions={transactions}
            settings={settings}
            onPressTransaction={openEdit}
          />
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

        {viewMode === 'monthly' && (
          <MonthlyView year={yearView} settings={settings} onPressTransaction={openEdit} />
        )}
      </View>

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
