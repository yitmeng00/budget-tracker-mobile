import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Trash2, ChevronRight, ChevronLeft, Copy } from 'lucide-react-native';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useSettings } from '@/hooks/useSettings';
import {
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/useTransactions';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { useColors } from '@/context/ThemeContext';
import { useStrings } from '@/context/LanguageContext';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { todayISO, currentTimeISO, formatDateISO, formatDateHeader } from '@/lib/date';
import type { Transaction, TransactionType } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  transaction?: Transaction;
  duplicateFrom?: Transaction;
  onDuplicate?: (t: Transaction) => void;
}

interface FormState {
  type: TransactionType;
  amount: string;
  category_id: number | null;
  account_id: number | null;
  date: string;
  note: string;
  description: string;
}

export default function AddTransactionSheet({
  visible,
  onClose,
  transaction,
  duplicateFrom,
  onDuplicate,
}: Props) {
  const colors = useColors();
  const t = useStrings();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: settings = DEFAULT_SETTINGS } = useSettings();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const isEditing = !!transaction;

  const [form, setForm] = useState<FormState>({
    type: 'expense',
    amount: '',
    category_id: null,
    account_id: null,
    date: todayISO(),
    note: '',
    description: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const {
    backdrop: backdropOpacity,
    translateY: sheetTranslateY,
    close: handleClose,
    panResponder,
  } = useBottomSheet(visible, onClose);

  useEffect(() => {
    if (visible) {
      if (transaction) {
        setForm({
          type: transaction.amount > 0 ? 'income' : 'expense',
          amount: String(Math.abs(transaction.amount)),
          category_id: transaction.category_id,
          account_id: transaction.account_id,
          date: transaction.date,
          note: transaction.note,
          description: transaction.description,
        });
      } else if (duplicateFrom) {
        setForm({
          type: duplicateFrom.amount > 0 ? 'income' : 'expense',
          amount: String(Math.abs(duplicateFrom.amount)),
          category_id: duplicateFrom.category_id,
          account_id: duplicateFrom.account_id,
          date: todayISO(),
          note: duplicateFrom.note,
          description: duplicateFrom.description,
        });
      } else {
        setForm({
          type: 'expense',
          amount: '',
          category_id: null,
          account_id: accounts[0]?.id ?? null,
          date: todayISO(),
          note: '',
          description: '',
        });
      }
      setShowDatePicker(false);
      setShowAccountPicker(false);
    } else {
      // Pre-reset amount while modal is offscreen so next open starts with narrow TextInput
      setForm((f) => ({ ...f, amount: '' }));
    }
  }, [visible, transaction, duplicateFrom, accounts]);

  function handleTypeChange(type: TransactionType) {
    setForm((f) => ({ ...f, type, category_id: null }));
  }

  const filteredCategories = categories.filter((c) => c.type === form.type);
  const selectedAccount = accounts.find((a) => a.id === form.account_id);

  async function handleSave() {
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t.invalidAmountTitle, t.invalidAmountMsg);
      return;
    }
    const category_id = form.category_id;
    if (!category_id) {
      Alert.alert(t.selectCategoryTitle, t.selectCategoryMsg);
      return;
    }
    const account_id = form.account_id;
    if (!account_id) {
      Alert.alert(t.selectAccountTitle, t.selectAccountMsg);
      return;
    }
    if (!form.note.trim()) {
      Alert.alert(t.noteRequiredTitle, t.noteRequiredMsg);
      return;
    }

    const signedAmount = form.type === 'income' ? amount : -amount;
    const data = {
      account_id,
      category_id,
      amount: signedAmount,
      note: form.note.trim(),
      description: form.description.trim(),
      date: form.date,
      time: transaction?.time ?? currentTimeISO(),
    };

    try {
      if (isEditing && transaction) {
        await updateTx.mutateAsync({ id: transaction.id, data });
      } else {
        await createTx.mutateAsync(data);
      }
      handleClose();
    } catch {
      Alert.alert(t.error, t.savingError);
    }
  }

  function handleDelete() {
    if (!transaction) return;
    Alert.alert(t.deleteTransactionTitle, t.deleteTransactionMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTx.mutateAsync(transaction.id);
            handleClose();
          } catch {
            Alert.alert(t.error, t.deletingError);
          }
        },
      },
    ]);
  }

  const isSaving = createTx.isPending || updateTx.isPending || deleteTx.isPending;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={{ flex: 1 }}>
        {/* Backdrop: absolutely positioned, never moves, fades in after sheet slides up */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            opacity: backdropOpacity,
          }}
        />

        {/* Transparent dismiss area above the sheet */}
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />

        {/* Sheet: slides up independently via translateY */}
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '92%',
            transform: [{ translateY: sheetTranslateY }],
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
              {isEditing ? t.editTransaction : t.addTransaction}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <X color={colors.textMuted} size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
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
              {(['expense', 'income'] as TransactionType[]).map((txType) => {
                const active = form.type === txType;
                return (
                  <TouchableOpacity
                    key={txType}
                    onPress={() => handleTypeChange(txType)}
                    style={{
                      flex: 1,
                      paddingVertical: 9,
                      borderRadius: 10,
                      alignItems: 'center',
                      backgroundColor: active ? colors.surface : 'transparent',
                      ...(active && {
                        shadowColor: '#000',
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 1 },
                      }),
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: active
                          ? txType === 'income'
                            ? colors.income
                            : colors.expense
                          : colors.textMuted,
                      }}
                    >
                      {txType === 'income' ? t.income : t.expense}
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
                  value={form.amount}
                  onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
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

            {/* Category label */}
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
              {t.categoryLabel} <Text style={{ color: colors.expense }}>*</Text>
            </Text>

            {/* Category chips */}
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
                const selected = form.category_id === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setForm((f) => ({ ...f, category_id: cat.id }))}
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

            {/* Details */}
            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: colors.bg,
                borderRadius: 16,
                marginBottom: 16,
                overflow: 'hidden',
              }}
            >
              {/* Account row */}
              <TouchableOpacity
                onPress={() => {
                  setShowAccountPicker((v) => !v);
                  setShowDatePicker(false);
                }}
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
                  {t.accountLabel} <Text style={{ color: colors.expense }}>*</Text>
                </Text>
                <Text style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}>
                  {selectedAccount?.name ?? t.selectAccountTitle}
                </Text>
                <ChevronRight color={colors.textFaint} size={16} />
              </TouchableOpacity>

              {/* Account picker */}
              {showAccountPicker && accounts.length > 0 && (
                <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  {accounts.map((acc, idx) => (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => {
                        setForm((f) => ({ ...f, account_id: acc.id }));
                        setShowAccountPicker(false);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderTopWidth: idx === 0 ? 0 : 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor:
                            form.account_id === acc.id ? colors.accent : 'transparent',
                          marginRight: 12,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: form.account_id === acc.id ? colors.accent : colors.textPrimary,
                          fontWeight: form.account_id === acc.id ? '600' : '400',
                        }}
                      >
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Date row */}
              <TouchableOpacity
                onPress={() => {
                  setShowDatePicker((v) => !v);
                  setShowAccountPicker(false);
                }}
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
                  {t.dateLabel} <Text style={{ color: colors.expense }}>*</Text>
                </Text>
                <Text style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}>
                  {formatDateHeader(form.date)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity
                    hitSlop={10}
                    onPress={(e) => {
                      e.stopPropagation();
                      const d = new Date(form.date + 'T00:00:00');
                      d.setDate(d.getDate() - 1);
                      setForm((f) => ({ ...f, date: formatDateISO(d) }));
                    }}
                  >
                    <ChevronLeft color={colors.textMuted} size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    hitSlop={10}
                    onPress={(e) => {
                      e.stopPropagation();
                      const d = new Date(form.date + 'T00:00:00');
                      d.setDate(d.getDate() + 1);
                      const next = formatDateISO(d);
                      if (next <= todayISO()) setForm((f) => ({ ...f, date: next }));
                    }}
                  >
                    <ChevronRight color={colors.textMuted} size={18} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Inline date picker */}
              {showDatePicker && (
                <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <DateTimePicker
                    value={new Date(form.date + 'T00:00:00')}
                    mode="date"
                    display="inline"
                    maximumDate={new Date()}
                    accentColor={colors.accent}
                    style={{ backgroundColor: colors.bg }}
                    onValueChange={(_, date) => {
                      setForm((f) => ({ ...f, date: formatDateISO(date) }));
                    }}
                  />
                </View>
              )}

              {/* Note row — mandatory */}
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
                  {t.noteLabel} <Text style={{ color: colors.expense }}>*</Text>
                </Text>
                <TextInput
                  value={form.note}
                  onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
                  placeholder={t.notePlaceholder}
                  placeholderTextColor={colors.textFaint}
                  returnKeyType="next"
                  style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}
                />
              </View>

              {/* Description row — optional */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <Text style={{ width: 88, fontSize: 14, color: colors.textMuted }}>
                  {t.descriptionLabel}
                </Text>
                <TextInput
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  placeholder={t.optionalDetails}
                  placeholderTextColor={colors.textFaint}
                  returnKeyType="done"
                  style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}
                />
              </View>
            </View>

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 32 }}>
              {isEditing && (
                <>
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: colors.bg,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: colors.border,
                    }}
                  >
                    <Trash2 color={colors.expense} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onDuplicate?.(transaction!)}
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: colors.bg,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: colors.border,
                    }}
                  >
                    <Copy color={colors.accent} size={20} />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                style={{
                  flex: 1,
                  height: 56,
                  backgroundColor: colors.accent,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                  {isSaving ? t.saving : isEditing ? t.saveChanges : t.addTransaction}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
