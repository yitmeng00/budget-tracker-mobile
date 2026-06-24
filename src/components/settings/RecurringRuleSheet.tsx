import { useRef, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Switch,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/lib/colors';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useSettings } from '@/hooks/useSettings';
import {
  useCreateRecurringRule,
  useUpdateRecurringRule,
  useDeleteRecurringRule,
} from '@/hooks/useRecurring';
import { formatCurrency } from '@/lib/currency';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import type { RecurringFrequency, RecurringRule, TransactionType } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  rule?: RecurringRule;
}

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'end_of_month', label: 'End of month' },
  { value: 'bimonthly', label: 'Every 2 months' },
  { value: 'annually', label: 'Annually' },
];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(s: string): Date {
  return new Date(s + 'T00:00:00');
}

function formatDisplayDate(s: string): string {
  const d = parseDate(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function frequencyDescription(freq: RecurringFrequency, startDate: string): string {
  const labels: Record<RecurringFrequency, string> = {
    daily: 'every day',
    weekly: 'every week',
    biweekly: 'every 2 weeks',
    monthly: 'every month',
    end_of_month: 'on the last day of each month',
    bimonthly: 'every 2 months',
    annually: 'every year',
  };
  return `Runs ${labels[freq]}, starting ${formatDisplayDate(startDate)}`;
}

export default function RecurringRuleSheet({ visible, onClose, rule }: Props) {
  const isEdit = !!rule;
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: settings = DEFAULT_SETTINGS } = useSettings();
  const createRule = useCreateRecurringRule();
  const updateRule = useUpdateRecurringRule();
  const deleteRule = useDeleteRecurringRule();

  const backdrop = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(800)).current;

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(toDateStr(new Date()));
  const [note, setNote] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!visible) {
      // Pre-reset amount while offscreen so next open starts with a narrow TextInput
      setAmount('');
      return;
    }
    if (rule) {
      setType(rule.amount > 0 ? 'income' : 'expense');
      setAmount(String(Math.abs(rule.amount)));
      setCategoryId(rule.category_id);
      setAccountId(rule.account_id);
      setFrequency(rule.frequency);
      setStartDate(rule.start_date);
      setNote(rule.note);
      setDescription(rule.description);
      setActive(rule.active);
    } else {
      setType('expense');
      setAmount('');
      setCategoryId(null);
      setAccountId(accounts[0]?.id ?? null);
      setFrequency('monthly');
      setStartDate(toDateStr(new Date()));
      setNote('');
      setDescription('');
      setActive(true);
    }
    setShowDatePicker(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleClose() {
    setShowDatePicker(false);
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 800, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  useEffect(() => {
    if (visible) {
      backdrop.setValue(0);
      translateY.setValue(800);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 35,
          stiffness: 400,
          mass: 1,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(backdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleTypeChange(t: TransactionType) {
    setType(t);
    setCategoryId(null);
  }

  const filteredCategories = categories.filter((c) => c.type === type);

  async function handleSave() {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Select category', 'Please select a category.');
      return;
    }
    if (!accountId) {
      Alert.alert('Select account', 'Please select an account.');
      return;
    }
    if (!note.trim()) {
      Alert.alert('Note required', 'Please add a note.');
      return;
    }

    const signedAmount = type === 'income' ? parsed : -parsed;
    const data = {
      category_id: categoryId,
      account_id: accountId,
      amount: signedAmount,
      note: note.trim(),
      description: description.trim(),
      frequency,
      start_date: startDate,
    };

    try {
      if (isEdit && rule) {
        await updateRule.mutateAsync({ id: rule.id, data: { ...data, active } });
      } else {
        await createRule.mutateAsync(data);
      }
      handleClose();
    } catch {
      // onError in the hook shows the alert
    }
  }

  function handleDelete() {
    if (!rule) return;
    Alert.alert('Delete rule', 'Delete this recurring rule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRule.mutateAsync(rule.id);
            handleClose();
          } catch {
            // onError in the hook shows the alert
          }
        },
      },
    ]);
  }

  const canSave =
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) > 0 &&
    !!categoryId &&
    !!accountId &&
    !!note.trim();

  const selectedAccount = accounts.find((a) => a.id === accountId);

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
            opacity: backdrop,
          }}
        />
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '92%',
            transform: [{ translateY }],
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>
              {isEdit ? 'Edit Recurring' : 'New Recurring'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={!canSave}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: canSave ? colors.accent : colors.textFaint,
                }}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Type toggle */}
            <View
              style={{
                flexDirection: 'row',
                marginHorizontal: 16,
                marginTop: 8,
                marginBottom: 20,
                backgroundColor: colors.bg,
                borderRadius: 14,
                padding: 4,
              }}
            >
              {(['expense', 'income'] as TransactionType[]).map((t) => {
                const sel = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => handleTypeChange(t)}
                    style={{
                      flex: 1,
                      paddingVertical: 9,
                      borderRadius: 10,
                      alignItems: 'center',
                      backgroundColor: sel ? colors.surface : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        color: sel
                          ? t === 'income'
                            ? colors.income
                            : colors.expense
                          : colors.textMuted,
                      }}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Amount */}
            <View style={{ alignItems: 'center', marginBottom: 24, paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 22,
                    color: colors.textMuted,
                    marginRight: 4,
                    fontWeight: '500',
                  }}
                >
                  {settings.currency_symbol}
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  contextMenuHidden
                  placeholder="0.00"
                  placeholderTextColor={colors.textFaint}
                  style={{
                    fontSize: 40,
                    fontWeight: '700',
                    color: colors.textPrimary,
                    minWidth: 80,
                    textAlign: 'center',
                  }}
                />
              </View>
            </View>

            {/* Category */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.textMuted,
                paddingHorizontal: 20,
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Category <Text style={{ color: colors.expense }}>*</Text>
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                paddingHorizontal: 16,
                marginBottom: 20,
                gap: 8,
              }}
            >
              {filteredCategories.map((cat) => {
                const selected = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: selected ? cat.color : colors.bg,
                      borderWidth: selected ? 0 : 1.5,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: selected ? '600' : '400',
                        color: selected ? 'white' : colors.textPrimary,
                      }}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Details card */}
            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: colors.bg,
                borderRadius: 16,
                marginBottom: 16,
                overflow: 'hidden',
              }}
            >
              {/* Account */}
              <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    marginBottom: 8,
                  }}
                >
                  Account <Text style={{ color: colors.expense }}>*</Text>
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
                >
                  {accounts.map((acc) => {
                    const sel = accountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => setAccountId(acc.id)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 20,
                          backgroundColor: sel ? colors.accent : colors.surface,
                          borderWidth: sel ? 0 : 1.5,
                          borderColor: colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: sel ? '600' : '400',
                            color: sel ? 'white' : colors.textPrimary,
                          }}
                        >
                          {acc.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Frequency */}
              <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    marginBottom: 8,
                  }}
                >
                  Repeat
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    paddingHorizontal: 16,
                    paddingBottom: 12,
                    gap: 8,
                  }}
                >
                  {FREQUENCIES.map((f) => {
                    const sel = frequency === f.value;
                    return (
                      <TouchableOpacity
                        key={f.value}
                        onPress={() => setFrequency(f.value)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: sel ? colors.accent : colors.surface,
                          borderWidth: sel ? 0 : 1.5,
                          borderColor: colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: sel ? '600' : '400',
                            color: sel ? 'white' : colors.textPrimary,
                          }}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Start date */}
              <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    marginBottom: 8,
                  }}
                >
                  Starting from
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker((v) => !v)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 15, color: colors.textPrimary, flex: 1 }}>
                    {formatDisplayDate(startDate)}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.accent }}>
                    {showDatePicker ? 'Done' : 'Change'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={parseDate(startDate)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onValueChange={(_event, date) => {
                      setStartDate(toDateStr(date));
                      if (Platform.OS === 'android') setShowDatePicker(false);
                    }}
                    style={{ marginHorizontal: 8, marginBottom: 8 }}
                  />
                )}
              </View>

              {/* Note */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ width: 88, fontSize: 14, color: colors.textMuted }}>
                  Note <Text style={{ color: colors.expense }}>*</Text>
                </Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g. Netflix subscription"
                  placeholderTextColor={colors.textFaint}
                  returnKeyType="next"
                  style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}
                />
              </View>

              {/* Description */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: isEdit ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ width: 88, fontSize: 14, color: colors.textMuted }}>
                  Description
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional"
                  placeholderTextColor={colors.textFaint}
                  returnKeyType="done"
                  style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}
                />
              </View>

              {/* Active toggle — edit only */}
              {isEdit && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                >
                  <Text style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}>Active</Text>
                  <Switch
                    value={active}
                    onValueChange={setActive}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor="white"
                  />
                </View>
              )}
            </View>

            {/* Preview */}
            {canSave && (
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  paddingHorizontal: 20,
                  marginBottom: 16,
                }}
              >
                {formatCurrency(parseFloat(amount), settings)} will be added as {type}.{' '}
                {frequencyDescription(frequency, startDate)}
                {selectedAccount ? ` to ${selectedAccount.name}` : ''}.
              </Text>
            )}

            {/* Delete — edit only */}
            {isEdit && (
              <TouchableOpacity
                onPress={handleDelete}
                style={{
                  marginHorizontal: 16,
                  marginBottom: 32,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: '#fef2f2',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.expense }}>
                  Delete Rule
                </Text>
              </TouchableOpacity>
            )}

            {!isEdit && <View style={{ height: 32 }} />}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
