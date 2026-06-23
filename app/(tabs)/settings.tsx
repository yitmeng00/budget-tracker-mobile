import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { colors, categoryColors } from '@/lib/colors';
import type { Category, Account, AccountGroup, UserSettings, WeekDay, UnitPosition } from '@/types';

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
type ReassignModalState = { open: boolean; cat?: Category; txCount?: number };

export default function SettingsScreen() {
  const { data: settings = DEFAULT_SETTINGS } = useSettings();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: groups = [] } = useAccountGroups();
  const updateSettings = useUpdateSettings();
  const deleteCategory = useDeleteCategory();
  const deleteAccount = useDeleteAccount();
  const deleteAccountGroup = useDeleteAccountGroup();

  const [currencyModal, setCurrencyModal] = useState(false);
  const [catModal, setCatModal] = useState<CatModalState>({ open: false });
  const [acctModal, setAcctModal] = useState<AcctModalState>({ open: false });
  const [acctGroupModal, setAcctGroupModal] = useState<AcctGroupModalState>({ open: false });
  const [reassignModal, setReassignModal] = useState<ReassignModalState>({ open: false });

  const expCats = categories.filter((c) => c.type === 'expense');
  const incCats = categories.filter((c) => c.type === 'income');

  function handleDeleteCat(cat: Category) {
    Alert.alert('Delete category', `Delete "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
    Alert.alert('Delete group', `Delete "${group.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteAccountGroup.mutate(group.id, {
            onError: (err) => Alert.alert('Cannot delete', (err as Error).message),
          }),
      },
    ]);
  }

  function handleDeleteAcct(acct: Account) {
    Alert.alert('Delete account', `Delete "${acct.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteAccount.mutate(acct.id, {
            onError: (err) => Alert.alert('Cannot delete', (err as Error).message),
          }),
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── General ── */}
        <SectionLabel text="General" />
        <SectionCard>
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 10 }}>
              Week starts on
            </Text>
            <SegmentedPicker
              options={WEEK_DAYS}
              value={settings.week_start}
              onChange={(v) => updateSettings.mutate({ week_start: v as WeekDay })}
            />
          </View>
        </SectionCard>

        {/* ── Currency ── */}
        <SectionLabel text="Currency" />
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
            <Text style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}>Currency</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginRight: 6 }}>
              {settings.currency_symbol} · {settings.currency_code}
            </Text>
            <Text style={{ fontSize: 18, color: colors.textFaint }}>›</Text>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 10 }}>
              Symbol position
            </Text>
            <SegmentedPicker
              options={['prefix', 'suffix']}
              value={settings.unit_position}
              labels={['Prefix (RM 10)', 'Suffix (10 RM)']}
              onChange={(v) => updateSettings.mutate({ unit_position: v as UnitPosition })}
            />
          </View>
        </SectionCard>

        {/* ── Categories ── */}
        <SectionLabel text="Categories" />

        <SubSectionHeader
          label="Expense"
          onAdd={() => setCatModal({ open: true, defaultType: 'expense' })}
        />
        <SectionCard>
          {expCats.length === 0 ? (
            <EmptyRow text="No expense categories" />
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
          label="Income"
          onAdd={() => setCatModal({ open: true, defaultType: 'income' })}
        />
        <SectionCard>
          {incCats.length === 0 ? (
            <EmptyRow text="No income categories" />
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
          label="Account Groups"
          onAdd={() => setAcctGroupModal({ open: true })}
          topMargin={24}
        />
        <SectionCard>
          {groups.length === 0 ? (
            <EmptyRow text="No account groups" />
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
          label="Accounts"
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
                  fontSize: 12,
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
                  fontSize: 12,
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

        {/* ── About ── */}
        <SectionLabel text="About" />
        <SectionCard>
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 15, color: colors.textPrimary, marginBottom: 3 }}>
              Budget Tracker
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>Version 1.0.0</Text>
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
      <ReassignModal
        visible={reassignModal.open}
        category={reassignModal.cat}
        txCount={reassignModal.txCount ?? 0}
        categories={categories}
        onClose={() => setReassignModal({ open: false })}
      />
    </SafeAreaView>
  );
}

// ─── Shared layout helpers ────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
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
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted }}>{label}</Text>
      <TouchableOpacity onPress={onAdd}>
        <Text style={{ fontSize: 24, color: colors.accent, lineHeight: 26 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
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
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 16 }} />;
}

function EmptyRow({ text }: { text: string }) {
  return (
    <View style={{ padding: 16, alignItems: 'center' }}>
      <Text style={{ fontSize: 13, color: colors.textMuted }}>{text}</Text>
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
                fontSize: 12,
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
            Currency
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 15, color: colors.accent }}>Done</Text>
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
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
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

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (isEdit && category) {
      updateCategory.mutate({ id: category.id, data: { name: trimmed } });
    } else {
      createCategory.mutate({ name: trimmed, color: autoColor(trimmed), icon: '', type });
    }
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          {/* Header */}
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
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 15, color: colors.textMuted }}>Cancel</Text>
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
                ? `Edit ${type === 'expense' ? 'Expense' : 'Income'} Category`
                : `New ${type === 'expense' ? 'Expense' : 'Income'} Category`}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: name.trim() ? colors.accent : colors.textFaint,
                }}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Name */}
            <Text style={fieldLabel}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. 🍜 Food"
              placeholderTextColor={colors.textFaint}
              style={inputStyle}
              autoFocus={!isEdit}
              returnKeyType="done"
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
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
  const isEdit = !!group;
  const createGroup = useCreateAccountGroup();
  const updateGroup = useUpdateAccountGroup();

  const [name, setName] = useState(group?.name ?? '');

  const [lastGroup, setLastGroup] = useState<AccountGroup | undefined>();
  if (group !== lastGroup) {
    setLastGroup(group);
    setName(group?.name ?? '');
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (isEdit && group) {
      updateGroup.mutate({ id: group.id, name: trimmed });
    } else {
      createGroup.mutate(trimmed);
    }
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 15, color: colors.textMuted }}>Cancel</Text>
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
              {isEdit ? 'Edit Group' : 'New Group'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: name.trim() ? colors.accent : colors.textFaint,
                }}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 16 }}>
            <Text style={fieldLabel}>Name</Text>
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
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          {/* Header */}
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
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 15, color: colors.textMuted }}>Cancel</Text>
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
              {isEdit ? 'Edit Account' : 'New Account'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: name.trim() ? colors.accent : colors.textFaint,
                }}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Name */}
            <Text style={fieldLabel}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Maybank Savings"
              placeholderTextColor={colors.textFaint}
              style={inputStyle}
              autoFocus={!isEdit}
              returnKeyType="done"
            />

            {/* Group */}
            <Text style={[fieldLabel, { marginTop: 20 }]}>Group</Text>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.bg,
                borderRadius: 10,
                padding: 3,
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
                        fontSize: 11,
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

            {/* Initial balance (add only) */}
            {!isEdit && (
              <>
                <Text style={[fieldLabel, { marginTop: 20 }]}>Initial Balance</Text>
                <TextInput
                  value={balance}
                  onChangeText={setBalance}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textFaint}
                  style={inputStyle}
                  returnKeyType="done"
                />
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
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
            Reassign Transactions
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 15, color: colors.textMuted }}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={{
            fontSize: 13,
            color: colors.textMuted,
            paddingHorizontal: 20,
            paddingVertical: 16,
            lineHeight: 20,
          }}
        >
          "{category?.name}" has {txCount} transaction{txCount !== 1 ? 's' : ''}. Choose a category
          to move them to before deleting.
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
              <Text style={{ fontSize: 13, color: colors.textMuted }}>
                No other {category?.type} categories available.
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

const fieldLabel: import('react-native').TextStyle = {
  fontSize: 13,
  fontWeight: '600',
  color: colors.textMuted,
  marginBottom: 8,
};

const inputStyle: import('react-native').TextStyle = {
  backgroundColor: colors.surface,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
  color: colors.textPrimary,
};
