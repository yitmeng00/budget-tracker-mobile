import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useMonth } from '@/hooks/useMonth';
import { useTransactions, useSearchTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { useColors } from '@/context/ThemeContext';
import MonthHeader, { YearHeader } from '@/components/ui/MonthHeader';
import ViewToggle from '@/components/ui/ViewToggle';
import DailyView from '@/components/transactions/DailyView';
import CalendarView from '@/components/transactions/CalendarView';
import MonthlyView from '@/components/transactions/MonthlyView';
import FilterSheet from '@/components/transactions/FilterSheet';
import AddTransactionSheet from '@/components/transactions/AddTransactionSheet';
import type { Transaction, ViewMode, TransactionFilters } from '@/types';

export default function TransactionsScreen() {
  const colors = useColors();
  const { year, month, prev, next, jumpTo } = useMonth();
  const { data: transactions = [], isPlaceholderData } = useTransactions(year, month);
  const { data: settings = DEFAULT_SETTINGS } = useSettings();

  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [duplicateSource, setDuplicateSource] = useState<Transaction | undefined>();

  const currentYear = new Date().getFullYear();
  const [yearView, setYearView] = useState(currentYear);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  const isSearchActive =
    searchQuery.trim().length > 0 || !!filters.type || (filters.categoryIds?.length ?? 0) > 0;

  const activeFilterCount = (filters.type ? 1 : 0) + (filters.categoryIds?.length ?? 0);

  const { data: searchResults = [], isFetching: searchFetching } = useSearchTransactions(
    searchQuery,
    filters,
  );

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
    setDuplicateSource(undefined);
  }

  function handleDuplicate(t: Transaction) {
    setEditingTransaction(undefined);
    setDuplicateSource(t);
    setSheetVisible(true);
  }

  function clearSearch() {
    setSearchQuery('');
    setFilters({});
  }

  const isMonthly = viewMode === 'monthly';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header — hidden while searching to avoid month-nav confusion */}
      {!isSearchActive &&
        (isMonthly ? (
          <YearHeader
            year={yearView}
            onPrev={() => setYearView((y) => y - 1)}
            onNext={() => setYearView((y) => y + 1)}
            disableNext={yearView >= currentYear}
          />
        ) : (
          <MonthHeader year={year} month={month} onPrev={prev} onNext={next} onJump={jumpTo} />
        ))}

      {/* View toggle — hidden while searching */}
      {!isSearchActive && <ViewToggle value={viewMode} onChange={setViewMode} />}

      {/* Search + filter bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: isSearchActive ? 12 : 0,
          paddingBottom: 8,
          gap: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 10,
            paddingHorizontal: 10,
            height: 36,
          }}
        >
          <Search size={15} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search transactions…"
            placeholderTextColor={colors.textFaint}
            style={{
              flex: 1,
              fontSize: 14,
              color: colors.textPrimary,
              marginLeft: 6,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={15} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter button */}
        <TouchableOpacity
          onPress={() => setFilterSheetVisible(true)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: activeFilterCount > 0 ? colors.accent : colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SlidersHorizontal size={16} color={activeFilterCount > 0 ? 'white' : colors.textMuted} />
          {activeFilterCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: colors.expense,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: 'white', fontSize: 9, fontWeight: '700' }}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Cancel button when search is active */}
        {isSearchActive && (
          <TouchableOpacity onPress={clearSearch}>
            <Text style={{ fontSize: 14, color: colors.accent }}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isSearchActive ? (
        <View style={{ flex: 1 }}>
          {searchFetching ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <DailyView
              transactions={searchResults}
              settings={settings}
              onPressTransaction={openEdit}
              onDuplicateTransaction={handleDuplicate}
              ListHeaderComponent={
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} across all
                  months
                </Text>
              }
            />
          )}
        </View>
      ) : (
        <View style={{ flex: 1, opacity: isPlaceholderData ? 0.4 : 1 }}>
          {viewMode === 'daily' && (
            <DailyView
              transactions={transactions}
              settings={settings}
              onPressTransaction={openEdit}
              onDuplicateTransaction={handleDuplicate}
            />
          )}
          {viewMode === 'calendar' && (
            <CalendarView
              year={year}
              month={month}
              transactions={transactions}
              settings={settings}
              onPressTransaction={openEdit}
              onDuplicateTransaction={handleDuplicate}
            />
          )}
          {viewMode === 'monthly' && (
            <MonthlyView
              year={yearView}
              settings={settings}
              onPressTransaction={openEdit}
              onDuplicateTransaction={handleDuplicate}
            />
          )}
        </View>
      )}

      <TouchableOpacity
        onPress={openAdd}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full items-center justify-center"
        style={{
          backgroundColor: colors.accent,
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

      <FilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        filters={filters}
        onChange={setFilters}
      />

      <AddTransactionSheet
        visible={sheetVisible}
        onClose={closeSheet}
        transaction={editingTransaction}
        duplicateFrom={duplicateSource}
        onDuplicate={handleDuplicate}
      />
    </SafeAreaView>
  );
}
