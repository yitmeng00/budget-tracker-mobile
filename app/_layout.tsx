import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getDb } from '@/db/client';
import { processRecurringTransactions } from '@/services/recurring';
import { ThemeProvider } from '@/context/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000 },
  },
});

export default function RootLayout() {
  useEffect(() => {
    getDb();
    try {
      const created = processRecurringTransactions();
      if (created > 0) queryClient.invalidateQueries();
    } catch {
      // Background processing failure — don't crash the app
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
