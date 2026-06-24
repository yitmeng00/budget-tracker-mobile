export type Strings = {
  // Tabs
  tabTransactions: string;
  tabStats: string;
  tabAccounts: string;
  tabSettings: string;

  // Common
  save: string;
  cancel: string;
  delete: string;
  done: string;
  remove: string;
  filter: string;
  all: string;
  paused: string;
  error: string;
  other: string;

  // Transaction types
  income: string;
  expense: string;
  expenses: string;
  net: string;

  // Month & day names (for pickers and headers)
  monthNames: string[];
  monthShort: string[];

  // Settings sections
  sectionGeneral: string;
  sectionLanguage: string;
  sectionAppearance: string;
  sectionCurrency: string;
  sectionCategories: string;
  sectionBudgets: string;
  sectionData: string;
  sectionAbout: string;

  // General
  weekStartsOn: string;
  sunday: string;
  monday: string;
  saturday: string;

  // Appearance
  theme: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;

  // Currency
  currency: string;
  symbolPosition: string;
  symbolPrefix: string;
  symbolSuffix: string;

  // Language
  language: string;
  langEnglish: string;
  langMalay: string;
  langSimplifiedChinese: string;
  langTraditionalChinese: string;

  // Categories
  expenseSection: string;
  incomeSection: string;
  noExpenseCategories: string;
  noIncomeCategories: string;
  newExpenseCategory: string;
  newIncomeCategory: string;
  editExpenseCategory: string;
  editIncomeCategory: string;

  // Account groups
  accountGroups: string;
  noAccountGroups: string;
  newGroup: string;
  editGroup: string;

  // Accounts
  accounts: string;
  newAccount: string;
  editAccount: string;
  name: string;
  group: string;
  initialBalance: string;

  // Budget
  notSet: string;
  spent: string;
  thisMonthOverride: string;
  budgetAmount: string;
  applyTo: string;
  onwards: string;
  thisMonthOnly: string;
  // Templates: replace {month} and/or {year}
  appliesFromOnwards: string;
  onlyAffectsMonth: string;
  removeOverrideTitle: string;
  removeBudgetTitle: string;
  removeOverrideMsg: string;
  removeBudgetMsg: string;
  // For "N categories over budget" — prepend count
  categoryOverBudget: string;
  categoriesOverBudget: string;

  // Recurring
  recurringTransactions: string;
  noRecurringRules: string;
  freqDaily: string;
  freqWeekly: string;
  freqBiweekly: string;
  freqMonthly: string;
  freqEndOfMonth: string;
  freqBimonthly: string;
  freqAnnually: string;

  // Data
  exportCSV: string;
  importCSV: string;
  importCSVDesc: string;

  // About
  version: string;

  // Stats
  lastSixMonths: string;
  monthlyTrend: string;
  expensesByCategory: string;
  incomeByCategory: string;
  budget: string;
  month: string;
  year: string;

  // Accounts screen
  netWorth: string;
  // Templates: replace {n}
  acrossAccountSingular: string;
  acrossAccountPlural: string;

  // Transactions
  noTransactionsThisMonth: string;

  // Add/Edit Transaction
  addTransaction: string;
  editTransaction: string;
  categoryLabel: string;
  accountLabel: string;
  dateLabel: string;
  noteLabel: string;
  notePlaceholder: string;
  descriptionLabel: string;
  optionalDetails: string;
  saveChanges: string;
  saving: string;

  // Alerts
  invalidAmountTitle: string;
  invalidAmountMsg: string;
  selectCategoryTitle: string;
  selectCategoryMsg: string;
  selectAccountTitle: string;
  selectAccountMsg: string;
  noteRequiredTitle: string;
  noteRequiredMsg: string;
  deleteTransactionTitle: string;
  deleteTransactionMsg: string;
  savingError: string;
  deletingError: string;
  deleteCategoryTitle: string;
  deleteGroupTitle: string;
  deleteAccountTitle: string;
  confirmDeleteMsg: string; // template: replace {name}

  // Reassign modal
  reassignTitle: string;
  reassignDesc: string; // template: replace {name} and {n}
  noOtherExpenseCategories: string;
  noOtherIncomeCategories: string;

  // Month picker shortcut
  thisMonth: string;

  // Filter
  filterTitle: string;
  filterClear: string;
  filterType: string;
  filterCategory: string;
};

const en: Strings = {
  tabTransactions: 'Transactions',
  tabStats: 'Stats',
  tabAccounts: 'Accounts',
  tabSettings: 'Settings',

  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  done: 'Done',
  remove: 'Remove',
  filter: 'Filter',
  all: 'All',
  paused: 'Paused',
  error: 'Error',
  other: 'Other',

  income: 'Income',
  expense: 'Expense',
  expenses: 'Expenses',
  net: 'Net',

  monthNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

  sectionGeneral: 'General',
  sectionLanguage: 'Language',
  sectionAppearance: 'Appearance',
  sectionCurrency: 'Currency',
  sectionCategories: 'Categories',
  sectionBudgets: 'Budgets',
  sectionData: 'Data',
  sectionAbout: 'About',

  weekStartsOn: 'Week starts on',
  sunday: 'Sunday',
  monday: 'Monday',
  saturday: 'Saturday',

  theme: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeSystem: 'System',

  currency: 'Currency',
  symbolPosition: 'Symbol position',
  symbolPrefix: 'Prefix (RM 10)',
  symbolSuffix: 'Suffix (10 RM)',

  language: 'Language',
  langEnglish: 'English',
  langMalay: 'Malay',
  langSimplifiedChinese: 'Simplified Chinese',
  langTraditionalChinese: 'Traditional Chinese',

  expenseSection: 'Expense',
  incomeSection: 'Income',
  noExpenseCategories: 'No expense categories',
  noIncomeCategories: 'No income categories',
  newExpenseCategory: 'New Expense Category',
  newIncomeCategory: 'New Income Category',
  editExpenseCategory: 'Edit Expense Category',
  editIncomeCategory: 'Edit Income Category',

  accountGroups: 'Account Groups',
  noAccountGroups: 'No account groups',
  newGroup: 'New Group',
  editGroup: 'Edit Group',

  accounts: 'Accounts',
  newAccount: 'New Account',
  editAccount: 'Edit Account',
  name: 'Name',
  group: 'Group',
  initialBalance: 'Initial Balance',

  notSet: 'Not set',
  spent: 'spent',
  thisMonthOverride: 'This month only',
  budgetAmount: 'Budget Amount',
  applyTo: 'Apply to',
  onwards: 'onwards',
  thisMonthOnly: 'This month only',
  appliesFromOnwards: 'Applies from {month} onwards. Earlier months are unaffected.',
  onlyAffectsMonth: 'Only affects {month} {year}. Other months keep their budget.',
  removeOverrideTitle: 'Remove Override',
  removeBudgetTitle: 'Remove Budget',
  removeOverrideMsg:
    'Remove the override for {month} {year}? It will revert to the default budget.',
  removeBudgetMsg:
    'Remove the budget for "{name}"? All months without a monthly override will no longer have a budget.',
  categoryOverBudget: '1 category over budget',
  categoriesOverBudget: '{n} categories over budget',

  recurringTransactions: 'Recurring Transactions',
  noRecurringRules: 'No recurring rules',
  freqDaily: 'Daily',
  freqWeekly: 'Weekly',
  freqBiweekly: 'Every 2 weeks',
  freqMonthly: 'Monthly',
  freqEndOfMonth: 'End of month',
  freqBimonthly: 'Every 2 months',
  freqAnnually: 'Annually',

  exportCSV: 'Export CSV',
  importCSV: 'Import CSV',
  importCSVDesc: 'Date, Type, Category, Account, Amount, Note',

  version: 'Version',

  lastSixMonths: 'Last 6 Months',
  monthlyTrend: 'Monthly Trend',
  expensesByCategory: 'Expenses by Category',
  incomeByCategory: 'Income by Category',
  budget: 'Budget',
  month: 'Month',
  year: 'Year',

  netWorth: 'Net Worth',
  acrossAccountSingular: 'Across {n} account',
  acrossAccountPlural: 'Across {n} accounts',

  noTransactionsThisMonth: 'No transactions this month',

  addTransaction: 'Add Transaction',
  editTransaction: 'Edit Transaction',
  categoryLabel: 'Category',
  accountLabel: 'Account',
  dateLabel: 'Date',
  noteLabel: 'Note',
  notePlaceholder: 'e.g. Lunch, Coffee...',
  descriptionLabel: 'Description',
  optionalDetails: 'Optional details...',
  saveChanges: 'Save Changes',
  saving: 'Saving...',

  invalidAmountTitle: 'Invalid amount',
  invalidAmountMsg: 'Please enter a valid amount.',
  selectCategoryTitle: 'Select category',
  selectCategoryMsg: 'Please select a category.',
  selectAccountTitle: 'Select account',
  selectAccountMsg: 'Please select an account.',
  noteRequiredTitle: 'Note required',
  noteRequiredMsg: 'Please add a note for this transaction.',
  deleteTransactionTitle: 'Delete transaction',
  deleteTransactionMsg: 'Are you sure you want to delete this transaction?',
  savingError: "Couldn't save this transaction. Please try again.",
  deletingError: "Couldn't delete this transaction. Please try again.",
  deleteCategoryTitle: 'Delete category',
  deleteGroupTitle: 'Delete group',
  deleteAccountTitle: 'Delete account',
  confirmDeleteMsg: 'Delete "{name}"?',

  reassignTitle: 'Reassign Transactions',
  reassignDesc:
    '"{name}" has {n} transaction(s). Choose a category to move them to before deleting.',
  noOtherExpenseCategories: 'No other expense categories available.',
  noOtherIncomeCategories: 'No other income categories available.',

  thisMonth: 'This Month',

  filterTitle: 'Filter',
  filterClear: 'Clear',
  filterType: 'Type',
  filterCategory: 'Category',
};

const ms: Strings = {
  tabTransactions: 'Transaksi',
  tabStats: 'Statistik',
  tabAccounts: 'Akaun',
  tabSettings: 'Tetapan',

  save: 'Simpan',
  cancel: 'Batal',
  delete: 'Padam',
  done: 'Selesai',
  remove: 'Buang',
  filter: 'Tapis',
  all: 'Semua',
  paused: 'Dijeda',
  error: 'Ralat',
  other: 'Lain-lain',

  income: 'Pendapatan',
  expense: 'Perbelanjaan',
  expenses: 'Perbelanjaan',
  net: 'Bersih',

  monthNames: [
    'Januari',
    'Februari',
    'Mac',
    'April',
    'Mei',
    'Jun',
    'Julai',
    'Ogos',
    'September',
    'Oktober',
    'November',
    'Disember',
  ],
  monthShort: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogs', 'Sep', 'Okt', 'Nov', 'Dis'],

  sectionGeneral: 'Umum',
  sectionLanguage: 'Bahasa',
  sectionAppearance: 'Penampilan',
  sectionCurrency: 'Mata Wang',
  sectionCategories: 'Kategori',
  sectionBudgets: 'Bajet',
  sectionData: 'Data',
  sectionAbout: 'Perihal',

  weekStartsOn: 'Minggu bermula pada',
  sunday: 'Ahad',
  monday: 'Isnin',
  saturday: 'Sabtu',

  theme: 'Tema',
  themeLight: 'Cerah',
  themeDark: 'Gelap',
  themeSystem: 'Sistem',

  currency: 'Mata Wang',
  symbolPosition: 'Kedudukan simbol',
  symbolPrefix: 'Awalan (RM 10)',
  symbolSuffix: 'Akhiran (10 RM)',

  language: 'Bahasa',
  langEnglish: 'Bahasa Inggeris',
  langMalay: 'Bahasa Melayu',
  langSimplifiedChinese: 'Cina Mudah',
  langTraditionalChinese: 'Cina Tradisional',

  expenseSection: 'Perbelanjaan',
  incomeSection: 'Pendapatan',
  noExpenseCategories: 'Tiada kategori perbelanjaan',
  noIncomeCategories: 'Tiada kategori pendapatan',
  newExpenseCategory: 'Kategori Perbelanjaan Baru',
  newIncomeCategory: 'Kategori Pendapatan Baru',
  editExpenseCategory: 'Edit Kategori Perbelanjaan',
  editIncomeCategory: 'Edit Kategori Pendapatan',

  accountGroups: 'Kumpulan Akaun',
  noAccountGroups: 'Tiada kumpulan akaun',
  newGroup: 'Kumpulan Baru',
  editGroup: 'Edit Kumpulan',

  accounts: 'Akaun',
  newAccount: 'Akaun Baru',
  editAccount: 'Edit Akaun',
  name: 'Nama',
  group: 'Kumpulan',
  initialBalance: 'Baki Awal',

  notSet: 'Tidak ditetapkan',
  spent: 'dibelanjakan',
  thisMonthOverride: 'Bulan ini sahaja',
  budgetAmount: 'Jumlah Bajet',
  applyTo: 'Pakai pada',
  onwards: 'dan seterusnya',
  thisMonthOnly: 'Bulan ini sahaja',
  appliesFromOnwards: 'Bermula dari {month}. Bulan-bulan sebelumnya tidak terjejas.',
  onlyAffectsMonth: 'Hanya mempengaruhi {month} {year}. Bulan lain kekal dengan bajet mereka.',
  removeOverrideTitle: 'Buang Override',
  removeBudgetTitle: 'Buang Bajet',
  removeOverrideMsg: 'Buang override untuk {month} {year}? Ia akan kembali ke bajet lalai.',
  removeBudgetMsg:
    'Buang bajet untuk "{name}"? Semua bulan tanpa override bulanan tidak akan lagi mempunyai bajet.',
  categoryOverBudget: '1 kategori melebihi bajet',
  categoriesOverBudget: '{n} kategori melebihi bajet',

  recurringTransactions: 'Transaksi Berulang',
  noRecurringRules: 'Tiada peraturan berulang',
  freqDaily: 'Harian',
  freqWeekly: 'Mingguan',
  freqBiweekly: 'Setiap 2 minggu',
  freqMonthly: 'Bulanan',
  freqEndOfMonth: 'Akhir bulan',
  freqBimonthly: 'Setiap 2 bulan',
  freqAnnually: 'Tahunan',

  exportCSV: 'Eksport CSV',
  importCSV: 'Import CSV',
  importCSVDesc: 'Tarikh, Jenis, Kategori, Akaun, Jumlah, Nota',

  version: 'Versi',

  lastSixMonths: '6 Bulan Lepas',
  monthlyTrend: 'Trend Bulanan',
  expensesByCategory: 'Perbelanjaan Mengikut Kategori',
  incomeByCategory: 'Pendapatan Mengikut Kategori',
  budget: 'Bajet',
  month: 'Bulan',
  year: 'Tahun',

  netWorth: 'Kekayaan Bersih',
  acrossAccountSingular: 'Sebanyak {n} akaun',
  acrossAccountPlural: 'Sebanyak {n} akaun',

  noTransactionsThisMonth: 'Tiada transaksi bulan ini',

  addTransaction: 'Tambah Transaksi',
  editTransaction: 'Edit Transaksi',
  categoryLabel: 'Kategori',
  accountLabel: 'Akaun',
  dateLabel: 'Tarikh',
  noteLabel: 'Nota',
  notePlaceholder: 'cth. Makan tengahari...',
  descriptionLabel: 'Penerangan',
  optionalDetails: 'Butiran pilihan...',
  saveChanges: 'Simpan Perubahan',
  saving: 'Menyimpan...',

  invalidAmountTitle: 'Jumlah tidak sah',
  invalidAmountMsg: 'Sila masukkan jumlah yang sah.',
  selectCategoryTitle: 'Pilih kategori',
  selectCategoryMsg: 'Sila pilih kategori.',
  selectAccountTitle: 'Pilih akaun',
  selectAccountMsg: 'Sila pilih akaun.',
  noteRequiredTitle: 'Nota diperlukan',
  noteRequiredMsg: 'Sila tambah nota untuk transaksi ini.',
  deleteTransactionTitle: 'Padam transaksi',
  deleteTransactionMsg: 'Adakah anda pasti mahu memadam transaksi ini?',
  savingError: 'Tidak dapat menyimpan transaksi ini. Sila cuba lagi.',
  deletingError: 'Tidak dapat memadam transaksi ini. Sila cuba lagi.',
  deleteCategoryTitle: 'Padam kategori',
  deleteGroupTitle: 'Padam kumpulan',
  deleteAccountTitle: 'Padam akaun',
  confirmDeleteMsg: 'Padam "{name}"?',

  reassignTitle: 'Pindahkan Transaksi',
  reassignDesc:
    '"{name}" mempunyai {n} transaksi. Pilih kategori untuk dipindahkan sebelum dipadam.',
  noOtherExpenseCategories: 'Tiada kategori perbelanjaan lain.',
  noOtherIncomeCategories: 'Tiada kategori pendapatan lain.',

  thisMonth: 'Bulan Ini',

  filterTitle: 'Tapis',
  filterClear: 'Kosongkan',
  filterType: 'Jenis',
  filterCategory: 'Kategori',
};

const zhHans: Strings = {
  tabTransactions: '交易记录',
  tabStats: '统计',
  tabAccounts: '账户',
  tabSettings: '设置',

  save: '保存',
  cancel: '取消',
  delete: '删除',
  done: '完成',
  remove: '移除',
  filter: '筛选',
  all: '全部',
  paused: '已暂停',
  error: '错误',
  other: '其他',

  income: '收入',
  expense: '支出',
  expenses: '支出',
  net: '净额',

  monthNames: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ],
  monthShort: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ],

  sectionGeneral: '通用',
  sectionLanguage: '语言',
  sectionAppearance: '外观',
  sectionCurrency: '货币',
  sectionCategories: '分类',
  sectionBudgets: '预算',
  sectionData: '数据',
  sectionAbout: '关于',

  weekStartsOn: '每周从',
  sunday: '周日',
  monday: '周一',
  saturday: '周六',

  theme: '主题',
  themeLight: '浅色',
  themeDark: '深色',
  themeSystem: '跟随系统',

  currency: '货币',
  symbolPosition: '符号位置',
  symbolPrefix: '前缀 (RM 10)',
  symbolSuffix: '后缀 (10 RM)',

  language: '语言',
  langEnglish: '英语',
  langMalay: '马来语',
  langSimplifiedChinese: '简体中文',
  langTraditionalChinese: '繁体中文',

  expenseSection: '支出',
  incomeSection: '收入',
  noExpenseCategories: '暂无支出分类',
  noIncomeCategories: '暂无收入分类',
  newExpenseCategory: '新建支出分类',
  newIncomeCategory: '新建收入分类',
  editExpenseCategory: '编辑支出分类',
  editIncomeCategory: '编辑收入分类',

  accountGroups: '账户组',
  noAccountGroups: '暂无账户组',
  newGroup: '新建分组',
  editGroup: '编辑分组',

  accounts: '账户',
  newAccount: '新建账户',
  editAccount: '编辑账户',
  name: '名称',
  group: '分组',
  initialBalance: '初始余额',

  notSet: '未设置',
  spent: '已花费',
  thisMonthOverride: '仅本月',
  budgetAmount: '预算金额',
  applyTo: '适用于',
  onwards: '起',
  thisMonthOnly: '仅本月',
  appliesFromOnwards: '从 {month} 起适用。之前的月份不受影响。',
  onlyAffectsMonth: '仅影响 {month} {year}。其他月份的预算不变。',
  removeOverrideTitle: '移除覆盖',
  removeBudgetTitle: '移除预算',
  removeOverrideMsg: '移除 {month} {year} 的覆盖设置？将恢复为默认预算。',
  removeBudgetMsg: '移除"{name}"的预算？所有没有月度覆盖的月份将不再有预算。',
  categoryOverBudget: '1个分类超支',
  categoriesOverBudget: '{n}个分类超支',

  recurringTransactions: '定期交易',
  noRecurringRules: '暂无定期规则',
  freqDaily: '每天',
  freqWeekly: '每周',
  freqBiweekly: '每两周',
  freqMonthly: '每月',
  freqEndOfMonth: '月末',
  freqBimonthly: '每两月',
  freqAnnually: '每年',

  exportCSV: '导出 CSV',
  importCSV: '导入 CSV',
  importCSVDesc: '日期、类型、分类、账户、金额、备注',

  version: '版本',

  lastSixMonths: '近6个月',
  monthlyTrend: '月度趋势',
  expensesByCategory: '按分类支出',
  incomeByCategory: '按分类收入',
  budget: '预算',
  month: '月',
  year: '年',

  netWorth: '净资产',
  acrossAccountSingular: '共 {n} 个账户',
  acrossAccountPlural: '共 {n} 个账户',

  noTransactionsThisMonth: '本月暂无交易',

  addTransaction: '新增交易',
  editTransaction: '编辑交易',
  categoryLabel: '分类',
  accountLabel: '账户',
  dateLabel: '日期',
  noteLabel: '备注',
  notePlaceholder: '如：午餐、咖啡...',
  descriptionLabel: '描述',
  optionalDetails: '可选备注...',
  saveChanges: '保存更改',
  saving: '保存中...',

  invalidAmountTitle: '金额无效',
  invalidAmountMsg: '请输入有效金额。',
  selectCategoryTitle: '选择分类',
  selectCategoryMsg: '请选择一个分类。',
  selectAccountTitle: '选择账户',
  selectAccountMsg: '请选择一个账户。',
  noteRequiredTitle: '备注必填',
  noteRequiredMsg: '请为此交易添加备注。',
  deleteTransactionTitle: '删除交易',
  deleteTransactionMsg: '确定要删除此交易吗？',
  savingError: '无法保存此交易，请重试。',
  deletingError: '无法删除此交易，请重试。',
  deleteCategoryTitle: '删除分类',
  deleteGroupTitle: '删除分组',
  deleteAccountTitle: '删除账户',
  confirmDeleteMsg: '删除"{name}"？',

  reassignTitle: '重新分配交易',
  reassignDesc: '"{name}" 有 {n} 笔交易，请选择一个分类来转移后再删除。',
  noOtherExpenseCategories: '暂无其他支出分类。',
  noOtherIncomeCategories: '暂无其他收入分类。',

  thisMonth: '本月',

  filterTitle: '筛选',
  filterClear: '清除',
  filterType: '类型',
  filterCategory: '分类',
};

const zhHant: Strings = {
  tabTransactions: '交易記錄',
  tabStats: '統計',
  tabAccounts: '帳戶',
  tabSettings: '設定',

  save: '儲存',
  cancel: '取消',
  delete: '刪除',
  done: '完成',
  remove: '移除',
  filter: '篩選',
  all: '全部',
  paused: '已暫停',
  error: '錯誤',
  other: '其他',

  income: '收入',
  expense: '支出',
  expenses: '支出',
  net: '淨額',

  monthNames: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ],
  monthShort: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ],

  sectionGeneral: '通用',
  sectionLanguage: '語言',
  sectionAppearance: '外觀',
  sectionCurrency: '貨幣',
  sectionCategories: '分類',
  sectionBudgets: '預算',
  sectionData: '資料',
  sectionAbout: '關於',

  weekStartsOn: '每週從',
  sunday: '週日',
  monday: '週一',
  saturday: '週六',

  theme: '主題',
  themeLight: '淺色',
  themeDark: '深色',
  themeSystem: '跟隨系統',

  currency: '貨幣',
  symbolPosition: '符號位置',
  symbolPrefix: '前置 (RM 10)',
  symbolSuffix: '後置 (10 RM)',

  language: '語言',
  langEnglish: '英語',
  langMalay: '馬來語',
  langSimplifiedChinese: '簡體中文',
  langTraditionalChinese: '繁體中文',

  expenseSection: '支出',
  incomeSection: '收入',
  noExpenseCategories: '暫無支出分類',
  noIncomeCategories: '暫無收入分類',
  newExpenseCategory: '新增支出分類',
  newIncomeCategory: '新增收入分類',
  editExpenseCategory: '編輯支出分類',
  editIncomeCategory: '編輯收入分類',

  accountGroups: '帳戶群組',
  noAccountGroups: '暫無帳戶群組',
  newGroup: '新增分組',
  editGroup: '編輯分組',

  accounts: '帳戶',
  newAccount: '新增帳戶',
  editAccount: '編輯帳戶',
  name: '名稱',
  group: '分組',
  initialBalance: '初始餘額',

  notSet: '未設定',
  spent: '已花費',
  thisMonthOverride: '僅本月',
  budgetAmount: '預算金額',
  applyTo: '適用於',
  onwards: '起',
  thisMonthOnly: '僅本月',
  appliesFromOnwards: '從 {month} 起適用。之前的月份不受影響。',
  onlyAffectsMonth: '僅影響 {month} {year}。其他月份的預算不變。',
  removeOverrideTitle: '移除覆蓋',
  removeBudgetTitle: '移除預算',
  removeOverrideMsg: '移除 {month} {year} 的覆蓋設定？將恢復為預設預算。',
  removeBudgetMsg: '移除「{name}」的預算？所有沒有月度覆蓋的月份將不再有預算。',
  categoryOverBudget: '1個分類超支',
  categoriesOverBudget: '{n}個分類超支',

  recurringTransactions: '定期交易',
  noRecurringRules: '暫無定期規則',
  freqDaily: '每天',
  freqWeekly: '每週',
  freqBiweekly: '每兩週',
  freqMonthly: '每月',
  freqEndOfMonth: '月末',
  freqBimonthly: '每兩月',
  freqAnnually: '每年',

  exportCSV: '匯出 CSV',
  importCSV: '匯入 CSV',
  importCSVDesc: '日期、類型、分類、帳戶、金額、備註',

  version: '版本',

  lastSixMonths: '近6個月',
  monthlyTrend: '月度趨勢',
  expensesByCategory: '按分類支出',
  incomeByCategory: '按分類收入',
  budget: '預算',
  month: '月',
  year: '年',

  netWorth: '淨資產',
  acrossAccountSingular: '共 {n} 個帳戶',
  acrossAccountPlural: '共 {n} 個帳戶',

  noTransactionsThisMonth: '本月暫無交易',

  addTransaction: '新增交易',
  editTransaction: '編輯交易',
  categoryLabel: '分類',
  accountLabel: '帳戶',
  dateLabel: '日期',
  noteLabel: '備註',
  notePlaceholder: '如：午餐、咖啡...',
  descriptionLabel: '描述',
  optionalDetails: '可選備註...',
  saveChanges: '儲存更改',
  saving: '儲存中...',

  invalidAmountTitle: '金額無效',
  invalidAmountMsg: '請輸入有效金額。',
  selectCategoryTitle: '選擇分類',
  selectCategoryMsg: '請選擇一個分類。',
  selectAccountTitle: '選擇帳戶',
  selectAccountMsg: '請選擇一個帳戶。',
  noteRequiredTitle: '備註必填',
  noteRequiredMsg: '請為此交易添加備註。',
  deleteTransactionTitle: '刪除交易',
  deleteTransactionMsg: '確定要刪除此交易嗎？',
  savingError: '無法儲存此交易，請重試。',
  deletingError: '無法刪除此交易，請重試。',
  deleteCategoryTitle: '刪除分類',
  deleteGroupTitle: '刪除分組',
  deleteAccountTitle: '刪除帳戶',
  confirmDeleteMsg: '刪除「{name}」？',

  reassignTitle: '重新分配交易',
  reassignDesc: '「{name}」有 {n} 筆交易，請選擇一個分類來轉移後再刪除。',
  noOtherExpenseCategories: '暫無其他支出分類。',
  noOtherIncomeCategories: '暫無其他收入分類。',

  thisMonth: '本月',

  filterTitle: '篩選',
  filterClear: '清除',
  filterType: '類型',
  filterCategory: '分類',
};

export const translations: Record<string, Strings> = {
  en,
  ms,
  'zh-hans': zhHans,
  'zh-hant': zhHant,
};
