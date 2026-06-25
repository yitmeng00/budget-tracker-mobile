import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReassignAndDeleteCategory,
} from '@/hooks/useCategories';
import { getCategoryTransactionCount } from '@/services/categories';
import {
  useAccounts,
  useAccountGroups,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useCreateAccountGroup,
  useUpdateAccountGroup,
  useDeleteAccountGroup,
} from '@/hooks/useAccounts';
import { useBudgets, useSetBudgetDefault, useSetBudgetOverride } from '@/hooks/useBudgets';
import { useRecurringRules } from '@/hooks/useRecurring';
import { useQueryClient } from '@tanstack/react-query';
import { importTransactionsCSV, exportBackupJSON, importBackupJSON } from '@/services/importExport';
import ImportSheet from '@/components/settings/ImportSheet';
import ExportSheet from '@/components/settings/ExportSheet';
import RecurringRuleSheet from '@/components/settings/RecurringRuleSheet';
import { useMonth } from '@/hooks/useMonth';
import type { ImportResult } from '@/services/importExport';
import type { RecurringRule } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { categoryColors } from '@/lib/colors';
import { useColors } from '@/context/ThemeContext';
import { useStrings } from '@/context/LanguageContext';
import { formatCurrency } from '@/lib/currency';
import type {
  Category,
  Account,
  AccountGroup,
  BudgetEntry,
  UserSettings,
  WeekDay,
  UnitPosition,
  ThemeMode,
  Language,
} from '@/types';

function autoColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return categoryColors[Math.abs(h) % categoryColors.length];
}

const CURRENCY_PRESETS = [
  { country: 'Malaysia', code: 'MYR', symbol: 'RM', unit_position: 'prefix' as UnitPosition },
  { country: 'United States', code: 'USD', symbol: '$', unit_position: 'prefix' as UnitPosition },
  { country: 'Singapore', code: 'SGD', symbol: 'S$', unit_position: 'prefix' as UnitPosition },
  { country: 'United Kingdom', code: 'GBP', symbol: '£', unit_position: 'prefix' as UnitPosition },
  { country: 'European Union', code: 'EUR', symbol: '€', unit_position: 'prefix' as UnitPosition },
  { country: 'Japan', code: 'JPY', symbol: '¥', unit_position: 'prefix' as UnitPosition },
  { country: 'Australia', code: 'AUD', symbol: 'A$', unit_position: 'prefix' as UnitPosition },
  { country: 'Indonesia', code: 'IDR', symbol: 'Rp', unit_position: 'prefix' as UnitPosition },
  { country: 'Thailand', code: 'THB', symbol: '฿', unit_position: 'prefix' as UnitPosition },
  { country: 'Philippines', code: 'PHP', symbol: '₱', unit_position: 'prefix' as UnitPosition },
  { country: 'Vietnam', code: 'VND', symbol: '₫', unit_position: 'suffix' as UnitPosition },
  { country: 'South Korea', code: 'KRW', symbol: '₩', unit_position: 'prefix' as UnitPosition },
];

const WEEK_DAYS: WeekDay[] = ['Sunday', 'Monday', 'Saturday'];

type CatModalState = { open: boolean; cat?: Category; defaultType?: 'expense' | 'income' };
type AcctModalState = { open: boolean; acct?: Account };
type AcctGroupModalState = { open: boolean; group?: AccountGroup };
type BudgetModalState = { open: boolean; entry?: BudgetEntry; year?: number; month?: number };
type ReassignModalState = { open: boolean; cat?: Category; txCount?: number };

export default function SettingsScreen() {
  const colors = useColors();
  const t = useStrings();
  const { data: settings = DEFAULT_SETTINGS } = useSettings();
  const frequencyLabels: Record<string, string> = {
    daily: t.freqDaily,
    weekly: t.freqWeekly,
    biweekly: t.freqBiweekly,
    monthly: t.freqMonthly,
    end_of_month: t.freqEndOfMonth,
    bimonthly: t.freqBimonthly,
    annually: t.freqAnnually,
  };
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: groups = [] } = useAccountGroups();
  const { data: recurringRules = [] } = useRecurringRules();
  const updateSettings = useUpdateSettings();
  const deleteCategory = useDeleteCategory();
  const deleteAccount = useDeleteAccount();
  const deleteAccountGroup = useDeleteAccountGroup();
  const queryClient = useQueryClient();

  const [exportSheetVisible, setExportSheetVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importResultVisible, setImportResultVisible] = useState(false);
  const [backupImportLoading, setBackupImportLoading] = useState(false);

  async function handleExportBackup() {
    try {
      await exportBackupJSON();
    } catch (e) {
      Alert.alert(t.error, (e as Error).message);
    }
  }

  function handleImportBackup() {
    Alert.alert(t.importBackupConfirmTitle, t.importBackupConfirmMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.restore,
        style: 'destructive',
        onPress: async () => {
          setBackupImportLoading(true);
          try {
            const restored = await importBackupJSON();
            if (restored) await queryClient.invalidateQueries();
          } catch (e) {
            Alert.alert(t.importFailed, (e as Error).message);
          } finally {
            setBackupImportLoading(false);
          }
        },
      },
    ]);
  }

  async function handleImport() {
    if (importLoading) return;
    setImportLoading(true);
    try {
      const result = await importTransactionsCSV();
      if (result) {
        await queryClient.invalidateQueries();
        setImportResult(result);
        setImportResultVisible(true);
      }
    } catch (e) {
      Alert.alert(t.importFailed, (e as Error).message);
    } finally {
      setImportLoading(false);
    }
  }

  const {
    year: budgetYear,
    month: budgetMonth,
    prev: prevBudgetMonth,
    next: nextBudgetMonth,
    jumpTo: jumpBudgetMonth,
  } = useMonth();
  const { data: budgets = [], isPlaceholderData: budgetsStale } = useBudgets(
    budgetYear,
    budgetMonth,
  );

  const [currencyModal, setCurrencyModal] = useState(false);
  const [catModal, setCatModal] = useState<CatModalState>({ open: false });
  const [acctModal, setAcctModal] = useState<AcctModalState>({ open: false });
  const [acctGroupModal, setAcctGroupModal] = useState<AcctGroupModalState>({ open: false });
  const [budgetModal, setBudgetModal] = useState<BudgetModalState>({ open: false });
  const [reassignModal, setReassignModal] = useState<ReassignModalState>({ open: false });
  const [recurringModal, setRecurringModal] = useState<{ open: boolean; rule?: RecurringRule }>({
    open: false,
  });

  const expCats = categories.filter((c) => c.type === 'expense');
  const incCats = categories.filter((c) => c.type === 'income');

  function handleDeleteCat(cat: Category) {
    Alert.alert(t.deleteCategoryTitle, t.confirmDeleteMsg.replace('{name}', cat.name), [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          const count = await getCategoryTransactionCount(cat.id);
          if (count === 0) {
            deleteCategory.mutate(cat.id);
          } else {
            setReassignModal({ open: true, cat, txCount: count });
          }
        },
      },
    ]);
  }

  function handleDeleteGroup(group: AccountGroup) {
    Alert.alert(t.deleteGroupTitle, t.confirmDeleteMsg.replace('{name}', group.name), [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: () => deleteAccountGroup.mutate(group.id),
      },
    ]);
  }

  function handleDeleteAcct(acct: Account) {
    Alert.alert(t.deleteAccountTitle, t.confirmDeleteMsg.replace('{name}', acct.name), [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: () => deleteAccount.mutate(acct.id),
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── General ── */}
        <SectionLabel text={t.sectionGeneral} />
        <SectionCard>
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 10 }}>
              {t.weekStartsOn}
            </Text>
            <SegmentedPicker
              options={WEEK_DAYS}
              value={settings.week_start}
              labels={[t.sunday, t.monday, t.saturday]}
              onChange={(v) => updateSettings.mutate({ week_start: v as WeekDay })}
            />
          </View>
        </SectionCard>

        {/* ── Language ── */}
        <SectionLabel text={t.sectionLanguage} />
        <SectionCard>
          {(
            [
              { value: 'en', label: t.langEnglish },
              { value: 'ms', label: t.langMalay },
              { value: 'zh-hans', label: t.langSimplifiedChinese },
              { value: 'zh-hant', label: t.langTraditionalChinese },
            ] as { value: Language; label: string }[]
          ).map((lang, idx) => (
            <TouchableOpacity
              key={lang.value}
              onPress={() => updateSettings.mutate({ language: lang.value })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderTopWidth: idx === 0 ? 0 : 1,
                borderTopColor: colors.border,
              }}
            >
              <Text style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}>{lang.label}</Text>
              {settings.language === lang.value && (
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
          ))}
        </SectionCard>

        {/* ── Appearance ── */}
        <SectionLabel text={t.sectionAppearance} />
        <SectionCard>
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 10 }}>
              {t.theme}
            </Text>
            <SegmentedPicker
              options={['light', 'dark', 'system']}
              value={settings.theme}
              labels={[t.themeLight, t.themeDark, t.themeSystem]}
              onChange={(v) => updateSettings.mutate({ theme: v as ThemeMode })}
            />
          </View>
        </SectionCard>

        {/* ── Currency ── */}
        <SectionLabel text={t.sectionCurrency} />
        <SectionCard>
          <TouchableOpacity
            onPress={() => setCurrencyModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}>{t.currency}</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginRight: 6 }}>
              {settings.currency_symbol} · {settings.currency_code}
            </Text>
            <Text style={{ fontSize: 18, color: colors.textFaint }}>›</Text>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 10 }}>
              {t.symbolPosition}
            </Text>
            <SegmentedPicker
              options={['prefix', 'suffix']}
              value={settings.unit_position}
              labels={[t.symbolPrefix, t.symbolSuffix]}
              onChange={(v) => updateSettings.mutate({ unit_position: v as UnitPosition })}
            />
          </View>
        </SectionCard>

        {/* ── Categories ── */}
        <SectionLabel text={t.sectionCategories} />

        <SubSectionHeader
          label={t.expenseSection}
          onAdd={() => setCatModal({ open: true, defaultType: 'expense' })}
        />
        <SectionCard>
          {expCats.length === 0 ? (
            <EmptyRow text={t.noExpenseCategories} />
          ) : (
            expCats.map((cat, idx) => (
              <View key={cat.id}>
                {idx > 0 && <RowDivider />}
                <SettingsRow
                  label={cat.name}
                  onEdit={() => setCatModal({ open: true, cat })}
                  onDelete={() => handleDeleteCat(cat)}
                />
              </View>
            ))
          )}
        </SectionCard>

        <SubSectionHeader
          label={t.incomeSection}
          onAdd={() => setCatModal({ open: true, defaultType: 'income' })}
        />
        <SectionCard>
          {incCats.length === 0 ? (
            <EmptyRow text={t.noIncomeCategories} />
          ) : (
            incCats.map((cat, idx) => (
              <View key={cat.id}>
                {idx > 0 && <RowDivider />}
                <SettingsRow
                  label={cat.name}
                  onEdit={() => setCatModal({ open: true, cat })}
                  onDelete={() => handleDeleteCat(cat)}
                />
              </View>
            ))
          )}
        </SectionCard>

        {/* ── Account Groups ── */}
        <SubSectionHeader
          label={t.accountGroups}
          onAdd={() => setAcctGroupModal({ open: true })}
          topMargin={24}
        />
        <SectionCard>
          {groups.length === 0 ? (
            <EmptyRow text={t.noAccountGroups} />
          ) : (
            groups.map((group, idx) => (
              <View key={group.id}>
                {idx > 0 && <RowDivider />}
                <SettingsRow
                  label={group.name}
                  onEdit={() => setAcctGroupModal({ open: true, group })}
                  onDelete={() => handleDeleteGroup(group)}
                />
              </View>
            ))
          )}
        </SectionCard>

        {/* ── Accounts ── */}
        <SubSectionHeader
          label={t.accounts}
          onAdd={() => setAcctModal({ open: true })}
          topMargin={16}
        />

        {groups.map((group) => {
          const groupAccts = accounts.filter((a) => a.group_id === group.id);
          if (groupAccts.length === 0) return null;
          return (
            <View key={group.id} style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textMuted,
                  paddingHorizontal: 20,
                  marginBottom: 6,
                }}
              >
                {group.name}
              </Text>
              <SectionCard>
                {groupAccts.map((acct, idx) => (
                  <View key={acct.id}>
                    {idx > 0 && <RowDivider />}
                    <SettingsRow
                      label={acct.name}
                      onEdit={() => setAcctModal({ open: true, acct })}
                      onDelete={() => handleDeleteAcct(acct)}
                    />
                  </View>
                ))}
              </SectionCard>
            </View>
          );
        })}

        {(() => {
          const ungrouped = accounts.filter((a) => !a.group_id);
          if (ungrouped.length === 0) return null;
          return (
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textMuted,
                  paddingHorizontal: 20,
                  marginBottom: 6,
                }}
              >
                Other
              </Text>
              <SectionCard>
                {ungrouped.map((acct, idx) => (
                  <View key={acct.id}>
                    {idx > 0 && <RowDivider />}
                    <SettingsRow
                      label={acct.name}
                      onEdit={() => setAcctModal({ open: true, acct })}
                      onDelete={() => handleDeleteAcct(acct)}
                    />
                  </View>
                ))}
              </SectionCard>
            </View>
          );
        })()}

        {/* ── Budgets ── */}
        <SectionLabel text={t.sectionBudgets} />

        <BudgetMonthNav
          year={budgetYear}
          month={budgetMonth}
          onPrev={prevBudgetMonth}
          onNext={nextBudgetMonth}
          onJump={jumpBudgetMonth}
          loading={budgetsStale}
        />

        <SectionCard>
          {budgets.length === 0 ? (
            <EmptyRow text={t.noExpenseCategories} />
          ) : (
            budgets.map((entry, idx) => (
              <View key={entry.category_id}>
                {idx > 0 && <RowDivider />}
                <TouchableOpacity
                  onPress={() =>
                    setBudgetModal({ open: true, entry, year: budgetYear, month: budgetMonth })
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: colors.textPrimary }}>
                      {entry.category_name}
                    </Text>
                    {entry.override_amount !== null && entry.override_amount !== undefined && (
                      <Text style={{ fontSize: 12, color: colors.accent, marginTop: 2 }}>
                        {t.thisMonthOverride}
                      </Text>
                    )}
                  </View>
                  {entry.effective_amount ? (
                    <View style={{ alignItems: 'flex-end', marginRight: 6 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color:
                            entry.spent > entry.effective_amount
                              ? colors.expense
                              : colors.textMuted,
                        }}
                      >
                        {formatCurrency(entry.spent, settings)} {t.spent}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textFaint, marginTop: 1 }}>
                        of {formatCurrency(entry.effective_amount, settings)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 14, color: colors.textFaint, marginRight: 6 }}>
                      {t.notSet}
                    </Text>
                  )}
                  <Text style={{ fontSize: 18, color: colors.textFaint }}>›</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </SectionCard>

        {/* ── Recurring ── */}
        <SubSectionHeader
          label={t.recurringTransactions}
          onAdd={() => setRecurringModal({ open: true })}
          topMargin={24}
        />
        <SectionCard>
          {recurringRules.length === 0 ? (
            <EmptyRow text={t.noRecurringRules} />
          ) : (
            recurringRules.map((rule, idx) => (
              <View key={rule.id}>
                {idx > 0 && <RowDivider />}
                <TouchableOpacity
                  onPress={() => setRecurringModal({ open: true, rule })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        color: rule.active ? colors.textPrimary : colors.textMuted,
                      }}
                    >
                      {rule.note}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      {rule.category_name} · {rule.account_name} · {frequencyLabels[rule.frequency]}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: rule.amount > 0 ? colors.income : colors.expense,
                      marginRight: 6,
                    }}
                  >
                    {rule.amount > 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(rule.amount), settings)}
                  </Text>
                  {!rule.active && (
                    <Text style={{ fontSize: 11, color: colors.textFaint, marginRight: 6 }}>
                      {t.paused}
                    </Text>
                  )}
                  <Text style={{ fontSize: 18, color: colors.textFaint }}>›</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </SectionCard>

        {/* ── Data ── */}
        <SectionLabel text={t.sectionData} />
        <SectionCard>
          <TouchableOpacity
            onPress={() => setExportSheetVisible(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}>{t.exportCSV}</Text>
            <Text style={{ fontSize: 18, color: colors.textFaint }}>↑</Text>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />
          <TouchableOpacity
            onPress={handleImport}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: colors.textPrimary }}>{t.importCSV}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {t.importCSVDesc}
              </Text>
            </View>
            {importLoading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={{ fontSize: 18, color: colors.textFaint }}>↓</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />
          <TouchableOpacity
            onPress={handleExportBackup}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}>
              {t.exportBackup}
            </Text>
            <Text style={{ fontSize: 18, color: colors.textFaint }}>↑</Text>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />
          <TouchableOpacity
            onPress={handleImportBackup}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: colors.textPrimary }}>{t.importBackup}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {t.importBackupDesc}
              </Text>
            </View>
            {backupImportLoading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={{ fontSize: 18, color: colors.textFaint }}>↓</Text>
            )}
          </TouchableOpacity>
        </SectionCard>

        {/* ── About ── */}
        <SectionLabel text={t.sectionAbout} />
        <SectionCard>
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              gap: 14,
            }}
          >
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 48, height: 48, borderRadius: 12 }}
            />
            <View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: 2,
                }}
              >
                Ledgr
              </Text>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>{t.version} 1.0.0</Text>
            </View>
          </View>
        </SectionCard>
      </ScrollView>

      <CurrencyModal
        visible={currencyModal}
        settings={settings}
        onClose={() => setCurrencyModal(false)}
      />
      <CategoryModal
        visible={catModal.open}
        category={catModal.cat}
        defaultType={catModal.defaultType}
        onClose={() => setCatModal({ open: false })}
      />
      <AccountGroupModal
        visible={acctGroupModal.open}
        group={acctGroupModal.group}
        onClose={() => setAcctGroupModal({ open: false })}
      />
      <AccountModal
        visible={acctModal.open}
        account={acctModal.acct}
        groups={groups}
        onClose={() => setAcctModal({ open: false })}
      />
      <BudgetSettingsModal
        visible={budgetModal.open}
        entry={budgetModal.entry}
        year={budgetModal.year ?? budgetYear}
        month={budgetModal.month ?? budgetMonth}
        onClose={() => setBudgetModal({ open: false })}
      />
      <ReassignModal
        visible={reassignModal.open}
        category={reassignModal.cat}
        txCount={reassignModal.txCount ?? 0}
        categories={categories}
        onClose={() => setReassignModal({ open: false })}
      />
      <RecurringRuleSheet
        visible={recurringModal.open}
        rule={recurringModal.rule}
        onClose={() => setRecurringModal({ open: false })}
      />
      <ImportSheet
        visible={importResultVisible}
        result={importResult}
        onClose={() => setImportResultVisible(false)}
      />
      <ExportSheet visible={exportSheetVisible} onClose={() => setExportSheetVisible(false)} />
    </SafeAreaView>
  );
}

// ─── Budget month nav ─────────────────────────────────────────────────────────

function BudgetMonthNav({
  year,
  month,
  onPrev,
  onNext,
  onJump,
  loading,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (year: number, month: number) => void;
  loading?: boolean;
}) {
  const colors = useColors();
  const t = useStrings();
  const [picking, setPicking] = useState(false);
  const [pickYear, setPickYear] = useState(year);

  function openPicker() {
    setPickYear(year);
    setPicking(true);
  }

  function selectMonth(m: number) {
    onJump(pickYear, m);
    setPicking(false);
  }

  const now = new Date();
  const isCurrentMonth = (y: number, m: number) =>
    y === now.getFullYear() && m === now.getMonth() + 1;

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginHorizontal: 16,
          marginBottom: 8,
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingHorizontal: 8,
          paddingVertical: 6,
        }}
      >
        <TouchableOpacity onPress={onPrev} hitSlop={12} style={{ padding: 4 }}>
          <Text style={{ fontSize: 20, color: colors.textMuted }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity onPress={openPicker} hitSlop={8}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
              {t.monthNames[month - 1]} {year}
            </Text>
          </TouchableOpacity>
          {loading && <ActivityIndicator size="small" color={colors.accent} />}
        </View>
        <TouchableOpacity onPress={onNext} hitSlop={12} style={{ padding: 4 }}>
          <Text style={{ fontSize: 20, color: colors.textMuted }}>›</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={picking}
        animationType="fade"
        onRequestClose={() => setPicking(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setPicking(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, width: 304 }}
          >
            {/* Year nav */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <TouchableOpacity onPress={() => setPickYear((y) => y - 1)} hitSlop={12}>
                <Text style={{ fontSize: 20, color: colors.textMuted }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                {pickYear}
              </Text>
              <TouchableOpacity onPress={() => setPickYear((y) => y + 1)} hitSlop={12}>
                <Text style={{ fontSize: 20, color: colors.textMuted }}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Month grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {t.monthShort.map((name, i) => {
                const m = i + 1;
                const isSelected = m === month && pickYear === year;
                const isCurrent = isCurrentMonth(pickYear, m);
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => selectMonth(m)}
                    style={{
                      width: 60,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      backgroundColor: isSelected
                        ? colors.accent
                        : isCurrent
                          ? colors.accentSoft
                          : colors.bg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isSelected || isCurrent ? '600' : '400',
                        color: isSelected
                          ? 'white'
                          : isCurrent
                            ? colors.accent
                            : colors.textPrimary,
                      }}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* This Month shortcut */}
            <TouchableOpacity
              onPress={() => {
                onJump(now.getFullYear(), now.getMonth() + 1);
                setPicking(false);
              }}
              style={{
                marginTop: 16,
                paddingVertical: 11,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: colors.bg,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.accent }}>
                {t.thisMonth}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Shared layout helpers ────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  const colors = useColors();
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingHorizontal: 20,
        marginTop: 24,
        marginBottom: 8,
      }}
    >
      {text}
    </Text>
  );
}

function SubSectionHeader({
  label,
  onAdd,
  topMargin = 12,
}: {
  label: string;
  onAdd: () => void;
  topMargin?: number;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 6,
        marginTop: topMargin,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted }}>{label}</Text>
      <TouchableOpacity onPress={onAdd}>
        <Text style={{ fontSize: 24, color: colors.accent, lineHeight: 26 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View
      style={{
        marginHorizontal: 16,
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 4,
      }}
    >
      {children}
    </View>
  );
}

function RowDivider() {
  const colors = useColors();
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />;
}

function EmptyRow({ text }: { text: string }) {
  const colors = useColors();
  return (
    <View style={{ padding: 16, alignItems: 'center' }}>
      <Text style={{ fontSize: 14, color: colors.textMuted }}>{text}</Text>
    </View>
  );
}

function SegmentedPicker({
  options,
  value,
  labels,
  onChange,
}: {
  options: string[];
  value: string;
  labels?: string[];
  onChange: (v: string) => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.bg,
        borderRadius: 10,
        padding: 3,
      }}
    >
      {options.map((opt, i) => {
        const active = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              flex: 1,
              paddingVertical: 6,
              borderRadius: 7,
              alignItems: 'center',
              backgroundColor: active ? colors.surface : 'transparent',
              ...(active && {
                shadowColor: '#000',
                shadowOpacity: 0.07,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1 },
              }),
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: active ? '600' : '400',
                color: active ? colors.textPrimary : colors.textMuted,
              }}
              numberOfLines={1}
            >
              {labels ? labels[i] : opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── List rows ────────────────────────────────────────────────────────────────

function SettingsRow({
  label,
  onEdit,
  onDelete,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <TouchableOpacity style={{ flex: 1 }} onPress={onEdit}>
        <Text style={{ fontSize: 15, color: colors.textPrimary }}>{label}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ fontSize: 18, color: colors.textFaint }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Currency modal ───────────────────────────────────────────────────────────

function CurrencyModal({
  visible,
  settings,
  onClose,
}: {
  visible: boolean;
  settings: UserSettings;
  onClose: () => void;
}) {
  const colors = useColors();
  const t = useStrings();
  const updateSettings = useUpdateSettings();

  function select(preset: (typeof CURRENCY_PRESETS)[number]) {
    updateSettings.mutate({
      currency_country: preset.country,
      currency_code: preset.code,
      currency_symbol: preset.symbol,
      unit_position: preset.unit_position,
    });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ flex: 1, fontSize: 17, fontWeight: '600', color: colors.textPrimary }}>
            {t.currency}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 15, color: colors.accent }}>{t.done}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView>
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              backgroundColor: colors.surface,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {CURRENCY_PRESETS.map((preset, idx) => {
              const isActive = settings.currency_code === preset.code;
              return (
                <View key={preset.code}>
                  {idx > 0 && (
                    <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />
                  )}
                  <TouchableOpacity
                    onPress={() => select(preset)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, color: colors.textPrimary }}>
                        {preset.country}
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 2 }}>
                        {preset.code} · {preset.symbol}
                      </Text>
                    </View>
                    {isActive && <Text style={{ fontSize: 18, color: colors.accent }}>✓</Text>}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Category modal ───────────────────────────────────────────────────────────

function CategoryModal({
  visible,
  category,
  defaultType,
  onClose,
}: {
  visible: boolean;
  category?: Category;
  defaultType?: 'expense' | 'income';
  onClose: () => void;
}) {
  const colors = useColors();
  const t = useStrings();
  const { fieldLabel, inputStyle } = useSharedStyles();
  const isEdit = !!category;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [name, setName] = useState(category?.name ?? '');
  const type = category?.type ?? defaultType ?? 'expense';

  // Reset form when modal opens with new data
  const [lastCategory, setLastCategory] = useState<Category | undefined>();
  if (category !== lastCategory) {
    setLastCategory(category);
    setName(category?.name ?? '');
  }

  const catBackdrop = useRef(new Animated.Value(0)).current;
  const catTranslateY = useRef(new Animated.Value(800)).current;

  function handleClose() {
    Animated.parallel([
      Animated.timing(catBackdrop, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(catTranslateY, { toValue: 800, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  useEffect(() => {
    if (visible) {
      catBackdrop.setValue(0);
      catTranslateY.setValue(800);
      Animated.parallel([
        Animated.spring(catTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 35,
          stiffness: 400,
          mass: 1,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(catBackdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (isEdit && category) {
      updateCategory.mutate({ id: category.id, data: { name: trimmed } });
    } else {
      createCategory.mutate({ name: trimmed, color: autoColor(trimmed), icon: '', type });
    }
    handleClose();
  }

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
            opacity: catBackdrop,
          }}
        />
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            transform: [{ translateY: catTranslateY }],
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={handleClose} style={{ minWidth: 60 }}>
              <Text style={{ fontSize: 15, color: colors.textMuted }}>{t.cancel}</Text>
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 17,
                fontWeight: '600',
                color: colors.textPrimary,
              }}
            >
              {isEdit
                ? type === 'expense'
                  ? t.editExpenseCategory
                  : t.editIncomeCategory
                : type === 'expense'
                  ? t.newExpenseCategory
                  : t.newIncomeCategory}
            </Text>
            <TouchableOpacity onPress={handleSave} style={{ minWidth: 60, alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: name.trim() ? colors.accent : colors.textFaint,
                }}
              >
                {t.save}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 34 }}>
            <Text style={fieldLabel}>{t.name}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. 🍜 Food"
              placeholderTextColor={colors.textFaint}
              style={inputStyle}
              autoFocus={!isEdit}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Account group modal ──────────────────────────────────────────────────────

function AccountGroupModal({
  visible,
  group,
  onClose,
}: {
  visible: boolean;
  group?: AccountGroup;
  onClose: () => void;
}) {
  const colors = useColors();
  const t = useStrings();
  const { fieldLabel, inputStyle } = useSharedStyles();
  const isEdit = !!group;
  const createGroup = useCreateAccountGroup();
  const updateGroup = useUpdateAccountGroup();

  const [name, setName] = useState(group?.name ?? '');

  const [lastGroup, setLastGroup] = useState<AccountGroup | undefined>();
  if (group !== lastGroup) {
    setLastGroup(group);
    setName(group?.name ?? '');
  }

  const grpBackdrop = useRef(new Animated.Value(0)).current;
  const grpTranslateY = useRef(new Animated.Value(800)).current;

  function handleClose() {
    Animated.parallel([
      Animated.timing(grpBackdrop, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(grpTranslateY, { toValue: 800, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  useEffect(() => {
    if (visible) {
      grpBackdrop.setValue(0);
      grpTranslateY.setValue(800);
      Animated.parallel([
        Animated.spring(grpTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 35,
          stiffness: 400,
          mass: 1,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(grpBackdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (isEdit && group) {
      updateGroup.mutate({ id: group.id, name: trimmed });
    } else {
      createGroup.mutate(trimmed);
    }
    handleClose();
  }

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
            opacity: grpBackdrop,
          }}
        />
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            transform: [{ translateY: grpTranslateY }],
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={handleClose} style={{ minWidth: 60 }}>
              <Text style={{ fontSize: 15, color: colors.textMuted }}>{t.cancel}</Text>
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 17,
                fontWeight: '600',
                color: colors.textPrimary,
              }}
            >
              {isEdit ? t.editGroup : t.newGroup}
            </Text>
            <TouchableOpacity onPress={handleSave} style={{ minWidth: 60, alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: name.trim() ? colors.accent : colors.textFaint,
                }}
              >
                {t.save}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 34 }}>
            <Text style={fieldLabel}>{t.name}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Bank"
              placeholderTextColor={colors.textFaint}
              style={inputStyle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Account modal ────────────────────────────────────────────────────────────

function AccountModal({
  visible,
  account,
  groups,
  onClose,
}: {
  visible: boolean;
  account?: Account;
  groups: AccountGroup[];
  onClose: () => void;
}) {
  const colors = useColors();
  const t = useStrings();
  const { fieldLabel, inputStyle } = useSharedStyles();
  const isEdit = !!account;
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const [name, setName] = useState(account?.name ?? '');
  const [groupId, setGroupId] = useState<number | null>(account?.group_id ?? groups[0]?.id ?? null);
  const [balance, setBalance] = useState('0');

  const [lastAccount, setLastAccount] = useState<Account | undefined>();
  if (account !== lastAccount) {
    setLastAccount(account);
    setName(account?.name ?? '');
    setGroupId(account?.group_id ?? groups[0]?.id ?? null);
    setBalance('0');
  }

  const acctBackdrop = useRef(new Animated.Value(0)).current;
  const acctTranslateY = useRef(new Animated.Value(800)).current;

  function handleClose() {
    Animated.parallel([
      Animated.timing(acctBackdrop, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(acctTranslateY, { toValue: 800, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  useEffect(() => {
    if (visible) {
      acctBackdrop.setValue(0);
      acctTranslateY.setValue(800);
      Animated.parallel([
        Animated.spring(acctTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 35,
          stiffness: 400,
          mass: 1,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(acctBackdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const groupName = groups.find((g) => g.id === groupId)?.name ?? 'Cash';
    if (isEdit && account) {
      updateAccount.mutate({ id: account.id, data: { name: trimmed, group_id: groupId } });
    } else {
      createAccount.mutate({
        name: trimmed,
        type: groupName,
        icon: '',
        color: colors.accent,
        balance: parseFloat(balance) || 0,
        group_id: groupId,
      });
    }
    handleClose();
  }

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
            opacity: acctBackdrop,
          }}
        />
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            transform: [{ translateY: acctTranslateY }],
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={handleClose} style={{ minWidth: 60 }}>
              <Text style={{ fontSize: 15, color: colors.textMuted }}>{t.cancel}</Text>
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 17,
                fontWeight: '600',
                color: colors.textPrimary,
              }}
            >
              {isEdit ? t.editAccount : t.newAccount}
            </Text>
            <TouchableOpacity onPress={handleSave} style={{ minWidth: 60, alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: name.trim() ? colors.accent : colors.textFaint,
                }}
              >
                {t.save}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 34 }}>
            <Text style={fieldLabel}>{t.name}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Maybank Savings"
              placeholderTextColor={colors.textFaint}
              style={inputStyle}
              autoFocus={!isEdit}
              returnKeyType="next"
            />
            <Text style={[fieldLabel, { marginTop: 20 }]}>{t.group}</Text>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.bg,
                borderRadius: 10,
                padding: 3,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {groups.map((g) => {
                const active = g.id === groupId;
                return (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => setGroupId(g.id)}
                    style={{
                      flex: 1,
                      paddingVertical: 6,
                      borderRadius: 7,
                      alignItems: 'center',
                      backgroundColor: active ? colors.surface : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: active ? '600' : '400',
                        color: active ? colors.textPrimary : colors.textMuted,
                      }}
                      numberOfLines={1}
                    >
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!isEdit && (
              <>
                <Text style={[fieldLabel, { marginTop: 20 }]}>{t.initialBalance}</Text>
                <TextInput
                  value={balance}
                  onChangeText={setBalance}
                  keyboardType="decimal-pad"
                  contextMenuHidden
                  placeholderTextColor={colors.textFaint}
                  style={inputStyle}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Budget settings modal ────────────────────────────────────────────────────

function BudgetSettingsModal({
  visible,
  entry,
  year,
  month,
  onClose,
}: {
  visible: boolean;
  entry?: BudgetEntry;
  year: number;
  month: number;
  onClose: () => void;
}) {
  const colors = useColors();
  const t = useStrings();
  const { fieldLabel, inputStyle } = useSharedStyles();
  const setDefault = useSetBudgetDefault();
  const setOverride = useSetBudgetOverride();

  const hasOverride = entry?.override_amount !== null && entry?.override_amount !== undefined;
  const [amount, setAmount] = useState('');
  const [scope, setScope] = useState<'onwards' | 'month'>('onwards');

  const [lastEntry, setLastEntry] = useState<BudgetEntry | undefined>();
  if (entry !== lastEntry) {
    setLastEntry(entry);
    setAmount(entry?.effective_amount ? String(entry.effective_amount) : '');
    // Pre-select "This month only" if there's already a monthly override
    setScope(hasOverride ? 'month' : 'onwards');
  }

  const budgetBackdrop = useRef(new Animated.Value(0)).current;
  const budgetTranslateY = useRef(new Animated.Value(800)).current;

  function handleClose() {
    Animated.parallel([
      Animated.timing(budgetBackdrop, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(budgetTranslateY, { toValue: 800, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  useEffect(() => {
    if (visible) {
      budgetBackdrop.setValue(0);
      budgetTranslateY.setValue(800);
      Animated.parallel([
        Animated.spring(budgetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 35,
          stiffness: 400,
          mass: 1,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(budgetBackdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleSave() {
    if (!entry) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    if (scope === 'onwards') {
      const now = new Date();
      const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
      if (isCurrentMonth) {
        setOverride.mutate({ categoryId: entry.category_id, year, month, amount: parsed });
      }
      setDefault.mutate({
        categoryId: entry.category_id,
        amount: parsed,
        effectiveFromYear: year,
        effectiveFromMonth: month,
      });
    } else {
      setOverride.mutate({ categoryId: entry.category_id, year, month, amount: parsed });
    }
    handleClose();
  }

  function handleRemove() {
    if (!entry) return;
    const title = hasOverride ? t.removeOverrideTitle : t.removeBudgetTitle;
    const message = hasOverride
      ? t.removeOverrideMsg
          .replace('{month}', t.monthNames[month - 1])
          .replace('{year}', String(year))
      : t.removeBudgetMsg.replace('{name}', entry.category_name);
    Alert.alert(title, message, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.remove,
        style: 'destructive',
        onPress: () => {
          if (hasOverride) {
            setOverride.mutate({ categoryId: entry.category_id, year, month, amount: null });
          } else {
            setDefault.mutate({ categoryId: entry.category_id, amount: null });
          }
          handleClose();
        },
      },
    ]);
  }

  const canSave = !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
  const hasBudget = entry?.effective_amount !== null && entry?.effective_amount !== undefined;

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
            opacity: budgetBackdrop,
          }}
        />
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            transform: [{ translateY: budgetTranslateY }],
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={handleClose} style={{ minWidth: 60 }}>
              <Text style={{ fontSize: 15, color: colors.textMuted }}>{t.cancel}</Text>
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 17,
                fontWeight: '600',
                color: colors.textPrimary,
              }}
            >
              {entry?.category_name}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              style={{ minWidth: 60, alignItems: 'flex-end' }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: canSave ? colors.accent : colors.textFaint,
                }}
              >
                {t.save}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 34 }}>
            <Text style={fieldLabel}>{t.budgetAmount}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textFaint}
              keyboardType="decimal-pad"
              contextMenuHidden
              autoFocus
              style={inputStyle}
            />
            <Text style={[fieldLabel, { marginTop: 20 }]}>{t.applyTo}</Text>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.bg,
                borderRadius: 10,
                padding: 3,
              }}
            >
              {(['onwards', 'month'] as const).map((s) => {
                const active = scope === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setScope(s)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 7,
                      alignItems: 'center',
                      backgroundColor: active ? colors.surface : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: active ? '600' : '400',
                        color: active ? colors.textPrimary : colors.textMuted,
                      }}
                    >
                      {s === 'onwards'
                        ? `${t.monthNames[month - 1]} ${t.onwards}`
                        : t.thisMonthOnly}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8 }}>
              {scope === 'onwards'
                ? t.appliesFromOnwards.replace('{month}', t.monthNames[month - 1])
                : t.onlyAffectsMonth
                    .replace('{month}', t.monthNames[month - 1])
                    .replace('{year}', String(year))}
            </Text>
            {hasBudget && (
              <TouchableOpacity
                onPress={handleRemove}
                style={{
                  marginTop: 24,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: '#fef2f2',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.expense }}>
                  {hasOverride ? t.removeOverrideTitle : t.removeBudgetTitle}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Reassign modal ───────────────────────────────────────────────────────────

function ReassignModal({
  visible,
  category,
  txCount,
  categories,
  onClose,
}: {
  visible: boolean;
  category?: Category;
  txCount: number;
  categories: Category[];
  onClose: () => void;
}) {
  const colors = useColors();
  const t = useStrings();
  const reassignAndDelete = useReassignAndDeleteCategory();
  const options = categories.filter((c) => c.id !== category?.id && c.type === category?.type);

  function pick(toId: number) {
    if (!category) return;
    reassignAndDelete.mutate({ fromId: category.id, toId });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ flex: 1, fontSize: 17, fontWeight: '600', color: colors.textPrimary }}>
            {t.reassignTitle}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 15, color: colors.textMuted }}>{t.cancel}</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={{
            fontSize: 14,
            color: colors.textMuted,
            paddingHorizontal: 20,
            paddingVertical: 16,
            lineHeight: 20,
          }}
        >
          {t.reassignDesc.replace('{name}', category?.name ?? '').replace('{n}', String(txCount))}
        </Text>

        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {options.length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>
                {category?.type === 'expense'
                  ? t.noOtherExpenseCategories
                  : t.noOtherIncomeCategories}
              </Text>
            </View>
          ) : (
            options.map((cat, idx) => (
              <View key={cat.id}>
                {idx > 0 && (
                  <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />
                )}
                <TouchableOpacity
                  onPress={() => pick(cat.id)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                >
                  <Text style={{ fontSize: 15, color: colors.textPrimary }}>{cat.name}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

function useSharedStyles() {
  const colors = useColors();
  return {
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textMuted,
      marginBottom: 8,
    } as import('react-native').TextStyle,
    inputStyle: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.textPrimary,
    } as import('react-native').TextStyle,
  };
}
