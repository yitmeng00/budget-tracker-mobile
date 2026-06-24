import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccounts, useAccountGroups, useNetWorth } from '@/hooks/useAccounts';
import { useSettings } from '@/hooks/useSettings';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { useColors } from '@/context/ThemeContext';
import { useStrings } from '@/context/LanguageContext';
import { formatCurrency } from '@/lib/currency';
import type { Account, AccountGroup, UserSettings } from '@/types';

export default function AccountsScreen() {
  const colors = useColors();
  const t = useStrings();
  const { data: groups = [] } = useAccountGroups();
  const { data: accounts = [] } = useAccounts();
  const { data: netWorth = 0 } = useNetWorth();
  const { data: settings = DEFAULT_SETTINGS } = useSettings();
  const ungrouped = accounts.filter((a) => a.group_id === null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <NetWorthCard netWorth={netWorth} accountCount={accounts.length} settings={settings} />

        {groups.map((group) => {
          const groupAccounts = accounts.filter((a) => a.group_id === group.id);
          if (groupAccounts.length === 0) return null;
          return (
            <GroupSection
              key={group.id}
              group={group}
              accounts={groupAccounts}
              settings={settings}
            />
          );
        })}

        {ungrouped.length > 0 && (
          <GroupSection
            group={{ id: 0, name: t.other, sort_order: 99 }}
            accounts={ungrouped}
            settings={settings}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NetWorthCard({
  netWorth,
  accountCount,
  settings,
}: {
  netWorth: number;
  accountCount: number;
  settings: UserSettings;
}) {
  const colors = useColors();
  const t = useStrings();
  return (
    <View
      style={{
        margin: 16,
        marginBottom: 8,
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 10,
        }}
      >
        {t.netWorth}
      </Text>
      <Text
        style={{
          fontSize: 34,
          fontWeight: '700',
          color: netWorth >= 0 ? colors.textPrimary : colors.expense,
          letterSpacing: -0.5,
          marginBottom: 8,
        }}
      >
        {netWorth < 0 ? '-' : ''}
        {formatCurrency(Math.abs(netWorth), settings)}
      </Text>
      <Text style={{ fontSize: 14, color: colors.textMuted }}>
        {(accountCount === 1 ? t.acrossAccountSingular : t.acrossAccountPlural).replace(
          '{n}',
          String(accountCount),
        )}
      </Text>
    </View>
  );
}

function GroupSection({
  group,
  accounts,
  settings,
}: {
  group: AccountGroup;
  accounts: Account[];
  settings: UserSettings;
}) {
  const colors = useColors();
  const groupTotal = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <View style={{ marginBottom: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          {group.name}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: groupTotal < 0 ? colors.expense : colors.textMuted,
          }}
        >
          {groupTotal < 0 ? '-' : ''}
          {formatCurrency(Math.abs(groupTotal), settings)}
        </Text>
      </View>

      <View
        style={{
          marginHorizontal: 16,
          backgroundColor: colors.surface,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {accounts.map((account, idx) => (
          <View key={account.id}>
            {idx > 0 && (
              <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 40 }} />
            )}
            <AccountRow account={account} settings={settings} />
          </View>
        ))}
      </View>
    </View>
  );
}

function AccountRow({ account, settings }: { account: Account; settings: UserSettings }) {
  const colors = useColors();
  const isNegative = account.balance < 0;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Text style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}>{account.name}</Text>
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: isNegative ? colors.expense : colors.textPrimary,
        }}
      >
        {isNegative ? '-' : ''}
        {formatCurrency(Math.abs(account.balance), settings)}
      </Text>
    </View>
  );
}
